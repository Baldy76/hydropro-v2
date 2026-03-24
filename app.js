const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [], history: [], bank: { name: '', sort: '', acc: '' } }; 
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    updateGreeting();
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    
    // Ensure bank object exists
    if (!db.bank) db.bank = { name: '', sort: '', acc: '' };
    
    // Auto-fill bank fields on load
    document.getElementById('bankName').value = db.bank.name || "";
    document.getElementById('bankSort').value = db.bank.sort || "";
    document.getElementById('bankAcc').value = db.bank.acc || "";

    // Sort Code Formatting Logic
    document.getElementById('bankSort').addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, ''); // Remove non-digits
        if (val.length > 6) val = val.substring(0, 6);
        let formatted = val.match(/.{1,2}/g)?.join('-') || val;
        e.target.value = formatted;
    });

    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    renderAll();
};

// 🏦 BANK VAULT LOGIC
window.toggleBankLock = () => {
    const fields = document.querySelectorAll('.bank-field');
    const lockBtn = document.getElementById('bankLockBtn');
    const saveBtn = document.getElementById('bankSaveBtn');
    const isLocked = fields[0].readOnly;

    if (isLocked) {
        fields.forEach(f => f.readOnly = false);
        lockBtn.innerText = "🔒 Lock";
        saveBtn.classList.remove('hidden');
    } else {
        fields.forEach(f => f.readOnly = true);
        lockBtn.innerText = "🔓 Unlock";
        saveBtn.classList.add('hidden');
    }
};

window.saveBankDetails = () => {
    db.bank = {
        name: document.getElementById('bankName').value,
        sort: document.getElementById('bankSort').value,
        acc: document.getElementById('bankAcc').value
    };
    saveData();
    toggleBankLock(); // Lock after save
    alert("Bank Details Secured! 🏦");
};

window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return;
    const id = document.getElementById('editId').value || Date.now().toString();
    const idx = db.customers.findIndex(x => x.id === id);
    const existing = idx > -1 ? db.customers[idx] : null;
    const entry = {
        id, name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, 
        street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), 
        price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, 
        week: existing ? existing.week : "1", cleaned: existing ? existing.cleaned : false, paidThisMonth: existing ? existing.paidThisMonth : 0
    };
    if(idx > -1) db.customers[idx] = entry; else db.customers.push(entry);
    saveData(); alert("Customer Saved Successfully! ✨");
    ['editId', 'cName', 'cPhone', 'cHouseNum', 'cStreet', 'cPostcode', 'cPrice', 'cNotes'].forEach(f => {
        const el = document.getElementById(f); if(el) el.value = "";
    });
    openTab('home');
};

// PERSISTENCE & RENDER (Baseline Locked)
window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.openTab = (n) => { document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active")); const t = document.getElementById(n); if(t) t.classList.add("active"); const nav = document.getElementById('globalNav'); if (n === 'home' || (n.startsWith('week') && n !== 'weeksHub')) nav.classList.add('hidden'); else nav.classList.remove('hidden'); window.scrollTo({ top: 0, behavior: 'instant' }); renderAll(); };
window.updateGreeting = () => { const hr = new Date().getHours(); const g = (hr < 12) ? "Good Morning" : (hr < 18) ? "Good Afternoon" : "Good Evening"; document.getElementById('greetingMsg').innerText = `${g}, Partner! ☕`; };
window.renderAll = () => { 
    // This calls all previous render functions (Master, Weeks, Stats, Ledger)
    // Make sure your full app.js has those functions included below!
};
