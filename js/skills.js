// Skills of every character, thrown skill objects, clones

// --- SKILL HELPERS ---
function damageMultiplier() {
    return 1 + 0.2 * upgradeLevel('atk');
}

// Applies the chosen character and shop upgrades at the start of a stage attempt
function applyUpgrades() {
    player.setCharacter(save.character || 'wukong');
    player.maxHp = player.char.hp + 20 * upgradeLevel('hp');
    player.maxJumps = player.char.jumps + (upgradeLevel('jump') > 0 ? 1 : 0);
    maxLives = BASE_LIVES + upgradeLevel('life');
}

// Who a skill can hit: the enemies in the campaign, the other fighter in a duel
function foesOf(p) {
    if (duel.active) {
        const foe = duel.opponentOf(p);
        return foe.isDead ? [] : [foe];
    }
    return enemies.filter(e => !e.dead);
}

function skillDamage(campaignAmount, duelAmount) {
    return duel.active ? duelAmount : Math.round(campaignAmount * damageMultiplier());
}

// Works on enemies and fighters alike; bosses shrug off half of it
function stun(target, time) {
    target.frozen = target.type === 'boss' ? time / 2 : time;
}

const centreX = t => t.x + t.width / 2;
const sideOf = (from, to) => centreX(to) > centreX(from) ? 'right' : 'left';

// Định Thân Pháp: a golden seal ripples out and freezes every foe in range
function castFreeze(p) {
    const cx = centreX(p);
    addShockwave(cx, p.y + p.height, 420, '#fde047');
    addShake(4);
    for (const foe of foesOf(p)) {
        if (Math.abs(centreX(foe) - cx) > 450) continue;
        stun(foe, duel.active ? DUEL.freezeTime : FREEZE_TIME);
        createHitSparks(centreX(foe), foe.y + foe.height / 2, '#fde047', 10);
    }
    projectiles = [];
    floatingTexts.push(new FloatingText('ĐỊNH!', p.x - 4, p.y - 20, '#fde047', 16));
}

// Landing of a leaping skill (Trụ Thiên, Bụng Đè)
function groundSlam(p) {
    const leap = p.leap;
    const cx = centreX(p);
    const feetY = p.y + p.height;
    addShake(9);
    hitStop = Math.max(hitStop, 0.08);
    playSound('slam');
    addShockwave(cx, feetY, leap.radius, '#facc15');
    for (let i = 0; i < 24; i++) {
        particles.push(new Particle(
            cx + (Math.random() - 0.5) * 40, feetY - 4,
            (Math.random() - 0.5) * 10, -Math.random() * 5 - 1,
            Math.random() < 0.5 ? '#facc15' : '#fde68a', 4, 0.5
        ));
    }
    for (const foe of foesOf(p)) {
        if (Math.abs(centreX(foe) - cx) < leap.radius && Math.abs(foe.y + foe.height - feetY) < 110) {
            foe.takeDamage(skillDamage(leap.damage, leap.duelDamage), sideOf(p, foe));
        }
    }
    for (const c of chests) {
        if (!c.opened && Math.abs(c.x + c.width / 2 - cx) < leap.radius && Math.abs(c.y + c.height - feetY) < 60) c.open();
    }
    for (const w of webs) {
        if (w.alive && Math.abs(w.x + w.width / 2 - cx) < leap.radius + 30 && Math.abs(w.y + w.height - feetY) < 120) w.cut();
    }
}

// --- Trư Bát Giới ---
function castFeast(p) {
    const amount = duel.active ? 25 : 35;
    p.heal(amount);
    p.invulnerableTimer = Math.max(p.invulnerableTimer, 0.8);
    playSound('pickup');
    floatingTexts.push(new FloatingText(`+${amount}`, p.x, p.y - 20, '#86efac', 14));
    for (let i = 0; i < 12; i++) {
        particles.push(new Particle(centreX(p), p.y + 20, (Math.random() - 0.5) * 5, -Math.random() * 4, '#f9a8d4', 4, 0.6));
    }
}

function castSnore(p) {
    p.skill = 'snore';
    p.skillTimer = 2.5;
    p.pulseTimer = 0.3;
    p.isDashing = false;
    p.vx = 0;
}

function snorePulse(p) {
    const cx = centreX(p), feetY = p.y + p.height;
    addShockwave(cx, feetY, 140, '#e0f2fe');
    playSound('roar');
    for (const foe of foesOf(p)) {
        if (Math.abs(centreX(foe) - cx) < 140 && Math.abs(foe.y + foe.height - feetY) < 90) {
            foe.takeDamage(skillDamage(12, 5), sideOf(p, foe));
        }
    }
}

// --- Sa Tăng ---
function castQuicksand(p) {
    zones.push({ x: centreX(p) - 110, y: p.y + p.height, w: 220, life: 4, maxLife: 4, tick: 0, owner: p });
    playSound('slam');
}

function castCounter(p) {
    p.skill = 'counter';
    p.skillTimer = 1.2;
    p.counterUsed = false;
    p.isDashing = false;
    p.vx = 0;
}

function counterBlast(p) {
    const cx = centreX(p);
    addShockwave(cx, p.y + p.height, 150, '#e2e8f0');
    addShake(6);
    playSound('slam');
    floatingTexts.push(new FloatingText('PHẢN ĐÒN!', p.x - 20, p.y - 20, '#e2e8f0', 12));
    for (const foe of foesOf(p)) {
        if (Math.abs(centreX(foe) - cx) < 150 && Math.abs(foe.y - p.y) < 120) {
            foe.takeDamage(skillDamage(50, 18), sideOf(p, foe));
            stun(foe, duel.active ? 0.6 : 0.8);
        }
    }
    p.skill = null;
    p.invulnerableTimer = 0.5;
}

function castBeads(p) {
    heroShots.push(new HeroShot('beads', p));
}

// --- Na Tra ---
function castWheels(p) {
    p.skill = 'wheels';
    p.skillTimer = 0.5;
    p.wheelHits = new Set();
    p.isDashing = false;
    playSound('slash');
}

function castRing(p) {
    heroShots.push(new HeroShot('ring', p));
}

function castSash(p) {
    heroShots.push(new HeroShot('sash', p));
}

// --- Đường Tăng ---
function castChant(p) {
    const cx = centreX(p);
    addShockwave(cx, p.y + p.height, 420, '#fde047');
    floatingTexts.push(new FloatingText('KIM CÔ CHÚ!', p.x - 30, p.y - 20, '#fde047', 12));
    for (const foe of foesOf(p)) {
        if (Math.abs(centreX(foe) - cx) > 420) continue;
        foe.takeDamage(skillDamage(15, 6), sideOf(p, foe));
        stun(foe, duel.active ? 1 : 1.6);
    }
}

function castHeal(p) {
    p.healTimer = 2;
    p.slowTimer = 0;
    floatingTexts.push(new FloatingText('TỤNG KINH', p.x - 20, p.y - 20, '#86efac', 11));
}

function castSmite(p) {
    const cx = centreX(p);
    const targets = foesOf(p)
        .filter(f => Math.abs(centreX(f) - cx) < 480)
        .sort((a, b) => Math.abs(centreX(a) - cx) - Math.abs(centreX(b) - cx))
        .slice(0, 3);
    for (const foe of targets) {
        beams.push({ x: centreX(foe), bottom: foe.y + foe.height, life: 0.45 });
        foe.takeDamage(skillDamage(35, 14), sideOf(p, foe));
    }
    if (targets.length) addShake(4);
}

// --- Thrown skill objects: Chuỗi Đầu Lâu, Càn Khôn Quyển, Hỗn Thiên Lăng ---
class HeroShot {
    constructor(kind, owner) {
        this.kind = kind;
        this.owner = owner;
        this.dir = owner.facing === 'right' ? 1 : -1;
        this.x = centreX(owner) + this.dir * 24;
        this.y = owner.y + 24;
        this.travelled = 0;
        this.returning = false;
        this.hits = new Set();
        this.life = 3;
        this.dead = false;
        this.delay = 0;  // fireballs leave the hand one after another
        this.tick = 0;
        if (kind === 'tornado' || kind === 'wave') this.y = owner.y + owner.height;
        if (kind === 'fireball') this.y = owner.y + 26;
    }

    touching(t) {
        return overlaps({ x: this.x - 12, y: this.y - 12, width: 24, height: 24 }, t);
    }

    homeTo(tx, ty, speed) {
        const dx = tx - this.x, dy = ty - this.y;
        const d = Math.hypot(dx, dy) || 1;
        this.x += (dx / d) * speed;
        this.y += (dy / d) * speed;
        return d;
    }

    update(dt) {
        this.life -= dt;
        const o = this.owner;
        if (this.kind === 'beads' || this.kind === 'rake') {
            // flies out 300px, then comes back to its owner, hitting on the way out and back
            if (!this.returning) {
                this.x += this.dir * 9;
                this.travelled += 9;
                if (this.travelled >= 300) {
                    this.returning = true;
                    this.hits.clear();
                }
            } else if (this.homeTo(centreX(o), o.y + 24, 10) < 24) {
                this.dead = true;
            }
            for (const foe of foesOf(o)) {
                if (!this.hits.has(foe) && this.touching(foe)) {
                    this.hits.add(foe);
                    const dmg = this.kind === 'rake' ? skillDamage(30, 12) : skillDamage(22, 10);
                    foe.takeDamage(dmg, this.returning ? sideOf(o, foe) : (this.dir > 0 ? 'right' : 'left'));
                }
            }
        } else if (this.kind === 'fireball') {
            if (this.delay > 0) {
                this.delay -= dt;
                this.x = centreX(o) + this.dir * 24;
                this.y = o.y + 26;
                return;
            }
            this.x += this.dir * 10;
            this.travelled += 10;
            for (const foe of foesOf(o)) {
                if (this.touching(foe)) {
                    foe.takeDamage(skillDamage(25, 9), this.dir > 0 ? 'right' : 'left');
                    createHitSparks(this.x, this.y, '#f97316', 10);
                    this.dead = true;
                    break;
                }
            }
            if (this.travelled > 520) this.dead = true;
        } else if (this.kind === 'tornado') {
            // drifts forward, dragging foes into its centre and grinding them
            this.x += this.dir * 2.6;
            this.tick -= dt;
            const bite = this.tick <= 0;
            if (bite) this.tick = 0.4;
            for (const foe of foesOf(o)) {
                const dx = centreX(foe) - this.x;
                if (Math.abs(dx) > 70 || Math.abs(foe.y + foe.height - this.y) > 90) continue;
                if (foe instanceof Player) foe.kbx = -Math.sign(dx) * 3;
                else foe.kvx = -Math.sign(dx) * 3;
                if (bite) foe.takeDamage(skillDamage(10, 4));
            }
        } else if (this.kind === 'wave') {
            // rushes along the ground, throwing every foe it meets
            this.x += this.dir * 9;
            this.travelled += 9;
            for (const foe of foesOf(o)) {
                if (this.hits.has(foe)) continue;
                if (Math.abs(centreX(foe) - this.x) < 35 && Math.abs(foe.y + foe.height - this.y) < 60) {
                    this.hits.add(foe);
                    foe.takeDamage(skillDamage(28, 11), this.dir > 0 ? 'right' : 'left');
                    if (foe instanceof Player) foe.kbx = this.dir * 10;
                    else foe.kvx = this.dir * 10;
                }
            }
            if (this.travelled > 420) this.dead = true;
        } else if (this.kind === 'ring') {
            // bounces between up to 3 foes, then flies home
            const next = this.returning ? null : foesOf(o)
                .filter(f => !this.hits.has(f) && Math.hypot(centreX(f) - this.x, f.y + f.height / 2 - this.y) < 400)
                .sort((a, b) => Math.hypot(centreX(a) - this.x, a.y - this.y) - Math.hypot(centreX(b) - this.x, b.y - this.y))[0];
            if (next) {
                this.homeTo(centreX(next), next.y + next.height / 2, 11);
                if (this.touching(next)) {
                    this.hits.add(next);
                    next.takeDamage(skillDamage(30, 12), sideOf(o, next));
                    createHitSparks(this.x, this.y, '#facc15', 8);
                    if (this.hits.size >= 3) this.returning = true;
                }
            } else {
                this.returning = true;
                if (this.homeTo(centreX(o), o.y + 24, 12) < 24) this.dead = true;
            }
        } else if (this.kind === 'sash') {
            // shoots out 280px; the first foe it touches is bound, then it reels back in
            const handX = centreX(o) + this.dir * 16;
            if (!this.returning) {
                this.x += this.dir * 16;
                this.travelled += 16;
                for (const foe of foesOf(o)) {
                    if (this.touching(foe)) {
                        foe.takeDamage(skillDamage(20, 8), this.dir > 0 ? 'right' : 'left');
                        stun(foe, duel.active ? 1.2 : 2.5);
                        floatingTexts.push(new FloatingText('TRÓI!', foe.x, foe.y - 16, '#f87171', 11));
                        this.returning = true;
                        break;
                    }
                }
                if (this.travelled >= 280) this.returning = true;
            } else if (this.homeTo(handX, o.y + 24, 20) < 20) {
                this.dead = true;
            }
        }
        if (this.life <= 0 || o.isDead) this.dead = true;
    }

    draw(ctx, camX) {
        const x = this.x - camX, y = this.y;
        const o = this.owner;
        const fx = name => o && o.char.fx && o.char.fx[name] !== undefined ? [o.char.anims.fx, o.char.fx[name]] : null;
        if (this.delay > 0) return;
        ctx.save();
        if (this.kind === 'fireball' || this.kind === 'rake' || this.kind === 'tornado') {
            const art = fx(this.kind === 'fireball' ? 'fireball' : this.kind);
            const glow = this.kind === 'tornado' ? '#7dd3fc' : '#f97316';
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(x, this.kind === 'tornado' ? y - 40 : y, this.kind === 'tornado' ? 34 : 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            if (art) {
                const scale = this.kind === 'tornado' ? 0.9 : this.kind === 'rake' ? 0.7 : 1;
                const bottom = this.kind === 'tornado' ? y : y + 20 * scale;
                drawSprite(o.char.sheet, art[0], art[1], x, bottom, this.dir < 0, scale);
            }
        } else if (this.kind === 'wave') {
            // a curling water crest with foam
            for (let i = 0; i < 4; i++) {
                const h = 44 - i * 9;
                ctx.fillStyle = ['#0369a1', '#0ea5e9', '#38bdf8', '#e0f2fe'][i];
                ctx.beginPath();
                ctx.ellipse(x - this.dir * i * 6, y, 26 - i * 4, h, 0, Math.PI, 0);
                ctx.fill();
            }
        } else if (this.kind === 'beads') {
            // nine skull beads spinning in a ring
            for (let i = 0; i < 9; i++) {
                const a = worldTime * 10 + (i / 9) * Math.PI * 2;
                ctx.fillStyle = i % 3 === 0 ? '#e7e5e4' : '#f5f5f4';
                ctx.fillRect(snap(x + Math.cos(a) * 10 - 2), snap(y + Math.sin(a) * 10 - 2), 4, 4);
            }
        } else if (this.kind === 'ring' && fx('ring')) {
            const [anim, frame] = fx('ring');
            drawSprite(o.char.sheet, anim, frame, x, y + 18, false, 0.6);
        } else if (this.kind === 'ring') {
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(x, y, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, 9, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.kind === 'sash') {
            // a wavy red ribbon from Na Tra's hand to the tip
            const hx = this.ownerX !== undefined ? this.ownerX - camX : centreX(this.owner) - camX;
            const hy = this.ownerY !== undefined ? this.ownerY : this.owner.y + 24;
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 4;
            ctx.beginPath();
            for (let i = 0; i <= 16; i++) {
                const t = i / 16;
                const px = hx + (x - hx) * t;
                const py = hy + (y - hy) * t + Math.sin(t * Math.PI * 4 + worldTime * 20) * 4 * (1 - t);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
            ctx.fillStyle = '#fca5a5';
            ctx.fillRect(snap(x - 3), snap(y - 3), 6, 6);
        }
        ctx.restore();
    }
}

let heroShots = [];
let zones = [];   // Lưu Sa Hà quicksand pools
let beams = [];   // Phật Quang light pillars (visual only)
let gazes = [];   // Hỏa Nhãn Kim Tinh fire beams (visual only)

// --- Tôn Ngộ Không's extra skills (from the 72 transformations) ---
const CIRCLE_RADIUS = 95;

function castEyes(p) {
    const dir = p.facing === 'right' ? 1 : -1;
    const cx = centreX(p), eyeY = p.y + 16;
    addShake(8);
    playSound('roar');
    gazes.push({ x: cx, y: eyeY, dir, life: 0.5 });
    for (const foe of foesOf(p)) {
        const dx = (centreX(foe) - cx) * dir;
        const fy = foe.y + foe.height / 2;
        if (dx > 0 && dx < 650 && Math.abs(fy - eyeY) < 60) foe.takeDamage(skillDamage(55, 20), dir > 0 ? 'right' : 'left');
    }
    for (const w of webs) {
        const dx = (w.x + w.width / 2 - cx) * dir;
        if (dx > 0 && dx < 650 && eyeY > w.y - 20 && eyeY < w.y + w.height + 20) w.cut();
    }
}

function castCircle(p) {
    zones.push({ kind: 'circle', x: centreX(p), y: p.y + p.height, r: CIRCLE_RADIUS, life: 4, maxLife: 4, tick: 0, owner: p });
    playSound('checkpoint');
}

function insideOwnCircle(p) {
    return zones.some(z => z.kind === 'circle' && z.owner === p
        && Math.abs(centreX(p) - z.x) < z.r && Math.abs(p.y + p.height - z.y) < z.r);
}

function castTransform(p) {
    p.form = currentLevel.water ? 'fish' : 'eagle';
    p.formTimer = 5;
    p.isAttacking = false;
    p.isDashing = false;
    p.vy = -3;
    transformPuff(p);
}

function transformPuff(p) {
    for (let i = 0; i < 16; i++) {
        particles.push(new Particle(centreX(p), p.y + p.height / 2, (Math.random() - 0.5) * 6, -Math.random() * 3,
            Math.random() < 0.5 ? '#86efac' : '#bbf7d0', 6, 0.5));
    }
    playSound('skill');
}

function drawGoldenCircle(ctx, z, camX) {
    const x = z.x - camX;
    const fade = Math.min(1, z.life / 0.5);
    ctx.save();
    ctx.globalAlpha = 0.18 * fade;
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(x, z.y, z.r, Math.PI, 0);
    ctx.fill();
    ctx.globalAlpha = 0.9 * fade;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, z.y, z.r, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, z.y, z.r, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    // runes orbiting the dome
    ctx.fillStyle = '#fef9c3';
    for (let i = 0; i < 8; i++) {
        const a = Math.PI + ((worldTime * 0.8 + i / 8) % 1) * Math.PI;
        ctx.fillRect(snap(x + Math.cos(a) * z.r - 2), snap(z.y + Math.sin(a) * z.r - 2), 4, 4);
    }
    ctx.restore();
}

function drawGazes(ctx, camX) {
    for (const g of gazes) {
        if (g.kind === 'cone') {
            drawFireCone(ctx, g, camX);
            continue;
        }
        const t = g.life / 0.5;
        const x = g.x - camX;
        const len = 650 * g.dir;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(249, 115, 22, 0.7)';
        ctx.fillRect(Math.min(x, x + len), g.y - 9 * t, Math.abs(len), 18 * t);
        ctx.fillStyle = 'rgba(253, 224, 71, 0.9)';
        ctx.fillRect(Math.min(x, x + len), g.y - 4 * t, Math.abs(len), 8 * t);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(Math.min(x, x + len), g.y - 1.5 * t, Math.abs(len), 3 * t);
        ctx.restore();
    }
}

// Tam Muội Chân Hỏa: a widening wedge of flame
function drawFireCone(ctx, g, camX) {
    const t = Math.max(0, g.life / 0.6);
    const x = g.x - camX;
    const reach = 380 * (1.2 - t * 0.2);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    [['rgba(220, 38, 38, 0.55)', 1], ['rgba(249, 115, 22, 0.6)', 0.75], ['rgba(253, 224, 71, 0.7)', 0.45]].forEach(([c, k]) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(x, g.y);
        ctx.lineTo(x + g.dir * reach * k, g.y - 80 * k * t);
        ctx.quadraticCurveTo(x + g.dir * reach * k * 1.08, g.y, x + g.dir * reach * k, g.y + 80 * k * t);
        ctx.closePath();
        ctx.fill();
    });
    ctx.restore();
}

// --- Extra skills of the hand-drawn party (art from their sheets) ---
const fxFrame = (p, name) => [p.char.anims.fx, p.char.fx[name]];

// Trư Bát Giới
function castRain(p) {
    const dir = p.facing === 'right' ? 1 : -1;
    zones.push({ kind: 'rain', x: centreX(p) + dir * 140, y: p.y + p.height, w: 240, life: 5, maxLife: 5, tick: 0, owner: p });
    playSound('roar');
}

function castRakeThrow(p) {
    heroShots.push(new HeroShot('rake', p));
}

function castPiglet(p) {
    p.form = 'pig';
    p.formTimer = 5;
    p.isAttacking = false;
    p.isDashing = false;
    transformPuff(p);
}

// Sa Tăng
function castTide(p) {
    heroShots.push(new HeroShot('tornado', p));
}

function castWave(p) {
    heroShots.push(new HeroShot('wave', p));
    playSound('slam');
}

function castBubble(p) {
    p.buff = { kind: 'bubble', timer: 6, hits: 3 };
}

// Na Tra
function castFireballs(p) {
    for (let i = 0; i < 3; i++) {
        const shot = new HeroShot('fireball', p);
        shot.delay = i * 0.15;
        heroShots.push(shot);
    }
}

function castSixArms(p) {
    p.buff = { kind: 'sixarms', timer: 8 };
    transformPuff(p);
    floatingTexts.push(new FloatingText('TAM ĐẦU LỤC TÝ!', p.x - 50, p.y - 20, '#f97316', 11));
}

function castSamadhi(p) {
    const dir = p.facing === 'right' ? 1 : -1;
    const cx = centreX(p), y = p.y + 30;
    gazes.push({ kind: 'cone', x: cx + dir * 20, y, dir, life: 0.6 });
    addShake(8);
    playSound('roar');
    for (const foe of foesOf(p)) {
        const dx = (centreX(foe) - cx) * dir;
        if (dx > 0 && dx < 380 && Math.abs(foe.y + foe.height / 2 - y) < 90) foe.takeDamage(skillDamage(60, 22), dir > 0 ? 'right' : 'left');
    }
    for (let i = 0; i < 30; i++) {
        particles.push(new Particle(cx + dir * 30, y, dir * (4 + Math.random() * 8), (Math.random() - 0.5) * 4,
            Math.random() < 0.5 ? '#f97316' : '#fde047', 5, 0.5));
    }
}

// Đường Tăng
function castBuddha(p) {
    zones.push({ kind: 'buddha', x: centreX(p), y: p.y + p.height, r: 150, life: 4, maxLife: 4, tick: 0, owner: p });
    playSound('checkpoint');
}

function castMeditate(p) {
    p.skill = 'meditate';
    p.skillTimer = 2.5;
    p.isDashing = false;
    p.vx = 0;
}

function castSutra(p) {
    p.buff = { kind: 'sutra', timer: 6, tick: 0 };
}

// Kinh Văn Hộ Thân: the orbiting sutra glyphs bite anything close every half second
function sutraTick(p, dt) {
    p.buff.tick -= dt;
    if (p.buff.tick > 0) return;
    p.buff.tick = 0.5;
    const cx = centreX(p), cy = p.y + p.height / 2;
    for (const foe of foesOf(p)) {
        if (Math.abs(centreX(foe) - cx) < 85 && Math.abs(foe.y + foe.height / 2 - cy) < 85) foe.takeDamage(skillDamage(10, 4), sideOf(p, foe));
    }
}

// Timed buffs drawn over the player
function drawBuff(ctx, p, cx, feetY) {
    const b = p.buff;
    ctx.save();
    if (b.kind === 'bubble') {
        ctx.globalAlpha = 0.55;
        if (p.char.fx && p.char.fx.bubble !== undefined) {
            const [anim, frame] = fxFrame(p, 'bubble');
            drawSprite(p.char.sheet, anim, frame, cx, feetY + 14, false, 0.75);
        } else {
            ctx.strokeStyle = '#7dd3fc';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, feetY - 31, 38, 0, Math.PI * 2);
            ctx.stroke();
        }
    } else if (b.kind === 'sutra') {
        // golden glyphs circling the monk
        ctx.fillStyle = '#facc15';
        for (let i = 0; i < 8; i++) {
            const a = worldTime * 2.5 + (i / 8) * Math.PI * 2;
            const gx = cx + Math.cos(a) * 58, gy = feetY - 31 + Math.sin(a) * 30;
            ctx.fillRect(snap(gx - 4), snap(gy - 5), 8, 10);
            ctx.fillStyle = '#78350f';
            ctx.fillRect(snap(gx - 2), snap(gy - 3), 4, 2);
            ctx.fillRect(snap(gx - 2), snap(gy + 1), 4, 2);
            ctx.fillStyle = '#facc15';
        }
    } else if (b.kind === 'sixarms') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.25 + Math.sin(worldTime * 8) * 0.08;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(cx, feetY - 31, 42, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// Cut-in: the caster's eye portrait sweeps across the screen before an ultimate
const cutIn = { timer: 0, duration: 0.9, art: null, title: '' };

function startCutIn(p, title) {
    showCutIn(p.charId, title);
    if (duel.active && duel.isHost) duel.cutIns.push({ c: p.charId, t: title });
}

function showCutIn(charId, title) {
    cutIn.art = CHARACTERS[charId].portraitArt;
    cutIn.title = title;
    cutIn.timer = cutIn.duration;
    hitStop = Math.max(hitStop, 0.25);
}

function drawCutIn(ctx, dt) {
    if (cutIn.timer <= 0) return;
    cutIn.timer -= dt;
    const t = 1 - cutIn.timer / cutIn.duration;
    const alpha = Math.min(1, t / 0.12, cutIn.timer / 0.2);
    const { img, sx, sy, sw, sh } = cutIn.art;
    const scale = Math.min(1.6, 300 / sw);
    const w = sw * scale, h = sh * scale;
    // slides in from the right, holds, then fades
    const x = GAME_WIDTH / 2 - w / 2 + Math.max(0, 1 - t / 0.15) * GAME_WIDTH * 0.6;
    const y = 150;
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, y - 8, GAME_WIDTH, h + 16);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(0, y - 8, GAME_WIDTH, 3);
    ctx.fillRect(0, y + h + 5, GAME_WIDTH, 3);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, sx, sy, sw, sh, snap(x), y, w, h);
    ctx.font = "14px 'Press Start 2P', monospace";
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 6;
    ctx.fillText(cutIn.title, GAME_WIDTH / 2, y + h + 30);
    ctx.restore();
}

function updateSkillEffects(dt) {
    for (const s of heroShots) s.update(dt);
    heroShots = heroShots.filter(s => !s.dead);

    for (const z of zones) {
        z.life -= dt;
        z.tick -= dt;
        const bite = z.tick <= 0;
        if (bite) z.tick = 0.5;
        if (z.kind === 'buddha') {
            // Phật Quang warms its caster
            const p = z.owner;
            if (!p.isDead && Math.abs(centreX(p) - z.x) < z.r) p.hp = Math.min(p.maxHp, p.hp + 12 * dt);
        }
        for (const foe of foesOf(z.owner)) {
            if (z.kind === 'circle') {
                // Vòng Tròn Kim Cô shoves foes out of the circle
                const dx = centreX(foe) - z.x;
                if (Math.abs(dx) > z.r || Math.abs(foe.y + foe.height - z.y) > z.r) continue;
                const push = (dx >= 0 ? 1 : -1) * 6;
                if (foe instanceof Player) foe.kbx = push;
                else foe.kvx = push;
                if (bite) foe.takeDamage(skillDamage(6, 3), dx >= 0 ? 'right' : 'left');
                continue;
            }
            if (z.kind === 'buddha') {
                if (bite && Math.abs(centreX(foe) - z.x) < z.r && Math.abs(foe.y + foe.height - z.y) < z.r) foe.takeDamage(skillDamage(8, 3));
                continue;
            }
            if (z.kind === 'rain') {
                if (Math.abs(centreX(foe) - z.x) > z.w / 2) continue;
                foe.slowTimer = Math.max(foe.slowTimer || 0, 0.3);
                if (bite) foe.takeDamage(skillDamage(5, 2));
                continue;
            }
            const inside = centreX(foe) > z.x && centreX(foe) < z.x + z.w && Math.abs(foe.y + foe.height - z.y) < 30;
            if (!inside) continue;
            foe.slowTimer = Math.max(foe.slowTimer || 0, 0.3);
            if (bite) foe.takeDamage(skillDamage(4, 2));
        }
    }
    zones = zones.filter(z => z.life > 0);

    for (const b of beams) b.life -= dt;
    beams = beams.filter(b => b.life > 0);
    for (const g of gazes) g.life -= dt;
    gazes = gazes.filter(g => g.life > 0);
}

// Quicksand pools sit on the ground, under everyone; golden circles glow around their caster
function drawZones(ctx, camX) {
    for (const z of zones) {
        if (z.kind === 'circle') {
            drawGoldenCircle(ctx, z, camX);
            continue;
        }
        if (z.kind === 'rain' || z.kind === 'buddha') {
            drawArtZone(ctx, z, camX);
            continue;
        }
        const x = z.x - camX;
        ctx.save();
        ctx.globalAlpha = Math.min(1, z.life / 0.5) * 0.8;
        ctx.fillStyle = '#a16207';
        ctx.beginPath();
        ctx.ellipse(x + z.w / 2, z.y, z.w / 2, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#713f12';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const a = worldTime * 3 + i * 2;
            ctx.beginPath();
            ctx.ellipse(x + z.w / 2, z.y, (z.w / 2) * (0.3 + i * 0.25), 3 + i * 2, 0, a, a + 2);
            ctx.stroke();
        }
        ctx.restore();
    }
}

// Mưa Thiên Hà: Bát Giới's cloud pours on a stretch of ground; Phật Quang: a Buddha rises behind Đường Tăng
function drawArtZone(ctx, z, camX) {
    const x = z.x - camX;
    const fade = Math.min(1, z.life / 0.5, (z.maxLife - z.life) / 0.3);
    const o = z.owner;
    const art = o && o.char && o.char.fx && o.char.fx[z.kind === 'rain' ? 'cloud' : 'buddha'] !== undefined;
    ctx.save();
    ctx.globalAlpha = fade;
    if (z.kind === 'rain') {
        const top = z.y - 190;
        ctx.strokeStyle = 'rgba(147, 197, 253, 0.8)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 26; i++) {
            const rx = x - z.w / 2 + ((i * 37) % z.w);
            const ry = top + ((worldTime * 420 + i * 53) % 180);
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx - 3, ry + 12);
            ctx.stroke();
        }
        ctx.fillStyle = 'rgba(59, 130, 246, 0.35)';
        ctx.beginPath();
        ctx.ellipse(x, z.y, z.w / 2, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        if (art) drawSprite(o.char.sheet, o.char.anims.fx, o.char.fx.cloud, x, top + 30, false, 1.8);
        else {
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.ellipse(x, top, z.w / 2, 30, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        const pulse = 0.85 + Math.sin(worldTime * 4) * 0.15;
        const g = ctx.createRadialGradient(x, z.y - 80, 10, x, z.y - 80, z.r);
        g.addColorStop(0, 'rgba(253, 224, 71, ' + (0.45 * pulse) + ')');
        g.addColorStop(1, 'rgba(253, 224, 71, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - z.r, z.y - 80 - z.r, z.r * 2, z.r * 2);
        ctx.globalAlpha = fade * 0.85;
        if (art) drawSprite(o.char.sheet, o.char.anims.fx, o.char.fx.buddha, x, z.y, false, 1.3);
    }
    ctx.restore();
}

function drawShotsAndBeams(ctx, camX) {
    for (const s of heroShots) s.draw(ctx, camX);
    drawGazes(ctx, camX);
    for (const b of beams) {
        const x = b.x - camX;
        const w = 30 * (b.life / 0.45);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(253, 224, 71, 0.55)';
        ctx.fillRect(snap(x - w / 2), 0, w, b.bottom);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(snap(x - w / 6), 0, w / 3, b.bottom);
        ctx.restore();
    }
}

// --- CLONES (Phân Thân Thuật) ---
const CLONE_LIFE = 7;

class Clone {
    constructor(x, y, offset, owner) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 62;
        this.vx = 0;
        this.vy = -6;
        this.offset = offset; // where it idles relative to its owner when there is nothing to fight
        this.owner = owner;
        this.sheet = owner.cloneSheet || FLASH.clone;
        this.life = CLONE_LIFE;
        this.facing = offset < 0 ? 'left' : 'right';
        this.isGrounded = false;
        this.attackTimer = 0;
        this.cooldown = 0;
        this.hitDone = false;
        this.animTime = Math.random();
    }

    update(dt, platforms) {
        this.life -= dt;
        this.animTime += dt;
        if (this.cooldown > 0) this.cooldown -= dt;

        const owner = this.owner;
        let target = null;
        let best = 320;
        for (const e of foesOf(owner)) {
            const d = Math.abs(e.x + e.width / 2 - (this.x + this.width / 2));
            if (d < best && Math.abs(e.y - this.y) < 160) {
                best = d;
                target = e;
            }
        }
        const goalX = target ? target.x + target.width / 2 : owner.x + owner.width / 2 + this.offset;
        const dx = goalX - (this.x + this.width / 2);

        if (this.attackTimer > 0) {
            this.attackTimer -= dt;
            this.vx = 0;
            if (!this.hitDone && this.attackTimer < 0.15) {
                this.hitDone = true;
                const reach = { x: this.facing === 'right' ? this.x + this.width : this.x - 80, y: this.y, width: 80, height: 55 };
                const damage = skillDamage(18, DUEL.cloneDamage);
                for (const e of foesOf(owner)) {
                    if (overlaps(reach, e)) e.takeDamage(damage, this.facing);
                }
            }
        } else if (target && Math.abs(dx) < 60 && this.cooldown <= 0) {
            this.facing = dx < 0 ? 'left' : 'right';
            this.attackTimer = 0.3;
            this.cooldown = 0.7;
            this.hitDone = false;
        } else if (Math.abs(dx) > 20) {
            this.vx = Math.sign(dx) * 4.5;
            this.facing = dx < 0 ? 'left' : 'right';
        } else {
            this.vx *= 0.7;
        }

        // Hop up when whatever it follows is standing higher
        const goalFeet = target ? target.y + target.height : owner.y + owner.height;
        if (this.isGrounded && goalFeet < this.y + this.height - 60) this.vy = -12.5;

        this.vy += 0.65;
        this.x += this.vx;
        Player.prototype.checkHorizontalCollisions.call(this, platforms);
        this.y += this.vy;
        this.isGrounded = false;
        Player.prototype.checkVerticalCollisions.call(this, platforms);

        if (this.y > GAME_HEIGHT + 50) {
            this.x = owner.x;
            this.y = owner.y - 20;
            this.vy = 0;
        }
    }

    draw(ctx, camX) {
        // Flicker during the last second and a half
        if (this.life < 1.5 && Math.floor(this.life * 10) % 2 === 0) return;
        let anim = HERO_ANIMS.idle;
        let frame = Math.floor(this.animTime / 0.4) % anim.frames;
        if (this.attackTimer > 0) {
            anim = HERO_ANIMS.atk2;
            frame = Math.min(anim.frames - 1, Math.floor((1 - this.attackTimer / 0.3) * anim.frames));
        } else if (!this.isGrounded) {
            anim = HERO_ANIMS.jump;
            frame = this.vy < 0 ? 0 : 2;
        } else if (Math.abs(this.vx) > 0.8) {
            anim = HERO_ANIMS.run;
            frame = Math.floor(this.animTime / 0.08) % anim.frames;
        }
        ctx.save();
        ctx.globalAlpha = 0.8;
        drawSprite(this.sheet, anim, frame, this.x + this.width / 2 - camX, this.y + this.height, this.facing === 'left', HERO_SCALE);
        ctx.restore();
    }
}

let clones = [];

function cloudPuff(x, y) {
    for (let i = 0; i < 12; i++) {
        particles.push(new Particle(x, y, (Math.random() - 0.5) * 6, -Math.random() * 3, '#fef9c3', 5, 0.4));
    }
}

// Replaces this caster's clones (in a duel the other fighter keeps theirs)
function spawnClones(p, count = 2) {
    for (const c of clones) if (c.owner === p) cloudPuff(c.x + c.width / 2, c.y + c.height / 2);
    const offsets = [-60, 60, 115].slice(0, count);
    const fresh = offsets.map(o => new Clone(p.x + Math.sign(o) * 40, p.y, o, p));
    clones = clones.filter(c => c.owner !== p).concat(fresh);
    for (const c of fresh) cloudPuff(c.x + c.width / 2, c.y + c.height / 2);
}
