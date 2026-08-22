# work-store-4.md — 결제 페이지 서브에이전트 지침

너는 "My Blog" 저장소(`/Users/hyungyukim/My coding/Claude/My blog`)의 온라인 스토어 기능
중 **결제 페이지**를 구현하는 서브에이전트다. 저장소 루트의 `spec.md`를 먼저 전체 읽어라
(특히 4.4, 5.5 섹션). 0번(기반) 서브에이전트가 이미 `checkout.html` 스켈레톤,
`css/store.css`, `js/cart-store.js`, `js/products-data.js`, 8개 파일 헤더 nav를 만들어
놓았다 — 그 위에 작업한다. 실제 결제 게이트웨이 연동은 하지 않는다 — 전부 클라이언트
사이드 검증 + 목업이다.

## 네 작업 범위 (이것만 건드린다)
- **수정**: `checkout.html` — `<!-- SCREEN CONTENT: checkout -->` 주석을 아래 마크업으로
  교체하고, `<script src="js/checkout.js" defer></script>` 태그가 이미 있는지 확인(없으면
  cart-store.js 다음, theme.js 이전에 추가).
- **생성**: `js/checkout.js`

### 절대 건드리지 않는 것
`css/store.css`, `js/cart-store.js`, `js/products-data.js`, 8개 파일의 헤더, 그리고
`store.html`, `product.html`, `cart.html`, `js/store.js`, `js/product.js`, `js/cart.js`.

## 이미 존재한다고 가정할 것 (계약 — 그대로 사용)
- `window.CartStore`: `getCart()`, `getTotalPrice()`, `clearCart()`, `getTotalCount()`,
  `formatPrice(amount)`.

## checkout.html의 `<!-- SCREEN CONTENT: checkout -->` 자리에 넣을 마크업

```html
<div class="checkout-container" id="checkout-form-view">
  <h1 class="store-title">결제</h1>
  <p class="store-hint">배송지와 결제 정보를 입력하세요. 실제 결제는 이뤄지지 않는 프론트엔드 데모입니다.</p>

  <p id="checkout-empty-state" class="state-message" hidden>장바구니가 비어 있어 결제를 진행할 수 없습니다. <a href="store.html">쇼핑하러 가기</a></p>

  <form id="checkout-form" class="checkout-form" novalidate>
    <fieldset class="checkout-fieldset">
      <legend>배송지 정보</legend>
      <label class="checkout-field">
        <span>이름</span>
        <input type="text" id="checkout-name" autocomplete="name" required>
        <span class="checkout-error" id="error-name"></span>
      </label>
      <label class="checkout-field">
        <span>주소</span>
        <input type="text" id="checkout-address" autocomplete="street-address" required>
        <span class="checkout-error" id="error-address"></span>
      </label>
      <label class="checkout-field">
        <span>우편번호</span>
        <input type="text" id="checkout-zip" inputmode="numeric" autocomplete="postal-code" required>
        <span class="checkout-error" id="error-zip"></span>
      </label>
    </fieldset>

    <fieldset class="checkout-fieldset">
      <legend>결제 정보</legend>
      <label class="checkout-field">
        <span>카드 번호</span>
        <input type="text" id="checkout-card-number" inputmode="numeric" maxlength="19" placeholder="0000 0000 0000 0000" autocomplete="cc-number" required>
        <span class="checkout-error" id="error-card-number"></span>
      </label>
      <div class="checkout-field-row">
        <label class="checkout-field">
          <span>유효기간(MM/YY)</span>
          <input type="text" id="checkout-card-expiry" placeholder="MM/YY" maxlength="5" autocomplete="cc-exp" required>
          <span class="checkout-error" id="error-card-expiry"></span>
        </label>
        <label class="checkout-field">
          <span>CVC</span>
          <input type="text" id="checkout-card-cvc" inputmode="numeric" maxlength="4" autocomplete="cc-csc" required>
          <span class="checkout-error" id="error-card-cvc"></span>
        </label>
      </div>
    </fieldset>

    <div class="checkout-summary" id="checkout-summary"></div>

    <button type="submit" class="store-btn store-btn-primary" id="checkout-submit-btn">주문 완료하기</button>
  </form>
</div>

<div class="checkout-complete" id="checkout-complete-view" hidden>
  <h1 class="store-title">주문이 완료되었습니다</h1>
  <p class="store-hint" id="checkout-complete-message"></p>
  <a href="store.html" class="store-btn store-btn-primary">쇼핑 계속하기</a>
</div>
```

## js/checkout.js 구현 로직

1. 페이지 로드 시:
   - `CartStore.getCart()`가 비어있으면 `#checkout-form` 자체를 숨기고(또는 `#checkout-form-view`
     안의 `form`만 숨겨도 됨) `#checkout-empty-state`의 `hidden`을 제거한다. 이 경우 이후
     로직은 실행하지 않는다.
   - 비어있지 않으면 `#checkout-summary`에 각 아이템(이름 × 수량 — 소계)과 총합을 렌더링한다.
     예: `<div class="checkout-summary-row">오버이어 헤드폰 × 2 — $1098.00</div>` 반복 후
     총합 행(`"합계 — " + CartStore.formatPrice(총액)`) 추가. 마크업 세부는 네 재량.
   - `#store-cart-count`를 `CartStore.getTotalCount()`로 갱신.

2. `#checkout-form`의 `submit` 이벤트에서 `event.preventDefault()` 후 아래 검증을 전부
   수행(중단 없이 모든 필드를 검사해서 에러를 전부 표시):

   | 필드 | id | 규칙 |
   |---|---|---|
   | 이름 | `checkout-name` | trim 후 1자 이상 |
   | 주소 | `checkout-address` | trim 후 1자 이상 |
   | 우편번호 | `checkout-zip` | `/^\d{5}$/` |
   | 카드 번호 | `checkout-card-number` | 공백 제거 후 `/^\d{13,19}$/` |
   | 유효기간 | `checkout-card-expiry` | `/^(0[1-9]|1[0-2])\/\d{2}$/` |
   | CVC | `checkout-card-cvc` | `/^\d{3,4}$/` |

   각 필드마다:
   - 실패 시: 해당 `#error-*`에 한국어 에러 메시지(예: "우편번호는 숫자 5자리로 입력해주세요.")
     삽입, 입력 요소에 `.has-error` 클래스 추가.
   - 성공 시: `#error-*` 비우고 `.has-error` 제거.
   - 하나라도 실패하면 제출을 중단(주문 완료로 넘어가지 않음)하고, **첫 번째로 실패한
     필드**(폼에서 위에서부터 순서대로)에 `.focus()`.

3. 전부 통과하면:
   - `total = CartStore.getTotalPrice()`를 **먼저 변수에 저장**(clearCart 전에!).
   - `orderId = "ORD-" + Date.now().toString().slice(-8)` 생성.
   - `CartStore.clearCart()` 호출.
   - `#checkout-form-view` 숨기고(`hidden` 부여 또는 `display:none`), `#checkout-complete-view`의
     `hidden` 제거.
   - `#checkout-complete-message`에 `"주문번호 " + orderId + "가 접수되었습니다. 결제 금액 " + CartStore.formatPrice(total)` 형태로 채움.
   - `#store-cart-count`를 0으로 갱신(`CartStore.getTotalCount()`를 다시 호출해도 0이 나옴).

## 완료 후 확인
1. `python3 -m http.server 8000`에서 장바구니가 빈 상태로 `checkout.html`에 접속하면
   empty state만 보이는지 확인.
2. 장바구니에 상품을 담은 뒤 결제 페이지 진입 시 요약이 올바르게 보이는지, 잘못된 값(우편번호
   4자리, 카드번호 문자 포함, 유효기간 13/25 등)을 넣고 제출하면 에러 메시지가 뜨고 제출이
   막히는지 확인.
3. 모든 필드를 올바르게 채우고 제출하면 주문 완료 화면으로 전환되고, 주문번호/결제 금액이
   표시되며, 이후 `cart.html`이나 헤더 배지가 0으로 비어있는지 확인(가능하면 브라우저
   자동화로 실제 폼 제출, 최소한 로직 재검토 + 콘솔에서 함수 단위 테스트).

작업이 끝나면: 구현 요약, 확인 결과, 발견된 이슈(있다면)를 3~5문장으로 보고하라.
