/**
 * =========================================================================
 * THE CORE LAB - Create (말랑말랑 AI 그림 책방)
 * 구글 스프레드시트 및 구글 드라이브 연동 Google Apps Script
 * =========================================================================
 * 
 * [배포 안내]
 * 1. 구글 스프레드시트 생성 (또는 기존 결과용 시트) -> 상단 메뉴 [확장 프로그램] -> [Apps Script] 클릭
 * 2. 편집기 기본 코드를 모두 지우고 이 파일 전체 코드를 붙여넣기
 * 3. 오른쪽 상단 [배포] -> [새 배포] 클릭
 * 4. 유형: [웹 앱] 선택
 *    - 설명: AI 그림 책방 저장
 *    - 다음 사용자로 실행: 나(내 계정)
 *    - 액세스 권한: 모든 사용자 (로그인 불필요) ★ 중요!
 * 5. [배포] 버튼 클릭 후 생성된 [웹 앱 URL]을 복사하여 script.js의 GOOGLE_SCRIPT_URL에 입력
 */

// 구글 드라이브 저장 대상 폴더 ID
const FOLDER_ID = "1EIHnGfQc0VGzK9ELBUH1ZM1hWDwX2BJM";

function doGet(e) {
  return ContentService.createTextOutput("🎨 말랑말랑 AI 그림 책방 Web App이 정상 동작 중입니다.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const rawData = e.postData.contents;
    const data = JSON.parse(rawData);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("그림책방결과");
    if (!sheet) {
      sheet = ss.insertSheet("그림책방결과");
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
        "[1번 그림] 주인공",
        "[1번 그림] 배경",
        "[1번 그림] 행동",
        "[1번 그림] 마법 주문 (한국어)",
        "[1번 그림] 드라이브 링크",
        "[2번 그림] 바꾼 항목",
        "[2번 그림] 바꾼 내용",
        "[2번 그림] 마법 주문 (한국어)",
        "[2번 그림] 드라이브 링크",
        "두 그림 차이점 기록"
      ];
      sheet.appendRow(headers);
      
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold")
                 .setBackground("#6366f1")
                 .setFontColor("#ffffff")
                 .setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
    
    // 대상 드라이브 폴더 취득
    const folder = DriveApp.getFolderById(FOLDER_ID);
    
    // 학생 정보 문자열 정제 ([object Object] 방지)
    const school  = sanitizeValue(data.school, "학교");
    const grade   = sanitizeValue(data.grade, "0");
    const classNo = sanitizeValue(data.classNo, "0");
    const number  = sanitizeValue(data.number, "0");
    const name    = sanitizeValue(data.name, "학생");
    
    // 시간 문자열 생성 (예: 20260905_193500)
    const now = new Date();
    const timeStr = Utilities.formatDate(now, "Asia/Seoul", "yyyyMMdd_HHmmss");
    
    // 1번 그림 파일 저장 처리
    let image1Url = "";
    if (data.image1) {
      const fileName1 = `AI그림_1번_${school}_${grade}학년_${classNo}반_${number}번_${name}_${timeStr}.png`;
      image1Url = saveImageToDrive(folder, data.image1, fileName1);
    }
    
    // 2번 그림 파일 저장 처리
    let image2Url = "";
    if (data.image2) {
      const fileName2 = `AI그림_2번_${school}_${grade}학년_${classNo}반_${number}번_${name}_${timeStr}.png`;
      image2Url = saveImageToDrive(folder, data.image2, fileName2);
    }
    
    // 바꾼 카테고리 한글 변환
    let changeCategoryKo = sanitizeValue(data.changeCategory, "");
    if (changeCategoryKo === "character") changeCategoryKo = "주인공";
    else if (changeCategoryKo === "background") changeCategoryKo = "배경";
    else if (changeCategoryKo === "action") changeCategoryKo = "행동";
    
    // 스프레드시트 기록 추가
    const formattedDate = Utilities.formatDate(now, "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    sheet.appendRow([
      formattedDate,
      school,
      grade,
      classNo,
      number,
      name,
      sanitizeValue(data.firstCharacter, ""),
      sanitizeValue(data.firstBackground, ""),
      sanitizeValue(data.firstAction, ""),
      sanitizeValue(data.firstPrompt, ""),
      image1Url,
      changeCategoryKo,
      sanitizeValue(data.changeValue, ""),
      sanitizeValue(data.secondPrompt, ""),
      image2Url,
      sanitizeValue(data.difference, "")
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      result: "success",
      image1Url: image1Url,
      image2Url: image2Url
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
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
  
  // 이미 일반 웹 URL 형태인 경우
  if (base64DataUrl.indexOf("http://") === 0 || base64DataUrl.indexOf("https://") === 0) {
    return base64DataUrl;
  }
  
  // 상대 경로이거나 길이가 짧은 문자열인 경우 원본 반환
  if (base64DataUrl.indexOf("data:") !== 0 && base64DataUrl.length < 100) {
    return base64DataUrl;
  }
  
  let base64String = base64DataUrl;
  let mimeType = "image/png";
  
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
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    return "저장 실패 (" + err.message + ")";
  }
}
