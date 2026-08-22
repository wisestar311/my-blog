# spec.md — Store (Apple Store 느낌의 미니멀 온라인 스토어)

Plan 단계 산출물. CLAUDE.md의 작업 사이클(Plan → Work → Review → Commit)에 따라 작성.
**사용자 승인 전까지 Work 단계로 진행하지 않는다.**

---

## 1. 개요

Apple Store 스타일의 미니멀 온라인 스토어 목업을 블로그에 추가한다. 실제 결제/백엔드는
없고, 전부 정적 HTML + localStorage 기반 프론트엔드 목업이다.

페이지 4개(신규):

| 파일 | 역할 |
|---|---|
| `store.html` | 상품 목록 — 카테고리 필터, 가격순 정렬 |
| `product.html` | 상품 상세 — 장바구니 담기 + toast |
| `cart.html` | 장바구니 — 수량 변경, 삭제, 합계 |
| `checkout.html` | 결제 — 배송지/결제 폼 + 주문 완료 화면 |

기존 웹앱(2048, Pixel Art)과 동일하게 공용 헤더(`site-header`)를 포함하고, 헤더 nav에
"Store" 링크가 새로 추가된다(→ `store.html`로 연결). 4개 페이지는 서로 이동 가능한
자체 서브 내비게이션("store-topbar")을 헤더 아래에 둔다(장바구니 개수 배지 포함).

화면이 4개이므로 CLAUDE.md 규칙("화면이 3개 이상이면 화면별로 서브에이전트를 나눈다")에
따라 Work 단계는 화면별로 서브에이전트를 나눈다 (자세한 내용은 9번 섹션).

---

## 2. 파일 목록

### 신규 파일
- `store.html`
- `product.html`
- `cart.html`
- `checkout.html`
- `css/store.css` — 4개 페이지가 공유하는 스토어 전용 스타일시트 (style.css 변수만 참조, 완전히 독립적/자기완결적이어야 함 — 다른 feature css(game.css 등)에 의존하지 않는다. 예: `pixel-art.html`이 `.new-game-btn`을 쓰지만 `pixel-art.css`엔 그 정의가 없어 스타일이 깨지는 기존 사례가 있음. store.css는 자체 버튼 클래스(`.store-btn` 등)를 직접 정의해서 이 문제를 반복하지 않는다.)
- `js/cart-store.js` — 장바구니 상태 관리 공용 모듈 (localStorage 읽기/쓰기, `window.CartStore`)
- `js/products-data.js` — 샘플 상품 10개 카탈로그 (`window.STORE_PRODUCTS`)
- `js/store.js` — 목록 페이지 로직(필터/정렬/렌더링)
- `js/product.js` — 상세 페이지 로직(URL id 조회, 담기, toast)
- `js/cart.js` — 장바구니 페이지 로직(수량/삭제/합계)
- `js/checkout.js` — 결제 페이지 로직(폼 검증, 주문 완료)

### 수정 파일 (nav에 "Store" 링크 추가만)
- `index.html`
- `post.html`
- `game.html`
- `pixel-art.html`

---

## 3. 데이터 모델

### 3.1 상품 스키마 (`js/products-data.js`)

```js
// js/products-data.js
window.STORE_PRODUCTS = [
  {
    id: "P1",
    name: "...",
    category: "...",       // 아래 카테고리 목록 중 하나
    price: 000.00,          // 숫자, 소수 둘째자리, USD
    image: "https://images.unsplash.com/photo-...?w=600&q=80",
    description: "..."
  },
  // ...
];
```

`store.html`, `product.html`, `cart.html`(선택), `checkout.html`(선택)에서 이 스크립트를
`js/cart-store.js`보다 먼저 로드한다.

### 3.2 카테고리 목록 (6개)

`오디오`, `웨어러블`, `컴퓨터`, `액세서리`, `카메라`, `라이프스타일`

목록 페이지의 "전체" 필터는 별도 가상 카테고리 `all`로 처리(상품 데이터에는 없음).

### 3.3 샘플 상품 10개 (그대로 사용)

| id | name | category | price | image | description |
|---|---|---|---|---|---|
| P1 | 오버이어 헤드폰 | 오디오 | 549.00 | `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80` | 몰입감 있는 액티브 노이즈 캔슬링과 최대 20시간 재생을 지원하는 오버이어 헤드폰. |
| P2 | 미니멀 스마트워치 | 웨어러블 | 399.00 | `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80` | 심박수와 활동량을 추적하는 알루미늄 케이스 스마트워치. |
| P3 | 울트라씬 노트북 | 컴퓨터 | 1299.00 | `https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80` | 무게 1.1kg, 두께 12mm의 올데이 배터리 울트라씬 노트북. |
| P4 | 무선 블루투스 스피커 | 오디오 | 249.00 | `https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80` | 360도 사운드와 방수 설계를 갖춘 휴대용 무선 스피커. |
| P5 | 기계식 키보드 | 액세서리 | 179.00 | `https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80` | 저소음 스위치와 알루미늄 상판을 적용한 기계식 키보드. |
| P6 | 무선 마우스 | 액세서리 | 99.00 | `https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80` | 정밀한 트래킹과 인체공학적 그립의 무선 마우스. |
| P7 | 미러리스 카메라 | 카메라 | 899.00 | `https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&q=80` | 풀프레임 감성의 센서를 탑재한 컴팩트 미러리스 카메라. |
| P8 | 미니멀 스니커즈 | 라이프스타일 | 129.00 | `https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80` | 깔끔한 실루엣의 데일리 미니멀 스니커즈. |
| P9 | 가죽 백팩 | 라이프스타일 | 219.00 | `https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80` | 노트북 수납이 가능한 풀그레인 가죽 백팩. |
| P10 | 클래식 선글라스 | 라이프스타일 | 159.00 | `https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80` | UV400 렌즈를 적용한 클래식 아세테이트 선글라스. |

주의: Unsplash 이미지 URL은 형식(실제 Unsplash 도메인 + photo id + 쿼리스트링)만
검증했고 각 URL의 실제 로딩 여부까지 보장하지는 않는다. Work 단계에서 `<img>`에
`onerror`로 대체 텍스트(예: 상품명 이니셜)나 `background: var(--color-bg-elevated)`
placeholder를 깔아두면 깨진 이미지가 있어도 레이아웃이 무너지지 않는다(권장, 필수는 아님).

### 3.4 장바구니 localStorage 스키마

- 키: `"storeCart"`
- 값: JSON 문자열로 직렬화된 배열

```js
// localStorage.getItem("storeCart") 파싱 결과
[
  { id: "P1", name: "오버이어 헤드폰", price: 549.00, image: "https://...", qty: 2 },
  { id: "P4", name: "무선 블루투스 스피커", price: 249.00, image: "https://...", qty: 1 }
]
```

카트 아이템은 담을 당시 상품 정보를 스냅샷으로 저장한다(이름/가격/이미지 포함) —
`cart.html`, `checkout.html`은 `products-data.js` 없이도 장바구니만으로 렌더링 가능.

---

## 4. UI/마크업 구조

모든 스토어 페이지 공통 `<main>` 구조 (헤더/푸터는 기존 페이지와 byte-identical, 아래는
`<main>` 내부):

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

  <!-- 페이지별 콘텐츠 -->
</main>
```

`#store-cart-count`는 모든 스토어 페이지의 자체 스크립트가 로드 시
`CartStore.getTotalCount()`로 채운다(각 페이지 JS가 직접 DOM에 반영 — cart-store.js는
DOM을 건드리지 않는 순수 상태 모듈).

### 4.1 `store.html` — 목록 페이지

```html
<div class="store-list-container">
  <h1 class="store-title">Store</h1>
  <p class="store-hint">카테고리로 필터링하고 가격순으로 정렬해서 상품을 둘러보세요. 상품을 클릭하면 상세 정보를 볼 수 있어요.</p>

  <div class="store-controls">
    <div class="store-filter-group" id="store-filter-group" role="group" aria-label="카테고리 필터">
      <button type="button" class="store-filter-btn is-active" data-category="all">전체</button>
      <!-- STORE_PRODUCTS의 고유 category마다 버튼 하나, data-category="오디오" 등. JS가 동적 생성 -->
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

`js/store.js`가 `#store-grid`에 렌더링하는 카드 하나:

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

빈 결과(필터 결과 0개) 시: `<li class="state-message">해당 카테고리 상품이 없습니다.</li>`
(기존 `.state-message` 클래스 재사용 — style.css에 이미 정의됨).

### 4.2 `product.html` — 상세 페이지

```html
<div class="product-detail" id="product-detail">
  <!-- JS가 아래 내용을 주입하거나, id 없음/id 매칭 실패 시 not-found 표시 -->
</div>

<div class="store-toast" id="store-toast" role="status" aria-live="polite" hidden></div>
```

정상 케이스에 `#product-detail`에 주입되는 내용:

```html
<div class="product-detail-media">
  <img class="product-detail-image" id="product-image" src="..." alt="">
</div>
<div class="product-detail-info">
  <span class="product-detail-category" id="product-category"></span>
  <h1 class="product-detail-name" id="product-name"></h1>
  <p class="product-detail-price" id="product-price"></p>
  <p class="product-detail-description" id="product-description"></p>
  <p class="store-hint">수량을 선택하고 장바구니에 담아보세요. 담으면 화면 아래에 알림이 표시됩니다.</p>
  <div class="product-detail-qty-row">
    <button type="button" class="qty-btn" id="qty-decrease" aria-label="수량 감소">&minus;</button>
    <span class="qty-value" id="qty-value" aria-live="polite">1</span>
    <button type="button" class="qty-btn" id="qty-increase" aria-label="수량 증가">+</button>
  </div>
  <button type="button" class="store-btn store-btn-primary" id="add-to-cart-btn">장바구니 담기</button>
</div>
```

id 없음/매칭 실패 케이스: `#product-detail`을
`<p class="state-message">상품을 찾을 수 없습니다. <a href="store.html">목록으로 돌아가기</a></p>`
로 교체.

### 4.3 `cart.html` — 장바구니 페이지

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

`cart-list` 항목:

```html
<li class="cart-item" data-id="P1">
  <img class="cart-item-image" src="..." alt="">
  <div class="cart-item-info">
    <h2 class="cart-item-name">오버이어 헤드폰</h2>
    <p class="cart-item-price">$549.00</p>
  </div>
  <div class="cart-item-qty-row">
    <button type="button" class="qty-btn cart-qty-decrease" aria-label="수량 감소">&minus;</button>
    <span class="qty-value cart-qty-value">2</span>
    <button type="button" class="qty-btn cart-qty-increase" aria-label="수량 증가">+</button>
  </div>
  <p class="cart-item-subtotal">$1098.00</p>
  <button type="button" class="cart-item-remove" aria-label="오버이어 헤드폰 삭제">삭제</button>
</li>
```

장바구니가 비면 `#cart-list`를 비우고 `#cart-empty-state` 표시 + `#cart-summary` 숨김.

### 4.4 `checkout.html` — 결제 페이지

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

`#checkout-summary`에는 JS가 장바구니 각 아이템(이름 × 수량 — 소계)과 총합을 텍스트로
렌더링한다(상세 마크업은 Work 단계 재량, 예: `<div class="checkout-summary-row">이름 × 2 — $1098.00</div>` 반복 + 총합 행).

---

## 5. 인터랙션

### 5.1 카테고리 필터 (`store.html`)
- `#store-filter-group` 안 버튼들은 `js/store.js`가 `STORE_PRODUCTS`의 고유 카테고리로
  동적 생성(순서: 데이터에 처음 등장하는 순서, "전체"가 항상 맨 앞).
- 클릭 시 `data-category` 값을 현재 필터 상태로 저장, 클릭된 버튼에만 `.is-active` 부여
  (나머지 제거), `#store-grid` 재렌더링.
- `all`이면 전체 표시, 그 외엔 `product.category === 선택값`만 표시.
- 정렬 상태는 필터와 독립적으로 유지되고, 필터가 바뀌어도 정렬은 유지된다(재렌더링 시 필터 후 정렬 적용).

### 5.2 정렬 (`store.html`)
- `#store-sort-select` 변경 시 현재 필터링된 목록을 정렬해서 다시 렌더링.
  - `default`: `STORE_PRODUCTS` 원래 순서(= id 순서, P1~P10)
  - `price-asc`: 가격 오름차순
  - `price-desc`: 가격 내림차순
- 원본 배열을 변형하지 않고 항상 복사본을 정렬(`slice()`).

### 5.3 장바구니 담기 + toast (`product.html`)
- 수량 선택기(`#qty-decrease`/`#qty-increase`)는 1 미만으로 내려가지 않음(최소 1). 상한은
  없음(요구사항에 없으므로 미제한, 다만 999 등 상식적 상한을 두는 건 Work 단계 재량).
- `#add-to-cart-btn` 클릭 시 `CartStore.addItem(product, qty)` 호출 → 이미 담긴 상품이면
  수량 누적, 없으면 신규 추가.
- 담기 성공 시 toast 표시: `#store-toast`에 `"{상품명}을(를) 장바구니에 담았습니다."` 텍스트
  세팅 → `hidden` 제거 + `.is-visible` 클래스 추가(트랜지션으로 아래에서 위로 슬라이드 +
  페이드인) → 약 2000~2500ms 후 `.is-visible` 제거하고 트랜지션 종료 후(`transitionend` 또는
  타임아웃) `hidden` 재설정. 연속 클릭 시 기존 타이머를 `clearTimeout`하고 새로 시작(토스트가
  중간에 사라지지 않도록).
- 담기 후 `#store-cart-count` 배지를 `CartStore.getTotalCount()`로 갱신.

### 5.4 장바구니 수량 변경/삭제/합계 (`cart.html`)
- `.cart-qty-increase`/`.cart-qty-decrease` 클릭 시 `CartStore.updateQty(id, newQty)` 호출.
  `newQty`가 0 이하가 되면 해당 아이템 제거(확인 없이 바로 제거, 또는 삭제 버튼과 동일하게
  처리 — Work 단계 재량이나 "0으로 감소 = 삭제"를 권장).
- `.cart-item-remove` 클릭 시 `CartStore.removeItem(id)` 호출.
- 위 두 액션 후: 장바구니 재조회 → 목록 재렌더링 → 각 줄의 소계(`price * qty`) 재계산 →
  `#cart-total` 재계산(`CartStore.getTotalPrice()`) → 헤더 배지 갱신 → 비었으면 empty state.

### 5.5 결제 폼 검증 (`checkout.html`)
- 진입 시 장바구니가 비어 있으면 `#checkout-form-view`의 폼을 숨기고 `#checkout-empty-state`만 표시(주문 완료 화면으로 진행 불가).
- `submit` 시 `preventDefault()`, 아래 규칙으로 모든 필드 검사, 에러 있으면:
  - 해당 `.checkout-error`에 메시지 텍스트 삽입, 입력창에 `.has-error` 클래스(테두리 강조)
  - 첫 번째 에러 필드에 `focus()`
  - 제출 중단(주문 완료로 넘어가지 않음)
- 검증 규칙:
  | 필드 | 규칙 |
  |---|---|
  | 이름 | 공백 제거 후 1자 이상 |
  | 주소 | 공백 제거 후 1자 이상 |
  | 우편번호 | 숫자로만 구성된 5자리 (`/^\d{5}$/`) |
  | 카드 번호 | 공백 제거 후 숫자만 13~19자리 (`/^\d{13,19}$/`) — Luhn 검증 등 실제 카드 검증 로직은 불필요 |
  | 유효기간 | `MM/YY` 형식, MM은 01~12 (`/^(0[1-9]|1[0-2])\/\d{2}$/`) |
  | CVC | 숫자 3~4자리 (`/^\d{3,4}$/`) |
- 전부 통과하면:
  1. 주문번호 생성(예: `"ORD-" + Date.now().toString().slice(-8)`)
  2. `CartStore.clearCart()` 호출로 장바구니 비우기
  3. `#checkout-form-view` 숨기고 `#checkout-complete-view` 표시
  4. `#checkout-complete-message`에 `"주문번호 {orderId}가 접수되었습니다. 결제 금액 {formatPrice(total)}"` 형태로 채움(비우기 전에 합계를 변수로 미리 저장해둘 것 — clearCart 후에는 0이 됨)
  5. 헤더 배지도 0으로 갱신

---

## 6. 팔레트/색상 매핑

새 색상 토큰을 만들지 않는다. `css/style.css`의 기존 변수만 사용:

| 용도 | 변수 |
|---|---|
| 페이지/카드 배경 | `--color-bg`, `--color-bg-elevated` |
| 본문 텍스트 | `--color-text` |
| 보조 텍스트(설명, 힌트, 카테고리 라벨) | `--color-text-secondary` |
| 테두리(카드, 인풋, 필터 버튼 비활성) | `--color-border` |
| 강조(활성 필터, 가격, 버튼 테두리, 포커스, 토스트 배경 테두리) | `--accent` |
| 그림자/네온 글로우(카드 hover, 버튼 hover, 토스트) | `--glow-sm`, `--glow-lg` |
| 제목/버튼/가격 등 숫자·라벨류 폰트 | `--font-mono` |
| 본문/설명 폰트 | `--font-sans` |
| 폼 인풋 에러 상태 | `--color-text`/`--accent` 대비용 자체 빨강 계열은 쓰지 않고, 대신 `--accent` 테두리 두껍게 + 아이콘/텍스트로 에러를 표시(라이트/다크 모두 팔레트에 없는 색 추가 금지). 텍스트는 `.checkout-error`에 `color: var(--color-text-secondary)`를 기본으로 하되 필요 시 `--accent`로 강조. |

라이트/다크 모두 `[data-theme]`/`prefers-color-scheme`으로 style.css가 이미 처리하므로
store.css는 변수만 참조하면 자동으로 대응된다. 다크 모드 전용 오버라이드를 store.css에
새로 만들 필요 없음.

---

## 7. 헤더 nav 통합 방법

`.claude/skills/webapp-blog/SKILL.md`에 정의된 공용 헤더는 byte-identical해야 한다.
"Store" 링크를 `<a class="site-nav-link" href="pixel-art.html">Pixel Art</a>` 바로 뒤에
추가:

```html
<nav class="site-nav">
  <a class="site-nav-link" href="game.html">2048</a>
  <a class="site-nav-link" href="pixel-art.html">Pixel Art</a>
  <a class="site-nav-link" href="store.html">Store</a>
</nav>
```

이 nav 블록을 **8개 파일 전부**(`index.html`, `post.html`, `game.html`, `pixel-art.html`,
`store.html`, `product.html`, `cart.html`, `checkout.html`)에 문자 그대로 동일하게 넣는다.
Work 단계에서 한 서브에이전트(9번 섹션의 "기반" 서브에이전트)가 이 8개 파일의 헤더를 전부
책임지고, 이후 다른 서브에이전트는 헤더를 건드리지 않는다 — 이렇게 해야 byte-identical이
깨지지 않는다. 완료 후 `grep -A5 'site-nav"' *.html`로 8개 파일 모두 동일한지 diff 대조.

---

## 8. 사용법 안내 문구 (페이지별)

- `store.html`: "카테고리로 필터링하고 가격순으로 정렬해서 상품을 둘러보세요. 상품을 클릭하면 상세 정보를 볼 수 있어요." (`.store-hint`)
- `product.html`: "수량을 선택하고 장바구니에 담아보세요. 담으면 화면 아래에 알림이 표시됩니다." (`.store-hint`)
- `cart.html`: "수량을 바꾸거나 삭제할 수 있어요. 합계를 확인한 뒤 결제하기를 눌러주세요." (`.store-hint`)
- `checkout.html`: "배송지와 결제 정보를 입력하세요. 실제 결제는 이뤄지지 않는 프론트엔드 데모입니다." (`.store-hint`)

`.store-hint` 클래스는 store.css에서 `.game-hint`/`.pixel-art-hint`와 비슷한 스타일
(`color: var(--color-text-secondary)`, 여백)로 정의한다.

---

## 9. 서브에이전트 분할 계획 (Work 단계)

화면 4개(목록/상세/장바구니/결제) → CLAUDE.md 규칙상 화면별로 분할. 공용 기반(CSS 셸,
카트 모듈, 상품 데이터, 헤더 nav, 4개 신규 페이지의 헤더/토대)을 먼저 만드는 서브에이전트가
선행되어야 하므로 총 **5개** 서브에이전트를 다음 순서로 실행한다(0번이 끝난 뒤 1~4번은
서로 독립적이라 병렬 진행 가능).

### 0. 기반(Foundation) — 선행, 단독 실행
**만드는 파일**: `css/store.css`, `js/cart-store.js`, `js/products-data.js`
**수정 파일**: `index.html`, `post.html`, `game.html`, `pixel-art.html` (nav에 Store 링크 추가)
**만드는 파일(스켈레톤)**: `store.html`, `product.html`, `cart.html`, `checkout.html`
각각 `<!DOCTYPE html>`부터 `</html>`까지 전체를 생성하되 `<main>` 내부는 4번 섹션의 공통
구조(`back-link` + `store-topbar`)까지만 채우고, 페이지 고유 콘텐츠 자리에는
`<!-- SCREEN CONTENT: store-list -->` 같은 명확한 주석 placeholder만 남긴다. `<head>`에는
`css/style.css`, `css/store.css`, `js/theme.js`를 포함하고, `</body>` 직전에
`js/products-data.js`(필요한 페이지만) → `js/cart-store.js` → 페이지별 스크립트(아직
없으므로 `<script src="js/store.js" defer></script>` 등으로 경로만 미리 적어둠, 1~4번
서브에이전트가 실제 파일을 만듦) → `BlogTheme.initThemeToggle("theme-toggle")` 순서로 배치.

**계약(다음 서브에이전트들에게 그대로 전달)**:
- `window.STORE_PRODUCTS`: 3.1의 배열 스키마, 3.3의 10개 데이터 그대로.
- `window.CartStore` API:
  - `CartStore.getCart()` → 3.4 스키마의 배열 반환(파싱 실패/미존재 시 `[]`)
  - `CartStore.addItem(product, qty)` → product는 `{id,name,price,image}` 최소 포함 객체
  - `CartStore.updateQty(id, qty)` → `qty <= 0`이면 제거
  - `CartStore.removeItem(id)`
  - `CartStore.clearCart()`
  - `CartStore.getTotalCount()` → 전체 qty 합
  - `CartStore.getTotalPrice()` → 전체 price*qty 합(숫자)
  - `CartStore.formatPrice(amount)` → `"$" + amount.toFixed(2)` 문자열 (모든 페이지가 동일 포맷 사용하도록 공용화)
  - localStorage 키: `"storeCart"`. `JSON.parse` 실패 시 콘솔 경고 후 `[]`로 취급(throw 금지).
- DOM 계약: `#store-cart-count`(전 페이지 공통), 4.1~4.4의 id/class 전부.
- 헤더 nav는 8개 파일 모두 byte-identical(7번 섹션대로) — 이후 서브에이전트는 헤더를 손대지 않는다.

### 1. 목록 페이지
**수정**: `store.html`(placeholder를 4.1 마크업으로 교체)
**생성**: `js/store.js`
**참조만(수정 금지)**: `css/store.css`, `js/cart-store.js`, `js/products-data.js`
구현: 5.1(필터)/5.2(정렬) 전체, `#store-cart-count` 초기 렌더.

### 2. 상세 페이지
**수정**: `product.html`
**생성**: `js/product.js`
구현: URL `?id=` 파싱, not-found 처리, 5.3(담기+toast) 전체.

### 3. 장바구니 페이지
**수정**: `cart.html`
**생성**: `js/cart.js`
구현: 5.4(수량/삭제/합계) 전체, empty state.

### 4. 결제 페이지
**수정**: `checkout.html`
**생성**: `js/checkout.js`
구현: 5.5(폼 검증 + 주문 완료) 전체, 빈 장바구니 가드.

각 서브에이전트는 지침 파일(`work-store-0.md` ~ `work-store-4.md`)에 위 범위와 4번/5번/6번
섹션의 해당 부분을 그대로 옮겨 전달한다. 1~4번은 서로 다른 html/js 파일만 건드리므로 병렬
진행 가능하나, 반드시 0번이 완료(특히 CartStore API와 스켈레톤 HTML)된 뒤에 시작한다.

---

## 10. 다음에 열 때 참고

- **CSS Grid + `position:absolute` 버그(2048 사례)**: `store-grid`(`display:grid`)의 자식인
  `.store-card`에는 `position: absolute`를 걸지 않는다. 카드 위에 배지/오버레이가 필요하면
  `.store-card` 내부에 `position: relative` 래퍼를 하나 더 두고 그 안에서 절대 위치를 쓴다
  (Pixel Art의 `.canvas-wrap` 패턴과 동일).
- **테마 전환 시 캔버스 미갱신 버그**: 이번 기능은 `<canvas>`나 `getComputedStyle` 직접
  페인팅을 쓰지 않으므로(전부 CSS로 스타일링) 해당 사례와 무관. 참고로 현재
  `js/theme.js`는 SKILL.md 문서에 적힌 것과 달리 실제로는 토글 시 `document`에
  `"blogthemechange"` CustomEvent를 발행한다(커밋 `76e8753` 리뷰 수정 이후). 이번 기능에서
  캔버스류 재렌더링이 필요 없으므로 사용하지 않아도 되지만, 혹시 다크모드에 따라 JS 로직을
  분기해야 할 일이 생기면 MutationObserver 대신 이 이벤트를 구독하는 편이 더 간단하다.
- **localStorage 파싱 실패 처리**: `cart-store.js`의 모든 읽기는 `try/catch`로 감싸고,
  `JSON.parse` 결과가 배열이 아니거나 실패하면 빈 배열로 취급한다(다른 웹앱이 같은 키를
  건드릴 일은 없지만, 사용자가 devtools로 값을 손상시켜도 페이지가 죽지 않아야 함). 쓰기도
  `try/catch`로 감싸 storage 비활성 환경에서 페이지가 죽지 않게 한다(`theme.js`의
  `getStoredTheme`/`setStoredTheme` 패턴 참고).
- **여러 탭 동기화**: 필수 요구사항 아님(요청에 없음). 구현하지 않아도 되지만, 저렴하게
  붙일 수 있다면 각 페이지에서 `window.addEventListener("storage", handler)`로 다른 탭에서
  장바구니가 바뀌었을 때 배지/목록을 새로고침하는 것을 선택적으로 고려할 수 있다(같은 탭
  내부에서 `setItem`을 호출한 탭 자신에는 `storage` 이벤트가 발생하지 않는다는 점 주의 —
  자기 탭은 각 액션 직후 직접 재렌더링해야 함, 이는 5번 섹션에서 이미 그렇게 설계함).
- **상품 상세 진입 방식**: `product.html?id=P1`처럼 쿼리 파라미터로 전달한다. `id`가
  없거나 `STORE_PRODUCTS`에 없는 값이면 not-found 상태를 보여주고 500 에러나 흰 화면이
  되지 않게 한다(4.2 참고). 정적 사이트라 서버 라우팅이 없으므로 항상 클라이언트에서
  `URLSearchParams`로 처리.
- **주문 완료 후 합계 표시**: `CartStore.clearCart()`를 호출하면 합계가 0이 되므로, 완료
  메시지에 넣을 총액/상품 요약은 clearCart 호출 **이전**에 변수로 저장해둔다(5.5 참고).
- **카드 정보 자동완성**: 실제 결제가 아니므로 Luhn 체크섬 등 진짜 카드 검증은 구현하지
  않는다(5.5의 정규식 수준으로 충분). `autocomplete` 속성은 접근성/UX 상 붙여두되, 이 값이
  실제로 어딘가에 전송되지 않는다는 점을 결제 폼 상단 안내 문구로 명시한다(이미 8번 힌트에
  포함됨).
