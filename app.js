
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, update, get, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBwpa8mA83JAv2A2Dj0rh5VHwodyv5N3dg",
    authDomain: "freegcash-ads.firebaseapp.com",
    databaseURL: "https://freegcash-ads-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "freegcash-ads",
    storageBucket: "freegcash-ads.firebasestorage.app",
    messagingSenderId: "608086825364",
    appId: "1:608086825364:web:3a8e628d231b52c6171781"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- Telegram & User Data ---
const tg = window.Telegram?.WebApp;
tg?.ready();
const user = tg?.initDataUnsafe?.user || { id: "99999", first_name: "LocalDev", username: "LocalDev" };
const username = `@${user.username || user.first_name}`;
document.getElementById("userBar").innerText = `👤 ${username}`;

let balance = 0;
let reloadCount = 0;
let giftCount = 0;
let currentTaskUrl = "";
let currentTaskIdx = -1;
let cooldowns = {};

const REWARD_MAIN = 0.00014;
const REWARD_GIFT = 0.00004;
const GIFT_LINK = "https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca";

// --- Links Array ---
const taskLinks = [
    "https://sentinelgroup3.blogspot.com/?m=1", "https://sentinelgroup7.blogspot.com/?m=1",
    "https://sentinelgroup6.blogspot.com/?m=1", "https://sentinelgroup5.blogspot.com/?m=1",
    "https://sentinelgroup4.blogspot.com/?m=1", "https://sentinelgroup2.blogspot.com/?m=1",
    "https://sentinelgroup1.blogspot.com/?m=1", "https://withdrawaldashboardadmin.blogspot.com/?m=1",
    "https://farfightimi.blogspot.com/?m=1", "https://lefthandedfirstofall.blogspot.com/?m=1",
    "https://kayee01.blogspot.com/?m=1", "https://paperhouse01.blogspot.com/?m=1",
    "https://funnyfaces252.blogspot.com/?m=1", "https://sentinelgroup13.blogspot.com/?m=1",
    "https://sentinelgroup12.blogspot.com/?m=1", "https://sentinelgroup11.blogspot.com/?m=1",
    "https://sentinelgroup10.blogspot.com/?m=1", "https://sentinelgroup9.blogspot.com/?m=1",
    "https://sentinelgroup8.blogspot.com/?m=1", "https://sentinelgroup18.blogspot.com/?m=1",
    "https://sentinelgroup17.blogspot.com/?m=1", "https://sentinelgroup16.blogspot.com/?m=1",
    "https://sentinelgroup15.blogspot.com/?m=1", "https://sentinelgroup14.blogspot.com/?m=1",
    "https://isaiahrossoticoblog5.blogspot.com/?m=1", "https://isaiahrossoticoblog4.blogspot.com/?m=1",
    "https://isaiahrossoticoblog3.blogspot.com/?m=1", "https://isaiahrossoticoblog2.blogspot.com/?m=1",
    "https://isaiahrossotico1.blogspot.com/?m=1"
];

// --- Initialization ---
async function startApp() {
    const snap = await get(ref(db, 'users/' + user.id));
    if (snap.exists()) {
        balance = snap.val().balance || 0;
        cooldowns = snap.val().cooldowns || {};
        document.getElementById('ref-status').innerText = `Referrals: ${snap.val().referrals || 0}`;
    } else {
        await set(ref(db, 'users/' + user.id), { balance: 0, username: username, referrals: 0 });
    }
    updateBalanceUI();
    renderTasks();
}

function renderTasks() {
    const grid = document.getElementById('task-grid');
    grid.innerHTML = "";
    const now = Date.now();

    taskLinks.forEach((link, i) => {
        const lastDone = cooldowns[i] || 0;
        const isLocked = (now - lastDone) < (2 * 60 * 60 * 1000); // 2 hours

        const card = document.createElement('div');
        card.className = `glass p-6 rounded-3xl text-center border border-white/5 transition-all ${isLocked ? 'locked-card' : 'active:scale-95 cursor-pointer'}`;
        
        let label = "READY";
        if(isLocked) {
            const minLeft = Math.ceil((2*60*60*1000 - (now - lastDone))/60000);
            label = `${minLeft}m`;
        }

        card.innerHTML = `<i class="fas fa-globe text-blue-400 mb-2"></i><p class="text-[10px] font-bold">LINK #${i+1}</p><p class="text-[9px] text-green-400">${label}</p>`;
        
        if(!isLocked) card.onclick = () => openTask(link, i);
        grid.appendChild(card);
    });
}

// --- Task Flow ---
window.openTask = (url, idx) => {
    show_10555746().then(() => {
        currentTaskUrl = url;
        currentTaskIdx = idx;
        reloadCount = 0;
        giftCount = 0;
        
        document.getElementById('task-overlay').style.display = 'block';
        document.getElementById('task-iframe').src = url;
        document.getElementById('reload-stat').innerText = `RELOADS: 0/4`;
        document.getElementById('gift-stat').innerText = `Gifts: 0/4`;
        document.getElementById('task-progress').style.width = '0%';
        document.getElementById('claim-final-btn').classList.add('hidden');
        document.getElementById('gift-btn').classList.remove('hidden');
        document.getElementById('reload-wrapper').classList.remove('hidden');
    });
};

// Requirement: Manual Tap to Reload
window.handleManualReload = () => {
    if(reloadCount >= 4) return;

    const wrapper = document.getElementById('reload-wrapper');
    const msg = document.getElementById('cooldown-msg');

    reloadCount++;
    document.getElementById('task-iframe').src = currentTaskUrl;
    document.getElementById('reload-stat').innerText = `RELOADS: ${reloadCount}/4`;
    document.getElementById('task-progress').style.width = `${(reloadCount/4)*100}%`;

    wrapper.classList.add('cooldown-active');
    msg.classList.remove('hidden');

    let sec = 8;
    const cd = setInterval(() => {
        sec--;
        msg.innerText = `COOLDOWN: ${sec}s (Tap Website to reload)`;
        if(sec <= 0) {
            clearInterval(cd);
            wrapper.classList.remove('cooldown-active');
            msg.classList.add('hidden');
            checkCompletion();
        }
    }, 1000);
};

// Gift Task Logic
window.handleGiftClick = () => {
    if(giftCount >= 4) return;
    
    window.open(GIFT_LINK, '_blank');
    show_10555727().then(() => {
        setTimeout(async () => {
            giftCount++;
            balance += REWARD_GIFT;
            await update(ref(db, 'users/' + user.id), { balance: balance });
            updateBalanceUI();
            
            document.getElementById('gift-stat').innerText = `Gifts: ${giftCount}/4`;
            if(giftCount >= 4) document.getElementById('gift-btn').classList.add('hidden');
            checkCompletion();
            alert(`+0.00004 USDT Gained!`);
        }, 10000);
    });
};

function checkCompletion() {
    if(reloadCount >= 4 && giftCount >= 4) {
        document.getElementById('claim-final-btn').classList.remove('hidden');
        document.getElementById('reload-wrapper').classList.add('hidden');
    }
}

window.finishTask = async () => {
    balance += REWARD_MAIN;
    cooldowns[currentTaskIdx] = Date.now();
    
    await update(ref(db, 'users/' + user.id), { 
        balance: balance,
        cooldowns: cooldowns 
    });

    closeTask();
    updateBalanceUI();
    renderTasks();
};

window.closeTask = () => {
    document.getElementById('task-overlay').style.display = 'none';
    document.getElementById('task-iframe').src = '';
};

// --- Withdraw System (Min 0.02) ---
window.openWithdraw = () => document.getElementById('withdraw-modal').classList.remove('hidden');
window.closeWithdraw = () => document.getElementById('withdraw-modal').classList.add('hidden');

window.requestWithdraw = async () => {
    const amt = parseFloat(document.getElementById('wd-amount').value);
    const addr = document.getElementById('wd-address').value;
    const meth = document.getElementById('wd-method').value;

    if (amt < 0.02) return alert("Minimum withdrawal is 0.02 USDT");
    if (amt > balance) return alert("Insufficient balance");

    const wdId = push(ref(db, 'withdrawals')).key;
    await set(ref(db, 'withdrawals/' + wdId), {
        uid: user.id,
        user: username,
        amount: amt,
        method: meth,
        address: addr,
        status: 'pending',
        time: new Date().toLocaleString()
    });

    balance -= amt;
    await update(ref(db, 'users/' + user.id), { balance: balance });
    updateBalanceUI();
    closeWithdraw();
    alert("Request Sent! Admin will review shortly.");
};

// --- Admin Logic ---
window.openAdmin = () => document.getElementById('admin-modal').classList.remove('hidden');
window.closeAdmin = () => document.getElementById('admin-modal').classList.add('hidden');

window.tryAdminLogin = () => {
    if(document.getElementById('admin-pass').value === "Propetas12") {
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        listenWithdrawals();
    } else {
        alert("Wrong PIN");
    }
};

function listenWithdrawals() {
    onValue(ref(db, 'withdrawals'), (snap) => {
        const list = document.getElementById('admin-wd-list');
        list.innerHTML = "";
        snap.forEach(child => {
            const val = child.val();
            if(val.status === 'pending') {
                const item = document.createElement('div');
                item.className = "glass p-4 rounded-xl border border-white/10 text-xs";
                item.innerHTML = `
                    <p class="text-blue-400 font-bold mb-1">${val.user} (${val.time})</p>
                    <p>Method: ${val.method} | Address: ${val.address}</p>
                    <p class="text-lg font-mono my-2">${val.amount} USDT</p>
                    <div class="flex gap-2">
                        <button onclick="adminAction('${child.key}', 'approved')" class="bg-green-600 px-4 py-1 rounded-lg">Approve</button>
                        <button onclick="adminAction('${child.key}', 'denied')" class="bg-red-600 px-4 py-1 rounded-lg">Deny</button>
                    </div>
                `;
                list.appendChild(item);
            }
        });
    });
}

window.adminAction = async (id, status) => {
    if(status === 'denied') {
        const snap = await get(ref(db, `withdrawals/${id}`));
        const wd = snap.val();
        const userSnap = await get(ref(db, `users/${wd.uid}/balance`));
        update(ref(db, `users/${wd.uid}`), { balance: userSnap.val() + wd.amount });
    }
    update(ref(db, `withdrawals/${id}`), { status: status });
    alert(`Request ${status}`);
};

// --- Helpers ---
function updateBalanceUI() {
    document.getElementById('balance-display').innerText = balance.toFixed(5);
}

window.copyRef = () => {
    const link = `https://t.me/PaperhouseCorporationAPP_bot/start?startapp=${user.id}`;
    navigator.clipboard.writeText(link);
    alert("Referral link copied!");
};

document.getElementById('themePicker').oninput = (e) => {
    document.body.style.background = e.target.value;
};

startApp();
