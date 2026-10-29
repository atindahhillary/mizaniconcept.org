// Zero-dependency static build: wraps each src/pages/*.html in the shared layout
// and writes fully pre-rendered HTML to dist/ (good for SEO and link previews).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://mizaniconcept.org";
const EMAIL = "info@mizaniconcept.org";
const PHONE = "+254724116694";
const PHONE_DISPLAY = "+254 724 116694";
const OUT = "dist";

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
    <nav class="nav" aria-label="Main">
      <ul id="nav-list">
        ${NAV.map(([href, label]) => `<li><a href="${href}"${path === href ? ' aria-current="page"' : ""}>${label}</a></li>`).join("")}
      </ul>
    </nav>
    <div class="header-cta">
      <a class="btn btn-ghost-light" href="/contact?as=youth">Register</a>
      <a class="btn btn-sun" href="/give">Donate</a>
    </div>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav-list" aria-label="Open menu">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>`;

const footer = () => `
<footer class="site-footer">
  <div class="wrap footer-grid">
    <div>
      <a class="brand brand-footer" href="/"><img src="/assets/img/logo.webp" alt="" width="44" height="44"><span>Mizani<small>Concept</small></span></a>
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
<a class="mobile-give" href="/give">Give $10, fund one term</a>`;

const layout = (meta, body, path) => {
  const url = SITE + (path === "/" ? "/" : path);
  const title = meta.title;
  const ogImage = `${SITE}/og-image.jpg`;
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
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${meta.description}">
<meta name="twitter:image" content="${ogImage}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="/assets/site.css">
${meta.preload ? `<link rel="preload" as="image" href="${meta.preload}" fetchpriority="high">` : ""}
${meta.jsonld ? `<script type="application/ld+json">${JSON.stringify(meta.jsonld)}</script>` : ""}
<script src="/assets/site.js" defer></script>
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

const ORG = {
  "@context": "https://schema.org",
  "@type": "NGO",
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
for (const file of pages) {
  const raw = readFileSync(join("src/pages", file), "utf8");
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error(`${file}: missing <!--meta {...} --> header`);
  const meta = JSON.parse(m[1]);
  if (meta.jsonld === "org") meta.jsonld = ORG;
  const name = file.replace(/\.html$/, "");
  const path = name === "index" ? "/" : name === "404" ? "/404" : `/${name}`;
  writeFileSync(join(OUT, file), layout(meta, raw.slice(m[0].length), path));
  if (!meta.noindex) sitemap.push(SITE + (path === "/" ? "/" : path));
}

const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap
    .map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`
);
writeFileSync(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`Built ${pages.length} pages into ${OUT}/`);
