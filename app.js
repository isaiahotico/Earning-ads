

`javascript
"use strict";

const STAT_INFO = {
  hp: {
    label: "HP",
    description: "Each point adds 10 maximum health."
  },
  damage: {
    label: "Damage",
    description: "Adds power to your attacks."
  },
  speed: {
    label: "Speed",
    description: "Faster fighters get the opening hit."
  },
  defence: {
    label: "Defence",
    description: "Reduces incoming attack damage."
  },
  critical: {
    label: "Critical",
    description: "Each point adds 2% critical chance."
  },
  dodge: {
    label: "Dodge",
    description: "Each point adds 1.5% chance to evade."
  },
  regeneration: {
    label: "Regeneration",
    description: "Recover health at the start of your turn."
  }
};

const STAT_KEYS = Object.keys(STAT_INFO);
const STORAGE_KEY = "cardbound-save-v1";

const MONSTERS = {
  small: [
    { name: "Mossfang", emoji: "🐺", title: "Thicket Stalker", hp: 72, damage: 8, speed: 9, defence: 4, critical: 5, dodge: 5, regeneration: 2 },
    { name: "Cave Imp", emoji: "👺", title: "Cavern Trickster", hp: 65, damage: 9, speed: 12, defence: 3, critical: 8, dodge: 8, regeneration: 1 },
    { name: "Pebble Golem", emoji: "🗿", title: "Little Stone Guard", hp: 90, damage: 7, speed: 5, defence: 8, critical: 3, dodge: 2, regeneration: 3 },
    { name: "Ember Slime", emoji: "🔥", title: "Flickering Ooze", hp: 70, damage: 8, speed: 8, defence: 5, critical: 6, dodge: 6, regeneration: 4 }
  ],
  medium: [
    { name: "Grave Knight", emoji: "💀", title: "Oathbound Sentinel", hp: 112, damage: 13, speed: 10, defence: 9, critical: 9, dodge: 5, regeneration: 3 },
    { name: "Storm Harpy", emoji: "🦅", title: "Lightning Wing", hp: 94, damage: 14, speed: 16, defence: 5, critical: 13, dodge: 12, regeneration: 2 },
    { name: "Ironhide Brute", emoji: "🧌", title: "Bridge Breaker", hp: 135, damage: 12, speed: 7, defence: 13, critical: 6, dodge: 3, regeneration: 4 },
    { name: "Frost Witch", emoji: "🧙", title: "Whiteout Weaver", hp: 102, damage: 12, speed: 12, defence: 7, critical: 12, dodge: 8, regeneration: 5 }
  ],
  large: [
    { name: "Abyssal Dragon", emoji: "🐉", title: "The Dread Below", hp: 178, damage: 19, speed: 13, defence: 12, critical: 15, dodge: 8, regeneration: 6 },
    { name: "Titan of Ash", emoji: "👹", title: "World-Ender", hp: 205, damage: 17, speed: 9, defence: 18, critical: 10, dodge: 4, regeneration: 8 },
    { name: "Void Reaper", emoji: "☠️", title: "Last Light Hunter", hp: 158, damage: 21, speed: 18, defence: 10, critical: 18, dodge: 14, regeneration: 5 },
    { name: "Elder Chimera", emoji: "🦁", title: "Threefold Terror", hp: 185, damage: 18, speed: 14, defence: 13, critical: 14, dodge: 10, regeneration: 7 }
  ]
};

function freshState() {
  const stats = {};
  for (const key of STAT_KEYS) stats[key] = 10;

  return {
    stats,
    points: 0,
    wins: 0,
    losses: 0,
    currentHp: 100,
    enemy: null,
    guarding: false,
    history: [],
    log: ["Welcome, duelist. Search the dungeon when you are ready."]
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !saved.stats) return freshState();

const state = freshState();
    state.stats = { ...state.stats, ...saved.stats };
    state.points = Number(saved.points) || 0;
    state.wins = Number(saved.wins) || 0;
    state.losses = Number(saved.losses) || 0;
    state.history = Array.isArray(saved.history) ? saved.history.slice(0, 8) : [];
    state.log = Array.isArray(saved.log) ? saved.log.slice(0, 30) : state.log;
    state.enemy = saved.enemy || null;
    state.guarding = Boolean(saved.guarding);

    const maxHp = state.stats.hp * 10;
    state.currentHp = Math.max(1, Math.min(Number(saved.currentHp) || maxHp, maxHp));

    // Don't reload into an unwinnable saved encounter with zero health.
    if (state.currentHp <= 0) state.currentHp = maxHp;

    return state;
  } catch {
    return freshState();
  }
}

let state = loadState();

const playerCard = document.getElementById("player-card");
const enemyCard = document.getElementById("enemy-card");
const battleLog = document.getElementById("battle-log");
const historyList = document.getElementById("history-list");
const battleStatus = document.getElementById("battle-status");

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function addLog(message, type = "") {
  state.log.unshift({ message, type });
  state.log = state.log.slice(0, 30);
}

function formatStat(key, value) {
  if (key === "critical") return ${Math.min(value * 2, 75)}%;
  if (key === "dodge") return ${Math.min(value * 1.5, 35)}%;
  if (key === "hp") return ${value} <span class="muted">(${value * 10} max)</span>;
  if (key === "regeneration") return ${Math.floor(value / 5)} / turn;
  return String(value);
}

function makeStatsMarkup(stats, isPlayer) {
  return STAT_KEYS.map(key => {
    const info = STAT_INFO[key];
    const value = stats[key] ?? 10;
    const upgradeButton = isPlayer
      ? <button class="plus" data-upgrade="${key}" title="Upgrade ${info.label}" aria-label="Upgrade ${info.label}" ${state.points <= 0 ? "disabled" : ""}>+</button>
      : "";

    return `
      <div class="stat" title="${info.description}">
        <div class="stat-left">
          ${upgradeButton}
          <span class="stat-label">${info.label}</span>
        </div>
        <span class="stat-value">${formatStat(key, value)}</span>
      </div>
    `;
  }).join("");
}

function renderPlayer() {
  const maxHp = state.stats.hp * 10;
  const hpPercent = Math.max(0, Math.min(100, (state.currentHp / maxHp) * 100));

  playerCard.innerHTML = `
    <article class="card">
      <div class="card-top">
        <div style="display:flex;gap:13px;align-items:center">
          <div class="avatar" aria-hidden="true">🧑‍🚀</div>
          <div>
            <div class="name-line">
              <h3>Dungeon Duelist</h3>
              <span class="rarity">Adventurer</span>
            </div>
            <p class="card-description">A rising champion, ready to challenge the depths.</p>
          </div>
        </div>
      </div>
      <div class="health-block">
        <div class="health-label">
          <span>Health</span>
          <span>state.currentHp / {maxHp}</span>
        </div>
        <div class="health-track"><div class="health-fill" style="width:${hpPercent}%"></div></div>
      </div>
      <div class="stats-grid">${makeStatsMarkup(state.stats, true)}</div>
    </article>
  `;
}

function renderEnemy() {
  if (!state.enemy) {
    enemyCard.innerHTML = `
      <div class="enemy-empty">
        <div><span class="empty-icon">🕯️</span>
          <strong>No monster found</strong><br />
          Choose a dungeon tier below to search.
        </div>
      </div>
    `;
    document.getElementById("encounter-badge").textContent = "No opponent";
    return;
  }

const enemy = state.enemy;
  const hpPercent = Math.max(0, Math.min(100, (enemy.currentHp / enemy.maxHp) * 100));

  enemyCard.innerHTML = `
    <article class="card">
      <div class="card-top">
        <div style="display:flex;gap:13px;align-items:center">
          <div class="avatar" aria-hidden="true">${enemy.emoji}</div>
          <div>
            <div class="name-line">
              <h3>${enemy.name}</h3>
              <span class="rarity">enemy.tier · {enemy.title}</span>
            </div>
            <p class="card-description">A dungeon monster blocks your path. Choose your move.</p>
          </div>
        </div>
      </div>
      <div class="health-block">
        <div class="health-label">
          <span>Monster health</span>
          <span>enemy.currentHp / {enemy.maxHp}</span>
        </div>
        <div class="health-track">
          <div class="health-fill enemy" style="width:${hpPercent}%"></div>
        </div>
      </div>
      <div class="stats-grid">${makeStatsMarkup(enemy, false)}</div>
    </article>
  `;
  document.getElementById("encounter-badge").textContent = ${enemy.tier} monster;
}

function renderLog() {
  battleLog.innerHTML = state.log.map(entry => {
    const item = typeof entry === "string" ? { message: entry, type: "" } : entry;
    return <p class="log-entry ${item.type || ""}">${item.message}</p>;
  }).join("");
}

function renderHistory() {
  if (!state.history.length) {
    historyList.innerHTML = <div class="muted" style="font-size:12px">No battles recorded yet.</div>;
    return;
  }

  historyList.innerHTML = state.history.map(item => `
    <div class="history-item">
      <span>item.monster <span class="{item.result === "Victory" ? "win" : "loss"}">· ${item.result}</span></span>
      <span>${item.tier}</span>
    </div>
  `).join("");
}

function render() {
  renderPlayer();
  renderEnemy();
  renderLog();
  renderHistory();

  document.getElementById("wins-count").textContent = state.wins;
  document.getElementById("points-badge").textContent =
    ${state.points} upgrade point${state.points === 1 ? "" : "s"};
  document.getElementById("record-summary").textContent = ${state.wins}W · ${state.losses}L;

  const hasEnemy = Boolean(state.enemy);
  document.getElementById("attack-button").disabled = !hasEnemy;
  document.getElementById("defend-button").disabled = !hasEnemy;

  document.querySelectorAll(".search-button").forEach(button => {
    button.disabled = hasEnemy;
  });

  if (hasEnemy) {
    battleStatus.textContent = "Your turn. Strike to attack, or defend to reduce the next hit.";
  } else if (state.currentHp < state.stats.hp * 10) {
    battleStatus.textContent = "You recover between battles. Your health will be restored before the next search.";
  } else {
    battleStatus.textContent = "Search a dungeon to find your next opponent.";
  }

  saveState();
}

function upgradeStat(key) {
  if (!STAT_KEYS.includes(key) || state.points <= 0) return;

  state.points -= 1;
  state.stats[key] += 1;

  if (key === "hp") {
    state.currentHp += 10;
  }

  addLog(${STAT_INFO[key].label} increased to ${state.stats[key]}., "special");
  render();
}

function searchDungeon(tier) {
  if (state.enemy || !MONSTERS[tier]) return;

  const choices = MONSTERS[tier];
  const template = choices[Math.floor(Math.random() * choices.length)];
  const monster = {
    ...template,
    tier: tier.charAt(0).toUpperCase() + tier.slice(1),
    maxHp: template.hp,
    currentHp: template.hp
  };

  state.currentHp = state.stats.hp * 10;
  state.enemy = monster;
  state.guarding = false;

  addLog(You searched the ${tier} dungeon and encountered ${monster.name}!, "special");

// A faster monster gets the opening strike.
  if (monster.speed > state.stats.speed) {
    addLog(${monster.name} is faster and strikes first!, "bad");
    monsterTurn();
    if (state.enemy && state.currentHp > 0) {
      addLog("The opening attack is over. Your turn!", "special");
    }
  }

  render();
}

function dodgeChance(stats) {
  return Math.min((stats.dodge || 0) * 0.015, 0.35);
}

function criticalChance(stats) {
  return Math.min((stats.critical || 0) * 0.02, 0.75);
}

function dealAttack(attacker, defender, targetType, isGuarded = false) {
  const targetName = targetType === "player" ? "You" : defender.name;

  if (Math.random() < dodgeChance(defender)) {
    addLog(${targetName} dodged the attack!, targetType === "player" ? "good" : "bad");
    return 0;
  }

  const isCritical = Math.random() < criticalChance(attacker);
  const rawDamage = attacker.damage * (isCritical ? 1.6 : 1);
  const mitigation = (defender.defence || 0) * 0.45;
  let damage = Math.max(1, Math.round(rawDamage - mitigation));

  if (isGuarded) damage = Math.max(1, Math.round(damage * 0.35));

  if (targetType === "player") {
    state.currentHp = Math.max(0, state.currentHp - damage);
  } else {
    defender.currentHp = Math.max(0, defender.currentHp - damage);
  }

  const attackerName = targetType === "player" ? defender.name : "You";
  const criticalText = isCritical ? " Critical hit!" : "";
  const guardText = isGuarded ? " Your defence softened the blow." : "";
  const type = targetType === "player" ? "bad" : "good";

  addLog(${attackerName} dealt ${damage} damage to ${targetName}.${criticalText}${guardText}, type);
  return damage;
}

function monsterTurn() {
  if (!state.enemy) return;

  const healing = Math.floor(state.enemy.regeneration / 5);
  if (healing > 0 && state.enemy.currentHp < state.enemy.maxHp) {
    const actual = Math.min(healing, state.enemy.maxHp - state.enemy.currentHp);
    state.enemy.currentHp += actual;
    addLog(${state.enemy.name} regenerated ${actual} health., "special");
  }

  const wasGuarding = state.guarding;
  state.guarding = false;
  dealAttack(state.enemy, state.stats, "player", wasGuarding);

  if (state.currentHp <= 0) finishBattle(false);
}

function playerTurn(action) {
  if (!state.enemy) return;

  const healing = Math.floor(state.stats.regeneration / 5);
  if (healing > 0 && state.currentHp < state.stats.hp * 10) {
    const actual = Math.min(healing, state.stats.hp * 10 - state.currentHp);
    state.currentHp += actual;
    addLog(You regenerated ${actual} health., "good");
  }

  if (action === "attack") {
    dealAttack(state.stats, state.enemy, "monster");
    if (state.enemy.currentHp <= 0) {
      finishBattle(true);
      render();
      return;
    }
  } else {
    state.guarding = true;
    addLog("You take a defensive stance. The next monster attack is reduced.", "special");
  }

  if (state.enemy) monsterTurn();
  render();
}

function finishBattle(won) {
  if (!state.enemy) return;

  const monster = state.enemy;
  const result = won ? "Victory" : "Defeat";

  if (won) {
    state.wins += 1;
    addLog(${monster.name} was defeated!, "good");

    if (Math.random() < 0.03) {
      state.points += 1;
      addLog("Lucky find! You gained 1 upgrade point.", "special");
    } else {
      addLog("No upgrade point this time. Every victory has a 3% chance to earn one.");
    }
  } else {
    state.losses += 1;
    addLog(You were defeated by ${monster.name}. Recover and try again., "bad");
    state.currentHp = state.stats.hp * 10;
  }

  state.history.unshift({
    monster: monster.name,
    tier: monster.tier,
    result
  });
  state.history = state.history.slice(0, 8);
  state.enemy = null;

state.guarding = false;
}

document.addEventListener("click", event => {
  const upgrade = event.target.closest("[data-upgrade]");
  if (upgrade) {
    upgradeStat(upgrade.dataset.upgrade);
    return;
  }

  const search = event.target.closest("[data-tier]");
  if (search) {
    searchDungeon(search.dataset.tier);
  }
});

document.getElementById("attack-button").addEventListener("click", () => playerTurn("attack"));
document.getElementById("defend-button").addEventListener("click", () => playerTurn("defend"));

document.getElementById("reset-button").addEventListener("click", () => {
  if (!window.confirm("Reset your fighter, upgrades, and battle record?")) return;
  state = freshState();
  render();
});

render();
