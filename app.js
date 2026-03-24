const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [], history: [], bank: { name: '', sort: '', acc: '' } }; 
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.bank) db.bank = { name: '', sort: '', acc: '' };

    // Bank Detail Loader
    const bN = document.getElementById('bankName'), bS = document.getElementById('bankSort'), bA = document.getElementById('bankAcc');
    if(bN) bN.value = db.bank.name || "";
    if(bS) bS.value = db.bank.sort || "";
    if(bA) bA.value = db.bank.acc || "";

    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    updateThemeIcon(isDark);
    
    updateGreeting();
    renderAll();
};

window.toggleDarkMode = () => {
    const isDark = !document.body.classList.contains('dark-mode');
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    localStorage.setItem('Hydro_Dark_Pref', isDark);
    updateThemeIcon(isDark);
};

const updateThemeIcon = (isDark) => {
    const btn = document.getElementById('themeToggleBtn');
    if(btn) btn.innerText = isDark ? '☀️ Light' : '🌙 Dark';
};

window.renderStats = () => {
    const monthYear = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const el = document.getElementById('statsMonthLabel');
    if (el) el.innerText = `${monthYear} Summary`;

    let target = 0, paid = 0, arrears = 0, spend = 0;
    db.customers.forEach(c => {
        target += n(c.price); paid += n(c.paidThisMonth);
        if (c.cleaned && n(c.paidThisMonth) < n(c.price)) arrears += (n(c.price) - n(c.paidThisMonth));
    });
    db.expenses.forEach(e => spend += n(e.amt));

    const profit = paid - spend;
    const progress = target > 0 ? (paid / target) * 100 : 0;

    const map = { 'currProfit': `£${profit.toFixed(2)}`, 'statsIncome': `£${paid.toFixed(2)}`, 'statsSpend': `£${spend.toFixed(2)}`, 'statsArrears': `£${arrears.toFixed(2)}`, 'statsTarget': `£${target.toFixed(2)}`, 'statsRemaining': `£${(target - paid).toFixed(2)}`, 'progressPercent': `${Math.round(progress)}%` };
    for (let [id, val] of Object.entries(map)) { const el = document.getElementById(id); if(el) el.innerText = val; }
    const bar = document.getElementById('progressBarFill'); if(bar) bar.style.width = `${progress}%`;
};

window.renderMasterTable = () => {
    const body = document.getElementById('masterTableBody'); if(!body) return; body.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const tile = document.createElement('div'); tile.className = 'customer-pill-bubble';
            tile.onclick = () => showActionModal(c.id);
            tile.innerHTML = `<div><strong style="display:block; font-size:22px;">${c.name}</strong><small style="color:var(--accent); font-weight:700; font-size:16px;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success); font-size:20px;">£${n(c.price).toFixed(2)}</div>`;
            body.appendChild(tile);
        }
    });
};

// FULL RENDER & UTILS (LOCKED)
window.renderAll = () => { renderMasterTable(); renderStats(); if(window.renderWeekLists) renderWeekLists(); if(window.renderLedger) renderLedger(); };
window.openTab = (name) => { closeModal(); document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active")); const t = document.getElementById(name); if(t) t.classList.add("active"); const nav = document.getElementById('globalNav'); if (name === 'home' || (name.startsWith('week') && name !== 'weeksHub')) nav.classList.add('hidden'); else nav.classList.remove('hidden'); window.scrollTo({ top: 0, behavior: 'instant' }); renderAll(); };
window.showActionModal = (id) => { const c = db.customers.find(x => x.id === id); if(!c) return; document.getElementById('modalCustomerName').innerText = c.name; document.getElementById('modalCustomerAddress').innerText = `${c.houseNum} ${c.street}`; document.getElementById('modalEditBtn').onclick = () => { closeModal(); editCust(c.id); }; document.getElementById('actionModal').classList.remove('hidden'); };
window.closeModal = () => document.getElementById('actionModal').classList.add('hidden');
window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
