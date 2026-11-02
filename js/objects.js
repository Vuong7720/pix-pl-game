// Pickups, chests, checkpoints, projectiles, hazards, webs

// --- PICKUPS (Đào Tiên) ---
class Pickup {
    // popped = thrown out of a chest/enemy and falls to the ground; otherwise floats in place
    constructor(x, y, popped = false) {
        this.x = x;
        this.y = y; // bottom of the sprite
        this.vx = popped ? (Math.random() - 0.5) * 5 : 0;
        this.vy = popped ? -5 - Math.random() * 3 : 0;
        this.falling = popped;
        this.t = Math.random() * 6;
        this.collected = false;
        this.width = 9 * PEACH_SCALE;
        this.height = 9 * PEACH_SCALE;
    }

    update(dt, player, platforms) {
        this.t += dt;
        if (this.falling) {
            this.vy += 0.4;
            this.x += this.vx;
            const prevY = this.y;
            this.y += this.vy;
            for (const p of platforms) {
                if (this.x > p.x && this.x < p.x + p.w && prevY <= p.y && this.y >= p.y) {
                    this.y = p.y;
                    this.falling = false;
                }
            }
            if (this.y > GAME_HEIGHT + 50) this.collected = true;
        }

        const box = { x: this.x - this.width / 2, y: this.y - this.height, width: this.width, height: this.height };
        if (!player.isDead && overlaps(player, box)) this.collect(player);
    }

    collect(player) {
        this.collected = true;
        save.peaches++;
        runPeaches++;
        score += 50;
        player.hp = Math.min(player.maxHp, player.hp + 10);
        playSound('pickup');
        floatingTexts.push(new FloatingText('+10', this.x - 10, this.y - 30, '#f9a8d4', 10));
        createHitSparks(this.x, this.y - 14, '#f9a8d4', 6);
        updateHUD();
    }

    draw(ctx, camX) {
        const bob = this.falling ? 0 : Math.sin(this.t * 3) * 3;
        const x = this.x - this.width / 2 - camX;
        const y = this.y - this.height - 2 + bob;
        if (x + this.width < 0 || x > GAME_WIDTH) return;
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(this.t * 4) * 0.1;
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.arc(x + this.width / 2, y + this.height / 2, this.width * 0.75, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.drawImage(PEACH_SPRITE, snap(x), snap(y), this.width, this.height);
    }
}

let pickups = [];

// --- CHESTS (open with an attack or a slam) ---
class Chest {
    constructor(x, y) {
        this.x = x;
        this.width = PROPS.chest.w * ART_SCALE;
        this.height = PROPS.chest.h * ART_SCALE;
        this.y = y - this.height;
        this.opened = false;
    }

    open() {
        if (this.opened) return;
        this.opened = true;
        score += 200;
        player.gainMp(30);
        playSound('kill');
        addShake(3);
        for (let i = 0; i < 4; i++) pickups.push(new Pickup(this.x + this.width / 2, this.y + 10, true));
        createHitSparks(this.x + this.width / 2, this.y + 10, '#facc15', 16);
        floatingTexts.push(new FloatingText('+200', this.x, this.y - 10, '#facc15', 12));
        updateHUD();
    }

    draw(ctx, camX, theme) {
        const r = this.opened ? PROPS.chestOpen : PROPS.chest;
        const x = snap(this.x - camX);
        if (x + this.width < 0 || x > GAME_WIDTH) return;
        const h = r.h * ART_SCALE;
        ctx.drawImage(theme.tiles, r.x, r.y, r.w, r.h, x, this.y + this.height - h, r.w * ART_SCALE, h);
    }
}

let chests = [];

// --- CHECKPOINTS (Cờ Thổ Địa) ---
class Checkpoint {
    constructor(x, y) {
        this.x = x;
        this.y = y; // ground surface
        this.active = false;
        this.t = 0;
    }

    update(dt, player) {
        this.t += dt;
        if (this.active || player.isDead) return;
        if (Math.abs(player.x + player.width / 2 - this.x) < 30 && player.y < this.y && player.y + player.height > this.y - 80) {
            this.active = true;
            respawnPoint = { x: this.x - player.width / 2, y: this.y - player.height };
            player.hp = player.maxHp;
            playSound('checkpoint');
            floatingTexts.push(new FloatingText('ĐIỂM HỒI SINH', this.x - 60, this.y - 90, '#facc15', 10));
            for (let i = 0; i < 16; i++) {
                particles.push(new Particle(this.x, this.y - 60, (Math.random() - 0.5) * 6, -Math.random() * 5, '#fde68a', 3, 0.6));
            }
            updateHUD();
        }
    }

    draw(ctx, camX) {
        const x = snap(this.x - camX);
        if (x < -40 || x > GAME_WIDTH + 40) return;
        // stone base + wooden pole
        ctx.fillStyle = '#57534e';
        ctx.fillRect(x - 9, this.y - 6, 18, 6);
        ctx.fillStyle = '#78716c';
        ctx.fillRect(x - 9, this.y - 6, 18, 2);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x - 2, this.y - 72, 4, 66);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(x - 3, this.y - 75, 6, 4);

        // waving banner, built from 3px columns
        const cloth = this.active ? '#dc2626' : '#57534e';
        const trim = this.active ? '#facc15' : '#a8a29e';
        for (let i = 0; i < 9; i++) {
            const wave = Math.round(Math.sin(this.t * 6 - i * 0.7) * (this.active ? 2 : 1));
            ctx.fillStyle = cloth;
            ctx.fillRect(x + 2 + i * 3, this.y - 70 + wave, 3, 21 - i);
            ctx.fillStyle = trim;
            ctx.fillRect(x + 2 + i * 3, this.y - 70 + wave + 20 - i, 3, 2);
        }
        if (this.active) {
            ctx.save();
            ctx.globalAlpha = 0.25 + Math.sin(this.t * 4) * 0.1;
            ctx.fillStyle = '#fde68a';
            ctx.beginPath();
            ctx.arc(x + 12, this.y - 60, 24, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}

let checkpoints = [];

// --- PROJECTILES (boss fire rain) ---
class Projectile {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = 2;
        this.color = color;
        this.size = 12;
        this.dead = false;
    }

    update(dt, player, platforms) {
        this.vy = Math.min(this.vy + 0.25, 8);
        this.x += this.vx;
        this.y += this.vy;
        if (Math.random() < 0.5) {
            particles.push(new Particle(this.x, this.y, (Math.random() - 0.5), -0.5, this.color, 3, 0.25));
        }
        const box = { x: this.x - this.size / 2, y: this.y - this.size / 2, width: this.size, height: this.size };
        if (overlaps(player, box)) {
            player.takeDamage(15);
            if (currentLevel.bossShotSlows && !player.isDead) player.slowTimer = 1.5;
            this.dead = true;
        }
        for (const p of platforms) {
            if (this.x > p.x && this.x < p.x + p.w && this.y > p.y && this.y < p.y + p.h) {
                this.dead = true;
                createHitSparks(this.x, p.y, this.color, 6);
            }
        }
        if (this.y > GAME_HEIGHT + 20) this.dead = true;
    }

    draw(ctx, camX) {
        const x = this.x - camX;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = this.color;
        ctx.fillRect(snap(x - 5), snap(this.y - 5), 10, 10);
        ctx.fillStyle = '#fff7ed';
        ctx.fillRect(snap(x - 2), snap(this.y - 3), 4, 4);
    }
}

let projectiles = [];

// --- HAZARDS (cầu gai: spiky sea urchins on the sea floor) ---
const URCHIN_SCALE = 3;

class Hazard {
    constructor(x, y) {
        this.width = URCHIN_SPRITE.width * URCHIN_SCALE;
        this.height = URCHIN_SPRITE.height * URCHIN_SCALE;
        this.x = x;
        this.y = y - this.height;
    }

    update(player) {
        // Slightly smaller hitbox than the sprite so the spikes feel fair
        const box = { x: this.x + 4, y: this.y + 6, width: this.width - 8, height: this.height - 6 };
        if (!player.isDead && overlaps(player, box) && player.invulnerableTimer <= 0 && !player.isDashing && !player.skill) {
            player.takeDamage(15);
            player.vy = -7;
        }
    }

    draw(ctx, camX) {
        const x = snap(this.x - camX);
        if (x + this.width < 0 || x > GAME_WIDTH) return;
        ctx.drawImage(URCHIN_SPRITE, x, this.y, this.width, this.height);
    }
}

let hazards = [];

// --- WEBS (Bàn Tơ Động): slow the player until cut by an attack or a slam ---
class Web {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.alive = true;
    }

    cut() {
        if (!this.alive) return;
        this.alive = false;
        playSound('slash');
        for (let i = 0; i < 16; i++) {
            particles.push(new Particle(
                this.x + Math.random() * this.width, this.y + Math.random() * this.height,
                (Math.random() - 0.5) * 4, -Math.random() * 2, '#e5e7eb', 2, 0.5
            ));
        }
    }

    draw(ctx, camX) {
        if (!this.alive) return;
        const x = this.x - camX;
        if (x + this.width < 0 || x > GAME_WIDTH) return;
        const cx = x + this.width / 2, cy = this.y + this.height / 2;
        const r = Math.max(this.width, this.height) * 0.75;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, this.y, this.width, this.height);
        ctx.clip();
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        }
        for (let ring = 1; ring <= 4; ring++) {
            const rr = (r / 4) * ring;
            for (let i = 0; i <= 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
        }
        ctx.stroke();
        ctx.restore();
    }
}

let webs = [];

function inWeb(entity) {
    return webs.some(w => w.alive && overlaps(entity, w));
}

// Jagged stalactite ceiling, locked to the world so it scrolls with the ground
function drawCaveCeiling(camX) {
    const step = 24;
    for (let wx = Math.floor(camX / step) * step; wx < camX + GAME_WIDTH + step; wx += step) {
        const hash = Math.abs(Math.sin(wx * 12.9898) * 43758.5453) % 1;
        const h = 18 + hash * 46;
        const x = snap(wx - camX);
        ctx.fillStyle = '#0c0a09';
        ctx.fillRect(x, 0, step, h);
        // taper into a pointed tip
        ctx.fillRect(x + 6, h, step - 12, 10);
        ctx.fillRect(x + 9, h + 10, step - 18, 8);
        ctx.fillStyle = '#292524';
        ctx.fillRect(x, h - 3, step, 3);
    }
}

// Hang tối: only a pool of light around the player; it widens when the boss fight starts
function drawDarkness(ctx, camX) {
    const px = player.x + player.width / 2 - camX;
    const py = player.y + player.height / 2 - camera.y;
    // Wider light in boss fights and duels so you can see who you are fighting
    const bossFight = duel.active || enemies.some(e => e.type === 'boss' && e.awake && !e.dead);
    const inner = bossFight ? 170 : 100;
    const outer = bossFight ? 480 : 330;
    const g = ctx.createRadialGradient(px, py, inner, px, py, outer);
    g.addColorStop(0, 'rgba(5, 3, 10, 0)');
    g.addColorStop(1, 'rgba(5, 3, 10, 0.93)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

// Streaks drifting through each current zone show which way it pushes
function drawCurrents(ctx, camX) {
    ctx.save();
    ctx.fillStyle = '#e0f2fe';
    for (const c of currentLevel.currents || []) {
        if (c.x - camX > GAME_WIDTH || c.x + c.w - camX < 0) continue;
        const horizontal = Math.abs(c.fx) > Math.abs(c.fy);
        for (let k = 0; k < 18; k++) {
            const seedX = (k * 53) % c.w, seedY = (k * 97) % c.h;
            const travel = worldTime * 90;
            let px, py;
            if (horizontal) {
                px = c.x + ((seedX + travel * Math.sign(c.fx)) % c.w + c.w) % c.w;
                py = c.y + seedY;
            } else {
                px = c.x + seedX;
                py = c.y + ((seedY + travel * Math.sign(c.fy)) % c.h + c.h) % c.h;
            }
            ctx.globalAlpha = 0.25;
            ctx.fillRect(snap(px - camX), snap(py), horizontal ? 14 : 2, horizontal ? 2 : 14);
        }
    }
    ctx.restore();
}

// Underwater: blue tint, slanted light rays and a rippling surface line
function drawWaterOverlay(ctx, camX) {
    ctx.save();
    ctx.fillStyle = 'rgba(14, 116, 144, 0.16)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(186, 230, 253, 0.05)';
    for (let i = 0; i < 6; i++) {
        const x0 = (((i * 170 - camX * 0.3 + worldTime * 12) % 1020) + 1020) % 1020 - 120;
        ctx.beginPath();
        ctx.moveTo(x0, 0);
        ctx.lineTo(x0 + 40, 0);
        ctx.lineTo(x0 + 150, GAME_HEIGHT);
        ctx.lineTo(x0 + 70, GAME_HEIGHT);
        ctx.fill();
    }
    ctx.fillStyle = 'rgba(224, 242, 254, 0.35)';
    for (let x = 0; x < GAME_WIDTH; x += 8) {
        ctx.fillRect(x, snap(8 + Math.sin(x * 0.04 + worldTime * 2) * 3), 8, 2);
    }
    ctx.restore();
}

// Code-drawn props: swaying kelp and coral (sea), red palace lanterns (heaven)
function drawCodeProp(ctx, name, x, y) {
    if (name === 'lantern') {
        if (x + 30 < 0 || x > GAME_WIDTH) return;
        ctx.fillStyle = '#78350f';
        ctx.fillRect(snap(x + 8), y - 64, 3, 64);
        ctx.fillRect(snap(x + 8), y - 64, 16, 3);
        const ly = snap(y - 58 + Math.sin(worldTime * 2 + x * 0.1) * 1.5);
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(x + 22, ly + 12, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(snap(x + 16), ly + 3, 12, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(snap(x + 16), ly + 3, 12, 2);
        ctx.fillRect(snap(x + 16), ly + 15, 12, 2);
        ctx.fillRect(snap(x + 21), ly + 17, 2, 6);
        return;
    }
    if (name === 'coral') {
        const w = CORAL_SPRITE.width * 3, h = CORAL_SPRITE.height * 3;
        if (x + w < 0 || x > GAME_WIDTH) return;
        ctx.drawImage(CORAL_SPRITE, x, y + 2 - h, w, h);
        return;
    }
    if (x + 30 < 0 || x > GAME_WIDTH + 30) return;
    for (let s = 0; s < 3; s++) {
        const segments = 8 + ((x + s * 13) % 4 + 4) % 4;
        for (let seg = 0; seg < segments; seg++) {
            const sway = Math.sin(worldTime * 2 + seg * 0.5 + s + x * 0.01) * seg * 0.8;
            ctx.fillStyle = seg % 2 === 0 ? '#166534' : '#15803d';
            ctx.fillRect(snap(x + s * 8 + sway), y - (seg + 1) * 7, 4, 7);
        }
    }
}

// Stage title shown centred at the start of each level
const levelBanner = { text: '', timer: 0 };
const BANNER_TIME = 3;

function drawLevelBanner(ctx, dt) {
    if (levelBanner.timer <= 0) return;
    levelBanner.timer -= dt;
    const alpha = Math.min(1, levelBanner.timer / 0.5, (BANNER_TIME - levelBanner.timer) / 0.4);
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 150, GAME_WIDTH, 56);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 150, GAME_WIDTH, 2);
    ctx.fillRect(0, 204, GAME_WIDTH, 2);
    ctx.font = "14px 'Press Start 2P', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(levelBanner.text, GAME_WIDTH / 2, 179);
    ctx.restore();
}
