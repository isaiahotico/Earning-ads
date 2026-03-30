
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

// --- State ---
const tg = window.Telegram?.WebApp;
tg?.ready();
const user = tg?.initDataUnsafe?.user || { id: "99999", first_name: "Developer" };
const username = `@${user.username || user.first_name}`;

let balance = 0;
let refEarnings = 0;
let refCount = 0;
let cooldowns = {};
let clicks = 0;
let gifts = 0;
let currentUrl = "";
let currentIdx = -1;

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
    document.getElementById('userLabel').innerText = `👤 ${username}`;
    
    // Referral Check
    const urlParams = new URLSearchParams(window.location.search);
    const referrerId = urlParams.get('startapp');

    const snap = await get(ref(db, 'users/' + user.id));
    if (!snap.exists()) {
        await set(ref(db, 'users/' + user.id), {
            balance: 0,
            refEarnings: 0,
            refCount: 0,
            username: username,
            referredBy: referrerId || null
        });
        if (referrerId) {
            const rSnap = await get(ref(db, 'users/' + referrerId));
            if (rSnap.exists()) {
                update(ref(db, 'users/' + referrerId), { refCount: (rSnap.val().refCount || 0) + 1 });
            }
        }
    } else {
        const d = snap.val();
        balance = d.balance || 0;
        refEarnings = d.refEarnings || 0;
        refCount = d.refCount || 0;
        cooldowns = d.cooldowns || {};
    }

    updateUI();
    renderTasks();
    listenChat();
    listenLeaderboard();
}

// --- Navigation ---
window.switchTab = (tab) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('nav-' + tab).classList.add('active');
};

// --- Task Engine ---
function renderTasks() {
    const grid = document.getElementById('taskGrid');
    grid.innerHTML = "";
    const now = Date.now();
    LINKS.forEach((link, i) => {
        const last = cooldowns[i] || 0;
        const isLock = (now - last) < (2*60*60*1000);
        const card = document.createElement('button');
        card.className = `glass p-4 rounded-2xl flex flex-col items-center gap-2 ${isLock ? 'opacity-30' : 'active:scale-95'}`;
        card.innerHTML = `<i class="fas fa-link text-cyan-400"></i><span class="text-[10px] font-bold">TASK ${i+1}</span>
        <span class="text-[8px] text-gray-500">${isLock ? '2h Cooldown' : '0.00014 USDT'}</span>`;
        if(!isLock) card.onclick = () => openTask(link, i);
        grid.appendChild(card);
    });
}

window.openTask = (url, i) => {
    show_10555746().then(() => {
        currentUrl = url; currentIdx = i;
        clicks = 0; gifts = 0;
        document.getElementById('task-overlay').style.display = 'block';
        document.getElementById('taskIframe').src = url;
        document.getElementById('clickVerifier').classList.remove('hidden');
        document.getElementById('claimArea').classList.add('hidden');
        document.getElementById('clickStat').innerText = "TAP WEBSITE TO CONFIRM: 0/4";
    });
};

window.verifyClick = () => {
    if(clicks >= 4) return;
    
    const verifier = document.getElementById('clickVerifier');
    const msg = document.getElementById('waitMsg');
    
    clicks++;
    document.getElementById('taskIframe').src = currentUrl;
    document.getElementById('clickStat').innerText = `TAP WEBSITE TO CONFIRM: ${clicks}/4`;
    document.getElementById('taskBar').style.width = (clicks/4*100)+'%';
    
    verifier.classList.add('cooldown-state');
    msg.classList.remove('hidden');
    
    let s = 8;
    const itv = setInterval(() => {
        s--;
        msg.innerText = `WAIT ${s} SECONDS...`;
        if(s <= 0) {
            clearInterval(itv);
            verifier.classList.remove('cooldown-state');
            msg.classList.add('hidden');
            if(clicks >= 4) {
                // IMPORTANT: Hide detector so ads in iframe become clickable
                verifier.classList.add('hidden');
                checkTaskStatus();
            }
        }
    }, 1000);
};

window.doGift = () => {
    if(gifts >= 4) return;
    window.open("https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca", "_blank");
    show_10555727().then(() => {
        setTimeout(async () => {
            gifts++;
            balance += 0.00004;
            await update(ref(db, 'users/'+user.id), { balance: balance });
            document.getElementById('giftStat').innerText = `Gifts: ${gifts}/4`;
            updateUI();
            checkTaskStatus();
            alert("+0.00004 USDT Gained!");
        }, 10000);
    });
};

function checkTaskStatus() {
    if(clicks >= 4 && gifts >= 4) {
        document.getElementById('claimArea').classList.remove('hidden');
    }
}

window.claimReward = async () => {
    balance += 0.00014;
    cooldowns[currentIdx] = Date.now();
    
    // Handle Referral Commission
    const uSnap = await get(ref(db, 'users/'+user.id));
    const refBy = uSnap.val().referredBy;
    if(refBy) {
        const rSnap = await get(ref(db, 'users/'+refBy));
        if(rSnap.exists()){
            const comm = 0.00014 * 0.20;
            update(ref(db, 'users/'+refBy), {
                balance: (rSnap.val().balance || 0) + comm,
                refEarnings: (rSnap.val().refEarnings || 0) + comm
            });
        }
    }

    await update(ref(db, 'users/'+user.id), { balance: balance, cooldowns: cooldowns });
    closeTask(); updateUI(); renderTasks();
    alert("Task Reward Claimed!");
};

// --- Wallet ---
window.submitWD = async () => {
    const amt = parseFloat(document.getElementById('wdAmt').value);
    const addr = document.getElementById('wdAddr').value;
    const meth = document.getElementById('wdMethod').value;
    if(amt < 0.02 || amt > balance) return alert("Min. 0.02 and must have enough balance.");

    const key = push(ref(db, 'withdrawals')).key;
    await set(ref(db, 'withdrawals/'+key), {
        uid: user.id, user: username, amount: amt, method: meth, address: addr, status: 'pending', date: new Date().toLocaleString()
    });
    balance -= amt;
    await update(ref(db, 'users/'+user.id), { balance: balance });
    updateUI(); closeWD();
    alert("Request Sent!");
};

// --- Social ---
function listenChat() {
    onValue(ref(db, 'chat'), (s) => {
        const box = document.getElementById('chatBox');
        box.innerHTML = "";
        s.forEach(c => {
            const m = c.val();
            box.innerHTML += `<div><span class="text-cyan-400 font-bold">${m.user}:</span> ${m.msg}</div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}
window.sendMsg = () => {
    const inp = document.getElementById('chatInput');
    if(!inp.value) return;
    push(ref(db, 'chat'), { user: username, msg: inp.value });
    inp.value = "";
};

function listenLeaderboard() {
    onValue(ref(db, 'users'), (s) => {
        let arr = [];
        s.forEach(u => arr.push(u.val()));
        arr.sort((a,b) => b.balance - a.balance);
        const list = document.getElementById('leaderList');
        list.innerHTML = "";
        arr.slice(0, 100).forEach((u, i) => {
            list.innerHTML += `<div class="glass p-3 rounded-xl flex justify-between items-center">
            <span class="text-xs">${i+1}. ${u.username}</span><span class="text-xs font-mono text-cyan-400">${u.balance.toFixed(5)}</span></div>`;
        });
    });
}

// --- Admin ---
window.toggleAdmin = () => document.getElementById('admin-modal').classList.toggle('hidden');
window.checkAdmin = () => {
    if(document.getElementById('adminPin').value === "Propetas12"){
        document.getElementById('adminLogin').classList.add('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
        loadAdmin();
    }
};
function loadAdmin() {
    onValue(ref(db, 'withdrawals'), (s) => {
        const list = document.getElementById('adminList');
        list.innerHTML = "";
        s.forEach(c => {
            const w = c.val();
            if(w.status === 'pending'){
                const d = document.createElement('div');
                d.className = "glass p-4 rounded-xl text-xs";
                d.innerHTML = `<p>${w.user} | ${w.method}</p><p>${w.address}</p><p class="text-lg font-bold">${w.amount} USDT</p>
                <div class="flex gap-2 mt-2"><button onclick="admAct('${c.key}','approved')" class="bg-green-600 px-4 py-1 rounded">Approve</button>
                <button onclick="admAct('${c.key}','denied')" class="bg-red-600 px-4 py-1 rounded">Deny</button></div>`;
                list.appendChild(d);
            }
        });
    });
}
window.admAct = async (k, s) => {
    if(s === 'denied'){
        const snap = await get(ref(db, 'withdrawals/'+k));
        const w = snap.val();
        const uSnap = await get(ref(db, 'users/'+w.uid+'/balance'));
        update(ref(db, 'users/'+w.uid), { balance: (uSnap.val() || 0) + w.amount });
    }
    update(ref(db, 'withdrawals/'+k), { status: s });
};

// --- UI ---
function updateUI() {
    document.getElementById('main-balance').innerText = balance.toFixed(5);
    document.getElementById('headerBalance').innerText = balance.toFixed(5);
    document.getElementById('refCount').innerText = refCount;
    document.getElementById('refEarnings').innerText = refEarnings.toFixed(5);
}
window.closeTask = () => { document.getElementById('task-overlay').style.display = 'none'; document.getElementById('taskIframe').src = ""; };
window.openWD = () => document.getElementById('wd-modal').classList.remove('hidden');
window.closeWD = () => document.getElementById('wd-modal').classList.add('hidden');
window.copyRef = () => {
    navigator.clipboard.writeText(`https://t.me/PaperhouseCorporationAPP_bot/start?startapp=${user.id}`);
    alert("Referral Link Copied!");
};
document.getElementById('colorPicker').oninput = (e) => document.body.style.backgroundColor = e.target.value;

init();
