// Mizani Store cart: lives in this browser's localStorage, checkout sends the order
// to the Mizani inbox and shows Paybill / bank details with an order reference.
const CART_KEY = "mizani-cart-v1";
const KES_RATE = 130;
const ORDER_ENDPOINT = "https://formsubmit.co/ajax/info@mizaniconcept.org";
const WA = "254724116694";

let catalog = {};
const usd = (n) => `$${n.toLocaleString("en-US")}`;
const kes = (n) => `KES ${Math.round(n * KES_RATE).toLocaleString("en-KE")}`;

const load = () => {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
};
let cart = load();
const save = () => {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* private mode: cart lasts for this page only */ }
  render();
};
const keyOf = (i) => [i.slug, i.option || "", i.personalise || ""].join("|");
const lineTotal = (i) => (catalog[i.slug]?.price || 0) * i.qty;
const subtotal = () => cart.reduce((s, i) => s + lineTotal(i), 0);
const count = () => cart.reduce((s, i) => s + i.qty, 0);
const describe = (i) => [i.option, i.personalise && `Name: ${i.personalise}`].filter(Boolean).join(", ");

function add(item) {
  const existing = cart.find((i) => keyOf(i) === keyOf(item));
  if (existing) existing.qty = Math.min(20, existing.qty + item.qty);
  else cart.push(item);
  save();
}

const drawer = document.getElementById("cart");
const openCart = () => drawer?.showModal();

function el(tag, attrs = {}, text) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text != null) n.textContent = text;
  return n;
}

function render() {
  const c = count();
  document.querySelectorAll("[data-cart-count]").forEach((b) => { b.textContent = c; b.hidden = c === 0; });
  document.querySelectorAll("[data-open-cart]").forEach((b) => b.setAttribute("aria-label", `Open cart, ${c} item${c === 1 ? "" : "s"}`));
  document.querySelectorAll("[data-cart-subtotal]").forEach((n) => (n.textContent = usd(subtotal())));
  const checkoutLink = document.querySelector("[data-checkout-link]");
  if (checkoutLink) checkoutLink.toggleAttribute("aria-disabled", c === 0);

  const box = document.querySelector("[data-cart-items]");
  if (box) {
    box.replaceChildren();
    if (!cart.length) {
      box.append(el("p", { class: "muted" }, "Your cart is empty. Every piece is handmade in Kenya and helps fund our youth programs."));
      const a = el("a", { class: "btn btn-outline", href: "/store" }, "Browse the store");
      box.append(a);
    }
    cart.forEach((i) => {
      const p = catalog[i.slug];
      if (!p) return;
      const row = el("div", { class: "cart-line" });
      const img = el("img", { src: `/assets/img/${p.img}.webp`, alt: "", width: "72", height: "72" });
      const info = el("div", { class: "cart-info" });
      const name = el("a", { href: `/store/${i.slug}` }, p.name);
      info.append(name);
      if (describe(i)) info.append(el("small", {}, describe(i)));
      info.append(el("span", { class: "cart-price" }, usd(lineTotal(i))));
      const qty = el("div", { class: "qty" });
      const minus = el("button", { type: "button", "aria-label": `Decrease quantity of ${p.name}` }, "−");
      const val = el("span", { "aria-live": "polite" }, String(i.qty));
      const plus = el("button", { type: "button", "aria-label": `Increase quantity of ${p.name}` }, "+");
      const rm = el("button", { type: "button", class: "remove", "aria-label": `Remove ${p.name}` }, "Remove");
      minus.onclick = () => { i.qty -= 1; if (i.qty < 1) cart = cart.filter((x) => x !== i); save(); };
      plus.onclick = () => { i.qty = Math.min(20, i.qty + 1); save(); };
      rm.onclick = () => { cart = cart.filter((x) => x !== i); save(); };
      qty.append(minus, val, plus);
      info.append(qty, rm);
      row.append(img, info);
      box.append(row);
    });
  }
  renderCheckout();
}

// Checkout page
const ck = document.querySelector("[data-checkout]");
function renderCheckout() {
  if (!ck || ck.dataset.done) return;
  const empty = !cart.length;
  ck.querySelector("[data-checkout-empty]").hidden = !empty;
  ck.querySelector("[data-checkout-form]").hidden = empty;
  ck.querySelector("[data-order-summary]").hidden = empty;
  const list = ck.querySelector("[data-summary-items]");
  list.replaceChildren();
  cart.forEach((i) => {
    const p = catalog[i.slug];
    if (!p) return;
    const li = el("li");
    li.append(el("span", {}, `${i.qty} × ${p.name}${describe(i) ? ` (${describe(i)})` : ""}${p.priceFrom ? " (from)" : ""}`), el("strong", {}, usd(lineTotal(i))));
    list.append(li);
  });
  ck.querySelector("[data-summary-subtotal]").textContent = usd(subtotal());
  ck.querySelector("[data-summary-kes]").textContent = kes(subtotal());
}

const ref = () => "MZ-" + new Date().toISOString().slice(2, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();

ck?.querySelector("[data-checkout-form]").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  if (form._honey.value) return;
  const status = form.querySelector(".form-status");
  const btn = form.querySelector("button[type=submit]");
  const data = Object.fromEntries(new FormData(form));
  const orderRef = ref();
  const total = subtotal();
  const lines = cart.map((i) => `${i.qty} x ${catalog[i.slug].name}${describe(i) ? ` (${describe(i)})` : ""} = ${usd(lineTotal(i))}`);
  btn.disabled = true;
  btn.textContent = "Placing order...";
  try {
    const res = await fetch(ORDER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: `Store order ${orderRef}: ${usd(total)}`,
        _template: "table",
        _captcha: "false",
        order_ref: orderRef,
        items: lines.join("\n"),
        subtotal_usd: usd(total),
        subtotal_kes_approx: kes(total),
        name: `${data.first_name} ${data.last_name}`,
        email: data.email,
        phone: data.phone,
        country: data.country,
        address: data.address,
        notes: data.notes || "",
        payment: data.payment,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === "false" || json.success === false) throw new Error("send failed");
  } catch {
    btn.disabled = false;
    btn.textContent = "Place order";
    status.className = "form-status err";
    status.setAttribute("role", "alert");
    const wa = `https://wa.me/${WA}?text=${encodeURIComponent(`Hi Mizani, I would like to order:\n${lines.join("\n")}\nTotal: ${usd(total)}\nName: ${data.first_name} ${data.last_name}\nDeliver to: ${data.address}, ${data.country}`)}`;
    status.replaceChildren("Sorry, the order did not send. ", Object.assign(el("a", { href: wa, rel: "noopener" }, "Send it on WhatsApp instead"), {}), ".");
    return;
  }
  ck.dataset.done = "1";
  form.hidden = true;
  ck.querySelector("[data-order-summary]").hidden = false;
  const conf = ck.querySelector("[data-confirmation]");
  conf.hidden = false;
  conf.querySelectorAll("[data-order-ref]").forEach((n) => (n.textContent = orderRef));
  conf.querySelector("[data-pay-total]").textContent = usd(total);
  conf.querySelector("[data-pay-kes]").textContent = kes(total);
  conf.querySelector("[data-wa-confirm]").href = `https://wa.me/${WA}?text=${encodeURIComponent(`Hi Mizani, I have paid for order ${orderRef} (${usd(total)}). Here is my confirmation message:`)}`;
  cart = [];
  try { localStorage.removeItem(CART_KEY); } catch {}
  render();
  conf.focus();
  conf.scrollIntoView({ behavior: "smooth", block: "start" });
});

// Wiring
document.querySelectorAll("[data-open-cart]").forEach((b) => b.addEventListener("click", openCart));
document.querySelectorAll("[data-close-cart]").forEach((b) => b.addEventListener("click", () => drawer.close()));
drawer?.addEventListener("click", (e) => { if (e.target === drawer) drawer.close(); });
document.querySelector("[data-checkout-link]")?.addEventListener("click", (e) => { if (!cart.length) e.preventDefault(); });

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-add]");
  if (!b) return;
  add({ slug: b.dataset.add, qty: 1 });
  openCart();
});

document.querySelectorAll("form[data-buy]").forEach((f) =>
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    add({ slug: f.dataset.buy, option: d.option || undefined, personalise: (d.personalise || "").trim() || undefined, qty: Math.max(1, Math.min(20, parseInt(d.qty, 10) || 1)) });
    f.querySelector(".form-status").textContent = "Added to your cart.";
    openCart();
  })
);

fetch("/assets/products.json")
  .then((r) => r.json())
  .then((list) => {
    catalog = Object.fromEntries(list.map((p) => [p.slug, p]));
    cart = cart.filter((i) => catalog[i.slug]);
    render();
  })
  .catch(render);
