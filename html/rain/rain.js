const PALETTE = {
    wetAsphalt: '#3F4C59',
    signalGray: '#677789',
    roadSmoke: '#93A0AC',
    stripeWhite: '#D5DDE2',
    nightAir: '#EEF2F4'
};
const LIGHT_COLORS = {
    coolBlue: '#6B7B8C',
    coolPurple: '#7A7E8C',
    silverGray: '#A8B0B8',
    paleCyan: '#8A9EAA',
    slateMist: '#75808C'
};
const LIGHT_PALETTE = Object.values(LIGHT_COLORS);

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: false });
let width, height, worldCanvas, worldCtx;
let lastTime = 0, lastRippleTime = 0;
let frameCount = 0;

const state = {
    rain: 50,
    light: 50,
    wind: false,
    windForce: 40,
    lightning: false,
    autoDayNight: true,
    isDay: false,
    quality: 'low',
    showTime: true,
    menuCollapsed: false,
    dayNightCycle: 0,
    lightningFlash: 0,
    lightningX: 0,
    mouseX: 0.5,
    mouseY: 0.5,
    windAngle: 0,
    time: new Date(),
    focalDepth: 0.5,
    targetFocalDepth: 0.5,
    mouseVelX: 0,
    mouseVelY: 0,
    lastMouseX: 0,
    lastMouseY: 0,
    lastMouseTime: 0,
    isDragging: false,
    draggedObject: null,
    dragOffsetX: 0,
    dragOffsetY: 0
};

const allBuildings = [];
const streetLights = [], neons = [];
const raindrops = [], ripples = [];
const turbulenceFields = [];
const debris = [];
const lensDrops = [];
const draggableObjects = [];
const clouds = [];
const stars = [];
let noiseCanvas = null, noiseCtx = null;

// ========== 工具函数 ==========
function hexToRgbObj(hex) {
    const v = hex.replace('#', '');
    return {
        r: parseInt(v.substr(0, 2), 16),
        g: parseInt(v.substr(2, 2), 16),
        b: parseInt(v.substr(4, 2), 16)
    };
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: r * 255, g: g * 255, b: b * 255 };
}

function varyColor(hex, lumVar, hueVar) {
    const rgb = hexToRgbObj(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.l += (Math.random() - 0.5) * 2 * lumVar;
    hsl.h += (Math.random() - 0.5) * 2 * hueVar;
    if (Math.random() > 0.5) hsl.h -= Math.random() * hueVar;
    hsl.l = Math.max(8, Math.min(92, hsl.l));
    const nrgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return rgbToHex(nrgb.r, nrgb.g, nrgb.b);
}

function lerpColor(c1, c2, t) {
    const a = hexToRgbObj(c1), b = hexToRgbObj(c2);
    return `rgb(${Math.round(a.r + (b.r - a.r) * t)}, ${Math.round(a.g + (b.g - a.g) * t)}, ${Math.round(a.b + (b.b - a.b) * t)})`;
}

function getSkyColors(cycle) {
    let top, bottom;
    if (cycle < 0.25) {
        const t = cycle / 0.25;
        top = lerpColor('#0a1016', '#1a2530', t);
        bottom = lerpColor('#141e28', '#2a3a48', t);
    } else if (cycle < 0.5) {
        const t = (cycle - 0.25) / 0.25;
        top = lerpColor('#1a2530', '#3a4a5a', t);
        bottom = lerpColor('#2a3a48', '#5a6a7a', t);
    } else if (cycle < 0.75) {
        const t = (cycle - 0.5) / 0.25;
        top = lerpColor('#3a4a5a', '#2a3a48', t);
        bottom = lerpColor('#5a6a7a', '#4a5a6a', t);
    } else {
        const t = (cycle - 0.75) / 0.25;
        top = lerpColor('#2a3a48', '#0a1016', t);
        bottom = lerpColor('#4a5a6a', '#141e28', t);
    }
    return { top, bottom };
}

function getRainCount() {
    const base = state.quality === 'low' ? 90 : state.quality === 'medium' ? 280 : 500;
    return Math.floor(base * (0.25 + state.rain / 100 * 0.75));
}

function hexToRgbStr(hex) {
    const v = hexToRgbObj(hex);
    return `${Math.round(v.r)}, ${Math.round(v.g)}, ${Math.round(v.b)}`;
}

// ========== 建筑物生成 ==========
function generateRuinedBuilding(x, y, w, h, layerColor, layer) {
    const building = {
        x, y, w, h, layer,
        blocks: [], gaps: [], topDecor: [], sideSlits: [],
        windows: [], industrial: [], surfaceNoise: [],
        baseColor: varyColor(layerColor, 6, 3),
        _staticCanvas: null, _staticCtx: null, _needsStaticRender: true
    };

    const blockCount = Math.max(2, Math.floor(w / 35));
    let bx = x;
    const blockW = w / blockCount;
    for (let i = 0; i < blockCount; i++) {
        const bh = h * (0.85 + Math.random() * 0.15);
        const by = y + (h - bh);
        building.blocks.push({ x: bx, y: by, w: blockW - 1, h: bh, color: varyColor(layerColor, 5, 2) });
        bx += blockW;
    }

    const gapCount = Math.floor(Math.random() * 3);
    for (let i = 0; i < gapCount; i++) {
        const gw = 15 + Math.random() * (w * 0.25);
        const gx = x + Math.random() * (w - gw);
        const gy = y + Math.random() * h * 0.15;
        const gh = 10 + Math.random() * h * 0.12;
        building.gaps.push({ x: gx, y: gy, w: gw, h: gh });
        building.blocks.push({ x: gx, y: gy, w: gw, h: gh, color: varyColor(layerColor, 12, 2), isGapFill: true });

        const rebarCount = Math.floor(Math.random() * 4) + 2;
        for (let r = 0; r < rebarCount; r++) {
            building.surfaceNoise.push({
                x: gx + Math.random() * gw,
                y: gy,
                w: 1 + Math.random() * 1.5,
                h: gh * (0.6 + Math.random() * 0.4),
                color: varyColor('#3F4C59', 8, 1),
                angle: (Math.random() - 0.5) * 0.15,
                isRebar: true
            });
        }
    }

    if (Math.random() > 0.6) {
        const breakW = 8 + Math.random() * 15;
        const breakX = Math.random() > 0.5 ? x + w - breakW : x;
        const breakY = y + h * 0.3 + Math.random() * h * 0.4;
        const breakH = h * 0.15 + Math.random() * h * 0.2;
        building.gaps.push({ x: breakX, y: breakY, w: breakW, h: breakH });
        building.blocks.push({
            x: breakX, y: breakY, w: breakW, h: breakH,
            color: varyColor(layerColor, 14, 2), isGapFill: true
        });
    }

    const validBlocks = building.blocks.filter(b => !b.isGapFill);
    const decorCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < decorCount; i++) {
        if (validBlocks.length === 0) break;
        const block = validBlocks[Math.floor(Math.random() * validBlocks.length)];
        const type = ['fence', 'tank', 'antenna', 'ac'][Math.floor(Math.random() * 4)];
        const dx = block.x + Math.random() * Math.max(block.w - 25, 4);
        const dy = block.y - 2;

        if (type === 'fence') {
            building.topDecor.push({
                type: 'rect', x: dx, y: dy - 6,
                w: Math.min(18 + Math.random() * 25, block.w - 2), h: 6,
                color: varyColor('#3F4C59', 5, 2)
            });
            for (let f = 0; f < 5; f++) {
                building.topDecor.push({
                    type: 'rect', x: dx + f * 5, y: dy - 12, w: 1.5, h: 8,
                    color: varyColor('#3F4C59', 5, 2)
                });
            }
        } else if (type === 'tank') {
            building.topDecor.push({
                type: 'rect', x: dx, y: dy - 10,
                w: Math.min(14 + Math.random() * 18, block.w - 2), h: 10,
                color: varyColor('#677789', 6, 2)
            });
            building.topDecor.push({
                type: 'rect', x: dx + 3, y: dy - 14, w: 4, h: 4,
                color: varyColor('#3F4C59', 5, 2)
            });
        } else if (type === 'antenna') {
            building.topDecor.push({
                type: 'line', x1: dx, y1: dy,
                x2: dx, y2: dy - 18 - Math.random() * 22,
                color: varyColor('#677789', 5, 2), width: 1.2
            });
            building.topDecor.push({
                type: 'line', x1: dx - 5, y1: dy - 8,
                x2: dx + 5, y2: dy - 8,
                color: varyColor('#677789', 5, 2), width: 0.8
            });
        } else {
            building.topDecor.push({
                type: 'rect', x: dx, y: dy - 8,
                w: Math.min(10, block.w - 2), h: 8,
                color: varyColor('#677789', 5, 2)
            });
            for (let g = 0; g < 3; g++) {
                building.topDecor.push({
                    type: 'rect', x: dx + 1, y: dy - 7 + g * 2.5, w: 8, h: 1.2,
                    color: varyColor('#3F4C59', 4, 1)
                });
            }
        }
    }

    const slitCount = Math.floor(h / 30) + 2;
    for (let i = 0; i < slitCount; i++) {
        if (Math.random() > 0.35) {
            const sy = y + 15 + Math.random() * (h - 30);
            const sw = 1.5 + Math.random() * 2;
            const sCount = Math.floor(Math.random() * 6) + 3;
            for (let j = 0; j < sCount; j++) {
                building.sideSlits.push({
                    x: x + 3 + j * (sw + 3) + Math.random() * 2,
                    y: sy, w: sw, h: 6 + Math.random() * 10,
                    color: varyColor(layerColor, 10, 1),
                    lit: Math.random() > 0.82
                });
            }
        }
    }

    const noiseCount = Math.floor(w * h / 1800) + 5;
    for (let i = 0; i < noiseCount; i++) {
        building.surfaceNoise.push({
            x: x + Math.random() * w,
            y: y + Math.random() * h,
            w: 2 + Math.random() * 8,
            h: 2 + Math.random() * 6,
            color: Math.random() > 0.5 ? varyColor('#3F4C59', 10, 2) : varyColor('#677789', 10, 2),
            alpha: 0.08 + Math.random() * 0.07
        });
    }

    const winCount = Math.floor(Math.random() * 6) + 3;
    for (let i = 0; i < winCount; i++) {
        const ww = 5 + Math.random() * 14;
        const wh = 7 + Math.random() * 18;
        const wx = x + 5 + Math.random() * (w - ww - 10);
        const wy = y + 8 + Math.random() * (h - wh - 16);
        const winType = Math.random() > 0.75 ? 'missing' : (Math.random() > 0.85 ? 'broken' : 'normal');
        const glassColor = Math.random() > 0.5 ? PALETTE.roadSmoke : PALETTE.stripeWhite;
        const lightColor = LIGHT_PALETTE[Math.floor(Math.random() * LIGHT_PALETTE.length)];
        building.windows.push({
            x: wx, y: wy, w: ww, h: wh,
            type: winType,
            glassColor: glassColor,
            lightColor: lightColor,
            on: Math.random() > 0.55,
            flicker: 0.008 + Math.random() * 0.025,
            phase: Math.random() * Math.PI * 2
        });
    }

    const indCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < indCount; i++) {
        if (validBlocks.length === 0) break;
        const block = validBlocks[Math.floor(Math.random() * validBlocks.length)];
        const itype = ['ac', 'fan', 'pipe', 'tank'][Math.floor(Math.random() * 4)];
        const ix = block.x + Math.random() * Math.max(block.w - 16, 4);
        const iy = block.y + 5 + Math.random() * Math.max(block.h - 15, 5);

        if (itype === 'ac') {
            building.industrial.push({
                type: 'ac', x: ix, y: iy,
                w: Math.min(12, block.w - 2), h: 9,
                color: varyColor('#677789', 5, 2), shadow: true
            });
        } else if (itype === 'fan') {
            const fr = Math.min(5 + Math.random() * 4, block.w * 0.35);
            building.industrial.push({
                type: 'fan', x: ix + 6, y: iy + 6, r: fr,
                color: varyColor('#677789', 5, 2),
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: 0.02 + Math.random() * 0.04, shadow: true
            });
        } else if (itype === 'pipe') {
            const pipeLen = Math.min(15 + Math.random() * 35, block.h - iy + block.y - 5);
            building.industrial.push({
                type: 'pipe', x: ix, y: iy, len: pipeLen,
                color: varyColor('#677789', 6, 2),
                dropTimer: Math.random() * 200,
                dropInterval: 120 + Math.random() * 300, shadow: true
            });
        } else {
            building.industrial.push({
                type: 'tank', x: ix, y: iy,
                w: Math.min(10 + Math.random() * 8, block.w - 2),
                h: Math.min(12 + Math.random() * 8, block.h - 5),
                color: varyColor('#3F4C59', 6, 2), shadow: true
            });
        }
    }

    return building;
}

function renderBuildingStatic(b) {
    if (!b._staticCanvas) {
        b._staticCanvas = document.createElement('canvas');
        b._staticCanvas.width = Math.ceil(b.w + 60);
        b._staticCanvas.height = Math.ceil(b.h + 60);
        b._staticCtx = b._staticCanvas.getContext('2d');
    }
    const c = b._staticCtx;
    const ox = -b.x + 30, oy = -b.y + 30;
    c.clearRect(0, 0, b._staticCanvas.width, b._staticCanvas.height);
    c.save();
    c.translate(ox, oy);

    b.blocks.forEach(block => {
        c.fillStyle = block.color;
        c.fillRect(block.x, block.y, block.w, block.h);
    });

    b.topDecor.forEach(d => {
        c.fillStyle = d.color;
        if (d.type === 'rect') {
            c.fillRect(d.x, d.y, d.w, d.h);
        } else if (d.type === 'line') {
            c.strokeStyle = d.color;
            c.lineWidth = d.width;
            c.beginPath();
            c.moveTo(d.x1, d.y1);
            c.lineTo(d.x2, d.y2);
            c.stroke();
        }
    });

    b.surfaceNoise.forEach(n => {
        if (!n.angle && !n.isRebar) {
            c.fillStyle = n.color;
            c.globalAlpha = n.alpha !== undefined ? n.alpha : 0.1;
            c.fillRect(n.x, n.y, n.w, n.h);
        }
    });

    c.globalAlpha = 1;
    c.restore();
    b._needsStaticRender = false;
}

function drawBuildingDynamic(c, b, parallaxFactor) {
    const parallaxScale = 0.25 + state.focalDepth * 0.75;
    const parallax = (state.mouseX - 0.5) * parallaxFactor * parallaxScale;
    const farBlur = (b.layer === 'far' && state.focalDepth > 0.55) ? (state.focalDepth - 0.55) * 5 : 0;

    c.save();
    c.translate(parallax, 0);
    if (farBlur > 0.3) c.filter = `blur(${farBlur}px)`;

    if (b._staticCanvas) {
        c.drawImage(b._staticCanvas, b.x - 30, b.y - 30);
    }

    c.filter = 'none';
    b.surfaceNoise.forEach(n => {
        if (n.angle || n.isRebar) {
            c.save();
            c.translate(n.x, n.y);
            c.rotate(n.angle);
            c.fillStyle = n.color;
            c.globalAlpha = n.alpha !== undefined ? n.alpha : 0.1;
            c.fillRect(0, 0, n.w, n.h);
            c.restore();
        }
    });

    c.globalAlpha = 1;
    const lightMult = state.light / 100;
    b.sideSlits.forEach(s => {
        c.fillStyle = s.color;
        c.fillRect(s.x, s.y, s.w, s.h);
        if (s.lit && lightMult > 0.1) {
            c.fillStyle = `rgba(${hexToRgbStr(LIGHT_PALETTE[Math.floor(Math.random() * LIGHT_PALETTE.length)])}, ${0.15 * lightMult})`;
            c.fillRect(s.x, s.y, s.w, s.h);
        }
    });

    const time = Date.now() * 0.001;
    b.windows.forEach(w => {
        w.phase += w.flicker;
        const flicker = Math.sin(w.phase) * 0.35 + 0.65;
        const baseAlpha = w.on ? (0.2 + flicker * 0.4) * lightMult : 0;

        if (w.type === 'missing') {
            c.strokeStyle = `rgba(${hexToRgbStr(w.glassColor)}, 0.25)`;
            c.lineWidth = 1.2;
            c.strokeRect(w.x, w.y, w.w, w.h);
        } else if (w.type === 'broken') {
            c.fillStyle = `rgba(${hexToRgbStr(w.glassColor)}, 0.25)`;
            c.fillRect(w.x, w.y, w.w, w.h);
            c.strokeStyle = `rgba(${hexToRgbStr(PALETTE.wetAsphalt)}, 0.35)`;
            c.lineWidth = 0.6;
            c.beginPath();
            c.moveTo(w.x + w.w * 0.5, w.y + w.h * 0.5);
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2 + Math.random() * 0.3;
                const len = Math.min(w.w, w.h) * (0.4 + Math.random() * 0.5);
                c.lineTo(w.x + w.w * 0.5 + Math.cos(angle) * len, w.y + w.h * 0.5 + Math.sin(angle) * len);
                c.moveTo(w.x + w.w * 0.5, w.y + w.h * 0.5);
            }
            c.stroke();
            if (baseAlpha > 0.01) {
                c.fillStyle = `rgba(${hexToRgbStr(w.lightColor)}, ${baseAlpha * 0.35})`;
                c.fillRect(w.x, w.y, w.w, w.h);
            }
        } else {
            c.fillStyle = `rgba(${hexToRgbStr(w.glassColor)}, 0.3)`;
            c.fillRect(w.x, w.y, w.w, w.h);
            if (baseAlpha > 0.01) {
                c.fillStyle = `rgba(${hexToRgbStr(w.lightColor)}, ${baseAlpha * 0.5})`;
                c.fillRect(w.x, w.y, w.w, w.h);
                c.shadowColor = w.lightColor;
                c.shadowBlur = 3 * lightMult;
                c.fillStyle = `rgba(${hexToRgbStr(w.lightColor)}, ${baseAlpha * 0.2})`;
                c.fillRect(w.x, w.y, w.w, w.h);
                c.shadowBlur = 0;
            }
        }
    });

    b.industrial.forEach(ind => {
        if (ind.shadow) {
            c.fillStyle = 'rgba(63, 76, 89, 0.3)';
            c.fillRect(ind.x + 1, ind.y + 1, ind.w || ind.len || ind.r * 2, ind.h || ind.r * 2);
        }
        c.fillStyle = ind.color;
        if (ind.type === 'ac') {
            c.fillRect(ind.x, ind.y, ind.w, ind.h);
            for (let g = 0; g < 3; g++) {
                c.fillStyle = varyColor('#3F4C59', 4, 1);
                c.fillRect(ind.x + 1, ind.y + 1 + g * 2.8, ind.w - 2, 1.2);
            }
        } else if (ind.type === 'fan') {
            c.beginPath();
            c.arc(ind.x, ind.y, ind.r, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = varyColor('#3F4C59', 5, 2);
            c.lineWidth = 1;
            c.beginPath();
            c.arc(ind.x, ind.y, ind.r * 0.7, 0, Math.PI * 2);
            c.stroke();
            ind.rotation += ind.rotSpeed * (1 + state.windForce / 100);
            c.strokeStyle = ind.color;
            c.lineWidth = 1.5;
            for (let i = 0; i < 3; i++) {
                const angle = ind.rotation + (i / 3) * Math.PI * 2;
                c.beginPath();
                c.moveTo(ind.x, ind.y);
                c.lineTo(ind.x + Math.cos(angle) * ind.r * 0.8, ind.y + Math.sin(angle) * ind.r * 0.8);
                c.stroke();
            }
        } else if (ind.type === 'pipe') {
            c.strokeStyle = ind.color;
            c.lineWidth = 3;
            c.beginPath();
            c.moveTo(ind.x, ind.y);
            c.lineTo(ind.x, ind.y + ind.len);
            c.stroke();
            ind.dropTimer++;
            if (ind.dropTimer > ind.dropInterval) {
                ind.dropTimer = 0;
                ind.dropInterval = 80 + Math.random() * 250;
                const dropY = ind.y + ind.len;
                if (dropY > height * 0.76) ripples.push(new Ripple(ind.x, dropY, 0.5, 'rain'));
            }
            if (ind.dropTimer < 8) {
                c.fillStyle = 'rgba(213, 221, 226, 0.35)';
                c.beginPath();
                c.arc(ind.x, ind.y + ind.len + ind.dropTimer * 2, 1.5, 0, Math.PI * 2);
                c.fill();
            }
        } else if (ind.type === 'tank') {
            c.fillRect(ind.x, ind.y, ind.w, ind.h);
            c.strokeStyle = varyColor('#3F4C59', 5, 2);
            c.lineWidth = 0.8;
            c.strokeRect(ind.x, ind.y, ind.w, ind.h);
        }
    });

    c.restore();
}

function drawBuilding(c, b, parallaxFactor) {
    if (b._needsStaticRender) renderBuildingStatic(b);
    drawBuildingDynamic(c, b, parallaxFactor);
}

// ========== 星空 ==========
function generateStars() {
    stars.length = 0;
    const count = state.quality === 'low' ? 0 : (state.quality === 'medium' ? 60 : 140);
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height * 0.55,
            size: 0.5 + Math.random() * 1.5,
            alpha: 0.15 + Math.random() * 0.6,
            twinkleSpeed: 0.5 + Math.random() * 2,
            phase: Math.random() * Math.PI * 2
        });
    }
}

// ========== 云层 ==========
function generateClouds() {
    clouds.length = 0;
    const count = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
        const blobs = [];
        const blobCount = 3 + Math.floor(Math.random() * 4);
        const cx = Math.random() * width;
        const cy = height * 0.05 + Math.random() * height * 0.25;
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

        for (let b = 0; b < blobCount; b++) {
            const bx = cx + (Math.random() - 0.5) * 80;
            const by = cy + (Math.random() - 0.5) * 30;
            const rx = 30 + Math.random() * 70;
            const ry = 12 + Math.random() * 25;
            blobs.push({ x: bx, y: by, rx, ry });
            minX = Math.min(minX, bx - rx);
            maxX = Math.max(maxX, bx + rx);
            minY = Math.min(minY, by - ry);
            maxY = Math.max(maxY, by + ry);
        }

        const pad = 20;
        const cw = Math.ceil(maxX - minX + pad * 2);
        const ch = Math.ceil(maxY - minY + pad * 2);
        const ccan = document.createElement('canvas');
        ccan.width = cw;
        ccan.height = ch;
        const cc = ccan.getContext('2d');
        const color = Math.random() > 0.5 ? PALETTE.wetAsphalt : PALETTE.signalGray;
        const rgbStr = hexToRgbStr(color);

        blobs.forEach(blob => {
            const grad = cc.createRadialGradient(
                blob.x - minX + pad, blob.y - minY + pad, 0,
                blob.x - minX + pad, blob.y - minY + pad, blob.rx
            );
            grad.addColorStop(0, `rgba(${rgbStr}, 0.35)`);
            grad.addColorStop(1, `rgba(${rgbStr}, 0)`);
            cc.fillStyle = grad;
            cc.beginPath();
            cc.ellipse(blob.x - minX + pad, blob.y - minY + pad, blob.rx, blob.ry, 0, 0, Math.PI * 2);
            cc.fill();
        });

        clouds.push({
            canvas: ccan, cx, cy,
            offsetX: minX - pad, offsetY: minY - pad,
            speed: 0.08 + Math.random() * 0.15,
            alpha: 0.15 + Math.random() * 0.15,
            color: color
        });
    }
}

// ========== 可拖拽物件 ==========
class DraggableObject {
    constructor() {
        const types = ['can', 'newspaper', 'umbrella', 'bottle'];
        this.type = types[Math.floor(Math.random() * types.length)];
        this.x = Math.random() * width * 0.8 + width * 0.1;
        this.y = height * 0.68 + Math.random() * (height * 0.28);
        this.vx = 0;
        this.vy = 0;
        this.size = 12 + Math.random() * 14;
        this.opacity = 0.7 + Math.random() * 0.2;
        const colors = [PALETTE.wetAsphalt, PALETTE.signalGray, '#4a5865', '#55626d'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.rotation = Math.random() * Math.PI * 2;
        this.rotVel = 0;
        this.dragging = false;
        this.lastVx = 0;
        this.lastVy = 0;
        this.slideTimer = 0;
    }

    getBounds() {
        return { x: this.x - this.size, y: this.y - this.size * 0.6, w: this.size * 2, h: this.size * 1.2 };
    }

    update() {
        if (!this.dragging) {
            if (this.slideTimer > 0) {
                this.x += this.vx * 0.016;
                this.y += this.vy * 0.016;
                this.rotation += this.rotVel * 0.016;
                this.vx *= 0.94;
                this.vy *= 0.94;
                this.rotVel *= 0.92;
                this.slideTimer -= 16;

                const puddleY = height * 0.76;
                if (this.x < this.size) { this.x = this.size; this.vx *= -0.3; }
                if (this.x > width - this.size) { this.x = width - this.size; this.vx *= -0.3; }
                if (this.y < puddleY) { this.y = puddleY; this.vy *= -0.3; }
                if (this.y > height - this.size * 0.5) { this.y = height - this.size * 0.5; this.vy *= -0.3; }

                draggableObjects.forEach(other => {
                    if (other === this) return;
                    const dx = this.x - other.x, dy = this.y - other.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const minDist = (this.size + other.size) * 0.7;
                    if (dist < minDist && dist > 0) {
                        const nx = dx / dist, ny = dy / dist;
                        const relVx = this.vx - other.vx, relVy = this.vy - other.vy;
                        const dot = relVx * nx + relVy * ny;
                        if (dot < 0) {
                            const impulse = dot * 0.3;
                            this.vx -= impulse * nx;
                            this.vy -= impulse * ny;
                            other.vx += impulse * nx;
                            other.vy += impulse * ny;
                        }
                        const overlap = minDist - dist;
                        this.x += nx * overlap * 0.5;
                        this.y += ny * overlap * 0.5;
                        other.x -= nx * overlap * 0.5;
                        other.y -= ny * overlap * 0.5;
                    }
                });
            }
        }
        return true;
    }

    draw(c) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.rotation);
        c.globalAlpha = this.opacity;
        c.fillStyle = this.color;

        if (this.type === 'can') {
            c.fillRect(-this.size * 0.5, -this.size * 0.35, this.size, this.size * 0.7);
            c.fillStyle = varyColor(this.color, 8, 2);
            c.fillRect(-this.size * 0.45, -this.size * 0.4, this.size * 0.9, this.size * 0.1);
        } else if (this.type === 'newspaper') {
            c.fillRect(-this.size * 0.7, -this.size * 0.45, this.size * 1.4, this.size * 0.9);
            c.strokeStyle = 'rgba(147,160,172,0.2)';
            c.lineWidth = 0.5;
            c.strokeRect(-this.size * 0.7, -this.size * 0.45, this.size * 1.4, this.size * 0.9);
        } else if (this.type === 'umbrella') {
            c.beginPath();
            c.arc(0, -this.size * 0.15, this.size * 0.55, Math.PI, 0);
            c.lineTo(this.size * 0.2, this.size * 0.35);
            c.lineTo(-this.size * 0.2, this.size * 0.35);
            c.closePath();
            c.fill();
        } else {
            c.fillRect(-this.size * 0.3, -this.size * 0.5, this.size * 0.6, this.size);
            c.fillStyle = varyColor(this.color, 6, 2);
            c.fillRect(-this.size * 0.25, -this.size * 0.45, this.size * 0.5, this.size * 0.15);
        }

        c.restore();
    }
}

// ========== 雨滴 ==========
function initRain() {
    const target = getRainCount();
    while (raindrops.length < target) raindrops.push(createRaindrop());
    while (raindrops.length > target) raindrops.pop();
}

function createRaindrop() {
    const intensity = state.rain / 100;
    return {
        x: Math.random() * (width + 200) - 100,
        y: Math.random() * -height,
        length: 8 + Math.random() * 25 * (0.5 + intensity * 0.5),
        speed: 6 + Math.random() * 12 * (0.5 + intensity * 0.5),
        opacity: 0.08 + Math.random() * 0.25,
        width: 0.5 + Math.random() * 1.2,
        hasHead: Math.random() > 0.6
    };
}

function updateRain() {
    const puddleY = height * 0.76, targetCount = getRainCount();
    while (raindrops.length < targetCount) raindrops.push(createRaindrop());
    while (raindrops.length > targetCount) raindrops.pop();

    const windBase = (state.windForce / 100) * 0.35;
    const mouseWind = (state.mouseX - 0.5) * 0.4;
    const targetAngle = state.wind ? (windBase + mouseWind) : 0;
    state.windAngle += (targetAngle - state.windAngle) * 0.05;
    const windOffset = Math.tan(state.windAngle) * 1.5;
    const now = Date.now();
    const turbLen = turbulenceFields.length;

    raindrops.forEach(drop => {
        drop.y += drop.speed;
        drop.x += windOffset * drop.speed * 0.4;

        if (turbLen > 0) {
            for (let i = 0; i < turbLen; i++) {
                const tf = turbulenceFields[i];
                const dx = drop.x - tf.x, dy = drop.y - tf.y;
                const dist = dx * dx + dy * dy;
                const age = now - tf.born;
                if (dist < tf.radius * tf.radius && age < tf.life) {
                    const lifeFactor = 1 - age / tf.life;
                    const distFactor = (1 - Math.sqrt(dist) / tf.radius) * lifeFactor;
                    if (distFactor > 0) {
                        drop.x += (tf.vx * 0.008 + (Math.random() - 0.5) * 3) * distFactor * tf.strength;
                        drop.y += (tf.vy * 0.005 + (Math.random() - 0.5) * 2) * distFactor * tf.strength;
                    }
                }
            }
        }

        if (drop.y > height + drop.length) {
            drop.y = -drop.length - Math.random() * 100;
            drop.x = Math.random() * (width + 200) - 100;
        }

        if (drop.y > puddleY && state.quality !== 'low' && Math.random() < 0.02 * (state.rain / 100)) {
            ripples.push(new Ripple(drop.x, drop.y, 0.4 + Math.random() * 0.6, 'rain'));
        }
    });
}

function drawRain() {
    const buckets = {};
    const windXBase = Math.tan(state.windAngle);
    raindrops.forEach(drop => {
        const wKey = Math.round(drop.width * 2);
        const oKey = Math.round(drop.opacity * 8);
        const key = wKey + '_' + oKey;
        if (!buckets[key]) buckets[key] = {
            width: Math.max(0.5, wKey / 2),
            opacity: Math.max(0.02, oKey / 8),
            drops: []
        };
        buckets[key].drops.push(drop);
    });

    ctx.lineCap = 'round';
    ctx.strokeStyle = PALETTE.roadSmoke;
    for (const key in buckets) {
        const b = buckets[key];
        ctx.lineWidth = b.width;
        ctx.globalAlpha = b.opacity;
        ctx.beginPath();
        const drops = b.drops;
        for (let i = 0, len = drops.length; i < len; i++) {
            const drop = drops[i];
            const wx = windXBase * drop.length;
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x + wx, drop.y + drop.length);
        }
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    if (state.quality !== 'low') {
        ctx.fillStyle = 'rgba(220,230,240,0.35)';
        const drops = raindrops;
        for (let i = 0, len = drops.length; i < len; i++) {
            const drop = drops[i];
            if (drop.hasHead) {
                ctx.globalAlpha = drop.opacity * 0.8;
                ctx.beginPath();
                ctx.arc(
                    drop.x + windXBase * drop.length * 0.9,
                    drop.y + drop.length * 0.95,
                    drop.width * 0.6, 0, Math.PI * 2
                );
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }
}

// ========== 涟漪 ==========
class Ripple {
    constructor(x, y, strength, type) {
        this.x = x;
        this.y = y;
        this.type = type || 'rain';
        this.radius = 0;
        this.maxRadius = type === 'click' ? 55 + strength * 50 : 15 + Math.random() * 35;
        this.strength = strength;
        this.age = 0;
        this.maxAge = type === 'click' ? 110 + strength * 90 : 50 + Math.random() * 60;
        this.speed = type === 'click' ? 0.75 + strength * 0.45 : 0.4 + Math.random() * 0.6;
        this.rings = type === 'click' ? 3 : 1;
    }

    update() {
        this.age++;
        this.radius += this.speed;
        return this.age < this.maxAge;
    }

    draw(c) {
        const p = this.age / this.maxAge;
        const baseAlpha = (1 - p) * 0.25 * this.strength;
        c.lineWidth = 1.2;

        if (this.type === 'click') {
            for (let i = 0; i < this.rings; i++) {
                const rr = this.radius * (1 - i * 0.28);
                if (rr > 0) {
                    c.strokeStyle = `rgba(213, 221, 226, ${baseAlpha * (1 - i * 0.25)})`;
                    c.beginPath();
                    c.ellipse(this.x, this.y, rr, rr * 0.28, 0, 0, Math.PI * 2);
                    c.stroke();
                }
            }
        } else {
            c.strokeStyle = `rgba(213, 221, 226, ${baseAlpha})`;
            c.beginPath();
            c.ellipse(this.x, this.y, this.radius, this.radius * 0.28, 0, 0, Math.PI * 2);
            c.stroke();
        }
    }

    getDisplacementAtY(y) {
        const dy = y - this.y, dist = Math.abs(dy);
        if (dist > this.radius) return 0;
        const factor = 1 - dist / this.radius;
        return Math.sin(factor * Math.PI * 2 - this.age * 0.15) * this.strength * 5 * factor * (1 - this.age / this.maxAge);
    }
}

// ========== 飘浮物 ==========
class Debris {
    constructor() {
        const windDir = state.windAngle > 0 ? 1 : -1;
        this.x = windDir > 0 ? -30 : width + 30;
        this.y = height * 0.38 + Math.random() * height * 0.32;
        this.vx = (Math.abs(state.windAngle) * 90 + Math.random() * 40) * windDir;
        this.vy = (Math.random() - 0.5) * 20;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.12;
        this.size = 10 + Math.random() * 18;
        this.opacity = 0.4 + Math.random() * 0.3;
        this.life = 350 + Math.random() * 500;
        this.age = 0;
        this.type = ['newspaper', 'leaf', 'dust', 'flower'][Math.floor(Math.random() * 4)];
        const colors = [PALETTE.wetAsphalt, PALETTE.signalGray, '#4a5865', '#55626d'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.age++;
        this.x += this.vx * 0.016;
        this.y += this.vy * 0.016;
        this.rotation += this.rotSpeed;
        this.vx += (Math.random() - 0.5) * 3;
        this.vy += (Math.random() - 0.5) * 2;
        this.vx += state.windAngle * 2;
        return this.age < this.life && this.x > -100 && this.x < width + 100;
    }

    draw(c) {
        const fade = Math.min(1, this.age / 25, (this.life - this.age) / 40);
        if (fade <= 0) return;
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.rotation);
        c.globalAlpha = this.opacity * fade;
        c.fillStyle = this.color;

        if (this.type === 'newspaper') {
            c.fillRect(-this.size, -this.size * 0.55, this.size * 2, this.size * 1.1);
            c.strokeStyle = 'rgba(147,160,172,0.25)';
            c.lineWidth = 0.5;
            c.strokeRect(-this.size, -this.size * 0.55, this.size * 2, this.size * 1.1);
        } else if (this.type === 'leaf') {
            c.beginPath();
            c.ellipse(0, 0, this.size * 0.45, this.size * 0.75, 0, 0, Math.PI * 2);
            c.fill();
        } else if (this.type === 'dust') {
            c.beginPath();
            c.arc(0, 0, this.size * 0.35, 0, Math.PI * 2);
            c.fill();
        } else {
            c.fillRect(-2, -this.size * 0.5, 4, this.size);
            c.fillRect(-this.size * 0.45, -2, this.size * 0.9, 4);
        }

        c.restore();
    }
}

// ========== 镜头水滴 ==========
class LensDrop {
    constructor() { this.reset(true); }

    reset(randomY) {
        this.x = Math.random() * width;
        this.y = randomY ? Math.random() * height : -15;
        this.size = 2.5 + Math.random() * 5.5;
        this.speed = 0.25 + Math.random() * 0.7;
        this.opacity = 0.03 + Math.random() * 0.07;
        this.slope = (Math.random() - 0.5) * 0.25;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 0.03 + Math.random() * 0.05;
    }

    update() {
        this.y += this.speed;
        this.x += this.slope * this.speed;
        this.wobble += this.wobbleSpeed;
        if (this.y > height + 15) this.reset();
        return true;
    }

    draw(c) {
        c.save();
        c.globalAlpha = this.opacity;
        const grad = c.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        grad.addColorStop(0, 'rgba(238,242,244,0.5)');
        grad.addColorStop(0.6, 'rgba(213,221,226,0.15)');
        grad.addColorStop(1, 'rgba(213,221,226,0)');
        c.fillStyle = grad;
        c.beginPath();
        c.ellipse(this.x, this.y, this.size, this.size * 1.25, Math.sin(this.wobble) * 0.15, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = 'rgba(238,242,244,0.12)';
        c.beginPath();
        c.arc(this.x - this.size * 0.25, this.y - this.size * 0.35, this.size * 0.2, 0, Math.PI * 2);
        c.fill();

        c.strokeStyle = 'rgba(213,221,226,0.06)';
        c.lineWidth = this.size * 0.4;
        c.beginPath();
        c.moveTo(this.x, this.y - this.size);
        c.lineTo(this.x + Math.sin(this.wobble) * 2, this.y - this.size * 2.5);
        c.stroke();
        c.restore();
    }
}

// ========== 噪声纹理 ==========
function generateNoise() {
    if (!noiseCanvas) {
        noiseCanvas = document.createElement('canvas');
        noiseCanvas.width = 256;
        noiseCanvas.height = 256;
        noiseCtx = noiseCanvas.getContext('2d');
    }
    const imgData = noiseCtx.createImageData(256, 256);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() > 0.5 ? 220 : 40;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 20 + Math.random() * 80;
    }
    noiseCtx.putImageData(imgData, 0, 0);
}

// ========== 绘制函数 ==========
function drawSky(c) {
    const colors = getSkyColors(state.dayNightCycle);
    const grad = c.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, colors.top);
    grad.addColorStop(1, colors.bottom);
    c.fillStyle = grad;
    c.fillRect(0, 0, width, height);

    const cycle = state.dayNightCycle;
    const isNight = cycle > 0.75 || cycle < 0.15;
    const starAlpha = isNight ? 1 : (cycle > 0.65 || cycle < 0.25 ? 0.3 : 0);

    if (starAlpha > 0.01 && stars.length > 0) {
        const t = Date.now() * 0.001;
        c.save();
        const starLen = stars.length;
        for (let i = 0; i < starLen; i++) {
            const s = stars[i];
            const twinkle = Math.sin(t * s.twinkleSpeed + s.phase) * 0.4 + 0.6;
            c.globalAlpha = s.alpha * starAlpha * twinkle;
            c.fillStyle = '#e0e8f0';
            c.beginPath();
            c.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            c.fill();
        }
        c.restore();
    }

    const parallax = (state.mouseX - 0.5) * 30 * (0.25 + state.focalDepth * 0.75);
    const rainSpeedMult = 0.2 + state.rain / 100 * 1.5;
    c.save();
    c.translate(parallax, 0);

    const cloudLen = clouds.length;
    for (let i = 0; i < cloudLen; i++) {
        const cloud = clouds[i];
        cloud.cx += cloud.speed * rainSpeedMult;
        if (cloud.cx > width + 150) cloud.cx = -150;
        if (cloud.cx < -150) cloud.cx = width + 150;
        const alpha = cloud.alpha * (0.3 + state.rain / 100 * 0.7);
        c.globalAlpha = alpha;
        c.drawImage(cloud.canvas, cloud.cx + cloud.offsetX, cloud.cy + cloud.offsetY);
    }

    c.globalAlpha = 1;
    c.restore();
}

function drawNeons(c) {
    const lightMult = state.light / 100;
    const parallax = (state.mouseX - 0.5) * 25 * (0.25 + state.focalDepth * 0.75);
    c.save();
    c.translate(parallax, 0);

    const neonLen = neons.length;
    for (let i = 0; i < neonLen; i++) {
        const n = neons[i];
        n.phase += 0.015;
        const alpha = (Math.sin(n.phase) * 0.5 + 0.5) * 0.35 * lightMult;
        c.fillStyle = n.color;
        c.globalAlpha = alpha;
        c.fillRect(n.x, n.y, n.w, 3);
        c.shadowColor = n.color;
        c.shadowBlur = (8 + state.rain * 0.2) * lightMult;
        c.fillRect(n.x, n.y, n.w, 3);
        c.shadowBlur = 0;
        c.globalAlpha = 1;
    }

    c.restore();
}

function drawMidground(c) {
    const parallax = (state.mouseX - 0.5) * 90 * (0.25 + state.focalDepth * 0.75);
    c.save();
    c.translate(parallax, 0);

    const roadY = height * 0.62, roadH = height - roadY;
    c.fillStyle = '#4a5865';
    c.fillRect(-200, roadY, width + 400, roadH);

    const wetGrad = c.createLinearGradient(0, roadY, 0, height);
    wetGrad.addColorStop(0, 'rgba(147, 160, 172, 0)');
    wetGrad.addColorStop(0.6, `rgba(147, 160, 172, ${0.06 + state.rain * 0.001})`);
    wetGrad.addColorStop(1, `rgba(147, 160, 172, ${0.1 + state.rain * 0.0015})`);
    c.fillStyle = wetGrad;
    c.fillRect(-200, roadY, width + 400, roadH);

    c.strokeStyle = 'rgba(213, 221, 226, 0.25)';
    c.setLineDash([18, 28]);
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-200, roadY + roadH * 0.45);
    c.lineTo(width + 200, roadY + roadH * 0.45);
    c.stroke();
    c.setLineDash([]);

    const crossX = width * 0.5;
    const crossY = roadY + roadH * 0.22;
    const perspDepth = roadH * 0.28;
    const time = Date.now() * 0.001;

    for (let i = -4; i < 5; i++) {
        const tNear = Math.abs(i) / 5;
        const nearW = 10 + (1 - tNear) * 6;
        const farW = nearW * 0.55;
        const nearX = crossX + i * 26;
        const farX = crossX + i * 14;
        const nearY = crossY + perspDepth * 0.65;
        const farY = crossY;
        const shimmer = Math.sin(time + i * 0.5) * 0.08;
        const alpha = (0.35 + shimmer) * (0.4 + Math.random() * 0.2);

        c.fillStyle = `rgba(213, 221, 226, ${alpha})`;
        c.beginPath();
        c.moveTo(nearX - nearW / 2, nearY);
        c.lineTo(nearX + nearW / 2, nearY);
        c.lineTo(farX + farW / 2, farY);
        c.lineTo(farX - farW / 2, farY);
        c.closePath();
        c.fill();

        c.strokeStyle = `rgba(213, 221, 226, ${alpha * 0.4})`;
        c.lineWidth = 2 + Math.random() * 2;
        c.stroke();

        c.fillStyle = `rgba(147, 160, 172, ${0.06 + state.rain * 0.0008})`;
        c.beginPath();
        c.moveTo(nearX - nearW / 2, nearY);
        c.lineTo(nearX + nearW / 2, nearY);
        c.lineTo(farX + farW / 2, farY);
        c.lineTo(farX - farW / 2, farY);
        c.closePath();
        c.fill();
    }

    c.restore();
}

function drawStreetLights(c) {
    const parallax = (state.mouseX - 0.5) * 90 * (0.25 + state.focalDepth * 0.75);
    c.save();
    c.translate(parallax, 0);

    const roadY = height * 0.62, roadH = height - roadY;
    const lightMult = state.light / 100;
    const rainScatter = state.rain / 100;
    const slLen = streetLights.length;

    for (let i = 0; i < slLen; i++) {
        const l = streetLights[i];
        const lampX = l.x + 28, lampY = roadY - l.h + 8;

        c.strokeStyle = PALETTE.signalGray;
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(l.x, roadY);
        c.lineTo(l.x, roadY - l.h);
        c.stroke();

        c.beginPath();
        c.moveTo(l.x, roadY - l.h);
        c.lineTo(l.x + 28, roadY - l.h + 8);
        c.stroke();

        c.fillStyle = PALETTE.stripeWhite;
        c.globalAlpha = 0.9 * lightMult;
        c.beginPath();
        c.arc(lampX, lampY, 3.5, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 1;

        const coneWidth = 50 + rainScatter * 35, coneHeight = l.h * 0.88;
        const coneGrad = c.createRadialGradient(
            lampX, lampY, 0,
            lampX, lampY + coneHeight * 0.5, coneWidth * 1.8
        );
        coneGrad.addColorStop(0, `rgba(213, 221, 226, ${0.14 * lightMult})`);
        coneGrad.addColorStop(0.4, `rgba(147, 160, 172, ${0.07 * lightMult * (1 + rainScatter * 0.4)})`);
        coneGrad.addColorStop(1, 'rgba(147, 160, 172, 0)');
        c.fillStyle = coneGrad;
        c.beginPath();
        c.moveTo(lampX - 3, lampY);
        c.lineTo(lampX + 3, lampY);
        c.lineTo(lampX + coneWidth, lampY + coneHeight);
        c.lineTo(lampX - coneWidth, lampY + coneHeight);
        c.closePath();
        c.fill();

        if (state.rain > 35 && state.light > 25 && state.quality !== 'low') {
            const rayAlpha = (state.rain / 100) * (state.light / 100) * 0.1;
            const rayCount = state.quality === 'high' ? 10 : 6;
            c.save();
            c.globalCompositeOperation = 'screen';
            for (let j = 0; j < rayCount; j++) {
                const angle = (j / rayCount) * Math.PI * 0.5 - Math.PI * 0.25;
                const rayLen = coneHeight * (0.6 + Math.random() * 0.45);
                const rx = lampX + Math.sin(angle) * rayLen * 0.3;
                const ry = lampY + Math.cos(angle) * rayLen;
                const rGrad = c.createLinearGradient(lampX, lampY, rx, ry);
                rGrad.addColorStop(0, `rgba(147, 160, 172, ${rayAlpha * (0.8 + Math.random() * 0.4)})`);
                rGrad.addColorStop(1, 'rgba(147, 160, 172, 0)');
                c.strokeStyle = rGrad;
                c.lineWidth = 0.8 + Math.random() * 1.8;
                c.beginPath();
                c.moveTo(lampX, lampY);
                c.lineTo(rx, ry);
                c.stroke();
            }
            c.restore();
        }

        const glowR = (24 + state.rain * 0.45) * lightMult;
        const glowColor = l.color || PALETTE.roadSmoke;
        const rgb = hexToRgbStr(glowColor);
        for (let b = 0; b < 3; b++) {
            const br = glowR * (2.5 + b * 1.5);
            const ba = (0.2 - b * 0.06) * lightMult;
            const gGrad = c.createRadialGradient(lampX, lampY, 0, lampX, lampY, br);
            gGrad.addColorStop(0, `rgba(${rgb}, ${ba})`);
            gGrad.addColorStop(1, `rgba(${rgb}, 0)`);
            c.fillStyle = gGrad;
            c.fillRect(lampX - br, lampY - br, br * 2, br * 2);
        }

        const spotX = lampX, spotY = roadY + 32;
        const spotW = 20 + rainScatter * 10, spotH = 75 + rainScatter * 30;
        const spotGrad = c.createRadialGradient(spotX, spotY, 0, spotX, spotY, Math.max(spotW, spotH) * 1.2);
        spotGrad.addColorStop(0, `rgba(213, 221, 226, ${0.1 * lightMult})`);
        spotGrad.addColorStop(0.45, `rgba(147, 160, 172, ${0.05 * lightMult})`);
        spotGrad.addColorStop(1, 'rgba(147, 160, 172, 0)');
        c.fillStyle = spotGrad;
        c.beginPath();
        c.ellipse(spotX, spotY, spotW, spotH, 0, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = `rgba(147, 160, 172, ${0.03 * lightMult})`;
        c.beginPath();
        c.ellipse(spotX, spotY, spotW * 2, spotH * 1.5, 0, 0, Math.PI * 2);
        c.fill();
    }

    const tlX = width * 0.72, tlY = roadY - 75;
    c.fillStyle = PALETTE.wetAsphalt;
    c.fillRect(tlX, tlY, 10, 55);
    c.fillStyle = `rgba(147, 160, 172, ${0.35 * lightMult})`;
    c.beginPath();
    c.arc(tlX + 5, tlY + 12, 2.5, 0, Math.PI * 2);
    c.fill();

    c.shadowColor = PALETTE.roadSmoke;
    c.shadowBlur = 4 * lightMult;
    c.fillStyle = `rgba(147, 160, 172, ${0.15 * lightMult})`;
    c.beginPath();
    c.arc(tlX + 5, tlY + 12, 6, 0, Math.PI * 2);
    c.fill();
    c.shadowBlur = 0;

    c.restore();
}

// ========== 水洼反射 ==========
function drawPuddle() {
    const puddleY = height * 0.76, puddleH = height - puddleY;

    if (state.quality === 'low') {
        const grad = ctx.createLinearGradient(0, puddleY, 0, height);
        grad.addColorStop(0, 'rgba(63, 76, 89, 0.55)');
        grad.addColorStop(0.5, 'rgba(103, 119, 137, 0.35)');
        grad.addColorStop(1, 'rgba(147, 160, 172, 0.15)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, puddleY, width, puddleH);

        const lightMult = state.light / 100;
        ctx.fillStyle = `rgba(213, 221, 226, ${0.04 * lightMult})`;
        const slLen = streetLights.length;
        for (let i = 0; i < slLen; i++) {
            ctx.fillRect(streetLights[i].x + 28 - 8, puddleY + 10, 16, puddleH - 20);
        }
    } else {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, puddleY, width, puddleH);
        ctx.clip();

        const puddleParallax = (state.mouseX - 0.5) * 160 * (0.25 + state.focalDepth * 0.75);
        const step = state.quality === 'high' ? 5 : 10;
        const actualStep = Math.min(step, Math.max(3, puddleH / 20));

        let totalAmp = 0;
        const ripplesLen = ripples.length;
        for (let i = 0; i < ripplesLen; i++) {
            const r = ripples[i];
            totalAmp += r.strength * (1 - r.age / r.maxAge);
        }

        const blurPx = Math.min(2.8, totalAmp * 0.22);
        const useBlur = blurPx > 0.4 && state.quality !== 'low';
        const time = Date.now() * 0.001;

        for (let y = 0; y < puddleH; y += actualStep) {
            const worldY = puddleY + y;
            let offsetX = puddleParallax * 0.3;

            for (let i = 0; i < ripplesLen; i++) {
                const r = ripples[i];
                const dy = worldY - r.y, dist = Math.abs(dy);
                if (dist < r.radius) {
                    const factor = 1 - dist / r.radius;
                    const wave = Math.sin(factor * Math.PI * 2 - r.age * 0.15) * r.strength * 5;
                    const disp = wave * factor * (1 - r.age / r.maxAge);
                    offsetX += disp;
                }
            }

            offsetX += Math.sin(worldY * 0.04 + time * 1.5) * 1.2;
            offsetX += Math.sin(worldY * 0.07 - time * 0.8) * 0.6;

            const sourceY = height - puddleY - y - actualStep;
            if (sourceY >= 0 && sourceY < puddleY) {
                if (useBlur) ctx.filter = `blur(${blurPx}px)`;
                ctx.drawImage(worldCanvas, 0, sourceY, width, actualStep, offsetX, worldY, width, actualStep);

                if (state.quality === 'high') {
                    const shift = 1.5 + totalAmp * 0.15;
                    ctx.save();
                    ctx.globalAlpha = 0.035;
                    ctx.drawImage(worldCanvas, 0, sourceY, width, actualStep, offsetX + shift, worldY, width, actualStep);
                    ctx.globalAlpha = 0.025;
                    ctx.drawImage(worldCanvas, 0, sourceY, width, actualStep, offsetX - shift, worldY, width, actualStep);
                    ctx.restore();
                }

                if (useBlur) ctx.filter = 'none';
            }
        }

        ctx.fillStyle = 'rgba(63, 76, 89, 0.22)';
        ctx.fillRect(0, puddleY, width, puddleH);
        ctx.restore();
    }

    const ripplesLen = ripples.length;
    for (let i = 0; i < ripplesLen; i++) {
        ripples[i].draw(ctx);
    }
}

function drawFog() {
    const density = state.rain / 100;
    if (density < 0.05) return;

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(147, 160, 172, 0)');
    grad.addColorStop(0.4, `rgba(147, 160, 172, ${density * 0.08})`);
    grad.addColorStop(1, `rgba(147, 160, 172, ${density * 0.18})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    if (state.quality !== 'low') {
        const t = Date.now() * 0.0004;
        const windShift = state.wind ? Math.sin(t) * 60 : 0;

        const fogGrad = (fx, fy, fr, a) => {
            const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
            g.addColorStop(0, `rgba(160, 175, 190, ${a})`);
            g.addColorStop(1, 'rgba(160, 175, 190, 0)');
            ctx.fillStyle = g;
        };

        fogGrad(width * 0.25 + windShift, height * 0.35, 90 + Math.sin(t * 2) * 15, density * 0.06);
        ctx.beginPath();
        ctx.arc(width * 0.25 + windShift, height * 0.35, 90 + Math.sin(t * 2) * 15, 0, Math.PI * 2);
        ctx.fill();

        fogGrad(width * 0.65 + windShift * 0.6, height * 0.42, 110, density * 0.05);
        ctx.beginPath();
        ctx.arc(width * 0.65 + windShift * 0.6, height * 0.42, 110, 0, Math.PI * 2);
        ctx.fill();

        fogGrad(width * 0.85 - windShift * 0.3, height * 0.55, 80, density * 0.04);
        ctx.beginPath();
        ctx.arc(width * 0.85 - windShift * 0.3, height * 0.55, 80, 0, Math.PI * 2);
        ctx.fill();
    }
}

function triggerLightning() {
    state.lightningFlash = 0.4 + Math.random() * 0.6;
    state.lightningX = Math.random() * width * 0.8 + width * 0.1;
}

function drawLightning() {
    if (state.lightningFlash <= 0.01) return;

    const flash = state.lightningFlash;
    ctx.fillStyle = `rgba(238, 242, 244, ${flash * 0.55})`;
    ctx.fillRect(0, 0, width, height);

    if (flash > 0.5) {
        ctx.strokeStyle = `rgba(238, 242, 244, ${flash * 0.9})`;
        ctx.lineWidth = 1.5 + Math.random() * 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        let lx = state.lightningX, ly = 0;
        ctx.moveTo(lx, ly);
        while (ly < height * 0.55) {
            lx += (Math.random() - 0.5) * 50;
            ly += 8 + Math.random() * 18;
            ctx.lineTo(lx, ly);
        }
        ctx.stroke();

        if (Math.random() > 0.5) {
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            let bx = lx, by = ly;
            for (let i = 0; i < 4; i++) {
                bx += (Math.random() - 0.5) * 40;
                by += 10 + Math.random() * 15;
                ctx.lineTo(bx, by);
            }
            ctx.stroke();
        }
    }
}

function drawVignette() {
    const cx = width * 0.52, cy = height * 0.48;
    const grad = ctx.createRadialGradient(cx, cy, height * 0.28, cx, cy, height * 0.95);
    grad.addColorStop(0, 'rgba(10, 15, 20, 0)');
    grad.addColorStop(0.6, 'rgba(10, 15, 20, 0.08)');
    grad.addColorStop(1, 'rgba(10, 15, 20, 0.22)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
}

function drawFilmGrain() {
    if (!noiseCanvas) return;
    ctx.save();
    ctx.globalAlpha = 0.04 + Math.random() * 0.02;
    const pattern = ctx.createPattern(noiseCanvas, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
}

function updateTimeDisplay() {
    const el = document.getElementById('timeDisplay');
    if (!state.showTime) {
        el.classList.add('hidden');
        return;
    }
    el.classList.remove('hidden');
    const now = state.time;
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const month = now.getMonth() + 1, day = now.getDate();
    let period;
    const hour = now.getHours();
    if (hour < 6) period = '凌晨';
    else if (hour < 12) period = '上午';
    else if (hour < 18) period = '下午';
    else period = '晚上';
    el.textContent = `${h}:${m} · ${month}月${day}日 ${period}`;
}

// ========== 尺寸调整 ==========
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    if (state.quality !== 'low') {
        worldCanvas = document.createElement('canvas');
        worldCanvas.width = width;
        worldCanvas.height = height;
        worldCtx = worldCanvas.getContext('2d', { alpha: false });
    } else {
        worldCanvas = null;
        worldCtx = null;
    }

    generateAllBuildings();
    generateClouds();
    generateStars();
    initRain();

    draggableObjects.length = 0;
    for (let i = 0; i < 5; i++) draggableObjects.push(new DraggableObject());

    lensDrops.length = 0;
    const dropCount = Math.floor(10 + state.rain / 100 * 30);
    for (let i = 0; i < dropCount; i++) lensDrops.push(new LensDrop());

    generateNoise();
}

function generateAllBuildings() {
    allBuildings.length = 0;
    streetLights.length = 0;
    neons.length = 0;

    let x = -150;
    for (let i = 0; i < Math.floor(width / 45) + 8; i++) {
        const w = 30 + Math.random() * 70;
        const h = height * 0.2 + Math.random() * height * 0.35;
        const y = height * 0.48 - h * 0.2;
        allBuildings.push(generateRuinedBuilding(x, y, w, h, PALETTE.wetAsphalt, 'far'));
        x += w + Math.random() * 12 - 4;
    }

    x = -100;
    for (let i = 0; i < Math.floor(width / 55) + 5; i++) {
        const w = 40 + Math.random() * 85;
        const h = height * 0.22 + Math.random() * height * 0.38;
        const y = height * 0.52 - h * 0.25;
        allBuildings.push(generateRuinedBuilding(x, y, w, h, PALETTE.signalGray, 'mid'));
        x += w + Math.random() * 18 - 6;
    }

    x = -80;
    for (let i = 0; i < Math.floor(width / 70) + 3; i++) {
        const w = 50 + Math.random() * 100;
        const h = height * 0.18 + Math.random() * height * 0.28;
        const y = height * 0.56 - h * 0.15;
        allBuildings.push(generateRuinedBuilding(x, y, w, h, PALETTE.roadSmoke, 'near'));
        x += w + Math.random() * 25 - 8;
    }

    const lc = Math.floor(width / 180) + 2;
    for (let i = 0; i < lc; i++) {
        streetLights.push({
            x: i * 180 + 80 + Math.random() * 60,
            h: height * 0.22 + Math.random() * 40,
            intensity: 0.4 + Math.random() * 0.6,
            color: LIGHT_PALETTE[Math.floor(Math.random() * LIGHT_PALETTE.length)]
        });
    }

    const nc = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < nc; i++) {
        neons.push({
            x: Math.random() * width,
            y: height * 0.28 + Math.random() * height * 0.22,
            w: 50 + Math.random() * 120,
            color: LIGHT_PALETTE[Math.floor(Math.random() * LIGHT_PALETTE.length)],
            phase: Math.random() * Math.PI * 2
        });
    }
}

// ========== UI ==========
function setupUI() {
    const rainSlider = document.getElementById('rainSlider');
    rainSlider.addEventListener('input', e => {
        state.rain = parseInt(e.target.value);
        document.getElementById('rainVal').textContent = state.rain + '%';
        initRain();
        const targetDrops = Math.floor(10 + state.rain / 100 * 30);
        while (lensDrops.length < targetDrops) lensDrops.push(new LensDrop());
        while (lensDrops.length > targetDrops) lensDrops.pop();
    });

    const lightSlider = document.getElementById('lightSlider');
    lightSlider.addEventListener('input', e => {
        state.light = parseInt(e.target.value);
        document.getElementById('lightVal').textContent = state.light + '%';
    });

    const windSlider = document.getElementById('windSlider');
    windSlider.addEventListener('input', e => {
        state.windForce = parseInt(e.target.value);
        document.getElementById('windVal').textContent = state.windForce + '%';
    });

    const windToggle = document.getElementById('windToggle');
    windToggle.addEventListener('click', () => {
        state.wind = !state.wind;
        windToggle.classList.toggle('active', state.wind);
        document.getElementById('windStatus').textContent = state.wind ? 'On' : 'Off';
    });

    const lightningToggle = document.getElementById('lightningToggle');
    lightningToggle.addEventListener('click', () => {
        state.lightning = !state.lightning;
        lightningToggle.classList.toggle('active', state.lightning);
        document.getElementById('lightningStatus').textContent = state.lightning ? 'On' : 'Off';
    });

    const autoToggle = document.getElementById('autoDayNightToggle');
    autoToggle.addEventListener('click', () => {
        state.autoDayNight = !state.autoDayNight;
        autoToggle.classList.toggle('active', state.autoDayNight);
        document.getElementById('autoStatus').textContent = state.autoDayNight ? 'On' : 'Off';
    });

    document.getElementById('manualDayNightBtn').addEventListener('click', () => {
        if (!state.autoDayNight) {
            state.isDay = !state.isDay;
            state.dayNightCycle = state.isDay ? 0.5 : 0;
        }
    });

    document.querySelectorAll('.quality-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.quality = btn.dataset.q;
            resize();
        });
    });

    const timeToggle = document.getElementById('timeToggle');
    timeToggle.addEventListener('click', () => {
        state.showTime = !state.showTime;
        timeToggle.classList.toggle('active', state.showTime);
        document.getElementById('timeStatus').textContent = state.showTime ? 'On' : 'Off';
    });

    const menu = document.getElementById('menu');
    const menuToggle = document.getElementById('menuToggle');
    menuToggle.addEventListener('click', () => {
        state.menuCollapsed = !state.menuCollapsed;
        menu.classList.toggle('collapsed', state.menuCollapsed);
        menuToggle.textContent = state.menuCollapsed ? '≡' : '×';
    });
}

// ========== 交互 ==========
function setupInteractions() {
    window.addEventListener('resize', resize);

    window.addEventListener('mousemove', e => {
        const now = Date.now();
        const dt = now - state.lastMouseTime;
        if (dt > 0 && dt < 100) {
            const dx = e.clientX - state.lastMouseX, dy = e.clientY - state.lastMouseY;
            const speed = Math.sqrt(dx * dx + dy * dy) / dt * 1000;
            if (speed > 500) {
                turbulenceFields.push({
                    x: e.clientX, y: e.clientY,
                    vx: dx / dt * 1000, vy: dy / dt * 1000,
                    radius: Math.min(160, 40 + speed * 0.18),
                    strength: Math.min(1, (speed - 500) / 2500),
                    born: now, life: 300 + Math.random() * 500
                });
            }
        }
        state.lastMouseX = e.clientX;
        state.lastMouseY = e.clientY;
        state.lastMouseTime = now;
        state.mouseX = e.clientX / width;
        state.mouseY = e.clientY / height;

        if (state.isDragging && state.draggedObject) {
            state.draggedObject.x = e.clientX - state.dragOffsetX;
            state.draggedObject.y = e.clientY - state.dragOffsetY;
            state.draggedObject.vx = (e.clientX - state.draggedObject.lastX) / Math.max(1, dt) * 1000;
            state.draggedObject.vy = (e.clientY - state.draggedObject.lastY) / Math.max(1, dt) * 1000;
            state.draggedObject.lastX = e.clientX;
            state.draggedObject.lastY = e.clientY;
            state.draggedObject.rotation += state.draggedObject.vx * 0.0005;
        }

        const puddleY = height * 0.76;
        if (e.clientY > puddleY && now - lastRippleTime > 100) {
            ripples.push(new Ripple(e.clientX, e.clientY, 0.7, 'rain'));
            lastRippleTime = now;
        }
    });

    canvas.addEventListener('mousedown', e => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        for (let i = draggableObjects.length - 1; i >= 0; i--) {
            const obj = draggableObjects[i];
            const bounds = obj.getBounds();
            if (mx >= bounds.x && mx <= bounds.x + bounds.w && my >= bounds.y && my <= bounds.y + bounds.h) {
                state.isDragging = true;
                state.draggedObject = obj;
                obj.dragging = true;
                state.dragOffsetX = mx - obj.x;
                state.dragOffsetY = my - obj.y;
                obj.lastX = mx;
                obj.lastY = my;
                obj.vx = 0;
                obj.vy = 0;
                obj.slideTimer = 0;
                break;
            }
        }
    });

    window.addEventListener('mouseup', () => {
        if (state.isDragging && state.draggedObject) {
            const obj = state.draggedObject;
            obj.dragging = false;
            obj.slideTimer = 200 + Math.random() * 400;
            obj.rotVel = obj.vx * 0.001;
            state.isDragging = false;
            state.draggedObject = null;
        }
    });

    window.addEventListener('wheel', e => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.06 : -0.06;
        state.targetFocalDepth = Math.max(0, Math.min(1, state.targetFocalDepth + delta));
    }, { passive: false });

    window.addEventListener('touchmove', e => {
        const t = e.touches[0];
        state.mouseX = t.clientX / width;
        state.mouseY = t.clientY / height;
        const puddleY = height * 0.76;
        const now = Date.now();
        if (t.clientY > puddleY && now - lastRippleTime > 120) {
            ripples.push(new Ripple(t.clientX, t.clientY, 0.6, 'rain'));
            lastRippleTime = now;
        }
    }, { passive: true });

    canvas.addEventListener('click', e => {
        const puddleY = height * 0.76;
        if (e.clientY > puddleY) {
            const centerY = puddleY + (height - puddleY) / 2;
            const centerDist = Math.abs(e.clientY - centerY) / ((height - puddleY) / 2);
            const strength = 1 + centerDist * 1.5;
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    ripples.push(new Ripple(e.clientX, e.clientY, strength * (1 - i * 0.22), 'click'));
                }, i * 90);
            }
        }
    });
}

// 标签页隐藏时暂停渲染，节省 CPU/GPU
let isVisible = true;
document.addEventListener('visibilitychange', () => {
    isVisible = !document.hidden;
});

// ========== 主循环 ==========
function loop(timestamp) {
    requestAnimationFrame(loop);
    if (!isVisible) return;

    const dt = timestamp - lastTime;
    lastTime = timestamp;
    state.time = new Date();

    if (state.autoDayNight) state.dayNightCycle = (timestamp / 1000 / 60) % 1;
    state.focalDepth += (state.targetFocalDepth - state.focalDepth) * 0.06;

    if (state.lightning && Math.random() < 0.004) triggerLightning();
    if (state.lightningFlash > 0) {
        state.lightningFlash *= 0.88;
        if (state.lightningFlash < 0.005) state.lightningFlash = 0;
    }

    updateRain();

    for (let i = ripples.length - 1; i >= 0; i--) {
        if (!ripples[i].update()) ripples.splice(i, 1);
    }
    if (ripples.length > 120) ripples.splice(0, ripples.length - 120);

    const now = Date.now();
    for (let i = turbulenceFields.length - 1; i >= 0; i--) {
        if (now - turbulenceFields[i].born > turbulenceFields[i].life) turbulenceFields.splice(i, 1);
    }

    if (state.wind && Math.random() < 0.008) debris.push(new Debris());
    for (let i = debris.length - 1; i >= 0; i--) {
        if (!debris[i].update()) debris.splice(i, 1);
    }
    if (debris.length > 30) debris.splice(0, debris.length - 30);

    lensDrops.forEach(d => d.update());
    draggableObjects.forEach(o => o.update());

    // 渲染世界（离屏）
    if (state.quality !== 'low' && worldCtx) {
        worldCtx.clearRect(0, 0, width, height);
        drawSky(worldCtx);
        const bLen = allBuildings.length;
        for (let i = 0; i < bLen; i++) {
            const b = allBuildings[i];
            const factor = b.layer === 'far' ? 30 : b.layer === 'mid' ? 65 : 110;
            drawBuilding(worldCtx, b, factor);
        }
        drawNeons(worldCtx);
        drawMidground(worldCtx);
        drawStreetLights(worldCtx);
    }

    if (state.quality === 'low') {
        drawSky(ctx);
        const bLen = allBuildings.length;
        for (let i = 0; i < bLen; i++) {
            const b = allBuildings[i];
            const factor = b.layer === 'far' ? 30 : b.layer === 'mid' ? 65 : 110;
            drawBuilding(ctx, b, factor);
        }
        drawNeons(ctx);
        drawMidground(ctx);
        drawStreetLights(ctx);
    } else {
        ctx.drawImage(worldCanvas, 0, 0);
    }

    debris.forEach(d => d.draw(ctx));
    draggableObjects.forEach(o => o.draw(ctx));
    drawPuddle();
    drawRain();
    drawFog();
    drawLightning();
    drawVignette();
    if (state.quality !== 'low') drawFilmGrain();
    if (state.quality !== 'low') lensDrops.forEach(d => d.draw(ctx));
    updateTimeDisplay();
}

// ========== 启动 ==========
function init() {
    resize();
    setupUI();
    setupInteractions();
    requestAnimationFrame(loop);
}
init();