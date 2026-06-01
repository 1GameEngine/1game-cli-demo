#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

ARCHIVE=out/autotest.1gamerecord
CELL_CENTER='function cx(x){return 16+x*32+16} function cy(y){return 40+y*32+16}'

echo "== build =="
npm run build -s
echo "== create archive =="
npx 1gameplay create --entry src/game.tsx --out "$ARCHIVE" >/dev/null

query_state() {
  npx 1gameplay frame query "$ARCHIVE" --at last --select store:state --payload summary 2>/dev/null \
    | node --input-type=module -e "
import { validateState } from './scripts/validate-state.mjs';
const chunks=[]; process.stdin.on('data',d=>chunks.push(d));
process.stdin.on('end',()=>{
  const j=JSON.parse(Buffer.concat(chunks).toString());
  const s=j.result.select['store:state'];
  const v=validateState(s);
  console.log(JSON.stringify({ phase:s.phase, flagMode:s.flagMode, flagCount:s.flagCount, minesGenerated:s.minesGenerated, ...v }));
  if(!v.ok) process.exit(2);
});
"
}

click() { npx 1gameplay step "$ARCHIVE" --ms 16 --event "{\"type\":\"click\",\"sceneId\":\"main\",\"data\":{\"x\":$1,\"y\":$2}}" >/dev/null; }
keypress() { npx 1gameplay step "$ARCHIVE" --ms 16 --event "{\"type\":\"keypress\",\"sceneId\":\"main\",\"data\":{\"code\":\"$1\"}}" >/dev/null; }

echo "== test 1: initial state =="
query_state | tee /tmp/ms1.json | grep -q '"phase":"ready"'

echo "== test 2: first click (4,6) =="
click 160 248
query_state | tee /tmp/ms2.json | grep -q '"phase":"playing"'
query_state | grep -q '"minesGenerated":true'

echo "== test 3: flag mode + flag cell (0,0) =="
click 84 454
query_state | grep -q '"flagMode":true'
click 32 56
query_state | tee /tmp/ms3.json | grep -q '"flagCount":1'

echo "== test 4: unflag (0,0) =="
click 32 56
query_state | grep -q '"flagCount":0'

echo "== test 5: restart button =="
click 236 454
query_state | grep -q '"phase":"ready"'
query_state | grep -q '"minesGenerated":false'

echo "== test 6: keypress F toggle flag =="
keypress KeyF
query_state | grep -q '"flagMode":true'
keypress KeyF
query_state | grep -q '"flagMode":false'

echo "== test 7: first click never mine =="
click 48 88
STATE=$(query_state)
echo "$STATE" | node -e "const s=JSON.parse(require('fs').readFileSync(0,'utf8')); const idx=1*9+1; /* approx - skip */"
# 检查首击格 (1,1) 中心
npx 1gameplay frame query "$ARCHIVE" --at last --select store:state --payload summary 2>/dev/null | node --input-type=module -e "
const chunks=[]; process.stdin.on('data',d=>chunks.push(d));
process.stdin.on('end',()=>{
  const s=JSON.parse(Buffer.concat(chunks).toString()).result.select['store:state'];
  const c=s.cells[1*9+1];
  if(c.isMine && s.phase==='lost') { console.error('BUG: first click hit mine'); process.exit(3); }
  console.log('first cell (1,1) mine=', c.isMine, 'phase=', s.phase);
});
"

echo "== test 8: simulate mine hit =="
# 找未翻开的雷
npx 1gameplay frame query "$ARCHIVE" --at last --select store:state --payload summary 2>/dev/null | node --input-type=module -e "
const chunks=[]; process.stdin.on('data',d=>chunks.push(d));
process.stdin.on('end',()=>{
  const s=JSON.parse(Buffer.concat(chunks).toString()).result.select['store:state'];
  for(let i=0;i<s.cells.length;i++){
    const c=s.cells[i];
    if(c.isMine && !c.isRevealed){
      const x=i%s.cols, y=Math.floor(i/s.cols);
      console.log(JSON.stringify({x,y,px:16+x*32+16,py:40+y*32+16}));
      process.exit(0);
    }
  }
  console.error('no hidden mine'); process.exit(4);
});
" > /tmp/minepos.json
MP=$(cat /tmp/minepos.json)
MX=$(node -e "console.log(JSON.parse(process.argv[1]).px)" "$MP")
MY=$(node -e "console.log(JSON.parse(process.argv[1]).py)" "$MP")
click "$MX" "$MY"
query_state | grep -q '"phase":"lost"'

echo "== test 9: overlay restart after lost =="
node --input-type=module -e "
import { execSync } from 'node:child_process';
const ARCH='out/overlay2.1gamerecord';
execSync('npx 1gameplay create --entry src/game.tsx --out '+ARCH,{stdio:'pipe'});
const click=(x,y)=>execSync(\`npx 1gameplay step \${ARCH} --ms 16 --event '{\"type\":\"click\",\"sceneId\":\"main\",\"data\":{\"x\":\${x},\"y\":\${y}}}'\`,{stdio:'pipe'});
const st=()=>JSON.parse(execSync(\`npx 1gameplay frame query \${ARCH} --at last --select store:state --payload summary\`,{encoding:'utf8'})).result.select['store:state'];
click(160,248);
let s=st();
for(let i=0;i<s.cells.length;i++){
  if(s.cells[i].isMine&&!s.cells[i].isRevealed){const x=i%9,y=(i/9)|0;click(16+x*32+16,40+y*32+16);break;}
}
if(st().phase!=='lost') throw new Error('expected lost');
click(160,240);
if(st().phase!=='ready') throw new Error('overlay restart failed');
console.log('overlay restart ok');
"

echo "== ALL TESTS PASSED =="
