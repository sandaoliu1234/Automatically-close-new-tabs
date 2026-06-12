let pluginEnabled = true; // Default enabled state

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.action === 'togglePlugin') {
        pluginEnabled = message.enabled; // Update plugin state
        // Save state to chrome.storage
        chrome.storage.local.set({ pluginEnabled: pluginEnabled }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error setting storage:', chrome.runtime.lastError);
            }
        });
    }
});

// Listen for tab creation events
chrome.tabs.onCreated.addListener((tab) => {
    if (!pluginEnabled) return; // If plugin is disabled, return directly

    // Check new tab page
    if (tab.url === 'chrome://newtab/' || tab.url === 'about:blank') {
        // Close other new tab pages
        closeExtraNewTabs(tab.id);
    }
});

// Listen for tab update events
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!pluginEnabled) return; // If plugin is disabled, return directly

    // When page loading is complete
    if (changeInfo.status === 'complete') {
        // Check if it's a new tab page
        if (tab.url === 'chrome://newtab/' || tab.url === 'about:blank') {
            // Inject script
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: setupMouseLeaveListener,
            });
        }
    }
});

// Listen for tab activation events
chrome.tabs.onActivated.addListener((activeInfo) => {
    if (!pluginEnabled) return; // If plugin is disabled, return directly

    // Close excess new tab pages
    closeExtraNewTabs(activeInfo.tabId);
});

// Close excess new tab pages
function closeExtraNewTabs(currentTabId) {
    chrome.tabs.query({ url: ["chrome://newtab/", "about:blank"] }, (tabs) => {
        tabs.forEach((tab) => {
            if (tab.id !== currentTabId) {
                chrome.tabs.remove(tab.id).catch((error) => {
                    // Catch and handle errors
                    if (error.message !== "Tabs cannot be edited right now (user may be dragging a tab).") {
                        console.error('Unable to close tab:', error); // Only output error in non-dragging situations
                    }
                });
            }
        });
    });
}

// Function to be injected
function setupMouseLeaveListener() {
    let mouseOutTimer = null;

    document.addEventListener('mouseleave', () => {
        mouseOutTimer = setTimeout(() => {
            chrome.runtime.sendMessage({ action: 'closeTab' });
        }, 500);
    });

    document.addEventListener('mouseenter', () => {
        if (mouseOutTimer) {
            clearTimeout(mouseOutTimer);
            mouseOutTimer = null;
        }
    });
}

// Listen for messages from injected scripts
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.action === 'closeTab' && sender.tab) {
        chrome.tabs.remove(sender.tab.id).catch((error) => {
            // Catch and handle errors
            if (error.message !== "Tabs cannot be edited right now (user may be dragging a tab).") {
                console.error('Unable to close tab:', error); // Only output error in non-dragging situations
            }
        });
    }
});