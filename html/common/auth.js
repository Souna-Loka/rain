(function () {
    'use strict';

    const C = window.RAIN_CONFIG || {};
    const TOKEN_KEY = C.TOKEN_KEY || 'rain_token';
    const GUEST_KEY = C.GUEST_KEY || 'rain_home_guest';

    /* ===================== Token 管理 ===================== */
    function getToken() {
        try { return localStorage.getItem(TOKEN_KEY); }
        catch (e) { return null; }
    }
    function setToken(token) {
        try { localStorage.setItem(TOKEN_KEY, token); }
        catch (e) {}
    }
    function clearToken() {
        try { localStorage.removeItem(TOKEN_KEY); }
        catch (e) {}
    }

    /* ===================== 游客模式 ===================== */
    function isGuest() {
        try { return localStorage.getItem(GUEST_KEY) === '1'; }
        catch (e) { return false; }
    }
    function setGuest() {
        try { localStorage.setItem(GUEST_KEY, '1'); }
        catch (e) {}
    }
    function clearGuest() {
        try { localStorage.removeItem(GUEST_KEY); }
        catch (e) {}
    }

    /* ===================== 状态判断 ===================== */
    function isAuthenticated() {
        return !!getToken();
    }
    function hasSession() {
        return !!getToken() || isGuest();
    }

    /* ===================== 辅助工具 ===================== */
    function escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /* ===================== 暴露 API ===================== */
    window.RAIN_AUTH = {
        getToken, setToken, clearToken,
        isGuest, setGuest, clearGuest,
        isAuthenticated, hasSession,
        escapeHtml
    };
})();
