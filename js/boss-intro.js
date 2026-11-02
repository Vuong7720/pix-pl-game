// Boss entrances: the arena locks, the boss arrives its own way, then a title card. Jump skips.

// --- ENTRANCES ---
// Per stage theme: how the boss arrives, its title, when it lands (reveal) and how long the scene runs
const BOSS_INTROS = {
    forest: { kind: 'meteor',  title: 'Đại Lực Ma Vương',         reveal: 1.6, len: 3.0 },
    fire:   { kind: 'dusk',    title: 'Kẻ Canh Giờ Tan Ca',       reveal: 2.0, len: 3.4 },
    bone:   { kind: 'bones',   title: 'Yêu Nữ Ba Lần Hóa Kiếp',   reveal: 2.2, len: 3.4 },
    sea:    { kind: 'wave',    title: 'Chúa Tể Tứ Hải',           reveal: 2.0, len: 3.2 },
    web:    { kind: 'eyes',    title: 'Nữ Hoàng Bàn Tơ',          reveal: 2.4, len: 3.6 },
    sky:    { kind: 'thunder', title: 'Chiến Thần Tam Nhãn',      reveal: 2.0, len: 3.2 },
    gate:   { kind: 'rune',    title: 'Ý Chí Của Thiên Mệnh',     reveal: 2.4, len: 3.6 }
};
const TITLE_TIME = 2.4;   // the name card stays this long after the boss lands
const BARS = 46;          // letterbox height

const bossIntro = { active: false, boss: null, def: null, t: 0, groundY: 0, revealed: false, bits: [], titleT: 0, darkness: 0 };
// Arena lock: barriers at both ends of the boss platform while the fight is on
const arena = { locked: false, barriers: [], color: '#ef4444' };

function lerp(a, b, k) { return a + (b - a) * Math.max(0, Math.min(1, k)); }

// The boss wakes when the hero is well inside its platform (not still on the ledge before it)
function heroInArena(b) {
    const h = b.home;
    if (!h) return Math.abs(centreX(player) - centreX(b)) < 450;
    return centreX(player) > h.x + 40 && centreX(player) < h.x + h.w;
}

function startBossIntro(b) {
    const def = BOSS_INTROS[currentLevel.theme] || BOSS_INTROS.forest;
    Object.assign(bossIntro, { active: true, boss: b, def, t: 0, groundY: b.y, revealed: false, bits: [], titleT: 0, darkness: 0 });
    b.intro = true;
    b.introAlpha = 0;
    b.vx = 0;
    b.facing = centreX(player) < centreX(b) ? 'left' : 'right';
    player.input = NO_INPUT;
    player.isAttacking = false;
    player.vx = 0;
    lockArena(b);
    playSound('rumble');
    if (def.kind === 'meteor' || def.kind === 'wave' || def.kind === 'thunder') playSound('riser');
    if (def.kind === 'rune' || def.kind === 'eyes') playSound('drone');
}

// Skipping jumps to the moment after the landing
function skipBossIntro() {
    if (!bossIntro.active || bossIntro.t < 0.4) return;
    if (!bossIntro.revealed) revealBoss();
    finishBossIntro();
}

function revealBoss() {
    const b = bossIntro.boss;
    bossIntro.revealed = true;
    bossIntro.titleT = TITLE_TIME;
    b.introAlpha = 1;
    b.y = bossIntro.groundY;
    b.state = 'roar';
    playSound('boom');
    playSound('roar');
    addShake(14);
    hitStop = Math.max(hitStop, 0.12);
    addShockwave(centreX(b), b.y + b.height, 320, THEMES[currentLevel.theme].bossGlow);
    // the blast pushes the hero back a little
    player.kbx = (centreX(player) < centreX(b) ? -1 : 1) * 9;
    MUSIC.boss = true;
}

function finishBossIntro() {
    const b = bossIntro.boss;
    bossIntro.active = false;
    b.intro = false;
    b.introAlpha = 1;
    b.y = bossIntro.groundY;
    b.vy = 0;
    b.awake = true;
    b.setState('roar', 0.6);
    player.input = keys;
    storyBeat(currentLevelIndex, 'boss');
}

// --- ARENA LOCK ---
function lockArena(b) {
    if (arena.locked || !b.home) return;
    const h = b.home, top = (currentLevel.topY || 0) - 300;
    arena.barriers = [
        { x: h.x - 16, y: top, w: 16, h: 540 - top, barrier: true },
        { x: h.x + h.w, y: top, w: 16, h: 540 - top, barrier: true }
    ];
    currentLevel.platforms.push(...arena.barriers);
    arena.color = THEMES[currentLevel.theme].bossGlow || '#ef4444';
    arena.locked = true;
    camera.lock = h.w >= GAME_WIDTH
        ? { min: h.x, max: h.x + h.w - GAME_WIDTH }
        : { min: h.x + h.w / 2 - GAME_WIDTH / 2, max: h.x + h.w / 2 - GAME_WIDTH / 2 };
    playSound('slam');
}

function unlockArena() {
    if (!arena.locked) return;
    currentLevel.platforms = currentLevel.platforms.filter(p => !p.barrier);
    arena.barriers = [];
    arena.locked = false;
    camera.lock = null;
}

// Leaving a stage (or a new attempt) drops every trace of the last fight
function resetBossArena() {
    unlockArena();
    bossIntro.active = false;
    bossIntro.titleT = 0;
    MUSIC.boss = false;
}

// Called when the boss dies
function endBossFight() {
    unlockArena();
    MUSIC.boss = false;
}

// Every frame of the campaign: runs the entrance, and re-locks the arena after a respawn
function updateBossArena(dt) {
    if (bossIntro.titleT > 0) bossIntro.titleT -= dt;
    const boss = enemies.find(e => e.type === 'boss');
    if (!bossIntro.active) {
        if (!boss || boss.dead) return;
        // A death drops the lock (the respawn is outside the arena); walking back in closes it again
        if (player.isDead) unlockArena();
        else if (boss.awake && !arena.locked && heroInArena(boss)) lockArena(boss);
        return;
    }
    const I = bossIntro, b = I.boss, d = I.def;
    I.t += dt;
    player.invulnerableTimer = Math.max(player.invulnerableTimer, 0.3);
    player.jumpBuffer = 0;
    const cx = centreX(b), feet = I.groundY + b.height;
    const k = I.t / d.reveal;
    switch (d.kind) {
        case 'meteor':
            // The ground shakes harder and harder, pebbles fall, then the bull comes down from the sky
            if (!I.revealed) addShake(1 + k * 4);
            if (Math.random() < 0.5) particles.push(new Particle(camera.x + Math.random() * GAME_WIDTH, camera.y - 10, 0, 2 + Math.random() * 3, '#78716c', 3, 1.2));
            if (I.t > d.reveal - 0.35 && !I.revealed) {
                b.introAlpha = 1;
                b.y = lerp(I.groundY - 700, I.groundY, (I.t - (d.reveal - 0.35)) / 0.35);
                for (let i = 0; i < 3; i++) particles.push(new Particle(cx + (Math.random() - 0.5) * 50, b.y + b.height * 0.3, (Math.random() - 0.5) * 2, -2 - Math.random() * 3, Math.random() < 0.5 ? '#f97316' : '#fde047', 6, 0.5));
            }
            break;
        case 'dusk':
            // The sky turns to evening, a clock ticks, the head sinks down in a purple glow
            I.darkness = Math.min(0.5, k * 0.5);
            if (Math.floor(I.t / 0.5) !== Math.floor((I.t - dt) / 0.5) && !I.revealed) playSound('tick');
            if (I.t > 0.6 && !I.revealed) {
                b.introAlpha = lerp(0, 1, (I.t - 0.6) / 1.2);
                b.y = lerp(I.groundY - 320, I.groundY, (I.t - 0.6) / (d.reveal - 0.6));
                if (Math.random() < 0.6) particles.push(new Particle(cx + (Math.random() - 0.5) * 90, b.y + Math.random() * b.height, 0, -1, '#c084fc', 4, 0.7));
            }
            if (I.revealed) I.darkness = Math.max(0, I.darkness - dt);
            break;
        case 'bones':
            // Bones scattered on the floor rise, spin around and snap together into the demon
            if (I.t < 0.1 && !I.bits.length) {
                const h = b.home;
                for (let i = 0; i < 26; i++) {
                    I.bits.push({ x: h.x + 40 + Math.random() * (h.w - 80), y: feet - 4, a: Math.random() * 6, r: 30 + Math.random() * 120 });
                }
                playSound('laugh');
            }
            for (const bit of I.bits) {
                const e = Math.max(0, Math.min(1, (I.t - 0.3) / 1.6));
                bit.a += dt * (2 + e * 10);
                const ox = cx + Math.cos(bit.a) * bit.r * (1 - e), oy = feet - 50 + Math.sin(bit.a) * bit.r * 0.5 * (1 - e);
                bit.dx = lerp(bit.x, ox, e * 2);
                bit.dy = lerp(bit.y, oy, e * 2);
            }
            if (I.t > 1.6 && !I.revealed) b.introAlpha = lerp(0, 1, (I.t - 1.6) / 0.6);
            if (I.revealed) I.bits = [];
            break;
        case 'wave':
            // A huge shadow swims past behind the arena, then the dragon bursts up out of the floor
            if (I.t > 1.2 && !I.revealed) {
                b.introAlpha = 1;
                b.y = lerp(I.groundY + 260, I.groundY, (I.t - 1.2) / 0.8);
                for (let i = 0; i < 2; i++) particles.push(new Particle(cx + (Math.random() - 0.5) * 80, feet, (Math.random() - 0.5) * 3, -3 - Math.random() * 4, '#bae6fd', 5, 0.6));
            }
            break;
        case 'eyes':
            // Pitch black, eight red eyes open two by two, then the spider drops down on her thread
            I.darkness = I.revealed ? Math.max(0, I.darkness - dt * 2) : 0.94;
            if (Math.floor(I.t / 0.4) !== Math.floor((I.t - dt) / 0.4) && I.t < 1.7) playSound('heartbeat');
            if (I.t > 1.8 && !I.revealed) {
                b.introAlpha = 1;
                b.y = lerp(I.groundY - 520, I.groundY, (I.t - 1.8) / 0.6);
            }
            break;
        case 'thunder':
            // Lightning strikes all over the arena, the third eye sweeps a beam, then he lands in gold
            if (I.t < 1.3 && Math.random() < 0.12) {
                beams.push({ x: b.home.x + Math.random() * b.home.w, bottom: feet, life: 0.45 });
                addShake(4);
                playSound('slam');
            }
            if (I.t > 1.4 && !I.revealed) {
                b.introAlpha = lerp(0.3, 1, (I.t - 1.4) / 0.6);
                b.y = lerp(I.groundY - 420, I.groundY, (I.t - 1.4) / 0.6);
            }
            break;
        case 'rune':
            // A rune circle spins faster and faster, a black dragon flies over, the avatar steps out of a pillar of light
            if (I.t > 1.8 && !I.revealed) b.introAlpha = lerp(0, 1, (I.t - 1.8) / 0.6);
            if (Math.random() < 0.4) particles.push(new Particle(cx + (Math.random() - 0.5) * 160, feet, 0, -2 - Math.random() * 3, '#c084fc', 4, 0.8));
            break;
    }
    if (!I.revealed && I.t >= d.reveal) revealBoss();
    if (I.t >= d.len) finishBossIntro();
}

// --- DRAWING ---
// In world space (inside the camera translate)
function drawBossArena(ctx, camX) {
    // Barriers: flickering walls in the boss colour
    for (const w of arena.barriers) {
        const x = w.x - camX;
        if (x < -40 || x > GAME_WIDTH + 40) continue;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(x - 14, 0, x + w.w + 14, 0);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(0.5, arena.color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 0.35 + Math.sin(worldTime * 14 + w.x) * 0.12;
        ctx.fillStyle = g;
        ctx.fillRect(x - 14, w.y, w.w + 28, w.h);
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#ffffff';
        for (let y = camera.y + ((worldTime * 140) % 40); y < camera.y + GAME_HEIGHT; y += 40) ctx.fillRect(snap(x + w.w / 2 - 1), y, 2, 14);
        ctx.restore();
    }
    if (!bossIntro.active) return;
    const I = bossIntro, b = I.boss, d = I.def;
    const cx = centreX(b) - camX, feet = I.groundY + b.height;
    if (d.kind === 'bones') {
        ctx.fillStyle = '#e7e5e4';
        for (const bit of I.bits) {
            ctx.save();
            ctx.translate(snap((bit.dx ?? bit.x) - camX), snap(bit.dy ?? bit.y));
            ctx.rotate(bit.a);
            ctx.fillRect(-7, -2, 14, 4);
            ctx.fillRect(-9, -3, 4, 6);
            ctx.fillRect(5, -3, 4, 6);
            ctx.restore();
        }
    }
    if (d.kind === 'meteor' && !I.revealed && I.t > d.reveal - 0.35) {
        // fire trail behind the falling bull
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(0, b.y - 300, 0, b.y + b.height);
        g.addColorStop(0, 'rgba(249, 115, 22, 0)');
        g.addColorStop(1, 'rgba(253, 224, 71, 0.7)');
        ctx.fillStyle = g;
        ctx.fillRect(cx - 40, b.y - 300, 80, 300 + b.height);
        ctx.restore();
    }
    if (d.kind === 'wave' && I.t < 1.3) {
        // the dragon's shadow sweeping past
        const s = b.sprite();
        const k = I.t / 1.3;
        ctx.save();
        ctx.globalAlpha = 0.35 * Math.sin(k * Math.PI);
        ctx.filter = 'brightness(0)';
        drawSprite(IMG[s.key], s.anim, 0, camX + GAME_WIDTH * (1.2 - k * 1.4) - camX, feet - 60, true, (s.scale || 3) * 2.2);
        ctx.restore();
    }
    if (d.kind === 'eyes' && !I.revealed && I.t > 1.8) {
        // the silk thread she drops on
        ctx.fillStyle = 'rgba(226, 232, 240, 0.8)';
        ctx.fillRect(snap(cx), camera.y, 2, b.y - camera.y + 10);
    }
    if (d.kind === 'thunder' && I.t > 1.2 && I.t < 1.9) {
        // third-eye beam sweeping across the arena
        const k = (I.t - 1.2) / 0.7;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(253, 224, 71, 0.8)';
        const y = feet - 70;
        ctx.fillRect(0, y - 3, GAME_WIDTH * k, 6);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(0, y - 1, GAME_WIDTH * k, 2);
        ctx.restore();
    }
    if (d.kind === 'rune') {
        // spinning rune circle, the dragon fly-over and the pillar of light
        const k = Math.min(1, I.t / d.reveal);
        ctx.save();
        ctx.translate(snap(cx), snap(feet - 6));
        ctx.scale(1, 0.35);
        ctx.rotate(I.t * I.t * 2);
        const r = TM_FX.circle, size = 140 + k * 180;
        ctx.globalAlpha = I.revealed ? Math.max(0, 1 - (I.t - d.reveal)) : 0.4 + k * 0.5;
        ctx.drawImage(IMG.fxThienmenh, r.x, r.y, r.w, r.h, -size / 2, -size / 2, size, size);
        ctx.restore();
        if (I.t > 0.9 && I.t < 1.9) {
            const e = (I.t - 0.9) / 1.0;
            drawTmFx(ctx, 'dragon', camX + GAME_WIDTH * (1.15 - e * 1.3) - camX, feet - 220, 1.6, true, Math.sin(e * Math.PI));
        }
        if (I.t > 1.6 && !I.revealed) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = (I.t - 1.6) / 0.8;
            const g = ctx.createLinearGradient(cx - 60, 0, cx + 60, 0);
            g.addColorStop(0, 'rgba(168, 85, 247, 0)');
            g.addColorStop(0.5, 'rgba(216, 180, 254, 0.9)');
            g.addColorStop(1, 'rgba(168, 85, 247, 0)');
            ctx.fillStyle = g;
            ctx.fillRect(cx - 60, camera.y, 120, feet - camera.y);
            ctx.restore();
        }
    }
}

// In screen space, over everything: darkness, eyes, letterbox and the title card
function drawBossIntroScreen(ctx) {
    const I = bossIntro;
    if (I.active && I.darkness > 0) {
        ctx.fillStyle = I.def.kind === 'dusk' ? `rgba(76, 29, 149, ${I.darkness})` : `rgba(0, 0, 0, ${I.darkness})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        if (I.def.kind === 'dusk') {
            ctx.fillStyle = `rgba(234, 88, 12, ${I.darkness * 0.4})`;
            ctx.fillRect(0, GAME_HEIGHT * 0.55, GAME_WIDTH, GAME_HEIGHT * 0.45);
        }
    }
    if (I.active && I.def.kind === 'eyes' && !I.revealed) {
        // pairs of red eyes opening around where she hides
        const b = I.boss;
        const cx = centreX(b) - camera.x, cy = I.groundY - camera.y - 60;
        const spots = [[-60, -40], [50, -60], [-20, -120], [80, 10], [-110, 20], [10, -10], [120, -110], [-140, -90]];
        spots.slice(0, Math.min(8, Math.floor(I.t / 0.2))).forEach(([ox, oy], i) => {
            const open = Math.min(1, (I.t - i * 0.2) / 0.15);
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 12;
            for (const s of [-1, 1]) ctx.fillRect(snap(cx + ox + s * 7 - 3), snap(cy + oy - 2 * open), 6, Math.max(1, 4 * open));
            ctx.shadowBlur = 0;
        });
    }
    // Letterbox bars
    const barK = I.active ? Math.min(1, I.t / 0.3) : Math.max(0, I.titleT - TITLE_TIME + 0.3) / 0.3;
    if (barK > 0) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, GAME_WIDTH, BARS * barK);
        ctx.fillRect(0, GAME_HEIGHT - BARS * barK, GAME_WIDTH, BARS * barK);
        if (I.active && I.t > 0.6) {
            ctx.font = "9px 'Press Start 2P', monospace";
            ctx.textAlign = 'right';
            ctx.fillStyle = 'rgba(253, 230, 138, 0.6)';
            ctx.fillText('NHẢY: BỎ QUA', GAME_WIDTH - 14, GAME_HEIGHT - 16);
        }
    }
    // Title card: a band sweeps in, the name lands on it, the title fades in underneath
    if (I.titleT > 0 && I.def) {
        const e = TITLE_TIME - I.titleT;
        const slide = Math.min(1, e / 0.25), fade = Math.min(1, I.titleT / 0.4);
        const y = GAME_HEIGHT * 0.36;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
        ctx.fillRect(GAME_WIDTH * (1 - slide), y - 34, GAME_WIDTH, 78);
        ctx.fillStyle = arena.color;
        ctx.fillRect(GAME_WIDTH * (1 - slide), y - 34, GAME_WIDTH, 3);
        ctx.fillRect(GAME_WIDTH * (1 - slide), y + 41, GAME_WIDTH, 3);
        ctx.textAlign = 'center';
        ctx.font = "26px 'Press Start 2P', monospace";
        ctx.shadowColor = arena.color;
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#fff7ed';
        const nameX = GAME_WIDTH / 2 + (1 - Math.min(1, e / 0.35)) * 300;
        ctx.fillText(currentLevel.bossName || '', nameX, y + 8);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = fade * Math.max(0, Math.min(1, (e - 0.3) / 0.4));
        ctx.font = "italic 700 16px 'Noto Serif', serif";
        ctx.fillStyle = '#fde68a';
        ctx.fillText(`— ${I.def.title} —`, GAME_WIDTH / 2, y + 34);
        ctx.restore();
    }
}
