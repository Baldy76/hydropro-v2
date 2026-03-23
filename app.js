const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], incomeHistory: [], expenses: [], bank: {name:'', sort:'', acc:''} };
let activeMsgId = null;

const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

// 1. BOOT ENGINE
window.onload = () => {
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.customers) db.customers = [];
    if (!db.incomeHistory) db.incomeHistory = [];
    if (!db.expenses) db.expenses = [];
    
    document.getElementById('headerDate').innerText = new Date().toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
    
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    document.getElementById('darkModeToggle').checked = isDark;
    
    const b = db.bank || {}; 
    document.getElementById('bName').value = b.name || ''; 
    document.getElementById('bSort').value = b.sort || ''; 
    document.getElementById('bAcc').value = b.acc || '';
    renderAll();
};

// 2. PROFIT & CHART ENGINE
function updatePieChart(coll, owed, pend) {
    const total = coll + owed + pend;
    const elColl = document.getElementById('pieCollected');
    const elOwed = document.getElementById('pieOwed');
    const elPend = document.getElementById('piePending');
    if(!elColl || total === 0) return;

    const pColl = (coll / total) * 100;
    const pOwed = (owed / total) * 100;
    const pPend = (pend / total) * 100;

    elColl.setAttribute('stroke-dasharray', `${pColl} 100`);
    elColl.setAttribute('stroke-dashoffset', `0`);
    elOwed.setAttribute('stroke-dasharray', `${pOwed} 100`);
    elOwed.setAttribute('stroke-dashoffset', `-${pColl}`);
    elPend.setAttribute('stroke-dasharray', `${pPend} 100`);
    elPend.setAttribute('stroke-dashoffset', `-${pColl + pOwed}`);
}

window.renderStats = function() {
    let collM = 0, owedM = 0, projM = 0;
    db.customers.forEach(c => { 
        projM += n(c.price); collM += n(c.paidThisMonth); 
        if(c.cleaned) owedM += Math.max(0, n(c.price)-n(c.paidThisMonth)); 
    });
    let pendM = Math.max(0, projM - collM - owedM);
    let totalExp = db.expenses.reduce((s, e) => s + n(e.amt), 0);

    if(document.getElementById('statGross')) document.getElementById('statGross').innerText = '£' + collM.toFixed(2);
    if(document.getElementById('statExp')) document.getElementById('statExp').innerText = '-£' + totalExp.toFixed(2);
    if(document.getElementById('statNet')) document.getElementById('statNet').innerText = '£' + (collM - totalExp).toFixed(2);
    
    if(document.getElementById('statCollMonth')) document.getElementById('statCollMonth').innerText = '£' + collM.toFixed(2);
    if(document.getElementById('statOwedMonth')) document.getElementById('statOwedMonth').innerText = '£' + owedM.toFixed(2);
    if(document.getElementById('statPendingMonth')) document.getElementById('statPendingMonth').innerText = '£' + pendM.toFixed(2);
    
    updatePieChart(collM, owedM, pendM);

    const historyTotal = db.incomeHistory.reduce((s, h) => s + n(h.amount), 0);
    if(document.getElementById('statFYTotal')) document.getElementById('statFYTotal').innerText = '£' + (historyTotal + collM).toFixed(2);
    
    const histBody = document.getElementById('overallHistoryBody');
    if(histBody) {
        histBody.innerHTML = '';
        [...db.incomeHistory].reverse().forEach(h => {
            histBody.innerHTML += `<tr><td style="padding:10px 0; border-bottom:1px solid rgba(0,0,0,0.05); font-weight:600;">${h.month}</td><td style="padding:10px 0; text-align:right; font-weight:800; color:var(--stat-collected);">£${n(h.amount).toFixed(2)}</td></tr>`;
        });
    }
};

// 3. CORE LOGIC & RENDERERS
window.saveData = function() { localStorage.setItem(MASTER_KEY, JSON.stringify(db)); renderAll(); };

window.calculateTrueDebt = function(c) {
    if (!c) return 0;
    const past = (c.debtHistory || []).reduce((s, e) => s + n(e.amount), 0);
    const current = c.cleaned ? (n(c.price) - n(c.paidThisMonth)) : (0 - n(c.paidThisMonth));
    return Math.max(0, past + current);
};

window.renderAll = function() {
    renderWeeks();
    renderMasterTable();
    renderStats();
    renderExpenses();
};

window.renderWeeks = function() {
    for(let i=1; i<=4; i++) {
        const div = document.getElementById('week' + i);
        if(!div) continue; div.innerHTML = '';
        db.customers.filter(c => String(c.week) === String(i)).forEach(c => {
            const debt = calculateTrueDebt(c);
            const isCleaned = c.cleaned;
            let card = document.createElement('div');
            card.className = `customer-card ${debt > 0 ? 'has-debt' : ''}`;
            card.innerHTML = `
                <div class="card-status-bar"></div>
                <div class="card-main-content" onclick="openCustomerModal('${c.id}')">
                    <div class="card-header-row">
                        <span class="card-name">${c.name}</span>
                        <span class="card-price">£${n(c.price).toFixed(2)}</span>
                    </div>
                    <span class="card-sub">${c.address}</span>
                    <div class="card-meta-row">
                        ${c.nextDue ? `<span class="badge badge-due">🗓 Due: ${c.nextDue}</span>` : ''}
                        ${debt > 0 ? `<span class="badge badge-owed">💰 £${debt.toFixed(2)}</span>` : ''}
                        ${isCleaned ? `<span class="badge badge-cleaned">✨ Cleaned</span>` : ''}
                    </div>
                </div>
                <div class="card-actions-wrapper">
                    <div class="action-sub-grid">
                        <button class="btn-admin-small full-width-btn" onclick="openMessageTemplates('${c.id}')">💬 Msg</button>
                        <button class="btn-admin-small full-width-btn" onclick="editCustomer('${c.id}')">⚙️ Edit</button>
                    </div>
                    <div class="action-sub-grid">
                        <button class="btn-main btn-work" onclick="markJobAsCleaned('${c.id}')">${isCleaned?'Done ✅':'Clean'}</button>
                        <button class="btn-alt btn-work" onclick="processPayment('${c.id}')">Log Pay</button>
                    </div>
                </div>`;
            div.appendChild(card);
        });
    }
};

window.renderMasterTable = function() {
    const body = document.getElementById('masterTableBody');
    if(!body) return; body.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase().trim();
    let html = "";
    [...db.customers].sort((a,b) => a.name.localeCompare(b.name)).forEach(c => {
        if(search === "" || c.name.toLowerCase().includes(search) || c.address.toLowerCase().includes(search)) {
            const debt = calculateTrueDebt(c);
            html += `
                <div class="master-row-card" onclick="openCustomerModal('${c.id}')">
                    <div class="master-info">
                        <div style="font-weight:800; color:var(--primary); font-size:16px;">${c.name}</div>
                        <div style="font-size:12px; opacity:0.6;">${c.address}</div>
                    </div>
                    <div class="master-balance">
                        <div style="font-weight:900; font-size:18px; color:${debt > 0 ? 'var(--danger)' : 'var(--accent)'}">£${debt.toFixed(2)}</div>
                        <div style="font-size:9px; opacity:0.4; text-transform:uppercase; font-weight:800;">Balance</div>
                    </div>
                </div>`;
        }
    });
    body.innerHTML = `<div style="padding:10px;">${html}</div>`;
};

// 4. FUNCTIONAL UTILITIES
window.markJobAsCleaned = function(id) {
    const c = db.customers.find(x => String(x.id) === String(id));
    if(c) {
        c.cleaned = true;
        const next = new Date();
        next.setDate(next.getDate() + ((n(c.freq) || 4) * 7));
        c.nextDue = next.toLocaleDateString('en-GB', {day:'numeric', month:'short'});
        saveData();
    }
};

window.openMessageTemplates = function(id) {
    activeMsgId = id;
    document.getElementById('msgModal').style.display = 'flex';
};

window.executeMessage = function(type) {
    const c = db.customers.find(x => String(x.id) === String(activeMsgId));
    if(!c) return;
    const b = db.bank || {name:'', sort:'', acc:''};
    let msg = type === 'coming' 
        ? `Hey ${c.name}, just letting you know I'm coming to clean your windows tomorrow at ${c.address}. Jonathan @Hydro`
        : `Hey ${c.name}, windows cleaned! Total due: £${calculateTrueDebt(c).toFixed(2)}. Bank: ${b.name}, Sort: ${b.sort}, Acc: ${b.acc}. Jonathan @Hydro`;
    window.location.href = `https://wa.me/${c.phone.replace(/\s+/g, '')}?text=${encodeURIComponent(msg)}`;
    document.getElementById('msgModal').style.display = 'none';
};

window.openCustomerModal = function(id) {
    const c = db.customers.find(x => String(x.id) === String(id)); if(!c) return;
    document.getElementById('modName').innerText = c.name;
    document.getElementById('modAddr').innerText = c.address;
    document.getElementById('modNextClean').innerText = c.nextDue ? "NEXT DUE: " + c.nextDue : "";
    const totalOwed = calculateTrueDebt(c);
    document.getElementById('modOwed').innerText = '£' + totalOwed.toFixed(2);
    document.getElementById('modOwed').style.color = totalOwed > 0 ? 'var(--danger)' : 'var(--stat-collected)';
    let ledgerHtml = "";
    const allMonths = [...new Set([...(c.debtHistory||[]).map(d=>d.month), ...(c.paymentHistory||[]).map(p=>p.month)])];
    allMonths.forEach(m => {
        const d = (c.debtHistory||[]).find(x => x.month === m);
        const p = (c.paymentHistory||[]).find(x => x.month === m);
        if(d) ledgerHtml += `<div class="ledger-row text-owed"><span>${m}</span><span>£${n(d.amount).toFixed(2)}</span></div>`;
        else if(p) ledgerHtml += `<div class="ledger-row text-paid"><span>${m} PAID ✅</span><span>£${n(p.amount).toFixed(2)}</span></div>`;
    });
    document.getElementById('ledgerBox').innerHTML = ledgerHtml || "<div style='opacity:0.5; text-align:center;'>No history.</div>";
    const statusBox = document.getElementById('modCurrentStatus');
    if (n(c.paidThisMonth) >= n(c.price)) statusBox.innerHTML = `<span class="text-paid">PAID ✅</span>`;
    else statusBox.innerHTML = `<span class="text-owed">OWED £${(n(c.price) - n(c.paidThisMonth)).toFixed(2)}</span>`;
    document.getElementById('customerModal').style.display = 'flex';
};

window.completeCycle = function() {
    if(!confirm("Start New Month? Unpaid current moves to debt.")) return;
    const label = new Date().toLocaleDateString('en-GB', {month:'short', year:'2-digit'});
    db.incomeHistory.push({ month: label, amount: db.customers.reduce((s,c) => s + n(c.paidThisMonth), 0) });
    db.customers.forEach(c => {
        if(!c.paymentHistory) c.paymentHistory = [];
        if(n(c.paidThisMonth) >= n(c.price)) c.paymentHistory.push({ month: label, amount: n(c.paidThisMonth) });
        const o = calculateTrueDebt(c);
        if(o > 0) {
            c.debtHistory = c.debtHistory || [];
            c.debtHistory.push({ month: label, amount: o });
        }
        c.cleaned = false; c.paidThisMonth = 0;
    });
    db.expenses = []; saveData();
};

window.saveCustomer = function() {
    const id = document.getElementById('editId').value || Date.now();
    const name = document.getElementById('cName').value; if(!name) return;
    const entry = { 
        id: id, name: name, address: document.getElementById('cAddr').value, 
        postcode: document.getElementById('cPostcode').value, phone: document.getElementById('cPhone').value, 
        price: n(document.getElementById('cPrice').value), week: document.getElementById('cWeek').value, 
        freq: document.getElementById('cFreq').value, day: document.getElementById('cDay').value, 
        notes: document.getElementById('cNotes').value, cleaned: false, paidThisMonth: 0, debtHistory: [], paymentHistory: [], nextDue: ''
    };
    const idx = db.customers.findIndex(x => String(x.id) === String(id));
    if(idx > -1) { 
        const old = db.customers[idx];
        entry.cleaned = old.cleaned; entry.paidThisMonth = old.paidThisMonth; 
        entry.debtHistory = old.debtHistory || []; entry.paymentHistory = old.paymentHistory || [];
        entry.nextDue = old.nextDue || '';
        db.customers[idx] = entry; 
    } else { db.customers.push(entry); }
    clearForm(); saveData(); openTab(null, 'master');
};

window.editCustomer = function(id) { 
    const c = db.customers.find(x => String(x.id) === String(id)); if(!c) return; 
    document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cAddr').value = c.address;
    document.getElementById('cPostcode').value = c.postcode; document.getElementById('cPhone').value = c.phone; document.getElementById('cPrice').value = c.price;
    document.getElementById('cWeek').value = c.week; document.getElementById('cFreq').value = c.freq || "4"; document.getElementById('cDay').value = c.day;
    document.getElementById('cNotes').value = c.notes; document.getElementById('editActions').classList.remove('hidden'); document.getElementById('formTitle').innerText = "Edit Customer"; 
    openTab(null, 'admin'); 
};

window.exportFullCSV = function() {
    let csv = "ID,Name,Address,Postcode,Phone,Price,Week,Freq,Day,Notes,Cleaned,PaidThisMonth,DebtHistory,PaymentHistory,NextDue\n";
    db.customers.forEach(c => {
        const row = [c.id, `"${c.name}"`, `"${c.address}"`, `"${c.postcode}"`, `"${c.phone}"`, n(c.price), c.week, c.freq || 4, c.day, `"${(c.notes||'').replace(/"/g, '""')}"`, c.cleaned?1:0, n(c.paidThisMonth), `"${JSON.stringify(c.debtHistory||[]).replace(/"/g, '""')}"`, `"${JSON.stringify(c.paymentHistory||[]).replace(/"/g, '""')}"`, `"${c.nextDue||''}"`];
        csv += row.join(",") + "\n";
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `HydroPro_Backup_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
};

window.importFullCSV = function(e) {
    const r = new FileReader(); r.onload = (ev) => {
        const lines = ev.target.result.split(/\r?\n/);
        if(lines.length <= 1) return;
        db.customers = [];
        lines.slice(1).forEach(l => {
            if(!l.trim()) return;
            const cols = l.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g).map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
            if(cols.length < 5) return;
            db.customers.push({ id:cols[0], name:cols[1], address:cols[2], postcode:cols[3], phone:cols[4], price:n(cols[5]), week:cols[6], freq:cols[7], day:cols[8], notes:cols[9], cleaned:cols[10]=="1", paidThisMonth:n(cols[11]), debtHistory:JSON.parse(cols[12]||"[]"), paymentHistory:JSON.parse(cols[13]||"[]"), nextDue:cols[14] });
        });
        saveData(); location.reload();
    };
    r.readAsText(e.target.files[0]);
};

window.openTab = function(evt, name) {
    const contents = document.getElementsByClassName("tab-content");
    const tabs = document.getElementsByClassName("tab");
    for (let i = 0; i < contents.length; i++) contents[i].classList.remove("active");
    for (let i = 0; i < tabs.length; i++) tabs[i].classList.remove("active");
    document.getElementById(name).classList.add("active");
    if (evt) evt.currentTarget.classList.add("active");
    renderAll();
    window.scrollTo(0,0);
};

window.clearForm = function() { ['editId','cName','cAddr','cPostcode','cPhone','cPrice','cNotes'].forEach(id => document.getElementById(id).value = ''); document.getElementById('editActions').classList.add('hidden'); document.getElementById('formTitle').innerText = "Customer Entry"; };
window.handleBankAction = function() {
    const isLocked = document.getElementById('bName').disabled;
    if (isLocked) { ['bName','bSort','bAcc'].forEach(id => document.getElementById(id).disabled = false); document.getElementById('btnBankAction').innerText = "🔒 Save Details"; } 
    else { db.bank = { name: document.getElementById('bName').value, sort: document.getElementById('bSort').value, acc: document.getElementById('bAcc').value }; ['bName','bSort','bAcc'].forEach(id => document.getElementById(id).disabled = true); document.getElementById('btnBankAction').innerText = "🔓 Edit Bank Details"; saveData(); }
};
window.deleteCustomer = function() { if(confirm("Delete permanently?")) { db.customers = db.customers.filter(c => String(c.id) !== String(document.getElementById('editId').value)); clearForm(); saveData(); openTab(null, 'master'); } };
window.processPayment = function(id) {
    const c = db.customers.find(x => String(x.id) === String(id)); if(!c) return;
    const amt = prompt("Amount paid?", calculateTrueDebt(c).toFixed(2));
    if(amt === null) return;
    let pay = n(amt);
    if(c.debtHistory) {
        for(let i=0; i<c.debtHistory.length; i++) {
            if(pay <= 0) break;
            let owe = n(c.debtHistory[i].amount);
            if(pay >= owe) { pay -= owe; c.debtHistory[i].amount = 0; }
            else { c.debtHistory[i].amount = owe - pay; pay = 0; }
        }
        c.debtHistory = c.debtHistory.filter(h => n(h.amount) > 0);
    }
    c.paidThisMonth += pay; saveData();
};
window.addExpense = function() { 
    const v = n(document.getElementById('expAmount').value); 
    if(v > 0) { db.expenses.push({amt:v, name:document.getElementById('expName').value||'Expense'}); saveData(); document.getElementById('expAmount').value=''; document.getElementById('expName').value=''; } 
};
window.renderExpenses = function() {
    const list = document.getElementById('expenseList'); if(!list) return; list.innerHTML = '';
    (db.expenses||[]).forEach((e, idx) => {
        list.innerHTML += `<div class="card" style="display:flex; justify-content:space-between; padding:15px;"><span>${e.name}</span><strong>-£${n(e.amt).toFixed(2)}</strong><button onclick="db.expenses.splice(${idx},1); saveData();" style="height:30px; width:30px; background:var(--danger); color:white; border-radius:50%; font-size:10px;">X</button></div>`;
    });
};
window.toggleDarkMode = function() { const isDark = document.getElementById('darkModeToggle').checked; document.body.className = isDark ? 'dark-mode' : 'light-mode'; localStorage.setItem('Hydro_Dark_Pref', isDark); };
window.closeCustomerModal = function() { document.getElementById('customerModal').style.display = 'none'; };
window.runUATClear = function() { if(confirm("WIPE EVERYTHING?")) { localStorage.clear(); location.reload(); } };
window.handleSearch = function() { renderMasterTable(); };
function editFromModal() { const name = document.getElementById('modName').innerText; const c = db.customers.find(x => x.name.includes(name)); if(c) { closeCustomerModal(); editCustomer(c.id); } }
