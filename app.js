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

// 3. SCHEDULING ENGINE
window.calculateNextDate = function(frequencyWeeks) {
    const next = new Date();
    next.setDate(next.getDate() + (frequencyWeeks * 7));
    return next.toLocaleDateString('en-GB', {day:'numeric', month:'short'});
};

window.markJobAsCleaned = function(id) {
    const c = db.customers.find(x => String(x.id) === String(id));
    if(c) {
        c.cleaned = true;
        c.lastCleaned = new Date().toISOString();
        c.nextDue = calculateNextDate(n(c.freq) || 4);
        saveData();
    }
};

// 4. MESSAGE ENGINE
window.openMessageTemplates = function(id) {
    activeMsgId = id;
    document.getElementById('msgModal').style.display = 'flex';
};

window.executeMessage = function(type) {
    const c = db.customers.find(x => String(x.id) === String(activeMsgId));
    if(!c) return;
    const b = db.bank || {name:'', sort:'', acc:''};
    let msg = "";
    
    if(type === 'coming') {
        msg = `Hey ${c.name}, just a quick message to let you know I'll be coming to wash your windows tomorrow at ${c.address}. Thanks, Jonathan @Hydro`;
    } else {
        const bal = calculateTrueDebt(c).toFixed(2);
        msg = `Hey ${c.name}, windows all done today! Total due is £${bal}. Bank: ${b.name}, Sort: ${b.sort}, Acc: ${b.acc}. Thanks for your business, Jonathan @Hydro`;
    }
    
    const phone = c.phone.replace(/\s+/g, '');
    window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    document.getElementById('msgModal').style.display = 'none';
};

// 5. CORE RENDERING
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
            let card = document.createElement('div');
            card.className = `customer-card ${debt > 0 ? 'has-debt' : ''}`;
            card.innerHTML = `
                <div onclick="openCustomerModal('${c.id}')">
                    <div style="display:flex; justify-content:space-between"><strong>${c.name}</strong><strong>£${n(c.price).toFixed(2)}</strong></div>
                    <small style="opacity:0.6">${c.address}</small>
                    ${c.nextDue ? `<div style="font-size:10px; color:var(--accent); margin-top:4px;">Next Due: ${c.nextDue}</div>` : ''}
                </div>
                <div class="card-action-grid">
                    <button class="icon-btn-small" onclick="openMessageTemplates('${c.id}')">💬 Msg</button>
                    <button class="icon-btn-small" onclick="editCustomer('${c.id}')">⚙️ Edit</button>
                    <button class="icon-btn-small ${c.cleaned?'wa-btn':''}" onclick="markJobAsCleaned('${c.id}')">${c.cleaned?'Done ✅':'Clean'}</button>
                    <button class="btn-main" onclick="processPayment('${c.id}')">£${debt.toFixed(2)} Pay</button>
                </div>`;
            div.appendChild(card);
        });
    }
};

window.renderMasterTable = function() {
    const body = document.getElementById('masterTableBody');
    if(!body) return; body.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase().trim();
    [...db.customers].sort((a,b) => a.name.localeCompare(b.name)).forEach(c => {
        if(search === "" || c.name.toLowerCase().includes(search) || c.address.toLowerCase().includes(search)) {
            const debt = calculateTrueDebt(c);
            const tr = document.createElement('tr');
            tr.onclick = () => openCustomerModal(c.id);
            tr.innerHTML = `<td style="padding:15px; border-bottom:1px solid rgba(0,0,0,0.03);"><strong>${c.name}</strong><br><small style="opacity:0.6;">${c.address}</small></td><td style="padding:15px; text-align:right; font-weight:900; color:${debt > 0 ? 'var(--danger)' : 'var(--accent)'}">£${debt.toFixed(2)}</td>`;
            body.appendChild(tr);
        }
    });
};

window.renderExpenses = function() {
    const list = document.getElementById('expenseList');
    if(!list) return; list.innerHTML = '';
    db.expenses.forEach((e, idx) => {
        list.innerHTML += `<div class="card" style="display:flex; justify-content:space-between; padding:15px;">
            <span>${e.name}</span>
            <strong>-£${n(e.amt).toFixed(2)}</strong>
            <button onclick="db.expenses.splice(${idx},1); saveData();" style="height:30px; width:30px; background:var(--danger); color:white; border-radius:50%; font-size:10px;">X</button>
        </div>`;
    });
};

// 6. SHARED LOGIC
window.saveData = function() { localStorage.setItem(MASTER_KEY, JSON.stringify(db)); renderAll(); };

window.calculateTrueDebt = function(c) {
    if (!c) return 0;
    const past = (c.debtHistory || []).reduce((s, e) => s + n(e.amount), 0);
    const current = c.cleaned ? (n(c.price) - n(c.paidThisMonth)) : (0 - n(c.paidThisMonth));
    return Math.max(0, past + current);
};

window.openCustomerModal = function(id) {
    const c = db.customers.find(x => String(x.id) === String(id)); if(!c) return;
    document.getElementById('modName').innerText = c.name;
    document.getElementById('modAddr').innerText = (c.address || "") + " " + (c.postcode || "");
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
    if(!confirm("Start New Month? Unpaid moves to Debt, Expenses Reset.")) return;
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
    db.expenses = []; // Clear expenses for new month
    saveData();
};

window.saveCustomer = function() {
    const id = document.getElementById('editId').value || Date.now();
    const name = document.getElementById('cName').value; if(!name) return;
    const entry = { 
        id: id, name: name, address: document.getElementById('cAddr').value, 
        postcode: document.getElementById('cPostcode').value, phone: document.getElementById('cPhone').value, 
        price: n(document.getElementById('cPrice').value), week: document.getElementById('cWeek').value, 
        freq: document.getElementById('cFreq').value, day: document.getElementById('cDay').value, 
        notes: document.getElementById('cNotes').value, 
        cleaned: false, paidThisMonth: 0, debtHistory: [], paymentHistory: [], nextDue: ''
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
    document.getElementById('editId').value = c.id; 
    document.getElementById('cName').value = c.name; document.getElementById('cAddr').value = c.address; 
    document.getElementById('cPostcode').value = c.postcode; document.getElementById('cPhone').value = c.phone; 
    document.getElementById('cPrice').value = c.price; document.getElementById('cWeek').value = c.week; 
    document.getElementById('cFreq').value = c.freq || "4"; document.getElementById('cDay').value = c.day; 
    document.getElementById('cNotes').value = c.notes; 
    document.getElementById('editActions').classList.remove('hidden'); document.getElementById('formTitle').innerText = "Edit Customer"; 
    window.openTab(null, 'admin'); 
};

window.addExpense = function() {
    const v = n(document.getElementById('expAmount').value);
    const item = document.getElementById('expName').value;
    if(v > 0) {
        db.expenses.push({amt: v, name: item || 'Expense'});
        document.getElementById('expAmount').value = '';
        document.getElementById('expName').value = '';
        saveData();
    }
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

window.clearForm = function() { ['editId','cName','cAddr','cPostcode','cPhone','cPrice','cNotes'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; }); document.getElementById('editActions').classList.add('hidden'); document.getElementById('formTitle').innerText = "Customer Entry"; };
window.handleBankAction = function() {
    const isLocked = document.getElementById('bName').disabled;
    if (isLocked) { ['bName','bSort','bAcc'].forEach(id => document.getElementById(id).disabled = false); document.getElementById('btnBankAction').innerText = "🔒 Save & Lock Details"; } 
    else { db.bank = { name: document.getElementById('bName').value, sort: document.getElementById('bSort').value, acc: document.getElementById('bAcc').value }; ['bName','bSort','bAcc'].forEach(id => document.getElementById(id).disabled = true); document.getElementById('btnBankAction').innerText = "🔓 Edit Bank Details"; saveData(); }
};
window.deleteCustomer = function() { const id = document.getElementById('editId').value; if(id && confirm("Delete permanently?")) { db.customers = db.customers.filter(c => String(c.id) !== String(id)); clearForm(); saveData(); openTab(null, 'master'); } };
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
window.importCSV = function(e) {
    const r = new FileReader(); r.onload = (ev) => {
        const l = ev.target.result.split('\n'); if(l.length <= 1) return;
        if(!confirm("Overwrite current data?")) return;
        db.customers = [];
        l.slice(1).forEach(line => {
            const cols = line.split(',').map(c => c.replace(/"/g, '').trim());
            if(cols.length >= 5) db.customers.push({ id: Date.now()+Math.random(), name: cols[0], address: cols[1], postcode: cols[2], phone: cols[3], price: n(cols[4]), week: cols[5]||'1', freq: cols[6]||'4', day: cols[7]||'Monday', notes: cols[8]||'', cleaned: false, paidThisMonth: 0, debtHistory: [], paymentHistory: [] });
        });
        saveData(); location.reload();
    };
    r.readAsText(e.target.files[0]);
}
window.exportCSV = function() { 
    let csv = "Name,Address,Postcode,Phone,Price,Week,Freq,Day,Notes\n"; 
    db.customers.forEach(c => { csv += `"${c.name}","${c.address}","${c.postcode}","${c.phone}",${n(c.price)},"${c.week}","${c.freq}","${c.day}","${c.notes}"\n`; }); 
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = "Hydro_Backup.csv"; link.click(); 
};
window.toggleDarkMode = function() { const isDark = document.getElementById('darkModeToggle').checked; document.body.className = isDark ? 'dark-mode' : 'light-mode'; localStorage.setItem('Hydro_Dark_Pref', isDark); };
window.closeCustomerModal = function() { document.getElementById('customerModal').style.display = 'none'; };
window.runUATClear = function() { if(confirm("WIPE EVERYTHING?")) { localStorage.clear(); location.reload(); } };
window.handleSearch = function() { renderMasterTable(); };
function editFromModal() { const name = document.getElementById('modName').innerText; const c = db.customers.find(x => x.name === name); if(c) { closeCustomerModal(); editCustomer(c.id); } }
