// Kiểm tra nhanh trước khi gộp code vào main (chạy: node tools/check.js)
// 1. Mọi file css/js mà index.html nạp đều tồn tại
// 2. Cú pháp JavaScript từng file trong js/, và không file nào khai báo trùng tên với file khác
// 3. Mọi file hình khai báo trong ASSET_FILES (js/assets.js) đều có trong thư mục assets/
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let failed = false;
const fail = msg => { console.error(msg); failed = true; };

// Local files only: CDN links start with http
const local = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(m => m[1]).filter(f => !/^https?:/.test(f));
const missingFiles = local.filter(f => !fs.existsSync(path.join(root, f)));
if (missingFiles.length) fail(`✗ index.html nạp file không tồn tại: ${missingFiles.join(', ')}`);

const scripts = local.filter(f => f.endsWith('.js') && !missingFiles.includes(f));
if (scripts.length === 0) fail('✗ index.html không nạp file js/ nào');
const sources = scripts.map(f => [f, fs.readFileSync(path.join(root, f), 'utf8')]);
let syntaxOk = true;
for (const [f, code] of sources) {
    try {
        new vm.Script(code, { filename: f });
    } catch (e) {
        fail(`✗ Lỗi cú pháp trong ${f}:\n${e.stack.split('\n').slice(0, 5).join('\n')}`);
        syntaxOk = false;
    }
}
if (syntaxOk && scripts.length) {
    // The files share one global scope: the same const/let/class in two files breaks the game at load
    try {
        new vm.Script(sources.map(([, code]) => code).join('\n;\n'), { filename: 'js/*.js' });
        console.log(`✓ Cú pháp JavaScript hợp lệ (${scripts.length} file trong js/)`);
    } catch (e) {
        fail(`✗ Hai file trong js/ khai báo trùng tên: ${e.message}`);
    }
}

const assetsFile = path.join(root, 'js', 'assets.js');
const assetBlock = fs.existsSync(assetsFile) && fs.readFileSync(assetsFile, 'utf8').match(/const ASSET_FILES = \{([\s\S]*?)\};/);
if (!assetBlock) {
    fail('✗ Không tìm thấy ASSET_FILES trong js/assets.js');
} else {
    const files = [...assetBlock[1].matchAll(/'([^']+\.png)'/g)].map(m => m[1]);
    const missing = files.filter(f => !fs.existsSync(path.join(root, 'assets', f)));
    if (missing.length) fail(`✗ Thiếu file trong assets/: ${missing.join(', ')}`);
    else console.log(`✓ Đủ ${files.length} file hình trong assets/`);
}

process.exit(failed ? 1 : 0);
