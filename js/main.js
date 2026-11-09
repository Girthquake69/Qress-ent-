/**
 * Qress-ent: Core frontend logic
 * Cart (localStorage), mobile nav, smooth interactions, WhatsApp ordering
 */

(function () {
  "use strict";

  // ========== CART ==========
  const CART_KEY = "qressent_order";

  // Anything that comes from storage or from data-* attributes is untrusted.
  // It is validated here and only ever written back to the page with textContent.
  function cleanText(value, max) {
    return String(value == null ? "" : value)
      .replace(/[\u0000-\u001F\u007F<>]/g, "")
      .trim()
      .slice(0, max || 80);
  }

  function cleanItem(raw) {
    if (!raw || typeof raw !== "object") return null;
    const id = cleanText(raw.id, 64);
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return null;
    const price = Number(raw.price);
    if (!Number.isFinite(price) || price < 0 || price > 1000000) return null;
    const currency = /^[A-Za-z]{2,4}$/.test(String(raw.currency || "")) ? String(raw.currency).toUpperCase() : "KSh";
    const qty = Math.min(99, Math.max(1, parseInt(raw.qty, 10) || 1));
    const name = cleanText(raw.name, 80);
    if (!name) return null;
    return { id: id, name: name, price: price, currency: currency, qty: qty };
  }

  function getCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY));
      if (!Array.isArray(parsed)) return [];
      return parsed.slice(0, 50).map(cleanItem).filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart.map(cleanItem).filter(Boolean)));
    } catch (e) {}
    updateCartUI();
  }

  function addToCart(product) {
    const item = cleanItem({ id: product.id, name: product.name, price: product.price, currency: product.currency, qty: 1 });
    if (!item) return;
    const cart = getCart();
    const existing = cart.find((entry) => entry.id === item.id);
    if (existing) {
      existing.qty = Math.min(99, existing.qty + 1);
    } else {
      cart.push(item);
    }
    saveCart(cart);
    showToast(item.name + " added to order");
  }

  function removeFromCart(id) {
    const cart = getCart().filter((item) => item.id !== id);
    saveCart(cart);
  }

  function updateCartUI() {
    const cart = getCart();
    const count = cart.reduce((sum, i) => sum + i.qty, 0);
    document.querySelectorAll(".cart-count").forEach((el) => {
      el.textContent = count > 0 ? count : "";
      el.style.display = count > 0 ? "flex" : "none";
    });
  }

  function buildWhatsAppMessage() {
    const cart = getCart();
    if (cart.length === 0) {
      return encodeURIComponent("Hello Qress-ent, I would like to place an order.");
    }
    let msg = "Hello Qress-ent! I would like to order:\n\n";
    cart.forEach((item) => {
      msg += "\u2022 " + item.name + " x " + item.qty + ": " + item.currency + " " + item.price + "\n";
    });
    msg += "\nPlease confirm availability and total. Thank you!";
    return encodeURIComponent(msg);
  }

  // WhatsApp business number
  const WHATSAPP_NUMBER = "254706813424";

  function openWhatsAppOrder() {
    // Open chat with no pre-filled message
    window.open("https://wa.me/" + WHATSAPP_NUMBER, "_blank", "noopener,noreferrer");
  }

  // ========== TOAST ==========
  let toastTimer = null;
  function showToast(text) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = cleanText(text, 120);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
  }

  // ========== NEWSLETTER FORM ==========
  // The form posts straight to the email provider. We only refuse input that
  // is malformed or carries markup/quote characters before it leaves the page.
  const EMAIL_RE = /^[^\s@<>"'`\\]{1,64}@[^\s@<>"'`\\]{1,190}\.[^\s@<>"'`\\]{2,24}$/;

  function initNewsletter() {
    document.querySelectorAll("form.newsletter-form").forEach((form) => {
      const input = form.querySelector('input[name="EMAIL"]');
      if (!input) return;
      form.setAttribute("novalidate", "");
      form.addEventListener("submit", (e) => {
        const value = cleanText(input.value, 254);
        input.value = value;
        if (!EMAIL_RE.test(value)) {
          e.preventDefault();
          input.setAttribute("aria-invalid", "true");
          input.focus();
          showToast("Please enter a valid email address");
          return;
        }
        input.removeAttribute("aria-invalid");
      });
      input.addEventListener("input", () => input.removeAttribute("aria-invalid"));
    });
  }

  // ========== MOBILE MENU ==========
  function initMobileMenu() {
    const toggle = document.querySelector(".menu-toggle");
    const links = document.querySelector(".nav-links");
    if (!toggle || !links) return;

    const setOpen = (open) => {
      links.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-open", open);
    };

    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setOpen(!links.classList.contains("open"));
    });

    links.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && links.classList.contains("open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", (e) => {
      if (!links.classList.contains("open")) return;
      if (toggle.contains(e.target) || links.contains(e.target)) return;
      setOpen(false);
    });
  }

  // ========== HEADER SCROLL ==========
  function initHeaderScroll() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle("scrolled", window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ========== PRODUCT TABS ==========
  function initTabs() {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const parent = btn.closest(".product-tabs");
        if (!parent) return;
        parent.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        parent.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
        btn.classList.add("active");
        const key = cleanText(btn.dataset.tab, 40);
        const panel = Array.from(parent.querySelectorAll("[data-panel]")).find((el) => el.dataset.panel === key);
        if (panel) panel.classList.add("active");
      });
    });
  }

  // ========== GLOBAL CLICK HANDLERS ==========
  document.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-add-to-order]");
    if (addBtn) {
      e.preventDefault();
      const product = {
        id: addBtn.dataset.id,
        name: addBtn.dataset.name,
        price: addBtn.dataset.price,
        currency: addBtn.dataset.currency || "KSh",
      };
      addToCart(product);
    }

    const waBtn = e.target.closest("[data-whatsapp-order]");
    if (waBtn) {
      e.preventDefault();
      openWhatsAppOrder();
    }
  });


  // ========== SCROLL REVEAL ==========
  function initScrollReveal() {
    // Avoid opacity:0 traps on tall mobile pages (essay/article bodies)
    const els = document.querySelectorAll(
      ".pillar, .culture-card, .product-card, .catherine-grid, .footer-grid > *, .editorial-row, .editorial-media, .editorial-copy, .philosophy-block, .essay-hero, .article-card, .story-block, .contact-card"
    );
    els.forEach((el, i) => {
      el.classList.add("reveal");
      const delay = Math.min(i % 5, 4);
      if (delay > 0) el.classList.add("reveal-delay-" + delay);
    });

    // Never hide heroes / long-form text / primary sections
    document.querySelectorAll(".hero, .page-hero, .essay-body, .article-body, .section, .article-page, .essay-page, main").forEach((h) => {
      h.classList.remove("reveal");
      h.classList.add("visible");
      h.style.opacity = "";
      h.style.transform = "";
    });

    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -4% 0px", threshold: 0.05 }
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    // Safety: if anything is still hidden after load, show it (mobile Safari quirks)
    setTimeout(() => {
      document.querySelectorAll(".reveal:not(.visible)").forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 80) el.classList.add("visible");
      });
    }, 600);
  }

  // ========== INIT ==========
  document.addEventListener("DOMContentLoaded", () => {
    initMobileMenu();
    initHeaderScroll();
    initTabs();
    initNewsletter();
    initScrollReveal();
    updateCartUI();
  });

  // Expose for debugging / future CMS
  window.Qressent = { getCart, addToCart, removeFromCart, openWhatsAppOrder };
})();
