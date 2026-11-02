// Camera, particles, floating text, shockwaves, attack slashes

// --- CAMERA SYSTEM ---
const camera = {
    x: 0,
    y: 0,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    // Eases toward the player and looks a little ahead in the facing direction
    follow(target, worldWidth, dt) {
        const lookAhead = target.facing === 'right' ? 60 : -60;
        const goal = target.x + target.width / 2 - this.width / 2 + lookAhead;
        this.x += (goal - this.x) * Math.min(1, dt * 6);
        this.clamp(worldWidth);
    },
    snapTo(target, worldWidth) {
        this.x = target.x + target.width / 2 - this.width / 2;
        this.clamp(worldWidth);
    },
    clamp(worldWidth) {
        if (this.x < 0) this.x = 0;
        if (this.x > worldWidth - this.width) this.x = worldWidth - this.width;
    }
};

// --- PARTICLE SYSTEM ---
class Particle {
    constructor(x, y, vx, vy, color, size, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.maxLife = life;
        this.life = life;
    }

    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2;
        this.life -= dt;
    }

    draw(ctx, camX) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = this.color;
        // Square "pixels" to match the art style
        ctx.fillRect(snap(this.x - camX - this.size / 2), snap(this.y - this.size / 2), this.size, this.size);
        ctx.restore();
    }
}

let particles = [];

function createHitSparks(x, y, color = '#f43f5e', count = 12) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        particles.push(new Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed - 2,
            color,
            Math.random() * 3 + 2,
            Math.random() * 0.3 + 0.2
        ));
    }
}

// --- AMBIENT PARTICLES (fireflies / embers / wisps, screen space) ---
const AMBIENT_COLORS = { firefly: '#d9f99d', ember: '#fb923c', wisp: '#c4b5fd', bubble: '#bae6fd', sparkle: '#fef08a' };
let ambient = [];
let ambientType = 'firefly';

function spawnAmbient(type) {
    const a = {
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        t: Math.random() * 10,
        size: Math.random() < 0.3 ? 3 : 2,
        depth: 0.3 + Math.random() * 0.7
    };
    if (type === 'ember') {
        a.vx = (Math.random() - 0.5) * 20;
        a.vy = -(30 + Math.random() * 50);
    } else if (type === 'firefly') {
        a.vx = (Math.random() - 0.5) * 16;
        a.vy = (Math.random() - 0.5) * 16;
    } else if (type === 'bubble') {
        a.vx = (Math.random() - 0.5) * 6;
        a.vy = -(25 + Math.random() * 45);
        a.size = 2 + Math.floor(Math.random() * 3);
    } else {
        a.vx = (Math.random() - 0.5) * 10;
        a.vy = -(6 + Math.random() * 12);
    }
    return a;
}

function resetAmbient(type) {
    ambientType = type;
    ambient = [];
    for (let i = 0; i < 45; i++) ambient.push(spawnAmbient(type));
}

function updateAmbient(dt) {
    for (const a of ambient) {
        a.t += dt;
        a.x += (a.vx + Math.sin(a.t * 1.3) * 8) * dt;
        a.y += a.vy * dt;
        if (a.y < -10) a.y = GAME_HEIGHT + 10;
        if (a.y > GAME_HEIGHT + 10) a.y = -10;
    }
}

function drawAmbient(ctx, camX) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = AMBIENT_COLORS[ambientType];
    for (const a of ambient) {
        const x = (((a.x - camX * a.depth * 0.6) % GAME_WIDTH) + GAME_WIDTH) % GAME_WIDTH;
        if (ambientType === 'bubble') {
            // hollow square bubbles with a highlight pixel
            const s = a.size * 2;
            ctx.globalAlpha = 0.5 * a.depth;
            ctx.strokeStyle = AMBIENT_COLORS.bubble;
            ctx.lineWidth = 1;
            ctx.strokeRect(snap(x), snap(a.y), s, s);
            ctx.fillRect(snap(x + 1), snap(a.y + 1), 1, 1);
            continue;
        }
        const flicker = 0.35 + 0.65 * Math.abs(Math.sin(a.t * 2.2));
        ctx.globalAlpha = flicker * 0.25 * a.depth;
        ctx.fillRect(snap(x - a.size), snap(a.y - a.size), a.size * 3, a.size * 3);
        ctx.globalAlpha = flicker * a.depth;
        ctx.fillRect(snap(x), snap(a.y), a.size, a.size);
    }
    ctx.restore();
}

// --- FLOATING TEXT SYSTEM ---
class FloatingText {
    constructor(text, x, y, color = '#ffffff', fontSize = 16) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.color = color;
        this.fontSize = fontSize;
        this.life = 0.8;
        this.vy = -2;
    }

    update(dt) {
        this.y += this.vy;
        this.life -= dt;
    }

    draw(ctx, camX) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / 0.8);
        ctx.font = `bold ${this.fontSize}px 'Press Start 2P', monospace`;
        ctx.fillStyle = this.color;
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(this.text, this.x - camX, this.y);
        ctx.restore();
    }
}

let floatingTexts = [];

function overlaps(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

// --- SHOCKWAVES (ground rings from slams) ---
let shockwaves = [];

function updateShockwaves(dt) {
    for (const s of shockwaves) s.life -= dt;
    shockwaves = shockwaves.filter(s => s.life > 0);
}

function drawShockwaves(ctx, camX) {
    for (const s of shockwaves) {
        const progress = 1 - s.life / s.maxLife;
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 6 * (1 - progress) + 2;
        ctx.beginPath();
        ctx.ellipse(s.x - camX, s.y, 20 + progress * s.radius, 6 + progress * 14, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

function addShockwave(x, y, radius, color) {
    shockwaves.push({ x, y, radius, color, life: 0.4, maxLife: 0.4 });
}

// --- BASIC ATTACK SLASHES ---
// Drawn from the attacker's swing state and sized to its hit box, so the arc shows exactly what a swing reaches
const SLASH_STYLE = {
    wukong: { edge: '#fffbeb', body: '#fde047', glow: 'rgba(245, 158, 11, 0.45)', spark: '#fde047' },
    bajie:  { edge: '#fff7ed', body: '#fdba74', glow: 'rgba(194, 65, 12, 0.45)', spark: '#fb923c', claws: true },
    sha:    { edge: '#ecfeff', body: '#67e8f9', glow: 'rgba(8, 145, 178, 0.45)', spark: '#a5f3fc' },
    nezha:  { edge: '#fff7ed', body: '#fb923c', glow: 'rgba(239, 68, 68, 0.5)', spark: '#f97316' },
    tang:   { edge: '#ffffff', body: '#fef3c7', glow: 'rgba(251, 191, 36, 0.4)', spark: '#fde68a' }
};
// Per combo step: sweep from/to (degrees, 0 = straight ahead, negative = up) and blade thickness
const SLASH_ARCS = {
    1: { from: -75, to: 45, w: 0.5 },
    2: { from: 60, to: -60, w: 0.45 },
    3: { from: -115, to: 75, w: 0.6 }
};
const SLASH_SQUASH = 0.6; // arcs are flattened to the hit box height

function slashReach(p) {
    return p.width / 2 + (p.char.attack.reach[p.attackCombo] || 75);
}

function drawSlash(ctx, p, camX) {
    if (!(p.attackTimer > 0) || !p.attackDuration || p.isDead) return;
    const style = SLASH_STYLE[p.charId] || SLASH_STYLE.wukong;
    const arc = SLASH_ARCS[p.attackCombo] || SLASH_ARCS[1];
    const t = 1 - p.attackTimer / p.attackDuration;
    const head = 1 - (1 - Math.min(1, t / 0.45)) ** 3;      // blade tip races ahead (ease-out)
    const tail = Math.max(0, (t - 0.2) / 0.8) ** 1.5;       // the trail follows and closes up
    const a0 = arc.from * Math.PI / 180, a1 = arc.to * Math.PI / 180;
    const aHead = a0 + (a1 - a0) * head, aTail = a0 + (a1 - a0) * tail;
    if (Math.abs(aHead - aTail) < 0.05) return;

    const R = slashReach(p), thick = R * arc.w;
    const N = 18;
    ctx.save();
    ctx.translate(p.x + p.width / 2 - camX, p.y + 28);
    ctx.scale(p.facing === 'right' ? 1 : -1, SLASH_SQUASH);
    ctx.globalAlpha = Math.min(1, (1 - t) * 2.5);
    // Crescent: outer edge at full reach, inner edge tapering to a point at the tail
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
        const a = aTail + (aHead - aTail) * (i / N);
        ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R);
    }
    for (let i = N; i >= 0; i--) {
        const a = aTail + (aHead - aTail) * (i / N);
        const r = R - thick * Math.pow(i / N, 0.7);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.shadowColor = style.glow;
    ctx.shadowBlur = p.attackCombo === 3 ? 22 : 14;
    // Solid at the cutting edge, fading out toward the wielder
    const fade = ctx.createRadialGradient(0, 0, R - thick, 0, 0, R);
    fade.addColorStop(0, style.body + '00');
    fade.addColorStop(0.55, style.body + '73');
    fade.addColorStop(1, style.body + 'f2');
    ctx.fillStyle = fade;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Bright cutting edge
    ctx.strokeStyle = style.edge;
    ctx.lineWidth = p.attackCombo === 3 ? 5 : 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, R, Math.min(aTail, aHead), Math.max(aTail, aHead));
    ctx.stroke();
    // Bát Giới's rake leaves claw marks through the blade
    if (style.claws) {
        ctx.strokeStyle = 'rgba(124, 45, 18, 0.7)';
        ctx.lineWidth = 2;
        for (const k of [0.35, 0.65]) {
            ctx.beginPath();
            ctx.arc(0, 0, R - thick * k, Math.min(aTail, aHead), Math.max(aTail, aHead));
            ctx.stroke();
        }
    }
    ctx.restore();
}

// Sparks thrown off the blade tip when a swing starts
function slashSparks(p) {
    const style = SLASH_STYLE[p.charId] || SLASH_STYLE.wukong;
    const dir = p.facing === 'right' ? 1 : -1;
    const x = p.x + p.width / 2 + dir * slashReach(p) * 0.9;
    for (let i = 0; i < (p.attackCombo === 3 ? 8 : 4); i++) {
        particles.push(new Particle(x, p.y + 28 + (Math.random() - 0.5) * 40,
            dir * (2 + Math.random() * 3), -1 - Math.random() * 2, style.spark, 3, 0.25));
    }
}

// Star-shaped flash where a swing connects
let impacts = [];

function addImpact(attacker, target) {
    const style = SLASH_STYLE[attacker.charId] || SLASH_STYLE.wukong;
    const big = attacker.attackCombo === 3;
    const fromRight = attacker.x > target.x;
    const x = fromRight ? target.x + target.width * 0.75 : target.x + target.width * 0.25;
    const y = Math.max(target.y + 8, Math.min(attacker.y + 28, target.y + target.height - 8));
    impacts.push({ x, y, color: style.spark, size: big ? 46 : 30, rot: Math.random() * Math.PI, life: 0.16, maxLife: 0.16 });
    createHitSparks(x, y, style.spark, big ? 14 : 7);
    if (big) addShake(5);
}

function updateImpacts(dt) {
    for (const s of impacts) s.life -= dt;
    impacts = impacts.filter(s => s.life > 0);
}

function drawImpacts(ctx, camX) {
    for (const s of impacts) {
        const k = s.life / s.maxLife;
        const r = s.size * (1.25 - k * 0.5);
        ctx.save();
        ctx.translate(s.x - camX, s.y);
        ctx.rotate(s.rot);
        ctx.globalAlpha = k;
        // Two crossed spikes: coloured outer, white core
        for (const [color, w] of [[s.color, 0.22], ['#ffffff', 0.1]]) {
            ctx.fillStyle = color;
            for (let i = 0; i < 4; i++) {
                ctx.rotate(Math.PI / 2);
                ctx.beginPath();
                ctx.moveTo(0, -r * w);
                ctx.lineTo(i % 2 ? r * 0.6 : r, 0);
                ctx.lineTo(0, r * w);
                ctx.fill();
            }
        }
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}
