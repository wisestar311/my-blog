# work-store-0.md — 기반(Foundation) 서브에이전트 지침

너는 "My Blog" 정적 블로그 저장소(`/Users/hyungyukim/My coding/Claude/My blog`)에 온라인
스토어 기능을 추가하는 Work 단계의 0번(기반) 서브에이전트다. 저장소 루트의 `spec.md`를
반드시 먼저 전체 읽고 시작하라 — 이 파일은 그 요약이며 spec.md가 원본이다.

## 네 작업 범위 (이것만 건드린다)

### 새로 만드는 파일
- `css/store.css` — 4개 스토어 페이지가 공유하는 스타일시트. **`css/style.css`의 CSS
  변수만 참조**하고 새 색상 토큰을 만들지 마라(`--color-bg`, `--color-bg-elevated`,
  `--color-text`, `--color-text-secondary`, `--color-border`, `--accent`, `--glow-sm`,
  `--glow-lg`, `--font-mono`, `--font-sans`). `.store-btn`, `.store-btn-primary` 등 자체
  버튼 클래스를 직접 정의해라(다른 feature css에 의존하지 말 것 — pixel-art.html이
  `.new-game-btn`을 쓰지만 pixel-art.css엔 정의가 없어 깨지는 기존 버그 사례가 있다).
  아래 "DOM 계약"에 나오는 모든 클래스에 대해 최소한의 스타일을 정의해야 한다(카드, 그리드,
  필터 버튼, 정렬 select, 토스트, 상세 페이지, 장바구니 아이템, 체크아웃 폼 등 전부).
  Apple Store 느낌: 넉넉한 여백, 큰 타이포, 미니멀한 보더, 은은한 hover glow.
- `js/cart-store.js` — 장바구니 상태 관리 공용 모듈. DOM을 절대 건드리지 않는 순수 로직
  모듈이다. `window.CartStore` 객체에 아래 함수들을 정의:
  - `CartStore.getCart()` → localStorage 키 `"storeCart"`를 `JSON.parse`, 배열이 아니거나
    파싱 실패 시 `[]` 반환(throw 금지, `try/catch`로 감싸고 실패 시 `console.warn`).
  - `CartStore.addItem(product, qty)` → `product`는 `{id, name, price, image}` 최소 포함
    객체. 이미 같은 id가 있으면 qty를 더하고, 없으면 `{id, name, price, image, qty}`로
    새로 추가. 저장 후 localStorage에 씀(쓰기도 `try/catch`).
  - `CartStore.updateQty(id, qty)` → `qty <= 0`이면 해당 아이템 제거, 아니면 qty 갱신.
  - `CartStore.removeItem(id)` → 해당 id 아이템 제거.
  - `CartStore.clearCart()` → 장바구니 비움.
  - `CartStore.getTotalCount()` → 전체 아이템의 qty 합(숫자).
  - `CartStore.getTotalPrice()` → 전체 `price * qty`의 합(숫자).
  - `CartStore.formatPrice(amount)` → `"$" + amount.toFixed(2)` 문자열. 모든 페이지가
    가격 표시에 이 함수를 재사용해야 하므로 정확히 이 포맷을 지켜라.
- `js/products-data.js` — 아래 "상품 데이터" 섹션의 10개 상품 객체를 `window.STORE_PRODUCTS`
  배열로 그대로 정의.
- `store.html`, `product.html`, `cart.html`, `checkout.html` — 4개 파일 전체를
  `<!DOCTYPE html>`부터 `</html>`까지 새로 생성한다. 각 파일은:
  - `<head>`: 기존 페이지(`game.html`, `pixel-art.html`)와 동일한 meta 구성 + `css/style.css`
    + `css/store.css` 링크. `<title>`은 페이지에 맞게(예: "Store — My Blog").
  - `<body>`: 기존 페이지와 **byte-identical한 공용 헤더**(`site-header-inner`, 아래 "헤더
    nav" 섹션 참고)를 포함.
  - 헤더 다음에 `<main class="store-page">` 열고, 그 안에 아래 "공통 main 구조"를 넣은 뒤,
    페이지 고유 콘텐츠 자리에는 정확히 이 형태의 주석 placeholder만 남겨라(1~4번 서브에이전트가
    나중에 교체한다):
    - `store.html` → `<!-- SCREEN CONTENT: store-list -->`
    - `product.html` → `<!-- SCREEN CONTENT: product-detail -->`
    - `cart.html` → `<!-- SCREEN CONTENT: cart -->`
    - `checkout.html` → `<!-- SCREEN CONTENT: checkout -->`
  - `</body>` 직전 스크립트 순서: `js/products-data.js`(product/store/cart/checkout 전부
    포함시켜도 무방 — cart-store.js보다 먼저) → `js/cart-store.js` → 페이지별 스크립트
    태그를 미리 적어둬라(파일이 아직 없어도 됨, 예: `<script src="js/store.js" defer></script>`)
    → `js/theme.js` → `<script>BlogTheme.initThemeToggle("theme-toggle");</script>`.

### 수정하는 파일 (헤더 nav에 "Store" 링크 추가만)
- `index.html`, `post.html`, `game.html`, `pixel-art.html`

이 4개 파일의 `<nav class="site-nav">` 블록을 찾아 `Pixel Art` 링크 바로 뒤에
`<a class="site-nav-link" href="store.html">Store</a>`를 추가해서 아래 "헤더 nav" 블록과
정확히 같게 만들어라. 헤더의 다른 부분은 절대 건드리지 마라.

### 절대 건드리지 않는 것
- `js/store.js`, `js/product.js`, `js/cart.js`, `js/checkout.js` — 이 4개 파일은 만들지
  마라(1~4번 서브에이전트가 만든다). `<script>` 태그로 경로만 미리 참조해두는 것은 된다.
- 페이지 고유 콘텐츠(목록 그리드, 상세 정보, 장바구니 목록, 체크아웃 폼)를 직접 만들지 마라 —
  placeholder 주석만 남긴다.

## 헤더 nav (8개 파일 모두 byte-identical해야 함)

```html
<div class="site-header-inner">
  <a class="site-title" href="index.html">My Blog</a>
  <nav class="site-nav">
    <a class="site-nav-link" href="game.html">2048</a>
    <a class="site-nav-link" href="pixel-art.html">Pixel Art</a>
    <a class="site-nav-link" href="store.html">Store</a>
  </nav>
  <button id="theme-toggle" class="theme-toggle" aria-label="다크 모드 전환"></button>
</div>
```

이 블록을 `index.html`, `post.html`, `game.html`, `pixel-art.html`, `store.html`,
`product.html`, `cart.html`, `checkout.html` 8개 파일 전부에 문자 그대로 동일하게 넣어라.
끝나면 `grep -A6 'site-header-inner' *.html`로 8개 파일 모두 동일한지 직접 diff 대조하라.

## 공통 main 구조 (4개 스토어 페이지 전부, 헤더 바로 다음)

```html
<main class="store-page">
  <a class="back-link" href="index.html">&larr; 목록으로</a>

  <div class="store-topbar">
    <a href="store.html" class="store-topbar-brand">Store</a>
    <nav class="store-topbar-nav">
      <a href="store.html" class="store-topbar-link">상품</a>
      <a href="cart.html" class="store-topbar-link" id="store-cart-link">
        장바구니<span class="store-cart-count" id="store-cart-count" aria-label="장바구니 담긴 수량">0</span>
      </a>
    </nav>
  </div>

  <!-- SCREEN CONTENT: <페이지별 위 표시대로> -->
</main>
```

`#store-cart-count`는 각 페이지의 JS가 로드 시 `CartStore.getTotalCount()`로 채운다(너는
값 0을 정적으로 넣어두기만 하면 된다 — 실제 갱신은 페이지별 서브에이전트가 담당).

## 상품 데이터 (`js/products-data.js`에 그대로 사용)

```js
window.STORE_PRODUCTS = [
  { id: "P1", name: "오버이어 헤드폰", category: "오디오", price: 549.00, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80", description: "몰입감 있는 액티브 노이즈 캔슬링과 최대 20시간 재생을 지원하는 오버이어 헤드폰." },
  { id: "P2", name: "미니멀 스마트워치", category: "웨어러블", price: 399.00, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80", description: "심박수와 활동량을 추적하는 알루미늄 케이스 스마트워치." },
  { id: "P3", name: "울트라씬 노트북", category: "컴퓨터", price: 1299.00, image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80", description: "무게 1.1kg, 두께 12mm의 올데이 배터리 울트라씬 노트북." },
  { id: "P4", name: "무선 블루투스 스피커", category: "오디오", price: 249.00, image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80", description: "360도 사운드와 방수 설계를 갖춘 휴대용 무선 스피커." },
  { id: "P5", name: "기계식 키보드", category: "액세서리", price: 179.00, image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80", description: "저소음 스위치와 알루미늄 상판을 적용한 기계식 키보드." },
  { id: "P6", name: "무선 마우스", category: "액세서리", price: 99.00, image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80", description: "정밀한 트래킹과 인체공학적 그립의 무선 마우스." },
  { id: "P7", name: "미러리스 카메라", category: "카메라", price: 899.00, image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&q=80", description: "풀프레임 감성의 센서를 탑재한 컴팩트 미러리스 카메라." },
  { id: "P8", name: "미니멀 스니커즈", category: "라이프스타일", price: 129.00, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80", description: "깔끔한 실루엣의 데일리 미니멀 스니커즈." },
  { id: "P9", name: "가죽 백팩", category: "라이프스타일", price: 219.00, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80", description: "노트북 수납이 가능한 풀그레인 가죽 백팩." },
  { id: "P10", name: "클래식 선글라스", category: "라이프스타일", price: 159.00, image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80", description: "UV400 렌즈를 적용한 클래식 아세테이트 선글라스." }
];
```

## DOM 계약 (전체 — CSS 작성 시 이 클래스들 전부 스타일링 대상으로 삼을 것)

목록(`store.html`): `.store-list-container`, `.store-title`, `.store-hint`, `.store-controls`,
`.store-filter-group`, `.store-filter-btn`(`.is-active` 상태 포함), `.store-sort-row`,
`.store-sort-select`, `.store-grid`(display:grid), `.store-card`, `.store-card-link`,
`.store-card-image-wrap`, `.store-card-image`, `.store-card-body`, `.store-card-category`,
`.store-card-name`, `.store-card-price`, `.state-message`(기존 style.css 클래스 재사용 —
store.css에서 재정의하지 마라, 이미 정의되어 있음).

**주의(중요 버그 회피)**: `.store-grid`가 `display: grid`이므로 자식 `.store-card`에는
`position: absolute`를 걸지 마라. 배지/오버레이가 필요하면 `.store-card` 내부에
`position: relative` 래퍼를 추가로 둬라(2048에서 실제로 겪은 버그).

상세(`product.html`): `.product-detail`, `.product-detail-media`, `.product-detail-image`,
`.product-detail-info`, `.product-detail-category`, `.product-detail-name`,
`.product-detail-price`, `.product-detail-description`, `.product-detail-qty-row`,
`.qty-btn`, `.qty-value`, `.store-btn`, `.store-btn-primary`, `.store-toast`(hidden 속성과
`.is-visible` 클래스 둘 다 스타일링 — 기본은 화면 밖/투명, `.is-visible`이면 보이도록
transition 정의).

장바구니(`cart.html`): `.cart-page-container`, `.cart-list`, `.cart-item`,
`.cart-item-image`, `.cart-item-info`, `.cart-item-name`, `.cart-item-price`,
`.cart-item-qty-row`, `.qty-btn`(재사용), `.qty-value`(재사용), `.cart-item-subtotal`,
`.cart-item-remove`, `.cart-summary`, `.cart-summary-row`, `.cart-summary-total`,
`.cart-checkout-link`.

결제(`checkout.html`): `.checkout-container`, `.checkout-form`, `.checkout-fieldset`,
`.checkout-field`, `.checkout-field-row`, `.checkout-error`, `.has-error`(input에 붙는 에러
상태 클래스 — 테두리를 `--accent`로 두껍게), `.checkout-summary`, `.checkout-summary-row`,
`.checkout-complete`.

공통: `.back-link`, `.store-topbar`, `.store-topbar-brand`, `.store-topbar-nav`,
`.store-topbar-link`, `.store-cart-count`.

## 사용법 안내 문구 (각 페이지의 SCREEN CONTENT 영역에 이후 서브에이전트가 넣을 예정이지만,
너는 미리 알아두고 `.store-hint` 클래스를 스타일링해둬라 — `color: var(--color-text-secondary)`,
적절한 여백. `.game-hint`/`.pixel-art-hint` 스타일 참고)

## 완료 후 확인
1. `grep -A6 'site-header-inner' index.html post.html game.html pixel-art.html store.html product.html cart.html checkout.html`로 8개 파일 헤더가 완전히 동일한지 눈으로 diff 대조.
2. `python3 -m http.server 8000`으로 로컬 서버 띄우고 4개 신규 페이지가 200으로 뜨는지, 헤더/토대 레이아웃이 깨지지 않는지 curl 또는 가능하면 브라우저로 확인.
3. `js/cart-store.js`를 브라우저 콘솔이나 node로 간단히 로직 검증(예: addItem 두 번 호출 시 qty 누적되는지).

작업이 끝나면: 만든 파일 목록, 8개 헤더 diff 결과, 로컬 서버 확인 결과를 3~5문장으로 보고하라.
