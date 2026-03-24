const OLD_DB_KEY = 'HydroPro_App_Production';
const NEW_DB_KEY = 'HydroPro_V25_Master';
let db = { customers: [], expenses: [], history: [], bank: { name: '', sort: '', acc: '' } };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    const oldData = localStorage.getItem(OLD_DB_KEY);
    const newData = localStorage.getItem(NEW_DB_KEY);
    if (oldData && !newData) { db = JSON.parse(oldData); localStorage.setItem(NEW_DB_KEY, JSON.stringify(db)); }
    else if (newData) { db = JSON.parse(newData); }
    if (!db.bank) db.bank = { name: '', sort: '', acc: '' };

    const isDark = localStorage.getItem('HP_Theme') === 'true';
    document.body.classList.toggle('dark-mode', isDark);
    document.getElementById('themeToggleBtn').innerText = isDark ? '☀️' : '🌙';

    const bSort = document.getElementById('bankSort');
    if(bSort) {
        bSort.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, ''); if (val.length > 6) val = val.substring(0, 6);
            e.target.value = val.match(/.{1,2}/g)?.join('-') || val;
        });
    }
    updateHeader(); renderAll();
};

window.toggleDarkMode = () => {
    const isNowDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('HP_Theme', isNowDark);
    document.getElementById('themeToggleBtn').innerText = isNowDark ? '☀️' : '🌙';
};

window.openTab = (fenceId) => {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    const target = document.getElementById(fenceId);
    if(target) target.classList.add('active');
    window.scrollTo(0,0); renderAll();
};

/* --- MASTER LIST ROBOT --- */
window.renderMasterFence = () => {
    const container = document.getElementById('master-list-container');
    if(!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const tile = document.createElement('div'); tile.className = 'cust-tile';
            tile.onclick = () => editCust(c.id);
            tile.innerHTML = `<div><strong style="display:block; font-size:22px;">${c.name}</strong><small style="color:var(--accent); font-weight:700;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success); font-size:20px;">£${n(c.price).toFixed(2)}</div>`;
            container.appendChild(tile);
        }
    });
};

/* --- SETUP & BANK ROBOT --- */
window.toggleBankLock = () => {
    const fields = document.querySelectorAll('.bank-field'), lockBtn = document.getElementById('bankLockBtn'), saveBtn = document.getElementById('bankSaveBtn');
    const isLocked = fields[0].readOnly;
    fields.forEach(f => f.readOnly = !isLocked);
    lockBtn.innerText = isLocked ? "🔒 LOCK" : "🔓 UNLOCK";
    saveBtn.classList.toggle('hidden', !isLocked);
};

window.saveBankDetails = () => {
    db.bank = { name: document.getElementById('bankName').value, sort: document.getElementById('bankSort').value, acc: document.getElementById('bankAcc').value };
    saveData(); toggleBankLock(); alert("Bank Details Saved! 🏦");
};

window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return alert("Name is required!");
    const id = document.getElementById('editId').value || Date.now().toString();
    const entry = { id, name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, week: "1", cleaned: false, paidThisMonth: 0 };
    const idx = db.customers.findIndex(c => c.id === id);
    if(idx > -1) db.customers[idx] = {...db.customers[idx], ...entry}; else db.customers.push(entry);
    saveData(); alert("Saved! ✨"); openTab('fence-master');
};

window.editCust = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    openTab('fence-setup');
    document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name;
    document.getElementById('cPhone').value = c.phone; document.getElementById('cHouseNum').value = c.houseNum;
    document.getElementById('cStreet').value = c.street; document.getElementById('cPostcode').value = c.postcode;
    document.getElementById('cPrice').value = c.price; document.getElementById('cNotes').value = c.notes;
};

/* --- LEDGER ROBOT --- */
window.renderLedgerFence = () => {
    const container = document.getElementById('expense-list-container');
    if(!container) return; container.innerHTML = '';
    db.expenses.slice().reverse().forEach(e => {
        const div = document.createElement('div'); div.className = 'expense-tile';
        div.innerHTML = `<div><strong>${e.desc}</strong><br><small>${e.date}</small></div><div style="color:var(--danger); font-weight:900">-£${n(e.amt).toFixed(2)}</div>`;
        container.appendChild(div);
    });
};

window.addExpense = () => {
    const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value);
    if(!d || a <= 0) return;
    db.expenses.push({ id: Date.now(), desc: d, amt: a, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
    saveData(); document.getElementById('expDesc').value = ''; document.getElementById('expAmt').value = ''; renderLedgerFence();
};

window.exportToCSV = (type) => {
    let csv = type === 'income' ? 'Name,Amount\n' : 'Desc,Amount\n';
    if(type === 'income') db.customers.filter(c => n(c.paidThisMonth) > 0).forEach(c => csv += `"${c.name}",${c.paidThisMonth}\n`);
    else db.expenses.forEach(e => csv += `"${e.desc}",${e.amt}\n`);
    const b = new Blob([csv], { type: 'text/csv' }); const u = window.URL.createObjectURL(b);
    const a = document.createElement('a'); a.href = u; a.download = `HydroPro_${type}.csv`; a.click();
};

/* --- GLOBAL CORE --- */
window.saveData = () => localStorage.setItem(NEW_DB_KEY, JSON.stringify(db));
window.renderAll = () => {
    renderMasterFence();
    renderLedgerFence();
    if(db.bank) { 
        document.getElementById('bankName').value = db.bank.name || '';
        document.getElementById('bankSort').value = db.bank.sort || '';
        document.getElementById('bankAcc').value = db.bank.acc || '';
    }
};
window.updateHeader = () => {
    const hr = new Date().getHours(), g = (hr < 12) ? "GOOD MORNING" : (hr < 18) ? "GOOD AFTERNOON" : "GOOD EVENING";
    document.getElementById('greetText').innerText = `${g}, PARTNER! ☕`;
    document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
};
window.completeCycle = () => { if(!confirm("Reset month?")) return; db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); saveData(); location.reload(); };
