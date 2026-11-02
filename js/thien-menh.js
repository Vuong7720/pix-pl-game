// Thiên Mệnh: the stage 7 boss and a playable hero sharing one sheet (hero-thienmenh.png) and one skill kit

// --- SHEET LAYOUT ---
// Party layout (240x170 cells, see hdCell); `start` picks frames further along a row
const tmCell = (row, frames, start = 0) => ({ fw: 240, fh: 170, frames, row, start, ax: 100, foot: 165 });
const TM_ANIMS = {
    idle: tmCell(0, 3),
    run: tmCell(1, 4),
    jump: tmCell(2, 3),     // rising, apex, falling
    atk1: tmCell(3, 2),
    atk2: tmCell(4, 2),
    atk3: tmCell(5, 2),     // spin
    cast: tmCell(6, 1),     // dark aura
    dead: tmCell(7, 1),
    poses: tmCell(8, 4),    // spin, beam, summon, destroy
    poses2: tmCell(9, 4),   // shield, vanish, appear, roll
    status: tmCell(10, 5),  // hurt, stunned, dodge x2, landing
    fx: tmCell(11, 1),
    portrait: tmCell(12, 1)
};
const TM_POSES = {
    spin: ['poses', 0], beam: ['poses', 1], summon: ['poses', 2], destroy: ['poses', 3],
    shield: ['poses2', 0], vanish: ['poses2', 1], appear: ['poses2', 2], roll: ['poses2', 3]
};
// The boss plays the same sheet: rows picked per action in tmBossSprite
const TM_BOSS_ANIMS = {
    walk: TM_ANIMS.run, windup: TM_ANIMS.cast, strike: TM_ANIMS.atk2, jump: TM_ANIMS.jump,
    hurt: tmCell(10, 1), death: TM_ANIMS.dead, rage: TM_ANIMS.cast
};
const TM_BOSS_SCALE = 1.35;

// Effect sprites inside fx-thienmenh.png (printed by tools/art/build-thien-menh.ps1)
const TM_FX = {
    crescent: { x: 0, y: 0, w: 80, h: 90 },
    beam: { x: 84, y: 0, w: 202, h: 101 },
    dragon: { x: 290, y: 0, w: 186, h: 116 },
    bigDragon: { x: 480, y: 0, w: 160, h: 144 },
    spikes: { x: 644, y: 0, w: 69, h: 73 },
    burst: { x: 717, y: 0, w: 59, h: 70 },
    smoke: { x: 780, y: 0, w: 54, h: 66 },
    orb: { x: 838, y: 0, w: 61, h: 57 },
    circle: { x: 903, y: 0, w: 72, h: 73 }
};
const TM_PURPLE = '#a855f7';

// Draws one effect sprite centred on (x, y) in world space
function drawTmFx(ctx, name, x, y, scale = 1, flip = false, alpha = 1) {
    const r = TM_FX[name];
    const w = r.w * scale, h = r.h * scale;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(snap(x), snap(y));
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(IMG.fxThienmenh, r.x, r.y, r.w, r.h, -w / 2, -h / 2, w, h);
    ctx.restore();
}

// --- SHARED EFFECTS ---
// One list for hero and boss. `owner` is a Player (hits its foes) or the boss (hits the player).
let tmFx = [];

function tmTargets(owner) {
    if (owner instanceof Player) return foesOf(owner);
    return player.isDead ? [] : [player];
}

// Skill damage: [campaign, duel] for the hero, a flat amount for the boss
function tmHit(fx, target, hero, boss) {
    if (fx.hits.has(target)) return;
    fx.hits.add(target);
    const dir = centreX(target) >= fx.x ? 'right' : 'left';
    if (fx.owner instanceof Player) target.takeDamage(skillDamage(hero[0], hero[1]), dir);
    else target.takeDamage(boss, dir);
    createHitSparks(centreX(target), target.y + target.height / 2, TM_PURPLE, 10);
}

const tmNear = (t, x, y, rx, ry) => Math.abs(centreX(t) - x) < rx && Math.abs(t.y + t.height / 2 - y) < ry;

class TmEffect {
    // kind: crescent, beam, dragon, ruin, smoke
    constructor(kind, owner, opts = {}) {
        this.kind = kind;
        this.owner = owner;
        this.dir = owner.facing === 'right' ? 1 : -1;
        this.x = centreX(owner);
        this.y = owner.y + owner.height / 2;
        this.ground = owner.y + owner.height;
        this.t = 0;
        this.delay = opts.delay || 0;   // telegraph before it becomes harmful
        this.life = opts.life || 1;
        this.hits = new Set();
        this.dead = false;
        if (kind === 'crescent') this.x += this.dir * 30;
        if (kind === 'dragon') this.x -= this.dir * 40;
    }

    update(dt) {
        this.t += dt;
        if (this.t >= this.delay + this.life) this.dead = true;
        if (!this.owner) return; // a duel guest's copy is only drawn
        const live = this.t >= this.delay;
        const targets = tmTargets(this.owner);
        switch (this.kind) {
            case 'crescent':
                // Chém Xoáy: a wave of dark blade that cuts through everything in its way
                this.x += this.dir * 9 * MOVE_SCALE;
                for (const t of targets) if (tmNear(t, this.x, this.y, 40, 50)) tmHit(this, t, [35, 14], 16);
                break;
            case 'beam':
                // Cầu Tia Hắc Ám: a thin warning line, then the beam
                if (live && !this.fired) {
                    this.fired = true;
                    addShake(6);
                    playSound('roar');
                }
                if (live) {
                    for (const t of targets) {
                        const dx = (centreX(t) - this.x) * this.dir;
                        if (dx > 0 && dx < 620 && Math.abs(t.y + t.height / 2 - this.y) < 45) tmHit(this, t, [50, 20], 22);
                    }
                }
                break;
            case 'dragon':
                // Triệu Hồi Hắc Long: the dragon charges across the screen
                if (live) {
                    this.x += this.dir * 7 * MOVE_SCALE;
                    for (const t of targets) if (tmNear(t, this.x, this.y, 80, 70)) tmHit(this, t, [45, 18], 20);
                    if (Math.random() < 0.5) particles.push(new Particle(this.x - this.dir * 60, this.y + 20, -this.dir * 2, -Math.random(), TM_PURPLE, 4, 0.5));
                }
                break;
            case 'ruin':
                // Phá Hủy Toàn Diện: a rune circle charges, then dark spikes erupt all around
                if (live && !this.fired) {
                    this.fired = true;
                    addShake(14);
                    hitStop = Math.max(hitStop, 0.1);
                    playSound('slam');
                    addShockwave(this.x, this.ground, 340, TM_PURPLE);
                }
                if (live) for (const t of targets) if (tmNear(t, this.x, this.ground - 40, 330, 150)) tmHit(this, t, [75, 26], 30);
                break;
        }
    }

    draw(ctx, camX) {
        const x = this.x - camX;
        const k = this.t < this.delay ? this.t / this.delay : 1;
        const fade = Math.min(1, (this.delay + this.life - this.t) / 0.25);
        ctx.save();
        switch (this.kind) {
            case 'crescent':
                drawTmFx(ctx, 'crescent', x, this.y, 0.9, this.dir < 0, fade);
                break;
            case 'beam':
                if (this.t < this.delay) {
                    // warning line
                    ctx.globalAlpha = 0.3 + 0.3 * Math.sin(this.t * 40);
                    ctx.fillStyle = TM_PURPLE;
                    ctx.fillRect(this.dir > 0 ? x : x - 620, this.y - 2, 620, 4);
                } else {
                    // the beam sprite stretched to its full reach, flickering
                    const r = TM_FX.beam;
                    ctx.globalAlpha = fade * (0.85 + Math.random() * 0.15);
                    ctx.translate(snap(x), snap(this.y));
                    if (this.dir < 0) ctx.scale(-1, 1);
                    ctx.drawImage(IMG.fxThienmenh, r.x, r.y, r.w, r.h, 0, -r.h * 0.45, 620, r.h * 0.9);
                }
                break;
            case 'dragon':
                if (this.t < this.delay) drawTmFx(ctx, 'circle', x, this.ground - 6, 1.2 * k, false, 0.8);
                else drawTmFx(ctx, 'dragon', x, this.y - 10 + Math.sin(this.t * 10) * 6, 1, this.dir < 0, fade);
                break;
            case 'ruin':
                if (this.t < this.delay) {
                    drawTmFx(ctx, 'circle', x, this.ground - 8, 1 + 3 * k, false, 0.5 + 0.4 * k);
                    drawTmFx(ctx, 'orb', x, this.ground - 60, 0.6 + k, false, 0.8);
                } else {
                    const e = (this.t - this.delay) / this.life;
                    for (let i = -4; i <= 4; i++) {
                        const sx = x + i * 72;
                        const grow = Math.max(0, Math.min(1, e * 4 - Math.abs(i) * 0.25));
                        if (grow > 0) drawTmFx(ctx, 'spikes', sx, this.ground - 34 * grow, 1.1 * grow, i < 0, fade);
                    }
                    drawTmFx(ctx, 'burst', x, this.ground - 60, 1.6, false, fade);
                }
                break;
            case 'smoke':
                drawTmFx(ctx, 'smoke', x, this.y, 1 + this.t, false, 1 - this.t / this.life);
                break;
        }
        ctx.restore();
    }
}

function updateTmFx(dt) {
    for (const f of tmFx) f.update(dt);
    tmFx = tmFx.filter(f => !f.dead);
}

function drawTmFxList(ctx, camX) {
    for (const f of tmFx) f.draw(ctx, camX);
}

function tmSmoke(owner) {
    tmFx.push(new TmEffect('smoke', owner, { life: 0.5 }));
}

// --- HERO SKILLS ---
function castTmSpin(p) {
    tmFx.push(new TmEffect('crescent', p, { life: 0.9 }));
    // the spin itself cuts everything close
    const cx = centreX(p);
    for (const foe of foesOf(p)) {
        if (tmNear(foe, cx, p.y + p.height / 2, 90, 60)) foe.takeDamage(skillDamage(25, 10), sideOf(p, foe));
    }
    addShake(3);
}

function castTmBeam(p) {
    const fx = new TmEffect('beam', p, { delay: 0.1, life: 0.45 });
    fx.x = centreX(p) + fx.dir * 30;
    fx.y = p.y + p.height / 2 + 4;
    tmFx.push(fx);
}

function castTmDragon(p) {
    tmFx.push(new TmEffect('dragon', p, { delay: 0.3, life: 1.8 }));
    floatingTexts.push(new FloatingText('HẮC LONG!', p.x - 30, p.y - 20, TM_PURPLE, 13));
}

// Dịch Chuyển Bóng Tối: vanish and come out behind the nearest foe ahead, slashing
function castTmShadow(p) {
    const dir = p.facing === 'right' ? 1 : -1;
    const cx = centreX(p);
    const ahead = foesOf(p)
        .filter(f => (centreX(f) - cx) * dir > 0 && Math.abs(centreX(f) - cx) < 520 && Math.abs(f.y - p.y) < 200)
        .sort((a, b) => Math.abs(centreX(a) - cx) - Math.abs(centreX(b) - cx))[0];
    tmSmoke(p);
    if (ahead) {
        p.x = centreX(ahead) + dir * 50 - p.width / 2;
        p.y = ahead.y + ahead.height - p.height;
        p.vy = 0;
        p.facing = dir > 0 ? 'left' : 'right';
    } else {
        p.x += dir * 160;
    }
    tmSmoke(p);
    for (const foe of foesOf(p)) {
        if (tmNear(foe, centreX(p), p.y + p.height / 2, 110, 70)) foe.takeDamage(skillDamage(40, 16), sideOf(p, foe));
    }
    p.invulnerableTimer = Math.max(p.invulnerableTimer, 0.4);
}

function castTmRuin(p) {
    tmFx.push(new TmEffect('ruin', p, { delay: 0.45, life: 0.55 }));
}

function castTmGuard(p) {
    p.buff = { kind: 'darkguard', timer: 3 };
    floatingTexts.push(new FloatingText('HẮC THUẪN!', p.x - 30, p.y - 20, TM_PURPLE, 12));
}

// Purple shell of Hắc Thuẫn (drawn by drawBuff)
function drawDarkGuard(ctx, cx, feetY) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.35 + Math.sin(worldTime * 9) * 0.1;
    ctx.fillStyle = '#7e22ce';
    ctx.beginPath();
    ctx.ellipse(cx, feetY - 34, 40, 46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#d8b4fe';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// --- BOSS ---
// Every action of the boss: [state, pose time]. Picked by distance in tmBossPick.
function tmBossPick(b, dx) {
    const dist = Math.abs(dx);
    b.facing = dx < 0 ? 'left' : 'right';
    const ruinReady = b.phase === 2 && b.ruinCooldown <= 0;
    const r = Math.random();
    if (ruinReady && r < 0.45) return b.setState('tmRuin', 1.3);
    if (r < 0.2) return b.setState('tmVanish', 0.45);
    if (dist < 150) return b.setState('tmSpin', 0.5);
    if (r < 0.6) return b.setState('tmBeam', 0.9);
    return b.setState('tmDragon', 0.8);
}

// Called from updateBoss once the boss is awake; returns after moving it
function updateTmBoss(b, dt, dx) {
    b.ruinCooldown = (b.ruinCooldown || 0) - dt;
    b.guardTimer = Math.max(0, (b.guardTimer || 0) - dt);
    b.guardCooldown = Math.max(0, (b.guardCooldown || 0) - dt);
    b.stateTimer -= dt;
    const away = dx < 0 ? 1 : -1;

    // Né / Lăn: a quick roll away from a swing at close range
    if (b.state === 'walk' && player.isAttacking && Math.abs(dx) < 110 && Math.random() < 0.04) {
        b.facing = dx < 0 ? 'left' : 'right';
        b.setState('tmRoll', 0.35);
    }

    switch (b.state) {
        case 'walk':
            b.facing = dx < 0 ? 'left' : 'right';
            b.vx = Math.abs(dx) > 120 ? Math.sign(dx) * b.speed : 0;
            if (b.stateTimer <= 0 && !player.isDead) tmBossPick(b, dx);
            break;
        case 'tmRoll':
            b.vx = away * 9 * MOVE_SCALE;
            if (b.stateTimer <= 0) b.setState('walk', 0.5);
            break;
        case 'tmGuard':
            b.vx = 0;
            if (b.stateTimer <= 0) b.setState('walk', 0.4);
            break;
        case 'tmSpin':
            b.vx = 0;
            if (b.stateTimer <= 0) {
                tmFx.push(new TmEffect('crescent', b, { life: 1 }));
                if (Math.abs(dx) < 110) player.takeDamage(16, dx > 0 ? 'right' : 'left');
                b.setState('walk', 1 + Math.random() * 0.6);
            }
            break;
        case 'tmBeam':
            b.vx = 0;
            if (!b.acted) {
                b.acted = true;
                const fx = new TmEffect('beam', b, { delay: 0.75, life: 0.6 });
                fx.x = centreX(b) + fx.dir * 40;
                fx.y = b.y + b.height * 0.55;
                tmFx.push(fx);
            }
            if (b.stateTimer <= 0) b.setState('walk', 1.1 + Math.random() * 0.6);
            break;
        case 'tmDragon':
            b.vx = 0;
            if (!b.acted) {
                b.acted = true;
                tmFx.push(new TmEffect('dragon', b, { delay: 0.6, life: 2.2 }));
            }
            if (b.stateTimer <= 0) b.setState('walk', 1.4 + Math.random() * 0.6);
            break;
        case 'tmVanish':
            // Dịch Chuyển Bóng Tối: fade out, then come out behind the player
            b.vx = 0;
            if (b.stateTimer <= 0) {
                tmSmoke(b);
                const side = player.facing === 'right' ? -1 : 1;
                b.x = Math.max(b.homeLeft, Math.min(b.homeRight, centreX(player) + side * 70 - b.width / 2));
                b.facing = side > 0 ? 'left' : 'right';
                tmSmoke(b);
                b.setState('tmAppear', 0.4);
            }
            break;
        case 'tmAppear':
            b.vx = 0;
            if (b.stateTimer <= 0) {
                if (Math.abs(dx) < 120) player.takeDamage(18, dx > 0 ? 'right' : 'left');
                createHitSparks(centreX(b) + (b.facing === 'right' ? 50 : -50), b.y + b.height / 2, TM_PURPLE, 12);
                b.setState('walk', 1);
            }
            break;
        case 'tmRuin':
            b.vx = 0;
            if (!b.acted) {
                b.acted = true;
                b.ruinCooldown = 9;
                tmFx.push(new TmEffect('ruin', b, { delay: 1.1, life: 0.6 }));
                floatingTexts.push(new FloatingText('PHÁ HỦY TOÀN DIỆN!', b.x - 60, b.y - 40, TM_PURPLE, 14));
            }
            if (b.stateTimer <= 0) b.setState('walk', 1.2);
            break;
        case 'roar':
            b.vx = 0;
            if (b.stateTimer <= 0) b.setState('walk', 0.8);
            break;
        default:
            b.setState('walk', 0.8);
    }
    if (b.state === 'walk' || b.state === 'roar') b.acted = false;
}

// Damage taken by the boss: invulnerable while rolling or vanished, Phòng Thủ after a flurry of hits.
// Returns the amount to apply, or null to ignore the hit.
function tmBossHit(b, amount) {
    if (b.state === 'tmRoll' || b.state === 'tmVanish') return null;
    if (b.guardTimer > 0 || b.state === 'tmGuard') {
        createHitSparks(centreX(b), b.y + b.height / 2, '#d8b4fe', 6);
        return Math.max(1, Math.round(amount * 0.2));
    }
    const now = worldTime;
    b.recentHits = (b.recentHits || []).filter(t => now - t < 1.5);
    b.recentHits.push(now);
    if (b.recentHits.length >= 4 && b.state === 'walk' && !(b.guardCooldown > 0)) {
        b.recentHits = [];
        b.guardTimer = 1.4;
        b.guardCooldown = 5;
        b.setState('tmGuard', 1.4);
    }
    return amount;
}

// Sprite for the boss state: [cell, fps] on the hero sheet
function tmBossSprite(b) {
    const base = { key: 'heroThienmenh', scale: TM_BOSS_SCALE, facesRight: true, glow: b.phase === 2 ? '#dc2626' : TM_PURPLE };
    const pose = name => { const [row, col] = TM_POSES[name]; return { ...base, anim: { ...TM_ANIMS[row], frames: 1, start: col }, fps: 1 }; };
    if (b.frozen > 0) return { ...base, anim: { ...TM_ANIMS.status, frames: 1, start: 1 }, fps: 1 };
    if (b.isHit) return { ...base, anim: TM_BOSS_ANIMS.hurt, fps: 1 };
    switch (b.state) {
        case 'tmRoll': return pose('roll');
        case 'tmGuard': return pose('shield');
        case 'tmSpin': return pose('spin');
        case 'tmBeam': return pose('beam');
        case 'tmDragon': return pose('summon');
        case 'tmVanish': return pose('vanish');
        case 'tmAppear': return pose('appear');
        case 'tmRuin': return pose('destroy');
        case 'roar': return { ...base, anim: TM_ANIMS.cast, fps: 1 };
        default:
            return Math.abs(b.vx) > 0.3 ? { ...base, anim: TM_ANIMS.run, fps: 9 } : { ...base, anim: TM_ANIMS.idle, fps: 3 };
    }
}
