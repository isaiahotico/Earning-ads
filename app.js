/**
 * AETHERWATCH Engine & Portal Management
 * Supports: YouTube Embedded Feed, Multi-tab In-App Browser, 
 * Libtl SDK Ad Tasks (Popup & 52 Rewarded), GCash/FaucetPay Withdrawals,
 * Firebase RTDB Sync + Autonomous Offline Fallback, and Admin Console.
 */

// --- 1. FIREBASE CONFIGURATION & INITIALIZATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBwpa8mA83JAv2A2Dj0rh5VHwodyv5N3dg",
  authDomain: "freegcash-ads.firebaseapp.com",
  databaseURL: "https://freegcash-ads-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "freegcash-ads",
  storageBucket: "freegcash-ads.firebasestorage.app",
  messagingSenderId: "608086825364",
  appId: "1:608086825364:web:3a8e628d231b52c6171781"
};

let db = null;
let isFirebaseOnline = false;

try {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    isFirebaseOnline = true;
    console.log("Firebase Realtime Database initialized successfully.");
  }
} catch (err) {
  console.warn("Operating with local storage mode:", err);
}

// --- 2. LOCAL & GLOBAL STATE ---
const LOCAL_STORAGE_KEY = 'aetherwatch_user_v1';
const PESO_TO_USD = 0.018; // 1 PHP = 0.018 USD

let userState = {
  userId: 'usr_' + Math.random().toString(36).substring(2, 9),
  username: 'Member_' + Math.floor(1000 + Math.random() * 9000),
  balancePhp: 0.0,
  task: {
    popupCompleted: false,
    rewardedCount: 0,
    lastClaimDate: '',
    lastClaimTimestamp: 0,
    claimsToday: 0
  },
  withdrawals: []
};

// Default community videos
let communityVideos = [
  { id: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up - Official Music Video', author: 'Rick Astley' },
  { id: 'L_LUpnjgPso', title: 'Relaxing Coding Music - Chill Beats to Work', author: 'Lofi Records' }
];

// --- 3. STATE PERSISTENCE ---
function saveUserState() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userState));
  if (isFirebaseOnline && db) {
    db.ref('users/' + userState.userId + '/profile').set({
      username: userState.username,
      balancePhp: userState.balancePhp,
      claimsToday: userState.task.claimsToday
    });
  }
}

function loadUserState() {
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (local) {
    try {
      userState = Object.assign(userState, JSON.parse(local));
    } catch (e) {
      console.error(e);
    }
  }
  // Check daily reset for task claim counter
  const todayStr = new Date().toISOString().slice(0, 10);
  if (userState.task.lastClaimDate !== todayStr) {
    userState.task.lastClaimDate = todayStr;
    userState.task.claimsToday = 0;
    userState.task.popupCompleted = false;
    userState.task.rewardedCount = 0;
    saveUserState();
  }
}

// --- 4. AD SDK SAFE HANDLERS ---
/**
 * Executes Rewarded Interstitial
 */
function playRewardedInterstitialAd() {
  return new Promise((resolve) => {
    if (typeof window.show_10555663 === 'function') {
      window.show_10555663()
        .then(() => {
          resolve(true);
        })
        .catch((err) => {
          console.warn("Rewarded Ad failed or closed early:", err);
          // Allow completion fallback for uninterrupted user experience if blocked
          resolve(true);
        });
    } else {
      // Graceful simulator if script blocked by AdBlock or network
      alert("[Ad Simulation] Watching Rewarded Interstitial Ad (Zone: 10555663)...");
      setTimeout(() => resolve(true), 800);
    }
  });
}

/**
 * Executes Rewarded Popup Interstitial
 */
function playPopupInterstitialAd() {
  return new Promise((resolve) => {
    if (typeof window.show_10555663 === 'function') {
      window.show_10555663('pop')
        .then(() => {
          resolve(true);
        })
        .catch((err) => {
          console.warn("Popup Ad failed:", err);
          resolve(true);
        });
    } else {
      alert("[Ad Simulation] Watching Popup Interstitial Ad (Zone: 10555663)...");
      setTimeout(() => resolve(true), 800);
    }
  });
}

// --- 5. TIME WINDOW & TASK VALIDATOR (13:30 to 20:00) ---
function isWithinTaskWindow() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = 13 * 60 + 30; // 13:30 (810 mins)
  const endMinutes = 20 * 60;        // 20:00 (1200 mins)

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

function updateTaskWindowStatusUI() {
  const badge = document.getElementById('windowStatusBadge');
  const btnPopup = document.getElementById('btnTaskTriggerPopup');
  const btnRewarded = document.getElementById('btnTaskTriggerRewarded');
  const btnClaim = document.getElementById('btnClaimTaskReward');
  const notice = document.getElementById('claimLockNotice');

  const inWindow = isWithinTaskWindow();
  const now = Date.now();
  const hoursSinceLastClaim = (now - (userState.task.lastClaimTimestamp || 0)) / (1000 * 60 * 60);

  if (!inWindow) {
    badge.className = 'badge badge-rejected';
    badge.textContent = 'Window Closed (Open 13:30 - 20:00)';
  } else {
    badge.className = 'badge badge-approved';
    badge.textContent = 'Window Active (13:30 - 20:00)';
  }

  // Update Progress Count
  document.getElementById('step2CounterBadge').textContent = `${userState.task.rewardedCount} / 52`;
  document.getElementById('btnRewardedCount').textContent = userState.task.rewardedCount;
  const percent = Math.min(100, Math.round((userState.task.rewardedCount / 52) * 100));
  document.getElementById('rewardedProgressBar').style.width = `${percent}%`;

  // Step 1 UI
  if (userState.task.popupCompleted) {
    document.getElementById('step1StatusBadge').className = 'badge badge-approved';
    document.getElementById('step1StatusBadge').textContent = 'Completed ✓';
    btnPopup.disabled = true;
    btnRewarded.disabled = false;
  } else {
    document.getElementById('step1StatusBadge').className = 'badge badge-pending';
    document.getElementById('step1StatusBadge').textContent = 'Pending';
    btnPopup.disabled = false;
    btnRewarded.disabled = true;
  }

  // Claim Button Eligibility
  const canClaimByTime = hoursSinceLastClaim >= 1.0;
  const canClaimByCount = userState.task.claimsToday < 6;
  const isTasksComplete = userState.task.popupCompleted && userState.task.rewardedCount >= 52;

  document.getElementById('claimsTodayCount').textContent = userState.task.claimsToday;

  if (isTasksComplete && inWindow && canClaimByTime && canClaimByCount) {
    btnClaim.disabled = false;
    notice.textContent = "✅ All criteria met! Click button above to add ₱1.00 ($0.018) to your balance.";
    notice.style.color = "var(--accent)";
  } else {
    btnClaim.disabled = true;
    let reasons = [];
    if (!inWindow) reasons.push("Must be within 13:30 - 20:00");
    if (!userState.task.popupCompleted) reasons.push("Finish Step 1 (Popup)");
    if (userState.task.rewardedCount < 52) reasons.push(`Finish 52 Rewarded Ads (${userState.task.rewardedCount}/52)`);
    if (!canClaimByTime) {
      const waitMin = Math.ceil(60 - (hoursSinceLastClaim * 60));
      reasons.push(`Hourly cooldown active (Wait ${waitMin}m)`);
    }
    if (!canClaimByCount) reasons.push("Max 6 daily claims reached");

    notice.textContent = "Lock reasons: " + reasons.join(' • ');
    notice.style.color = "var(--text-muted)";
  }
}

// --- 6. YOUTUBE HELPER & FEED ENGINE ---
function extractYouTubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function renderVideoFeed() {
  const container = document.getElementById('videoFeedContainer');
  container.innerHTML = '';
  document.getElementById('videoCountLabel').textContent = `${communityVideos.length} videos`;

  communityVideos.forEach((vid) => {
    const item = document.createElement('div');
    item.className = 'feed-item';
    item.innerHTML = `
      <img src="https://img.youtube.com/vi/${vid.id}/mqdefault.jpg" class="feed-thumb" alt="thumbnail" />
      <div style="flex: 1; overflow: hidden;">
        <div style="font-weight: 600; font-size: 0.85rem; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${escapeHTML(vid.title)}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">By: ${escapeHTML(vid.author || 'Member')}</div>
      </div>
    `;
    item.addEventListener('click', () => {
      document.getElementById('mainYtPlayer').src = `https://www.youtube.com/embed/${vid.id}?autoplay=1`;
      document.getElementById('currentVideoTitle').textContent = vid.title;
      document.getElementById('currentVideoDesc').textContent = `Shared by ${vid.author || 'Community Member'}`;
    });
    container.appendChild(item);
  });
}

function listenFirebaseVideos() {
  if (!isFirebaseOnline || !db) return;
  db.ref('community_videos').limitToLast(30).on('value', (snap) => {
    const data = snap.val();
    if (data) {
      const list = Object.values(data);
      if (list.length > 0) {
        communityVideos = list.reverse();
        renderVideoFeed();
      }
    }
  });
}

// --- 7. WORKSPACE & OFFICE BROWSER ---
function setupWorkspace() {
  const iframe = document.getElementById('workspaceIframe');
  const directLink = document.getElementById('linkDirectOpen');

  document.getElementById('workTabNav').addEventListener('click', (e) => {
    if (!e.target.classList.contains('work-tab-btn')) return;
    document.querySelectorAll('.work-tab-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');

    let url = e.target.dataset.url;
    if (url === 'custom') {
      const customUrl = prompt('Enter website link (must begin with https://):', 'https://');
      if (customUrl && customUrl.startsWith('https://')) {
        url = customUrl;
      } else {
        return;
      }
    }

    iframe.src = url;
    directLink.href = url;
  });

  // Office Interstitial ad button
  document.getElementById('btnOfficePopupAd').addEventListener('click', () => {
    playPopupInterstitialAd().then(() => {
      alert('Popup ad completed!');
    });
  });

  // Office Rewarded ad button
  document.getElementById('btnOfficeRewardedAd').addEventListener('click', () => {
    playRewardedInterstitialAd().then(() => {
      alert('Rewarded interstitial completed!');
    });
  });
}

// --- 8. CHAT ENGINE ---
function setupChat() {
  const form = document.getElementById('formChat');
  const input = document.getElementById('chatInputMessage');
  const container = document.getElementById('chatMessagesContainer');

  function appendChatMessage(msg) {
    const isSelf = msg.senderId === userState.userId;
    const div = document.createElement('div');
    div.className = `chat-msg ${isSelf ? 'self' : ''}`;
    div.innerHTML = `
      <div class="chat-meta">
        <span>${escapeHTML(msg.senderName)}</span>
        <span>${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div>${escapeHTML(msg.text)}</div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    const payload = {
      senderId: userState.userId,
      senderName: userState.username,
      text: text,
      timestamp: Date.now()
    };

    if (isFirebaseOnline && db) {
      db.ref('community_chat').push(payload);
    } else {
      appendChatMessage(payload);
    }
    input.value = '';
  });

  if (isFirebaseOnline && db) {
    db.ref('community_chat').limitToLast(50).on('child_added', (snap) => {
      const msg = snap.val();
      if (msg) appendChatMessage(msg);
    });
  } else {
    // Initial friendly greeting in offline fallback
    appendChatMessage({
      senderId: 'sys',
      senderName: 'Host Admin',
      text: 'Welcome to AetherWatch Live Chat! Connect and discuss earnings.',
      timestamp: Date.now()
    });
  }
}

// --- 9. WITHDRAWAL & LEDGER LOGIC ---
function renderWithdrawals() {
  const tbody = document.getElementById('userWithdrawTableBody');
  tbody.innerHTML = '';

  if (userState.withdrawals.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No withdrawals requested yet.</td></tr>`;
    return;
  }

  userState.withdrawals.slice().reverse().forEach((w) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(w.timestamp).toLocaleString()}</td>
      <td><strong>${w.method}</strong></td>
      <td><code>${escapeHTML(w.destination)}</code></td>
      <td>₱${Number(w.amountPhp).toFixed(2)} ($${(w.amountPhp * PESO_TO_USD).toFixed(3)})</td>
      <td><span class="badge ${w.status === 'Approved' ? 'badge-approved' : (w.status === 'Rejected' ? 'badge-rejected' : 'badge-pending')}">${w.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function setupWithdrawalForm() {
  const methodSelect = document.getElementById('wMethod');
  const targetLabel = document.getElementById('wTargetLabel');
  const targetInput = document.getElementById('wTarget');
  const amountInput = document.getElementById('wAmount');
  const usdDisplay = document.getElementById('usdEquivalentDisplay');

  document.getElementById('wName').value = userState.username;

  methodSelect.addEventListener('change', () => {
    if (methodSelect.value === 'GCash') {
      targetLabel.textContent = 'GCash Mobile Number';
      targetInput.placeholder = '09XXXXXXXXX';
    } else {
      targetLabel.textContent = 'FaucetPay Registered Email';
      targetInput.placeholder = 'user@example.com';
    }
  });

  amountInput.addEventListener('input', () => {
    const val = parseFloat(amountInput.value) || 0;
    usdDisplay.textContent = `≈ ${(val * PESO_TO_USD).toFixed(3)} USD`;
  });

  document.getElementById('formWithdraw').addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(amountInput.value);
    const target = targetInput.value.trim();
    const name = document.getElementById('wName').value.trim();

    if (amount < 1.0) {
      alert("Minimum withdrawal is ₱1.00 ($0.018 USD).");
      return;
    }

    if (userState.balancePhp < amount) {
      alert(`Insufficient funds! Your balance is ₱${userState.balancePhp.toFixed(2)}`);
      return;
    }

    userState.balancePhp -= amount;
    userState.username = name;

    const requestObj = {
      id: 'tx_' + Date.now(),
      userId: userState.userId,
      userName: name,
      method: methodSelect.value,
      destination: target,
      amountPhp: amount,
      status: 'Pending',
      timestamp: Date.now()
    };

    userState.withdrawals.push(requestObj);
    saveUserState();
    updateHeaderUI();
    renderWithdrawals();

    // Push to Firebase for Admin processing
    if (isFirebaseOnline && db) {
      db.ref('admin_withdrawals/' + requestObj.id).set(requestObj);
    }

    alert("Withdrawal submitted successfully! The admin will review and release your payout.");
  });
}

// --- 10. ADMIN CONSOLE (Password: Propetas12) ---
let adminAuthenticated = false;

function setupAdmin() {
  const authForm = document.getElementById('formAdminAuth');
  const authBox = document.getElementById('adminAuthBox');
  const consoleArea = document.getElementById('adminConsole');
  const passInput = document.getElementById('adminPasswordInput');

  authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (passInput.value === 'Propetas12') {
      adminAuthenticated = true;
      authBox.style.display = 'none';
      consoleArea.style.display = 'flex';
      passInput.value = '';
      loadAdminData();
    } else {
      alert('Unauthorized! Incorrect Admin password.');
    }
  });

  document.getElementById('btnAdminLogout').addEventListener('click', () => {
    adminAuthenticated = false;
    authBox.style.display = 'block';
    consoleArea.style.display = 'none';
  });
}

function loadAdminData() {
  if (!adminAuthenticated) return;
  const tableBody = document.getElementById('adminPendingWithdrawTable');
  const totalDisplay = document.getElementById('adminTotalWithdrawn');

  if (isFirebaseOnline && db) {
    db.ref('admin_withdrawals').on('value', (snap) => {
      const data = snap.val() || {};
      const allTx = Object.values(data);
      renderAdminRows(allTx);
    });
  } else {
    // Local fallback demonstration
    renderAdminRows(userState.withdrawals);
  }

  function renderAdminRows(txList) {
    tableBody.innerHTML = '';
    const pendingList = txList.filter(t => t.status === 'Pending');
    const approvedTotal = txList
      .filter(t => t.status === 'Approved')
      .reduce((acc, curr) => acc + Number(curr.amountPhp), 0);

    totalDisplay.textContent = approvedTotal.toFixed(2);

    if (pendingList.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No pending withdrawals awaiting review.</td></tr>`;
      return;
    }

    pendingList.forEach((tx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code>${tx.id}</code></td>
        <td><strong>${escapeHTML(tx.userName)}</strong></td>
        <td>${tx.method}</td>
        <td><code>${escapeHTML(tx.destination)}</code></td>
        <td style="color: var(--gold); font-weight: 700;">₱${Number(tx.amountPhp).toFixed(2)}</td>
        <td>${new Date(tx.timestamp).toLocaleString()}</td>
        <td>
          <button class="btn btn-success" style="padding: 3px 8px; font-size: 0.75rem;" onclick="processAdminDecision('${tx.id}', 'Approved')">Approve</button>
          <button class="btn btn-danger" style="padding: 3px 8px; font-size: 0.75rem;" onclick="processAdminDecision('${tx.id}', 'Rejected')">Reject</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }
}

window.processAdminDecision = function(txId, status) {
  if (!adminAuthenticated) return;

  if (isFirebaseOnline && db) {
    db.ref('admin_withdrawals/' + txId).update({ status: status });
  }

  // Update in user local array if exists
  const localMatch = userState.withdrawals.find(w => w.id === txId);
  if (localMatch) {
    localMatch.status = status;
    if (status === 'Rejected') {
      userState.balancePhp += localMatch.amountPhp; // Refund on rejection
    }
    saveUserState();
    updateHeaderUI();
    renderWithdrawals();
  }

  alert(`Transaction ${txId} marked as ${status}.`);
  loadAdminData();
};

// --- 11. UTILITIES & HEADER UI ---
function updateHeaderUI() {
  document.getElementById('navUsername').textContent = userState.username;
  document.getElementById('navBalance').textContent = userState.balancePhp.toFixed(2);
  document.getElementById('navBalanceUsd').textContent = (userState.balancePhp * PESO_TO_USD).toFixed(3);
}

function escapeHTML(str) {
  const p = document.createElement('p');
  p.appendChild(document.createTextNode(str || ''));
  return p.innerHTML;
}

// --- 12. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  loadUserState();
  updateHeaderUI();
  renderVideoFeed();
  listenFirebaseVideos();
  setupWorkspace();
  setupChat();
  setupWithdrawalForm();
  renderWithdrawals();
  setupAdmin();

  // Navigation tab toggles
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Post YouTube Video form
  document.getElementById('formPostVideo').addEventListener('submit', (e) => {
    e.preventDefault();
    const url = document.getElementById('inputYtUrl').value.trim();
    const title = document.getElementById('inputYtTitle').value.trim();
    const videoId = extractYouTubeId(url);

    if (!videoId) {
      alert("Invalid YouTube URL! Please provide a standard YouTube video link.");
      return;
    }

    const newVideo = {
      id: videoId,
      title: title || 'Community Video',
      author: userState.username,
      timestamp: Date.now()
    };

    if (isFirebaseOnline && db) {
      db.ref('community_videos').push(newVideo);
    } else {
      communityVideos.unshift(newVideo);
      renderVideoFeed();
    }

    document.getElementById('inputYtUrl').value = '';
    document.getElementById('inputYtTitle').value = '';
    alert('Video published to Community Watch Feed!');
  });

  // Daily Task Step 1: Popup Interstitial trigger
  document.getElementById('btnTaskTriggerPopup').addEventListener('click', () => {
    playPopupInterstitialAd().then(() => {
      userState.task.popupCompleted = true;
      saveUserState();
      updateTaskWindowStatusUI();
      alert("Step 1 Completed! Now complete 52 Rewarded Interstitial clicks in Step 2.");
    });
  });

  // Daily Task Step 2: Rewarded Interstitial clicks (target: 52)
  document.getElementById('btnTaskTriggerRewarded').addEventListener('click', () => {
    if (!userState.task.popupCompleted) {
      alert("Please complete Step 1 (Popup Interstitial) first!");
      return;
    }

    playRewardedInterstitialAd().then(() => {
      userState.task.rewardedCount++;
      saveUserState();
      updateTaskWindowStatusUI();

      if (userState.task.rewardedCount >= 52) {
        alert("🎉 Congratulations! You have completed all 52 rewarded ads! Claim your reward now.");
      }
    });
  });

  // Daily Task Claim button (1 Peso / 0.018 USD)
  document.getElementById('btnClaimTaskReward').addEventListener('click', () => {
    if (!isWithinTaskWindow()) {
      alert("Reward claim is only valid between 13:30 and 20:00 everyday.");
      return;
    }

    // Grant 1 Peso (0.018 USD equivalent)
    userState.balancePhp += 1.0;
    userState.task.claimsToday += 1;
    userState.task.lastClaimTimestamp = Date.now();
    // Reset steps for next eligible claim cycle
    userState.task.popupCompleted = false;
    userState.task.rewardedCount = 0;

    saveUserState();
    updateHeaderUI();
    updateTaskWindowStatusUI();

    alert("🎉 ₱1.00 ($0.018 USD) has been credited to your balance! You can claim again after 1 hour (until 20:00).");
  });

  // Real-time window clock loop
  updateTaskWindowStatusUI();
  setInterval(updateTaskWindowStatusUI, 15000);
});