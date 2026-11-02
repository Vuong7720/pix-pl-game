// Portal, scenery and environment rendering, game state

// --- PORTAL ---
class Portal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 80;
        this.rotation = 0;
        this.locked = false;
        this.hintTimer = 0;
    }

    update(dt, player) {
        this.rotation += dt * 3;
        if (this.hintTimer > 0) this.hintTimer -= dt;
        // The portal stays sealed until every monster (boss included) has fallen
        this.locked = enemies.some(e => !e.dead);

        if (!this.locked && Math.random() < 0.25) {
            particles.push(new Particle(
                this.x + this.width / 2 + (Math.random() - 0.5) * this.width,
                this.y + this.height / 2 + (Math.random() - 0.5) * this.height,
                (Math.random() - 0.5) * 1.5, -Math.random() * 3,
                Math.random() < 0.5 ? '#fde68a' : '#f97316', 2, 0.5
            ));
        }

        if (!player.isDead && overlaps(player, this)) {
            if (!this.locked) {
                storyBeat(currentLevelIndex, 'clear', stageClear);
            } else if (this.hintTimer <= 0) {
                this.hintTimer = 1.5;
                floatingTexts.push(new FloatingText(`CÒN ${enemies.filter(e => !e.dead).length} QUÁI`, this.x - 40, this.y - 10, '#fca5a5', 10));
            }
        }
    }

    draw(ctx, camX) {
        const drawX = this.x - camX + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.save();
        ctx.translate(drawX, drawY);

        if (!this.locked) {
            const pulse = 1 + Math.sin(this.rotation * 1.5) * 0.06;
            const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 70 * pulse);
            glow.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
            glow.addColorStop(0.35, 'rgba(245, 158, 11, 0.4)');
            glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.ellipse(0, 0, 60 * pulse, 80 * pulse, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.rotate(this.locked ? this.rotation * 0.2 : this.rotation);
        for (let i = 3; i > 0; i--) {
            if (this.locked) ctx.strokeStyle = i % 2 === 0 ? '#57534e' : '#78716c';
            else ctx.strokeStyle = i % 2 === 0 ? '#f59e0b' : '#ef4444';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.ellipse(0, 0, (this.width / 2) * (i / 3), (this.height / 2) * (i / 3), 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}

// --- SCENERY (ground props, generated per level) ---
let scenery = { decor: [] };

function buildScenery(level, theme) {
    const rand = seededRandom(level.worldWidth);
    scenery = { decor: [] };
    for (const p of level.platforms) {
        if (p.h < 40) continue;
        for (let x = p.x + 20; x < p.x + p.w - 60; x += 70 + rand() * 110) {
            if (rand() < 0.65) scenery.decor.push({ name: theme.props[Math.floor(rand() * theme.props.length)], x, y: p.y });
        }
    }
}

// --- ENVIRONMENT RENDERING ---
// Tiles a strip with parallax, bottom-aligned. `mirror` flips every other copy,
// which makes any image seamless.
function drawStrip(img, r, offset, bottom, scale = ART_SCALE, mirror = false) {
    const w = r.w * scale, h = r.h * scale;
    const first = Math.floor(offset / w);
    for (let i = first, x = -snap(offset - first * w); x < GAME_WIDTH; i++, x += w) {
        if (mirror && i % 2 !== 0) {
            ctx.save();
            ctx.translate(x + w, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(img, r.x, r.y, r.w, r.h, 0, bottom - h, w, h);
            ctx.restore();
        } else {
            ctx.drawImage(img, r.x, r.y, r.w, r.h, x, bottom - h, w, h);
        }
    }
}

// Sky, then the far and near background strips
function drawBackdrop(theme, camX) {
    const sky = theme.sky, skyW = sky.width * GAME_HEIGHT / sky.height;
    ctx.drawImage(sky, -snap(Math.min(camX * 0.03, skyW - GAME_WIDTH)), 0, skyW, GAME_HEIGHT);
    for (const l of theme.layers) {
        drawStrip(l.img, { x: 0, y: 0, w: l.img.width, h: l.img.height }, camX * l.parallax, l.bottom, l.scale, true);
    }
}

// One tile row cut into left cap / repeating middle / right cap, stretched to width w
function drawRowSlices(img, d, sy, sh, x, w, dy) {
    const S = d.scale || ART_SCALE;
    const L = d.left * S, R = d.right * S, dh = sh * S;
    const midSx = d.sx + d.left, midSw = d.sw - d.left - d.right, midW = midSw * S;
    ctx.drawImage(img, d.sx, sy, d.left, sh, x, dy, L, dh);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + L, dy, w - L - R, dh);
    ctx.clip();
    for (let mx = x + L; mx < x + w - R; mx += midW) {
        ctx.drawImage(img, midSx, sy, midSw, sh, mx, dy, midW, dh);
    }
    ctx.restore();
    ctx.drawImage(img, d.sx + d.sw - d.right, sy, d.right, sh, x + w - R, dy, R, dh);
}

function drawPlatform(theme, p, drawX) {
    const img = theme.groundTiles;
    if (p.h >= 40) {
        // Solid ground: top edge row, then fill rows down to the bottom of the platform
        const d = TILE[theme.ground];
        const S = d.scale || ART_SCALE;
        let dy = p.y - d.surface * S;
        drawRowSlices(img, d, d.topY, d.topH, drawX, p.w, dy);
        dy += d.topH * S;
        while (dy < p.y + p.h) {
            drawRowSlices(img, d, d.fillY, d.fillH, drawX, p.w, dy);
            dy += d.fillH * S;
        }
    } else {
        const d = TILE[theme.ledge];
        drawRowSlices(img, d, d.sy, d.sh, drawX, p.w, p.y - d.surface * (d.scale || ART_SCALE));
    }
}

function drawDecor(theme, item, camX) {
    const S = ART_SCALE;
    const x = snap(item.x - camX);
    if (!PROPS[item.name]) {
        drawCodeProp(ctx, item.name, x, item.y);
    } else {
        const r = PROPS[item.name];
        const w = r.w * (r.scale || S), h = r.h * (r.scale || S);
        if (x + w < 0 || x > GAME_WIDTH) return;
        ctx.drawImage(r.img ? IMG[r.img] : theme.tiles, r.x, r.y, r.w, r.h, x, item.y + 2 - h, w, h);
    }
}

function drawEnvironment(ctx, level, camX) {
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, level.bgGradient[0]);
    grad.addColorStop(0.5, level.bgGradient[1]);
    grad.addColorStop(1, level.bgGradient[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const theme = THEMES[level.theme];
    if (!theme) return; // assets still loading

    // Parallax layers, far to near
    drawBackdrop(theme, camX);

    const haze = ctx.createLinearGradient(0, 200, 0, GAME_HEIGHT);
    haze.addColorStop(0, 'rgba(0, 0, 0, 0)');
    haze.addColorStop(1, theme.fog);
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    for (const item of scenery.decor) {
        drawDecor(theme, item, camX);
    }

    for (let p of level.platforms) {
        const drawX = p.x - camX;
        if (drawX + p.w < -100 || drawX > GAME_WIDTH + 100) continue;
        drawPlatform(theme, p, drawX);
    }

    if (theme.cave) drawCaveCeiling(camX);
}

const vignette = ctx.createRadialGradient(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_HEIGHT * 0.35, GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_HEIGHT * 0.95);
vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');


function drawCharacterFace(canvasEl, charId) {
    const a = canvasEl.getContext('2d');
    const ch = CHARACTERS[charId];
    // face crop from the first idle frame
    const [sx, sy, sw, sh] = ch.face;
    a.imageSmoothingEnabled = false;
    a.clearRect(0, 0, canvasEl.width, canvasEl.height);
    a.drawImage(ch.sheet, sx, sy, sw, sh, 0, 0, canvasEl.width, canvasEl.height);
}

function drawAvatar() {
    drawCharacterFace(avatarCanvas, player.charId);
    document.getElementById('hud-name').innerText = player.char.name;
}

// --- GAME INSTANCES ---
let player = new Player(100, 350);
let currentLevel = LEVELS[0];
let enemies = [];
let portal = new Portal(currentLevel.portalX, currentLevel.portalY);

function loadLevel(index) {
    currentLevelIndex = index;
    currentLevel = LEVELS[currentLevelIndex];
    respawnPoint = { x: 100, y: 350 };
    player.reset(respawnPoint.x, respawnPoint.y);
    camera.snapTo(player, currentLevel.worldWidth);

    enemies = currentLevel.enemies.map(e => new Enemy(e.x, e.y, e.type));
    pickWeirdos(index);
    streamFeed = [];
    portal = new Portal(currentLevel.portalX, currentLevel.portalY);
    checkpoints = (currentLevel.checkpoints || []).map(c => new Checkpoint(c.x, c.y));
    pickups = (currentLevel.peaches || []).map(p => new Pickup(p.x, p.y));
    chests = (currentLevel.chests || []).map(c => new Chest(c.x, c.y));
    hazards = (currentLevel.hazards || []).map(h => new Hazard(h.x, h.y));
    webs = (currentLevel.webs || []).map(w => new Web(w.x, w.y, w.w, w.h));
    clones = [];
    projectiles = [];
    heroShots = [];
    zones = [];
    beams = [];
    gazes = [];
    cutIn.timer = 0;
    shockwaves = [];
    impacts = [];
    particles = [];
    floatingTexts = [];
    bubbles = [];

    const theme = THEMES[currentLevel.theme];
    buildScenery(currentLevel, theme);
    resetAmbient(theme.ambient);

    levelIndicator.innerText = `CẢNH ${currentLevelIndex + 1}`;
    levelBanner.text = currentLevel.name;
    levelBanner.timer = BANNER_TIME;
    storyDelay = null;
    updateHUD();
}

function releaseKeys() {
    for (const k in keys) keys[k] = false;
}

// Shows the HTML pieces that belong to each game state
function setUiFor(state) {
    const inStage = ['PLAYING', 'PAUSED', 'CLEAR', 'GAMEOVER'].includes(state);
    hud.classList.toggle('hidden', !inStage);
    mobileControls.classList.toggle('hidden', state !== 'PLAYING' && state !== 'DUEL');
    mapUi.classList.toggle('hidden', state !== 'MAP');
}

function hideOverlays() {
    for (const el of [startOverlay, gameOverOverlay, clearOverlay, pauseOverlay, shopOverlay, duelOverlay, charOverlay, storyOverlay]) el.classList.add('hidden');
    clearInterval(story.timer);
    shopOpen = false;
}
