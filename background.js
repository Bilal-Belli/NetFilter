// NetFilter - Background Service Worker

let blockedHashesSet = null;
let customBlockedSet = new Set();
let blockerEnabled = true;

// Clean hostname: removes 'www.' and converts to lowercase
function cleanHostname(hostname) {
    if (!hostname) return "";
    return hostname.toLowerCase().trim().replace(/^www\./, '');
}

// Generates variants to check parent domains (e.g. sub.example.com -> ['sub.example.com', 'example.com'])
function getDomainVariants(hostname) {
    const cleaned = cleanHostname(hostname);
    if (!cleaned) return [];
    
    const parts = cleaned.split('.');
    const variants = [];
    
    // We want to generate variants down to the second level domain (e.g., example.com)
    for (let i = 0; i < parts.length - 1; i++) {
        variants.push(parts.slice(i).join('.'));
    }
    return variants;
}

// Compute SHA-256 hash using the Web Crypto API
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message.trim().toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Lazy-load the blocked hashes database
async function loadBlockedHashes() {
    if (blockedHashesSet) return blockedHashesSet;
    try {
        const response = await fetch(chrome.runtime.getURL('blocked_hashes.json'));
        const hashesArray = await response.json();
        blockedHashesSet = new Set(hashesArray);
        return blockedHashesSet;
    } catch (e) {
        console.error("Failed to load blocked hashes:", e);
        return new Set();
    }
}

// Initialize settings and lists
async function init() {
    try {
        const data = await chrome.storage.local.get(['blockerEnabled', 'customBlocked']);
        
        if (data.blockerEnabled !== undefined) {
            blockerEnabled = data.blockerEnabled;
        } else {
            blockerEnabled = true;
            await chrome.storage.local.set({ blockerEnabled: true });
        }
        
        if (data.customBlocked) {
            customBlockedSet = new Set(data.customBlocked.map(d => cleanHostname(d)));
        }
        
        // Warm up cache
        await loadBlockedHashes();
    } catch (e) {
        console.error("Error during init:", e);
    }
}

// Run init on startup
init();

// Keep local state in sync with chrome.storage.local changes
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        if (changes.customBlocked) {
            customBlockedSet = new Set(changes.customBlocked.newValue.map(d => cleanHostname(d)));
        }
        if (changes.blockerEnabled) {
            blockerEnabled = changes.blockerEnabled.newValue;
        }
    }
});

// Configure Side Panel to open on action (icon) click
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error) => console.error("Error setting side panel behavior:", error));
}

// Check if domain is blocked
async function checkBlocked(hostname) {
    if (!blockerEnabled) return false;
    
    const variants = getDomainVariants(hostname);
    if (variants.length === 0) return false;
    
    // 1. Check custom blocked list (fastest, plain text check)
    for (const variant of variants) {
        if (customBlockedSet.has(variant)) {
            return true;
        }
    }
    
    // 2. Check compiled hashes block list
    const hashesSet = await loadBlockedHashes();
    for (const variant of variants) {
        const hash = await sha256(variant);
        if (hashesSet.has(hash)) {
            return true;
        }
    }
    
    return false;
}

// Log blocked activity
async function saveLog(url) {
    try {
        const d = new Date();
        const dateString = d.getDate() + "/" + addZero((d.getMonth() + 1)) + "/" + d.getFullYear() + "  " + addZero(d.getHours()) + " : " + addZero(d.getMinutes());
        
        let domain = "Unknown Site";
        try {
            domain = new URL(url).hostname;
        } catch (err) {
            // fallback
        }
        
        const data = await chrome.storage.local.get('logs');
        let logs = data.logs || [];
        
        if (typeof logs === 'string') {
            logs = []; // Migrate/reset legacy logs
        }
        
        logs.unshift({
            url: url,
            time: dateString,
            domain: domain
        });
        
        // Cap logs at 500 entries
        if (logs.length > 500) {
            logs = logs.slice(0, 500);
        }
        
        await chrome.storage.local.set({ logs: logs });
    } catch (e) {
        console.error("Error saving log:", e);
    }
}

function addZero(i) {
    return i < 10 ? "0" + i : i;
}

// Main navigation listener: Checks URL BEFORE it is loaded
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    // Only intercept the top-level main frame
    if (details.frameId !== 0) return;
    
    const url = details.url;
    if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) return;
    
    try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname;
        
        // Skip checking if it's the extension's own pages to prevent redirect loops
        if (url.startsWith(chrome.runtime.getURL(""))) return;
        
        const isBlocked = await checkBlocked(hostname);
        if (isBlocked) {
            // Redirect the tab immediately to our blocked alert page
            chrome.tabs.update(details.tabId, {
                url: chrome.runtime.getURL("blocked.html") + "?url=" + encodeURIComponent(url)
            });
            // Record in logs
            await saveLog(url);
        }
    } catch (e) {
        console.error("Error in onBeforeNavigate handler:", e);
    }
});