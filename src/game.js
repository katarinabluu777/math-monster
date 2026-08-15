import { createClient } from "@supabase/supabase-js";
import "./style.css";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL;

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Supabase 환경변수가 없습니다."
  );
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.sessionStorage
    }
  }
);

/* HTML 요소 */

const userEmail =
  document.getElementById("userEmail");

const stars =
  document.getElementById("stars");

const playerLevel =
  document.getElementById("playerLevel");

const levelGrid =
  document.getElementById("levelGrid");

const worldButtons =
  document.getElementById("worldButtons");

const worldTitle =
  document.getElementById("worldTitle");

const logoutBtn =
  document.getElementById("logoutBtn");

/* 월드 이름 */

const worlds = [
  "초원의 시작",
  "신비의 숲",
  "뜨거운 사막",
  "얼음 왕국",
  "화산 지대",
  "하늘성",
  "바다 신전",
  "그림자 동굴",
  "드래곤 산",
  "마왕성"
];

let currentWorld = 1;
let profile = null;

start();

/* 페이지 시작 */

async function start() {
  try {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError) {
      console.error(userError);
    }

    if (!user) {
      window.location.href = "/";
      return;
    }

    const {
      data: profileData,
      error: profileError
    } = await supabase
      .from("profiles")
      .select("id, email, stars, level")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(profileError);

      userEmail.textContent =
        "프로필을 불러오지 못했습니다.";

      return;
    }

    if (!profileData) {
      userEmail.textContent =
        "프로필 정보가 없습니다.";

      return;
    }

    profile = profileData;

    userEmail.textContent =
      profile.email || user.email;

    stars.textContent =
      profile.stars ?? 0;

    playerLevel.textContent =
      profile.level ?? 1;

    /*
      사용자의 현재 레벨이 속한 월드를
      처음부터 보여줍니다.
    */
    currentWorld = Math.ceil(
      Number(profile.level || 1) / 20
    );

    currentWorld = Math.max(
      1,
      Math.min(10, currentWorld)
    );

    renderWorldButtons();
    renderLevels();
  } catch (error) {
    console.error(error);

    userEmail.textContent =
      "게임 정보를 불러오는 중 오류가 발생했습니다.";
  }
}

/* 월드 버튼 생성 */

function renderWorldButtons() {
  worldButtons.innerHTML = "";

  for (
    let worldNumber = 1;
    worldNumber <= 10;
    worldNumber++
  ) {
    const button =
      document.createElement("button");

    button.type = "button";
    button.textContent =
      `월드 ${worldNumber}`;

    if (worldNumber === currentWorld) {
      button.classList.add("active-world");
    }

    button.addEventListener(
      "click",
      () => {
        currentWorld = worldNumber;

        renderWorldButtons();
        renderLevels();
      }
    );

    worldButtons.appendChild(button);
  }
}

/* 선택한 월드의 레벨 생성 */

function renderLevels() {
  if (!profile) {
    return;
  }

  levelGrid.innerHTML = "";

  worldTitle.textContent =
    `월드 ${currentWorld} : ` +
    worlds[currentWorld - 1];

  const startLevel =
    (currentWorld - 1) * 20 + 1;

  const endLevel =
    startLevel + 19;

  const unlockedLevel =
    Number(profile.level) || 1;

  for (
    let level = startLevel;
    level <= endLevel;
    level++
  ) {
    const button =
      document.createElement("button");

    button.type = "button";

    if (level < unlockedLevel) {
      button.innerHTML =
        `✅<br>${level}`;

      button.className =
        "level-btn cleared";
    } else if (level === unlockedLevel) {
      button.innerHTML =
        `▶<br>${level}`;

      button.className =
        "level-btn current";
    } else {
      button.innerHTML =
        `🔒<br>${level}`;

      button.className =
        "level-btn locked";

      button.disabled = true;
    }

    button.addEventListener(
      "click",
      () => {
        if (level <= unlockedLevel) {
          startStage(level);
        }
      }
    );

    levelGrid.appendChild(button);
  }
}

/* 스테이지 선택 후 전투 화면으로 이동 */

function startStage(stage) {
  /*
    선택한 스테이지를 저장합니다.

    전투 페이지에서는 이 값을 읽어서
    같은 stage의 문제를 가져옵니다.
  */
  sessionStorage.setItem(
    "selectedStage",
    String(stage)
  );

  /*
    세 번째 전투 페이지로 이동합니다.
  */
  window.location.href =
    "/battle.html";
}

/* 로그아웃 */

logoutBtn.addEventListener(
  "click",
  async () => {
    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        alert(
          "로그아웃 실패: " +
          error.message
        );

        return;
      }

      /*
        선택했던 스테이지 데이터만 삭제합니다.
        Supabase 세션 저장소 전체를
        직접 clear하지 않습니다.
      */
      sessionStorage.removeItem(
        "selectedStage"
      );

      window.location.href = "/";
    } catch (error) {
      console.error(error);

      alert(
        "로그아웃 중 오류가 발생했습니다."
      );
    }
  }
);