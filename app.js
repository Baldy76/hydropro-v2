const MASTER_KEY = 'HydroPro_App_Production';
const BANK_DETAILS = "Bank: Monzo\nAcc: 12345678\nSort: 00-00-00"; 
let db = { customers: [], expenses: [], history: [] }; 
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

// --- STARTUP ---
window.onload = () => {
    const dateEl = document.getElementById('headerDate');
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.customers) db.customers = [];
    if (!db.expenses) db.expenses = [];
    if (!db.history) db.history = [];
    
    db.customers.forEach(c => { if(!c.paymentLogs) c.paymentLogs = []; });

    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    renderAll();
};

window.openTab = (evt, name) => {
    document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    const sw = document.getElementById('setup-form-wrapper');
    if (sw) name === 'admin' ? sw.classList.remove('hidden') : sw.classList.add('hidden');
    const search = document.getElementById('globalSearchContainer');
    if(search) name === 'master' ? search.classList.remove('hidden') : search.classList.add('hidden');
    const target = document.getElementById(name);
    if (target) { target.style.display = "block"; if (evt) evt.currentTarget.classList.add("active"); }
    renderAll();
};

// --- DATA LOGIC ---
window.saveCustomer = () => {
    const nameVal = document.getElementById('cName').value;
    if(!nameVal) { alert("Enter Name"); return; }
    const id = document.getElementById('editId').value || Date.now().toString();
    const entry = {
        id, name: nameVal, address: document.getElementById('cAddr').value,
        postcode: document.getElementById('cPostcode').value, phone: document.getElementById('cPhone').value,
        price: n(document.getElementById('cPrice').value), week: document.getElementById('cWeek').value,
        day: document.getElementById('cDay').value, notes: document.getElementById('cNotes').value,
        cleaned: false, paidThisMonth: 0, debtHistory: [], paymentLogs: []
    };
    const idx = db.customers.findIndex(x => x.id === id);
    if(idx > -1) {
        const ex = db.customers[idx];
        entry.debtHistory = ex.debtHistory || [];
        entry.paidThisMonth = ex.paidThisMonth || 0;
        entry.cleaned = ex.cleaned || false;
        entry.paymentLogs = ex.paymentLogs || [];
        db.customers[idx] = entry;
    } else { db.customers.push(entry); }
    saveData(); alert("Saved!"); location.reload(); 
};

// --- DRILL-DOWN MODALS ---
window.showIncomeModal = () => {
    const body = document.getElementById('modalContentBody');
    let html = '<h3 class="section-title">Collections Drill-down</h3>';
    let total = 0;

    db.customers.forEach(c => {
        (c.paymentLogs || []).forEach(log => {
            const isDebt = log.type === 'debt';
            const color = isDebt ? 'var(--danger)' : 'var(--success)';
            const label = isDebt ? 'Debt Paid' : 'Job Paid';
            html += `<div class="drilldown-row">
                <div><strong>${c.name}</strong><br><small>${log.date} (${label})</small></div>
                <div style="color:${color}; font-weight:bold;">£${n(log.amount).toFixed(2)}</div>
            </div>`;
            total += n(log.amount);
        });
    });

    html += `<div class="drilldown-total"><span>Total Cash Collected</span><span>£${total.toFixed(2)}</span></div>`;
    body.innerHTML = html;
    document.getElementById('globalModal').style.display = 'flex';
};

window.showExpenseModal = () => {
    const body = document.getElementById('modalContentBody');
    let html = '<h3 class="section-title">Expense Drill-down</h3>';
    let total = 0;

    db.expenses.forEach(e => {
        html += `<div class="drilldown-row">
            <div><strong>${e.desc}</strong><br><small>${e.date}</small></div>
            <div style="font-weight:bold;">£${n(e.amt).toFixed(2)}</div>
        </div>`;
        total += n(e.amt);
    });

    html += `<div class="drilldown-total"><span>Total Expenses</span><span>£${total.toFixed(2)}</span></div>`;
    body.innerHTML = html;
    document.getElementById('globalModal').style.display = 'flex';
};

window.closeModal = () => document.getElementById('globalModal').style.display = 'none';

// --- WORKFLOW ---
window.toggleCleaned = (id) => {
    const c = db.customers.find(x => x.id === id);
    if (!c) return;
    c.cleaned = !c.cleaned;
    saveData(); renderWeekLists();
};

window.markAsPaid = (id) => {
    const c = db.customers.find(x => x.id === id);
    if (!c || n(c.paidThisMonth) >= n(c.price)) return;
    const amount = n(c.price);
    c.paidThisMonth = amount;
    if(!c.paymentLogs) c.paymentLogs = [];
    c.paymentLogs.push({ date: new Date().toLocaleString('en-GB'), amount: amount, type: 'income' });
    saveData(); renderWeekLists();
};

window.handleDebtCollection = (id) => {
    const c = db.customers.find(x => x.id === id);
    if (!c) return;
    const currentTotal = calculateDebt(c);
    const input = prompt(`Collection for ${c.name}: £${currentTotal.toFixed(2)}`, currentTotal.toFixed(2));
    if (input === null) return;
    const amountPaid = n(input);
    if (amountPaid <= 0) return;

    if(!c.paymentLogs) c.paymentLogs = [];
    c.paymentLogs.push({ date: new Date().toLocaleString('en-GB'), amount: amountPaid, type: 'debt' });

    if (amountPaid >= currentTotal) { c.debtHistory = []; } 
    else {
        let rem = amountPaid;
        for (let i = 0; i < (c.debtHistory || []).length; i++) {
            if (rem <= 0) break;
            if (c.debtHistory[i].amount <= rem) { rem -= c.debtHistory[i].amount; c.debtHistory.splice(i, 1); i--; }
            else { c.debtHistory[i].amount -= rem; rem = 0; }
        }
    }
    saveData(); renderWeekLists();
};

const calculateDebt = (c) => (c.debtHistory || []).reduce((sum, d) => sum + n(d.amount), 0);

window.renderAll = () => { renderMasterTable(); renderWeekLists(); renderStats(); };

window.renderStats = () => {
    const curMonth = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if(document.getElementById('statsMonthTitle')) document.getElementById('statsMonthTitle').innerText = `${curMonth} Summary`;
    
    // 1. Calculate Actual Cash Flow (Independent of month work)
    let totalCashIn = 0;
    db.customers.forEach(c => { (c.paymentLogs || []).forEach(log => totalCashIn += n(log.amount)); });
    let monthExpenses = db.expenses.reduce((sum, e) => sum + n(e.amt), 0);
    let cashInHand = totalCashIn - monthExpenses;

    // 2. Calculate Progress (Based strictly on jobs scheduled for this cycle)
    let totalJobValueScheduled = db.customers.reduce((sum, c) => sum + n(c.price), 0);
    let jobRevenueCollected = db.customers.reduce((sum, c) => sum + n(c.paidThisMonth), 0);
    let remainingJobValue = totalJobValueScheduled - jobRevenueCollected;
    
    // 3. Old Debt
    let totalOwedOldDebt = db.customers.reduce((sum, c) => sum + calculateDebt(c), 0);
    
    let progress = totalJobValueScheduled > 0 ? (jobRevenueCollected / totalJobValueScheduled) * 100 : 0;

    // UI UPDATES
    if(document.getElementById('currProfit')) document.getElementById('currProfit').innerText = `£${cashInHand.toFixed(2)}`;
    if(document.getElementById('progressBar')) document.getElementById('progressBar').style.width = `${progress}%`;
    if(document.getElementById('collectionPercent')) document.getElementById('collectionPercent').innerText = `${Math.round(progress)}%`;
    if(document.getElementById('targetWork')) document.getElementById('targetWork').innerText = `£${totalJobValueScheduled.toFixed(2)}`;
    if(document.getElementById('stillToCollect')) document.getElementById('stillToCollect').innerText = `£${Math.max(0, remainingJobValue).toFixed(2)}`;
    if(document.getElementById('currRevenue')) document.getElementById('currRevenue').innerText = `£${totalCashIn.toFixed(2)}`;
    if(document.getElementById('currSpend')) document.getElementById('currSpend').innerText = `£${monthExpenses.toFixed(2)}`;
    if(document.getElementById('totalOldDebt')) document.getElementById('totalOldDebt').innerText = `£${totalOwedOldDebt.toFixed(2)}`;

    const hist = document.getElementById('monthlyHistoryContainer');
    if (hist) {
        hist.innerHTML = '<h3 class="section-title" style="margin-top:25px;">Month History</h3>';
        db.history.forEach(h => {
            const d = document.createElement('div'); d.className = 'history-card';
            d.innerHTML = `<div class="history-grid">
                <div class="history-item"><small>${h.month}</small><strong>Inc: £${n(h.income).toFixed(2)}</strong></div>
                <div class="history-item"><small>Debt Created</small><strong style="color:var(--danger)">£${n(h.debtCreated).toFixed(2)}</strong></div>
            </div>`; hist.appendChild(d);
        });
    }
};

window.renderMasterTable = () => {
    const container = document.getElementById('masterTableBody');
    if (!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if (c.name.toLowerCase().includes(search) || c.address.toLowerCase().includes(search)) {
            const row = document.createElement('div'); row.className = 'master-row';
            row.onclick = () => showCustDetails(c.id);
            const debt = calculateDebt(c);
            row.innerHTML = `<div><strong>${c.name}</strong><br><small>${c.address}</small></div><div style="text-align:right">£${n(c.price).toFixed(2)}${debt > 0 ? '<br><small style="color:var(--danger)">Debt: £' + debt.toFixed(2) + '</small>' : ''}</div>`;
            container.appendChild(row);
        }
    });
};

window.renderWeekLists = () => {
    for (let i = 1; i <= 4; i++) {
        const container = document.getElementById(`week${i}`);
        if (!container) continue; container.innerHTML = '';
        const weekCusts = db.customers.filter(c => c.week == i);
        if (weekCusts.length === 0) { container.innerHTML = '<div class="card" style="text-align:center; opacity:0.5;">No jobs scheduled.</div>'; continue; }
        weekCusts.forEach(c => {
            const isPaid = n(c.paidThisMonth) >= n(c.price);
            const debt = calculateDebt(c);
            const hasDebt = debt > 0;
            const card = document.createElement('div'); card.className = 'card';
            const gridStyle = hasDebt ? 'grid-template-columns: repeat(3, 1fr);' : 'grid-template-columns: 1fr 1fr;';
            card.innerHTML = `
                <div onclick="showCustDetails('${c.id}')">
                    <strong style="font-size:18px;">${c.name}</strong><br><small style="opacity:0.6;">${c.address}</small>
                </div>
                <div class="workflow-grid">
                    <div class="comms-row">
                        <button class="icon-btn-large" style="color:#25D366" onclick="handleWhatsApp('${c.id}')">💬</button>
                        <button class="icon-btn-large" style="color:#007AFF" onclick="handleSMS('${c.id}')">📱</button>
                        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address + ' ' + c.postcode)}" target="_blank" class="icon-btn-large" style="color:#ea4335">📍</a>
                    </div>
                    <div class="status-row" style="${gridStyle}">
                        <button class="action-btn-main ${c.cleaned ? 'btn-cleaned-active' : ''}" onclick="toggleCleaned('${c.id}')">${c.cleaned ? 'Cleaned ✅' : 'Cleaned'}</button>
                        <button class="action-btn-main ${isPaid ? 'btn-paid-active' : 'btn-pay-pending'}" onclick="markAsPaid('${c.id}')">${isPaid ? 'Paid ✅' : 'Pay £' + n(c.price).toFixed(2)}</button>
                        ${hasDebt ? `<button class="action-btn-main btn-debt-pending" onclick="handleDebtCollection('${c.id}')">Debt £${debt.toFixed(2)}</button>` : ''}
                    </div>
                </div>`;
            container.appendChild(card);
        });
    }
};

window.showCustDetails = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    const body = document.getElementById('modalContentBody');
    const debt = calculateDebt(c);
    body.innerHTML = `<h2 style="margin-top:0; color:var(--accent);">${c.name}</h2><p>📍 ${c.address} ${c.postcode}</p><p>📞 ${c.phone || 'N/A'}</p><p>💰 Price: £${n(c.price).toFixed(2)}</p>${debt > 0 ? `<p style="color:var(--danger); font-weight:bold;">Old Debt: £${debt.toFixed(2)}</p>` : ''}<p>📝 Notes: ${c.notes || 'No notes.'}</p><button class="btn-main full-width-btn" onclick="editCust('${c.id}')">⚙️ Edit Customer</button>`;
    document.getElementById('globalModal').style.display = 'flex';
};

window.editCust = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    closeModal(); openTab(null, 'admin');
    document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name;
    document.getElementById('cAddr').value = c.address; document.getElementById('cPostcode').value = c.postcode;
    document.getElementById('cPhone').value = c.phone; document.getElementById('cPrice').value = c.price;
    document.getElementById('cWeek').value = c.week; document.getElementById('cDay').value = c.day; document.getElementById('cNotes').value = c.notes;
};

window.saveData = () => localStorage.setItem(MASTER_KEY, JSON.stringify(db));
window.toggleDarkMode = () => { const d = document.getElementById('darkModeToggle').checked; document.body.className = d ? 'dark-mode' : 'light-mode'; localStorage.setItem('Hydro_Dark_Pref', d); };
window.runUATClear = () => { if(confirm("Wipe all data?")) { localStorage.clear(); location.reload(); } };
window.addExpense = () => { 
    const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value); 
    if(!d || a<=0) return; 
    db.expenses.push({desc:d, amt:a, date:new Date().toLocaleString('en-GB')}); 
    saveData(); location.reload(); 
};

window.completeCycle = () => {
    if(!confirm("Archive Month & Reset? This moves unpaid jobs to Debt Ledger.")) return;
    let mInc = 0; db.customers.forEach(c => { (c.paymentLogs||[]).forEach(l => mInc += n(l.amount)); });
    let mExp = db.expenses.reduce((sum, e) => sum + n(e.amt), 0);
    let nDebt = db.customers.reduce((sum, c) => sum + (c.cleaned && n(c.paidThisMonth) < n(c.price) ? n(c.price) - n(c.paidThisMonth) : 0), 0);
    
    db.history.unshift({ month: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }), income: mInc, spend: mExp, debtCreated: nDebt });
    
    db.customers.forEach(c => {
        const bal = c.cleaned ? (n(c.price) - n(c.paidThisMonth)) : (0 - n(c.paidThisMonth));
        if (bal > 0) { if(!c.debtHistory) c.debtHistory = []; c.debtHistory.push({ date: new Date().toLocaleDateString(), amount: bal }); }
        c.cleaned = false; c.paidThisMonth = 0; c.paymentLogs = [];
    });
    db.expenses = []; saveData(); location.reload();
};

window.exportFullCSV = () => {
    let c = "ID,Name,Address,Postcode,Phone,Price,Week,Day,Notes\n";
    db.customers.forEach(x => { c += `${x.id},"${x.name}","${x.address}","${x.postcode}","${x.phone}",${x.price},${x.week},"${x.day}","${x.notes}"\n`; });
    const b = new Blob([c], { type: 'text/csv' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = `HydroBackup.csv`; a.click();
};

window.importFullCSV = (e) => {
    const f = e.target.files[0], r = new FileReader();
    r.onload = (ev) => {
        const rows = ev.target.result.split('\n').slice(1);
        let imp = [];
        rows.forEach(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if(cols.length > 5) {
                imp.push({ id: cols[0], name: cols[1].replace(/"/g,''), address: cols[2].replace(/"/g,''), postcode: cols[3].replace(/"/g,''), phone: cols[4].replace(/"/g,''), price: n(cols[5]), week: cols[6], day: cols[7].replace(/"/g,''), notes: cols[8] ? cols[8].replace(/"/g,'') : "", cleaned: false, paidThisMonth: 0, debtHistory: [], paymentLogs: [] });
            }
        });
        db.customers = imp; saveData(); location.reload();
    };
    r.readAsText(f);
};
