(function () {
    'use strict';

    const API_BASE = RAIN_CONFIG.API_BASE;
    const TOKEN_KEY = RAIN_CONFIG.TOKEN_KEY;

    const $ = id => document.getElementById(id);
    const toastEl = $('toast');

    let currentProfile = null;

    /* ===================== 工具函数 ===================== */
    function getToken()  { return RAIN_AUTH.getToken(); }
    function clearToken() { RAIN_AUTH.clearToken(); }

    function showToast(msg, isError = false) {
        toastEl.textContent = msg;
        toastEl.className = 'toast' + (isError ? ' error' : '');
        toastEl.classList.add('show');
        setTimeout(() => toastEl.classList.remove('show'), 2500);
    }

    function formatDateTime(iso) {
        if (!iso) return null;
        const d = new Date(iso);
        if (isNaN(d)) return iso;
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }
    function formatDate(iso) {
        if (!iso) return null;
        const d = new Date(iso);
        if (isNaN(d)) return iso;
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    function setText(id, text, emptyText = '--') {
        const el = $(id);
        if (!el) return;
        if (text === null || text === undefined || text === '') {
            el.textContent = emptyText;
            el.classList.add('empty');
        } else {
            el.textContent = text;
            el.classList.remove('empty');
        }
    }

    /* ===================== 数据获取 ===================== */
    async function fetchProfile() {
        const token = getToken();
        if (!token) {
            window.location.href = '/';
            return null;
        }
        try {
            const res = await fetch(`${API_BASE}/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                if (res.status === 401) {
                    clearToken();
                    window.location.href = '/';
                }
                throw new Error('profile fetch failed');
            }
            return await res.json();
        } catch (e) {
            console.error('[Profile]', e);
            showToast('获取信息失败', true);
            return null;
        }
    }

    /* ===================== 渲染 ===================== */
    function renderProfile(profile) {
        if (!profile) return;
        currentProfile = profile;

        // 昵称
        setText('nicknameText', profile.nickname, profile.qq);
        $('nicknameInput').value = profile.nickname || profile.qq || '';

        // QQ
        setText('qqValue', profile.qq);

        // 积分
        setText('pointsNumber', profile.points ?? 0);

        const pd = profile.pointDetails || {};
        setText('lastSignInDate', formatDate(pd.lastSignInDate));
        setText('consecutiveSignIn', pd.consecutiveSignIn ?? 0);
        setText('totalSignIn', pd.totalSignIn ?? 0);
        setText('lastLikeDate', formatDate(pd.lastLikeDate));
        setText('lastGrabTime', formatDateTime(pd.lastGrabTime));
        setText('lastTransferDate', formatDate(pd.lastTransferDate));

        setText('createdAt', formatDateTime(profile.createdAt));
        setText('lastLoginAt', formatDateTime(profile.lastLoginAt));
    }

    /* ===================== 彩蛋进度 ===================== */
    async function fetchEasterEggs() {
        const token = getToken();
        if (!token) return null;
        try {
            const res = await fetch(`${API_BASE}/user/easter-eggs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            console.error('[EasterEggs]', e);
            return null;
        }
    }

    function renderEasterEggs(eggs) {
        const container = document.getElementById('easterProgressList');
        if (!container) return;

        if (!eggs) {
            container.innerHTML = '<div class="easter-loading">无法加载进度</div>';
            return;
        }

        const totalDiaries = eggs.totalDiaries || 5;
        const totalMaterials = eggs.totalMaterials || 4;
        const totalEggs = eggs.totalEggs || 5;

        const diaryCount = (eggs.unlockedDiaries || []).length;
        const materialCount = (eggs.unlockedMaterials || []).length;
        const eggCount = (eggs.discovered || []).length;

        const diaryComplete = diaryCount >= totalDiaries;
        const materialComplete = materialCount >= totalMaterials;
        const eggComplete = eggCount >= totalEggs;

        container.innerHTML = `
            <div class="easter-progress-item">
                <span class="easter-progress-label">彩蛋发现</span>
                <span class="easter-progress-value ${eggComplete ? 'complete' : ''}">${eggCount}/${eggComplete ? totalEggs : '?'}</span>
            </div>
            <div class="easter-progress-item">
                <span class="easter-progress-label">日记</span>
                <span class="easter-progress-value ${diaryComplete ? 'complete' : ''}">${diaryCount}/${diaryComplete ? totalDiaries : '?'}</span>
            </div>
            <div class="easter-progress-item">
                <span class="easter-progress-label">资料</span>
                <span class="easter-progress-value ${materialComplete ? 'complete' : ''}">${materialCount}/${materialComplete ? totalMaterials : '?'}</span>
            </div>
        `;
    }

    /* ===================== 昵称编辑 ===================== */
    const nicknameWrap = $('nicknameWrap');
    const nicknameEdit = $('nicknameEdit');
    const nicknameInput = $('nicknameInput');
    const btnEdit = $('btnEditNickname');
    const btnSave = $('btnSaveNickname');
    const btnCancel = $('btnCancelNickname');

    function showEdit() {
        nicknameWrap.style.display = 'none';
        nicknameEdit.style.display = 'flex';
        nicknameInput.value = currentProfile?.nickname || currentProfile?.qq || '';
        nicknameInput.focus();
    }

    function hideEdit() {
        nicknameWrap.style.display = 'flex';
        nicknameEdit.style.display = 'none';
    }

    async function saveNickname() {
        const newName = nicknameInput.value.trim();
        if (!newName) {
            showToast('昵称不能为空', true);
            return;
        }
        if (newName === currentProfile?.nickname) {
            hideEdit();
            return;
        }
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/user/nickname`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nickname: newName })
            });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.message || '更新失败', true);
                return;
            }
            currentProfile.nickname = data.nickname;
            setText('nicknameText', data.nickname);
            hideEdit();
            showToast('昵称更新成功');
        } catch (e) {
            console.error('[Nickname Update]', e);
            showToast('网络错误，请稍后重试', true);
        }
    }

    btnEdit.addEventListener('click', showEdit);
    btnSave.addEventListener('click', saveNickname);
    btnCancel.addEventListener('click', hideEdit);
    nicknameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') saveNickname();
        if (e.key === 'Escape') hideEdit();
    });

    /* ===================== 退出登录 ===================== */
    $('btnLogout').addEventListener('click', () => {
        clearToken();
        window.location.href = '/';
    });

    /* ===================== 返回首页 ===================== */
    $('btnBack').addEventListener('click', e => {
        e.preventDefault();
        window.location.href = '/';
    });

    /* ===================== 背景粒子（与主页一致） ===================== */
    RAIN_PARTICLES.initParticles('bgParticles', {
        count: 60,
        connectLines: true,
        connectThrottle: 2
    });

    /* ===================== 初始化 ===================== */
    async function init() {
        const profile = await fetchProfile();
        if (profile) {
            renderProfile(profile);
            const eggs = await fetchEasterEggs();
            renderEasterEggs(eggs);
        }
    }

    init();
})();
