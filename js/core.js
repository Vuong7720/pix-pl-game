// Canvas, dev mode, save data, shop upgrades, shared helpers

// --- GAME CANVAS & SETUP ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 800;
const GAME_HEIGHT = 540;
// The backing store is 2x the logical size, so pixel art drawn at 1.5x lands on whole device pixels (3px per art pixel)
const RENDER_SCALE = 2;
const ART_SCALE = 1.5;
canvas.width = GAME_WIDTH * RENDER_SCALE;
canvas.height = GAME_HEIGHT * RENDER_SCALE;

// UI Elements
const startOverlay = document.getElementById('start-overlay');
const gameOverOverlay = document.getElementById('gameover-overlay');
const hpBar = document.getElementById('hp-bar');
const hpText = document.getElementById('hp-text');
const scoreDisplay = document.getElementById('score-display');
const comboDisplay = document.getElementById('combo-display');
const levelIndicator = document.getElementById('level-indicator');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const hud = document.getElementById('hud');
const mobileControls = document.getElementById('mobile-controls');
const mapUi = document.getElementById('map-ui');
const clearOverlay = document.getElementById('clear-overlay');
const pauseOverlay = document.getElementById('pause-overlay');
const shopOverlay = document.getElementById('shop-overlay');
const avatarCanvas = document.getElementById('avatar-canvas');
const mpBar = document.getElementById('mp-bar');
const livesDisplay = document.getElementById('lives-display');
const peachDisplay = document.getElementById('peach-display');

// Game State
let gameState = 'START'; // 'START', 'MAP', 'PLAYING', 'PAUSED', 'CLEAR', 'GAMEOVER', 'VICTORY'
let currentLevelIndex = 0;
let score = 0;
let comboCount = 0;
let comboTimer = 0;
let lastTime = 0;
// Movement is applied per update, so the campaign updates at a fixed 60 Hz on any monitor
const STEP = 1 / 60;
let stepAcc = 0;
// Horizontal speed of heroes and monsters (1 = original pace); lower is calmer and easier to read
const MOVE_SCALE = 0.85;
// Speech bubbles: seconds of reading time per character, and a floor for short lines
const BUBBLE_READ_RATE = 0.065;
const BUBBLE_MIN_TIME = 1.6;

const BASE_LIVES = 3;
let lives = BASE_LIVES;
let maxLives = BASE_LIVES;
let runPeaches = 0; // peaches picked up during the current stage attempt
let respawnPoint = { x: 100, y: 350 };

// Game feel: brief freeze on impact and camera shake (in pixels, decays every frame)
let worldTime = 0; // seconds, drives looping effects (kelp sway, currents, light rays)
let hitStop = 0;
let shake = 0;
function addShake(amount) {
    shake = Math.max(shake, amount);
}

// --- DEV MODE: open with ?dev in the URL. Everything is unlocked and nothing is saved ---
const DEV = new URLSearchParams(location.search).has('dev');
const dev = { god: true, infiniteMp: true };

// Skill slots open as the campaign progresses (all open in duels and dev mode)
function isSkillLearned(slot) {
    return DEV || duel.active || save.unlocked > SLOT_UNLOCK_STAGE[slot];
}

// Controls of a frozen fighter
const NO_INPUT = { left: false, right: false, attack: false, dash: false };

// --- SAVE DATA (localStorage) ---
const SAVE_KEY = 'tay-du-ky-save';
function freshSave() {
    return {
        unlocked: 0,      // highest stage index that can be entered
        peaches: 0,       // currency for the shop
        stars: [],        // best star count per stage
        bestScores: [],   // best score per stage
        upgrades: {},     // upgrade id -> level bought
        character: 'wukong',
        loadouts: {},     // character id -> the 3 skills picked from its skill pool
        storySeen: {}     // story parts already shown ('opening', '<stage>-<part>')
    };
}
let save = freshSave();

// The three skills a character brings: a saved pick from its pool, or its defaults
function loadoutOf(charId) {
    const ch = CHARACTERS[charId];
    const picked = (save.loadouts || {})[charId];
    if (ch.skillPool && Array.isArray(picked) && picked.length === 3 && picked.every(id => ch.skillPool.includes(id))) return [...picked];
    return [...ch.skills];
}

function loadSave() {
    try {
        Object.assign(save, JSON.parse(localStorage.getItem(SAVE_KEY)) || {});
    } catch (e) { /* storage unavailable: play without saving */ }
    if (!CHARACTERS[save.character]) save.character = 'wukong';
    // Saves from before Thiên Môn: a cleared last stage opens the next one
    if ((save.stars[save.unlocked] || 0) > 0) save.unlocked = Math.min(save.unlocked + 1, LEVELS.length - 1);
}

function writeSave() {
    if (DEV) return; // keep the real progress untouched while testing
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch (e) { /* storage unavailable */ }
}

// --- SHOP UPGRADES (bought with Đào Tiên); cost[i] is the price of level i+1 ---
const UPGRADES = [
    { id: 'hp',   name: 'Kim Cang Bất Hoại', desc: '+20 máu tối đa',               cost: [15, 25, 40] },
    { id: 'atk',  name: 'Như Ý Kim Cô Bổng', desc: '+20% sát thương',              cost: [20, 35, 55] },
    { id: 'mp',   name: 'Linh Khí Hội Tụ',   desc: '+3 Pháp Lực mỗi đòn trúng',    cost: [15, 25, 40] },
    { id: 'dash', name: 'Cân Đẩu Vân',       desc: 'Lướt hồi nhanh hơn 0,15 giây', cost: [20, 35] },
    { id: 'life', name: 'Hộ Thân Phù',       desc: '+1 mạng mỗi ải',               cost: [30, 60] },
    { id: 'jump', name: 'Tam Đoạn Khiêu',    desc: 'Nhảy được 3 lần trên không',  cost: [50] }
];

function upgradeLevel(id) {
    if (duel.active) return 0; // duels are fair: no shop upgrades
    return save.upgrades[id] || 0;
}

// Keyboard Inputs
const keys = {
    left: false,
    right: false,
    up: false,
    attack: false,
    dash: false
};

function pressKey(code, repeat) {
    // Story on screen: keys only page through it
    if (gameState === 'STORY') {
        if (repeat) return;
        const digit = /^(Digit|Numpad)([1-4])$/.exec(code);
        if (code === 'Escape') endStory();
        else if (digit) answerQuiz(+digit[2] - 1);
        else if (['Space', 'Enter', 'KeyJ'].includes(code)) advanceStory();
        return;
    }
    if (bossIntro.active && gameState === 'PLAYING') {
        if (!repeat && ['Space', 'KeyW', 'ArrowUp', 'Enter', 'KeyJ'].includes(code)) skipBossIntro();
        return;
    }
    if (code === 'KeyA' || code === 'ArrowLeft') keys.left = true;
    if (code === 'KeyD' || code === 'ArrowRight') keys.right = true;
    if (code === 'KeyW' || code === 'ArrowUp' || code === 'Space') {
        if (!keys.up && (gameState === 'PLAYING' || gameState === 'DUEL')) localJump();
        keys.up = true;
    }
    if (code === 'KeyJ') keys.attack = true;
    if (code === 'KeyK' || code === 'ShiftLeft' || code === 'ShiftRight') keys.dash = true;
    if (repeat) return;
    if (gameState === 'PLAYING' || gameState === 'DUEL') {
        if (code === 'KeyU') localSkill(0);
        if (code === 'KeyI') localSkill(1);
        if (code === 'KeyO') localSkill(2);
        if (gameState === 'PLAYING' && (code === 'Escape' || code === 'KeyP')) setPaused(true);
    } else if (gameState === 'PAUSED') {
        if (code === 'Escape' || code === 'KeyP') setPaused(false);
    } else if (gameState === 'MAP') {
        handleMapKey(code);
    }
    if (code === 'KeyM') toggleMusic();
    if (code === 'Backquote' && DEV) document.getElementById('dev-panel').classList.toggle('hidden');
}

function releaseKey(code) {
    if (code === 'KeyA' || code === 'ArrowLeft') keys.left = false;
    if (code === 'KeyD' || code === 'ArrowRight') keys.right = false;
    if (code === 'KeyW' || code === 'ArrowUp' || code === 'Space') keys.up = false;
    if (code === 'KeyJ') keys.attack = false;
    if (code === 'KeyK' || code === 'ShiftLeft' || code === 'ShiftRight') keys.dash = false;
}

// --- SHARED HELPERS ---
function seededRandom(seed) {
    return () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };
}
