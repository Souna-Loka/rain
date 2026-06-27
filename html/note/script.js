document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ---- 缓存 DOM 引用 ----
    const themeToggle = document.getElementById('themeToggle');
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearch');
    const catNav = document.getElementById('categoryNav');
    const catList = document.getElementById('catList');
    const mainContent = document.getElementById('mainContent');
    const backToTop = document.getElementById('backToTop');
    const randomBtn = document.getElementById('randomBtn');

    // 日记弹窗
    const diaryModal = document.getElementById('diaryModal');
    const diaryModalClose = document.getElementById('diaryModalClose');
    const diaryModalMood = document.getElementById('diaryModalMood');
    const diaryModalTitle = document.getElementById('diaryModalTitle');
    const diaryModalDate = document.getElementById('diaryModalDate');
    const diaryModalWeather = document.getElementById('diaryModalWeather');
    const diaryModalText = document.getElementById('diaryModalText');
    const diaryNavPrev = document.getElementById('diaryNavPrev');
    const diaryNavNext = document.getElementById('diaryNavNext');
    const diaryNavIndicator = document.getElementById('diaryNavIndicator');
    const diaryModalAnnotations = document.getElementById('diaryModalAnnotations');

    // 隐藏笔记弹窗
    const hiddenNoteModal = document.getElementById('hiddenNoteModal');
    const hiddenNoteClose = document.getElementById('hiddenNoteClose');
    const hiddenNoteTitle = document.getElementById('hiddenNoteTitle');
    const hiddenNoteDate = document.getElementById('hiddenNoteDate');
    const hiddenNoteWeather = document.getElementById('hiddenNoteWeather');
    const hiddenNoteText = document.getElementById('hiddenNoteText');
    const hiddenNoteAnnotations = document.getElementById('hiddenNoteAnnotations');

    // 资料弹窗
    const materialModal = document.getElementById('materialModal');
    const materialModalClose = document.getElementById('materialModalClose');
    const materialContent = document.getElementById('materialContent');
    const materialInner = document.getElementById('materialInner');

    // ---- API 与登录状态 ----
    const API_BASE = RAIN_CONFIG.API_BASE;
    const TOKEN_KEY = RAIN_CONFIG.TOKEN_KEY;

    function getToken()  { return RAIN_AUTH.getToken(); }
    function isLoggedIn() { return RAIN_AUTH.isAuthenticated(); }
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
    async function recordEasterEgg(type, id) {
        const token = getToken();
        if (!token) return false;
        try {
            const res = await fetch(`${API_BASE}/user/easter-eggs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ type, id })
            });
            if (!res.ok) return false;
            const data = await res.json();
            userEasterEggs = data.easterEggs;
            return true;
        } catch (e) {
            console.error('[RecordEaster]', e);
            return false;
        }
    }

    // ---- 状态 ----
    let diaryData = [];
    let diaryById = new Map();      // 日记索引缓存
    let diaryBtn = null;
    let isDiaryMode = false;
    let diaryRevealed = false;   // 日记栏是否已常驻
    let originalContent = null;
    let currentDiaryIndex = 0;   // 弹窗当前日记索引
    let randomClickCount = 0;    // 日记模式下随机按钮点击计数
    let hiddenNoteRevealed = false; // 隐藏笔记是否已加入常驻列表
    let profileRevealed = false;    // 档案按钮是否已常驻
    let isMaterialMode = false;   // 资料模式状态
    let materialBtn = null;
    let typewriterTimer = null;     // 打字机动画定时器
    let typewriterCursor = null;    // 打字机光标元素
    let currentMaterialId = null;
    let materialData = [];          // 资料数据
    let materialById = new Map();   // 资料索引缓存
    let materialRevealed = false;   // 资料按钮是否已常驻
    let unlockedDiaryIds = new Set();   // 已解锁的日记 ID 集合
    let unlockedMaterialIds = new Set(); // 已解锁的资料 ID 集合

    // 彩蛋状态
    let colorShiftTriggered = false;
    let rainEasterTriggered = false;
    let tentacleSequence = [];
    const tentacleTarget = [0, 1, 2]; // 丝、绪、子

    // 后端彩蛋数据缓存
    let userEasterEggs = null;
    let allDiaryData = []; // 所有日记原始数据

    // 隐藏笔记数据
    const hiddenNote = {
        title: "第？页",
        date: " ？？？",
        weather: "狂风暴雨",
        mood: "mysterious",
        content: "今天的雨下得好大，不小心被淋湿了\n\n如果被瑞知道的话，她一定会怒斥我的吧\n\n我一直都不知道...\n不知道\n...\n\n\n\n原来雨水里有这样的存在",
        style: "hidden",
        annotations: []
    };

    // 彩蛋 ID 常量
    const EASTER_LESER_ID = 'easter-leser';
    const EASTER_TENTACLE_ID = 'easter-tentacle';
    const EASTER_REI_DIARY_ID = 111;

    // ---- 资料类型映射 ----
    const materialTypeIcons = {
        profile: 'fa-id-card',
        notebook: 'fa-pen-to-square',
        newspaper: 'fa-newspaper',
        book: 'fa-book-open',
        artifact: 'fa-box-archive'
    };
    const materialTypeLabels = {
        profile: '档案',
        notebook: '笔记',
        newspaper: '旧报纸',
        book: '书籍残篇',
        artifact: '物件注释'
    };
    const materialTypeColors = {
        profile: '#8B7355',
        notebook: '#C4705A',
        newspaper: '#8B6914',
        book: '#7B6B9E',
        artifact: '#6F7C80'
    };

    // ---- 心情色标映射 ----
    const moodMap = {
        happy:       { cls: 'mood-happy',       label: '开心',   color: '#E8C547' },
        calm:        { cls: 'mood-calm',        label: '平静',   color: '#7BA3C9' },
        melancholy:  { cls: 'mood-melancholy',  label: '忧郁',   color: '#7B6B9E' },
        excited:     { cls: 'mood-excited',     label: '激动',   color: '#C4705A' },
        peaceful:    { cls: 'mood-peaceful',    label: '安心',   color: '#6B8F71' },
        nostalgic:   { cls: 'mood-nostalgic',   label: '怀旧',   color: '#8B6914' },
        bittersweet: { cls: 'mood-bittersweet', label: ' bittersweet', color: '#B8928A' },
        mysterious:  { cls: 'mood-mysterious',  label: '神秘',   color: '#5A7A8A' },
        dreamy:      { cls: 'mood-dreamy',      label: '梦幻',   color: '#B8A8C8' },
        neutral:     { cls: 'mood-neutral',     label: '平淡',   color: '#A8A8A8' }
    };

    // ---- URL 状态持久化 ----
    // 已移除：彩蛋进度不再通过 URL 参数持久化，改为账号后端持久化

    // ---- 解锁单篇资料 ----
    function unlockMaterial(id) {
        if (unlockedMaterialIds.has(id)) return false;
        unlockedMaterialIds.add(id);
        if (isLoggedIn()) {
            recordEasterEgg('material', id);
        }
        // 如果这是第一篇解锁的资料，显示资料按钮
        if (!materialRevealed) {
            revealMaterialBtn();
        }
        // 如果当前在资料视图，刷新显示已解锁的资料
        if (isMaterialMode) {
            renderMaterialView();
        }
        return true;
    }

    // ---- 主题切换 ----
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
    applyTheme(initialTheme);

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem('theme', next);
    });

    // ---- 填充头部/底部 ----
    const home = botData.home || {};
    document.getElementById('site-title').textContent = home.title || 'Bot指令中心';
    document.getElementById('site-desc').textContent = home.description || '';
    const about = botData.about || {};
    document.getElementById('footer-text').textContent = about.content || '';

    // ---- 标题拆分（触角触碰彩蛋） ----
    (function initTitleChars() {
        const titleEl = document.getElementById('site-title');
        if (!titleEl) return;
        const text = titleEl.textContent;
        titleEl.innerHTML = '';
        Array.from(text).forEach((char, idx) => {
            const span = document.createElement('span');
            span.className = 'title-char';
            span.textContent = char;
            span.dataset.idx = idx;
            titleEl.appendChild(span);
        });
        titleEl.addEventListener('click', (e) => {
            const span = e.target.closest('.title-char');
            if (!span) return;
            const idx = parseInt(span.dataset.idx);
            if (idx === tentacleTarget[tentacleSequence.length]) {
                tentacleSequence.push(idx);
                span.classList.add('tentacle-active');
                if (tentacleSequence.length === tentacleTarget.length) {
                    setTimeout(() => {
                        tentacleSequence = [];
                        titleEl.querySelectorAll('.title-char').forEach(s => s.classList.remove('tentacle-active'));
                        triggerTentacleEaster();
                    }, 400);
                }
            } else {
                tentacleSequence = [];
                titleEl.querySelectorAll('.title-char').forEach(s => s.classList.remove('tentacle-active'));
            }
        });
    })();

    // ---- 数据分组 ----
    const commands = botData.commands || [];
    const groups = {};
    commands.forEach((cmd, idx) => {
        cmd._index = idx;
        if (!groups[cmd.category]) groups[cmd.category] = [];
        groups[cmd.category].push(cmd);
    });
    const catNames = { maimai: '舞萌相关', fun: '娱乐相关', fishing: '捕鱼功能' };
    const catIcons = { maimai: 'fa-music', fun: 'fa-face-laugh-squint', fishing: 'fa-fish' };
    const allCategories = Object.keys(groups);

    // ---- 打字机效果 ----
    function startTypewriter(element, text, duration, onComplete) {
        if (typewriterTimer) {
            clearInterval(typewriterTimer);
            typewriterTimer = null;
        }
        if (typewriterCursor && typewriterCursor.parentNode) {
            typewriterCursor.remove();
            typewriterCursor = null;
        }

        element.textContent = '';
        const chars = Array.from(text);
        if (chars.length === 0) {
            if (typeof onComplete === 'function') onComplete();
            return;
        }

        const interval = Math.max(12, duration / chars.length);

        const cursor = document.createElement('span');
        cursor.className = 'typewriter-cursor';
        element.appendChild(cursor);
        typewriterCursor = cursor;

        let i = 0;
        typewriterTimer = setInterval(() => {
            if (i >= chars.length) {
                clearInterval(typewriterTimer);
                typewriterTimer = null;
                if (cursor.parentNode) cursor.remove();
                typewriterCursor = null;
                if (typeof onComplete === 'function') onComplete();
                return;
            }
            if (chars[i] === '\n') {
                cursor.before(document.createElement('br'));
            } else {
                cursor.before(chars[i]);
            }
            i++;
        }, interval);
    }

    // ---- 渲染批注 ----
    function renderAnnotations(annotations, container) {
        if (!container) return;
        container.innerHTML = '';

        if (!annotations || annotations.length === 0) {
            container.style.display = 'none';
            return;
        }
        container.style.display = '';

        annotations.forEach((anno, idx) => {
            const div = document.createElement('div');
            div.className = 'annotation ' + (anno.style || 'ink-blue');
            div.style.animationDelay = (idx * 0.15) + 's';
            div.innerHTML = `
                <div class="annotation-author">—— ${escapeHtml(anno.author || '匿名')}</div>
                <div class="annotation-text">${escapeHtml(anno.text)}</div>
            `;
            container.appendChild(div);
        });
    }

    // ---- 加载日记数据 ----
    async function loadDiaryData() {
        try {
            const response = await fetch('note.json');
            if (!response.ok) return;
            allDiaryData = await response.json();
            const hidden = allDiaryData.find(d => d.id === 0);
            if (hidden) {
                Object.assign(hiddenNote, hidden);
            }
            // 初始不加载任何日记，全部由发现解锁
            diaryData = [];
            diaryById = new Map();
        } catch (e) {
            console.log('日记数据加载失败:', e);
        }
    }

    // ---- 加载资料数据 ----
    async function loadMaterialData() {
        try {
            const response = await fetch('text.json');
            if (!response.ok) return;
            materialData = await response.json();
            materialById = new Map(materialData.map(m => [m.id, m]));
        } catch (e) {
            console.log('资料数据加载失败:', e);
        }
    }

    // ---- 从后端恢复彩蛋状态 ----
    function restoreFromEasterEggs(eggs) {
        if (!eggs) return;

        // 恢复日记按钮：触发过"日记本"彩蛋，或已解锁任何日记条目
        const hasDiaryEgg = eggs.discovered && eggs.discovered.includes('diary');
        const hasAnyDiary = eggs.unlockedDiaries && eggs.unlockedDiaries.length > 0;
        if (hasDiaryEgg || hasAnyDiary) {
            diaryRevealed = true;
            const btn = createDiaryBtn();
            if (!catList.contains(btn)) {
                catList.appendChild(btn);
            }
            btn.classList.add('show');
        }

        // 恢复资料按钮
        if (eggs.unlockedMaterials && eggs.unlockedMaterials.length > 0) {
            materialRevealed = true;
            eggs.unlockedMaterials.forEach(id => unlockedMaterialIds.add(id));
            const btn = createMaterialBtn();
            if (!catList.contains(btn)) {
                catList.appendChild(btn);
            }
            btn.classList.add('show');
        }

        // 恢复日记条目
        if (eggs.unlockedDiaries) {
            eggs.unlockedDiaries.forEach(id => {
                if (id === 111) {
                    const item = allDiaryData.find(d => d.id === 111);
                    if (item && !diaryData.find(d => d.id === 111)) {
                        diaryData.push(item);
                        diaryData.sort((a, b) => a.id - b.id);
                    }
                }
                if (id === 0 && !hiddenNoteRevealed) {
                    hiddenNoteRevealed = true;
                    diaryData.unshift({...hiddenNote});
                }
            });
        }

        // 恢复彩蛋触发状态
        if (eggs.discovered) {
            if (eggs.discovered.includes('color_shift')) colorShiftTriggered = true;
            if (eggs.discovered.includes('rain')) rainEasterTriggered = true;
        }
    }

    // ---- 创建日记导航按钮 ----
    function createDiaryBtn() {
        if (diaryBtn) return diaryBtn;
        const btn = document.createElement('button');
        btn.className = 'cat-btn diary-btn';
        btn.innerHTML = '<i class="fa-solid fa-book-open"></i> 日记';
        btn.dataset.cat = 'diary';
        btn.title = '丝绪子的日记';
        diaryBtn = btn;
        return btn;
    }

    // ---- 创建资料导航按钮 ----
    function createMaterialBtn() {
        if (materialBtn) return materialBtn;
        const btn = document.createElement('button');
        btn.className = 'cat-btn material-btn';
        btn.innerHTML = '<i class="fa-solid fa-book"></i> 资料';
        btn.dataset.cat = 'material';
        btn.title = '资料库';
        materialBtn = btn;
        return btn;
    }

    // ---- 显示日记按钮（常驻） ----
    // 仅负责 UI 显示，不记录任何彩蛋发现；彩蛋记录由调用方控制
    function revealDiaryBtn() {
        if (diaryRevealed) return;
        diaryRevealed = true;
        const btn = createDiaryBtn();
        if (!catList.contains(btn)) {
            catList.appendChild(btn);
        }
        requestAnimationFrame(() => {
            btn.classList.add('show');
        });
    }

    // ---- 解锁单篇日记 ----
    function unlockDiary(id) {
        if (unlockedDiaryIds.has(id)) return false;
        unlockedDiaryIds.add(id);

        let item = null;
        if (id === 0) {
            if (!hiddenNoteRevealed) {
                hiddenNoteRevealed = true;
                item = {...hiddenNote};
            }
        } else {
            item = allDiaryData.find(d => d.id === id);
        }

        if (item && !diaryData.find(d => d.id === id)) {
            diaryData.push(item);
            diaryData.sort((a, b) => a.id - b.id);
            diaryById.set(id, item);
        }

        if (!diaryRevealed) {
            revealDiaryBtn();
        }
        if (isLoggedIn()) {
            recordEasterEgg('diary', id);
        }
        if (isDiaryMode) {
            renderDiaryView();
        }
        return true;
    }

    // ---- 记录日记本彩蛋发现（仅在搜索"日记本"时调用） ----
    function recordDiaryEasterEgg() {
        unlockDiary(1);
        unlockDiary(2);
        unlockDiary(3);
        if (isLoggedIn()) {
            recordEasterEgg('egg', 'diary');
        }
    }

    // ---- 显示资料按钮（常驻） ----
    function revealMaterialBtn() {
        if (materialRevealed) return;
        materialRevealed = true;
        const btn = createMaterialBtn();
        if (!catList.contains(btn)) {
            catList.appendChild(btn);
        }
        requestAnimationFrame(() => {
            btn.classList.add('show');
        });
    }

    // ---- 渲染分类导航 ----
    const fragmentNav = document.createDocumentFragment();
    const allBtn = createCatBtn('all', '全部', true);
    fragmentNav.appendChild(allBtn);
    allCategories.forEach(cat => {
        fragmentNav.appendChild(createCatBtn(cat, catNames[cat] || cat, false));
    });
    if (catList) {
        catList.appendChild(fragmentNav);
    } else {
        catNav.appendChild(fragmentNav);
    }

    // ---- 渲染主内容（指令） ----
    const fragmentMain = document.createDocumentFragment();
    allCategories.forEach(cat => {
        const section = document.createElement('section');
        section.className = 'cmd-section';
        section.dataset.category = cat;
        section.id = 'cat-' + cat;

        const title = document.createElement('h2');
        title.className = 'section-title';
        const icon = catIcons[cat] || 'fa-circle';
        title.innerHTML = `<i class="fa-solid ${icon}"></i> ${catNames[cat] || cat}`;
        section.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'card-grid';
        grid.id = 'grid-' + cat;

        const cards = [];
        groups[cat].forEach(cmd => {
            const card = createCard(cmd);
            grid.appendChild(card);
            cards.push(card);
        });
        section.dataset.cardCount = cards.length;
        section._cards = cards;
        section.appendChild(grid);
        fragmentMain.appendChild(section);
    });
    mainContent.appendChild(fragmentMain);
    originalContent = Array.from(mainContent.children);

    // ---- 渲染日记视图 ----
    function renderDiaryView() {
        mainContent.innerHTML = '';

        const section = document.createElement('section');
        section.className = 'cmd-section diary-section';
        section.dataset.category = 'diary';
        section.id = 'cat-diary';

        const title = document.createElement('h2');
        title.className = 'section-title';
        title.innerHTML = '<i class="fa-solid fa-book-open"></i> 丝绪子的日记';
        section.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'card-grid';
        grid.id = 'grid-diary';

        if (diaryData.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'no-results';
            empty.textContent = '暂无日记内容';
            grid.appendChild(empty);
        } else {
            diaryData.forEach(note => {
                const card = createDiaryCard(note);
                grid.appendChild(card);
            });
        }

        section.appendChild(grid);
        mainContent.appendChild(section);
    }

    // ---- 渲染资料视图 ----
    function renderMaterialView() {
        mainContent.innerHTML = '';

        const section = document.createElement('section');
        section.className = 'cmd-section material-section';
        section.dataset.category = 'material';
        section.id = 'cat-material';

        const title = document.createElement('h2');
        title.className = 'section-title';
        title.innerHTML = '<i class="fa-solid fa-book"></i> 资料库';
        section.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'card-grid';
        grid.id = 'grid-material';

        const visibleData = materialData.filter(item => unlockedMaterialIds.has(item.id));
        if (visibleData.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'no-results';
            empty.textContent = '暂无资料';
            grid.appendChild(empty);
        } else {
            visibleData.forEach(item => {
                const card = createMaterialCard(item);
                grid.appendChild(card);
            });
        }

        section.appendChild(grid);
        mainContent.appendChild(section);
    }

    // ---- 恢复指令视图 ----
    function restoreCommandView() {
        mainContent.innerHTML = '';
        originalContent.forEach(el => {
            mainContent.appendChild(el);
        });
    }

    // ---- 创建日记卡片 ----
    function createDiaryCard(note) {
        const div = document.createElement('div');
        div.className = 'diary-card style-' + (note.style || 'paper-yellow');
        div.dataset.id = note.id;

        const mood = moodMap[note.mood] || moodMap.neutral;
        const previewText = getPreviewText(note.content, 80);

        div.innerHTML = `
            <div class="diary-card-header">
                <div class="diary-card-mood">
                    <span class="mood-dot ${mood.cls}" title="心情：${mood.label}"></span>
                </div>
                <div class="diary-card-title">${escapeHtml(note.title)}</div>
            </div>
            <div class="diary-card-meta">
                <span><i class="fa-regular fa-calendar"></i> ${escapeHtml(note.date)}</span>
                <span><i class="fa-solid fa-cloud-sun"></i> ${escapeHtml(note.weather)}</span>
            </div>
            <div class="diary-card-preview">${escapeHtml(previewText)}<span class="ellipsis">...</span></div>
        `;

        div.addEventListener('click', () => {
            const idx = diaryData.findIndex(d => d.id === note.id);
            openDiaryModal(idx);
        });
        return div;
    }

    // ---- 创建资料卡片 ----
    function createMaterialCard(item) {
        const div = document.createElement('div');
        div.className = 'material-card style-' + (item.style || item.type || 'profile');
        div.dataset.id = item.id;

        const icon = materialTypeIcons[item.type] || 'fa-file';
        const label = materialTypeLabels[item.type] || '资料';
        const color = materialTypeColors[item.type] || '#6F7C80';
        const preview = item.preview || getPreviewText(
            item.content || (item.sections ? item.sections.map(s => s.text).join(' ') : ''),
            80
        );

        div.innerHTML = `
            <div class="material-card-header">
                <div class="material-card-type" style="color:${color}">
                    <i class="fa-solid ${icon}"></i>
                    <span>${escapeHtml(label)}</span>
                </div>
                <div class="material-card-title">${escapeHtml(item.title)}</div>
            </div>
            <div class="material-card-preview">${escapeHtml(preview)}<span class="ellipsis">...</span></div>
        `;

        div.addEventListener('click', () => {
            openMaterialModal(item.id);
        });
        return div;
    }

    // ---- 获取预览文本 ----
    function getPreviewText(text, maxLen) {
        if (!text) return '';
        const cleaned = text.replace(/\n/g, ' ').trim();
        if (cleaned.length <= maxLen) return cleaned;
        return cleaned.substring(0, maxLen);
    }

    // ---- 打开日记弹窗 ----
    function openDiaryModal(index) {
        currentDiaryIndex = index;
        updateDiaryModalContent();
        diaryModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // ---- 更新弹窗内容 ----
    function updateDiaryModalContent() {
        const note = diaryData[currentDiaryIndex];
        if (!note) return;

        const mood = moodMap[note.mood] || moodMap.neutral;
        const style = note.style || 'paper-yellow';

        diaryModalMood.innerHTML = `<span class="mood-dot ${mood.cls}" title="心情：${mood.label}"></span>`;
        diaryModalTitle.textContent = note.title;
        diaryModalDate.querySelector('span').textContent = note.date;
        diaryModalWeather.querySelector('span').textContent = note.weather;

        const contentEl = diaryModal.querySelector('.diary-modal-content');
        contentEl.className = 'diary-modal-content style-' + style;

        if (diaryModalAnnotations) {
            diaryModalAnnotations.style.opacity = '0';
            diaryModalAnnotations.style.display = 'none';
        }
        startTypewriter(diaryModalText, note.content, 1000, () => {
            if (diaryModalAnnotations) {
                diaryModalAnnotations.style.display = '';
                requestAnimationFrame(() => {
                    diaryModalAnnotations.style.opacity = '1';
                });
            }
            renderAnnotations(note.annotations || [], diaryModalAnnotations);
        });

        diaryNavPrev.classList.toggle('disabled', currentDiaryIndex <= 0);
        diaryNavNext.classList.toggle('disabled', currentDiaryIndex >= diaryData.length - 1);

        renderNavIndicator();
    }

    // ---- 渲染底部圆点指示器 ----
    function renderNavIndicator() {
        diaryNavIndicator.innerHTML = '';
        diaryData.forEach((_, idx) => {
            const dot = document.createElement('div');
            dot.className = 'diary-nav-dot' + (idx === currentDiaryIndex ? ' active' : '');
            diaryNavIndicator.appendChild(dot);
        });
    }

    // ---- 上一篇 ----
    diaryNavPrev.addEventListener('click', () => {
        if (currentDiaryIndex > 0) {
            diaryModalText.style.opacity = '0';
            diaryModalTitle.style.opacity = '0';
            if (diaryModalAnnotations) diaryModalAnnotations.style.opacity = '0';
            setTimeout(() => {
                currentDiaryIndex--;
                updateDiaryModalContent();
                diaryModalText.style.opacity = '1';
                diaryModalTitle.style.opacity = '1';
                if (diaryModalAnnotations) diaryModalAnnotations.style.opacity = '1';
            }, 180);
        }
    });

    // ---- 下一篇 ----
    diaryNavNext.addEventListener('click', () => {
        if (currentDiaryIndex < diaryData.length - 1) {
            diaryModalText.style.opacity = '0';
            diaryModalTitle.style.opacity = '0';
            if (diaryModalAnnotations) diaryModalAnnotations.style.opacity = '0';
            setTimeout(() => {
                currentDiaryIndex++;
                updateDiaryModalContent();
                diaryModalText.style.opacity = '1';
                diaryModalTitle.style.opacity = '1';
                if (diaryModalAnnotations) diaryModalAnnotations.style.opacity = '1';
            }, 180);
        }
    });

    // 键盘左右键翻页
    document.addEventListener('keydown', (e) => {
        if (!diaryModal.classList.contains('active')) return;
        if (e.key === 'ArrowLeft') {
            diaryNavPrev.click();
        } else if (e.key === 'ArrowRight') {
            diaryNavNext.click();
        }
    });

    // ---- 通用弹窗关闭 ----
    function closeModal(modalEl) {
        modalEl.classList.remove('active');
        document.body.style.overflow = '';
        if (typewriterTimer) {
            clearInterval(typewriterTimer);
            typewriterTimer = null;
        }
        if (typewriterCursor && typewriterCursor.parentNode) {
            typewriterCursor.remove();
            typewriterCursor = null;
        }
    }

    // ---- 关闭日记弹窗 ----
    function closeDiaryModal() {
        closeModal(diaryModal);
    }

    diaryModalClose.addEventListener('click', closeDiaryModal);
    diaryModal.querySelector('.diary-modal-backdrop').addEventListener('click', closeDiaryModal);

    // ---- 打开隐藏笔记弹窗 ----
    function openHiddenNoteModal() {
        const mood = moodMap[hiddenNote.mood] || moodMap.mysterious;
        const style = hiddenNote.style || 'hidden';

        hiddenNoteTitle.textContent = hiddenNote.title;
        hiddenNoteDate.querySelector('span').textContent = hiddenNote.date;
        hiddenNoteWeather.querySelector('span').textContent = hiddenNote.weather;

        const contentEl = hiddenNoteModal.querySelector('.diary-modal-content');
        contentEl.className = 'diary-modal-content style-' + style;

        if (hiddenNoteAnnotations) {
            hiddenNoteAnnotations.style.opacity = '0';
            hiddenNoteAnnotations.style.display = 'none';
        }

        startTypewriter(hiddenNoteText, hiddenNote.content, 1000, () => {
            if (hiddenNoteAnnotations) {
                hiddenNoteAnnotations.style.display = '';
                requestAnimationFrame(() => {
                    hiddenNoteAnnotations.style.opacity = '1';
                });
            }
            renderAnnotations(hiddenNote.annotations || [], hiddenNoteAnnotations);
        });

        hiddenNoteModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeHiddenNote() {
        closeModal(hiddenNoteModal);
    }

    hiddenNoteClose.addEventListener('click', closeHiddenNote);
    hiddenNoteModal.querySelector('.diary-modal-backdrop').addEventListener('click', closeHiddenNote);

    // ---- 统一 Escape 键盘事件 ----
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (diaryModal.classList.contains('active')) closeDiaryModal();
        else if (hiddenNoteModal.classList.contains('active')) closeHiddenNote();
        else if (materialModal.classList.contains('active')) closeMaterialModal();
    });

    // ---- 将隐藏笔记加入常驻列表 ----
    function revealHiddenNote() {
        if (hiddenNoteRevealed) return;
        hiddenNoteRevealed = true;
        if (isLoggedIn()) {
            recordEasterEgg('egg', 'random_note');
            recordEasterEgg('diary', 0);
        }
        diaryData.unshift({...hiddenNote});
        if (isDiaryMode) {
            renderDiaryView();
        }
    }

    // ---- 资料弹窗渲染 ----
    function openMaterialModal(id) {
        const item = materialData.find(d => d.id === id);
        if (!item) return;
        currentMaterialId = id;
        renderMaterialContent(item);
        materialModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function renderMaterialContent(item) {
        const style = item.style || item.type || 'profile';
        materialContent.className = 'diary-modal-content style-' + style;

        let html = '';

        if (item.type === 'profile') {
            const tags = (item.tags || []).map(t => `<span class="profile-tag">${escapeHtml(t)}</span>`).join('');
            let sectionsHtml = '';
            if (item.sections && item.sections.length > 0) {
                sectionsHtml = item.sections.map((s, idx, arr) => `
                    <div class="profile-section">
                        <span class="profile-label">${escapeHtml(s.label)}</span>
                        <p class="profile-text">${escapeHtml(s.text)}</p>
                    </div>
                    ${idx !== arr.length - 1 ? '<div class="profile-divider"></div>' : ''}
                `).join('');
            } else if (item.content) {
                sectionsHtml = `<div class="profile-section"><p class="profile-text">${escapeHtml(item.content).replace(/\n/g, '<br>')}</p></div>`;
            }

            html = `
                <div class="profile-envelope">
                    <div class="profile-seal"><i class="fa-solid fa-stamp"></i></div>
                    <div class="profile-tape"></div>
                    <div class="profile-header">
                        <div class="profile-photo-placeholder">
                            <i class="fa-solid fa-image"></i>
                            <span>照片</span>
                        </div>
                        <div class="profile-info">
                            <h3 class="profile-name">${escapeHtml(item.title)}</h3>
                            ${item.subtitle ? `<div class="profile-subtitle">${escapeHtml(item.subtitle)}</div>` : ''}
                            <div class="profile-meta">${tags}</div>
                        </div>
                    </div>
                    <div class="profile-body">${sectionsHtml}</div>
                </div>
            `;
        } else if (item.type === 'notebook') {
            const mood = moodMap[item.mood] || moodMap.neutral;
            html = `
                <div class="material-notebook-header">
                    <div class="material-notebook-mood">
                        <span class="mood-dot ${mood.cls}" title="心情：${mood.label}"></span>
                    </div>
                    <h3 class="material-notebook-title">${escapeHtml(item.title)}</h3>
                    <div class="material-notebook-meta">
                        ${item.date ? `<span><i class="fa-regular fa-calendar"></i> ${escapeHtml(item.date)}</span>` : ''}
                        ${item.weather ? `<span><i class="fa-solid fa-cloud-sun"></i> ${escapeHtml(item.weather)}</span>` : ''}
                    </div>
                </div>
                <div class="material-notebook-body">
                    <div class="material-notebook-text" id="materialNotebookText"></div>
                    <div class="diary-modal-annotations" id="materialNotebookAnnotations"></div>
                </div>
                <div class="diary-modal-tape notebook-tape"></div>
            `;
            materialInner.innerHTML = html;

            const textEl = document.getElementById('materialNotebookText');
            const annoEl = document.getElementById('materialNotebookAnnotations');
            if (annoEl) {
                annoEl.style.opacity = '0';
                annoEl.style.display = 'none';
            }
            startTypewriter(textEl, item.content || '', 1000, () => {
                if (annoEl) {
                    annoEl.style.display = '';
                    requestAnimationFrame(() => { annoEl.style.opacity = '1'; });
                }
                renderAnnotations(item.annotations || [], annoEl);
            });
            return;
        } else if (item.type === 'newspaper') {
            html = `
                <div class="material-newspaper-header">
                    <div class="material-newspaper-label">旧报纸残片</div>
                    <h3 class="material-newspaper-title">${escapeHtml(item.title)}</h3>
                    <div class="material-newspaper-meta">
                        ${item.date ? `<span>${escapeHtml(item.date)}</span>` : ''}
                        ${item.source ? `<span>来源：${escapeHtml(item.source)}</span>` : ''}
                    </div>
                </div>
                <div class="material-newspaper-body">
                    <div class="material-newspaper-text">${escapeHtml(item.content || '').replace(/\n/g, '<br>')}</div>
                </div>
            `;
        } else if (item.type === 'book') {
            html = `
                <div class="material-book-header">
                    ${item.chapter ? `<div class="material-book-chapter">${escapeHtml(item.chapter)}</div>` : ''}
                    <h3 class="material-book-title">${escapeHtml(item.title)}</h3>
                    <div class="material-book-meta">
                        ${item.author ? `<span>作者：${escapeHtml(item.author)}</span>` : ''}
                        ${item.era ? `<span>年代：${escapeHtml(item.era)}</span>` : ''}
                    </div>
                </div>
                <div class="material-book-body">
                    <div class="material-book-text">${escapeHtml(item.content || '').replace(/\n/g, '<br>')}</div>
                </div>
            `;
        } else if (item.type === 'artifact') {
            html = `
                <div class="material-artifact-header">
                    <div class="material-artifact-label">物件注释 #${escapeHtml(item.id_no || item.id)}</div>
                    <h3 class="material-artifact-title">${escapeHtml(item.title)}</h3>
                    <div class="material-artifact-meta">
                        ${item.found_date ? `<span>发现日期：${escapeHtml(item.found_date)}</span>` : ''}
                        ${item.condition ? `<span>状态：${escapeHtml(item.condition)}</span>` : ''}
                    </div>
                </div>
                <div class="material-artifact-body">
                    <div class="material-artifact-text">${escapeHtml(item.content || '').replace(/\n/g, '<br>')}</div>
                </div>
            `;
        } else {
            html = `
                <div class="material-default-header">
                    <h3 class="material-default-title">${escapeHtml(item.title)}</h3>
                </div>
                <div class="material-default-body">
                    <div class="material-default-text">${escapeHtml(item.content || '').replace(/\n/g, '<br>')}</div>
                </div>
            `;
        }

        materialInner.innerHTML = html;
    }

    function closeMaterialModal() {
        closeModal(materialModal);
    }

    materialModalClose.addEventListener('click', closeMaterialModal);
    materialModal.querySelector('.diary-modal-backdrop').addEventListener('click', closeMaterialModal);

    // ---- 切换到资料视图 ----
    function switchToMaterial() {
        if (isMaterialMode) return;
        isMaterialMode = true;
        isDiaryMode = false;
        updateSearchPlaceholder();
        renderMaterialView();

        const term = searchInput.value.trim().toLowerCase();
        if (term) {
            performMaterialSearch(term);
        }
    }

    // ---- 搜索逻辑 ----
    let searchTimeout = null;
    const DEBOUNCE_DELAY = 150;

    function performSearch(term) {
        const lower = term.toLowerCase().trim();
        const activeCat = document.querySelector('.cat-btn.active')?.dataset.cat || 'all';

        // 资料解锁检测：搜索词是否匹配某篇资料的 unlockKeywords
        const matchedMaterial = materialData.find(item => {
            const keywords = item.unlockKeywords || [];
            return keywords.some(k => lower.includes(k.toLowerCase()));
        });
        if (matchedMaterial) {
            unlockMaterial(matchedMaterial.id);
            if (materialBtn) {
                document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                materialBtn.classList.add('active');
                switchToMaterial();
            }
            setTimeout(() => openMaterialModal(matchedMaterial.id), 300);
            const noResults = document.getElementById('noResults');
            if (noResults) noResults.style.display = 'none';
            searchInput.value = '';
            clearBtn.style.display = 'none';
            return;
        }

        // 日记本关键词检测 - 触发常驻
        if (lower === '日记本') {
            revealDiaryBtn();
            recordDiaryEasterEgg();
            if (diaryBtn) {
                document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                diaryBtn.classList.add('active');
                switchToDiary();
            }
            const noResults = document.getElementById('noResults');
            if (noResults) noResults.style.display = 'none';
            searchInput.value = '';
            clearBtn.style.display = 'none';
            return;
        }

        // 变色彩蛋：搜索 "变色" 或 "分歧"
        if (lower === '变色' || lower === '分歧') {
            triggerColorShiftEaster();
            searchInput.value = '';
            clearBtn.style.display = 'none';
            return;
        }

        // 雨季彩蛋：搜索 "雨" 或 "雨水"
        if (lower === '雨' || lower === '雨水') {
            triggerRainEaster();
            searchInput.value = '';
            clearBtn.style.display = 'none';
            return;
        }

        // 如果在资料模式下，保持在资料视图内搜索已解锁资料
        if (isMaterialMode) {
            performMaterialSearch(lower);
            return;
        }

        // 如果在日记模式下且不是搜索日记本
        if (isDiaryMode && activeCat !== 'diary') {
            restoreCommandView();
            isDiaryMode = false;
            updateSearchPlaceholder();
            if (lower) {
                performCommandSearch(lower, activeCat);
            }
            return;
        }

        // 资料模式内的搜索
        if (isMaterialMode && activeCat === 'material') {
            performMaterialSearch(lower);
            return;
        }

        // 日记模式内的搜索
        if (isDiaryMode && activeCat === 'diary') {
            performDiarySearch(lower);
            return;
        }

        // 指令搜索
        performCommandSearch(lower, activeCat);
    }

    // ---- 指令搜索 ----
    function performCommandSearch(lower, activeCat) {
        let hasAny = false;
        let noResults = document.getElementById('noResults');

        const sections = mainContent.querySelectorAll('.cmd-section');
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const cat = section.dataset.category;
            if (activeCat !== 'all' && activeCat !== cat) {
                section.style.display = 'none';
                continue;
            }

            let sectionHas = false;
            const cards = section._cards || [];
            for (let j = 0; j < cards.length; j++) {
                const card = cards[j];
                const searchText = card.dataset.search || '';
                const name = card.dataset.name || '';
                const desc = card.dataset.desc || '';
                const match = !lower || searchText.includes(lower) ||
                              name.toLowerCase().includes(lower) ||
                              desc.toLowerCase().includes(lower);

                if (match) {
                    card.style.display = '';
                    sectionHas = true;
                    card.querySelector('.cmd-name').innerHTML = lower ? highlightText(name, lower) : escapeHtml(name);
                    card.querySelector('.cmd-desc').innerHTML = lower ? highlightText(desc, lower) : escapeHtml(desc);
                } else {
                    card.style.display = 'none';
                }
            }

            section.style.display = sectionHas ? '' : 'none';
            if (sectionHas) hasAny = true;
        }

        if (!hasAny && lower) {
            if (!noResults) {
                noResults = document.createElement('div');
                noResults.id = 'noResults';
                noResults.className = 'no-results';
                noResults.textContent = '未找到匹配的指令';
                mainContent.appendChild(noResults);
            }
            noResults.style.display = '';
        } else if (noResults) {
            noResults.style.display = 'none';
        }
    }

    // ---- 日记搜索 ----
    function performDiarySearch(lower) {
        const cards = mainContent.querySelectorAll('.diary-card');
        let hasAny = false;
        const noResults = document.getElementById('noResults');

        cards.forEach(card => {
            const title = card.querySelector('.diary-card-title').textContent.toLowerCase();
            const preview = card.querySelector('.diary-card-preview').textContent.toLowerCase();
            const meta = card.querySelector('.diary-card-meta').textContent.toLowerCase();
            const diaryId = parseInt(card.dataset.id);
            const diary = diaryById.get(diaryId);
            const content = diary ? diary.content.toLowerCase() : '';
            const moodLabel = diary && diary.mood ? (moodMap[diary.mood]?.label || '').toLowerCase() : '';

            const match = !lower ||
                          title.includes(lower) ||
                          preview.includes(lower) ||
                          meta.includes(lower) ||
                          content.includes(lower) ||
                          moodLabel.includes(lower);

            card.style.display = match ? '' : 'none';
            if (match) hasAny = true;
        });

        if (!hasAny && lower) {
            if (!noResults) {
                const el = document.createElement('div');
                el.id = 'noResults';
                el.className = 'no-results';
                el.textContent = '未找到匹配的日记';
                mainContent.appendChild(el);
            } else {
                noResults.style.display = '';
            }
        } else if (noResults) {
            noResults.style.display = 'none';
        }
    }

    // ---- 资料搜索 ----
    function performMaterialSearch(lower) {
        let cards = mainContent.querySelectorAll('.material-card');
        // 兜底：如果没有卡片但已解锁资料存在，重新渲染
        if (cards.length === 0 && unlockedMaterialIds.size > 0) {
            renderMaterialView();
            cards = mainContent.querySelectorAll('.material-card');
        }
        let hasAny = false;
        const noResults = document.getElementById('noResults');

        cards.forEach(card => {
            const title = card.querySelector('.material-card-title').textContent.toLowerCase();
            const preview = card.querySelector('.material-card-preview').textContent.toLowerCase();
            const item = materialById.get(card.dataset.id);
            const content = item ? (item.content || '').toLowerCase() : '';
            const category = item && item.category ? item.category.toLowerCase() : '';
            const typeLabel = item && item.type ? (materialTypeLabels[item.type] || '').toLowerCase() : '';

            const match = !lower ||
                          title.includes(lower) ||
                          preview.includes(lower) ||
                          content.includes(lower) ||
                          category.includes(lower) ||
                          typeLabel.includes(lower);

            card.style.display = match ? '' : 'none';
            if (match) hasAny = true;
        });

        if (!hasAny && lower) {
            if (!noResults) {
                const el = document.createElement('div');
                el.id = 'noResults';
                el.className = 'no-results';
                el.textContent = '未找到匹配的资料';
                mainContent.appendChild(el);
            } else {
                noResults.style.display = '';
            }
        } else if (noResults) {
            noResults.style.display = 'none';
        }
    }

    // ---- 更新搜索框占位文字 ----
    function updateSearchPlaceholder() {
        if (isDiaryMode) {
            searchInput.placeholder = '搜索日记标题、内容、日期、天气或心情...';
        } else if (isMaterialMode) {
            searchInput.placeholder = '搜索资料标题、内容或类型...';
        } else {
            searchInput.placeholder = '搜索指令名称或描述...';
        }
    }

    // ---- 切换到日记视图 ----
    function switchToDiary() {
        if (isDiaryMode) return;
        isDiaryMode = true;
        isMaterialMode = false;
        updateSearchPlaceholder();
        renderDiaryView();

        const term = searchInput.value.trim();
        if (term && term !== '日记本') {
            performDiarySearch(term.toLowerCase());
        }
    }

    // ---- 防抖包装 ----
    function debouncedSearch(term) {
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => performSearch(term), DEBOUNCE_DELAY);
    }

    // ---- 搜索事件 ----
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value;
        clearBtn.style.display = term ? 'flex' : 'none';

        if (!term.trim()) {
            if (isDiaryMode) {
                performDiarySearch('');
            } else if (isMaterialMode) {
                performMaterialSearch('');
            } else {
                performCommandSearch('', document.querySelector('.cat-btn.active')?.dataset.cat || 'all');
            }
            return;
        }

        debouncedSearch(term);
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';

        if (isDiaryMode) {
            performDiarySearch('');
        } else if (isMaterialMode) {
            performMaterialSearch('');
        } else {
            performCommandSearch('', document.querySelector('.cat-btn.active')?.dataset.cat || 'all');
        }

        searchInput.focus();
    });

    // ---- 分类导航点击 ----
    catNav.addEventListener('click', (e) => {
        const btn = e.target.closest('.cat-btn');
        if (!btn) return;

        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const cat = btn.dataset.cat;

        // 重置随机计数（切换到非日记视图时）
        if (cat !== 'diary') {
            resetRandomCount();
        }

        if (cat === 'diary') {
            if (isMaterialMode) {
                isMaterialMode = false;
                updateSearchPlaceholder();
            }
            switchToDiary();
            return;
        }

        if (cat === 'material') {
            if (isDiaryMode) {
                isDiaryMode = false;
                updateSearchPlaceholder();
            }
            switchToMaterial();
            return;
        }

        // 从日记/资料模式切回
        if (isDiaryMode) {
            restoreCommandView();
            isDiaryMode = false;
            updateSearchPlaceholder();
        }
        if (isMaterialMode) {
            restoreCommandView();
            isMaterialMode = false;
            updateSearchPlaceholder();
        }

        const term = searchInput.value.trim();
        performCommandSearch(term.toLowerCase(), cat);
    });

    // ---- 返回顶部 ----
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                if (window.scrollY > 400) backToTop.classList.add('show');
                else backToTop.classList.remove('show');
                ticking = false;
            });
            ticking = true;
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ---- 水波纹过渡 ----
    const overlay = document.getElementById('transition-overlay');
    const secretDoor = document.querySelector('.secret-door');
    if (secretDoor && overlay) {
        secretDoor.addEventListener('click', (e) => {
            e.preventDefault();
            const x = e.clientX;
            const y = e.clientY;
            overlay.style.setProperty('--ripple-x', x + 'px');
            overlay.style.setProperty('--ripple-y', y + 'px');
            overlay.classList.add('active');
            setTimeout(() => {
                window.location.href = secretDoor.href;
            }, 600);
        });
    }

    // ---- 随机按钮（彩蛋：日记模式下三次触发隐藏笔记） ----
    if (randomBtn) {
        randomBtn.addEventListener('click', () => {
            if (isDiaryMode) {
                handleDiaryRandom();
            } else if (isMaterialMode) {
                handleMaterialRandom();
            } else {
                handleCommandRandom();
            }
        });
    }

    // 增强滚动到选中项
    function scrollToCard(card) {
        const headerOffset = 180;
        const cardRect = card.getBoundingClientRect();
        const scrollTop = window.scrollY + cardRect.top - headerOffset;
        window.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }

    // 应用高亮效果
    function applyHighlight(card, selector) {
        document.querySelectorAll(selector + '.pulse-highlight').forEach(c => c.classList.remove('pulse-highlight'));
        setTimeout(() => {
            card.classList.add('pulse-highlight');
            setTimeout(() => {
                card.classList.remove('pulse-highlight');
            }, 3200);
        }, 400);
    }

    // 日记模式下的随机（含彩蛋计数）
    function handleDiaryRandom() {
        randomClickCount++;

        if (randomClickCount === 3) {
            setTimeout(() => {
                revealHiddenNote();
                openHiddenNoteModal();
            }, 400);
            return;
        }

        const cards = mainContent.querySelectorAll('.diary-card');
        const visibleCards = Array.from(cards).filter(c => c.style.display !== 'none');
        if (visibleCards.length === 0) return;

        const pick = visibleCards[Math.floor(Math.random() * visibleCards.length)];
        scrollToCard(pick);
        applyHighlight(pick, '.diary-card');
    }

    // 资料模式下的随机
    function handleMaterialRandom() {
        const cards = mainContent.querySelectorAll('.material-card');
        const visibleCards = Array.from(cards).filter(c => c.style.display !== 'none');
        if (visibleCards.length === 0) return;

        const pick = visibleCards[Math.floor(Math.random() * visibleCards.length)];
        scrollToCard(pick);
        applyHighlight(pick, '.material-card');
    }

    // 指令模式下的随机
    function handleCommandRandom() {
        const visibleCards = [];
        const sections = mainContent.querySelectorAll('.cmd-section');
        for (let i = 0; i < sections.length; i++) {
            if (sections[i].style.display === 'none') continue;
            const cards = sections[i]._cards || [];
            for (let j = 0; j < cards.length; j++) {
                if (cards[j].style.display !== 'none') {
                    visibleCards.push(cards[j]);
                }
            }
        }
        if (visibleCards.length === 0) return;

        const pick = visibleCards[Math.floor(Math.random() * visibleCards.length)];
        scrollToCard(pick);
        applyHighlight(pick, '.cmd-card');
    }

    // 切换到非日记视图时重置计数
    function resetRandomCount() {
        randomClickCount = 0;
    }

    // ---- 辅助函数 ----
    function createCatBtn(cat, label, active) {
        const btn = document.createElement('button');
        btn.className = 'cat-btn' + (active ? ' active' : '');
        btn.textContent = label;
        btn.dataset.cat = cat;
        return btn;
    }

    function buildSearchText(cmd) {
        const parts = [cmd.name, cmd.desc, cmd.params || ''];
        if (cmd.examples) parts.push(cmd.examples.join(' '));
        if (cmd.name && cmd.name.includes('/')) {
            parts.push(cmd.name.split('/').join(' '));
        }
        return parts.join(' ').toLowerCase();
    }

    function createCard(cmd) {
        const div = document.createElement('div');
        div.className = 'cmd-card';
        div.dataset.name = cmd.name;
        div.dataset.desc = cmd.desc;
        div.dataset.search = buildSearchText(cmd);
        div.dataset.index = cmd._index;
        div.dataset.category = cmd.category;

        const examples = (cmd.examples || []).map(ex => `<span class="code-tag">${escapeHtml(ex)}</span>`).join('');

        div.innerHTML = `
            <div class="cmd-name">${escapeHtml(cmd.name)}</div>
            <div class="cmd-desc">${escapeHtml(cmd.desc)}</div>
            <div class="cmd-meta">
                <div class="meta-row">
                    <span class="meta-label">参数</span>
                    <span>${escapeHtml(cmd.params || '无')}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">用法示例</span>
                    <div>${examples || '<span class="code-tag">无</span>'}</div>
                </div>
            </div>
        `;
        return div;
    }



    // ---- 彩蛋触发函数 ----

    // 乱码生成
    function scrambleText(text) {
        const chars = '█▓░▒≡▼▲◄►◆◇○●◎□■◐◑★☆♦♠♣♥♪♫∞∴∵∽∾∿⊿';
        return text.split('').map(c => {
            if (c === '\n') return '\n';
            return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
    }

    // 解码动画
    function decodeText(element, originalText, onComplete) {
        const targetChars = Array.from(originalText);
        let currentChars = Array.from(element.textContent);
        let indices = targetChars.map((c, i) => c === '\n' ? -1 : i).filter(i => i !== -1);
        // Fisher-Yates shuffle
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        let step = 0;
        const batch = Math.max(1, Math.floor(indices.length / 40));
        const timer = setInterval(() => {
            if (step >= indices.length) {
                clearInterval(timer);
                element.textContent = originalText;
                if (onComplete) onComplete();
                return;
            }
            for (let k = 0; k < batch && step < indices.length; k++, step++) {
                const idx = indices[step];
                currentChars[idx] = targetChars[idx];
            }
            element.textContent = currentChars.join('');
        }, 35);
    }

    // 变色彩蛋
    function triggerColorShiftEaster() {
        const loggedIn = isLoggedIn();
        const alreadyUnlocked = loggedIn
            ? (userEasterEggs && userEasterEggs.discovered.includes('color_shift'))
            : colorShiftTriggered;

        // 无论是否已解锁，都播放变色动画
        document.querySelectorAll('.cmd-card, .diary-card, .material-card').forEach(card => {
            card.classList.add('easter-color-shift');
            setTimeout(() => card.classList.remove('easter-color-shift'), 4600);
        });

        if (alreadyUnlocked) return;

        colorShiftTriggered = true;

        // 解锁莱瑟档案
        const leserItem = materialData.find(d => d.id === EASTER_LESER_ID);
        if (!leserItem) return;
        unlockMaterial(leserItem.id);
        if (loggedIn) {
            recordEasterEgg('egg', 'color_shift');
            recordEasterEgg('material', EASTER_LESER_ID);
        }
        if (materialBtn) {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            materialBtn.classList.add('active');
            switchToMaterial();
        }
        setTimeout(() => openMaterialModal(leserItem.id), 1200);
    }

    function playRainEffect() {
        const container = document.getElementById('rainContainer');
        if (!container) return;
        // 清除之前的雨滴，避免累积
        container.innerHTML = '';
        const count = 90;
        for (let i = 0; i < count; i++) {
            const drop = document.createElement('div');
            drop.className = 'raindrop';
            drop.style.left = Math.random() * 100 + 'vw';
            drop.style.animationDuration = (0.6 + Math.random() * 0.7) + 's';
            drop.style.animationDelay = (Math.random() * 1.5) + 's';
            drop.style.opacity = 0.3 + Math.random() * 0.4;
            drop.style.height = (12 + Math.random() * 16) + 'px';
            container.appendChild(drop);
        }
        setTimeout(() => {
            container.innerHTML = '';
        }, 30000);
    }

    // 雨季彩蛋
    function triggerRainEaster() {
        const loggedIn = isLoggedIn();
        const alreadyUnlocked = loggedIn
            ? (userEasterEggs && userEasterEggs.discovered.includes('rain'))
            : rainEasterTriggered;

        // 无论是否已解锁，都播放雨滴特效
        playRainEffect();

        if (alreadyUnlocked) return;

        rainEasterTriggered = true;

        // 解锁瑞依日记
        const reiItem = allDiaryData.find(d => d.id === EASTER_REI_DIARY_ID);
        if (!reiItem) return;
        // 将瑞依日记加入 diaryData
        if (!diaryData.find(d => d.id === 111)) {
            diaryData.push(reiItem);
            diaryData.sort((a, b) => a.id - b.id);
        }
        revealDiaryBtn();
        if (loggedIn) {
            recordEasterEgg('egg', 'rain');
            recordEasterEgg('diary', 111);
        }
        if (diaryBtn) {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            diaryBtn.classList.add('active');
            switchToDiary();
        }
        const idx = diaryData.findIndex(d => d.id === EASTER_REI_DIARY_ID);
        if (idx !== -1) {
            setTimeout(() => openDiaryModal(idx), 500);
        }
    }

    // 触角触碰彩蛋
    function triggerTentacleEaster() {
        const loggedIn = isLoggedIn();
        const alreadyUnlocked = loggedIn
            ? (userEasterEggs && userEasterEggs.discovered.includes('tentacle'))
            : false;

        // 从资料数据查找触角信号
        const item = materialData.find(d => d.id === EASTER_TENTACLE_ID);
        if (!item) return;

        // 无论是否已解锁，都显示乱码解码弹窗
        const mood = moodMap[item.mood] || moodMap.mysterious;
        const style = item.style || 'hidden';

        hiddenNoteTitle.textContent = item.title;
        hiddenNoteDate.querySelector('span').textContent = item.date;
        hiddenNoteWeather.querySelector('span').textContent = item.weather;

        const contentEl = hiddenNoteModal.querySelector('.diary-modal-content');
        contentEl.className = 'diary-modal-content style-' + style;

        if (hiddenNoteAnnotations) {
            hiddenNoteAnnotations.style.opacity = '0';
            hiddenNoteAnnotations.style.display = 'none';
        }

        // 先显示乱码
        hiddenNoteText.textContent = scrambleText(item.content);

        hiddenNoteModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // 1.8秒后解码
        setTimeout(() => {
            decodeText(hiddenNoteText, item.content, () => {
                if (hiddenNoteAnnotations) {
                    hiddenNoteAnnotations.style.display = '';
                    requestAnimationFrame(() => {
                        hiddenNoteAnnotations.style.opacity = '1';
                    });
                }
                renderAnnotations(item.annotations || [], hiddenNoteAnnotations);
            });
        }, 1800);

        if (alreadyUnlocked) return;

        // 首次解锁：解锁触角信号资料
        unlockMaterial(item.id);
        if (loggedIn) {
            recordEasterEgg('egg', 'tentacle');
            recordEasterEgg('material', EASTER_TENTACLE_ID);
        }
    }

    // ---- 初始化 ----
    (async () => {
        await Promise.all([loadDiaryData(), loadMaterialData()]);

        // 登录用户：从后端获取彩蛋数据并恢复 UI
        if (isLoggedIn()) {
            userEasterEggs = await fetchEasterEggs();
            if (userEasterEggs) {
                restoreFromEasterEggs(userEasterEggs);
            }
        }

        updateSearchPlaceholder();
        performSearch('');
    })();
});