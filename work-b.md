# 작업 지침 — 서브에이전트 B (게임 로직)

이 문서는 "/Users/hyungyukim/My coding/Claude/My blog/spec.md"의 2048 게임 기능 계획 중
너의 담당 범위만 정리한 지침이다. 반드시 spec.md 전체(특히 섹션 3, 4, 6)를 먼저 읽고,
아래 "서브에이전트 A가 확정한 DOM/CSS 계약"도 반드시 읽은 뒤 시작할 것.

## 범위 (이 파일에 명시된 것만 수정/생성한다)
- 신규 생성: `js/game.js` (전체)
- 그 외 파일은 절대 건드리지 않는다. `game.html`, `css/game.css`, `css/style.css`,
  `index.html`, `post.html`은 이미 완성되어 있고 수정 대상이 아니다.

## 서브에이전트 A가 확정한 DOM/CSS 계약 (그대로 따를 것)
- `#game-board`: `display: grid; grid-template-columns: repeat(4, 1fr)`인 컨테이너. 내부에 정적으로
  16개의 `.grid-cell` div(배경 슬롯)가 이미 들어있다. **타일 DOM 요소는 이 grid 컨테이너의 추가
  자식으로 append하고, 위치는 별도의 픽셀 계산(left/top) 없이 CSS Grid 라인 배치로 지정한다**:
  타일 요소에 `tile.style.gridColumnStart = col + 1; tile.style.gridRowStart = row + 1;`을 인라인으로
  설정하면 grid-cell과 같은 칸에 겹쳐서 배치된다 (`.tile`에는 `position: relative; z-index: 1` 정도만
  CSS로 있으면 충분 — 이미 `.grid-cell`은 z-index 없음). 즉 픽셀 좌표 계산이나 보드 크기 측정은
  필요 없다.
- 각 타일 요소는 `<div class="tile" data-value="2">2</div>` 형태 — 값은 `dataset.value`로 설정하고
  텍스트 콘텐츠도 같은 숫자로 채운다. `css/game.css`가 `.tile[data-value="..."]` 속성 선택자로 4단계
  (2~4 / 8~64 / 128~512 / 1024 이상) 스타일을 이미 정의해뒀으므로 `dataset.value`만 정확히 설정하면
  자동으로 스타일이 적용된다.
- 렌더링 방식: 매 이동/스폰마다 `#game-board` 안의 기존 `.tile` 요소를 전부 제거하고(단, `.grid-cell`
  16개는 그대로 둔다) `grid` 상태를 기준으로 `.tile`을 새로 생성해 append하는 "전체 리렌더" 방식으로
  구현한다 (애니메이션 없이 즉시 갱신, spec.md 4.2/5에서 언급한 것과 동일한 단순 모델).
- 스코어보드: `#score-value`, `#best-value` — `textContent`로 숫자를 갱신한다.
- 새 게임 버튼: `#new-game-btn` — 클릭 시 `initGame()` 호출.
- 오버레이: `#game-overlay`(기본 `hidden` 속성 있음), `#game-overlay-message`(텍스트),
  `#overlay-restart-btn`(클릭 시 오버레이 숨기고 `initGame()`), `#overlay-keep-playing-btn`
  (기본 `hidden` 속성 있음, 승리 시에만 `hidden` 제거 — 클릭 시 `keepPlayingAfterWin = true`로
  설정하고 오버레이만 숨김, 게임은 리셋하지 않음).
  오버레이를 보이려면 `hidden` 속성을 제거하고, 숨기려면 다시 `hidden` 속성을 추가한다.

## 해야 할 일
1. spec.md 섹션 3(데이터 모델), 4(게임 로직: 초기화/이동·병합/스폰/승리판정/게임오버판정/최고점수),
   6(키보드 입력)을 그대로 `js/game.js`에 구현한다. 함수명도 spec.md에 나온 이름
   (`initGame`, `slideAndMergeLine`, `move`, `spawnTile`, `checkWin`, `checkGameOver`,
   `updateBestScore`, `render` 등)을 최대한 그대로 사용해 spec.md와 코드가 대응되게 한다.
2. localStorage 키는 정확히 `"2048-best-score"`를 사용한다.
3. `DOMContentLoaded` 시점에 `best`를 localStorage에서 로드하고 `initGame()`을 호출해 최초 진입 시
   바로 플레이 가능한 상태로 만든다.
4. 방향키 `keydown` 리스너를 등록하고 `preventDefault()`로 페이지 스크롤을 막는다. 게임오버
   상태에서는 이동을 무시한다.
5. 완료 후 blog 루트에서 `python3 -m http.server 8000`을 백그라운드로 띄우고, 가능하다면(브라우저
   자동화 도구가 연결되어 있다면) `http://localhost:8000/game.html`을 열어 방향키 이동/병합, 점수
   증가, New Game 버튼, 게임오버/승리 오버레이가 실제로 동작하는지 직접 확인한다. 브라우저 자동화가
   불가능하면 최소한 정적 분석(문법 오류 없는지, DOM id 셀렉터가 game.html과 정확히 일치하는지)과
   Node.js 등으로 `slideAndMergeLine`/`move` 핵심 로직만 별도로 간단히 유닛 테스트해 병합 규칙이
   맞는지 검증한다. 서버는 확인 후 종료한다.

## 완료 기준
- 방향키로 타일이 밀리고 같은 값끼리 합쳐진다 (2048 표준 규칙).
- 유효하지 않은 이동(변화 없음)에서는 새 타일이 스폰되지 않는다.
- 점수가 올바르게 누적되고, 최고 점수가 localStorage에 영속되어 새로고침 후에도 유지된다.
- 빈 칸이 없고 인접 병합도 불가능하면 게임오버 오버레이가 뜬다.
- 2048 타일 등장 시 승리 오버레이가 뜨고 "Keep Playing" 선택 시 계속 플레이 가능하다.
- 완료 후 무엇을 테스트했고 결과가 어땠는지 간단히 보고한다 (200단어 이내).
