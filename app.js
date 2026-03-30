
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, update, get, push, onValue, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBwpa8mA83JAv2A2Dj0rh5VHwodyv5N3dg",
    authDomain: "facebook-follow-to-follow.firebaseapp.com",
    databaseURL: "https://facebook-follow-to-follow-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "facebook-follow-to-follow",
    storageBucket: "facebook-follow-to-follow.firebasestorage.app",
    messagingSenderId: "589427984313",
    appId: "1:589427984313:web:a17b8cc851efde6dd79868"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- User Logic ---
const tg = window.Telegram?.WebApp;
tg?.ready();
const tgUser = tg?.initDataUnsafe?.user || { id: "999", first_name: "Guest" };
const userName = `@${tgUser.username || tgUser.first_name}`;
document.getElementById('userBar').innerText = `👤 ${userName}`;

let myBalance = 0;
let myCooldowns = {};
let reloadCount = 0;
let giftCount = 0;
let activeIdx = -1;
let activeUrl = "";

const LINKS = [
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
async function init() {
    const snap = await get(ref(db, 'users/' + tgUser.id));
    if(snap.exists()){
        myBalance = snap.val().balance || 0;
        myCooldowns = snap.val().cooldowns || {};
    } else {
        await set(ref(db, 'users/' + tgUser.id), { balance: 0, username: userName });
    }
    updateUI();
    renderTasks();
    loadChat();
    loadLeaderboard();
}

// --- Navigation ---
window.switchTab = (tab) => {
    document.querySelectorAll('main').forEach(m => m.classList.add('hide'));
    document.querySelectorAll('.nav-tab').forEach(n => n.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.remove('hide');
    document.getElementById(`nav-${tab}`).classList.add('active');
};

// --- Task Logic ---
function renderTasks() {
    const grid = document.getElementById('task-grid');
    grid.innerHTML = "";
    const now = Date.now();
    LINKS.forEach((link, i) => {
        const last = myCooldowns[i] || 0;
        const isLock = (now - last) < (2*60*60*1000);
        const card = document.createElement('div');
        card.className = `glass p-4 rounded-2xl text-center ${isLock ? 'opacity-40' : 'active:scale-95'}`;
        card.innerHTML = `<i class="fas fa-link text-blue-400 mb-1"></i><p class="text-[10px] font-bold">TASK #${i+1}</p>
        <p class="text-[8px] text-green-400">${isLock ? 'Locked' : 'Ready'}</p>`;
        if(!isLock) card.onclick = () => startTask(link, i);
        grid.appendChild(card);
    });
}

window.startTask = (url, i) => {
    show_10555746().then(() => {
        activeUrl = url; activeIdx = i;
        reloadCount = 0; giftCount = 0;
        document.getElementById('task-overlay').style.display = 'block';
        document.getElementById('task-iframe').src = url;
        document.getElementById('reload-trigger').classList.remove('hide');
        document.getElementById('claim-btn').classList.add('hide');
        document.getElementById('reload-count-ui').innerText = "Tap Website: 0/4";
    });
};

window.manualReload = () => {
    if(reloadCount >= 4) return;
    const trigger = document.getElementById('reload-trigger');
    const cdText = document.getElementById('cooldown-text');
    
    reloadCount++;
    document.getElementById('task-iframe').src = activeUrl;
    document.getElementById('reload-count-ui').innerText = `Tap Website: ${reloadCount}/4`;
    document.getElementById('task-progress').style.width = (reloadCount/4*100)+'%';
    
    trigger.classList.add('cooldown-lock');
    cdText.classList.remove('hide');
    
    let s = 8;
    const int = setInterval(() => {
        s--; cdText.innerText = `COOLDOWN ${s}s`;
        if(s <= 0){
            clearInterval(int);
            trigger.classList.remove('cooldown-lock');
            cdText.classList.add('hide');
            if(reloadCount >= 4) {
                // FIXED: Hide trigger so user can click ads in iframe
                trigger.classList.add('hide'); 
                checkDone();
            }
        }
    }, 1000);
};

window.giftTask = () => {
    if(giftCount >= 4) return;
    window.open("https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca", "_blank");
    show_10555727().then(() => {
        setTimeout(async () => {
            giftCount++;
            myBalance += 0.00004;
            await update(ref(db, 'users/'+tgUser.id), { balance: myBalance });
            document.getElementById('gift-ui').innerText = `Gifts: ${giftCount}/4`;
            updateUI();
            checkDone();
        }, 10000);
    });
};

function checkDone() {
    if(reloadCount >= 4 && giftCount >= 4) document.getElementById('claim-btn').classList.remove('hide');
}

window.claimTask = async () => {
    myBalance += 0.00014;
    myCooldowns[activeIdx] = Date.now();
    await update(ref(db, 'users/'+tgUser.id), { balance: myBalance, cooldowns: myCooldowns });
    closeTask(); updateUI(); renderTasks();
};

window.closeTask = () => {
    document.getElementById('task-overlay').style.display = 'none';
    document.getElementById('task-iframe').src = "";
};

// --- Withdraw ---
window.submitWithdraw = async () => {
    const amt = parseFloat(document.getElementById('wd-amount').value);
    const addr = document.getElementById('wd-address').value;
    const meth = document.getElementById('wd-method').value;

    if(amt < 0.02 || amt > myBalance) return alert("Invalid Amount (Min 0.02)");

    const wdKey = push(ref(db, 'withdrawals')).key;
    await set(ref(db, 'withdrawals/'+wdKey), {
        uid: tgUser.id, user: userName, amount: amt, method: meth, address: addr, status: 'pending', date: new Date().toLocaleString()
    });
    myBalance -= amt;
    await update(ref(db, 'users/'+tgUser.id), { balance: myBalance });
    updateUI();
    closeModal('withdraw');
    alert("Request Sent!");
};

// --- Chat System ---
function loadChat() {
    onValue(ref(db, 'chat'), (snap) => {
        const box = document.getElementById('chat-box');
        box.innerHTML = "";
        snap.forEach(c => {
            const m = c.val();
            box.innerHTML += `<div><b class="text-blue-400">${m.user}:</b> <span class="text-gray-200">${m.msg}</span></div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

window.sendMessage = () => {
    const input = document.getElementById('chat-input');
    if(!input.value) return;
    push(ref(db, 'chat'), { user: userName, msg: input.value });
    input.value = "";
};

// --- Leaderboard ---
function loadLeaderboard() {
    onValue(ref(db, 'users'), (snap) => {
        const list = document.getElementById('leaderboard-list');
        let users = [];
        snap.forEach(u => users.push(u.val()));
        users.sort((a,b) => b.balance - a.balance);
        list.innerHTML = "";
        users.slice(0, 100).forEach((u, i) => {
            list.innerHTML += `<div class="glass p-3 rounded-xl flex justify-between items-center text-xs">
                <span>${i+1}. ${u.username}</span><span class="font-mono text-green-400">${u.balance.toFixed(5)} USDT</span>
            </div>`;
        });
    });
}

// --- Admin Section ---
window.adminLogin = () => {
    if(document.getElementById('admin-pass').value === "Propetas12") {
        document.getElementById('admin-login-ui').classList.add('hide');
        document.getElementById('admin-dashboard').classList.remove('hide');
        loadAdminWD();
    }
};

function loadAdminWD() {
    onValue(ref(db, 'withdrawals'), (snap) => {
        const list = document.getElementById('admin-wd-list');
        list.innerHTML = "";
        snap.forEach(c => {
            const w = c.val();
            if(w.status === 'pending'){
                const d = document.createElement('div');
                d.className = "glass p-4 rounded-xl text-xs";
                d.innerHTML = `<p>${w.user} - ${w.method}</p><p>${w.address}</p><p class="text-lg font-bold">${w.amount} USDT</p>
                <div class="flex gap-2 mt-2"><button onclick="adminAct('${c.key}','approved')" class="bg-green-600 px-4 py-1 rounded">Approve</button>
                <button onclick="adminAct('${c.key}','denied')" class="bg-red-600 px-4 py-1 rounded">Deny</button></div>`;
                list.appendChild(d);
            }
        });
    });
}

window.adminAct = async (key, status) => {
    if(status === 'denied'){
        const snap = await get(ref(db, 'withdrawals/'+key));
        const w = snap.val();
        const uSnap = await get(ref(db, 'users/'+w.uid+'/balance'));
        update(ref(db, 'users/'+w.uid), { balance: uSnap.val() + w.amount });
    }
    update(ref(db, 'withdrawals/'+key), { status });
};

// --- Helpers ---
function updateUI() {
    document.getElementById('main-balance').innerText = myBalance.toFixed(5);
    document.getElementById('balance-header').innerText = `${myBalance.toFixed(5)} USDT`;
}
window.openModal = (m) => document.getElementById(m+'-modal').classList.remove('hide');
window.closeModal = (m) => document.getElementById(m+'-modal').classList.add('hide');
window.openAdmin = () => openModal('admin');
window.copyInvite = () => {
    navigator.clipboard.writeText(`https://t.me/PaperhouseCorporationAPP_bot/start?startapp=${tgUser.id}`);
    alert("Link Copied!");
};

init();
