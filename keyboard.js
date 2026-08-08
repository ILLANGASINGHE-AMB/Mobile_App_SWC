// keyboard.js — Full keyboard navigation & global search

// ─────────────────────────────────────────────
// GLOBAL SEARCH BAR (Batch ID / Invoice Number)
// ─────────────────────────────────────────────
function initGlobalSearch() {
  const bar = document.getElementById('global-search-bar');
  if(!bar) return;

  bar.innerHTML = `
    <div style="display:flex;gap:0;align-items:center;background:var(--card-bg);border:1.5px solid var(--border);border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);min-width:320px;">
      <select id="gs-type" style="border:none;background:var(--bg);padding:6px 10px;font-size:0.82em;color:var(--text);cursor:pointer;outline:none;border-right:1.5px solid var(--border);" onchange="updateGsPlaceholder()">
        <option value="batch">Batch ID</option>
        <option value="invoice">Invoice #</option>
      </select>
      <div style="display:flex;align-items:center;padding:0 8px;flex:1;">
        <i class="fas fa-search" style="color:var(--text-muted);font-size:0.85em;margin-right:6px;"></i>
        <input id="gs-input" class="form-input" style="border:none;padding:6px 0;font-size:0.88em;background:transparent;outline:none;width:100%;"
          placeholder="LND-..." autocomplete="off"
          oninput="onGsInput()" onkeydown="onGsKey(event)"/>
      </div>
      <kbd style="font-size:0.72em;background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:2px 6px;margin-right:8px;color:var(--text-muted);">Ctrl+K</kbd>
    </div>
    <div id="gs-dropdown" style="display:none;position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:9999;background:var(--card-bg);border:1.5px solid var(--border);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.15);max-height:320px;overflow-y:auto;"></div>`;
}

function updateGsPlaceholder() {
  const type = document.getElementById('gs-type')?.value;
  const input = document.getElementById('gs-input');
  if(input) input.placeholder = type==='batch' ? 'LND-...' : 'INV-...';
  // Auto-prefix
  if(input && input.value==='') {
    input.value = type==='batch' ? 'LND-' : 'INV-';
    input.setSelectionRange(input.value.length, input.value.length);
  }
  onGsInput();
}

let _gsDebounce=null;
function onGsInput() {
  clearTimeout(_gsDebounce);
  _gsDebounce = setTimeout(runGlobalSearch, 180);
}

function onGsKey(e) {
  const dd = document.getElementById('gs-dropdown');
  const items = dd?.querySelectorAll('.gs-result-item');
  const active = dd?.querySelector('.gs-result-item.gs-active');
  if(e.key==='ArrowDown'||e.key==='ArrowUp') {
    e.preventDefault();
    if(!items||!items.length)return;
    let idx=-1;
    items.forEach((it,i)=>{if(it===active)idx=i;});
    idx = e.key==='ArrowDown' ? Math.min(idx+1,items.length-1) : Math.max(idx-1,0);
    items.forEach(it=>it.classList.remove('gs-active'));
    items[idx]?.classList.add('gs-active');
    items[idx]?.scrollIntoView({block:'nearest'});
  } else if(e.key==='Enter') {
    if(active) { active.click(); return; }
    runGlobalSearch(true);
  } else if(e.key==='Escape') {
    closeGsDropdown();
    document.getElementById('gs-input')?.blur();
  }
}

async function runGlobalSearch(immediate=false) {
  const type  = document.getElementById('gs-type')?.value;
  const query = (document.getElementById('gs-input')?.value||'').trim().toUpperCase();
  if(query.length < 3) { closeGsDropdown(); return; }

  const [orders, invoices, customers] = await Promise.all([DB.getOrders(), DB.getInvoices(), DB.getCustomers()]);
  const cMap = Object.fromEntries(customers.map(c=>[c.id,c]));

  let results = [];
  if(type==='batch') {
    results = orders.filter(o=>(o.batch_id||'').toUpperCase().includes(query)).map(o=>({
      label: o.batch_id,
      sub:   cMap[o.customer_id]?.hotel_name||'—',
      badge: o.status,
      action: ()=>{ closeGsDropdown(); navigate('orders'); setTimeout(()=>viewOrderDetails(o.id),200); }
    }));
  } else {
    results = invoices.filter(i=>(i.invoice_number||'').toUpperCase().includes(query)).map(inv=>{
      const o = orders.find(x=>x.id===inv.order_id);
      return {
        label: inv.invoice_number,
        sub:   cMap[o?.customer_id]?.hotel_name||'—',
        badge: inv.paid_status,
        action: ()=>{ closeGsDropdown(); navigate('invoices'); setTimeout(()=>viewInvoice(inv.id),200); }
      };
    });
  }

  const dd = document.getElementById('gs-dropdown');
  if(!dd)return;
  if(!results.length) {
    dd.innerHTML=`<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.88em;">No results for "${query}"</div>`;
    dd.style.display='block'; return;
  }
  dd.innerHTML = results.slice(0,8).map((r,i)=>`
    <div class="gs-result-item ${i===0?'gs-active':''}" onclick="gsResultClick(${i})"
      style="padding:10px 14px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);transition:background 0.1s;"
      onmouseover="this.classList.add('gs-active')" onmouseout="this.classList.remove('gs-active')">
      <div>
        <div style="font-family:monospace;font-weight:700;font-size:0.9em;">${r.label}</div>
        <div style="font-size:0.8em;color:var(--text-muted);">${r.sub}</div>
      </div>
      ${statusBadge(r.badge)}
    </div>`).join('');
  dd.style.display='block';
  // store actions
  window._gsResults = results;
}

function gsResultClick(idx) {
  const r = window._gsResults?.[idx];
  if(r) r.action();
}
function closeGsDropdown() {
  const dd=document.getElementById('gs-dropdown');
  if(dd) dd.style.display='none';
}

// Close dropdown when clicking outside
document.addEventListener('click', e=>{
  const bar = document.getElementById('global-search-bar');
  if(bar && !bar.contains(e.target)) closeGsDropdown();
});

// ─────────────────────────────────────────────
// KEYBOARD SHORTCUTS
// ─────────────────────────────────────────────
document.addEventListener('keydown', e=>{
  const tag = document.activeElement?.tagName?.toLowerCase();
  const inInput = ['input','textarea','select'].includes(tag);
  const modal = document.querySelector('.modal-overlay[style*="flex"]');

  // Ctrl+K — focus global search
  if((e.ctrlKey||e.metaKey) && e.key==='k') {
    e.preventDefault();
    const input=document.getElementById('gs-input');
    if(input){input.focus();input.select();}
    return;
  }

  // Escape — close topmost modal
  if(e.key==='Escape') {
    const modals = [...document.querySelectorAll('.modal-overlay')].filter(m=>m.style.display!=='none');
    if(modals.length){ modals[modals.length-1].style.display='none'; return; }
  }

  // Enter in modal — click primary button (if not in textarea)
  if(e.key==='Enter' && modal && tag!=='textarea' && !e.shiftKey) {
    const btn = modal.querySelector('.btn-primary:not([disabled])');
    if(btn && document.activeElement!==btn){ e.preventDefault(); btn.click(); return; }
  }

  // Shortcuts only when no modal open and not in input
  if(inInput || modal) return;

  switch(e.key) {
    // Navigation — Alt + letter
    case 'd': if(e.altKey){e.preventDefault();navigate('dashboard');} break;
    case 'o': if(e.altKey){e.preventDefault();navigate('orders');} break;
    case 'i': if(e.altKey){e.preventDefault();navigate('invoices');} break;
    case 'p': if(e.altKey){e.preventDefault();navigate('invoices');} break;
    case 'c': if(e.altKey){e.preventDefault();navigate('customers');} break;
    case 'r': if(e.altKey){e.preventDefault();navigate('drivers');} break;
    case 'm': if(e.altKey){e.preventDefault();navigate('items');} break;
    case 's': if(e.altKey){e.preventDefault();navigate('settings');} break;

    // Page search focus
    case '/':
      e.preventDefault();
      const searchInput = document.querySelector('#orders-search-input,#inv-search-input,#items-search-input');
      if(searchInput){searchInput.focus();searchInput.select();}
      break;

    // Orders page shortcuts
    case 'n': if(e.altKey&&currentPage==='orders'){e.preventDefault();showAddOrderModal();} break;
    case 'P': if(e.altKey&&currentPage==='orders'){e.preventDefault();showPickupModal();} break;
    case 'C': if(e.altKey&&currentPage==='orders'){e.preventDefault();showCreditBillPrompt();} break;

    // Pagination — left/right arrows
    case 'ArrowLeft':
      if(!inInput){
        const prevBtn=document.querySelector('.page-btn:first-child:not([disabled])');
        if(prevBtn)prevBtn.click();
      }
      break;
    case 'ArrowRight':
      if(!inInput){
        const nextBtn=document.querySelector('.page-btn:last-child:not([disabled])');
        if(nextBtn)nextBtn.click();
      }
      break;
  }
});

// Tab trap inside modals — Tab cycles through focusable elements
document.addEventListener('keydown', e=>{
  if(e.key!=='Tab')return;
  const modal=document.querySelector('.modal-overlay[style*="flex"] .modal');
  if(!modal)return;
  const focusable=[...modal.querySelectorAll('input,select,textarea,button:not([disabled])')];
  if(!focusable.length)return;
  const first=focusable[0], last=focusable[focusable.length-1];
  if(e.shiftKey){if(document.activeElement===first){e.preventDefault();last.focus();}}
  else{if(document.activeElement===last){e.preventDefault();first.focus();}}
});
