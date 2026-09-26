/* ============================================================================
   GlobalZwItech — shared catalogue client.

   Every landing page includes this file. It fetches the products the admin
   assigned to the current page (GET /api/products?site=<slug>), renders them
   as a card grid in the page's product section, and opens a detail modal for
   each product. The modal lays out the product's content sections exactly as
   the admin composed them: every section image can sit on the left or the
   right, with the text on the opposite side.

   The page opts in by defining `window.GS_PRODUCTS_SITE` (the site slug) and
   providing a `<div id="gs-products-root">` where the section is mounted.
   Pages without either stay untouched. Styling rides on CSS custom properties
   the page already defines (--accent, --bg2, --border, --text, --muted …),
   with safe fallbacks, so the section inherits each page's theme.
   ========================================================================= */

(function (global) {
  "use strict";

  var API = "/api/products";
  var ROOT_ID = "gs-products-root";

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function cssVar(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  /* ---- modal ---- */

  var modalEl = null;
  var lastFocus = null;

  function ensureModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement("div");
    modalEl.className = "gsp-modal";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.hidden = true;
    modalEl.innerHTML =
      '<div class="gsp-modal__bd" data-gsp-close></div>' +
      '<div class="gsp-modal__card">' +
      '<button class="gsp-modal__x" type="button" aria-label="Close" data-gsp-close>' +
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
      "</button>" +
      '<div class="gsp-modal__body" data-gsp-body data-lenis-prevent></div>' +
      "</div>";
    document.body.appendChild(modalEl);

    modalEl.addEventListener("click", function (event) {
      if (event.target.closest("[data-gsp-close]")) close();
    });
    document.addEventListener("keydown", function (event) {
      if (!modalEl.hidden && event.key === "Escape") close();
    });

    return modalEl;
  }

  function specsHtml(product) {
    if (!product.specs || product.specs.length === 0) return "";
    var rows = product.specs
      .map(function (spec) {
        return "<tr><td>" + esc(spec.label) + "</td><td>" + esc(spec.value) + "</td></tr>";
      })
      .join("");
    return '<h3 class="gsp-h3">Specifications</h3><table class="gsp-specs">' + rows + "</table>";
  }

  function sectionsHtml(product) {
    if (!product.sections || product.sections.length === 0) return "";
    return product.sections
      .map(function (section) {
        var img = section.imageUrl
          ? '<div class="gsp-sec__img"><img src="' + esc(section.imageUrl) + '" alt="" loading="lazy" decoding="async" /></div>'
          : "";
        var txt =
          '<div class="gsp-sec__txt">' +
          (section.title ? '<h3 class="gsp-h3">' + esc(section.title) + "</h3>" : "") +
          "<p>" + esc(section.body).replace(/\n/g, "<br>") + "</p>" +
          "</div>";
        // The admin chooses which side the image sits on; CSS stacks on mobile.
        var flip = section.imageSide === "right" ? " gsp-sec--flip" : "";
        return '<div class="gsp-sec' + flip + '">' + img + txt + "</div>";
      })
      .join("");
  }

  function open(product) {
    var modal = ensureModal();
    var body = modal.querySelector("[data-gsp-body]");
    lastFocus = document.activeElement;

    body.innerHTML =
      (product.mainImage
        ? '<div class="gsp-modal__hero"><img src="' + esc(product.mainImage) + '" alt="" /></div>'
        : "") +
      (product.category ? '<span class="gsp-chip">' + esc(product.category) + "</span>" : "") +
      '<h2 class="gsp-h2">' + esc(product.name) + "</h2>" +
      '<p class="gsp-lead">' + esc(product.description) + "</p>" +
      specsHtml(product) +
      sectionsHtml(product);

    modal.hidden = false;
    document.body.style.overflow = "hidden";
    modal.querySelector(".gsp-modal__x").focus();
  }

  function close() {
    if (!modalEl || modalEl.hidden) return;
    modalEl.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---- section rendering ---- */

  function renderSection(root, products) {
    var accent = cssVar("--accent", "#059669");
    var meta = root.dataset || {};
    var eyebrow = meta.eyebrow || "Product catalogue";
    var title = meta.title || "Products on this page";
    var sub =
      meta.sub ||
      "Added from the admin portal. Select any product for full details, specifications and images.";

    var cards = products
      .map(function (product, index) {
        return (
          '<article class="gsp-card" data-gsp-open="' + index + '">' +
          (product.mainImage
            ? '<div class="gsp-card__ph"><img src="' + esc(product.mainImage) + '" alt="" loading="lazy" decoding="async" /></div>'
            : '<div class="gsp-card__ph gsp-card__ph--empty"></div>') +
          '<div class="gsp-card__body">' +
          (product.category ? '<span class="gsp-card__tag">' + esc(product.category) + "</span>" : "") +
          '<h3>' + esc(product.name) + "</h3>" +
          "<p>" + esc(product.description) + "</p>" +
          '<span class="gsp-card__cta">View details ' +
          '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
          "</span></div></article>"
        );
      })
      .join("");

    root.innerHTML =
      '<div class="gsp-wrap">' +
      '<div class="gsp-head">' +
      '<span class="gsp-eyebrow"><i style="background:linear-gradient(90deg,' + accent + ',transparent)"></i>' + esc(eyebrow) + "</span>" +
      '<h2 class="gsp-title">' + esc(title) + "</h2>" +
      '<p class="gsp-sub">' + esc(sub) + "</p>" +
      "</div>" +
      '<div class="gsp-grid">' + cards + "</div>" +
      "</div>";

    root.addEventListener("click", function (event) {
      var card = event.target.closest("[data-gsp-open]");
      if (!card) return;
      var product = products[Number(card.getAttribute("data-gsp-open"))];
      if (product) open(product);
    });
  }

  function init() {
    var site = global.GS_PRODUCTS_SITE;
    var root = document.getElementById(ROOT_ID);
    if (!site || !root) return;

    fetch(API + "?site=" + encodeURIComponent(site), {
      headers: { Accept: "application/json" },
    })
      .then(function (response) {
        return response.ok ? response.json() : { products: [] };
      })
      .catch(function () {
        return { products: [] };
      })
      .then(function (data) {
        var products = data && data.products ? data.products : [];
        // No products assigned to this page: leave no trace behind.
        if (products.length === 0) {
          root.remove();
          return;
        }
        renderSection(root, products);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
