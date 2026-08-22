// js/product.js — product.html detail page logic (find product, qty selector, add to cart, toast).
(function () {
  "use strict";

  var MAX_QTY = 999;
  var TOAST_DURATION_MS = 2400;

  var currentQty = 1;
  var currentProduct = null;
  var toastHideTimer = null;
  var toastFinalizeTimer = null;
  var toastTransitionHandler = null;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getProductIdFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  function findProduct(id) {
    var products = window.STORE_PRODUCTS || [];
    if (!id) {
      return null;
    }
    for (var i = 0; i < products.length; i++) {
      if (products[i].id === id) {
        return products[i];
      }
    }
    return null;
  }

  function updateCartBadge() {
    var badge = document.getElementById("store-cart-count");
    if (badge && window.CartStore) {
      badge.textContent = String(window.CartStore.getTotalCount());
    }
  }

  function renderNotFound() {
    var container = document.getElementById("product-detail");
    if (!container) {
      return;
    }
    container.innerHTML = '<p class="state-message">상품을 찾을 수 없습니다. <a href="store.html">목록으로 돌아가기</a></p>';
  }

  function renderProduct(product) {
    var container = document.getElementById("product-detail");
    if (!container) {
      return;
    }
    var price = window.CartStore ? window.CartStore.formatPrice(product.price) : "$" + Number(product.price).toFixed(2);
    container.innerHTML =
      '<div class="product-detail-media">' +
        '<img class="product-detail-image" id="product-image" src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '">' +
      '</div>' +
      '<div class="product-detail-info">' +
        '<span class="product-detail-category" id="product-category">' + escapeHtml(product.category) + '</span>' +
        '<h1 class="product-detail-name" id="product-name">' + escapeHtml(product.name) + '</h1>' +
        '<p class="product-detail-price" id="product-price">' + escapeHtml(price) + '</p>' +
        '<p class="product-detail-description" id="product-description">' + escapeHtml(product.description) + '</p>' +
        '<p class="store-hint">수량을 선택하고 장바구니에 담아보세요. 담으면 화면 아래에 알림이 표시됩니다.</p>' +
        '<div class="product-detail-qty-row">' +
          '<button type="button" class="qty-btn" id="qty-decrease" aria-label="수량 감소">&minus;</button>' +
          '<span class="qty-value" id="qty-value" aria-live="polite">1</span>' +
          '<button type="button" class="qty-btn" id="qty-increase" aria-label="수량 증가">+</button>' +
        '</div>' +
        '<button type="button" class="store-btn store-btn-primary" id="add-to-cart-btn">장바구니 담기</button>' +
      '</div>';

    document.title = product.name + " — Store — My Blog";

    var qtyValueEl = document.getElementById("qty-value");
    var decreaseBtn = document.getElementById("qty-decrease");
    var increaseBtn = document.getElementById("qty-increase");
    var addToCartBtn = document.getElementById("add-to-cart-btn");

    currentQty = 1;
    qtyValueEl.textContent = String(currentQty);

    decreaseBtn.addEventListener("click", function () {
      if (currentQty > 1) {
        currentQty -= 1;
        qtyValueEl.textContent = String(currentQty);
      }
    });

    increaseBtn.addEventListener("click", function () {
      if (currentQty < MAX_QTY) {
        currentQty += 1;
        qtyValueEl.textContent = String(currentQty);
      }
    });

    addToCartBtn.addEventListener("click", function () {
      if (!window.CartStore) {
        return;
      }
      window.CartStore.addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image
      }, currentQty);
      updateCartBadge();
      showToast(product.name + "을(를) 장바구니에 담았습니다.");
    });
  }

  function showToast(message) {
    var toast = document.getElementById("store-toast");
    if (!toast) {
      return;
    }
    // Cancel any pending timers/listeners from a previous (possibly still
    // fading-out) toast cycle so a stale callback can't hide this new one.
    if (toastHideTimer) {
      clearTimeout(toastHideTimer);
      toastHideTimer = null;
    }
    if (toastFinalizeTimer) {
      clearTimeout(toastFinalizeTimer);
      toastFinalizeTimer = null;
    }
    if (toastTransitionHandler) {
      toast.removeEventListener("transitionend", toastTransitionHandler);
      toastTransitionHandler = null;
    }

    toast.textContent = message;
    toast.hidden = false;
    // Force reflow so the transition re-triggers on consecutive clicks.
    void toast.offsetWidth;
    toast.classList.add("is-visible");

    toastHideTimer = setTimeout(function () {
      toast.classList.remove("is-visible");

      toastTransitionHandler = function () {
        toast.hidden = true;
        toastTransitionHandler = null;
        if (toastFinalizeTimer) {
          clearTimeout(toastFinalizeTimer);
          toastFinalizeTimer = null;
        }
      };
      toast.addEventListener("transitionend", toastTransitionHandler, { once: true });
      // Fallback in case transitionend doesn't fire.
      toastFinalizeTimer = setTimeout(function () {
        toast.hidden = true;
        toastFinalizeTimer = null;
        if (toastTransitionHandler) {
          toast.removeEventListener("transitionend", toastTransitionHandler);
          toastTransitionHandler = null;
        }
      }, 300);

      toastHideTimer = null;
    }, TOAST_DURATION_MS);
  }

  document.addEventListener("DOMContentLoaded", function () {
    updateCartBadge();

    var id = getProductIdFromUrl();
    currentProduct = findProduct(id);

    if (!currentProduct) {
      renderNotFound();
      return;
    }

    renderProduct(currentProduct);
  });
})();
