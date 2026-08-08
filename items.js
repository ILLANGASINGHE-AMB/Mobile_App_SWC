// items.js - Items Catalog Module

let itemsPage=1, itemsSearch='', itemsPerPage=15;

const ITEM_SERVICES = [
  { key: 'dry_clean_price',    label: 'Dry Clean',    badge: 'badge-purple' },
  { key: 'wash_press_price',   label: 'Wash & Press', badge: 'badge-cyan'   },
  { key: 'wash_dry_price',     label: 'Wash & Dry',   badge: 'badge-green'  }
];

function clearItemsCache() {}

async function renderItems() {
  document.getElementById('page-title').textContent = 'Items';
  if (document.getElementById('items-table-body')) { await _refreshItemsTable(); return; }

  document.getElementById('content').innerHTML = `
    <div class="section-header">
      <span class="section-title">Items Catalog</span>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-primary" onclick="showGenerateQuotationModal()"><i class="fas fa-file-invoice"></i> Generate Quotation</button>
        ${isAdmin()?'<button class="btn btn-secondary" onclick="printItemsCatalog()"><i class="fas fa-print"></i> Print Catalog</button>':''}
        ${isAdmin()?'<button class="btn btn-secondary" onclick="exportItems()"><i class="fas fa-download"></i> Backup</button>':''}
        ${isAdmin()?'<button class="btn btn-secondary" onclick="document.getElementById(\'items-import-file\').click()"><i class="fas fa-upload"></i> Import</button>':''}
        <input type="file" id="items-import-file" accept=".json" style="display:none" onchange="importItems(this)"/>
        ${isAdmin()?'<button class="btn btn-primary" onclick="showAddItemModal()"><i class="fas fa-plus"></i> Add Item</button>':''}
      </div>
    </div>
    <div id="items-stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:22px;"></div>
    <div class="card" style="margin-bottom:18px;">
      <div style="display:flex;gap:12px;align-items:center;">
        <div class="search-wrap" style="flex:1;">
          <i class="fas fa-search"></i>
          <input class="form-input" id="items-search-input" placeholder="Search item ID, name..."
            autocomplete="off" spellcheck="false"
            oninput="itemsSearch=this.value;itemsPage=1;_refreshItemsTable()"/>
        </div>
        <span id="items-count" style="font-size:0.82em;color:var(--text-muted);"></span>
      </div>
    </div>
    <div class="card" style="padding:0;">
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Item ID</th>
            <th>Item Name</th>
            <th>Description</th>
            <th style="text-align:right;">Dry Clean</th>
            <th style="text-align:right;">Wash &amp; Press</th>
            <th style="text-align:right;">Wash &amp; Dry</th>
            <th>Actions</th>
          </tr></thead>
          <tbody id="items-table-body"></tbody>
        </table>
      </div>
      <div id="items-pagination" style="padding:14px 18px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border);"></div>
    </div>`;
  await _refreshItemsTable();
  document.getElementById('items-search-input').focus();
}

async function _refreshItemsTable() {
  const tbody = document.getElementById('items-table-body');
  if (!tbody) { await renderItems(); return; }

  const allItems = await DB.getItems();
  let filtered = filterData(allItems, itemsSearch, ['item_id','item_name','description']);
  filtered = filtered.sort((a,b)=>(a.item_id||'').localeCompare(b.item_id||''));
  const {items,totalPages,total} = paginateData(filtered, itemsPage, itemsPerPage);

  const statsEl = document.getElementById('items-stats');
  if(statsEl) {
    const avg = (key) => allItems.length ? allItems.reduce((s,i)=>s+(i[key]||0),0)/allItems.length : 0;
    statsEl.innerHTML =
      `<div class="stat-card"><div class="label">Total Items</div><div class="value">${allItems.length}</div><div class="sub">In catalog</div></div>`+
      `<div class="stat-card"><div class="label">Avg Dry Clean</div><div class="value" style="font-size:1.3em;">${formatCurrency(avg('dry_clean_price'))}</div></div>`+
      `<div class="stat-card"><div class="label">Avg Wash &amp; Press</div><div class="value" style="font-size:1.3em;">${formatCurrency(avg('wash_press_price'))}</div></div>`+
      `<div class="stat-card"><div class="label">Avg Wash &amp; Dry</div><div class="value" style="font-size:1.3em;">${formatCurrency(avg('wash_dry_price'))}</div></div>`;
  }
  const countEl = document.getElementById('items-count');
  if(countEl) countEl.textContent = total+' item'+(total!==1?'s':'');

  tbody.innerHTML = items.length===0
    ? `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);"><div style="font-size:2.2em;margin-bottom:8px;">🧺</div>No items found</td></tr>`
    : items.map(item=>`<tr>
        <td><span style="font-family:monospace;font-weight:700;font-size:0.9em;background:var(--bg);padding:4px 10px;border-radius:6px;border:1px solid var(--border);letter-spacing:1px;">${item.item_id}</span></td>
        <td><strong>${item.item_name}</strong></td>
        <td style="color:var(--text-muted);font-size:0.88em;">${item.description||'—'}</td>
        <td style="text-align:right;"><span class="badge badge-purple">${formatCurrency(item.dry_clean_price||0)}</span></td>
        <td style="text-align:right;"><span class="badge badge-cyan">${formatCurrency(item.wash_press_price||0)}</span></td>
        <td style="text-align:right;"><span class="badge badge-green">${formatCurrency(item.wash_dry_price||0)}</span></td>
        <td><div style="display:flex;gap:6px;">
          ${isAdmin()?`<button class="btn btn-primary btn-sm" onclick="showEditItemModal(${item.id})"><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger btn-sm" onclick="deleteItemConfirm(${item.id})"><i class="fas fa-trash"></i></button>`
          :`<span style="font-size:0.78em;color:var(--text-muted);">View only</span>`}
        </div></td>
      </tr>`).join('');

  const pg=document.getElementById('items-pagination');
  if(pg) pg.innerHTML=`<span style="font-size:0.82em;color:var(--text-muted);">Page ${itemsPage} of ${totalPages}</span>`+renderPagination(itemsPage,totalPages,'changeItemsPage');
}

function changeItemsPage(p){itemsPage=p;renderItems();}

// ─────────────────────────────────────────────
// ADD ITEM (Admin only)
// ─────────────────────────────────────────────
async function showAddItemModal() {
  if(!requireAdmin()) return;
  createModal('add-item-modal','Add New Item',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="form-group">
        <label class="form-label">Item ID *</label>
        <input class="form-input" id="it-id" placeholder="e.g. BS, TW, PC" style="text-transform:uppercase;" oninput="this.value=this.value.toUpperCase()"/>
        <span style="font-size:0.78em;color:var(--text-muted);">Short unique code</span>
      </div>
      <div class="form-group">
        <label class="form-label">Item Name *</label>
        <input class="form-input" id="it-name" placeholder="e.g. Bed Sheet"/>
      </div>
      <div class="form-group" style="grid-column:1/-1;">
        <label class="form-label">Description</label>
        <input class="form-input" id="it-desc" placeholder="Optional description"/>
      </div>
      <div class="form-group" style="grid-column:1/-1;">
        <label class="form-label" style="font-weight:700;margin-bottom:10px;">Service Prices (LKR)</label>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
          <div>
            <label class="form-label"><span class="badge badge-purple" style="font-size:0.75em;">Dry Clean</span></label>
            <input type="number" class="form-input" id="it-dry-clean" placeholder="0.00" min="0" step="0.01"/>
          </div>
          <div>
            <label class="form-label"><span class="badge badge-cyan" style="font-size:0.75em;">Wash &amp; Press</span></label>
            <input type="number" class="form-input" id="it-wash-press" placeholder="0.00" min="0" step="0.01"/>
          </div>
          <div>
            <label class="form-label"><span class="badge badge-green" style="font-size:0.75em;">Wash &amp; Dry</span></label>
            <input type="number" class="form-input" id="it-wash-dry" placeholder="0.00" min="0" step="0.01"/>
          </div>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px;">
      <button class="btn btn-secondary" onclick="hideModal('add-item-modal')">Cancel [Esc]</button>
      <button class="btn btn-primary" onclick="saveNewItem()"><i class="fas fa-save"></i> Save Item [Enter]</button>
    </div>`);
  showModal('add-item-modal');
  setTimeout(()=>document.getElementById('it-id')?.focus(),80);
}

async function saveNewItem() {
  if(!requireAdmin()) return;
  const item_id          = document.getElementById('it-id').value.trim().toUpperCase();
  const item_name        = document.getElementById('it-name').value.trim();
  const dry_clean_price  = parseFloat(document.getElementById('it-dry-clean').value)||0;
  const wash_press_price = parseFloat(document.getElementById('it-wash-press').value)||0;
  const wash_dry_price   = parseFloat(document.getElementById('it-wash-dry').value)||0;
  const description      = document.getElementById('it-desc').value.trim();
  if(!item_id)   return toast('Item ID is required','error');
  if(!item_name) return toast('Item name is required','error');
  const existing = await DB.getItemByCode(item_id);
  if(existing) return toast(`Item ID "${item_id}" already exists`,'error');
  await DB.addItem({item_id, item_name, dry_clean_price, wash_press_price, wash_dry_price, description});
  await DB.logAction('Add Item', `Added catalog item "${item_name}" (${item_id})`, { code: item_id, name: item_name, dry_clean_price, wash_press_price, wash_dry_price }, 'Item');
  hideModal('add-item-modal');
  toast(`Item "${item_name}" added!`);
  renderItems();
}

// ─────────────────────────────────────────────
// EDIT ITEM (Admin only)
// ─────────────────────────────────────────────
async function showEditItemModal(id) {
  if(!requireAdmin()) return;
  const item = await DB.getItem(id); if(!item) return;
  createModal('edit-item-modal',`Edit Item: ${item.item_id}`,`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="form-group">
        <label class="form-label">Item ID *</label>
        <input class="form-input" id="eit-id" value="${item.item_id||''}" style="text-transform:uppercase;" oninput="this.value=this.value.toUpperCase()"/>
      </div>
      <div class="form-group">
        <label class="form-label">Item Name *</label>
        <input class="form-input" id="eit-name" value="${item.item_name||''}"/>
      </div>
      <div class="form-group" style="grid-column:1/-1;">
        <label class="form-label">Description</label>
        <input class="form-input" id="eit-desc" value="${item.description||''}"/>
      </div>
      <div class="form-group" style="grid-column:1/-1;">
        <label class="form-label" style="font-weight:700;margin-bottom:10px;">Service Prices (LKR)</label>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
          <div>
            <label class="form-label"><span class="badge badge-purple" style="font-size:0.75em;">Dry Clean</span></label>
            <input type="number" class="form-input" id="eit-dry-clean" value="${item.dry_clean_price||0}" min="0" step="0.01"/>
          </div>
          <div>
            <label class="form-label"><span class="badge badge-cyan" style="font-size:0.75em;">Wash &amp; Press</span></label>
            <input type="number" class="form-input" id="eit-wash-press" value="${item.wash_press_price||0}" min="0" step="0.01"/>
          </div>
          <div>
            <label class="form-label"><span class="badge badge-green" style="font-size:0.75em;">Wash &amp; Dry</span></label>
            <input type="number" class="form-input" id="eit-wash-dry" value="${item.wash_dry_price||0}" min="0" step="0.01"/>
          </div>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px;">
      <button class="btn btn-secondary" onclick="hideModal('edit-item-modal')">Cancel [Esc]</button>
      <button class="btn btn-primary" onclick="saveEditItem(${id})"><i class="fas fa-save"></i> Save [Enter]</button>
    </div>`);
  showModal('edit-item-modal');
  setTimeout(()=>document.getElementById('eit-id')?.focus(),80);
}

async function saveEditItem(id) {
  if(!requireAdmin()) return;
  const item_id          = document.getElementById('eit-id').value.trim().toUpperCase();
  const item_name        = document.getElementById('eit-name').value.trim();
  const dry_clean_price  = parseFloat(document.getElementById('eit-dry-clean').value)||0;
  const wash_press_price = parseFloat(document.getElementById('eit-wash-press').value)||0;
  const wash_dry_price   = parseFloat(document.getElementById('eit-wash-dry').value)||0;
  const description      = document.getElementById('eit-desc').value.trim();
  if(!item_id)   return toast('Item ID is required','error');
  if(!item_name) return toast('Item name is required','error');
  const existing = await DB.getItemByCode(item_id);
  if(existing && existing.id!==id) return toast(`Item ID "${item_id}" already in use`,'error');
  await DB.updateItem(id,{item_id, item_name, dry_clean_price, wash_press_price, wash_dry_price, description});
  await DB.logAction('Edit Item', `Updated catalog item "${item_name}" (${item_id})`, { code: item_id, name: item_name, dry_clean_price, wash_press_price, wash_dry_price }, 'Item');
  hideModal('edit-item-modal');
  toast('Item updated!');
  renderItems();
}

async function deleteItemConfirm(id) {
  if(!requireAdmin()) return;
  const item=await DB.getItem(id);
  confirmDialog(`Delete item "${item?.item_name}"?`, async()=>{
    await DB.deleteItem(id);
    await DB.logAction('Delete Item', `Deleted catalog item "${item?.item_name}" (${item?.item_id})`, { code: item?.item_id, name: item?.item_name }, 'Item');
    toast('Item deleted'); renderItems();
  });
}

// ─────────────────────────────────────────────
// PRINT CATALOG
// ─────────────────────────────────────────────
async function printItemsCatalog() {
  const [allItems, companyName, logoData, address, phone, email] = await Promise.all([
    DB.getItems(), DB.getSetting('company_name'), DB.getSetting('logo_data'),
    DB.getSetting('address'), DB.getSetting('phone'), DB.getSetting('email')
  ]);
  const sorted    = allItems.sort((a,b)=>(a.item_id||'').localeCompare(b.item_id||''));
  const printDate = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'});
  const company   = companyName||'Sagacious Washing Center';
  const logoHTML  = logoData
    ? `<img src="${logoData}" style="height:52px;width:auto;object-fit:contain;border-radius:8px;"/>`
    : `<div style="height:52px;width:52px;border-radius:8px;background:linear-gradient(135deg,#00b4d8,#1a4d8f);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.3em;">SW</div>`;
  const half=Math.ceil(sorted.length/2);
  const fmt=v=>Number(v||0).toLocaleString('en-LK',{minimumFractionDigits:2});
  const buildRows=items=>items.map((item,idx)=>`
    <tr style="background:${idx%2===0?'#fff':'#f8fafc'};">
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:0.82em;font-weight:600;">${item.item_name}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:0.82em;color:#7c3aed;">${fmt(item.dry_clean_price)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:0.82em;color:#0369a1;">${fmt(item.wash_press_price)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:0.82em;color:#16a34a;">${fmt(item.wash_dry_price)}</td>
    </tr>`).join('');
  const thead=`<thead>
    <tr style="background:#1a4d8f;color:#fff;">
      <th style="padding:7px 8px;text-align:left;font-size:0.75em;text-transform:uppercase;" rowspan="2">Item Name</th>
      <th colspan="3" style="padding:7px 8px;text-align:center;font-size:0.75em;text-transform:uppercase;border-left:1px solid rgba(255,255,255,0.2);">Price (LKR)</th>
    </tr>
    <tr style="background:#1e3a6e;color:#fff;">
      <th style="padding:5px 8px;text-align:right;font-size:0.72em;border-left:1px solid rgba(255,255,255,0.2);">Dry Clean</th>
      <th style="padding:5px 8px;text-align:right;font-size:0.72em;">Wash &amp; Press</th>
      <th style="padding:5px 8px;text-align:right;font-size:0.72em;">Wash &amp; Dry</th>
    </tr></thead>`;
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Items Catalog</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet"/>
  <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'DM Sans',sans-serif;color:#1e293b;background:#fff;padding:24px 28px;}
  @media print{body{padding:0;}@page{margin:12mm 10mm;size:A4;}}</style></head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #e2e8f0;">
    <div style="display:flex;align-items:center;gap:12px;">${logoHTML}
      <div><div style="font-family:'Playfair Display',serif;font-size:1.3em;font-weight:700;color:#1a4d8f;">${company}</div>
      <div style="font-size:0.78em;color:#64748b;margin-top:3px;">Laundry Management System</div></div>
    </div>
    <div style="text-align:right;font-size:0.8em;color:#64748b;line-height:1.7;">
      ${phone?`<div>${phone}</div>`:''}${address?`<div>${address}</div>`:''}${email?`<div>${email}</div>`:''}
    </div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
    <div style="font-family:'Playfair Display',serif;font-size:1.15em;font-weight:700;">Items Catalog</div>
    <div style="font-size:0.75em;color:#94a3b8;">Printed: ${printDate} · ${sorted.length} item${sorted.length!==1?'s':''}</div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;">${thead}<tbody>${buildRows(sorted.slice(0,half))}</tbody></table>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;">${thead}<tbody>${sorted.slice(half).length?buildRows(sorted.slice(half)):'<tr><td colspan="4" style="padding:16px;text-align:center;color:#94a3b8;">—</td></tr>'}</tbody></table>
  </div>
  <div style="margin-top:16px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:0.72em;color:#94a3b8;">
    <span>${company} — Items Catalog</span><span>Generated on ${printDate}</span>
  </div>
  <div style="margin-top:40px;display:flex;justify-content:space-between;align-items:flex-end;">
    <div style="text-align:center;min-width:180px;">
      <div style="height:50px;border-bottom:1.5px solid #1e293b;margin-bottom:6px;"></div>
      <div style="font-size:0.85em;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:0.5px;">Issued By:-</div>
    </div>
    <div style="text-align:center;min-width:180px;">
      <div style="height:50px;border-bottom:1.5px solid #1e293b;margin-bottom:6px;"></div>
      <div style="font-size:0.85em;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:0.5px;">Checked By:-</div>
    </div>
  </div>
  <script>window.onload=()=>window.print();<\/script></body></html>`;
  const w=window.open('','_blank');
  if(!w) return toast('Allow pop-ups to print','warning');
  w.document.write(html); w.document.close();
}

// ─────────────────────────────────────────────
// BACKUP & IMPORT
// ─────────────────────────────────────────────
async function exportItems() {
  const allItems=await DB.getItems();
  const data={type:'swc_items_backup',version:2,exported_at:new Date().toISOString(),count:allItems.length,
    items:allItems.map(i=>({item_id:i.item_id,item_name:i.item_name,description:i.description||'',
      dry_clean_price:i.dry_clean_price||0,wash_press_price:i.wash_press_price||0,wash_dry_price:i.wash_dry_price||0}))};
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  a.download=`swc_items_${new Date().toISOString().slice(0,10)}.json`; a.click();
  toast(`Exported ${allItems.length} items`,'success');
}

async function importItems(input) {
  if(!requireAdmin()) return;
  const file=input.files[0]; if(!file) return; input.value='';
  try {
    const data=JSON.parse(await file.text());
    if(data.type!=='swc_items_backup') return toast('Invalid backup file','error');
    const records=data.items||[];
    if(!records.length) return toast('No items found in file','warning');
    confirmDialog(`Import ${records.length} items? Existing items (matched by Item ID) will be updated.`, async()=>{
      const existing=await DB.getItems();
      const map=Object.fromEntries(existing.map(i=>[i.item_id,i]));
      let added=0,updated=0,errors=0;
      for(const rec of records){
        try {
          const p={item_name:rec.item_name,description:rec.description||'',
            dry_clean_price:rec.dry_clean_price||0,wash_press_price:rec.wash_press_price||0,wash_dry_price:rec.wash_dry_price||0};
          if(map[rec.item_id]){await DB.updateItem(map[rec.item_id].id,p);updated++;}
          else{await DB.addItem({item_id:rec.item_id,...p});added++;}
        }catch(e){errors++;console.error(e);}
      }
      renderItems();
      toast(`Import done: ${added} added, ${updated} updated`+(errors?`, ${errors} failed`:''),'success');
    });
  }catch(e){toast('Failed to read file: '+(e.message||e),'error');}
}

// ─────────────────────────────────────────────
// CUSTOMER QUOTATION GENERATOR
// ─────────────────────────────────────────────

const QUOTATION_ITEM_ORDER = [
  "Bed Sheet (L)",
  "Bed Sheet (S)",
  "Duvet Cover (L)",
  "Duvet Cover (S)",
  "Bed Cover (L)",
  "Bed Cover (S)",
  "Bed Runner",
  "Pillow Case",
  "Blanket",
  "Matress Protector (L)",
  "Matress Protector (S)",
  "Bath Mat",
  "Bath Robe",
  "Bath Towel",
  "Hand Towel",
  "Face Towel",
  "Pool Towel",
  "Mosquito Net (L)",
  "Mosquito Net (S)",
  "Curtain (1kg)",
  "Curtain - Lase (1kg)",
  "Floor Mat",
  "Shower Curtain",
  "Serviette",
  "Table Mat",
  "Table Cloth(L)",
  "Table Cloth(S)",
  "Tray Cloth",
  "Glass Cloth",
  "Chair Cover",
  "Chair Bow",
  "Buffet cloth (Frill)",
  "Saree",
  "Jacket",
  "Jacket - Dry clean",
  "Saree (Kandyan)",
  "Shirt",
  "Sarong",
  "Trouser",
  "Short",
  "Blouse",
  "T Shirt",
  "Tie - Dry clean",
  "Cushion Cover (XL)",
  "Cushion Cover (L)",
  "Cushion Cover (M)",
  "Cushion Cover (S)",
  "Duster",
  "Chef Coat",
  "Cook Coat",
  "Apron",
  "Cap",
  "Overall"
];

async function showGenerateQuotationModal() {
  const customers = await DB.getCustomers();
  const sortedCust = customers.sort((a,b)=>(a.hotel_name||'').localeCompare(b.hotel_name||''));
  
  const todayStr = new Date().toISOString().slice(0,10);
  const validUntilStr = new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0,10);
  const defaultQuoteId = 'QT-' + new Date().getFullYear() + String(new Date().getMonth()+1).padStart(2,'0') + String(new Date().getDate()).padStart(2,'0') + '-' + String(Math.floor(Math.random()*900)+100);

  const custOptions = `<option value="">-- Standard Catalog (General Customer) --</option>` +
    sortedCust.map(c => `<option value="${c.id}">${c.hotel_name}${c.contact_person ? ' (' + c.contact_person + ')' : ''}</option>`).join('');

  createModal('gen-quotation-modal', 'Generate Customer Quotation', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="form-group" style="grid-column:1/-1;">
        <label class="form-label">Select Customer *</label>
        <select class="form-input" id="gq-customer-id">
          ${custOptions}
        </select>
        <span style="font-size:0.8em;color:var(--text-muted);margin-top:4px;display:block;">If the customer has a specific price list configured, custom prices will be used.</span>
      </div>
      <div class="form-group">
        <label class="form-label">Quote ID *</label>
        <input class="form-input" id="gq-quote-id" value="${defaultQuoteId}"/>
      </div>
      <div class="form-group">
        <label class="form-label">Date *</label>
        <input type="date" class="form-input" id="gq-date" value="${todayStr}"/>
      </div>
      <div class="form-group" style="grid-column:1/-1;">
        <label class="form-label">Valid Until *</label>
        <input type="date" class="form-input" id="gq-valid-until" value="${validUntilStr}"/>
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;padding-top:14px;border-top:1px solid var(--border);">
      <button class="btn btn-secondary" onclick="hideModal('gen-quotation-modal')">Cancel</button>
      <button class="btn btn-primary" onclick="processGenerateQuotation()"><i class="fas fa-file-invoice"></i> Generate &amp; Preview</button>
    </div>
  `, 'modal-md');
  showModal('gen-quotation-modal');
}

async function processGenerateQuotation() {
  const custId = document.getElementById('gq-customer-id').value;
  const quoteId = document.getElementById('gq-quote-id').value.trim() || 'QT-001';
  const rawDate = document.getElementById('gq-date').value;
  const rawValidUntil = document.getElementById('gq-valid-until').value;

  const quoteDate = formatDate(rawDate);
  const validUntil = formatDate(rawValidUntil);

  let customer = null;
  if (custId) {
    customer = await DB.getCustomer(custId);
  }

  hideModal('gen-quotation-modal');
  await renderQuotationView(customer, quoteId, quoteDate, validUntil);
}

async function renderQuotationView(customer, quoteId, quoteDate, validUntil) {
  const [allItems, companyName, logoData, address, phone, email] = await Promise.all([
    DB.getItems(),
    DB.getSetting('company_name'),
    DB.getSetting('logo_data'),
    DB.getSetting('address'),
    DB.getSetting('phone'),
    DB.getSetting('email')
  ]);

  const company = companyName || 'Sagacious Washing Center';
  const logoHTML = logoData
    ? `<img src="${logoData}" style="height:56px;width:auto;object-fit:contain;border-radius:8px;"/>`
    : `<div style="height:56px;width:56px;border-radius:8px;background:linear-gradient(135deg,#00b4d8,#1a4d8f);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.4em;font-weight:700;">SW</div>`;

  const customPrices = customer?.custom_prices || {};

  const normalize = name => (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const catalogMap = {};
  allItems.forEach(item => {
    catalogMap[normalize(item.item_name)] = item;
  });

  const resolvedItems = QUOTATION_ITEM_ORDER.map(reqName => {
    const normReq = normalize(reqName);
    let match = catalogMap[normReq];

    if (!match) {
      match = allItems.find(i => {
        const normItem = normalize(i.item_name);
        return normItem.includes(normReq) || normReq.includes(normItem);
      });
    }

    let resolvedPrice = null;

    if (match) {
      const custPrice = customPrices[match.id];

      let dc = (custPrice && custPrice.dry_clean != null && custPrice.dry_clean !== '') ? parseFloat(custPrice.dry_clean) : (match.dry_clean_price || 0);
      let wp = (custPrice && custPrice.wash_press != null && custPrice.wash_press !== '') ? parseFloat(custPrice.wash_press) : (match.wash_press_price || 0);
      let wd = (custPrice && custPrice.wash_dry != null && custPrice.wash_dry !== '') ? parseFloat(custPrice.wash_dry) : (match.wash_dry_price || 0);

      const nameLower = reqName.toLowerCase();
      if (nameLower.includes('dry clean') || nameLower.includes('dry-clean')) {
        resolvedPrice = dc || wp || wd || 0;
      } else {
        resolvedPrice = wp || dc || wd || 0;
      }
    }

    return {
      name: reqName,
      price: resolvedPrice
    };
  });

  const rowsHTML = resolvedItems.map((item, idx) => `
    <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding:7px 12px;border-bottom:1px solid #e2e8f0;font-size:0.88em;font-weight:600;color:#1e293b;">${item.name}</td>
      <td style="padding:7px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:0.88em;font-weight:700;color:#1a4d8f;">${item.price !== null && item.price > 0 ? formatCurrency(item.price) : '—'}</td>
    </tr>
  `).join('');

  const customerName = customer ? customer.hotel_name : '';

  const quotationHTML = `
    <div id="quotation-print-area" style="position:relative;font-family:'DM Sans',sans-serif;background:#fff;color:#1e293b;max-width:780px;margin:0 auto;padding:36px 40px;border-radius:4px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      
      <!-- LETTERHEAD -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:18px;border-bottom:2px solid #1a4d8f;">
        <div style="display:flex;align-items:center;gap:14px;">
          ${logoHTML}
          <div>
            <div style="font-family:'Playfair Display',serif;font-size:1.55em;font-weight:700;color:#1a4d8f;line-height:1.2;">${company}</div>
            ${address ? `<div style="font-size:0.82em;color:#64748b;margin-top:4px;">${address}</div>` : ''}
            <div style="font-size:0.82em;color:#64748b;margin-top:2px;">${[phone, email].filter(Boolean).join(' | ')}</div>
          </div>
        </div>
      </div>

      <!-- DOCUMENT TITLE -->
      <div style="text-align:center;margin-bottom:24px;">
        <h2 style="font-family:'Playfair Display',serif;font-size:1.6em;font-weight:800;color:#1a4d8f;letter-spacing:1px;text-transform:uppercase;margin:0;">Service Quotation</h2>
      </div>

      <!-- HEADER SECTION -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:24px;display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:0.9em;">
        <div>
          <div style="margin-bottom:6px;"><strong style="color:#64748b;display:inline-block;width:130px;">Customer Name :</strong> <span style="font-weight:700;color:#1e293b;">${customerName}</span></div>
          <div><strong style="color:#64748b;display:inline-block;width:130px;">Date :</strong> <span style="font-weight:600;color:#1e293b;">${quoteDate}</span></div>
        </div>
        <div>
          <div style="margin-bottom:6px;"><strong style="color:#64748b;display:inline-block;width:110px;">Quote ID :</strong> <span style="font-weight:700;color:#1a4d8f;font-family:monospace;letter-spacing:0.5px;">${quoteId}</span></div>
          <div><strong style="color:#64748b;display:inline-block;width:110px;">Valid Until :</strong> <span style="font-weight:600;color:#1e293b;">${validUntil}</span></div>
        </div>
      </div>

      <!-- PRICING TABLE -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
        <thead>
          <tr style="background:#1a4d8f;color:#fff;">
            <th style="padding:10px 12px;text-align:left;font-size:0.82em;text-transform:uppercase;letter-spacing:0.8px;">Item</th>
            <th style="padding:10px 12px;text-align:right;font-size:0.82em;text-transform:uppercase;letter-spacing:0.8px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>

      <!-- FOOTER NOTES -->
      <div style="background:#f1f5f9;border-left:4px solid #1a4d8f;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:24px;font-size:0.86em;color:#334155;line-height:1.6;">
        <div style="font-weight:700;margin-bottom:4px;color:#1e293b;text-transform:uppercase;font-size:0.8em;letter-spacing:0.5px;">Notes &amp; Terms:</div>
        <ul style="margin:0;padding-left:18px;">
          <li>Free pick-up and delivery for orders exceeding Rs 3,000.00</li>
          <li>For pricing queries or custom arrangements, please contact us at ${phone || email || 'our office'}.</li>
        </ul>
      </div>

      <!-- CLOSING LINE -->
      <div style="text-align:center;font-family:'Playfair Display',serif;font-size:1.05em;font-weight:700;color:#1a4d8f;margin-top:20px;padding-top:14px;border-top:1px solid #e2e8f0;">
        Thank You for choosing ${company}!
      </div>
    </div>
  `;

  createModal('view-quotation-modal', `Service Quotation — ${quoteId}`, `
    ${quotationHTML}
    <div class="no-print" style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px;padding-top:14px;border-top:1px solid var(--border);">
      <button class="btn btn-secondary" onclick="hideModal('view-quotation-modal')">Close [Esc]</button>
      <button class="btn btn-primary" onclick="printQuotationView()"><i class="fas fa-print"></i> Print / Export PDF</button>
    </div>`, 'modal-xl');
  showModal('view-quotation-modal');
}

function printQuotationView() {
  const content = document.getElementById('quotation-print-area');
  if (!content) return;
  const printHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Service Quotation</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Playfair+Display:wght@600;700;800&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'DM Sans',sans-serif;color:#1e293b;background:#fff;padding:24px;}
    @media print{
      body{padding:0;}
      @page{margin:10mm 10mm;size:A4;}
    }
  </style></head><body>
  ${content.outerHTML}
  <script>window.onload=()=>window.print();<\/script>
  </body></html>`;

  const w = window.open('', '_blank');
  if (!w) return toast('Please allow pop-ups to print PDF', 'warning');
  w.document.write(printHTML);
  w.document.close();
}

