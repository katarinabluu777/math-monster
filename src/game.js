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

const levelScreen =
  document.getElementById("levelScreen");

const shopScreen =
  document.getElementById("shopScreen");

const shopStarCount =
  document.getElementById("shopStarCount");

const weaponGrid =
  document.getElementById("weaponGrid");

const equippedWeaponIcon =
  document.getElementById("equippedWeaponIcon");

const equippedWeaponName =
  document.getElementById("equippedWeaponName");

const equippedWeaponAttack =
  document.getElementById("equippedWeaponAttack");

const unequipBtn =
  document.getElementById("unequipBtn");

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

const weapons = [
  { id: "wood_sword", name: "나무 검", attack: 2, price: 5, icon: "🗡️" },
  { id: "stone_sword", name: "돌 검", attack: 3, price: 15, icon: "⚔️" },
  { id: "iron_sword", name: "철 검", attack: 5, price: 25, icon: "⚔️" },
  { id: "diamond_sword", name: "다이아 검", attack: 8, price: 50, icon: "💎" },
  { id: "emerald_sword", name: "에메랄드 검", attack: 11, price: 120, icon: "💚" },
  { id: "nether_sword", name: "네더 검", attack: 15, price: 170, icon: "🔥" },
  { id: "ultimate_sword", name: "종결 검", attack: 25, price: 300, icon: "🌟" }
];

let currentWorld = 1;
let profile = null;
let shopBusy = false;

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

    let {
      data: profileData,
      error: profileError
    } = await supabase
      .from("profiles")
      .select(
        "id, email, stars, level, purchased_weapons, equipped_weapon"
      )
      .eq("id", user.id)
      .maybeSingle();

    const shopColumnsAreMissing =
      profileError &&
      (
        profileError.code === "42703" ||
        /purchased_weapons|equipped_weapon/.test(
          profileError.message || ""
        )
      );

    if (shopColumnsAreMissing) {
      const fallbackResult = await supabase
        .from("profiles")
        .select("id, email, stars, level")
        .eq("id", user.id)
        .maybeSingle();

      profileData = fallbackResult.data;
      profileError = fallbackResult.error;
    }

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
    `월드 ${currentWorld} : ${worlds[currentWorld - 1]}`;

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

  const equippedWeapon = weapons.find(
    (weapon) =>
      weapon.id === profile?.equipped_weapon
  );

  sessionStorage.setItem(
    "weaponAttackBonus",
    String(equippedWeapon?.attack || 0)
  );

  /*
    세 번째 전투 페이지로 이동합니다.
  */
  window.location.href =
    "/battle.html";
}

/* 상점 */

function showShop() {
  if (!profile) {
    return;
  }

  levelScreen.classList.add("hidden");
  shopScreen.classList.remove("hidden");
  renderShop();
}

function closeShop() {
  shopScreen.classList.add("hidden");
  levelScreen.classList.remove("hidden");
}

function renderShop() {
  if (!profile) {
    return;
  }

  const purchasedWeapons = Array.isArray(
    profile.purchased_weapons
  )
    ? profile.purchased_weapons
    : [];

  const equippedWeapon = weapons.find(
    (weapon) =>
      weapon.id === profile.equipped_weapon
  );

  stars.textContent = profile.stars;
  shopStarCount.textContent = profile.stars;
  equippedWeaponIcon.textContent =
    equippedWeapon?.icon || "🚫";
  equippedWeaponName.textContent =
    equippedWeapon?.name || "장착한 검 없음";
  equippedWeaponAttack.textContent =
    equippedWeapon?.attack || 0;
  unequipBtn.disabled = shopBusy || !equippedWeapon;

  weaponGrid.innerHTML = "";

  for (const weapon of weapons) {
    const owned = purchasedWeapons.includes(
      weapon.id
    );
    const equipped =
      profile.equipped_weapon === weapon.id;

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
        () => updateEquippedWeapon(weapon.id)
      );
    } else {
      const canAfford = profile.stars >= weapon.price;
      button.textContent = canAfford
        ? "구매하기"
        : "별 부족";
      button.disabled = shopBusy || !canAfford;
      button.addEventListener(
        "click",
        () => purchaseWeapon(weapon)
      );
    }

    card.append(icon, name, attack, price, button);
    weaponGrid.appendChild(card);
  }
}

function applyShopData(data) {
  profile.stars = Number(data.stars) || 0;
  profile.purchased_weapons =
    Array.isArray(data.purchased_weapons)
      ? data.purchased_weapons
      : [];
  profile.equipped_weapon =
    data.equipped_weapon || null;
}

async function purchaseWeapon(weapon) {
  if (shopBusy || !profile) {
    return;
  }

  shopBusy = true;
  renderShop();

  try {
    const { data, error } = await supabase.rpc(
      "purchase_weapon",
      { p_weapon_id: weapon.id }
    );

    if (error) {
      throw error;
    }

    applyShopData(data);
    alert(`${weapon.name}을(를) 구매했습니다!`);
  } catch (error) {
    console.error(error);
    alert(`구매 실패: ${error.message}`);
  } finally {
    shopBusy = false;
    renderShop();
  }
}

async function updateEquippedWeapon(weaponId) {
  if (shopBusy || !profile) {
    return;
  }

  shopBusy = true;
  renderShop();

  try {
    const { data, error } = await supabase.rpc(
      "equip_weapon",
      { p_weapon_id: weaponId }
    );

    if (error) {
      throw error;
    }

    applyShopData(data);
  } catch (error) {
    console.error(error);
    alert(`장착 실패: ${error.message}`);
  } finally {
    shopBusy = false;
    renderShop();
  }
}

document
  .getElementById("openShopBtn")
  .addEventListener("click", showShop);

document
  .getElementById("bottomShopBtn")
  .addEventListener("click", showShop);

document
  .getElementById("shopBackBtn")
  .addEventListener("click", closeShop);

document
  .getElementById("shopToLevelBtn")
  .addEventListener("click", closeShop);

unequipBtn.addEventListener(
  "click",
  () => updateEquippedWeapon(null)
);

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
