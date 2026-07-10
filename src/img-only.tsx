import { createGameStore, renderGame } from '@1game/engine-bundle/runtime/worker';
import stage1 from './assets/maps/stage-1.png';
import titleTank from './assets/essential/title-tank.png';

const { storeHistory } = createGameStore({ ok: 1 }, { enableHistory: true });
console.log('STAGE1', JSON.stringify({ ...stage1, dataUrl: stage1.dataUrl.slice(0, 30) }));
console.log('TITLE', JSON.stringify({ ...titleTank, dataUrl: titleTank.dataUrl.slice(0, 30) }));

renderGame(() => (
  <scene name="main" width={256} height={312} backgroundColor="#333">
    <image source={titleTank} x={100} y={10} width={48} height={24} imageFit="fill" />
    <image source={stage1} x={24} y={50} width={208} height={208} imageFit="fill" />
    <text x={0} y={280} width={256} height={20} text="MAP TEST" textAlign="center" textColor="#fff" textSize="14" />
  </scene>
), { bindStore: storeHistory });
