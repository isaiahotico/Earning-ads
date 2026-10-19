/**
 * Paperhouse Inc. - Core Application Script
 * Ad CDN, Task Engine, YouTube Hub, Live Chat & Withdrawal System
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

// Conversion Constants
const PHP_TO_USD = 0.018; // ₱1.00 = $0.018 USD
const ADMIN_PASS = "Propetas12";

// Local User State
let currentUser = {
  uid: localStorage.getItem("ph_uid") || null,
  name: localStorage.getItem("ph_username") || null,
  balance: 0.00
};

// Task State
let taskState = {
  popupCompleted: false,
  rewardedCount: 0,
  claimsToday: 0,
  lastClaimHour: null
};

// ==========================================
// 2. IN-APP AUTO-INTERSTITIAL (5-MIN COOLDOWN)
// ==========================================
function initAutoInAppAds() {
  const lastAdTime = localStorage.getItem("ph_last_inapp_ad");
  const now = Date.now();
  const cooldownMs = 5 * 60 * 1000; // 5 minutes cooldown

  if (!lastAdTime || now - parseInt(lastAdTime, 10) >= cooldownMs) {
    if (typeof window.show_10555663 === 'function') {
      try {
        window.show_10555663({
          type: 'inApp',
          inAppSettings: {
            frequency: 2,
            capping: 0.1,
            interval: 30,
            timeout: 5,
            everyPage: false
          }
        });
        localStorage.setItem("ph_last_inapp_ad", now.toString());
      } catch (e) {
        console.warn("Auto InApp ad trigger error:", e);
      }
    }
  }
}

// ==========================================
// 3. USER MANAGEMENT & IDENTIFICATION
// ==========================================
function initUser() {
  if (!currentUser.uid) {
    currentUser.uid = 'user_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem("ph_uid", currentUser.uid);
  }

  if (!currentUser.name) {
    document.getElementById("username-modal").classList.remove("hidden");
  } else {
    document.getElementById("chat-user-label").textContent = `Logged in as: ${currentUser.name}`;
    listenToUserData();
  }
}

function saveUserProfile() {
  const input = document.getElementById("username-input").value.trim();
  if (input.length < 3) {
    showToast("Please enter a username with at least 3 characters", "error");
    return;
  }
  currentUser.name = input;
  localStorage.setItem("ph_username", input);
  document.getElementById("username-modal").classList.add("hidden");
  document.getElementById("chat-user-label").textContent = `Logged in as: ${currentUser.name}`;

  // Register in DB if new
  db.ref(`users/${currentUser.uid}`).update({
    name: currentUser.name,
    updatedAt: Date.now()
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
      // Init new user record in DB
      userRef.set({
        name: currentUser.name,
        balance: 0.00,
        createdAt: Date.now()
      });
    }
  });

  // Load Task State for today
  loadTodayTaskProgress();
}

function updateBalanceDisplay() {
  const phpFormatted = `₱${currentUser.balance.toFixed(2)}`;
  const usdFormatted = `$${(currentUser.balance * PHP_TO_USD).toFixed(3)}`;
  document.getElementById("top-balance-display").textContent = `${phpFormatted} / ${usdFormatted}`;
  document.getElementById("wallet-balance-php").textContent = phpFormatted;
  document.getElementById("wallet-balance-usd").textContent = `≈ ${usdFormatted} USD`;
}

// ==========================================
// 4. TAB NAVIGATION & WORKSPACE IFRAMES
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

const workSites = [
  "https://viefaucet.com?r=68cbac6ff3d6128dca2a1878",
  "https://luckywatch.pro/u/oybaf"
];

function switchWorkSite(index) {
  const url = workSites[index - 1];
  const iframe = document.getElementById("work-iframe");
  iframe.src = url;
  document.getElementById("current-work-url").textContent = url;
  document.getElementById("work-ext-link").href = url;

  document.querySelectorAll(".site-tab-btn").forEach((btn, i) => {
    if (i === index - 1) {
      btn.classList.add("bg-amber-500", "text-slate-900");
      btn.classList.remove("bg-slate-800", "text-slate-300");
    } else {
      btn.classList.remove("bg-amber-500", "text-slate-900");
      btn.classList.add("bg-slate-800", "text-slate-300");
    }
  });
}

function reloadWorkIframe() {
  const iframe = document.getElementById("work-iframe");
  iframe.src = iframe.src;
}

// ==========================================
// 5. YOUTUBE PLAYER & PUBLIC POSTING
// ==========================================
function extractYouTubeID(url) {
  if (!url) return null;
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : (url.length === 11 ? url : null);
}

function playCustomVideo() {
  const input = document.getElementById("yt-url-input").value.trim();
  const videoId = extractYouTubeID(input);
  if (!videoId) {
    showToast("Invalid YouTube URL or ID format", "error");
    return;
  }
  document.getElementById("main-yt-iframe").src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  showToast("Playing video inside Paperhouse Player!", "success");
}

function postVideoToPublic() {
  const input = document.getElementById("yt-url-input").value.trim();
  const videoId = extractYouTubeID(input);
  if (!videoId) {
    showToast("Invalid YouTube URL to post", "error");
    return;
  }

  const postRef = db.ref("public_videos").push();
  postRef.set({
    videoId: videoId,
    postedBy: currentUser.name || "Anonymous",
    timestamp: Date.now()
  }).then(() => {
    showToast("Video posted to Public Feed!", "success");
    document.getElementById("yt-url-input").value = "";
  });
}

function listenToPublicVideos() {
  db.ref("public_videos").limitToLast(12).on("value", snapshot => {
    const container = document.getElementById("public-yt-feed");
    container.innerHTML = "";
    const list = [];
    snapshot.forEach(child => {
      list.unshift(child.val());
    });

    if (list.length === 0) {
      container.innerHTML = `<div class="col-span-full text-center text-xs text-slate-500 py-4">No public videos posted yet. Be the first!</div>`;
      return;
    }

    list.forEach(v => {
      const card = document.createElement("div");
      card.className = "bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden hover:border-red-500/50 transition cursor-pointer flex flex-col";
      card.onclick = () => {
        document.getElementById("main-yt-iframe").src = `https://www.youtube.com/embed/${v.videoId}?autoplay=1`;
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
      card.innerHTML = `
        <div class="relative aspect-video bg-black">
          <img src="https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg" alt="Thumbnail" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition">
            <i class="fa-solid fa-play text-red-500 text-3xl"></i>
          </div>
        </div>
        <div class="p-2.5 flex justify-between items-center text-xs">
          <span class="text-slate-400 truncate">Posted by <b class="text-slate-200">${escapeHtml(v.postedBy)}</b></span>
          <span class="text-red-400 font-bold"><i class="fa-solid fa-play"></i> Watch</span>
        </div>
      `;
      container.appendChild(card);
    });
  });
}

// ==========================================
// 6. AD SDK FUNCTIONS & HOURLY TASK SYSTEM
// ==========================================

// Check if current local time is in 13:30 - 20:00
function isTaskTimeWindowOpen() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = 13 * 60 + 30; // 13:30
  const endMinutes = 20 * 60;        // 20:00
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

function updateTaskBadge() {
  const badge = document.getElementById("task-window-badge");
  const isOpen = isTaskTimeWindowOpen();
  if (isOpen) {
    badge.className = "px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-500 text-emerald-300";
    badge.innerHTML = `<i class="fa-solid fa-clock"></i> Active Now (Open until 20:00)`;
  } else {
    badge.className = "px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 border border-rose-500 text-rose-300";
    badge.innerHTML = `<i class="fa-solid fa-lock"></i> Locked (Opens at 13:30)`;
  }
}
setInterval(updateTaskBadge, 30000);

// Helper for date key (YYYY-MM-DD)
function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadTodayTaskProgress() {
  const today = getTodayKey();
  const taskRef = db.ref(`user_tasks/${currentUser.uid}/${today}`);

  taskRef.on("value", snapshot => {
    const data = snapshot.val() || {};
    taskState.popupCompleted = !!data.popupCompleted;
    taskState.rewardedCount = data.rewardedCount || 0;
    taskState.claimsToday = data.claimsToday || 0;
    taskState.lastClaimHour = data.lastClaimHour !== undefined ? data.lastClaimHour : null;

    renderTaskUI();
  });
}

function renderTaskUI() {
  const popStatus = document.getElementById("pop-task-status");
  if (taskState.popupCompleted) {
    popStatus.className = "font-bold text-emerald-400";
    popStatus.innerHTML = `<i class="fa-solid fa-check"></i> Completed`;
  } else {
    popStatus.className = "font-bold text-red-400";
    popStatus.innerHTML = `<i class="fa-solid fa-xmark"></i> Incomplete`;
  }

  document.getElementById("rewarded-ad-count").textContent = taskState.rewardedCount;
  const pct = Math.min(100, (taskState.rewardedCount / 52) * 100);
  document.getElementById("rewarded-progress-bar").style.width = `${pct}%`;

  const rewardedStatus = document.getElementById("rewarded-task-status");
  if (taskState.rewardedCount >= 52) {
    rewardedStatus.className = "font-bold text-emerald-400";
    rewardedStatus.innerHTML = `<i class="fa-solid fa-check"></i> Completed (52/52)`;
  } else {
    rewardedStatus.className = "font-bold text-red-400";
    rewardedStatus.innerHTML = `<i class="fa-solid fa-xmark"></i> ${taskState.rewardedCount}/52`;
  }

  document.getElementById("claims-today-counter").textContent = taskState.claimsToday;

  // Check if eligible to claim
  const nowHour = new Date().getHours();
  const alreadyClaimedThisHour = (taskState.lastClaimHour === nowHour);
  const eligible = isTaskTimeWindowOpen() &&
                   taskState.popupCompleted &&
                   taskState.rewardedCount >= 52 &&
                   taskState.claimsToday < 6 &&
                   !alreadyClaimedThisHour;

  const claimBtn = document.getElementById("claim-task-btn");
  if (eligible) {
    claimBtn.disabled = false;
    claimBtn.className = "w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 text-slate-950 font-extrabold rounded-xl shadow-lg cursor-pointer transition text-sm flex items-center justify-center gap-2 animate-pulse";
  } else {
    claimBtn.disabled = true;
    claimBtn.className = "w-full sm:w-auto px-6 py-2.5 bg-slate-800 text-slate-500 cursor-not-allowed font-extrabold rounded-xl transition text-sm flex items-center justify-center gap-2";
  }
}

// 1. Popup Interstitial
function callPopAd() {
  return new Promise((resolve, reject) => {
    if (typeof window.show_10555663 === 'function') {
      window.show_10555663('pop')
        .then(() => resolve())
        .catch(err => {
          console.warn("Pop ad error:", err);
          // If ad-blocker or SDK glitch, fulfill for smooth UX
          resolve();
        });
    } else {
      alert("[Demo Mode] Popup Ad Triggered! (SDK blocked or not loaded)");
      resolve();
    }
  });
}

// 2. Rewarded Interstitial
function callRewardedAd() {
  return new Promise((resolve) => {
    if (typeof window.show_10555663 === 'function') {
      window.show_10555663()
        .then(() => {
          resolve();
        })
        .catch(err => {
          console.warn("Rewarded ad error:", err);
          resolve();
        });
    } else {
      alert("[Demo Mode] Rewarded Ad Seen!");
      resolve();
    }
  });
}

// Button actions in Office
function triggerPopupInterstitial() {
  callPopAd().then(() => {
    showToast("Popup ad completed!", "info");
    recordAdImpression();
  });
}

function triggerRewardedInterstitial() {
  callRewardedAd().then(() => {
    showToast("Rewarded ad completed!", "info");
    recordAdImpression();
  });
}

// Hourly Task Trigger 1: Popup Ad
function runPopAdTask() {
  callPopAd().then(() => {
    const today = getTodayKey();
    db.ref(`user_tasks/${currentUser.uid}/${today}`).update({
      popupCompleted: true
    }).then(() => {
      showToast("Step 1 Complete: Popup Ad Confirmed!", "success");
      recordAdImpression();
    });
  });
}

// Hourly Task Trigger 2: Rewarded Ad (Need 52 count)
function runRewardedAdTask() {
  callRewardedAd().then(() => {
    const today = getTodayKey();
    const newCount = (taskState.rewardedCount || 0) + 1;

    db.ref(`user_tasks/${currentUser.uid}/${today}`).update({
      rewardedCount: newCount
    }).then(() => {
      showToast(`Ad counted! (${newCount}/52)`, "success");
      recordAdImpression();
    });
  });
}

// Claim Hourly ₱1.00 ($0.018) Reward
function claimHourlyTaskReward() {
  if (!isTaskTimeWindowOpen()) {
    showToast("Tasks are only active between 13:30 and 20:00!", "error");
    return;
  }
  if (!taskState.popupCompleted || taskState.rewardedCount < 52) {
    showToast("Please complete 1 popup ad and 52 rewarded ads first!", "error");
    return;
  }
  if (taskState.claimsToday >= 6) {
    showToast("Daily limit reached! You have claimed 6 times today.", "error");
    return;
  }

  const currentHour = new Date().getHours();
  if (taskState.lastClaimHour === currentHour) {
    showToast("You have already claimed for this hour! Return next hour.", "error");
    return;
  }

  const today = getTodayKey();
  const rewardPHP = 1.00;

  // Atomically update balance & task reset
  db.ref(`users/${currentUser.uid}/balance`).transaction(curr => {
    return (curr || 0) + rewardPHP;
  }, (error, committed) => {
    if (committed) {
      db.ref(`user_tasks/${currentUser.uid}/${today}`).update({
        claimsToday: (taskState.claimsToday || 0) + 1,
        lastClaimHour: currentHour,
        // Reset counters for the next hour's round
        popupCompleted: false,
        rewardedCount: 0
      });
      showToast("🎉 ₱1.00 ($0.018) added to your balance!", "success");
    }
  });
}

// Record Ad Count for Daily Leaderboard
function recordAdImpression() {
  const today = getTodayKey();
  db.ref(`leaderboard/${today}/${currentUser.uid}`).transaction(curr => {
    return {
      name: currentUser.name || "Anonymous",
      count: ((curr && curr.count) || 0) + 1,
      lastSeen: Date.now()
    };
  });
}

// ==========================================
// 7. DAILY LEADERBOARD
// ==========================================
function listenToLeaderboard() {
  const today = getTodayKey();
  document.getElementById("leaderboard-date-badge").textContent = `Date: ${today}`;

  db.ref(`leaderboard/${today}`).orderByChild("count").limitToLast(50).on("value", snapshot => {
    const tbody = document.getElementById("leaderboard-tbody");
    tbody.innerHTML = "";

    const rows = [];
    snapshot.forEach(child => {
      rows.unshift(child.val());
    });

    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-slate-500">No ad watches logged today yet.</td></tr>`;
      return;
    }

    rows.forEach((r, idx) => {
      const tr = document.createElement("tr");
      let rankBadge = `<span class="text-slate-400 font-bold">#${idx + 1}</span>`;
      if (idx === 0) rankBadge = `<span class="text-amber-400 font-black"><i class="fa-solid fa-crown"></i> #1</span>`;
      else if (idx === 1) rankBadge = `<span class="text-slate-300 font-bold"><i class="fa-solid fa-medal"></i> #2</span>`;
      else if (idx === 2) rankBadge = `<span class="text-amber-600 font-bold"><i class="fa-solid fa-medal"></i> #3</span>`;

      tr.innerHTML = `
        <td class="py-3 px-4">${rankBadge}</td>
        <td class="py-3 px-4 font-semibold text-slate-200">${escapeHtml(r.name)}</td>
        <td class="py-3 px-4 text-right font-extrabold text-amber-400">${r.count} ads</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

// ==========================================
// 8. LIVE CHAT SYSTEM
// ==========================================
function sendChatMessage(e) {
  e.preventDefault();
  const input = document.getElementById("chat-text-input");
  const text = input.value.trim();
  if (!text) return;

  db.ref("public_chat").push({
    sender: currentUser.name || "Anonymous",
    uid: currentUser.uid,
    message: text,
    timestamp: Date.now()
  });

  input.value = "";
}

function listenToChat() {
  const chatBox = document.getElementById("chat-messages-box");
  db.ref("public_chat").limitToLast(60).on("value", snapshot => {
    chatBox.innerHTML = "";
    snapshot.forEach(child => {
      const msg = child.val();
      const isMe = msg.uid === currentUser.uid;

      const bubble = document.createElement("div");
      bubble.className = `flex flex-col ${isMe ? 'items-end' : 'items-start'}`;

      const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      bubble.innerHTML = `
        <div class="text-[10px] text-slate-400 mb-0.5 px-1">${escapeHtml(msg.sender)} • ${timeStr}</div>
        <div class="max-w-[80%] rounded-2xl px-3.5 py-2 text-xs shadow-md ${isMe ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none' : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'}">
          ${escapeHtml(msg.message)}
        </div>
      `;
      chatBox.appendChild(bubble);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

// ==========================================
// 9. WITHDRAWAL SYSTEM & HISTORY
// ==========================================
function toggleWithdrawPlaceholder() {
  const method = document.getElementById("withdraw-method").value;
  const label = document.getElementById("withdraw-account-label");
  const input = document.getElementById("withdraw-account");
  if (method === "GCash") {
    label.textContent = "GCash Mobile Number";
    input.placeholder = "09xxxxxxxxx";
  } else {
    label.textContent = "FaucetPay Email Address";
    input.placeholder = "user@example.com";
  }
}

function submitWithdrawal(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("withdraw-amount").value);
  const method = document.getElementById("withdraw-method").value;
  const account = document.getElementById("withdraw-account").value.trim();

  if (isNaN(amount) || amount < 1.00) {
    showToast("Minimum withdrawal is ₱1.00 ($0.018)", "error");
    return;
  }
  if (amount > currentUser.balance) {
    showToast("Insufficient balance for this withdrawal!", "error");
    return;
  }
  if (!account) {
    showToast("Please provide your destination account details", "error");
    return;
  }

  // Deduct balance atomically and push request
  db.ref(`users/${currentUser.uid}/balance`).transaction(curr => {
    if ((curr || 0) >= amount) {
      return curr - amount;
    } else {
      return; // abort
    }
  }, (err, committed) => {
    if (committed) {
      const withdrawalRef = db.ref("withdrawals").push();
      const payload = {
        id: withdrawalRef.key,
        uid: currentUser.uid,
        userName: currentUser.name || "Anonymous",
        amount: amount,
        usdEquivalent: (amount * PHP_TO_USD).toFixed(3),
        method: method,
        accountDetail: account,
        status: "Pending",
        timestamp: Date.now()
      };

      withdrawalRef.set(payload).then(() => {
        showToast("Withdrawal request submitted successfully!", "success");
        document.getElementById("withdraw-amount").value = "";
        document.getElementById("withdraw-account").value = "";
      });
    } else {
      showToast("Transaction failed. Insufficient balance.", "error");
    }
  });
}

// Listen to all withdrawal records (Display all-time history)
function listenToWithdrawals() {
  db.ref("withdrawals").orderByChild("timestamp").on("value", snapshot => {
    const tbody = document.getElementById("user-withdrawal-history");
    const adminTbody = document.getElementById("admin-withdrawal-tbody");

    tbody.innerHTML = "";
    adminTbody.innerHTML = "";

    const list = [];
    let totalPaid = 0;
    let pendingCount = 0;
    let approvedCount = 0;

    snapshot.forEach(child => {
      const item = child.val();
      item._key = child.key;
      list.unshift(item); // Newest first

      if (item.status === "Approved") {
        totalPaid += parseFloat(item.amount || 0);
        approvedCount++;
      } else if (item.status === "Pending") {
        pendingCount++;
      }
    });

    // Update Admin Stats
    document.getElementById("admin-total-paid").textContent = `₱${totalPaid.toFixed(2)}`;
    document.getElementById("admin-pending-count").textContent = pendingCount;
    document.getElementById("admin-approved-count").textContent = approvedCount;

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-slate-500">No withdrawal records found.</td></tr>`;
      adminTbody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-slate-500">No withdrawal records available.</td></tr>`;
      return;
    }

    list.forEach(w => {
      const dateStr = new Date(w.timestamp).toLocaleString();
      let statusColor = "bg-amber-500/20 text-amber-400 border border-amber-500/30";
      if (w.status === "Approved") statusColor = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      if (w.status === "Rejected") statusColor = "bg-red-500/20 text-red-400 border border-red-500/30";

      // User Table Row
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="py-2.5 px-3 text-slate-400 whitespace-nowrap">${dateStr}</td>
        <td class="py-2.5 px-3 font-semibold text-slate-200">${escapeHtml(w.userName)}</td>
        <td class="py-2.5 px-3 text-slate-300"><b>${escapeHtml(w.method)}:</b> ${escapeHtml(w.accountDetail)}</td>
        <td class="py-2.5 px-3 font-extrabold text-emerald-400">₱${parseFloat(w.amount).toFixed(2)}</td>
        <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}">${w.status}</span></td>
      `;
      tbody.appendChild(tr);

      // Admin Table Row
      const adminTr = document.createElement("tr");
      adminTr.innerHTML = `
        <td class="py-2.5 px-3 text-slate-400 whitespace-nowrap">${dateStr}</td>
        <td class="py-2.5 px-3 font-semibold text-slate-200">${escapeHtml(w.userName)}</td>
        <td class="py-2.5 px-3 font-medium text-slate-300">${escapeHtml(w.method)}</td>
        <td class="py-2.5 px-3 text-slate-300 font-mono text-[11px]">${escapeHtml(w.accountDetail)}</td>
        <td class="py-2.5 px-3 font-extrabold text-emerald-400">₱${parseFloat(w.amount).toFixed(2)}</td>
        <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}">${w.status}</span></td>
        <td class="py-2.5 px-3 text-right space-x-1">
          <button onclick="updateWithdrawalStatus('${w._key}', 'Approved')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-bold">Approve</button>
          <button onclick="updateWithdrawalStatus('${w._key}', 'Rejected')" class="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded text-[10px] font-bold">Reject</button>
        </td>
      `;
      adminTbody.appendChild(adminTr);
    });
  });
}

// ==========================================
// 10. ADMIN AUTH & CONTROLS
// ==========================================
function loginAdmin() {
  const pwd = document.getElementById("admin-password-input").value;
  if (pwd === ADMIN_PASS) {
    document.getElementById("admin-login-box").classList.add("hidden");
    document.getElementById("admin-dashboard-box").classList.remove("hidden");
    showToast("Admin session unlocked!", "success");
  } else {
    showToast("Invalid admin security password!", "error");
  }
}

function logoutAdmin() {
  document.getElementById("admin-password-input").value = "";
  document.getElementById("admin-dashboard-box").classList.add("hidden");
  document.getElementById("admin-login-box").classList.remove("hidden");
  showToast("Admin session logged out", "info");
}

function updateWithdrawalStatus(key, newStatus) {
  const ref = db.ref(`withdrawals/${key}`);
  ref.once("value", snap => {
    const data = snap.val();
    if (!data) return;

    // If changing from Rejected back to refund or vice-versa
    if (data.status !== "Rejected" && newStatus === "Rejected") {
      // Refund balance to user
      db.ref(`users/${data.uid}/balance`).transaction(curr => (curr || 0) + parseFloat(data.amount));
    }

    ref.update({
      status: newStatus,
      updatedAt: Date.now()
    }).then(() => {
      showToast(`Withdrawal status marked as ${newStatus}`, "info");
    });
  });
}

// ==========================================
// 11. TOAST ALERTS & UTILS
// ==========================================
function showToast(msg, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  let bg = "bg-slate-800 text-slate-100 border-slate-700";
  if (type === "success") bg = "bg-emerald-600 text-white border-emerald-500";
  if (type === "error") bg = "bg-red-600 text-white border-red-500";

  toast.className = `p-3 rounded-xl shadow-2xl text-xs font-semibold border flex items-center gap-2 pointer-events-auto transition-all duration-300 transform translate-x-full ${bg}`;
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
// 12. BOOTSTRAP APP ON LOAD
// ==========================================
window.addEventListener("DOMContentLoaded", () => {
  initUser();
  initAutoInAppAds();
  listenToPublicVideos();
  listenToChat();
  listenToWithdrawals();
  listenToLeaderboard();
  updateTaskBadge();
  switchWorkSite(1);
});