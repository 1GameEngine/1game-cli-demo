import { createGameStore, useFrame, renderGame } from '@1game/engine-bundle/runtime/worker';

type GameState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  count: number;
};

const { store, commitChange, storeHistory } = createGameStore({
  x: 120,
  y: 90,
  vx: 2,
  vy: 1.5,
  radius: 16,
  count: 0,
}, { enableHistory: true });

function App() {
  const increase = () => {
    commitChange('count + 1', (draft: GameState) => {
      draft.count += 1;
    });
  };

  useFrame(() => {
    commitChange('move', (draft: GameState) => {
      const nextX = draft.x + draft.vx;
      if (nextX - draft.radius < 0 || nextX + draft.radius > 320) {
        draft.vx = -draft.vx;
      } else {
        draft.x = nextX;
      }
      const nextY = draft.y + draft.vy;
      if (nextY - draft.radius < 0 || nextY + draft.radius > 180) {
        draft.vy = -draft.vy;
      } else {
        draft.y = nextY;
      }
    });
  });

  return (
    <scene name="main" width={320} height={180} backgroundColor="#0f1224">
      <text
        x={12}
        y={10}
        width={296}
        height={28}
        text={'Count: ' + store.count}
        textSize="20"
        textColor="#ffffff"
      />
      <group
        x={12}
        y={44}
        width={96}
        height={34}
        clickable
        onClick={increase}
      >
        <node x={0} y={0} width={96} height={34} shape="roundedRect(8 8 8 8)" backgroundColor="#2c4cff" />
        <text
          x={0}
          y={7}
          width={96}
          height={20}
          text="+1"
          textAlign="center"
          textSize="18"
          textColor="#ffffff"
        />
      </group>
      <node
        x={store.x - store.radius}
        y={store.y - store.radius}
        width={store.radius * 2}
        height={store.radius * 2}
        shape="circular"
        backgroundColor="#7c6aef"
      />
    </scene>
  );
}

renderGame(() => <App />, { bindStore: storeHistory });
