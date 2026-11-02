// Image files, sprite sheet layouts, tiles and stage themes

// --- ASSETS (pixel art: "Legacy Fantasy - High Forest" by Anokolisa) ---
const ASSET_FILES = {
    tiles: 'tiles.png',
    hqsSky: 'hqs-sky.png',
    hqsFar: 'hqs-far.png',
    hqsNear: 'hqs-near.png',
    hqsTiles: 'hqs-tiles.png',
    hdsSky: 'hds-sky.png',
    hdsFar: 'hds-far.png',
    hdsNear: 'hds-near.png',
    hdsTiles: 'hds-tiles.png',
    bcdSky: 'bcd-sky.png',
    bcdFar: 'bcd-far.png',
    bcdNear: 'bcd-near.png',
    bcdTiles: 'bcd-tiles.png',
    lcSky: 'lc-sky.png',
    lcFar: 'lc-far.png',
    lcNear: 'lc-near.png',
    lcTiles: 'lc-tiles.png',
    btdSky: 'btd-sky.png',
    btdFar: 'btd-far.png',
    btdNear: 'btd-near.png',
    btdTiles: 'btd-tiles.png',
    tcSky: 'tc-sky.png',
    tcFar: 'tc-far.png',
    tcNear: 'tc-near.png',
    tcTiles: 'tc-tiles.png',
    tmSky: 'tm-sky.png',
    tmFar: 'tm-far.png',
    tmNear: 'tm-near.png',
    tmTiles: 'tm-tiles.png',
    bossAfternoon: 'boss-afternoon.png',
    bossNguma: 'boss-nguma.png',
    bossBachcot: 'boss-bachcot.png',
    mobMonkey: 'mob-monkey.png',
    mobSilver: 'mob-silver.png',
    mobImp: 'mob-imp.png',
    mobBull: 'mob-bull.png',
    mobSkeleton: 'mob-skeleton.png',
    mobLantern: 'mob-lantern.png',
    mobShrimp: 'mob-shrimp.png',
    mobCrabgen: 'mob-crabgen.png',
    mobBigspider: 'mob-bigspider.png',
    mobSpiderwoman: 'mob-spiderwoman.png',
    mobGold: 'mob-gold.png',
    mobCrane: 'mob-crane.png',
    mobPuppet: 'mob-puppet.png',
    mobSpearpuppet: 'mob-spearpuppet.png',
    hero: 'hero-wukong.png',
    wukongEyes: 'wukong-eyes.png',
    heroNezha: 'hero-nezha.png',
    heroBajie: 'hero-bajie.png',
    heroSha: 'hero-sha.png',
    heroTang: 'hero-tang.png',
    boarRun: 'boar-run.png',
    snailWalk: 'snail-walk.png',
    snailDead: 'snail-dead.png',
    beeFly: 'bee-fly.png',
    beeAttack: 'bee-attack.png'
};
const IMG = {};
const FLASH = {}; // solid-colour silhouettes for hit flashes and dash trails

function loadAssets() {
    const jobs = Object.entries(ASSET_FILES).map(([key, file]) => new Promise((resolve) => {
        const img = new Image();
        img.onload = () => { IMG[key] = img; resolve(); };
        img.onerror = () => { console.error(`Không tải được assets/${file}`); resolve(); };
        img.src = `assets/${file}`;
    }));
    return Promise.all(jobs);
}

// Shifts an image toward `color` by `amount` (0..1) while keeping its transparency
function tintImage(img, color, amount) {
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.globalAlpha = amount;
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    return c;
}

// Frame layouts: row = sheet row, ax = body centre x inside a frame, foot = lowest row of the feet
// Monkey King sheet (hero-wukong.png): 240x170 cells, one animation per row, facing right.
// The art is high resolution, so it is drawn at 0.5: one sheet pixel per device pixel.
const HERO_SCALE = 0.5;
const wukongCell = (row, frames) => ({ row, fw: 240, fh: 170, frames, ax: 100, foot: 165 });
const HERO_ANIMS = {
    idle:   wukongCell(0, 2),
    run:    wukongCell(1, 7),
    jump:   wukongCell(2, 4),  // rising, apex, falling, somersault
    atk1:   wukongCell(3, 3),  // thrust
    atk2:   wukongCell(4, 2),  // sweeping arc
    atk3:   wukongCell(5, 3),  // spin and ground smash
    cast:   wukongCell(6, 1),  // palms together
    dead:   wukongCell(7, 2),
    leap:   wukongCell(8, 2),  // staff raised, overhead slam
    forms:  { ...wukongCell(9, 3), scale: 0.9 },  // eagle, mouse, fish (72 transformations), small so drawn larger
    stance: wukongCell(10, 1)
};
// Staff x under the monkey while Như Ý Trụ Thiên lifts him (relative to ax, sheet pixels)
const PILLAR_STAFF_X = 0;

// Every skill a character can have. `leap` skills take over movement (see LEAPS); the rest `cast` instantly.
// `pose` names the casting pose on the character's sheet; `cutIn` shows the eye portrait first.
const SKILLS = {
    // Tôn Ngộ Không
    pillar:    { cost: 40, name: 'NHƯ Ý TRỤ THIÊN', short: 'TRỤ', desc: 'Gậy mọc dài hất lên cao rồi đập đất', leap: 'pillar' },
    hundred:   { cost: 55, name: 'BÁCH PHÂN THÂN', short: 'BÁCH', desc: 'Ba phân thân vàng đánh cùng trong 7 giây', cast: p => spawnClones(p, 3) },
    freeze:    { cost: 60, name: 'ĐỊNH THÂN PHÁP', short: 'ĐỊNH', desc: 'Đóng băng kẻ địch xung quanh', cast: p => castFreeze(p) },
    eyes:      { cost: 70, name: 'HỎA NHÃN KIM TINH', short: 'NHÃN', desc: 'Mắt lửa phóng tia thiêu mọi kẻ địch phía trước', cast: p => castEyes(p), cutIn: true },
    circle:    { cost: 50, name: 'VÒNG TRÒN KIM CÔ', short: 'VÒNG', desc: 'Vòng vàng 4 giây: đứng trong vòng không bị thương, kẻ địch bị đẩy ra', cast: p => castCircle(p) },
    transform: { cost: 45, name: '72 BIẾN HÓA', short: 'BIẾN', desc: 'Hóa đại bàng bay lượn 5 giây (dưới nước hóa cá), không bị trúng đòn', cast: p => castTransform(p) },
    // Trư Bát Giới
    bellyslam: { cost: 40, name: 'BỤNG ĐÈ THÁI SƠN', short: 'ĐÈ', desc: 'Nhảy lên rồi lấy bụng đè, sóng chấn rất rộng', leap: 'belly' },
    feast:     { cost: 45, name: 'ĂN NO CHIẾN TIẾP', short: 'ĂN', desc: 'Hồi 35 máu và miễn sát thương chốc lát', cast: p => castFeast(p), pose: 'feast' },
    snore:     { cost: 60, name: 'NGỦ KHÒ CHẤN ĐỘNG', short: 'NGỦ', desc: 'Ngủ 2,5 giây: bất tử, hồi máu, tiếng ngáy hất văng kẻ địch', cast: p => castSnore(p) },
    rain:      { cost: 50, name: 'HÔ PHONG HOÁN VŨ', short: 'MƯA', desc: 'Gọi mây đen mưa xối xả phía trước 5 giây: làm chậm, bào máu', cast: p => castRain(p), pose: 'rain', cutIn: true },
    rakethrow: { cost: 45, name: 'NÉM CỬU XỈ ĐINH BA', short: 'NÉM', desc: 'Ném đinh ba xoay tít bay đi rồi quay về', cast: p => castRakeThrow(p), pose: 'throw' },
    piglet:    { cost: 40, name: 'BIẾN HÓA HEO CON', short: 'HEO', desc: 'Hóa heo con chạy nhanh 5 giây, không bị trúng đòn', cast: p => castPiglet(p) },
    // Sa Tăng
    quicksand: { cost: 40, name: 'LƯU SA HÀ', short: 'CÁT', desc: 'Vũng cát lún làm chậm và bào máu kẻ địch', cast: p => castQuicksand(p), pose: 'sweep' },
    counter:   { cost: 40, name: 'NGUYỆT NHA PHẢN ĐÒN', short: 'ĐỠ', desc: 'Thủ thế 1,2 giây, bị đánh thì phản đòn quanh mình', cast: p => castCounter(p), pose: 'barrier' },
    beads:     { cost: 50, name: 'CHUỖI ĐẦU LÂU', short: 'CHUỖI', desc: 'Ném chuỗi hạt bay đi rồi quay về', cast: p => castBeads(p), pose: 'throw' },
    tide:      { cost: 55, name: 'THỦY TRIỀU TRẤN', short: 'LỐC', desc: 'Lốc nước tiến chậm về phía trước, hút và bào máu kẻ địch', cast: p => castTide(p), pose: 'tide', cutIn: true },
    wave:      { cost: 40, name: 'QUÉT THỦY', short: 'SÓNG', desc: 'Sóng nước quét dọc mặt đất, hất văng mọi kẻ địch', cast: p => castWave(p), pose: 'sweep' },
    bubble:    { cost: 45, name: 'THỦY CẦU HỘ THỂ', short: 'CẦU', desc: 'Quả cầu nước chặn 3 đòn trong 6 giây', cast: p => castBubble(p), pose: 'bubble' },
    // Na Tra
    wheels:    { cost: 35, name: 'PHONG HỎA LUÂN', short: 'LUÂN', desc: 'Lao lửa xuyên qua mọi kẻ địch trên đường', cast: p => castWheels(p) },
    ring:      { cost: 45, name: 'CÀN KHÔN QUYỂN', short: 'VÒNG', desc: 'Vòng vàng nảy qua tối đa 3 kẻ địch', cast: p => castRing(p), pose: 'ringThrow' },
    sash:      { cost: 55, name: 'HỖN THIÊN LĂNG', short: 'LĂNG', desc: 'Dải lụa trói kẻ địch đầu tiên trúng phải', cast: p => castSash(p), pose: 'sash' },
    fireballs: { cost: 40, name: 'HỎA DIỆM', short: 'LỬA', desc: 'Ném liền ba quả cầu lửa', cast: p => castFireballs(p), pose: 'throw' },
    sixarms:   { cost: 50, name: 'TAM ĐẦU LỤC TÝ', short: 'LỤC', desc: 'Hóa ba đầu sáu tay 8 giây: đánh nhanh và mạnh hơn', cast: p => castSixArms(p), pose: 'six' },
    samadhi:   { cost: 70, name: 'TAM MUỘI CHÂN HỎA', short: 'HỎA', desc: 'Phun luồng lửa khổng lồ thiêu mọi kẻ địch phía trước', cast: p => castSamadhi(p), pose: 'fire', cutIn: true },
    // Đường Tăng
    chant:     { cost: 45, name: 'KIM CÔ CHÚ', short: 'CHÚ', desc: 'Niệm chú làm choáng kẻ địch xung quanh', cast: p => castChant(p), pose: 'chant' },
    heal:      { cost: 40, name: 'TỤNG KINH', short: 'KINH', desc: 'Hồi 40 máu trong 2 giây, gỡ tơ trói', cast: p => castHeal(p), pose: 'pray' },
    smite:     { cost: 55, name: 'PHẬT QUANG PHỔ CHIẾU', short: 'QUANG', desc: 'Cột sáng giáng xuống 3 kẻ địch gần nhất', cast: p => castSmite(p), pose: 'summon' },
    buddha:    { cost: 65, name: 'TRIỆU HOÁN PHẬT QUANG', short: 'PHẬT', desc: 'Tượng Phật vàng hiện 4 giây: hồi máu cho mình, đánh kẻ địch gần', cast: p => castBuddha(p), pose: 'summon', cutIn: true },
    meditate:  { cost: 30, name: 'TỊNH TÂM', short: 'TÂM', desc: 'Ngồi thiền 2,5 giây: bất tử, hồi máu và nạp Pháp Lực rất nhanh', cast: p => castMeditate(p), pose: 'meditate' },
    sutra:     { cost: 45, name: 'KINH VĂN HỘ THÂN', short: 'VĂN', desc: 'Chữ kinh vàng xoay quanh mình 6 giây, bào máu kẻ địch chạm vào', cast: p => castSutra(p), pose: 'chant' }
};
// Skill slots: keys and the stage whose clear unlocks each slot in the campaign
const SLOT_KEYS = ['U', 'I', 'O'];
const SLOT_UNLOCK_STAGE = [0, 1, 2];
// Leaping skills: launch height (px), slam radius and damage (campaign / duel), whether the staff is drawn
const LEAPS = {
    pillar: { height: 307, radius: 170, damage: 70, duelDamage: 25, staff: true },
    belly:  { height: 190, radius: 220, damage: 85, duelDamage: 28, staff: false }
};
const FREEZE_TIME = 3;
// Monkey King combo step -> [animation, first frame, frame count]
// Monkey King combo step -> attack animation row
const ATTACK_ROWS = { 1: 'atk1', 2: 'atk2', 3: 'atk3' };

// Playable characters. Sheets are attached in buildCharacters() once the art is ready.
const CHARACTERS = {
    wukong: {
        name: 'TÔN NGỘ KHÔNG', role: 'Cân bằng · Biến hóa',
        hp: 100, speed: 6, jumps: 2,
        attack: { timings: { 1: 0.3, 2: 0.24, 3: 0.4 }, reach: { 1: 80, 2: 90, 3: 120 }, damage: 1 },
        skills: ['pillar', 'hundred', 'eyes'],
        // Ngộ Không picks any 3 of these (Thất Thập Nhị Biến)
        skillPool: ['pillar', 'hundred', 'freeze', 'eyes', 'circle', 'transform'],
        passiveText: 'Cân Đẩu Vân: lướt mây không bị trúng đòn'
    },
    bajie: {
        name: 'TRƯ BÁT GIỚI', role: 'Đỡ đòn · Đánh nặng',
        hp: 150, speed: 4.8, jumps: 2,
        attack: { timings: { 1: 0.34, 2: 0.3, 3: 0.42 }, reach: { 1: 95, 2: 100, 3: 110 }, damage: 1.3 },
        skills: ['bellyslam', 'rakethrow', 'rain'],
        skillPool: ['bellyslam', 'feast', 'snore', 'rain', 'rakethrow', 'piglet'],
        passive: 'heavy', passiveText: 'Thân Nặng: gần như không bị đẩy lùi'
    },
    sha: {
        name: 'SA TĂNG', role: 'Phòng thủ · Khống chế',
        hp: 120, speed: 5.4, jumps: 2,
        attack: { timings: { 1: 0.3, 2: 0.28, 3: 0.36 }, reach: { 1: 105, 2: 110, 3: 120 }, damage: 1 },
        skills: ['wave', 'tide', 'bubble'],
        skillPool: ['quicksand', 'counter', 'beads', 'tide', 'wave', 'bubble'],
        passive: 'steady', passiveText: 'Vững Như Bàn Thạch: đứng yên thì nhận ít hơn 40% sát thương'
    },
    nezha: {
        name: 'NA TRA', role: 'Nhanh · Bay lượn',
        hp: 80, speed: 7, jumps: 3,
        attack: { timings: { 1: 0.2, 2: 0.18, 3: 0.26 }, reach: { 1: 85, 2: 85, 3: 95 }, damage: 0.85 },
        skills: ['wheels', 'fireballs', 'samadhi'],
        skillPool: ['wheels', 'ring', 'sash', 'fireballs', 'sixarms', 'samadhi'],
        passiveText: 'Phong Hỏa Luân: chạy nhanh nhất, nhảy được 3 lần'
    },
    tang: {
        name: 'ĐƯỜNG TĂNG', role: 'Hỗ trợ · Phép thuật',
        hp: 90, speed: 5.2, jumps: 2, mpGain: 1.5,
        attack: { timings: { 1: 0.28, 2: 0.26, 3: 0.32 }, reach: { 1: 70, 2: 75, 3: 80 }, damage: 0.75 },
        skills: ['chant', 'heal', 'buddha'],
        skillPool: ['chant', 'heal', 'smite', 'buddha', 'meditate', 'sutra'],
        passiveText: 'Chân Kinh: nạp Pháp Lực nhanh hơn 50%'
    }
};
const CHARACTER_IDS = Object.keys(CHARACTERS);

// Mob sheets face LEFT
const ENEMY_ANIMS = {
    snail:     { fw: 48, fh: 32, frames: 8, ax: 24, foot: 31 },
    snailDead: { fw: 48, fh: 32, frames: 8, ax: 24, foot: 31 },
    boar:      { fw: 48, fh: 32, frames: 6, ax: 23, foot: 31 },
    beeFly:    { fw: 64, fh: 64, frames: 4, ax: 30, foot: 44 },
    beeAttack: { fw: 64, fh: 64, frames: 4, ax: 30, foot: 45 },
    // Code-drawn sea creatures (see SEA_SPRITES), drawn at 3x; the boss at 4x
    fish:      { fw: 16, fh: 9,  frames: 2, ax: 8, foot: 8 },
    crab:      { fw: 16, fh: 10, frames: 2, ax: 8, foot: 9 },
    jelly:     { fw: 12, fh: 11, frames: 2, ax: 6, foot: 10 },
    dragon:    { fw: 24, fh: 24, frames: 2, ax: 9, foot: 23 },
    spider:    { fw: 14, fh: 9,  frames: 2, ax: 7, foot: 8 },
    spiderQueen: { fw: 24, fh: 20, frames: 2, ax: 12, foot: 19 },
    soldier:   { fw: 12, fh: 16, frames: 2, ax: 6, foot: 15 },
    stormCloud: { fw: 14, fh: 10, frames: 2, ax: 7, foot: 9 },
    erlang:    { fw: 24, fh: 24, frames: 2, ax: 9, foot: 23 }
};

// Afternoon Tà (boss-afternoon.png): a floating head, one 210x180 cell per frame, faces right.
// `start` picks frames further along a row.
const afCell = (row, frames, start = 0) => ({ fw: 210, fh: 180, frames, row, start, ax: 88, foot: 143 });
const AFTERNOON_ANIMS = {
    walk: afCell(0, 11),
    windup: afCell(1, 3),     // telegraph
    strike: afCell(1, 3, 3),  // charge
    jump: afCell(2, 4),
    hurt: afCell(3, 4),
    death: afCell(4, 4),
    rage: afCell(5, 6)        // roar / enraged (Địa Ngục Phán Xét)
};
// Painted monsters (mob-*.png): rows walk, attack, hurt, death in 192x150 cells, all facing right.
// The first two attack frames are the windup, the rest the strike.
const mobCell = (row, frames, start = 0) => ({ fw: 192, fh: 150, frames, row, start, ax: 96, foot: 144 });
const mobAnims = (walk, attack) => ({
    walk: mobCell(0, walk), windup: mobCell(1, 2), strike: mobCell(1, attack - 2, 2), hurt: mobCell(2, 1), death: mobCell(3, 3)
});
// w/h replace the hitbox of the enemy type they stand in for
const MOB_SKINS = {
    monkey:      { key: 'mobMonkey',      anims: mobAnims(6, 4), scale: 0.44, w: 32, h: 48, barLift: 14 },
    silver:      { key: 'mobSilver',      anims: mobAnims(6, 3), scale: 0.44, w: 34, h: 54, barLift: 16 },
    imp:         { key: 'mobImp',         anims: mobAnims(6, 4), scale: 0.42, w: 32, h: 48, barLift: 14 },
    bull:        { key: 'mobBull',        anims: mobAnims(6, 4), scale: 0.46, w: 38, h: 56, barLift: 16 },
    skeleton:    { key: 'mobSkeleton',    anims: mobAnims(6, 4), scale: 0.44, w: 32, h: 50, barLift: 14 },
    lantern:     { key: 'mobLantern',     anims: mobAnims(6, 3), scale: 0.42, w: 30, h: 44, barLift: 10 },
    shrimp:      { key: 'mobShrimp',      anims: mobAnims(6, 4), scale: 0.42, w: 34, h: 48, barLift: 14 },
    crabgen:     { key: 'mobCrabgen',     anims: mobAnims(6, 3), scale: 0.44, w: 44, h: 52, barLift: 14 },
    bigspider:   { key: 'mobBigspider',   anims: mobAnims(5, 4), scale: 0.42, w: 48, h: 24, barLift: 30 },
    spiderwoman: { key: 'mobSpiderwoman', anims: mobAnims(6, 4), scale: 0.42, w: 32, h: 48, barLift: 14 },
    gold:        { key: 'mobGold',        anims: mobAnims(6, 4), scale: 0.44, w: 34, h: 54, barLift: 16 },
    crane:       { key: 'mobCrane',       anims: mobAnims(6, 3), scale: 0.42, w: 32, h: 52, barLift: 14 },
    puppet:      { key: 'mobPuppet',      anims: mobAnims(6, 3), scale: 0.44, w: 32, h: 52, barLift: 14 },
    spearpuppet: { key: 'mobSpearpuppet', anims: mobAnims(6, 4), scale: 0.44, w: 32, h: 52, barLift: 14 }
};
// Which painted monster plays each enemy type, per stage theme (types not listed keep their old art)
const THEME_MOBS = {
    forest: { slime: 'monkey', goblin: 'silver' },
    fire:   { slime: 'imp', goblin: 'bull', demon: 'imp' },
    bone:   { slime: 'skeleton', goblin: 'skeleton', demon: 'lantern' },
    sea:    { fish: 'shrimp', crab: 'crabgen' },
    web:    { spider: 'bigspider', spiderling: 'spiderwoman' },
    sky:    { soldier: 'gold', cloud: 'crane' },
    gate:   { soldier: 'spearpuppet', goblin: 'puppet', cloud: 'lantern' }
};
function mobSkin(type) {
    const pick = currentLevel && THEME_MOBS[currentLevel.theme];
    return pick && pick[type] ? MOB_SKINS[pick[type]] : null;
}

// Ngưu Ma Vương and Bạch Cốt Tinh (boss-nguma.png, boss-bachcot.png) share one layout
const pbCell = (row, frames, start = 0) => ({ fw: 280, fh: 190, frames, row, start, ax: 140, foot: 184 });
const PAINTED_BOSS_ANIMS = {
    walk: pbCell(0, 3),
    windup: pbCell(1, 2),
    strike: pbCell(1, 2, 2),
    jump: pbCell(2, 3),
    hurt: pbCell(3, 2),
    death: pbCell(4, 4),
    rage: pbCell(5, 2)
};

// Ground rows: left cap / repeating middle / right cap. Hoa Quả Sơn (hqs-tiles.png) has its own layout
const TILE = {
    hqsGround: { sx: 0, sw: 416, left: 48, right: 48, topY: 0, topH: 239, fillY: 120, fillH: 119, surface: 14, scale: 0.5 },
    hqsLedge:  { sx: 0, sw: 464, left: 72, right: 72, sy: 243, sh: 96, surface: 4, scale: 0.5 }
};
// Ground decorations; without `img` they come from the theme's tinted tiles.png
const PROPS = {
    mushA:    { x: 257, y: 247, w: 30, h: 25 },
    mushC:    { x: 321, y: 251, w: 14, h: 21 },
    flower:   { x: 259, y: 271, w: 12, h: 17 },
    lavender: { x: 273, y: 272, w: 15, h: 32 },
    chest:     { x: 289, y: 277, w: 30, h: 27 },
    chestOpen: { x: 321, y: 275, w: 30, h: 29 },
    hqsFlower: { x: 0,   y: 343, w: 98, h: 90,  img: 'hqsTiles', scale: 0.5 },
    hqsRock:   { x: 102, y: 343, w: 96, h: 101, img: 'hqsTiles', scale: 0.5 },
    // Painted ground sheets of stages 2-7: one decoration each, next to the small block
    hdsFire:   { x: 124, y: 273, w: 216, h: 188, img: 'hdsTiles', scale: 0.35 },
    bcdSkulls: { x: 124, y: 273, w: 216, h: 154, img: 'bcdTiles', scale: 0.35 },
    lcShells:  { x: 124, y: 273, w: 218, h: 162, img: 'lcTiles', scale: 0.35 },
    tcLotus:   { x: 124, y: 273, w: 173, h: 138, img: 'tcTiles', scale: 0.35 },
    tmCrystal: { x: 124, y: 273, w: 151, h: 182, img: 'tmTiles', scale: 0.35 }
};
// Every painted sheet shares one layout: ground top row (also drawn smaller as the floating ledge),
// fill row under it, then a small floating block
for (const code of ['hds', 'bcd', 'lc', 'btd', 'tc', 'tm']) {
    TILE[code + 'Ground'] = { sx: 0, sw: 896, left: 96, right: 96, topY: 0, topH: 125, fillY: 125, fillH: 144, surface: 24, scale: 0.5 };
    TILE[code + 'Ledge'] = { sx: 0, sw: 896, left: 96, right: 96, sy: 0, sh: 125, surface: 24, scale: 0.32 };
    PROPS[code + 'Block'] = { x: 0, y: 273, w: 120, h: 125, img: code + 'Tiles', scale: 0.3 };
}

const THEMES = {};
// Painted stage art: <code>-sky/far/near.png and <code>-tiles.png (ground rows TILE[<code>Ground] / TILE[<code>Ledge])
function paintedStage(code, nearTint, tintAmount = 0.4, farTint = null) {
    return {
        sky: IMG[code + 'Sky'],
        layers: [
            { img: farTint ? tintImage(IMG[code + 'Far'], farTint, 0.55) : IMG[code + 'Far'], parallax: 0.12, scale: 0.65, bottom: GAME_HEIGHT - 90 },
            { img: tintImage(IMG[code + 'Near'], nearTint, tintAmount), parallax: 0.3, scale: 0.42, bottom: GAME_HEIGHT }
        ],
        groundTiles: IMG[code + 'Tiles'],
        ground: code + 'Ground',
        ledge: code + 'Ledge'
    };
}
function buildThemes() {
    // Hoa Quả Sơn: mountains, pine and peach trees
    THEMES.forest = {
        ...paintedStage('hqs', '#0b1a12'),
        tiles: IMG.tiles,
        props: ['hqsFlower', 'hqsRock', 'hqsFlower', 'flower'],
        fog: 'rgba(220, 255, 235, 0.18)',
        ambient: 'firefly',
        boss: 'bossNguma',
        bossAnim: PAINTED_BOSS_ANIMS.walk,
        bossAnims: PAINTED_BOSS_ANIMS,
        bossFacesRight: true,
        bossScale: 1,
        bossGlow: '#ef4444'
    };
    THEMES.fire = {
        ...paintedStage('hds', '#1a0505'),
        tiles: tintImage(IMG.tiles, '#7c2d12', 0.3),
        props: ['hdsFire', 'hdsBlock', 'hdsBlock'],
        fog: 'rgba(255, 110, 40, 0.22)',
        ambient: 'ember',
        boss: 'bossAfternoon',
        bossAnim: AFTERNOON_ANIMS.walk,
        bossAnims: AFTERNOON_ANIMS,
        bossFacesRight: true,
        bossScale: 1.1,
        bossGlow: '#a855f7'
    };
    THEMES.bone = {
        ...paintedStage('bcd', '#0f0c29'),
        tiles: tintImage(IMG.tiles, '#312e81', 0.35),
        props: ['bcdSkulls', 'bcdBlock', 'lavender'],
        fog: 'rgba(168, 85, 247, 0.2)',
        ambient: 'wisp',
        boss: 'bossBachcot',
        bossAnim: PAINTED_BOSS_ANIMS.walk,
        bossAnims: PAINTED_BOSS_ANIMS,
        bossFacesRight: true,
        bossScale: 1,
        bossGlow: '#a855f7'
    };
    // Long Cung: painted sea floor
    THEMES.sea = {
        ...paintedStage('lc', '#042f2e'),
        tiles: tintImage(IMG.tiles, '#0e7490', 0.38),
        props: ['lcShells', 'kelp', 'coral', 'lcBlock'],
        fog: 'rgba(56, 189, 248, 0.25)',
        ambient: 'bubble',
        boss: 'dragonKing',
        bossAnim: ENEMY_ANIMS.dragon,
        bossScale: 4,
        bossGlow: '#22d3ee',
        minion: 'crab'
    };
    // Cave: painted spider cave; darkness and a stalactite ceiling are drawn on top
    THEMES.web = {
        ...paintedStage('btd', '#0c0a09'),
        tiles: tintImage(IMG.tiles, '#3b0764', 0.35),
        props: ['btdBlock', 'mushA', 'mushC'],
        fog: 'rgba(168, 85, 247, 0.12)',
        ambient: 'wisp',
        boss: 'spiderQueen',
        bossAnim: ENEMY_ANIMS.spiderQueen,
        bossScale: 4,
        bossGlow: '#a855f7',
        minion: 'spiderling',
        cave: true,
        dark: true
    };
    // Heaven: golden sky, white jade floors and floating jade slabs
    THEMES.sky = {
        ...paintedStage('tc', '#78350f', 0.2),
        tiles: tintImage(IMG.tiles, '#fde68a', 0.55),
        props: ['tcLotus', 'lantern', 'tcBlock'],
        fog: 'rgba(254, 243, 199, 0.12)',
        ambient: 'sparkle',
        boss: 'erlang',
        bossAnim: ENEMY_ANIMS.erlang,
        bossScale: 4,
        bossGlow: '#fde047',
        minion: 'soldier'
    };

    // Thiên Môn: floating rune islands. Its boss is a stand-in (Nhị Lang Thần in gold)
    // until boss-thienmenh.png is drawn
    IMG.thienMenh = tintImage(IMG.erlang, '#fbbf24', 0.55);
    THEMES.gate = {
        // Both island layers pushed back into the dark so they do not read as platforms
        ...paintedStage('tm', '#0b0a1f', 0.65, '#1e1b4b'),
        tiles: tintImage(IMG.tiles, '#312e81', 0.4),
        props: ['tmCrystal', 'tmBlock', 'tmBlock'],
        fog: 'rgba(250, 204, 21, 0.08)',
        ambient: 'sparkle',
        boss: 'thienMenh',
        bossAnim: ENEMY_ANIMS.erlang,
        bossScale: 5,
        bossGlow: '#facc15',
        minion: 'soldier'
    };

    const enemySheets = ['boarRun', 'snailWalk', 'beeFly', 'beeAttack',
        'fishSwim', 'crabWalk', 'jellyFloat', 'dragonKing', 'spiderCrawl', 'spiderQueen',
        'soldierWalk', 'stormCloud', 'erlang', 'bossAfternoon', 'bossNguma', 'bossBachcot',
        'mobMonkey', 'mobSilver', 'mobImp', 'mobBull', 'mobSkeleton', 'mobLantern', 'mobShrimp', 'mobCrabgen', 'mobBigspider', 'mobSpiderwoman', 'mobGold', 'mobCrane', 'mobPuppet', 'mobSpearpuppet', 'thienMenh'];
    FLASH.gold = {};
    for (const key of enemySheets) {
        FLASH[key] = tintImage(IMG[key], '#ffffff', 1);
        FLASH.gold[key] = tintImage(IMG[key], '#fde047', 1);
    }
    FLASH.dash = tintImage(IMG.hero, '#fde68a', 1);
    FLASH.clone = tintImage(IMG.hero, '#fcd34d', 0.35);
    // Duel guest: a blue-robed Monkey King and blue clones
    FLASH.p2 = tintImage(IMG.hero, '#3b82f6', 0.4);
    FLASH.p2clone = tintImage(IMG.hero, '#7dd3fc', 0.45);
    FLASH.rage = {};
    for (const key of ['bossNguma', 'bossBachcot', 'dragonKing', 'spiderQueen', 'erlang', 'bossAfternoon', 'thienMenh']) FLASH.rage[key] = tintImage(IMG[key], '#dc2626', 0.35);
}

// Builds a tiny sprite from rows of palette characters ('.' = transparent)
function makePixelSprite(rows, palette) {
    const c = document.createElement('canvas');
    c.width = rows[0].length;
    c.height = rows.length;
    const g = c.getContext('2d');
    rows.forEach((row, y) => {
        [...row].forEach((ch, x) => {
            if (ch === '.') return;
            g.fillStyle = palette[ch];
            g.fillRect(x, y, 1, 1);
        });
    });
    return c;
}

// Đào Tiên (immortal peach)
const PEACH_SPRITE = makePixelSprite([
    '....s....',
    '...ss.ll.',
    '..pppll..',
    '.pppppppd',
    'pHHppppdd',
    'pHpppppdd',
    'ppppppddd',
    '.pppppdd.',
    '..ppddd..'
], { s: '#78350f', l: '#4ade80', p: '#f9a8d4', H: '#fdf2f8', d: '#db2777' });
const PEACH_SCALE = 3;

// Lays several equally sized frames side by side into one sprite sheet
function makeSheet(frames, palette) {
    const first = makePixelSprite(frames[0], palette);
    const sheet = document.createElement('canvas');
    sheet.width = first.width * frames.length;
    sheet.height = first.height;
    const g = sheet.getContext('2d');
    frames.forEach((rows, i) => g.drawImage(makePixelSprite(rows, palette), i * first.width, 0));
    return sheet;
}
