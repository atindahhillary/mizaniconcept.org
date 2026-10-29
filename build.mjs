// Zero-dependency static build: wraps each src/pages/*.html in the shared layout
// and writes fully pre-rendered HTML to dist/ (good for SEO and link previews).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://mizaniconcept.org";
const EMAIL = "info@mizaniconcept.org";
const PHONE = "+254724116694";
const PHONE_DISPLAY = "+254 724 116694";
const OUT = "dist";
const PRODUCTS = JSON.parse(readFileSync("src/data/products.json", "utf8"));
const money = (p) => `${p.priceFrom ? "From " : ""}$${p.price}`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const NAV = [
  ["/about", "About"],
  ["/programs", "Programs"],
  ["/give", "Give"],
  ["/store", "Store"],
  ["/contact", "Contact"],
];

const header = (path) => `
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="/" aria-label="Mizani Concept home">
      <img src="/assets/img/logo.webp" alt="" width="44" height="44">
      <span>Mizani<small>Concept</small></span>
    </a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav-list" aria-label="Open menu">
      <span></span><span></span><span></span>
    </button>
    <nav class="nav" aria-label="Main">
      <ul id="nav-list">
        ${NAV.map(([href, label]) => `<li><a href="${href}"${path === href ? ' aria-current="page"' : ""}>${label}</a></li>`).join("")}
      </ul>
    </nav>
    <div class="header-cta">
      <a class="btn btn-ghost-light" href="/contact?as=youth">Register</a>
      <a class="btn btn-sun" href="/give">Donate</a>
    </div>
    <button class="cart-btn" type="button" data-open-cart aria-label="Open cart, 0 items">
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.5L22 7H6"/></svg>
      <span class="cart-count" data-cart-count hidden>0</span>
    </button>
  </div>
</header>`;

const footer = () => `
<footer class="site-footer">
  <div class="wrap footer-grid">
    <div>
      <a class="brand brand-footer" href="/" aria-label="Mizani Concept home"><img src="/assets/img/logo.webp" alt="" width="44" height="44"><span>Mizani<small>Concept</small></span></a>
      <p class="muted">Mizani is Swahili for balance. Since 2017 we have worked with teens, pre-teens and educators across Kenya.</p>
    </div>
    <div>
      <h2 class="footer-h">Explore</h2>
      <ul>
        <li><a href="/about">Who we are</a></li>
        <li><a href="/about#model">Whole person model</a></li>
        <li><a href="/about#four-cs">The 4Cs of regeneration</a></li>
        <li><a href="/programs">Programs</a></li>
        <li><a href="/store">Mizani Store</a></li>
      </ul>
    </div>
    <div>
      <h2 class="footer-h">Get involved</h2>
      <ul>
        <li><a href="/contact?as=youth">Register for a camp</a></li>
        <li><a href="/contact?as=school">Bring Mizani to a school</a></li>
        <li><a href="/give">Donate</a></li>
        <li><a href="/give#partner">Partner with us</a></li>
      </ul>
    </div>
    <div>
      <h2 class="footer-h">Contact</h2>
      <ul>
        <li><a href="mailto:${EMAIL}">${EMAIL}</a></li>
        <li><a href="tel:${PHONE}">${PHONE_DISPLAY}</a></li>
        <li><a href="https://wa.me/${PHONE.slice(1)}" rel="noopener">WhatsApp us</a></li>
      </ul>
    </div>
  </div>
  <div class="wrap footer-base">
    <p>&copy; ${new Date().getFullYear()} Mizani Concept, Kenya. Est. 2017.</p>
    <p><a href="/privacy">Privacy notice</a></p>
  </div>
</footer>
<a class="mobile-give" href="/give">Give $10, fund one term</a>
<dialog class="drawer" id="cart" aria-labelledby="cart-title">
  <div class="drawer-head">
    <h2 id="cart-title">Your cart</h2>
    <button class="drawer-close" type="button" data-close-cart aria-label="Close cart">&times;</button>
  </div>
  <div class="drawer-body" data-cart-items></div>
  <div class="drawer-foot">
    <div class="cart-total"><span>Subtotal</span><strong data-cart-subtotal>$0</strong></div>
    <p class="muted small">Shipping is quoted after you order. Pay by M-Pesa Paybill or bank transfer.</p>
    <a class="btn btn-clay btn-block" href="/checkout" data-checkout-link>Checkout</a>
    <button class="btn btn-outline btn-block" type="button" data-close-cart>Keep shopping</button>
  </div>
</dialog>`;

const layout = (meta, body, path) => {
  const url = SITE + (path === "/" ? "/" : path);
  const title = meta.title;
  const ogImage = SITE + (meta.ogImage || "/og-image.jpg");
  return `<!doctype html>
<html lang="en-KE">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${meta.description}">
${meta.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
<meta name="theme-color" content="#1f3a2e">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Mizani Concept">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${meta.description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImage}">
${meta.ogImage ? "" : '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">'}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${meta.description}">
<meta name="twitter:image" content="${ogImage}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="/assets/site.css">
${meta.preload ? `<link rel="preload" as="image" href="${meta.preload}"${meta.preloadSrcset ? ` imagesrcset="${meta.preloadSrcset}" imagesizes="100vw"` : ""} fetchpriority="high">` : ""}
${meta.jsonld ? `<script type="application/ld+json">${JSON.stringify(meta.jsonld)}</script>` : ""}
<script src="/assets/site.js" defer></script>
<script src="/assets/cart.js" defer></script>
</head>
<body>
${header(path)}
<main id="main">
${body}
</main>
${footer()}
</body>
</html>
`;
};

const productCard = (p) => `
      <article class="card card-media product" data-cat="${p.cat}" id="${p.slug}">
        <a class="product-media" href="/store/${p.slug}" tabindex="-1" aria-hidden="true">
          <img src="/assets/img/${p.img}.webp" alt="" width="600" height="600" loading="lazy">
          <span class="hook-chip">${esc(p.hook)}</span>
        </a>
        <div class="card-body">
          <span class="cat">${p.catLabel}</span>
          <h3><a href="/store/${p.slug}">${esc(p.name)}</a></h3>
          <p class="muted">${esc(p.short)}</p>
          <div class="price">${money(p)} <small>USD</small></div>
          <div class="actions">
            ${p.option || p.personalise
              ? `<a class="btn btn-clay" href="/store/${p.slug}">Choose ${p.option ? p.option.label.split(" ")[0].toLowerCase() : "options"}</a>`
              : `<button class="btn btn-clay" type="button" data-add="${p.slug}">Add to cart</button>`}
            <a class="btn btn-outline" href="/store/${p.slug}">Read its story</a>
          </div>
        </div>
      </article>`;

const productPage = (p) => {
  const others = PRODUCTS.filter((o) => o.slug !== p.slug).slice(0, 3);
  return `
<nav class="crumbs wrap" aria-label="Breadcrumb"><a href="/store">Store</a> <span aria-hidden="true">/</span> <span aria-current="page">${esc(p.name)}</span></nav>
<section class="section product-hero">
  <div class="wrap split">
    <figure class="media">
      <img class="photo square" src="/assets/img/${p.img}.webp" alt="${esc(p.alt)}" width="600" height="600" fetchpriority="high">
      <figcaption class="hook-cap">${esc(p.hook)}</figcaption>
    </figure>
    <div>
      <span class="eyebrow">${p.catLabel} &middot; Handcrafted in Kenya</span>
      <h1>${esc(p.name)}</h1>
      <div class="price big">${money(p)} <small>USD</small> <span class="kes">about KES ${(p.price * 130).toLocaleString("en-KE")}</span></div>
      <p class="lead">${esc(p.short)}</p>
      <form class="buy" data-buy="${p.slug}">
        ${p.option ? `<div class="field"><label for="opt">${p.option.label}</label><select id="opt" name="option" required><option value="" disabled selected>Select</option>${p.option.values.map((v) => `<option>${v}</option>`).join("")}</select></div>` : ""}
        ${p.personalise ? `<div class="field"><label for="pers">${p.personalise}</label><input id="pers" name="personalise" maxlength="30" required></div>` : ""}
        <div class="field qty-field"><label for="qty">Quantity</label><input id="qty" name="qty" type="number" min="1" max="20" value="1" inputmode="numeric"></div>
        <button class="btn btn-clay btn-block" type="submit">Add to cart</button>
        <p class="form-status" role="status" aria-live="polite"></p>
      </form>
      <ul class="trust">
        <li>Ships worldwide, shipping quoted after you order</li>
        <li>Pay by M-Pesa Paybill or bank transfer</li>
        <li>Proceeds fund Mizani youth programs</li>
      </ul>
    </div>
  </div>
</section>
<section class="section section-sand">
  <div class="wrap split">
    <div class="prose">
      <span class="eyebrow">The story behind it</span>
      <h2>Every piece carries a story.</h2>
      ${p.story.map((s) => `<p>${esc(s)}</p>`).join("\n      ")}
    </div>
    <div class="card">
      <h3>Details</h3>
      <ul class="details">${p.details.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
      <p class="muted small">Handmade items vary slightly in colour and pattern. That is part of their character.</p>
    </div>
  </div>
</section>
<section class="section">
  <div class="wrap">
    <h2>You may also like</h2>
    <div class="grid grid-3">${others.map(productCard).join("")}</div>
  </div>
</section>`;
};

const storeLd = () => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Mizani Store",
  itemListElement: PRODUCTS.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/store/${p.slug}` })),
});

const productLd = (p) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: p.name,
  description: p.short,
  image: `${SITE}/assets/img/${p.img}.webp`,
  url: `${SITE}/store/${p.slug}`,
  ...(p.slug === "beaded-converse" ? {} : { brand: { "@type": "Brand", name: "Mizani Concept" } }),
  offers: {
    "@type": "Offer",
    price: String(p.price),
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    itemCondition: "https://schema.org/NewCondition",
    url: `${SITE}/store/${p.slug}`,
    seller: { "@id": `${SITE}/#org` },
  },
});

const ORG = {
  "@context": "https://schema.org",
  "@type": "NGO",
  "@id": `${SITE}/#org`,
  name: "Mizani Concept",
  alternateName: "Mizani",
  url: SITE,
  logo: `${SITE}/logo.png`,
  image: `${SITE}/og-image.jpg`,
  email: EMAIL,
  telephone: PHONE,
  foundingDate: "2017",
  areaServed: "Kenya",
  address: { "@type": "PostalAddress", addressCountry: "KE" },
  description:
    "Mizani Concept develops whole young people in Kenya through mentorship camps, holistic wellness sessions and educator capacity building, guided by the 4Cs: Culture, Community, Commerce and Conservation.",
};

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync("src/assets", join(OUT, "assets"), { recursive: true });
cpSync("src/public", OUT, { recursive: true });

const pages = readdirSync("src/pages").filter((f) => f.endsWith(".html"));
const sitemap = [];
mkdirSync(join(OUT, "store"), { recursive: true });
writeFileSync(join(OUT, "assets", "products.json"), JSON.stringify(PRODUCTS.map(({ slug, name, price, priceFrom, img }) => ({ slug, name, price, priceFrom: !!priceFrom, img }))));
for (const p of PRODUCTS) {
  const path = `/store/${p.slug}`;
  const meta = {
    title: `${p.name} | Mizani Store`,
    description: `${p.short} Handcrafted in Kenya; proceeds fund youth programs.`.slice(0, 158),
    jsonld: productLd(p),
    ogImage: `/assets/img/${p.img}.webp`,
  };
  writeFileSync(join(OUT, "store", `${p.slug}.html`), layout(meta, productPage(p), path));
  sitemap.push(SITE + path);
}
for (const file of pages) {
  const raw = readFileSync(join("src/pages", file), "utf8");
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error(`${file}: missing <!--meta {...} --> header`);
  const meta = JSON.parse(m[1]);
  if (meta.jsonld === "org") meta.jsonld = ORG;
  if (meta.jsonld === "store") meta.jsonld = storeLd();
  const name = file.replace(/\.html$/, "");
  const path = name === "index" ? "/" : name === "404" ? "/404" : `/${name}`;
  const body = raw.slice(m[0].length).replace("<!-- products -->", PRODUCTS.map(productCard).join(""));
  writeFileSync(join(OUT, file), layout(meta, body, path));
  if (!meta.noindex) sitemap.push(SITE + (path === "/" ? "/" : path));
}

writeFileSync(
  join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap
    .map((u) => `  <url><loc>${u}</loc></url>`)
    .join("\n")}\n</urlset>\n`
);
writeFileSync(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`Built ${pages.length} pages into ${OUT}/`);
