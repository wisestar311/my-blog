# work-store-1.md — 목록 페이지 서브에이전트 지침

너는 "My Blog" 저장소(`/Users/hyungyukim/My coding/Claude/My blog`)의 온라인 스토어 기능
중 **상품 목록 페이지**를 구현하는 서브에이전트다. 저장소 루트의 `spec.md`를 먼저 전체
읽어라(특히 4.1, 5.1, 5.2 섹션). 0번(기반) 서브에이전트가 이미 `store.html` 스켈레톤,
`css/store.css`, `js/cart-store.js`, `js/products-data.js`, 8개 파일 헤더 nav를 만들어
놓았다 — 그 위에 작업한다.

## 네 작업 범위 (이것만 건드린다)
- **수정**: `store.html` — `<!-- SCREEN CONTENT: store-list -->` 주석을 아래 마크업으로
  교체하고, `<script src="js/store.js" defer></script>` 태그가 이미 있는지 확인(없으면
  cart-store.js 다음, theme.js 이전에 추가).
- **생성**: `js/store.js`

### 절대 건드리지 않는 것
`css/store.css`, `js/cart-store.js`, `js/products-data.js`, 8개 파일의 헤더(`site-header-inner`),
그리고 `product.html`, `cart.html`, `checkout.html`, `js/product.js`, `js/cart.js`,
`js/checkout.js`. store.css에 스타일이 부족해 보여도 직접 고치지 말고, 진짜 문제면 보고에
남겨라.

## 이미 존재한다고 가정할 것 (계약 — 그대로 사용)
- `window.STORE_PRODUCTS`: `[{id, name, category, price, image, description}, ...]` 10개.
- `window.CartStore`: `getCart()`, `getTotalCount()`, `formatPrice(amount)` 등. 목록
  페이지에서는 `getTotalCount()`로 `#store-cart-count` 배지 갱신에만 사용.
- `.store-page`, `.store-topbar`, `.store-cart-count` 등 공통 클래스는 이미 CSS가 있다.

## store.html의 `<!-- SCREEN CONTENT: store-list -->` 자리에 넣을 마크업

```html
<div class="store-list-container">
  <h1 class="store-title">Store</h1>
  <p class="store-hint">카테고리로 필터링하고 가격순으로 정렬해서 상품을 둘러보세요. 상품을 클릭하면 상세 정보를 볼 수 있어요.</p>

  <div class="store-controls">
    <div class="store-filter-group" id="store-filter-group" role="group" aria-label="카테고리 필터">
      <button type="button" class="store-filter-btn is-active" data-category="all">전체</button>
    </div>
    <label class="store-sort-row">
      <span>정렬</span>
      <select class="store-sort-select" id="store-sort-select">
        <option value="default">기본순</option>
        <option value="price-asc">가격 낮은순</option>
        <option value="price-desc">가격 높은순</option>
      </select>
    </label>
  </div>

  <ul class="store-grid" id="store-grid"></ul>
</div>
```

`#store-filter-group` 안의 카테고리 버튼(전체 제외)은 정적으로 넣지 말고 `js/store.js`가
`STORE_PRODUCTS`에서 고유 카테고리를 뽑아 동적으로 추가한다(아래 로직 참고).

## js/store.js 구현 로직

1. DOM 로드 시:
   - `STORE_PRODUCTS`의 고유 `category` 값을 처음 등장 순서대로 뽑아 `#store-filter-group`에
     `전체` 버튼 뒤로 `<button type="button" class="store-filter-btn" data-category="오디오">오디오</button>`
     식으로 추가.
   - `#store-cart-count`를 `CartStore.getTotalCount()`로 채움.
   - 초기 상태(필터 `all`, 정렬 `default`)로 `#store-grid` 렌더링.
2. 필터 버튼 클릭 시: 클릭된 버튼에 `.is-active` 부여하고 나머지 버튼에서 제거, 현재 필터
   상태를 갱신, 재렌더링.
3. `#store-sort-select` change 시: 정렬 상태 갱신, 재렌더링. 필터가 바뀌어도 정렬 상태는
   유지되고, 정렬이 바뀌어도 필터 상태는 유지된다(둘 다 모듈 스코프 변수로 관리).
4. 렌더링 함수:
   - `STORE_PRODUCTS`를 필터(`category === 선택값`, `all`이면 전체) → 정렬(`slice()`로
     복사 후 정렬: `default`=원래 순서, `price-asc`=오름차순, `price-desc`=내림차순) 순으로
     처리.
   - 결과가 0개면 `#store-grid`에 `<li class="state-message">해당 카테고리 상품이 없습니다.</li>`
     하나만 렌더링.
   - 0개가 아니면 각 상품마다 아래 카드 HTML을 만들어 채움(가격은 `CartStore.formatPrice(product.price)`
     사용):

```html
<li class="store-card" data-id="P1" data-category="오디오">
  <a class="store-card-link" href="product.html?id=P1">
    <div class="store-card-image-wrap">
      <img class="store-card-image" src="..." alt="오버이어 헤드폰" loading="lazy">
    </div>
    <div class="store-card-body">
      <span class="store-card-category">오디오</span>
      <h2 class="store-card-name">오버이어 헤드폰</h2>
      <p class="store-card-price">$549.00</p>
    </div>
  </a>
</li>
```

   - `innerHTML`로 조립할 때 상품명/카테고리 등에 특수문자가 없으므로(데이터가 고정) 이스케이프는
     신경쓰지 않아도 되지만, 안전하게 하려면 `textContent` 대입 방식을 써도 된다 — 어느 쪽이든
     결과 마크업 구조만 위와 같으면 된다.

## 완료 후 확인
1. `python3 -m http.server 8000` 로컬 서버에서 `store.html`을 열어 카드 10개가 보이는지,
   카테고리 필터 클릭 시 목록이 바뀌는지, 정렬 select 변경 시 가격 순서가 바뀌는지 직접
   확인(가능하면 브라우저 자동화, 최소한 curl + grep으로 렌더링될 마크업 구조 확인).
2. `#store-cart-count`가 0으로 보이는지(장바구니 비어있는 초기 상태) 확인.
3. 카드 클릭 시 `product.html?id=P1` 같은 링크로 이동하는지 href 확인(product.html 자체는
   아직 placeholder 상태일 수 있음 — 그건 정상).

작업이 끝나면: 구현 요약, 확인 결과, 발견된 이슈(있다면)를 3~5문장으로 보고하라.
