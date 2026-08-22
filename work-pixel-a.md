# 작업 지침 — 서브에이전트 A (마크업/스타일/헤더 통합)

이 문서는 "/Users/hyungyukim/My coding/Claude/My blog/spec.md"의 픽셀 아트 에디터 기능 계획 중
너의 담당 범위만 정리한 지침이다. 반드시 spec.md 전체(특히 섹션 2, 4, 7, 8)를 먼저 읽고 시작할 것.
`game.html`/`css/game.css`도 참고용으로 읽어라 — 동일한 시각 언어(카드, glow, pill 버튼)를
재사용해야 한다.

## 범위 (이 파일에 명시된 것만 수정/생성한다)
- 신규 생성: `pixel-art.html`
- 신규 생성: `css/pixel-art.css`
- 수정: `index.html`, `post.html`, `game.html`, `pixel-art.html`(자기 자신) — 헤더 `.site-nav`에
  "Pixel Art" 링크 추가 (spec.md 섹션 8)

**절대 건드리지 말 것**: `js/pixel-art.js`는 만들지 않는다(다음 담당자 B의 몫). `pixel-art.html`에
`<script src="js/pixel-art.js"></script>` 태그만 미리 추가해 둔다(파일이 없어 404가 나는 것은
정상 — B가 채운다).

## 해야 할 일
1. `game.html`, `css/game.css`, `css/style.css`, `index.html`, `post.html`을 읽고 기존 톤과
   `.site-header-inner`/`.site-nav`/`.site-nav-link` 구조, `.back-link`, `.game-title`류 제목
   스타일, `.new-game-btn` pill 버튼, `.game-board-wrap`류 카드 스타일을 파악한다.
2. `pixel-art.html` 생성 — spec.md 섹션 4.2의 마크업 구조를 그대로 따른다. `<head>`는
   `css/style.css` 다음에 `<link rel="stylesheet" href="css/pixel-art.css">`를 추가로 로드한다.
   body 끝에는 `js/theme.js`, `js/pixel-art.js` 스크립트 태그와
   `BlogTheme.initThemeToggle("theme-toggle")` 호출을 포함한다(기존 페이지들과 동일 패턴).
   DOM id/class는 spec.md에 명시된 그대로 정확히 사용할 것 — 서브에이전트 B가 이 id들을
   `js/pixel-art.js`에서 그대로 셀렉터로 사용하므로 정확히 일치해야 한다:
   - `#pixel-canvas` (`<canvas>` 엘리먼트, `width="512" height="512"` 속성 반드시 포함 — CSS로
     축소 표시되더라도 캔버스 자체의 내부 해상도 속성은 512x512여야 한다)
   - `#palette` (팔레트 스와치들이 들어갈 컨테이너. 스와치 자체는 JS가 동적으로 채우므로 빈
     컨테이너만 두면 된다 — 단, JS 로딩 전에도 레이아웃이 비어 보이지 않도록 정적 목업으로 몇 개
     예시 스와치를 넣어도 무방하나 필수는 아니다. 비워두는 쪽을 권장)
   - `#custom-color-picker` (`<input type="color">`)
   - `#clear-btn`, `#save-btn` (버튼, `.new-game-btn` 클래스 재사용)
3. `css/pixel-art.css` 생성 — spec.md 섹션 4.2의 시각 매핑을 구현. 새로운 색상 토큰을 만들지
   말고 기존 `--accent`/`--glow-sm`/`--glow-lg`/`--color-bg-elevated`/`--color-border`/
   `--font-mono` 등을 재사용한다.
   - `#pixel-canvas`에는 `width: 100%; max-width: 480px; height: auto; image-rendering: pixelated;`
     를 적용해 반응형으로 축소되어도 픽셀 경계가 흐려지지 않게 한다.
   - `.canvas-wrap`은 `game.html`의 `.game-board-wrap`과 동일한 카드 톤(`background`, `border`,
     `box-shadow`)으로 스타일링한다.
   - `.palette-swatch`는 `width/height: 1.75rem`, `border-radius: 4px`,
     `border: 1px solid var(--color-border)`. `.palette-swatch.selected`는
     `border-color: var(--accent); box-shadow: 0 0 10px -2px var(--glow-lg)`.
   - `.palette-swatch-eraser`는 체커보드 패턴을 CSS `background-image`(반복되는 `linear-gradient`
     conic-gradient 등)로 표현해 "지우개(투명)"임을 시각적으로 알 수 있게 한다.
   - `.pixel-art-workspace`는 데스크톱에서 캔버스+사이드바 가로 배치(flex 또는 grid, 자유롭게
     선택하되 **`display: grid`를 쓸 경우 그 직접 자식에는 `position: absolute`를 걸지 않는다** —
     2048 리뷰에서 실제로 발생했던 버그 재발 방지). `@media (max-width: 768px)`에서는
     `flex-direction: column`으로 캔버스 아래 사이드바가 오도록 한다.
4. `index.html`, `post.html`, `game.html`, `pixel-art.html`(자기 자신) 4개 파일 모두 헤더의
   `.site-nav`에 "2048" 링크 뒤로 spec.md 섹션 8 그대로 "Pixel Art" 링크를 추가한다. 4개 파일의
   nav 마크업이 문자 그대로 동일한지(오타 없이) 직접 diff/grep으로 대조 확인한다.
5. 완료 후 blog 루트에서 `python3 -m http.server 8000`을 백그라운드로 띄우고 `curl`로
   `http://localhost:8000/pixel-art.html`, `/css/pixel-art.css`가 200을 반환하는지, 4개 헤더
   파일에 "Pixel Art" 링크가 모두 존재하는지(`grep -c "Pixel Art"` 등으로) 확인한다. 서버는 확인 후
   종료한다.

## 완료 기준
- JS 로직 없이도 정적 상태(빈 캔버스, 팔레트 컨테이너, 버튼)가 브라우저에서 기존 사이트와 톤이
  일치하는 모습으로 보여야 한다.
- `js/pixel-art.js`는 만들지 않는다(다음 담당자 몫).
- 작업 완료 후 확정한 DOM id/class 체계, `.pixel-art-workspace` 레이아웃에 grid를 썼는지 flex를
  썼는지를 요약해서 보고한다 (다음 서브에이전트가 참고할 수 있도록).
