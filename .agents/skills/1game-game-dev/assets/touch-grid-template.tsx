import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'up' | 'down' | 'left' | 'right';

type GameState = {
  phase: 'ready' | 'playing' | 'lost';
  tickMs: number;
  cell: number;
  head: { x: number; y: number };
  direction: Direction;
  nextDirection: Direction;
  swipeStart: { x: number; y: number } | null;
};

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const GRID_COLS = 10;
const GRID_ROWS = 14;
const CELL_SIZE = 28;
const GRID_X = 40;
const GRID_Y = 120;
const MOVE_INTERVAL_MS = 140;

function opposite(a: Direction, b: Direction): boolean {
  return (a === 'up' && b === 'down') || (a === 'down' && b === 'up') || (a === 'left' && b === 'right') || (a === 'right' && b === 'left');
}

function stepHead(head: { x: number; y: number }, dir: Direction): { x: number; y: number } {
  if (dir === 'up') return { x: head.x, y: head.y - 1 };
  if (dir === 'down') return { x: head.x, y: head.y + 1 };
  if (dir === 'left') return { x: head.x - 1, y: head.y };
  return { x: head.x + 1, y: head.y };
}

const { store, commitChange, storeHistory } = createGameStore<GameState>(
  {
    phase: 'ready',
    tickMs: 0,
    cell: CELL_SIZE,
    head: { x: 4, y: 6 },
    direction: 'right',
    nextDirection: 'right',
    swipeStart: null,
  },
  { enableHistory: true },
);

function Game() {
  useFrame((frame) => {
    const dtMs = Math.min(frame.deltaSeconds, 0.05) * 1000;
    commitChange('逻辑帧', (draft) => {
      if (draft.phase !== 'playing') return;
      draft.tickMs += dtMs;
      if (draft.tickMs < MOVE_INTERVAL_MS) return;
      draft.tickMs -= MOVE_INTERVAL_MS;

      if (!opposite(draft.direction, draft.nextDirection)) {
        draft.direction = draft.nextDirection;
      }

      const next = stepHead(draft.head, draft.direction);
      if (next.x < 0 || next.x >= GRID_COLS || next.y < 0 || next.y >= GRID_ROWS) {
        draft.phase = 'lost';
        return;
      }
      draft.head = next;
    });
  });

  return (
    <scene
      name="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#0f172a"
      clickable
      onClick={() => {
        commitChange('开始', (draft) => {
          if (draft.phase === 'ready') draft.phase = 'playing';
        });
      }}
      onPointerDown={(e) => {
        commitChange('滑动:开始', (draft) => {
          draft.swipeStart = { x: e.x, y: e.y };
        });
      }}
      onPointerUp={(e) => {
        commitChange('滑动:结束', (draft) => {
          const from = draft.swipeStart;
          draft.swipeStart = null;
          if (!from || draft.phase === 'lost') return;
          const dx = e.x - from.x;
          const dy = e.y - from.y;
          const threshold = 18;
          if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
          draft.nextDirection = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
          if (draft.phase === 'ready') draft.phase = 'playing';
        });
      }}
    >
      <text
        x={0}
        y={28}
        width={SCENE_WIDTH}
        height={28}
        text={store.phase === 'lost' ? '失败 - 当前模板未实现重开' : '滑动移动'}
        textAlign="center"
        textColor="#e2e8f0"
        textSize="20"
      />

      <node
        x={GRID_X}
        y={GRID_Y}
        width={GRID_COLS * store.cell}
        height={GRID_ROWS * store.cell}
        shape="roundedRect(10 10 10 10)"
        border="solid"
        borderWidth={2}
        borderColor="#334155"
      />

      <node
        x={GRID_X + store.head.x * store.cell + 2}
        y={GRID_Y + store.head.y * store.cell + 2}
        width={store.cell - 4}
        height={store.cell - 4}
        shape="roundedRect(6 6 6 6)"
        backgroundColor="#22d3ee"
      />
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
