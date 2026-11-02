// Playable characters and their sprite sheets

// --- HAND-DRAWN PARTY SHEETS (Na Tra, Bát Giới, Sa Tăng, Đường Tăng) ---
// Built from the art in char-and-back/ the same way as the Monkey King: background removed,
// frames cut and aligned into 240x170 cells, feet on row 165, body centre on column 100, drawn at 0.5.
const hdCell = (row, frames, scale) => ({ row, fw: 240, fh: 170, frames, ax: 100, foot: 165, ...(scale ? { scale } : {}) });

// Shared row layout of these sheets
function hdAnims(idleFrames, atk3Frames) {
    return {
        idle: hdCell(0, idleFrames),
        run: hdCell(1, 5),
        jump: hdCell(2, 3),   // rising, apex, falling
        atk1: hdCell(3, 2),
        atk2: hdCell(4, 2),
        atk3: hdCell(5, atk3Frames),
        cast: hdCell(6, 1),
        dead: hdCell(7, 1),   // sitting down: these sheets have no fall
        poses: hdCell(8, 4),  // skill poses, named per character below
        poses2: hdCell(9, 2),
        fx: hdCell(11, 3, 0.8), // effect / transformation sprites
        portrait: hdCell(12, 1)
    };
}

// Per-character art: sheet, named poses [animation row, frame], effect columns, face and portrait crops
const CHARACTER_ART = {
    nezha: {
        sheet: 'heroNezha', anims: hdAnims(1, 2),
        poses: { sash: ['poses', 0], throw: ['poses', 1], ringThrow: ['poses', 2], six: ['poses', 3],
                 sixIdle: ['poses2', 0], sixAttack: ['poses2', 1], fire: ['atk3', 1] },
        fx: { ring: 0, fireball: 1 },
        face: [86, 62, 36, 36], portrait: [28, 74, 146, 92]
    },
    bajie: {
        sheet: 'heroBajie', anims: hdAnims(1, 3),
        poses: { feast: ['poses', 0], rain: ['poses', 1], slam: ['poses', 2], eat: ['poses', 3], throw: ['atk2', 1] },
        fx: { rake: 0, cloud: 1, pig: 2 },
        face: [78, 60, 36, 36], portrait: [7, 76, 191, 90]
    },
    sha: {
        sheet: 'heroSha', anims: hdAnims(1, 3),
        poses: { barrier: ['poses', 0], bubble: ['poses', 1], sweep: ['poses', 2], throw: ['atk1', 1], tide: ['atk3', 2] },
        fx: { tornado: 0, bubble: 1 },
        face: [76, 58, 36, 36], portrait: [7, 75, 191, 91]
    },
    tang: {
        sheet: 'heroTang', anims: hdAnims(3, 3),
        poses: { pray: ['poses', 0], meditate: ['poses', 1], chant: ['poses', 2], summon: ['poses', 3] },
        fx: { buddha: 0, lotus: 1 },
        face: [92, 60, 36, 36], portrait: [28, 74, 146, 92]
    },
    thienmenh: {
        sheet: 'heroThienmenh', anims: TM_ANIMS, poses: TM_POSES, fx: {},
        face: [84, 46, 40, 40], portrait: [50, 40, 120, 70]
    }
};

// Attach sprite sheets, animation pickers and cut-in portraits to every character
function buildCharacters() {
    Object.assign(CHARACTERS.wukong, {
        sheet: IMG.hero, scale: HERO_SCALE, animFor: wukongAnim,
        dashSheet: FLASH.dash, guestSheet: FLASH.p2,
        face: [100, 64, 36, 36],
        portraitArt: { img: IMG.wukongEyes, sx: 0, sy: 0, sw: IMG.wukongEyes.width, sh: IMG.wukongEyes.height }
    });
    for (const [id, art] of Object.entries(CHARACTER_ART)) {
        const sheet = IMG[art.sheet];
        const [px, py, pw, ph] = art.portrait;
        Object.assign(CHARACTERS[id], {
            sheet, scale: HERO_SCALE, animFor: hdAnim,
            anims: art.anims, poses: art.poses, fx: art.fx, face: art.face,
            dashSheet: tintImage(sheet, '#fde68a', 1),
            guestSheet: tintImage(sheet, '#3b82f6', 0.4),
            portraitArt: { img: sheet, sx: px, sy: art.anims.portrait.row * 170 + py, sw: pw, sh: ph }
        });
    }
}

// Frame picker for the Monkey King sheet (its own row layout)
function wukongAnim(p) {
    const A = HERO_ANIMS;
    switch (p.animState) {
        case 'run':
            return [A.run, Math.floor(p.animTime / 0.08) % A.run.frames];
        case 'form':
            // eagle (frame 0) or fish (frame 2) from the 72 transformations row
            return [A.forms, p.form === 'fish' ? 2 : 0];
        case 'dash':
            // somersault on the cloud (Cân Đẩu Vân, the cloud is drawn under him)
            return [A.jump, 3];
        case 'dead':
            return [A.dead, Math.min(A.dead.frames - 1, Math.floor(p.animTime / 0.3))];
        case 'leap':
            // staff raised while it grows -> overhead slam -> ground smash
            if (p.skillPhase === 'plant' || p.skillPhase === 'rise') return [A.leap, 0];
            if (p.skillPhase === 'slam') return [A.leap, 1];
            return [A.atk3, 2];
        case 'attack': {
            const anim = A[ATTACK_ROWS[p.attackCombo]];
            const progress = 1 - p.attackTimer / p.attackDuration;
            return [anim, Math.min(anim.frames - 1, Math.max(0, Math.floor(progress * anim.frames)))];
        }
        case 'cast':
        case 'sleep':
            return [A.cast, 0];
        case 'jump':
            // a somersault on the extra air jumps, otherwise rising / apex / falling
            if (p.vy < 0 && p.jumpCount >= 2) return [A.jump, 3];
            return [A.jump, p.vy < -3 ? 0 : p.vy > 3 ? 2 : 1];
        default:
            return [A.idle, Math.floor(p.animTime / 0.4) % A.idle.frames];
    }
}


// Frame picker for the hand-drawn party sheets
function hdAnim(p, ch = p.char) {
    const A = ch.anims;
    const pose = name => {
        const [row, col] = ch.poses[name];
        return [A[row], col];
    };
    const six = p.buff && p.buff.kind === 'sixarms' && ch.poses.sixIdle;
    switch (p.animState) {
        case 'run':
            return six ? pose('sixIdle') : [A.run, Math.floor(p.animTime / 0.09) % A.run.frames];
        case 'dash':
            return ch.poses.roll ? pose('roll') : [A.run, 2];
        case 'dead':
        case 'sleep':
            return [A.dead, 0];
        case 'form':
            return [A.fx, ch.fx[p.form]];
        case 'leap':
            if (p.skillPhase === 'plant' || p.skillPhase === 'rise') return [A.jump, 0];
            if (p.skillPhase === 'slam') return [A.jump, 2];
            return ch.poses.slam ? pose('slam') : [A.atk3, A.atk3.frames - 1];
        case 'attack': {
            if (six) return pose('sixAttack');
            const anim = A['atk' + p.attackCombo];
            const progress = 1 - p.attackTimer / p.attackDuration;
            return [anim, Math.min(anim.frames - 1, Math.max(0, Math.floor(progress * anim.frames)))];
        }
        case 'cast':
            return p.castPose && ch.poses[p.castPose] ? pose(p.castPose) : [A.cast, 0];
        case 'jump':
            return [A.jump, p.vy < -3 ? 0 : p.vy > 3 ? 2 : 1];
        default:
            return six ? pose('sixIdle') : [A.idle, Math.floor(p.animTime / 0.35) % A.idle.frames];
    }
}

function buildProceduralSprites() {
    for (const [key, def] of Object.entries({ ...SEA_SPRITES, ...CAVE_SPRITES, ...SKY_SPRITES })) IMG[key] = makeSheet(def.frames, def.palette);
}

// Rounds to the nearest device pixel so scaled pixel art stays crisp
function snap(v) {
    return Math.round(v * RENDER_SCALE) / RENDER_SCALE;
}

// Draws one frame with its feet at (cx, feetY); flip mirrors it horizontally around cx
function drawSprite(img, a, frame, cx, feetY, flip, scale = ART_SCALE) {
    if (!img) return;
    ctx.save();
    ctx.translate(snap(cx), snap(feetY - (a.foot + 1) * scale));
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(img, frame * a.fw, (a.row || 0) * a.fh, a.fw, a.fh, -a.ax * scale, 0, a.fw * scale, a.fh * scale);
    ctx.restore();
}
