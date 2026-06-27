(function () {
    'use strict';

    /**
     * 前端全局配置中心
     * API_BASE 使用相对路径 /api，避免部署时域名/端口变化导致混合内容问题
     */
    window.RAIN_CONFIG = {
        API_BASE: '/api',
        TOKEN_KEY: 'rain_token',
        GUEST_KEY: 'rain_home_guest',
    };
})();
