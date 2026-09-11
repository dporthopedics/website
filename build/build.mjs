// ============================================================
//  dporthopedics — static site generator
//  Run:  node build/build.mjs
// ============================================================
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BASE, BIZ, SERVICES, AREAS, POSTS } from "./data.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Soro blog feed (client account) — rendered client-side on blog/index.html
const SORO_EMBED_URL = "https://app.trysoro.com/api/embed/62c180c2-10af-4f0e-b2d6-899e25d9103a";

const out = (p, html) => {
  const full = resolve(ROOT, p);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, html.trimStart() + "\n");
};

// depth-aware helpers -------------------------------------------------
// pathDepth = number of "../" needed to reach site root
const rel = (depth, p) => "../".repeat(depth) + p;
const abs = (p) => `${BASE}/${p}`;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const attr = (s) => esc(s).replace(/"/g, "&quot;");

// Πλήρης διεύθυνση για αναζήτηση στο Google Maps — με πόλη, ώστε να μην
// μπερδεύεται η Θέρμη Θεσσαλονίκης με ομώνυμες περιοχές αλλού.
const mapQuery = () => [BIZ.street, BIZ.area, BIZ.city, BIZ.postal].filter(Boolean).join(", ");

// ---- structured data: the clinic (LocalBusiness / MedicalClinic) ----
const clinicLD = {
  "@type": ["MedicalClinic", "MedicalBusiness", "LocalBusiness"],
  "@id": `${BASE}/#clinic`,
  name: BIZ.name,
  alternateName: BIZ.legalName,
  slogan: BIZ.tagline,
  url: BASE + "/",
  telephone: BIZ.phoneIntl,
  email: BIZ.email,
  image: abs("assets/dr-patousis.jpg"),
  logo: abs("assets/dp-orthopedics-logo.png"),
  priceRange: "€€",
  currenciesAccepted: "EUR",
  address: {
    "@type": "PostalAddress",
    streetAddress: BIZ.street,
    addressLocality: BIZ.area,
    addressRegion: BIZ.city,
    postalCode: BIZ.postal,
    addressCountry: BIZ.country,
  },
  geo: { "@type": "GeoCoordinates", latitude: BIZ.lat, longitude: BIZ.lng },
  hasMap: `https://www.google.com/maps?q=${encodeURIComponent(mapQuery())}`,
  areaServed: ["Θέρμη", "Θεσσαλονίκη", "Καλαμαριά", "Πυλαία", "Πανόραμα", "Ανατολική Θεσσαλονίκη"],
  openingHoursSpecification: [{
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "09:00", closes: "22:00",
  }],
  founder: {
    "@type": "Person",
    name: BIZ.doctor,
    jobTitle: BIZ.role,
    alumniOf: "Ιατρική Σχολή Αριστοτελείου Πανεπιστημίου Θεσσαλονίκης",
  },
};

const jsonLd = (obj) =>
  `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;

const breadcrumbLD = (depth, trail) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map((t, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: t.name,
    item: t.path ? abs(t.path) : undefined,
  })),
});

const faqLD = (faq) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map(([q, a]) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
});

// ---- <head> ---------------------------------------------------------
function head({ depth, title, desc, canonical, keywords, ld = [], image = "assets/dr-patousis.jpg", type = "website" }) {
  const r = (p) => rel(depth, p);
  const ldTags = ld.map(jsonLd).join("\n  ");
  return `
<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${attr(desc)}" />
  ${keywords ? `<meta name="keywords" content="${attr(keywords)}" />` : ""}
  <meta name="author" content="${attr(BIZ.legalName)}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <meta name="theme-color" content="#e8f0f8" />
  <link rel="canonical" href="${abs(canonical)}" />

  <meta property="og:site_name" content="${attr(BIZ.name)}" />
  <meta property="og:locale" content="el_GR" />
  <meta property="og:type" content="${type}" />
  <meta property="og:title" content="${attr(title)}" />
  <meta property="og:description" content="${attr(desc)}" />
  <meta property="og:url" content="${abs(canonical)}" />
  <meta property="og:image" content="${abs(image)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${attr(title)}" />
  <meta name="twitter:description" content="${attr(desc)}" />
  <meta name="twitter:image" content="${abs(image)}" />

  <link rel="icon" type="image/jpeg" href="${r("assets/dr-patousis.jpg")}" />
  <link rel="apple-touch-icon" href="${r("assets/dr-patousis.jpg")}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${r("styles.css")}" />
  ${ldTags ? "\n  " + ldTags : ""}
</head>
<body>`;
}

// ---- header ---------------------------------------------------------
function header(depth, active = "") {
  const r = (p) => rel(depth, p);
  const on = (k) => (active === k ? ' aria-current="page"' : "");
  const svcLinks = SERVICES.map(
    (s) => `<li><a href="${r("ypiresies/" + s.slug + ".html")}">${esc(s.nav)}</a></li>`
  ).join("\n            ");
  return `
  <a class="skip-link" href="#main">Μετάβαση στο περιεχόμενο</a>
  <header class="site-header" id="top">
    <nav class="nav container" aria-label="Κύρια πλοήγηση">
      <a href="${r("index.html")}" class="brand" aria-label="${attr(BIZ.name)} — Αρχική">
        <img class="brand-logo" src="${r("assets/dp-orthopedics-logo.png")}" alt="" width="1183" height="341" />
      </a>
      <button class="nav-toggle" aria-label="Άνοιγμα μενού" aria-expanded="false"><span></span><span></span><span></span></button>
      <ul class="nav-links">
        <li><a href="${r("index.html")}"${on("home")}>Αρχική</a></li>
        <li><a href="${r("i-giatros.html")}"${on("about")}>Ο Γιατρός</a></li>
        <li class="has-sub">
          <a href="${r("ypiresies/index.html")}"${on("services")}>Υπηρεσίες</a>
          <ul class="sub">
            ${svcLinks}
          </ul>
        </li>
        <li><a href="${r("perioches/index.html")}"${on("areas")}>Περιοχές</a></li>
        <li><a href="${r("blog/index.html")}"${on("blog")}>Blog</a></li>
        <li><a href="${r("epikoinonia.html")}"${on("contact")}>Επικοινωνία</a></li>
        <li><a href="${r("epikoinonia.html")}" class="btn btn-nav">Ραντεβού</a></li>
      </ul>
    </nav>
  </header>`;
}

// ---- breadcrumb visual ---------------------------------------------
function crumbs(depth, trail) {
  const r = (p) => rel(depth, p);
  const items = trail
    .map((t, i) =>
      i === trail.length - 1
        ? `<span aria-current="page">${esc(t.name)}</span>`
        : `<a href="${r(t.rel)}">${esc(t.name)}</a><span class="sep">/</span>`
    )
    .join(" ");
  return `<nav class="crumbs container" aria-label="Breadcrumb">${items}</nav>`;
}

// ---- CTA band -------------------------------------------------------
function ctaBand(depth) {
  const r = (p) => rel(depth, p);
  return `
  <section class="cta-band">
    <div class="container cta-inner">
      <div>
        <p class="eyebrow">Κλείστε το ραντεβού σας</p>
        <h2 class="cta-title">Η κίνησή σας, με σωστή ορθοπαιδική καθοδήγηση.</h2>
        <p class="cta-sub">Λειτουργούμε κατόπιν ραντεβού — επικοινωνήστε για αξιολόγηση.</p>
      </div>
      <div class="cta-actions">
        <a href="tel:${BIZ.phoneIntl}" class="btn btn-primary">Καλέστε ${esc(BIZ.phoneDisplay)}</a>
        <a href="${r("epikoinonia.html")}" class="btn btn-ghost">Στοιχεία Επικοινωνίας</a>
      </div>
    </div>
  </section>`;
}

// ---- contact section (αρχική + σελίδα επικοινωνίας) -----------------
function contactSection(tag = "h2", includeForm = false) {
  const messageButton = includeForm
    ? `\n            <a href="#contact-form" class="btn btn-ghost">Στείλτε μας μήνυμα</a>`
    : "";
  const form = includeForm ? `
        <div class="contact-form-panel reveal" id="contact-form">
          <div class="contact-form-intro">
            <p class="eyebrow">Φόρμα επικοινωνίας</p>
            <h2 class="contact-form-title">Στείλτε μας μήνυμα</h2>
            <p>Συμπληρώστε τα στοιχεία σας και θα επικοινωνήσουμε μαζί σας το συντομότερο δυνατό.</p>
          </div>
          <form class="contact-form" action="${attr(BIZ.formspreeEndpoint)}" method="POST">
            <input type="hidden" name="_subject" value="Νέο μήνυμα από το dporthopedics.gr" />
            <div class="form-honeypot" aria-hidden="true">
              <label for="contact-company">Εταιρεία</label>
              <input id="contact-company" type="text" name="_gotcha" tabindex="-1" autocomplete="off" />
            </div>
            <div class="form-field">
              <label for="contact-name">Ονοματεπώνυμο <span aria-hidden="true">*</span></label>
              <input id="contact-name" type="text" name="name" autocomplete="name" required maxlength="100" placeholder="Το ονοματεπώνυμό σας" />
            </div>
            <div class="form-field">
              <label for="contact-email">Email <span aria-hidden="true">*</span></label>
              <input id="contact-email" type="email" name="email" autocomplete="email" required maxlength="160" placeholder="name@example.com" />
            </div>
            <div class="form-field">
              <label for="contact-phone">Τηλέφωνο</label>
              <input id="contact-phone" type="tel" name="phone" autocomplete="tel" inputmode="tel" maxlength="30" placeholder="69X XXX XXXX" />
            </div>
            <div class="form-field">
              <label for="contact-topic">Θέμα</label>
              <select id="contact-topic" name="topic">
                <option value="Κλείσιμο ραντεβού">Κλείσιμο ραντεβού</option>
                <option value="Ερώτηση για υπηρεσία">Ερώτηση για υπηρεσία</option>
                <option value="Λοιπό">Λοιπό</option>
              </select>
            </div>
            <div class="form-field form-field--full">
              <label for="contact-message">Μήνυμα <span aria-hidden="true">*</span></label>
              <textarea id="contact-message" name="message" required maxlength="2000" rows="6" placeholder="Πώς μπορούμε να σας βοηθήσουμε;"></textarea>
            </div>
            <div class="form-field form-field--full form-consent">
              <input id="contact-consent" type="checkbox" name="consent" value="Ναι" required />
              <label for="contact-consent">Συμφωνώ να χρησιμοποιηθούν τα στοιχεία μου μόνο για την απάντηση στο αίτημά μου. <span aria-hidden="true">*</span></label>
            </div>
            <div class="form-field form-field--full form-footer">
              <p class="form-privacy">Μην συμπεριλάβετε ευαίσθητα ιατρικά δεδομένα. Για επείγον περιστατικό καλέστε το 112.</p>
              <button type="submit" class="btn btn-primary">Αποστολή μηνύματος <span aria-hidden="true">→</span></button>
            </div>
          </form>
        </div>` : "";
  return `
    <section class="contact" id="contact">
      <div class="container contact-grid">
        <div class="contact-copy">
          <p class="eyebrow reveal">Επικοινωνία</p>
          <${tag} class="section-title reveal">Κλείστε το ραντεβού σας</${tag}>
          <p class="contact-note reveal">Η λειτουργία του ιατρείου είναι <strong>κατόπιν ραντεβού</strong>. Επικοινωνήστε μαζί μας για να κανονίσουμε μαζί την επίσκεψή σας.</p>
          <ul class="contact-list">
            <li class="reveal"><span class="contact-label">Ωράριο</span><span class="contact-value">Καθημερινά και Σαββατοκύριακο, 09:00 – 22:00<br /><em>κατόπιν ραντεβού</em></span></li>
            <li class="reveal"><span class="contact-label">Διεύθυνση</span><span class="contact-value">${esc(BIZ.street)}, ${esc(BIZ.area)}<br />${esc(BIZ.city)}</span></li>
            <li class="reveal"><span class="contact-label">Τηλέφωνο</span><span class="contact-value"><a href="tel:${BIZ.phoneIntl}">${esc(BIZ.phoneDisplay)}</a></span></li>
            <li class="reveal"><span class="contact-label">Email</span><span class="contact-value"><a href="mailto:${BIZ.email}">${esc(BIZ.email)}</a></span></li>
          </ul>
          <div class="contact-actions reveal">
            <a href="tel:${BIZ.phoneIntl}" class="btn btn-primary">Καλέστε μας</a>
            <a href="mailto:${BIZ.email}" class="btn btn-ghost">Στείλτε Email</a>${messageButton}
          </div>
        </div>
        <div class="contact-map reveal">
          <iframe title="Χάρτης — ${attr(BIZ.street + ", " + BIZ.area + ", " + BIZ.city)}" src="https://www.google.com/maps?q=${encodeURIComponent(mapQuery())}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
        </div>
        ${form}
      </div>
    </section>`;
}

// ---- footer ---------------------------------------------------------
function footer(depth) {
  const r = (p) => rel(depth, p);
  const svcCols = SERVICES.map(
    (s) => `<a href="${r("ypiresies/" + s.slug + ".html")}">${esc(s.nav)}</a>`
  ).join("\n          ");
  return `
  <footer class="site-footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <a href="${r("index.html")}" class="footer-brandmark" aria-label="${attr(BIZ.name)} — Αρχική"><img class="brand-logo" src="${r("assets/dp-orthopedics-logo.png")}" alt="" width="1183" height="341" loading="lazy" /></a>
        <p class="footer-tag">${esc(BIZ.tagline)}</p>
        <p class="footer-addr">
          ${esc(BIZ.street)}, ${esc(BIZ.area)}<br />
          ${esc(BIZ.city)}, Τ.Κ. ${esc(BIZ.postal)}
        </p>
        <div class="footer-social">
          <a href="${BIZ.instagram}" target="_blank" rel="noopener noreferrer" aria-label="Instagram">Instagram</a>
          <a href="${BIZ.tiktok}" target="_blank" rel="noopener noreferrer" aria-label="TikTok">TikTok</a>
          <a href="${BIZ.facebook}" target="_blank" rel="noopener noreferrer" aria-label="Facebook">Facebook</a>
        </div>
      </div>

      <div class="footer-col">
        <h3>Υπηρεσίες</h3>
        <nav aria-label="Υπηρεσίες" class="footer-links">
          ${svcCols}
        </nav>
      </div>

      <div class="footer-col">
        <h3>Εξερεύνηση</h3>
        <nav aria-label="Πλοήγηση" class="footer-links">
          <a href="${r("index.html")}">Αρχική</a>
          <a href="${r("i-giatros.html")}">Ο Γιατρός</a>
          <a href="${r("ypiresies/index.html")}">Όλες οι Υπηρεσίες</a>
          <a href="${r("perioches/index.html")}">Περιοχές που Εξυπηρετούμε</a>
          <a href="${r("blog/index.html")}">Blog</a>
          <a href="${r("epikoinonia.html")}">Επικοινωνία</a>
        </nav>
      </div>

      <div class="footer-col">
        <h3>Επικοινωνία</h3>
        <nav aria-label="Επικοινωνία" class="footer-links">
          <a href="tel:${BIZ.phoneIntl}">${esc(BIZ.phoneDisplay)}</a>
          <a href="mailto:${BIZ.email}">${esc(BIZ.email)}</a>
        </nav>
        <p class="footer-hours">${esc(BIZ.hours)}</p>
      </div>
    </div>

    <div class="footer-bottom">
      <p class="footer-copy">© <span id="year">2026</span> ${esc(BIZ.legalName)}. Με επιφύλαξη παντός δικαιώματος.</p>
      <p class="cb-credit">Made by <a href="https://clinicbrain.gr/?utm_source=client-site&amp;utm_medium=footer&amp;utm_campaign=made-by" target="_blank" rel="noopener noreferrer">CLINICBRAIN</a></p>
    </div>
  </footer>
  <script src="${r("main.js")}" defer></script>
</body>
</html>`;
}

// ====================================================================
//  PAGE: HOME
// ====================================================================
function pageHome() {
  const depth = 0;
  const r = (p) => rel(depth, p);
  const svcCards = SERVICES.map(
    (s, i) => `
        <a class="svc reveal" href="${r("ypiresies/" + s.slug + ".html")}">
          <span class="svc-icon" aria-hidden="true">${s.icon}</span>
          <span class="svc-num">${String(i + 1).padStart(2, "0")}</span>
          <h3>${esc(s.h1)}</h3>
          <p>${esc(s.lead)}</p>
          <span class="svc-more">Μάθετε περισσότερα →</span>
        </a>`
  ).join("");

  const ld = [
    { "@context": "https://schema.org", ...clinicLD },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: BIZ.name,
      url: BASE + "/",
      inLanguage: "el",
    },
    breadcrumbLD(depth, [{ name: "Αρχική", path: "index.html" }]),
  ];

  return head({
    depth,
    title: `Ορθοπαιδικός Θεσσαλονίκη | ${BIZ.doctor} — ${BIZ.name}`,
    desc: `${BIZ.name} — ${BIZ.doctor}, ${BIZ.role} στη Θεσσαλονίκη. Εξειδίκευση στη χειρουργική ώμου, αθλητικές κακώσεις, τραυματολογία και σύγχρονη αντιμετώπιση παθήσεων μυοσκελετικού. Κατόπιν ραντεβού.`,
    canonical: "index.html",
    keywords: "ορθοπαιδικός Θεσσαλονίκη, ορθοπεδικός Θεσσαλονίκη, χειρουργός ώμου Θεσσαλονίκη, αρθροσκόπηση ώμου, ρήξη μηνίσκου, πρόσθιος χιαστός, Αθανάσιος Πατούσης",
    ld,
  }) +
    header(depth, "home") +
    `
  <main id="main">
    <section class="hero" id="hero">
      <div class="hero-inner container">
        <div class="hero-copy">
          <p class="eyebrow reveal">${esc(BIZ.role)} · Θεσσαλονίκη</p>
          <h1 class="hero-title reveal">Κίνηση<br />με <em>Σιγουριά.</em></h1>
          <p class="hero-lead reveal">Στο ${esc(BIZ.name)}, η διεθνής εξειδίκευση στη χειρουργική ώμου και η σύγχρονη ορθοπαιδική προσέγγιση συναντούν την εξατομικευμένη φροντίδα.</p>
          <div class="hero-actions reveal">
            <a href="${r("epikoinonia.html")}" class="btn btn-primary">Κλείστε Ραντεβού</a>
            <a href="${r("ypiresies/index.html")}" class="btn btn-ghost">Οι Υπηρεσίες μας</a>
          </div>
          <div class="booking-platforms reveal" aria-label="Online κράτηση ραντεβού">
            <span class="booking-platforms-label">Κλείστε online μέσω</span>
            <div class="booking-platforms-links">
              <a class="booking-platform booking-platform--instadoctor" href="${attr(BIZ.instadoctor)}" target="_blank" rel="noopener noreferrer" aria-label="Κλείστε ραντεβού μέσω instadoctor.gr (ανοίγει σε νέα καρτέλα)">
                <span class="booking-platform-mark" aria-hidden="true">i<span>+</span></span>
                <span>instadoctor.gr</span>
                <span class="booking-platform-arrow" aria-hidden="true">↗</span>
              </a>
              <a class="booking-platform booking-platform--doctoranytime" href="${attr(BIZ.doctoranytime)}" target="_blank" rel="noopener noreferrer" aria-label="Κλείστε ραντεβού μέσω doctoranytime (ανοίγει σε νέα καρτέλα)">
                <span class="booking-platform-mark" aria-hidden="true">do</span>
                <span>doctoranytime</span>
                <span class="booking-platform-arrow" aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>
        <figure class="hero-photo reveal">
          <picture>
            <source media="(max-width: 900px)" srcset="${r("assets/hero-bg-mobile.webp")}" />
            <img src="${r("assets/hero-photo.webp")}" alt="Ο Αθανάσιος Πατούσης σε αρθροσκόπηση ώμου στο χειρουργείο, με την εικόνα του αρθροσκοπίου στην οθόνη" decoding="async" width="960" height="1200" />
          </picture>
        </figure>
      </div>
    </section>

    <div class="strip" aria-hidden="true">
      <div class="strip-track">
        <span>Χειρουργική Ώμου</span><span class="dot">•</span>
        <span>Αθλητικές Κακώσεις</span><span class="dot">•</span>
        <span>Τραυματολογία</span><span class="dot">•</span>
        <span>Εξατομικευμένη Αποκατάσταση</span><span class="dot">•</span>
        <span>Χειρουργική Ώμου</span><span class="dot">•</span>
        <span>Αθλητικές Κακώσεις</span><span class="dot">•</span>
        <span>Τραυματολογία</span><span class="dot">•</span>
        <span>Εξατομικευμένη Αποκατάσταση</span><span class="dot">•</span>
      </div>
    </div>

    <section class="about" id="about">
      <div class="container about-grid">
        <div class="about-media reveal">
          <img src="${r("assets/dr-patousis.jpg")}" alt="${attr(BIZ.doctor)}, ${attr(BIZ.role)} — ${attr(BIZ.name)}, Θεσσαλονίκη" width="984" height="1050" />
          <div class="about-badge">
            <span class="about-badge-num">FEBOT</span>
            <span class="about-badge-label">European Board of<br />Orthopaedics &amp; Traumatology</span>
          </div>
        </div>
        <div class="about-copy">
          <p class="eyebrow reveal">Ο Γιατρός</p>
          <h2 class="section-title reveal">${esc(BIZ.doctor)}</h2>
          <p class="about-role reveal">${esc(BIZ.role)}</p>
          <p class="reveal">Ο Αθανάσιος Πατούσης είναι Ορθοπαιδικός Χειρουργός με σύγχρονη εκπαίδευση και διεθνή εμπειρία σε όλο το φάσμα της Ορθοπαιδικής και Τραυματολογίας.</p>
          <p class="reveal">Διαθέτει εξειδίκευση στη χειρουργική ώμου, fellowship στην αρθροσκοπική χειρουργική ώμου στη Βαρκελώνη και πανευρωπαϊκό τίτλο FEBOT.</p>
          <a href="${r("i-giatros.html")}" class="btn btn-ghost reveal">Το πλήρες βιογραφικό →</a>
        </div>
      </div>
    </section>

    <section class="services" id="services">
      <div class="container">
        <div class="section-head reveal">
          <p class="eyebrow">Υπηρεσίες</p>
          <h2 class="section-title">Ολοκληρωμένη ορθοπαιδική φροντίδα,<br />με διεθνή εξειδίκευση</h2>
        </div>
        <div class="services-grid">${svcCards}
        </div>
      </div>
    </section>

    <section class="philosophy" id="philosophy">
      <div class="container philosophy-inner reveal">
        <p class="eyebrow">Η Φιλοσοφία μας</p>
        <span class="philosophy-mark" aria-hidden="true">&ldquo;</span>
        <blockquote>Με επίκεντρο τον άνθρωπο, στόχος είναι η <em>γρήγορη, ασφαλής και λειτουργική αποκατάσταση</em> μέσα από λεπτομερή κλινική αξιολόγηση και εξατομικευμένη θεραπευτική προσέγγιση.</blockquote>
        <cite class="philosophy-cite">${esc(BIZ.doctor)} · ${esc(BIZ.role)}</cite>
      </div>
    </section>

    <section class="areas-teaser">
      <div class="container">
        <div class="section-head reveal">
          <p class="eyebrow">Περιοχές</p>
          <h2 class="section-title">Εξυπηρετούμε τη Θεσσαλονίκη</h2>
        </div>
        <div class="chips reveal">
          ${AREAS.map((a) => `<a href="${r("perioches/" + a.slug + ".html")}" class="chip">${esc(a.name)}</a>`).join("\n          ")}
        </div>
      </div>
    </section>
` +
    contactSection("h2", true) +
    `
  </main>` +
    ctaBand(depth) +
    footer(depth);
}

// ====================================================================
//  PAGE: ABOUT
// ====================================================================
function pageAbout() {
  const depth = 0;
  const r = (p) => rel(depth, p);
  const trail = [
    { name: "Αρχική", rel: "index.html", path: "index.html" },
    { name: "Ο Γιατρός", rel: "i-giatros.html", path: "i-giatros.html" },
  ];
  const ld = [
    breadcrumbLD(depth, trail),
    {
      "@context": "https://schema.org",
      "@type": "Physician",
      name: BIZ.doctor,
      jobTitle: BIZ.role,
      image: abs("assets/dr-patousis.jpg"),
      url: abs("i-giatros.html"),
      alumniOf: "Ιατρική Σχολή Αριστοτελείου Πανεπιστημίου Θεσσαλονίκης",
      award: "FEBOT — Fellow of the European Board of Orthopaedics and Traumatology",
      worksFor: { "@id": `${BASE}/#clinic` },
    },
  ];
  return head({
    depth,
    title: `${BIZ.doctor} — ${BIZ.role} | ${BIZ.name}`,
    desc: `Γνωρίστε τον ${BIZ.doctor}, ${BIZ.role}, FEBOT, με εξειδίκευση στη χειρουργική ώμου, fellowship στη Βαρκελώνη και συνεργασία με την Κλινική Άγιος Λουκάς.`,
    canonical: "i-giatros.html",
    keywords: "Αθανάσιος Πατούσης, ορθοπαιδικός χειρουργός Θεσσαλονίκη, FEBOT, χειρουργική ώμου, Άγιος Λουκάς",
    image: "assets/dr-patousis.jpg",
    ld,
    type: "profile",
  }) +
    header(depth, "about") +
    crumbs(depth, trail) +
    `
  <main id="main">
    <section class="about about-page">
      <div class="container about-grid">
        <div class="about-media reveal">
          <img src="${r("assets/dr-patousis.jpg")}" alt="${attr(BIZ.doctor)}, ${attr(BIZ.role)}" width="984" height="1050" />
          <div class="about-badge"><span class="about-badge-num">FEBOT</span><span class="about-badge-label">European Board<br />Orthopaedics</span></div>
        </div>
        <div class="about-copy">
          <p class="eyebrow reveal">Ο Γιατρός</p>
          <h1 class="section-title reveal">${esc(BIZ.doctor)}</h1>
          <p class="about-role reveal">${esc(BIZ.role)}</p>
          <p class="reveal">Ο Αθανάσιος Πατούσης είναι Ορθοπαιδικός Χειρουργός με σύγχρονη εκπαίδευση και διεθνή εμπειρία σε όλο το φάσμα της Ορθοπαιδικής και Τραυματολογίας. Διαθέτει εξειδίκευση στη χειρουργική ώμου, η οποία αποκτήθηκε σε αναγνωρισμένα κέντρα του εξωτερικού.</p>
          <p class="reveal">Ασχολείται με τις αθλητικές κακώσεις και τη σύγχρονη αντιμετώπιση τραυματικών και εκφυλιστικών παθήσεων του μυοσκελετικού συστήματος, προσφέροντας εξατομικευμένη και ολοκληρωμένη φροντίδα.</p>
          <p class="reveal">Απέκτησε τον πανευρωπαϊκό τίτλο FEBOT κατόπιν επιτυχούς συμμετοχής σε γραπτές και προφορικές εξετάσεις στη Μαδρίτη, ενώ είναι GMC Registered Specialist with Licence to Practise στο Ηνωμένο Βασίλειο.</p>
          <p class="reveal">Είναι Υποψήφιος Διδάκτωρ της Ιατρικής Σχολής του ΑΠΘ με ερευνητικό αντικείμενο την αστάθεια αγκώνα και έχει πραγματοποιήσει μεταπτυχιακές σπουδές στη Δημόσια Υγεία στο Ευρωπαϊκό Πανεπιστήμιο Κύπρου.</p>
          <p class="reveal">Το 2026 ολοκλήρωσε fellowship στην αρθροσκοπική χειρουργική ώμου στη Βαρκελώνη και σήμερα είναι συνεργάτης της Κλινικής Άγιος Λουκάς στη Θεσσαλονίκη.</p>
        </div>
      </div>
    </section>

    <section class="creds">
      <div class="container">
        <div class="creds-grid">
          <div class="cred reveal"><span class="cred-k">FEBOT</span><span class="cred-v">Fellow of the European Board of Orthopaedics and Traumatology</span></div>
          <div class="cred reveal"><span class="cred-k">Βαρκελώνη</span><span class="cred-v">Fellowship αρθροσκοπικής χειρουργικής ώμου</span></div>
          <div class="cred reveal"><span class="cred-k">ΑΠΘ</span><span class="cred-v">Υποψήφιος Διδάκτωρ Ιατρικής Σχολής</span></div>
          <div class="cred reveal"><span class="cred-k">Άγιος Λουκάς</span><span class="cred-v">Συνεργάτης της Κλινικής Άγιος Λουκάς Θεσσαλονίκης</span></div>
        </div>
      </div>
    </section>

    <section class="philosophy">
      <div class="container philosophy-inner reveal">
        <p class="eyebrow">Η Φιλοσοφία μας</p>
        <span class="philosophy-mark" aria-hidden="true">&ldquo;</span>
        <blockquote>Η συνεχής επιστημονική εκπαίδευση και η εξατομικευμένη προσέγγιση αποτελούν τη βάση για <em>ασφαλή, λειτουργική αποκατάσταση</em> και επιστροφή στις καθημερινές και αθλητικές δραστηριότητες.</blockquote>
        <cite class="philosophy-cite">${esc(BIZ.doctor)} · ${esc(BIZ.role)}</cite>
      </div>
    </section>
  </main>` +
    ctaBand(depth) +
    footer(depth);
}

// ====================================================================
//  PAGE: SERVICES HUB
// ====================================================================
function pageServicesHub() {
  const depth = 1;
  const r = (p) => rel(depth, p);
  const trail = [
    { name: "Αρχική", rel: "index.html", path: "index.html" },
    { name: "Υπηρεσίες", rel: "ypiresies/index.html", path: "ypiresies/index.html" },
  ];
  const cards = SERVICES.map(
    (s, i) => `
        <a class="svc reveal" href="${r("ypiresies/" + s.slug + ".html")}">
          <span class="svc-icon" aria-hidden="true">${s.icon}</span>
          <span class="svc-num">${String(i + 1).padStart(2, "0")}</span>
          <h2>${esc(s.h1)}</h2>
          <p>${esc(s.lead)}</p>
          <span class="svc-more">Μάθετε περισσότερα →</span>
        </a>`
  ).join("");
  const ld = [
    breadcrumbLD(depth, trail),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: SERVICES.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: s.h1,
        url: abs("ypiresies/" + s.slug + ".html"),
      })),
    },
  ];
  return head({
    depth,
    title: `Υπηρεσίες Ορθοπαιδικής | ${BIZ.name}, Θεσσαλονίκη`,
    desc: `Υπηρεσίες ορθοπαιδικής από τον ${BIZ.doctor}: αρθροσκόπηση ώμου, ρήξη μηνίσκου, πρόσθιος χιαστός, οστεοαρθρίτιδα, κατάγματα, ρήξεις τενόντων και βιολογικές θεραπείες.`,
    canonical: "ypiresies/index.html",
    keywords: "υπηρεσίες ορθοπαιδικού, αρθροσκόπηση ώμου, ρήξη μηνίσκου, πρόσθιος χιαστός, οστεοαρθρίτιδα, κατάγματα, PRP Θεσσαλονίκη",
    ld,
  }) +
    header(depth, "services") +
    crumbs(depth, trail) +
    `
  <main id="main">
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow reveal">Υπηρεσίες</p>
        <h1 class="page-title reveal">Ολοκληρωμένη ορθοπαιδική φροντίδα</h1>
        <p class="page-lead reveal">Από την κλινική αξιολόγηση και τη συντηρητική θεραπεία μέχρι τις σύγχρονες αρθροσκοπικές τεχνικές και την αποκατάσταση — με εξατομικευμένη προσέγγιση.</p>
      </div>
    </section>
    <section class="services services--hub">
      <div class="container">
        <div class="services-grid">${cards}
        </div>
      </div>
    </section>
  </main>` +
    ctaBand(depth) +
    footer(depth);
}

// ====================================================================
//  PAGE: SERVICE DETAIL
// ====================================================================
// Πρόσθετες ενότητες σελίδας υπηρεσίας: τίτλος H2, προαιρετική εισαγωγή και
// προαιρετική λίστα (ticks). Επιτρέπεται HTML μέσα σε intro/items/outro.
function svcSections(sections) {
  if (!sections || !sections.length) return "";
  return sections
    .map((sec) => {
      const intro = sec.intro ? `\n          <p class="reveal">${sec.intro}</p>` : "";
      const items = sec.items && sec.items.length
        ? `\n          <ul class="ticks">\n            ${sec.items.map((i) => `<li class="reveal">${i}</li>`).join("\n            ")}\n          </ul>`
        : "";
      const outro = sec.outro ? `\n          <p class="reveal">${sec.outro}</p>` : "";
      return `\n          <h2 class="reveal">${esc(sec.h2)}</h2>${intro}${items}${outro}\n`;
    })
    .join("");
}

function pageService(s, idx) {
  const depth = 1;
  const r = (p) => rel(depth, p);
  const trail = [
    { name: "Αρχική", rel: "index.html", path: "index.html" },
    { name: "Υπηρεσίες", rel: "ypiresies/index.html", path: "ypiresies/index.html" },
    { name: s.nav, rel: "ypiresies/" + s.slug + ".html", path: "ypiresies/" + s.slug + ".html" },
  ];
  const related = SERVICES.filter((x) => x.slug !== s.slug).slice(0, 4);
  const ld = [
    breadcrumbLD(depth, trail),
    {
      "@context": "https://schema.org",
      "@type": "MedicalProcedure",
      name: s.h1,
      description: s.desc,
      url: abs("ypiresies/" + s.slug + ".html"),
      ...(s.image ? { image: abs(s.image) } : {}),
      provider: { "@id": `${BASE}/#clinic` },
    },
    faqLD(s.faq),
  ];
  return head({
    depth,
    title: s.title,
    desc: s.desc,
    canonical: "ypiresies/" + s.slug + ".html",
    keywords: s.keywords,
    ld,
    image: s.image || undefined,
    type: "article",
  }) +
    header(depth, "services") +
    crumbs(depth, trail) +
    `
  <main id="main">
    <section class="page-hero page-hero--svc">
      <div class="container">
        <span class="svc-hero-icon" aria-hidden="true">${s.icon}</span>
        <p class="eyebrow reveal">Υπηρεσία ${String(idx + 1).padStart(2, "0")}</p>
        <h1 class="page-title reveal">${esc(s.h1)}</h1>
        <p class="page-lead reveal">${esc(s.lead)}</p>
        <div class="hero-actions reveal"><a href="${r("epikoinonia.html")}" class="btn btn-primary">Κλείστε Ραντεβού</a></div>
      </div>
    </section>

    <section class="svc-detail">
      <div class="container svc-detail-grid">
        <article class="svc-body">
          ${s.image ? `<figure class="svc-figure reveal"><img src="${r(s.image)}" alt="${attr(s.imageAlt || s.h1)}" loading="lazy" decoding="async" /></figure>\n          ` : ""}${s.body.map((p) => `<p class="reveal">${p}</p>`).join("\n          ")}
${svcSections(s.sections)}
          <h2 class="reveal">Τι περιλαμβάνει</h2>
          <ul class="ticks">
            ${s.includes.map((i) => `<li class="reveal">${esc(i)}</li>`).join("\n            ")}
          </ul>

          <h2 class="reveal">Συχνές ερωτήσεις</h2>
          <div class="faq">
            ${s.faq
              .map(
                ([q, a]) => `<details class="faq-item reveal"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`
              )
              .join("\n            ")}
          </div>
        </article>

        <aside class="svc-aside">
          <div class="aside-card reveal">
            <h3>Κλείστε ραντεβού</h3>
            <p>Λειτουργούμε κατόπιν ραντεβού. Επικοινωνήστε για να σας εξυπηρετήσουμε.</p>
            <a href="tel:${BIZ.phoneIntl}" class="btn btn-primary btn-block">${esc(BIZ.phoneDisplay)}</a>
            <a href="mailto:${BIZ.email}" class="btn btn-ghost btn-block">${esc(BIZ.email)}</a>
            <p class="aside-meta">${esc(BIZ.street)}, ${esc(BIZ.area)}<br />${esc(BIZ.city)}, ${esc(BIZ.postal)}</p>
          </div>
          <div class="aside-card reveal">
            <h3>Άλλες υπηρεσίες</h3>
            <nav class="aside-links">
              ${related.map((x) => `<a href="${r("ypiresies/" + x.slug + ".html")}">${esc(x.nav)} →</a>`).join("\n              ")}
            </nav>
          </div>
        </aside>
      </div>
    </section>
  </main>` +
    ctaBand(depth) +
    footer(depth);
}

// ====================================================================
//  PAGE: AREAS HUB
// ====================================================================
function pageAreasHub() {
  const depth = 1;
  const r = (p) => rel(depth, p);
  const trail = [
    { name: "Αρχική", rel: "index.html", path: "index.html" },
    { name: "Περιοχές", rel: "perioches/index.html", path: "perioches/index.html" },
  ];
  const cards = AREAS.map(
    (a) => `
        <a class="area-card reveal" href="${r("perioches/" + a.slug + ".html")}">
          <h2>${esc(a.name)}</h2>
          <p>${esc(a.blurb)}</p>
          <span class="svc-more">Δείτε περισσότερα →</span>
        </a>`
  ).join("");
  const ld = [breadcrumbLD(depth, trail)];
  return head({
    depth,
    title: `Περιοχές που Εξυπηρετούμε | ${BIZ.name}, Θεσσαλονίκη`,
    desc: `Το ${BIZ.name} στην περιοχή της Θέρμης εξυπηρετεί Θέρμη, Θεσσαλονίκη, Καλαμαριά, Πυλαία, Πανόραμα και ανατολική Θεσσαλονίκη.`,
    canonical: "perioches/index.html",
    keywords: "ορθοπαιδικός Θέρμη, ορθοπεδικός Θεσσαλονίκη, ορθοπαιδικός Καλαμαριά, ορθοπαιδικός Πυλαία, ορθοπαιδικός Πανόραμα",
    ld,
  }) +
    header(depth, "areas") +
    crumbs(depth, trail) +
    `
  <main id="main">
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow reveal">Περιοχές</p>
        <h1 class="page-title reveal">Κοντά σας, στην ανατολική Θεσσαλονίκη</h1>
        <p class="page-lead reveal">Με έδρα την περιοχή της Θέρμης, εξυπηρετούμε ασθενείς από τη Θεσσαλονίκη και τις γύρω περιοχές.</p>
      </div>
    </section>
    <section class="areas">
      <div class="container">
        <div class="areas-grid">${cards}
        </div>
      </div>
    </section>
  </main>` +
    ctaBand(depth) +
    footer(depth);
}

// ====================================================================
//  PAGE: AREA DETAIL
// ====================================================================
function pageArea(a) {
  const depth = 1;
  const r = (p) => rel(depth, p);
  const trail = [
    { name: "Αρχική", rel: "index.html", path: "index.html" },
    { name: "Περιοχές", rel: "perioches/index.html", path: "perioches/index.html" },
    { name: a.name, rel: "perioches/" + a.slug + ".html", path: "perioches/" + a.slug + ".html" },
  ];
  const localFaq = [
    [`Πού βρίσκεται το ιατρείο;`, `Το ${BIZ.name} βρίσκεται στη διεύθυνση ${BIZ.street}, ${BIZ.area}, ${BIZ.city}, με εύκολη πρόσβαση από ${a.name}.`],
    [`Πώς κλείνω ραντεβού;`, `Καλέστε στο ${BIZ.phoneDisplay} ή στείλτε email στο ${BIZ.email}. Λειτουργούμε κατόπιν ραντεβού.`],
    [`Ποιες υπηρεσίες προσφέρετε;`, `Προσφέρουμε ορθοπαιδική αξιολόγηση και θεραπεία για παθήσεις ώμου, γόνατος, αθλητικές κακώσεις, κατάγματα, οστεοαρθρίτιδα, ρήξεις τενόντων και βιολογικές θεραπείες.`],
  ];
  const ld = [
    breadcrumbLD(depth, trail),
    { "@context": "https://schema.org", ...clinicLD, areaServed: a.name },
    faqLD(localFaq),
  ];
  return head({
    depth,
    title: a.title,
    desc: a.desc,
    canonical: "perioches/" + a.slug + ".html",
    keywords: a.keywords,
    ld,
  }) +
    header(depth, "areas") +
    crumbs(depth, trail) +
    `
  <main id="main">
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow reveal">Περιοχή εξυπηρέτησης</p>
        <h1 class="page-title reveal">${esc(a.h1)}</h1>
        <p class="page-lead reveal">${esc(a.blurb)}</p>
        <div class="hero-actions reveal">
          <a href="tel:${BIZ.phoneIntl}" class="btn btn-primary">Καλέστε ${esc(BIZ.phoneDisplay)}</a>
          <a href="${r("epikoinonia.html")}" class="btn btn-ghost">Επικοινωνία &amp; Χάρτης</a>
        </div>
      </div>
    </section>

    <section class="svc-detail">
      <div class="container svc-detail-grid">
        <article class="svc-body">
          <h2 class="reveal">Οι υπηρεσίες μας για κατοίκους ${esc(a.name)}</h2>
          <ul class="ticks two-col">
            ${SERVICES.map((s) => `<li class="reveal"><a href="${r("ypiresies/" + s.slug + ".html")}">${esc(s.h1)}</a></li>`).join("\n            ")}
          </ul>
          <h2 class="reveal">Συχνές ερωτήσεις</h2>
          <div class="faq">
            ${localFaq.map(([q, ans]) => `<details class="faq-item reveal"><summary>${esc(q)}</summary><p>${esc(ans)}</p></details>`).join("\n            ")}
          </div>
        </article>
        <aside class="svc-aside">
          <div class="aside-card reveal">
            <h3>Στοιχεία επικοινωνίας</h3>
            <p class="aside-meta">${esc(BIZ.street)}, ${esc(BIZ.area)}<br />${esc(BIZ.city)}, ${esc(BIZ.postal)}</p>
            <a href="tel:${BIZ.phoneIntl}" class="btn btn-primary btn-block">${esc(BIZ.phoneDisplay)}</a>
            <a href="mailto:${BIZ.email}" class="btn btn-ghost btn-block">${esc(BIZ.email)}</a>
            <p class="aside-meta">${esc(BIZ.hours)}</p>
          </div>
        </aside>
      </div>
    </section>
  </main>` +
    ctaBand(depth) +
    footer(depth);
}

// ====================================================================
//  PAGE: BLOG HUB
// ====================================================================
function pageBlogHub() {
  const depth = 1;
  const r = (p) => rel(depth, p);
  const trail = [
    { name: "Αρχική", rel: "index.html", path: "index.html" },
    { name: "Blog", rel: "blog/index.html", path: "blog/index.html" },
  ];
  const posts = [...POSTS].sort((x, y) => (x.date < y.date ? 1 : -1));
  const cards = posts.map(
    (p) => `
        <a class="post-card reveal" href="${r("blog/" + p.slug + ".html")}">
          <span class="post-cat">${esc(p.cat)}</span>
          <h2>${esc(p.title)}</h2>
          <p>${esc(p.excerpt)}</p>
          <time datetime="${p.date}">${fmtDate(p.date)}</time>
        </a>`
  ).join("");
  const ld = [
    breadcrumbLD(depth, trail),
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: BIZ.name + " — Blog",
      url: abs("blog/index.html"),
      inLanguage: "el",
    },
  ];
  return head({
    depth,
    title: `Blog — Ορθοπαιδική Ενημέρωση | ${BIZ.name}`,
    desc: "Άρθρα και οδηγοί για παθήσεις ώμου, γόνατος, αθλητικές κακώσεις, κατάγματα, οστεοαρθρίτιδα και βιολογικές θεραπείες.",
    canonical: "blog/index.html",
    keywords: "blog ορθοπαιδικού, πόνος ώμου, πόνος γόνατο, ρήξη μηνίσκου, πρόσθιος χιαστός, οστεοαρθρίτιδα",
    ld,
  }) +
    header(depth, "blog") +
    crumbs(depth, trail) +
    `
  <main id="main">
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow reveal">Blog</p>
        <h1 class="page-title reveal">Ενημέρωση για το μυοσκελετικό σας</h1>
        <p class="page-lead reveal">Χρήσιμοι οδηγοί και απαντήσεις σε συχνές ερωτήσεις, από τον ${esc(BIZ.doctor)}.</p>
      </div>
    </section>
    <section class="posts">
      <div class="container">
        <div class="posts-grid">${cards}
        </div>
      </div>
    </section>
    <section class="posts posts-feed" aria-labelledby="soro-blog-title">
      <div class="container">
        <div class="section-head">
          <p class="eyebrow">Νέα άρθρα</p>
          <h2 id="soro-blog-title" class="section-title">Πρόσφατη αρθρογραφία</h2>
        </div>
        <div id="soro-blog"></div>
        <script src="${SORO_EMBED_URL}" defer></script>
      </div>
    </section>
  </main>` +
    ctaBand(depth) +
    footer(depth);
}

// ====================================================================
//  PAGE: BLOG POST
// ====================================================================
function pagePost(p) {
  const depth = 1;
  const r = (pp) => rel(depth, pp);
  const trail = [
    { name: "Αρχική", rel: "index.html", path: "index.html" },
    { name: "Blog", rel: "blog/index.html", path: "blog/index.html" },
    { name: p.title, rel: "blog/" + p.slug + ".html", path: "blog/" + p.slug + ".html" },
  ];
  const relatedSvc = SERVICES.find((s) => s.slug === p.related);
  const others = POSTS.filter((x) => x.slug !== p.slug).slice(0, 3);
  const ld = [
    breadcrumbLD(depth, trail),
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: p.title,
      description: p.desc,
      datePublished: p.date,
      dateModified: p.date,
      inLanguage: "el",
      image: abs("assets/dr-patousis.jpg"),
      mainEntityOfPage: abs("blog/" + p.slug + ".html"),
      author: { "@type": "Person", name: BIZ.doctor },
      publisher: { "@id": `${BASE}/#clinic` },
    },
    faqLD(p.faq),
  ];
  const bodyHtml = p.body
    .map(([h, t]) => (h ? `<h2 class="reveal">${esc(h)}</h2>\n          <p class="reveal">${esc(t)}</p>` : `<p class="reveal lead-p">${esc(t)}</p>`))
    .join("\n          ");
  return head({
    depth,
    title: p.metaTitle,
    desc: p.desc,
    canonical: "blog/" + p.slug + ".html",
    keywords: p.keywords,
    ld,
    type: "article",
  }) +
    header(depth, "blog") +
    crumbs(depth, trail) +
    `
  <main id="main">
    <article class="article">
      <header class="article-head">
        <div class="container article-head-inner">
          <span class="post-cat reveal">${esc(p.cat)}</span>
          <h1 class="page-title reveal">${esc(p.title)}</h1>
          <p class="article-meta reveal"><time datetime="${p.date}">${fmtDate(p.date)}</time> · ${esc(BIZ.doctor)}</p>
        </div>
      </header>
      <div class="container article-body">
        <div class="article-copy">
          ${bodyHtml}

          <h2 class="reveal">Συχνές ερωτήσεις</h2>
          <div class="faq">
            ${p.faq.map(([q, a]) => `<details class="faq-item reveal"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("\n            ")}
          </div>

          ${relatedSvc ? `<div class="article-cta reveal">
            <p>Σχετική υπηρεσία: <a href="${r("ypiresies/" + relatedSvc.slug + ".html")}"><strong>${esc(relatedSvc.h1)}</strong></a>. Κλείστε ραντεβού στο <a href="tel:${BIZ.phoneIntl}">${esc(BIZ.phoneDisplay)}</a>.</p>
          </div>` : ""}

          <p class="article-disclaimer">Το παρόν άρθρο έχει ενημερωτικό χαρακτήρα και δεν υποκαθιστά την εξατομικευμένη ιατρική συμβουλή. Για την περίπτωσή σας, συμβουλευτείτε τον ορθοπαιδικό σας.</p>
        </div>
        <aside class="article-aside">
          <div class="aside-card reveal">
            <h3>Διαβάστε επίσης</h3>
            <nav class="aside-links">
              ${others.map((o) => `<a href="${r("blog/" + o.slug + ".html")}">${esc(o.title)} →</a>`).join("\n              ")}
            </nav>
          </div>
        </aside>
      </div>
    </article>
  </main>` +
    ctaBand(depth) +
    footer(depth);
}

// ====================================================================
//  PAGE: CONTACT
// ====================================================================
function pageContact() {
  const depth = 0;
  const trail = [
    { name: "Αρχική", rel: "index.html", path: "index.html" },
    { name: "Επικοινωνία", rel: "epikoinonia.html", path: "epikoinonia.html" },
  ];
  const ld = [breadcrumbLD(depth, trail), { "@context": "https://schema.org", ...clinicLD }];
  return head({
    depth,
    title: `Επικοινωνία & Ραντεβού | ${BIZ.name} — Θεσσαλονίκη`,
    desc: `Επικοινωνήστε με το ${BIZ.name}. ${BIZ.street}, ${BIZ.area}, Θεσσαλονίκη. Τηλ. ${BIZ.phoneDisplay}, ${BIZ.email}. Λειτουργία κατόπιν ραντεβού.`,
    canonical: "epikoinonia.html",
    keywords: "επικοινωνία ορθοπαιδικός Θεσσαλονίκη, ραντεβού ορθοπαιδικός Θέρμη, Αθανάσιος Πατούσης τηλέφωνο",
    ld,
  }) +
    header(depth, "contact") +
    crumbs(depth, trail) +
    `
  <main id="main">` +
    contactSection("h1", true) +
    `
  </main>` +
    footer(depth);
}

// ---- utils ----------------------------------------------------------
function fmtDate(iso) {
  const months = ["Ιανουαρίου","Φεβρουαρίου","Μαρτίου","Απριλίου","Μαΐου","Ιουνίου","Ιουλίου","Αυγούστου","Σεπτεμβρίου","Οκτωβρίου","Νοεμβρίου","Δεκεμβρίου"];
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

// ====================================================================
//  SITEMAP + ROBOTS
// ====================================================================
function buildSitemap() {
  const urls = [
    { loc: "index.html", pr: "1.0", cf: "weekly" },
    { loc: "i-giatros.html", pr: "0.8", cf: "monthly" },
    { loc: "ypiresies/index.html", pr: "0.9", cf: "monthly" },
    ...SERVICES.map((s) => ({ loc: "ypiresies/" + s.slug + ".html", pr: "0.9", cf: "monthly" })),
    { loc: "perioches/index.html", pr: "0.7", cf: "monthly" },
    ...AREAS.map((a) => ({ loc: "perioches/" + a.slug + ".html", pr: "0.7", cf: "monthly" })),
    { loc: "blog/index.html", pr: "0.7", cf: "weekly" },
    ...POSTS.map((p) => ({ loc: "blog/" + p.slug + ".html", pr: "0.6", cf: "monthly", lm: p.date })),
    { loc: "epikoinonia.html", pr: "0.8", cf: "yearly" },
  ];
  const today = new Date().toISOString().slice(0, 10);
  const body = urls
    .map(
      (u) =>
        `  <url><loc>${abs(u.loc)}</loc><lastmod>${u.lm || today}</lastmod><changefreq>${u.cf}</changefreq><priority>${u.pr}</priority></url>`
    )
    .join("\n");
  const ns = "http://www.sitemaps.org/schemas/sitemap/0.9";
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${ns}">\n${body}\n</urlset>\n`;
}

function buildRobots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`;
}

// ====================================================================
//  RUN
// ====================================================================
let n = 0;
const write = (p, html) => { out(p, html); n++; };

write("index.html", pageHome());
write("i-giatros.html", pageAbout());
write("epikoinonia.html", pageContact());
write("ypiresies/index.html", pageServicesHub());
SERVICES.forEach((s, i) => write("ypiresies/" + s.slug + ".html", pageService(s, i)));
write("perioches/index.html", pageAreasHub());
AREAS.forEach((a) => write("perioches/" + a.slug + ".html", pageArea(a)));
write("blog/index.html", pageBlogHub());
POSTS.forEach((p) => write("blog/" + p.slug + ".html", pagePost(p)));
out("sitemap.xml", buildSitemap());
out("robots.txt", buildRobots());

console.log(`✓ Generated ${n} HTML pages + sitemap.xml + robots.txt`);
