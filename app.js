// 1. NAVIGATION
window.openTab = function(evt, name) {
    const contents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < contents.length; i++) contents[i].classList.remove("active");
    const tabs = document.getElementsByClassName("tab");
    for (let i = 0; i < tabs.length; i++) tabs[i].classList.remove("active");
    document.getElementById(name).classList.add("active");
    if (evt) evt.currentTarget.classList.add("active");
    window.scrollTo(0,0);
};

// 2. DATA ENGINE
const MASTER_KEY = 'HydroPro_App_Production';
let db = JSON.parse(localStorage.getItem(MASTER_KEY)) || { 
    customers: [], incomeHistory: [], expenses: [], bank: {name:'', sort:'', acc:''} 
};
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.saveData = function() {
    localStorage.setItem(MASTER_KEY, JSON.stringify(db));
    renderAll();
};

window.calculateTrueDebt = function(c) {
    const past = (c.debtHistory || []).reduce((s, e) => s + n(e.amount), 0);
    const current = c.cleaned ? (n(c.price) - n(c.paidThisMonth)) : (0 - n(c.paidThisMonth));
    return Math.max(0, past + current);
};

// 3. UI RENDERING
window.renderAll = function() {
    window.renderWeeks();
    window.renderMasterTable();
    window.renderStats();
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
                </div>
                <div class="card-action-grid">
                    <button class="icon-btn-small" onclick="window.open('http://maps.apple.com/?q=${encodeURIComponent(c.address)}')">📍 Map</button>
                    <button class="icon-btn-small" onclick="editCustomer('${c.id}')">⚙️ Edit</button>
                    <button class="icon-btn-small ${c.cleaned?'wa-btn':''}" onclick="markJobAsCleaned('${c.id}')">${c.cleaned?'Done ✅':'Clean'}</button>
                    <button class="btn-main" onclick="processPayment('${c.id}')">£${debt.toFixed(2)} Pay</button>
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
    [...db.customers].sort((a,b) => a.name.localeCompare(b.name)).forEach(c => {
        if(c.name.toLowerCase().includes(s) || (c.address||"").toLowerCase().includes(s)) {
            const debt = calculateTrueDebt(c);
            const tr = document.createElement('tr');
            tr.onclick = () => openCustomerModal(c.id);
            tr.innerHTML = `<td style="padding:15px;"><strong>${c.name}</strong><br><small>${c.address}</small></td>
                            <td style="padding:15px; text-align:right; font-weight:900; color:${debt>0?'var(--stat-owed)':'#000'}">£${debt.toFixed(2)}</td>`;
            body.appendChild(tr);
        }
    });
};

window.renderStats = function() {
    let collM = 0, owedM = 0, projM = 0;
    db.customers.forEach(c => { projM += n(c.price); collM += n(c.paidThisMonth); if(c.cleaned) owedM += Math.max(0, n(c.price)-n(c.paidThisMonth)); });
    document.getElementById('statCollMonth').innerText = '£' + collM.toFixed(2);
    document.getElementById('statOwedMonth').innerText = '£' + owedM.toFixed(2);
    document.getElementById('statPendingMonth').innerText = '£' + Math.max(0, projM - collM - owedM).toFixed(2);
};

// 4. SMART BANK TOGGLE
window.handleBankAction = function() {
    const btn = document.getElementById('btnBankAction');
    const fields = ['bName', 'bSort', 'bAcc'];
    const isLocked = document.getElementById('bName').disabled;

    if (isLocked) {
        fields.forEach(id => document.getElementById(id).disabled = false);
        btn.innerText = "🔒 Save & Lock Details";
        btn.classList.replace('btn-alt', 'btn-save-state');
    } else {
        db.bank = { name: document.getElementById('bName').value, sort: document.getElementById('bSort').value, acc: document.getElementById('bAcc').value };
        fields.forEach(id => document.getElementById(id).disabled = true);
        btn.innerText = "🔓 Edit Bank Details";
        btn.classList.replace('btn-save-state', 'btn-alt');
        window.saveData();
    }
};

// 5. CORE ACTIONS
window.saveCustomer = function() {
    const id = document.getElementById('editId').value || Date.now();
    const name = document.getElementById('cName').value;
    if(!name) { alert("Name Required"); return; }
    const entry = { id: id, name: name, address: document.getElementById('cAddr').value, postcode: document.getElementById('cPostcode').value, phone: document.getElementById('cPhone').value, price: n(document.getElementById('cPrice').value), week: document.getElementById('cWeek').value, day: document.getElementById('cDay').value, notes: document.getElementById('cNotes').value, cleaned: false, paidThisMonth: 0, debtHistory: [] };
    const idx = db.customers.findIndex(x => String(x.id) === String(id));
    if(idx > -1) { entry.cleaned = db.customers[idx].cleaned; entry.paidThisMonth = db.customers[idx].paidThisMonth; entry.debtHistory = db.customers[idx].debtHistory || []; db.customers[idx] = entry; } 
    else { db.customers.push(entry); }
    window.clearForm(); window.saveData(); window.openTab(null, 'master');
};

window.editCustomer = function(id) { 
    const c = db.customers.find(x => String(x.id) === String(id)); if(!c) return; 
    document.getElementById('editId').value = c.id; 
    document.getElementById('cName').value = c.name; document.getElementById('cAddr').value = c.address; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cPhone').value = c.phone; document.getElementById('cPrice').value = c.price; document.getElementById('cWeek').value = c.week; document.getElementById('cDay').value = c.day; document.getElementById('cNotes').value = c.notes; 
    document.getElementById('editActions').classList.remove('hidden'); document.getElementById('formTitle').innerText = "Edit Customer"; 
    window.openTab(null, 'admin'); 
};

window.clearForm = function() { ['editId','cName','cAddr','cPostcode','cPhone','cPrice','cNotes'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; }); document.getElementById('editActions').classList.add('hidden'); document.getElementById('formTitle').innerText = "Customer Entry"; };

window.toggleDarkMode = function() { const isDark = document.getElementById('darkModeToggle').checked; document.body.className = isDark ? 'dark-mode' : 'light-mode'; localStorage.setItem('Hydro_Dark_Pref', isDark); };

window.onload = () => {
    document.getElementById('headerDate').innerText = new Date().toDateString();
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    document.getElementById('darkModeToggle').checked = isDark;
    const b = db.bank || {}; document.getElementById('bName').value = b.name || ''; document.getElementById('bSort').value = b.sort || ''; document.getElementById('bAcc').value = b.acc || '';
    window.clearForm(); window.renderAll();
};

window.deleteCustomer = function() { const id = document.getElementById('editId').value; if(id && confirm("Delete permanently?")) { db.customers = db.customers.filter(c => String(c.id) !== String(id)); window.clearForm(); window.saveData(); window.openTab(null, 'master'); } };

window.sendReminder = function(id, type) {
    const c = db.customers.find(x => String(x.id) === String(id)); if(!c) return;
    const b = db.bank || {name:'', sort:'', acc:''};
    const msg = `Hey ${c.name}, just to let you know that your windows were washed today at ${c.address}, ${c.postcode || ''}. Please find my bank details below if you wish to pay via bank transfer of £${n(c.price).toFixed(2)}. Thanks for your business Jonathan@Hydro\n\nBank: ${b.name}\nSort: ${b.sort}\nAcc: ${b.acc}`;
    const encoded = encodeURIComponent(msg), phone = c.phone.replace(/\s+/g, '');
    if (type === 'whatsapp') { window.location.href = `https://wa.me/${phone}?text=${encoded}`; } else { window.location.href = `sms:${phone}${/iPhone/i.test(navigator.userAgent)?'&':'?'}body=${encoded}`; }
};

window.exportCSV = function() {
    let csv = "Name,Address,Postcode,Phone,Price,Week,Day,Notes\n";
    db.customers.forEach(c => { csv += `"${c.name}","${c.address}","${c.postcode}","${c.phone}",${n(c.price)},"${c.week}","${c.day}","${c.notes}"\n`; });
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = "Hydro_Backup.csv"; link.click();
};

window.importCSV = function(e) {
    const r = new FileReader(); r.onload = (ev) => {
        const l = ev.target.result.split('\n'); if(l.length <= 1) return;
        if(!confirm("Append to current list? (Cancel to overwrite)")) db.customers = [];
        l.slice(1).forEach(line => {
            const cols = line.split(',').map(c => c.replace(/"/g, '').trim());
            if(cols.length >= 5) db.customers.push({ id: Date.now()+Math.random(), name: cols[0], address: cols[1], postcode: cols[2], phone: cols[3], price: n(cols[4]), week: cols[5]||'1', day: cols[6]||'Monday', notes: cols[7]||'', cleaned: false, paidThisMonth: 0, debtHistory: [] });
        });
        window.saveData(); alert("Imported!");
    };
    r.readAsText(e.target.files[0]);
};

window.markJobAsCleaned = function(id) { const c = db.customers.find(x => String(x.id) === String(id)); if(c) { c.cleaned = true; window.saveData(); } };
window.processPayment = function(id) { const c = db.customers.find(x => String(x.id) === String(id)); if(!c) return; const amt = prompt("Amount Paid?", calculateTrueDebt(c).toFixed(2)); if(amt) { c.paidThisMonth += n(amt); window.saveData(); } };
window.completeCycle = function() { if(!confirm("Start New Month? Debt carries forward.")) return; const label = new Date().toLocaleDateString('en-GB', {month:'short'}); db.incomeHistory.push({ month: label, amount: db.customers.reduce((s,c) => s + n(c.paidThisMonth), 0) }); db.customers.forEach(c => { const o = calculateTrueDebt(c); if(o > 0) { c.debtHistory = c.debtHistory || []; c.debtHistory.push({ month: label, amount: o }); } c.cleaned = false; c.paidThisMonth = 0; }); window.saveData(); };
window.openCustomerModal = function(id) { const c = db.customers.find(x => String(x.id) === String(id)); document.getElementById('modName').innerText = c.name; document.getElementById('modAddr').innerText = (c.address || "") + " " + (c.postcode || ""); document.getElementById('modOwed').innerText = '£' + calculateTrueDebt(c).toFixed(2); document.getElementById('customerModal').style.display = 'flex'; };
window.closeCustomerModal = function() { document.getElementById('customerModal').style.display = 'none'; };
window.runUATClear = function() { if(confirm("WIPE EVERYTHING?")) { localStorage.clear(); location.reload(); } };
window.handleSearch = function() { window.renderMasterTable(); };
window.addExpense = function() { const v = n(document.getElementById('expAmount').value); if(v > 0) { if(!db.expenses) db.expenses = []; db.expenses.push({amt: v, name: document.getElementById('expName').value || 'Expense'}); window.saveData(); document.getElementById('expAmount').value=''; } };
