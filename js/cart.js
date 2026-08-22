// js/cart.js — cart page logic (render list, qty +/-, remove, totals).
// Depends on window.CartStore (js/cart-store.js) already loaded before this script.
(function () {
  "use strict";

  var listEl = document.getElementById("cart-list");
  var emptyStateEl = document.getElementById("cart-empty-state");
  var summaryEl = document.getElementById("cart-summary");
  var totalEl = document.getElementById("cart-total");
  var cartCountEl = document.getElementById("store-cart-count");

  function updateCartCount() {
    if (cartCountEl) {
      cartCountEl.textContent = String(CartStore.getTotalCount());
    }
  }

  function buildItem(item) {
    var li = document.createElement("li");
    li.className = "cart-item";
    li.setAttribute("data-id", item.id);

    var img = document.createElement("img");
    img.className = "cart-item-image";
    img.src = item.image;
    img.alt = item.name;
    li.appendChild(img);

    var info = document.createElement("div");
    info.className = "cart-item-info";

    var name = document.createElement("h2");
    name.className = "cart-item-name";
    name.textContent = item.name;
    info.appendChild(name);

    var price = document.createElement("p");
    price.className = "cart-item-price";
    price.textContent = CartStore.formatPrice(item.price);
    info.appendChild(price);

    li.appendChild(info);

    var qtyRow = document.createElement("div");
    qtyRow.className = "cart-item-qty-row";

    var decreaseBtn = document.createElement("button");
    decreaseBtn.type = "button";
    decreaseBtn.className = "qty-btn cart-qty-decrease";
    decreaseBtn.setAttribute("aria-label", "수량 감소");
    decreaseBtn.innerHTML = "&minus;";
    qtyRow.appendChild(decreaseBtn);

    var qtyValue = document.createElement("span");
    qtyValue.className = "qty-value cart-qty-value";
    qtyValue.textContent = String(item.qty);
    qtyRow.appendChild(qtyValue);

    var increaseBtn = document.createElement("button");
    increaseBtn.type = "button";
    increaseBtn.className = "qty-btn cart-qty-increase";
    increaseBtn.setAttribute("aria-label", "수량 증가");
    increaseBtn.textContent = "+";
    qtyRow.appendChild(increaseBtn);

    li.appendChild(qtyRow);

    var subtotal = document.createElement("p");
    subtotal.className = "cart-item-subtotal";
    subtotal.textContent = CartStore.formatPrice(item.price * item.qty);
    li.appendChild(subtotal);

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "cart-item-remove";
    removeBtn.setAttribute("aria-label", item.name + " 삭제");
    removeBtn.textContent = "삭제";
    li.appendChild(removeBtn);

    return li;
  }

  function render() {
    var cart = CartStore.getCart();

    if (!cart.length) {
      listEl.innerHTML = "";
      if (emptyStateEl) {
        emptyStateEl.hidden = false;
      }
      if (summaryEl) {
        summaryEl.hidden = true;
      }
      updateCartCount();
      return;
    }

    if (emptyStateEl) {
      emptyStateEl.hidden = true;
    }
    if (summaryEl) {
      summaryEl.hidden = false;
    }

    var fragment = document.createDocumentFragment();
    for (var i = 0; i < cart.length; i++) {
      fragment.appendChild(buildItem(cart[i]));
    }
    listEl.innerHTML = "";
    listEl.appendChild(fragment);

    if (totalEl) {
      totalEl.textContent = CartStore.formatPrice(CartStore.getTotalPrice());
    }

    updateCartCount();
  }

  function getCurrentQty(id) {
    var cart = CartStore.getCart();
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === id) {
        return Number(cart[i].qty) || 0;
      }
    }
    return 0;
  }

  function handleListClick(event) {
    var itemEl = event.target.closest(".cart-item");
    if (!itemEl) {
      return;
    }
    var id = itemEl.getAttribute("data-id");

    if (event.target.closest(".cart-qty-increase")) {
      CartStore.updateQty(id, getCurrentQty(id) + 1);
      render();
    } else if (event.target.closest(".cart-qty-decrease")) {
      CartStore.updateQty(id, getCurrentQty(id) - 1);
      render();
    } else if (event.target.closest(".cart-item-remove")) {
      CartStore.removeItem(id);
      render();
    }
  }

  if (listEl) {
    listEl.addEventListener("click", handleListClick);
  }

  render();
})();
