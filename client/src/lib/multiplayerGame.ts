export type MultiplayerSlug = "tic-tac-toe" | "connect-four";
export type Marker = "X" | "O" | "";

const ticTacToeLines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

export function winnerFor(grid: Marker[], game: MultiplayerSlug): Marker {
  const lines = game === "tic-tac-toe" ? ticTacToeLines : connectFourLines();
  for (const line of lines) { const marker = grid[line[0]]; if (marker && line.every((index) => grid[index] === marker)) return marker; }
  return "";
}

export function connectFourIndex(grid: Marker[], column: number) {
  if (!Number.isInteger(column) || column < 0 || column > 6) return -1;
  for (let row = 5; row >= 0; row--) { const index = row * 7 + column; if (!grid[index]) return index; }
  return -1;
}

function connectFourLines() {
  const lines: number[][] = [];
  for (let row = 0; row < 6; row++) for (let column = 0; column < 7; column++) for (const [rowDelta, columnDelta] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    const endRow = row + rowDelta * 3; const endColumn = column + columnDelta * 3;
    if (endRow < 0 || endRow >= 6 || endColumn < 0 || endColumn >= 7) continue;
    lines.push(Array.from({ length: 4 }, (_, offset) => (row + rowDelta * offset) * 7 + column + columnDelta * offset));
  }
  return lines;
}
