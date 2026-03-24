const DB_KEY = 'HydroPro_V25_Master';
let db = { customers: [], expenses: [], history: [], bank: { name: '', sort: '', acc: '' } };

window.onload = () => {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.bank) db.bank = { name: '', sort: '', acc: '' };

    // Initial Theme Load
    const isDark = localStorage.getItem('HP_Theme') === 'true';
    document.body.classList.toggle('dark-mode', isDark);
    document.getElementById('themeToggleBtn').innerText = isDark ? '☀️' : '🌙';

    // Bank Detail Loader
    const bN = document.getElementById('bankName'), bS = document.getElementById('bankSort'), bA = document.getElementById('bankAcc');
    if(bN) bN.value = db.bank.name; if(bA) bA.value = db.bank.acc;
    if(bS) {
        bS.value = db.bank.sort;
        bS.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, ''); if (val.length > 6) val = val.substring(0, 6);
            e.target.value = val.match(/.{1,2}/g)?.join('-') || val;
        });
    }

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

/* --- FENCE: SETUP LOGIC --- */

window.toggleBankLock = () => {
    const fields = document.querySelectorAll('.bank-field');
    const lockBtn = document.getElementById('bankLockBtn');
    const saveBtn = document.getElementById('bankSaveBtn');
    const isLocked = fields[0].readOnly;
    fields.forEach(f => f.readOnly = !isLocked);
    lockBtn.innerText = isLocked ? "🔒 LOCK" : "🔓 UNLOCK";
    saveBtn.classList.toggle('hidden', !isLocked);
};

window.saveBankDetails = () => {
    db.bank = {
        name: document.getElementById('bankName').value,
        sort: document.getElementById('bankSort').value,
        acc: document.getElementById('bankAcc').value
    };
    saveData(); toggleBankLock(); alert("Bank Details Locked! 🏦");
};

window.saveCustomer = () => {
    const name = document.getElementById('cName').value;
    if(!name) return alert("Name is required!");
    const id = document.getElementById('editId').value || Date.now().toString();
    const entry = {
        id, name,
        phone: document.getElementById('cPhone').value,
        houseNum: document.getElementById('cHouseNum').value,
        street: document.getElementById('cStreet').value,
        postcode: document.getElementById('cPostcode').value.toUpperCase(),
        price: parseFloat(document.getElementById('cPrice').value) || 0,
        notes: document.getElementById('cNotes').value,
        week: "1", cleaned: false, paidThisMonth: 0
    };
    const idx = db.customers.findIndex(c => c.id === id);
    if(idx > -1) db.customers[idx] = {...db.customers[idx], ...entry}; 
    else db.customers.push(entry);
    saveData(); alert("Saved! ✨"); openTab('fence-home');
};

/* --- FENCE: STATS RENDERER --- */

window.renderStatsFence = () => {
    const container = document.getElementById('stats-dashboard-container');
    if (!container) return;
    let target = 0, paid = 0, arrears = 0, spend = 0;
    db.customers.forEach(c => {
        target += (parseFloat(c.price) || 0);
        paid += (parseFloat(c.paidThisMonth) || 0);
        if (c.cleaned && (parseFloat(c.paidThisMonth)||0) < parseFloat(c.price)) {
            arrears += (parseFloat(c.price) - parseFloat(c.paidThisMonth));
        }
    });
    db.expenses.forEach(e => spend += (parseFloat(e.amt) || 0));
    const profit = paid - spend;
    const progress = target > 0 ? Math.round((paid / target) * 100) : 0;
    container.innerHTML = `
        <div class="stats-hero"><small style="font-weight:700; opacity:0.6;">Summary</small><span class="main-amt">£${profit.toFixed(2)}</span><small style="font-weight:600; opacity:0.7">💰 Total Profit in Pocket</small></div>
        <div class="progress-bubble"><strong style="font-size:18px;">Monthly Progress ${progress}%</strong><div class="bar-bg"><div class="bar-fill" style="width:${progress}%"></div></div><div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700; opacity:0.5;"><span>TARGET: £${target.toFixed(2)}</span><span>REMAINING: £${(target - paid).toFixed(2)}</span></div></div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; padding:0 20px 20px;"><div class="progress-bubble" style="margin:0; text-align:center; padding:20px 10px;"><small style="font-size:11px; display:block; margin-bottom:5px;">INCOME 🔍</small><div style="color:var(--success); font-size:24px; font-weight:800">£${paid.toFixed(2)}</div></div><div class="progress-bubble" style="margin:0; text-align:center; padding:20px 10px;"><small style="font-size:11px; display:block; margin-bottom:5px;">SPEND 🔍</small><div style="color:var(--danger); font-size:24px; font-weight:800">£${spend.toFixed(2)}</div></div></div>
        <div class="arrears-bubble">Arrears 🔍 £${arrears.toFixed(2)}</div>
    `;
};

/* --- GLOBAL CORE --- */

window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.renderAll = () => { renderStatsFence(); };
window.updateHeader = () => {
    const dt = new Date();
    document.getElementById('dateText').innerText = dt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
};
