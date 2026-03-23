const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], incomeHistory: [], expenses: [], bank: {name:'', sort:'', acc:''} };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

function getFullDate() {
    const d = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const date = d.getDate();
    let suffix = "th";
    if (date < 11 || date > 13) {
        switch (date % 10) {
            case 1: suffix = "st"; break;
            case 2: suffix = "nd"; break;
            case 3: suffix = "rd"; break;
        }
    }
    return `${days[d.getDay()]} ${date}${suffix} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

window.onload = () => {
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.customers) db.customers = [];
    if (!db.incomeHistory) db.incomeHistory = [];
    document.getElementById('headerDate').innerText = getFullDate();
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    document.getElementById('darkModeToggle').checked = isDark;
    const b = db.bank || {}; 
    document.getElementById('bName').value = b.name || ''; 
    document.getElementById('bSort').value = b.sort || ''; 
    document.getElementById('bAcc').value = b.acc || '';
    renderAll();
};

window.openTab = function(evt, name) {
    const contents = document.getElementsByClassName("tab-content");
    const tabs = document.getElementsByClassName("tab");
    for (let i = 0; i < contents.length; i++) contents[i].classList.remove("active");
    for (let i = 0; i < tabs.length; i++) tabs[i].classList.remove("active");
    document.getElementById(name).classList.add("active");
    if (evt) evt.currentTarget.classList.add("active");
    if (name === 'master') renderMasterTable();
    if (name === 'stats') renderStats();
    if (name.startsWith('week')) renderWeeks();
    window.scrollTo(0,0);
};

window.saveData = function() {
    localStorage.setItem(MASTER_KEY, JSON.stringify(db));
    renderAll();
};

window.calculateTrueDebt = function(c) {
    if (!c) return 0;
    const past = (c.debtHistory || []).reduce((s, e) => s + n(e.amount), 0);
    const current = c.cleaned ? (n(c.price) - n(c.paidThisMonth)) : (0 - n(c.paidThisMonth));
    return Math.max(0, past + current);
};

window.renderAll = function() {
    renderMasterTable();
    renderStats();
    renderWeeks();
};

window.renderWeeks = function() {
    for(let i=1; i<=4; i++) {
        const div = document.getElementById('week' + i);
        if(!div) continue; div.innerHTML = '';
        db.customers.filter(c => String(c.week) === String(i)).forEach(c => {
            const debt = calculateTrueDebt(c);
            let card = document.createElement('div');
            card.className = `customer-card ${debt > 0 ? 'has-debt' : ''}`;
            card.innerHTML = `<div onclick="openCustomerModal('${c.id}')"><div style="display:flex; justify-content:space-between"><strong>${c.name}</strong><strong>£${n(c.price).toFixed(2)}</strong></div><small style="opacity:0.6">${c.address}</small></div><div class="card-action-grid"><button class="icon-btn-small" onclick="window.open('http://maps.apple.com/?q=${encodeURIComponent(c.address)}')">📍 Map</button><button class="icon-btn-small" onclick="editCustomer('${c.id}')">⚙️ Edit</button><button class="icon-btn-small ${c.cleaned?'wa-btn':''}" onclick="markJobAsCleaned('${c.id}')">${c.cleaned?'Done ✅':'Clean'}</button><button class="btn-main" onclick="processPayment('${c.id}')">£${debt.toFixed(2)} Pay</button><button class="icon-btn-small wa-btn" onclick="sendReminder('${c.id}','whatsapp')">💬 WA</button><button class="icon-btn-small sms-btn" onclick="sendReminder('${c.id}','sms')">📱 SMS</button></div>`;
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

window.renderStats = function() {
    let collM = 0, owedM = 0, projM = 0;
    db.customers.forEach(c => { projM += n(c.price); collM += n(c.paidThisMonth); if(c.cleaned) owedM += Math.max(0, n(c.price)-n(c.paidThisMonth)); });
    if(document.getElementById('statCollMonth')) document.getElementById('statCollMonth').innerText = '£' + collM.toFixed(2);
    if(document.getElementById('statOwedMonth')) document.getElementById('statOwedMonth').innerText = '£' + owedM.toFixed(2);
    if(document.getElementById('statPendingMonth')) document.getElementById('statPendingMonth').innerText = '£' + Math.max(0, projM - collM - owedM).toFixed(2);
    const historyTotal = db.incomeHistory.reduce((s, h) => s + n(h.amount), 0);
    if(document.getElementById('statFYTotal')) document.getElementById('statFYTotal').innerText = '£' + (historyTotal + collM).toFixed(2);
    const histBody = document.getElementById('overallHistoryBody');
    if(histBody) {
        histBody.innerHTML = '';
        [...db.incomeHistory].reverse().forEach(h => {
            histBody.innerHTML += `<tr><td style="padding:10px 0; border-bottom:1px solid rgba(0,0,0,0.05);">${h.month}</td><td style="padding:10px 0; text-align:right; font-weight:700;">£${n(h.amount).toFixed(2)}</td></tr>`;
        });
    }
};

window.completeCycle = function() {
    if(!confirm("Start New Month? Unpaid current moves to debt.")) return;
    const label = new Date().toLocaleDateString('en-GB', {month:'short', year:'2-digit'});
    db.incomeHistory.push({ month: label, amount: db.customers.reduce((s,c) => s + n(c.paidThisMonth), 0) });
    db.customers.forEach(c => {
        if(!c.paymentHistory) c.paymentHistory = [];
        if(n(c.paidThisMonth) > 0) c.paymentHistory.push({ month: label, amount: n(c.paidThisMonth) });
        
        const o = calculateTrueDebt(c);
        if(o > 0) {
            c.debtHistory = c.debtHistory || [];
            const existing = c.debtHistory.find(h => h.month === label);
            if(existing) existing.amount = n(existing.amount) + o;
            else c.debtHistory.push({ month: label, amount: o });
        }
        c.cleaned = false; c.paidThisMonth = 0;
    });
    saveData();
};

window.processPayment = function(id) {
    const c = db.customers.find(x => String(x.id) === String(id)); if(!c) return;
    const amt = prompt("Payment amount?", calculateTrueDebt(c).toFixed(2));
    if(amt === null) return;
    let pay = n(amt);
    if(c.debtHistory && c.debtHistory.length > 0) {
        for(let i=0; i<c.debtHistory.length; i++) {
            if(pay <= 0) break;
            let owe = n(c.debtHistory[i].amount);
            if(pay >= owe) { pay -= owe; c.debtHistory[i].amount = 0; }
            else { c.debtHistory[i].amount = owe - pay; pay = 0; }
        }
        c.debtHistory = c.debtHistory.filter(h => n(h.amount) > 0);
    }
    c.paidThisMonth += pay;
    saveData();
};

window.openCustomerModal = function(id) {
    const c = db.customers.find(x => String(x.id) === String(id)); if(!c) return;
    document.getElementById('modName').innerText = c.name;
    document.getElementById('modAddr').innerText = (c.address || "") + " " + (c.postcode || "");
    
    // NEW: Current Paid Display
    document.getElementById('modPaidNow').innerText = '£' + n(c.paidThisMonth).toFixed(2);
    
    const totalDebt = calculateTrueDebt(c);
    document.getElementById('modOwed').innerText = '£' + totalDebt.toFixed(2);
    document.getElementById('modOwed').style.color = totalDebt > 0 ? 'var(--danger)' : 'var(--stat-collected)';
    
    let ledgerHtml = "";
    const allMonths = [...new Set([...(c.debtHistory||[]).map(d=>d.month), ...(c.paymentHistory||[]).map(p=>p.month)])];
    
    if(allMonths.length > 0) {
        allMonths.forEach(m => {
            const d = (c.debtHistory||[]).find(x => x.month === m);
            const p = (c.paymentHistory||[]).find(x => x.month === m);
            if(d) { ledgerHtml += `<div class="ledger-row text-debt"><span>${m}: OWED</span><span>£${n(d.amount).toFixed(2)}</span></div>`; }
            else if(p) { ledgerHtml += `<div class="ledger-row text-paid"><span>${m}: PAID ✅</span><span>£${n(p.amount).toFixed(2)}</span></div>`; }
        });
    } else { ledgerHtml = "<div style='opacity:0.5; text-align:center; padding:10px;'>No history yet.</div>"; }

    document.getElementById('ledgerBox').innerHTML = ledgerHtml;
    document.getElementById('customerModal').style.display = 'flex';
};

window.saveCustomer = function() {
    const id = document.getElementById('editId').value || Date.now();
    const name = document.getElementById('cName').value; if(!name) return;
    const entry = { id: id, name: name, address: document.getElementById('cAddr').value, postcode: document.getElementById('cPostcode').value, phone: document.getElementById('cPhone').value, price: n(document.getElementById('cPrice').value), week: document.getElementById('cWeek').value, day: document.getElementById('cDay').value, notes: document.getElementById('cNotes').value, cleaned: false, paidThisMonth: 0, debtHistory: [], paymentHistory: [] };
    const idx = db.customers.findIndex(x => String(x.id) === String(id));
    if(idx > -1) { const old = db.customers[idx]; entry.cleaned = old.cleaned; entry.paidThisMonth = old.paidThisMonth; entry.debtHistory = old.debtHistory || []; entry.paymentHistory = old.paymentHistory || []; db.customers[idx] = entry; } 
    else { db.customers.push(entry); }
    clearForm(); saveData(); openTab(null, 'master');
};

window.editCustomer = function(id) { 
    const c = db.customers.find(x => String(x.id) === String(id)); if(!c) return; 
    document.getElementById('editId').value = c.id; 
    document.getElementById('cName').value = c.name; document.getElementById('cAddr').value = c.address; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cPhone').value = c.phone; document.getElementById('cPrice').value = c.price; document.getElementById('cWeek').value = c.week; document.getElementById('cDay').value = c.day; document.getElementById('cNotes').value = c.notes; 
    document.getElementById('editActions').classList.remove('hidden'); document.getElementById('formTitle').innerText = "Edit Customer"; 
    window.openTab(null, 'admin'); 
};

window.clearForm = function() { ['editId','cName','cAddr','cPostcode','cPhone','cPrice','cNotes'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; }); document.getElementById('editActions').classList.add('hidden'); document.getElementById('formTitle').innerText = "Customer Entry"; };
window.handleBankAction = function() {
    const isLocked = document.getElementById('bName').disabled;
    if (isLocked) {
        ['bName','bSort','bAcc'].forEach(id => document.getElementById(id).disabled = false);
        document.getElementById('btnBankAction').innerText = "🔒 Save & Lock Details";
        document.getElementById('btnBankAction').classList.add('btn-save-state');
    } else {
        db.bank = { name: document.getElementById('bName').value, sort: document.getElementById('bSort').value, acc: document.getElementById('bAcc').value };
        ['bName','bSort','bAcc'].forEach(id => document.getElementById(id).disabled = true);
        document.getElementById('btnBankAction').innerText = "🔓 Edit Bank Details";
        document.getElementById('btnBankAction').classList.remove('btn-save-state');
        saveData();
    }
};
window.deleteCustomer = function() { const id = document.getElementById('editId').value; if(id && confirm("Delete permanently?")) { db.customers = db.customers.filter(c => String(c.id) !== String(id)); clearForm(); saveData(); openTab(null, 'master'); } };
window.sendReminder = function(id, type) {
    const c = db.customers.find(x => String(x.id) === String(id)); if(!c) return;
    const b = db.bank || {name:'', sort:'', acc:''};
    const bankStr = b.name ? `\n\nBank: ${b.name}\nSort: ${b.sort}\nAcc: ${b.acc}` : "";
    const msg = `Hey ${c.name}, windows washed at ${c.address}. Total: £${calculateTrueDebt(c).toFixed(2)}. Jonathan@Hydro${bankStr}`;
    const encoded = encodeURIComponent(msg), phone = c.phone.replace(/\s+/g, '');
    if (type === 'whatsapp') { window.location.href = `https://wa.me/${phone}?text=${encoded}`; }
    else { window.location.href = `sms:${phone}${/iPhone/i.test(navigator.userAgent)?'&':'?'}body=${encoded}`; }
};
window.importCSV = function(e) {
    const r = new FileReader(); r.onload = (ev) => {
        const l = ev.target.result.split('\n'); if(l.length <= 1) return;
        if(!confirm("Append to current list?")) db.customers = [];
        l.slice(1).forEach(line => {
            const cols = line.split(',').map(c => c.replace(/"/g, '').trim());
            if(cols.length >= 5) db.customers.push({ id: Date.now()+Math.random(), name: cols[0], address: cols[1], postcode: cols[2], phone: cols[3], price: n(cols[4]), week: cols[5]||'1', day: cols[6]||'Monday', notes: cols[7]||'', cleaned: false, paidThisMonth: 0, debtHistory: [], paymentHistory: [] });
        });
        saveData(); location.reload();
    };
    r.readAsText(e.target.files[0]);
};
window.markJobAsCleaned = function(id) { const c = db.customers.find(x => String(x.id) === String(id)); if(c) { c.cleaned = true; saveData(); } };
window.closeCustomerModal = function() { document.getElementById('customerModal').style.display = 'none'; };
window.runUATClear = function() { if(confirm("WIPE EVERYTHING?")) { localStorage.clear(); location.reload(); } };
window.handleSearch = function() { renderMasterTable(); };
window.toggleDarkMode = function() { const isDark = document.getElementById('darkModeToggle').checked; document.body.className = isDark ? 'dark-mode' : 'light-mode'; localStorage.setItem('Hydro_Dark_Pref', isDark); };
window.exportCSV = function() { let csv = "Name,Address,Postcode,Phone,Price,Week,Day,Notes\n"; db.customers.forEach(c => { csv += `"${c.name}","${c.address}","${c.postcode}","${c.phone}",${n(c.price)},"${c.week}","${c.day}","${c.notes}"\n`; }); const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = "Hydro_Backup.csv"; link.click(); };
function editFromModal() { const name = document.getElementById('modName').innerText; const c = db.customers.find(x => x.name === name); if(c) { closeCustomerModal(); editCustomer(c.id); } }
window.addExpense = function() { const v = n(document.getElementById('expAmount').value); if(v > 0) { if(!db.expenses) db.expenses = []; db.expenses.push({amt: v, name: document.getElementById('expName').value || 'Expense'}); saveData(); document.getElementById('expAmount').value=''; } };
