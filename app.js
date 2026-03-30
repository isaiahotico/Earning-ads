
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

const REWARD = 0.00014;
const RELOADS_NEEDED = 4;
const RELOAD_COOLDOWN = 8; // seconds
const LINK_COOLDOWN_HOURS = 2;

let currentLinkIndex = null;
let reloadCount = 0;
let balance = parseFloat(localStorage.getItem('balance')) || 0;
let linkCooldowns = JSON.parse(localStorage.getItem('linkCooldowns')) || {};

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
    updateBalanceDisplay();
    renderButtons();
    
    // Hide iframe loader when loaded
    document.getElementById('task-iframe').onload = () => {
        document.getElementById('iframe-loader').classList.add('hidden');
    };
});

function renderButtons() {
    const grid = document.getElementById('task-grid');
    grid.innerHTML = '';
    const now = Date.now();

    links.forEach((link, index) => {
        const cooldownTime = linkCooldowns[link] || 0;
        const isLocked = now < cooldownTime;
        
        const btn = document.createElement('button');
        btn.className = `glass-card p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 ${isLocked ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:border-green-400'}`;
        
        let statusHtml = isLocked ? 
            `<span class="text-[10px] text-red-400 font-bold uppercase">Locked</span>` : 
            `<span class="text-[10px] text-green-400 font-bold uppercase">Available</span>`;

        btn.innerHTML = `
            <i class="fas fa-link text-xl"></i>
            <span class="text-xs font-mono">Link #${index + 1}</span>
            ${statusHtml}
        `;

        if (!isLocked) {
            btn.onclick = () => openTask(index);
        } else {
            // Update time remaining
            const remaining = Math.ceil((cooldownTime - now) / 60000);
            btn.title = `Available in ${remaining} minutes`;
        }

        grid.appendChild(btn);
    });
}

function openTask(index) {
    currentLinkIndex = index;
    reloadCount = 0;
    const url = links[index];
    
    document.getElementById('task-iframe').src = url;
    document.getElementById('task-modal').classList.remove('hidden');
    document.getElementById('reload-count').innerText = "0";
    document.getElementById('progress-bar').style.width = "0%";
    document.getElementById('reload-btn').classList.remove('hidden');
    document.getElementById('claim-btn').classList.add('hidden');
    document.getElementById('iframe-loader').classList.remove('hidden');
}

function handleReload() {
    if (reloadCount >= RELOADS_NEEDED) return;

    const btn = document.getElementById('reload-btn');
    const timerText = document.getElementById('cooldown-timer');
    
    // Disable button
    btn.disabled = true;
    timerText.classList.remove('hidden');
    
    let secondsLeft = RELOAD_COOLDOWN;
    timerText.innerText = `Wait ${secondsLeft}s...`;

    const countdown = setInterval(() => {
        secondsLeft--;
        timerText.innerText = `Wait ${secondsLeft}s...`;
        
        if (secondsLeft <= 0) {
            clearInterval(countdown);
            
            // Logic after countdown
            reloadCount++;
            document.getElementById('reload-count').innerText = reloadCount;
            document.getElementById('progress-bar').style.width = `${(reloadCount / RELOADS_NEEDED) * 100}%`;
            
            // Refresh iframe
            document.getElementById('iframe-loader').classList.remove('hidden');
            document.getElementById('task-iframe').src = links[currentLinkIndex];
            
            btn.disabled = false;
            timerText.classList.add('hidden');

            if (reloadCount >= RELOADS_NEEDED) {
                btn.classList.add('hidden');
                document.getElementById('claim-btn').classList.remove('hidden');
            }
        }
    }, 1000);
}

function handleClaim() {
    const link = links[currentLinkIndex];
    
    // Credit Balance
    balance += REWARD;
    localStorage.setItem('balance', balance.toString());
    updateBalanceDisplay();

    // Set 2 Hour Cooldown
    const cooldownExpiry = Date.now() + (LINK_COOLDOWN_HOURS * 60 * 60 * 1000);
    linkCooldowns[link] = cooldownExpiry;
    localStorage.setItem('linkCooldowns', JSON.stringify(linkCooldowns));

    // UI Cleanup
    closeModal();
    renderButtons();
    alert(`Success! 0.00014 USDT credited to your account.`);
}

function closeModal() {
    document.getElementById('task-modal').classList.add('hidden');
    document.getElementById('task-iframe').src = "";
}

function updateBalanceDisplay() {
    document.getElementById('balance-display').innerText = balance.toFixed(5);
}
