# AI 그림 책방 API 오류 수정 및 적용

## 확인한 원인

2026-11-24 운영 API의 `generate-prompt`를 직접 호출해 아래 오류를 재현했습니다.

- Supabase 응답: HTTP 500
- 응답 안의 실제 Gemini 오류: HTTP 503 / `UNAVAILABLE` / 높은 수요
- 해당 함수의 기본 텍스트 모델: `gemini-3.1-flash-lite`
- 운영 페이지의 `script.js`와 저장소 파일 내용이 일치했습니다.

이 요청은 Gemini까지 도달했습니다. 이 오류만으로 API 키 재발급이나 결제 변경이 필요하다고 판단할 수 없습니다. 503은 공급자 혼잡에 해당하며, 키·권한·결제·할당량 오류와 구분해야 합니다.

## 수정 내용

- 서버: 429, 500, 502, 503, 504 응답에 한해 최대 3회 재시도합니다. 기본 대기 시간은 약 1초 → 2초 → 4초이며 무작위 시간을 더합니다.
- `Retry-After`를 존중합니다. 15초를 넘는 대기는 즉시 재호출하지 않고 사용자에게 나중에 재시도하도록 안내합니다.
- 텍스트 요청의 전체 시간은 45초, 이미지 요청은 90초로 제한합니다. 연결 끊김이나 시간 초과는 자동 재전송하지 않습니다.
- Gemini의 실제 오류 상태를 JSON의 `upstreamStatus`로 전달합니다. 원본 오류 본문·API 키·학생 프롬프트는 로그와 브라우저 응답에 넣지 않습니다.
- 브라우저: 기존 서버가 반환하는 `500 안의 Gemini 503`도 최대 2회 재시도합니다. 새 서버가 이미 재시도한 요청은 다시 반복하지 않습니다.
- 자동 재시도는 횟수 차감 RPC를 반복 호출하지 않습니다.
- 이미지 생성 실패를 샘플 그림으로 바꿔 ‘완성’으로 표시하던 동작을 오류 안내로 바꿉니다.
- 텍스트·이미지 모델 이름을 각각 Supabase Secrets에서 변경할 수 있습니다. 기본 모델 이름은 기존과 같습니다.
- HTML의 JS 버전을 갱신했습니다.

## 적용 순서

GitHub Pages 파일과 Supabase 서버 함수는 별도로 배포해야 합니다. GitHub 변경 병합만으로 Supabase 함수가 갱신되지는 않습니다.

1. 수정 PR을 `main`에 병합하고 저장소의 최신 코드를 받습니다.
2. Node.js가 설치된 PC의 터미널에서 저장소 폴더를 열고 아래 명령을 실행합니다. `npx`가 패키지 설치 여부를 물으면 진행합니다.

```sh
cd create_c
npx supabase login
npx supabase functions deploy generate-prompt --project-ref mjsuomcklkiessxfxzfi
npx supabase functions deploy generate-image --project-ref mjsuomcklkiessxfxzfi
```

공통 코드인 `supabase/functions/_shared/gemini.ts`가 함께 필요하므로 이 폴더 구조 전체를 유지합니다. `supabase/config.toml`은 현재 페이지의 공개 publishable 키 호출 방식을 유지합니다. 기존 Gemini 키는 그대로 Supabase Secrets에 두며, 채팅이나 GitHub에 붙여 넣지 않습니다.

3. GitHub Pages 배포 완료 후 페이지에서 `Ctrl+Shift+R`로 새로고침합니다.
4. 학교·학생 정보 입력 → 주인공·배경·행동 선택 → 마법 주문 → 첫 그림 → 한 요소 변경 → 두 번째 그림 순으로 확인합니다.

## 혼잡이 계속될 때 모델 변경

자동 재시도는 공급자의 지속적인 장애를 해결하지는 못합니다. [Google AI Studio](https://aistudio.google.com/)에서 같은 프로젝트·키로 사용할 수 있는 다른 텍스트 모델을 확인하고, 짧은 텍스트 생성이 성공하는지 먼저 시험합니다. 이후 [Supabase 프로젝트](https://supabase.com/dashboard/project/mjsuomcklkiessxfxzfi/functions)의 Secrets에서 아래 선택 값을 설정할 수 있습니다.

| Secret 이름 | 용도 | 미설정 시 기본값 |
| --- | --- | --- |
| `GEMINI_TEXT_MODEL` | 마법 주문 생성 | `gemini-3.1-flash-lite` |
| `GEMINI_IMAGE_MODEL` | 그림 생성 | `gemini-3.1-flash-lite-image` |
| `GEMINI_API_KEY` | 기존 텍스트 API 키 | 필수 |
| `GEMINI_IMAGE_API_KEY` | 기존 이미지 API 키 | 필수 |

텍스트 모델을 그림 생성용 모델로 설정하면 안 됩니다. 이 수정은 확인되지 않은 대체 모델로 자동 전환하지 않습니다.

## 확인 결과와 남은 범위

```sh
node --check create_c/script.js
node --test create_c/tests/api.test.mjs
```

위 명령은 저장소 루트에서 실행합니다. Node 24 이상을 사용합니다. 테스트는 네트워크·타이머를 모의 처리하므로 실제 생성 비용이나 학생 기록이 발생하지 않습니다. 재시도 성공·실패, 429, 키·권한 오류, 불완전한 응답, 브라우저와 서버의 중복 재시도 방지, 두 번째 그림 실패를 검증합니다.

기존 DB 정책은 버튼을 누를 때 시도 횟수를 먼저 차감합니다. 이 수정은 자동 재시도로 추가 차감되지 않게 하지만, 최종 실패한 시도의 횟수 반환이나 이미 소진된 학생 횟수 복구까지 구현하지는 않습니다. 반환 처리는 실제 DB 스키마·RPC를 확인한 후 별도로 수정해야 합니다.

운영 서버의 수정 후 실제 생성 성공 여부는 Supabase 배포 후 확인해야 합니다. 수정 전에는 오류 재현만 수행했습니다.

## 공식 문서

- [Gemini 재시도 지침](https://ai.google.dev/gemini-api/docs/troubleshooting#retry-strategy)
- [Supabase 함수 배포](https://supabase.com/docs/guides/functions/deploy)
