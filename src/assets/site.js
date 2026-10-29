// Mobile menu, M-Pesa dialog, store filter and the contact form (which actually sends now).
const EMAIL = "info@mizaniconcept.org";
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${EMAIL}`;

document.body.classList.add("page-" + (location.pathname.replace(/\/$/, "").split("/").pop() || "home"));

const menuBtn = document.querySelector(".menu-btn");
const nav = document.querySelector(".nav");
menuBtn?.addEventListener("click", () => {
  const open = menuBtn.getAttribute("aria-expanded") !== "true";
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  nav.classList.toggle("open", open);
});

// M-Pesa giving dialog
const dialog = document.getElementById("mpesa");
document.querySelectorAll("[data-give]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const amt = btn.dataset.give;
    const label = dialog.querySelector("[data-amount]");
    if (label) label.textContent = amt ? `Suggested gift: ${amt}` : "Give any amount";
    dialog.showModal();
  })
);
dialog?.querySelector(".dialog-close")?.addEventListener("click", () => dialog.close());
dialog?.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
document.querySelectorAll("[data-copy]").forEach((btn) =>
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.textContent = "Copied";
      setTimeout(() => (btn.textContent = "Copy"), 2000);
    } catch { /* clipboard blocked: number stays visible to copy by hand */ }
  })
);

// Store category filter
const filters = document.querySelectorAll(".filters button");
filters.forEach((btn) =>
  btn.addEventListener("click", () => {
    filters.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    const cat = btn.dataset.filter;
    document.querySelectorAll(".product").forEach((p) => (p.hidden = cat !== "all" && p.dataset.cat !== cat));
  })
);

// Contact form: preselect audience from ?as=, then send to the Mizani inbox
const form = document.getElementById("contact-form");
if (form) {
  const as = new URLSearchParams(location.search).get("as");
  const select = form.querySelector("#role");
  if (as && select.querySelector(`option[value="${as}"]`)) select.value = as;
  const toggleMinor = () => form.querySelector("#minor-note").hidden = select.value !== "youth";
  select.addEventListener("change", toggleMinor);
  toggleMinor();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = form.querySelector(".form-status");
    const btn = form.querySelector("button[type=submit]");
    if (form.querySelector("[name=_honey]").value) return;
    const data = Object.fromEntries(new FormData(form));
    const roleText = select.options[select.selectedIndex].text;
    btn.disabled = true;
    btn.textContent = "Sending...";
    status.className = "form-status";
    status.textContent = "";
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...data, role: roleText, _subject: `Website enquiry: ${roleText}`, _template: "table", _captcha: "false" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === "false" || json.success === false) throw new Error(json.message || "Send failed");
      form.reset();
      toggleMinor();
      status.className = "form-status ok";
      status.textContent = "Thank you. Your message has reached the Mizani team and we will reply within 3 working days.";
    } catch {
      const body = encodeURIComponent(Object.entries(data).filter(([k]) => !k.startsWith("_")).map(([k, v]) => `${k}: ${v}`).join("\n"));
      status.className = "form-status err";
      status.innerHTML = `Sorry, the message did not send. Please <a href="mailto:${EMAIL}?subject=${encodeURIComponent("Website enquiry: " + roleText)}&body=${body}">email it to us instead</a> or WhatsApp +254 724 116694.`;
    } finally {
      btn.disabled = false;
      btn.textContent = "Send my message";
    }
  });
}
