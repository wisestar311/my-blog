// js/cart-store.js — cart state management, pure logic module (no DOM access).
// Persists to localStorage key "storeCart". Exposes window.CartStore.
(function () {
  "use strict";

  var STORAGE_KEY = "storeCart";

  function readCart() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        console.warn("CartStore: stored cart is not an array, resetting.");
        return [];
      }
      return parsed;
    } catch (err) {
      console.warn("CartStore: failed to read cart from localStorage.", err);
      return [];
    }
  }

  function writeCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.warn("CartStore: failed to write cart to localStorage.", err);
    }
  }

  function getCart() {
    return readCart();
  }

  function addItem(product, qty) {
    var quantity = Number(qty) || 0;
    if (quantity <= 0) {
      return;
    }
    var cart = readCart();
    var existing = null;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === product.id) {
        existing = cart[i];
        break;
      }
    }
    if (existing) {
      existing.qty = (Number(existing.qty) || 0) + quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty: quantity
      });
    }
    writeCart(cart);
  }

  function updateQty(id, qty) {
    var quantity = Number(qty) || 0;
    var cart = readCart();
    if (quantity <= 0) {
      cart = cart.filter(function (item) {
        return item.id !== id;
      });
    } else {
      for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === id) {
          cart[i].qty = quantity;
          break;
        }
      }
    }
    writeCart(cart);
  }

  function removeItem(id) {
    var cart = readCart().filter(function (item) {
      return item.id !== id;
    });
    writeCart(cart);
  }

  function clearCart() {
    writeCart([]);
  }

  function getTotalCount() {
    var cart = readCart();
    var total = 0;
    for (var i = 0; i < cart.length; i++) {
      total += Number(cart[i].qty) || 0;
    }
    return total;
  }

  function getTotalPrice() {
    var cart = readCart();
    var total = 0;
    for (var i = 0; i < cart.length; i++) {
      total += (Number(cart[i].price) || 0) * (Number(cart[i].qty) || 0);
    }
    return total;
  }

  function formatPrice(amount) {
    return "$" + (Number(amount) || 0).toFixed(2);
  }

  window.CartStore = {
    getCart: getCart,
    addItem: addItem,
    updateQty: updateQty,
    removeItem: removeItem,
    clearCart: clearCart,
    getTotalCount: getTotalCount,
    getTotalPrice: getTotalPrice,
    formatPrice: formatPrice
  };
})();
