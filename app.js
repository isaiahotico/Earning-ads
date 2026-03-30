
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, update, get, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// --- Telegram Info ---
const tg = window.Telegram?.WebApp;
tg?.ready();
const user = tg?.initDataUnsafe?.user || { id: "99999", first_name: "Guest", username: "Guest" };
const userLabel = `@${user.username || user.first_name}`;
document.getElementById("userBar").innerText = `👤 ${userLabel}`;

// --- Global App State ---
let balance = 0;
let reloadCount = 0;
let giftCount = 0;
let activeLink = "";
let linkIndex = -1;
let userCooldowns = {};

const REWARD_MAIN = 0.00014;
const REWARD_GIFT = 0.00004;
const GIFT_URL = "https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca";

// --- Initialization ---
async function init() {
    const snapshot = await get(ref(db, 'users/' + user.id));
    if (snapshot.exists()) {
        balance = snapshot.val().balance || 0;
        userCooldowns = snapshot.val().cooldowns || {};
    } else {
        await set(ref(db, 'users/' + user.id), { balance: 0, username: userLabel, referrals: 0 });
    }
    updateBalanceDisplay();
    renderTaskButtons();
}

// --- Task Rendering & Cooldown ---
function renderTaskButtons() {
    const links = [
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

    const grid = document.getElementById('task-grid');
    grid.innerHTML = "";
    const now = Date.now();

    links.forEach((url, i) => {
        const lastTime = userCooldowns[i] || 0;
        const isLocked = (now - lastTime) < (2 * 60 * 60 * 1000); // 2 Hours

        const btn = document.createElement('button');
        btn.className = `glass p-5 rounded-2xl flex flex-col items-center justify-center gap-2 ${isLocked ? 'locked-btn' : 'hover:scale-105 active:scale-95'}`;
        
        let subText = isLocked ? "LOCKED" : "READY";
        if(isLocked) {
            const rem = Math.ceil(( (2*60*60*1000) - (now - lastTime) ) / 60000);
            subText = `${rem}m left`;
        }

        btn.innerHTML = `<i class="fas fa-link text-blue-400"></i> <span class="text-xs font-bold uppercase tracking-widest">Link #${i+1}</span> <span class="text-[10px] opacity-60">${subText}</span>`;
        
        if(!isLocked) btn.onclick = () => openTask(url, i);
        grid.appendChild(btn);
    });
}

// --- Task Core Logic ---
window.openTask = (url, index) => {
    // Show Ad 1
    show_10555746().then(() => {
        activeLink = url;
        linkIndex = index;
        reloadCount = 0;
        giftCount = 0;
        
        document.getElementById('task-overlay').style.display = 'block';
        document.getElementById('task-iframe').src = url;
        document.getElementById('reload-counter').innerText = "0/4";
        document.getElementById('gift-count').innerText = "Gifts: 0/4";
        document.getElementById('task-progress').style.width = "0%";
        document.getElementById('claim-btn').classList.add('hidden');
        document.getElementById('gift-btn').classList.remove('hidden');
        document.getElementById('click-layer').style.display = 'block';
    });
};

// --- Requirement 1: Click the website to reload manually ---
window.handleManualReload = () => {
    if(reloadCount >= 4) return;

    const layer = document.getElementById('click-layer');
    const timerUI = document.getElementById('cooldown-timer');

    reloadCount++;
    document.getElementById('task-iframe').src = activeLink; // Manual Reload Iframe
    document.getElementById('reload-counter').innerText = `${reloadCount}/4`;
    document.getElementById('task-progress').style.width = `${(reloadCount/4)*100}%`;

    // Start 8s Cooldown
    layer.classList.add('cooldown-active');
    timerUI.classList.remove('hidden');
    
    let time = 8;
    const interval = setInterval(() => {
        time--;
        timerUI.innerText = `COOLDOWN: ${time}s`;
        if(time <= 0) {
            clearInterval(interval);
            layer.classList.remove('cooldown-active');
            timerUI.classList.add('hidden');
            if(reloadCount >= 4) {
                layer.style.display = 'none'; // Unlock the actual iframe interaction if needed
                checkCompletion();
            }
        }
    }, 1000);
};

// --- Requirement 2: Gift Task 4x with 0.00004 Reward ---
window.handleGiftTask = () => {
    if(giftCount >= 4) return;

    const btn = document.getElementById('gift-btn');
    btn.disabled = true;
    
    // Open CPM Link
    window.open(GIFT_URL, '_blank');

    // Show Ad
    show_10555727().then(() => {
        setTimeout(async () => {
            giftCount++;
            balance += REWARD_GIFT;
            await update(ref(db, 'users/' + user.id), { balance: balance });
            updateBalanceDisplay();
            
            document.getElementById('gift-count').innerText = `Gifts: ${giftCount}/4`;
            btn.disabled = false;
            
            if(giftCount >= 4) btn.classList.add('hidden');
            checkCompletion();
            alert(`+0.00004 USDT Credited!`);
        }, 10000); // 10s wait as requested
    });
};

function checkCompletion() {
    if(reloadCount >= 4 && giftCount >= 4) {
        document.getElementById('claim-btn').classList.remove('hidden');
    }
}

window.claimFinalReward = async () => {
    balance += REWARD_MAIN;
    userCooldowns[linkIndex] = Date.now();
    
    await update(ref(db, 'users/' + user.id), { 
        balance: balance,
        cooldowns: userCooldowns
    });

    closeTask();
    renderTaskButtons();
    updateBalanceDisplay();
    alert("Task Complete! +0.00014 USDT Reward added.");
};

// --- Admin Section Fix ---
window.openAdmin = () => document.getElementById('admin-modal').classList.remove('hidden');
window.closeAdmin = () => document.getElementById('admin-modal').classList.add('hidden');

window.verifyAdmin = () => {
    const pass = document.getElementById('admin-pass').value;
    if(pass === "Propetas12") {
        document.getElementById('admin-auth').classList.add('hidden');
        document.getElementById('admin-dashboard').classList.remove('hidden');
        loadWithdrawals();
    } else {
        alert("Incorrect Admin Key");
    }
};

function loadWithdrawals() {
    const wdRef = ref(db, 'withdrawals');
    onValue(wdRef, (snapshot) => {
        const list = document.getElementById('withdrawal-list');
        list.innerHTML = "";
        snapshot.forEach((child) => {
            const data = child.val();
            if(data.status === 'pending') {
                const div = document.createElement('div');
                div.className = "glass p-4 rounded-xl flex justify-between items-center text-xs";
                div.innerHTML = `<div><p>User: ${data.username}</p><p>${data.method}: ${data.address}</p><p class="text-green-400 font-bold">$${data.amount}</p></div>
                <button onclick="approveWd('${child.key}')" class="bg-blue-600 px-3 py-1 rounded">Approve</button>`;
                list.appendChild(div);
            }
        });
    });
}

window.approveWd = (key) => update(ref(db, `withdrawals/${key}`), { status: 'approved' });

// --- UI Helpers ---
function updateBalanceDisplay() {
    document.getElementById('balance-display').innerText = balance.toFixed(5);
}

window.closeTask = () => {
    document.getElementById('task-overlay').style.display = 'none';
    document.getElementById('task-iframe').src = "";
};

window.openWithdraw = () => document.getElementById('withdraw-modal').classList.remove('hidden');
window.closeWithdraw = () => document.getElementById('withdraw-modal').classList.add('hidden');

window.processWithdrawRequest = async () => {
    const amt = parseFloat(document.getElementById('wd-amount').value);
    const addr = document.getElementById('wd-address').value;
    const method = document.getElementById('wd-method').value;

    if(amt > balance || amt < 0.01) return alert("Min withdrawal 0.01 USDT");

    const newWd = push(ref(db, 'withdrawals'));
    await set(newWd, {
        userId: user.id,
        username: userLabel,
        amount: amt,
        address: addr,
        method: method,
        status: 'pending',
        time: Date.now()
    });

    balance -= amt;
    await update(ref(db, 'users/' + user.id), { balance: balance });
    updateBalanceDisplay();
    closeWithdraw();
    alert("Request Submitted to Admin!");
};

window.copyRefLink = () => {
    const link = `https://t.me/PaperhouseCorporationAPP_bot/start?startapp=${user.id}`;
    navigator.clipboard.writeText(link);
    alert("Referral Link Copied!");
};

document.getElementById('themePicker').oninput = (e) => {
    document.body.style.background = e.target.value;
};

init();
