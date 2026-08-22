# 작업 지침 — 서브에이전트 B (캔버스 로직)

이 문서는 "/Users/hyungyukim/My coding/Claude/My blog/spec.md"의 픽셀 아트 에디터 기능 계획 중
너의 담당 범위만 정리한 지침이다. 반드시 spec.md 전체(특히 섹션 3, 5, 6, 7)를 먼저 읽고,
아래 "서브에이전트 A가 확정한 DOM 계약"도 반드시 읽은 뒤 시작할 것.

## 범위 (이 파일에 명시된 것만 수정/생성한다)
- 신규 생성: `js/pixel-art.js` (전체)
- 그 외 파일은 절대 건드리지 않는다. `pixel-art.html`, `css/pixel-art.css`, `index.html`,
  `post.html`, `game.html`은 이미 완성되어 있고 수정 대상이 아니다.

## 서브에이전트 A가 확정한 DOM 계약 (그대로 따를 것)
```
main.pixel-art-page
  a.back-link
  div.pixel-art-container
    h1.pixel-art-title
    div.pixel-art-workspace          (flexbox, grid 아님)
      div.canvas-wrap                (position: relative)
        canvas#pixel-canvas[width=512 height=512]
      aside.pixel-art-sidebar
        div.palette#palette          (비어 있음 — JS가 채운다)
        label.custom-color-row
          input#custom-color-picker[type=color]
        div.pixel-art-toolbar
          button#clear-btn.new-game-btn
          button#save-btn.new-game-btn
```
- `#palette`는 빈 컨테이너다. `PALETTE_COLORS`(spec.md 섹션 7) 배열을 순회하며
  `<button class="palette-swatch" data-color="#hex" style="background:#hex">`를 동적으로
  append하고, 마지막에 지우개용 `<button class="palette-swatch palette-swatch-eraser"
  data-color="">`(체커보드 배경은 이미 CSS로 처리되어 있으므로 inline style 불필요)를 추가한다.
- 선택된 스와치는 `.selected` 클래스로 표시(CSS는 이미 A가 정의해뒀음 — 클래스만 토글하면 된다).
- `#custom-color-picker`(`input[type=color]`)의 `input` 이벤트로 커스텀 색을 선택하면 프리셋
  스와치의 `.selected`는 모두 해제한다.
- `#pixel-canvas`는 `width="512" height="512"` 내부 해상도를 가진 `<canvas>`. CSS로 화면 표시
  크기가 줄어들 수 있으므로(반응형), 클릭 좌표 계산 시 `getBoundingClientRect()` 기반 스케일
  보정이 반드시 필요하다(spec.md 5장 코드 그대로).
- `#clear-btn` 클릭 시 전체 grid를 비우고(모두 `null`) 캔버스를 다시 그린다.
- `#save-btn` 클릭 시 PNG 내보내기 실행(spec.md 6장).

## 해야 할 일
1. spec.md 섹션 3(데이터 모델), 5(그리기 인터랙션 — Pointer Events), 6(PNG 내보내기), 7(팔레트)을
   그대로 `js/pixel-art.js`에 구현한다. 함수명도 spec.md에 나온 이름(`paintAtEvent`, `paintCell`,
   `drawCell`, `exportPNG` 등)을 최대한 그대로 사용해 spec.md와 코드가 대응되게 한다.
2. 캔버스 렌더링: 초기 로드 시 16x16 전체를 순회하며 빈 칸은 `--color-bg-elevated`
   (getComputedStyle로 읽은 값)로, 칠해진 칸은 해당 색으로 `fillRect` — 격자 구분을 위해 각 칸
   사이에 얇은 `--color-border` 색 그리드 라인을 그리는 것을 권장(선택사항, spec에 없지만 UX상
   자연스러움. 넣는다면 `drawCell`/전체 렌더 함수 모두에서 일관되게 처리).
3. `paintCell(row, col)`은 `grid[row][col] = selectedColor`로 상태를 갱신하고 해당 1칸만
   다시 그린다(`drawCell(row, col)`). 지우개 선택 시 `selectedColor`가 `null`이므로 자동으로
   지우기가 된다(별도 분기 불필요, spec.md 3장 참고).
4. Pointer Events(`pointerdown`/`pointermove`/`pointerup`/`pointercancel`)를 spec.md 5장 코드
   그대로 구현한다. `setPointerCapture`, `e.buttons & 1` 안전장치를 빠뜨리지 않는다.
5. PNG 내보내기(`exportPNG`)는 spec.md 6장 코드 그대로: 별도 오프스크린 캔버스를 새로 만들어
   빈 칸은 `fillRect`를 생략(투명 유지)하고 칠해진 칸만 그린 뒤 `toBlob` → `URL.createObjectURL`
   → 임시 `<a download="pixel-art.png">` 클릭 → cleanup. 화면에 보이는 `#pixel-canvas`를 그대로
   내보내지 않는다(빈 칸이 `--color-bg-elevated`로 채워져 있어 배경이 투명하지 않게 찍히기 때문).
6. Clear 버튼: `grid`를 전부 `null`로 리셋하고 캔버스 전체를 다시 그린다.
7. 팔레트/커스텀 색상 피커 바인딩(위 DOM 계약 섹션 참고). 페이지 로드 시 기본 선택 색은
   `PALETTE_COLORS[0]`이고 해당 스와치에 `.selected`가 미리 붙어있어야 한다.
8. 완료 후 blog 루트에서 `python3 -m http.server 8000`을 백그라운드로 띄우고, 가능하다면(브라우저
   자동화 도구가 연결되어 있다면) `http://localhost:8000/pixel-art.html`을 열어 다음을 직접
   확인한다:
   - 캔버스 클릭 시 해당 칸이 선택된 색으로 칠해지는지
   - 드래그 시 여러 칸이 연속으로 칠해지는지
   - 팔레트 스와치 클릭으로 색이 바뀌는지, 지우개로 칠한 칸을 지울 수 있는지
   - 커스텀 색상 피커로 고른 색이 실제로 칠해지는지
   - Clear 버튼으로 전체가 비워지는지
   - Save PNG 버튼 클릭 시 다운로드가 발생하는지(가능하면 다운로드된 파일을 확인해 16x16 도트가
     올바른 위치/색으로 512x512 캔버스에 찍혀 있고 빈 칸은 투명인지 검증)
   브라우저 자동화가 불가능하면 최소한 정적 분석(문법 오류 없는지, DOM id 셀렉터가
   pixel-art.html과 정확히 일치하는지)을 수행하고, 그 사실을 보고에 명시한다. 서버는 확인 후
   종료한다.

## 완료 기준
- 클릭/드래그로 정확한 칸에 정확한 색이 칠해진다.
- 팔레트 선택, 지우개, 커스텀 색상 피커가 모두 `selectedColor`를 올바르게 갱신한다.
- Clear가 전체를 비운다.
- Save PNG가 16x16 도트를 정확한 위치/색으로, 빈 칸은 투명으로 포함한 PNG를 다운로드한다.
- 완료 후 무엇을 테스트했고 결과가 어땠는지 간단히 보고한다 (200단어 이내).
