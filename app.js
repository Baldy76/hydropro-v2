const OLD_DB_KEY = 'HydroPro_App_Production';
const NEW_DB_KEY = 'HydroPro_V25_Master';

let db = { customers: [], expenses: [], history: [], bank: { name: '', sort: '', acc: '' } };

window.onload = () => {
    // Data Recovery
    const oldData = localStorage.getItem(OLD_DB_KEY);
    const newData = localStorage.getItem(NEW_DB_KEY);
    if (oldData && !newData) {
        db = JSON.parse(oldData);
        localStorage.setItem(NEW_DB_KEY, JSON.stringify(db));
    } else if (newData) {
        db = JSON.parse(newData);
    }
    if (!db.bank) db.bank = { name: '', sort: '', acc: '' };

    const isDark = localStorage.getItem('HP_Theme') === 'true';
    document.body.classList.toggle('dark-mode', isDark);
    document.getElementById('themeToggleBtn').innerText = isDark ? '☀️' : '🌙';

    updateHeader();
    renderAll();
};

window.toggleDarkMode = () => {
    const isNowDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('HP_Theme', isNowDark);
    document.getElementById('themeToggleBtn').innerText = isNowDark ? '☀️' : '🌙';
};

window.openTab = (fenceId) => {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(fenceId).classList.add('active');
    window.scrollTo(0,0);
    renderAll();
};

window.renderMasterFence = () => {
    const container = document.getElementById('master-list-container');
    if(!container) return;
    container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const tile = document.createElement('div');
            tile.className = 'cust-tile';
            tile.onclick = () => editCust(c.id);
            tile.innerHTML = `<div><strong style="display:block; font-size:22px;">${c.name}</strong><small style="color:var(--accent); font-weight:700;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success); font-size:20px;">£${(parseFloat(c.price) || 0).toFixed(2)}</div>`;
            container.appendChild(tile);
        }
    });
};

window.renderStatsFence = () => {
    const container = document.getElementById('stats-dashboard-container');
    if (!container) return;
    let target = 0, paid = 0, arrears = 0, spend = 0;
    db.customers.forEach(c => {
        target += (parseFloat(c.price) || 0); paid += (parseFloat(c.paidThisMonth) || 0);
        if (c.cleaned && (parseFloat(c.paidThisMonth)||0) < parseFloat(c.price)) arrears += (parseFloat(c.price) - parseFloat(c.paidThisMonth));
    });
    db.expenses.forEach(e => spend += (parseFloat(e.amt) || 0));
    const profit = paid - spend;
    const progress = target > 0 ? Math.round((paid / target) * 100) : 0;
    container.innerHTML = `
        <div class="stats-hero"><span class="main-amt">£${profit.toFixed(2)}</span><small style="font-weight:600; opacity:0.7">💰 Total Profit in Pocket</small></div>
        <div class="progress-bubble"><strong style="font-size:18px;">Monthly Progress ${progress}%</strong><div class="bar-bg"><div class="bar-fill" style="width:${progress}%"></div></div><div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700; opacity:0.5;"><span>TARGET: £${target.toFixed(2)}</span><span>REMAINING: £${(target - paid).toFixed(2)}</span></div></div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; padding:0 20px 20px;"><div class="progress-bubble" style="margin:0; text-align:center; padding:20px 10px;"><small style="font-size:11px; display:block; margin-bottom:5px;">INCOME 🔍</small><div style="color:var(--success); font-size:24px; font-weight:800">£${paid.toFixed(2)}</div></div><div class="progress-bubble" style="margin:0; text-align:center; padding:20px 10px;"><small style="font-size:11px; display:block; margin-bottom:5px;">SPEND 🔍</small><div style="color:var(--danger); font-size:24px; font-weight:800">£${spend.toFixed(2)}</div></div></div>
        <div class="arrears-bubble">Arrears 🔍 £${arrears.toFixed(2)}</div>`;
};

window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return;
    const id = document.getElementById('editId').value || Date.now().toString();
    const entry = { id, name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), price: parseFloat(document.getElementById('cPrice').value) || 0, notes: document.getElementById('cNotes').value, week: "1", cleaned: false, paidThisMonth: 0 };
    const idx = db.customers.findIndex(c => c.id === id);
    if(idx > -1) db.customers[idx] = {...db.customers[idx], ...entry}; else db.customers.push(entry);
    saveData(); alert("Saved!"); openTab('fence-master');
};

window.editCust = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    openTab('fence-setup');
    document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name;
    document.getElementById('cPhone').value = c.phone; document.getElementById('cHouseNum').value = c.houseNum;
    document.getElementById('cStreet').value = c.street; document.getElementById('cPostcode').value = c.postcode;
    document.getElementById('cPrice').value = c.price; document.getElementById('cNotes').value = c.notes;
};

window.saveData = () => localStorage.setItem(NEW_DB_KEY, JSON.stringify(db));
window.renderAll = () => { renderMasterFence(); renderStatsFence(); };
window.updateHeader = () => { document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
window.completeCycle = () => { if(!confirm("Reset month?")) return; db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); saveData(); location.reload(); };
