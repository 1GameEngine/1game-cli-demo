import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const archive = process.argv[2] ?? 'out/snake-score5.1gamerecord';
const planPath = process.argv[3] ?? '/tmp/snake-plan.json';

const { plan } = JSON.parse(readFileSync(planPath, 'utf8'));

function run(args) {
  execFileSync('npx', ['1gameplay', ...args], { stdio: 'inherit', cwd: new URL('..', import.meta.url).pathname });
}

for (const item of plan) {
  if (item.type === 'step') {
    run(['step', archive, '--ms', String(item.ms), '--repeat', String(item.repeat)]);
  } else if (item.type === 'keypress') {
    const event = JSON.stringify({
      type: 'keypress',
      sceneId: 'main',
      data: { code: item.code },
    });
    run(['step', archive, '--ms', '16', '--event', event]);
  }
}

const out = execFileSync(
  'npx',
  ['1gameplay', 'frame', 'query', archive, '--at', 'last', '--select', 'store:state', '--payload', 'summary'],
  { encoding: 'utf8' },
);
console.log(out);
