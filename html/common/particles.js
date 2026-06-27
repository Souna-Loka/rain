(function () {
    'use strict';

    /**
     * 粒子系统公共模块
     * @param {string} canvasId - Canvas 元素 ID
     * @param {Object} [opts] - 配置
     * @param {number} [opts.count=60] - 粒子数量
     * @param {boolean} [opts.connectLines=true] - 是否连线
     * @param {number} [opts.connectDistance=120] - 连线最大距离
     * @param {number} [opts.connectThrottle=1] - 连线计算节流（每 N 帧）
     * @param {number} [opts.maxDpr=2] - 最大 devicePixelRatio
     */
    function initParticles(canvasId, opts) {
        opts = opts || {};
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let W, H;
        const COUNT = opts.count || 60;
        const particles = [];
        const connectLines = opts.connectLines !== false;
        const connectDistance = opts.connectDistance || 120;
        const connectThrottle = opts.connectThrottle || 1;
        const maxDpr = opts.maxDpr || 2;

        function resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
            W = canvas.width = window.innerWidth * dpr;
            H = canvas.height = window.innerHeight * dpr;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 重置变换矩阵
        }
        resize();
        window.addEventListener('resize', resize);

        const COLORS = [
            { r: 247, g: 250, b: 240 },
            { r: 213, g: 226, b: 230 },
            { r: 232, g: 213, b: 183 },
            { r: 201, g: 216, b: 168 },
            { r: 255, g: 255, b: 255 },
        ];

        const width = () => window.innerWidth;
        const height = () => window.innerHeight;

        for (let i = 0; i < COUNT; i++) {
            const color = COLORS[Math.floor(Math.random() * COLORS.length)];
            const type = Math.random() > 0.6 ? 'glow' : 'dot';
            particles.push({
                x: Math.random() * width(),
                y: Math.random() * height(),
                r: type === 'glow' ? Math.random() * 4 + 2.5 : Math.random() * 2.5 + 1.5,
                vy: Math.random() * 0.5 + 0.15,
                vx: (Math.random() - 0.5) * 0.35,
                opacity: Math.random() * 0.35 + 0.35,
                phase: Math.random() * Math.PI * 2,
                color: color,
                type: type,
                pulseSpeed: Math.random() * 0.04 + 0.015,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }

        let frame = 0;
        let isVisible = true;

        document.addEventListener('visibilitychange', () => {
            isVisible = !document.hidden;
        });

        function draw() {
            requestAnimationFrame(draw);
            if (!isVisible) return;

            const w = width();
            const h = height();
            ctx.clearRect(0, 0, w, h);

            for (let i = 0; i < COUNT; i++) {
                const p = particles[i];
                p.y += p.vy;
                p.x += p.vx + Math.sin(frame * 0.005 + p.phase) * 0.08;
                if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }
                if (p.x < -10) p.x = w + 10;
                if (p.x > w + 10) p.x = -10;

                const pulse = Math.sin(frame * p.pulseSpeed + p.pulsePhase) * 0.15 + 0.85;
                const alpha = p.opacity * pulse;

                if (p.type === 'glow') {
                    const glowR = p.r * 3;
                    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
                    grad.addColorStop(0, `rgba(${p.color.r},${p.color.g},${p.color.b},${alpha})`);
                    grad.addColorStop(0.5, `rgba(${p.color.r},${p.color.g},${p.color.b},${alpha * 0.3})`);
                    grad.addColorStop(1, `rgba(${p.color.r},${p.color.g},${p.color.b},0)`);
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
                    ctx.fillStyle = grad;
                    ctx.fill();
                } else {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${alpha})`;
                    ctx.fill();
                }
            }

            // 连线计算节流：每 connectThrottle 帧计算一次
            if (connectLines && frame % connectThrottle === 0) {
                ctx.lineWidth = 0.5;
                for (let i = 0; i < COUNT; i++) {
                    for (let j = i + 1; j < COUNT; j++) {
                        const dx = particles[i].x - particles[j].x;
                        const dy = particles[i].y - particles[j].y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < connectDistance) {
                            const alpha = (1 - dist / connectDistance) * 0.12;
                            ctx.strokeStyle = `rgba(247,250,240,${alpha})`;
                            ctx.beginPath();
                            ctx.moveTo(particles[i].x, particles[i].y);
                            ctx.lineTo(particles[j].x, particles[j].y);
                            ctx.stroke();
                        }
                    }
                }
            }

            frame++;
        }

        requestAnimationFrame(draw);
    }

    window.RAIN_PARTICLES = { initParticles };
})();
