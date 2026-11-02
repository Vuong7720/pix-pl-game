// Sound effects and procedural music

// --- AUDIO SYSTEM (Web Audio API) ---
let audioCtx = null;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// One oscillator sweep: from -> to Hz over dur seconds, starting delay seconds from now
function synth(type, from, to, dur, vol, delay = 0) {
    const t0 = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t0);
    osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + Math.min(0.05, dur / 4));
    gain.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
}

// Filtered white noise: rumbles, impacts and wind
function noise(dur, vol, cutoff, delay = 0) {
    const t0 = audioCtx.currentTime + delay;
    const buf = audioCtx.createBuffer(1, Math.ceil(audioCtx.sampleRate * dur), audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    src.start(t0);
}

// Boss entrance sounds (see js/boss-intro.js)
const CINEMA_SOUNDS = {
    rumble: () => { noise(1.6, 0.35, 120); synth('sawtooth', 42, 36, 1.6, 0.12); },
    riser: () => { synth('sawtooth', 90, 700, 1.4, 0.07); noise(1.4, 0.08, 1800); },
    boom: () => { synth('sine', 90, 28, 1.1, 0.6); noise(0.9, 0.5, 400); synth('square', 60, 30, 0.5, 0.15); },
    tick: () => synth('square', 1400, 1300, 0.04, 0.08),
    heartbeat: () => { synth('sine', 70, 40, 0.18, 0.5); synth('sine', 65, 38, 0.16, 0.4, 0.2); },
    drone: () => { for (const f of [55, 65.4, 82.4]) synth('sawtooth', f, f * 0.98, 2.2, 0.06); },
    laugh: () => { [520, 470, 430, 400, 380].forEach((f, i) => synth('triangle', f, f * 0.8, 0.14, 0.12, i * 0.16)); noise(0.8, 0.05, 3000); }
};

function playSound(type) {
    if (!audioCtx) return;
    if (CINEMA_SOUNDS[type]) {
        try { CINEMA_SOUNDS[type](); } catch (e) { console.error(e); }
        return;
    }
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;

        if (type === 'slash') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'hit') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'jump') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(450, now + 0.15);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'kill') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'pickup') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(660, now);
            osc.frequency.exponentialRampToValueAtTime(1320, now + 0.1);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'skill') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(900, now + 0.3);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'slam') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        } else if (type === 'checkpoint') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(587, now + 0.1);
            osc.frequency.setValueAtTime(880, now + 0.2);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        } else if (type === 'roar') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.6);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
            osc.start(now);
            osc.stop(now + 0.6);
        }
    } catch (e) { console.error(e); }
}

// --- MUSIC (procedural pentatonic loop, one step every `tempo` seconds) ---
const PENTATONIC = [0, 2, 4, 7, 9]; // semitones
const MUSIC_ROOTS = { forest: 293.66, fire: 261.63, bone: 220, sea: 246.94, web: 207.65, sky: 329.63 }; // D4, C4, A3, B3, G#3, E4
const MUSIC = {
    on: true,
    timer: null,
    gain: null,
    step: 0,
    nextTime: 0,
    tempo: 0.18,
    // Scale degrees (null = rest); negative degrees drop below the root
    melody: [0, 2, 4, 2, 5, 4, 2, null, 0, 2, 4, 7, 5, null, 4, 2,
             4, 5, 7, 5, 4, 2, 0, null, 2, 4, 2, 0, -3, null, 0, null],
    bass: [0, null, 0, null, -2, null, -2, null, -3, null, -3, null, -2, null, -1, null],
    // Boss fights: faster, lower and with a drum on every beat
    boss: false,
    bossTempo: 0.13,
    bossMelody: [0, 0, 1, 0, -1, null, 0, null, 0, 0, 2, 1, 0, -1, -2, null,
                 3, 3, 2, 1, 2, null, 1, null, 0, 1, 0, -1, -2, -1, 0, null],
    bossBass: [-5, -5, -4, -5, -5, -5, -3, -4]
};

function degreeToFreq(degree, root) {
    const octave = Math.floor(degree / 5);
    const index = ((degree % 5) + 5) % 5;
    return root * Math.pow(2, (PENTATONIC[index] + 12 * octave) / 12);
}

function scheduleNote(freq, time, duration, type, volume) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, time);
    gain.gain.linearRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain);
    gain.connect(MUSIC.gain);
    osc.start(time);
    osc.stop(time + duration);
}

function musicTick() {
    // After the tab was in the background, skip ahead instead of playing a burst of late notes
    if (MUSIC.nextTime < audioCtx.currentTime - 0.5) MUSIC.nextTime = audioCtx.currentTime;
    while (MUSIC.nextTime < audioCtx.currentTime + 0.25) {
        const root = MUSIC_ROOTS[currentLevel.theme] || MUSIC_ROOTS.forest;
        if (MUSIC.boss) {
            const tempo = MUSIC.bossTempo;
            const note = MUSIC.bossMelody[MUSIC.step % MUSIC.bossMelody.length];
            if (note !== null) scheduleNote(degreeToFreq(note, root), MUSIC.nextTime, tempo * 0.8, 'sawtooth', 0.03);
            if (MUSIC.step % 2 === 0) {
                const bass = MUSIC.bossBass[(MUSIC.step / 2) % MUSIC.bossBass.length];
                scheduleNote(degreeToFreq(bass, root / 2), MUSIC.nextTime, tempo * 1.8, 'square', 0.05);
                scheduleNote(55, MUSIC.nextTime, 0.12, 'sine', 0.25); // drum
            }
            if (MUSIC.step % 8 === 4) scheduleNote(41, MUSIC.nextTime, 0.25, 'triangle', 0.2);
            MUSIC.nextTime += tempo;
            MUSIC.step++;
            continue;
        }
        const note = MUSIC.melody[MUSIC.step % MUSIC.melody.length];
        if (note !== null) scheduleNote(degreeToFreq(note, root), MUSIC.nextTime, MUSIC.tempo * 0.9, 'square', 0.035);
        if (MUSIC.step % 2 === 0) {
            const bass = MUSIC.bass[(MUSIC.step / 2) % MUSIC.bass.length];
            if (bass !== null) scheduleNote(degreeToFreq(bass, root / 2), MUSIC.nextTime, MUSIC.tempo * 1.8, 'triangle', 0.08);
        }
        MUSIC.nextTime += MUSIC.tempo;
        MUSIC.step++;
    }
}

function startMusic() {
    if (!audioCtx || MUSIC.timer) return;
    MUSIC.gain = audioCtx.createGain();
    MUSIC.gain.gain.value = MUSIC.on ? 1 : 0;
    MUSIC.gain.connect(audioCtx.destination);
    MUSIC.nextTime = audioCtx.currentTime + 0.1;
    MUSIC.timer = setInterval(musicTick, 100);
}

function toggleMusic() {
    MUSIC.on = !MUSIC.on;
    if (MUSIC.gain) MUSIC.gain.gain.value = MUSIC.on ? 1 : 0;
}
