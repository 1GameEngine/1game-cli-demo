import { createGameStore } from '@1game/engine-bundle/runtime/worker';
import { makeTitleState } from '../data/initial';

export const { store, commitChange, storeHistory } = createGameStore(makeTitleState(), {
  enableHistory: true,
});
