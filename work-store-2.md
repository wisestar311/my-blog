# work-store-2.md — 상품 상세 페이지 서브에이전트 지침

너는 "My Blog" 저장소(`/Users/hyungyukim/My coding/Claude/My blog`)의 온라인 스토어 기능
중 **상품 상세 페이지**를 구현하는 서브에이전트다. 저장소 루트의 `spec.md`를 먼저 전체
읽어라(특히 4.2, 5.3 섹션). 0번(기반) 서브에이전트가 이미 `product.html` 스켈레톤,
`css/store.css`, `js/cart-store.js`, `js/products-data.js`, 8개 파일 헤더 nav를 만들어
놓았다 — 그 위에 작업한다.

## 네 작업 범위 (이것만 건드린다)
- **수정**: `product.html` — `<!-- SCREEN CONTENT: product-detail -->` 주석을 아래
  마크업으로 교체하고, `<script src="js/product.js" defer></script>` 태그가 이미 있는지
  확인(없으면 cart-store.js 다음, theme.js 이전에 추가).
- **생성**: `js/product.js`

### 절대 건드리지 않는 것
`css/store.css`, `js/cart-store.js`, `js/products-data.js`, 8개 파일의 헤더, 그리고
`store.html`, `cart.html`, `checkout.html`, `js/store.js`, `js/cart.js`, `js/checkout.js`.

## 이미 존재한다고 가정할 것 (계약 — 그대로 사용)
- `window.STORE_PRODUCTS`: `[{id, name, category, price, image, description}, ...]`.
- `window.CartStore`: `addItem(product, qty)`, `getTotalCount()`, `formatPrice(amount)`.
- `.store-page`, `.store-topbar`, `.store-cart-count`, `.store-btn`, `.store-btn-primary`,
  `.qty-btn`, `.qty-value`, `.store-toast` 등은 이미 CSS가 정의되어 있다.

## product.html의 `<!-- SCREEN CONTENT: product-detail -->` 자리에 넣을 마크업

```html
<div class="product-detail" id="product-detail">
  <!-- JS가 내용을 주입 -->
</div>

<div class="store-toast" id="store-toast" role="status" aria-live="polite" hidden></div>
```

## js/product.js 구현 로직

1. `URLSearchParams(location.search)`로 `id` 파라미터를 읽는다.
2. `STORE_PRODUCTS.find(p => p.id === id)`로 상품을 찾는다.
3. **찾지 못하면**(`id`가 없거나 매칭 실패) `#product-detail`의 내용을 아래로 교체하고
   나머지 로직(수량/담기)은 실행하지 않는다:
   ```html
   <p class="state-message">상품을 찾을 수 없습니다. <a href="store.html">목록으로 돌아가기</a></p>
   ```
4. **찾으면** `#product-detail`에 아래 내용을 주입(값은 찾은 상품 데이터로 채움, 가격은
   `CartStore.formatPrice(product.price)`):
   ```html
   <div class="product-detail-media">
     <img class="product-detail-image" id="product-image" src="..." alt="상품명">
   </div>
   <div class="product-detail-info">
     <span class="product-detail-category" id="product-category">카테고리</span>
     <h1 class="product-detail-name" id="product-name">상품명</h1>
     <p class="product-detail-price" id="product-price">$000.00</p>
     <p class="product-detail-description" id="product-description">설명</p>
     <p class="store-hint">수량을 선택하고 장바구니에 담아보세요. 담으면 화면 아래에 알림이 표시됩니다.</p>
     <div class="product-detail-qty-row">
       <button type="button" class="qty-btn" id="qty-decrease" aria-label="수량 감소">&minus;</button>
       <span class="qty-value" id="qty-value" aria-live="polite">1</span>
       <button type="button" class="qty-btn" id="qty-increase" aria-label="수량 증가">+</button>
     </div>
     <button type="button" class="store-btn store-btn-primary" id="add-to-cart-btn">장바구니 담기</button>
   </div>
   ```
   또한 `document.title`을 `"{상품명} — Store — My Blog"` 정도로 갱신해도 좋다(선택).
5. 수량 상태(모듈 스코프 변수, 초기값 1)를 두고:
   - `#qty-decrease` 클릭: 1 미만으로 내려가지 않게(최소 1) 감소, `#qty-value` 갱신.
   - `#qty-increase` 클릭: 증가(상한 없음, 999 정도 상식적 상한을 둬도 무방), `#qty-value` 갱신.
6. `#add-to-cart-btn` 클릭 시:
   - `CartStore.addItem({id: product.id, name: product.name, price: product.price, image: product.image}, 현재수량)` 호출.
   - `#store-cart-count`를 `CartStore.getTotalCount()`로 갱신.
   - toast 표시: `#store-toast`의 텍스트를 `"{상품명}을(를) 장바구니에 담았습니다."`로 설정 →
     `hidden` 속성 제거 + `.is-visible` 클래스 추가 → 약 2000~2500ms 후 `.is-visible` 제거하고
     트랜지션이 끝난 뒤(또는 타임아웃으로) `hidden` 다시 설정. 연속 클릭 시 이전 타이머를
     `clearTimeout`하고 새로 시작해서 토스트가 중간에 사라지지 않게 한다.
7. `#store-cart-count`는 페이지 로드 시에도 `CartStore.getTotalCount()`로 초기화.

## 완료 후 확인
1. `python3 -m http.server 8000`에서 `product.html?id=P1` 접속 시 상세 정보가 제대로
   보이는지, `product.html?id=NOTEXIST`나 `product.html`(id 없음)일 때 not-found 문구가
   보이는지 확인.
2. 수량 +/- 버튼이 1 미만으로 내려가지 않는지, 담기 클릭 시 toast가 나타났다가 자동으로
   사라지는지, 연속 클릭 시 toast가 중간에 끊기지 않는지 확인(가능하면 브라우저 자동화로
   실제 클릭, 최소한 코드 로직 재검토).
3. 담기 후 `#store-cart-count` 배지가 올라가는지 확인.

작업이 끝나면: 구현 요약, 확인 결과, 발견된 이슈(있다면)를 3~5문장으로 보고하라.
