# 작업 지침 — 서브에이전트 A (마크업/스타일)

이 문서는 "/Users/hyungyukim/My coding/Claude/My blog/spec.md"의 2048 게임 기능 계획 중
너의 담당 범위만 정리한 지침이다. 반드시 spec.md 전체(특히 섹션 2, 5, 7)를 먼저 읽고 시작할 것.

## 범위 (이 파일에 명시된 것만 수정/생성한다)
- 신규 생성: `game.html`
- 신규 생성: `css/game.css`
- 수정: `css/style.css` — `.site-nav`/`.site-nav-link` 규칙 추가 및 `.site-header-inner` 정렬 보정
- 수정: `index.html` — 헤더에 nav 링크 삽입
- 수정: `post.html` — 헤더에 nav 링크 삽입

**절대 건드리지 말 것**: `js/game.js` 내부 로직(파일 자체는 생성해도 되지만 내용은 빈 파일 또는
최소 스텁만 두거나, `<script src="js/game.js"></script>` 태그만 `game.html`에 추가하고 실제
파일 생성은 다음 담당자(서브에이전트 B)에게 맡긴다 — 즉 `js/game.js` 파일을 만들지 마라).

## 해야 할 일
1. `index.html`, `post.html`, `css/style.css`, `js/theme.js`를 읽고 기존 톤(네온 사이버펑크,
   `--color-bg`/`--accent`/`--glow-sm`/`--glow-lg`/`--font-mono` 등 커스텀 프로퍼티, `.post-item`
   `.back-link` `.hero-title` 등 기존 클래스 스타일)을 파악한다.
2. `game.html` 생성 — spec.md 섹션 5의 마크업 구조를 그대로 따른다. `<head>`는 `index.html`과
   동일하게 `css/style.css`를 로드하고, 그 뒤에 `<link rel="stylesheet" href="css/game.css">`를
   추가로 로드한다. body 끝에는 `js/theme.js`, `js/game.js` 스크립트 태그와
   `BlogTheme.initThemeToggle("theme-toggle")` 호출을 포함한다 (기존 페이지들과 동일 패턴).
   DOM id/class는 spec.md 섹션 5에 명시된 그대로 정확히 사용할 것 (`#game-board`, `#score-value`,
   `#best-value`, `#game-overlay`, `#game-overlay-message`, `#new-game-btn`,
   `#overlay-restart-btn`, `#overlay-keep-playing-btn` 등) — 서브에이전트 B가 이 id들을
   `js/game.js`에서 그대로 셀렉터로 사용할 것이므로 정확히 일치해야 한다.
   `.game-board` 내부에 16개의 `.grid-cell` 빈 슬롯 div를 정적으로 미리 넣어둔다 (타일은 JS가
   동적으로 추가/제거).
3. `css/game.css` 생성 — spec.md 섹션 5 "시각 매핑" 및 "반응형" 항목을 그대로 구현. 새로운 색상
   토큰을 만들지 말고 기존 `--accent`/`--glow-sm`/`--glow-lg`/`--color-bg-elevated`/
   `--color-border`/`--color-code-bg`/`--font-mono` 등을 재사용한다. 타일 값 구간별 스타일
   (2~4, 8~64, 128~512, 1024~2048)을 클래스로 표현 (예: `.tile[data-value="2"]` 속성 선택자
   또는 `.tile-2`, `.tile-4`... 클래스 중 편한 방식으로 하되, spec.md 섹션 4.2/5의 렌더링 로직과
   자연스럽게 맞물릴 수 있는 방식을 선택하고 어떤 방식을 선택했는지 최종 보고에 명시한다 — 속성
   선택자 `[data-value="..."]` 방식을 권장, 이후 서브에이전트 B가 렌더링 시 `tile.dataset.value`만
   설정하면 되도록).
4. `css/style.css` 수정 — `.site-nav`, `.site-nav-link` 규칙을 spec.md 섹션 7 코드 그대로 추가하고,
   `.site-header-inner`가 3요소(로고/네비/토글)를 자연스럽게 배치하도록 필요한 최소 조정만 한다.
5. `index.html`, `post.html` 수정 — `.site-header-inner` 안에 `site-title`과 `theme-toggle` 사이에
   spec.md 섹션 7의 nav 마크업을 삽입한다.
6. 완료 후 `python3 -m http.server 8000`을 blog 루트에서 백그라운드로 띄우고 `curl`로
   `http://localhost:8000/game.html`, `/css/game.css`, `/index.html`이 200을 반환하는지,
   game.html에 빈 4x4 그리드와 score 0/best 0가 마크업상 존재하는지 확인한다. 서버는 확인 후 종료한다.

## 완료 기준
- 게임 로직 없이도 정적 상태(빈 보드, 점수 0)가 브라우저에서 기존 사이트와 톤이 일치하는 모습으로
  보여야 한다.
- `js/game.js`는 만들지 않는다(다음 담당자 몫).
- 작업 완료 후 어떤 DOM id/class 체계를 확정했는지, `css/game.css`에서 타일 값 구간을 어떤 선택자
  방식으로 만들었는지 요약해서 보고한다 (다음 서브에이전트가 그대로 참고할 수 있도록).
