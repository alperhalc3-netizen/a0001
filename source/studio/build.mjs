import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const studio = dirname(fileURLToPath(import.meta.url));
const repo = join(studio, "..", "..");
const out = join(repo, "publish");
const base = "/a0001";
const catalog = JSON.parse(readFileSync(join(repo, "source/data/content.json"), "utf8"));

const byOrder = (a, b) => a.order - b.order;
const products = [...catalog.products].sort(byOrder);
const productBySlug = new Map(products.map((item) => [item.slug, item]));
const artworkSlugs = ["0001", "moorland-a", "0002", "cop-2", "moorland-b", "cop-1", "0004"];
const shopHomeSlugs = products.map((item) => item.slug).filter((slug) => !artworkSlugs.includes(slug));
const artworkNotes = {
  "cop-2": ["Orijinal karakalem", "35 × 35"],
  "moorland-b": ["Çerçeveli baskı"],
};
const oldWorkRedirects = {
  "plate-12": "0001",
  "residual-mark": "moorland-a",
  "sequence-a": "0002",
  "vessel-01": "cop-2",
  "fragment-cast": "moorland-b",
  "object-weight": "cop-1",
  "boxed-field": "0004",
};
const tattooRank = ["tattoo-15", "tattoo-08", "tattoo-12", "tattoo-20"];
const tattoos = [...catalog.tattoos].sort((a, b) => {
  const rank = (item) => {
    if (item.slug === "tattoo-07") return 1000;
    const named = tattooRank.indexOf(item.slug);
    return named === -1 ? 100 + item.order : named;
  };
  return rank(a) - rank(b);
});

const site = {
  name: "A/0001",
  who: "Alper Halıcı — dövme sanatçısı & ressam",
  tagline: "Art made by hand. Made to exist.",
  location: "Türkiye",
  email: "info.alperh@gmail.com",
  instagram: "https://instagram.com/alper.tatts",
  bookingChat: "https://ig.me/m/alper.tatts",
  bookingMail: "mailto:info.alperh@gmail.com?subject=D%C3%B6vme%20randevusu",
  shopier: "https://www.shopier.com/A001",
  description: "Alper Halıcı. Dövme, özgün çizim ve Shopier üzerinden satılan işler. A/0001.",
  about: [
    "I’m Alper, an independent artist and tattoo artist based in Türkiye.",
    "My practice moves between drawing, tattooing, printmaking, sculpture and other visual forms. I work with my own drawings, exploring different techniques, materials and ways of translating ideas into physical forms.",
    "My work is mostly driven by black and white imagery, organic lines, texture and experimentation.",
    "This website is a collection of my tattoos, artworks, prints and ongoing projects.",
  ],
};

const labels = {
  printmaking: "Printmaking",
  "digital-art": "Digital art",
  sculpture: "Sculpture",
  objects: "Objects",
  "limited-edition-prints": "Limited edition print",
};

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function money(value) {
  return `${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} TL`;
}

let media = {};
function loadMedia() {
  media = JSON.parse(readFileSync(join(out, "media/manifest.json"), "utf8"));
}

function picture(stem, alt, { eager = false, sizes = "(min-width: 768px) 30vw, 46vw" } = {}) {
  const meta = media[stem];
  if (!meta) throw new Error(`missing media ${stem}`);
  const webp = meta.widths.map((width) => `${base}/media/${stem}-${width}.webp ${width}w`).join(", ");
  const jpg = meta.widths.map((width) => `${base}/media/${stem}-${width}.jpg ${width}w`).join(", ");
  const fallback = meta.widths.find((width) => width >= 640) || meta.widths.at(-1);
  const loading = eager ? "eager" : "lazy";
  const priority = eager ? ' fetchpriority="high"' : "";
  return `<picture><source type="image/webp" srcset="${webp}" sizes="${sizes}"><img src="${base}/media/${stem}-${fallback}.jpg" srcset="${jpg}" sizes="${sizes}" width="${meta.w}" height="${meta.h}" alt="${esc(alt)}" loading="${loading}" decoding="async"${priority}></picture>`;
}

function productFacts(item) {
  return {
    slug: item.slug,
    title: item.title,
    stem: `shop/${item.slug}`,
    lines: [...(artworkNotes[item.slug] || []), "Ücretsiz kargo"],
    price: money(item.priceTRY),
    shopier: item.purchaseUrl,
  };
}

function words(text) {
  return text.split(/(\s+)/).map((part, index) => {
    if (!part.trim()) return `<span class="space"> </span>`;
    return `<span class="word" style="--delay:${index}">${esc(part)}</span>`;
  }).join("");
}

function asset(path) {
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function header() {
  const logo = picture("brand/logo", "", { eager: true, sizes: "42px" });
  return `<a class="skip" href="#main">İçeriğe geç</a>
<header class="site-header">
<a class="brand" href="${base}/">${logo}<span>A/0001</span></a>
<nav class="site-nav" aria-label="Bölümler">
<a href="${base}/#shop">Shop</a>
<a href="${base}/#tattoo">Tattoo</a>
<a href="${base}/#artwork">Artwork</a>
<a href="${base}/about/">Hakkında</a>
</nav>
</header>`;
}

function palette() {
  const themes = ["paper", "ink", "warm", "stone"];
  const swatches = themes.map((name, index) => `<button class="palette__swatch" type="button" data-theme="${name}" style="--idx:${index}" aria-label="${name} tema"></button>`).join("");
  return `<div class="palette" data-open="false"><button class="palette__toggle round" type="button" aria-label="Renkler"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="8" cy="8.5" r="2.1" fill="currentColor"/><circle cx="14.5" cy="7.5" r="2.1" fill="currentColor"/><circle cx="16.2" cy="13" r="2.1" fill="currentColor"/><circle cx="10" cy="15.2" r="2.1" fill="currentColor"/></svg></button>${swatches}</div>`;
}

function rule() {
  return `<svg class="rule" viewBox="0 0 240 14" aria-hidden="true"><path d="M2 8 C 36 2, 74 13, 120 6 S 188 2, 238 9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
}

function mediaFields(stem) {
  const meta = media[stem];
  const webp = meta.widths.map((width) => `${base}/media/${stem}-${width}.webp ${width}w`).join(", ");
  const jpg = meta.widths.map((width) => `${base}/media/${stem}-${width}.jpg ${width}w`).join(", ");
  const fallback = meta.widths.find((width) => width >= 640) || meta.widths.at(-1);
  return { src: `${base}/media/${stem}-${fallback}.jpg`, webp, jpg, w: meta.w, h: meta.h };
}

function allProjects() {
  const list = [];
  for (const item of tattoos) {
    list.push({
      href: `${base}/tattoo/${item.slug}/`,
      title: item.title,
      stem: `tattoo/${item.slug}`,
      ...mediaFields(`tattoo/${item.slug}`),
      lines: [],
      price: "",
      shopier: "",
      booking: true,
    });
  }
  for (const item of products) {
    const facts = productFacts(item);
    list.push({
      href: `${base}/shop/${item.slug}/`,
      title: facts.title,
      stem: facts.stem,
      ...mediaFields(facts.stem),
      lines: facts.lines,
      price: facts.price,
      shopier: facts.shopier,
      booking: false,
    });
  }
  return list;
}

function shell({ title, kind, path = "/", body }) {
  const catalogJson = JSON.stringify(allProjects()).replaceAll("<", "\\u003c");
  const canonical = `${base}${path}`;
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(site.description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(site.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${base}/media/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(site.description)}">
<meta name="twitter:image" content="${base}/media/og.jpg">
<link rel="icon" href="${base}/media/favicon-32.png" type="image/png">
<link rel="apple-touch-icon" href="${base}/media/apple-touch-icon.png">
<link rel="stylesheet" href="${base}/assets/app.css">
<script>document.documentElement.classList.add("js")</script>
</head>
<body data-kind="${kind}">
${header()}
${body}
${palette()}
<script type="application/json" id="catalog">${catalogJson}</script>
<script src="${base}/assets/app.js" defer></script>
<script src="${base}/assets/brush.js" defer></script>
</body>
</html>`;
}

function writePage(relative, html) {
  const file = join(out, relative);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

function card(stem, title, href, order) {
  const rotation = ((order * 17) % 11) - 5;
  const posX = ((order * 13) % 9) - 4;
  const posY = ((order * 7) % 9) - 4;
  return `<a class="card" href="${href}" style="--rotation:${rotation};--posX:${posX};--posY:${posY}">
<span class="card__frame">${picture(stem, title)}</span>
<span class="card__label">${esc(title)}</span>
</a>`;
}

const previewLimit = 9;

function bookingBlock() {
  return `<div class="booking"><p class="lead">Randevu, çizim ve gün birlikte netleşir. Yazışma Instagram veya e-posta ile yürür.</p><a class="pill" href="${site.bookingChat}">Randevu al</a><a class="text-link" href="${site.bookingMail}">E-posta</a></div>`;
}

function overlayMarkup(project) {
  const facts = [
    project.price ? `<p class="price">${esc(project.price)}</p>` : "",
    (project.lines || []).map((line) => `<p class="lead">${esc(line)}</p>`).join(""),
    project.shopier ? `<a class="pill" href="${esc(project.shopier)}" target="_blank" rel="noreferrer">Shopier</a>` : "",
    project.booking ? bookingBlock() : "",
  ].join("");
  return `<div class="project-page is-ready" id="project">
<div class="modal">
<div class="modal__bar"><a class="round" href="${base}/" data-close aria-label="Kapat">×</a></div>
<div class="modal__main">
<figure>${picture(project.stem, project.title, { sizes: "(min-width: 768px) 860px, 92vw" })}</figure>
<div class="sheet"><h1>${words(project.title)}</h1><div class="facts">${facts}</div></div>
</div>
</div>
</div>`;
}

function moreLink(href, total) {
  if (total <= previewLimit) return "";
  return `<p class="more"><a class="pill" href="${href}">Tümü</a></p>`;
}

function footer() {
  return `<footer class="site-footer footer">
<p class="footer__title">İletişim</p>
<ul class="footer__links">
<li><a href="mailto:${site.email}">${esc(site.email)}</a></li>
<li><a href="${site.instagram}" target="_blank" rel="noreferrer">Instagram</a></li>
<li><a href="${base}/#shop">Shop</a></li>
<li><a href="${base}/#tattoo">Tattoo</a></li>
<li><a href="${base}/#artwork">Artwork</a></li>
<li><a href="${base}/satis/">Satış & İade</a></li>
</ul>
<small>Alper Halıcı</small>
</footer>`;
}

function homeMarkup({ headline = true } = {}) {
  const heroTattoos = tattoos.slice(previewLimit, previewLimit + 4);
  const heroShots = heroTattoos.map((item, index) => `<div class="hero__image" style="--delay:${index}"><a href="${base}/tattoo/${item.slug}/">${picture(`tattoo/${item.slug}`, item.title, { eager: index === 0, sizes: "(max-width: 700px) 34vw, 16vw" })}</a></div>`).join("");
  const shopCards = shopHomeSlugs.map((slug, index) => {
    const item = productBySlug.get(slug);
    return card(`shop/${slug}`, item.title, `${base}/shop/${slug}/`, index + 1);
  }).join("");
  const tattooCards = tattoos.slice(0, previewLimit).map((item, index) => card(`tattoo/${item.slug}`, item.title, `${base}/tattoo/${item.slug}/`, index + 1)).join("");
  const slides = artworkSlugs.map((slug) => {
    const item = productBySlug.get(slug);
    return `<div class="carousel__slide"><a href="${base}/shop/${slug}/">${picture(`shop/${slug}`, item.title, { sizes: "(min-width: 900px) 22vw, 78vw" })}</a><a class="pill" href="${base}/shop/${slug}/">${esc(item.title)}</a></div>`;
  }).join("");
  const name = headline
    ? `<h1 aria-label="${esc(site.name)}">${words(site.name)}</h1>`
    : `<p class="display-name">${words(site.name)}</p>`;
  return `<main class="index" id="main">
<section class="hero">
<div class="hero__top">
<p class="kicker">${esc(site.location)}</p>
<small><a href="mailto:${site.email}">${esc(site.email)}</a></small>
</div>
<div class="hero__mid">
${name}
<p class="who">${esc(site.who)}</p>
<div class="hero__images">${heroShots}</div>
<p class="role">${words(site.tagline)}</p>
<nav class="shortcuts" aria-label="Bölümler">
<a class="pill" href="#shop">Shop</a>
<a class="pill" href="#tattoo">Tattoo</a>
<a class="pill" href="#artwork">Artwork</a>
</nav>
</div>
<div class="hero__bot">
<p class="clients">Çalışmalar</p>
<small>Shop, dövme, özgün çizim</small>
</div>
</section>
${rule()}
<section class="block" id="shop">
<div class="text-block">
<h2>Shop</h2>
<p>Shopier üzerinden satılan işler. Ödeme ve kargo Shopier’da tamamlanır.</p>
</div>
<div class="work-grid">${shopCards}</div>
${moreLink(`${base}/shop/`, products.length)}
</section>
${rule()}
<section class="block" id="tattoo">
<div class="text-block">
<h2>Tattoo</h2>
<p>Seçilmiş dövmeler.</p>
${bookingBlock()}
</div>
<div class="work-grid">${tattooCards}</div>
${moreLink(`${base}/tattoo/`, tattoos.length)}
</section>
${rule()}
<section class="block" id="artwork">
<div class="text-block">
<h2>Artwork</h2>
<p>Shopier’daki çizimler. Aynı görsel bu sayfada Shop bölümünde tekrarlanmaz.</p>
</div>
<div class="carousel" aria-label="Artwork"><div class="carousel__track">${slides}</div></div>
<p class="more"><a class="pill" href="${base}/artwork/">Tümü</a></p>
</section>
</main>
<div class="phantom"></div>
${footer()}`;
}

function home() {
  return shell({ title: "A/0001", path: "/", kind: "home", body: homeMarkup() });
}

function detail(project) {
  const path = project.href.replace(base, "") ;
  return shell({
    title: `${project.title} — A/0001`,
    kind: "home",
    path,
    body: homeMarkup({ headline: false }) + overlayMarkup(project),
  });
}

function aboutPage() {
  const paragraphs = site.about.map((line, index) => `<p style="--delay:${index + 1}">${esc(line)}</p>`).join("");
  const names = artworkSlugs.map((slug, index) => {
    const item = productBySlug.get(slug);
    return `<li style="--idx:${index};--rotation:${(index % 5) - 2}"><a href="${base}/shop/${slug}/">${esc(item.title)}</a>${picture(`shop/${slug}`, "", { sizes: "9rem" })}</li>`;
  }).join("");
  return shell({
    title: "Hakkında — A/0001",
    kind: "about",
    path: "/about/",
    body: `<main class="about" id="main">
<p class="back"><a href="${base}/">Ana sayfa</a></p>
<div class="bio">
<h1>Hakkında</h1>
${paragraphs}
</div>
<section>
<h2>Artwork</h2>
<ul class="name-list">${names}</ul>
</section>
</main>
${footer()}`,
  });
}

function archivePage({ title, lede, path, cards }) {
  return shell({
    title: `${title} — A/0001`,
    kind: "archive",
    path,
    body: `<main class="index archive" id="main">
<p class="back"><a href="${base}/">Ana sayfa</a></p>
<section class="block">
<div class="text-block">
<h1>${esc(title)}</h1>
<p>${esc(lede)}</p>
</div>
<div class="work-grid">${cards}</div>
</section>
</main>
${footer()}`,
  });
}

function salesPage() {
  return shell({
    title: "Satış & İade — A/0001",
    kind: "page",
    path: "/satis/",
    body: `<main class="prose" id="main">
<p class="back"><a href="${base}/">Ana sayfa</a></p>
<h1>Satış & İade</h1>
<p>Bu sayfa genel bilgilendirmedir. Satın alma, ödeme, kargo ve iade Shopier üzerinden yürür. Koşullar Shopier’ın kendi sayfalarında yazar; burada ek süre, ücret ya da istisna uydurulmaz.</p>
<p>Mağaza: <a href="${site.shopier}">shopier.com/A001</a></p>
<p>Ücretsiz kargo ifadesi, Shopier mağazasındaki kargo bilgisine dayanır. Eşik tutarı bu sitede ayrıca yazılmaz.</p>
<h2>Gizlilik</h2>
<p>Bu statik sitede hesap, form kaydı veya analiz aracı yok. Site, ziyaretçiden kişisel veri toplamaz. İletişim için e-posta: <a href="mailto:${site.email}">${esc(site.email)}</a></p>
</main>
${footer()}`,
  });
}

function contactPage() {
  return shell({
    title: "İletişim — A/0001",
    kind: "contact",
    path: "/contact/",
    body: `<main class="contact-page" id="main">
<p class="back"><a href="${base}/">Ana sayfa</a></p>
<h1>İletişim</h1>
<ul class="footer__links">
<li><a href="mailto:${site.email}">${esc(site.email)}</a></li>
<li><a href="${site.instagram}" target="_blank" rel="noreferrer">Instagram</a></li>
</ul>
<small>${esc(site.location)}</small>
</main>
${footer()}`,
  });
}

function redirectPage(target) {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><link rel="canonical" href="${target}"><meta http-equiv="refresh" content="0; url=${target}"><script>location.replace(${JSON.stringify(target)})</script><title>A/0001</title></head><body><p><a href="${target}">Devam</a></p></body></html>`;
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const images = spawnSync("python3", [join(studio, "images.py")], { stdio: "inherit" });
if (images.status) process.exit(images.status);
loadMedia();
mkdirSync(join(out, "assets/fonts"), { recursive: true });
cpSync(join(studio, "app.css"), join(out, "assets/app.css"));
cpSync(join(studio, "app.js"), join(out, "assets/app.js"));
cpSync(join(studio, "brush.js"), join(out, "assets/brush.js"));
cpSync(join(studio, "fonts"), join(out, "assets/fonts"), { recursive: true });
writeFileSync(join(out, ".nojekyll"), "");
writeFileSync(join(out, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: https://alperhalc3-netizen.github.io${base}/sitemap.xml\n`);

const pages = [];
function publish(relative, html) {
  writePage(relative, html);
  const urlPath = relative === "index.html" ? "/" : `/${relative.replace(/index\.html$/, "")}`;
  pages.push(urlPath);
}

publish("index.html", home());
publish("about/index.html", aboutPage());
publish("contact/index.html", contactPage());
publish("satis/index.html", salesPage());
publish("artwork/index.html", archivePage({
  title: "Artwork",
  lede: "Shopier’da satılan çizimler. Uydurma teknik veya ölçü yok; yalnız doğrulanan bilgi yazılır.",
  path: "/artwork/",
  cards: artworkSlugs.map((slug, index) => card(`shop/${slug}`, productBySlug.get(slug).title, `${base}/shop/${slug}/`, index + 1)).join(""),
}));
publish("tattoo/index.html", archivePage({
  title: "Tattoo",
  lede: "Dövme seçkisi.",
  path: "/tattoo/",
  cards: tattoos.map((item, index) => card(`tattoo/${item.slug}`, item.title, `${base}/tattoo/${item.slug}/`, index + 1)).join(""),
}));
publish("shop/index.html", archivePage({
  title: "Shop",
  lede: "Tüm Shopier ürünleri. Ödeme ve kargo Shopier’da.",
  path: "/shop/",
  cards: products.map((item, index) => card(`shop/${item.slug}`, item.title, `${base}/shop/${item.slug}/`, index + 1)).join(""),
}));
publish("works/index.html", redirectPage(`${base}/artwork/`));
for (const [oldSlug, shopSlug] of Object.entries(oldWorkRedirects)) {
  publish(`works/${oldSlug}/index.html`, redirectPage(`${base}/shop/${shopSlug}/`));
}

for (const project of allProjects()) {
  const relative = project.href.replace(`${base}/`, "") + "index.html";
  publish(relative, detail(project));
}

const urls = pages
  .filter((path) => !path.startsWith("/works/"))
  .map((path) => `  <url><loc>https://alperhalc3-netizen.github.io${base}${path}</loc></url>`)
  .join("\n");
writeFileSync(join(out, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
console.log(`built ${tattoos.length} tattoos, ${products.length} products -> ${out}`);
