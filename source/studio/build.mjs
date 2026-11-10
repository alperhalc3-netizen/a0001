import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const studio = dirname(fileURLToPath(import.meta.url));
const repo = join(studio, "..", "..");
const out = join(repo, "publish");
const base = "/a0001";
const catalog = JSON.parse(readFileSync(join(repo, "source/data/content.json"), "utf8"));

const byOrder = (a, b) => a.order - b.order;
const art = [...catalog.artworks].sort(byOrder);
const tattoos = [...catalog.tattoos].sort(byOrder);
const products = [...catalog.products].sort(byOrder);

const site = {
  name: "A/0001",
  tagline: "Art made by hand. Made to exist.",
  location: "Türkiye",
  email: "info.alperh@gmail.com",
  instagram: "https://instagram.com/",
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
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><a class="round" href="${base}/about/" aria-label="About"><img src="${base}/brand/logo.jpg" alt=""></a></header>`;
}

function palette() {
  const themes = ["paper", "ink", "warm", "stone"];
  const swatches = themes.map((name, index) => `<button class="palette__swatch" type="button" data-theme="${name}" style="--idx:${index}" aria-label="${name} theme"></button>`).join("");
  return `<div class="palette" data-open="false"><button class="palette__toggle round" type="button" aria-label="Color themes">◉</button>${swatches}</div>`;
}

function allProjects() {
  const list = [];
  for (const item of art) {
    list.push({
      href: `${base}/works/${item.slug}/`,
      title: item.title,
      image: asset(item.image),
      lines: [`${item.year}`, labels[item.category] || item.category, item.medium, item.dimensions].filter(Boolean),
      price: "",
      shopier: "",
    });
  }
  for (const item of tattoos) {
    list.push({
      href: `${base}/tattoo/${item.slug}/`,
      title: item.title,
      image: asset(item.image),
      lines: [item.medium || "Tattoo"],
      price: "",
      shopier: "",
    });
  }
  for (const item of products) {
    list.push({
      href: `${base}/shop/${item.slug}/`,
      title: item.title,
      image: asset(item.image),
      lines: [item.availability, item.shippingNote, item.description].filter(Boolean),
      price: money(item.priceTRY),
      shopier: item.purchaseUrl,
    });
  }
  return list;
}

function shell({ title, kind, body }) {
  const catalog = JSON.stringify(allProjects()).replaceAll("<", "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<link rel="stylesheet" href="${base}/assets/app.css">
<link rel="icon" href="${base}/brand/logo.jpg">
<script>document.documentElement.classList.add("js")</script>
</head>
<body data-kind="${kind}">
${header()}
${body}
${palette()}
<script type="application/json" id="catalog">${catalog}</script>
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

function card(item, href) {
  const rotation = ((item.order * 17) % 11) - 5;
  const posX = ((item.order * 13) % 9) - 4;
  const posY = ((item.order * 7) % 9) - 4;
  return `<a class="card" href="${href}" style="--rotation:${rotation};--posX:${posX};--posY:${posY}">
<span class="card__frame"><img src="${asset(item.image)}" alt="${esc(item.title)}"></span>
<span class="card__label">${esc(item.title)}</span>
</a>`;
}

const previewLimit = 9;

function overlayMarkup(project) {
  const facts = [
    project.price ? `<p class="price">${esc(project.price)}</p>` : "",
    project.lines.map((line) => `<p class="lead">${esc(line)}</p>`).join(""),
    project.shopier ? `<a class="pill" href="${esc(project.shopier)}" target="_blank" rel="noreferrer">Shopier</a>` : "",
  ].join("");
  return `<div class="project-page is-ready" id="project">
<div class="modal">
<div class="modal__bar"><a class="round" href="${base}/" data-close aria-label="Close">×</a></div>
<div class="modal__main">
<h1>${words(project.title)}</h1>
<div class="facts">${facts}</div>
<figure><img src="${project.image}" alt="${esc(project.title)}"></figure>
</div>
</div>
</div>`;
}

function moreLink(href, total) {
  if (total <= previewLimit) return "";
  return `<p class="more"><a class="pill" href="${href}">All / Tümü</a></p>`;
}

function homeMarkup() {
  const heroShots = art.slice(0, 4).map((item, index) => `<div class="hero__image" style="--delay:${index}"><a href="${base}/works/${item.slug}/"><img src="${asset(item.image)}" alt="${esc(item.title)}"></a></div>`).join("");
  const slides = art.slice(0, previewLimit).map((item) => `<div class="carousel__slide"><a href="${base}/works/${item.slug}/"><img src="${asset(item.image)}" alt="${esc(item.title)}" draggable="false"></a><a class="pill" href="${base}/works/${item.slug}/">${esc(item.title)}</a></div>`).join("");
  const tattooCards = tattoos.slice(0, previewLimit).map((item) => card(item, `${base}/tattoo/${item.slug}/`)).join("");
  const shopCards = products.slice(0, previewLimit).map((item) => card(item, `${base}/shop/${item.slug}/`)).join("");
  const role = site.tagline;
  return `<main class="index" id="main">
<section class="hero">
<div class="hero__top">
<p class="kicker">${esc(site.location)}</p>
<small><a href="mailto:${site.email}">${esc(site.email)}</a></small>
</div>
<div class="hero__mid">
<h1 aria-label="${esc(site.name)}">${words(site.name)}</h1>
<div class="hero__images">${heroShots}</div>
<p class="role">${words(role)}</p>
<nav class="shortcuts" aria-label="Sections">
<a class="pill" href="#art">Art</a>
<a class="pill" href="#tattoo">Tattoo</a>
<a class="pill" href="#shop">Shop</a>
</nav>
</div>
<div class="hero__bot">
<p class="clients">Work includes</p>
<small>Printmaking, digital art, sculpture, objects, tattoo</small>
</div>
</section>
<section class="block" id="art">
<div class="text-block">
<h2>Art</h2>
<p>Prints, objects and compositions. Tattoos stay in their own collection.</p>
</div>
<div class="carousel" aria-label="Art"><div class="carousel__track">${slides}</div></div>
${moreLink(`${base}/works/`, art.length)}
</section>
<section class="block" id="tattoo">
<div class="text-block">
<h2>Tattoo</h2>
<p>A short selection from the tattoo collection.</p>
</div>
<div class="work-grid">${tattooCards}</div>
${moreLink(`${base}/tattoo/`, tattoos.length)}
</section>
<section class="block" id="shop">
<div class="text-block">
<h2>Shop</h2>
<p>Prints and objects. Checkout stays on Shopier.</p>
</div>
<div class="work-grid">${shopCards}</div>
${moreLink(`${base}/shop/`, products.length)}
</section>
</main>
<div class="phantom"></div>
<footer class="site-footer footer">
<p class="footer__title">Contact</p>
<ul class="footer__links">
<li><a href="mailto:${site.email}">${esc(site.email)}</a></li>
<li><a href="${site.instagram}" target="_blank" rel="noreferrer">Instagram</a></li>
<li><a href="${base}/contact/">Contact page</a></li>
</ul>
<small>Original artwork by Alper Halıcı</small>
</footer>`;
}

function home() {
  return shell({ title: "A/0001", kind: "home", body: homeMarkup() });
}

function detail(project) {
  return shell({
    title: `${project.title} — A/0001`,
    kind: "home",
    body: homeMarkup() + overlayMarkup(project),
  });
}

function aboutPage() {
  const paragraphs = site.about.map((line, index) => `<p style="--delay:${index + 1}">${esc(line)}</p>`).join("");
  const names = art.map((item, index) => `<li style="--idx:${index};--rotation:${(index % 5) - 2}"><a href="${base}/works/${item.slug}/">${esc(item.title)}</a><img src="${asset(item.image)}" alt=""></li>`).join("");
  return shell({
    title: "About — A/0001",
    kind: "about",
    body: `<main class="about" id="main">
<div class="bio">
<h1>About</h1>
${paragraphs}
</div>
<section>
<h2>Art</h2>
<ul class="name-list">${names}</ul>
<p style="margin-top:2rem"><a class="pill" href="${base}/#tattoo">Tattoo</a></p>
<p style="margin-top:1rem"><a class="pill" href="${base}/#shop">Shop</a></p>
</section>
</main>`,
  });
}

function archivePage({ title, lede, items, hrefFor }) {
  const cards = items.map((item) => card(item, hrefFor(item))).join("");
  return shell({
    title: `${title} — A/0001`,
    kind: "archive",
    body: `<main class="index archive" id="main">
<section class="block">
<div class="text-block">
<h1>${esc(title)}</h1>
<p>${esc(lede)}</p>
<a class="pill" href="${base}/">Home</a>
</div>
<div class="work-grid">${cards}</div>
</section>
</main>`,
  });
}

function contactPage() {
  return shell({
    title: "Contact — A/0001",
    kind: "contact",
    body: `<main class="contact-page" id="main">
<h1>Contact</h1>
<ul class="footer__links">
<li><a href="mailto:${site.email}">${esc(site.email)}</a></li>
<li><a href="${site.instagram}" target="_blank" rel="noreferrer">Instagram</a></li>
</ul>
<small>${esc(site.location)}</small>
</main>`,
  });
}

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "assets/fonts"), { recursive: true });
cpSync(join(studio, "app.css"), join(out, "assets/app.css"));
cpSync(join(studio, "app.js"), join(out, "assets/app.js"));
cpSync(join(studio, "brush.js"), join(out, "assets/brush.js"));
cpSync(join(studio, "fonts"), join(out, "assets/fonts"), { recursive: true });
cpSync(join(repo, "source/public/brand"), join(out, "brand"), { recursive: true });
cpSync(join(repo, "source/public/shop"), join(out, "shop"), { recursive: true });
cpSync(join(repo, "source/public/tattoo"), join(out, "tattoo"), { recursive: true });
writeFileSync(join(out, ".nojekyll"), "");

writePage("index.html", home());
writePage("about/index.html", aboutPage());
writePage("contact/index.html", contactPage());
writePage("works/index.html", archivePage({
  title: "Art",
  lede: "Every tattoo-free work.",
  items: art,
  hrefFor: (item) => `${base}/works/${item.slug}/`,
}));
writePage("tattoo/index.html", archivePage({
  title: "Tattoo",
  lede: "The full tattoo collection.",
  items: tattoos,
  hrefFor: (item) => `${base}/tattoo/${item.slug}/`,
}));
writePage("shop/index.html", archivePage({
  title: "Shop",
  lede: "Prints and objects. Checkout stays on Shopier.",
  items: products,
  hrefFor: (item) => `${base}/shop/${item.slug}/`,
}));

for (const project of allProjects()) {
  const relative = project.href.replace(`${base}/`, "") + "index.html";
  writePage(relative, detail(project));
}

console.log(`built ${art.length} art, ${tattoos.length} tattoos, ${products.length} products -> ${out}`);
