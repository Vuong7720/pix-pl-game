// Keyboard and mouse input (works with Vietnamese typing tools on)

// --- Vietnamese typing tools (Unikey, EVKey, OpenKey) ---
// In Telex they swallow some letter presses (aa→â, dd→đ, w→ư, j→dấu nặng...) and send Backspaces
// plus Unicode characters instead, which carry no e.code. Work out the physical key from what changed.
const IME_MARK_KEYS = { '̣': 'KeyJ', '́': 'KeyS', '̀': 'KeyF', '̉': 'KeyR', '̃': 'KeyX', '̛': 'KeyW', '̆': 'KeyW' };
const IME_HOLD = 700; // ms an inferred key stays down without a repeat (its real keyup may never arrive)
const ime = { typed: '', burst: null, timer: 0, held: {} };

// The keys a piece of text "remembers": đ → D, â → A, dấu nặng → J...
function imeMarks(text) {
    const out = [];
    for (const ch of text) {
        if (ch === 'đ' || ch === 'Đ') {
            out.push('KeyD');
            continue;
        }
        const [base, ...marks] = ch.normalize('NFD');
        for (const m of marks) out.push(m === '̂' ? 'Key' + base.toUpperCase() : IME_MARK_KEYS[m]);
    }
    return out.filter(Boolean);
}

function minusMarks(a, b) {
    const rest = [...b];
    return a.filter(x => {
        const i = rest.indexOf(x);
        if (i < 0) return true;
        rest.splice(i, 1);
        return false;
    });
}

function imeFinish() {
    const { removed, added } = ime.burst;
    ime.burst = null;
    if (!added) return; // a real Backspace
    const before = imeMarks(removed), after = imeMarks(added);
    // A new mark tells which key made it; a vanished one means the same key was pressed again (undo)
    let code = minusMarks(after, before)[0] || minusMarks(before, after)[0];
    if (!code) {
        const last = added.slice(-1).toUpperCase();
        if (/[A-Z]/.test(last)) code = 'Key' + last;
        else if (/[0-9]/.test(last)) code = 'Digit' + last;
    }
    if (!code) return;
    const repeat = code in ime.held;
    clearTimeout(ime.held[code]);
    ime.held[code] = setTimeout(() => {
        delete ime.held[code];
        releaseKey(code);
    }, IME_HOLD);
    pressKey(code, repeat);
}

function imeInjected(e) {
    if (!ime.burst) ime.burst = { removed: '', added: '' };
    if (e.key === 'Backspace') {
        ime.burst.removed = ime.typed.slice(-1) + ime.burst.removed;
        ime.typed = ime.typed.slice(0, -1);
    } else {
        ime.burst.added += e.key;
        ime.typed += e.key;
    }
    clearTimeout(ime.timer);
    ime.timer = setTimeout(imeFinish, 25);
}

window.addEventListener('keydown', (e) => {
    // Typing a room code must not move the monkey or pick map nodes
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (gameState === 'STORY') e.preventDefault();
    const injected = !e.code || e.code === 'Unidentified';
    if (e.key === 'Backspace' || (injected && e.key.length === 1)) {
        imeInjected(e);
        return;
    }
    if (injected) return;
    // Track what the typing tool thinks is in its current word; non-letters end the word
    ime.typed = /^[a-zA-Z0-9]$/.test(e.key) ? (ime.typed + e.key).slice(-20) : '';
    pressKey(e.code, e.repeat);
});

window.addEventListener('keyup', (e) => {
    if (!e.code || e.code === 'Unidentified') return; // the typing tool's injected characters
    if (e.code in ime.held) {
        clearTimeout(ime.held[e.code]);
        delete ime.held[e.code];
    }
    releaseKey(e.code);
});

window.addEventListener('mousedown', (e) => {
    if (e.button === 0 && (gameState === 'PLAYING' || gameState === 'DUEL') && e.target === canvas) keys.attack = true;
});
window.addEventListener('mouseup', (e) => {
    if (e.button === 0) keys.attack = false;
});
