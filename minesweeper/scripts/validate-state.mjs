/** 校验 store:state 中地雷邻数与雷数是否自洽 */

export function validateState(state) {
  const errors = [];
  const { cols, rows, cells, mineCount } = state;
  const total = cols * rows;

  if (cells.length !== total) {
    errors.push(`cells.length ${cells.length} !== ${total}`);
  }

  let mines = 0;
  let revealed = 0;
  let flagged = 0;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = y * cols + x;
      const cell = cells[idx];
      if (cell.isMine) mines += 1;
      if (cell.isRevealed) revealed += 1;
      if (cell.isFlagged) flagged += 1;

      if (!cell.isMine) {
        let expected = 0;
        for (const [dx, dy] of [
          [-1, -1],
          [0, -1],
          [1, -1],
          [-1, 0],
          [1, 0],
          [-1, 1],
          [0, 1],
          [1, 1],
        ]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
          if (cells[ny * cols + nx].isMine) expected += 1;
        }
        if (cell.adjacentMines !== expected) {
          errors.push(`(${x},${y}) adjacentMines ${cell.adjacentMines} !== ${expected}`);
        }
      } else if (cell.adjacentMines !== 0) {
        errors.push(`(${x},${y}) mine cell has adjacentMines ${cell.adjacentMines}`);
      }

      if (cell.isRevealed && cell.isFlagged) {
        errors.push(`(${x},${y}) both revealed and flagged`);
      }
    }
  }

  if (state.minesGenerated && mines !== mineCount) {
    errors.push(`mine count ${mines} !== mineCount ${mineCount}`);
  }

  if (flagged > mineCount) {
    errors.push(`flagCount ${state.flagCount} inconsistent with flagged cells ${flagged}`);
  }

  const safeTotal = total - mineCount;
  if (state.phase === 'won') {
    const hiddenSafe = cells.filter((c) => !c.isMine && !c.isRevealed).length;
    if (hiddenSafe > 0) errors.push(`won but ${hiddenSafe} safe cells still hidden`);
  }

  return { ok: errors.length === 0, errors, mines, revealed, flagged, safeTotal };
}
