// script.js — handles product loading, cart, auth checks (frontend-only)

// Config
const API_PRODUCTS = "https://dummyjson.com/products";
const USD_TO_INR = 83; // simple multiplier

// Helpers
const $ = (id) => document.getElementById(id);
const create = (tag, cls) =>
  Object.assign(document.createElement(tag), { className: cls || "" });

// AUTH helpers (session + localstorage)
function getCurrentUser() {
  const cur = sessionStorage.getItem("sc_currentUser");
  return cur ? JSON.parse(cur) : null;
}
function logout() {
  sessionStorage.removeItem("sc_currentUser");
  window.location.href = "login.html";
}

// CART storage (in session only)
let CART = {}; // { id: { ...product, qty } }
function saveCart() {
  sessionStorage.setItem("sc_cart", JSON.stringify(CART));
}
function loadCart() {
  CART = JSON.parse(sessionStorage.getItem("sc_cart") || "{}");
}

// UI elements (if present)
const productsGrid = $("productsGrid");
const categoriesList = $("categoriesList");
const resultsMeta = $("resultsMeta");
const searchInput = $("searchInput");
const searchBtn = $("searchBtn");
const cartToggle = $("cartToggle");
const cartDrawer = $("cartDrawer");
const cartItems = $("cartItems");
const cartCount = $("cartCount");
const cartTotal = $("cartTotal");
const checkoutBtn = $("checkoutBtn");
const logoutBtn = $("logoutBtn");
const inStockToggle = $("inStockToggle");

let ALL_PRODUCTS = [];

// INIT for index.html only (many elements may be undefined on auth pages)
async function initHome() {
  // protect route: redirect if not logged in
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  // greeting already set in index.html inline; set logout handler
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  // load cart from session
  loadCart();
  renderCartUI();

  // fetch products & categories
  try {
    const res = await fetch(API_PRODUCTS);
    const json = await res.json();
    ALL_PRODUCTS = json.products || [];
    renderProducts(ALL_PRODUCTS);
    renderCategories([...new Set(ALL_PRODUCTS.map((p) => p.category))]);
  } catch (err) {
    if (productsGrid) productsGrid.textContent = "Failed to load products.";
    console.error(err);
  }

  // search
  if (searchBtn) searchBtn.addEventListener("click", doSearch);
  if (searchInput)
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doSearch();
    });

  // cart toggle
  if (cartToggle)
    cartToggle.addEventListener("click", () => {
      if (cartDrawer) cartDrawer.classList.toggle("open");
    });

  if (checkoutBtn)
    checkoutBtn.addEventListener("click", () => {
      alert(
        "Checkout stub — integrate real payment + backend to complete purchase."
      );
    });

  if (inStockToggle)
    inStockToggle.addEventListener("change", () => {
      applyFilters();
    });
}

// RENDER PRODUCTS
function renderProducts(list) {
  if (!productsGrid) return;
  productsGrid.innerHTML = "";
  resultsMeta.textContent = `${list.length} results`;

  list.forEach((p) => {
    const card = create("div", "card");
    const priceInr = Math.round(p.price * USD_TO_INR);

    card.innerHTML = `
      <img src="${p.thumbnail}" alt="${escapeHtml(p.title)}">
      <h4 title="${escapeHtml(p.title)}">${escapeHtml(p.title)}</h4>
      <div class="meta">${escapeHtml(p.brand)} • ${escapeHtml(p.category)}</div>
      <div class="price">₹${priceInr}</div>
      <div class="ctas">
        <button class="ghost-btn add-btn" data-id="${p.id}">Add to cart</button>
        <button class="primary-btn buy-btn" data-id="${p.id}">Buy</button>
      </div>
    `;

    // handlers
    card.querySelector(".add-btn").addEventListener("click", () => {
      addToCart(p.id);
      renderCartUI();
    });
    card.querySelector(".buy-btn").addEventListener("click", () => {
      addToCart(p.id);
      renderCartUI();
      if (cartDrawer) cartDrawer.classList.add("open");
    });

    productsGrid.appendChild(card);
  });
}

function escapeHtml(str) {
  return ("" + str).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}

// RENDER CATEGORIES
function renderCategories(list) {
  if (!categoriesList) return;
  categoriesList.innerHTML = "";
  list.forEach((cat) => {
    const el = create("div", "category");
    el.textContent = cat;
    el.addEventListener("click", () => {
      const filtered = ALL_PRODUCTS.filter((p) => p.category === cat);
      renderProducts(filtered);
    });
    categoriesList.appendChild(el);
  });
}

// SEARCH / FILTERS
function doSearch() {
  const q = (searchInput?.value || "").trim().toLowerCase();
  const filtered = ALL_PRODUCTS.filter((p) => {
    const matchesQ =
      p.title.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
    return matchesQ;
  });
  renderProducts(filtered);
}

function applyFilters() {
  let list = [...ALL_PRODUCTS];
  if (inStockToggle?.checked) {
    // dummyjson has stock property `stock` -> filter > 0
    list = list.filter((p) => p.stock > 0);
  }
  renderProducts(list);
}

// CART functions
function addToCart(id) {
  const p = ALL_PRODUCTS.find((x) => x.id == id);
  if (!p) return;
  if (!CART[id]) CART[id] = { ...p, qty: 0 };
  CART[id].qty += 1;
  saveCart();
}

function removeFromCart(id) {
  delete CART[id];
  saveCart();
  renderCartUI();
}

function changeQty(id, delta) {
  if (!CART[id]) return;
  CART[id].qty = Math.max(1, CART[id].qty + delta);
  saveCart();
  renderCartUI();
}

function renderCartUI() {
  if (!cartItems) return;
  cartItems.innerHTML = "";
  const ids = Object.keys(CART);
  let total = 0,
    count = 0;

  if (ids.length === 0) {
    cartItems.innerHTML = `<div class="muted">Your cart is empty.</div>`;
  } else {
    ids.forEach((id) => {
      const it = CART[id];
      const price = Math.round(it.price * USD_TO_INR);
      total += price * it.qty;
      count += it.qty;

      const div = create("div", "cart-item");
      div.innerHTML = `
        <img src="${it.thumbnail}" alt="${escapeHtml(it.title)}">
        <div style="flex:1">
          <div style="font-weight:600">${escapeHtml(it.title)}</div>
          <div class="meta">₹${price} • ${escapeHtml(it.brand)}</div>
          <div style="display:flex;gap:6px;margin-top:6px">
            <button class="ghost-btn" data-act="minus" data-id="${id}">-</button>
            <div style="min-width:24px;text-align:center">${it.qty}</div>
            <button class="ghost-btn" data-act="plus" data-id="${id}">+</button>
            <button class="ghost-btn" data-act="remove" data-id="${id}">Remove</button>
          </div>
        </div>
      `;
      cartItems.appendChild(div);
    });
  }

  if (cartCount) cartCount.textContent = count;
  if (cartTotal) cartTotal.textContent = `₹${total}`;

  // attach listeners
  cartItems.querySelectorAll("[data-act]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const act = e.currentTarget.dataset.act;
      const id = e.currentTarget.dataset.id;
      if (act === "minus") changeQty(id, -1);
      if (act === "plus") changeQty(id, +1);
      if (act === "remove") removeFromCart(id);
    });
  });
}

// INIT on load (for pages that include script.js)
document.addEventListener("DOMContentLoaded", () => {
  // If on home page, init home
  if (
    document.body.contains(document.querySelector(".layout")) ||
    document.getElementById("productsGrid")
  ) {
    initHome();
  }
  // Load cart from session for other pages too
  loadCart();
  // Attach logout handler if present on any page
  const logoutEl = document.getElementById("logoutBtn");
  if (logoutEl) logoutEl.addEventListener("click", logout);

  // ensure cart toggle element toggles class (if present)
  const cartToggleEl = document.getElementById("cartToggle");
  if (cartToggleEl)
    cartToggleEl.addEventListener("click", () => {
      const drawer = document.getElementById("cartDrawer");
      if (drawer) drawer.classList.toggle("open");
    });
});
