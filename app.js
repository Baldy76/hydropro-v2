// TOP PRIORITY: NAVIGATION ENGINE
window.openTab = function(evt, name) {
    const contents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < contents.length; i++) { contents[i].classList.remove("active"); }
    const tabs = document.getElementsByClassName("tab");
    for (let i = 0; i < tabs.length; i++) { tabs[i].classList.remove("active"); }
    const target = document.getElementById(name);
    if (target) target.classList.add("active");
    if (evt) evt.currentTarget.classList.add("active");
    window.scrollTo(0, 0);
};

// 1. DATA ENGINE (PRODUCTION LOCKED)
const MASTER_KEY = 'HydroPro_App_Production';
function initData() {
    let stored = localStorage.getItem(MASTER_KEY) || localStorage.getItem('FailSafe_A');
    let data = stored ? JSON.parse(stored) : { 
        customers: [], bank: {name:'', sort:'', acc:''}, incomeHistory: [], expenses: [] 
    };
    if(!data.incomeHistory) data.incomeHistory = [];
    if(!data.customers) data.customers = [];
    if(!data.bank) data.bank = {name:'', sort:'', acc:''};
    return data;
}
let db = initData();
const n = (val) => isNaN(parseFloat(val)) ? 0 : parseFloat(val);

window.saveData = function() {
    const s = JSON.stringify(db);
    localStorage.setItem(MASTER_KEY, s);
    localStorage.setItem('FailSafe_A', s);
    window.renderAll();
};

window.calculateTrueDebt = function(c) {
    const pastDebt = (c.debtHistory || []).reduce((sum, entry) => sum + n(entry.amount), 0);
    let currentDebt = c.cleaned ? (n(c.price) - n(c.paidThisMonth)) : (0 - n(c.paidThisMonth));
    return Math.max(0, pastDebt + currentDebt);
};

// 2. RENDERING ENGINE
window.renderAll = function() {
    window.renderWeeks();
    window.renderMasterTable();
    window.renderStats();
};

window.renderWeeks = function() {
    for(let i=1; i<=4; i++) {
        const div = document.getElementById('week' + i);
        if(!div) continue;
        div.innerHTML = '';
        const list = db.customers.filter(c => c.week == i).sort((a,b) => a.cleaned - b.cleaned);
        list.forEach(c => {
            const totalDebt = window.calculateTrueDebt(c);
            let debtWarningHtml = "";
            (c.debtHistory || []).forEach(d => {
                if(n(d.amount) > 0) debtWarningHtml += `<span class="debt-warning-red">⚠️ Owed ${d.month}: £${n(d.amount).toFixed(2)}</span>`;
            });
            const currentBalance = n(c.price) - n(c.paidThisMonth);
            if(c.cleaned && currentBalance > 0) {
                debtWarningHtml += `<span class="debt-warning-red">⚠️ Unpaid Current: £${currentBalance.toFixed(2)}</span>`;
            }

            const card = document.createElement('div');
            card.className = `customer-card ${totalDebt > 0 ? 'has-debt' : ''}`;
            card.innerHTML = `
                <div onclick="window.openCustomerModal('${c.id}')">
                    <div style="display:flex; justify-content:space-between"><strong>${c.name}</strong><strong>£${n(c.price).toFixed(2)}</strong></div>
                    <small style="opacity:0.6;">${c.address}</small>
                    <div>${debtWarningHtml}</div>
                </div>
                <div class="card-action-grid">
                    <button class="icon-btn-small" onclick="window.open('http://maps.apple.com/?q=${encodeURIComponent(c.address)}')">📍 Map</button>
                    <button class="icon-btn-small" onclick="editCustomer('${c.id}')">⚙️ Edit</button>
                    <button class="btn-clean ${c.cleaned?'is-done':''}" onclick="markJobAsCleaned('${c.id}')">${c.cleaned?'Done ✅':'Clean'}</button>
                    <button class="btn-main" onclick="processPayment('${c.id}')">£${totalDebt.toFixed(2)} Pay</button>
                    <button class="icon-btn-small wa-btn" onclick="sendReminder('${c.id}','whatsapp')">💬 WA</button>
                    <button class="icon-btn-small sms-btn" onclick="sendReminder('${c.id}','sms')">📱 SMS</button>
                </div>`;
            div.appendChild(card);
        });
    }
};

window.renderMasterTable = function() {
    const s = (document.getElementById('mainSearch').value || "").toLowerCase();
    const body = document.getElementById('masterTableBody');
    if(!body) return; body.innerHTML = '';
    db.customers.sort((a,b)=>a.name.localeCompare(b.name)).forEach(c => {
        const debt = window.calculateTrueDebt(c);
        if(c.name.toLowerCase().includes(s) || (c.address||"").toLowerCase().includes(s)) {
            const tr = document.createElement('tr');
            tr.onclick = () => window.openCustomerModal(c.id);
            tr.innerHTML = `<td style="padding:15px; border-bottom:1px solid rgba(0,0,0,0.05);"><strong>${c.name}</strong><br><small>${c.address}</small></td>
                            <td style="text-align:right; padding:15px; font-weight:800; color:${debt > 0 ? 'var(--stat-owed)' : '#000'}">£${debt.toFixed(2)}</td>`;
            body.appendChild(tr);
        }
    });
};

window.renderStats = function() {
    let collM = 0, owedM = 0, projM = 0;
    db.customers.forEach(c => { projM += n(c.price); collM += n(c.paidThisMonth); if(c.cleaned) owedM += Math.max(0, n(c.price)-n(c.paidThisMonth)); });
    const pendingM = Math.max(0, projM - collM - owedM);

    document.getElementById('statCollMonth').innerText = '£' + collM.toFixed(2);
    document.getElementById('statOwedMonth').innerText = '£' + owedM.toFixed(2);
    document.getElementById('statPendingMonth').innerText = '£' + pendingM.toFixed(2);

    const style = getComputedStyle(document.body);
    const colAcc = style.getPropertyValue('--stat-collected').trim() || "#2ecc71";
    const colDan = style.getPropertyValue('--stat-owed').trim() || "#e74c3c";
    const colPen = style.getPropertyValue('--stat-pending').trim() || "#3498db";
    const colExp = "#f39c12";

    if(projM > 0) {
        const p1 = (collM / projM) * 100;
        const p2 = ((collM + owedM) / projM) * 100;
        document.getElementById('pieMonth').style.background = `conic-gradient(${colAcc} 0% ${p1}%, ${colDan} ${p1}% ${p2}%, ${colPen} ${p2}% 100%)`;
    }
    document.getElementById('legendMonth').innerHTML = `<div class="leg-item"><span><span class="dot" style="background:${colAcc}"></span>Collected</span><span>£${collM.toFixed(2)}</span></div><div class="leg-item"><span><span class="dot" style="background:${colDan}"></span>Owed</span><span>£${owedM.toFixed(2)}</span></div><div class="leg-item"><span><span class="dot" style="background:${colPen}"></span>Pending</span><span>£${pendingM.toFixed(2)}</span></div>`;

    let totalRevenue = db.incomeHistory.reduce((s, h) => s + n(h.amount), 0) + collM;
    let totalDebt = db.customers.reduce((s, c) => s + window.calculateTrueDebt(c), 0);
    let totalSpent = (db.expenses || []).reduce((s, e) => s + n(e.amt), 0);
    let footprint = totalRevenue + totalDebt + totalSpent;

    if(footprint > 0) {
        const revP = (totalRevenue / footprint) * 100;
        const debtP = ((totalRevenue + totalDebt) / footprint) * 100;
        document.getElementById('pieOverall').style.background = `conic-gradient(${colAcc} 0% ${revP}%, ${colDan} ${revP}% ${debtP}%, ${colExp} ${debtP}% 100%)`;
    }
    document.getElementById('legendOverall').innerHTML = `<div class="leg-item"><span><span class="dot" style="background:${colAcc}"></span>Total Revenue</span><span>£${totalRevenue.toFixed(2)}</span></div><div class="leg-item"><span><span class="dot" style="background:${colDan}"></span>Customer Debt</span><span>£${totalDebt.toFixed(2)}</span></div><div class="leg-item"><span><span class="dot" style="background:${colExp}"></span>Expenses</span><span>£${totalSpent.toFixed(2)}</span></div>`;
    document.getElementById('statFYTotal').innerText = '£' + totalRevenue.toFixed(2);

    const quarters = { "Q1 (Apr-Jun)": 0, "Q2 (Jul-Sep)": 0, "Q3 (Oct-Dec)": 0, "Q4 (Jan-Mar)": 0 };
    let allH = [...db.incomeHistory, { month: new Date().toLocaleDateString('en-GB', {month:'short'}), amount: collM }];
    allH.forEach(h => {
        const m = (h.month || "").toLowerCase();
        if (m.includes("apr") || m.includes("may") || m.includes("jun")) quarters["Q1 (Apr-Jun)"] += n(h.amount);
        else if (m.includes("jul") || m.includes("aug") || m.includes("sep")) quarters["Q2 (Jul-Sep)"] += n(h.amount);
        else if (m.includes("oct") || m.includes("nov") || m.includes("dec")) quarters["Q3 (Oct-Dec)"] += n(h.amount);
        else if (m.includes("jan") || m.includes("feb") || m.includes("mar")) quarters["Q4 (Jan-Mar)"] += n(h.amount);
    });
    const qBody = document.getElementById('quarterlyTableBody');
    if(qBody) { qBody.innerHTML = ''; for(let q in quarters) { qBody.innerHTML += `<tr><td style="padding:10px 0;">${q}</td><td style="text-align:right; font-weight:800;">£${quarters[q].toFixed(2)}</td></tr>`; } }
};

// 3. MESSAGING ENGINE (THE FINAL WORDING)
window.sendReminder = function(id, type) {
    const c = db.customers.find(x => String(x.id) === String(id));
    if(!c) return;
    
    const bank = db.bank || {name:'', sort:'', acc:''};
    const bankStr = bank.name ? `\n\nBank Details:\nAccount: ${bank.name}\nSort Code: ${bank.sort}\nAccount No: ${bank.acc}` : "";
    
    // Requested wording
    const msg = `Hey ${c.name}, just to let you know that your windows were washed today at ${c.address}, ${c.postcode || ''}. Please find my bank details below if you wish to pay via bank transfer of £${n(c.price).toFixed(2)}. Thanks for your business Jonathan@Hydro${bankStr}`;
    
    const encoded = encodeURIComponent(msg);
    const phone = c.phone ? c.phone.replace(/\s+/g, '') : "";

    if (type === 'whatsapp') {
        window.location.href = `https://wa.me/${phone}?text=${encoded}`;
    } else {
        const separator = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? '&' : '?';
        window.location.href = `sms:${phone}${separator}body=${encoded}`;
    }
};

// 4. CORE ACTIONS
window.markJobAsCleaned = function(id) {
    const c = db.customers.find(x => String(x.id) === String(id));
    if (c) { c.cleaned = true; window.saveData(); alert(`Well done that's ${c.name}'s windows all cleaned. Now to collect the cash!`); }
};

window.processPayment = function(id) {
    const c = db.customers.find(x => String(x.id) === String(id));
    if(!c) return;
    const due = window.calculateTrueDebt(c);
    let pay = prompt(`Amount Paid?`, due.toFixed(2));
    if(pay === null) return;
    c.paidThisMonth += n(pay); window.saveData();
};

window.openCustomerModal = function(id) {
    const c = db.customers.find(x => String(x.id) === String(id));
    if(!c) return;
    document.getElementById('modName').innerText = c.name;
    document.getElementById('modAddr').innerText = (c.address || '') + ', ' + (c.postcode || '');
    const body = document.getElementById('modHistoryTable'); body.innerHTML = '';
    let totalDebt = 0;
    const curDebt = n(c.price) - n(c.paidThisMonth);
    let curStatus = c.cleaned ? (curDebt <= 0 ? `<td class="status-paid">Paid ✅</td>` : `<td class="status-owed">Owes £${curDebt.toFixed(2)}</td>`) : `<td class="status-tbc">TBC</td>`;
    if(c.cleaned && curDebt > 0) totalDebt += curDebt;
    body.innerHTML += `<tr><td>Current Job</td>${curStatus}</tr>`;
    (db.incomeHistory || []).forEach(h => {
        const debtEntry = (c.debtHistory || []).find(d => d.month === h.month);
        let status = debtEntry ? `<td class="status-owed">Owes £${n(debtEntry.amount).toFixed(2)}</td>` : `<td class="status-paid">Paid ✅</td>`;
        if(debtEntry) totalDebt += n(debtEntry.amount);
        body.innerHTML += `<tr><td>${h.month}</td>${status}</tr>`;
    });
    const o = document.getElementById('modOwed'); o.innerText = '£' + totalDebt.toFixed(2);
    o.style.color = totalDebt <= 0 ? "#000" : "var(--danger)";
    document.getElementById('customerModal').style.display = 'flex';
};

window.closeCustomerModal = function() { document.getElementById('customerModal').style.display = 'none'; };

window.saveCustomer = function() {
    const id = document.getElementById('editId').value;
    const entry = {
        id: id || Date.now(), name: document.getElementById('cName').value, address: document.getElementById('cAddr').value,
        postcode: document.getElementById('cPostcode').value, phone: document.getElementById('cPhone').value,
        price: n(document.getElementById('cPrice').value), week: n(document.getElementById('cWeek').value), 
        day: document.getElementById('cDay').value, notes: document.getElementById('cNotes').value,
        cleaned: false, paidThisMonth: 0, debtHistory: []
    };
    if(!entry.name) return;
    if(id) { 
        const idx = db.customers.findIndex(c => String(c.id) === String(id)); 
        if(idx > -1) { entry.cleaned = db.customers[idx].cleaned; entry.paidThisMonth = db.customers[idx].paidThisMonth; entry.debtHistory = db.customers[idx].debtHistory || []; db.customers[idx] = entry; } 
    } else { db.customers.push(entry); }
    window.clearForm(); window.saveData(); window.openTab(null, 'master');
};
window.clearForm = function() { ['editId','cName','cAddr','cPostcode','cPhone','cPrice','cNotes'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; }); document.getElementById('cancelEdit').style.display='none'; document.getElementById('btnDeleteCust').style.display='none'; };
window.editCustomer = function(id) { const c = db.customers.find(x => String(x.id) === String(id)); if(!c) return; document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cAddr').value = c.address; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cPhone').value = c.phone; document.getElementById('cPrice').value = c.price; document.getElementById('cWeek').value = c.week; document.getElementById('cDay').value = c.day; document.getElementById('cNotes').value = c.notes; document.getElementById('cancelEdit').style.display = 'block'; document.getElementById('btnDeleteCust').style.display = 'block'; window.openTab(null, 'admin'); };
window.editFromModal = function() { const n_ = document.getElementById('modName').innerText; const c = db.customers.find(x => x.name === n_); window.closeCustomerModal(); if(c) window.editCustomer(c.id); };
window.handleSearch = function() { window.renderMasterTable(); };
window.addExpense = function() { const v = n(document.getElementById('expAmount').value); if(v > 0) { db.expenses.push({amt: v}); window.saveData(); document.getElementById('expAmount').value=''; } };
window.runUATClear = function() { if(confirm("Wipe finances?")) { localStorage.clear(); location.reload(); } };
window.unlockBank = function() { ['bName','bSort','bAcc'].forEach(id => document.getElementById(id).disabled = false); document.getElementById('editBankBtn').style.display = "none"; document.getElementById('btnBankSave').style.display = "block"; };
window.lockAndSaveBank = function() { db.bank = { name: document.getElementById('bName').value, sort: document.getElementById('bSort').value, acc: document.getElementById('bAcc').value }; ['bName','bSort','bAcc'].forEach(id => document.getElementById(id).disabled = true); document.getElementById('editBankBtn').style.display = "block"; document.getElementById('btnBankSave').style.display = "none"; window.saveData(); };

window.completeCycle = function() { 
    if(!confirm("Start New Month? Debt carries forward.")) return;
    const label = new Date().toLocaleDateString('en-GB', {month:'short'});
    db.incomeHistory.push({ month: label, amount: db.customers.reduce((s,c) => s + n(c.paidThisMonth), 0) });
    db.customers.forEach(c => { const o = window.calculateTrueDebt(c); if(o > 0) { c.debtHistory = c.debtHistory || []; c.debtHistory.push({ month: label, amount: o }); } c.cleaned = false; c.paidThisMonth = 0; });
    window.saveData();
};
window.exportCSV = function() { let csv = "Name,Address,Price\n" + db.customers.map(c => `"${c.name}","${c.address}",${n(c.price)}`).join("\n"); const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = "Hydro_Backup.csv"; link.click(); };
window.importCSV = function(e) { const r = new FileReader(); r.onload = (ev) => { const lines = ev.target.result.split('\n'); lines.slice(1).forEach(line => { const cols = line.split(',').map(c => c.replace(/"/g, '').trim()); if(cols.length >= 3) db.customers.push({ id: Date.now()+Math.random(), name: cols[0], address: cols[1], price: n(cols[2]), cleaned: false, paidThisMonth: 0, debtHistory: [] }); }); window.saveData(); }; r.readAsText(e.target.files[0]); };

window.onload = () => {
    document.getElementById('headerDate').innerText = new Date().toLocaleDateString('en-GB', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
    const bank = db.bank || {}; document.getElementById('bName').value = bank.name || ''; document.getElementById('bSort').value = bank.sort || ''; document.getElementById('bAcc').value = bank.acc || '';
    window.renderAll();
};
