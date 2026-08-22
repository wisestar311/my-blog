# review.md — Store 기능 통합 검증 (Review 단계)

Plan → Work → **Review** → Commit 사이클의 Review 단계 산출물. 이전 5개 Work
서브에이전트(0: 기반, 1: 목록, 2: 상세, 3: 장바구니, 4: 결제)의 산출물이 하나로
합쳐졌을 때 실제로 잘 맞물리는지를 중심으로 검증했다.

## 테스트 방법

- **브라우저 자동화**: `mcp__claude-in-chrome__tabs_context_mcp`(`createIfEmpty: true`)를
  시도했으나 "Browser extension is not connected" 응답. 이전 서브에이전트들이 보고한 대로
  이 환경에서는 Chrome 확장 연결이 불가능함을 재확인했다. **실제 클릭 기반의 브라우저
  검증(다크모드 토글 포함)은 수행하지 못했다** — 이는 이 review의 명확한 한계다.
- **정적 서버 + curl**: `python3 -m http.server 8792`로 저장소를 서빙하고, 4개 신규
  페이지(쿼리스트링 포함 `product.html?id=P1`, `product.html?id=BAD` 케이스 포함)와
  `css/store.css`, 6개 신규 `js/*.js` 파일 전부 200 응답 확인.
- **Node 통합 시뮬레이션**: `js/products-data.js` + `js/cart-store.js`를 Node `vm` 모듈로
  격리된 컨텍스트에 로드하고, 공유 객체를 실제 브라우저의 localStorage처럼 사용해 여러
  "페이지 로드"(각각 새 vm 컨텍스트)에 걸쳐 다음 시나리오를 하나로 이어서 검증:
  1. (product.html 컨텍스트) P1×2 담기 → P4×1 담기 → P1 재담기(+1) → 같은 상품은 신규 행이
     아니라 qty 누적(3)되는지
  2. (cart.html 컨텍스트, 새 vm) 같은 localStorage에서 정확히 그 상태를 읽어내는지 →
     `updateQty`로 P4 증가(2) → P1을 0까지 감소시켜 자동 삭제되는지 → `getTotalPrice`
     재계산이 맞는지
  3. (checkout.html 컨텍스트, 새 vm) 같은 장바구니를 읽어 합계를 clearCart **이전에** 변수로
     캡처 → clearCart 후 합계가 0이 되는지
  4. (cart.html 재오픈, 새 vm) 장바구니/배지가 0으로 보이는지
  5. localStorage 값이 깨진 JSON / 배열이 아닌 JSON일 때 예외 없이 `[]`로 폴백하는지
  결과: **전부 통과** (스크립트와 실행 로그는 스크래치패드에 보관, 결론만 기록).
- 정적 코드 대조(grep/Read)로 나머지 체크리스트 항목(헤더 nav, CSS 커버리지, toast 코드,
  정규식, try/catch, aria-label, 사용법 문구, node --check) 확인.

## 체크리스트 결과

| # | 항목 | 결과 |
|---|---|---|
| 1 | 헤더 nav byte-identical (8개 파일) | **통과** — `site-header-inner`부터 `</header>`까지 8개 파일 전부 동일 (Store 링크 포함) |
| 2 | 전체 플로우 연결(목록→상세→담기→장바구니→결제→클리어) | **통과** — Node 통합 시뮬레이션으로 localStorage 데이터가 컨텍스트(=페이지) 경계를 넘어 정확히 이어짐을 확인. addItem 누적, updateQty 0=삭제, getTotalPrice, clearCart 전후 합계 캡처 순서 모두 spec대로 동작 |
| 3 | CSS 커버리지 | **통과** — 4개 페이지 HTML + 4개 페이지 JS가 사용하는 모든 클래스를 `class=` 문자열 grep으로 추출해 `css/store.css` 정의와 대조. store.css에 없는 것은 전부 `css/style.css`가 이미 정의한 공용 클래스(`back-link`, `site-*`, `state-message`, `theme-toggle`)이거나 `.qty-btn`/`.qty-value` 베이스 클래스에 결합되는 수식자 클래스(`.cart-qty-increase` 등)로, 누락 아님 |
| 4 | `.store-grid` 자식에 `position:absolute` 금지 | **통과** — `css/store.css`에서 `position:`은 `.store-topbar-link`(relative)와 `.store-toast`(fixed, 그리드 밖 별도 요소) 두 곳뿐. `.store-card`류에 absolute 없음 |
| 5 | toast race condition 수정 확인 | **통과** — `js/product.js`의 `showToast()`가 실제로 매 호출 시작 시 이전 `toastHideTimer`/`toastFinalizeTimer`를 `clearTimeout`하고 이전 `transitionend` 리스너를 `removeEventListener`한 뒤 새로 시작함을 코드로 확인. `transitionend` 미발생 대비 300ms 폴백 타이머도 있어 연속 클릭 시 토스트가 중간에 사라지거나 멈추지 않음 |
| 6 | 결제 폼 검증 정규식 | **통과** — `js/checkout.js`의 우편번호(`/^\d{5}$/`), 카드번호(`/^\d{13,19}$/`, 공백 제거 후), 유효기간(`/^(0[1-9]|1[0-2])\/\d{2}$/`), CVC(`/^\d{3,4}$/`) 전부 spec.md 5.5 표와 정확히 일치. 이름/주소도 trim 후 1자 이상 규칙 일치 |
| 7 | localStorage try/catch | **통과** — `js/cart-store.js`의 `readCart`/`writeCart` 모두 try/catch로 감싸져 있고, 파싱 실패·비배열 값 모두 `[]`로 폴백(Node 시뮬레이션으로 실제 동작도 재확인) |
| 8 | 접근성 기초 | **통과** — 수량 버튼(`aria-label="수량 감소/증가"`), 카트 삭제 버튼(`aria-label="{상품명} 삭제"`), 카테고리 필터 그룹(`role="group" aria-label="카테고리 필터"`), 결제 폼 전 필드가 `<label>`로 감싸짐, 헤더 배지(`aria-label="장바구니 담긴 수량"`) 모두 확인 |
| 9 | `.store-hint` 문구 일치 | **통과** — 4개 페이지(정적 3개 + product.js가 주입하는 1개) 전부 spec.md 8번 섹션 문구와 완전히 일치 |
| 10 | `node --check` 문법 검사 | **통과** — `cart-store.js`, `products-data.js`, `store.js`, `product.js`, `cart.js`, `checkout.js` 전부 오류 없음 |

## 직접 고친 버그

1. **`checkout.html`의 스켈레톤 잔여 주석 제거** — `<!-- SCREEN CONTENT: checkout -->` 주석이
   4번 서브에이전트 작업 후에도 지워지지 않고 남아 있었음(다른 3개 페이지에는 없음). 기능에
   영향은 없는 순수 잔여물이지만 스켈레톤 placeholder가 최종 산출물에 남아있으면 안 되므로
   제거. `checkout.html` 37번째 줄 삭제.

그 외에는 구조적 버그, id/class 불일치, 잘못된 스크립트 순서를 발견하지 못했다.

## 고치지 않고 남겨둔 이슈 (판단 필요)

- **비-defer 인라인 스크립트가 defer 스크립트보다 먼저 실행됨**: 4개 페이지 모두
  `<script src="js/xxx.js" defer></script>` 다음에 `<script>BlogTheme.initThemeToggle(...)</script>`
  (인라인, defer 없음)가 온다. HTML 파싱 규칙상 defer 스크립트는 문서 파싱이 끝난 뒤
  실행되고, src 없는 인라인 스크립트는 만나는 즉시(동기) 실행되므로, 실제 실행 순서는
  소스상 순서와 반대로 `BlogTheme.initThemeToggle`이 `store.js`/`product.js`/`cart.js`/
  `checkout.js`보다 먼저 실행된다. 이번 기능에서는 테마 토글과 카트/스토어 로직이 서로
  의존하지 않아 실제 동작에 문제를 일으키지는 않지만, 기존 `game.html`/`pixel-art.html`에서도
  동일한 패턴을 그대로 물려받은 것으로 보여 스토어 기능만의 버그는 아니다. 스토어 4개 파일
  범위를 벗어나는 전역 컨벤션 문제이므로 직접 고치지 않고 기록만 남긴다.
- **브라우저 실제 렌더링/다크모드 토글/실제 클릭 인터랙션 미검증**: Chrome 확장 미연결로
  인해 실제 화면에서 카드 hover, 토스트 트랜지션 애니메이션, 다크모드 전환 시 레이아웃 유지
  여부, 반응형 브레이크포인트(768px) 실제 렌더링은 코드 대조로만 확인했고 스크린샷/픽셀
  단위 검증은 하지 못했다. 이 환경의 구조적 한계이며, 추후 Chrome 확장이 연결되는 환경에서
  1회 재검증을 권장한다(코드상으로는 CSS 변수만 사용해 라이트/다크 자동 대응하도록 되어
  있어 위험도는 낮다고 판단).

## 최종 결론

체크리스트 10개 항목 전부 통과, 발견한 유일한 실물 버그는 잔여 주석 1건으로 직접 수정
완료했다. Node 기반 통합 시뮬레이션으로 5개 서브에이전트의 산출물이 localStorage를 매개로
정확히 연결됨(담기 → 수량변경/삭제 → 합계 → 결제완료 → 초기화까지 체인 전체)을 확인했고,
헤더 nav byte-identical, CSS 전체 클래스 커버리지, 알려진 버그 클래스(그리드+absolute) 회피,
toast race condition 수정, 폼 검증 정규식, localStorage 방어, 접근성 기초, 사용법 문구까지
모두 spec.md와 일치한다.

**이 기능은 커밋해도 되는 상태다.** 다만 위 "고치지 않고 남겨둔 이슈" 중 실제 브라우저
검증 공백은 구조적 한계로 남아있음을 커밋 메시지나 후속 작업 메모에 남겨두는 것을 권장한다.
