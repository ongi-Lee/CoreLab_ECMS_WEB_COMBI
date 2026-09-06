/**
 * =========================================================================
 * THE CORE LAB - Engage (우리 집 AI 검증 탐험대)
 * 구글 스프레드시트 및 구글 드라이브 연동 Google Apps Script
 * =========================================================================
 * 
 * [★ 중요: 드라이브 사진 저장 권한 승인 및 배포 순서]
 * 1. 이 코드 전체를 복사하여 Apps Script 편집기에 붙여넣고 [저장 (Ctrl+S)]을 누릅니다.
 * 2. 상단 실행 함수 드롭다운에서 'testAuth'를 선택하고 [실행] 버튼을 클릭합니다.
 * 3. [권한 검토] 팝업이 뜨면:
 *    - 본인 구글 계정 선택 -> [고급] 클릭 -> [CoreLab(안전하지 않음)으로 이동] -> [허용]을 누릅니다.
 * 4. 아래 실행 로그에 "✅ 구글 드라이브 쓰기 권한 및 스프레드시트 권한이 완벽하게 승인되었습니다!"가 뜨는지 확인합니다.
 * 5. 오른쪽 상단 [배포] -> [배포 관리] 클릭
 *    - 연필(✏️ 수정) 아이콘 클릭 -> 버전: [새 버전] 선택
 *    - 다음 사용자로 실행: 나(내 계정)
 *    - 액세스 권한: 모든 사용자(Anyone)
 *    - [배포] 클릭!
 */

// 구글 드라이브 사진 저장 대상 폴더 ID
const FOLDER_ID = "1k9WviV6jJbZVSNjVzVEWigE9KMPGO4Gu";

/**
 * ★ [필수 실행] 구글 드라이브 쓰기(파일 생성) 및 스프레드시트 권한 승인 함수
 * 상단에서 'testAuth'를 선택하고 [실행]을 눌러 드라이브 쓰기 권한을 허용해 주세요!
 */
function testAuth() {
  SpreadsheetApp.getActiveSpreadsheet();
  const folder = DriveApp.getFolderById(FOLDER_ID);
  
  // 구글 드라이브 파일 쓰기(생성) 권한을 강제로 활성화하고 테스트
  const testBlob = Utilities.newBlob("Drive write permission test", "text/plain", "권한테스트_임시파일.txt");
  const testFile = folder.createFile(testBlob);
  testFile.setTrashed(true); // 테스트 생성 후 즉시 휴지통 이동
  
  Logger.log("✅ 대상 폴더 연결 확인: " + folder.getName());
  Logger.log("✅ 구글 드라이브 쓰기 권한 및 스프레드시트 권한이 완벽하게 승인되었습니다!");
}

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
      const firstSheet = ss.getSheets()[0];
      if (firstSheet && firstSheet.getLastRow() === 0) {
        firstSheet.setName("탐험대결과");
        sheet = firstSheet;
      } else {
        sheet = ss.insertSheet("탐험대결과");
      }
    }
    
    // 시트 헤더가 없으면 첫 행 자동 생성
    if (sheet.getLastRow() === 0) {
      const headers = [
        "제출 일시",
        "학교",
        "학년",
        "반",
        "번호",
        "학생 이름",
        "참여자 관계",
        "발견한 AI",
        "AI 설명",
        "검증 점수",
        "신호등 판정",
        "업로드 사진 드라이브 링크",
        "[검증 1] 사실 확인",
        "[검증 2] 편향 경계",
        "[검증 3] 개인정보 보호",
        "[검증 4] AI 인식",
        "[검증 5] 오류 대응"
      ];
      sheet.appendRow(headers);
      
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold")
                 .setBackground("#FF6357")
                 .setFontColor("#ffffff")
                 .setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
    
    // 학생 정보 문자열 정제 ([object Object] 및 단위 중복 방지)
    const school  = sanitizeValue(data.school || data.profile?.school, "학교");
    const rawGrade = sanitizeValue(data.grade || data.profile?.grade, "0");
    const gradeClean = rawGrade.replace("학년", "").trim() || rawGrade;
    
    const rawCls = sanitizeValue(data.classNo || data.cls || data.profile?.cls || data.profile?.classNo, "0");
    const classClean = rawCls.replace("반", "").trim() || rawCls;
    
    const rawNum = sanitizeValue(data.number || data.profile?.number, "0");
    const numberClean = rawNum.replace("번", "").trim() || rawNum;
    
    const name    = sanitizeValue(data.name || data.profile?.name, "학생");
    const relation = sanitizeValue(data.relation || data.profile?.relation, "본인");
    
    // 시간 문자열 생성 (예: 20260906_194000)
    const now = new Date();
    const timeStr = Utilities.formatDate(now, "Asia/Seoul", "yyyyMMdd_HHmmss");
    
    // 사진 파일 저장 처리 (파일명: 학교_학년_반_번호_이름_시간)
    let photoUrl = "";
    const photoData = data.photo || data.image;
    if (photoData) {
      try {
        const folder = DriveApp.getFolderById(FOLDER_ID);
        const fileName = `${school}_${gradeClean}학년_${classClean}반_${numberClean}번_${name}_${timeStr}.jpg`;
        photoUrl = saveImageToDrive(folder, photoData, fileName);
      } catch (driveErr) {
        photoUrl = "드라이브 저장 오류: " + driveErr.message;
        Logger.log("드라이브 오류: " + driveErr);
      }
    }
    
    // 신호등 판정 한국어 표시
    let verdictKo = data.verdict || "";
    if (verdictKo === "green") verdictKo = "🟢 초록불 (챔피언)";
    else if (verdictKo === "yellow") verdictKo = "🟡 노란불 (한 번 더 확인)";
    else if (verdictKo === "red") verdictKo = "🔴 빨간불 (주의 필요)";
    
    // 검증 답변 배열
    const answers = Array.isArray(data.checkAnswers) ? data.checkAnswers : [];
    
    // 스프레드시트 기록 추가
    const formattedDate = Utilities.formatDate(now, "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    sheet.appendRow([
      formattedDate,
      school,
      gradeClean + "학년",
      classClean + "반",
      numberClean + "번",
      name,
      relation,
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
    Logger.log("doPost Error: " + error);
    return ContentService.createTextOutput(JSON.stringify({
      result: "error",
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 안전한 문자열 변환 함수 ([object Object] 오류 방지)
 */
function sanitizeValue(val, defaultVal) {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === 'object') {
    return String(val.value || val.name || val.text || val.cls || defaultVal).trim();
  }
  return String(val).trim();
}

/**
 * Base64 이미지를 구글 드라이브에 파일로 저장하고 링크를 반환하는 함수
 */
function saveImageToDrive(folder, base64DataUrl, fileName) {
  if (!base64DataUrl || typeof base64DataUrl !== 'string') return "";
  
  // 이미 일반 웹 URL 형태인 경우 그대로 반환
  if (base64DataUrl.indexOf("http://") === 0 || base64DataUrl.indexOf("https://") === 0) {
    return base64DataUrl;
  }
  
  // 상대 경로이거나 길이가 짧은 문자열인 경우 원본 반환
  if (base64DataUrl.indexOf("data:") !== 0 && base64DataUrl.length < 100) {
    return base64DataUrl;
  }
  
  let base64String = base64DataUrl;
  let mimeType = "image/jpeg";
  
  if (base64DataUrl.indexOf("data:") === 0) {
    const parts = base64DataUrl.split(",");
    const meta = parts[0];
    base64String = parts[1] || "";
    const mimeMatch = meta.match(/data:([^;]+);base64/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
    }
  }
  
  try {
    const decoded = Utilities.base64Decode(base64String);
    const blob = Utilities.newBlob(decoded, mimeType, fileName);
    const file = folder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      Logger.log("공유 권한 설정 생략: " + shareErr.message);
    }
    return file.getUrl();
  } catch (err) {
    return "저장 실패 (" + err.message + ")";
  }
}
