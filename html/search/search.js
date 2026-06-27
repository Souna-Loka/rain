// search.js - 雨境基调交互
(function () {
    const params = new URLSearchParams(location.search);
    const code = params.get('code') || '未获取到授权码';

    const codeEl = document.getElementById('code');
    if (codeEl) codeEl.textContent = code;

    // 创建 Toast 元素
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2200);
    }

    function doCopy() {
        const text = codeEl ? codeEl.textContent : '';
        if (!text || text === '未获取到授权码') {
            showToast('没有可复制的授权码');
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    showToast('已复制到剪贴板');
                    codeEl.classList.add('copied');
                    setTimeout(() => codeEl.classList.remove('copied'), 1200);
                })
                .catch(() => fallbackCopy(text));
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast('已复制到剪贴板');
            if (codeEl) {
                codeEl.classList.add('copied');
                setTimeout(() => codeEl.classList.remove('copied'), 1200);
            }
        } catch (err) {
            showToast('复制失败，请手动复制');
        }
        document.body.removeChild(textarea);
    }

    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) copyBtn.addEventListener('click', doCopy);

    const copyBtnMain = document.getElementById('copyBtnMain');
    if (copyBtnMain) copyBtnMain.addEventListener('click', doCopy);
})();
