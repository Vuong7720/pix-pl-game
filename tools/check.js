// Kiểm tra nhanh trước khi gộp code vào main (chạy: node tools/check.js)
// 1. Cú pháp JavaScript trong index.html
// 2. Mọi file hình khai báo trong ASSET_FILES đều có trong thư mục assets/
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let failed = false;

// Only inline scripts (no src attribute) contain game code
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (scripts.length === 0) {
    console.error('✗ Không tìm thấy <script> nào trong index.html');
    failed = true;
}
scripts.forEach((code, i) => {
    try {
        new vm.Script(code, { filename: `index.html <script> #${i + 1}` });
        console.log(`✓ Cú pháp JavaScript hợp lệ (script #${i + 1})`);
    } catch (e) {
        console.error(`✗ Lỗi cú pháp trong script #${i + 1}:\n${e.stack.split('\n').slice(0, 5).join('\n')}`);
        failed = true;
    }
});

const assetBlock = html.match(/const ASSET_FILES = \{([\s\S]*?)\};/);
if (!assetBlock) {
    console.error('✗ Không tìm thấy ASSET_FILES trong index.html');
    failed = true;
} else {
    const files = [...assetBlock[1].matchAll(/'([^']+\.png)'/g)].map(m => m[1]);
    const missing = files.filter(f => !fs.existsSync(path.join(root, 'assets', f)));
    if (missing.length) {
        console.error(`✗ Thiếu file trong assets/: ${missing.join(', ')}`);
        failed = true;
    } else {
        console.log(`✓ Đủ ${files.length} file hình trong assets/`);
    }
}

process.exit(failed ? 1 : 0);
