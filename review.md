# Review 결과 — 2048 게임 기능

## 검증 방식에 대한 중요한 한계 (먼저 명시)

`claude-in-chrome` 브라우저 도구를 시도했으나 **연결되지 않음**을 확인했다
(`tabs_context_mcp` 결과: "Browser extension is not connected. Please ensure the
Claude browser extension is installed and running..."). 따라서 review.md 지침 1~9번의
실제 브라우저 조작(방향키 입력, New Game 클릭, 새로고침 후 최고점수 유지, 헤더 링크
클릭 이동, 다크/라이트 테마 토글, 반응형 리사이즈, 콘솔 에러 확인, 강제 game-over/승리
오버레이 확인)은 **하나도 실제 브라우저에서 수행하지 못했다**. 아래 결과는 전부
정적 코드 리뷰(spec.md 대조 + game.html/game.js/game.css/style.css/index.html/post.html
전체 파일 read)로 대체 검증한 것이며, 실제 렌더링/상호작용 검증이 아니라는 점을
숨기지 않고 밝힌다. 로컬 서버는 브라우저 검증이 불가능했으므로 띄우지 않았다
(띄울 필요 자체가 없었음).

## 항목별 결과

| # | 항목 | 결과 | 비고 |
|---|---|---|---|
| 1 | claude-in-chrome 연결 확인 | 완료 (Fail: 미연결) | 위 참조 |
| 2 | 방향키 4방향 이동/병합 | 미검증(코드 리뷰로 대체) | `js/game.js` `move()`/`slideAndMergeLine()`가 spec.md 4.2/4.3 알고리즘과 문자 그대로 일치. 4방향 모두 `slideAndMergeLine` 재사용, `getColumn`/`setColumn`으로 전치 처리. 로직 자체는 표준 2048 알고리즘과 일치하며 이상 없음 |
| 3 | New Game 버튼 | 미검증(코드 리뷰) | `newGameBtn.addEventListener("click", initGame)` 정상 연결, `initGame()`이 spec 4.1 순서(grid 초기화→score/flag 리셋→hideOverlay→spawn x2→render) 그대로 구현됨 |
| 4 | 점수/최고점수 UI 갱신 및 새로고침 후 유지 | 미검증(코드 리뷰) | `updateBestScore()`가 `score > best`일 때만 `localStorage.setItem("2048-best-score", ...)` 후 `render()`가 `score-value`/`best-value` textContent 갱신. `DOMContentLoaded`에서 `localStorage.getItem`으로 best 복원. 로직상 문제 없음 |
| 5 | 헤더 "2048" 네비 ↔ "← 목록으로" 상호 이동 | 미검증(코드 리뷰) | `index.html`/`post.html`/`game.html` 모두 `.site-header-inner`에 `<nav class="site-nav"><a class="site-nav-link" href="game.html">2048</a></nav>` 동일하게 삽입되어 있고, `game.html`에 `<a class="back-link" href="index.html">← 목록으로</a>` 존재. href 오타 없음 확인 |
| 6 | 다크/라이트 테마 토글, 네온 톤 유지 | 미검증(코드 리뷰) | `game.html`도 다른 페이지와 동일하게 `js/theme.js` + `BlogTheme.initThemeToggle("theme-toggle")` 재사용(게임 전용 테마 로직 없음, 코드 공유이므로 동작 방식 자체는 index.html과 동일). `game.css`는 신규 토큰 없이 `style.css`의 `--accent`/`--glow-sm`/`--glow-lg`/`--color-bg-elevated` 등만 참조 |
| 7 | 반응형(≤768px) | 미검증(코드 리뷰) | `game.css`에 `@media (max-width: 768px)` 블록 존재, 보드/스코어박스 크기 축소 규칙 있음. 시각적으로 실제 안 깨지는지는 브라우저 렌더링 확인이 필요하므로 완전한 보증은 아님 |
| 8 | 게임오버/승리 오버레이 로직 | 코드 리뷰로 재확인 | 아래 "발견된 이슈" 참고. `window`에 게임 상태가 노출되어 있지 않아(즉시실행함수 클로저 내부) 콘솔에서 `grid`를 강제 조작하는 것 자체가 애초에 불가능함을 코드 확인으로 검증(브라우저 연결 여부와 무관하게 스펙에 정의된 대로 구현되어 있어 발생하는 제약) |
| 9 | 콘솔 에러 없음 | 미검증 | 브라우저 미연결로 `read_console_messages` 호출 불가 |
| 10 | 브라우저 미연결 시 대체 검증 명시 | 완료 | 이 문서 전체가 해당 |

## 발견된 이슈

1. **(경미) 승리와 게임오버가 같은 이동에서 동시에 발생하는 극단적 케이스에서 오버레이 메시지 충돌**
   `js/game.js:139-140` — `move()`에서 `checkWin()` 다음에 `checkGameOver()`가 이어서 호출된다.
   만약 마지막 남은 빈 칸을 채우는 이동이 동시에 2048 타일을 만들고, 그 직후 보드가 꽉 차면서
   더 이상 병합 가능한 인접 쌍도 없는 경우(이론상 가능, 실전에서는 드묾), `checkWin()`이 먼저
   `showOverlay("You Win!", true)`를 호출한 뒤 곧바로 `checkGameOver()`가
   `showOverlay("Game Over", false)`로 덮어써 승리 메시지와 "Keep Playing" 버튼이 사용자에게 보이지
   않고 즉시 "Game Over"로 대체된다. spec.md 4.4/4.5에는 이 동시 발생 케이스에 대한 우선순위 규정이
   없어 spec 미준수라 보긴 어렵지만, 실제 플레이에서 "이겼는데 바로 게임오버로 덮인다"는 체감상
   이상한 UX가 될 수 있다. 심각도는 낮음(발생 확률 매우 낮고 최고점수/점수 자체는 정상 반영됨).

2. **(참고, 버그 아님) 게임 상태가 `window`에 노출되지 않음**
   `js/game.js:10` 전체가 IIFE(`(function () { "use strict"; ... })()`)로 감싸여 있어 `grid`,
   `score`, `isGameOver` 등 상태 변수가 전역에 노출되지 않는다. spec.md에는 이를 요구하는 조항이
   없으므로 캡슐화 자체는 정상적인 설계이지만, 그 결과 review.md 지침 8번이 제안한 "콘솔에서 grid를
   직접 조작해 game-over/승리 오버레이를 강제 트리거"하는 방식의 수동 테스트가 애초에 불가능하다.
   향후 QA 편의를 위해 디버그 빌드에서만 `window.__game2048`같은 형태로 상태를 노출하는 것을 고려할
   수 있으나, 이번 스펙 범위 밖의 개선 제안일 뿐 결함은 아니다.

3. **(버그 아님, 확인 완료) 라이트 모드 글로우 미표시는 기존 사이트 관례를 따른 것**
   `css/style.css:14-15`에서 라이트 테마는 `--glow-sm`/`--glow-lg`가 `transparent`로 정의되어 있어
   `game.css`의 타일/스코어박스/타이틀 글로우가 라이트 모드에서는 보이지 않는다. 이는 `.hero-title`,
   `.post-item` 등 기존 사이트 전역에서도 동일하게 나타나는 기존 디자인 패턴(`css/style.css:180-190,
   216-221` 등)이므로 game.css만의 결함이 아니라 사이트 전체의 의도된 동작이다.

이 외 로직 검토(이동/병합/스폰/승리/게임오버 판정, DOM id 계약, 헤더 nav 삽입, CSS 변수 재사용
여부)에서는 spec.md 대비 불일치나 명백한 버그를 발견하지 못했다.

**추가 조치 (이슈 1 수정 완료):** `js/game.js`의 `checkWin()`이 승리 여부를 boolean으로 반환하도록
수정하고, `move()`에서 `checkWin()`이 이번 이동에서 새로 승리를 트리거했다면(`justWon === true`)
같은 이동에서 `checkGameOver()`를 호출하지 않도록 변경했다. 이제 승리 오버레이가 게임오버로 즉시
덮어써지는 경쟁 상태가 제거되었다.

## 실제 브라우저 검증 (claude-in-chrome 연결 후 추가 진행)

배포된 GitHub Pages 페이지(`https://wisestar311.github.io/my-blog/game.html`)를 실제로 열어
플레이해본 결과, **심각한 렌더링 버그를 발견했다.**

### 발견된 버그 (수정 완료)

**`css/game.css`의 `.tile { position: absolute; }`로 인해 타일이 그리드 셀을 채우지 못하고
셀 좌상단에 작은 크기(약 12x29px)로만 표시됨.** 위에서 "미검증 항목"으로 예상했던 바로 그
리스크가 실제로 발생한 것이었다. `.tile`은 `#game-board`(display: grid)의 자식으로
`grid-column-start`/`grid-row-start` 인라인 스타일만으로 위치가 지정되는데, `position: absolute`가
붙으면 grid item의 기본 stretch 정렬이 적용되지 않아 콘텐츠 크기로만 렌더링되고 셀을 채우지 못했다.
16개 `.grid-cell` 자체는 DOM/레이아웃상 정상(4x4, 87.5px 정사각형)이었으나 `--color-bg-elevated`와
`--color-code-bg`의 색상 차이가 미미해 육안으로는 격자가 거의 안 보였다.

**수정:** `css/game.css`에서 `.tile`의 `position: absolute;` 선언을 제거. grid item은 `position`이
없으면 기본적으로 `align-self`/`justify-self: stretch`가 적용되어 자동으로 셀을 꽉 채운다.

### 수정 후 재검증 (로컬 서버 + 실제 브라우저, 전부 Pass)
| 항목 | 결과 |
|---|---|
| 타일이 그리드 셀을 정확히 채우고 올바른 칸에 위치 | Pass (수정 후 확인) |
| → (오른쪽) 이동: 타일이 벽까지 슬라이드, 유효한 이동 시 새 타일 스폰 | Pass |
| ↓ → ← 연속 이동 후 동일 값 타일 병합, SCORE 정확히 누적(2+2=4) | Pass |
| New Game 클릭: SCORE 0으로 리셋, BEST는 유지 | Pass |
| 페이지 새로고침 후 BEST(localStorage `2048-best-score`) 유지 확인 | Pass |
| 다크 모드 토글: 네온 글로우(cyan accent)로 정상 전환, 격자/타일 모두 스타일 적용 | Pass |
| 브라우저 콘솔 에러 | 없음 |

승리/게임오버 오버레이 동시 발생 케이스, 반응형(≤768px) 시각 확인은 무작위 실접 플레이로
재현하기 어려워 이번에도 코드 리뷰 수준에 머물렀으나(로직 자체는 위에서 이미 수정됨), 핵심
플레이 경험(이동/병합/점수/최고점수/테마)은 실제 브라우저에서 전부 확인되었다.

## 최종 결론

**실제 브라우저 검증까지 마쳤고, 치명적 렌더링 버그 1건을 발견 즉시 수정했다.** 최초 코드 리뷰만으로는
"조건부 Pass"였으나 실제로는 타일이 정상적으로 보이지도 않는 상태였다 — **정적 코드 리뷰만으로는
잡아낼 수 없는 버그였고, 반드시 실제 브라우저 확인이 필요하다는 review.md 자체의 경고가 그대로
들어맞은 사례.** 수정 후 재검증 결과 핵심 기능(이동/병합/점수/최고점수 영속/테마)은 모두 정상
동작하며, 최종 **Pass**.
