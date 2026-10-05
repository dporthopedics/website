// dporthopedics — shared UI behaviour
(function () {
  // Current year
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  var header = document.querySelector(".site-header");

  /* ----------------------------------------------------------
     Mobile navigation
     ---------------------------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  var navOpen = false;
  var savedScroll = 0;
  var mq = window.matchMedia("(max-width: 900px)");

  if (toggle && links) {
    if (!links.id) links.id = "primary-nav";
    toggle.setAttribute("aria-controls", links.id);

    // Η σκίαση φτιάχνεται εδώ ώστε να μη χρειάζεται αλλαγή σε κάθε σελίδα.
    // Μπαίνει μέσα στο header: εκεί ζει και το panel, οπότε τα z-index
    // (backdrop 105 < panel 110 < burger 120) μένουν συγκρίσιμα.
    var backdrop = document.createElement("div");
    backdrop.className = "nav-backdrop";
    backdrop.hidden = false;
    if (header) header.insertBefore(backdrop, header.firstChild);
    else document.body.appendChild(backdrop);

    var lockScroll = function () {
      savedScroll = window.pageYOffset || document.documentElement.scrollTop || 0;
      document.body.style.top = -savedScroll + "px";
      document.body.classList.add("nav-lock");
    };

    var unlockScroll = function () {
      document.body.classList.remove("nav-lock");
      document.body.style.top = "";
      // Χωρίς αυτό το scroll-behavior: smooth της σελίδας κάνει animate
      // την επαναφορά και φαίνεται σαν να «πετάγεται» η σελίδα.
      var root = document.documentElement;
      var prev = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo(0, savedScroll);
      root.style.scrollBehavior = prev;
    };

    var closingTimer = null;

    var openNav = function () {
      if (navOpen) return;
      navOpen = true;
      if (closingTimer) { clearTimeout(closingTimer); closingTimer = null; }
      document.body.classList.remove("nav-closing");
      lockScroll();
      document.body.classList.add("nav-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Κλείσιμο μενού");
      links.scrollTop = 0;
    };

    var closeNav = function (returnFocus) {
      if (!navOpen) return;
      navOpen = false;
      // Κρατάμε το panel ορατό όσο γλιστράει προς τα έξω, μετά το κρύβουμε
      // πραγματικά ώστε να βγει από τη σειρά του Tab.
      document.body.classList.add("nav-closing");
      if (closingTimer) clearTimeout(closingTimer);
      closingTimer = setTimeout(function () {
        document.body.classList.remove("nav-closing");
        closingTimer = null;
      }, 500);
      document.body.classList.remove("nav-open");
      unlockScroll();
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Άνοιγμα μενού");
      if (returnFocus) toggle.focus();
    };

    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      if (navOpen) closeNav(false);
      else openNav();
    });

    // Κλείσιμο όταν ο χρήστης διαλέξει σελίδα (και για links με εικονίδιο μέσα)
    links.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest("a") : null;
      if (a && links.contains(a)) closeNav(false);
    });

    backdrop.addEventListener("click", function () { closeNav(true); });

    document.addEventListener("keydown", function (e) {
      if (navOpen && (e.key === "Escape" || e.key === "Esc")) closeNav(true);
    });

    // Αλλαγή προσανατολισμού / μεγέθυνση σε desktop: το panel δεν υπάρχει
    // πια, οπότε οι κλάσεις πρέπει να φύγουν αλλιώς η σελίδα μένει κλειδωμένη.
    var leaveMobile = function () {
      if (mq.matches) return;
      closeNav(false);
      // Σκέτο καθάρισμα, ακόμη κι αν χάθηκε κάπου το state.
      if (closingTimer) { clearTimeout(closingTimer); closingTimer = null; }
      document.body.classList.remove("nav-open", "nav-closing", "nav-lock");
      document.body.style.top = "";
    };
    if (mq.addEventListener) mq.addEventListener("change", leaveMobile);
    else if (mq.addListener) mq.addListener(leaveMobile);
    // Fallback: σε μερικά κινητά browsers το matchMedia δεν πυροδοτείται
    // αξιόπιστα στην περιστροφή της οθόνης.
    window.addEventListener("resize", leaveMobile, { passive: true });
    window.addEventListener("orientationchange", leaveMobile);
  }

  /* ----------------------------------------------------------
     Sticky header shadow
     ---------------------------------------------------------- */
  if (header) {
    var onScroll = function () {
      // Με ανοιχτό μενού το body είναι position: fixed και το scrollY
      // μηδενίζεται· χωρίς αυτό το guard η μπάρα «ξεθώριαζε» στο άνοιγμα.
      if (navOpen) return;
      header.classList.toggle("scrolled", window.pageYOffset > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ----------------------------------------------------------
     Reveal on scroll
     ---------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  // Dev aid / safety: reveal everything at once
  if (location.hash === "#showall") {
    document.body.classList.add("showall");
    revealEls.forEach(function (el) { el.classList.add("in"); });
    return;
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el, i) {
      el.style.setProperty("--d", (i % 6) * 55 + "ms");
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("in");
    });
  }
})();

/* ----------------------------------------------------------
   Κριτικές Google: μακριά κείμενα κόβονται με «Περισσότερα»,
   οι υπόλοιπες κάρτες ανοίγουν με «Όλες οι κριτικές».
   Χωρίς JS όλα τα κείμενα μένουν ολόκληρα (το clamp μπαίνει από εδώ).
   ---------------------------------------------------------- */
(function () {
  var grid = document.querySelector("[data-reviews]");
  if (!grid) return;

  var clampCards = function () {
    grid.querySelectorAll(".review-card").forEach(function (card) {
      if (card.dataset.open === "1") return;
      var text = card.querySelector(".review-text");
      var more = card.querySelector(".review-more");
      card.classList.add("is-clamped");
      if (!card.offsetParent) return; // κρυφή κάρτα, θα μετρηθεί όταν ανοίξει
      var over = text.scrollHeight > text.clientHeight + 2;
      if (!over) card.classList.remove("is-clamped");
      more.hidden = !over;
    });
  };

  grid.addEventListener("click", function (e) {
    var more = e.target.closest(".review-more");
    if (!more) return;
    var card = more.closest(".review-card");
    card.dataset.open = "1";
    card.classList.remove("is-clamped");
    more.hidden = true;
  });

  var all = document.querySelector("[data-reviews-all]");
  if (all) {
    all.addEventListener("click", function () {
      grid.classList.add("is-all");
      all.hidden = true;
      clampCards();
    });
  }

  clampCards();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(clampCards);
})();
