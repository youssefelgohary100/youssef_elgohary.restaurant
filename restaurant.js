/* Youssef Elgohary Restaurant — interactive features */
"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const menuToggle = $("#menuToggle");
const navLinks = $("#navLinks");
const themeToggle = $("#themeToggle");
const cartDrawer = $("#cartDrawer");
const cartBackdrop = $("#cartBackdrop");
const openCartButton = $("#openCart");
const closeCartButton = $("#closeCart");
const continueShoppingButton = $("#continueShopping");
const cartItemsElement = $("#cartItems");
const cartCountElement = $("#cartCount");
const drawerCountElement = $("#drawerCount");
const cartTotalElement = $("#cartTotal");
const checkoutButton = $("#checkoutButton");
const toastElement = $("#toast");

let cart = [];
let activeCategory = "all";
let toastTimeout;

function showToast(message) {
  toastElement.textContent = message;
  toastElement.classList.add("visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toastElement.classList.remove("visible"), 2400);
}

/* Mobile navigation */
menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
});
$$(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});
document.addEventListener("click", event => {
  if (!navLinks.contains(event.target) && !menuToggle.contains(event.target)) {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

/* Theme */
function setTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-theme", isDark);
  themeToggle.textContent = isDark ? "☀" : "☾";
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
  try { localStorage.setItem("restaurant-theme", theme); } catch (_) {}
}
let savedTheme = "light";
try { savedTheme = localStorage.getItem("restaurant-theme") || "light"; } catch (_) {}
setTheme(savedTheme);
themeToggle.addEventListener("click", () => {
  setTheme(document.body.classList.contains("dark-theme") ? "light" : "dark");
});

/* Cart drawer */
function openCart() {
  cartDrawer.classList.add("open");
  cartBackdrop.classList.add("visible");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  closeCartButton.focus();
}
function closeCart() {
  cartDrawer.classList.remove("open");
  cartBackdrop.classList.remove("visible");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
openCartButton.addEventListener("click", openCart);
closeCartButton.addEventListener("click", closeCart);
continueShoppingButton.addEventListener("click", closeCart);
cartBackdrop.addEventListener("click", closeCart);
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeCart();
});

/* Cart data and rendering */
function addToCart(card) {
  const name = card.dataset.name;
  const price = Number(card.dataset.price);
  const existing = cart.find(item => item.name === name);
  if (existing) existing.quantity += 1;
  else cart.push({ name, price, quantity: 1 });
  renderCart();
  showToast(`${name} added to your cart`);
}
$$("[data-add]").forEach(button => {
  button.addEventListener("click", () => addToCart(button.closest(".food-card")));
});

function changeQuantity(name, amount) {
  const item = cart.find(product => product.name === name);
  if (!item) return;
  item.quantity += amount;
  if (item.quantity <= 0) cart = cart.filter(product => product.name !== name);
  renderCart();
}
function removeFromCart(name) {
  cart = cart.filter(item => item.name !== name);
  renderCart();
  showToast(`${name} removed`);
}
function formatEGP(amount) {
  return `EGP ${amount.toLocaleString("en-EG")}`;
}
function renderCart() {
  const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartCountElement.textContent = quantity;
  drawerCountElement.textContent = `(${quantity})`;
  cartTotalElement.textContent = formatEGP(total);

  if (cart.length === 0) {
    cartItemsElement.innerHTML = `<div class="empty-cart"><span>＋</span><h3>Your cart is empty</h3><p>Add something delicious from our menu.</p></div>`;
    return;
  }

  cartItemsElement.replaceChildren();
  cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "cart-item";

    const info = document.createElement("div");
    const name = document.createElement("h4");
    name.textContent = item.name;
    const price = document.createElement("p");
    price.textContent = formatEGP(item.price * item.quantity);
    info.append(name, price);

    const controls = document.createElement("div");
    controls.className = "cart-item-controls";

    const minus = document.createElement("button");
    minus.className = "quantity-button";
    minus.type = "button";
    minus.textContent = "−";
    minus.setAttribute("aria-label", `Decrease ${item.name} quantity`);
    minus.addEventListener("click", () => changeQuantity(item.name, -1));

    const count = document.createElement("span");
    count.textContent = item.quantity;
    count.setAttribute("aria-label", "Quantity");

    const plus = document.createElement("button");
    plus.className = "quantity-button";
    plus.type = "button";
    plus.textContent = "+";
    plus.setAttribute("aria-label", `Increase ${item.name} quantity`);
    plus.addEventListener("click", () => changeQuantity(item.name, 1));

    const remove = document.createElement("button");
    remove.className = "remove-button";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Remove ${item.name}`);
    remove.addEventListener("click", () => removeFromCart(item.name));

    controls.append(minus, count, plus, remove);
    row.append(info, controls);
    cartItemsElement.append(row);
  });
}
renderCart();

checkoutButton.addEventListener("click", () => {
  if (cart.length === 0) {
    showToast("Your cart is empty");
    return;
  }
  const summary = cart.map(item => `${item.quantity} × ${item.name}`).join("\n");
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  alert(`Thanks for your interest!\n\n${summary}\n\nSubtotal: ${formatEGP(total)}\n\nThis is a front-end demo. Online orders require a real checkout and backend.`);
});

/* Search and category filters work together */
const searchInput = $("#menuSearch");
const foodCards = $$(".food-card");
const categoryButtons = $$(".category-chip");
const noResults = $("#noResults");

function filterMenu() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  let visibleCount = 0;
  foodCards.forEach(card => {
    const matchesName = card.dataset.name.toLowerCase().includes(searchTerm);
    const matchesCategory = activeCategory === "all" || card.dataset.category === activeCategory;
    const visible = matchesName && matchesCategory;
    card.hidden = !visible;
    if (visible) visibleCount += 1;
  });
  noResults.hidden = visibleCount > 0;
}
searchInput.addEventListener("input", filterMenu);
categoryButtons.forEach(button => {
  button.addEventListener("click", () => {
    categoryButtons.forEach(chip => chip.classList.toggle("active", chip === button));
    activeCategory = button.dataset.category;
    filterMenu();
  });
});

/* Contact form: front-end demo only */
$("#contactForm").addEventListener("submit", event => {
  event.preventDefault();
  showToast("Thanks! This demo form does not send messages yet.");
  event.currentTarget.reset();
});

/* Current year and active navigation link */
$("#year").textContent = new Date().getFullYear();
const sections = $$("main section[id]");
const navItems = $$(".nav-link");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navItems.forEach(link => {
        link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: "-30% 0px -60% 0px" });
  sections.forEach(section => observer.observe(section));
}
