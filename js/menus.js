// World map, character select, shop

// --- WORLD MAP (Hành Trình Tây Thiên) ---
// Nodes without a `stage` are teasers for stages that do not exist yet
const MAP_NODES = [
    { x: 80, y: 385, stage: 0, title: 'HOA QUẢ SƠN' },
    { x: 195, y: 290, stage: 1, title: 'HỎA DIỆM SƠN' },
    { x: 315, y: 365, stage: 2, title: 'BẠCH CỐT ĐỘNG' },
    { x: 430, y: 265, stage: 3, title: 'LONG CUNG' },
    { x: 540, y: 345, stage: 4, title: 'BÀN TƠ ĐỘNG' },
    { x: 640, y: 240, stage: 5, title: 'THIÊN CUNG' },
    { x: 735, y: 165, stage: 6, title: 'THIÊN MÔN' }
];
const MAP_HERO_SCALE = 0.75; // relative to the in-game size
const mapState = { selected: 0, from: 0, walkT: 1, t: 0 };
let shopOpen = false;

function isPlayable(node) {
    return node.stage !== undefined && (DEV || node.stage <= save.unlocked);
}

function goToMap() {
    hideOverlays();
    releaseKeys();
    gameState = 'MAP';
    // Stand on the stage just played, or the newest unlocked one
    const stage = Math.min(save.unlocked, Math.max(currentLevelIndex, 0));
    mapState.selected = mapState.from = MAP_NODES.findIndex(n => n.stage === stage);
    mapState.walkT = 1;
    currentLevel = LEVELS[stage];
    resetAmbient('firefly');
    updateMapUi();
    setUiFor(gameState);
}

function selectNode(i) {
    if (i < 0 || i >= MAP_NODES.length || i === mapState.selected || !isPlayable(MAP_NODES[i])) return;
    mapState.from = mapState.selected;
    mapState.selected = i;
    mapState.walkT = 0;
    currentLevel = LEVELS[MAP_NODES[i].stage];
    playSound('jump');
    updateMapUi();
}

function enterSelectedStage() {
    const node = MAP_NODES[mapState.selected];
    if (isPlayable(node)) startRun(node.stage);
}

function handleMapKey(code) {
    if (isDuelOverlayOpen()) return;
    if (shopOpen) {
        if (code === 'KeyB' || code === 'Escape') closeShop();
        return;
    }
    if (isCharSelectOpen()) {
        if (code === 'KeyC' || code === 'Escape') closeCharSelect();
        return;
    }
    if (code === 'ArrowLeft' || code === 'KeyA') selectNode(mapState.selected - 1);
    if (code === 'ArrowRight' || code === 'KeyD') selectNode(mapState.selected + 1);
    if (code === 'Enter' || code === 'Space' || code === 'KeyJ') enterSelectedStage();
    if (code === 'KeyB') openShop();
    if (code === 'KeyC') openCharSelect();
}

function updateMapUi() {
    document.getElementById('map-peaches').innerText = save.peaches;
}

// Click a node to walk there; click the node you are on to enter it
canvas.addEventListener('click', (e) => {
    if (gameState !== 'MAP' || shopOpen || isDuelOverlayOpen() || isCharSelectOpen()) return;
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / GAME_WIDTH, rect.height / GAME_HEIGHT);
    const x = (e.clientX - rect.left - (rect.width - GAME_WIDTH * scale) / 2) / scale;
    const y = (e.clientY - rect.top - (rect.height - GAME_HEIGHT * scale) / 2) / scale;
    const i = MAP_NODES.findIndex(n => Math.hypot(n.x - x, n.y - y) < 32);
    if (i === -1) return;
    if (i === mapState.selected && mapState.walkT >= 1) enterSelectedStage();
    else selectNode(i);
});

// Points along the curved road between two nodes
function mapRoadPoint(a, b, i, t) {
    const bend = i % 2 === 0 ? -40 : 40;
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2 + bend;
    const u = 1 - t;
    return { x: u * u * a.x + 2 * u * t * cx + t * t * b.x, y: u * u * a.y + 2 * u * t * cy + t * t * b.y };
}

function drawStars(ctx, x, y, count, size) {
    ctx.font = `${size}px sans-serif`;
    ctx.textAlign = 'center';
    for (let s = 0; s < 3; s++) {
        ctx.fillStyle = s < count ? '#facc15' : '#334155';
        ctx.fillText('★', x + (s - 1) * (size + 2), y);
    }
}

function drawMap(ctx, dt) {
    mapState.t += dt;
    if (mapState.walkT < 1) mapState.walkT = Math.min(1, mapState.walkT + dt / 0.4);

    drawBackdrop(THEMES.forest, mapState.t * 50);
    ctx.fillStyle = 'rgba(8, 12, 24, 0.5)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 6;
    ctx.font = "20px 'Press Start 2P', monospace";
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('HÀNH TRÌNH TÂY THIÊN', GAME_WIDTH / 2, 70);
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.fillStyle = '#fde68a';
    ctx.fillText('VƯỢT 81 KIẾP NẠN', GAME_WIDTH / 2, 92);
    ctx.restore();

    // Road: gold dots once the stage before it is cleared
    for (let i = 0; i < MAP_NODES.length - 1; i++) {
        const a = MAP_NODES[i], b = MAP_NODES[i + 1];
        const done = a.stage !== undefined && (save.stars[a.stage] || 0) > 0;
        ctx.fillStyle = done ? '#facc15' : '#475569';
        for (let t = 0.12; t < 0.9; t += 0.07) {
            const p = mapRoadPoint(a, b, i, t);
            ctx.fillRect(snap(p.x - 2), snap(p.y - 2), 4, 4);
        }
    }

    MAP_NODES.forEach((n, i) => {
        const real = n.stage !== undefined;
        const playable = isPlayable(n);
        const stars = real ? (save.stars[n.stage] || 0) : 0;
        const fresh = playable && stars === 0;
        const r = 22 + (fresh ? Math.sin(mapState.t * 4) * 2 : 0);

        ctx.save();
        if (fresh) {
            ctx.shadowColor = '#f87171';
            ctx.shadowBlur = 16;
        }
        ctx.fillStyle = stars > 0 ? '#b45309' : playable ? '#991b1b' : '#1e293b';
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = stars > 0 ? '#facc15' : playable ? '#fca5a5' : '#475569';
        ctx.lineWidth = 3;
        if (!real) ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.textAlign = 'center';
        ctx.font = "12px 'Press Start 2P', monospace";
        ctx.fillStyle = playable ? '#fff7ed' : '#64748b';
        ctx.fillText(real ? String(n.stage + 1) : '?', n.x + 1, n.y + 6);

        ctx.font = "7px 'Press Start 2P', monospace";
        ctx.fillStyle = playable ? '#fde68a' : '#64748b';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(n.title, n.x, n.y - r - 26);
        ctx.shadowBlur = 0;
        if (real) drawStars(ctx, n.x, n.y + r + 14, stars, 10);
        else {
            ctx.font = "6px 'Press Start 2P', monospace";
            ctx.fillStyle = '#475569';
            ctx.fillText('SẮP RA MẮT', n.x, n.y + r + 14);
        }
    });

    // Monkey King walks between nodes
    const a = MAP_NODES[mapState.from], b = MAP_NODES[mapState.selected];
    const t = mapState.walkT;
    const ease = t * t * (3 - 2 * t);
    const hx = a.x + (b.x - a.x) * ease;
    const hy = a.y + (b.y - a.y) * ease;
    const walking = t < 1;
    // The chosen character walks the map
    const hero = CHARACTERS[save.character];
    const [anim, frame] = hero.animFor({ animState: walking ? 'run' : 'idle', animTime: mapState.t, vy: 0 }, hero);
    drawSprite(hero.sheet, anim, frame, hx, hy - 20, b.x < a.x, hero.scale * MAP_HERO_SCALE);

    // Info panel for the selected stage
    const sel = MAP_NODES[mapState.selected];
    const level = LEVELS[sel.stage];
    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
    ctx.fillRect(140, 418, 520, 48);
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;
    ctx.strokeRect(141, 419, 518, 46);
    ctx.textAlign = 'center';
    ctx.font = "9px 'Press Start 2P', monospace";
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(level.name, GAME_WIDTH / 2, 437);
    ctx.font = "7px 'Press Start 2P', monospace";
    ctx.fillStyle = '#94a3b8';
    const best = save.bestScores[sel.stage] || 0;
    ctx.fillText(`ĐIỂM CAO ${best}  ·  ←/→ CHỌN  ·  ENTER VÀO ẢI  ·  B CỬA HÀNG`, GAME_WIDTH / 2, 455);
    ctx.restore();
}

// --- CHARACTER SELECT ---
const charOverlay = document.getElementById('char-overlay');
const charList = document.getElementById('char-list');

function isCharSelectOpen() {
    return !charOverlay.classList.contains('hidden');
}

function openCharSelect() {
    renderCharSelect();
    charOverlay.classList.remove('hidden');
}

function closeCharSelect() {
    charOverlay.classList.add('hidden');
}

function statBar(value, max) {
    return `<div class="h-1.5 mt-1 bg-slate-800 rounded"><div class="h-full bg-amber-400 rounded" style="width: ${Math.round((value / max) * 100)}%"></div></div>`;
}

// One line per skill; for a character with a skill pool every pool skill is a toggle
function skillLines(id) {
    const c = CHARACTERS[id];
    const loadout = loadoutOf(id);
    if (!c.skillPool) {
        return loadout.map((sid, slot) =>
            `<div><span class="text-sky-300">[${SLOT_KEYS[slot]}] ${SKILLS[sid].name}</span> <span class="text-slate-500">· ${SKILLS[sid].desc}</span></div>`).join('');
    }
    const rows = c.skillPool.map(sid => {
        const slot = loadout.indexOf(sid);
        const on = slot >= 0;
        return `
            <div data-skill="${sid}" data-owner="${id}" class="flex items-start gap-2 px-2 py-1 rounded-lg cursor-pointer ${on ? 'bg-sky-950/70 border border-sky-500/50' : 'bg-slate-800/50 border border-transparent hover:border-slate-600'}">
                <span class="pixel-font text-[9px] mt-0.5 w-5 ${on ? 'text-sky-300' : 'text-slate-600'}">${on ? SLOT_KEYS[slot] : '·'}</span>
                <span><span class="${on ? 'text-sky-300' : 'text-slate-400'}">${SKILLS[sid].name}</span> <span class="text-slate-500">· ${SKILLS[sid].desc}</span></span>
            </div>`;
    }).join('');
    return `<div class="text-[10px] text-amber-300/80 mb-1">Chọn 3 trong ${c.skillPool.length} thần thông (bấm để đổi):</div>${rows}`;
}

function renderCharSelect() {
    charList.innerHTML = CHARACTER_IDS.map(id => {
        const c = CHARACTERS[id];
        const chosen = id === save.character;
        return `
            <div data-char="${id}" class="text-left p-3 rounded-xl border-2 space-y-2 cursor-pointer transition ${chosen ? 'border-amber-400 bg-amber-950/40' : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'}">
                <div class="flex items-center gap-3">
                    <canvas data-face="${id}" width="48" height="48" class="w-12 h-12 pixelated rounded-lg bg-slate-800"></canvas>
                    <div>
                        <div class="pixel-font text-[11px] text-amber-300">${c.name}</div>
                        <div class="text-xs text-slate-400">${c.role}</div>
                    </div>
                    ${chosen ? '<span class="ml-auto pixel-font text-[9px] text-emerald-400">ĐANG CHỌN</span>' : ''}
                </div>
                <div class="grid grid-cols-3 gap-2 text-[10px] text-slate-400">
                    <div>Máu ${c.hp}${statBar(c.hp, 150)}</div>
                    <div>Tốc độ${statBar(c.speed, 7)}</div>
                    <div>Nhảy ${c.jumps}${statBar(c.jumps, 3)}</div>
                </div>
                <div class="space-y-1 text-[11px]">${skillLines(id)}</div>
                <div class="text-[11px] text-emerald-300/80">✦ ${c.passiveText}</div>
            </div>`;
    }).join('');
    for (const cv of charList.querySelectorAll('canvas[data-face]')) drawCharacterFace(cv, cv.dataset.face);
}

// Picking a pool skill adds it to the loadout and drops the oldest pick (always 3 skills)
function toggleLoadoutSkill(charId, skillId) {
    const loadout = loadoutOf(charId);
    if (loadout.includes(skillId)) return;
    loadout.shift();
    loadout.push(skillId);
    save.loadouts = { ...(save.loadouts || {}), [charId]: loadout };
}

charList.addEventListener('click', (e) => {
    const skillRow = e.target.closest('[data-skill]');
    const card = e.target.closest('[data-char]');
    if (!card) return;
    if (skillRow) toggleLoadoutSkill(skillRow.dataset.owner, skillRow.dataset.skill);
    save.character = card.dataset.char;
    writeSave();
    player.setCharacter(save.character);
    drawAvatar();
    playSound('pickup');
    renderCharSelect();
});

// --- SHOP ---
function openShop() {
    shopOpen = true;
    renderShop();
    shopOverlay.classList.remove('hidden');
}

function closeShop() {
    shopOpen = false;
    shopOverlay.classList.add('hidden');
    updateMapUi();
}

function renderShop() {
    document.getElementById('shop-peaches').innerText = save.peaches;
    const rows = UPGRADES.map(u => {
        const lv = upgradeLevel(u.id);
        const maxed = lv >= u.cost.length;
        const price = maxed ? 0 : u.cost[lv];
        const affordable = !maxed && save.peaches >= price;
        const pips = u.cost.map((_, i) =>
            `<span class="inline-block w-3 h-1.5 rounded-sm ${i < lv ? 'bg-amber-400' : 'bg-slate-700'}"></span>`).join('');
        return `
            <div class="flex items-center gap-3 bg-slate-900/80 border border-slate-700 rounded-xl p-3">
                <div class="flex-1">
                    <div class="pixel-font text-[10px] text-amber-300">${u.name}</div>
                    <div class="text-xs text-slate-400 mt-1">${u.desc}</div>
                    <div class="flex gap-1 mt-1.5">${pips}</div>
                </div>
                <button data-upgrade="${u.id}" ${affordable ? '' : 'disabled'}
                    class="min-w-[84px] py-2 px-3 rounded-lg pixel-font text-[10px] transition ${maxed ? 'bg-slate-800 text-emerald-400' : affordable ? 'bg-pink-600 hover:bg-pink-500 text-white cursor-pointer' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}">
                    ${maxed ? 'TỐI ĐA' : `<i class="fa-solid fa-apple-whole"></i> ${price}`}
                </button>
            </div>`;
    });
    const hero = CHARACTERS[save.character];
    const skills = loadoutOf(save.character).map((id, slot) => {
        const s = SKILLS[id];
        const learned = isSkillLearned(slot);
        return `
        <div class="flex justify-between text-xs ${learned ? 'text-sky-300' : 'text-slate-600'}">
            <span>[${SLOT_KEYS[slot]}] ${s.name}</span>
            <span>${learned ? 'Đã lĩnh ngộ' : `Qua ải ${SLOT_UNLOCK_STAGE[slot] + 1} để lĩnh ngộ`}</span>
        </div>`;
    });
    document.getElementById('shop-list').innerHTML = rows.join('') +
        `<div class="pt-2 space-y-1 border-t border-slate-700/60"><div class="pixel-font text-[9px] text-slate-400 mb-1">THẦN THÔNG · ${hero.name}</div>${skills.join('')}</div>`;
}

document.getElementById('shop-list').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-upgrade]');
    if (!btn || btn.disabled) return;
    const u = UPGRADES.find(x => x.id === btn.dataset.upgrade);
    const lv = upgradeLevel(u.id);
    const price = u.cost[lv];
    if (lv >= u.cost.length || save.peaches < price) return;
    save.peaches -= price;
    save.upgrades[u.id] = lv + 1;
    writeSave();
    playSound('checkpoint');
    renderShop();
    updateMapUi();
});
