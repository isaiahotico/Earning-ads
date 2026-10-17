/**
 * Monetag AdHub Pro Engine - Version 6.0
 * Exclusively High eCPM Rewarded Interstitials (Popups Permanently Removed)
 * Separate SDK Domain and Numeric Zone ID fields, Clickable Dual-Trigger Engine,
 * Automatic Universal Storage Migration (v1-v5 -> v6) & 5-Click Auto-Purge.
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

// Default Monetag SDK Domain
const DEFAULT_SDK_DOMAIN = "niphaumeenses.com";

// --- USER PROFILE & LOCAL STORAGE ---
function getUserProfile() {
  const stored = localStorage.getItem('monetag_user_v6');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }

  // Check previous versions for seamless migration
  const legacyUser = localStorage.getItem('monetag_user_v5') ||
                     localStorage.getItem('monetag_user_v4') ||
                     localStorage.getItem('monetag_sdk_user_v3') ||
                     localStorage.getItem('monetag_zone_user_v2') ||
                     localStorage.getItem('monetag_hub_user_v1');
  let credits = 15;
  let username = "Creator_" + Math.floor(1000 + Math.random() * 9000);

  if (legacyUser) {
    try {
      const u = JSON.parse(legacyUser);
      if (u.username) username = u.username;
      if (typeof u.credits === 'number') credits = u.credits;
    } catch (e) {}
  }

  const initial = { username, credits };
  saveUserProfile(initial);
  return initial;
}

function saveUserProfile(p) {
  localStorage.setItem('monetag_user_v6', JSON.stringify(p));
}

// --- SANITIZE & CLEAN SDK DOMAIN INPUT ---
function cleanSdkDomainInput(input) {
  if (!input) return DEFAULT_SDK_DOMAIN;
  let str = input.trim();
  str = str.replace(/<[^>]*>/g, '');
  const match = str.match(/src=["'](.*?)["']/i);
  if (match && match[1]) str = match[1];

  str = str.replace(/^https?:\/\//i, '').replace(/^\/\//, '');
  str = str.split('?')[0].split('/')[0];

  return str.length > 3 ? str : DEFAULT_SDK_DOMAIN;
}

// --- UNIVERSAL DATA MIGRATION ENGINE (V1-V5 -> V6) ---
// Popups converted exclusively into High eCPM Rewarded Interstitials
function getStoredAds() {
  let stored = localStorage.getItem('monetag_ads_v6');
  if (!stored) {
    stored = localStorage.getItem('monetag_ads_v5') ||
             localStorage.getItem('monetag_ads_v4') ||
             localStorage.getItem('monetag_sdk_ads_v3') ||
             localStorage.getItem('monetag_zone_ads_v2') ||
             localStorage.getItem('monetag_hub_ads_v1');
  }

  if (stored) {
    try {
      let parsed = JSON.parse(stored);
      const migrated = parsed.map(ad => ({
        id: ad.id || ("AD_" + Date.now() + "_" + Math.floor(Math.random() * 9999)),
        author: ad.author || "Publisher",
        title: ad.title || "Monetag Rewarded Interstitial",
        format: "Rewarded Interstitial", // Hard-locked to Rewarded Interstitials only
        sdkDomain: cleanSdkDomainInput(ad.sdkDomain || ad.sdkCode),
        zoneId: String(ad.zoneId || "10555746"),
        desc: ad.desc || "Watch this high eCPM rewarded interstitial ad and earn +1 credit!",
        clicks: typeof ad.clicks === 'number' ? ad.clicks : 0,
        theme: ad.theme || SHINE_THEMES[Math.floor(Math.random() * SHINE_THEMES.length)],
        createdAt: ad.createdAt || Date.now()
      }));
      saveStoredAds(migrated);
      return migrated;
    } catch (e) {
      console.warn("Storage migration notice:", e);
    }
  }

  // Pre-seeded Rewarded Interstitial campaigns for live testing
  const seedAds = [
    {
      id: "AD_" + Date.now() + "_1",
      author: "MonetagPartner",
      title: "High eCPM Rewarded Interstitial Unit #1",
      format: "Rewarded Interstitial",
      sdkDomain: "niphaumeenses.com",
      zoneId: "10555746",
      desc: "Live Monetag Rewarded Zone #10555746. Click to watch the ad and earn +1 credit!",
      clicks: 2,
      theme: "card-shine-gold",
      createdAt: Date.now()
    },
    {
      id: "AD_" + Date.now() + "_2",
      author: "CryptoBoost",
      title: "Global Rewarded Interstitial Stream #2",
      format: "Rewarded Interstitial",
      sdkDomain: "niphaumeenses.com",
      zoneId: "10555746",
      desc: "Instant rewarded interstitial stream with verified credit claim.",
      clicks: 4,
      theme: "card-shine-ruby",
      createdAt: Date.now() - 3600000
    },
    {
      id: "AD_" + Date.now() + "_3",
      author: "GamerLoot",
      title: "Gaming Bonus Rewarded Interstitial #3",
      format: "Rewarded Interstitial",
      sdkDomain: "niphaumeenses.com",
      zoneId: "10555746",
      desc: "Pure rewarded interstitial format with maximum eCPM return.",
      clicks: 1,
      theme: "card-shine-cybercyan",
      createdAt: Date.now() - 7200000
    }
  ];
  saveStoredAds(seedAds);
  return seedAds;
}

function saveStoredAds(ads) {
  localStorage.setItem('monetag_ads_v6', JSON.stringify(ads));
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

// --- RENDER ADS FEED (SHINING CARDS & 5-CLICK AUTO-DISAPPEAR) ---
function refreshAdGrid() {
  updateHeaderUI();
  const grid = document.getElementById('ads-grid');
  const emptyState = document.getElementById('empty-state');
  const countBadge = document.getElementById('active-ads-count');

  // Filter active ads (< 5 clicks)
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
          <span class="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-500/30">
            <i class="fa-solid fa-bolt text-amber-300 mr-1"></i>Rewarded Interstitial
          </span>
          <span class="text-white/80 font-semibold truncate max-w-[120px]">
            By @${escapeHtml(ad.author)}
          </span>
        </div>

        <h4 class="font-syne font-extrabold text-sm sm:text-base text-white leading-tight drop-shadow">
          ${escapeHtml(ad.title)}
        </h4>

        <!-- Separated SDK Domain & Zone Badges -->
        <div class="flex flex-wrap gap-1.5 items-center">
          <div class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-black/60 border border-white/10 text-[10px] font-mono text-amber-300 font-bold">
            <i class="fa-solid fa-hashtag text-[8px] text-amber-400"></i>
            <span>Zone: ${escapeHtml(ad.zoneId)}</span>
          </div>
          <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-[9px] font-mono text-cyan-300">
            <i class="fa-solid fa-globe text-[8px]"></i>
            <span class="truncate max-w-[110px]">${escapeHtml(ad.sdkDomain)}</span>
          </div>
        </div>

        ${ad.desc ? `<p class="text-xs text-white/80 line-clamp-2 leading-relaxed mt-1">${escapeHtml(ad.desc)}</p>` : ''}
      </div>

      <!-- 5-Click Progress Meter & Action Button -->
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
            <i class="fa-solid fa-film"></i>
            <span>WATCH REWARDED AD (+1 CREDIT)</span>
          </span>
          <i class="fa-solid fa-arrow-right text-xs text-white/70 group-hover:translate-x-1 transition"></i>
        </button>

      </div>
    </article>
    `;
  }).join('');
}

// --- DUAL-TRIGGER REWARDED INTERSTITIAL EXECUTION ENGINE ---
function executeMonetagTrigger(sdkDomain, zoneId) {
  const cleanDomain = cleanSdkDomainInput(sdkDomain);
  const fullScriptUrl = `https://${cleanDomain}/tag.min.js`;

  // 1. Dynamic In-Page Tag Injection for Rewarded Interstitial
  try {
    const container = document.getElementById('monetag-dynamic-container');
    container.innerHTML = '';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = fullScriptUrl;
    script.setAttribute('data-zone', zoneId);
    script.async = true;

    script.onload = () => {
      try {
        // Specifically invoke Rewarded Interstitial methods
        if (typeof window.show_rewarded_interstitial === 'function') {
          window.show_rewarded_interstitial({ zoneId: parseInt(zoneId) });
        } else if (typeof window.show_interstitial === 'function') {
          window.show_interstitial(parseInt(zoneId));
        }
      } catch (e) {
        console.warn("Direct Monetag function call notice:", e);
      }
    };

    container.appendChild(script);
  } catch (e) {
    console.warn("Script injection notice:", e);
  }

  // 2. Direct Window Trigger Fallback (Guarantees user sees ad even if ad blocker blocks tag)
  try {
    const fallbackUrl = `https://${cleanDomain}/tag.min.js?zone=${encodeURIComponent(zoneId)}`;
    const popup = window.open(fallbackUrl, '_blank');
    if (popup) {
      setTimeout(() => popup.focus(), 200);
    }
  } catch (e) {
    console.warn("Fallback notice:", e);
  }
}

// --- PRE-TEST REWARDED INTERSTITIAL IN CREATE MODAL ---
function testAdBeforePublishing() {
  const sdkDomain = document.getElementById('ad-sdk-domain').value.trim() || DEFAULT_SDK_DOMAIN;
  const zoneId = document.getElementById('ad-zone-id').value.trim();

  if (!zoneId || isNaN(zoneId) || parseInt(zoneId) <= 0) {
    alert("⚠️ Please enter a valid numeric Zone ID (e.g. 10555746) to test!");
    return;
  }

  executeMonetagTrigger(sdkDomain, zoneId);

  const badge = document.getElementById('test-status-badge');
  badge.className = "px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/40";
  badge.innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i>Verified &amp; Clickable!`;

  alert(`🚀 Rewarded Interstitial triggered for Domain: ${cleanSdkDomainInput(sdkDomain)} & Zone #${zoneId}!\nIf you see the ad, your campaign is verified and ready to post.`);
}

// --- USER CLICKS AD FROM PUBLIC FEED ---
function triggerMonetagAd(adId) {
  const ad = currentAds.find(a => a.id === adId);
  if (!ad) return;

  activeInteractingAd = ad;

  // 1. Immediately execute Monetag rewarded interstitial
  executeMonetagTrigger(ad.sdkDomain, ad.zoneId);

  // 2. Open engagement verification timer modal
  document.getElementById('view-ad-title').innerText = ad.title;
  document.getElementById('view-ad-zone-id').innerText = `Zone: #${ad.zoneId} • Rewarded Interstitial`;
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

// --- RELAUNCH BUTTON IF AD DID NOT SHOW ---
function relaunchActiveAd() {
  if (!activeInteractingAd) return;
  executeMonetagTrigger(activeInteractingAd.sdkDomain, activeInteractingAd.zoneId);
}

// --- CLAIM REWARD & CHECK 5-CLICK DISAPPEARANCE ---
function claimAdReward() {
  if (!activeInteractingAd) return;

  const ad = currentAds.find(a => a.id === activeInteractingAd.id);
  if (!ad) return;

  // Close modal
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
      // Purge permanently from the public feed
      currentAds = currentAds.filter(a => a.id !== ad.id);
      saveStoredAds(currentAds);
      refreshAdGrid();
    }, 550);
  } else {
    saveStoredAds(currentAds);
    refreshAdGrid();
  }

  alert(`🎉 Success! You earned +1 Credit for viewing Monetag Rewarded Interstitial #${ad.zoneId}.`);
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
  document.getElementById('ad-sdk-domain').value = DEFAULT_SDK_DOMAIN;
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
  const sdkDomainInput = document.getElementById('ad-sdk-domain').value.trim();
  const zoneIdInput = document.getElementById('ad-zone-id').value.trim();
  const desc = document.getElementById('ad-desc').value.trim();

  // Validate zone ID
  if (!zoneIdInput || isNaN(zoneIdInput) || parseInt(zoneIdInput) <= 0) {
    alert("Please enter a valid numeric Monetag Zone ID (e.g. 10555746).");
    return;
  }

  const cleanDomain = cleanSdkDomainInput(sdkDomainInput);

  // Deduct 5 credits from publisher
  currentUser.credits -= 5;
  saveUserProfile(currentUser);

  // Pick random shining metallic color theme
  const randomTheme = SHINE_THEMES[Math.floor(Math.random() * SHINE_THEMES.length)];

  const newAd = {
    id: "AD_" + Date.now() + "_" + Math.floor(Math.random() * 9999),
    author: currentUser.username,
    title: title,
    format: "Rewarded Interstitial", // Hard-locked to Rewarded Interstitial
    sdkDomain: cleanDomain,
    zoneId: String(zoneIdInput),
    desc: desc,
    clicks: 0,
    theme: randomTheme,
    createdAt: Date.now()
  };

  currentAds.unshift(newAd);
  saveStoredAds(currentAds);

  closeCreateAdModal();
  refreshAdGrid();
  alert(`✨ Monetag Rewarded Interstitial Zone #${newAd.zoneId} published! 5 Credits deducted. It will disappear after 5 clicks.`);
}

// --- USERNAME MANAGEMENT ---
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

// --- HELPER: ESCAPE HTML ---
function escapeHtml(s) {
  return s ? String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])) : '';
}

// --- INITIALIZE APPLICATION ---
window.addEventListener('DOMContentLoaded', () => {
  refreshAdGrid();
});