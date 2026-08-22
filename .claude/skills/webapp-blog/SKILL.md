---
name: webapp-blog
description: Use whenever the user asks to add, build, extend, modify, review, or commit a mini web-app feature on this static blog repo — games, editors, calculators, or any interactive page — even if they just say "~게임 만들어줘", "~에디터 추가해줘", "이 프로젝트 방식대로 해줘", or "지금까지 하던 대로 진행해줘" without naming CLAUDE.md or subagents. It drives the mandatory Plan → Work → Review → Commit subagent cycle, the folder structure, the shared css/style.css color tokens, the common header/nav pattern, and the required in-app usage hint. Consult it before starting implementation, and again during review/commit of an already-started feature.
---

# webapp-blog

"My Blog" 정적 블로그에 미니 웹앱(게임/에디터/툴 등)을 추가하거나 수정할 때 따르는 작업
하네스다. CLAUDE.md의 규칙을 스킬 형태로 정리한 것이며, CLAUDE.md가 갱신되면 이 스킬도
함께 갱신한다.

## 프로젝트 구조
```
My blog/
├── CLAUDE.md              — 작업 사이클/서브에이전트/공통 규칙 원본
├── index.html             — 블로그 홈(글 목록), 공용 헤더 포함
├── post.html              — 글 상세, 공용 헤더 포함
├── game.html               } 웹앱 페이지 — 전부 공용 헤더 포함, 규칙 3(팔레트)/4(사용법) 대상
├── pixel-art.html           }
├── spec.md                — 최신 기능의 Plan 산출물(매 사이클 덮어씀)
├── review.md               — 최신 기능의 Review 산출물(매 사이클 덮어씀)
├── work-<feature>-<a|b>.md — 서브에이전트별 지침 파일(기능마다 새로 생성, 보존)
├── css/
│   ├── style.css          — 공용 디자인 토큰(색상/폰트/glow). 신규 토큰 추가 금지, 재사용만.
│   └── <feature>.css      — 웹앱별 스타일. style.css 변수만 참조.
├── js/
│   ├── theme.js           — 다크/라이트 토글 공용 모듈 (BlogTheme.initThemeToggle)
│   └── <feature>.js       — 웹앱별 로직
└── posts/                 — 마크다운 글 + posts.json 매니페스트
```

기존 웹앱 목록(참고용, 새 기능 추가 시 헤더 nav에 같은 패턴으로 추가):
1. Blog (`index.html`/`post.html`) — nav 링크 없음(홈)
2. 2048 (`game.html`) — nav 라벨 "2048"
3. Pixel Art (`pixel-art.html`) — nav 라벨 "Pixel Art"

## 작업 사이클 (CLAUDE.md 그대로)
1. **Plan** — 서브에이전트를 만들어 `spec.md`를 작성시킨다. 사용자 승인 없이는 다음 단계로 가지 않는다.
2. **Work** — 서브에이전트를 만들어 구현한다. 화면(페이지)이 3개 이상이면 화면별로 서브에이전트를 나눈다.
   보통 2개로 나눌 때는: A = 마크업/CSS/헤더 nav 통합, B = 로직(JS). A가 확정한 DOM id/class
   계약을 지침 파일에 그대로 옮겨 B에게 전달한다.
3. **Review** — 서브에이전트를 만들어 테스트하고 `review.md`를 작성시킨다. 정적 코드 리뷰만으로는
   실제 렌더링 버그를 못 잡는다(2048의 `position:absolute` grid 버그, Pixel Art의 테마 전환 시
   캔버스 미갱신 버그가 실제 사례) — **반드시 로컬 서버 + 가능하면 브라우저 자동화로 실제 클릭/
   드래그까지 검증**하도록 Review 지침에 명시한다.
4. **Commit** — 기능마다 git commit + push. 커밋 메시지는 무엇을 추가했는지 + Review에서 발견/
   수정한 버그를 간단히 요약.

배포 확인이 필요하면 GitHub Pages 배포 후 `claude-in-chrome`으로 실제 페이지를 열어보고,
캐시로 인한 오탐(수정이 반영 안 된 것처럼 보이는 경우)이면 hard reload(`cmd+shift+r`)로
구분한다 — 코드를 다시 고치기 전에 캐시 문제인지부터 확인.

## 서브에이전트 규칙
- 서브에이전트에게 작업을 넘길 때 전용 지침 파일(`work-<feature>-<a|b>.md`)을 만들어 전달한다.
- 서브에이전트는 지침 파일에 명시된 범위만 수정한다(다른 파일은 절대 건드리지 않는다고 명시).
- Work가 복잡하면 여러 서브에이전트로 나누고, 각자 독립적으로 작업할 수 있게 범위를 겹치지
  않게 나눈다(예: A는 html/css만, B는 js만 — 단 A가 만든 DOM 계약을 B 지침에 그대로 포함).
- Plan(spec.md)에는 최소한 다음을 포함: 개요, 파일 목록, 데이터 모델, UI/마크업 구조, 인터랙션,
  (해당 시) 내보내기/저장 로직, 팔레트/색상 매핑, 헤더 nav 통합 방법, 서브에이전트 분할 계획,
  "다음에 열 때 참고" 섹션(과거에 겪은 버그 클래스와 그 회피 방법 기록).

## 공통 규칙 (CLAUDE.md)
- 승인 없이 구현을 시작하지 않는다.
- 막히면 사용자에게 알린다.
- **모든 웹앱은 블로그의 색상 팔레트를 따른다.** `css/style.css`의 CSS 변수를 참조할 것 — 새
  색상 토큰을 만들지 않는다. 주요 변수:
  - `--color-bg`, `--color-bg-elevated`, `--color-text`, `--color-text-secondary`,
    `--color-border`, `--accent`, `--glow-sm`, `--glow-lg`, `--font-mono`, `--font-sans`
  - 다크 테마는 `[data-theme="dark"]` + `@media (prefers-color-scheme: dark)` fallback으로
    자동 적용된다. `localStorage` 키는 `"theme"`. 웹앱 JS에서 `getComputedStyle`로 이 변수들을
    직접 읽어 `<canvas>` 등에 그리는 경우, `js/theme.js`가 토글 시 커스텀 이벤트를 쏘지 않으므로
    `MutationObserver`로 `document.documentElement`의 `data-theme` 속성 변화를 직접 감지해서
    다시 그려야 한다(Pixel Art 사례 참고).
- **웹앱에 사용법 안내 문구를 반드시 포함한다.** 제목 아래 한두 문장으로, 조작 방법을 설명.
  예: 2048의 `.game-hint`("방향키로 타일을 움직여 합치세요."), Pixel Art의
  `.pixel-art-hint`("캔버스를 클릭하거나 드래그해서 색을 칠하세요...").

## 공용 헤더 마크업 (모든 페이지에서 byte-identical해야 함)
```html
<div class="site-header-inner">
  <a class="site-title" href="index.html">My Blog</a>
  <nav class="site-nav">
    <a class="site-nav-link" href="game.html">2048</a>
    <a class="site-nav-link" href="pixel-art.html">Pixel Art</a>
    <!-- 새 웹앱은 여기 같은 패턴으로 추가 -->
  </nav>
  <button id="theme-toggle" class="theme-toggle" aria-label="다크 모드 전환"></button>
</div>
```
새 웹앱 추가 시 `index.html`, `post.html`, 그리고 기존 모든 웹앱 페이지 + 새 페이지 자신까지
전체 파일의 nav를 동일하게 갱신해야 한다(문자 그대로 동일한지 diff/grep으로 대조).

## 알려진 버그 클래스 (재발 방지)
- **CSS Grid + `position: absolute`**: `display: grid` 컨테이너의 자식에 `position: absolute`를
  걸면 기본 `align-self`/`justify-self: stretch`가 깨져 셀을 채우지 못하고 콘텐츠 크기로
  쪼그라든다(2048 타일 버그, 커밋 `83a2263`). grid 자식은 `position`을 걸지 말거나, 오버레이가
  필요하면 `position: relative` 래퍼를 별도로 둔다(`.canvas-wrap` 패턴).
- **테마 전환 시 캔버스/커스텀 렌더링 미갱신**: `<canvas>`에 CSS 변수 색을 직접 그리는 경우
  `js/theme.js`의 토글은 이벤트를 쏘지 않으므로, `MutationObserver`로 `data-theme` 속성 변화를
  감지해 다시 그려야 한다(Pixel Art 버그, `MutationObserver` 패치로 해결).
- **정적 코드 리뷰만으로 렌더링 버그를 못 잡음**: Review 단계는 반드시 로컬 서버(`python3 -m
  http.server`)를 띄우고 실제 클릭/드래그/새로고침까지 확인한다. 브라우저 자동화가 안 되면
  최소 curl로 200 응답 + grep으로 마크업 존재 여부까지는 확인하고, 한계를 review.md에 명시한다.

## 참고
- 자세한 사고 과정과 예시는 `spec.md`/`review.md`/`work-*.md`의 과거 버전(git 히스토리,
  커밋 `7e291ca`, `83a2263`, `b19a1fa`, `eafcb78`)을 참고.
