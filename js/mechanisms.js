// Cơ quan: moving lifts, crumbling ledges, gates and switches, spike traps, rising lava, ropes, locked rooms.
// Described in the level data, reset by resetMechanisms() whenever a stage starts.
//
//   platform.move = { dx, dy, speed, phase }  lifts and loops (dy moves vertically)
//   platform.crumble = 'stone' | 'silk'         falls a moment after being stood on, comes back later
//   platform.gate = 'id'                        solid until a switch with that id is hit
//   level.switches = [{ x, y, gate, look }]     y is the surface it stands on; look: skull | shell | rune
//   level.spikes = [{ x, y, w, period, offset }] spikes popping out of a surface on a timer
//   level.lavas = [{ x, w, floor, top, speed }]  rises while the hero climbs above `floor`
//   level.ropes = [{ x, y, h, look }]           hold up to climb; look: silk | chain
//   level.locks = [{ x1, x2, top }]             walls (from top down) close until every monster that started inside is down

const CRUMBLE_TIME = 0.6;   // standing time before a crumbling ledge gives way
const CRUMBLE_BACK = 3.5;   // and how long until it is back
const GATE_OPEN_TIME = 0.6;
const SPIKE_DAMAGE = 10;
const LAVA_DAMAGE = 12;
const ROPE_OVER = 12; // how far above the top of a rope the climb ends

let mech = { lavas: [], locks: [], lockWalls: [] };

function resetMechanisms(level) {
    level.platforms = level.platforms.filter(p => !p.lockWall);
    for (const p of level.platforms) {
        if (p.move) {
            if (p.baseX === undefined) { p.baseX = p.x; p.baseY = p.y; }
            p.x = p.baseX;
            p.y = p.baseY;
        }
        p.gone = false;
        p.crumbleT = 0;
        p.backT = 0;
        p.openT = 0;
    }
    for (const s of level.switches || []) s.on = false;
    mech = {
        lavas: (level.lavas || []).map(l => ({ ...l, y: l.floor + 40, rising: false, hurtT: 0 })),
        locks: (level.locks || []).map(l => ({ ...l, closed: false, done: false, members: null })),
        lockWalls: []
    };
}

// What things collide with this frame: fallen ledges and open gates are not there
function solidPlatforms() {
    return currentLevel.platforms.filter(p => !p.gone);
}

const touching = (t, x, y, w, h) => t.x < x + w && t.x + t.width > x && t.y < y + h && t.y + t.height > y;

// Before anyone moves: lifts carry their riders, ledges crumble, lava rises, rooms lock
function updateMechanisms(dt) {
    const level = currentLevel;
    for (const p of level.platforms) {
        if (p.move && p.move.dy) {
            // Vertical lifts and loops (horizontal-only clouds are moved by moveClouds)
            const k = worldTime * p.move.speed + (p.move.phase || 0);
            const nx = p.baseX + Math.sin(k) * (p.move.dx || 0), ny = p.baseY + Math.cos(k) * p.move.dy;
            const ddx = nx - p.x, ddy = ny - p.y;
            p.x = nx;
            p.y = ny;
            for (const r of [player, ...clones]) {
                if (r.isGrounded && r.groundPlatform === p) { r.x += ddx; r.y += ddy; }
            }
        }
        if (p.crumble) {
            if (p.gone) {
                if ((p.backT -= dt) <= 0) p.gone = false;
            } else if (player.isGrounded && player.groundPlatform === p) {
                p.crumbleT += dt;
                if (p.crumbleT >= CRUMBLE_TIME) {
                    p.gone = true;
                    p.backT = CRUMBLE_BACK;
                    p.crumbleT = 0;
                    player.isGrounded = false;
                    playSound('slam');
                    const color = p.crumble === 'silk' ? '#e2e8f0' : '#78716c';
                    for (let i = 0; i < 14; i++) particles.push(new Particle(p.x + Math.random() * p.w, p.y + 6, (Math.random() - 0.5) * 3, Math.random() * 3, color, 5, 0.8));
                }
            } else {
                p.crumbleT = Math.max(0, p.crumbleT - dt);
            }
        }
        if (p.gate && p.openT > 0) {
            p.openT -= dt;
            if (p.openT <= 0) p.gone = true;
        }
    }

    // Spikes
    for (const s of level.spikes || []) {
        if (spikesUp(s) && !player.isDead && touching(player, s.x, s.y - 22, s.w, 22)) {
            if (player.takeDamage(SPIKE_DAMAGE, centreX(player) < s.x + s.w / 2 ? 'left' : 'right')) player.vy = -9;
        }
    }

    // Lava: starts rising once the hero climbs above its floor inside its column, drains when they drop back down
    for (const l of mech.lavas) {
        const inside = centreX(player) > l.x && centreX(player) < l.x + l.w;
        const feet = player.y + player.height;
        if (inside && feet < l.floor - 20 && !player.isDead) l.rising = true;
        if (!inside || feet >= l.floor - 2 || player.isDead) l.rising = false;
        if (l.rising) l.y = Math.max(l.top, l.y - l.speed * dt);
        else l.y = Math.min(l.floor + 40, l.y + 300 * dt);
        l.hurtT -= dt;
        if (l.rising && inside && feet > l.y + 6 && l.hurtT <= 0) {
            l.hurtT = 0.6;
            player.takeDamage(LAVA_DAMAGE);
            player.vy = -13;
            player.jumpCount = 1;
            for (let i = 0; i < 10; i++) particles.push(new Particle(centreX(player), l.y, (Math.random() - 0.5) * 4, -Math.random() * 5, '#f97316', 5, 0.6));
        }
    }

    // Locked rooms: close when the hero walks in while its monsters live, open when they are all down
    for (const L of mech.locks) {
        if (L.done) continue;
        if (!L.members) L.members = enemies.filter(e => e.type !== 'boss' && centreX(e) > L.x1 && centreX(e) < L.x2);
        const alive = L.members.some(e => !e.dead);
        const inside = centreX(player) > L.x1 + 40 && centreX(player) < L.x2 - 40 && player.y + player.height > L.top;
        if (!L.closed && inside && alive && !player.isDead) {
            L.closed = true;
            const h = 540 - L.top;
            const walls = [{ x: L.x1 - 16, y: L.top, w: 16, h, lockWall: true }, { x: L.x2, y: L.top, w: 16, h, lockWall: true }];
            L.walls = walls;
            level.platforms.push(...walls);
            playSound('slam');
            addShake(6);
            floatingTexts.push(new FloatingText('PHÒNG KHÓA!', player.x - 30, player.y - 30, '#f87171', 14));
        }
        if (L.closed && (!alive || player.isDead)) {
            L.closed = false;
            level.platforms = level.platforms.filter(p => !L.walls.includes(p));
            if (!alive) {
                L.done = true;
                playSound('checkpoint');
                floatingTexts.push(new FloatingText('CỬA MỞ!', player.x - 20, player.y - 30, '#facc15', 14));
            }
        }
    }
}

function spikesUp(s) {
    const t = ((worldTime + (s.offset || 0)) % s.period) / s.period;
    return t > 0.55;
}
function spikesWarning(s) {
    const t = ((worldTime + (s.offset || 0)) % s.period) / s.period;
    return t > 0.4 && t <= 0.55;
}

// An attack box hitting a switch opens its gates
function hitSwitches(box) {
    for (const s of currentLevel.switches || []) {
        if (s.on || !touching(box, s.x - 14, s.y - 36, 28, 36)) continue;
        s.on = true;
        playSound('checkpoint');
        addShake(4);
        let opened = false;
        for (const p of currentLevel.platforms) {
            if (p.gate === s.gate && !p.gone) { p.openT = GATE_OPEN_TIME; opened = true; }
        }
        createHitSparks(s.x, s.y - 18, '#facc15', 12);
        floatingTexts.push(new FloatingText(opened ? 'CỬA MỞ!' : 'CẠCH!', s.x - 24, s.y - 50, '#facc15', 13));
    }
}

// Ropes: hold up (or the jump button) while touching one to climb; let go to slide down slowly.
// A jump leaves the rope, and it cannot be grabbed again for a moment.
function applyRopes(p, input, dt) {
    if (p.ropeCooldown > 0) p.ropeCooldown -= dt;
    const ropes = currentLevel.ropes;
    p.onRope = null;
    if (!ropes || p.ropeCooldown > 0 || p.isDead || p.skill || p.form) return;
    const cx = centreX(p), feet = p.y + p.height;
    const rope = ropes.find(r => Math.abs(cx - r.x) < 20 && feet > r.y && p.y < r.y + r.h);
    if (!rope) return;
    const holding = input.up || input.jump;
    if (!holding && p.isGrounded) return;
    const steering = input.left || input.right;
    // at the top, left / right steps off onto whatever is beside the rope
    if (steering && feet <= rope.y - ROPE_OVER + 4) {
        p.ropeCooldown = 0.25;
        return;
    }
    p.onRope = rope;
    p.jumpCount = 0;
    if (!steering) p.x += (rope.x - cx) * 0.3;
    if (holding) {
        // climb until the feet are a little above the rope's end, high enough to step off onto a ledge there
        const stop = rope.y - ROPE_OVER;
        p.vy = feet > stop ? -Math.min(3.4, feet - stop) : 0;
    } else {
        p.vy = Math.min(p.vy, 1.4);
    }
}

// --- DRAWING (world space) ---
// Behind the actors: ropes, gates, switches and spikes
function drawMechanismsBack(ctx, camX) {
    const level = currentLevel;
    const theme = THEMES[level.theme];
    for (const r of level.ropes || []) {
        const x = r.x - camX;
        if (x < -20 || x > GAME_WIDTH + 20) continue;
        if (r.look === 'chain') {
            for (let y = r.y; y < r.y + r.h; y += 12) {
                ctx.fillStyle = (Math.floor(y / 12) % 2) ? '#a5f3fc' : '#67e8f9';
                ctx.globalAlpha = 0.75 + Math.sin(worldTime * 4 + y * 0.05) * 0.2;
                ctx.fillRect(snap(x - 3), y, 6, 9);
            }
            ctx.globalAlpha = 1;
        } else {
            ctx.fillStyle = 'rgba(241, 245, 249, 0.85)';
            ctx.fillRect(snap(x - 1), r.y, 3, r.h);
            ctx.fillStyle = 'rgba(203, 213, 225, 0.5)';
            for (let y = r.y + 20; y < r.y + r.h; y += 46) ctx.fillRect(snap(x - 5), y, 10, 2);
        }
    }
    for (const p of level.platforms) {
        if (!p.gate || p.gone) continue;
        const x = p.x - camX;
        if (x + p.w < -20 || x > GAME_WIDTH + 20) continue;
        // the gate slides up into the ceiling while it opens
        const lift = p.openT > 0 ? (1 - p.openT / GATE_OPEN_TIME) * p.h : 0;
        const look = gateLook(level.theme);
        ctx.save();
        ctx.beginPath();
        ctx.rect(x - 4, p.y - 4, p.w + 8, p.h + 8);
        ctx.clip();
        ctx.fillStyle = look.body;
        ctx.fillRect(snap(x), p.y - lift, p.w, p.h);
        ctx.fillStyle = look.edge;
        ctx.fillRect(snap(x), p.y - lift, 4, p.h);
        ctx.fillRect(snap(x + p.w - 4), p.y - lift, 4, p.h);
        for (let y = p.y - lift + 14; y < p.y - lift + p.h - 8; y += 28) ctx.fillRect(snap(x + 4), y, p.w - 8, 3);
        ctx.fillStyle = look.glyph;
        ctx.globalAlpha = 0.6 + Math.sin(worldTime * 5) * 0.3;
        ctx.fillRect(snap(x + p.w / 2 - 4), p.y - lift + p.h / 2 - 8, 8, 16);
        ctx.restore();
    }
    for (const s of level.switches || []) {
        const x = s.x - camX;
        if (x < -40 || x > GAME_WIDTH + 40) continue;
        drawSwitch(ctx, s, x);
    }
    for (const s of level.spikes || []) {
        const x = s.x - camX;
        if (x + s.w < -20 || x > GAME_WIDTH + 20) continue;
        const up = spikesUp(s), warn = spikesWarning(s);
        const h = up ? 20 : warn ? 6 : 3;
        ctx.fillStyle = up ? '#f5f5f4' : '#a8a29e';
        for (let sx = x + 2; sx < x + s.w - 6; sx += 12) {
            ctx.beginPath();
            ctx.moveTo(sx, s.y);
            ctx.lineTo(sx + 5, s.y - h);
            ctx.lineTo(sx + 10, s.y);
            ctx.fill();
        }
        if (warn) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
            ctx.fillRect(snap(x), s.y - 2, s.w, 2);
        }
    }
}

// In front of the actors: lava and the walls of locked rooms
function drawMechanismsFront(ctx, camX) {
    for (const l of mech.lavas) {
        const x = l.x - camX;
        if (x + l.w < -20 || x > GAME_WIDTH + 20 || l.y > l.floor + 30) continue;
        ctx.save();
        const g = ctx.createLinearGradient(0, l.y, 0, l.y + 120);
        g.addColorStop(0, '#fde047');
        g.addColorStop(0.15, '#f97316');
        g.addColorStop(1, '#7f1d1d');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x, l.floor + 60);
        for (let sx = 0; sx <= l.w; sx += 10) ctx.lineTo(x + sx, l.y + Math.sin(worldTime * 5 + sx * 0.08) * 4);
        ctx.lineTo(x + l.w, l.floor + 60);
        ctx.fill();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(249, 115, 22, 0.25)';
        ctx.fillRect(x, l.y - 30, l.w, 30);
        ctx.restore();
        if (Math.random() < 0.3) particles.push(new Particle(l.x + Math.random() * l.w, l.y, 0, -1 - Math.random() * 2, '#fde047', 3, 0.6));
    }
    const color = (THEMES[currentLevel.theme] && THEMES[currentLevel.theme].bossGlow) || '#f87171';
    for (const L of mech.locks) {
        if (!L.closed) continue;
        for (const w of L.walls) {
            const x = w.x - camX;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.4 + Math.sin(worldTime * 12) * 0.15;
            ctx.fillStyle = color;
            ctx.fillRect(snap(x - 6), w.y, w.w + 12, w.h);
            ctx.restore();
        }
    }
}

function gateLook(theme) {
    if (theme === 'sea') return { body: '#0f766e', edge: '#5eead4', glyph: '#fde68a' };
    if (theme === 'gate') return { body: '#1e1b4b', edge: '#a78bfa', glyph: '#facc15' };
    return { body: '#57534e', edge: '#a8a29e', glyph: '#ef4444' };
}

function drawSwitch(ctx, s, x) {
    const y = s.y;
    ctx.save();
    if (s.look === 'shell') {
        // a giant clam: open (golden pearl) once hit
        ctx.fillStyle = '#f9a8d4';
        ctx.beginPath();
        ctx.ellipse(x, y - 8, 16, 9, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(snap(x - 16), y - 8, 32, 8);
        if (s.on) {
            ctx.fillStyle = '#fde68a';
            ctx.beginPath();
            ctx.arc(x, y - 14, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (s.look === 'rune') {
        ctx.fillStyle = '#312e81';
        ctx.fillRect(snap(x - 10), y - 34, 20, 34);
        ctx.fillStyle = s.on ? '#facc15' : '#a78bfa';
        ctx.globalAlpha = 0.7 + Math.sin(worldTime * 6) * 0.3;
        ctx.fillRect(snap(x - 4), y - 26, 8, 14);
    } else {
        // skull on a post: its eyes light up when hit
        ctx.fillStyle = '#78716c';
        ctx.fillRect(snap(x - 3), y - 20, 6, 20);
        ctx.fillStyle = '#e7e5e4';
        ctx.fillRect(snap(x - 10), y - 36, 20, 16);
        ctx.fillStyle = s.on ? '#facc15' : '#1c1917';
        ctx.fillRect(snap(x - 6), y - 31, 4, 4);
        ctx.fillRect(snap(x + 2), y - 31, 4, 4);
    }
    if (!s.on) {
        // a bob arrow so the switch reads as something to hit
        ctx.fillStyle = '#fde047';
        ctx.globalAlpha = 0.8;
        const by = y - 52 + Math.sin(worldTime * 5) * 3;
        ctx.beginPath();
        ctx.moveTo(x - 6, by);
        ctx.lineTo(x + 6, by);
        ctx.lineTo(x, by + 7);
        ctx.fill();
    }
    ctx.restore();
}
