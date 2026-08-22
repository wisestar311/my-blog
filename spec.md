# 픽셀 아트 에디터 기능 spec

> 이 문서는 이전 2048 게임 기능의 spec.md를 대체한다. 2048 스펙 내용은 히스토리(git log)로만
> 남기고, 이 문서는 신규 기능인 "픽셀 아트 에디터"만 다룬다.

## 1. 개요

기존 마크다운 블로그(프레임워크 없는 순수 HTML/CSS/JS)에 16x16 픽셀 아트 에디터 페이지를
추가한다. `pixel-art.html`이라는 신규 페이지에서 사용자는 16x16 격자의 각 칸("도트")을
클릭하거나 드래그해서 원하는 색으로 칠할 수 있고, 프리셋 색상 팔레트(+커스텀 색상 선택기)로
색을 고르며, 완성한 그림을 PNG 파일로 저장할 수 있다. 시각적으로는 기존 네온 사이버펑크
테마(`--color-bg`/`--color-bg-elevated`/`--accent`/`--glow-sm`/`--glow-lg`/`--font-mono` 등
`css/style.css`의 커스텀 프로퍼티)를 그대로 재사용해 `game.html`과 동일한 톤을 유지한다.

핵심 설계 결정(상세 근거는 4장):
- 그리기 표면은 **256개의 개별 DOM 셀이 아니라 단일 `<canvas>` 엘리먼트**로 구현한다.
  PNG 내보내기 요구사항과 직접 맞아떨어지고(캔버스는 `toBlob`/`toDataURL`로 즉시 PNG를
  뽑아낼 수 있음), 2048 리뷰(review.md)에서 발견된 "CSS Grid 자식에 `position: absolute`를
  주면 grid의 기본 stretch 정렬이 깨져 타일이 셀을 채우지 못하는" 버그 클래스를 애초에
  구조적으로 겪을 수 없는 방식이기도 하다.
- 캔버스 내부 해상도를 처음부터 "칸당 32px"로 두어(16 × 32 = 512px 정사각형), 화면에 보이는
  캔버스 자체가 이미 내보내기에 쓸 수 있는 해상도를 가진다. 다만 실제 export는 보이는 캔버스를
  그대로 찍지 않고, 투명 배경을 살리기 위해 별도의 오프스크린 캔버스에 다시 그려서 만든다(6장).

## 2. 생성/수정 파일

| 경로 | 종류 | 내용 |
|---|---|---|
| `pixel-art.html` | 신규 | 에디터 페이지 마크업. `index.html`/`game.html`과 동일한 `<head>` 구조(`css/style.css`, `js/theme.js`), 공용 헤더, 캔버스/팔레트/툴바 마크업, footer, 스크립트 태그 |
| `css/pixel-art.css` | 신규 | 에디터 전용 스타일(캔버스 래퍼, 팔레트 스와치, 툴바 버튼). `css/game.css`와 같은 분리 패턴 — `style.css`의 커스텀 프로퍼티만 참조하고 새 색상 토큰은 만들지 않는다 |
| `js/pixel-art.js` | 신규 | 그리드 상태, 캔버스 렌더링, 클릭/드래그 페인팅, 팔레트 선택, Clear, PNG 내보내기 로직 |
| `index.html` | 수정 | `.site-header-inner` 안 `.site-nav`에 `pixel-art.html`로 가는 링크 추가 (기존 "2048" 링크 뒤) |
| `post.html` | 수정 | 동일하게 헤더 nav에 링크 추가 |
| `game.html` | 수정 | 동일하게 헤더 nav에 링크 추가 (2048 페이지 헤더에도 사이트 전역 일관성을 위해 반영) |
| `pixel-art.html` (자기 자신) | — | 자기 헤더에도 동일한 nav(2048 + Pixel Art 둘 다) 포함 — 2048 페이지가 자기 자신의 nav에도 "2048" 링크를 그대로 두는 기존 관례(review.md 기준 정상 동작 확인됨)를 그대로 따른다 |
| `css/style.css` | 수정 없음(예상) | `.site-nav`/`.site-nav-link`는 이미 존재하는 공용 클래스이므로 링크 `<a>` 태그만 늘어난다. 3개 이상 링크가 되어도 `.site-nav`가 이미 `display: flex; gap: 0.6rem`이므로 자동으로 가로 나열됨 — 별도 수정 불필요. (구현 중 실제로 줄바꿈/좁은 화면에서 깨지면 `css/style.css`의 `.site-nav`/`@media (max-width: 768px)` 블록에 최소 수정 허용) |

`pixel-art.html`은 `<head>`에서 `css/style.css` 다음에 `css/pixel-art.css`를 추가로 로드한다
(`game.html`이 `css/game.css`를 로드하는 것과 동일한 패턴).

## 3. 데이터 모델 / 상태 설계

```js
// js/pixel-art.js 내부 상태 (IIFE 클로저, game.js와 동일한 패턴)
const GRID_SIZE = 16;      // 16 x 16
const CELL_PX = 32;        // 캔버스 1칸 = 32 물리 픽셀 (캔버스 전체 512 x 512)

let grid = [];              // 16x16 2차원 배열. 각 셀은 색상 문자열("#rrggbb") 또는 null(빈 칸/투명)
let selectedColor = PALETTE_COLORS[0]; // 현재 선택된 색상 (7장 참조)
let isErasing = false;      // 지우개(= null 칠하기) 모드 여부
let isPointerDown = false;  // 드래그 페인팅 중인지
```

- `grid[row][col]`: 2048의 `grid[row][col]` 패턴을 그대로 따른다. 값은 hex 색상 문자열이거나,
  칠해지지 않은 칸을 뜻하는 `null`.
- 기본/빈 색상: `null` — 화면 캔버스에는 시각적 구분을 위해 옅은 격자색(`--color-bg-elevated`를
  `getComputedStyle`로 읽은 값)으로 채워 그리지만, 이 값은 상태에는 저장되지 않는다(순수 렌더링용).
  PNG로 내보낼 때 `null` 칸은 **투명**으로 남긴다(6장).
- `selectedColor`: 사용자가 팔레트 스와치 또는 커스텀 색상 피커에서 고른 마지막 색. 페이지 로드
  시 기본값은 팔레트의 첫 번째 색(7장에서 정의하는 `PALETTE_COLORS[0]`, 사이트 accent 색과
  맞춘 네온 시안 계열 권장).
- 지우개는 별도 boolean이 아니라 "팔레트의 특수 스와치 하나가 `selectedColor = null`을 설정하는
  것"으로 통일한다(8장 UI에서 "Eraser" 스와치로 노출). 이러면 페인팅 함수가 지우개 여부를 따로
  분기하지 않고 `grid[row][col] = selectedColor` 한 줄로 칠하기/지우기를 동시에 처리한다.
- 로컬스토리지 영속은 이번 스펙 범위 밖(요구사항에 없음) — 새로고침 시 빈 캔버스로 시작한다.

## 4. UI / 레이아웃 계획

### 4.1 그리기 표면: `<canvas>` vs 256개 DOM 셀 — `<canvas>` 채택

**결론: `<canvas id="pixel-canvas">` 단일 엘리먼트로 그린다.** 이유:

1. **PNG 내보내기와 직결.** 캔버스는 `canvas.toBlob(cb, "image/png")` / `toDataURL("image/png")`로
   즉시 PNG를 얻을 수 있다. DOM 셀 256개 방식이면 각 셀의 배경색을 읽어 별도로 `<canvas>`에
   다시 그려 넣는 변환 단계가 어차피 필요하므로, 처음부터 캔버스로 그리는 편이 코드가 하나 줄고
   "그리기 상태"와 "내보내기 상태"가 항상 동기화되어 있음을 보장하기 쉽다.
2. **2048 리뷰에서 나온 버그 클래스를 구조적으로 회피.** `review.md`에 기록된 실제 프로덕션
   버그: `css/game.css`의 `.tile { position: absolute; }`가 `display: grid` 부모 안에서 grid
   아이템의 기본 `stretch` 정렬을 깨서 타일이 셀을 채우지 못하고 좌상단에 작게 렌더링되는
   문제가 배포 후에야 발견되었다. 16x16 = 256개의 DOM 셀 + 절대 위치 오버레이 방식을 쓰면
   구조적으로 동일한 함정(그리드 아이템에 `position: absolute`를 걸거나, 셀 크기를 % 기반으로
   맞추다 서브픽셀 오차가 생기는 등)에 다시 빠질 위험이 있다. `<canvas>` 방식은 애초에 CSS
   Grid나 각 셀의 DOM 박스 모델에 의존하지 않고 좌표 계산(픽셀 단위 `fillRect`)만으로 렌더링하므로
   이 문제 자체가 발생할 수 없다 — 이번 설계에서 캔버스를 고른 것은 성능뿐 아니라 **이 버그
   클래스를 원천적으로 피하기 위한 의도적 선택**이다.
3. **성능/단순성.** 256개의 DOM 엘리먼트에 각각 리스너나 스타일을 관리하는 것보다 캔버스 픽셀
   좌표 계산 한 곳에서 처리하는 것이 코드량이 적다.

(만약 이후 다른 사유로 DOM 셀 방식으로 바뀐다면, 셀은 `display: grid`의 자식으로 두되
`position: absolute`/`fixed`를 걸지 않고 `grid-column`/`grid-row`만으로 배치해야 하며, 절대
위치가 꼭 필요하면 grid 부모가 아니라 별도 `position: relative` 래퍼 위에 얹는 방식으로 stretch
정렬 이슈를 피해야 한다 — 10장 참조.)

### 4.2 페이지 구조

```
<header class="site-header">           (공용 헤더, nav에 2048 + Pixel Art 링크)
<main class="pixel-art-page">
  <a class="back-link" href="index.html">&larr; 목록으로</a>

  <div class="pixel-art-container">
    <h1 class="pixel-art-title">Pixel Art</h1>   <!-- font-mono, glow, hero-title/game-title과 톤 일치 -->

    <div class="pixel-art-workspace">
      <div class="canvas-wrap">
        <canvas id="pixel-canvas" width="512" height="512"></canvas>
      </div>

      <aside class="pixel-art-sidebar">
        <div class="palette" id="palette">
          <!-- PALETTE_COLORS 개수만큼 button.palette-swatch 반복 생성 (JS) -->
          <button class="palette-swatch" data-color="#00f0ff" style="background:#00f0ff" aria-label="색상 선택"></button>
          ...
          <button class="palette-swatch palette-swatch-eraser" data-color="" aria-label="지우개"></button>
        </div>

        <label class="custom-color-row">
          <span>Custom</span>
          <input type="color" id="custom-color-picker" value="#00f0ff">
        </label>

        <div class="pixel-art-toolbar">
          <button id="clear-btn" class="new-game-btn">Clear</button>
          <button id="save-btn" class="new-game-btn">Save PNG</button>
        </div>
      </aside>
    </div>
  </div>
</main>
<footer class="site-footer">...</footer>   (기존 footer 재사용)
```

- `.pixel-art-title`, `#clear-btn`/`#save-btn`(`.new-game-btn` 클래스 재사용)은 `game.html`의
  `.game-title`/`.new-game-btn`과 동일한 시각 언어(폰트, glow, pill 버튼)를 그대로 물려받는다.
- `.canvas-wrap`: `.game-board-wrap`처럼 `background: var(--color-bg-elevated)`,
  `border: 1px solid var(--accent)`, `border-radius: 8px`,
  `box-shadow: 0 0 32px -4px var(--glow-lg)`로 카드 톤을 맞춘다. 캔버스 자체(`#pixel-canvas`)는
  내부 해상도 512x512를 유지하되 CSS로 `width: 100%; max-width: 480px; height: auto;
  image-rendering: pixelated;`를 줘서 반응형으로 축소되어도 픽셀 경계가 흐려지지 않게 한다.
- `.palette`: `display: flex; flex-wrap: wrap; gap: 0.5rem;` (기존 `.tag-list`와 유사한 레이아웃).
  스와치는 `width/height: 1.75rem`, `border-radius: 4px`, `border: 1px solid var(--color-border)`,
  선택된 스와치는 `border-color: var(--accent); box-shadow: 0 0 10px -2px var(--glow-lg)`로 표시
  (JS가 `.palette-swatch.selected` 클래스를 토글).
- 좁은 화면(`@media (max-width: 768px)`)에서는 `.pixel-art-workspace`를 `flex-direction: column`으로
  바꿔 캔버스 아래에 사이드바(팔레트+툴바)가 오도록 한다 — `css/game.css`의 기존 반응형 패턴과
  동일한 접근.

## 5. 그리기 인터랙션 (클릭 · 드래그 페인팅)

Pointer Events API(`pointerdown`/`pointermove`/`pointerup`)를 사용한다. 마우스/펜/터치를
동일 코드로 처리할 수 있어 마우스 요구사항을 만족시키면서 터치도 사실상 공짜로 따라오지만,
**터치 전용 UX 튜닝(핀치 줌 방지, 스크롤과의 제스처 충돌 처리 등)은 이번 스펙 범위 밖**이며
동작이 자연스럽지 않아도 별도 수정하지 않는다.

```js
canvasEl.addEventListener("pointerdown", function (e) {
  if (e.button !== 0) return;              // 주 버튼(좌클릭)만 처리
  isPointerDown = true;
  canvasEl.setPointerCapture(e.pointerId);  // 캔버스 밖으로 나가도 move/up 이벤트를 계속 받기 위함
  paintAtEvent(e);
});

canvasEl.addEventListener("pointermove", function (e) {
  if (!isPointerDown) return;
  if ((e.buttons & 1) === 0) {              // 안전망: 버튼이 눌려있지 않으면(예: 캔버스 밖에서 mouseup 놓침) 중단
    isPointerDown = false;
    return;
  }
  paintAtEvent(e);
});

canvasEl.addEventListener("pointerup", function () {
  isPointerDown = false;
});
canvasEl.addEventListener("pointercancel", function () {
  isPointerDown = false;
});
```

- `setPointerCapture`를 pointerdown 시점에 걸어두면, 드래그 도중 커서가 캔버스 경계를 벗어나도
  같은 캔버스가 계속 `pointermove`/`pointerup` 이벤트를 받는다 — "여러 셀에 걸친 드래그"와
  "주 버튼이 눌린 채인지"를 창(window) 레벨 리스너 없이 캔버스 하나로 안정적으로 처리하는 핵심
  장치. 추가로 `e.buttons & 1` 체크를 pointermove에서 한 번 더 해서, 브라우저 포커스 전환 등으로
  pointerup을 놓친 극단적 케이스에서도 계속 칠해지는 버그를 막는다.
- `paintAtEvent(e)`:
  ```js
  function paintAtEvent(e) {
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = canvasEl.width / rect.width;   // CSS로 축소 표시되는 경우 보정
    const scaleY = canvasEl.height / rect.height;
    const col = Math.floor((e.clientX - rect.left) * scaleX / CELL_PX);
    const row = Math.floor((e.clientY - rect.top) * scaleY / CELL_PX);
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return; // 캔버스 밖으로 드래그된 경우 무시
    paintCell(row, col);
  }

  function paintCell(row, col) {
    if (grid[row][col] === selectedColor) return; // 이미 같은 색이면 재렌더 스킵
    grid[row][col] = selectedColor;
    drawCell(row, col); // 캔버스 전체가 아니라 해당 1칸만 다시 그림(성능)
  }
  ```
- `getBoundingClientRect()` 기반 스케일 보정을 반드시 넣는다 — 캔버스 내부 해상도(512x512)와
  CSS 표시 크기(`max-width: 480px` 등 반응형으로 달라짐)가 다르기 때문에, 좌표를 그대로 쓰면
  좁은 화면에서 클릭 위치와 칠해지는 칸이 어긋난다.
- 클릭(드래그 없이 1회) 페인팅은 pointerdown 한 번만으로 이미 `paintAtEvent`가 호출되므로 별도
  처리가 필요 없다 — click-to-paint와 drag-to-paint가 동일한 코드 경로를 공유한다.

## 6. PNG 내보내기 방식

화면에 보이는 `#pixel-canvas`를 그대로 캡처하지 않는다(빈 칸이 `--color-bg-elevated`로 채워져
있어서 그대로 내보내면 투명 배경이 아니라 회색/검은 배경이 찍힘). 대신 저장 버튼 클릭 시
**오프스크린 캔버스를 새로 만들어 그 위에 그린 뒤** 그것을 내보낸다:

```js
const EXPORT_CELL_PX = 32; // 칸당 내보내기 픽셀 크기 → 최종 PNG = 16 * 32 = 512 x 512

function exportPNG() {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = GRID_SIZE * EXPORT_CELL_PX;
  exportCanvas.height = GRID_SIZE * EXPORT_CELL_PX;
  const ctx = exportCanvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const color = grid[row][col];
      if (color === null) continue; // 투명으로 남김 (fillRect 생략)
      ctx.fillStyle = color;
      ctx.fillRect(col * EXPORT_CELL_PX, row * EXPORT_CELL_PX, EXPORT_CELL_PX, EXPORT_CELL_PX);
    }
  }

  exportCanvas.toBlob(function (blob) {
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

document.getElementById("save-btn").addEventListener("click", exportPNG);
```

- **스케일 팩터 결정: 칸당 32x32 물리 픽셀, 최종 PNG 512x512.** 16x16 그대로 내보내면 파일이
  실질적으로 너무 작아 확인/공유가 불편하므로, 화면 편집용 캔버스와 동일한 `CELL_PX`(4장) 값을
  그대로 내보내기에도 재사용해 일관성을 유지한다(값이 달라야 할 이유가 없으면 상수 하나
  `CELL_PX = EXPORT_CELL_PX = 32`로 통일해도 무방 — 편집 캔버스 해상도와 내보내기 해상도를
  같은 상수로 두면 두 곳의 그리기 함수(`drawCell`/`exportPNG`의 루프)가 로직을 그대로 공유할 수
  있다는 장점도 있다).
- `toBlob` + `URL.createObjectURL` + 임시 `<a download>` 클릭 패턴을 쓴다(`toDataURL`도 동작은
  하지만 큰 이미지에서 base64 문자열 생성 비용이 더 크므로 `toBlob`을 기본으로 채택. 512x512
  정도 크기에서는 사실 어느 쪽이든 체감 차이는 거의 없다).
- 빈 칸(`null`)은 `fillRect`를 아예 호출하지 않아 캔버스 기본값인 투명(alpha 0)으로 남는다 —
  PNG는 알파 채널을 지원하므로 자연스럽게 투명 배경 PNG가 만들어진다.

## 7. 색상 팔레트 설계

`js/pixel-art.js` 최상단에 상수 배열로 정의한다. 총 20색(프리셋) + 지우개 1개 + 커스텀 피커.

```js
const PALETTE_COLORS = [
  "#00f0ff", // accent (사이트 네온 시안)
  "#ffffff", "#c8c8c8", "#7f7f7f", "#1a1a1a", "#000000", // 그레이스케일
  "#ff3b30", "#ff9500", "#ffcc00",                        // 빨강/주황/노랑
  "#34c759", "#0a7a3d",                                    // 초록/진초록
  "#0aa3a3", "#0057ff", "#5b2bff",                         // 청록/파랑/보라
  "#ff2d95", "#ff6fb0",                                    // 마젠타/핑크
  "#8b5a2b", "#c68642", "#ffd8b1",                         // 갈색/살구/살구밝은톤
  "#00ffa2",                                                // 네온 그린 포인트
];
```

- 20개 프리셋은 무채색(흰/회/검) + 기본 색상환 + 사이트 accent 톤(`#00f0ff`, `#0aa3a3`)을
  섞어, 사이트 테마와 어울리면서도 일반적인 픽셀 아트(캐릭터, 아이콘)에 필요한 피부톤/갈색 계열도
  포함하도록 구성했다.
- **지우개 스와치**: 팔레트 마지막에 `data-color=""`인 특수 버튼을 하나 추가(`.palette-swatch-eraser`
  클래스로 체커보드 패턴 배경을 CSS `background-image`로 표현). 클릭 시 `selectedColor = null`.
- **커스텀 색상 피커: 포함한다.** `<input type="color" id="custom-color-picker">`는 네이티브
  UI라 구현 비용이 사실상 0에 가깝고(브라우저 기본 색상 선택 다이얼로그를 그대로 사용), 20색
  프리셋으로 커버 안 되는 색을 사용자가 직접 고를 수 있게 해준다.
  ```js
  customColorPickerEl.addEventListener("input", function (e) {
    selectedColor = e.target.value;
    clearPaletteSelection(); // 프리셋 스와치의 .selected 표시를 모두 해제
  });
  ```
- 팔레트 렌더링: 페이지 로드 시 `PALETTE_COLORS.forEach`로 `#palette`에 버튼을 동적 생성하고,
  각 버튼에 `pointerdown`(또는 `click`) 리스너로 `selectedColor = e.target.dataset.color`,
  `.selected` 클래스 갱신.

## 8. 사이트 통합 지점 (헤더 nav)

`site-nav`에 "2048" 링크 뒤로 "Pixel Art" 링크를 추가한다. 순서는 기능이 추가된 시간 순(2048이
먼저 만들어졌으므로 먼저 배치)을 그대로 따른다:

```html
<nav class="site-nav">
  <a class="site-nav-link" href="game.html">2048</a>
  <a class="site-nav-link" href="pixel-art.html">Pixel Art</a>
</nav>
```

**네 개 헤더 파일 모두** 동일하게 반영해야 한다 (2048 리뷰에서 href 오타 여부까지 확인했던 것과
같은 기준으로, 이번에도 4개 파일의 nav가 문자 그대로 동일한지 Review 단계에서 대조 확인):

- `index.html`
- `post.html`
- `game.html`
- `pixel-art.html` (자기 자신의 헤더에도 "2048"과 "Pixel Art" 링크를 그대로 둔다 — game.html이
  자기 자신 헤더에 "2048" 링크를 그대로 두는 기존 관례와 동일)

라벨은 "Pixel Art"(영문, "2048"과 마찬가지로 짧고 대문자/고유명사 톤)로 결정한다 — 기존 "2048"
링크가 숫자 그대로 라벨링된 것처럼, 기능명을 그대로 쓰는 편이 사이트의 미니멀한 nav 톤과
맞는다. 한글 라벨("픽셀 아트")은 다른 nav 항목과 톤이 어긋나므로 채택하지 않는다.

## 9. Work 단계 서브에이전트 분배 권장

이 기능도 2048과 동일하게 CLAUDE.md 기준 "화면 3개 이상"에 해당하지 않는다 — 신규 화면은
`pixel-art.html` 1개뿐이고, `index.html`/`post.html`/`game.html` 수정은 각각 nav 링크 한 줄
추가에 불과하다. 2048 spec과 동일한 근거로 **2개 서브에이전트로 분리**할 것을 권장한다(마크업/
스타일 vs. 로직으로 파일 경계가 자연스럽게 갈리기 때문):

1. **서브에이전트 A — 마크업/스타일/헤더 통합**
   - 범위: `pixel-art.html` 생성, `css/pixel-art.css` 생성, `index.html`/`post.html`/`game.html`/
     `pixel-art.html` 4개 파일의 헤더 nav에 "Pixel Art" 링크 추가
   - 산출물: 정적 마크업 + 스타일만 완성된 상태(빈 캔버스, 팔레트 스와치 정적 표시, 버튼까지
     보이되 아직 아무 동작도 하지 않는 상태로 확인 가능해야 함)
   - `js/pixel-art.js`는 만들지 않되, `pixel-art.html`에 `<script src="js/pixel-art.js"></script>`
     태그는 미리 추가해 둔다 (파일이 아직 없어도 404는 개발 중에만 발생, B가 채움)
   - DOM 계약을 정확히 지켜야 함: `#pixel-canvas`(width/height=512 속성 포함), `#palette`,
     `#custom-color-picker`, `#clear-btn`, `#save-btn` (5, 6, 7, 8장에 명시된 id 그대로)

2. **서브에이전트 B — 캔버스 로직 (그리기 상태 · 페인팅 · 팔레트 · 내보내기)**
   - 범위: `js/pixel-art.js` 전체 (3, 5, 6, 7장의 상태/인터랙션/내보내기 로직)
   - 전제: 서브에이전트 A가 만든 `pixel-art.html`의 DOM id(`#pixel-canvas`, `#palette`,
     `#custom-color-picker`, `#clear-btn`, `#save-btn`)를 그대로 셀렉터로 사용
   - A를 먼저 실행해 완료시킨 뒤 B를 순차 진행 — 2048 때와 같은 이유(DOM 계약이 먼저 확정돼야
     B가 정확히 바인딩 가능)로 완전 병렬화하지 않는다.

두 서브에이전트 모두 지침 파일(`.md`)에 이 spec.md의 해당 섹션(A는 2, 4, 7, 8 / B는 2, 3, 5, 6, 7)을
그대로 포함해 전달한다. Review 단계에서는 클릭/드래그 페인팅, 팔레트 색상 전환, 지우개, 커스텀
색상 피커, Clear 버튼, Save PNG로 받은 파일이 실제로 16x16 도트가 투명 배경 위에 정확히 찍힌
512x512 PNG인지, 헤더 nav 4파일 일관성, 다크/라이트 테마, 반응형을 함께 점검한다. **2048 리뷰에서
정적 코드 리뷰만으로는 실제 렌더링 버그(그리드 stretch 깨짐)를 못 잡아냈던 전례가 있으므로, 이번
Review도 반드시 실제 브라우저(가능하면 claude-in-chrome)로 캔버스 렌더링과 PNG 다운로드 결과물을
직접 확인해야 한다** — 코드가 spec과 일치해 보인다는 것만으로 Pass 처리하지 않는다.

## 10. 다음에 열 때 참고

- **2048 리뷰에서 얻은 핵심 교훈**: `display: grid` 컨테이너의 자식 엘리먼트에 `position: absolute`
  (또는 `fixed`)를 걸면 grid 아이템에 기본 적용되는 `align-self`/`justify-self: stretch`가
  무효화되어, 셀을 꽉 채우는 대신 콘텐츠 크기만큼만(예: 텍스트 크기만큼 작게) 렌더링된다. 이
  버그는 정적 코드 리뷰로는 잡히지 않고 실제 브라우저 렌더링에서만 드러났다(review.md 참고).
- **이번 스펙에는 이 위험이 구조적으로 없다.** 4.1절에서 이미 명시했듯, 픽셀 아트 그리기 표면을
  256개 DOM 셀(및 CSS Grid) 대신 단일 `<canvas>`로 설계한 것 자체가 이 버그 클래스를 원천
  차단하기 위한 선택이다 — 캔버스는 `position`이나 grid 정렬에 의존하지 않고 `fillRect` 좌표
  계산만으로 그려지기 때문에 "그리드 아이템이 stretch되지 않는" 상황 자체가 존재하지 않는다.
- 다만 이 스펙에서 CSS Grid를 쓰는 곳이 아예 없는 것은 아니다 — `.pixel-art-workspace`(캔버스 +
  사이드바 2단 레이아웃, 4.2절)에 Grid/Flexbox를 쓸 경우, 그 자식들(`.canvas-wrap`,
  `.pixel-art-sidebar`)에는 `position: absolute`를 걸 이유가 없으므로 동일한 위험은 없다. 만약
  구현 중 오버레이(로딩 표시, 저장 완료 토스트 등)를 추가하게 된다면, `game.html`의
  `.game-overlay`처럼 `position: absolute`를 쓰는 대상이 **grid의 직접 자식이 아니라
  `position: relative`가 걸린 별도 래퍼(`.canvas-wrap`) 안**이어야 한다는 점을 다시 한번 확인할 것
  (`.game-overlay`도 실제로는 `.game-board-wrap`이라는 `position: relative` 래퍼 안에 있어서 이
  문제를 겪지 않았다 — grid 컨테이너 자체의 직접 자식이었던 `.tile`만 문제였다).
- Review 단계에서 claude-in-chrome이 연결되지 않을 경우를 대비해, 정적 코드 리뷰로 대체하더라도
  "실제 브라우저 확인을 못 했다"는 한계를 review.md에 명시하고, 가능해지는 즉시(또는 배포 후)
  반드시 실제 렌더링과 PNG 다운로드 결과물을 열어서 확인하는 절차를 spec 승인 시점부터 미리
  못박아 둔다 — 2048 때도 이 단계를 건너뛰지 않아서 치명적 버그를 잡을 수 있었다.
