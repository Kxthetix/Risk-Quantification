const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const venvWin = path.join(root, '.venv', 'Scripts', 'python.exe');
const venvPosix = path.join(root, '.venv', 'bin', 'python');
const py = process.env.PYTHON || (fs.existsSync(venvWin) ? venvWin : fs.existsSync(venvPosix) ? venvPosix : 'python3');

const res = spawnSync(py, process.argv.slice(2), { stdio: 'inherit', cwd: root });
process.exit(res.status ?? (res.error ? 1 : 0));
