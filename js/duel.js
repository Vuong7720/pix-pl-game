// Solo online (peer-to-peer duel)

// --- ONLINE DUEL (Solo online) ---
// PeerJS connects the two browsers directly. The host runs the match; the guest sends its
// inputs and draws the snapshots the host sends back ~30 times a second.
const PEERJS_URL = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
const PEER_PREFIX = 'tdk-duel-';
const DUEL = {
    hp: 150,
    damage: { 1: 8, 2: 10, 3: 14 }, // per combo step
    slamDamage: 25,
    cloneDamage: 4,
    freezeTime: 1.5,
    mpPerHit: 10,
    roundTime: 90,
    winsNeeded: 2
};
const COUNTER_KEYS = ['j', 's0', 's1', 's2']; // jump and the three skill slots

const duel = {
    active: false,      // a match is on screen
    isHost: false,
    peer: null,
    conn: null,
    code: '',
    arena: 'forest',
    fighters: [],       // [host fighter, guest fighter]
    localIndex: 0,
    remoteInput: { left: false, right: false, attack: false, dash: false },
    remoteCounters: null, // guest's jump/skill press counters last seen by the host
    localCounters: null,  // this guest's own press counters
    lastSentInput: '',
    inputTimer: 0,
    sendTimer: 0,
    round: 1,
    wins: [0, 0],
    roundWinner: -1,
    phase: 'intro',     // intro -> fight -> ko -> intro ... -> over
    phaseTimer: 0,
    timer: DUEL.roundTime,
    mainPlayer: null,   // the campaign Player, restored when the duel ends
    cutIns: [],         // host: ultimate cut-ins not yet sent to the guest
    opponentOf(f) {
        return this.fighters[0] === f ? this.fighters[1] : this.fighters[0];
    }
};

const duelOverlay = document.getElementById('duel-overlay');
const duelMenu = document.getElementById('duel-menu');
const duelLobby = document.getElementById('duel-lobby');
const duelResult = document.getElementById('duel-result');
const duelHostInfo = document.getElementById('duel-host-info');
const duelStatus = document.getElementById('duel-status');
const duelStartBtn = document.getElementById('duel-start-btn');
const duelLink = document.getElementById('duel-link');

function freshCounters() {
    return { j: 0, s0: 0, s1: 0, s2: 0 };
}

const duelCharSelect = document.getElementById('duel-char');
duelCharSelect.innerHTML = CHARACTER_IDS.map(id => `<option value="${id}">${CHARACTERS[id].name}</option>`).join('');

function sendMyCharacter() {
    if (!duel.isHost) sendDuel({ t: 'char', id: duelCharSelect.value, skills: loadoutOf(duelCharSelect.value) });
}

function loadPeerJs() {
    return new Promise((resolve, reject) => {
        if (window.Peer) return resolve();
        const s = document.createElement('script');
        s.src = PEERJS_URL;
        s.onload = resolve;
        s.onerror = () => reject(new Error('peerjs'));
        document.head.appendChild(s);
    });
}

function randomRoomCode() {
    const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no look-alikes such as O/0, I/1
    let code = '';
    for (let i = 0; i < 5; i++) code += letters[Math.floor(Math.random() * letters.length)];
    return code;
}

function makeArena(themeKey) {
    return {
        name: 'ĐẤU TRƯỜNG',
        theme: themeKey,
        water: themeKey === 'sea',
        worldWidth: GAME_WIDTH,
        bgGradient: ['#0f172a', '#1e293b', '#020617'],
        platforms: [
            { x: -40, y: 480, w: GAME_WIDTH + 80, h: 60, type: 'stone' },
            { x: 100, y: 350, w: 170, h: 20, type: 'ledge' },
            { x: GAME_WIDTH - 270, y: 350, w: 170, h: 20, type: 'ledge' },
            { x: GAME_WIDTH / 2 - 85, y: 230, w: 170, h: 20, type: 'ledge' }
        ]
    };
}

// --- Lobby UI ---
function showDuelPanel(panel) {
    for (const el of [duelMenu, duelLobby, duelResult]) el.classList.toggle('hidden', el !== panel);
}

function setDuelStatus(text) {
    duelStatus.innerText = text;
}

function openDuelOverlay() {
    initAudio();
    startMusic();
    duelCharSelect.value = save.character; // start from the campaign pick
    duelOverlay.classList.remove('hidden');
    showDuelPanel(duelMenu);
}

function isDuelOverlayOpen() {
    return !duelOverlay.classList.contains('hidden');
}

// --- Connection ---
async function createRoom() {
    showDuelPanel(duelLobby);
    duelHostInfo.classList.remove('hidden');
    duelStartBtn.classList.add('hidden');
    duelLink.value = '';
    setDuelStatus('Đang tạo phòng...');
    try {
        await loadPeerJs();
    } catch (e) {
        setDuelStatus('Không tải được thư viện kết nối. Hãy kiểm tra mạng.');
        return;
    }
    duel.isHost = true;
    duel.code = randomRoomCode();
    const peer = new Peer(PEER_PREFIX + duel.code);
    duel.peer = peer;
    peer.on('open', () => {
        duelLink.value = `${location.origin}${location.pathname}?room=${duel.code}`;
        document.getElementById('duel-code-text').innerText = duel.code;
        setDuelStatus('Đang chờ đối thủ vào phòng...');
    });
    peer.on('connection', (conn) => {
        if (duel.conn) {
            conn.close(); // the room already has two players
            return;
        }
        setupConnection(conn);
        conn.on('open', () => {
            setDuelStatus('Đối thủ đã vào phòng!');
            duelStartBtn.classList.remove('hidden');
        });
    });
    peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
            // someone else owns this code: try another one
            peer.destroy();
            createRoom();
            return;
        }
        setDuelStatus(`Lỗi kết nối (${err.type}).`);
    });
}

async function joinRoom(rawCode) {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;
    showDuelPanel(duelLobby);
    duelHostInfo.classList.add('hidden');
    duelStartBtn.classList.add('hidden');
    setDuelStatus(`Đang vào phòng ${code}...`);
    try {
        await loadPeerJs();
    } catch (e) {
        setDuelStatus('Không tải được thư viện kết nối. Hãy kiểm tra mạng.');
        return;
    }
    duel.isHost = false;
    duel.code = code;
    const peer = new Peer();
    duel.peer = peer;
    peer.on('open', () => {
        const conn = peer.connect(PEER_PREFIX + code, { serialization: 'json', reliable: true });
        setupConnection(conn);
        conn.on('open', () => {
            setDuelStatus('Đã vào phòng! Chờ chủ phòng bắt đầu...');
            sendMyCharacter();
        });
    });
    peer.on('error', (err) => {
        setDuelStatus(err.type === 'peer-unavailable'
            ? 'Không tìm thấy phòng. Kiểm tra lại mã, hoặc chủ phòng đã thoát.'
            : `Lỗi kết nối (${err.type}).`);
    });
}

function setupConnection(conn) {
    duel.conn = conn;
    conn.on('data', onDuelMessage);
    conn.on('close', () => onDuelDisconnect(conn));
    conn.on('error', () => onDuelDisconnect(conn));
}

function sendDuel(msg) {
    if (duel.conn && duel.conn.open) duel.conn.send(msg);
}

function onDuelMessage(msg) {
    if (msg.t === 'start') {
        beginDuelMatch(msg.arena, msg.chars, msg.loadouts);
    } else if (msg.t === 'char' && duel.isHost) {
        if (CHARACTERS[msg.id]) {
            duel.guestChar = msg.id;
            duel.guestSkills = Array.isArray(msg.skills) && msg.skills.length === 3 && msg.skills.every(id => SKILLS[id]) ? msg.skills : null;
        }
    } else if (msg.t === 'snap') {
        applySnapshot(msg);
    } else if (msg.t === 'input' && duel.isHost) {
        applyRemoteInput(msg);
    } else if (msg.t === 'bye') {
        onDuelDisconnect(duel.conn);
    }
}

function onDuelDisconnect(conn) {
    if (!conn || duel.conn !== conn) return;
    duel.conn = null;
    if (duel.active) {
        endDuelMatch();
        goToMap();
    }
    duelOverlay.classList.remove('hidden');
    showDuelPanel(duelLobby);
    duelHostInfo.classList.toggle('hidden', !duel.isHost);
    duelStartBtn.classList.add('hidden');
    setDuelStatus(duel.isHost
        ? 'Đối thủ đã rời phòng. Link vẫn dùng được, đang chờ người khác vào...'
        : 'Mất kết nối với chủ phòng.');
}

function leaveDuel() {
    sendDuel({ t: 'bye' });
    if (duel.active) endDuelMatch();
    const conn = duel.conn;
    duel.conn = null;
    if (conn) conn.close();
    if (duel.peer) duel.peer.destroy();
    duel.peer = null;
    // drop ?room= so a reload does not rejoin
    if (location.search.includes('room=')) history.replaceState(null, '', location.pathname + (DEV ? '?dev' : ''));
    goToMap();
}

// --- Match flow ---
// chars = [host character, guest character]; loadouts = their skill lists
function beginDuelMatch(arena, chars, loadouts = []) {
    duel.arena = arena;
    if (!duel.mainPlayer) duel.mainPlayer = player;

    const host = new Player(0, 0, chars[0]);
    const guest = new Player(0, 0, chars[1]);
    if (loadouts[0]) host.setCharacter(chars[0], loadouts[0]);
    if (loadouts[1]) guest.setCharacter(chars[1], loadouts[1]);
    host.cloneSheet = FLASH.clone;
    guest.cloneSheet = FLASH.p2clone;
    // Recolour the guest only when both picked the same character
    if (chars[0] === chars[1]) guest.sheet = guest.char.guestSheet;
    host.input = duel.isHost ? keys : NO_INPUT;
    guest.input = duel.isHost ? duel.remoteInput : NO_INPUT;
    for (const f of [host, guest]) {
        f.maxHp = Math.round(DUEL.hp * f.char.hp / 100);
    }
    duel.fighters = [host, guest];
    duel.localIndex = duel.isHost ? 0 : 1;
    player = duel.fighters[duel.localIndex];
    duel.wins = [0, 0];
    duel.cutIns = [];
    duel.round = 1;
    duel.remoteCounters = freshCounters();
    duel.localCounters = freshCounters();

    currentLevel = makeArena(arena);
    const theme = THEMES[arena];
    buildScenery(currentLevel, theme);
    resetAmbient(theme.ambient);
    camera.x = 0;
    camera.y = 0;
    enemies = [];
    chests = [];
    webs = [];
    hazards = [];
    checkpoints = [];
    pickups = [];
    projectiles = [];
    heroShots = [];
    tmFx = [];
    zones = [];
    beams = [];
    gazes = [];
    cutIn.timer = 0;
    particles = [];
    floatingTexts = [];
    shockwaves = [];
    impacts = [];
    levelBanner.timer = 0;

    duel.active = true;
    startDuelRound();
    hideOverlays();
    duelOverlay.classList.add('hidden');
    releaseKeys();
    gameState = 'DUEL';
    setUiFor(gameState);
}

function startDuelRound() {
    const [host, guest] = duel.fighters;
    host.reset(150, 480 - host.height);
    host.facing = 'right';
    guest.reset(GAME_WIDTH - 150 - guest.width, 480 - guest.height);
    guest.facing = 'left';
    for (const f of duel.fighters) f.mp = 30;
    clones = [];
    duel.roundWinner = -1;
    duel.phase = 'intro';
    duel.phaseTimer = 2;
    duel.timer = DUEL.roundTime;
}

function endDuelRound() {
    const [a, b] = duel.fighters;
    let winner = -1;
    if (a.isDead !== b.isDead) winner = a.isDead ? 1 : 0;
    else if (!a.isDead && a.hp !== b.hp) winner = a.hp > b.hp ? 0 : 1; // time out: more HP wins
    if (winner >= 0) duel.wins[winner]++;
    duel.roundWinner = winner;
    duel.phase = 'ko';
    duel.phaseTimer = 2.5;
    playSound('kill');
    addShake(8);
    hitStop = 0.3;
}

function endDuelMatch() {
    duel.active = false;
    if (duel.mainPlayer) player = duel.mainPlayer;
    duel.mainPlayer = null;
    duel.fighters = [];
    clones = [];
}

function showDuelResult() {
    const me = duel.localIndex;
    const won = duel.wins[me] > duel.wins[1 - me];
    document.getElementById('duel-result-title').innerText = won ? 'BẠN THẮNG!' : 'BẠN THUA!';
    document.getElementById('duel-result-score').innerText = `${duel.wins[me]} - ${duel.wins[1 - me]}`;
    document.getElementById('duel-rematch-btn').classList.toggle('hidden', !duel.isHost);
    document.getElementById('duel-rematch-wait').classList.toggle('hidden', duel.isHost);
    showDuelPanel(duelResult);
    duelOverlay.classList.remove('hidden');
}

function hostStartMatch(arena) {
    const chars = [duelCharSelect.value, duel.guestChar || 'wukong'];
    const loadouts = [loadoutOf(chars[0]), duel.guestSkills || [...CHARACTERS[chars[1]].skills]];
    sendDuel({ t: 'start', arena, chars, loadouts });
    beginDuelMatch(arena, chars, loadouts);
}

// --- Host side ---
function applyRemoteInput(m) {
    Object.assign(duel.remoteInput, { left: !!m.l, right: !!m.r, attack: !!m.a, dash: !!m.d });
    const guest = duel.fighters[1];
    const seen = duel.remoteCounters;
    if (guest && seen && duel.phase === 'fight') {
        if (m.j > seen.j) guest.queueJump();
        for (let slot = 0; slot < SLOT_KEYS.length; slot++) {
            if (m['s' + slot] > seen['s' + slot]) guest.useSkillSlot(slot);
        }
    }
    if (seen) for (const k of COUNTER_KEYS) seen[k] = m[k];
}

function resolveDuelHits() {
    for (let i = 0; i < 2; i++) {
        const a = duel.fighters[i], b = duel.fighters[1 - i];
        if (!a.isAttacking || a.hitThisSwing || a.isDead || b.isDead) continue;
        if (overlaps(a.attackBox, b)) {
            a.hitThisSwing = true; // one hit per swing
            if (b.takeDamage(Math.round(DUEL.damage[a.attackCombo] * a.attackPower()), a.facing)) {
                a.gainMp(DUEL.mpPerHit);
                hitStop = Math.max(hitStop, 0.05);
                addImpact(a, b);
            }
        }
    }
}

function updateDuelHost(dt) {
    const platforms = currentLevel.platforms;
    if (duel.phase === 'intro') {
        duel.phaseTimer -= dt;
        if (duel.phaseTimer <= 0) duel.phase = 'fight';
    } else if (duel.phase === 'fight' || duel.phase === 'ko') {
        for (const f of duel.fighters) {
            f.update(dt, platforms);
            f.x = Math.max(0, Math.min(GAME_WIDTH - f.width, f.x));
        }
        for (const c of clones) c.update(dt, platforms);
        updateSkillEffects(dt);
        clones = clones.filter(c => {
            if (c.life > 0) return true;
            cloudPuff(c.x + c.width / 2, c.y + c.height / 2);
            return false;
        });
        if (duel.phase === 'fight') {
            resolveDuelHits();
            duel.timer -= dt;
            if (duel.fighters.some(f => f.isDead) || duel.timer <= 0) endDuelRound();
        } else {
            duel.phaseTimer -= dt;
            if (duel.phaseTimer <= 0) {
                if (Math.max(...duel.wins) >= DUEL.winsNeeded) {
                    duel.phase = 'over';
                    showDuelResult();
                } else {
                    duel.round++;
                    startDuelRound();
                }
            }
        }
    }
    updateEffects(dt);
}

const r1 = v => Math.round(v * 10) / 10;
const r2 = v => Math.round(v * 100) / 100;

function duelSnapshot() {
    return {
        t: 'snap',
        f: duel.fighters.map(f => ({
            x: r1(f.x), y: r1(f.y), vx: r1(f.vx), vy: r1(f.vy), fc: f.facing === 'left' ? 1 : 0,
            st: f.animState, at: r2(f.animTime), cb: f.attackCombo, atk: r2(f.attackTimer), ad: f.attackDuration,
            sk: f.skill, sp: f.skillPhase, skt: r2(f.skillTimer), pb: f.pillarBaseY,
            g: f.isGrounded ? 1 : 0, dead: f.isDead ? 1 : 0, inv: r2(f.invulnerableTimer),
            hp: f.hp, mp: Math.round(f.mp), dash: f.isDashing ? 1 : 0, sl: f.slowed ? 1 : 0, fz: r2(f.frozen),
            ct: r2(f.castTimer), lp: f.skill === 'leap' ? Object.keys(LEAPS).find(k => LEAPS[k] === f.leap) : null,
            fm: f.form, bf: f.buff ? f.buff.kind : null, bh: f.buff ? f.buff.hits : 0, cp: f.castPose
        })),
        c: clones.map(c => ({
            x: r1(c.x), y: r1(c.y), vx: r1(c.vx), vy: r1(c.vy), fc: c.facing === 'left' ? 1 : 0,
            atk: r2(c.attackTimer), g: c.isGrounded ? 1 : 0, life: r2(c.life), o: duel.fighters.indexOf(c.owner)
        })),
        hs: heroShots.map(s => ({ k: s.kind, x: r1(s.x), y: r1(s.y), d: s.dir, dl: s.delay > 0 ? 1 : 0, o: duel.fighters.indexOf(s.owner) })),
        zn: zones.map(z => ({ k: z.kind, x: r1(z.x), y: z.y, w: z.w, r: z.r, l: r2(z.life), ml: z.maxLife, o: duel.fighters.indexOf(z.owner) })),
        gz: gazes.map(g => ({ k: g.kind, x: r1(g.x), y: g.y, d: g.dir, l: r2(g.life) })),
        ci: duel.cutIns.splice(0),
        bm: beams.map(b => ({ x: r1(b.x), b: b.bottom, l: r2(b.life) })),
        tf: tmFx.map(e => ({ k: e.kind, x: r1(e.x), y: r1(e.y), g: r1(e.ground), d: e.dir, t: r2(e.t), dl: e.delay, l: e.life })),
        m: { round: duel.round, wins: duel.wins, phase: duel.phase, pt: r2(duel.phaseTimer), timer: r1(duel.timer), rw: duel.roundWinner }
    };
}

// --- Guest side ---
function applySnapshot(s) {
    if (!duel.active) return;
    s.f.forEach((d, i) => {
        const f = duel.fighters[i];
        const cx = d.x + f.width / 2, feetY = d.y + f.height;
        // The guest does not simulate, so it derives sounds and effects from what changed
        if (d.hp < f.hp) {
            createHitSparks(cx, d.y + f.height / 2, '#ef4444', 12);
            floatingTexts.push(new FloatingText(`-${f.hp - d.hp}`, d.x + 10, d.y - 10, '#ef4444', 16));
            playSound('hit');
            addShake(4);
        }
        if (d.atk > f.attackTimer + 0.05) playSound('slash');
        if (d.dash && !f.isDashing) playSound('slash');
        if ((d.sk && d.sk !== f.skill) || (d.ct > 0 && f.castTimer <= 0)) playSound('skill');
        if (d.sp === 'land' && f.skillPhase !== 'land' && d.lp) {
            addShockwave(cx, feetY, LEAPS[d.lp].radius, '#facc15');
            addShake(8);
            playSound('slam');
        }
        if (d.fz > 0 && f.frozen <= 0) addShockwave(cx, feetY, 200, '#fde047');
        if (d.dead && !f.isDead) playSound('kill');

        // Snap on big jumps (new round), otherwise glide toward the host's position
        if (Math.abs(d.x - f.x) > 80 || Math.abs(d.y - f.y) > 80) {
            f.x = d.x;
            f.y = d.y;
        }
        f.targetX = d.x;
        f.targetY = d.y;
        if (f.animState !== d.st || Math.abs(f.animTime - d.at) > 0.2) f.animTime = d.at;
        Object.assign(f, {
            vx: d.vx, vy: d.vy, facing: d.fc ? 'left' : 'right', animState: d.st, attackCombo: d.cb,
            attackTimer: d.atk, attackDuration: d.ad, skill: d.sk, skillPhase: d.sp, skillTimer: d.skt,
            pillarBaseY: d.pb, isGrounded: !!d.g, isDead: !!d.dead, invulnerableTimer: d.inv,
            hp: d.hp, mp: d.mp, isDashing: !!d.dash, slowed: !!d.sl, frozen: d.fz,
            castTimer: d.ct, leap: d.lp ? LEAPS[d.lp] : null, form: d.fm || null,
            buff: d.bf ? { kind: d.bf, hits: d.bh, timer: 1 } : null, castPose: d.cp || null
        });
    });

    // Thrown skills, quicksand and light pillars are drawn from the host's copies
    heroShots = s.hs.map(d => Object.assign(Object.create(HeroShot.prototype), {
        kind: d.k, x: d.x, y: d.y, dir: d.d, delay: d.dl, owner: duel.fighters[d.o]
    }));
    zones = s.zn.map(d => ({ kind: d.k, x: d.x, y: d.y, w: d.w, r: d.r, life: d.l, maxLife: d.ml, owner: duel.fighters[d.o] }));
    for (const c of s.ci || []) {
        showCutIn(c.c, c.t);
        playSound('roar');
        addShake(8);
    }
    gazes = s.gz.map(d => ({ kind: d.k, x: d.x, y: d.y, dir: d.d, life: d.l }));
    beams = s.bm.map(d => ({ x: d.x, bottom: d.b, life: d.l }));
    // Thiên Mệnh effects: drawn only, the host already dealt their damage
    tmFx = (s.tf || []).map(d => Object.assign(Object.create(TmEffect.prototype), {
        kind: d.k, x: d.x, y: d.y, ground: d.g, dir: d.d, t: d.t, delay: d.dl, life: d.l, owner: null, hits: new Set()
    }));

    const before = clones.length;
    clones = s.c.map(d => Object.assign(Object.create(Clone.prototype), {
        x: d.x, y: d.y, vx: d.vx, vy: d.vy, facing: d.fc ? 'left' : 'right', attackTimer: d.atk,
        isGrounded: !!d.g, life: d.life, width: 40, height: 62, animTime: worldTime,
        sheet: d.o === 1 ? FLASH.p2clone : FLASH.clone
    }));
    if (clones.length > before) for (const c of clones) cloudPuff(c.x + c.width / 2, c.y + c.height / 2);

    const prevPhase = duel.phase;
    Object.assign(duel, { round: s.m.round, wins: s.m.wins, phase: s.m.phase, phaseTimer: s.m.pt, timer: s.m.timer, roundWinner: s.m.rw });
    if (duel.phase === 'ko' && prevPhase === 'fight') {
        playSound('kill');
        addShake(8);
    }
    if (duel.phase === 'over' && prevPhase !== 'over') showDuelResult();
}

function updateDuelGuest(dt) {
    for (const f of duel.fighters) {
        if (f.targetX !== undefined) {
            f.x += (f.targetX - f.x) * 0.5;
            f.y += (f.targetY - f.y) * 0.5;
        }
        // keep animations moving between snapshots
        f.animTime += dt;
        if (f.attackTimer > 0) f.attackTimer = Math.max(0, f.attackTimer - dt);
        if (f.skillTimer > 0) f.skillTimer = Math.max(0, f.skillTimer - dt);
        if (f.invulnerableTimer > 0) f.invulnerableTimer -= dt;
        if (f.frozen > 0) f.frozen -= dt;
    }
    updateEffects(dt);
}

function sendGuestInput(dt) {
    const msg = {
        t: 'input', l: keys.left ? 1 : 0, r: keys.right ? 1 : 0, a: keys.attack ? 1 : 0, d: keys.dash ? 1 : 0,
        ...duel.localCounters
    };
    const signature = JSON.stringify(msg);
    duel.inputTimer -= dt;
    // send on change, and every 0.1s anyway in case a packet was lost
    if (signature !== duel.lastSentInput || duel.inputTimer <= 0) {
        sendDuel(msg);
        duel.lastSentInput = signature;
        duel.inputTimer = 0.1;
    }
}

// Jump / skill presses go to the local fighter (host) or are counted and sent (guest)
function localJump() {
    if (bossIntro.active) return skipBossIntro();
    if (duel.active) {
        if (duel.phase !== 'fight') return;
        if (!duel.isHost) {
            duel.localCounters.j++;
            return;
        }
    }
    player.queueJump();
}

function localSkill(slot) {
    if (bossIntro.active) return;
    if (duel.active) {
        if (duel.phase !== 'fight') return;
        if (!duel.isHost) {
            duel.localCounters['s' + slot]++;
            return;
        }
    }
    player.useSkillSlot(slot);
}

// --- Drawing ---
function drawDuelHud(ctx) {
    const names = ['CHỦ PHÒNG', 'KHÁCH'];
    duel.fighters.forEach((f, i) => {
        const w = 280, x = i === 0 ? 20 : GAME_WIDTH - 20 - w, y = 18;
        const left = i === 0;
        ctx.save();
        ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
        ctx.fillRect(x - 4, y - 4, w + 8, 42);
        ctx.font = "8px 'Press Start 2P', monospace";
        ctx.textAlign = left ? 'left' : 'right';
        ctx.fillStyle = left ? '#fde68a' : '#7dd3fc';
        ctx.fillText(names[i] + (i === duel.localIndex ? ' (BẠN)' : ''), left ? x : x + w, y + 8);
        // HP bars drain toward the centre of the screen
        const hpW = w * Math.max(0, f.hp / f.maxHp);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, y + 13, w, 10);
        ctx.fillStyle = f.hp / f.maxHp > 0.3 ? '#22c55e' : '#ef4444';
        ctx.fillRect(left ? x + w - hpW : x, y + 13, hpW, 10);
        const mpW = w * (f.mp / f.maxMp);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, y + 26, w, 4);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(left ? x + w - mpW : x, y + 26, mpW, 4);
        // round wins
        for (let k = 0; k < DUEL.winsNeeded; k++) {
            ctx.fillStyle = k < duel.wins[i] ? '#facc15' : '#334155';
            ctx.fillRect(left ? x + w - 10 - k * 14 : x + 2 + k * 14, y, 8, 8);
        }
        ctx.restore();
    });

    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.font = "16px 'Press Start 2P', monospace";
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(Math.max(0, Math.ceil(duel.timer))), GAME_WIDTH / 2, 42);
    let banner = '';
    if (duel.phase === 'intro') banner = duel.phaseTimer > 0.6 ? `HIỆP ${duel.round}` : 'ĐẤU!';
    else if (duel.phase === 'ko') banner = duel.roundWinner === -1 ? 'HÒA!' : duel.timer <= 0 ? 'HẾT GIỜ!' : 'K.O.!';
    if (banner) {
        ctx.font = "28px 'Press Start 2P', monospace";
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(banner, GAME_WIDTH / 2, 200);
    }
    ctx.restore();
}

function drawDuel(ctx, dt) {
    ctx.save();
    applyShake(ctx);
    drawEnvironment(ctx, currentLevel, 0);
    drawZones(ctx, 0);
    for (const c of clones) c.draw(ctx, 0);
    for (const f of duel.fighters) {
        f.draw(ctx, 0);
        drawSlash(ctx, f, 0);
    }
    drawShotsAndBeams(ctx, 0);
    drawShockwaves(ctx, 0);
    drawImpacts(ctx, 0);
    for (const p of particles) p.draw(ctx, 0);
    ctx.restore();

    const theme = THEMES[currentLevel.theme];
    if (currentLevel.water) drawWaterOverlay(ctx, 0);
    if (theme.dark) drawDarkness(ctx, 0);
    drawAmbient(ctx, 0);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    for (const ft of floatingTexts) ft.draw(ctx, 0);
    drawDuelHud(ctx);
    drawCutIn(ctx, dt);
    drawSkillSlots(ctx);
}

document.getElementById('map-duel-btn').addEventListener('click', openDuelOverlay);
document.getElementById('duel-create-btn').addEventListener('click', createRoom);
document.getElementById('duel-join-btn').addEventListener('click', () => joinRoom(document.getElementById('duel-code-input').value));
document.getElementById('duel-start-btn').addEventListener('click', () => hostStartMatch(document.getElementById('duel-arena').value));
document.getElementById('duel-rematch-btn').addEventListener('click', () => hostStartMatch(duel.arena));
document.getElementById('duel-close-btn').addEventListener('click', leaveDuel);
duelCharSelect.addEventListener('change', () => {
    duelCharSelect.blur();
    sendMyCharacter();
});
document.getElementById('duel-copy-btn').addEventListener('click', () => {
    duelLink.select();
    if (navigator.clipboard) navigator.clipboard.writeText(duelLink.value).catch(() => document.execCommand('copy'));
    else document.execCommand('copy');
    setDuelStatus('Đã chép link! Gửi cho bạn bè nhé. Đang chờ đối thủ...');
});
