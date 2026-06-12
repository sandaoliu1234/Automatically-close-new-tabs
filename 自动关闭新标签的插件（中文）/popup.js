let isEnabled = true; // 默认启用状态

// 获取按钮元素
const toggleButton = document.getElementById('toggleButton');

// 更新按钮文本
function updateButtonText() {
    toggleButton.textContent = isEnabled ? '禁用插件' : '启用插件';
}

// 处理按钮点击事件
toggleButton.addEventListener('click', () => {
    isEnabled = !isEnabled; // 切换状态
    updateButtonText(); // 更新按钮文本

    // 发送消息到 background.js
    chrome.runtime.sendMessage({ action: 'togglePlugin', enabled: isEnabled });

    // 如果禁用插件，关闭当前扩展窗口
    if (!isEnabled) {
        window.close(); // 关闭弹出窗口
    }
});

// 初始化按钮文本
function init() {
    // 从 chrome.storage 中获取插件状态
    chrome.storage.local.get(['pluginEnabled'], (result) => {
        isEnabled = result.pluginEnabled !== undefined ? result.pluginEnabled : true; // 默认启用
        updateButtonText(); // 更新按钮文本
    });
}

// 调用初始化函数
init();