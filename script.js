// Preise
const PRICES = {
  box_s: 21.50,
  box_m: 23.50,
  box_l: 27.50,
  name_card: 30.00,
  foil_num: 20.00,
  bubble: 31.50
};

// Versandpreise (Euro)
const SHIPPING = {
  de_standard: 4.90,
  de_express: 12.90,
  ch_standard: 9.90,
  ch_express: 19.90,
  pickup: 0
};

function loadCart(){ try{return JSON.parse(localStorage.getItem('cart')||'[]');}catch(e){return [];} }
function saveCart(c){ localStorage.setItem('cart', JSON.stringify(c)); }
function money(n){ return (Math.round(n*100)/100).toFixed(2).replace('.', ',') + ' €'; }
function euros(n){ return Math.round(n*100)/100; }

function label(id){
  return {
    box_s:'Geschenkbox klein',
    box_m:'Geschenkbox mittel',
    box_l:'Geschenkbox groß',
    name_card:'Tischnamen',
    foil_num:'Folienzahlen',
    bubble:'Bubble Ballon'
  }[id] || id;
}

// --- UI: Produkte hinzufügen (wie zuvor)
document.querySelectorAll('.product-card').forEach(card=>{
  const id = card.dataset.id;
  card.querySelector('.add').addEventListener('click', ()=>{
    const color = card.querySelector('.opt-color')?.value || '';
    const text  = card.querySelector('.opt-text')?.value || '';
    const qty   = Number(card.querySelector('.opt-qty')?.value || 1);
    if(text.length > 35){ alert('Max. 35 Zeichen bei Personalisierung.'); return; }
    const cart = loadCart();
    cart.push({id, color, text, qty, price: PRICES[id]||0});
    saveCart(cart);
    renderCart();
    alert('Zum Warenkorb hinzugefügt ✔');
  });
});

// --- Versand & Summen
function getShipping(){ return localStorage.getItem('ship_key') || 'de_standard'; }
function setShipping(k){ localStorage.setItem('ship_key', k); }

function cartSubtotal(){
  return euros(loadCart().reduce((s,it)=> s + (it.price * it.qty), 0));
}

function shippingBase(k){ return euros(SHIPPING[k] ?? 0); }

// Gratisversand-Regel: nur Standard
function shippingAmount(){
  const key = getShipping();
  const base = shippingBase(key);
  const preliminary = cartSubtotal() + base; // Endbetrag inkl. Basisversand
  if(key === 'de_standard' && preliminary >= 80) return 0;
  if(key === 'ch_standard' && preliminary >= 100) return 0;
  return base;
}

function renderCart(){
  const list = document.getElementById('cartItems');
  const subEl = document.getElementById('subTotal');
  const shipEl = document.getElementById('shipAmount');
  const totalEl = document.getElementById('grandTotal');
  const freeHint = document.getElementById('freeShipHint');
  const shipSel = document.getElementById('shippingSelect');
  const warn = document.getElementById('expressWarning');
  const customs = document.getElementById('customsNote');

  // Liste
  const cart = loadCart();
  list.innerHTML = '';
  cart.forEach((it, idx)=>{
    const sum = euros(it.price * it.qty);
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${label(it.id)}</strong> × ${it.qty} – ${money(sum)}
        <div class="mini">${it.color || '-'} | ${it.text ? escapeHtml(it.text) : '-'}</div>
      </div>
      <button data-i="${idx}" class="rm">Entfernen</button>`;
    list.appendChild(li);
  });
  list.querySelectorAll('.rm').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const i = Number(e.currentTarget.dataset.i);
      const c = loadCart(); c.splice(i,1); saveCart(c); renderCart();
    });
  });

  // Summen
  const sub = cartSubtotal();
  subEl.textContent = money(sub);

  // Express nur ab 22 €
  const shipKey = shipSel.value;
  const expressSelected = (shipKey === 'de_express' || shipKey === 'ch_express');
  if(expressSelected && sub < 22){
    warn.style.display = 'block';
  } else {
    warn.style.display = 'none';
  }

  // Zollhinweis bei CH
  customs.style.display = (shipKey.startsWith('ch_')) ? 'block' : 'none';

  // Gratisversand-Hinweis
  let hint = '';
  const base = shippingBase(shipKey);
  const prelim = sub + base;
  if(shipKey === 'de_standard' && prelim < 80){
    hint = `💡 Gratis Standardversand ab 80,00 € – es fehlen noch ${money(80 - prelim)}`;
  }
  if(shipKey === 'ch_standard' && prelim < 100){
    hint = `💡 Gratis Standardversand (CH) ab 100,00 € – es fehlen noch ${money(100 - prelim)}`;
  }
  freeHint.textContent = hint;

  const ship = shippingAmount();
  shipEl.textContent = money(ship);

  const total = euros(sub + ship);
  totalEl.textContent = money(total);
}

function escapeHtml(s){ return s.replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

// Shipping select init
const shipSel = document.getElementById('shippingSelect');
if(shipSel){
  shipSel.value = getShipping();
  shipSel.addEventListener('change', e=>{
    setShipping(e.target.value);
    renderCart();
  });
}

// "Bestellung abschließen" – vorerst nur Weiterleitung auf Success
document.getElementById('placeOrder')?.addEventListener('click', ()=>{
  const email = (document.getElementById('buyerEmail')?.value || '').trim();
  if(!email){ alert('Bitte E-Mail eingeben.'); return; }

  // einfache Order-Zusammenfassung merken (für spätere E-Mail/Stripe-Funktion)
  const order = {
    items: loadCart(),
    shippingKey: getShipping(),
    productsTotal: cartSubtotal(),
    shippingAmount: shippingAmount(),
    grandTotal: euros(cartSubtotal() + shippingAmount()),
    buyerEmail: email,
    createdAt: new Date().toISOString()
  };
  localStorage.setItem('alessia_last_order', JSON.stringify(order));

 document.getElementById('placeOrder')?.addEventListener('click', async ()=>{
  const email = (document.getElementById('buyerEmail')?.value || '').trim();
  if(!email){ alert('Bitte E-Mail eingeben.'); return; }

  const order = {
    items: loadCart(),
    shippingKey: getShipping(),
    productsTotal: cartSubtotal(),
    shippingAmount: shippingAmount(),
    grandTotal: euros(cartSubtotal() + shippingAmount()),
    buyerEmail: email,
    createdAt: new Date().toISOString()
  };
  localStorage.setItem('alessia_last_order', JSON.stringify(order));

  try {
    // Stripe Checkout Session holen
    const res = await fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ order })
    });
    if(!res.ok) throw new Error('Checkout error');
    const data = await res.json();
    if(data.url){
      // vor Redirect schon E-Mail anstoßen (optional auch erst auf Success)
      fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ order })
      }).catch(()=>{});
      // zu Stripe weiterleiten
      window.location.href = data.url;
    } else {
      throw new Error('No session URL');
    }
  } catch (e) {
    console.error(e);
    alert('Zahlung konnte nicht gestartet werden. Bitte später erneut versuchen.');
  }
});


});

document.addEventListener('DOMContentLoaded', renderCart);
renderCart();
