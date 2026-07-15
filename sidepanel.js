// NetFilter - Side Panel Dashboard Javascript

// Constants
const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdOSaNfjqBtHYQCkB-mrtVdUXbt761vHtqoo7xIRaXSEhvV5g/viewform?usp=header";
const PAYPAL_ME_URL = "http://paypal.me/bellibilal/3";
const WEB_STORE_URL = "https://chromewebstore.google.com/";

// DOM Elements
const navButtons = document.querySelectorAll('.nav-btn');
const navPanels = document.querySelectorAll('.nav-panel');

const statusPulse = document.getElementById('status-pulse');
const statusText = document.getElementById('status-text');
const blockerToggle = document.getElementById('blocker-toggle');
const shieldCard = document.querySelector('.shield-card');
const shieldSubtext = document.getElementById('shield-subtext');

const statBlockedCount = document.getElementById('stat-blocked-count');

const customBlockedList = document.getElementById('custom-blocked-list');
const blocklistEmpty = document.getElementById('blocklist-empty');
const addBlockForm = document.getElementById('add-block-form');
const blockInput = document.getElementById('block-input');

const logsList = document.getElementById('logs-list');
const logsEmpty = document.getElementById('logs-empty');
const logSearchInput = document.getElementById('log-search');
const clearLogsBtn = document.getElementById('clear-logs-btn');

// Footer & Menu Links
const linkReport = document.getElementById('link-report');
const linkRate = document.getElementById('link-rate');
const linkSupport = document.getElementById('link-support');
const linkPrivacy = document.getElementById('link-privacy');
const linkTerms = document.getElementById('link-terms');
const linkAbout = document.getElementById('link-about');

// Local Data State
let customBlocked = [];
let logs = [];

// Init Dashboard
document.addEventListener('DOMContentLoaded', () => {
    initTabNavigation();
    initSettingsSync();
    initBlocklistManager();
    initLogsView();
    initExternalLinks();
});

// 1. Tab Panel Navigation
function initTabNavigation() {
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPanelId = btn.getAttribute('data-panel');
            
            // Remove active classes
            navButtons.forEach(b => b.classList.remove('active'));
            navPanels.forEach(p => p.classList.remove('active'));
            
            // Set active
            btn.classList.add('active');
            const targetPanel = document.getElementById(targetPanelId);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}

// 2. Settings Synchronization & Toggle Control
function initSettingsSync() {
    // Load initial enable state
    chrome.storage.local.get('blockerEnabled', (data) => {
        const isEnabled = data.blockerEnabled !== false; // defaults to true
        blockerToggle.checked = isEnabled;
        updateBlockerStatusUI(isEnabled);
    });

    // Handle toggle action
    blockerToggle.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        chrome.storage.local.set({ blockerEnabled: isEnabled }, () => {
            updateBlockerStatusUI(isEnabled);
        });
    });
}

function updateBlockerStatusUI(isEnabled) {
    if (isEnabled) {
        statusPulse.className = 'pulse active';
        statusText.textContent = 'Protected';
        shieldCard.classList.remove('disabled');
        shieldSubtext.textContent = 'Filter active. Bad sites are blocked.';
    } else {
        statusPulse.className = 'pulse inactive';
        statusText.textContent = 'Paused';
        shieldCard.classList.add('disabled');
        shieldSubtext.textContent = 'Filter is inactive. Bad sites are not blocked.';
    }
}

// 3. Custom Block List Manager
function initBlocklistManager() {
    // Load lists from storage
    chrome.storage.local.get('customBlocked', (data) => {
        customBlocked = data.customBlocked || [];
        renderBlocklist();
    });

    // Form submit for adding a website
    addBlockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const value = blockInput.value.trim().toLowerCase();
        if (!value) return;

        // Clean input: remove http:// or https:// and www.
        let domain = value;
        try {
            if (value.startsWith('http://') || value.startsWith('https://')) {
                domain = new URL(value).hostname;
            }
        } catch (err) {
            // fallback
        }
        
        domain = domain.replace(/^www\./, '');

        // Simple domain validation regex
        const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;
        if (!domainRegex.test(domain)) {
            alert('Please enter a valid website domain name (e.g. facebook.com).');
            return;
        }

        if (customBlocked.includes(domain)) {
            alert('This website is already on your blocklist.');
            blockInput.value = '';
            return;
        }

        customBlocked.unshift(domain);
        chrome.storage.local.set({ customBlocked: customBlocked }, () => {
            renderBlocklist();
            blockInput.value = '';
        });
    });

    // Handle clicks on list items (specifically deletes)
    customBlockedList.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-item-btn');
        if (!deleteBtn) return;

        const domainToRemove = deleteBtn.getAttribute('data-domain');
        customBlocked = customBlocked.filter(d => d !== domainToRemove);
        
        chrome.storage.local.set({ customBlocked: customBlocked }, () => {
            renderBlocklist();
        });
    });
}

function renderBlocklist() {
    customBlockedList.innerHTML = '';
    
    if (customBlocked.length === 0) {
        blocklistEmpty.style.display = 'flex';
        return;
    }
    
    blocklistEmpty.style.display = 'none';
    customBlocked.forEach(domain => {
        const li = document.createElement('li');
        li.className = 'custom-list-item';
        li.innerHTML = `
            <span class="custom-list-item-text">${domain}</span>
            <button class="btn-icon delete-item-btn" data-domain="${domain}" title="Remove from Blocklist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </button>
        `;
        customBlockedList.appendChild(li);
    });
}

// 4. Activity Logs View
function initLogsView() {
    // Initial load
    loadAndRenderLogs();

    // Clear logs handler
    clearLogsBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all activity logs?')) {
            chrome.storage.local.set({ logs: [] }, () => {
                loadAndRenderLogs();
            });
        }
    });

    // Search filter handler
    logSearchInput.addEventListener('input', () => {
        const query = logSearchInput.value.toLowerCase().trim();
        const items = logsList.getElementsByClassName('log-item');
        
        Array.from(items).forEach(item => {
            const domain = item.getAttribute('data-domain') || '';
            const url = item.getAttribute('data-url') || '';
            if (domain.includes(query) || url.includes(query)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });

    // Refresh logs when panel changes or storage changes
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.logs) {
            loadAndRenderLogs();
        }
    });
}

function loadAndRenderLogs() {
    chrome.storage.local.get('logs', (data) => {
        logs = data.logs || [];
        
        // Handle migration if it was stored as string
        if (typeof logs === 'string') {
            logs = [];
        }

        // Update stats badge
        statBlockedCount.textContent = logs.length;

        renderLogs();
    });
}

function renderLogs() {
    logsList.innerHTML = '';
    
    if (logs.length === 0) {
        logsEmpty.style.display = 'flex';
        clearLogsBtn.style.display = 'none';
        return;
    }
    
    logsEmpty.style.display = 'none';
    clearLogsBtn.style.display = 'block';

    logs.forEach(log => {
        const li = document.createElement('li');
        li.className = 'log-item';
        li.setAttribute('data-domain', (log.domain || '').toLowerCase());
        li.setAttribute('data-url', (log.url || '').toLowerCase());
        
        li.innerHTML = `
            <div class="log-item-header">
                <span class="log-item-domain">${log.domain || 'Blocked Website'}</span>
                <span class="log-item-time">${log.time}</span>
            </div>
            <div class="log-item-url" title="${log.url}">${log.url}</div>
        `;
        logsList.appendChild(li);
    });
}

// 5. External Link Openers (Safety with chrome.tabs.create)
function initExternalLinks() {
    // Menu items
    linkReport.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: GOOGLE_FORM_URL });
    });
    
    linkRate.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: WEB_STORE_URL });
    });
    
    linkSupport.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: PAYPAL_ME_URL });
    });

    // Footer items
    linkPrivacy.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: chrome.runtime.getURL('privacy.html') });
    });

    linkTerms.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: chrome.runtime.getURL('terms.html') });
    });

    linkAbout.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: chrome.runtime.getURL('about.html') });
    });
}
