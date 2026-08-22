// js/store.js — store.html list page logic (category filter + price sort + render).
(function () {
  "use strict";

  var currentCategory = "all";
  var currentSort = "default";

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getUniqueCategories() {
    var seen = [];
    var products = window.STORE_PRODUCTS || [];
    for (var i = 0; i < products.length; i++) {
      var category = products[i].category;
      if (seen.indexOf(category) === -1) {
        seen.push(category);
      }
    }
    return seen;
  }

  function buildFilterButtons() {
    var group = document.getElementById("store-filter-group");
    if (!group) {
      return;
    }
    var categories = getUniqueCategories();
    for (var i = 0; i < categories.length; i++) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "store-filter-btn";
      btn.setAttribute("data-category", categories[i]);
      btn.textContent = categories[i];
      group.appendChild(btn);
    }
  }

  function updateCartBadge() {
    var badge = document.getElementById("store-cart-count");
    if (badge && window.CartStore) {
      badge.textContent = String(window.CartStore.getTotalCount());
    }
  }

  function getFilteredSortedProducts() {
    var products = window.STORE_PRODUCTS || [];
    var filtered = products.filter(function (product) {
      return currentCategory === "all" || product.category === currentCategory;
    });
    var sorted = filtered.slice();
    if (currentSort === "price-asc") {
      sorted.sort(function (a, b) {
        return a.price - b.price;
      });
    } else if (currentSort === "price-desc") {
      sorted.sort(function (a, b) {
        return b.price - a.price;
      });
    }
    return sorted;
  }

  function renderProductCard(product) {
    var price = window.CartStore ? window.CartStore.formatPrice(product.price) : "$" + Number(product.price).toFixed(2);
    return (
      '<li class="store-card" data-id="' + escapeHtml(product.id) + '" data-category="' + escapeHtml(product.category) + '">' +
        '<a class="store-card-link" href="product.html?id=' + encodeURIComponent(product.id) + '">' +
          '<div class="store-card-image-wrap">' +
            '<img class="store-card-image" src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '" loading="lazy">' +
          '</div>' +
          '<div class="store-card-body">' +
            '<span class="store-card-category">' + escapeHtml(product.category) + '</span>' +
            '<h2 class="store-card-name">' + escapeHtml(product.name) + '</h2>' +
            '<p class="store-card-price">' + escapeHtml(price) + '</p>' +
          '</div>' +
        '</a>' +
      '</li>'
    );
  }

  function render() {
    var grid = document.getElementById("store-grid");
    if (!grid) {
      return;
    }
    var products = getFilteredSortedProducts();
    if (products.length === 0) {
      grid.innerHTML = '<li class="state-message">해당 카테고리 상품이 없습니다.</li>';
      return;
    }
    var html = "";
    for (var i = 0; i < products.length; i++) {
      html += renderProductCard(products[i]);
    }
    grid.innerHTML = html;
  }

  function handleFilterClick(event) {
    var btn = event.target.closest(".store-filter-btn");
    if (!btn) {
      return;
    }
    var group = document.getElementById("store-filter-group");
    var buttons = group.querySelectorAll(".store-filter-btn");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.remove("is-active");
    }
    btn.classList.add("is-active");
    currentCategory = btn.getAttribute("data-category");
    render();
  }

  function handleSortChange(event) {
    currentSort = event.target.value;
    render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildFilterButtons();
    updateCartBadge();

    var filterGroup = document.getElementById("store-filter-group");
    if (filterGroup) {
      filterGroup.addEventListener("click", handleFilterClick);
    }

    var sortSelect = document.getElementById("store-sort-select");
    if (sortSelect) {
      sortSelect.addEventListener("change", handleSortChange);
    }

    render();
  });
})();
