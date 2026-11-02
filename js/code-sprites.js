// Sprites drawn in code (sea, cave and heaven creatures)

// --- CODE-DRAWN SEA SPRITES (all face left, like the forest mobs) ---
const SEA_SPRITES = {
    fishSwim: {
        palette: { o: '#1e1b4b', b: '#f97316', B: '#fdba74', f: '#ea580c', w: '#ffffff', p: '#000000', t: '#fef3c7' },
        frames: [[
            '......ooooo.....',
            '....oofffffoo.oo',
            '..oobbbbbbbbbofo',
            '.obwpbbbbbbbbbfo',
            'otbbbbbbbbbbbbo.',
            '.oBBBBBBBBBBbo..',
            '..ooBBBBBBBoo...',
            '....oofffoo.....',
            '......ooo.......'
        ], [
            '......ooooo.....',
            '....oofffffoo...',
            '..oobbbbbbbbbo..',
            '.obwpbbbbbbbbbo.',
            'otbbbbbbbbbbbbfo',
            '.oBBBBBBBBBBbofo',
            '..ooBBBBBBBoo.oo',
            '.....offfo......',
            '......ooo.......'
        ]]
    },
    crabWalk: {
        palette: { o: '#450a0a', r: '#dc2626', R: '#f87171', p: '#111827', l: '#991b1b' },
        frames: [[
            '.oo..........oo.',
            'oRro.p....p.oRro',
            '.oro.o....o.oro.',
            '..oooooooooooo..',
            '.oRRRRRRRRRRRRo.',
            '.orrrrrrrrrrrro.',
            '..orrrrrrrrrro..',
            '...oooooooooo...',
            '..l.l.l..l.l.l..',
            '.l.l.l....l.l.l.'
        ], [
            'oo............oo',
            'oRro.p....p.oRro',
            '.oro.o....o.oro.',
            '..oooooooooooo..',
            '.oRRRRRRRRRRRRo.',
            '.orrrrrrrrrrrro.',
            '..orrrrrrrrrro..',
            '...oooooooooo...',
            '...l.l.l..l.l.l.',
            '..l.l.l....l.l.l'
        ]]
    },
    jellyFloat: {
        palette: { o: '#86198f', j: '#f0abfc', J: '#fdf4ff', t: '#e879f9' },
        frames: [[
            '...oooooo...',
            '..ojjjjjjo..',
            '.ojJJjjjjjo.',
            'ojJjjjjjjjjo',
            'ojjjjjjjjjjo',
            'oooooooooooo',
            '.t.t..t.t.t.',
            '.t..t.t..t..',
            '..t.t..t.t..',
            '..t..t.t..t.',
            '.t..t..t.t..'
        ], [
            '............',
            '..oooooooo..',
            '.ojJJjjjjjo.',
            'ojJjjjjjjjjo',
            'oooooooooooo',
            '.t.t.t..t.t.',
            't..t..t.t..t',
            '.t..t..t..t.',
            '..t..t..t...',
            '.t..t..t..t.',
            '............'
        ]]
    },
    // Đông Hải Long Vương: dragon head, golden horns, red robe, trident behind
    dragonKing: {
        palette: { o: '#052e16', g: '#16a34a', G: '#4ade80', h: '#facc15', e: '#ef4444', w: '#ffffff',
                   r: '#b91c1c', R: '#ef4444', s: '#a16207', c: '#e5e7eb' },
        frames: [[
            '......h.....h.....s.s.s.',
            '.....hh....hh.....sssss.',
            '......hoooooh.......s...',
            '....oogggggggo......s...',
            '..oogGGgggggggo.....s...',
            '.ogggwegggggggo.....s...',
            'oggggggggggggo......s...',
            'owgggggggggggo......s...',
            'c.oogggggggoo.......s...',
            'cc..occcccco........s...',
            'c...orrhhrro.......os...',
            '...orrRhhRrro.....ogso..',
            '..orrRRhhRRrrooooggso...',
            '..orrRRhhRRrrro.....s...',
            '..orrrRhhRrrrro.....s...',
            '..orrrrhhrrrrro.....s...',
            '..ohhhhhhhhhhho.....s...',
            '..orrrrrrrrrrro.....s...',
            '...orrrRRrrrro......s...',
            '...orrrRRrrrro......s...',
            '....orrrrrrro.......s...',
            '....oggo.oggo.......s...',
            '...ogggo.ogggo......s...',
            '...oooo...oooo......s...'
        ], [
            '......h.....h.....s.s.s.',
            '.....hh....hh.....sssss.',
            '......hoooooh.......s...',
            '....oogggggggo......s...',
            '..oogGGgggggggo.....s...',
            '.ogggwegggggggo.....s...',
            'oggggggggggggo......s...',
            'owgggggggggggo......s...',
            'c.oogggggggoo.......s...',
            'cc..occcccco........s...',
            'c...orrhhrro.......os...',
            '...orrRhhRrro.....ogso..',
            '..orrRRhhRRrrooooggso...',
            '..orrRRhhRRrrro.....s...',
            '..orrrRhhRrrrro.....s...',
            '..orrrrhhrrrrro.....s...',
            '..ohhhhhhhhhhho.....s...',
            '..orrrrrrrrrrro.....s...',
            '...orrrRRrrrro......s...',
            '...orrrRRrrrro......s...',
            '....orrrrrrro.......s...',
            '.....oggo.oggo......s...',
            '....ogggo..ogggo....s...',
            '....oooo...oooo.....s...'
        ]]
    }
};

// Cầu gai (sea urchin) hazard and decorative coral
const URCHIN_SPRITE = makePixelSprite([
    '...s..s...',
    '.s.ssss.s.',
    '..ooooooo.',
    'sooddddoos',
    '.oddddddo.',
    's.oooooo.s',
    '..s....s..'
], { s: '#c4b5fd', o: '#2e1065', d: '#6d28d9' });
const CORAL_SPRITE = makePixelSprite([
    '..c....c....',
    '.cC..c.cC.c.',
    '.cc.cc..ccc.',
    '..cccc.cCc..',
    '...cCcccc...',
    '....cccc....',
    '.....cc.....',
    '.....cc.....',
    '....oooo....',
    '...oooooo...'
], { c: '#fb7185', C: '#fda4af', o: '#9f1239' });

// --- CODE-DRAWN CAVE SPRITES (Bàn Tơ Động) ---
const CAVE_SPRITES = {
    spiderCrawl: {
        palette: { o: '#0f0a1a', b: '#581c87', B: '#9333ea', e: '#ef4444', l: '#1e1b4b' },
        frames: [[
            '..l........l..',
            '.l.l.oooo.l.l.',
            'l...obbbbo...l',
            '..loBbbbbbol..',
            '.l.oeebbbbo.l.',
            'l..obbbbbbo..l',
            '..l.oooooo.l..',
            '.l..l....l..l.',
            'l..l......l..l'
        ], [
            '.l..........l.',
            'l.l..oooo..l.l',
            '.l..obbbbo..l.',
            '...oBbbbbbo...',
            'l.loeebbbbol.l',
            '.l.obbbbbbo.l.',
            'l...oooooo...l',
            '..l.l....l.l..',
            '.l..........l.'
        ]]
    },
    // Nhện Tinh: spider body with a yellow hourglass, demon-woman head with long black hair
    spiderQueen: {
        palette: { o: '#1e1b4b', b: '#6b21a8', B: '#a855f7', s: '#fde68a', h: '#111827', e: '#ef4444',
                   r: '#be123c', l: '#3b0764', y: '#facc15' },
        frames: [[
            '....hhhh................',
            '...hhhhhh.......oooooo..',
            '..hhssssh.....oobbbbbboo',
            '..hseessh....obbBBbbbbbo',
            '..hssssh...obbbbbyybbbbo',
            '.hhsrrsh..obbbbbyyyybbbo',
            '.hh.ss.hoobbbbbbyybbbbbo',
            '.h..oooobbbbbbbbbbbbbbo.',
            '...obBBbbbbbbbbbbbbbbo..',
            '..obbbbbbbbbbbbbbbbbo...',
            '..oobbbbbbbbbbbbbboo....',
            '.l..oooooooooooooo..l...',
            'l.l..l.l....l.l..l.l....',
            'l..l.l..l..l..l.l..l....',
            '.l..l...l..l...l..l.....',
            '.l...l..l....l..l...l...',
            'l....l...l...l...l...l..',
            'l.....l..l...l..l.....l.',
            'l.....l...........l....l',
            'l......l.........l.....l'
        ], [
            '....hhhh................',
            '...hhhhhh.......oooooo..',
            '..hhssssh.....oobbbbbboo',
            '..hseessh....obbBBbbbbbo',
            '..hssssh...obbbbbyybbbbo',
            '.hhsrrsh..obbbbbyyyybbbo',
            '.hh.ss.hoobbbbbbyybbbbbo',
            '.h..oooobbbbbbbbbbbbbbo.',
            '...obBBbbbbbbbbbbbbbbo..',
            '..obbbbbbbbbbbbbbbbbo...',
            '..oobbbbbbbbbbbbbboo....',
            '.l..oooooooooooooo..l...',
            '.l.l..l.l..l.l..l.l.....',
            '.l..l.l..l..l..l.l..l...',
            'l..l...l..l...l..l..l...',
            'l...l..l....l..l...l....',
            '.l...l...l...l...l...l..',
            '.l....l..l...l..l....l..',
            '.l....l..........l....l.',
            '.l.....l........l.....l.'
        ]]
    }
};

// --- CODE-DRAWN HEAVEN SPRITES (Thiên Cung) ---
const SKY_SPRITES = {
    // Thiên binh: gold helmet, red armour, spear held in front
    soldierWalk: {
        palette: { o: '#1c1917', h: '#facc15', H: '#fef08a', s: '#fed7aa', e: '#111827', a: '#b91c1c', A: '#ef4444',
                   m: '#94a3b8', p: '#78350f', l: '#334155' },
        frames: [[
            'm...........',
            'm...ohhho...',
            'p..ohHhhho..',
            'p..ossssso..',
            'p..oesssso..',
            'p...ossso...',
            'ps.oaAAaao..',
            'psoaaAAaaao.',
            'p.ohhhhhhho.',
            'p.oaaaaaaao.',
            'p..oaaaaao..',
            'p..ol...lo..',
            'p..ol...lo..',
            'p..ol...lo..',
            'p.ool..ool..',
            '..ooo..ooo..'
        ], [
            'm...........',
            'm...ohhho...',
            'p..ohHhhho..',
            'p..ossssso..',
            'p..oesssso..',
            'p...ossso...',
            'ps.oaAAaao..',
            'psoaaAAaaao.',
            'p.ohhhhhhho.',
            'p.oaaaaaaao.',
            'p..oaaaaao..',
            'p..ol..lo...',
            'p..ol..lo...',
            'p.ol....lo..',
            'p.ol....lo..',
            '.ooo...ooo..'
        ]]
    },
    // Lôi Vân Tinh: an angry storm cloud that drops lightning
    stormCloud: {
        palette: { o: '#334155', c: '#94a3b8', C: '#cbd5e1', e: '#fde047', y: '#facc15' },
        frames: [[
            '....oooo......',
            '..ooCCCCoooo..',
            '.oCCccccCCCCo.',
            'oCcceccceccCco',
            'occcccccccccco',
            '.occcccccccco.',
            '..oooooooooo..',
            '....y...y.....',
            '...y...y......',
            '....y...y.....'
        ], [
            '....oooo......',
            '..ooCCCCoooo..',
            '.oCCccccCCCCo.',
            'oCcceccceccCco',
            'occcccccccccco',
            '.occcccccccco.',
            '..oooooooooo..',
            '......y...y...',
            '.....y...y....',
            '......y...y...'
        ]]
    },
    // Nhị Lang Thần: silver helmet with red plume, third eye, gold armour, blue cape, three-pointed blade
    erlang: {
        palette: { o: '#0f172a', m: '#cbd5e1', M: '#f1f5f9', r: '#dc2626', s: '#fed7aa', e: '#111827', t: '#ef4444',
                   g: '#facc15', G: '#fde68a', b: '#1d4ed8', p: '#78350f', w: '#e2e8f0' },
        frames: [[
            '........rr........w.w.w.',
            '.......rrr........wwwww.',
            '......ommmmo.......p....',
            '.....omMMmmmo......p....',
            '.....ommmmmmo......p....',
            '.....osstssso......p....',
            '.....oesssseo......p....',
            '.....ossssso.......p....',
            '......osso.........p....',
            '....bogggGgob......p....',
            '...bbogGGggggo.....p....',
            '..bbboggGgggggoosssp....',
            '..bbbogggggggo.....p....',
            '..bbboggrrgggo.....p....',
            '..bbbogggggggo.....p....',
            '..bbbommmmmmmo.....p....',
            '..bbbogggggggo.....p....',
            '...bbbogggggo......p....',
            '...bbbommmmmo......p....',
            '....bbommmmmo......p....',
            '.....omm.mmo.......p....',
            '.....omm.mmo.......p....',
            '....ommm.mmmo......p....',
            '....oooo.oooo......p....'
        ], [
            '........rr........w.w.w.',
            '.......rrr........wwwww.',
            '......ommmmo.......p....',
            '.....omMMmmmo......p....',
            '.....ommmmmmo......p....',
            '.....osstssso......p....',
            '.....oesssseo......p....',
            '.....ossssso.......p....',
            '......osso.........p....',
            '....bogggGgob......p....',
            '...bbogGGggggo.....p....',
            '..bbboggGgggggoosssp....',
            '..bbbogggggggo.....p....',
            '..bbboggrrgggo.....p....',
            '..bbbogggggggo.....p....',
            '..bbbommmmmmmo.....p....',
            '..bbbogggggggo.....p....',
            '...bbbogggggo......p....',
            '...bbbommmmmo......p....',
            '....bbommmmmo......p....',
            '....omm..mmo.......p....',
            '....omm...mmo......p....',
            '...ommm...mmmo.....p....',
            '...oooo...oooo.....p....'
        ]]
    }
};
