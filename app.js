
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, update, get, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBwpa8mA83JAv2A2Dj0rh5VHwodyv5N3dg",
    authDomain: "freegcash-ads.firebaseapp.com",
    databaseURL: "https://freegcash-ads-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "freegcash-ads",
    storageBucket: "freegcash-ads.firebasestorage.app",
    messagingSenderId: "608086825364",
    appId: "1:608086825364:web:3a8e628d231b52c6171781",
    measurementId: "G-Z64B87ELGP"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- Telegram Initialization ---
const tg = window.Telegram?.WebApp;
tg?.expand();
const user = tg?.initDataUnsafe?.user || { id: "Guest", first_name: "Developer", username: "Guest" };
const username = `@${user.username || user.first_name}`;
document.getElementById("userBar").innerText = `👤 ${username}`;

// --- State Variables ---
let balance = 0;
let reloadCount = 0;
let currentLink = "";
let totalTasksDone = 0;
const REWARD = 0.00014;

// --- Referral Logic ---
const urlParams = new URLSearchParams(window.location.search);
const referrer = urlParams.get('start');

// --- Initialization ---
async function initUser() {
    const userRef = ref(db, 'users/' + user.id);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
        await set(userRef, {
            balance: 0,
            referrals: 0,
            referredBy: referrer || null,
            username: username
        });
        if (referrer) {
            update(ref(db, 'users/' + referrer), {
                referrals: (await get(ref(db, 'users/' + referrer + '/referrals'))).val() + 1
            });
        }
    } else {
        balance = snapshot.val().balance || 0;
        document.getElementById('ref-count').innerText = `Referrals: ${snapshot.val().referrals || 0} (Earn 20%)`;
    }
    updateUI();
    renderTasks();
}

// --- Task Functions ---
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

function renderTasks() {
    const grid = document.getElementById('task-grid');
    grid.innerHTML = '';
    links.forEach((l, i) => {
        const btn = document.createElement('button');
        btn.className = "glass p-6 rounded-2xl text-center hover:scale-105 transition-all";
        btn.innerHTML = `<i class="fas fa-globe text-2xl mb-2 text-blue-400"></i><br>Link #${i+1}`;
        btn.onclick = () => startTask(l);
        grid.appendChild(btn);
    });
}

window.startTask = function(url) {
    // Show Ad 1
    show_10555746().then(() => {
        totalTasksDone++;
        // Show Ad 2 every 5 tasks
        if(totalTasksDone % 5 === 0) show_10555727();

        currentLink = url;
        reloadCount = 0;
        document.getElementById('task-overlay').style.display = 'block';
        document.getElementById('task-iframe').src = url;
        document.getElementById('reload-count').innerText = 0;
        document.getElementById('task-progress').style.width = '0%';
        document.getElementById('claim-btn').classList.add('hidden');
    });
}

window.triggerTaskReload = function() {
    if (reloadCount >= 4) return;

    const trap = document.getElementById('click-trap');
    const cooldownText = document.getElementById('cooldown-status');
    
    reloadCount++;
    document.getElementById('reload-count').innerText = reloadCount;
    document.getElementById('task-progress').style.width = (reloadCount / 4 * 100) + '%';
    document.getElementById('task-iframe').src = currentLink;

    // Start Cooldown
    trap.classList.add('cooldown-active');
    cooldownText.classList.remove('hidden');
    
    setTimeout(() => {
        trap.classList.remove('cooldown-active');
        cooldownText.classList.add('hidden');
        if (reloadCount >= 4) {
            document.getElementById('claim-btn').classList.remove('hidden');
            trap.style.display = 'none';
        }
    }, 8000);
}

window.claimReward = async function() {
    balance += REWARD;
    await update(ref(db, 'users/' + user.id), { balance: balance });
    
    // Referral Commission (20%)
    const snap = await get(ref(db, 'users/' + user.id + '/referredBy'));
    if (snap.exists() && snap.val()) {
        const refId = snap.val();
        const refSnap = await get(ref(db, 'users/' + refId + '/balance'));
        const refBal = refSnap.exists() ? refSnap.val() : 0;
        update(ref(db, 'users/' + refId), { balance: refBal + (REWARD * 0.20) });
    }

    closeTask();
    updateUI();
    alert("Reward Claimed!");
}

window.closeTask = function() {
    document.getElementById('task-overlay').style.display = 'none';
    document.getElementById('click-trap').style.display = 'block';
    document.getElementById('task-iframe').src = '';
}

// --- Withdraw System ---
window.openWithdraw = () => document.getElementById('withdraw-modal').classList.remove('hidden');
window.closeWithdraw = () => document.getElementById('withdraw-modal').classList.add('hidden');

window.submitWithdrawal = async function() {
    const method = document.getElementById('wd-method').value;
    const address = document.getElementById('wd-address').value;
    const amount = parseFloat(document.getElementById('wd-amount').value);

    if (amount > balance || amount <= 0) return alert("Invalid amount");

    const wdRef = ref(db, 'withdrawals');
    const newWd = push(wdRef);
    await set(newWd, {
        userId: user.id,
        username: username,
        method: method,
        address: address,
        amount: amount,
        status: 'pending',
        timestamp: Date.now()
    });

    balance -= amount;
    update(ref(db, 'users/' + user.id), { balance: balance });
    updateUI();
    closeWithdraw();
    alert("Withdrawal Pending Approval");
}

// --- Admin Logic ---
window.toggleAdmin = () => document.getElementById('admin-modal').classList.toggle('hidden');
window.loginAdmin = function() {
    if (document.getElementById('admin-pass').value === "Propetas12") {
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-content').classList.remove('hidden');
        loadAdminData();
    }
}

function loadAdminData() {
    const wdRef = ref(db, 'withdrawals');
    onValue(wdRef, (snapshot) => {
        const div = document.getElementById('pending-withdrawals');
        div.innerHTML = '<h3>Pending Approvals</h3>';
        snapshot.forEach((child) => {
            const data = child.val();
            if (data.status === 'pending') {
                const item = document.createElement('div');
                item.className = "bg-gray-800 p-2 rounded flex justify-between";
                item.innerHTML = `<span>${data.username}: $${data.amount}</span> 
                    <button onclick="approveWd('${child.key}')" class="text-green-500">Approve</button>`;
                div.appendChild(item);
            }
        });
    });
}

window.approveWd = (key) => update(ref(db, 'withdrawals/' + key), { status: 'approved' });

// --- Helper Functions ---
function updateUI() {
    document.getElementById('balance-display').innerText = balance.toFixed(5);
}

window.copyRefLink = function() {
    const link = `https://t.me/PaperhouseCorporationAPP_bot/start?startapp=${user.id}`;
    navigator.clipboard.writeText(link);
    alert("Referral link copied!");
}

// Theme Color Picker
document.getElementById('themePicker').addEventListener('input', (e) => {
    document.body.style.background = e.target.value;
});

// Initialize
initUser();
