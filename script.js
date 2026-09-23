const PAYMENT_UPI = "malager@fam";
const products = [
  {id:"100", name:"100 Diamonds", desc:"Starter pack", originalPrice:80, price:59},
  {id:"310", name:"310 Diamonds", desc:"Popular pack", originalPrice:240, price:220, popular:true},
  {id:"520", name:"520 Diamonds", desc:"Value pack", originalPrice:390, price:370},
  {id:"1060", name:"1060 Diamonds", desc:"Mega pack", originalPrice:760, price:740},
  {id:"2180", name:"2180 Diamonds", desc:"Ultra pack", originalPrice:1490, price:1470},
  {id:"membership", name:"Weekly Membership", desc:"Membership", originalPrice:170, price:150},
  {id:"monthly", name:"Monthly Membership", desc:"Membership", originalPrice:520, price:500},
  {id:"custom", name:"Custom Amount", desc:"Choose at checkout", price:0}
];

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let verifiedUid = "";
let selected = null;

function renderProducts(){
  $("#products").innerHTML = products.map(p => `
    <article class="product ${p.popular ? "popular" : ""}">
      ${p.popular ? `<span class="badge">POPULAR</span>` : ""}
      <div class="gem">◆</div>
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <div class="price">${p.price ? `<span class="old-price">₹${p.originalPrice}</span><span class="discount-price">₹${p.price}</span>` : "Custom"}</div>
      <button class="buy" data-id="${p.id}">${p.price ? "Buy now" : "Choose amount"}</button>
    </article>
  `).join("");
}
renderProducts();

$("#themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("light");
  $("#themeBtn").textContent = document.body.classList.contains("light") ? "☀" : "☾";
});

$("#verifyBtn").addEventListener("click", async () => {
  const uid = $("#uid").value.trim();
  if(!/^\d{6,20}$/.test(uid)){
    toast("Enter a valid numeric UID (6–20 digits).");
    $("#uid").focus();
    return;
  }
  const btn = $("#verifyBtn");
  const oldText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="scan-dot"></span> Scanning...';
  $("#verified").classList.remove("show");
  $("#verifyError").textContent = "";
  $("#verifyError").classList.remove("show");
  try {
    const base = (window.NOVATOPUP_API_BASE || "").replace(/\/$/, "");
    const response = await fetch(`${base}/api/player/verify?uid=${encodeURIComponent(uid)}&region=IND`, { headers: { "Accept": "application/json" } });
    const data = await response.json().catch(() => ({}));
    if(!response.ok || !data.success || !data.player) throw new Error(data.error || "Player not found. Please check the UID.");
    const p = data.player;
    verifiedUid = String(p.uid || uid);
    $("#verifiedUid").textContent = verifiedUid;
    $("#playerName").textContent = p.name || "Unknown";
    $("#playerLevel").textContent = p.level ?? "—";
    $("#playerLikes").textContent = Number.isFinite(Number(p.likes)) ? Number(p.likes).toLocaleString() : (p.likes || "—");
    $("#playerGuild").textContent = p.guild || "No guild";
    $("#uidNote").textContent = `Player: ${p.name || "Unknown"} • UID: ${verifiedUid}`;
    $("#verified").classList.add("show");
    toast("Player found ✓");
    document.querySelector("#store").scrollIntoView({behavior:"smooth", block:"start"});
  } catch (err) {
    verifiedUid = "";
    $("#uidNote").textContent = "Verify your UID first";
    const msg = err?.message || "Unable to verify this UID right now.";
    $("#verifyError").textContent = msg;
    $("#verifyError").classList.add("show");
    toast("Verification failed");
  } finally {
    btn.disabled = false;
    btn.innerHTML = oldText;
  }
});

$("#uid").addEventListener("keydown", e => {
  if(e.key === "Enter") $("#verifyBtn").click();
});

$("#products").addEventListener("click", e => {
  const btn = e.target.closest(".buy");
  if(!btn) return;
  if(!verifiedUid){
    toast("Verify your UID first.");
    document.querySelector("#topup").scrollIntoView({behavior:"smooth"});
    return;
  }
  selected = products.find(p => p.id === btn.dataset.id);
  if(selected.id === "custom"){
    const amount = prompt("Enter the custom INR amount:");
    const value = Number(amount);
    if(!Number.isFinite(value) || value <= 0 || value > 100000){
      toast("Please enter a valid amount.");
      return;
    }
    selected = {...selected, name:"Custom Top-Up", price:Math.round(value)};
  }
  $("#orderProduct").textContent = selected.name;
  $("#orderPrice").textContent = "₹" + selected.price;
  $("#orderUid").textContent = verifiedUid;
  $("#refId").value = "";
  openModal();
});

function openModal(){ $("#modalBackdrop").classList.add("show"); document.body.style.overflow="hidden"; }
function closeModal(){ $("#modalBackdrop").classList.remove("show"); document.body.style.overflow=""; }
$("#closeModal").addEventListener("click", closeModal);
$("#modalBackdrop").addEventListener("click", e => { if(e.target === $("#modalBackdrop")) closeModal(); });

$$(".payment-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    $$(".payment-tab").forEach(x => x.classList.remove("active"));
    $$(".payment-panel").forEach(x => x.classList.remove("active"));
    tab.classList.add("active");
    $("#" + tab.dataset.method + "Panel").classList.add("active");
  });
});

$("#upiPayBtn").addEventListener("click", () => {
  if(!selected) return;
  const amount = selected.price.toFixed(2);
  const params = new URLSearchParams({
    pa: PAYMENT_UPI,
    pn: "Pavan Malager",
    am: amount,
    cu: "INR",
    tn: `${selected.name} | UID ${verifiedUid}`
  });
  const uri = `upi://pay?${params.toString()}`;

  // Launch the normal UPI intent. Do not navigate the website to a fake
  // success page and do not claim that payment was completed.
  window.location.href = uri;
  setTimeout(() => toast("If no UPI app opens, use the QR CODE tab."), 1200);
});

$("#confirmBtn").addEventListener("click", () => {
  const ref = $("#refId").value.trim();
  if(!ref){
    toast("Enter your transaction/reference ID.");
    return;
  }
  const order = "NT-" + Date.now().toString().slice(-8);
  closeModal();
  toast(`Reference submitted. Demo order ${order}`);
  setTimeout(() => {
    alert(`Demo order created\n\nOrder: ${order}\nUID: ${verifiedUid}\nProduct: ${selected?.name || "—"}\nReference: ${ref}\n\nPayment is NOT automatically verified by this static site.`);
  }, 250);
});

$$(".faq-item").forEach(item => item.addEventListener("click", () => item.classList.toggle("open")));

let toastTimer;
function toast(message){
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}
