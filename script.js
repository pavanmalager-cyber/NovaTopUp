const PAYMENT_UPI = "malager@fam";
const products = [
  {id:"100", name:"100 Diamonds", desc:"Starter pack", price:59},
  {id:"310", name:"310 Diamonds", desc:"Popular pack", price:220, popular:true},
  {id:"520", name:"520 Diamonds", desc:"Value pack", price:370},
  {id:"1060", name:"1060 Diamonds", desc:"Mega pack", price:740},
  {id:"2180", name:"2180 Diamonds", desc:"Ultra pack", price:1470},
  {id:"membership", name:"Weekly Membership", desc:"Membership", price:150},
  {id:"monthly", name:"Monthly Membership", desc:"Membership", price:500},
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
      <div class="price">${p.price ? "₹" + p.price : "Custom"}</div>
      <button class="buy" data-id="${p.id}">${p.price ? "Buy now" : "Choose amount"}</button>
    </article>
  `).join("");
}
renderProducts();

$("#themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("light");
  $("#themeBtn").textContent = document.body.classList.contains("light") ? "☀" : "☾";
});

$("#verifyBtn").addEventListener("click", () => {
  const uid = $("#uid").value.trim();
  if(!/^\d{6,20}$/.test(uid)){
    toast("Enter a valid numeric UID (6–20 digits).");
    $("#uid").focus();
    return;
  }
  verifiedUid = uid;
  $("#verifiedUid").textContent = uid;
  $("#verified").classList.add("show");
  $("#uidNote").textContent = `Verified UID: ${uid}`;
  toast("UID verified in demo mode ✓");
  document.querySelector("#store").scrollIntoView({behavior:"smooth", block:"start"});
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
  toast("Opening your UPI app…");
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
