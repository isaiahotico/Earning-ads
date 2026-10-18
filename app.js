/**
 * EarnPulse Pro - Core Application Logic
 * Implements:
 * 1. 13:30 - 20:00 Daily Schedule Enforcement
 * 2. Step 1 (Popup Interstitial) & Step 2 (52 Rewarded Interstitials) Task Flow
 * 3. ₱1.00 (or $0.018 USD) Hourly Claim, up to 6 times daily
 * 4. In-App Website Browser for VieFaucet & LuckyWatch
 * 5. Multi-User Community Chat
 * 6. Withdrawals (GCash & FaucetPay) + History Tracking
 * 7. Admin Dashboard with Password "Propetas12" for Approval
 */

// --- 1. CONSTANTS & STORAGE KEYS ---
const PHP_TO_USD_RATE = 0.018; // ₱1.00 = $0.018
const TASK_REWARD_PHP = 1.00;
const MAX_REWARDED_COUNT = 52;
const MAX_DAILY_CLAIMS = 6;
const ADMIN_PASS = "Propetas12";

const VIEFAUCET_URL = "https://viefaucet.com?r=68cbac6ff3d6128dca2a1878";
const LUCKYWATCH_URL = "https://luckywatch.pro/u/oybaf";

const STORAGE_KEYS = {
  BALANCE: "earnpulse_balance_php",
  POPUP_DONE: "earnpulse_popup_done",
  REWARDED_COUNT: "earnpulse_rewarded_count",
  LAST_CLAIM_TIME: "earnpulse_last_claim_time",
  DAILY_CLAIMS_DATE: "earnpulse_claims_date",
  DAILY_CLAIMS_COUNT: "earnpulse_claims_count",
  CHAT_MESSAGES: "earnpulse_chat_messages",
  USERNAME: "earnpulse_chat_username",
  WITHDRAWALS: "earnpulse_withdrawals_records",
  ADMIN_SESSION: "earnpulse_admin_auth",
  ADMIN_BYPASS: "earnpulse_admin_bypass"
};

// --- 2. STATE MANAGEMENT ---
let appState = {
  balance: parseFloat(localStorage.getItem(STORAGE_KEYS.BALANCE)) || 0.00,
  popupDone: localStorage.getItem(STORAGE_KEYS.POPUP_DONE) === "true",
  rewardedCount: parseInt(localStorage.getItem(STORAGE_KEYS.REWARDED_COUNT), 10) || 0,
  lastClaimTime: parseInt(localStorage.getItem(STORAGE_KEYS.LAST_CLAIM_TIME), 10) || 0,
  claimsDate: localStorage.getItem(STORAGE_KEYS.DAILY_CLAIMS_DATE) || getTodayDateString(),
  claimsCount: parseInt(localStorage.getItem(STORAGE_KEYS.DAILY_CLAIMS_COUNT), 10) || 0,
  username: localStorage.getItem(STORAGE_KEYS.USERNAME) || "Worker_" + Math.floor(1000 + Math.random() * 9000),
  adminBypassTime: localStorage.getItem(STORAGE_KEYS.ADMIN_BYPASS) === "true",
  currentBrowserTab: "viefaucet"
};

// --- 3. INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  // Check and roll over daily claims if new day
  checkDailyDateRoll();

  // Load UI components
  updateBalanceDisplay();
  updateTaskUI();
  renderChatMessages();
  renderWithdrawalHistory();
  renderAdminTable();

  // Start real-time timers
  setInterval(checkOperatingWindow, 1000);
  checkOperatingWindow();

  // Listen for cross-tab chat updates
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEYS.CHAT_MESSAGES) {
      renderChatMessages();
    }
    if (e.key === STORAGE_KEYS.WITHDRAWALS) {
      renderWithdrawalHistory();
      renderAdminTable();
    }
  });

  // USD auto calculation in withdraw form
  const wdAmountInput = document.getElementById("wdAmount");
  if (wdAmountInput) {
    wdAmountInput.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value) || 0;
      const usd = (val * PHP_TO_USD_RATE).toFixed(3);
      document.getElementById("wdUsdEquivalent").innerText = `$${usd} USD`;
    });
  }

  // Restore Admin Session if previously unlocked
  if (sessionStorage.getItem(STORAGE_KEYS.ADMIN_SESSION) === "true") {
    document.getElementById("adminLoginBlock").style.display = "none";
    document.getElementById("adminDashboard").style.display = "block";
  }

  document.getElementById("currentUsernameLabel").innerText = appState.username;
});

// Helper: Today's date string YYYY-MM-DD
function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function checkDailyDateRoll() {
  const today = getTodayDateString();
  if (appState.claimsDate !== today) {
    appState.claimsDate = today;
    appState.claimsCount = 0;
    appState.popupDone = false;
    appState.rewardedCount = 0;
    saveState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEYS.BALANCE, appState.balance.toFixed(2));
  localStorage.setItem(STORAGE_KEYS.POPUP_DONE, appState.popupDone);
  localStorage.setItem(STORAGE_KEYS.REWARDED_COUNT, appState.rewardedCount);
  localStorage.setItem(STORAGE_KEYS.LAST_CLAIM_TIME, appState.lastClaimTime);
  localStorage.setItem(STORAGE_KEYS.DAILY_CLAIMS_DATE, appState.claimsDate);
  localStorage.setItem(STORAGE_KEYS.DAILY_CLAIMS_COUNT, appState.claimsCount);
  localStorage.setItem(STORAGE_KEYS.USERNAME, appState.username);
  localStorage.setItem(STORAGE_KEYS.ADMIN_BYPASS, appState.adminBypassTime);
}

// --- 4. SECTION NAVIGATION ---
function switchSection(sectionId, btnElem) {
  document.querySelectorAll(".app-section").forEach(sec => sec.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));

  const target = document.getElementById(`section-${sectionId}`);
  if (target) target.classList.add("active");
  if (btnElem) btnElem.classList.add("active");
}

// --- 5. TIME SCHEDULE (13:30 - 20:00 DAILY) ---
function isOperatingWindowOpen() {
  if (appState.adminBypassTime) return true;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = 13 * 60 + 30; // 13:30
  const endMinutes = 20 * 60;        // 20:00

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

function checkOperatingWindow() {
  const badge = document.getElementById("windowStatusBadge");
  const isOpen = isOperatingWindowOpen();

  if (isOpen) {
    badge.className = "badge badge-success";
    badge.innerHTML = `<i class="fa-solid fa-circle-check"></i> System Open (13:30 - 20:00)`;
  } else {
    badge.className = "badge badge-danger";
    badge.innerHTML = `<i class="fa-solid fa-lock"></i> Closed (Opens at 13:30)`;
  }

  // Handle Hourly Cooldown Countdown
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const timeSinceLastClaim = now - appState.lastClaimTime;
  const cooldownActive = timeSinceLastClaim < oneHour;

  const cooldownWrap = document.getElementById("cooldownTimerWrap");
  const cooldownText = document.getElementById("cooldownTimerText");

  if (cooldownActive && appState.lastClaimTime > 0) {
    cooldownWrap.style.display = "block";
    const remaining = oneHour - timeSinceLastClaim;
    const m = Math.floor((remaining / (1000 * 60)) % 60);
    const s = Math.floor((remaining / 1000) % 60);
    cooldownText.innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  } else {
    cooldownWrap.style.display = "none";
  }

  updateTaskButtonStates(isOpen, cooldownActive);
}

// --- 6. OFFICE AD TASK ENGINE ---
const btnPopupAd = document.getElementById("btnPopupAd");
const btnRewardedAd = document.getElementById("btnRewardedAd");
const btnClaimReward = document.getElementById("btnClaimReward");

function updateTaskUI() {
  // Step 1 UI
  const step1 = document.getElementById("step1Status");
  if (appState.popupDone) {
    step1.className = "badge badge-success";
    step1.innerHTML = `<i class="fa-solid fa-check"></i> Completed`;
  } else {
    step1.className = "badge badge-danger";
    step1.innerText = "Pending";
  }

  // Step 2 Counter
  document.getElementById("step2Counter").innerText = `${appState.rewardedCount} / ${MAX_REWARDED_COUNT} Ads`;
  document.getElementById("btnRewardedCounter").innerText = appState.rewardedCount;

  // Progress Bar
  const pct = Math.min(100, Math.round((appState.rewardedCount / MAX_REWARDED_COUNT) * 100));
  document.getElementById("rewardProgressBar").style.width = `${pct}%`;

  // Daily Claims
  document.getElementById("dailyClaimsDisplay").innerText = `${appState.claimsCount} / ${MAX_DAILY_CLAIMS} Claims`;
}

function updateTaskButtonStates(isOpen, cooldownActive) {
  const dailyLimitReached = appState.claimsCount >= MAX_DAILY_CLAIMS;

  // Step 1: Popup button
  btnPopupAd.disabled = !isOpen || dailyLimitReached || cooldownActive || appState.popupDone;

  // Step 2: Rewarded button requires Step 1 completed
  btnRewardedAd.disabled = !isOpen || dailyLimitReached || cooldownActive || !appState.popupDone || (appState.rewardedCount >= MAX_REWARDED_COUNT);

  // Claim button requires 52 count
  const readyToClaim = appState.popupDone && appState.rewardedCount >= MAX_REWARDED_COUNT;
  btnClaimReward.disabled = !isOpen || dailyLimitReached || cooldownActive || !readyToClaim;
}

// Safe execution wrapper for Show_10555663 Ad SDK
function runSdkAd(format) {
  return new Promise((resolve, reject) => {
    if (typeof window.show_10555663 === "function") {
      if (format === 'pop') {
        window.show_10555663('pop').then(resolve).catch(reject);
      } else {
        window.show_10555663().then(resolve).catch(reject);
      }
    } else {
      // Offline / Fallback simulator if script is blocked by browser adblock
      console.warn("show_10555663 SDK function not detected in window. Running mock simulation.");
      const mockSuccess = confirm(`[Ad Network Simulator: format='${format}']\nSimulate successful ad view?`);
      if (mockSuccess) resolve();
      else reject(new Error("Ad canceled"));
    }
  });
}

// Ad 1 Click: Popup Interstitial
btnPopupAd.addEventListener("click", () => {
  btnPopupAd.disabled = true;
  btnPopupAd.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Loading Ad...`;

  runSdkAd('pop')
    .then(() => {
      appState.popupDone = true;
      saveState();
      updateTaskUI();
      openModal("Step 1 Finished!", "Popup interstitial successfully viewed. Step 2 (Rewarded Ads) is now unlocked!");
    })
    .catch((err) => {
      openModal("Ad Interrupted", "Could not complete the ad. Please try again.");
    })
    .finally(() => {
      btnPopupAd.innerHTML = `<i class="fa-solid fa-window-restore"></i> Open Popup Interstitial Ad`;
      checkOperatingWindow();
    });
});

// Ad 2 Click: Rewarded Interstitial
btnRewardedAd.addEventListener("click", () => {
  if (appState.rewardedCount >= MAX_REWARDED_COUNT) return;

  btnRewardedAd.disabled = true;
  btnRewardedAd.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Playing Ad...`;

  runSdkAd('rewarded')
    .then(() => {
      appState.rewardedCount++;
      saveState();
      updateTaskUI();

      if (appState.rewardedCount >= MAX_REWARDED_COUNT) {
        openModal("Task Goal Reached!", "You completed all 52 rewarded ads! Click 'Claim ₱1.00 Reward' below.");
      }
    })
    .catch((err) => {
      console.log("Rewarded ad closed or error:", err);
    })
    .finally(() => {
      btnRewardedAd.innerHTML = `<i class="fa-solid fa-video"></i> Watch Rewarded Interstitial (<span id="btnRewardedCounter">${appState.rewardedCount}</span>/52)`;
      checkOperatingWindow();
    });
});

// Claim Button Click
btnClaimReward.addEventListener("click", () => {
  if (appState.claimsCount >= MAX_DAILY_CLAIMS) {
    openModal("Daily Limit Reached", "You have already completed all 6 claims for today. Come back tomorrow at 13:30!");
    return;
  }

  // Credit ₱1.00
  appState.balance += TASK_REWARD_PHP;
  appState.claimsCount++;
  appState.lastClaimTime = Date.now();
  // Reset steps for the next hour
  appState.popupDone = false;
  appState.rewardedCount = 0;

  saveState();
  updateBalanceDisplay();
  updateTaskUI();
  checkOperatingWindow();

  openModal(
    "Reward Claimed!", 
    `Congratulations! ₱${TASK_REWARD_PHP.toFixed(2)} ($${PHP_TO_USD_RATE} USD) has been credited to your wallet. You can claim again in 1 hour (Claims today: ${appState.claimsCount}/6).`
  );
});

function updateBalanceDisplay() {
  document.getElementById("userBalanceDisplay").innerText = `₱${appState.balance.toFixed(2)}`;
  const usdVal = (appState.balance * PHP_TO_USD_RATE).toFixed(3);
  document.getElementById("usdBalanceDisplay").innerText = `($${usdVal})`;
}

// --- 7. SECTION 2: WEBSITES IN-APP BROWSER ---
function loadInternalUrl(siteKey) {
  appState.currentBrowserTab = siteKey;
  const frame = document.getElementById("appBrowserFrame");
  const tabVie = document.getElementById("tabVieFaucet");
  const tabLucky = document.getElementById("tabLuckyWatch");

  if (siteKey === "viefaucet") {
    frame.src = VIEFAUCET_URL;
    tabVie.classList.add("active");
    tabLucky.classList.remove("active");
  } else {
    frame.src = LUCKYWATCH_URL;
    tabLucky.classList.add("active");
    tabVie.classList.remove("active");
  }
}

function reloadInternalBrowser() {
  const frame = document.getElementById("appBrowserFrame");
  frame.src = frame.src;
}

function openCurrentUrlExternal() {
  const url = appState.currentBrowserTab === "viefaucet" ? VIEFAUCET_URL : LUCKYWATCH_URL;
  window.open(url, "_blank", "noopener,noreferrer");
}

// --- 8. SECTION 3: COMMUNITY CHAT ---
function getChatHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES)) || [
      { id: 1, sender: "System", text: "Welcome to EarnPulse Community Chat! Exchange tips and earn smoothly.", time: "13:30", isSystem: true }
    ];
  } catch (e) {
    return [];
  }
}

function renderChatMessages() {
  const container = document.getElementById("chatMessagesContainer");
  const messages = getChatHistory();

  container.innerHTML = messages.map(msg => {
    const isMine = msg.sender === appState.username;
    return `
      <div class="chat-bubble ${isMine ? 'mine' : 'other'}">
        <div class="chat-sender">${escapeHtml(msg.sender)}</div>
        <div class="chat-body">${escapeHtml(msg.text)}</div>
        <div class="chat-time">${escapeHtml(msg.time)}</div>
      </div>
    `;
  }).join("");

  container.scrollTop = container.scrollHeight;
}

function handleSendChat(e) {
  e.preventDefault();
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const messages = getChatHistory();
  messages.push({
    id: Date.now(),
    sender: appState.username,
    text: text,
    time: timeStr
  });

  // Keep last 50 messages
  if (messages.length > 50) messages.shift();

  localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages));
  input.value = "";
  renderChatMessages();
}

function promptChangeUsername() {
  const newName = prompt("Enter your preferred nickname in chat:", appState.username);
  if (newName && newName.trim().length > 1) {
    appState.username = newName.trim().substring(0, 20);
    saveState();
    document.getElementById("currentUsernameLabel").innerText = appState.username;
    renderChatMessages();
  }
}

// --- 9. SECTION 4: WITHDRAWALS & HISTORY ---
function getWithdrawalRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.WITHDRAWALS)) || [];
  } catch (e) {
    return [];
  }
}

function saveWithdrawalRecords(records) {
  localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(records));
  renderWithdrawalHistory();
  renderAdminTable();
}

function handleWdMethodChange() {
  const method = document.getElementById("wdMethod").value;
  const label = document.getElementById("wdAccountLabel");
  const input = document.getElementById("wdAccount");

  if (method === "GCash") {
    label.innerText = "GCash Mobile Number";
    input.placeholder = "09xxxxxxxxx";
  } else {
    label.innerText = "FaucetPay Registered Email";
    input.placeholder = "your-faucetpay@email.com";
  }
}

function handleWithdrawalSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("wdName").value.trim();
  const method = document.getElementById("wdMethod").value;
  const account = document.getElementById("wdAccount").value.trim();
  const amount = parseFloat(document.getElementById("wdAmount").value);

  if (amount < 1.00) {
    openModal("Invalid Amount", "Minimum withdrawal threshold is ₱1.00 (or $0.018 USD).");
    return;
  }

  if (amount > appState.balance) {
    openModal("Insufficient Balance", `You only have ₱${appState.balance.toFixed(2)}. Complete more tasks first!`);
    return;
  }

  // Deduct balance
  appState.balance -= amount;
  saveState();
  updateBalanceDisplay();

  const now = new Date();
  const dateTimeStr = `${getTodayDateString()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newRecord = {
    id: "WD" + Math.floor(100000 + Math.random() * 900000),
    name: name,
    method: method,
    account: account,
    amountPhp: amount,
    amountUsd: (amount * PHP_TO_USD_RATE).toFixed(3),
    timestamp: dateTimeStr,
    status: "Pending" // "Pending" | "Approved" | "Rejected"
  };

  const records = getWithdrawalRecords();
  records.unshift(newRecord);
  saveWithdrawalRecords(records);

  document.getElementById("withdrawForm").reset();
  document.getElementById("wdUsdEquivalent").innerText = "$0.018 USD";

  openModal(
    "Withdrawal Submitted",
    `Your request for ₱${amount.toFixed(2)} to ${method} (${account}) has been queued for Admin approval.`
  );
}

function renderWithdrawalHistory() {
  const tbody = document.getElementById("withdrawalHistoryBody");
  const records = getWithdrawalRecords();

  if (records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding:18px;">No withdrawal requests found.</td></tr>`;
    return;
  }

  tbody.innerHTML = records.map(r => {
    let badgeClass = "badge-warning";
    if (r.status === "Approved") badgeClass = "badge-success";
    if (r.status === "Rejected") badgeClass = "badge-danger";

    return `
      <tr>
        <td style="color: #94a3b8;">${escapeHtml(r.timestamp)}</td>
        <td style="font-weight: 600;">${escapeHtml(r.name)}</td>
        <td>
          <span style="color:#60a5fa; font-weight:700;">${escapeHtml(r.method)}</span><br>
          <span style="font-size:0.7rem; color:#94a3b8;">${escapeHtml(r.account)}</span>
        </td>
        <td>
          <strong>₱${parseFloat(r.amountPhp).toFixed(2)}</strong><br>
          <span style="font-size:0.7rem; color:#94a3b8;">$${r.amountUsd}</span>
        </td>
        <td><span class="badge ${badgeClass}">${escapeHtml(r.status)}</span></td>
      </tr>
    `;
  }).join("");
}

// --- 10. SECTION 5: ADMIN PORTAL ---
function handleAdminLogin(e) {
  e.preventDefault();
  const entered = document.getElementById("adminPasswordInput").value;

  if (entered === ADMIN_PASS) {
    sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, "true");
    document.getElementById("adminLoginBlock").style.display = "none";
    document.getElementById("adminDashboard").style.display = "block";
    renderAdminTable();
  } else {
    openModal("Access Denied", "Incorrect administrator password.");
  }
}

function adminLogout() {
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
  document.getElementById("adminLoginBlock").style.display = "block";
  document.getElementById("adminDashboard").style.display = "none";
  document.getElementById("adminPasswordInput").value = "";
}

function toggleTimeWindowBypass() {
  appState.adminBypassTime = !appState.adminBypassTime;
  saveState();
  const btn = document.getElementById("btnToggleTimeBypass");
  btn.innerText = `Bypass: ${appState.adminBypassTime ? 'ON (Always Open)' : 'OFF'}`;
  checkOperatingWindow();
}

function renderAdminTable() {
  const tbody = document.getElementById("adminWithdrawalsTableBody");
  if (!tbody) return;

  const records = getWithdrawalRecords();

  // Metrics
  let totalApproved = 0;
  let pendingCount = 0;

  records.forEach(r => {
    if (r.status === "Approved") totalApproved += parseFloat(r.amountPhp);
    if (r.status === "Pending") pendingCount++;
  });

  const approvedDisplay = document.getElementById("adminTotalApproved");
  const pendingDisplay = document.getElementById("adminPendingCount");
  if (approvedDisplay) approvedDisplay.innerText = `₱${totalApproved.toFixed(2)}`;
  if (pendingDisplay) pendingDisplay.innerText = `${pendingCount} Requests`;

  if (records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding:18px;">No records available.</td></tr>`;
    return;
  }

  tbody.innerHTML = records.map(r => {
    let badgeClass = "badge-warning";
    if (r.status === "Approved") badgeClass = "badge-success";
    if (r.status === "Rejected") badgeClass = "badge-danger";

    const isPending = r.status === "Pending";

    return `
      <tr>
        <td style="font-family:monospace; color:#94a3b8;">${r.id}</td>
        <td>
          <strong>${escapeHtml(r.name)}</strong><br>
          <span style="font-size:0.7rem; color:#60a5fa;">${escapeHtml(r.method)}</span>: 
          <span style="font-size:0.7rem; color:#cbd5e1;">${escapeHtml(r.account)}</span>
        </td>
        <td>
          <strong style="color:#10b981;">₱${parseFloat(r.amountPhp).toFixed(2)}</strong><br>
          <span style="font-size:0.7rem; color:#94a3b8;">$${r.amountUsd}</span>
        </td>
        <td style="color:#94a3b8; font-size:0.7rem;">${escapeHtml(r.timestamp)}</td>
        <td><span class="badge ${badgeClass}">${r.status}</span></td>
        <td>
          ${isPending ? `
            <div style="display:flex; gap:6px;">
              <button class="btn btn-accent" style="padding:4px 8px; width:auto; font-size:0.7rem;" onclick="adminUpdateStatus('${r.id}', 'Approved')">
                <i class="fa-solid fa-check"></i>
              </button>
              <button class="btn btn-danger" style="padding:4px 8px; width:auto; font-size:0.7rem; background:#dc2626; color:#fff;" onclick="adminUpdateStatus('${r.id}', 'Rejected')">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          ` : `<span style="font-size:0.7rem; color:#64748b;">Closed</span>`}
        </td>
      </tr>
    `;
  }).join("");
}

function adminUpdateStatus(recordId, newStatus) {
  const records = getWithdrawalRecords();
  const target = records.find(r => r.id === recordId);
  if (!target) return;

  target.status = newStatus;

  // If rejected, refund balance to user
  if (newStatus === "Rejected") {
    appState.balance += parseFloat(target.amountPhp);
    saveState();
    updateBalanceDisplay();
  }

  saveWithdrawalRecords(records);
}

// --- 11. MODAL UTILITY & SANITIZATION ---
function openModal(title, msg) {
  document.getElementById("modalTitle").innerText = title;
  document.getElementById("modalBody").innerText = msg;
  document.getElementById("generalModal").classList.add("active");
}

function closeModal() {
  document.getElementById("generalModal").classList.remove("active");
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}