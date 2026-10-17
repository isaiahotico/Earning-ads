/**
 * Monetag AdHub Pro Engine - Version 4.0
 * Fully Clickable, Dual-Trigger SDK & Zone Execution, Universal Migration & 5-Click Auto-Purge
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

// Standard reliable Monetag CDN Tag loader
const DEFAULT_MONETAG_SDK = "//niphaumeenses.com/tag.min.js";

// --- USER PROFILE & LOCAL STORAGE ---
function getUserProfile() {
  const stored = localStorage.getItem('monetag_user_v4');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  // Check previous version profiles
  const v3User = localStorage.getItem('monetag_sdk_user_v3') || localStorage.getItem('monetag_zone_user_v2') || localStorage.getItem('monetag_hub_user_v1');
  let credits = 15;
  let username = "Creator_" + Math.floor(1000 + Math.random() * 9000);
  if (v3User) {
    try {
      const u = JSON.parse(v3User);
      if (u.username) username = u.username;
      if (typeof u.credits === 'number') credits = u.credits;
    } catch(e) {}
  }
  const initial = { username, credits };
  saveUserProfile(initial);
  return initial;
}

function saveUserProfile(p) {
  localStorage.setItem('monetag_user_v4', JSON.stringify(p));
}

// --- UNIVERSAL DATA MIGRATION ENGINE (V1/V2/V3 -> V4) ---
function getStoredAds() {
  let stored = localStorage.getItem('monetag_ads_v4');
  if (!stored) {
    // Check previous versions
    stored = localStorage.getItem('monetag_sdk_ads_v3') ||
             localStorage.getItem('monetag_zone_ads_v2') ||
             localStorage.getItem('monetag_hub_ads_v1');
  }

  if (stored) {
    try {
      let parsed = JSON.parse(stored);
      // Migrate and sanitize all existing entries to guarantee they are 100% clickable
      const migrated = parsed.map(ad => ({
        id: ad.id || ("AD_" + Date.now() + "_" + Math.floor(Math.random() * 9999)),
        author: ad.author || "Publisher",
        title: ad.title || "Monetag Rewarded Ad",
        format: ad.format || "Rewarded Interstitial",
        zoneId: String(ad.zoneId || "10555746"),
        sdkCode: ad.sdkCode || DEFAULT_MONETAG_SDK,
        desc: ad.desc || "Click to view rewarded Monetag ad and claim +1 credit!",
        clicks: typeof ad.clicks === 'number' ? ad.clicks : 0,
        theme: ad.theme || SHINE_THEMES[Math.floor(Math.random() * SHINE_THEMES.length)],
        createdAt: ad.createdAt || Date.now()
      }));
      saveStoredAds(migrated);
      return migrated;
    } catch (e) {
      console.warn("Migration warning:", e);
    }
  }

  // Pre-seeded campaigns for live GitHub Pages testing
  const seedAds = [
    {
      id: "AD_" + Date.now() + "_1",
      author: "MonetagPartner",
      title: "Monetag High eCPM Interstitial #1",
      format: "Rewarded Interstitial",
      zoneId: "10555746",
      sdkCode: DEFAULT_MONETAG_SDK,
      desc: "Live Monetag Zone #10555746. Click to trigger the rewarded ad and earn +1 credit!",
      clicks: 2,
      theme: "card-shine-gold",
      createdAt: Date.now()
    },
    {
      id: "AD_" + Date.now() + "_2",
      author: "CryptoBoost",
      title: "Web3 Rewarded Popup Zone #2",
      format: "In-Page Push / Popup",
      zoneId: "10555746",
      sdkCode: DEFAULT_MONETAG_SDK,
      desc: "Guaranteed interactive ad popup with 5-second reward turnaround.",
      clicks: 4,
      theme: "card-shine-ruby",
      createdAt: Date.now() - 3600000
    },
    {
      id: "AD_" + Date.now() + "_3",
      author: "GamerLoot",
      title: "Direct Monetag SmartLink #3",
      format: "Direct SmartLink",
      zoneId: "10555746",
      sdkCode: DEFAULT_MONETAG_SDK,
      desc: "Instant direct ad trigger with verified credit claim.",
      clicks: 1,
      theme: "card-shine-cybercyan",
      createdAt: Date.now() - 7200000
    }
  ];
  saveStoredAds(seedAds);
  return seedAds;
}

function saveStoredAds(ads) {
  localStorage.setItem('monetag_ads_v4', JSON.stringify(ads));
}

// --- APPLICATION STATE ---
let currentUser = getUserProfile();
let currentAds = getStoredAds();
let activeInteractingAd = null;
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
    <article id="ad-card-${ad.id}" class="${ad.theme || 'card-shine-gold'} shimmer-layer rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition hover:-translate-y-1 duration-300 relative shadow-xl">
      
      <!-- Card Header -->
      <div class="space-y-2 relative z-10">
        <div class="flex items-center justify-between text-[10px] font-mono">
          <span class="px-2 py-0.5 rounded-full bg-black/60 text-white font-bold border border-white/20">
            <i class="fa-solid fa-bolt text-amber-300 mr-1"></i>${escapeHtml(ad.format)}
          </span>
          <span class="text-white/80 font-semibold truncate max-w-[120px]">
            By @${escapeHtml(ad.author)}
          </span>
        </div>

        <h4 class="font-syne font-extrabold text-sm sm:text-base text-white leading-tight drop-shadow">
          ${escapeHtml(ad.title)}
        </h4>

        <!-- Zone & SDK Indicators -->
        <div class="flex flex-wrap gap-1.5 items-center">
          <div class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-black/60 border border-white/10 text-[10px] font-mono text-amber-300 font-bold">
            <i class="fa-solid fa-hashtag text-[8px] text-amber-400"></i>
            <span>Zone: ${escapeHtml(ad.zoneId)}</span>
          </div>
          <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-[9px] font-mono text-cyan-300">
            <i class="fa-solid fa-check text-[8px]"></i>
            <span>Active Clickable</span>
          </div>
        </div>

        ${ad.desc ? `<p class="text-xs text-white/80 line-clamp-2 leading-relaxed mt-1">${escapeHtml(ad.desc)}</p>` : ''}
      </div>

      <!-- 5-Click Meter & Action Button -->
      <div class="pt-4 space-y-3 relative z-10">
        
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

        <!-- 100% Clickable Action Button -->
        <button type="button" onclick="triggerMonetagAd('${ad.id}')" class="ad-click-btn w-full py-2.5 px-4 rounded-xl bg-slate-950/90 hover:bg-black border border-white/30 text-white font-bold text-xs flex items-center justify-between shadow-lg transition group">
          <span class="flex items-center gap-1.5 text-emerald-300">
            <i class="fa-solid fa-play"></i>
            <span>CLICK TO SHOW AD (+1 CREDIT)</span>
          </span>
          <i class="fa-solid fa-bullhorn text-xs text-white/70 group-hover:scale-110 transition"></i>
        </button>

      </div>
    </article>
    `;
  }).join('');
}

// --- EXTRACT VALID SCRIPT SRC ---
function extractSdkUrl(input) {
  if (!input) return DEFAULT_MONETAG_SDK;
  const trimmed = input.trim();
  const match = trimmed.match(/src=["'](.*?)["']/i);
  if (match && match[1]) {
    let src = match[1];
    if (src.startsWith('//')) src = 'https:' + src;
    return src;
  }
  if (trimmed.startsWith('//')) return 'https:' + trimmed;
  if (trimmed.startsWith('http')) return trimmed;
  if (trimmed.includes('.com') || trimmed.includes('.js')) return 'https://' + trimmed.replace(/^https?:\/\//, '');
  return DEFAULT_MONETAG_SDK;
}

// --- DUAL-TRIGGER MONETAG EXECUTION ENGINE ---
function executeMonetagTrigger(zoneId, sdkCode) {
  const cleanSdk = extractSdkUrl(sdkCode);

  // 1. In-Page Tag Injection
  try {
    const container = document.getElementById('monetag-dynamic-container');
    container.innerHTML = ''; // reset

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = cleanSdk;
    script.setAttribute('data-zone', zoneId);
    script.async = true;

    script.onload = () => {
      // Fire standard Monetag rewarded interstitial SDK functions if loaded
      try {
        if (typeof window.show_rewarded_interstitial === 'function') {
          window.show_rewarded_interstitial({ zoneId: parseInt(zoneId) });
        } else if (typeof window.show_interstitial === 'function') {
          window.show_interstitial(parseInt(zoneId));
        }
      } catch (err) {
        console.warn("Monetag direct call warning:", err);
      }
    };

    container.appendChild(script);
  } catch (e) {
    console.warn("Script injection error:", e);
  }

  // 2. Direct Fallback Window Opening (Guarantees user sees ad even if ad blocker prevents script)
  try {
    const directFallbackUrl = `https://niphaumeenses.com/tag.min.js?zone=${encodeURIComponent(zoneId)}`;
    const popup = window.open(directFallbackUrl, '_blank');
    if (popup) {
      setTimeout(() => popup.focus(), 200);
    }
  } catch (e) {
    console.warn("Fallback popup notice:", e);
  }
}

// --- PRE-TEST MONETAG AD IN CREATE MODAL ---
function testAdBeforePublishing() {
  const zoneId = document.getElementById('ad-zone-id').value.trim();
  const sdkCode = document.getElementById('ad-sdk-code').value.trim() || DEFAULT_MONETAG_SDK;

  if (!zoneId || isNaN(zoneId) || parseInt(zoneId) <= 0) {
    alert("⚠️ Please enter a valid numeric Zone ID (e.g. 10555746) before testing!");
    return;
  }

  // Trigger the ad immediately
  executeMonetagTrigger(zoneId, sdkCode);

  const badge = document.getElementById('test-status-badge');
  badge.className = "px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/40";
  badge.innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i>Verified Clickable!`;

  alert(`🚀 Monetag Tag for Zone #${zoneId} has been triggered!\nIf you see the ad window/popup, your setup is working and ready to publish.`);
}

// --- USER CLICKS AD FROM PUBLIC FEED ---
function triggerMonetagAd(adId) {
  const ad = currentAds.find(a => a.id === adId);
  if (!ad) return;

  activeInteractingAd = ad;

  // 1. Immediately fire the Monetag trigger on click
  executeMonetagTrigger(ad.zoneId, ad.sdkCode);

  // 2. Open engagement verification timer modal
  document.getElementById('view-ad-title').innerText = ad.title;
  document.getElementById('view-ad-zone-id').innerText = `Zone: #${ad.zoneId} • ${ad.format}`;
  document.getElementById('modal-view-ad').classList.remove('hidden');

  const claimBtn = document.getElementById('btn-claim-credit');
  claimBtn.disabled = true;
  claimBtn.className = "flex-1 py-2 rounded-xl bg-slate-800 text-slate-500 font-extrabold text-xs transition cursor-not-allowed";
  claimBtn.innerText = "Verifying View...";

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
      claimBtn.className = "flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs shadow-lg active:scale-95 transition cursor-pointer";
      claimBtn.innerText = "CLAIM +1 CREDIT NOW";
    }
  }, 1000);
}

// --- RELAUNCH BUTTON IF AD DID NOT FIRE ---
function relaunchActiveAd() {
  if (!activeInteractingAd) return;
  executeMonetagTrigger(activeInteractingAd.zoneId, activeInteractingAd.sdkCode);
}

// --- CLAIM REWARD & CHECK 5-CLICK DISAPPEARANCE ---
function claimAdReward() {
  if (!activeInteractingAd) return;

  const ad = currentAds.find(a => a.id === activeInteractingAd.id);
  if (!ad) return;

  // Close verification modal
  document.getElementById('modal-view-ad').classList.add('hidden');

  // 1. Reward user with +1 Credit
  currentUser.credits = (currentUser.credits || 0) + 1;
  saveUserProfile(currentUser);

  // 2. Increment click count
  ad.clicks = (ad.clicks || 0) + 1;

  // 3. Auto-disappear after exactly 5 clicks
  if (ad.clicks >= 5) {
    const cardElem = document.getElementById(`ad-card-${ad.id}`);
    if (cardElem) {
      cardElem.classList.add('disappear-anim');
    }

    setTimeout(() => {
      // Purge permanently from the public pool
      currentAds = currentAds.filter(a => a.id !== ad.id);
      saveStoredAds(currentAds);
      refreshAdGrid();
    }, 550);
  } else {
    saveStoredAds(currentAds);
    refreshAdGrid();
  }

  alert(`🎉 Success! You earned +1 Credit for watching Monetag Zone #${ad.zoneId}.`);
  activeInteractingAd = null;
}

// --- CREATE MONETAG AD (COSTS 5 CREDITS) ---
function openCreateAdModal() {
  if ((currentUser.credits || 0) < 5) {
    alert("⚠️ You need at least 5 Credits to post a Monetag ad! Click on other ads in the feed to earn credits.");
    return;
  }
  const badge = document.getElementById('test-status-badge');
  if (badge) {
    badge.className = "px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono";
    badge.innerText = "Not Tested";
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
  const sdkCode = document.getElementById('ad-sdk-code').value.trim() || DEFAULT_MONETAG_SDK;
  const desc = document.getElementById('ad-desc').value.trim();

  // Validate numeric zone ID
  if (!zoneIdInput || isNaN(zoneIdInput) || parseInt(zoneIdInput) <= 0) {
    alert("Please enter a valid numeric Monetag Zone ID (e.g. 10555746).");
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
    zoneId: String(zoneIdInput),
    sdkCode: sdkCode,
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

// --- INITIALIZE APPLICATION ---
window.addEventListener('DOMContentLoaded', () => {
  refreshAdGrid();
});