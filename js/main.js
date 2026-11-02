// Touch controls, main loop, buttons, dev panel, start-up

// --- TOUCH BINDINGS ---
function bindTouch(id, keyProp, actionCallback) {
    const btn = document.getElementById(id);
    if (!btn) return;

    const handleStart = (e) => {
        e.preventDefault();
        keys[keyProp] = true;
        if (actionCallback && player && (gameState === 'PLAYING' || gameState === 'DUEL')) actionCallback();
    };

    const handleEnd = (e) => {
        e.preventDefault();
        keys[keyProp] = false;
    };

    btn.addEventListener('touchstart', handleStart, { passive: false });
    btn.addEventListener('touchend', handleEnd, { passive: false });
    btn.addEventListener('mousedown', handleStart);
    btn.addEventListener('mouseup', handleEnd);
    btn.addEventListener('mouseleave', handleEnd);
}

bindTouch('btn-left', 'left');
bindTouch('btn-right', 'right');
bindTouch('btn-jump', 'jump', localJump);
bindTouch('btn-attack', 'attack');
bindTouch('btn-dash', 'dash');
bindTouch('btn-skill1', 'skill1', () => localSkill(0));
bindTouch('btn-skill2', 'skill2', () => localSkill(1));
bindTouch('btn-skill3', 'skill3', () => localSkill(2));

// Platforms with `move` drift side to side; whoever stands on one rides along
function moveClouds(platforms) {
    for (const p of platforms) {
        if (!p.move || p.move.dy) continue; // lifts with vertical travel: updateMechanisms
        if (p.baseX === undefined) p.baseX = p.x;
        const nx = p.baseX + Math.sin(worldTime * p.move.speed) * p.move.dx;
        const delta = nx - p.x;
        p.x = nx;
        for (const rider of [player, ...clones]) {
            if (rider.isGrounded && rider.groundPlatform === p) rider.x += delta;
        }
    }
}

// --- MAIN GAME LOOP ---
function updateWorld(dt) {
    if (storyDelay && (storyDelay.t -= dt) <= 0) {
        const part = storyDelay.part;
        storyDelay = null;
        storyBeat(currentLevelIndex, part);
    }

    if (comboCount > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0) {
            comboCount = 0;
            updateHUD();
        }
    }

    updateMechanisms(dt);
    const platforms = solidPlatforms();
    moveClouds(platforms);
    player.update(dt, platforms);
    // A finished death animation may have ended the run (game over overlay)
    if (gameState !== 'PLAYING') return;
    camera.follow(player, currentLevel.worldWidth, dt);

    for (let enemy of enemies) {
        enemy.update(dt, player, platforms);
    }
    updateBossArena(dt);
    for (const c of clones) c.update(dt, platforms);
    clones = clones.filter(c => {
        if (c.life > 0) return true;
        cloudPuff(c.x + c.width / 2, c.y + c.height / 2);
        return false;
    });
    updateSkillEffects(dt);
    updateBubbles(dt);
    updateStreamFeed(dt);
    for (const p of pickups) p.update(dt, player, platforms);
    pickups = pickups.filter(p => !p.collected);
    for (const p of projectiles) p.update(dt, player, platforms);
    projectiles = projectiles.filter(p => !p.dead);
    for (const c of checkpoints) c.update(dt, player);
    if (DEV && dev.infiniteMp && player.mp < player.maxMp) {
        player.mp = player.maxMp;
        updateHUD();
    }
    for (const h of hazards) h.update(player);

    portal.update(dt, player);
    if (gameState !== 'PLAYING') return; // portal reached
    updateEffects(dt);
}

// Particles, floating numbers and shockwave rings (shared by the campaign and duels)
function updateEffects(dt) {
    updateShockwaves(dt);
    updateImpacts(dt);

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(dt);
        if (particles[i].life <= 0) particles.splice(i, 1);
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].update(dt);
        if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
    }
}

function applyShake(ctx) {
    if (shake > 0.3) {
        ctx.translate(snap((Math.random() - 0.5) * 2 * shake), snap((Math.random() - 0.5) * 2 * shake));
        shake *= 0.88;
    } else {
        shake = 0;
    }
}

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.max(0, Math.min((timestamp - lastTime) / 1000, 0.1));
    lastTime = timestamp;

    // All drawing uses logical 800x540 coordinates
    ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    updateAmbient(dt);
    worldTime += dt;

    if (gameState === 'MAP') {
        drawMap(ctx, dt);
        drawAmbient(ctx, 0);
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        requestAnimationFrame(gameLoop);
        return;
    }

    if (gameState === 'DUEL') {
        if (hitStop > 0) hitStop -= dt;
        else if (duel.isHost) updateDuelHost(dt);
        else updateDuelGuest(dt);
        if (duel.isHost) {
            duel.sendTimer -= dt;
            if (duel.sendTimer <= 0) {
                sendDuel(duelSnapshot());
                duel.sendTimer = 1 / 30;
            }
        } else {
            sendGuestInput(dt);
        }
        drawDuel(ctx, dt);
        requestAnimationFrame(gameLoop);
        return;
    }

    if (gameState === 'PLAYING') {
        // Whole 60 Hz steps; the accumulator may dip slightly below zero so a 60 Hz screen gets exactly one per frame
        stepAcc = Math.min(stepAcc + dt, STEP * 5);
        while (stepAcc > STEP / 2 && gameState === 'PLAYING') {
            stepAcc -= STEP;
            // Hit-stop freezes the world for a few frames to sell heavy impacts
            if (hitStop > 0) hitStop -= STEP;
            else updateWorld(STEP);
        }
    } else {
        stepAcc = 0;
    }

    const camX = snap(camera.x), camY = snap(camera.y);

    ctx.save();
    applyShake(ctx);

    drawEnvironment(ctx, currentLevel, camX, camY);

    // Everything in the world below is shifted up/down with the camera
    ctx.translate(0, -camY);
    const theme = THEMES[currentLevel.theme];
    if (theme) {
        drawCurrents(ctx, camX);
        drawMechanismsBack(ctx, camX);
        for (const c of checkpoints) c.draw(ctx, camX);
        for (const c of chests) c.draw(ctx, camX, theme);
        for (const h of hazards) h.draw(ctx, camX);
        for (const w of webs) w.draw(ctx, camX);
        portal.draw(ctx, camX);
        for (const p of pickups) p.draw(ctx, camX);
        drawZones(ctx, camX);

        for (let enemy of enemies) {
            enemy.draw(ctx, camX);
        }
        drawBossArena(ctx, camX);

        for (const c of clones) c.draw(ctx, camX);
        player.draw(ctx, camX);
        drawSlash(ctx, player, camX);
        drawShotsAndBeams(ctx, camX);
        for (const p of projectiles) p.draw(ctx, camX);
        drawShockwaves(ctx, camX);
        drawImpacts(ctx, camX);
        drawMechanismsFront(ctx, camX);
    }

    for (let p of particles) {
        p.draw(ctx, camX);
    }
    ctx.restore();

    if (currentLevel.water && theme) drawWaterOverlay(ctx, camX);
    if (theme && theme.dark) drawDarkness(ctx, camX);
    drawAmbient(ctx, camX);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.save();
    ctx.translate(0, -camY);
    drawBubbles(ctx, camX);
    for (let ft of floatingTexts) {
        ft.draw(ctx, camX);
    }
    ctx.restore();
    if (gameState === 'PLAYING' || gameState === 'PAUSED') drawStreamFeed(ctx);
    drawBossIntroScreen(ctx);

    if (gameState === 'PLAYING' || gameState === 'PAUSED') {
        drawBossBar(ctx);
        drawSkillSlots(ctx);
        drawMonsterCounter(ctx, camX);
    }
    drawLevelBanner(ctx, dt);
    drawCutIn(ctx, dt);

    requestAnimationFrame(gameLoop);
}

// --- BUTTON EVENT LISTENERS ---
// Opened from an invite link (?room=CODE): the start button joins that duel room
const inviteRoom = new URLSearchParams(location.search).get('room');

startBtn.addEventListener('click', () => {
    initAudio();
    startMusic();
    if (!save.storySeen.opening && !inviteRoom) {
        // First launch: the opening scene, then the map
        save.storySeen.opening = true;
        writeSave();
        startOverlay.classList.add('hidden');
        playStory(OPENING, goToMap, true);
        return;
    }
    goToMap();
    if (inviteRoom) {
        openDuelOverlay();
        joinRoom(inviteRoom);
    }
});

resetBtn.addEventListener('click', () => {
    if (!confirm('Xóa toàn bộ tiến trình, Đào Tiên và nâng cấp?')) return;
    save = freshSave();
    writeSave();
    currentLevelIndex = 0;
    resetBtn.classList.add('hidden');
});

document.getElementById('restart-btn').addEventListener('click', () => startRun(currentLevelIndex));
document.getElementById('next-stage-btn').addEventListener('click', () => startRun(currentLevelIndex + 1));
document.getElementById('resume-btn').addEventListener('click', () => setPaused(false));
document.getElementById('map-play-btn').addEventListener('click', enterSelectedStage);
document.getElementById('map-shop-btn').addEventListener('click', openShop);
document.getElementById('map-char-btn').addEventListener('click', openCharSelect);
document.getElementById('char-close-btn').addEventListener('click', closeCharSelect);
document.getElementById('shop-close-btn').addEventListener('click', closeShop);
for (const btn of document.querySelectorAll('.to-map-btn')) btn.addEventListener('click', goToMap);

// --- DEV PANEL ---
function setupDevPanel() {
    const panel = document.getElementById('dev-panel');
    panel.classList.remove('hidden');

    // Collapse to just the title bar; remembered across reloads
    const body = document.getElementById('dev-body');
    const collapseBtn = document.getElementById('dev-collapse');
    const setCollapsed = (collapsed) => {
        body.classList.toggle('hidden', collapsed);
        panel.classList.toggle('w-60', !collapsed);
        collapseBtn.innerHTML = `<i class="fa-solid fa-chevron-${collapsed ? 'up' : 'down'}"></i>`;
        try { localStorage.setItem('devCollapsed', collapsed ? '1' : ''); } catch (e) {}
    };
    let startCollapsed = false;
    try { startCollapsed = localStorage.getItem('devCollapsed') === '1'; } catch (e) {}
    setCollapsed(startCollapsed);
    collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        collapseBtn.blur();
        setCollapsed(!body.classList.contains('hidden'));
    });

    document.getElementById('dev-stages').innerHTML = LEVELS.map((_, i) =>
        `<button data-stage="${i}" class="py-1.5 rounded bg-amber-700 hover:bg-amber-600 pixel-font text-[9px] cursor-pointer">${i + 1}</button>`).join('');

    for (const [id, prop] of [['dev-god', 'god'], ['dev-mp', 'infiniteMp']]) {
        const box = document.getElementById(id);
        box.addEventListener('change', () => {
            dev[prop] = box.checked;
            box.blur(); // so Space keeps jumping instead of toggling the box
        });
    }

    panel.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn || duel.active) return;
        btn.blur();
        if (btn.dataset.stage !== undefined) {
            if (startBtn.disabled) return; // art still loading
            startRun(+btn.dataset.stage);
            return;
        }
        const action = btn.dataset.dev;
        if (action === 'peach') {
            save.peaches += 100;
            updateHUD();
            updateMapUi();
            if (shopOpen) renderShop();
        } else if (action === 'map') {
            if (!startBtn.disabled) goToMap();
        } else if (gameState === 'PLAYING') {
            if (action === 'boss') {
                const boss = enemies.find(en => en.type === 'boss' && !en.dead);
                if (boss) {
                    boss.isHit = false;
                    boss.takeDamage(boss.hp, 'right');
                }
            } else if (action === 'portal') {
                player.x = portal.x - 100;
                player.y = portal.y - 40;
                player.vy = 0;
                camera.snapTo(player, currentLevel.worldWidth);
            }
        }
    });
}
if (DEV) setupDevPanel();

// LOAD ART, THEN ENABLE START
loadSave();
loadAssets().then(() => {
    const missing = Object.keys(ASSET_FILES).filter(k => !IMG[k]);
    if (missing.length) {
        console.error('Thiếu sprite:', missing.map(k => ASSET_FILES[k]));
        startBtn.innerText = 'THIẾU FILE TRONG THƯ MỤC assets/';
        return;
    }
    buildProceduralSprites();
    buildThemes();
    buildCharacters();
    player.setCharacter(save.character);
    buildScenery(currentLevel, THEMES[currentLevel.theme]);
    resetAmbient(THEMES[currentLevel.theme].ambient);
    drawAvatar();
    updateHUD();
    startBtn.disabled = false;
    startBtn.innerText = inviteRoom ? `VÀO PHÒNG ĐẤU ${inviteRoom.toUpperCase()}` : 'VÀO HÀNH TRÌNH';
    if (save.unlocked > 0 || save.peaches > 0) resetBtn.classList.remove('hidden');
});

// START ENGINE LOOP
requestAnimationFrame(gameLoop);
