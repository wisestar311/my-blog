// js/pixel-art.js — Pixel Art editor: grid state, canvas rendering, pointer painting,
// palette selection, clear, PNG export.
// DOM contract (defined by pixel-art.html / css/pixel-art.css, do not change here):
//   #pixel-canvas[width=512 height=512]   drawing surface
//   #palette (empty container)            filled with .palette-swatch buttons by this script
//   #custom-color-picker (input[type=color])
//   #clear-btn / #save-btn (.new-game-btn)
(function () {
  "use strict";

  const GRID_SIZE = 16; // 16 x 16
  const CELL_PX = 32; // canvas cell = 32 physical px (512 x 512 total)
  const EXPORT_CELL_PX = 32; // export cell size -> final PNG = 16 * 32 = 512 x 512

  const PALETTE_COLORS = [
    "#00f0ff", // accent (site neon cyan)
    "#ffffff", "#c8c8c8", "#7f7f7f", "#1a1a1a", "#000000", // grayscale
    "#ff3b30", "#ff9500", "#ffcc00", // red/orange/yellow
    "#34c759", "#0a7a3d", // green/dark green
    "#0aa3a3", "#0057ff", "#5b2bff", // teal/blue/purple
    "#ff2d95", "#ff6fb0", // magenta/pink
    "#8b5a2b", "#c68642", "#ffd8b1", // brown/tan/light tan
    "#00ffa2", // neon green accent
  ];

  const PALETTE_NAMES = [
    "시안(강조색)",
    "흰색", "밝은 회색", "회색", "어두운 회색", "검정",
    "빨강", "주황", "노랑",
    "초록", "짙은 초록",
    "청록", "파랑", "보라",
    "마젠타", "분홍",
    "갈색", "황토색", "연한 살구색",
    "네온 초록",
  ];

  let grid = []; // 16x16 2D array. Each cell is a hex color string or null (empty/transparent)
  let selectedColor = PALETTE_COLORS[0]; // currently selected color

  let isPointerDown = false;
  let lastPaintedCell = null; // { row, col } | null — used to bridge fast drags

  const canvasEl = document.getElementById("pixel-canvas");
  const ctx = canvasEl.getContext("2d");
  const paletteEl = document.getElementById("palette");
  const customColorPickerEl = document.getElementById("custom-color-picker");
  const clearBtn = document.getElementById("clear-btn");
  const saveBtn = document.getElementById("save-btn");

  function createEmptyGrid() {
    const g = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      g.push(new Array(GRID_SIZE).fill(null));
    }
    return g;
  }

  function getEmptyCellColor() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue("--color-bg-elevated")
      .trim();
  }

  function getGridLineColor() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue("--color-border")
      .trim();
  }

  function drawCell(row, col) {
    const color = grid[row][col];
    const x = col * CELL_PX;
    const y = row * CELL_PX;
    ctx.fillStyle = color === null ? getEmptyCellColor() : color;
    ctx.fillRect(x, y, CELL_PX, CELL_PX);
    ctx.strokeStyle = getGridLineColor();
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, CELL_PX - 1, CELL_PX - 1);
  }

  function renderAll() {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        drawCell(row, col);
      }
    }
  }

  function paintCell(row, col) {
    if (grid[row][col] === selectedColor) return; // already this color, skip redraw
    grid[row][col] = selectedColor;
    drawCell(row, col);
  }

  // Bresenham's line algorithm — paints every cell between two grid
  // coordinates so a fast drag (pointermove events arriving more than one
  // cell apart) doesn't leave gaps.
  function paintLine(fromRow, fromCol, toRow, toCol) {
    let x0 = fromCol;
    let y0 = fromRow;
    const x1 = toCol;
    const y1 = toRow;
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    while (true) {
      paintCell(y0, x0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  function paintAtEvent(e) {
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = canvasEl.width / rect.width; // correct for CSS-scaled display size
    const scaleY = canvasEl.height / rect.height;
    const col = Math.floor(((e.clientX - rect.left) * scaleX) / CELL_PX);
    const row = Math.floor(((e.clientY - rect.top) * scaleY) / CELL_PX);
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
      lastPaintedCell = null; // dragged outside — don't bridge across the gap on re-entry
      return;
    }
    if (lastPaintedCell) {
      paintLine(lastPaintedCell.row, lastPaintedCell.col, row, col);
    } else {
      paintCell(row, col);
    }
    lastPaintedCell = { row: row, col: col };
  }

  canvasEl.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return; // primary button only
    isPointerDown = true;
    canvasEl.setPointerCapture(e.pointerId); // keep receiving move/up outside canvas bounds
    lastPaintedCell = null;
    paintAtEvent(e);
  });

  canvasEl.addEventListener("pointermove", function (e) {
    if (!isPointerDown) return;
    if ((e.buttons & 1) === 0) {
      // safety net: button no longer pressed (e.g. missed a mouseup outside the canvas)
      isPointerDown = false;
      lastPaintedCell = null;
      return;
    }
    paintAtEvent(e);
  });

  canvasEl.addEventListener("pointerup", function () {
    isPointerDown = false;
    lastPaintedCell = null;
  });
  canvasEl.addEventListener("pointercancel", function () {
    isPointerDown = false;
    lastPaintedCell = null;
  });

  function clearPaletteSelection() {
    const swatches = paletteEl.querySelectorAll(".palette-swatch");
    swatches.forEach(function (swatch) {
      swatch.classList.remove("selected");
      swatch.setAttribute("aria-pressed", "false");
    });
  }

  function renderPalette() {
    PALETTE_COLORS.forEach(function (color, index) {
      const btn = document.createElement("button");
      btn.className = "palette-swatch";
      btn.dataset.color = color;
      btn.style.background = color;
      btn.setAttribute("aria-label", PALETTE_NAMES[index] || "색상 선택");
      btn.setAttribute("aria-pressed", index === 0 ? "true" : "false");
      if (index === 0) {
        btn.classList.add("selected");
      }
      btn.addEventListener("click", function () {
        selectedColor = color;
        clearPaletteSelection();
        btn.classList.add("selected");
        btn.setAttribute("aria-pressed", "true");
      });
      paletteEl.appendChild(btn);
    });

    const eraserBtn = document.createElement("button");
    eraserBtn.className = "palette-swatch palette-swatch-eraser";
    eraserBtn.dataset.color = "";
    eraserBtn.setAttribute("aria-label", "지우개");
    eraserBtn.setAttribute("aria-pressed", "false");
    eraserBtn.addEventListener("click", function () {
      selectedColor = null;
      clearPaletteSelection();
      eraserBtn.classList.add("selected");
      eraserBtn.setAttribute("aria-pressed", "true");
    });
    paletteEl.appendChild(eraserBtn);
  }

  customColorPickerEl.addEventListener("input", function (e) {
    selectedColor = e.target.value;
    clearPaletteSelection();
  });

  clearBtn.addEventListener("click", function () {
    grid = createEmptyGrid();
    renderAll();
  });

  function exportPNG() {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = GRID_SIZE * EXPORT_CELL_PX;
    exportCanvas.height = GRID_SIZE * EXPORT_CELL_PX;
    const exportCtx = exportCanvas.getContext("2d");
    exportCtx.imageSmoothingEnabled = false;

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const color = grid[row][col];
        if (color === null) continue; // leave transparent (skip fillRect)
        exportCtx.fillStyle = color;
        exportCtx.fillRect(
          col * EXPORT_CELL_PX,
          row * EXPORT_CELL_PX,
          EXPORT_CELL_PX,
          EXPORT_CELL_PX
        );
      }
    }

    exportCanvas.toBlob(function (blob) {
      if (!blob) {
        window.alert("PNG로 저장하지 못했습니다. 다시 시도해 주세요.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "pixel-art.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  saveBtn.addEventListener("click", exportPNG);

  function init() {
    grid = createEmptyGrid();
    renderPalette();
    renderAll();

    // Re-paint empty cells / grid lines with the new theme's colors whenever
    // the effective theme changes — an explicit toggle click, or (since this
    // page may never set data-theme at all) the OS-level scheme changing
    // while no explicit preference is stored. js/theme.js dispatches this on
    // both cases.
    document.addEventListener("blogthemechange", renderAll);
  }

  init();
})();
