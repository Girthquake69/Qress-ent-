/**
 * Qress-ent — Core frontend logic
 * Cart (localStorage), mobile nav, smooth interactions, WhatsApp ordering
 */

(function () {
  "use strict";

  // ========== CART ==========
  const CART_KEY = "qressent_order";

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartUI();
  }

  function addToCart(product) {
    const cart = getCart();
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }
    saveCart(cart);
    showToast(`${product.name} added to order`);
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
      return "Hello Qress-ent, I would like to place an order.";
    }
    let msg = "Hello Qress-ent! I would like to order:\n\n";
    cart.forEach((item) => {
      msg += `• ${item.name} × ${item.qty} — ${item.currency || "KSh"} ${item.price}\n`;
    });
    msg += "\nPlease confirm availability and total. Thank you!";
    return encodeURIComponent(msg);
  }

  // WhatsApp business number
  const WHATSAPP_NUMBER = "254706813424";

  function openWhatsAppOrder() {
    // Open chat with no pre-filled message
    window.open(`https://wa.me/${WHATSAPP_NUMBER}`, "_blank");
  }

  // ========== TOAST ==========
  function showToast(text) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.style.cssText = `
        position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(80px);
        background: #2C1A0E; color: #FDF5E8; padding: 12px 24px; font-size: 0.9rem;
        border-radius: 2px; z-index: 999; transition: transform 0.3s ease; pointer-events: none;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    requestAnimationFrame(() => {
      toast.style.transform = "translateX(-50%) translateY(0)";
    });
    setTimeout(() => {
      toast.style.transform = "translateX(-50%) translateY(80px)";
    }, 2200);
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
        const panel = parent.querySelector(`[data-panel="${btn.dataset.tab}"]`);
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
    initScrollReveal();
    updateCartUI();
  });

  // Expose for debugging / future CMS
  window.Qressent = { getCart, addToCart, removeFromCart, openWhatsAppOrder };
})();
