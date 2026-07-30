# dporthopedics — Ιστοσελίδα

Στατική ιστοσελίδα HTML/CSS/JS για τον Αθανάσιο Πατούση, Ορθοπαιδικό Χειρουργό στη Θεσσαλονίκη.
Το layout και το SEO framework βασίζονται στο προηγούμενο CLINICBRAIN template, προσαρμοσμένα σε medical blue αισθητική.

## Δομή

```text
index.html                     Αρχική
i-giatros.html                 Βιογραφικό γιατρού
epikoinonia.html               Επικοινωνία + χάρτης
ypiresies/index.html           Hub υπηρεσιών
ypiresies/<υπηρεσία>.html      8 σελίδες υπηρεσιών
perioches/index.html           Hub περιοχών
perioches/<περιοχή>.html       6 τοπικές SEO σελίδες
blog/index.html                Blog hub
blog/<άρθρο>.html              6 άρθρα SEO
sitemap.xml, robots.txt        Τεχνικό SEO
assets/dr-patousis.jpg         Φωτογραφία γιατρού
styles.css, main.js            Κοινό στυλ & συμπεριφορά
build/                         Γεννήτρια data.mjs + build.mjs
```

## SEO

- Μοναδικά `<title>`, meta descriptions και keywords ανά σελίδα.
- JSON-LD για MedicalClinic/LocalBusiness, Physician, MedicalProcedure, FAQPage, BreadcrumbList, BlogPosting και WebSite.
- Canonical URLs στο `https://www.dporthopedics.gr`.
- Open Graph και Twitter cards με τη φωτογραφία του γιατρού.
- `sitemap.xml` και `robots.txt` έτοιμα για live χρήση.

## Αναγέννηση

Όλο το βασικό περιεχόμενο ζει στο `build/data.mjs`. Μετά από αλλαγή:

```bash
node build/build.mjs
```

## Πριν το live

Επιβεβαιώστε τις ακριβείς συντεταγμένες Google Maps και τυχόν social URLs, αν προστεθούν.
