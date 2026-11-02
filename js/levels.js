// Stage layouts and the generated stretches that make them longer

// --- LEVEL DEFINITIONS (TÂY DU KÝ THEME) ---
const LEVELS = [
    {
        name: "CẢNH 1: HOA QUẢ SƠN - NGƯU MA VƯƠNG",
        theme: 'forest',
        worldWidth: 3300,
        topY: -560, // the camera climbs this far above the first screen
        ownClimb: true, // its well is hand-made, so extendLevel adds none
        bgGradient: ['#0f380f', '#306230', '#8bac0f'],
        // Lower road straight to the boss, or up the well between two cliffs (Giếng Thủy Liêm)
        // onto the ridge with the chest, then down the steps. The ridge has no monsters: the climb stays optional.
        platforms: [
            { x: 0, y: 480, w: 1960, h: 60, type: 'grass' },
            { x: 250, y: 360, w: 180, h: 20, type: 'wood' },
            { x: 520, y: 280, w: 160, h: 20, type: 'wood' },
            // The well: two hanging cliffs with an 80px gap under them for the lower road
            { x: 860, y: -300, w: 100, h: 700, type: 'grass' },
            { x: 1160, y: -300, w: 100, h: 700, type: 'grass' },
            { x: 960, y: 380, w: 80, h: 20, type: 'wood' },
            { x: 1080, y: 280, w: 80, h: 20, type: 'wood' },
            { x: 960, y: 180, w: 80, h: 20, type: 'wood' },
            { x: 1080, y: 80, w: 80, h: 20, type: 'wood' },
            // no ledges for the last 380px: wall jumps only
            // The ridge above, then steps back down
            { x: 1260, y: -300, w: 640, h: 60, type: 'grass' },
            { x: 1960, y: -190, w: 120, h: 20, type: 'wood' },
            { x: 2110, y: -80, w: 120, h: 20, type: 'wood' },
            { x: 2260, y: 40, w: 120, h: 20, type: 'wood' },
            // Lower road
            { x: 1400, y: 370, w: 160, h: 20, type: 'wood' },
            { x: 1680, y: 300, w: 140, h: 20, type: 'wood' },
            { x: 2060, y: 480, w: 340, h: 60, type: 'grass' },
            { x: 2500, y: 480, w: 800, h: 60, type: 'grass' },
            { x: 2950, y: 170, w: 150, h: 20, type: 'wood' }, // secret ledge (Trụ Thiên)
        ],
        enemies: [
            { x: 400, y: 420, type: 'slime' },
            { x: 700, y: 420, type: 'goblin' },
            { x: 1450, y: 310, type: 'slime' },
            { x: 1650, y: 420, type: 'goblin' },
            { x: 2200, y: 420, type: 'goblin' },
            { x: 2750, y: 400, type: 'boss' },
        ],
        bossName: 'NGƯU MA VƯƠNG',
        bossShot: '#f97316',
        bossPower: 0.6, // first boss: less HP and damage
        hints: [
            { x: 1060, y: 470, text: '↑ Leo giếng: áp vào vách rồi nhảy để bật tường' }
        ],
        // y values are the surface the object stands on
        checkpoints: [{ x: 760, y: 480 }, { x: 2120, y: 480 }],
        peaches: [{ x: 340, y: 330 }, { x: 600, y: 250 }, { x: 1000, y: 150 }, { x: 1060, y: -160 },
                  { x: 1400, y: -340 }, { x: 1700, y: -340 }, { x: 1480, y: 340 }],
        chests: [{ x: 1820, y: -300 }, { x: 3000, y: 170 }],
        portalX: 3150,
        portalY: 400
    },
    {
        name: "CẢNH 2: HỎA DIỆM SƠN - AFTERNOON TÀ",
        theme: 'fire',
        worldWidth: 2500,
        bgGradient: ['#450a0a', '#7f1d1d', '#180202'],
        platforms: [
            { x: 0, y: 480, w: 500, h: 60, type: 'stone' },
            { x: 600, y: 480, w: 400, h: 60, type: 'stone' },
            { x: 1100, y: 480, w: 500, h: 60, type: 'stone' },
            { x: 1700, y: 480, w: 800, h: 60, type: 'stone' },
            { x: 200, y: 350, w: 160, h: 20, type: 'stone' },
            { x: 420, y: 260, w: 140, h: 20, type: 'stone' },
            { x: 700, y: 360, w: 200, h: 20, type: 'stone' },
            { x: 1000, y: 280, w: 160, h: 20, type: 'stone' },
            { x: 1300, y: 350, w: 220, h: 20, type: 'stone' },
            { x: 1850, y: 340, w: 180, h: 20, type: 'stone' },
            { x: 1190, y: 140, w: 140, h: 20, type: 'stone' }, // secret ledge (Trụ Thiên)
        ],
        enemies: [
            { x: 300, y: 420, type: 'goblin' },
            { x: 750, y: 300, type: 'goblin' },
            { x: 1200, y: 420, type: 'demon' },
            { x: 1400, y: 280, type: 'slime' },
            { x: 2100, y: 400, type: 'boss' },
        ],
        bossName: 'AFTERNOON TÀ',
        bossShot: '#a855f7', // Lửa Hắc Ám
        checkpoints: [{ x: 1150, y: 480 }, { x: 1740, y: 480 }],
        peaches: [{ x: 280, y: 320 }, { x: 490, y: 230 }, { x: 1080, y: 250 }, { x: 1410, y: 320 }],
        chests: [{ x: 860, y: 480 }, { x: 1240, y: 140 }],
        portalX: 2350,
        portalY: 400
    },
    {
        name: "CẢNH 3: BẠCH CỐT ĐỘNG - BẠCH CỐT TINH",
        theme: 'bone',
        worldWidth: 2800,
        bgGradient: ['#1e1b4b', '#312e81', '#030712'],
        platforms: [
            { x: 0, y: 480, w: 600, h: 60, type: 'obsidian' },
            { x: 720, y: 480, w: 500, h: 60, type: 'obsidian' },
            { x: 1300, y: 480, w: 600, h: 60, type: 'obsidian' },
            { x: 2000, y: 480, w: 800, h: 60, type: 'obsidian' },
            { x: 300, y: 340, w: 200, h: 20, type: 'obsidian' },
            { x: 800, y: 340, w: 220, h: 20, type: 'obsidian' },
            { x: 1100, y: 240, w: 180, h: 20, type: 'obsidian' },
            { x: 1500, y: 330, w: 240, h: 20, type: 'obsidian' },
            { x: 2100, y: 340, w: 200, h: 20, type: 'obsidian' },
            { x: 1560, y: 130, w: 140, h: 20, type: 'obsidian' }, // secret ledge (Trụ Thiên)
        ],
        enemies: [
            { x: 400, y: 280, type: 'goblin' },
            { x: 850, y: 420, type: 'demon' },
            { x: 1150, y: 180, type: 'demon' },
            { x: 1600, y: 260, type: 'goblin' },
            { x: 2350, y: 400, type: 'boss' },
        ],
        bossName: 'BẠCH CỐT TINH',
        bossShot: '#c4b5fd',
        checkpoints: [{ x: 780, y: 480 }, { x: 2040, y: 480 }],
        peaches: [{ x: 400, y: 310 }, { x: 910, y: 310 }, { x: 1190, y: 210 }, { x: 1620, y: 300 }],
        chests: [{ x: 1420, y: 480 }, { x: 1610, y: 130 }],
        portalX: 2650,
        portalY: 400
    },
    {
        name: "CẢNH 4: LONG CUNG ĐÔNG HẢI - LONG VƯƠNG",
        theme: 'sea',
        water: true, // slow falls, swim upward any number of times
        worldWidth: 3000,
        bgGradient: ['#082f49', '#0c4a6e', '#020617'],
        platforms: [
            { x: 0, y: 480, w: 600, h: 60, type: 'stone' },
            { x: 760, y: 480, w: 520, h: 60, type: 'stone' },
            { x: 1460, y: 480, w: 520, h: 60, type: 'stone' },
            { x: 2160, y: 480, w: 840, h: 60, type: 'stone' },
            { x: 300, y: 330, w: 160, h: 20, type: 'stone' },
            { x: 620, y: 250, w: 140, h: 20, type: 'stone' },
            { x: 1000, y: 320, w: 180, h: 20, type: 'stone' },
            { x: 1300, y: 200, w: 140, h: 20, type: 'stone' },
            { x: 1700, y: 300, w: 180, h: 20, type: 'stone' },
            { x: 1130, y: 100, w: 120, h: 20, type: 'stone' }, // secret ledge
        ],
        // Hải lưu: zones that push the player (fx per frame, fy added to vertical speed)
        currents: [
            { x: 1280, y: 260, w: 180, h: 220, fx: -1.6, fy: 0 },
            { x: 1980, y: 0, w: 180, h: 540, fx: 0, fy: 0.25 },
        ],
        hazards: [{ x: 900, y: 480 }, { x: 940, y: 480 }, { x: 1600, y: 480 }, { x: 1640, y: 480 }, { x: 2300, y: 480 }],
        enemies: [
            { x: 450, y: 420, type: 'crab' },
            { x: 680, y: 300, type: 'jelly' },
            { x: 1100, y: 380, type: 'fish' },
            { x: 1370, y: 330, type: 'jelly' },
            { x: 1800, y: 420, type: 'crab' },
            { x: 1750, y: 200, type: 'fish' },
            { x: 2070, y: 300, type: 'jelly' },
            { x: 2600, y: 400, type: 'boss' },
        ],
        bossName: 'ĐÔNG HẢI LONG VƯƠNG',
        bossShot: '#7dd3fc',
        checkpoints: [{ x: 1050, y: 480 }, { x: 2220, y: 480 }],
        peaches: [{ x: 380, y: 300 }, { x: 690, y: 220 }, { x: 1370, y: 170 }, { x: 1790, y: 270 }, { x: 2070, y: 200 }],
        chests: [{ x: 1160, y: 100 }, { x: 1850, y: 480 }],
        portalX: 2880,
        portalY: 400
    },
    {
        name: "CẢNH 5: BÀN TƠ ĐỘNG - NHỆN TINH",
        theme: 'web',
        worldWidth: 3000,
        bgGradient: ['#0c0a09', '#1c1917', '#000000'],
        platforms: [
            { x: 0, y: 480, w: 650, h: 60, type: 'stone' },
            { x: 780, y: 480, w: 570, h: 60, type: 'stone' },
            { x: 1500, y: 480, w: 550, h: 60, type: 'stone' },
            { x: 2200, y: 480, w: 800, h: 60, type: 'stone' },
            { x: 280, y: 350, w: 160, h: 20, type: 'stone' },
            { x: 560, y: 260, w: 140, h: 20, type: 'stone' },
            { x: 900, y: 330, w: 180, h: 20, type: 'stone' },
            { x: 1180, y: 230, w: 150, h: 20, type: 'stone' },
            { x: 1560, y: 320, w: 160, h: 20, type: 'stone' },
            { x: 1820, y: 240, w: 140, h: 20, type: 'stone' },
            { x: 1400, y: 110, w: 110, h: 20, type: 'stone' }, // secret ledge
        ],
        // Mạng nhện: zones that slow the player until cut with an attack
        webs: [
            { x: 1000, y: 380, w: 110, h: 100 },
            { x: 1180, y: 130, w: 150, h: 100 },
            { x: 1650, y: 380, w: 110, h: 100 },
            { x: 2320, y: 380, w: 100, h: 100 },
        ],
        enemies: [
            { x: 380, y: 440, type: 'spiderling' },
            { x: 520, y: 40, type: 'spider' },
            { x: 1100, y: 440, type: 'spiderling' },
            { x: 1250, y: 30, type: 'spider' },
            { x: 1600, y: 440, type: 'spiderling' },
            { x: 1720, y: 40, type: 'spider' },
            { x: 1950, y: 440, type: 'spiderling' },
            { x: 2600, y: 400, type: 'boss' },
        ],
        bossName: 'NHỆN TINH BÀN TƠ',
        bossShot: '#e5e7eb',
        bossShotSlows: true, // web balls stick to the player
        checkpoints: [{ x: 880, y: 480 }, { x: 2260, y: 480 }],
        peaches: [{ x: 360, y: 320 }, { x: 630, y: 230 }, { x: 1250, y: 200 }, { x: 1890, y: 210 }, { x: 2100, y: 330 }],
        chests: [{ x: 1430, y: 110 }, { x: 1960, y: 480 }],
        portalX: 2880,
        portalY: 400
    },
    {
        name: "CẢNH 6: THIÊN CUNG - NHỊ LANG THẦN",
        theme: 'sky',
        worldWidth: 3200,
        bgGradient: ['#fde68a', '#fbbf24', '#78350f'],
        platforms: [
            { x: 0, y: 480, w: 500, h: 60, type: 'stone' },
            { x: 560, y: 420, w: 140, h: 20, type: 'cloud' },
            { x: 760, y: 360, w: 120, h: 20, type: 'cloud', move: { dx: 90, speed: 1 } },
            { x: 980, y: 300, w: 140, h: 20, type: 'cloud' },
            { x: 1180, y: 380, w: 120, h: 20, type: 'cloud', move: { dx: 120, speed: 0.8 } },
            { x: 1420, y: 320, w: 140, h: 20, type: 'cloud' },
            { x: 1600, y: 480, w: 350, h: 60, type: 'stone' },
            { x: 1700, y: 300, w: 140, h: 20, type: 'cloud' },
            { x: 2000, y: 400, w: 120, h: 20, type: 'cloud', move: { dx: 100, speed: 1.1 } },
            { x: 2220, y: 330, w: 130, h: 20, type: 'cloud' },
            { x: 2400, y: 480, w: 800, h: 60, type: 'stone' },
            { x: 1240, y: 170, w: 110, h: 20, type: 'cloud' }, // secret ledge
        ],
        // Gió trời: a headwind before the island and a tailwind updraft after it
        currents: [
            { x: 1340, y: 180, w: 200, h: 300, fx: -1.4, fy: 0 },
            { x: 1960, y: 0, w: 220, h: 540, fx: 1.2, fy: -0.15 },
        ],
        enemies: [
            { x: 300, y: 420, type: 'soldier' },
            { x: 900, y: 200, type: 'cloud' },
            { x: 1500, y: 150, type: 'cloud' },
            { x: 1780, y: 420, type: 'soldier' },
            { x: 2150, y: 150, type: 'cloud' },
            { x: 2550, y: 420, type: 'soldier' },
            { x: 2850, y: 400, type: 'boss' },
        ],
        bossName: 'NHỊ LANG THẦN',
        bossShot: '#fde047',
        checkpoints: [{ x: 1640, y: 480 }, { x: 2440, y: 480 }],
        peaches: [{ x: 620, y: 390 }, { x: 820, y: 320 }, { x: 1050, y: 270 }, { x: 1490, y: 290 }, { x: 2280, y: 300 }],
        chests: [{ x: 1270, y: 170 }, { x: 1880, y: 480 }],
        portalX: 3100,
        portalY: 400
    },
    {
        name: "CẢNH 7: THIÊN MÔN - THIÊN MỆNH PHÁP TƯỚNG",
        theme: 'gate',
        worldWidth: 3300,
        bgGradient: ['#0f0c29', '#302b63', '#24243e'],
        platforms: [
            { x: 0, y: 480, w: 520, h: 60, type: 'stone' },
            { x: 590, y: 420, w: 140, h: 20, type: 'stone' },
            { x: 790, y: 350, w: 130, h: 20, type: 'stone', move: { dx: 80, speed: 0.9 } },
            { x: 1010, y: 300, w: 150, h: 20, type: 'stone' },
            { x: 1230, y: 380, w: 130, h: 20, type: 'stone' },
            { x: 1420, y: 480, w: 400, h: 60, type: 'stone' },
            { x: 1500, y: 320, w: 140, h: 20, type: 'stone' },
            { x: 1900, y: 410, w: 130, h: 20, type: 'stone', move: { dx: 100, speed: 1 } },
            { x: 2130, y: 340, w: 140, h: 20, type: 'stone' },
            { x: 2340, y: 420, w: 120, h: 20, type: 'stone' },
            { x: 2520, y: 480, w: 780, h: 60, type: 'stone' },
            { x: 1080, y: 170, w: 110, h: 20, type: 'stone' }, // secret ledge
        ],
        enemies: [
            { x: 300, y: 420, type: 'soldier' },
            { x: 1000, y: 200, type: 'cloud' },
            { x: 1550, y: 420, type: 'goblin' },
            { x: 1700, y: 420, type: 'soldier' },
            { x: 2200, y: 150, type: 'cloud' },
            { x: 2650, y: 420, type: 'goblin' },
            { x: 2950, y: 400, type: 'boss' },
        ],
        bossName: 'THIÊN MỆNH PHÁP TƯỚNG',
        bossShot: '#a855f7',
        bossPower: 1.2, // the last boss hits harder
        checkpoints: [{ x: 1460, y: 480 }, { x: 2560, y: 480 }],
        peaches: [{ x: 650, y: 390 }, { x: 850, y: 310 }, { x: 1080, y: 270 }, { x: 1560, y: 290 }, { x: 2190, y: 310 }],
        chests: [{ x: 1120, y: 170 }, { x: 1760, y: 480 }],
        portalX: 3200,
        portalY: 400
    }
];

// --- LONGER STAGES ---
// Generated stretches are inserted just before each boss arena (the stage's last ground platform),
// using the stage's own monsters. Seeded, so a stage is the same every time.
const EXTRA_CHUNKS = 4;
const CHUNK_W = 1000;
const FLYER_HEIGHT = { demon: 300, fish: 320, jelly: 300, spider: 40, cloud: 150 }; // spawn y of flying monsters
// --- CLIMBS: one per stage, each built around its own cơ quan (see js/mechanisms.js) ---
// A climb fills one chunk: the lower road runs straight along the bottom, the climb leads up to a
// ridge with a chest and peaches (no monsters up there, so it stays optional), and the ridge end
// drops back onto the road. x is the chunk's left edge.

// Shared pieces: the road with its monsters and checkpoint, and the reward ridge
function climbBase(level, x, groundType, walker, flyer, hint) {
    level.platforms.push({ x, y: 480, w: CHUNK_W, h: 60, type: groundType });
    level.checkpoints.push({ x: x + 40, y: 480 });
    level.hints = [...(level.hints || []), { x: x + 480, y: 470, text: hint }];
    level.enemies.push(
        { x: x + 300, y: 420, type: walker() },
        { x: x + 640, y: 420, type: walker() },
        { x: x + 900, y: 420, type: walker() });
    if (flyer) level.enemies.push({ x: x + 700, y: FLYER_HEIGHT[flyer], type: flyer });
    if (!level.water) level.topY = Math.min(level.topY || 0, -560);
}
function climbRidge(level, x, w, y, groundType) {
    level.platforms.push({ x, y, w, h: 60, type: groundType });
    level.peaches.push({ x: x + 60, y: y - 40 }, { x: x + 160, y: y - 40 });
    level.chests.push({ x: x + w - 50, y });
}
// Two hanging cliffs with a 200px well between them; the road passes under them
function climbWell(level, x, groundType, top) {
    level.platforms.push(
        { x: x + 120, y: top, w: 100, h: 400 - top, type: groundType },
        { x: x + 420, y: top, w: 100, h: 400 - top, type: groundType });
}

const CLIMBS = {
    // Hỏa Diệm Sơn: crumbling stone ledges in the well, and lava that rises after you once you start
    fire(level, x, g, ledge) {
        climbWell(level, x, g, -300);
        for (let y = 380, i = 0; y >= -120; y -= 100, i++) level.platforms.push({ ...ledge(i % 2 ? x + 340 : x + 220, y, 80), crumble: 'stone' });
        level.lavas = [...(level.lavas || []), { x: x + 220, w: 200, floor: 480, top: -330, speed: 50 }];
        level.peaches.push({ x: x + 320, y: -200 });
        climbRidge(level, x + 520, 340, -300, g);
        return 'Dung nham dâng khi leo: leo nhanh! · bệ đá nứt sẽ sập';
    },
    // Bạch Cốt Động: a zig-zag of ledges with bone spikes on a timer, and a stone door on the ridge
    // that the skull switch halfway up opens
    bone(level, x, g, ledge) {
        const steps = [[150, 390], [330, 300], [150, 210], [330, 120], [150, 30], [330, -60], [150, -150], [330, -240]];
        steps.forEach(([lx, ly], i) => {
            level.platforms.push(ledge(x + lx, ly, 120));
            if (i % 2 === 1) level.spikes = [...(level.spikes || []), { x: x + lx + 10, y: ly, w: 100, period: 2.4, offset: i * 0.6 }];
        });
        level.switches = [...(level.switches || []), { x: x + 210, y: -150, gate: 'bone' + x, look: 'skull' }];
        climbRidge(level, x + 520, 360, -300, g);
        level.platforms.push({ x: x + 600, y: -700, w: 30, h: 400, type: g, gate: 'bone' + x });
        return 'Gai xương nhô theo nhịp · đánh đầu lâu để mở cửa đá';
    },
    // Long Cung: a bubble column lifts you, a current along the top pushes you back,
    // and a clam on the sea floor opens the shell door in front of the chest
    sea(level, x, g, ledge) {
        level.currents = [...(level.currents || []),
            { x: x + 230, y: 150, w: 90, h: 330, fx: 0, fy: -0.75, bubbles: true },
            { x: x + 330, y: 130, w: 220, h: 90, fx: -1.1, fy: 0 }];
        level.platforms.push(ledge(x + 120, 300, 110), ledge(x + 380, 240, 110));
        climbRidge(level, x + 520, 360, 120, g);
        level.platforms.push({ x: x + 760, y: 0, w: 30, h: 120, type: g, gate: 'clam' + x });
        level.switches = [...(level.switches || []), { x: x + 560, y: 480, gate: 'clam' + x, look: 'shell' }];
        return 'Cột bong bóng đẩy lên · đánh vỏ sò dưới đáy để mở cửa';
    },
    // Bàn Tơ Động: climb a silk thread, then hop across ledges hanging on silk that snaps if you linger
    web(level, x, g, ledge) {
        level.ropes = [...(level.ropes || []), { x: x + 200, y: -40, h: 520, look: 'silk' }];
        level.platforms.push(ledge(x + 220, -40, 110));
        level.platforms.push({ ...ledge(x + 380, -120, 90), crumble: 'silk' }, { ...ledge(x + 520, -200, 90), crumble: 'silk' });
        climbRidge(level, x + 640, 300, -300, g);
        level.peaches.push({ x: x + 200, y: 120 });
        return 'Giữ ↑ để leo tơ · bệ treo tơ sẽ đứt nếu đứng lâu';
    },
    // Thiên Cung: clouds rising and sinking on their own rhythm, a crosswind near the top
    sky(level, x, g, ledge) {
        level.platforms.push(
            { ...ledge(x + 150, 300, 120), move: { dy: 170, speed: 1.0 } },
            { ...ledge(x + 340, 40, 120), move: { dy: 140, speed: 1.2, phase: 1.6 } },
            { ...ledge(x + 150, -170, 120), move: { dy: 110, speed: 0.9, phase: 3.1 } },
            ledge(x + 380, -250, 130));
        level.currents = [...(level.currents || []), { x: x + 280, y: -180, w: 240, h: 160, fx: 1.0, fy: 0 }];
        climbRidge(level, x + 560, 340, -300, g);
        return 'Mây nâng lên xuống: canh nhịp mà nhảy';
    },
    // Thiên Môn: a chain of light, a floating island on a loop, a second chain up to the ridge,
    // and the road below is a locked room: every rune puppet down before the walls open
    gate(level, x, g, ledge, walker) {
        level.ropes = [...(level.ropes || []),
            { x: x + 200, y: 100, h: 380, look: 'chain' },
            { x: x + 520, y: -330, h: 340, look: 'chain' }];
        level.platforms.push(ledge(x + 150, 100, 110), { ...ledge(x + 320, 20, 120), move: { dx: 50, dy: 40, speed: 1.1 } });
        climbRidge(level, x + 560, 340, -300, g);
        level.locks = [...(level.locks || []), { x1: x + 560, x2: x + CHUNK_W, top: 160 }];
        level.enemies.push({ x: x + 760, y: 420, type: walker() });
        return 'Giữ ↑ để leo xích · phòng khóa: hạ hết rối mới mở';
    }
};

function addClimbChunk(level, x, groundType, ledge, walker, flyer) {
    const build = CLIMBS[level.theme];
    const hint = build(level, x, groundType, ledge, walker);
    climbBase(level, x, groundType, walker, flyer, hint);
}

function extendLevel(level, chunks) {
    const rand = seededRandom(level.worldWidth * 7 + 3);
    const pick = list => list[Math.floor(rand() * list.length)];
    const arena = level.platforms.filter(p => p.h >= 40).reduce((a, p) => (p.x > a.x ? p : a));
    const split = arena.x, shift = chunks * CHUNK_W;
    for (const key of ['platforms', 'enemies', 'checkpoints', 'peaches', 'chests', 'hazards', 'webs', 'currents']) {
        for (const o of level[key] || []) if (o.x >= split) o.x += shift;
    }
    level.portalX += shift;
    level.worldWidth += shift;

    const types = [...new Set(level.enemies.map(e => e.type).filter(t => t !== 'boss'))];
    const walkers = types.filter(t => !(t in FLYER_HEIGHT));
    const flyers = types.filter(t => t in FLYER_HEIGHT);
    const walker = () => pick(walkers.length ? walkers : flyers);
    const ledgeType = level.platforms.find(p => p.h < 40).type;
    for (let c = 0; c < chunks; c++) {
        const x = split + c * CHUNK_W;
        const ledge = (lx, ly, w) => ({ x: lx, y: ly, w, h: 20, type: ledgeType });
        if (c === 1 && !level.ownClimb) {
            addClimbChunk(level, x, arena.type, ledge, walker, flyers.length ? pick(flyers) : null);
            continue;
        }
        let flyX;
        if (c % 2 === 0) {
            // Two grounds with a jumpable gap, three ledges (the middle one over the gap)
            const groundA = 340 + rand() * 80, gap = 110 + rand() * 30, bx = x + groundA + gap;
            const l1 = ledge(x + 80 + rand() * 60, 340 + rand() * 30, 160);
            const l2 = ledge(x + groundA - 50, 250 + rand() * 30, 150);
            const l3 = ledge(bx + 180 + rand() * 80, 320 + rand() * 30, 170);
            level.platforms.push(
                { x, y: 480, w: groundA, h: 60, type: arena.type },
                { x: bx, y: 480, w: x + CHUNK_W - bx, h: 60, type: arena.type },
                l1, l2, l3);
            level.peaches.push({ x: l2.x + 70, y: l2.y - 30 });
            level.checkpoints.push({ x: bx + 40, y: 480 });
            level.enemies.push(
                { x: x + 150 + rand() * 100, y: 420, type: walker() },
                { x: l1.x + 60, y: l1.y - 60, type: walker() },
                { x: bx + 120, y: 420, type: walker() },
                { x: x + CHUNK_W - 160, y: 420, type: walker() });
            flyX = [x + groundA + gap / 2, x + CHUNK_W * 0.7];
        } else {
            // One long field: a low ledge at each end and a high one in the middle
            const l1 = ledge(x + 120 + rand() * 60, 350 + rand() * 20, 180);
            const l2 = ledge(x + 420 + rand() * 60, 240 + rand() * 30, 160);
            const l3 = ledge(x + 700 + rand() * 60, 350 + rand() * 20, 180);
            level.platforms.push({ x, y: 480, w: CHUNK_W, h: 60, type: arena.type }, l1, l2, l3);
            level.peaches.push({ x: l2.x + 70, y: l2.y - 30 });
            level.checkpoints.push({ x: x + 40, y: 480 });
            level.enemies.push(
                { x: x + 250, y: 420, type: walker() },
                { x: x + 500, y: 420, type: walker() },
                { x: x + 780, y: 420, type: walker() },
                { x: l2.x + 50, y: l2.y - 60, type: walker() });
            flyX = [x + 350, x + 650];
        }
        for (const fx of flyX) {
            if (flyers.length) {
                const t = pick(flyers);
                level.enemies.push({ x: fx, y: FLYER_HEIGHT[t], type: t });
                continue;
            }
            // No flyers in this stage: a walker instead, standing on the lowest platform under the spot
            // (the ledge when the spot is over the gap), never in mid-air over a pit
            const under = level.platforms
                .filter(p => p.x + 10 <= fx - 30 && fx + 30 <= p.x + p.w - 10)
                .sort((a, b) => b.y - a.y)[0];
            if (under) level.enemies.push({ x: fx - 27, y: under.y - 60, type: walker() });
        }
    }
}
for (const level of LEVELS) extendLevel(level, EXTRA_CHUNKS);
