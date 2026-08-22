# 2048 게임 기능 spec

## 1. 개요

기존 마크다운 블로그(프레임워크 없는 순수 HTML/CSS/JS)에 2048 퍼즐 게임 페이지를 추가한다.
`game.html`이라는 신규 페이지에서 방향키로 타일을 밀고 합치는 4x4 2048 게임을 플레이할 수 있으며,
현재 점수와 최고 점수(로컬스토리지에 영구 저장)를 보여주는 스코어보드, 새 게임 버튼, 블로그로
돌아가는 링크를 포함한다. 시각적으로는 기존 네온 사이버펑크 테마(단일 accent 컬러, 글로우 효과,
카드형 레이아웃, `--color-bg`/`--accent`/`--glow-sm`/`--glow-lg` 등 기존 CSS 커스텀 프로퍼티)를
그대로 재사용해 사이트와 이질감 없이 어울리도록 만든다.

사이트 진입점은 헤더의 `site-title` 옆에 새 네비게이션 링크("2048" 또는 게임 패드 아이콘)를 추가하는
방식으로 결정한다 (섹션 7 참조).

## 2. 생성/수정 파일

| 경로 | 종류 | 내용 |
|---|---|---|
| `game.html` | 신규 | 게임 페이지 마크업. `index.html`/`post.html`과 동일한 `<head>` 구조(`css/style.css`, `js/theme.js`), 헤더, 게임 보드/스코어보드 마크업, footer, 스크립트 태그 |
| `css/game.css` | 신규 | 게임 전용 스타일(보드, 타일, 스코어보드, 버튼, 오버레이). `style.css`의 커스텀 프로퍼티를 그대로 참조하며 새 토큰은 만들지 않는다 |
| `js/game.js` | 신규 | 게임 상태, 이동/병합 로직, 스폰 로직, 게임오버/승리 판정, DOM 렌더링, 키보드 입력, 로컬스토리지 최고점수 처리 |
| `index.html` | 수정 | `.site-header-inner` 안, `site-title`과 `theme-toggle` 사이에 `game.html`로 가는 네비게이션 링크 추가 |
| `post.html` | 수정 | 동일하게 헤더에 네비게이션 링크 추가 (사이트 전역 일관성 유지) |
| `css/style.css` | 수정 | `.site-header-inner`에 새 nav 요소가 들어갈 수 있도록 필요 시 flex 정렬 보정, 신규 `.site-nav-link` 클래스 추가 (헤더 공용 스타일이므로 game.css가 아닌 style.css에 둔다) |

게임 로직/렌더링 전용 스타일(보드, 타일 색상 스케일, 승리/오버 오버레이 등)은 `css/game.css`에 분리한다.
이유: 이 스타일은 `game.html`에서만 쓰이고 상당한 분량(타일 값별 색상 8~10개, 애니메이션)이 예상되므로
공용 `style.css`를 비대하게 만들지 않기 위함. `game.html`에서 `<link rel="stylesheet" href="css/style.css">` 뒤에
`<link rel="stylesheet" href="css/game.css">`를 추가로 로드한다.

## 3. 데이터 모델 / 상태 설계

```js
// js/game.js 내부 상태 (모듈 스코프 클로저 또는 단순 객체)
const GRID_SIZE = 4;

let grid = [];       // 4x4 2차원 배열. 각 셀은 정수(2,4,8,...) 또는 0(빈 칸)
let score = 0;       // 현재 점수
let best = 0;        // 최고 점수, localStorage에서 로드
let isGameOver = false;
let hasWon = false;      // 2048 타일 도달 여부 (승리 배너 표시 후에도 계속 플레이 가능)
let keepPlayingAfterWin = false; // "계속하기" 선택 시 승리 오버레이 재표시 안 함
```

- `grid`는 `grid[row][col]` 형태의 4x4 배열, 빈 칸은 `0`으로 표현. (별도 id 부여 없이 값만 저장하는
  단순 모델로 충분 — 애니메이션은 트랜지션 없이 즉시 리렌더 방식으로 구현, 확장 여지로 셀 DOM
  재사용은 렌더 함수에서 처리)
- localStorage 키:
  - `"2048-best-score"` — 최고 점수(정수, 문자열로 저장)
  - 진행 중 게임 저장은 범위 밖(요구사항에 없음) — 새로고침 시 새 게임으로 시작, best score만 영속

## 4. 게임 로직

### 4.1 보드 초기화
`initGame()`:
1. `grid`를 4x4 0으로 채움
2. `score = 0`, `isGameOver = false`, `hasWon = false`, `keepPlayingAfterWin = false`
3. `spawnTile()` 2회 호출
4. `render()`

### 4.2 이동/병합 알고리즘

공통 핵심 함수 `slideAndMergeLine(line)` — 길이 4의 1차원 배열(빈 칸 포함)을 받아
"왼쪽으로 미는" 기준으로 병합한 새 배열과 이번 이동으로 얻은 점수를 반환:

```js
function slideAndMergeLine(line) {
  const compacted = line.filter(v => v !== 0);
  const result = [];
  let gained = 0;
  for (let i = 0; i < compacted.length; i++) {
    if (compacted[i] !== 0 && compacted[i] === compacted[i + 1]) {
      const merged = compacted[i] * 2;
      result.push(merged);
      gained += merged;
      i++; // 다음 값은 이미 병합에 사용했으므로 건너뜀
    } else {
      result.push(compacted[i]);
    }
  }
  while (result.length < GRID_SIZE) result.push(0);
  return { line: result, gained };
}
```

방향별 이동 함수 `move(direction)` (`direction`: `"up" | "down" | "left" | "right"`):
1. 이동 전 `grid`를 깊은 복사해 `previousGrid`로 보관 (변화 여부 비교용)
2. 방향에 따라 grid를 행(왼쪽/오른쪽) 또는 열(위/아래) 단위 라인으로 추출:
   - `left`: 각 행을 그대로 `slideAndMergeLine` 적용
   - `right`: 각 행을 뒤집어 적용 후 다시 뒤집어 저장
   - `up`: 각 열을 추출해 적용 후 다시 열에 씀
   - `down`: 각 열을 뒤집어 적용 후 뒤집어 다시 씀
   (4방향 모두 `slideAndMergeLine`을 재사용하고, 열 처리 시 전치(transpose) 헬퍼
   `getColumn`/`setColumn` 또는 `transposeGrid()`를 사용해 코드 중복 최소화)
3. 각 라인의 `gained` 합산 → `score += totalGained`
4. `grid`가 `previousGrid`와 동일하면 (= 유효하지 않은 이동) 아무 것도 하지 않고 종료 (스폰 없음)
5. 달라졌다면: `spawnTile()` → `updateBestScore()` → `checkWin()` → `checkGameOver()` → `render()`

### 4.3 스폰 로직
`spawnTile()`:
1. `grid`에서 값이 0인 모든 `{row, col}` 좌표 수집
2. 빈 칸이 없으면 아무 것도 하지 않고 반환
3. 무작위로 하나 선택, 90% 확률로 값 `2`, 10% 확률로 값 `4` 배치 (`Math.random() < 0.9 ? 2 : 4`)

### 4.4 승리 판정
`checkWin()`: grid 내 어떤 셀이든 값이 `2048` 이상이고 아직 `hasWon`이 false이고
`keepPlayingAfterWin`이 false면 `hasWon = true`로 설정하고 승리 오버레이 표시 트리거.
"계속하기" 버튼 클릭 시 `keepPlayingAfterWin = true`로 오버레이만 닫음 (게임 지속).

### 4.5 게임오버 판정
`checkGameOver()`:
1. 빈 칸(`0`)이 하나라도 있으면 `false` (게임 계속)
2. 빈 칸이 없으면, 인접한 셀(상하좌우) 중 값이 같은 쌍이 하나라도 있는지 전수 검사 → 있으면 `false`
3. 둘 다 아니면 `isGameOver = true`, 게임오버 오버레이 표시

### 4.6 최고 점수 갱신
`updateBestScore()`: `score > best`이면 `best = score`, `localStorage.setItem("2048-best-score", String(best))`,
스코어보드 리렌더.

## 5. UI / 레이아웃 계획

`game.html`은 기존 `main`의 `--wide-width`(980px) 컨테이너 관례 대신, 게임 보드가 중앙 정렬된
좁은 컨테이너(`--content-width` 근처, 예: max-width 440px)를 씀. 구조:

```
<header class="site-header">                (index.html / post.html과 동일 헤더, nav 링크 추가됨)
<main class="game-page">
  <a class="back-link" href="index.html">← 목록으로</a>   (기존 .back-link 클래스 재사용)

  <div class="game-container">
    <div class="game-header-row">
      <h1 class="game-title">2048</h1>          <!-- font-mono, glow, hero-title과 톤 일치 -->
      <div class="scoreboard">
        <div class="score-box" id="score-box">
          <span class="score-label">SCORE</span>
          <span class="score-value" id="score-value">0</span>
        </div>
        <div class="score-box" id="best-box">
          <span class="score-label">BEST</span>
          <span class="score-value" id="best-value">0</span>
        </div>
      </div>
    </div>

    <div class="game-controls-row">
      <p class="game-hint">방향키로 타일을 움직여 합치세요.</p>
      <button id="new-game-btn" class="new-game-btn">New Game</button>
    </div>

    <div class="game-board-wrap">
      <div class="game-board" id="game-board">
        <!-- 16개 .grid-cell (배경 슬롯) + 타일은 절대 위치 .tile 요소로 오버레이 -->
      </div>
      <div class="game-overlay" id="game-overlay" hidden>
        <p class="game-overlay-message" id="game-overlay-message"></p>
        <button class="new-game-btn" id="overlay-restart-btn">Try Again</button>
        <button class="game-overlay-secondary" id="overlay-keep-playing-btn" hidden>Keep Playing</button>
      </div>
    </div>
  </div>
</main>
<footer class="site-footer">...</footer>       (기존 footer 재사용)
```

### 시각 매핑 (기존 토큰 재사용, `css/game.css`에서 정의)
- `.game-title`: `font-family: var(--font-mono)`, `text-shadow: 0 0 8px var(--glow-lg), 0 0 24px var(--glow-lg)` — `.hero-title`과 동일한 글로우 처리
- `.score-box`: `.post-item`처럼 `background: var(--color-bg-elevated)`, `border: 1px solid var(--accent)`, `border-radius: 8px`, `box-shadow: 0 0 22px -8px var(--glow-lg)`
- `.score-label`: `font-family: var(--font-mono)`, `color: var(--color-text-secondary)`, `.tag`처럼 작은 글씨/letter-spacing
- `.score-value`: `font-family: var(--font-mono)`, `font-size: 1.6rem`, `font-weight: 800`, `color: var(--accent)`, `text-shadow: 0 0 10px var(--glow-sm)`
- `.new-game-btn`: `.back-link`/`.theme-toggle` 톤 — `border: 1px solid var(--accent)`, `color: var(--accent)`, `border-radius: 999px`, hover 시 `box-shadow: 0 0 20px -2px var(--glow-lg)`
- `.game-board`: `background: var(--color-bg-elevated)`, `border: 1px solid var(--accent)`, `border-radius: 8px`, `box-shadow: 0 0 32px -4px var(--glow-lg)`, `display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.6rem; padding: 0.6rem`, `aspect-ratio: 1 / 1`
- `.grid-cell` (빈 슬롯): `background: var(--color-code-bg)`, `border-radius: 6px`
- `.tile`: 값별 배경 스케일. 단일 accent 컬러 시스템을 존중하기 위해 색상 변경 대신 **투명도/글로우 강도**로
  값 차이를 표현: 낮은 값은 `background: var(--color-bg-elevated)` + 옅은 `border: 1px solid var(--color-border)`,
  값이 커질수록 `border-color: var(--accent)`와 `box-shadow`/`text-shadow` 글로우 강도가 단계적으로 세짐,
  2048 타일은 `background: var(--accent)`, `color: var(--color-bg)`로 반전(가장 강조).
  구체 값 구간: 2~4 (기본), 8~64 (accent 테두리 옅게), 128~512 (accent 테두리+글로우), 1024~2048 (accent 배경 반전).
  타일 숫자: `font-family: var(--font-mono)`, `font-weight: 800`.
- `.game-overlay`: `.game-board-wrap` 위에 `position: absolute; inset: 0`, `background: rgba(0,0,0,0.75)`(다크)/
  라이트 모드는 `rgba(255,255,255,0.85)` — 다만 프로젝트에 반투명 흰/검 정의가 없으므로 새 토큰 없이
  `color-mix(in srgb, var(--color-bg) 85%, transparent)`로 테마 자동 대응, 중앙 정렬 flex, 메시지는
  `.post-item-title`급 크기+glow, 버튼은 `.new-game-btn` 재사용

### 반응형
`css/style.css`의 `@media (max-width: 768px)` 패턴을 `css/game.css`에서도 따름: 768px 이하에서
`.game-container` 패딩 축소, `.score-box` 폰트 크기 축소, 보드 최대 폭을 `min(92vw, 420px)`로 조정.

## 6. 키보드 입력 처리

```js
document.addEventListener("keydown", (e) => {
  const keyMap = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
  };
  const direction = keyMap[e.key];
  if (!direction) return;
  e.preventDefault(); // 페이지 스크롤 방지
  if (isGameOver) return;
  move(direction);
});
```

- 리스너는 `game.html`이 로드된 동안만 유효(페이지 자체가 game.html이므로 전역 등록해도 무방,
  다른 페이지에는 `game.js`를 로드하지 않으므로 충돌 없음)
- 게임오버 상태에서는 방향키 입력 무시(오버레이의 "Try Again" 버튼으로만 재시작)
- 승리 후 "Keep Playing" 선택 시 계속 입력 허용
- 모바일 대응(스와이프 등)은 이번 스펙 범위 밖 — 버튼 기반 New Game만 제공, 터치 스와이프는 optional/향후 확장으로 명시하고 이번 구현에는 포함하지 않음

## 7. 사이트 통합 지점

`index.html`, `post.html`의 `.site-header-inner` 안, `site-title`(`My Blog` 링크)과
`theme-toggle` 버튼 사이에 신규 네비게이션 링크를 삽입:

```html
<div class="site-header-inner">
  <a class="site-title" href="index.html">My Blog</a>
  <nav class="site-nav">
    <a class="site-nav-link" href="game.html">2048</a>
  </nav>
  <button id="theme-toggle" class="theme-toggle" aria-label="다크 모드 전환"></button>
</div>
```

`css/style.css`에 추가할 스타일 (기존 `.site-header-inner`는 `justify-content: space-between`이므로
3개 요소가 되면 중앙 요소가 `nav`가 되도록 flex 정렬 확인 필요 — `site-title`을 flex-shrink 0으로,
`.site-nav`를 `margin-left: auto; margin-right: 1rem` 또는 `.site-header-inner`에 `gap`을 주고
`site-title` 뒤에 nav를 배치):

```css
.site-nav-link {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 0.3rem 0.85rem;
}
.site-nav-link:hover {
  color: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 16px -4px var(--glow-sm);
  text-decoration: none;
}
```

`game.html` 자체의 헤더에서는 `site-nav-link`가 "현재 페이지"이므로 생략하거나 `Blog`로 되돌아가는
링크만 두는 것도 대안이지만, 일관성을 위해 모든 페이지 헤더에 동일한 nav를 두고 game.html에서는
`.back-link`(본문 상단, "← 목록으로")로 이미 귀환 동선이 있으므로 헤더 nav는 그대로 "2048" 링크 유지.

## 8. Work 단계 서브에이전트 분배 권장

이 기능은 CLAUDE.md 기준 "화면 3개 이상"에 해당하지 않는다 — 신규 화면은 `game.html` 1개뿐이고,
`index.html`/`post.html` 수정은 각 1줄 내외의 nav 링크 삽입에 불과하다. 따라서 여러 화면 단위로
쪼갤 필요는 없지만, 작업량(HTML 마크업, CSS 전용 스타일, JS 게임 로직)이 성격상 뚜렷이 나뉘고
파일 경계가 겹치지 않으므로 **2개 서브에이전트로 분리하는 것을 권장**한다:

1. **서브에이전트 A — 마크업/스타일**
   - 범위: `game.html` 생성, `css/game.css` 생성, `css/style.css`에 `.site-nav`/`.site-nav-link` 규칙
     추가, `index.html`/`post.html` 헤더에 nav 링크 삽입
   - 산출물: 정적 마크업 + 스타일만 완성된 상태 (게임 로직 없이 빈 보드/스코어 0 표시로 확인 가능해야 함)
   - `js/game.js`는 건드리지 않고, `<script src="js/game.js"></script>` 태그만 `game.html`에 미리 추가

2. **서브에이전트 B — 게임 로직**
   - 범위: `js/game.js` 전체 (섹션 3, 4, 6의 상태/로직/입력 처리)
   - 전제: 서브에이전트 A가 만든 `game.html`의 DOM id/class(`#game-board`, `#score-value`,
     `#best-value`, `#game-overlay`, `#new-game-btn` 등 섹션 5의 마크업)를 그대로 셀렉터로 사용
   - A가 먼저 마크업의 id/class 네이밍을 확정해야 B가 정확히 바인딩할 수 있으므로, **A를 먼저 실행해
     완료시킨 뒤 B를 실행하는 순차 진행을 권장** (완전 병렬은 DOM 계약이 어긋날 위험이 있음)

두 서브에이전트 모두 지침 파일(`.md`)에 이 spec.md의 해당 섹션(A는 2, 5, 7 / B는 2, 3, 4, 6)을
그대로 포함해 전달한다. 완료 후 Review 단계에서 방향키 조작, 병합 규칙, 게임오버, 승리, 최고점수
localStorage 영속, 다크/라이트 테마 전환, 반응형을 함께 점검한다.
