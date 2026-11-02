// Chạy thử game trong Chrome không giao diện (chạy: node tools/smoke.mjs, cần Node 22+ và Google Chrome)
// Mở index.html?dev, vào từng ải, chạy vài giây và báo mọi lỗi JavaScript.
// Bắt được lỗi mà tools/check.js không thấy, ví dụ một file trong js/ dùng thứ chưa được nạp.
import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const chrome = process.env.CHROME || [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome'
].find(p => existsSync(p));
if (!chrome) {
    console.error('✗ Không tìm thấy Chrome. Đặt biến môi trường CHROME trỏ tới file chạy của Chrome.');
    process.exit(1);
}

const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, '--window-size=820,600',
    '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required',
    `--user-data-dir=${mkdtempSync(join(tmpdir(), 'smoke-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let targets;
for (let i = 0; i < 50 && !targets; i++) {
    await sleep(200);
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch {}
}
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value ?? a.description).join(' '));
});
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const run = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true })).result.result?.value;

await send('Runtime.enable');
const url = pathToFileURL(resolve(import.meta.dirname, '..', 'index.html')).href + '?dev';
await send('Page.navigate', { url });
let ready = false;
for (let i = 0; i < 50 && !ready; i++) {
    await sleep(200);
    ready = await run(`!!document.getElementById('start-btn') && !document.getElementById('start-btn').disabled`);
}
if (!ready) errors.push('Nút bắt đầu không bật: game không tải xong');

const stages = ready ? await run('LEVELS.length') : 0;
for (let i = 0; i < stages; i++) {
    await run(`startRun(${i})`);
    await sleep(800);
    for (let k = 0; k < 3; k++) { await run('endStory()'); await sleep(200); }
    // Walk the hero through the stage so monsters wake up and fight
    for (const x of [400, 1500, 3000]) {
        await run(`player.x = ${x}; player.y = 200;`);
        await sleep(700);
    }
    const name = await run('currentLevel.name');
    console.log(`  ải ${i + 1}: ${name}`);
}

ws.close();
proc.kill();
if (errors.length) {
    console.error(`✗ ${errors.length} lỗi:\n` + [...new Set(errors)].map(e => '  ' + String(e).split('\n')[0]).join('\n'));
    process.exit(1);
}
console.log(`✓ Chạy thử ${stages} ải, không có lỗi JavaScript`);
process.exit(0);
