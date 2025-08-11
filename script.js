const PRICES = {
  box_s: 21.50,
  box_m: 23.50,
  box_l: 27.50,
  name_card: 30.00,
  foil_num: 20.00,
  bubble: 31.50
};

function loadCart(){ try{return JSON.parse(localStorage.getItem('cart')||'[]');}catch(e){return []} }
function saveCart(c){ localStorage.setItem('cart', JSON.stringify(c)); }
function money(n){ return (Math.round(n*100)/100).toFixed(2).replace('.', ',') + ' €'; }

function addItem(id, color, text, qty){
  const cart = loadCart();
  cart.push({id, color, text, qty: Number(qty)||1, price: PRICES[id]||0});
  saveCart(cart);
  renderCart();
}

function renderCart(){
  const list = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  if(!list||!totalEl) return;

  const cart = loadCart();
  list.innerHTML = '';
  let total = 0;
  cart.forEach((it, idx)=>{
    const li = document.createElement('li');
    const sum = (it.price * it.qty);
    total += sum;
    li.innerHTML = `
      <div>
        <strong>${label(it.id)}</strong> × ${it.qty} – ${money(sum)}
        <div class="mini">${it.color || '-'} | ${it.text ? escapeHtml(it.text) : '-'}</div>
      </div>
      <button data-i="${idx}" class="rm">Entfernen</button>`;
    list.appendChild(li);
  });
  totalEl.textContent = money(total);
  list.querySelectorAll('.rm').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const i = Number(e.currentTarget.dataset.i);
      const c = loadCart(); c.splice(i,1); saveCart(c); renderCart();
    });
  });
}

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

function escapeHtml(s){ return s.replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

// Klicks auf "In den Warenkorb"
document.querySelectorAll('.product-card').forEach(card=>{
  const id = card.dataset.id;
  card.querySelector('.add').addEventListener('click', ()=>{
    const color = card.querySelector('.opt-color')?.value || '';
    const text  = card.querySelector('.opt-text')?.value || '';
    const qty   = card.querySelector('.opt-qty')?.value || 1;
    if(text.length > 35){ alert('Max. 35 Zeichen bei Personalisierung.'); return; }
    addItem(id, color, text, qty);
    alert('Zum Warenkorb hinzugefügt ✔');
  });
});

document.addEventListener('DOMContentLoaded', renderCart);
renderCart();
