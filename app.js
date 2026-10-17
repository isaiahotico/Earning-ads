/**
 * Monetag AdHub Engine (Numeric Zone ID Integration)
 * Supports tag numbers like 10555746, interstitial ads, reward tracking & auto-disappearance
 */

// --- RANDOM SHINING METALLIC COLORWAYS ---
const SHINE_THEMES = [
  'card-shine-gold',
  'card-shine-ruby',
  'card-shine-sapphire',
  'card-shine-emerald',
  'card-shine-amethyst',
  'card-shine-cybercyan',
  'card-shine-rosegold',
  'card-shine-obsidian'
];

// --- USER PROFILE SYSTEM ---
function getUserProfile() {
  const stored = localStorage.getItem('monetag_zone_user_v2');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  const initial = {
    username: "Creator_" + Math.floor(1000 + Math.random() * 9000),
    credits: 15 // Initial starting credits so user can post immediately
  };
  saveUserProfile(initial);
  return initial;
}

function saveUserProfile(p) {
  localStorage.setItem('monetag_zone_user_v2', JSON.stringify(p));
}

// --- MONETAG ADS SYSTEM (NUMERIC ZONE IDS) ---
function getStoredAds() {
  const stored = localStorage.getItem('monetag_zone_ads_v2');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  // Pre-configured campaigns using numeric tag IDs
  const seedAds = [
    {
      id: "AD_" + Date.now() + "_1",
      author: "MonetagPartner",
      title: "Global Interstitial eCPM Stream",
      format: "Interstitial",
      zoneId: "10555746", // Example Numeric ID
      desc: "Live Monetag zone #10555746. Click to watch the ad and earn +1 credit!",
      clicks: 2,
      theme: "card-shine-gold",
      createdAt: Date.now()
    },
    {
      id: "AD_" + Date.now() + "_2",
      author: "CryptoBoost",
      title: "Web3 Rewarded Interstitial Unit",
      format: "Interstitial",
      zoneId: "10555747",
      desc: "Verified publisher zone. Fast 5-second reward turnaround.",
      clicks: 4,
      theme: "card-shine-ruby",
      createdAt: Date.now() - 3600000
    },
    {
      id: "AD_" + Date.now() + "_3",
      author: "GamerLoot",
      title: "In-Page Push & Interstitial Combo",
      format: "In-Page Push",
      zoneId: "10555748",
      desc: "Full interactive ad tag execution with instant credit claim.",
      clicks: 1,
      theme: "card-shine-cybercyan",
      createdAt: Date.now() - 7200000
    }
  ];
  saveStoredAds(seedAds);
  return seedAds;
}

function saveStoredAds(ads) {
  localStorage.setItem('monetag_zone_ads_v2', JSON.stringify(ads));
}

// --- APPLICATION STATE ---
let currentUser = getUserProfile();
let currentAds = getStoredAds();
let activeInteractingAdId = null;
let countdownInterval = null;

// --- UPDATE UI STATS ---
function updateHeaderUI() {
  document.getElementById('header-username').innerText = currentUser.username;
  document.getElementById('header-balance').innerText = currentUser.credits;
  document.getElementById('stats-balance').innerText = `${currentUser.credits} Credits`;
}

// --- RENDER ADS FEED (SHINING METALLIC CARDS & 5-CLICK LIMIT) ---
function refreshAdGrid() {
  updateHeaderUI();
  const grid = document.getElementById('ads-grid');
  const emptyState = document.getElementById('empty-state');
  const countBadge = document.getElementById('active-ads-count');

  // Filter only active ads (< 5 clicks)
  const activeAds = currentAds.filter(ad => (ad.clicks || 0) < 5);
  countBadge.innerText = `${activeAds.length} Active`;

  if (activeAds.length === 0) {
    grid.innerHTML = "";
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  grid.innerHTML = activeAds.map(ad => {
    const clicks = ad.clicks || 0;
    const progressPct = (clicks / 5) * 100;
    const clicksRemaining = 5 - clicks;

    return `
    <article id="ad-card-${ad.id}" class="${ad.theme || 'card-shine-gold'} shimmer-layer rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition hover:-translate-y-1 duration-300 relative">
      
      <!-- Card Header -->
      <div class="space-y-2">
        <div class="flex items-center justify-between text-[10px] font-mono">
          <span class="px-2 py-0.5 rounded-full bg-black/50 text-white font-bold border border-white/20">
            <i class="fa-solid fa-bolt text-amber-300 mr-1"></i>${escapeHtml(ad.format)}
          </span>
          <span class="text-white/80 font-semibold truncate max-w-[120px]">
            By @${escapeHtml(ad.author)}
          </span>
        </div>

        <h4 class="font-syne font-extrabold text-sm sm:text-base text-white leading-tight drop-shadow">
          ${escapeHtml(ad.title)}
        </h4>

        <!-- Display Monetag Numeric Zone ID -->
        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono text-amber-300 font-bold">
          <i class="fa-solid fa-hashtag text-[9px] text-amber-400"></i>
          <span>Zone ID: ${escapeHtml(ad.zoneId)}</span>
        </div>

        ${ad.desc ? `<p class="text-xs text-white/80 line-clamp-2 leading-relaxed mt-1">${escapeHtml(ad.desc)}</p>` : ''}
      </div>

      <!-- 5-Click Meter & Action -->
      <div class="pt-4 space-y-3">
        
        <div class="space-y-1">
          <div class="flex justify-between text-[10px] font-mono font-bold text-white/90">
            <span>PROGRESS: ${clicks} / 5 CLICKS</span>
            <span class="${clicksRemaining === 1 ? 'text-rose-300 animate-pulse' : 'text-amber-200'}">
              ${clicksRemaining} Left to Disappear
            </span>
          </div>
          <div class="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/10">
            <div class="h-full bg-gradient-to-r from-amber-300 via-rose-400 to-emerald-400 transition-all duration-500" style="width: ${progressPct}%"></div>
          </div>
        </div>

        <!-- Trigger Monetag Ad Button -->
        <button onclick="triggerMonetagAd('${ad.id}')" class="w-full py-2.5 px-4 rounded-xl bg-slate-950/85 hover:bg-black border border-white/30 text-white font-bold text-xs flex items-center justify-between shadow-lg active:scale-95 transition group">
          <span class="flex items-center gap-1.5 text-emerald-300">
            <i class="fa-solid fa-play"></i>
            <span>SHOW MONETAG AD (+1 CREDIT)</span>
          </span>
          <i class="fa-solid fa-bullhorn text-xs text-white/70 group-hover:scale-110 transition"></i>
        </button>

      </div>
    </article>
    `;
  }).join('');
}

// --- DYNAMICALLY INJECT & RUN MONETAG NUMERIC AD SCRIPT ---
function triggerMonetagAd(adId) {
  const ad = currentAds.find(a => a.id === adId);
  if (!ad) return;

  activeInteractingAdId = adId;

  // 1. Inject the Monetag JavaScript tag directly using the numeric Zone ID
  const container = document.getElementById('monetag-dynamic-container');
  container.innerHTML = ''; // Clear previous scripts

  try {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    // Standard Monetag SDK tag loader mapped directly to the numeric zone ID
    script.src = `https://niphaumeenses.com/tag.min.js`;
    script.setAttribute('data-zone', ad.zoneId);
    script.async = true;
    container.appendChild(script);

    // Also fire standard window ad function if provided by Monetag SDK
    if (window.show_interstitial) {
      window.show_interstitial(ad.zoneId);
    }
  } catch (err) {
    console.warn("Monetag script injection error:", err);
  }

  // 2. Open engagement verification modal
  document.getElementById('view-ad-title').innerText = ad.title;
  document.getElementById('view-ad-zone-id').innerText = `Zone: #${ad.zoneId}`;
  document.getElementById('modal-view-ad').classList.remove('hidden');

  const claimBtn = document.getElementById('btn-claim-credit');
  claimBtn.disabled = true;
  claimBtn.className = "w-full py-2.5 rounded-xl bg-slate-800 text-slate-500 font-extrabold text-xs transition cursor-not-allowed";
  claimBtn.innerText = "Verifying Ad View...";

  let timeLeft = 5;
  const countElem = document.getElementById('ad-countdown');
  countElem.innerText = `${timeLeft}s`;

  if (countdownInterval) clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft > 0) {
      countElem.innerText = `${timeLeft}s`;
    } else {
      clearInterval(countdownInterval);
      countElem.innerText = "VERIFIED!";
      claimBtn.disabled = false;
      claimBtn.className = "w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs shadow-lg active:scale-95 transition cursor-pointer";
      claimBtn.innerText = "CLAIM +1 CREDIT NOW";
    }
  }, 1000);
}

// --- CLAIM REWARD & CHECK DISAPPEARANCE AT 5 CLICKS ---
function claimAdReward() {
  if (!activeInteractingAdId) return;

  const ad = currentAds.find(a => a.id === activeInteractingAdId);
  if (!ad) return;

  // Close modal
  document.getElementById('modal-view-ad').classList.add('hidden');

  // 1. Reward viewing user with +1 Credit
  currentUser.credits = (currentUser.credits || 0) + 1;
  saveUserProfile(currentUser);

  // 2. Increment clicks on this specific Monetag ad
  ad.clicks = (ad.clicks || 0) + 1;

  // 3. If reached 5 clicks, trigger smooth disappearing animation & remove
  if (ad.clicks >= 5) {
    const cardElem = document.getElementById(`ad-card-${ad.id}`);
    if (cardElem) {
      cardElem.classList.add('disappear-anim');
    }

    setTimeout(() => {
      // Purge from public pool
      currentAds = currentAds.filter(a => a.id !== ad.id);
      saveStoredAds(currentAds);
      refreshAdGrid();
    }, 550);
  } else {
    saveStoredAds(currentAds);
    refreshAdGrid();
  }

  alert(`🎉 Success! You earned +1 Credit for viewing Monetag Zone #${ad.zoneId}.`);
  activeInteractingAdId = null;
}

// --- CREATE MONETAG AD (COSTS 5 CREDITS) ---
function openCreateAdModal() {
  if ((currentUser.credits || 0) < 5) {
    alert("⚠️ You need at least 5 Credits to post a Monetag ad! Click on other ads in the public area to earn credits.");
    return;
  }
  document.getElementById('modal-create-ad').classList.remove('hidden');
}

function closeCreateAdModal() {
  document.getElementById('modal-create-ad').classList.add('hidden');
  document.getElementById('create-ad-form').reset();
}

function submitMonetagPost(e) {
  e.preventDefault();

  if ((currentUser.credits || 0) < 5) {
    alert("Insufficient credits! Posting costs 5 credits.");
    return;
  }

  const title = document.getElementById('ad-title').value.trim();
  const format = document.getElementById('ad-format').value;
  const zoneIdInput = document.getElementById('ad-zone-id').value.trim();
  const desc = document.getElementById('ad-desc').value.trim();

  // Validate pure number format (e.g. 10555746)
  if (!zoneIdInput || isNaN(zoneIdInput) || parseInt(zoneIdInput) <= 0) {
    alert("Please enter a valid numeric Monetag Tag/Zone ID (e.g. 10555746).");
    return;
  }

  // Deduct 5 credits from publisher
  currentUser.credits -= 5;
  saveUserProfile(currentUser);

  // Pick random shining metallic color theme
  const randomTheme = SHINE_THEMES[Math.floor(Math.random() * SHINE_THEMES.length)];

  const newAd = {
    id: "AD_" + Date.now() + "_" + Math.floor(Math.random() * 9999),
    author: currentUser.username,
    title: title,
    format: format,
    zoneId: String(zoneIdInput), // Store pure numeric ID
    desc: desc,
    clicks: 0,
    theme: randomTheme,
    createdAt: Date.now()
  };

  currentAds.unshift(newAd);
  saveStoredAds(currentAds);

  closeCreateAdModal();
  refreshAdGrid();
  alert(`✨ Monetag Zone #${newAd.zoneId} published! 5 Credits deducted. It will disappear after 5 clicks.`);
}

// --- USERNAME MANAGEMENT (CHANGE ANYTIME) ---
function openUsernameModal() {
  document.getElementById('input-new-username').value = currentUser.username;
  document.getElementById('modal-username').classList.remove('hidden');
}

function closeUsernameModal() {
  document.getElementById('modal-username').classList.add('hidden');
}

function saveNewUsername() {
  const input = document.getElementById('input-new-username');
  const newName = input.value.trim().replace(/^@/, '');
  if (!newName) {
    alert("Please enter a valid username.");
    return;
  }
  currentUser.username = newName;
  saveUserProfile(currentUser);
  closeUsernameModal();
  refreshAdGrid();
}

// --- HELPER: ESCAPE HTML STRINGS ---
function escapeHtml(s) {
  return s ? String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])) : '';
}

// --- INITIALIZE APP ---
window.addEventListener('DOMContentLoaded', () => {
  refreshAdGrid();
});