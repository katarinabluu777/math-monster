import { createClient } from "@supabase/supabase-js";
import "./style.css";

/* =========================
   Supabase 환경변수
========================= */

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL;

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY;


/* =========================
   HTML 요소
========================= */

const message =
  document.getElementById("message");

const starCount =
  document.getElementById("starCount");

const loginScreen =
  document.getElementById("loginScreen");

const gameScreen =
  document.getElementById("gameScreen");

const battleScreen =
  document.getElementById("battleScreen");

const shopScreen =
  document.getElementById("shopScreen");

const shopStars =
  document.getElementById("shopStars");

const shopMessage =
  document.getElementById("shopMessage");

const weaponGrid =
  document.getElementById("weaponGrid");

const equippedWeaponIcon =
  document.getElementById("equippedWeaponIcon");

const equippedWeaponName =
  document.getElementById("equippedWeaponName");

const equippedWeaponAttack =
  document.getElementById("equippedWeaponAttack");

const unequipWeaponBtn =
  document.getElementById("unequipWeaponBtn");

const gameUserEmail =
  document.getElementById("gameUserEmail");

const gameStars =
  document.getElementById("gameStars");

const gameLevel =
  document.getElementById("gameLevel");

const levelGrid =
  document.getElementById("levelGrid");

const battleLevelNumber =
  document.getElementById("battleLevelNumber");

const battleStars =
  document.getElementById("battleStars");

const backToLevelsBtn =
  document.getElementById("backToLevelsBtn");

const restartBattleBtn =
  document.getElementById("restartBattleBtn");

const questionBox =
  document.querySelector(
    "#battleScreen .question-box"
  );

const answerInput =
  document.getElementById("answerInput");

const attackBtn =
  document.getElementById("attackBtn");

const battleMessage =
  document.querySelector(
    "#battleScreen .battle-message"
  );

const monsterHpBar =
  document.querySelector(
    "#battleScreen .monster-hp"
  );

const monsterHpText =
  document.querySelector(
    "#battleScreen .monster-card .hp-label span:last-child"
  );

const heroHpBar =
  document.querySelector(
    "#battleScreen .hero-hp"
  );

const heroHpText =
  document.querySelector(
    "#battleScreen .hero-card .hp-label span:last-child"
  );


/* =========================
   게임 기본 설정
========================= */

/*
  실제 화면에 표시되는 레벨은 1~50입니다.
*/
const MAX_LEVEL = 50;

/*
  레벨 50을 클리어하면 profile.level을 51로 저장합니다.

  51의 뜻:
  레벨 1~50을 전부 클리어했다는 뜻입니다.
*/
const ALL_LEVELS_CLEARED = 51;

const QUESTIONS_PER_STAGE = 30;

const MONSTER_MAX_HP = 100;
const HERO_MAX_HP = 100;

const MONSTER_ATTACK_INTERVAL = 2000;
const MONSTER_DAMAGE = 1;

const CLEAR_STAR_REWARD = 10;

const WEAPONS = [
  { id: "wood_sword", name: "나무 검", attack: 2, price: 5, icon: "🗡️" },
  { id: "stone_sword", name: "돌 검", attack: 3, price: 15, icon: "⚔️" },
  { id: "iron_sword", name: "철 검", attack: 5, price: 25, icon: "⚔️" },
  { id: "diamond_sword", name: "다이아 검", attack: 8, price: 50, icon: "💎" },
  { id: "emerald_sword", name: "에메랄드 검", attack: 11, price: 120, icon: "💚" },
  { id: "nether_sword", name: "네더 검", attack: 15, price: 170, icon: "🔥" },
  { id: "ultimate_sword", name: "종결 검", attack: 25, price: 300, icon: "🌟" }
];


/* =========================
   현재 사용자 정보
========================= */

let currentUser = null;
let currentProfile = null;


/* =========================
   현재 전투 정보
========================= */

let selectedLevel = 1;

let battleQuestions = [];
let currentQuestionIndex = 0;

let monsterHp = MONSTER_MAX_HP;
let heroHp = HERO_MAX_HP;

let attackPower = 1;

let monsterAttackTimer = null;

let battleFinished = true;
let battleLoading = false;
let battleRestarting = false;
let battleSaving = false;
let shopBusy = false;


/* =========================
   환경변수 확인
========================= */

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  if (message) {
    message.textContent =
      "Supabase 환경변수가 설정되지 않았습니다.";
  }

  throw new Error(
    "VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY가 없습니다."
  );
}


/* =========================
   Supabase 연결
========================= */

function getAuthStorage() {
  try {
    const testKey =
      "math-monster-storage-test";

    window.localStorage.setItem(
      testKey,
      "ok"
    );
    window.localStorage.removeItem(testKey);

    /*
      기존 sessionStorage 로그인도 한 번만 옮겨서
      브라우저를 다시 열었을 때 자동 로그인합니다.
    */
    for (
      let index = 0;
      index < window.sessionStorage.length;
      index++
    ) {
      const key =
        window.sessionStorage.key(index);

      if (
        key?.startsWith("sb-") &&
        key.endsWith("-auth-token") &&
        !window.localStorage.getItem(key)
      ) {
        const value =
          window.sessionStorage.getItem(key);

        if (value) {
          window.localStorage.setItem(
            key,
            value
          );
        }
      }
    }

    return window.localStorage;
  } catch (error) {
    console.warn(
      "자동 로그인 저장소를 사용할 수 없어 현재 탭에서만 로그인합니다.",
      error
    );

    return window.sessionStorage;
  }
}

const authStorage = getAuthStorage();

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: authStorage
    }
  }
);


/* =========================
   버튼 연결
========================= */

document
  .getElementById("loginBtn")
  .addEventListener("click", login);

document
  .getElementById("signupBtn")
  .addEventListener("click", signup);

document
  .getElementById("resetBtn")
  .addEventListener(
    "click",
    resetPassword
  );

document
  .getElementById("googleBtn")
  .addEventListener(
    "click",
    loginWithGoogle
  );

document
  .getElementById("logoutBtn")
  .addEventListener("click", logout);

document
  .getElementById("gameLogoutBtn")
  .addEventListener("click", logout);

backToLevelsBtn.addEventListener(
  "click",
  showLevelScreen
);

restartBattleBtn.addEventListener(
  "click",
  async () => {
    await restartBattle(
      "전투를 처음부터 다시 시작합니다!"
    );
  }
);

attackBtn.addEventListener(
  "click",
  submitAnswer
);

document
  .getElementById("openShopBtn")
  .addEventListener("click", showShopScreen);

document
  .getElementById("closeShopBtn")
  .addEventListener("click", closeShopScreen);

unequipWeaponBtn.addEventListener(
  "click",
  () => equipWeapon(null)
);


/* =========================
   Enter 키 연결
========================= */

answerInput.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitAnswer();
    }
  }
);

document
  .getElementById("password")
  .addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        login();
      }
    }
  );


/* =========================
   앱 시작
========================= */

initializeApp();


/* =========================
   로그인 상태 변화 감지
========================= */

supabase.auth.onAuthStateChange(
  (event, session) => {
    console.log("Auth event:", event);

    if (event === "SIGNED_OUT") {
      currentUser = null;
      currentProfile = null;

      stopMonsterAttack();
      resetBattleVariables();
      showLoginScreen();

      return;
    }

    /*
      Google 로그인 후 다시 돌아왔거나
      세션이 새로 만들어진 경우입니다.
    */
    if (
      event === "SIGNED_IN" &&
      session?.user &&
      currentUser?.id !== session.user.id
    ) {
      window.setTimeout(async () => {
        try {
          await loadLoggedInUser(
            session.user
          );
        } catch (error) {
          console.error(error);

          message.textContent =
            error.message ||
            "사용자 정보를 불러오지 못했습니다.";
        }
      }, 0);
    }
  }
);


/* =========================
   최초 로그인 상태 확인
========================= */

async function initializeApp() {
  try {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    if (!session?.user) {
      showLoginScreen();
      return;
    }

    await loadLoggedInUser(
      session.user
    );
  } catch (error) {
    console.error(error);

    message.textContent =
      "로그인 상태 확인 실패: " +
      error.message;

    showLoginScreen();
  }
}


/* =========================
   로그인 사용자 불러오기
========================= */

async function loadLoggedInUser(user) {
  currentUser = user;

  await createProfileIfNotExists(user);
  await loadProfile();
  showGameScreen();
}


/* =========================
   회원가입
========================= */

async function signup() {
  const email = getEmail();
  const password = getPassword();

  if (!email || !password) {
    message.textContent =
      "이메일과 비밀번호를 입력하세요.";

    return;
  }

  if (password.length < 6) {
    message.textContent =
      "비밀번호는 6자 이상이어야 합니다.";

    return;
  }

  message.textContent =
    "회원가입 처리 중...";

  try {
    const { error } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            window.location.origin
        }
      });

    if (error) {
      throw error;
    }

    message.textContent =
      "회원가입 성공! 이메일을 확인한 후 로그인하세요.";
  } catch (error) {
    console.error(error);

    message.textContent =
      "회원가입 실패: " +
      error.message;
  }
}


/* =========================
   이메일 로그인
========================= */

async function login() {
  const email = getEmail();
  const password = getPassword();

  if (!email || !password) {
    message.textContent =
      "이메일과 비밀번호를 입력하세요.";

    return;
  }

  message.textContent =
    "로그인 확인 중...";

  try {
    const { data, error } =
      await supabase.auth
        .signInWithPassword({
          email,
          password
        });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error(
        "로그인 사용자 정보가 없습니다."
      );
    }

    await loadLoggedInUser(
      data.user
    );

    message.textContent = "";
  } catch (error) {
    console.error(error);

    message.textContent =
      "로그인 실패: " +
      error.message;
  }
}


/* =========================
   Google 로그인
========================= */

async function loginWithGoogle() {
  message.textContent =
    "Google 로그인 연결 중...";

  try {
    const { error } =
      await supabase.auth
        .signInWithOAuth({
          provider: "google",
          options: {
            redirectTo:
              window.location.origin
          }
        });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(error);

    message.textContent =
      "Google 로그인 실패: " +
      error.message;
  }
}


/* =========================
   비밀번호 재설정
========================= */

async function resetPassword() {
  const email = getEmail();

  if (!email) {
    message.textContent =
      "이메일을 먼저 입력하세요.";

    return;
  }

  message.textContent =
    "비밀번호 재설정 메일을 보내는 중...";

  try {
    const { error } =
      await supabase.auth
        .resetPasswordForEmail(
          email,
          {
            redirectTo:
              window.location.origin
          }
        );

    if (error) {
      throw error;
    }

    message.textContent =
      "비밀번호 재설정 메일을 보냈습니다.";
  } catch (error) {
    console.error(error);

    message.textContent =
      "비밀번호 찾기 실패: " +
      error.message;
  }
}


/* =========================
   로그아웃
========================= */

async function logout() {
  try {
    stopMonsterAttack();

    const { error } =
      await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    currentUser = null;
    currentProfile = null;
    selectedLevel = 1;

    resetBattleVariables();

    starCount.textContent = "0";

    showLoginScreen();

    message.textContent =
      "로그아웃 완료";
  } catch (error) {
    console.error(error);

    alert(
      "로그아웃 실패: " +
      error.message
    );
  }
}


/* =========================
   프로필 생성
========================= */

async function createProfileIfNotExists(
  user
) {
  const { data, error } =
    await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

  if (error) {
    throw new Error(
      "프로필 확인 실패: " +
      error.message
    );
  }

  /*
    프로필이 이미 있으면 절대로
    레벨이나 별을 초기화하지 않습니다.

    그래서 게임을 나갔다 다시 들어와도
    진행 기록이 유지됩니다.
  */
  if (data) {
    return;
  }

  const { error: insertError } =
    await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        stars: 0,
        level: 1
      });

  if (insertError) {
    throw new Error(
      "프로필 생성 실패: " +
      insertError.message
    );
  }
}


/* =========================
   프로필 불러오기
========================= */

async function loadProfile() {
  if (!currentUser) {
    throw new Error(
      "로그인 사용자가 없습니다."
    );
  }

  let { data, error } =
    await supabase
      .from("profiles")
      .select(
        "email, stars, level, purchased_weapons, equipped_weapon"
      )
      .eq("id", currentUser.id)
      .maybeSingle();

  /*
    상점용 SQL을 아직 실행하지 않은 기존 DB에서도
    로그인과 레벨 선택은 계속 사용할 수 있게 합니다.
  */
  const shopColumnsAreMissing =
    error &&
    (
      error.code === "42703" ||
      /purchased_weapons|equipped_weapon/.test(
        error.message || ""
      )
    );

  if (shopColumnsAreMissing) {
    const fallbackResult = await supabase
      .from("profiles")
      .select("email, stars, level")
      .eq("id", currentUser.id)
      .maybeSingle();

    data = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error) {
    throw new Error(
      "프로필 불러오기 실패: " +
      error.message
    );
  }

  if (!data) {
    throw new Error(
      "프로필 정보가 없습니다."
    );
  }

  currentProfile = {
    email:
      data.email ||
      currentUser.email ||
      "사용자",

    stars:
      Math.max(
        0,
        Number(data.stars) || 0
      ),

    purchasedWeapons:
      Array.isArray(data.purchased_weapons)
        ? data.purchased_weapons
        : [],

    equippedWeapon:
      typeof data.equipped_weapon === "string"
        ? data.equipped_weapon
        : null,

    /*
      1~51까지 허용합니다.

      51은 레벨 50까지 모두
      완료했다는 뜻입니다.
    */
    level:
      Math.max(
        1,
        Math.min(
          ALL_LEVELS_CLEARED,
          Number(data.level) || 1
        )
      )
  };

  updateProfileDisplay();
}


/* =========================
   프로필 화면 표시
========================= */

function updateProfileDisplay() {
  if (!currentProfile) {
    return;
  }

  const displayedLevel =
    Math.min(
      currentProfile.level,
      MAX_LEVEL
    );

  gameUserEmail.textContent =
    currentProfile.email;

  gameStars.textContent =
    currentProfile.stars;

  gameLevel.textContent =
    currentProfile.level ===
    ALL_LEVELS_CLEARED
      ? "50 완료"
      : displayedLevel;

  starCount.textContent =
    currentProfile.stars;

  battleStars.textContent =
    currentProfile.stars;

  shopStars.textContent =
    currentProfile.stars;
}


/* =========================
   로그인 화면 표시
========================= */

function showLoginScreen() {
  stopMonsterAttack();

  gameScreen.classList.add(
    "hidden"
  );

  battleScreen.classList.add(
    "hidden"
  );

  shopScreen.classList.add(
    "hidden"
  );

  loginScreen.classList.remove(
    "hidden"
  );

  answerInput.disabled = true;
  attackBtn.disabled = true;

  document
    .getElementById("password")
    .value = "";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================
   레벨 선택 화면 표시
========================= */

function showGameScreen() {
  if (!currentProfile) {
    return;
  }

  stopMonsterAttack();

  battleFinished = true;

  loginScreen.classList.add(
    "hidden"
  );

  battleScreen.classList.add(
    "hidden"
  );

  shopScreen.classList.add(
    "hidden"
  );

  gameScreen.classList.remove(
    "hidden"
  );

  answerInput.disabled = true;
  attackBtn.disabled = true;

  updateProfileDisplay();

  renderLevels(
    currentProfile.level
  );

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================
   레벨 선택 화면으로 돌아가기
========================= */

function showLevelScreen() {
  stopMonsterAttack();

  battleFinished = true;
  battleLoading = false;
  battleRestarting = false;

  answerInput.disabled = true;
  attackBtn.disabled = true;
  answerInput.value = "";

  showGameScreen();
}


/* =========================
   무기 상점
========================= */

function getWeapon(weaponId) {
  return WEAPONS.find(
    (weapon) => weapon.id === weaponId
  ) || null;
}

function getEquippedWeaponAttack() {
  return getWeapon(
    currentProfile?.equippedWeapon
  )?.attack || 0;
}

function showShopScreen() {
  if (!currentProfile) {
    return;
  }

  stopMonsterAttack();
  battleFinished = true;

  loginScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  battleScreen.classList.add("hidden");
  shopScreen.classList.remove("hidden");

  shopMessage.textContent = "";
  renderShop();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function closeShopScreen() {
  showGameScreen();
}

function renderShop() {
  shopStars.textContent =
    currentProfile?.stars || 0;

  const equippedWeapon =
    getWeapon(currentProfile?.equippedWeapon);

  equippedWeaponIcon.textContent =
    equippedWeapon?.icon || "🚫";

  equippedWeaponName.textContent =
    equippedWeapon?.name || "장착한 검 없음";

  equippedWeaponAttack.textContent =
    equippedWeapon?.attack || 0;

  unequipWeaponBtn.disabled =
    shopBusy || !equippedWeapon || !currentProfile;

  weaponGrid.innerHTML = "";

  for (const weapon of WEAPONS) {
    const owned =
      currentProfile?.purchasedWeapons?.includes(
        weapon.id
      ) || false;

    const equipped =
      currentProfile?.equippedWeapon === weapon.id;

    const canAfford =
      (currentProfile?.stars || 0) >= weapon.price;

    const card = document.createElement("article");
    card.className = "weapon-card";

    if (equipped) {
      card.classList.add("equipped");
    }

    const icon = document.createElement("div");
    icon.className = "weapon-icon";
    icon.textContent = weapon.icon;

    const name = document.createElement("h3");
    name.textContent = weapon.name;

    const attack = document.createElement("p");
    attack.className = "weapon-attack";
    attack.textContent = `공격력 +${weapon.attack}`;

    const price = document.createElement("p");
    price.className = "weapon-price";
    price.textContent = `⭐ ${weapon.price}개`;

    const button = document.createElement("button");
    button.type = "button";

    if (equipped) {
      button.textContent = "장착 중";
      button.disabled = true;
    } else if (owned) {
      button.textContent = "장착하기";
      button.disabled = shopBusy;
      button.addEventListener(
        "click",
        () => equipWeapon(weapon.id)
      );
    } else {
      button.textContent = canAfford
        ? "구매하기"
        : "별 부족";
      button.disabled = shopBusy || !canAfford;
      button.addEventListener(
        "click",
        () => purchaseWeapon(weapon)
      );
    }

    card.append(
      icon,
      name,
      attack,
      price,
      button
    );

    weaponGrid.appendChild(card);
  }
}

async function purchaseWeapon(weapon) {
  if (shopBusy || !currentProfile) {
    return;
  }

  shopBusy = true;
  shopMessage.textContent =
    `${weapon.name} 구매 중...`;
  renderShop();

  try {
    let { error } = await supabase.rpc(
      "purchase_weapon",
      { p_weapon_id: weapon.id }
    );

    const purchaseFunctionIsMissing =
      error &&
      (
        error.code === "PGRST202" ||
        /purchase_weapon.*schema cache/i.test(
          error.message || ""
        )
      );

    if (purchaseFunctionIsMissing) {
      const purchasedWeapons = [
        ...currentProfile.purchasedWeapons,
        weapon.id
      ];

      const fallbackResult = await supabase
        .from("profiles")
        .update({
          stars:
            currentProfile.stars - weapon.price,
          purchased_weapons: purchasedWeapons
        })
        .eq("id", currentUser.id)
        .eq("stars", currentProfile.stars)
        .select("stars")
        .maybeSingle();

      error = fallbackResult.error;

      if (!error && !fallbackResult.data) {
        throw new Error(
          "별 정보가 변경되었습니다. 상점을 다시 열어 주세요."
        );
      }
    }

    if (error) {
      if (
        error.code === "42703" ||
        error.code === "PGRST204" ||
        /purchased_weapons/.test(
          error.message || ""
        )
      ) {
        throw new Error(
          "상점 데이터베이스 설정이 필요합니다. 최신 supabase.sql을 실행해 주세요."
        );
      }

      throw error;
    }

    await loadProfile();
    shopMessage.textContent =
      `${weapon.name}을(를) 구매했습니다!`;
  } catch (error) {
    console.error(error);
    shopMessage.textContent =
      `구매 실패: ${error.message}`;
  } finally {
    shopBusy = false;
    renderShop();
  }
}

async function equipWeapon(weaponId) {
  if (shopBusy || !currentProfile) {
    return;
  }

  shopBusy = true;
  shopMessage.textContent = weaponId
    ? "검을 장착하는 중..."
    : "장착을 해제하는 중...";
  renderShop();

  try {
    const { error } = await supabase.rpc(
      "equip_weapon",
      { p_weapon_id: weaponId }
    );

    if (error) {
      throw error;
    }

    await loadProfile();

    const weapon = getWeapon(weaponId);
    shopMessage.textContent = weapon
      ? `${weapon.name}을(를) 장착했습니다!`
      : "검 장착을 해제했습니다.";
  } catch (error) {
    console.error(error);
    shopMessage.textContent =
      `장착 실패: ${error.message}`;
  } finally {
    shopBusy = false;
    renderShop();
  }
}


/* =========================
   전투 화면 표시
========================= */

async function showBattleScreen(level) {
  if (!currentProfile) {
    return;
  }

  const highestPlayableLevel =
    Math.min(
      currentProfile.level,
      MAX_LEVEL
    );

  /*
    아직 열리지 않은 레벨에는
    들어갈 수 없습니다.
  */
  if (
    level < 1 ||
    level > highestPlayableLevel ||
    level > MAX_LEVEL
  ) {
    alert(
      "아직 잠긴 레벨입니다."
    );

    return;
  }

  selectedLevel = level;

  battleLevelNumber.textContent =
    selectedLevel;

  battleStars.textContent =
    currentProfile.stars;

  loginScreen.classList.add(
    "hidden"
  );

  gameScreen.classList.add(
    "hidden"
  );

  shopScreen.classList.add(
    "hidden"
  );

  battleScreen.classList.remove(
    "hidden"
  );

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  await startBattle();
}


/* =========================
   전투 시작
========================= */

async function startBattle() {
  if (
    battleLoading ||
    battleRestarting ||
    battleSaving
  ) {
    return;
  }

  stopMonsterAttack();

  battleLoading = true;
  battleFinished = false;

  answerInput.disabled = true;
  attackBtn.disabled = true;
  answerInput.value = "";

  questionBox.textContent =
    "문제를 불러오는 중...";

  battleMessage.textContent =
    `${getLevelCategory(selectedLevel)} 전투 준비 중...`;

  try {
    const { data, error } =
      await supabase
        .from("questions")
        .select(
          "question, answer"
        )
        .eq(
          "stage",
          selectedLevel
        )
        .limit(
          QUESTIONS_PER_STAGE
        );

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      questionBox.textContent =
        `레벨 ${selectedLevel}의 문제가 없습니다.`;

      battleMessage.textContent =
        "Supabase questions 테이블을 확인하세요.";

      battleFinished = true;
      return;
    }

    /*
      문제 순서를 섞은 후
      총 30문제를 만듭니다.
    */
    battleQuestions =
      createThirtyQuestionList(data);

    currentQuestionIndex = 0;

    monsterHp =
      MONSTER_MAX_HP;

    heroHp =
      HERO_MAX_HP;

    attackPower =
      1 + getEquippedWeaponAttack();

    battleFinished = false;

    updateMonsterHp();
    updateHeroHp();
    showCurrentQuestion();

    answerInput.disabled = false;
    attackBtn.disabled = false;

    startMonsterAttack();

    answerInput.focus();
  } catch (error) {
    console.error(error);

    questionBox.textContent =
      "문제를 불러오지 못했습니다.";

    battleMessage.textContent =
      "오류: " + error.message;

    battleFinished = true;
  } finally {
    battleLoading = false;
  }
}


/* =========================
   문제 30개 만들기
========================= */

function createThirtyQuestionList(
  sourceQuestions
) {
  const shuffledQuestions =
    shuffleArray(sourceQuestions);

  const result = [];

  for (
    let index = 0;
    index < QUESTIONS_PER_STAGE;
    index++
  ) {
    const sourceIndex =
      index %
      shuffledQuestions.length;

    result.push({
      question:
        shuffledQuestions[
          sourceIndex
        ].question,

      answer:
        shuffledQuestions[
          sourceIndex
        ].answer
    });
  }

  return result;
}


/* =========================
   문제 순서 섞기
========================= */

function shuffleArray(array) {
  const copiedArray = [...array];

  for (
    let index =
      copiedArray.length - 1;
    index > 0;
    index--
  ) {
    const randomIndex =
      Math.floor(
        Math.random() *
        (index + 1)
      );

    [
      copiedArray[index],
      copiedArray[randomIndex]
    ] = [
      copiedArray[randomIndex],
      copiedArray[index]
    ];
  }

  return copiedArray;
}


/* =========================
   현재 문제 표시
========================= */

function showCurrentQuestion() {
  if (
    battleFinished ||
    currentQuestionIndex >=
      QUESTIONS_PER_STAGE
  ) {
    return;
  }

  const currentQuestion =
    battleQuestions[
      currentQuestionIndex
    ];

  if (!currentQuestion) {
    return;
  }

  questionBox.textContent =
    currentQuestion.question;

  battleMessage.textContent =
    `${getLevelCategory(selectedLevel)} · ` +
    `문제 ${currentQuestionIndex + 1} / ` +
    `${QUESTIONS_PER_STAGE} · ` +
    `공격력 ${attackPower}`;

  answerInput.value = "";
  answerInput.focus();
}


/* =========================
   답 제출
========================= */

async function submitAnswer() {
  if (
    battleFinished ||
    battleLoading ||
    battleRestarting ||
    battleSaving ||
    answerInput.disabled
  ) {
    return;
  }

  const inputText =
    answerInput.value.trim();

  if (inputText === "") {
    answerInput.focus();
    return;
  }

  const currentQuestion =
    battleQuestions[
      currentQuestionIndex
    ];

  if (!currentQuestion) {
    return;
  }

  const userAnswer =
    Number(inputText);

  const correctAnswer =
    Number(currentQuestion.answer);

  if (
    Number.isNaN(userAnswer) ||
    Number.isNaN(correctAnswer)
  ) {
    answerInput.focus();
    answerInput.select();
    return;
  }

  /*
    빠르게 여러 번 누르는 것을 막습니다.
  */
  answerInput.disabled = true;
  attackBtn.disabled = true;

  if (userAnswer === correctAnswer) {
    /*
      현재 공격력만큼 피해를 줍니다.
    */
    const damage = attackPower;

    monsterHp = Math.max(
      0,
      monsterHp - damage
    );

    /*
      정답을 맞힌 뒤 다음 공격력이
      1 증가합니다.
    */
    attackPower += 1;

    updateMonsterHp();

    battleMessage.textContent =
      `정답! 몬스터에게 ${damage} 피해를 주었습니다!`;

    /*
      몬스터 HP가 0이면 승리입니다.
    */
    if (monsterHp <= 0) {
      await finishBattle();
      return;
    }
  } else {
    /*
      오답이면 피해 없이
      다음 문제로 이동합니다.
    */
    battleMessage.textContent =
      "오답입니다! 다음 문제로 이동합니다.";
  }

  currentQuestionIndex += 1;

  /*
    30문제를 다 풀었는데
    몬스터가 살아 있으면 같은 레벨 재시작
  */
  if (
    currentQuestionIndex >=
    QUESTIONS_PER_STAGE
  ) {
    await restartBattle(
      "30문제를 모두 풀었지만 몬스터가 살아 있습니다. 같은 레벨을 다시 시작합니다!"
    );

    return;
  }

  await wait(350);

  if (
    battleFinished ||
    battleRestarting
  ) {
    return;
  }

  showCurrentQuestion();

  answerInput.disabled = false;
  attackBtn.disabled = false;

  answerInput.focus();
}


/* =========================
   몬스터 자동 공격 시작
========================= */

function startMonsterAttack() {
  stopMonsterAttack();

  monsterAttackTimer =
    window.setInterval(() => {
      if (
        battleFinished ||
        battleLoading ||
        battleRestarting ||
        battleSaving ||
        battleScreen.classList
          .contains("hidden")
      ) {
        return;
      }

      heroHp = Math.max(
        0,
        heroHp - MONSTER_DAMAGE
      );

      updateHeroHp();

      /*
        용사 HP가 0이면
        같은 레벨을 다시 시작합니다.
      */
      if (heroHp <= 0) {
        restartBattle(
          "용사가 쓰러졌습니다. 같은 레벨을 다시 시작합니다!"
        );
      }
    }, MONSTER_ATTACK_INTERVAL);
}


/* =========================
   몬스터 자동 공격 정지
========================= */

function stopMonsterAttack() {
  if (monsterAttackTimer !== null) {
    window.clearInterval(
      monsterAttackTimer
    );

    monsterAttackTimer = null;
  }
}


/* =========================
   같은 레벨 다시 시작
========================= */

async function restartBattle(reason) {
  if (
    battleRestarting ||
    battleLoading ||
    battleSaving
  ) {
    return;
  }

  battleRestarting = true;
  battleFinished = true;

  stopMonsterAttack();

  answerInput.disabled = true;
  attackBtn.disabled = true;
  answerInput.value = "";

  questionBox.textContent =
    "전투를 다시 준비하고 있습니다.";

  battleMessage.textContent =
    reason;

  await wait(1000);

  battleRestarting = false;

  await startBattle();
}


/* =========================
   몬스터 처치 및 진행 저장
========================= */

async function finishBattle() {
  if (
    battleFinished ||
    battleSaving
  ) {
    return;
  }

  battleFinished = true;
  battleSaving = true;

  stopMonsterAttack();

  answerInput.disabled = true;
  attackBtn.disabled = true;
  answerInput.value = "";

  questionBox.textContent =
    "몬스터를 물리쳤습니다!";

  /*
    currentProfile.level은
    아직 클리어하지 않은 현재 최고 레벨입니다.

    예:
    profile.level = 2
    레벨 1은 완료
    레벨 2가 현재 진행 레벨
  */
  const isFirstClear =
    selectedLevel ===
    currentProfile.level;

  /*
    이미 클리어한 예전 레벨을
    다시 플레이한 경우입니다.
  */
  if (!isFirstClear) {
    battleMessage.textContent =
      `레벨 ${selectedLevel} 재도전 성공!`;

    battleSaving = false;

    await wait(1200);

    showGameScreen();
    return;
  }

  const newStars =
    currentProfile.stars +
    CLEAR_STAR_REWARD;

  /*
    레벨 50을 클리어한 경우에는
    level 값을 51로 저장합니다.

    이를 통해 레벨 50 보상을
    반복해서 받는 것을 막습니다.
  */
  const nextLevel =
    selectedLevel >= MAX_LEVEL
      ? ALL_LEVELS_CLEARED
      : selectedLevel + 1;

  try {
    const { error } =
      await supabase
        .from("profiles")
        .update({
          stars: newStars,
          level: nextLevel
        })
        .eq(
          "id",
          currentUser.id
        );

    if (error) {
      throw error;
    }

    currentProfile.stars =
      newStars;

    currentProfile.level =
      nextLevel;

    updateProfileDisplay();

    if (
      selectedLevel === MAX_LEVEL
    ) {
      battleMessage.textContent =
        `최종 레벨 클리어! 모든 레벨을 완료했습니다! 별 ${CLEAR_STAR_REWARD}개 획득!`;
    } else {
      battleMessage.textContent =
        `승리! 별 ${CLEAR_STAR_REWARD}개 획득! 레벨 ${nextLevel} 해제!`;
    }

    battleSaving = false;

    await wait(1500);

    showGameScreen();
  } catch (error) {
    console.error(error);

    battleSaving = false;

    battleMessage.textContent =
      "몬스터를 물리쳤지만 진행 상황 저장에 실패했습니다.";

    alert(
      "진행 상황 저장 실패: " +
      error.message
    );
  }
}


/* =========================
   몬스터 HP 표시
========================= */

function updateMonsterHp() {
  const hpPercent =
    Math.max(
      0,
      Math.min(
        100,
        (
          monsterHp /
          MONSTER_MAX_HP
        ) * 100
      )
    );

  if (monsterHpBar) {
    monsterHpBar.style.width =
      `${hpPercent}%`;
  }

  if (monsterHpText) {
    monsterHpText.textContent =
      `${monsterHp} / ${MONSTER_MAX_HP}`;
  }
}


/* =========================
   용사 HP 표시
========================= */

function updateHeroHp() {
  const hpPercent =
    Math.max(
      0,
      Math.min(
        100,
        (
          heroHp /
          HERO_MAX_HP
        ) * 100
      )
    );

  if (heroHpBar) {
    heroHpBar.style.width =
      `${hpPercent}%`;
  }

  if (heroHpText) {
    heroHpText.textContent =
      `${heroHp} / ${HERO_MAX_HP}`;
  }
}


/* =========================
   전투 변수 초기화
========================= */

function resetBattleVariables() {
  stopMonsterAttack();

  battleQuestions = [];
  currentQuestionIndex = 0;

  monsterHp =
    MONSTER_MAX_HP;

  heroHp =
    HERO_MAX_HP;

  attackPower =
    1 + getEquippedWeaponAttack();

  battleFinished = true;
  battleLoading = false;
  battleRestarting = false;
  battleSaving = false;

  updateMonsterHp();
  updateHeroHp();
}


/* =========================
   레벨별 문제 종류
========================= */

function getLevelCategory(level) {
  if (level >= 1 && level <= 10) {
    return "덧셈";
  }

  if (level >= 11 && level <= 20) {
    return "뺄셈";
  }

  if (level >= 21 && level <= 30) {
    return "곱셈";
  }

  if (level >= 31 && level <= 40) {
    return "나눗셈";
  }

  return "혼합 계산";
}


/* =========================
   레벨 1~50 생성
========================= */

function renderLevels(currentLevel) {
  levelGrid.innerHTML = "";

  /*
    currentLevel이 51이면
    레벨 1~50을 모두 완료한 상태입니다.
  */
  const safeCurrentLevel =
    Math.max(
      1,
      Math.min(
        ALL_LEVELS_CLEARED,
        Number(currentLevel) || 1
      )
    );

  for (
    let level = 1;
    level <= MAX_LEVEL;
    level++
  ) {
    const button =
      document.createElement(
        "button"
      );

    button.type = "button";

    button.classList.add(
      "level-button"
    );

    const category =
      getLevelCategory(level);

    /*
      현재 저장 레벨보다 낮으면
      이미 클리어한 레벨입니다.
    */
    if (level < safeCurrentLevel) {
      button.innerHTML =
        `<span>✅</span>
         <strong>${level}</strong>
         <small>${category}</small>`;

      button.classList.add(
        "completed"
      );
    } else if (
      level === safeCurrentLevel
    ) {
      button.innerHTML =
        `<span>▶</span>
         <strong>${level}</strong>
         <small>${category}</small>`;

      button.classList.add(
        "current"
      );
    } else {
      button.innerHTML =
        `<span>🔒</span>
         <strong>${level}</strong>
         <small>${category}</small>`;

      button.classList.add(
        "locked"
      );

      button.disabled = true;
    }

    button.addEventListener(
      "click",
      () => {
        const highestPlayableLevel =
          Math.min(
            safeCurrentLevel,
            MAX_LEVEL
          );

        if (
          level <= highestPlayableLevel
        ) {
          showBattleScreen(level);
        }
      }
    );

    levelGrid.appendChild(
      button
    );
  }
}


/* =========================
   로그인 입력값
========================= */

function getEmail() {
  return document
    .getElementById("email")
    .value
    .trim();
}

function getPassword() {
  return document
    .getElementById("password")
    .value;
}


/* =========================
   기다리기
========================= */

function wait(milliseconds) {
  return new Promise(
    (resolve) => {
      window.setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}
