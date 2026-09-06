/**
 * =========================================================================
 * THE CORE LAB - Engage (우리 집 AI 검증 탐험대)
 * 구글 스프레드시트 및 구글 드라이브 연동 Google Apps Script
 * =========================================================================
 *
 * [배포 안내]
 * 1. 구글 스프레드시트 상단 메뉴 [확장 프로그램] -> [Apps Script] 클릭
 * 2. 기존 코드를 모두 지우고 이 코드 전체를 붙여넣기 후 [저장 (Ctrl+S)]
 * 3. 오른쪽 상단 [배포] -> [새 배포] 클릭
 * 4. 유형: [웹 앱] 선택
 *    - 다음 사용자로 실행: 나(내 계정)
 *    - 액세스 권한: 모든 사용자 (로그인 불필요) ★ 중요!
 * 5. [배포] 클릭 → 권한 요청 창이 뜨면 모두 [허용] (드라이브 포함)
 * 6. 생성된 [웹 앱 URL]을 적용
 */

// 구글 드라이브 사진 저장 대상 폴더 ID
const FOLDER_ID = "1k9WviV6jJbZVSNjVzVEWigE9KMPGO4Gu";

function doGet(e) {
  return ContentService.createTextOutput("🚦 우리 집 AI 검증 탐험대 Web App이 정상 동작 중입니다.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const rawData = e.postData.contents;
    const data = JSON.parse(rawData);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("탐험대결과");
    if (!sheet) {
      sheet = ss.insertSheet("탐험대결과");
    }

    // 시트 헤더가 없으면 첫 행 자동 생성
    if (sheet.getLastRow() === 0) {
      const headers = [
        "제출 일시", "학교", "학년", "반", "번호", "학생 이름",
        "참여자 관계", "발견한 AI", "AI 설명", "검증 점수", "신호등 판정",
        "업로드 사진 드라이브 링크",
        "[검증 1] 사실 확인", "[검증 2] 편향 경계", "[검증 3] 개인정보 보호",
        "[검증 4] AI 인식", "[검증 5] 오류 대응"
      ];
      sheet.appendRow(headers);
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold").setBackground("#FF6357")
                 .setFontColor("#ffffff").setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }

    // 대상 드라이브 폴더 취득 (Create와 동일)
    const folder = DriveApp.getFolderById(FOLDER_ID);

    // 학생 정보 정제
    const school    = sanitizeValue(data.school || data.profile?.school, "학교");
    const grade     = sanitizeValue(data.grade  || data.profile?.grade,  "0").replace("학년", "").trim();
    const classNo   = sanitizeValue(data.classNo || data.cls || data.profile?.cls || data.profile?.classNo, "0").replace("반", "").trim();
    const number    = sanitizeValue(data.number || data.profile?.number, "0").replace("번", "").trim();
    const name      = sanitizeValue(data.name   || data.profile?.name,   "학생");
    const relation  = sanitizeValue(data.relation || data.profile?.relation, "본인");

    // 시간 문자열 생성 (Create와 동일)
    const now = new Date();
    const timeStr = Utilities.formatDate(now, "Asia/Seoul", "yyyyMMdd_HHmmss");

    // 사진 파일 저장 (Create의 saveImageToDrive와 완전히 동일)
    let photoUrl = "";
    if (data.photo) {
      const fileName = `AI탐험_${school}_${grade}학년_${classNo}반_${number}번_${name}_${timeStr}.jpg`;
      photoUrl = saveImageToDrive(folder, data.photo, fileName);
    }

    // 신호등 판정 한국어 표시
    let verdictKo = data.verdict || "";
    if (verdictKo === "green")  verdictKo = "🟢 초록불 (챔피언)";
    else if (verdictKo === "yellow") verdictKo = "🟡 노란불 (한 번 더 확인)";
    else if (verdictKo === "red")    verdictKo = "🔴 빨간불 (주의 필요)";

    const answers = Array.isArray(data.checkAnswers) ? data.checkAnswers : [];

    // 스프레드시트 기록 추가 (Create와 동일한 구조)
    const formattedDate = Utilities.formatDate(now, "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    sheet.appendRow([
      formattedDate, school, grade + "학년", classNo + "반", number + "번",
      name, relation,
      sanitizeValue(data.card, ""),
      sanitizeValue(data.desc, ""),
      data.score != null ? data.score : "",
      verdictKo,
      photoUrl,
      sanitizeValue(answers[0], ""),
      sanitizeValue(answers[1], ""),
      sanitizeValue(answers[2], ""),
      sanitizeValue(answers[3], ""),
      sanitizeValue(answers[4], "")
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      result: "success",
      photoUrl: photoUrl
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: "error",
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Create와 완전히 동일한 문자열 정제 함수
function sanitizeValue(val, defaultVal) {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === 'object') {
    return String(val.value || val.name || val.text || val.cls || defaultVal).trim();
  }
  return String(val).trim();
}

// Create와 완전히 동일한 드라이브 저장 함수
function saveImageToDrive(folder, base64DataUrl, fileName) {
  if (!base64DataUrl || typeof base64DataUrl !== 'string') return "";

  if (base64DataUrl.indexOf("http://") === 0 || base64DataUrl.indexOf("https://") === 0) {
    return base64DataUrl;
  }

  if (base64DataUrl.indexOf("data:") !== 0 && base64DataUrl.length < 100) {
    return base64DataUrl;
  }

  let base64String = base64DataUrl;
  let mimeType = "image/jpeg";

  if (base64DataUrl.indexOf("data:") === 0) {
    const parts = base64DataUrl.split(",");
    const meta  = parts[0];
    base64String = parts[1] || "";
    const mimeMatch = meta.match(/data:([^;]+);base64/);
    if (mimeMatch) mimeType = mimeMatch[1];
  }

  try {
    const decoded = Utilities.base64Decode(base64String);
    const blob    = Utilities.newBlob(decoded, mimeType, fileName);
    const file    = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    return "저장 실패 (" + err.message + ")";
  }
}
