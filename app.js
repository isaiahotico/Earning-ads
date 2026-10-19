/**
 * Paperhouse Inc. - Core Application Script
 * Complete CDN Ad Engine, Workstation Hub, Chat, YouTube & Interconnected Admin Ledger
 */

// ==========================================
// 1. CONFIGURATION & FIREBASE INITIALIZATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBwpa8mA83JAv2A2Dj0rh5VHwodyv5N3dg",
  authDomain: "freegcash-ads.firebaseapp.com",
  databaseURL: "https://freegcash-ads-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "freegcash-ads",
  storageBucket: "freegcash-ads.firebasestorage.app",
  messagingSenderId: "608086825364",
  appId: "1:608086825364:web:3a8e628d231b52c6171781"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// Constants
const PHP_TO_USD = 0.018; // ₱1.00 = $0.018 USD
const ADMIN_PASSWORD = "Propetas12";

// Local User State
let currentUser = {
  uid: localStorage.getItem("ph_uid") || null,
  name: localStorage.getItem("ph_username") || null,
  balance: 0.00
};

// Task Progress State
let taskState = {
  popupCompleted: false,
  rewardedCount: 0,
  claimsToday: 0,
  lastClaimHour: null
};

// ==========================================
// 2. IN-APP INTERSTITIAL AUTO AD (5-MIN COOLDOWN)
// ==========================================
function triggerInAppAutoAd() {
  const lastAdTime = localStorage.getItem("ph_last_inapp_time");
  const now = Date.now();
  const cooldownPeriod = 5 * 60 * 1000; // 5 minutes in milliseconds

  if (!lastAdTime || now - parseInt(lastAdTime, 10) >= cooldownPeriod) {
    if (typeof window.show_10555663 === "function") {
      try {
        window.show_10555663({
          type: "inApp",
          inAppSettings: {
            frequency: 2,
            capping: 0.1,
            interval: 30,
            timeout: 5,
            everyPage: false
          }
        });
        localStorage.setItem("ph_last_inapp_time", now.toString());
      } catch (err) {
        console.warn("Auto InApp ad trigger error:", err);
      }
    }
  }
}

// ==========================================
// 3. USER MANAGEMENT & BALANCES
// ==========================================
function initUser() {
  if (!currentUser.uid) {
    currentUser.uid = "usr_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem("ph_uid", currentUser.uid);
  }

  if (!currentUser.name) {
    document.getElementById("username-modal").classList.remove("hidden");
  } else {
    document.getElementById("chat-user-label").textContent = `Worker: ${currentUser.name}`;
    listenToUserData();
  }
}

function saveUserProfile() {
  const input = document.getElementById("username-input").value.trim();
  if (input.length < 2) {
    showToast("Please enter a valid worker name (at least 2 letters)", "error");
    return;
  }
  currentUser.name = input;
  localStorage.setItem("ph_username", input);
  document.getElementById("username-modal").classList.add("hidden");
  document.getElementById("chat-user-label").textContent = `Worker: ${currentUser.name}`;

  db.ref(`users/${currentUser.uid}`).update({
    name: currentUser.name,
    lastActive: Date.now()
  });

  listenToUserData();
}

function listenToUserData() {
  const userRef = db.ref(`users/${currentUser.uid}`);
  userRef.on("value", snapshot => {
    const data = snapshot.val();
    if (data) {
      currentUser.balance = parseFloat(data.balance || 0);
      updateBalanceDisplay();
    } else {
      userRef.set({
        name: currentUser.name,
        balance: 0.00,
        registeredAt: Date.now()
      });
    }
  });

  loadTodayTaskProgress();
}

function updateBalanceDisplay() {
  const phpText = `₱${currentUser.balance.toFixed(2)}`;
  const usdText = `$${(currentUser.balance * PHP_TO_USD).toFixed(3)}`;
  document.getElementById("nav-balance").textContent = `${phpText} / ${usdText}`;
  document.getElementById("wallet-balance-php").textContent = phpText;
  document.getElementById("wallet-balance-usd").textContent = `≈ ${usdText} USD`;
}

// ==========================================
// 4. NAVIGATION & TAB SWITCHING
// ==========================================
function switchTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
  const target = document.getElementById(tabId);
  if (target) target.classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach(btn => {
    if (btn.getAttribute("data-target") === tabId) {
      btn.classList.add("text-amber-400");
      btn.classList.remove("text-slate-400");
    } else {
      btn.classList.remove("text-amber-400");
      btn.classList.add("text-slate-400");
    }
  });
}

// ==========================================
// 5. OFFICE WORKSPACE & GOOGLE LOGIN FIX
// ==========================================
const partnerSites = [
  "https://viefaucet.com?r=68cbac6ff3d6128dca2a1878",
  "https://luckywatch.pro/u/oybaf"
];
let currentSiteIndex = 0;

function switchWorkSite(index) {
  currentSiteIndex = index - 1;
  const url = partnerSites[currentSiteIndex];
  const frame = document.getElementById("work-iframe");
  frame.src = url;
  document.getElementById("inapp-url-input").value = url;
  document.getElementById("work-ext-link").href = url;

  if (index === 1) {
    document.getElementById("site-tab-1").className = "px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 transition";
    document.getElementById("site-tab-2").className = "px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 transition";
  } else {
    document.getElementById("site-tab-1").className = "px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 transition";
    document.getElementById("site-tab-2").className = "px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 transition";
  }
}

function navigateInAppFrame() {
  const url = document.getElementById("inapp-url-input").value.trim();
  if (url) {
    document.getElementById("work-iframe").src = url;
    document.getElementById("work-ext-link").href = url;
  }
}

function reloadWorkIframe() {
  const frame = document.getElementById("work-iframe");
  frame.src = frame.src;
  showToast("Workspace refreshed", "info");
}

/**
 * GOOGLE LOGIN FIX FOR IFRAMES:
 * Google blocks OAuth inside iframes for clickjacking security.
 * This helper opens a focused login window with session sync. Once authenticated,
 * the session cookies are registered in the browser so the iframe works immediately.
 */
function openExternalLoginWindow() {
  const targetSite = document.getElementById("inapp-url-input").value || partnerSites[currentSiteIndex];
  const popup = window.open(
    targetSite,
    "GoogleAuthFixWindow",
    "width=520,height=680,scrollbars=yes,resizable=yes,status=yes,location=yes"
  );
  if (popup) {
    showToast("Login window opened. Sign in with Google there, then click Reload!", "info");
  } else {
    // If popups are blocked by browser
    window.open(targetSite, "_blank");
  }
}

// ==========================================
// 6. YOUTUBE PLAYER & COMMUNITY CDN FEED
// ==========================================
function extractYouTubeID(url) {
  if (!url) return null;
  const reg = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(reg);
  return (match && match[2].length === 11) ? match[2] : (url.length === 11 ? url : null);
}

function playCustomVideo() {
  const val = document.getElementById("yt-url-input").value.trim();
  const vidId = extractYouTubeID(val);
  if (!vidId) {
    showToast("Invalid YouTube link or ID provided", "error");
    return;
  }
  document.getElementById("main-yt-iframe").src = `https://www.youtube.com/embed/${vidId}?autoplay=1`;
  showToast("Playing video in Paperhouse Cinema!", "success");
}

function postVideoToPublic() {
  const val = document.getElementById("yt-url-input").value.trim();
  const vidId = extractYouTubeID(val);
  if (!vidId) {
    showToast("Invalid YouTube link to post", "error");
    return;
  }

  db.ref("public_videos").push({
    videoId: vidId,
    postedBy: currentUser.name || "Anonymous",
    timestamp: Date.now()
  }).then(() => {
    showToast("Video posted to Public Community Feed!", "success");
    document.getElementById("yt-url-input").value = "";
  });
}

function listenToPublicVideos() {
  db.ref("public_videos").limitToLast(18).on("value", snapshot => {
    const feed = document.getElementById("public-yt-feed");
    feed.innerHTML = "";
    const list = [];
    snapshot.forEach(c => list.unshift(c.val()));

    if (list.length === 0) {
      feed.innerHTML = `<div class="col-span-full text-center text-xs text-slate-500 py-6">No public videos yet. Share a link above!</div>`;
      return;
    }

    list.forEach(v => {
      const card = document.createElement("div");
      card.className = "bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden hover:border-red-500/40 transition cursor-pointer flex flex-col group";
      card.onclick = () => {
        document.getElementById("main-yt-iframe").src = `https://www.youtube.com/embed/${v.videoId}?autoplay=1`;
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
      card.innerHTML = `
        <div class="relative aspect-video bg-black">
          <img src="https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg" alt="Video" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
            <i class="fa-solid fa-play text-red-500 text-3xl"></i>
          </div>
        </div>
        <div class="p-3 flex justify-between items-center text-xs">
          <span class="text-slate-400 truncate">By <b class="text-slate-200">${escapeHtml(v.postedBy)}</b></span>
          <span class="text-red-400 font-bold flex items-center gap-1"><i class="fa-solid fa-play text-[10px]"></i> Play</span>
        </div>
      `;
      feed.appendChild(card);
    });
  });
}

// ==========================================
// 7. TASK 1 ENGINE (13:30 - 20:00 STRICT WINDOW)
// ==========================================
function isTaskTimeActive() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = 13 * 60 + 30; // 13:30 (1:30 PM)
  const endMinutes = 20 * 60;        // 20:00 (8:00 PM)
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

function updateTaskWindowBadge() {
  const badge = document.getElementById("task-window-badge");
  const isOpen = isTaskTimeActive();
  if (isOpen) {
    badge.className = "px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-500/50 text-emerald-300";
    badge.innerHTML = `<i class="fa-solid fa-lock-open text-emerald-400"></i> Open Now (Ends 20:00)`;
  } else {
    badge.className = "px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-500/20 border border-rose-500/50 text-rose-300";
    badge.innerHTML = `<i class="fa-solid fa-lock text-rose-400"></i> Locked (Opens 13:30 PM)`;
  }
  renderTaskProgress();
}
setInterval(updateTaskWindowBadge, 20000);

function getTodayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadTodayTaskProgress() {
  const today = getTodayDateKey();
  db.ref(`user_tasks/${currentUser.uid}/${today}`).on("value", snapshot => {
    const data = snapshot.val() || {};
    taskState.popupCompleted = !!data.popupCompleted;
    taskState.rewardedCount = parseInt(data.rewardedCount || 0, 10);
    taskState.claimsToday = parseInt(data.claimsToday || 0, 10);
    taskState.lastClaimHour = data.lastClaimHour !== undefined ? data.lastClaimHour : null;
    renderTaskProgress();
  });
}

function renderTaskProgress() {
  const popStatus = document.getElementById("pop-task-status");
  if (taskState.popupCompleted) {
    popStatus.className = "font-bold text-emerald-400 text-[11px]";
    popStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> Completed`;
  } else {
    popStatus.className = "font-bold text-red-400 text-[11px]";
    popStatus.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Incomplete`;
  }

  document.getElementById("rewarded-task-status").textContent = `${taskState.rewardedCount} / 52`;
  const pct = Math.min(100, (taskState.rewardedCount / 52) * 100);
  document.getElementById("rewarded-progress-bar").style.width = `${pct}%`;

  document.getElementById("claims-today-counter").textContent = taskState.claimsToday;
  document.getElementById("claims-earned-counter").textContent = (taskState.claimsToday * 1.00).toFixed(2);

  const currentHour = new Date().getHours();
  const alreadyClaimedThisHour = (taskState.lastClaimHour === currentHour);
  const isEligible = isTaskTimeActive() &&
                     taskState.popupCompleted &&
                     taskState.rewardedCount >= 52 &&
                     taskState.claimsToday < 6 &&
                     !alreadyClaimedThisHour;

  const btn = document.getElementById("claim-task-btn");
  if (isEligible) {
    btn.disabled = false;
    btn.className = "w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-emerald-400 hover:from-amber-600 hover:to-emerald-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 animate-pulse";
  } else {
    btn.disabled = true;
    btn.className = "w-full sm:w-auto px-6 py-3 bg-slate-800 text-slate-500 cursor-not-allowed font-black rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2";
  }
}

// SDK Ad Wrapper Calls
function callSdkPopupAd() {
  return new Promise((resolve) => {
    if (typeof window.show_10555663 === "function") {
      window.show_10555663("pop")
        .then(() => resolve())
        .catch(err => {
          console.warn("Popup Ad notice:", err);
          resolve();
        });
    } else {
      alert("Popup Ad completed (Simulation mode)");
      resolve();
    }
  });
}

function callSdkRewardedAd() {
  return new Promise((resolve) => {
    if (typeof window.show_10555663 === "function") {
      window.show_10555663()
        .then(() => resolve())
        .catch(err => {
          console.warn("Rewarded Ad notice:", err);
          resolve();
        });
    } else {
      alert("Rewarded Ad completed (Simulation mode)");
      resolve();
    }
  });
}

// Office Ad Triggers
function triggerPopupInterstitial() {
  callSdkPopupAd().then(() => {
    showToast("Popup interstitial shown!", "info");
    recordAdImpression();
  });
}

function triggerRewardedInterstitial() {
  callSdkRewardedAd().then(() => {
    showToast("Rewarded interstitial watched!", "info");
    recordAdImpression();
  });
}

// Hourly Task Handlers
function runPopAdTask() {
  callSdkPopupAd().then(() => {
    const today = getTodayDateKey();
    db.ref(`user_tasks/${currentUser.uid}/${today}`).update({
      popupCompleted: true
    }).then(() => {
      showToast("Step 1 Confirmed: Popup ad completed!", "success");
      recordAdImpression();
    });
  });
}

function runRewardedAdTask() {
  callSdkRewardedAd().then(() => {
    const today = getTodayDateKey();
    const newCount = (taskState.rewardedCount || 0) + 1;
    db.ref(`user_tasks/${currentUser.uid}/${today}`).update({
      rewardedCount: newCount
    }).then(() => {
      showToast(`Rewarded Ad counted (${newCount}/52)!`, "success");
      recordAdImpression();
    });
  });
}

function claimHourlyTaskReward() {
  if (!isTaskTimeActive()) {
    showToast("Tasks are strictly active from 13:30 to 20:00 PM!", "error");
    return;
  }
  if (!taskState.popupCompleted || taskState.rewardedCount < 52) {
    showToast("Complete 1 popup ad and 52 rewarded ads first!", "error");
    return;
  }
  if (taskState.claimsToday >= 6) {
    showToast("Maximum daily limit of 6 claims reached!", "error");
    return;
  }

  const currentHour = new Date().getHours();
  if (taskState.lastClaimHour === currentHour) {
    showToast("Already claimed for this hour! Return next hour.", "error");
    return;
  }

  const today = getTodayDateKey();
  const rewardPhp = 1.00;

  db.ref(`users/${currentUser.uid}/balance`).transaction(curr => (curr || 0) + rewardPhp, (error, committed) => {
    if (committed) {
      db.ref(`user_tasks/${currentUser.uid}/${today}`).update({
        claimsToday: (taskState.claimsToday || 0) + 1,
        lastClaimHour: currentHour,
        popupCompleted: false, // reset for subsequent hour
        rewardedCount: 0
      });
      showToast("🎉 ₱1.00 ($0.018) added to your balance!", "success");
    }
  });
}

// ==========================================
// 8. DAILY RESETTING LEADERBOARD
// ==========================================
function recordAdImpression() {
  const today = getTodayDateKey();
  db.ref(`leaderboard/${today}/${currentUser.uid}`).transaction(curr => {
    return {
      name: currentUser.name || "Anonymous",
      count: ((curr && curr.count) || 0) + 1,
      lastSeen: Date.now()
    };
  });
}

function listenToLeaderboard() {
  const today = getTodayDateKey();
  document.getElementById("leaderboard-date-badge").textContent = `Today: ${today}`;

  db.ref(`leaderboard/${today}`).orderByChild("count").limitToLast(50).on("value", snapshot => {
    const tbody = document.getElementById("leaderboard-tbody");
    tbody.innerHTML = "";

    const rows = [];
    snapshot.forEach(c => rows.unshift(c.val()));

    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-slate-500">No ad records for today yet. Watch ads to top the rank!</td></tr>`;
      return;
    }

    rows.forEach((r, idx) => {
      const tr = document.createElement("tr");
      let rankBadge = `<span class="text-slate-400 font-bold">#${idx + 1}</span>`;
      if (idx === 0) rankBadge = `<span class="text-amber-400 font-black"><i class="fa-solid fa-crown"></i> #1</span>`;
      if (idx === 1) rankBadge = `<span class="text-slate-200 font-bold"><i class="fa-solid fa-medal"></i> #2</span>`;
      if (idx === 2) rankBadge = `<span class="text-amber-600 font-bold"><i class="fa-solid fa-medal"></i> #3</span>`;

      tr.innerHTML = `
        <td class="py-3 px-4">${rankBadge}</td>
        <td class="py-3 px-4 font-bold text-slate-200">${escapeHtml(r.name)}</td>
        <td class="py-3 px-4 text-right font-black text-amber-400">${r.count} ads</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

// ==========================================
// 9. PUBLIC LIVE CHAT
// ==========================================
function sendChatMessage(e) {
  e.preventDefault();
  const input = document.getElementById("chat-text-input");
  const msg = input.value.trim();
  if (!msg) return;

  db.ref("community_chat").push({
    sender: currentUser.name || "Anonymous",
    uid: currentUser.uid,
    message: msg,
    timestamp: Date.now()
  });

  input.value = "";
}

function listenToChat() {
  const box = document.getElementById("chat-messages-box");
  db.ref("community_chat").limitToLast(60).on("value", snapshot => {
    box.innerHTML = "";
    snapshot.forEach(c => {
      const item = c.val();
      const isMe = item.uid === currentUser.uid;
      const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const el = document.createElement("div");
      el.className = `flex flex-col ${isMe ? "items-end" : "items-start"}`;
      el.innerHTML = `
        <div class="text-[10px] text-slate-400 mb-0.5 px-1">${escapeHtml(item.sender)} • ${timeStr}</div>
        <div class="max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-md ${isMe ? "bg-amber-500 text-slate-950 font-semibold rounded-tr-none" : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"}">
          ${escapeHtml(item.message)}
        </div>
      `;
      box.appendChild(el);
    });
    box.scrollTop = box.scrollHeight;
  });
}

// ==========================================
// 10. WITHDRAWALS & ADMIN AUDIT (CONNECTED)
// ==========================================
function toggleWithdrawPlaceholder() {
  const method = document.getElementById("withdraw-method").value;
  const label = document.getElementById("withdraw-account-label");
  const input = document.getElementById("withdraw-account");
  if (method === "GCash") {
    label.textContent = "GCash Mobile Number";
    input.placeholder = "e.g. 09123456789";
  } else {
    label.textContent = "FaucetPay Gmail / Account Email";
    input.placeholder = "e.g. yourfaucetpay@gmail.com";
  }
}

function submitWithdrawal(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("withdraw-amount").value);
  const method = document.getElementById("withdraw-method").value;
  const account = document.getElementById("withdraw-account").value.trim();

  if (isNaN(amount) || amount < 1.00) {
    showToast("Minimum withdrawal is ₱1.00 ($0.018 USD)", "error");
    return;
  }
  if (amount > currentUser.balance) {
    showToast("Insufficient balance for this payout!", "error");
    return;
  }
  if (!account) {
    showToast("Please provide your destination GCash or FaucetPay info", "error");
    return;
  }

  // Deduct user balance atomically and record withdrawal
  db.ref(`users/${currentUser.uid}/balance`).transaction(curr => {
    if ((curr || 0) >= amount) {
      return (curr - amount);
    }
    return; // Abort
  }, (err, committed) => {
    if (committed) {
      const now = new Date();
      const dateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${now.toLocaleTimeString()}`;

      const ref = db.ref("withdrawals").push();
      ref.set({
        id: ref.key,
        uid: currentUser.uid,
        userName: currentUser.name || "Anonymous Worker",
        amountPhp: amount,
        amountUsd: (amount * PHP_TO_USD).toFixed(3),
        method: method,
        accountDetail: account,
        status: "Pending",
        dateTime: dateFormatted,
        timestamp: Date.now()
      }).then(() => {
        showToast("Withdrawal submitted! Admin is reviewing your request.", "success");
        document.getElementById("withdraw-amount").value = "";
        document.getElementById("withdraw-account").value = "";
      });
    } else {
      showToast("Transaction failed. Check your balance.", "error");
    }
  });
}

function listenToWithdrawals() {
  db.ref("withdrawals").orderByChild("timestamp").on("value", snapshot => {
    const userTbody = document.getElementById("user-withdrawal-history");
    const adminTbody = document.getElementById("admin-withdrawal-tbody");

    userTbody.innerHTML = "";
    adminTbody.innerHTML = "";

    const list = [];
    let totalPaid = 0;
    let pendingCount = 0;
    let approvedCount = 0;

    snapshot.forEach(c => {
      const val = c.val();
      val._key = c.key;
      list.unshift(val); // Newest first

      if (val.status === "Approved") {
        totalPaid += parseFloat(val.amountPhp || 0);
        approvedCount++;
      } else if (val.status === "Pending") {
        pendingCount++;
      }
    });

    document.getElementById("admin-total-paid").textContent = `₱${totalPaid.toFixed(2)}`;
    document.getElementById("admin-pending-count").textContent = pendingCount;
    document.getElementById("admin-approved-count").textContent = approvedCount;

    if (list.length === 0) {
      userTbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-slate-500">No withdrawal records available.</td></tr>`;
      adminTbody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-slate-500">No withdrawal records registered yet.</td></tr>`;
      return;
    }

    list.forEach(w => {
      let statusBadge = "bg-amber-500/20 text-amber-400 border border-amber-500/40";
      if (w.status === "Approved") statusBadge = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40";
      if (w.status === "Rejected") statusBadge = "bg-rose-500/20 text-rose-400 border border-rose-500/40";

      // 1. User History Row
      const utr = document.createElement("tr");
      utr.innerHTML = `
        <td class="py-2.5 px-3 text-slate-400 whitespace-nowrap">${w.dateTime || new Date(w.timestamp).toLocaleString()}</td>
        <td class="py-2.5 px-3 font-semibold text-slate-200">${escapeHtml(w.userName)}</td>
        <td class="py-2.5 px-3 text-slate-300"><b>${w.method}:</b> ${escapeHtml(w.accountDetail)}</td>
        <td class="py-2.5 px-3 font-black text-emerald-400">₱${parseFloat(w.amountPhp).toFixed(2)} <span class="text-[10px] text-slate-400">($${w.amountUsd})</span></td>
        <td class="py-2.5 px-3"><span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadge}">${w.status}</span></td>
      `;
      userTbody.appendChild(utr);

      // 2. Admin Detailed Ledger Row (With Amount, Name, Number/Gmail, Date/Time)
      const atr = document.createElement("tr");
      atr.innerHTML = `
        <td class="py-3 px-3 text-slate-400 whitespace-nowrap">${w.dateTime || new Date(w.timestamp).toLocaleString()}</td>
        <td class="py-3 px-3 font-bold text-slate-200">${escapeHtml(w.userName)}</td>
        <td class="py-3 px-3 font-extrabold text-emerald-400">₱${parseFloat(w.amountPhp).toFixed(2)} <span class="text-[10px] text-slate-400">($${w.amountUsd})</span></td>
        <td class="py-3 px-3 font-medium text-slate-300">${w.method}</td>
        <td class="py-3 px-3 font-mono text-amber-300 text-[11px]">${escapeHtml(w.accountDetail)}</td>
        <td class="py-3 px-3"><span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadge}">${w.status}</span></td>
        <td class="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
          <button onclick="setWithdrawalStatus('${w._key}', 'Approved')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] transition">Approve</button>
          <button onclick="setWithdrawalStatus('${w._key}', 'Rejected')" class="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] transition">Reject</button>
        </td>
      `;
      adminTbody.appendChild(atr);
    });
  });
}

// Admin Controls
function loginAdmin() {
  const pwd = document.getElementById("admin-password-input").value;
  if (pwd === ADMIN_PASSWORD) {
    document.getElementById("admin-login-box").classList.add("hidden");
    document.getElementById("admin-dashboard-box").classList.remove("hidden");
    showToast("Admin dashboard verified & unlocked!", "success");
  } else {
    showToast("Incorrect admin password!", "error");
  }
}

function logoutAdmin() {
  document.getElementById("admin-password-input").value = "";
  document.getElementById("admin-dashboard-box").classList.add("hidden");
  document.getElementById("admin-login-box").classList.remove("hidden");
  showToast("Admin mode logged out", "info");
}

function setWithdrawalStatus(key, newStatus) {
  const ref = db.ref(`withdrawals/${key}`);
  ref.once("value", snap => {
    const data = snap.val();
    if (!data) return;

    // Refund user balance if rejected
    if (data.status !== "Rejected" && newStatus === "Rejected") {
      db.ref(`users/${data.uid}/balance`).transaction(curr => (curr || 0) + parseFloat(data.amountPhp));
    }

    ref.update({
      status: newStatus,
      resolvedAt: Date.now()
    }).then(() => {
      showToast(`Request updated to ${newStatus}`, "info");
    });
  });
}

// ==========================================
// 11. TOAST ALERTS & HELPERS
// ==========================================
function showToast(msg, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  let theme = "bg-slate-900 border-slate-700 text-slate-100";
  if (type === "success") theme = "bg-emerald-950 border-emerald-500 text-emerald-200";
  if (type === "error") theme = "bg-rose-950 border-rose-500 text-rose-200";

  toast.className = `p-3.5 rounded-2xl shadow-2xl text-xs font-semibold border flex items-center gap-2 pointer-events-auto transition-all duration-300 transform translate-x-full ${theme}`;
  toast.innerHTML = `<span>${msg}</span>`;

  container.appendChild(toast);
  setTimeout(() => toast.classList.remove("translate-x-full"), 20);
  setTimeout(() => {
    toast.classList.add("translate-x-full", "opacity-0");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
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

// ==========================================
// 12. INITIALIZATION ON APP LOAD
// ==========================================
window.addEventListener("DOMContentLoaded", () => {
  initUser();
  triggerInAppAutoAd();
  listenToPublicVideos();
  listenToChat();
  listenToWithdrawals();
  listenToLeaderboard();
  updateTaskWindowBadge();
});