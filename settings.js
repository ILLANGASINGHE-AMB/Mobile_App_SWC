// settings.js - Settings Module

async function renderSettings() {
  document.getElementById('page-title').textContent = 'Settings';
  const [companyName, address, phone, email, invPrefix, footer, darkMode, textSize, minDiscountAmt, deliveryCharge, showUndo] = await Promise.all([
    DB.getSetting('company_name'), DB.getSetting('address'), DB.getSetting('phone'),
    DB.getSetting('email'), DB.getSetting('invoice_prefix'),
    DB.getSetting('footer_message'), DB.getSetting('dark_mode'), DB.getSetting('text_size'),
    DB.getSetting('min_discount_amount'), DB.getSetting('delivery_charge'),
    DB.getSetting('show_undo_button')
  ]);
  const isUndoVisible = showUndo !== 'false';

  // Staff & Driver view Appearance settings
  if (!isAdmin()) {
    document.getElementById('content').innerHTML = `
      <div class="section-header" style="margin-bottom:14px;">
        <span class="section-title">Settings</span>
      </div>
      <div style="max-width:600px;margin:0 auto;">
        <!-- Appearance -->
        <div class="card">
          <div style="font-family:'Playfair Display',serif;font-weight:700;margin-bottom:16px;font-size:1.05em;display:flex;align-items:center;gap:8px;">
            <i class="fas fa-palette" style="color:var(--primary);"></i>Appearance
          </div>
          <div class="form-group">
            <label class="form-label">Text Size</label>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:4px;">
              ${['sm','md','lg','xl'].map(s => `<button class="btn ${textSize===s?'btn-primary':'btn-secondary'}" onclick="setTextSize('${s}')" id="ts-${s}">${{sm:'Small',md:'Medium',lg:'Large',xl:'XL'}[s]}</button>`).join('')}
            </div>
          </div>
          <div class="form-group" style="margin-top:14px;display:flex;align-items:center;justify-content:space-between;background:var(--bg);padding:10px 14px;border-radius:10px;border:1px solid var(--border);">
            <label class="form-label" style="margin:0;">Dark Mode</label>
            <div style="display:flex;align-items:center;gap:10px;">
              <span id="dark-mode-label" style="font-size:0.85em;color:var(--text-muted);">${darkMode==='true'?'Dark Mode':'Light Mode'}</span>
              <label class="toggle">
                <input type="checkbox" id="dark-toggle" ${darkMode==='true'?'checked':''} onchange="toggleDarkFromSettings(this.checked)"/>
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>`;
    return;
  }

  // Admin Settings — Optimized for mobile view
  document.getElementById('content').innerHTML = `
    <div class="section-header" style="margin-bottom:14px;">
      <span class="section-title">Settings</span>
    </div>
    <div style="max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:16px;">

      <!-- Company Info -->
      <div class="card">
        <div style="font-family:'Playfair Display',serif;font-weight:700;margin-bottom:16px;font-size:1.05em;display:flex;align-items:center;gap:8px;">
          <i class="fas fa-building" style="color:var(--primary);"></i>Company Information
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-bottom:16px;">
          <div class="form-group" style="margin:0;"><label class="form-label">Company Name</label>
            <input class="form-input" id="s-company" value="${companyName||''}"/></div>
          <div class="form-group" style="margin:0;"><label class="form-label">Phone</label>
            <input class="form-input" id="s-phone" value="${phone||''}"/></div>
          <div class="form-group" style="grid-column:1/-1;margin:0;"><label class="form-label">Address</label>
            <input class="form-input" id="s-address" value="${address||''}"/></div>
          <div class="form-group" style="margin:0;"><label class="form-label">Email</label>
            <input class="form-input" id="s-email" value="${email||''}"/></div>
          <div class="form-group" style="margin:0;"><label class="form-label">Invoice Prefix</label>
            <input class="form-input" id="s-prefix" value="${invPrefix||'INV'}"/></div>
          <div class="form-group" style="grid-column:1/-1;margin:0;"><label class="form-label">Invoice Footer Message</label>
            <input class="form-input" id="s-footer" value="${footer||''}"/></div>
        </div>
        <button class="btn btn-primary" onclick="saveCompanySettings()" style="width:100%;justify-content:center;"><i class="fas fa-save"></i> Save Company Info</button>
      </div>

      <!-- Billing Settings -->
      <div class="card">
        <div style="font-family:'Playfair Display',serif;font-weight:700;margin-bottom:16px;font-size:1.05em;display:flex;align-items:center;gap:8px;">
          <i class="fas fa-sliders-h" style="color:var(--primary);"></i>Billing Settings
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-bottom:16px;">
          <div class="form-group" style="margin:0;">
            <label class="form-label">Min. Order Amount for Discount (LKR)</label>
            <input type="number" class="form-input" id="s-min-discount" value="${minDiscountAmt||'30000'}" min="0" step="100"/>
            <span style="font-size:0.76em;color:var(--text-muted);display:block;margin-top:2px;">Discount option appears on bills &ge; this amount</span>
          </div>
          <div class="form-group" style="margin:0;">
            <label class="form-label">Default Delivery Charge (LKR)</label>
            <input type="number" class="form-input" id="s-delivery-charge" value="${deliveryCharge||'0'}" min="0" step="0.01"/>
            <span style="font-size:0.76em;color:var(--text-muted);display:block;margin-top:2px;">Pre-filled in invoice generator</span>
          </div>
        </div>
        <button class="btn btn-primary" onclick="saveBillingSettings()" style="width:100%;justify-content:center;"><i class="fas fa-save"></i> Save Billing Settings</button>
      </div>

      <!-- Appearance -->
      <div class="card">
        <div style="font-family:'Playfair Display',serif;font-weight:700;margin-bottom:16px;font-size:1.05em;display:flex;align-items:center;gap:8px;">
          <i class="fas fa-palette" style="color:var(--primary);"></i>Appearance
        </div>
        <div class="form-group">
          <label class="form-label">Text Size</label>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:4px;">
            ${['sm','md','lg','xl'].map(s => `<button class="btn ${textSize===s?'btn-primary':'btn-secondary'}" onclick="setTextSize('${s}')" id="ts-${s}">${{sm:'Small',md:'Medium',lg:'Large',xl:'XL'}[s]}</button>`).join('')}
          </div>
        </div>
        <div class="form-group" style="margin-top:14px;display:flex;align-items:center;justify-content:space-between;background:var(--bg);padding:10px 14px;border-radius:10px;border:1px solid var(--border);">
          <label class="form-label" style="margin:0;">Dark Mode</label>
          <div style="display:flex;align-items:center;gap:10px;">
            <span id="dark-mode-label" style="font-size:0.85em;color:var(--text-muted);">${darkMode==='true'?'Dark Mode':'Light Mode'}</span>
            <label class="toggle">
              <input type="checkbox" id="dark-toggle" ${darkMode==='true'?'checked':''} onchange="toggleDarkFromSettings(this.checked)"/>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div class="form-group" style="margin-top:10px;display:flex;align-items:center;justify-content:space-between;background:var(--bg);padding:10px 14px;border-radius:10px;border:1px solid var(--border);">
          <label class="form-label" style="margin:0;">Show Undo Payment Button</label>
          <div style="display:flex;align-items:center;gap:10px;">
            <span id="undo-toggle-label" style="font-size:0.85em;color:var(--text-muted);">${isUndoVisible?'Visible':'Hidden'}</span>
            <label class="toggle">
              <input type="checkbox" id="undo-toggle" ${isUndoVisible?'checked':''} onchange="toggleUndoFromSettings(this.checked)"/>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- About System -->
      <div class="card">
        <div style="font-family:'Playfair Display',serif;font-weight:700;margin-bottom:14px;font-size:1.05em;display:flex;align-items:center;gap:8px;">
          <i class="fas fa-info-circle" style="color:var(--primary);"></i>About System
        </div>
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#00b4d8,#1a4d8f);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.6em;flex-shrink:0;">
            <i class="fas fa-soap"></i>
          </div>
          <div>
            <div style="font-family:'Playfair Display',serif;font-size:1.2em;font-weight:700;">Sagacious Washing Center</div>
            <div style="color:var(--text-muted);font-size:0.84em;margin-top:2px;">POS &amp; Management System v2.0</div>
          </div>
        </div>
      </div>

    </div>`;
}

// ─────────────────────────────────────────────
// USERS TABLE
// ─────────────────────────────────────────────
async function loadUsersTable() {
  const users = await DB.getUsers();
  const el = document.getElementById('users-section');
  if (!el) return;
  el.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Username</th><th>Display Name</th><th>Role</th><th>Actions</th></tr></thead>
        <tbody>
          ${users.map(u => `<tr>
            <td><strong>${u.username}</strong></td>
            <td>${u.display_name || '—'}</td>
            <td>
              <span class="badge ${u.role==='admin'?'badge-yellow':'badge-blue'}" style="text-transform:capitalize;">
                ${u.role==='admin'?'<i class="fas fa-crown" style="font-size:0.85em;margin-right:3px;"></i>':''} ${u.role}
              </span>
            </td>
            <td><div style="display:flex;gap:6px;">
              <button class="btn btn-primary btn-sm" onclick="showEditUserModal(${u.id})"><i class="fas fa-edit"></i></button>
              ${u.username !== currentUser?.username
                ? `<button class="btn btn-danger btn-sm" onclick="deleteUserConfirm(${u.id},'${u.username}')"><i class="fas fa-trash"></i></button>`
                : `<button class="btn btn-secondary btn-sm" disabled title="Cannot delete current user"><i class="fas fa-lock"></i></button>`}
            </div></td>
          </tr>`).join('') || `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:20px;">No users</td></tr>`}
        </tbody>
      </table>
    </div>`;
}

function showAddUserModal() {
  createModal('add-user-modal', 'Add User', `
    <div class="form-group"><label class="form-label">Username *</label>
      <input class="form-input" id="u-username" placeholder="e.g. john"/></div>
    <div class="form-group"><label class="form-label">Display Name</label>
      <input class="form-input" id="u-display" placeholder="e.g. John Silva"/></div>
    <div class="form-group"><label class="form-label">Password *</label>
      <input type="password" class="form-input" id="u-pass" placeholder="Set password"/></div>
    <div class="form-group"><label class="form-label">Role</label>
      <select class="form-input form-select" id="u-role">
        <option value="user">User — Standard access</option>
        <option value="admin">Admin — Full access</option>
      </select></div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
      <button class="btn btn-secondary" onclick="hideModal('add-user-modal')">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewUser()"><i class="fas fa-save"></i> Save User</button>
    </div>`);
  showModal('add-user-modal');
}

async function saveNewUser() {
  const username     = document.getElementById('u-username').value.trim().toLowerCase();
  const display_name = document.getElementById('u-display').value.trim();
  const password     = document.getElementById('u-pass').value;
  const role         = document.getElementById('u-role').value;
  if (!username) return toast('Username required', 'error');
  if (!password) return toast('Password required', 'error');
  const existing = await DB.getUserByUsername(username);
  if (existing) return toast(`Username "${username}" already taken`, 'error');
  await DB.addUser({ username, display_name: display_name || username, password, role });
  await DB.logAction('User Added', `Added system user "${username}" (Role: ${role})`, { username, role, display_name }, 'User');
  hideModal('add-user-modal');
  toast('User added!');
  loadUsersTable();
}

async function showEditUserModal(id) {
  const u = await DB.getUser(id); if (!u) return;
  createModal('edit-user-modal', `Edit User: ${u.username}`, `
    <div class="form-group"><label class="form-label">Username *</label>
      <input class="form-input" id="eu-username" value="${u.username||''}"/></div>
    <div class="form-group"><label class="form-label">Display Name</label>
      <input class="form-input" id="eu-display" value="${u.display_name||''}"/></div>
    <div class="form-group"><label class="form-label">New Password <span style="color:var(--text-muted);font-weight:400;">(leave blank to keep)</span></label>
      <input type="password" class="form-input" id="eu-pass" placeholder="Enter new password or leave blank"/></div>
    <div class="form-group"><label class="form-label">Role</label>
      <select class="form-input form-select" id="eu-role">
        <option value="user"  ${u.role==='user' ?'selected':''}>User — Standard access</option>
        <option value="admin" ${u.role==='admin'?'selected':''}>Admin — Full access</option>
      </select></div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
      <button class="btn btn-secondary" onclick="hideModal('edit-user-modal')">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditUser(${id})"><i class="fas fa-save"></i> Save</button>
    </div>`);
  showModal('edit-user-modal');
}

async function saveEditUser(id) {
  const username     = document.getElementById('eu-username').value.trim().toLowerCase();
  const display_name = document.getElementById('eu-display').value.trim();
  const password     = document.getElementById('eu-pass').value;
  const role         = document.getElementById('eu-role').value;
  if (!username) return toast('Username required', 'error');

  const existing = await DB.getUserByUsername(username);
  if (existing && String(existing.id) !== String(id)) return toast(`Username "${username}" already taken`, 'error');

  const updateData = { username, display_name: display_name || username, role };
  if (password) updateData.password = password;
  await DB.updateUser(id, updateData);
  await DB.logAction('User Updated', `Updated system user "${username}"`, { username, role }, 'User');
  
  // Refresh current user if self
  if (currentUser && currentUser.id === id) {
    currentUser.display_name = updateData.display_name;
    currentUser.role = updateData.role;
    updateRoleChip();
  }
  hideModal('edit-user-modal');
  toast('User updated!');
  loadUsersTable();
}

async function deleteUserConfirm(id, username) {
  confirmDialog(`Delete user "${username}"?`, async () => {
    await DB.deleteUser(id);
    await DB.logAction('User Deleted', `Deleted system user "${username}"`, { username }, 'User');
    toast('User deleted');
    loadUsersTable();
  });
}

// ─────────────────────────────────────────────
// COMPANY / APPEARANCE / LOGO
// ─────────────────────────────────────────────
async function saveBillingSettings() {
  const minDisc = document.getElementById('s-min-discount')?.value;
  const delivery = document.getElementById('s-delivery-charge')?.value;
  if(minDisc!==undefined) await DB.setSetting('min_discount_amount', minDisc);
  if(delivery!==undefined) await DB.setSetting('delivery_charge', delivery);
  toast('Billing settings saved!');
}

async function saveGeminiSettings() {
  const geminiKey = document.getElementById('s-gemini-key')?.value.trim();
  if (geminiKey !== undefined) {
    await DB.setSetting('gemini_api_key', geminiKey);
  }
  await DB.setSetting('ai_provider', 'gemini');
  await DB.logAction('Settings Updated', 'Updated Gemini AI settings', {}, 'System');
  toast('Gemini settings saved!');
}

async function saveCompanySettings() {
  const fields = { company_name:'s-company', address:'s-address', phone:'s-phone', email:'s-email', invoice_prefix:'s-prefix', footer_message:'s-footer' };
  for (const [key, id] of Object.entries(fields)) {
    const el = document.getElementById(id);
    if (el) await DB.setSetting(key, el.value);
  }
  const name = document.getElementById('s-company')?.value || 'Sagacious Washing Center';
  const sn = document.getElementById('sidebar-company-name');
  if (sn) sn.innerHTML = name.replace(' ', '<br/>');
  await DB.logAction('Settings Updated', 'Updated company profile settings', { company_name: name }, 'System');
  toast('Company settings saved!');
}

function setTextSize(size) {
  const map = { sm:'text-sm-ui', md:'text-md-ui', lg:'text-lg-ui', xl:'text-xl-ui' };
  ['sm','md','lg','xl'].forEach(s => {
    document.body.classList.remove(map[s]);
    const btn = document.getElementById(`ts-${s}`);
    if (btn) btn.className = btn.className.replace('btn-primary','btn-secondary');
  });
  document.body.classList.add(map[size]);
  const active = document.getElementById(`ts-${size}`);
  if (active) active.className = active.className.replace('btn-secondary','btn-primary');
  DB.setSetting('text_size', size);
  toast('Text size updated');
}

function toggleDarkFromSettings(checked) {
  if (checked) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
  DB.setSetting('dark_mode', checked ? 'true' : 'false');
  const label = document.getElementById('dark-mode-label');
  if (label) label.textContent = checked ? 'Dark Mode' : 'Light Mode';
  const icon = document.getElementById('dark-icon');
  if (icon) icon.className = checked ? 'fas fa-sun' : 'fas fa-moon';
}

async function handleLogoUpload(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    await DB.setSetting('logo_data', e.target.result);
    updateLogo(e.target.result);
    toast('Logo uploaded!'); renderSettings();
  };
  reader.readAsDataURL(file);
}

function updateLogo(dataURL) {
  const el = document.getElementById('sidebar-logo-img');
  if (el) el.innerHTML = `<img src="${dataURL}" style="width:40px;height:40px;border-radius:10px;object-fit:cover;"/>`;
}

async function removeLogo() {
  await DB.setSetting('logo_data', null);
  const el = document.getElementById('sidebar-logo-img');
  if (el) el.innerHTML = '<i class="fas fa-soap"></i>';
  toast('Logo removed'); renderSettings();
}

// ─────────────────────────────────────────────
// DATABASE
// ─────────────────────────────────────────────
async function exportDatabase() {
  const data = await DB.exportAll();
  downloadJSON(data, 'sagacious_washing_backup.json');
  toast('Database exported!');
}

async function importDatabase(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      confirmDialog('This will replace ALL existing data. Continue?', async () => {
        await DB.importAll(data);
        toast('Database restored!');
        navigate('dashboard');
      });
    } catch { toast('Invalid backup file', 'error'); }
  };
  reader.readAsText(file);
}

async function uploadToCloud() {
  const data = await DB.exportAll();
  const endpoint = prompt('Enter cloud endpoint URL:', 'https://your-server.com/upload-database');
  if (!endpoint) return;
  try {
    const res = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
    if (res.ok) toast('Database uploaded to cloud!'); else toast('Upload failed: '+res.statusText,'error');
  } catch(err) { toast('Upload failed: '+err.message,'error'); }
}

async function importFromCloud() {
  const endpoint = prompt('Enter cloud database URL:', 'https://your-server.com/database.json');
  if (!endpoint) return;
  try {
    const res = await fetch(endpoint); if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    confirmDialog('This will replace ALL existing data. Continue?', async () => {
      await DB.importAll(data); toast('Database imported from cloud!'); navigate('dashboard');
    });
  } catch(err) { toast('Import failed: '+err.message,'error'); }
}

// Admin-only reset
async function resetDatabase() {
  if (!requireAdmin()) return;
  confirmDialog('⚠️ DELETE ALL DATA permanently — are you absolutely sure?', async () => {
    await DB.importAll({});
    await DB.seedDemoData();
    toast('Database reset complete', 'info');
    navigate('dashboard');
  });
}

async function toggleUndoFromSettings(checked) {
  const val = checked ? 'true' : 'false';
  await DB.setSetting('show_undo_button', val);
  showUndoButtonSetting = val;
  const label = document.getElementById('undo-toggle-label');
  if (label) label.textContent = checked ? 'Visible' : 'Hidden';
  toast('Undo button visibility updated');
}

async function toggleAIFabFromSettings(checked) {
  const val = checked ? 'true' : 'false';
  await DB.setSetting('show_saga_ai_button', val);
  document.querySelectorAll('.ai-fab-toggle-label').forEach(el => el.textContent = checked ? 'Visible' : 'Hidden');
  document.querySelectorAll('.ai-fab-toggle').forEach(el => el.checked = checked);
  const fab = document.getElementById('gemini-fab');
  if (fab) fab.style.display = checked ? 'flex' : 'none';
  if (!checked) {
    const drawer = document.getElementById('gemini-drawer');
    if (drawer && drawer.classList.contains('open')) {
      drawer.classList.remove('open');
    }
  }
  toast(`SAGA AI floating button ${checked ? 'shown' : 'hidden'}`);
}
