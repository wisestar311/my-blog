# work-store-3.md — 장바구니 페이지 서브에이전트 지침

너는 "My Blog" 저장소(`/Users/hyungyukim/My coding/Claude/My blog`)의 온라인 스토어 기능
중 **장바구니 페이지**를 구현하는 서브에이전트다. 저장소 루트의 `spec.md`를 먼저 전체
읽어라(특히 4.3, 5.4 섹션). 0번(기반) 서브에이전트가 이미 `cart.html` 스켈레톤,
`css/store.css`, `js/cart-store.js`, `js/products-data.js`, 8개 파일 헤더 nav를 만들어
놓았다 — 그 위에 작업한다.

## 네 작업 범위 (이것만 건드린다)
- **수정**: `cart.html` — `<!-- SCREEN CONTENT: cart -->` 주석을 아래 마크업으로 교체하고,
  `<script src="js/cart.js" defer></script>` 태그가 이미 있는지 확인(없으면 cart-store.js
  다음, theme.js 이전에 추가).
- **생성**: `js/cart.js`

### 절대 건드리지 않는 것
`css/store.css`, `js/cart-store.js`, `js/products-data.js`, 8개 파일의 헤더, 그리고
`store.html`, `product.html`, `checkout.html`, `js/store.js`, `js/product.js`,
`js/checkout.js`.

## 이미 존재한다고 가정할 것 (계약 — 그대로 사용)
- `window.CartStore`: `getCart()`(스냅샷 배열 `{id,name,price,image,qty}` 반환),
  `updateQty(id, qty)`(qty<=0이면 자동 제거), `removeItem(id)`, `getTotalCount()`,
  `getTotalPrice()`, `formatPrice(amount)`.
- 장바구니는 담을 당시 스냅샷(이름/가격/이미지 포함)이라 `STORE_PRODUCTS` 없이도 렌더링
  가능하다(그래도 `products-data.js`는 로드되어 있어도 무방, 사용 안 해도 됨).

## cart.html의 `<!-- SCREEN CONTENT: cart -->` 자리에 넣을 마크업

```html
<div class="cart-page-container">
  <h1 class="store-title">장바구니</h1>
  <p class="store-hint">수량을 바꾸거나 삭제할 수 있어요. 합계를 확인한 뒤 결제하기를 눌러주세요.</p>

  <p id="cart-empty-state" class="state-message" hidden>장바구니가 비어 있습니다. <a href="store.html">쇼핑 계속하기</a></p>

  <ul class="cart-list" id="cart-list"></ul>

  <div class="cart-summary" id="cart-summary" hidden>
    <div class="cart-summary-row">
      <span>합계</span>
      <span class="cart-summary-total" id="cart-total">$0.00</span>
    </div>
    <a href="checkout.html" class="store-btn store-btn-primary cart-checkout-link" id="checkout-link">결제하기</a>
  </div>
</div>
```

## js/cart.js 구현 로직

1. `render()` 함수를 만들어 페이지 로드 시와 모든 변경(수량 변경/삭제) 후에 호출:
   - `CartStore.getCart()`로 현재 장바구니를 가져온다.
   - 비어있으면: `#cart-list`를 비우고, `#cart-empty-state`의 `hidden` 제거,
     `#cart-summary`는 `hidden` 유지.
   - 비어있지 않으면: `#cart-empty-state`에 `hidden` 부여, `#cart-summary`의 `hidden` 제거,
     각 아이템마다 아래 `<li>` 렌더링, `#cart-total`을 `CartStore.formatPrice(CartStore.getTotalPrice())`로 갱신.
   - 매번 `#store-cart-count`도 `CartStore.getTotalCount()`로 갱신.

```html
<li class="cart-item" data-id="P1">
  <img class="cart-item-image" src="..." alt="상품명">
  <div class="cart-item-info">
    <h2 class="cart-item-name">상품명</h2>
    <p class="cart-item-price">$549.00</p>
  </div>
  <div class="cart-item-qty-row">
    <button type="button" class="qty-btn cart-qty-decrease" aria-label="수량 감소">&minus;</button>
    <span class="qty-value cart-qty-value">2</span>
    <button type="button" class="qty-btn cart-qty-increase" aria-label="수량 증가">+</button>
  </div>
  <p class="cart-item-subtotal">$1098.00</p>
  <button type="button" class="cart-item-remove" aria-label="상품명 삭제">삭제</button>
</li>
```
   - `cart-item-subtotal`은 `CartStore.formatPrice(item.price * item.qty)`.
   - `aria-label`은 실제 상품명을 넣는다(`"오버이어 헤드폰 삭제"` 등).

2. 이벤트는 `#cart-list`에 이벤트 위임(click)으로 처리하고 `closest('.cart-item')`로
   `data-id`를 얻는다:
   - `.cart-qty-increase` 클릭: `CartStore.updateQty(id, 현재qty + 1)` → `render()`.
   - `.cart-qty-decrease` 클릭: `CartStore.updateQty(id, 현재qty - 1)`(0 이하가 되면
     `updateQty`가 알아서 제거함) → `render()`.
   - `.cart-item-remove` 클릭: `CartStore.removeItem(id)` → `render()`.
   - 현재 qty는 `CartStore.getCart()`에서 다시 조회하거나 클릭된 요소의 `.cart-qty-value`
     텍스트로 읽어도 된다(재조회 쪽이 더 안전, 권장).

## 완료 후 확인
1. `python3 -m http.server 8000`에서 장바구니가 비어있을 때 empty state가 보이는지,
   `product.html`에서 상품을 담은 뒤 `cart.html`로 이동하면 아이템이 보이는지 확인.
2. 수량 +/- 클릭 시 소계와 합계가 즉시 재계산되는지, 수량을 0까지 내리면 아이템이 사라지고
   장바구니가 비면 empty state로 전환되는지 확인.
3. 삭제 버튼 클릭 시 해당 아이템만 제거되고 나머지는 유지되는지, 헤더 배지(`#store-cart-count`)가
   매번 정확히 갱신되는지 확인(가능하면 브라우저 자동화, 최소한 로직 재검토 + localStorage
   값 수동 세팅 후 페이지 로드 테스트).

작업이 끝나면: 구현 요약, 확인 결과, 발견된 이슈(있다면)를 3~5문장으로 보고하라.
