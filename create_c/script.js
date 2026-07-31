/* ===================================================
   말랑말랑 AI 그림 책방 - script.js
   =================================================== */

/* ──────────────────────────────────────────────────
   ★ 여기에 Supabase 정보를 입력하세요!
   Supabase 대시보드 → Settings → API 에서 확인 가능
   (이 값들은 공개해도 안전합니다)
   ────────────────────────────────────────────────── */
const SUPABASE_URL      = "https://mjsuomcklkiessxfxzfi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_snAda8Q9A1ox_Z5pVqiycA_zaV9ewIM";

// Fallback 이미지 경로 (GitHub에 업로드된 샘플 이미지)
const FALLBACK_IMG = "sample_img.png";

/* ────────────────────────────────────────────────────────
   다국어 (I18N) 번역 딕셔너리 정의
   ──────────────────────────────────────────────────────── */
const GRID_TRANS = {
  ko: {
    "코끼리": "코끼리", "호랑이": "호랑이", "토끼": "토끼", "참새": "참새",
    "우주": "우주", "숲 속": "숲 속", "바다": "바다", "해변": "해변",
    "춤을 추고": "춤추기", "폴짝폴짝 뛰고": "뛰기", "신나게 달리고": "달리기", "노래를 부르고": "노래하기"
  },
  en: {
    "코끼리": "Elephant", "호랑이": "Tiger", "토끼": "Rabbit", "참새": "Sparrow",
    "우주": "Space", "숲 속": "Forest", "바다": "Ocean", "해변": "Beach",
    "춤을 추고": "Dancing", "폴짝폴짝 뛰고": "Jumping", "신나게 달리고": "Running", "노래를 부르고": "Singing"
  }
};

const STATIC_I18N = {
  ko: {
    loginTitle: "🎨 말랑말랑 AI 그림 책방",
    loginSub: "재미있는 AI 그림 나라로 들어가기 위해<br>선생님이 주신 아이디와 비밀번호를 입력해요! ✨",
    labelLoginId: "아이디",
    loginIdPlaceholder: "아이디를 입력하세요 (예: TEST_01)",
    labelLoginPw: "비밀번호",
    loginPwPlaceholder: "비밀번호를 입력하세요",
    loginBtn: "🚪 책방 들어가기!",
    
    mainTitle: "🎨 말랑말랑 AI 그림 책방",
    mainSub: "주인공, 배경, 행동을 골라서 나만의 특별한 그림을 만들어봐요! ✨",
    
    step1Title: "주인공 고르기",
    step1Desc: "그림의 주인공을 골라주세요!",
    step2Title: "배경 고르기",
    step2Desc: "어디서 그림이 펼쳐질까요?",
    step3Title: "행동 고르기",
    step3Desc: "주인공이 무엇을 하고 있을까요?",
    
    labelPromptMagic: "📝 AI가 만든 마법 주문",
    labelReadonly: "🔒 학생 수정 불가",
    promptPlaceholder: "위에서 주인공, 배경, 행동을 모두 고르면 여기에 마법 주문이 나타나요! ✨",
    
    createPromptBtnNormal: "📝 마법 주문 만들기",
    createPromptBtnNeed: "📝 마법 주문 만들기 ({missing} 선택 필요)",
    createPromptBtnReady: "📝 마법 주문 만들기 ✨",
    createPromptBtnLoading: "⏳ 마법 주문을 만들고 있어요...",
    createPromptBtnSuccess: "✨ 마법 주문 완성! (다시 만들려면 클릭)",
    createPromptBtnRetry: "📝 마법 주문 만들기 (다시 시도)",
    createPromptBtnMax: "🚫 마법 주문 횟수를 모두 사용했어요!",
    
    labelRemainingCountText: "그림 그리기 남은 횟수: ",
    labelCountUnit: "회",
    remainingCountMax: "가능한 횟수가 모두 소진되었습니다.",
    
    generateBtnNormal: "🎨 AI에게 그림 그려달라고 하기",
    generateBtnLoading: "⏳ 그림을 그리고 있어요...",
    generateBtnReady: "🎨 AI에게 그림 그려달라고 하기!",
    generateBtnMax: "🚫 이미지 생성 횟수를 모두 사용했어요!",
    
    promptLoadingText: "마법 주문을 만들고 있어요...",
    imageLoadingText: "AI 화가가 열심히 그림을 그리고 있어요... 🎨",
    
    labelResultTitle: "🎨 AI가 그린 마법 그림",
    labelResultBadge: "✨ 완성!",
    labelResultDesc: "주인공, 배경, 행동 주문으로 탄생한 세상에 단 하나뿐인 그림이에요.",
    
    step4Title: "두 그림 차이 비교하기 🔍",
    step4Desc: "첫 번째 그림에서 딱 하나만 다른 것으로 바꿔서 두 그림을 서로 비교해 봐요!",
    
    badgeCompareChar: "주인공",
    titleCompareChar: "새로운 주인공 고르기",
    badgeCompareBg: "배경",
    titleCompareBg: "새로운 배경 고르기",
    badgeCompareAction: "행동",
    titleCompareAction: "새로운 행동 고르기",
    badgeCompareFinish: "완성",
    titleCompareFinish: "두 번째 그림 완성하기",
    descCompareFinish: "버튼 아래를 눌러 두 번째 마법 그림을 완성해 봐요!",
    compareGenerateBtn: "🎨 두 번째 그림 그리기!",
    
    labelFirstCard: "첫 번째 그림 🎨",
    labelSecondCard: "두 번째 그림 🎨",
    labelSecondPlaceholder: "여기에 두 번째 그림이 그려질 거예요!",
    
    differenceTitle: "📝 두 그림의 차이점 기록장",
    differenceDesc: "두 그림에서 달라진 부분이 무엇인지 글로 직접 써보세요!",
    differencePlaceholder: "예: 첫 번째 그림에서는 코끼리가 우주에서 춤을 췄는데, 두 번째 그림에서는 코끼리 대신 사자가 춤을 추고 있어요. 주인공이 바뀌었어요!",
    
    labelSubmitClass: "학년/반",
    submitClassPlaceholder: "예: 5학년 2반",
    labelSubmitName: "학생 이름",
    submitNamePlaceholder: "예: 홍길동",
    
    submitDiffBtnNormal: "선생님에게 제출하기 🚀",
    submitDiffBtnLoading: "제출 중... ⏳",
    submitDiffBtnSuccess: "선생님에게 제출되었습니다",
    submitResultMsgSuccess: "제출이 완료되었습니다! 선생님께 성공적으로 전달되었어요! 🎉",
    submitResultMsgLocal: "제출이 완료되었습니다! (로컬 저장됨) 🎉",
    
    errorPromptMax: "마법 주문 만들기 횟수를 모두 사용했어요! 선생님께 문의해 주세요 😢",
    errorPromptFail: "마법 주문을 만드는 데 실패했어요 😢",
    errorImageMax: "이미지 생성 횟수를 모두 사용했어요! 선생님께 문의해 주세요 😢",
    errorNeedPrompt: "먼저 [마법 주문 만들기] 버튼을 눌러 주세요!",
    
    compChar: "주인공",
    compBg: "배경",
    compAction: "행동"
  },
  en: {
    loginTitle: "🎨 AI Picture Bookstore",
    loginSub: "To enter the fun AI picture world,<br>please enter the ID and password given by your teacher! ✨",
    labelLoginId: "ID",
    loginIdPlaceholder: "Enter ID (e.g. TEST_01)",
    labelLoginPw: "Password",
    loginPwPlaceholder: "Enter password",
    loginBtn: "🚪 Enter Bookstore!",
    
    mainTitle: "🎨 AI Picture Bookstore",
    mainSub: "Choose a character, background, and action to create your own special picture! ✨",
    
    step1Title: "Choose Character",
    step1Desc: "Please choose the character for your picture!",
    step2Title: "Choose Background",
    step2Desc: "Where will the story take place?",
    step3Title: "Choose Action",
    step3Desc: "What is the character doing?",
    
    labelPromptMagic: "📝 AI Magic Prompt",
    labelReadonly: "🔒 View Only",
    promptPlaceholder: "Select character, background, and action above, and the magic prompt will appear here! ✨",
    
    createPromptBtnNormal: "📝 Create Magic Prompt",
    createPromptBtnNeed: "📝 Create Magic Prompt (Need to select {missing})",
    createPromptBtnReady: "📝 Create Magic Prompt ✨",
    createPromptBtnLoading: "⏳ Generating magic prompt...",
    createPromptBtnSuccess: "✨ Magic Prompt Ready! (Click to remake)",
    createPromptBtnRetry: "📝 Create Magic Prompt (Retry)",
    createPromptBtnMax: "🚫 Used all magic prompt limits!",
    
    labelRemainingCountText: "Remaining Image Generations: ",
    labelCountUnit: " times",
    remainingCountMax: "All generation limits have been exhausted.",
    
    generateBtnNormal: "🎨 Ask AI to paint",
    generateBtnLoading: "⏳ Painting picture...",
    generateBtnReady: "🎨 Ask AI to paint!",
    generateBtnMax: "🚫 Used all image generation limits!",
    
    promptLoadingText: "Creating magic prompt...",
    imageLoadingText: "The AI artist is painting your picture... 🎨",
    
    labelResultTitle: "🎨 AI Magic Picture",
    labelResultBadge: "✨ Finished!",
    labelResultDesc: "A unique painting created from your character, background, and action prompt.",
    
    step4Title: "Compare Two Pictures 🔍",
    step4Desc: "Change exactly one thing from the first picture to compare them!",
    
    badgeCompareChar: "Character",
    titleCompareChar: "Choose New Character",
    badgeCompareBg: "Background",
    titleCompareBg: "Choose New Background",
    badgeCompareAction: "Action",
    titleCompareAction: "Choose New Action",
    badgeCompareFinish: "Finish",
    titleCompareFinish: "Complete Second Picture",
    descCompareFinish: "Click below to complete your second magic picture!",
    compareGenerateBtn: "🎨 Paint Second Picture!",
    
    labelFirstCard: "First Picture 🎨",
    labelSecondCard: "Second Picture 🎨",
    labelSecondPlaceholder: "The second picture will appear here!",
    
    differenceTitle: "📝 Difference Note",
    differenceDesc: "Write down the differences you see between the two pictures!",
    differencePlaceholder: "e.g. In the first picture, the elephant is dancing in space, but in the second picture, a tiger is dancing. The character changed!",
    
    labelSubmitClass: "Grade/Class",
    submitClassPlaceholder: "e.g. Grade 5 Class 2",
    labelSubmitName: "Student Name",
    submitNamePlaceholder: "e.g. John Doe",
    
    submitDiffBtnNormal: "Submit to Teacher 🚀",
    submitDiffBtnLoading: "Submitting... ⏳",
    submitDiffBtnSuccess: "Submitted to Teacher",
    submitResultMsgSuccess: "Submitted successfully! Sent to teacher! 🎉",
    submitResultMsgLocal: "Submitted successfully! (Saved locally) 🎉",
    
    errorPromptMax: "You have used all magic prompt generations! Ask your teacher 😢",
    errorPromptFail: "Failed to generate magic prompt 😢",
    errorImageMax: "You have used all image generations! Ask your teacher 😢",
    errorNeedPrompt: "Please click [Create Magic Prompt] first!",
    
    compChar: "Character",
    compBg: "Background",
    compAction: "Action"
  }
};

function getLang() {
  return localStorage.getItem('combination_lang') || 'ko';
}

function translateSelectionButtons() {
  try {
    const lang = getLang();
    document.querySelectorAll('.selection-btn, .compare-option-btn').forEach(btn => {
      const val = btn.getAttribute('data-value');
      if (!val) return;
      const emojiEl = btn.querySelector('.emoji');
      const emoji = emojiEl ? emojiEl.outerHTML : '';
      const label = GRID_TRANS[lang][val] || val;
      btn.innerHTML = emoji + ' ' + label;
    });
  } catch (err) {
    console.error("Error in translateSelectionButtons:", err);
  }
}

function renderCompareSelections2() {
    try {
        const lang = getLang();
        let selectionHTML = '';
        const firstChar = compareState.first.character;
        const secondChar = compareState.second.character;
        const firstBg = compareState.first.background;
        const secondBg = compareState.second.background;
        const firstAction = compareState.first.action;
        const secondAction = compareState.second.action;
        
        const secondCharLabel = GRID_TRANS[lang][secondChar] || secondChar;
        const secondBgLabel = GRID_TRANS[lang][secondBg] || secondBg;
        const secondActionLabel = GRID_TRANS[lang][secondAction] || getActionKoreanName(secondAction);

        if (secondChar !== firstChar) {
            selectionHTML += lang === 'en'
              ? `<span class="changed-item">👤 ${secondCharLabel} (Character Changed)</span>`
              : `<span class="changed-item">👤 ${secondCharLabel} (주인공 변경)</span>`;
        } else {
            selectionHTML += `<span>👤 ${secondCharLabel}</span>`;
        }

        if (secondBg !== firstBg) {
            selectionHTML += lang === 'en'
              ? `<span class="changed-item">🏞️ ${secondBgLabel} (Background Changed)</span>`
              : `<span class="changed-item">🏞️ ${secondBgLabel} (배경 변경)</span>`;
        } else {
            selectionHTML += `<span>🏞️ ${secondBgLabel}</span>`;
        }

        if (secondAction !== firstAction) {
            selectionHTML += lang === 'en'
              ? `<span class="changed-item">🏃 ${secondActionLabel} (Action Changed)</span>`
              : `<span class="changed-item">🏃 ${secondActionLabel} (행동 변경)</span>`;
        } else {
            selectionHTML += `<span>🏃 ${secondActionLabel}</span>`;
        }
        const selections2El = document.getElementById('compareSelections2');
        if (selections2El) selections2El.innerHTML = selectionHTML;
    } catch (err) {
        console.error("Error in renderCompareSelections2:", err);
    }
}

function applyLanguage() {
  try {
    const lang = getLang();
    const i18n = STATIC_I18N[lang];
    if (!i18n) return;
    
    // Login fields
    const loginTitle = document.getElementById('loginTitle');
    if (loginTitle) loginTitle.textContent = i18n.loginTitle;
    const loginSub = document.getElementById('loginSub');
    if (loginSub) loginSub.innerHTML = i18n.loginSub;
    const labelLoginId = document.getElementById('labelLoginId');
    if (labelLoginId) labelLoginId.textContent = i18n.labelLoginId;
    const loginId = document.getElementById('loginId');
    if (loginId) loginId.setAttribute('placeholder', i18n.loginIdPlaceholder);
    const labelLoginPw = document.getElementById('labelLoginPw');
    if (labelLoginPw) labelLoginPw.textContent = i18n.labelLoginPw;
    const loginPw = document.getElementById('loginPw');
    if (loginPw) loginPw.setAttribute('placeholder', i18n.loginPwPlaceholder);
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.textContent = i18n.loginBtn;
    
    // Header
    const mainTitle = document.getElementById('mainTitle');
    if (mainTitle) mainTitle.textContent = i18n.mainTitle;
    const mainSub = document.getElementById('mainSub');
    if (mainSub) mainSub.textContent = i18n.mainSub;
    
    // Steps
    const step1Title = document.getElementById('step1Title');
    if (step1Title) step1Title.textContent = i18n.step1Title;
    const step1Desc = document.getElementById('step1Desc');
    if (step1Desc) step1Desc.textContent = i18n.step1Desc;
    const step2Title = document.getElementById('step2Title');
    if (step2Title) step2Title.textContent = i18n.step2Title;
    const step2Desc = document.getElementById('step2Desc');
    if (step2Desc) step2Desc.textContent = i18n.step2Desc;
    const step3Title = document.getElementById('step3Title');
    if (step3Title) step3Title.textContent = i18n.step3Title;
    const step3Desc = document.getElementById('step3Desc');
    if (step3Desc) step3Desc.textContent = i18n.step3Desc;
    
    // Prompt preview
    const labelPromptMagic = document.getElementById('labelPromptMagic');
    if (labelPromptMagic) labelPromptMagic.textContent = i18n.labelPromptMagic;
    const labelReadonly = document.getElementById('labelReadonly');
    if (labelReadonly) labelReadonly.textContent = i18n.labelReadonly;
    if (!state.koreanPrompt) {
      const promptPlaceholder = document.getElementById('promptPlaceholder');
      if (promptPlaceholder) promptPlaceholder.textContent = i18n.promptPlaceholder;
    }
    
    // Buttons
    translateSelectionButtons();
    checkSelections(); // This will refresh the createPromptBtn text
    
    // Loading
    const promptLoadingText = document.getElementById('promptLoadingText');
    if (promptLoadingText) promptLoadingText.textContent = i18n.promptLoadingText;
    const imageLoadingText = document.getElementById('imageLoadingText');
    if (imageLoadingText) imageLoadingText.textContent = i18n.imageLoadingText;
    
    // Output
    const labelResultTitle = document.getElementById('labelResultTitle');
    if (labelResultTitle) labelResultTitle.textContent = i18n.labelResultTitle;
    const labelResultBadge = document.getElementById('labelResultBadge');
    if (labelResultBadge) labelResultBadge.textContent = i18n.labelResultBadge;
    const labelResultDesc = document.getElementById('labelResultDesc');
    if (labelResultDesc) labelResultDesc.textContent = i18n.labelResultDesc;
    
    // Step 4
    const step4Title = document.getElementById('step4Title');
    if (step4Title) step4Title.textContent = i18n.step4Title;
    const step4Desc = document.getElementById('step4Desc');
    if (step4Desc) step4Desc.textContent = i18n.step4Desc;
    
    const badgeCompareChar = document.getElementById('badgeCompareChar');
    if (badgeCompareChar) badgeCompareChar.textContent = i18n.badgeCompareChar;
    const titleCompareChar = document.getElementById('titleCompareChar');
    if (titleCompareChar) titleCompareChar.textContent = i18n.titleCompareChar;
    const badgeCompareBg = document.getElementById('badgeCompareBg');
    if (badgeCompareBg) badgeCompareBg.textContent = i18n.badgeCompareBg;
    const titleCompareBg = document.getElementById('titleCompareBg');
    if (titleCompareBg) titleCompareBg.textContent = i18n.titleCompareBg;
    const badgeCompareAction = document.getElementById('badgeCompareAction');
    if (badgeCompareAction) badgeCompareAction.textContent = i18n.badgeCompareAction;
    const titleCompareAction = document.getElementById('titleCompareAction');
    if (titleCompareAction) titleCompareAction.textContent = i18n.titleCompareAction;
    
    const badgeCompareFinish = document.getElementById('badgeCompareFinish');
    if (badgeCompareFinish) badgeCompareFinish.textContent = i18n.badgeCompareFinish;
    const titleCompareFinish = document.getElementById('titleCompareFinish');
    if (titleCompareFinish) titleCompareFinish.textContent = i18n.titleCompareFinish;
    const descCompareFinish = document.getElementById('descCompareFinish');
    if (descCompareFinish) descCompareFinish.textContent = i18n.descCompareFinish;
    
    if (compareGenerateBtn && (compareGenerateBtn.textContent.includes('그리기') || compareGenerateBtn.textContent.includes('Paint'))) {
      compareGenerateBtn.textContent = i18n.compareGenerateBtn;
    }
    
    const labelFirstCard = document.getElementById('labelFirstCard');
    if (labelFirstCard) labelFirstCard.textContent = i18n.labelFirstCard;
    const labelSecondCard = document.getElementById('labelSecondCard');
    if (labelSecondCard) labelSecondCard.textContent = i18n.labelSecondCard;
    const labelSecondPlaceholder = document.getElementById('labelSecondPlaceholder');
    if (labelSecondPlaceholder) labelSecondPlaceholder.textContent = i18n.labelSecondPlaceholder;
    
    // Difference input
    const differenceTitle = document.getElementById('differenceTitle');
    if (differenceTitle) differenceTitle.textContent = i18n.differenceTitle;
    const differenceDesc = document.getElementById('differenceDesc');
    if (differenceDesc) differenceDesc.textContent = i18n.differenceDesc;
    const differenceInput = document.getElementById('differenceInput');
    if (differenceInput) differenceInput.setAttribute('placeholder', i18n.differencePlaceholder);
    
    const labelSubmitClass = document.getElementById('labelSubmitClass');
    if (labelSubmitClass) labelSubmitClass.textContent = i18n.labelSubmitClass;
    const submitClass = document.getElementById('submitClass');
    if (submitClass) submitClass.setAttribute('placeholder', i18n.submitClassPlaceholder);
    const labelSubmitName = document.getElementById('labelSubmitName');
    if (labelSubmitName) labelSubmitName.textContent = i18n.labelSubmitName;
    const submitName = document.getElementById('submitName');
    if (submitName) submitName.setAttribute('placeholder', i18n.submitNamePlaceholder);
    
    // Submit btn state
    if (submitDiffBtn) {
      if (submitDiffBtn.textContent.includes('제출하기') || submitDiffBtn.textContent.includes('Submit')) {
        submitDiffBtn.textContent = i18n.submitDiffBtnNormal;
      } else if (submitDiffBtn.textContent.includes('제출 중') || submitDiffBtn.textContent.includes('Submitting')) {
        submitDiffBtn.textContent = i18n.submitDiffBtnLoading;
      } else if (submitDiffBtn.textContent.includes('제출 완료') || submitDiffBtn.textContent.includes('Submitted')) {
        submitDiffBtn.textContent = i18n.submitDiffBtnSuccess;
      }
    }
    
    // Active lang buttons toggle
    document.querySelectorAll('.lang-btn-sub').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === lang);
    });

    // Re-render selections display in Step 4 compare cards
    if (compareState.first) {
      const compareSelections1 = document.getElementById('compareSelections1');
      if (compareSelections1) {
        compareSelections1.innerHTML = `
            <span>👤 ${GRID_TRANS[lang][compareState.first.character] || compareState.first.character}</span>
            <span>🏞️ ${GRID_TRANS[lang][compareState.first.background] || compareState.first.background}</span>
            <span>🏃 ${GRID_TRANS[lang][compareState.first.action] || getActionKoreanName(compareState.first.action)}</span>
        `;
      }
    }
    if (compareState.second) {
      renderCompareSelections2();
    }
  } catch (err) {
    console.error("Error in applyLanguage:", err);
  }
}


/* ────────────────────────────────────────────────────────
   상태 관리
   ──────────────────────────────────────────────────────── */
const state = {
    character:     null,
    background:    null,
    action:        null,
    koreanPrompt:  "",   // 학생에게 보여주는 한국어 요약
    englishPrompt: "",   // 이미지 생성에 사용하는 영어 프롬프트 (화면에 미표시)
};

// Step 4 두 그림 비교 상태 관리
const compareState = {
    isComparing: false,
    first: null,  // { character, background, action, imageUrl, promptText }
    second: null  // { character, background, action, imageUrl, promptText }
};


/* ────────────────────────────────────────────────────────
   DOM 요소 취득
   ──────────────────────────────────────────────────────── */
const characterButtons  = document.querySelectorAll('#characterGrid   .selection-btn');
const backgroundButtons = document.querySelectorAll('#backgroundGrid  .selection-btn');
const actionButtons     = document.querySelectorAll('#actionGrid      .selection-btn');
const promptDisplay     = document.getElementById('promptDisplay');
const createPromptBtn   = document.getElementById('createPromptBtn');
const generateBtn       = document.getElementById('generateBtn');
const loadingBox        = document.getElementById('loadingBox');
const imageLoadingBox   = document.getElementById('imageLoadingBox');
const outputZone        = document.getElementById('outputZone');
const resultImage       = document.getElementById('resultImage');
const errorMessage      = document.getElementById('errorMessage');
const countBadge        = document.getElementById('countBadge');
const remainingCountEl  = document.getElementById('remainingCount');
const promptCountBadge  = document.getElementById('promptCountBadge');
const differenceInput   = document.getElementById('differenceInput');
const submitClass       = document.getElementById('submitClass');
const submitName        = document.getElementById('submitName');
const submitDiffBtn     = document.getElementById('submitDiffBtn');
const submitResultMsg   = document.getElementById('submitResultMsg');

// 이미지 생성 최대 횟수
const MAX_IMAGE_COUNT  = 5;
// 마법 주문 최대 횟수
const MAX_PROMPT_COUNT = 5;


/* ────────────────────────────────────────────────────────
   차이점 기록장 초기화 및 자동완성
   ──────────────────────────────────────────────────────── */
function openDifferenceNoteZone() {
    const lang = getLang();
    const i18n = STATIC_I18N[lang];
    differenceInput.value = '';
    differenceInput.disabled = false;
    submitClass.disabled = false;
    submitName.disabled = false;
    submitResultMsg.setAttribute('hidden', '');
    submitResultMsg.textContent = '';
    submitDiffBtn.disabled = true;
    submitDiffBtn.textContent = i18n.submitDiffBtnNormal;
    submitDiffBtn.style.background = '';
    submitDiffBtn.style.boxShadow = '';
    
    // 이름/학년 자동완성
    try {
        const profileData = localStorage.getItem("sail-home-profile");
        if (profileData) {
            const prof = JSON.parse(profileData);
            if (prof.cls) submitClass.value = prof.cls;
            if (prof.name) submitName.value = prof.name;
        }
    } catch (e) {}

    validateSubmitForm();
    document.getElementById('differenceNoteZone').removeAttribute('hidden');
}


/* ────────────────────────────────────────────────────────
   선택 상태 확인 → 버튼 활성화 제어
   ──────────────────────────────────────────────────────── */
function checkSelections() {
    const lang = getLang();
    const i18n = STATIC_I18N[lang];

    // 선택이 바뀌면 기존 프롬프트와 이미지 초기화
    state.koreanPrompt  = "";
    state.englishPrompt = "";
    promptDisplay.innerHTML   = `<span class="prompt-placeholder">${i18n.promptPlaceholder}</span>`;
    document.querySelector('.prompt-preview-zone').classList.remove('has-prompt');
    generateBtn.disabled = true;
    generateBtn.textContent = i18n.generateBtnNormal;
    outputZone.setAttribute('hidden', '');
    hideError();

    const allChosen = state.character && state.background && state.action;
    createPromptBtn.disabled = !allChosen;

    if (!allChosen) {
        const missing = [];
        if (!state.character)  missing.push(i18n.compChar);
        if (!state.background) missing.push(i18n.compBg);
        if (!state.action)     missing.push(i18n.compAction);
        createPromptBtn.textContent = i18n.createPromptBtnNeed.replace('{missing}', missing.join(', '));
    } else {
        createPromptBtn.textContent = i18n.createPromptBtnReady;
    }
}

// Step 4 이미지 완료 시 상태 처리 및 UI 반영 (첫 번째 그림 기준)
function handleImageCompletion(imageUrl) {
    if (compareState.isComparing) return; // 이미 비교 모드라면 무시

    compareState.first = {
        character: state.character,
        background: state.background,
        action: state.action,
        imageUrl: imageUrl,
        promptText: state.koreanPrompt
    };
    compareState.isComparing = true;

    const lang = getLang();
    const i18n = STATIC_I18N[lang];

    // 첫 번째 그림 카드 채우기
    document.getElementById('compareImg1').src = compareState.first.imageUrl;
    document.getElementById('compareSelections1').innerHTML = `
        <span>👤 ${GRID_TRANS[lang][compareState.first.character] || compareState.first.character}</span>
        <span>🏞️ ${GRID_TRANS[lang][compareState.first.background] || compareState.first.background}</span>
        <span>🏃 ${GRID_TRANS[lang][compareState.first.action] || getActionKoreanName(compareState.first.action)}</span>
    `;

    // 모든 옵션 버튼 리셋 및 원래 선택 항목 비활성화 처리
    compareOptionButtons.forEach(optBtn => {
        optBtn.classList.remove('original-selection', 'active-char', 'active-bg', 'active-action');
        optBtn.disabled = false;

        const cat = optBtn.dataset.category;
        let originalValue = '';
        if (cat === 'character') originalValue = compareState.first.character;
        else if (cat === 'background') originalValue = compareState.first.background;
        else if (cat === 'action') originalValue = compareState.first.action;

        if (optBtn.dataset.value === originalValue) {
            optBtn.classList.add('original-selection');
            optBtn.disabled = true;
        }
    });

    // Step 4 UI 요소 초기화
    compareActionZone.setAttribute('hidden', '');
    compareGenerateBtn.disabled = true;
    compareGenerateBtn.textContent = i18n.compareGenerateBtn;

    // 두 번째 그림 카드 초기화
    const wrapper2 = document.getElementById('compareImg2Wrapper');
    const img2 = document.getElementById('compareImg2');
    wrapper2.classList.add('placeholder');
    img2.setAttribute('hidden', '');
    img2.src = '';
    document.getElementById('compareSelections2').innerHTML = '';
    document.getElementById('differenceNoteZone').setAttribute('hidden', '');

    // Step 4 보이기
    document.getElementById('step4').removeAttribute('hidden');
}

/* ────────────────────────────────────────────────────────
   Step 4 전용 바꿀 항목/버튼 및 액션 핸들러
   ──────────────────────────────────────────────────────── */
const compareActionZone       = document.getElementById('compareActionZone');
const compareGenerateBtn     = document.getElementById('compareGenerateBtn');
const compareOptionButtons    = document.querySelectorAll('.compare-option-btn');

// 바꿀 항목의 옵션 버튼 클릭 이벤트 바인딩 (하나를 선택하면 다른 모든 선택을 해제하여 단 하나만 골라지도록 설정)
compareOptionButtons.forEach(optBtn => {
    optBtn.addEventListener('click', () => {
        if (optBtn.classList.contains('original-selection')) return;

        // 다른 모든 옵션 버튼의 active 클래스 해제 (전체 카테고리 중 단 1개만 바꿀 수 있도록 강제)
        compareOptionButtons.forEach(b => {
            b.classList.remove('active-char', 'active-bg', 'active-action');
        });

        // 현재 클릭한 버튼의 카테고리에 맞는 active 클래스 추가
        const category = optBtn.dataset.category;
        let activeClass = '';
        if (category === 'character') activeClass = 'active-char';
        else if (category === 'background') activeClass = 'active-bg';
        else if (category === 'action') activeClass = 'active-action';

        optBtn.classList.add(activeClass);

        compareState.category = category;
        compareState.newValue = optBtn.dataset.value;

        // 두 번째 그리기 버튼 노출 및 활성화
        compareActionZone.removeAttribute('hidden');
        compareGenerateBtn.disabled = false;

        const lang = getLang();
        let changeText = '';
        if (category === 'character') {
            const oldVal = GRID_TRANS[lang][compareState.first.character] || compareState.first.character;
            const newVal = GRID_TRANS[lang][compareState.newValue] || compareState.newValue;
            changeText = lang === 'en'
              ? `Character: ${oldVal} ➡️ ${newVal}`
              : `주인공: ${oldVal} ➡️ ${newVal}`;
        } else if (category === 'background') {
            const oldVal = GRID_TRANS[lang][compareState.first.background] || compareState.first.background;
            const newVal = GRID_TRANS[lang][compareState.newValue] || compareState.newValue;
            changeText = lang === 'en'
              ? `Background: ${oldVal} ➡️ ${newVal}`
              : `배경: ${oldVal} ➡️ ${newVal}`;
        } else if (category === 'action') {
            const cleanText = optBtn.textContent.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
            const oldVal = GRID_TRANS[lang][compareState.first.action] || getActionKoreanName(compareState.first.action);
            changeText = lang === 'en'
              ? `Action: ${oldVal} ➡️ ${cleanText}`
              : `행동: ${oldVal} ➡️ ${cleanText}`;
        }

        compareGenerateBtn.textContent = lang === 'en'
          ? `🎨 Paint Second Picture! (${changeText})`
          : `🎨 두 번째 그림 그리기! (${changeText})`;
    });
});

// 3. 두 번째 그림 그리기 버튼 클릭 이벤트 바인딩 (주문 + 이미지 연속 호출)
compareGenerateBtn.addEventListener('click', async () => {
    const sessionVal = localStorage.getItem('mallang_session') || '';
    const currentUser = sessionVal.replace('logged_in_', '');
    const lang = getLang();
    const i18n = STATIC_I18N[lang];

    hideError();
    document.getElementById('differenceNoteZone').setAttribute('hidden', '');
    imageLoadingBox.removeAttribute('hidden');

    const loadingTextEl = imageLoadingBox.querySelector('.loading-text');
    const originalLoadingText = loadingTextEl.textContent;
    loadingTextEl.textContent = lang === 'en'
      ? 'Painting second magic picture... 🎨'
      : '두 번째 마법 그림을 그리고 있어요... 🎨';

    compareGenerateBtn.disabled = true;
    const originalBtnText = compareGenerateBtn.textContent;
    compareGenerateBtn.textContent = lang === 'en'
      ? '⏳ Painting second magic picture...'
      : '⏳ 두 번째 마법 그림 그리는 중...';

    // 최종 파라미터 조합
    const secondChar = compareState.category === 'character' ? compareState.newValue : compareState.first.character;
    const secondBg   = compareState.category === 'background' ? compareState.newValue : compareState.first.background;
    const secondAction = compareState.category === 'action' ? compareState.newValue : compareState.first.action;

    try {
        // ① 먼저 DB에서 이미지 생성 횟수 차감 시도 (로그인된 경우에만)
        let canGenerate = true;
        if (currentUser) {
            try {
                const countRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_image_count`, {
                    method: 'POST',
                    headers: {
                        'apikey':        SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type':  'application/json'
                    },
                    body: JSON.stringify({ p_username: currentUser })
                });
                canGenerate = await countRes.json();
            } catch (e) { console.warn('RPC bypass:', e); }
        }

        if (canGenerate !== true) {
            showError(i18n.errorImageMax);
            lockGenerateBtn();
            compareGenerateBtn.textContent = i18n.generateBtnMax;
            compareGenerateBtn.style.background = '#e2e8f0';
            compareGenerateBtn.style.color = '#94a3b8';
            compareGenerateBtn.style.boxShadow = 'none';
            updateCountBadge(MAX_IMAGE_COUNT);
            return;
        }

        // ② 두 번째 마법 주문 (프롬프트) 백엔드 자동 요청
        let secondBgValue = secondBg;
        if (secondBgValue === '바다') secondBgValue = '바다(깊은 바다 속 바다 위 바닷속 생태계)';
        if (secondBgValue === '해변') secondBgValue = '해변(모래사장 모래밭 바닷가 해안선)';

        const promptRes = await callEdgeFunction('generate-prompt', {
            character:  secondChar,
            background: secondBgValue,
            action:     secondAction,
        });

        // ③ 두 번째 이미지 백엔드 요청
        const data = await callEdgeFunction('generate-image', {
            prompt: promptRes.englishPrompt,
        });

        const secondImgUrl = `data:${data.mimeType};base64,${data.imageBytes}`;
        compareState.second = {
            character: secondChar,
            background: secondBg,
            action: secondAction,
            imageUrl: secondImgUrl,
            promptText: promptRes.koreanPrompt
        };

        // UI 업데이트
        const wrapper2 = document.getElementById('compareImg2Wrapper');
        const img2 = document.getElementById('compareImg2');
        img2.src = compareState.second.imageUrl;
        img2.removeAttribute('hidden');
        wrapper2.classList.remove('placeholder');

        // 바뀐 내역 배지 강조 표시
        renderCompareSelections2();

        // 차이점 기록장 오픈
        openDifferenceNoteZone();
        
        await loadImageCount(currentUser);
        setTimeout(() => {
            document.getElementById('differenceNoteZone').scrollIntoView({ behavior: 'smooth' });
        }, 300);

    } catch (err) {
        console.error(err);
        // 실패 시 mock 이미지로 처리
        compareState.second = {
            character: secondChar,
            background: secondBg,
            action: secondAction,
            imageUrl: FALLBACK_IMG,
            promptText: "샘플 주문 정보"
        };

        const wrapper2 = document.getElementById('compareImg2Wrapper');
        const img2 = document.getElementById('compareImg2');
        img2.src = FALLBACK_IMG;
        img2.removeAttribute('hidden');
        wrapper2.classList.remove('placeholder');

        renderCompareSelections2();

        openDifferenceNoteZone();
        
        await loadImageCount(currentUser);
        setTimeout(() => {
            document.getElementById('differenceNoteZone').scrollIntoView({ behavior: 'smooth' });
        }, 300);
    } finally {
        imageLoadingBox.setAttribute('hidden', '');
        loadingTextEl.textContent = originalLoadingText;
        compareGenerateBtn.disabled = false;
        compareGenerateBtn.textContent = originalBtnText;
    }
});

// 행동 data-value 명칭 변환 헬퍼
function getActionKoreanName(val) {
    if (val === '춤을 추고') return '춤추기';
    if (val === '폴짝폴짝 뛰고') return '뛰기';
    if (val === '신나게 달리고') return '달리기';
    if (val === '얌전히 서서') return '서있기';
    if (val === '쿨쿨 잠을 자고') return '잠자기';
    if (val === '재미있게 책을 읽고') return '책읽기';
    if (val === '노래를 부르고') return '노래하기';
    return val;
}



/* ────────────────────────────────────────────────────────
   버튼 클릭 이벤트 등록 (주인공 / 배경 / 행동)
   ──────────────────────────────────────────────────────── */
function bindToggle(buttons, stateKey, activeClass) {
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const isSame = state[stateKey] === btn.dataset.value;
            buttons.forEach(b => b.classList.remove(activeClass));
            state[stateKey] = isSame ? null : btn.dataset.value;
            if (!isSame) btn.classList.add(activeClass);
            checkSelections();
        });
    });
}

bindToggle(characterButtons,  'character',  'active-char');
bindToggle(backgroundButtons, 'background', 'active-bg');
bindToggle(actionButtons,     'action',     'active-action');


/* ────────────────────────────────────────────────────────
   Supabase Edge Function 공통 호출 유틸
   ──────────────────────────────────────────────────────── */
async function callEdgeFunction(functionName, body) {
    const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
    const res  = await fetch(url, {
        method:  'POST',
        headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `서버 오류 (${res.status})`);
    }
    return res.json();
}


/* ────────────────────────────────────────────────────────
   마법 주문 만들기 버튼
   ──────────────────────────────────────────────────────── */
createPromptBtn.addEventListener('click', async () => {
    if (!state.character || !state.background || !state.action) return;

    // 현재 로그인된 유저명 가져오기
    const sessionVal  = localStorage.getItem('mallang_session') || '';
    const currentUser = sessionVal.replace('logged_in_', '');
    const lang = getLang();
    const i18n = STATIC_I18N[lang];

    // 로딩 시작
    hideError();
    loadingBox.removeAttribute('hidden');
    createPromptBtn.disabled    = true;
    createPromptBtn.textContent = i18n.createPromptBtnLoading;

    try {
        // ① 마법 주문 횟수 차감 시도 (로그인된 경우에만)
        let canCreate = true;
        if (currentUser) {
            try {
                const countRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_prompt_count`, {
                    method: 'POST',
                    headers: {
                        'apikey':        SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type':  'application/json'
                    },
                    body: JSON.stringify({ p_username: currentUser })
                });
                canCreate = await countRes.json();
            } catch (e) { console.warn('RPC bypass:', e); }
        }

        if (canCreate !== true) {
            showError(i18n.errorPromptMax);
            lockCreatePromptBtn();
            updatePromptCountBadge(MAX_PROMPT_COUNT);
            return;
        }

        // ② 횟수 차감 성공 → 마법 주문 실제 요청
        let bgValue = state.background;
        if (bgValue === '바다') bgValue = '바다(깊은 바다 속 바다 위 바닷속 생태계)';
        if (bgValue === '해변') bgValue = '해변(모래사장 모래밭 바닷가 해안선)';

        const data = await callEdgeFunction('generate-prompt', {
            character:  state.character,
            background: bgValue,
            action:     state.action,
        });

        state.koreanPrompt  = data.koreanPrompt;
        state.englishPrompt = data.englishPrompt;

        // 프롬프트 표시 (읽기 전용)
        promptDisplay.textContent = state.koreanPrompt;
        document.querySelector('.prompt-preview-zone').classList.add('has-prompt');

        // 이미지 그리기 버튼 활성화
        generateBtn.disabled    = false;
        generateBtn.textContent = i18n.generateBtnReady;

        // 주문 만들기 버튼 완료 표시
        createPromptBtn.textContent = i18n.createPromptBtnSuccess;
        createPromptBtn.disabled = false;

        // 배지 업데이트
        await loadPromptCount(currentUser);

    } catch (err) {
        console.error(err);
        showError(`${i18n.errorPromptFail}\n${err.message}`);
        createPromptBtn.disabled = false;
        createPromptBtn.textContent = i18n.createPromptBtnRetry;
        await loadPromptCount(currentUser);
    } finally {
        loadingBox.setAttribute('hidden', '');
    }
});


/* ────────────────────────────────────────────────────────
   이미지 생성 횟수 관리
   ──────────────────────────────────────────────────────── */

// 횟수 배지 UI 업데이트
function updateCountBadge(usedCount) {
    const remaining = MAX_IMAGE_COUNT - usedCount;
    countBadge.removeAttribute('hidden');
    const lang = getLang();
    const i18n = STATIC_I18N[lang];

    if (remaining <= 0) {
        // 횟수 소진 시 문구로 표시
        countBadge.innerHTML = `<span class="count-icon">🎨</span> <span>${i18n.remainingCountMax}</span>`;
    } else {
        // 남은 횟수 숫자 표시
        countBadge.innerHTML = `<span class="count-icon">🎨</span> <span>${i18n.labelRemainingCountText}</span><span id="remainingCount" class="count-number">${remaining}</span><span>${i18n.labelCountUnit}</span>`;
    }
}

// 로그인한 사용자의 현재 사용 횟수를 DB에서 가져오기
async function loadImageCount(username) {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_image_count`, {
            method: 'POST',
            headers: {
                'apikey':        SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type':  'application/json'
            },
            body: JSON.stringify({ p_username: username })
        });
        if (!res.ok) return;
        const usedCount = await res.json();
        updateCountBadge(usedCount);

        // 이미 5회 소진 시 버튼 잠금
        if (usedCount >= MAX_IMAGE_COUNT) {
            lockGenerateBtn();
        }
    } catch (e) {
        console.error('횟수 조회 실패:', e);
    }
}

// 그리기 버튼 잠금 처리
function lockGenerateBtn() {
    const lang = getLang();
    const i18n = STATIC_I18N[lang];
    generateBtn.disabled    = true;
    generateBtn.textContent = i18n.generateBtnMax;
    generateBtn.style.background = '#e2e8f0';
    generateBtn.style.color      = '#94a3b8';
    generateBtn.style.boxShadow  = 'none';
}

/* ────────────────────────────────────────────────────────
   마법 주문 횟수 관리
   ──────────────────────────────────────────────────────── */

// 마법 주문 배지 UI 업데이트
function updatePromptCountBadge(usedCount) {
    const remaining = MAX_PROMPT_COUNT - usedCount;
    promptCountBadge.removeAttribute('hidden');
    const lang = getLang();
    const i18n = STATIC_I18N[lang];

    if (remaining <= 0) {
        promptCountBadge.innerHTML = `<span class="count-icon">📝</span> <span>${i18n.remainingCountMax}</span>`;
    } else {
        if (lang === 'en') {
            promptCountBadge.innerHTML = `<span class="count-icon">📝</span> <span>Remaining magic prompts: </span><span class="count-number">${remaining}</span><span>${i18n.labelCountUnit}</span>`;
        } else {
            promptCountBadge.innerHTML = `<span class="count-icon">📝</span> <span>마법 주문 남은 횟수: </span><span class="count-number">${remaining}</span><span>회</span>`;
        }
    }
}

// 마법 주문 횟수 DB에서 조회
async function loadPromptCount(username) {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_prompt_count`, {
            method: 'POST',
            headers: {
                'apikey':        SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type':  'application/json'
            },
            body: JSON.stringify({ p_username: username })
        });
        if (!res.ok) return;
        const usedCount = await res.json();
        updatePromptCountBadge(usedCount);

        if (usedCount >= MAX_PROMPT_COUNT) {
            lockCreatePromptBtn();
        }
    } catch (e) {
        console.error('마법 주문 횟수 조회 실패:', e);
    }
}

// 마법 주문 버튼 잠금
function lockCreatePromptBtn() {
    const lang = getLang();
    const i18n = STATIC_I18N[lang];
    createPromptBtn.disabled    = true;
    createPromptBtn.textContent = i18n.createPromptBtnMax;
    createPromptBtn.style.background = '#e2e8f0';
    createPromptBtn.style.color      = '#94a3b8';
    createPromptBtn.style.boxShadow  = 'none';
}

/* ────────────────────────────────────────────────────────
   이미지 생성 횟수 관리
   ──────────────────────────────────────────────────────── */
generateBtn.addEventListener('click', async () => {
    const lang = getLang();
    const i18n = STATIC_I18N[lang];
    if (!state.englishPrompt) {
        showError(i18n.errorNeedPrompt);
        return;
    }

    // 현재 로그인된 유저명 가져오기
    const sessionVal = localStorage.getItem('mallang_session') || '';
    const currentUser = sessionVal.replace('logged_in_', '');

    // 로딩 시작
    hideError();
    outputZone.setAttribute('hidden', '');
    imageLoadingBox.removeAttribute('hidden');
    generateBtn.disabled    = true;
    generateBtn.textContent = i18n.generateBtnLoading;

    try {
        // ① 먼저 DB에서 횟수 차감 시도 (로그인된 경우에만)
        let canGenerate = true;
        if (currentUser) {
            try {
                const countRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_image_count`, {
                    method: 'POST',
                    headers: {
                        'apikey':        SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type':  'application/json'
                    },
                    body: JSON.stringify({ p_username: currentUser })
                });
                canGenerate = await countRes.json();
            } catch (e) { console.warn('RPC bypass:', e); }
        }

        if (canGenerate !== true) {
            showError(i18n.errorImageMax);
            lockGenerateBtn();
            updateCountBadge(MAX_IMAGE_COUNT);
            return;
        }

        // ② 횟수 차감 성공 → 실제 이미지 생성 요청
        const data = await callEdgeFunction('generate-image', {
            prompt: state.englishPrompt,
        });

        // ③ 이미지 표시 & 배지 업데이트
        resultImage.src = `data:${data.mimeType};base64,${data.imageBytes}`;
        
        // 성공 시 배지 텍스트 설정
        const badge = outputZone.querySelector('.success-badge');
        if (badge) {
            badge.textContent = i18n.labelResultBadge;
        }

        outputZone.removeAttribute('hidden');
        outputZone.scrollIntoView({ behavior: 'smooth' });

        // DB에서 최신 횟수 다시 읽어 배지 갱신
        await loadImageCount(currentUser);

        // Step 4 처리 추가
        handleImageCompletion(resultImage.src);

    } catch (err) {
        console.error(err);
        // 실패 시 샘플 이미지 사용 (에러창을 띄우는 대신 완성 메시지 표시)
        resultImage.src = FALLBACK_IMG;
        
        // 실패 시 배지 텍스트를 완성 상태로 변경하여 자연스럽게 대체
        const badge = outputZone.querySelector('.success-badge');
        if (badge) {
            badge.textContent = i18n.labelResultBadge;
        }

        outputZone.removeAttribute('hidden');
        outputZone.scrollIntoView({ behavior: 'smooth' });
        await loadImageCount(currentUser);

        // 실패 시에도 Step 4 샘플 이미지로 처리 추가
        handleImageCompletion(resultImage.src);
    } finally {
        imageLoadingBox.setAttribute('hidden', '');
        // 버튼 복원은 lockGenerateBtn이 아닌 경우에만
        if (generateBtn.textContent === i18n.generateBtnLoading) {
            generateBtn.disabled    = false;
            generateBtn.textContent = i18n.generateBtnReady;
        }
    }
});


/* ────────────────────────────────────────────────────────
   에러 표시 유틸
   ──────────────────────────────────────────────────────── */
function showError(msg) {
    errorMessage.removeAttribute('hidden');
    errorMessage.textContent   = msg;
    errorMessage.scrollIntoView({ behavior: 'smooth' });
}
function hideError() {
    errorMessage.setAttribute('hidden', '');
    errorMessage.textContent   = '';
}


/* ────────────────────────────────────────────────────────
   초기화
   ──────────────────────────────────────────────────────── */
checkSelections();


/* ────────────────────────────────────────────────────────
   로그인 시스템 및 세션 관리
   ──────────────────────────────────────────────────────── */
const loginOverlay  = document.getElementById('loginOverlay');
const mainContainer = document.getElementById('mainContainer');
const loginIdInput  = document.getElementById('loginId');
const loginPwInput  = document.getElementById('loginPw');
const loginBtn      = document.getElementById('loginBtn');
const loginError    = document.getElementById('loginError');
const logoutBtn     = document.getElementById('logoutBtn');

// 세션 상태 확인 함수 (로그인 없이 바로 활동 화면으로)
function checkAuth() {
    loginOverlay.setAttribute('hidden', '');
    mainContainer.removeAttribute('hidden');
}

// 로그인 실행
async function handleLogin() {
    const username = loginIdInput.value.trim();
    const password = loginPwInput.value.trim();

    if (!username || !password) {
        showLoginError('아이디와 비밀번호를 모두 입력해 주세요!');
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = '🚪 책방에 들어가는 중...';
    hideLoginError();

    try {
        // Supabase Database RPC 함수 호출로 안전하게 검증
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/verify_login`, {
            method: 'POST',
            headers: {
                'apikey':        SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type':  'application/json'
            },
            body: JSON.stringify({
                p_username: username,
                p_password: password
            })
        });

        if (!res.ok) {
            throw new Error('서버 통신에 실패했습니다. 다시 시도해 주세요.');
        }

        const isSuccess = await res.json();

        if (isSuccess === true) {
            // 로그인 상태 기록 (로컬 스토리지에 단순 플래그 저장)
            localStorage.setItem('mallang_session', 'logged_in_' + username);
            
            // 폼 초기화
            loginIdInput.value = '';
            loginPwInput.value = '';

            // 로그인 성공 UI 전환 및 횟수 로드
            checkAuth();
            await loadImageCount(username);
            await loadPromptCount(username);
        } else {
            throw new Error('아이디나 비밀번호가 틀렸어요 😢');
        }

    } catch (err) {
        console.error(err);
        showLoginError(err.message || '로그인에 실패했습니다. 다시 시도해 주세요.');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = '🚪 책방 들어가기!';
    }
}

// 이벤트 리스너 등록
loginBtn.addEventListener('click', handleLogin);

// 엔터 키 누르면 로그인 실행
loginPwInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleLogin();
    }
});
loginIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginPwInput.focus();
    }
});

// 로그아웃 처리
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('mallang_session');
    
    // Step 4 숨김 및 초기화
    document.getElementById('step4').setAttribute('hidden', '');
    compareState.isComparing = false;
    compareState.first = null;
    compareState.second = null;
    compareState.category = null;
    compareState.newValue = null;

    // Step 4 내부 UI 초기화
    document.querySelectorAll('.compare-option-btn').forEach(btn => {
        btn.classList.remove('active-char', 'active-bg', 'active-action', 'original-selection');
        btn.disabled = false;
    });
    compareActionZone.setAttribute('hidden', '');

    // 선택값 초기화
    state.character  = null;
    state.background = null;
    state.action     = null;
    
    // 활성화 상태인 그리드 버튼 클래스 해제
    document.querySelectorAll('.selection-btn').forEach(btn => {
        btn.classList.remove('active-char', 'active-bg', 'active-action');
    });
    
    checkSelections();
    checkAuth();
});


// 에러 메시지 헬퍼
function showLoginError(msg) {
    loginError.removeAttribute('hidden');
    loginError.textContent = msg;
}
function hideLoginError() {
    loginError.setAttribute('hidden', '');
    loginError.textContent = '';
}

/* ────────────────────────────────────────────────────────
   선생님에게 제출하기 관련 이벤트 및 로직
   ──────────────────────────────────────────────────────── */
function validateSubmitForm() {
    const textVal = differenceInput.value.trim();
    const classVal = submitClass.value.trim();
    const nameVal = submitName.value.trim();
    
    // 차이점 기록장에 글자가 있고(최소 1자 이상), 학년/반과 학생 이름이 적히면 활성화
    submitDiffBtn.disabled = !(textVal.length >= 1 && classVal.length > 0 && nameVal.length > 0);
}

differenceInput.addEventListener('input', validateSubmitForm);
submitClass.addEventListener('input', validateSubmitForm);
submitName.addEventListener('input', validateSubmitForm);

submitDiffBtn.addEventListener('click', async () => {
    const textVal = differenceInput.value.trim();
    const classVal = submitClass.value.trim();
    const nameVal = submitName.value.trim();
    
    if (!textVal || !classVal || !nameVal) return;
    
    const lang = getLang();
    const i18n = STATIC_I18N[lang];


    submitDiffBtn.disabled = true;
    submitDiffBtn.textContent = i18n.submitDiffBtnLoading;
    submitResultMsg.setAttribute('hidden', '');
    
    // 1. LocalStorage에 백업 저장
    try {
        const submission = {
            when: new Date().toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" }),
            class: classVal,
            name: nameVal,
            first: {
                character: compareState.first.character,
                background: compareState.first.background,
                action: compareState.first.action
            },
            second: {
                character: compareState.second.character,
                background: compareState.second.background,
                action: compareState.second.action
            },
            difference: textVal
        };
        const localSubs = JSON.parse(localStorage.getItem('mallang_difference_submissions') || '[]');
        localSubs.unshift(submission);
        localStorage.setItem('mallang_difference_submissions', JSON.stringify(localSubs.slice(0, 50)));
    } catch(e) { console.error('LocalStorage save error:', e); }
    
    // 2. 구글 시트로 데이터 전송 (Engage 앱과 같은 구글 스프레드시트 앱 사용)
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyzb3lA91_whdGFFPj4auB9p3n_LOkyDT8aT2zBWxBP7TbffIIwUolntzyCG-DR7DlrDg/exec";
    
    const payload = {
        when: new Date().toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" }),
        profile: {
            cls: classVal,
            name: nameVal,
            relation: "그림비교제출"
        },
        desc: `[비교] 1번째: ${compareState.first.character}/${compareState.first.background}/${getActionKoreanName(compareState.first.action)} vs 2번째: ${compareState.second.character}/${compareState.second.background}/${getActionKoreanName(compareState.second.action)}. 차이점: ${textVal}`,
        card: "그림비교",
        score: 10,
        verdict: "green"
    };

    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });
        
        submitResultMsg.textContent = i18n.submitResultMsgSuccess;
        submitResultMsg.className = 'submit-success-message';
        submitResultMsg.removeAttribute('hidden');
        submitDiffBtn.textContent = i18n.submitDiffBtnSuccess;
        submitDiffBtn.style.background = '#10b981';
        submitDiffBtn.style.boxShadow = 'none';
        
        // 제출 후 입력 비활성화
        differenceInput.disabled = true;
        submitClass.disabled = true;
        submitName.disabled = true;
    } catch (error) {
        console.error('Submit error:', error);
        // 네트워크 에러가 나더라도 localStorage에 정상 저장되었으므로 완료 메시지 노출
        submitResultMsg.textContent = i18n.submitResultMsgLocal;
        submitResultMsg.className = 'submit-success-message';
        submitResultMsg.removeAttribute('hidden');
        submitDiffBtn.textContent = i18n.submitDiffBtnSuccess;
        submitDiffBtn.style.background = '#10b981';
        submitDiffBtn.style.boxShadow = 'none';
        
        differenceInput.disabled = true;
        submitClass.disabled = true;
        submitName.disabled = true;
    }
});

// 초기 로드 시 실행
checkAuth();

// 언어 선택 기능 추가
document.querySelectorAll('.lang-btn-sub').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.lang-btn-sub').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        localStorage.setItem('combination_lang', btn.dataset.lang);
        applyLanguage();
    });
});

// localStorage 값에 따라 초기화
const savedLang = localStorage.getItem('combination_lang') || 'ko';
const activeBtn = document.querySelector(`.lang-btn-sub[data-lang="${savedLang}"]`);
if (activeBtn) {
    document.querySelectorAll('.lang-btn-sub').forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
}
applyLanguage();
