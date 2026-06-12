let isEnabled = true; // Default enabled state

// Get button element
const toggleButton = document.getElementById('toggleButton');

// Update button text
function updateButtonText() {
    toggleButton.textContent = isEnabled ? 'Disable Plugin' : 'Enable Plugin';
}

// Handle button click event
toggleButton.addEventListener('click', () => {
    isEnabled = !isEnabled; // Toggle state
    updateButtonText(); // Update button text

    // Send message to background.js
    chrome.runtime.sendMessage({ action: 'togglePlugin', enabled: isEnabled });

    // If plugin is disabled, close current extension window
    if (!isEnabled) {
        window.close(); // Close popup window
    }
});

// Initialize button text
function init() {
    // Get plugin state from chrome.storage
    chrome.storage.local.get(['pluginEnabled'], (result) => {
        isEnabled = result.pluginEnabled !== undefined ? result.pluginEnabled : true; // Default enabled
        updateButtonText(); // Update button text
    });
}

// Call initialization function
init();