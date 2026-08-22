// js/checkout.js — checkout page logic (client-side only, no real payment gateway).
(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }

  function updateCartBadge() {
    var badge = $("store-cart-count");
    if (badge) {
      badge.textContent = String(CartStore.getTotalCount());
    }
  }

  function renderSummary(cart) {
    var summaryEl = $("checkout-summary");
    if (!summaryEl) {
      return;
    }
    summaryEl.innerHTML = "";

    for (var i = 0; i < cart.length; i++) {
      var item = cart[i];
      var subtotal = (Number(item.price) || 0) * (Number(item.qty) || 0);
      var row = document.createElement("div");
      row.className = "checkout-summary-row";
      row.textContent = item.name + " × " + item.qty + " — " + CartStore.formatPrice(subtotal);
      summaryEl.appendChild(row);
    }

    var totalRow = document.createElement("div");
    totalRow.className = "checkout-summary-row checkout-summary-total-row";
    totalRow.textContent = "합계 — " + CartStore.formatPrice(CartStore.getTotalPrice());
    summaryEl.appendChild(totalRow);
  }

  function setFieldError(inputId, errorId, message) {
    var input = $(inputId);
    var errorEl = $(errorId);
    if (errorEl) {
      errorEl.textContent = message;
    }
    if (input) {
      if (message) {
        input.classList.add("has-error");
      } else {
        input.classList.remove("has-error");
      }
    }
  }

  function validateForm() {
    // Each entry validates one field; order matters for focusing the first failure.
    var fields = [
      {
        inputId: "checkout-name",
        errorId: "error-name",
        test: function (value) {
          return value.trim().length >= 1;
        },
        message: "이름을 입력해주세요."
      },
      {
        inputId: "checkout-address",
        errorId: "error-address",
        test: function (value) {
          return value.trim().length >= 1;
        },
        message: "주소를 입력해주세요."
      },
      {
        inputId: "checkout-zip",
        errorId: "error-zip",
        test: function (value) {
          return /^\d{5}$/.test(value.trim());
        },
        message: "우편번호는 숫자 5자리로 입력해주세요."
      },
      {
        inputId: "checkout-card-number",
        errorId: "error-card-number",
        test: function (value) {
          return /^\d{13,19}$/.test(value.replace(/\s+/g, ""));
        },
        message: "카드 번호는 숫자 13~19자리로 입력해주세요."
      },
      {
        inputId: "checkout-card-expiry",
        errorId: "error-card-expiry",
        test: function (value) {
          return /^(0[1-9]|1[0-2])\/\d{2}$/.test(value.trim());
        },
        message: "유효기간은 MM/YY 형식으로 입력해주세요."
      },
      {
        inputId: "checkout-card-cvc",
        errorId: "error-card-cvc",
        test: function (value) {
          return /^\d{3,4}$/.test(value.trim());
        },
        message: "CVC는 숫자 3~4자리로 입력해주세요."
      }
    ];

    var firstInvalidInput = null;
    var allValid = true;

    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      var input = $(field.inputId);
      var value = input ? input.value : "";
      var valid = field.test(value);

      if (valid) {
        setFieldError(field.inputId, field.errorId, "");
      } else {
        setFieldError(field.inputId, field.errorId, field.message);
        allValid = false;
        if (!firstInvalidInput) {
          firstInvalidInput = input;
        }
      }
    }

    if (!allValid && firstInvalidInput) {
      firstInvalidInput.focus();
    }

    return allValid;
  }

  function completeOrder() {
    var total = CartStore.getTotalPrice();
    var orderId = "ORD-" + Date.now().toString().slice(-8);

    CartStore.clearCart();

    var formView = $("checkout-form-view");
    var completeView = $("checkout-complete-view");
    if (formView) {
      formView.hidden = true;
    }
    if (completeView) {
      completeView.hidden = false;
    }

    var messageEl = $("checkout-complete-message");
    if (messageEl) {
      messageEl.textContent = "주문번호 " + orderId + "가 접수되었습니다. 결제 금액 " + CartStore.formatPrice(total);
    }

    updateCartBadge();
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (validateForm()) {
      completeOrder();
    }
  }

  function init() {
    var cart = CartStore.getCart();
    var formView = $("checkout-form-view");
    var emptyState = $("checkout-empty-state");
    var form = $("checkout-form");

    if (cart.length === 0) {
      if (form) {
        form.hidden = true;
      }
      if (emptyState) {
        emptyState.hidden = false;
      }
      updateCartBadge();
      return;
    }

    renderSummary(cart);
    updateCartBadge();

    if (form) {
      form.addEventListener("submit", handleSubmit);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
