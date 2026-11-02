// Speech bubbles over monsters

// --- MONSTER CHATTER (speech bubbles over ordinary monsters) ---
// Each monster gets a mood: daily small talk, poetry (read a couplet at a time) or taunts aimed at the hero
const CHATTER = {
    daily: [
        'Hôm nay ăn gì nhỉ...',
        'Lương tháng này chưa về, mà tiền nhà đã về rồi.',
        'Ai lấy đôi dép của tôi vậy?',
        'Mai được nghỉ không ta?',
        'Trời hôm nay đẹp ghê. Hợp để... đứng im.',
        'Tôi chỉ là quái phụ thôi, tôi còn đang trả góp xe.',
        'Sáng nay hình như quên tắt bếp. Ủa mà tôi sống trong hang mà.',
        'Làm quái vật mà không có bảo hiểm xã hội.',
        'Vợ dặn mua nước mắm, quên mất rồi.',
        'Hôm qua mơ thấy mình được làm boss. Tỉnh dậy vẫn là quái thường.',
        'Wifi chỗ này yếu quá.',
        'Đứng canh chỗ này ba năm rồi, chưa ai trả lương.',
        'Ủa, nãy tôi định nói gì nhỉ?',
        'Đi qua đi lại cả ngày, được tám nghìn bước rồi.',
        'Cuối tuần này team building ở Hỏa Diệm Sơn. Nóng chết.',
        'Boss bảo hôm nay cho về sớm. Boss nói dối.',
        'Tôi đang tập thiền. Đừng làm phiền... à thôi, đánh nhau đi.',
        'Nghe nói ải sau có quái lương cao hơn.',
        'Tối nay có đá bóng không nhỉ?',
        'Ăn sáng chưa? Chưa à? Tôi cũng chưa.'
    ],
    taunt: [
        'Ê {ai}, đánh gì mà nhẹ như gãi lưng vậy?',
        '{ai} ơi, nhảy cao thế mà trình không cao lên tí nào.',
        'Lại là {ai}. Đi đâu cũng gặp, chán ghê.',
        'Máu tôi trâu lắm, {ai} đánh đến mai cũng chưa xong.',
        '{ai} ơi, Tây Thiên rẽ trái nhé. À không, rẽ phải.',
        'Nhìn {ai} chạy mà tôi thấy mệt giùm.',
        'Đánh tôi xong nhớ đánh giá năm sao nhé {ai}.',
        'Combo ba đòn mà tôi vẫn đứng đây. Xấu hổ chưa {ai}?',
        'Đẹp trai như tôi mà {ai} cũng nỡ đánh à?',
        'Có giỏi thì đứng yên đó! ...Ơ, đứng yên thật à?',
        '{ai} có biết mình đang đi ngược đường không?',
        'Né được đòn của tôi thì tôi gọi {ai} là đại ca.'
    ],
    // Hit, most moods: talks back
    hurt: [
        'Đánh thế thôi à? Muỗi đốt còn đau hơn.',
        'Gãi ngứa à?',
        'Cú này yếu như lương tháng của tao.',
        'Mày đánh tao à? Mày biết bố tao là ai không?',
        'Ơ, đánh thật à? Được, tới luôn!',
        'Còn non lắm!',
        'Đánh nữa đi, tao chưa thấy đau!',
        'Hết sức rồi à? Ăn cơm chưa đấy?',
        'Tao báo Thiên Đình đấy!',
        'Đánh lén! Đồ đánh lén!',
        'Máu tao còn cả cây, mừng sớm thế.',
        'Ui... không đau! Không đau tí nào!'
    ],
    // Hit, cowards: begs, then runs
    beg: [
        'Tha cho em! Em còn mẹ già!',
        'Đừng đánh mặt! Em còn đi làm!',
        'Em xin, em xin!',
        'Em chỉ là quái phụ thôi mà!',
        'Em nhận sai rồi! Sai gì cũng nhận!',
        'Á á á! Chạy thôi!',
        'Cứu với! Có khỉ đánh người!',
        'Em có ba đứa con nhỏ... à không, chưa có, nhưng sẽ có!'
    ],
    // Cowards when there is nowhere left to run
    cornered: ['Cùng đường rồi... liều mạng!', 'Đã thế thì đánh luôn!', 'Thỏ cùng đường còn cắn đấy!'],
    // Shouted as a monster lunges
    shout: ['Ăn này!', 'Hự!', 'Đỡ này!', 'Hây da!', 'Chết này!'],
    cowardIdle: ['Đừng thấy em... đừng thấy em...', 'Em chỉ đứng đây hóng gió thôi.', 'Hôm nay mình trốn ở đâu nhỉ?', 'Ước gì được nghỉ ốm.'],
    dying: ['Ta sẽ quay lại... ở ải sau.', 'Nhớ... trả lương... cho tôi...', 'Cuối cùng cũng được nghỉ.', 'Hẹn gặp lại khi bạn chơi lại màn này.', 'Chưa kịp ăn trưa...', 'Nói với vợ tôi... nước mắm...']
};
// How each monster calls the hero, per character
const TAUNT_NAMES = { wukong: 'con khỉ', bajie: 'con heo', sha: 'ông râu', nezha: 'nhóc Na Tra', tang: 'sư thầy', thienmenh: 'anh đeo kính' };
// Thơ nhảm (tho/): read two lines at a time
const POEMS = [
    ['Đường đời thật lắm gian truân,', 'Hồi nhỏ còn trẻ, sống lâu thì già.', 'Muốn vui thì phải cười ca,', 'Khi nào mệt quá là ta... nghỉ liền.'],
    ['Nắng mưa là bệnh của trời,', 'Đêm đến không ngủ thì ngồi chờ sáng.', 'Khi yêu thì rất lãng mạn,', 'Hết yêu thì hết làm bạn với nhau.'],
    ['Sống là phải có niềm tin,', 'Nhắm mắt lại thấy tối thui một màu.', 'Răng hỏng thì sẽ bị đau,', 'Nước sôi dội xuống là mau xù lông.'],
    ['Ngày mai là của hôm sau,', 'Hôm nay chưa tới thì đâu biết gì.', 'Bánh mì phải có mứt vi,', 'Đi đâu mà vội, đứng im một chỗ!'],
    ['Ăn cơm thì phải có thìa,', 'Đang nằm trên giường thì đừng ngủ gật.', 'Lòng người tráo trở thật thà,', 'Ăn nhiều quá tải thì ra nhà cầu.'],
    ['Đang đi mà thấy trời mưa,', 'Mặc áo mưa vào thì sẽ bớt ướt.', 'Con đường mình tự mình bước,', 'Ngoảnh lại đằng sau thấy vết chân đi.'],
    ['Chuối chín thì có màu vàng,', 'Cơm sôi bớt lửa kẻo màng nó khê.', 'Đêm nằm mơ thấy rồng mê,', 'Tỉnh ra mới biết là mê... ngủ rồi.'],
    ['Bút chót vót là bút chì,', 'Xe mà hết xăng thì đi bằng niềm.', 'Tìm hoài không thấy thì tìm,', 'Đến khi thấy được là tìm ra rồi.'],
    ['Bạn bè lúc khó có nhau,', 'Đang vui tự nhiên... hết vui giữa chừng.', 'Đi đâu cũng nhớ lưng chừng,', 'Đang yên đang lành tự nhiên thấy mệt.'],
    ['Muốn giàu thì phải có tiền,', 'Muốn không suy nghĩ thì đừng tư duy.', 'Cuộc đời là chuyến đi đi,', 'Chừng nào dừng lại là không đi nữa.'],
    ['Thà rằng uống chén rượu cay,', 'Còn hơn uống nước mắm chay không đường.', 'Nhìn em đứng ở ven đường,', 'Mới hay em đứng... ngay đường em đi.'],
    ['Con gà nó đẻ ra trứng,', 'Quả trứng lại nở con gà.', 'Nếu mà không đẻ nữa nha,', 'Thì làm đĩa luộc chấm qua muối tiêu.'],
    ['Trời mưa thì đất nó ướt,', 'Nắng lên thì đất nó khô.', 'Chè ngọt thì ngọt bằng đường,', 'Con sông thì chảy ra đường biển xa.'],
    ['Chạy nhiều thì sẽ thấy mệt,', 'Mệt rồi thì phải thở dốc.', 'Tóc dài thì gọi là tóc,', 'Cắt xong thì gọi là tóc ngắn hơn.'],
    ['Chén trà ngon phải có nước sôi,', 'Muốn uống nước nguội thì chờ nó nguội.'],
    ['Khi xưa ta bé ta thơ,', 'Bây giờ ta lớn ta hết thơ bé.'],
    ['Yêu nhau thương nhau là thật,', 'Nhưng lúc cãi nhau là hết thương.'],
    ['Đứng cao nhìn xuống thấy thấp,', 'Ngồi xuống nhìn lên thấy cao hơn.'],
    ['Sông sâu còn có kẻ dò,', 'Lòng người nông sâu... kệ người ta đi!']
];
const MAX_CHATTING = 3; // idle bubbles on screen at once (reactions don't count)
const BUBBLE_STYLE = {
    daily: { fill: '#f8fafc', stroke: '#334155', text: '#0f172a', font: '600' },
    poet:  { fill: '#fef3c7', stroke: '#b45309', text: '#78350f', font: 'italic 600' },
    taunt: { fill: '#fee2e2', stroke: '#b91c1c', text: '#7f1d1d', font: '600' },
    coward: { fill: '#e0f2fe', stroke: '#0369a1', text: '#0c4a6e', font: '600' },
    weird: { fill: '#f3e8ff', stroke: '#7e22ce', text: '#581c87', font: '700' },
    hurt:  { fill: '#ffffff', stroke: '#ef4444', text: '#b91c1c', font: '700' },
    dying: { fill: '#e2e8f0', stroke: '#64748b', text: '#334155', font: 'italic 600' }
};
const pickOne = list => list[Math.floor(Math.random() * list.length)];
let bubbles = [];

function newChatter() {
    const r = Math.random();
    const mood = r < 0.3 ? 'daily' : r < 0.55 ? 'poet' : r < 0.8 ? 'taunt' : 'coward';
    return { mood, timer: 2 + Math.random() * 8,
        poem: Math.floor(Math.random() * POEMS.length), verse: 0 };
}

// idle: small talk, which is capped on screen; reactions (hurt, begging, shouts) always show
function say(enemy, text, kind, time, idle = false) {
    bubbles = bubbles.filter(b => b.owner !== enemy);
    // Long lines stay up long enough to read
    time = Math.max(time, BUBBLE_MIN_TIME + text.length * BUBBLE_READ_RATE);
    bubbles.push({ owner: enemy, kind, text, idle, life: time, maxLife: time, x: 0, y: 0, lines: null });
}

// An idle line from the monster's mood; poets carry on through their poem
function chatterLine(c, hero) {
    if (c.mood === 'daily') return pickOne(CHATTER.daily);
    if (c.mood === 'coward') return pickOne(CHATTER.cowardIdle);
    if (c.mood === 'weird') return nameLine(pickOne(WEIRD[c.kind].lines), hero);
    if (c.mood === 'taunt') {
        const line = pickOne(CHATTER.taunt).replace(/\{ai\}/g, TAUNT_NAMES[hero.charId] || 'ngươi');
        return line[0].toUpperCase() + line.slice(1);
    }
    const poem = POEMS[c.poem];
    const text = poem.slice(c.verse, c.verse + 2).join('\n');
    c.verse += 2;
    if (c.verse >= poem.length) {
        c.verse = 0;
        c.poem = Math.floor(Math.random() * POEMS.length);
    }
    return text;
}

function updateBubbles(dt) {
    for (const b of bubbles) {
        b.life -= dt;
        // Follow the speaker while alive; a dying line stays where it fell
        if (b.owner && !(b.owner.dead && b.kind !== 'dying')) {
            b.x = b.owner.x + b.owner.width / 2;
            // Above a quái dị's name tag; a minion held up by the bully talks above the bully's line
            b.y = b.owner.y - b.owner.barLift - (b.owner.weird ? 30 : 6) - (b.owner.carriedBy ? 36 : 0);
        }
    }
    bubbles = bubbles.filter(b => b.life > 0 && !(b.owner && b.owner.dead && b.kind !== 'dying'));
}

function wrapBubble(text, maxW) {
    const out = [];
    for (const para of text.split('\n')) {
        let line = '';
        for (const word of para.split(' ')) {
            const next = line ? `${line} ${word}` : word;
            if (line && ctx.measureText(next).width > maxW) {
                out.push(line);
                line = word;
            } else {
                line = next;
            }
        }
        out.push(line);
    }
    return out;
}

function drawBubbles(ctx, camX) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (const b of bubbles) {
        const st = BUBBLE_STYLE[b.kind];
        ctx.font = `${st.font} 12px 'Noto Serif', serif`;
        if (!b.lines) b.lines = wrapBubble(b.text, 190);
        const lh = 15;
        const w = Math.max(...b.lines.map(l => ctx.measureText(l).width)) + 14;
        const h = b.lines.length * lh + 10;
        const sx = b.x - camX;
        if (sx < -100 || sx > GAME_WIDTH + 100) continue;
        const x = Math.max(4, Math.min(GAME_WIDTH - w - 4, sx - w / 2));
        const y = b.y - h - 8;
        ctx.globalAlpha = Math.max(0, Math.min(1, (b.maxLife - b.life) / 0.15, b.life / 0.3));
        ctx.fillStyle = st.fill;
        ctx.strokeStyle = st.stroke;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 6);
        // Tail pointing down at the speaker
        const tx = Math.max(x + 8, Math.min(x + w - 8, sx));
        ctx.moveTo(tx - 5, y + h);
        ctx.lineTo(tx, y + h + 7);
        ctx.lineTo(tx + 5, y + h);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = st.text;
        b.lines.forEach((l, i) => ctx.fillText(l, x + w / 2, y + 6 + i * lh));
    }
    ctx.restore();
}
