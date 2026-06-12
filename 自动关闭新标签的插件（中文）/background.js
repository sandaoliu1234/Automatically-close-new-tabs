let pluginEnabled = true; // 默认启用状态

// 监听来自 popup.js 的消息
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.action === 'togglePlugin') {
        pluginEnabled = message.enabled; // 更新插件状态
        // 将状态保存到 chrome.storage
        chrome.storage.local.set({ pluginEnabled: pluginEnabled }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error setting storage:', chrome.runtime.lastError);
            }
        });
    }
});

// 监听标签页创建事件
chrome.tabs.onCreated.addListener((tab) => {
    if (!pluginEnabled) return; // 如果插件被禁用，直接返回

    // 检查新标签页
    if (tab.url === 'chrome://newtab/' || tab.url === 'about:blank') {
        // 关闭其他新标签页
        closeExtraNewTabs(tab.id);
    }
});

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!pluginEnabled) return; // 如果插件被禁用，直接返回

    // 当页面完成加载时
    if (changeInfo.status === 'complete') {
        // 检查是否是新标签页
        if (tab.url === 'chrome://newtab/' || tab.url === 'about:blank') {
            // 注入脚本
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: setupMouseLeaveListener,
            });
        }
    }
});

// 监听标签页切换事件
chrome.tabs.onActivated.addListener((activeInfo) => {
    if (!pluginEnabled) return; // 如果插件被禁用，直接返回

    // 关闭多余的新标签页
    closeExtraNewTabs(activeInfo.tabId);
});

// 关闭多余的新标签页
function closeExtraNewTabs(currentTabId) {
    chrome.tabs.query({ url: ["chrome://newtab/", "about:blank"] }, (tabs) => {
        tabs.forEach((tab) => {
            if (tab.id !== currentTabId) {
                chrome.tabs.remove(tab.id).catch((error) => {
                    // 捕获并处理错误
                    if (error.message !== "Tabs cannot be edited right now (user may be dragging a tab).") {
                        console.error('无法关闭标签页:', error); // 仅在非拖动情况下输出错误
                    }
                });
            }
        });
    });
}

// 要注入的函数
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

// 监听来自注入脚本的消息
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.action === 'closeTab' && sender.tab) {
        chrome.tabs.remove(sender.tab.id).catch((error) => {
            // 捕获并处理错误
            if (error.message !== "Tabs cannot be edited right now (user may be dragging a tab).") {
                console.error('无法关闭标签页:', error); // 仅在非拖动情况下输出错误
            }
        });
    }
});