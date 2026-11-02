// Quái dị: rare prank monsters

// --- QUÁI DỊ: a few rare oddballs per stage with prank skills. The pranks barely hurt; they just mess with the hero ---
const WEIRD = {
    morph: { name: 'Yêu Biến Hình', color: '#c084fc', prank: 'chicken', lines: [
        'Bảy mươi hai phép biến hoá mà giờ thành gà à? Để tao biến hộ!',
        'Ê {ai}, làm gà một lúc cho đời nó lành.',
        'Ò ó o! Chào buổi sáng nhé {ai}!',
        'Đứng yên đó, tao đang luyện phép "gà hoá" mới học trên mạng.'] },
    flip: { name: 'Yêu Đảo Ngược', color: '#4ade80', prank: 'flip', lines: [
        'Trái là phải, phải là trái. Sống đảo điên như {ai} ấy.',
        'Thử đi thẳng xem nào {ai}, hahaha!',
        'Tây Thiên ở bên trái. Hay bên phải nhỉ? Kệ, đảo luôn!',
        'Bấm phím nào cũng sai, giống đời tao.'] },
    shrink: { name: 'Yêu Thu Nhỏ', color: '#f472b6', prank: 'shrink', lines: [
        '{ai} tí hon kìa! Đứng dậy đi, à quên, đang đứng.',
        'Nhỏ thế này bỏ túi được rồi.',
        'Đại Thánh size S, giảm giá 50%!',
        'Ơ, {ai} đâu rồi? À, ở dưới chân tao.'] },
    bully: { name: 'Đại Ca Chơi Xấu', color: '#fb923c', lines: [
        'Mày lên trước đi!',
        'Hy sinh vì đại cục nhé em.',
        'Đàn em đâu, xung phong! Anh ở sau yểm trợ tinh thần.',
        'Bay đi em, anh tin em!',
        'Em cứ lên, có gì anh... chạy trước.'] },
    thief: { name: 'Yêu Trộm Gậy', color: '#facc15', lines: [
        'Gậy đẹp đấy, cho tao mượn đến hết đời nhé!',
        'Của rơi là của tao, của chưa rơi cũng là của tao.',
        'Đuổi theo đi {ai}, chân ngắn thế!',
        'Như Ý Kim Cô Bổng? Bán ve chai được bao nhiêu nhỉ?'] },
    stream: { name: 'Yêu Livestream', color: '#ef4444', lines: [
        'Cả nhà ơi, xem Đại Thánh trượt chân nè!',
        'Like, share, đăng ký kênh nhé cả nhà!',
        'Hôm nay mình review {ai}. Một sao, không hơn.',
        'Nhìn vào camera đi {ai}, cười lên nào!',
        'Ai muốn xem {ai} bị đánh thì thả tim nhé!'] }
};
const WEIRD_ORDER = ['morph', 'bully', 'thief', 'flip', 'stream', 'shrink']; // later stages unlock more
// What each prank does to the hero: how long and how hard his swings still hit
const TROLL = {
    chicken: { time: 4, power: 0.05, label: 'BIẾN THÀNH GÀ' },
    flip:    { time: 4, power: 1,    label: 'ĐẢO PHÍM' },
    shrink:  { time: 5, power: 0.5,  label: 'TÍ HON' },
    unarmed: { time: 12, power: 0.35, label: 'MẤT GẬY' }
};
const THROWN_DAMAGE = 5;   // a minion thrown by the bully
const WEIRD_DAMAGE = 0.5;  // oddballs' own lunges hit half as hard as normal monsters
const THROWN_LINES = ['Đại ca ơi em chưa sẵn sàng!', 'Ơ ơ ơ, em sợ độ cao!', 'Đại ca chơi bẩn!', 'Em xin nghỉ việc!', 'Á á á, hạ cánh kiểu gì đây?!'];
const STREAM_COMMENTS = [
    '{ai} gà quá', '1 sao', 'đánh như gãi ngứa', 'ai cho {ai} lên sóng vậy', 'kênh hay quá, sub rồi',
    'đánh con livestream đi!!!', 'có ai xem từ ải 1 không', 'GG', 'xin link tải gậy', 'Đại Thánh fake à',
    'mẹ ơi con lên sóng', 'chất lượng 144p', 'nhảy đi chứ', '=)))))', 'tặng 1 quả đào', 'lag quá',
    'sao không dùng chiêu đi', 'cười đau bụng', 'quái này đẹp trai hơn {ai}', 'bao giờ tới Tây Thiên vậy'
];
const nameLine = (line, hero) => {
    const text = line.replace(/\{ai\}/g, TAUNT_NAMES[hero.charId] || 'ngươi');
    return text[0].toUpperCase() + text.slice(1);
};

const CHICKEN_SPRITE = makePixelSprite([
    '........rr....',
    '.......rrr....',
    '......wwww....',
    '.....wwwkwy...',
    '.....wwwwwyy..',
    '......wwww.r..',
    '.ww..wwwww....',
    '.wwwwwwwwww...',
    '..wwwwwwwww...',
    '..wwwggwwww...',
    '...wwwwwwww...',
    '....wwwwww....',
    '.....y..y.....',
    '....yy.yy.....'
], { r: '#dc2626', w: '#f8fafc', k: '#0f172a', y: '#f59e0b', g: '#cbd5e1' });
const CHICKEN_SCALE = 3.5;

// Name of the prank and a shrinking bar above the hero's head
function drawTrollTag(ctx, p, cx) {
    const t = p.troll, info = TROLL[t.kind];
    const y = snap(p.y - 30);
    ctx.save();
    ctx.font = "700 10px 'Noto Serif', serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.strokeText(info.label, cx, y);
    ctx.fillStyle = '#e9d5ff';
    ctx.fillText(info.label, cx, y);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
    ctx.fillRect(snap(cx - 20), y + 2, 40, 4);
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(snap(cx - 19), y + 3, 38 * Math.max(0, t.timer / info.time), 2);
    ctx.restore();
}

// A slow, slightly homing orb carrying a prank; a swing knocks it out of the air
class TrollShot {
    constructor(owner, player) {
        this.owner = owner;
        this.prank = WEIRD[owner.weird].prank;
        this.color = WEIRD[owner.weird].color;
        this.x = owner.x + owner.width / 2;
        this.y = owner.y + owner.height / 2;
        const a = Math.atan2(player.y + player.height / 2 - this.y, player.x + player.width / 2 - this.x);
        this.vx = Math.cos(a) * 3.6;
        this.vy = Math.sin(a) * 3.6;
        this.life = 3;
        this.size = 9;
        this.dead = false;
    }

    update(dt, player) {
        const a = Math.atan2(player.y + player.height / 2 - this.y, player.x + player.width / 2 - this.x);
        this.vx += Math.cos(a) * 0.05;
        this.vy += Math.sin(a) * 0.05;
        this.x += this.vx;
        this.y += this.vy;
        this.life -= dt;
        if (Math.random() < 0.6) particles.push(new Particle(this.x, this.y, (Math.random() - 0.5), (Math.random() - 0.5), this.color, 3, 0.35));
        const box = { x: this.x - this.size, y: this.y - this.size, width: this.size * 2, height: this.size * 2 };
        if (player.isAttacking && overlaps(player.attackBox, box)) {
            this.dead = true;
            createHitSparks(this.x, this.y, this.color, 10);
            floatingTexts.push(new FloatingText('ĐỠ ĐƯỢC!', this.x - 20, this.y - 10, '#bbf7d0', 10));
            return;
        }
        // Dashing through it dodges it, like any other hit
        if (overlaps(player, box) && !player.isDead && !player.isDashing && !player.skill) {
            this.dead = true;
            player.setTroll(this.prank);
            if (!this.owner.dead) say(this.owner, pickOne(['Trúng rồi! Hahaha!', 'Ăn chưởng chưa con!', 'Đẹp! Quay lại cho cả nhà xem!']), 'weird', 1.8);
            return;
        }
        if (this.life <= 0) this.dead = true;
    }

    draw(ctx, camX) {
        const x = this.x - camX, pulse = 1 + Math.sin(worldTime * 18) * 0.15;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(x, this.y, this.size * 1.7 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = this.color;
        ctx.fillRect(snap(x - 6), snap(this.y - 6), 12, 12);
        ctx.fillStyle = '#ffffff';
        ctx.font = "700 10px 'Noto Serif', serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', x, this.y + 1);
    }
}

// Fake live-stream comments scrolling across the screen while a Yêu Livestream films the hero
let streamFeed = [];

function updateStreamFeed(dt) {
    for (const c of streamFeed) c.x -= c.speed * dt;
    streamFeed = streamFeed.filter(c => c.x > -c.w);
}

function drawStreamFeed(ctx) {
    ctx.save();
    ctx.font = "700 12px 'Noto Serif', serif";
    ctx.textBaseline = 'middle';
    for (const c of streamFeed) {
        if (!c.w) c.w = ctx.measureText(c.text).width + 8;
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(2, 6, 23, 0.8)';
        ctx.strokeText(c.text, c.x, c.y);
        ctx.fillStyle = c.color;
        ctx.fillText(c.text, c.x, c.y);
    }
    ctx.restore();
}

// Turns 2-4 ordinary monsters per stage into quái dị (more kinds and more of them in later stages)
function pickWeirdos(stage) {
    const kinds = WEIRD_ORDER.slice(0, Math.min(WEIRD_ORDER.length, 3 + stage));
    const count = Math.min(4, 2 + Math.floor(stage / 2));
    const pool = enemies.filter(e => e.type !== 'boss' && e.x > 700 && !['jelly', 'spider', 'cloud'].includes(e.type));
    const used = [];
    for (let i = 0; i < count && pool.length; i++) {
        // Different kinds first; ground-only tricks need a walker
        const fresh = kinds.filter(k => !used.includes(k));
        const kind = pickOne(fresh.length ? fresh : kinds);
        const needsGround = kind === 'bully' || kind === 'thief' || kind === 'stream';
        const fits = pool.filter(e => !needsGround || !e.flying);
        if (!fits.length) continue;
        const e = pickOne(fits);
        pool.splice(pool.indexOf(e), 1);
        e.makeWeird(kind);
        used.push(kind);
    }
}
