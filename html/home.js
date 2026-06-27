(function () {
    'use strict';

    /* ===================== 配置 ===================== */
    const API_BASE = RAIN_CONFIG.API_BASE;
    const TOKEN_KEY = RAIN_CONFIG.TOKEN_KEY;
    const GUEST_KEY = RAIN_CONFIG.GUEST_KEY;
    const DATA_URL = 'data/dialogue.json';
    const DEFAULT_BOT = 'assets/bot.png';
    const EXPR_DIR = 'assets/expressions/';

    /* ===================== 状态 ===================== */
    let dialogueData = null;
    let isTyping = false;
    let typeTimer = null;
    let lastWelcomeIdx = -1;
    let lastInteractIdx = -1;
    let currentUser = null;

    /* ===================== DOM 引用 ===================== */
    const $ = id => document.getElementById(id);
    const typeText = $('typeText');
    const cursor = $('cursor');
    const btnGroup = $('btnGroup');
    const footerHint = $('footerHint');
    const botWrap = $('botWrap');
    const botImg = $('botImg');
    const mainWrap = $('mainWrap');
    const transitionOverlay = $('transitionOverlay');
    const transitionRipple = $('transitionRipple');
    const userBar = $('userBar');
    const loginModal = $('loginModal');
    const loginQQ = $('loginQQ');
    const loginPassword = $('loginPassword');
    const loginError = $('loginError');
    const btnLoginSubmit = $('btnLoginSubmit');
    const btnLoginClose = $('btnLoginClose');

    /* ===================== 加载对话数据 ===================== */
    async function loadDialogue() {
        try {
            const res = await fetch(DATA_URL);
            if (!res.ok) throw new Error('fetch failed');
            dialogueData = await res.json();
        } catch (e) {
            console.error('[Dialogue] 加载失败，使用内置数据:', e);
            // 兜底数据
            dialogueData = {
                defaultExpression: 'bot.png',
                welcome: [
                    { text: '欢迎光临~~ ' },
                    { text: '你好呀~ 今天想做点什么吗？' },
                    { text: '昨天在下雨，今天在下雨，明天也会下雨吗 🌧️' }
                ],
                loggedIn: { text: '要去哪看看呢？' },
                interactions: [
                    { text: '咕噜噜，被戳惹' },
                    { text: '好痒呀~ 别闹啦！' },
                    { text: '哼哼，想知道关于这里的秘密吗' },
                    { text: '我不会说的，什么隐藏按钮什么的，我什么都不知道' },
                    { text: '要来一起玩吗' },
                    { text: '（盯~~~）' }
                ]
            };
        }
    }

    /* ===================== 表情切换接口 ===================== */
    /**
     * switchExpression(expression)
     * @param {string|null} expression - 表情立绘文件名，如 "bot_happy.png"
     *   为 null/undefined 时使用默认立绘
     * 后续 Bot 新增表情立绘时，只需：
     *   1. 将新立绘放入 assets/expressions/
     *   2. 在 dialogue.json 中给对应对话设置 expression 字段
     */
    function switchExpression(expression) {
        const path = expression
            ? EXPR_DIR + expression
            : DEFAULT_BOT;

        // 预加载避免闪烁
        const preload = new Image();
        preload.onload = () => { botImg.src = preload.src; };
        preload.onerror = () => { botImg.src = DEFAULT_BOT; };
        preload.src = path;
    }

    /* ===================== 打字机效果 ===================== */
    function typeWriter(text, speed = 55) {
        return new Promise(resolve => {
            if (isTyping) {
                clearTimeout(typeTimer);
            }
            isTyping = true;
            typeText.textContent = '';
            cursor.style.display = 'inline-block';
            let i = 0;

            function step() {
                if (i < text.length) {
                    typeText.textContent += text.charAt(i);
                    i++;
                    const ch = text.charAt(i - 1);
                    const delay = /[，。！？~\n]/.test(ch) ? speed * 2.5 : speed;
                    typeTimer = setTimeout(step, delay);
                } else {
                    isTyping = false;
                    resolve();
                }
            }
            step();
        });
    }

    /* ===================== 登录状态 (Token + Guest) ===================== */
    function getToken()  { return RAIN_AUTH.getToken(); }
    function setToken(t) { RAIN_AUTH.setToken(t); }
    function clearToken() { RAIN_AUTH.clearToken(); }
    function isGuest()  { return RAIN_AUTH.isGuest(); }
    function setGuest()  { RAIN_AUTH.setGuest(); }
    function clearGuest() { RAIN_AUTH.clearGuest(); }
    function hasSession() { return RAIN_AUTH.hasSession(); }
    function isAuthenticated() { return RAIN_AUTH.isAuthenticated(); }

    async function fetchUserProfile() {
        const token = getToken();
        if (!token) return null;
        try {
            const res = await fetch(`${API_BASE}/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('profile fetch failed');
            return await res.json();
        } catch (e) {
            console.error('[Profile]', e);
            return null;
        }
    }

    /* ===================== 2. 跳转过渡动画 ===================== */
    function navigateWithTransition(url, x, y) {
        transitionRipple.style.left = (x ?? window.innerWidth / 2) + 'px';
        transitionRipple.style.top = (y ?? window.innerHeight / 2) + 'px';
        transitionOverlay.classList.add('active');
        setTimeout(() => {
            window.location.href = url;
        }, 900);
    }

    /* ===================== 6. 按钮水波纹 ===================== */
    function addRipple(e, btn) {
        const dot = document.createElement('span');
        dot.className = 'ripple-dot';
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        dot.style.width = dot.style.height = size + 'px';
        dot.style.left = (e.clientX - rect.left - size / 2) + 'px';
        dot.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(dot);
        setTimeout(() => dot.remove(), 600);
    }

    /* ===================== 用户状态栏 ===================== */
    function renderUserBar(loggedIn, profile) {
        if (!userBar) return;
        userBar.innerHTML = '';
        if (!loggedIn) return;

        const displayName = profile?.nickname || profile?.qq || '游客';
        const label = profile
            ? `${displayName} | 积分: ${profile.points ?? 0}`
            : '游客模式';
        const isRealUser = isAuthenticated();
        const badgeTag = isRealUser ? 'a' : 'div';
        const badgeHref = isRealUser ? 'href="/profile/"' : '';
        userBar.innerHTML = `
            <${badgeTag} ${badgeHref} class="user-badge" title="${isRealUser ? '查看个人信息' : '游客模式'}" id="userBadge">
                <span class="dot"></span>
                <span class="user-label"></span>
            </${badgeTag}>
            <button class="btn-logout" id="btnLogout" title="退出登录">退出</button>
        `;
        const labelSpan = userBar.querySelector('.user-label');
        if (labelSpan) labelSpan.textContent = label;

        const btnLogout = $('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', async e => {
                addRipple(e, btnLogout);
                clearToken();
                clearGuest();
                currentUser = null;
                renderUserBar(false);
                renderGuestButtons();
                footerHint.textContent = '点击按钮开始探索吧 ~';
                const list = dialogueData.welcome;
                let idx;
                do { idx = Math.floor(Math.random() * list.length); }
                while (idx === lastWelcomeIdx && list.length > 1);
                lastWelcomeIdx = idx;
                const item = list[idx];
                switchExpression(item.expression);
                await typeWriter(item.text, 55);
            });
        }
        // 点击用户徽章跳转个人信息（仅真实登录用户）
        const userBadge = $('userBadge');
        if (userBadge && isRealUser) {
            userBadge.addEventListener('click', e => {
                e.preventDefault();
                const rect = userBadge.getBoundingClientRect();
                navigateWithTransition('/profile/', rect.left + rect.width / 2, rect.top + rect.height / 2);
            });
        }
    }

    /* ===================== 按钮渲染 ===================== */
    function renderGuestButtons() {
        btnGroup.innerHTML = `
            <button class="btn btn-secondary" id="btnLogin">登 陆</button>
            <button class="btn btn-primary" id="btnGuest">游 客</button>
        `;
        bindGuestEvents();
    }

    function renderNavButtons() {
        const isRealUser = isAuthenticated();
        btnGroup.innerHTML = `
            <a href="/note/" class="btn btn-primary" data-nav="/note/">便签纸</a>
            <a href="/rain/" class="btn btn-primary" data-nav="/rain/">雨境</a>
            <a href="/search/" class="btn btn-secondary" data-nav="/search/">落雪绑定</a>
            ${isRealUser ? `<a href="/profile/" class="btn btn-secondary" data-nav="/profile/">个人信息</a>` : ''}
        `;
        bindNavEvents();
    }

    /* ===================== 事件绑定 ===================== */
    function bindGuestEvents() {
        const btnLogin = $('btnLogin');
        const btnGuest = $('btnGuest');

        btnLogin.addEventListener('click', e => {
            addRipple(e, btnLogin);
            showLoginModal();
        });

        btnGuest.addEventListener('click', async e => {
            addRipple(e, btnGuest);
            setGuest();
            renderUserBar(true);
            renderNavButtons();
            footerHint.textContent = '选择一个地方去逛逛吧 ~';
            const data = dialogueData.loggedIn;
            switchExpression(data.expression);
            await typeWriter(data.text, 50);
        });
    }

    function bindNavEvents() {
        btnGroup.querySelectorAll('a[data-nav]').forEach(a => {
            a.addEventListener('click', e => {
                e.preventDefault();
                addRipple(e, a);
                const url = a.getAttribute('data-nav');
                const rect = a.getBoundingClientRect();
                navigateWithTransition(url, rect.left + rect.width / 2, rect.top + rect.height / 2);
            });
        });
    }

    /* ===================== 登录弹窗 ===================== */
    function showLoginModal() {
        if (loginModal) loginModal.classList.add('active');
        if (loginQQ) loginQQ.value = '';
        if (loginPassword) loginPassword.value = '';
        if (loginError) loginError.textContent = '';
    }
    function hideLoginModal() {
        if (loginModal) loginModal.classList.remove('active');
    }
    async function doLogin() {
        const qq = loginQQ.value.trim();
        const password = loginPassword.value;
        if (!qq || !password) {
            loginError.textContent = '请输入 QQ 号和密码';
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qq, password })
            });
            const data = await res.json();
            if (!res.ok) {
                loginError.textContent = data.message || '登录失败';
                return;
            }
            setToken(data.token);
            hideLoginModal();
            const profile = await fetchUserProfile();
            currentUser = profile;
            renderUserBar(true, profile);
            renderNavButtons();
            footerHint.textContent = '选择一个地方去逛逛吧 ~';
            const dlg = dialogueData.loggedIn;
            switchExpression(dlg.expression);
            await typeWriter(dlg.text, 50);
        } catch (e) {
            loginError.textContent = '网络错误，请检查后端是否启动';
            console.error('[Login]', e);
        }
    }

    /* ===================== 7+8. 立绘互动 ===================== */
    botWrap.addEventListener('click', async () => {
        // 弹跳动画
        botWrap.classList.remove('bouncing');
        void botWrap.offsetWidth; // 强制重绘
        botWrap.classList.add('bouncing');
        setTimeout(() => botWrap.classList.remove('bouncing'), 600);

        // 随机对话（不重复）
        const list = dialogueData.interactions;
        let idx;
        do { idx = Math.floor(Math.random() * list.length); }
        while (idx === lastInteractIdx && list.length > 1);
        lastInteractIdx = idx;

        const item = list[idx];
        switchExpression(item.expression);
        await typeWriter(item.text, 50);
    });

    /* ===================== 3. 背景粒子（增强版） ===================== */
    RAIN_PARTICLES.initParticles('bgParticles', {
        count: 80,
        connectLines: true,
        connectThrottle: 2
    });

    /* ===================== 初始化 ===================== */
    async function init() {
        await loadDialogue();

        // 绑定登录弹窗事件
        if (btnLoginSubmit) btnLoginSubmit.addEventListener('click', doLogin);
        if (btnLoginClose) btnLoginClose.addEventListener('click', hideLoginModal);
        if (loginPassword) {
            loginPassword.addEventListener('keydown', e => {
                if (e.key === 'Enter') doLogin();
            });
        }
        if (loginQQ) {
            loginQQ.addEventListener('keydown', e => {
                if (e.key === 'Enter') loginPassword.focus();
            });
        }

        const token = getToken();
        if (token) {
            const profile = await fetchUserProfile();
            if (profile) {
                currentUser = profile;
                renderUserBar(true, profile);
                renderNavButtons();
                footerHint.textContent = '选择一个地方去逛逛吧 ~';
                const data = dialogueData.loggedIn;
                switchExpression(data.expression);
                await typeWriter(data.text, 50);
            } else {
                clearToken();
                renderGuestButtons();
                const list = dialogueData.welcome;
                let idx;
                do { idx = Math.floor(Math.random() * list.length); }
                while (idx === lastWelcomeIdx);
                lastWelcomeIdx = idx;
                const item = list[idx];
                switchExpression(item.expression);
                await typeWriter(item.text, 55);
            }
        } else if (hasSession()) {
            renderUserBar(true);
            renderNavButtons();
            footerHint.textContent = '选择一个地方去逛逛吧 ~';
            const data = dialogueData.loggedIn;
            switchExpression(data.expression);
            await typeWriter(data.text, 50);
        } else {
            renderGuestButtons();
            const list = dialogueData.welcome;
            let idx;
            do { idx = Math.floor(Math.random() * list.length); }
            while (idx === lastWelcomeIdx);
            lastWelcomeIdx = idx;
            const item = list[idx];
            switchExpression(item.expression);
            await typeWriter(item.text, 55);
        }

        // 触发入场动画
        requestAnimationFrame(() => mainWrap.classList.add('loaded'));
    }

    init();
})();
