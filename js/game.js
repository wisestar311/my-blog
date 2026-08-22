// js/game.js — 2048 game state, move/merge logic, rendering, input handling.
// DOM contract (defined by game.html / css/game.css, do not change here):
//   #game-board       .grid-cell x16 (static) + .tile elements appended/removed on render
//   #score-value / #best-value   textContent updated with current numbers
//   #new-game-btn                click -> initGame()
//   #game-overlay (hidden attr)  #game-overlay-message (text)
//   #overlay-restart-btn         click -> hide overlay, initGame()
//   #overlay-keep-playing-btn (hidden attr, shown only on win)
//                                 click -> keepPlayingAfterWin = true, hide overlay only
(function () {
  "use strict";

  const GRID_SIZE = 4;
  const BEST_SCORE_KEY = "2048-best-score";

  let grid = [];
  let score = 0;
  let best = 0;
  let isGameOver = false;
  let hasWon = false;
  let keepPlayingAfterWin = false;

  const boardEl = document.getElementById("game-board");
  const scoreValueEl = document.getElementById("score-value");
  const bestValueEl = document.getElementById("best-value");
  const newGameBtn = document.getElementById("new-game-btn");
  const overlayEl = document.getElementById("game-overlay");
  const overlayMessageEl = document.getElementById("game-overlay-message");
  const overlayRestartBtn = document.getElementById("overlay-restart-btn");
  const overlayKeepPlayingBtn = document.getElementById("overlay-keep-playing-btn");

  function createEmptyGrid() {
    const g = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      g.push(new Array(GRID_SIZE).fill(0));
    }
    return g;
  }

  function cloneGrid(g) {
    return g.map(function (row) {
      return row.slice();
    });
  }

  function gridsEqual(a, b) {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (a[r][c] !== b[r][c]) return false;
      }
    }
    return true;
  }

  function getColumn(g, col) {
    const column = [];
    for (let r = 0; r < GRID_SIZE; r++) column.push(g[r][col]);
    return column;
  }

  function setColumn(g, col, values) {
    for (let r = 0; r < GRID_SIZE; r++) g[r][col] = values[r];
  }

  // Slide a length-4 line (with zeros) to the left and merge equal
  // neighbours once per pair. Returns the new line and the score gained.
  function slideAndMergeLine(line) {
    const compacted = line.filter(function (v) {
      return v !== 0;
    });
    const result = [];
    let gained = 0;
    for (let i = 0; i < compacted.length; i++) {
      if (compacted[i] !== 0 && compacted[i] === compacted[i + 1]) {
        const merged = compacted[i] * 2;
        result.push(merged);
        gained += merged;
        i++; // skip the value already consumed by the merge
      } else {
        result.push(compacted[i]);
      }
    }
    while (result.length < GRID_SIZE) result.push(0);
    return { line: result, gained: gained };
  }

  function spawnTile() {
    const empties = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] === 0) empties.push({ row: r, col: c });
      }
    }
    if (empties.length === 0) return;
    const pick = empties[Math.floor(Math.random() * empties.length)];
    grid[pick.row][pick.col] = Math.random() < 0.9 ? 2 : 4;
  }

  function move(direction) {
    if (
      direction !== "up" &&
      direction !== "down" &&
      direction !== "left" &&
      direction !== "right"
    ) {
      return;
    }

    const previousGrid = cloneGrid(grid);
    let totalGained = 0;

    if (direction === "left" || direction === "right") {
      for (let r = 0; r < GRID_SIZE; r++) {
        let line = grid[r];
        if (direction === "right") line = line.slice().reverse();
        const result = slideAndMergeLine(line);
        totalGained += result.gained;
        grid[r] = direction === "right" ? result.line.slice().reverse() : result.line;
      }
    } else {
      for (let c = 0; c < GRID_SIZE; c++) {
        let line = getColumn(grid, c);
        if (direction === "down") line = line.slice().reverse();
        const result = slideAndMergeLine(line);
        totalGained += result.gained;
        const finalLine = direction === "down" ? result.line.slice().reverse() : result.line;
        setColumn(grid, c, finalLine);
      }
    }

    if (gridsEqual(grid, previousGrid)) {
      // Invalid move: nothing changed, no spawn, no re-render needed.
      return;
    }

    score += totalGained;
    spawnTile();
    updateBestScore();
    const justWon = checkWin();
    if (!justWon) checkGameOver();
    render();
  }

  function checkWin() {
    if (hasWon || keepPlayingAfterWin) return false;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] >= 2048) {
          hasWon = true;
          showOverlay("You Win!", true);
          return true;
        }
      }
    }
    return false;
  }

  function checkGameOver() {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] === 0) return false;
      }
    }
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const value = grid[r][c];
        if (c + 1 < GRID_SIZE && grid[r][c + 1] === value) return false;
        if (r + 1 < GRID_SIZE && grid[r + 1][c] === value) return false;
      }
    }
    isGameOver = true;
    showOverlay("Game Over", false);
    return true;
  }

  function updateBestScore() {
    if (score > best) {
      best = score;
      localStorage.setItem(BEST_SCORE_KEY, String(best));
    }
  }

  function showOverlay(message, isWin) {
    overlayMessageEl.textContent = message;
    if (isWin) {
      overlayKeepPlayingBtn.removeAttribute("hidden");
    } else {
      overlayKeepPlayingBtn.setAttribute("hidden", "");
    }
    overlayEl.removeAttribute("hidden");
  }

  function hideOverlay() {
    overlayEl.setAttribute("hidden", "");
  }

  function render() {
    const existingTiles = boardEl.querySelectorAll(".tile");
    existingTiles.forEach(function (tile) {
      tile.remove();
    });

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const value = grid[r][c];
        if (value === 0) continue;
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.dataset.value = String(value);
        tile.textContent = String(value);
        tile.style.gridColumnStart = String(c + 1);
        tile.style.gridRowStart = String(r + 1);
        boardEl.appendChild(tile);
      }
    }

    scoreValueEl.textContent = String(score);
    bestValueEl.textContent = String(best);
  }

  function initGame() {
    grid = createEmptyGrid();
    score = 0;
    isGameOver = false;
    hasWon = false;
    keepPlayingAfterWin = false;
    hideOverlay();
    spawnTile();
    spawnTile();
    render();
  }

  document.addEventListener("keydown", function (e) {
    const keyMap = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };
    const direction = keyMap[e.key];
    if (!direction) return;
    e.preventDefault();
    if (isGameOver) return;
    move(direction);
  });

  newGameBtn.addEventListener("click", function () {
    initGame();
  });

  overlayRestartBtn.addEventListener("click", function () {
    hideOverlay();
    initGame();
  });

  overlayKeepPlayingBtn.addEventListener("click", function () {
    keepPlayingAfterWin = true;
    hideOverlay();
  });

  document.addEventListener("DOMContentLoaded", function () {
    const storedBest = localStorage.getItem(BEST_SCORE_KEY);
    best = storedBest ? parseInt(storedBest, 10) || 0 : 0;
    initGame();
  });
})();
