const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [], history: [] }; 
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    const dateEl = document.getElementById('headerDate');
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.customers) db.customers = [];
    if (!db.expenses) db.expenses = [];
    if (!db.history) db.history = [];
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    renderAll();
};

window.openTab = (evt, name) => {
    document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    const setupWrapper = document.getElementById('setup-form-wrapper');
    if (setupWrapper) name === 'admin' ? setupWrapper.classList.remove('hidden') : setupWrapper.classList.add('hidden');
    const search = document.getElementById('globalSearchContainer');
    if(search) name === 'master' ? search.classList.remove('hidden') : search.classList.add('hidden');
    const target = document.getElementById(name);
    if (target) { target.style.display = "block"; if (evt) evt.currentTarget.classList.add("active"); }
    renderAll();
    window.scrollTo(0, 0);
};

window.saveCustomer = () => {
    const nameVal = document.getElementById('cName').value;
    if(!nameVal) { alert("Enter Name"); return; }
    const id = document.getElementById('editId').value || Date.now().toString();
    const entry = {
        id, name: nameVal, address: document.getElementById('cAddr').value,
        postcode: document.getElementById('cPostcode').value, phone: document.getElementById('cPhone').value,
        price: n(document.getElementById('cPrice').value), week: document.getElementById('cWeek').value,
        day: document.getElementById('cDay').value, notes: document.getElementById('cNotes').value,
        cleaned: false, paidThisMonth: 0, debtHistory: []
    };
    const idx = db.customers.findIndex(x => x.id === id);
    if(idx > -1) db.customers[idx] = entry; else db.customers.push(entry);
    saveData(); alert("Saved!"); location.reload(); 
};

window.renderAll = () => {
    renderMasterTable();
    renderWeekLists();
    renderStats();
};

window.renderMasterTable = () => {
    const container = document.getElementById('masterTableBody');
    if (!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if (c.name.toLowerCase().includes(search) || c.address.toLowerCase().includes(search)) {
            const row = document.createElement('div');
            row.className = 'master-row';
            row.onclick = () => showCustDetails(c.id);
            row.innerHTML = `<div><strong>${c.name}</strong><br><small>${c.address}</small></div><div style="text-align:right">£${n(c.price).toFixed(2)}<br><small>${c.day}</small></div>`;
            container.appendChild(row);
        }
    });
};

window.renderWeekLists = () => {
    for (let i = 1; i <= 4; i++) {
        const container = document.getElementById(`week${i}`);
        if (!container) continue; container.innerHTML = '';
        const weekCusts = db.customers.filter(c => c.week == i);
        if (weekCusts.length === 0) { container.innerHTML = '<div class="card" style="text-align:center; opacity:0.5;">No jobs.</div>'; continue; }
        weekCusts.forEach(c => {
            const owed = n(c.price);
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div onclick="showCustDetails('${c.id}')">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <strong style="font-size:18px;">${c.name}</strong><br>
                            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address + ' ' + c.postcode)}" 
                               target="_blank" class="maps-link" onclick="event.stopPropagation();">
                               📍 <span style="font-size:12px; text-decoration:underline;">${c.address}</span>
                            </a>
                        </div>
                        <div style="text-align:right;"><span style="font-size:10px; font-weight:800; opacity:0.5;">${c.day.toUpperCase()}</span></div>
                    </div>
                </div>
                <div class="action-row">
                    <button class="icon-btn" style="color:#25D366" onclick="window.open('https://wa.me/${c.phone.replace(/\\s+/g, '')}', '_blank')">💬</button>
                    <button class="icon-btn" style="color:#007AFF" onclick="window.location.href='sms:${c.phone.replace(/\\s+/g, '')}'">📱</button>
                    <button id="pay-${c.id}" class="pay-btn-wide ${c.cleaned ? 'was-paid' : ''}" onclick="markAsPaid('${c.id}', ${owed})">
                        ${c.cleaned ? 'Job Paid ✅' : 'Pay £' + owed.toFixed(2)}
                    </button>
                </div>`;
            container.appendChild(card);
        });
    }
};

window.markAsPaid = (id, amt) => {
    const c = db.customers.find(x => x.id === id);
    if (!c) return;
    c.cleaned = true; c.paidThisMonth = n(amt);
    const btn = document.getElementById(`pay-${id}`);
    if (btn) { btn.classList.add('was-paid'); btn.innerText = "Job Paid ✅"; }
    saveData();
};

window.showCustDetails = (id) => {
    const c = db.customers.find(x => x.id === id);
    if(!c) return;
    const modal = document.getElementById('custModal');
    const body = document.getElementById('modalBody');
    body.innerHTML = `
        <h2 style="margin-top:0; color:var(--accent);">${c.name}</h2>
        <p>📍 ${c.address} ${c.postcode}</p>
        <p>📞 ${c.phone || 'N/A'}</p>
        <p>💰 Price: £${n(c.price).toFixed(2)}</p>
        <p>📝 Notes: ${c.notes || 'No notes.'}</p>
        <button class="btn-main full-width-btn" onclick="editCust('${c.id}')">⚙️ Edit</button>`;
    modal.style.display = 'flex';
};

window.editCust = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    document.getElementById('custModal').style.display='none';
    openTab(null, 'admin');
    document.getElementById('editId').value = c.id;
    document.getElementById('cName').value = c.name;
    document.getElementById('cAddr').value = c.address;
    document.getElementById('cPostcode').value = c.postcode;
    document.getElementById('cPhone').value = c.phone;
    document.getElementById('cPrice').value = c.price;
    document.getElementById('cWeek').value = c.week;
    document.getElementById('cDay').value = c.day;
    document.getElementById('cNotes').value = c.notes;
};

window.closeCustModal = () => document.getElementById('custModal').style.display = 'none';

window.renderStats = () => {
    const cur = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const title = document.getElementById('statsMonthTitle');
    if (title) title.innerText = `${cur} Summary`;
    let inc = db.customers.reduce((sum, c) => sum + n(c.paidThisMonth), 0);
    let exp = db.expenses.reduce((sum, e) => sum + n(e.amt), 0);
    let dbt = db.customers.reduce((sum, c) => sum + (c.cleaned ? Math.max(0, n(c.price) - n(c.paidThisMonth)) : 0), 0);
    if(document.getElementById('currRevenue')) document.getElementById('currRevenue').innerText = `£${inc.toFixed(2)}`;
    if(document.getElementById('currSpend')) document.getElementById('currSpend').innerText = `£${exp.toFixed(2)}`;
    if(document.getElementById('currDebt')) document.getElementById('currDebt').innerText = `£${dbt.toFixed(2)}`;
    if(document.getElementById('currProfit')) document.getElementById('currProfit').innerText = `£${(inc - exp).toFixed(2)}`;
    const hist = document.getElementById('monthlyHistoryContainer');
    if (!hist) return; hist.innerHTML = '<h3 class="section-title" style="margin-top:25px;">History</h3>';
    db.history.forEach(h => {
        const d = document.createElement('div'); d.className = 'history-card';
        d.innerHTML = `<div class="history-grid">
            <div class="history-item"><small>${h.month}</small><strong>Inc: £${n(h.income).toFixed(2)}</strong></div>
            <div class="history-item"><small>Debt</small><strong style="color:var(--danger)">£${n(h.debtCreated).toFixed(2)}</strong></div>
        </div>`; hist.appendChild(d);
    });
};

window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.toggleDarkMode = () => { const d = document.getElementById('darkModeToggle').checked; document.body.className = d ? 'dark-mode' : 'light-mode'; localStorage.setItem('Hydro_Dark_Pref', d); };
window.runUATClear = () => { if(confirm("Wipe?")) { localStorage.clear(); location.reload(); } };
window.addExpense = () => { const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value); if(!d || a<=0) return; db.expenses.push({desc:d, amt:a, date:new Date().toLocaleDateString()}); saveData(); location.reload(); };
window.completeCycle = () => {
    if(!confirm("Start New Month?")) return;
    let mInc = db.customers.reduce((sum, c) => sum + n(c.paidThisMonth), 0), mExp = db.expenses.reduce((sum, e) => sum + n(e.amt), 0), nDebt = db.customers.reduce((sum, c) => sum + (c.cleaned ? Math.max(0, n(c.price) - n(c.paidThisMonth)) : 0), 0);
    db.history.unshift({ month: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }), income: mInc, spend: mExp, debtCreated: nDebt });
    db.customers.forEach(c => {
        const bal = c.cleaned ? (n(c.price) - n(c.paidThisMonth)) : (0 - n(c.paidThisMonth));
        if (bal > 0) { if(!c.debtHistory) c.debtHistory = []; c.debtHistory.push({ date: new Date().toLocaleDateString(), amount: bal }); }
        c.cleaned = false; c.paidThisMonth = 0;
    });
    db.expenses = []; saveData(); location.reload();
};
window.exportFullCSV = () => { let c = "ID,Name,Address,Postcode,Phone,Price,Week,Day,Notes\\n"; db.customers.forEach(x => { c += `${x.id},"${x.name}","${x.address}","${x.postcode}","${x.phone}",${x.price},${x.week},"${x.day}","${x.notes}"\\n`; }); const b = new Blob([c], { type: 'text/csv' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = `Backup.csv`; a.click(); };
window.importFullCSV = (e) => { const f = e.target.files[0], r = new FileReader(); r.onload = (ev) => { const rows = ev.target.result.split('\\n').slice(1); let imp = []; rows.forEach(row => { const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); if(cols.length > 5) { imp.push({ id: cols[0], name: cols[1].replace(/"/g,''), address: cols[2].replace(/"/g,''), postcode: cols[3].replace(/"/g,''), phone: cols[4].replace(/"/g,''), price: n(cols[5]), week: cols[6], day: cols[7].replace(/"/g,''), notes: cols[8] ? cols[8].replace(/"/g,'') : "", cleaned: false, paidThisMonth: 0, debtHistory: [] }); } }); db.customers = imp; saveData(); location.reload(); }; r.readAsText(f); };
