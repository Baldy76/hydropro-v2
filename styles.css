const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], incomeHistory: [], expenses: [], bank: {name:'', sort:'', acc:''} };
let activeMsgId = null;

const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

// --- 1. BOOT ENGINE ---
window.onload = () => {
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.customers) db.customers = [];
    if (!db.incomeHistory) db.incomeHistory = [];
    if (!db.expenses) db.expenses = [];
    
    document.getElementById('headerDate').innerText = new Date().toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
    renderAll();
};

// --- 2. DATA MANAGEMENT (macOS Numbers Compatible) ---
window.exportFullCSV = function() {
    // Header includes all scheduling and financial arrays (serialized as base64 or JSON strings to avoid comma breaks)
    let csv = "ID,Name,Address,Postcode,Phone,Price,Week,Freq,Day,Notes,Cleaned,PaidThisMonth,DebtHistory,PaymentHistory,NextDue\n";
    
    db.customers.forEach(c => {
        const row = [
            c.id,
            `"${c.name || ''}"`,
            `"${c.address || ''}"`,
            `"${c.postcode || ''}"`,
            `"${c.phone || ''}"`,
            n(c.price),
            c.week,
            c.freq || 4,
            c.day,
            `"${(c.notes || '').replace(/"/g, '""')}"`, // Escape double quotes for Numbers
            c.cleaned ? 1 : 0,
            n(c.paidThisMonth),
            `"${JSON.stringify(c.debtHistory || []).replace(/"/g, '""')}"`,
            `"${JSON.stringify(c.paymentHistory || []).replace(/"/g, '""')}"`,
            `"${c.nextDue || ''}"`
        ];
        csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `HydroPro_Backup_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

window.importFullCSV = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        const text = ev.target.result;
        const lines = text.split(/\r?\n/);
        if (lines.length <= 1) return;

        if (!confirm("This will replace your current customer list. Continue?")) return;

        const newCustomers = [];
        // Helper to parse CSV rows properly handling double quotes
        const parseCSV = (str) => {
            const arr = [];
            let quote = false;
            let col = "";
            for (let c = 0; c < str.length; c++) {
                let char = str[c], next = str[c+1];
                if (char === '"' && quote && next === '"') { col += char; c++; }
                else if (char === '"') { quote = !quote; }
                else if (char === ',' && !quote) { arr.push(col); col = ""; }
                else { col += char; }
            }
            arr.push(col);
            return arr;
        };

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const cols = parseCSV(lines[i]);
            if (cols.length < 5) continue;

            newCustomers.push({
                id: cols[0] || Date.now() + i,
                name: cols[1],
                address: cols[2],
                postcode: cols[3],
                phone: cols[4],
                price: n(cols[5]),
                week: cols[6],
                freq: cols[7],
                day: cols[8],
                notes: cols[9],
                cleaned: cols[10] == "1",
                paidThisMonth: n(cols[11]),
                debtHistory: JSON.parse(cols[12] || "[]"),
                paymentHistory: JSON.parse(cols[13] || "[]"),
                nextDue: cols[14]
            });
        }
        db.customers = newCustomers;
        saveData();
        alert("Import Successful! " + newCustomers.length + " customers loaded.");
        location.reload();
    };
    reader.readAsText(file);
};

// --- 3. PROFIT & CHART ENGINE ---
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
    let totalExp = (db.expenses || []).reduce((s, e) => s + n(e.amt), 0);

    if(document.getElementById('statGross')) document.getElementById('statGross').innerText = '£' + collM.toFixed(2);
    if(document.getElementById('statExp')) document.getElementById('statExp').innerText = '-£' + totalExp.toFixed(2);
    if(document.getElementById('statNet')) document.getElementById('statNet').innerText = '£' + (collM - totalExp).toFixed(2);
    
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

// --- 4. CORE FUNCTIONALITY (Shared with v8.0) ---
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
        ? `Hey ${c.name}, coming tomorrow to clean windows at ${c.address}. Jonathan @Hydro`
        : `Hey ${c.name}, job done! Due: £${calculateTrueDebt(c).toFixed(2)}. Bank: ${b.name}, Sort: ${b.sort}, Acc: ${b.acc}. Jonathan @Hydro`;
    window.location.href = `https://wa.me/${c.phone.replace(/\s+/g, '')}?text=${encodeURIComponent(msg)}`;
    document.getElementById('msgModal').style.display = 'none';
};

window.renderWeeks = function() {
    for(let i=1; i<=4; i++) {
        const div = document.getElementById('week' + i);
        if(!div) continue; div.innerHTML = '';
        db.customers.filter(c => String(c.week) === String(i)).forEach(c => {
            const debt = calculateTrueDebt(c);
            div.innerHTML += `<div class="customer-card ${debt > 0 ? 'has-debt' : ''}">
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
                </div>
            </div>`;
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
            body.innerHTML += `<tr onclick="openCustomerModal('${c.id}')">
                <td style="padding:15px; border-bottom:1px solid rgba(0,0,0,0.03);"><strong>${c.name}</strong><br><small style="opacity:0.6;">${c.address}</small></td>
                <td style="padding:15px; text-align:right; font-weight:900; color:${debt > 0 ? 'var(--danger)' : 'var(--accent)'}">£${debt.toFixed(2)}</td>
            </tr>`;
        }
    });
};

window.openCustomerModal = function(id) {
    const c = db.customers.find(x => String(x.id) === String(id)); if(!c) return;
    document.getElementById('modName').innerText = c.name;
    document.getElementById('modAddr').innerText = c.address + " " + (c.postcode || "");
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
    openTab(null, 'admin'); 
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

window.clearForm = function() { 
    ['editId','cName','cAddr','cPostcode','cPhone','cPrice','cNotes'].forEach(id => { document.getElementById(id).value = ''; }); 
    document.getElementById('editActions').classList.add('hidden'); 
    document.getElementById('formTitle').innerText = "Customer Entry"; 
};

// Toggle, Delete, Cycle, Expense functions from v8.0 preserved...
window.toggleDarkMode = function() { const isDark = document.getElementById('darkModeToggle').checked; document.body.className = isDark ? 'dark-mode' : 'light-mode'; localStorage.setItem('Hydro_Dark_Pref', isDark); };
window.deleteCustomer = function() { if(confirm("Delete permanently?")) { db.customers = db.customers.filter(c => String(c.id) !== String(document.getElementById('editId').value)); clearForm(); saveData(); openTab(null, 'master'); } };
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
window.handleBankAction = function() {
    const isLocked = document.getElementById('bName').disabled;
    if (isLocked) { ['bName','bSort','bAcc'].forEach(id => document.getElementById(id).disabled = false); document.getElementById('btnBankAction').innerText = "🔒 Save Details"; } 
    else { db.bank = { name: document.getElementById('bName').value, sort: document.getElementById('bSort').value, acc: document.getElementById('bAcc').value }; ['bName','bSort','bAcc'].forEach(id => document.getElementById(id).disabled = true); document.getElementById('btnBankAction').innerText = "🔓 Edit Bank Details"; saveData(); }
};
window.closeCustomerModal = function() { document.getElementById('customerModal').style.display = 'none'; };
window.runUATClear = function() { if(confirm("WIPE EVERYTHING?")) { localStorage.clear(); location.reload(); } };
window.handleSearch = function() { renderMasterTable(); };
function editFromModal() { const name = document.getElementById('modName').innerText; const c = db.customers.find(x => x.name.includes(name)); if(c) { closeCustomerModal(); editCustomer(c.id); } }
