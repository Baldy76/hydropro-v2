const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], incomeHistory: [], expenses: [], bank: {name:'', sort:'', acc:''} };
let activeMsgId = null;

const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

// --- BOOT ENGINE ---
window.onload = () => {
    const dateElement = document.getElementById('headerDate');
    if (dateElement) {
        dateElement.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) {
        try { db = JSON.parse(saved); } catch (e) { console.error("Data error"); }
    }
    
    if (!db.customers) db.customers = [];
    if (!db.incomeHistory) db.incomeHistory = [];
    if (!db.expenses) db.expenses = [];
    
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if (document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    
    renderAll();
};

// --- TAB ENGINE ---
window.openTab = function(evt, name) {
    const contents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < contents.length; i++) {
        contents[i].style.display = "none";
        contents[i].classList.remove("active");
    }

    const tabs = document.getElementsByClassName("tab");
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove("active");
    }

    const target = document.getElementById(name);
    if (target) {
        target.style.display = "block";
        target.classList.add("active");
    }

    if (evt) evt.currentTarget.classList.add("active");

    renderAll();
    window.scrollTo(0,0);
};

// --- RENDERERS ---
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
            card.className = `customer-card fade-in ${debt > 0 ? 'has-debt' : ''}`;
            card.innerHTML = `
                <div class="card-status-bar"></div>
                <div class="card-main-content" onclick="openCustomerModal('${c.id}')">
                    <div class="card-title-row">
                        <span class="card-name">${c.name}</span>
                        <span class="card-price">£${n(c.price).toFixed(2)}</span>
                    </div>
                    <span class="card-addr">${c.address}</span>
                </div>
                <div class="card-actions-wrapper">
                    <div class="action-sub-grid">
                        <button class="btn-admin-small full-width-btn" onclick="openMessageTemplates('${c.id}')">💬 Message</button>
                        <button class="btn-admin-small full-width-btn" onclick="editCustomer('${c.id}')">⚙️ Edit</button>
                    </div>
                    <div class="action-sub-grid">
                        <button class="btn-main btn-work" onclick="markJobAsCleaned('${c.id}')">${isCleaned?'Done ✅':'Clean'}</button>
                        <button class="btn-alt btn-work" onclick="processPayment('${c.id}')">Payment</button>
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
    [...db.customers].sort((a,b) => a.name.localeCompare(b.name)).forEach(c => {
        if(search === "" || c.name.toLowerCase().includes(search) || c.address.toLowerCase().includes(search)) {
            const debt = calculateTrueDebt(c);
            const row = document.createElement('div');
            row.className = 'master-row-card';
            row.onclick = () => openCustomerModal(c.id);
            row.innerHTML = `
                <div>
                    <div style="font-weight:700; font-size:16px;">${c.name}</div>
                    <div style="font-size:13px; opacity:0.5;">${c.address}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:800; color:${debt > 0 ? 'var(--danger)' : 'var(--success)'}; font-size:18px;">£${debt.toFixed(2)}</div>
                    <small style="font-size:10px; opacity:0.4; font-weight:700;">BALANCE</small>
                </div>`;
            body.appendChild(row);
        }
    });
};

window.renderStats = function() {
    let collM = 0, owedM = 0, projM = 0;
    db.customers.forEach(c => { 
        projM += n(c.price); collM += n(c.paidThisMonth); 
        if(c.cleaned) owedM += Math.max(0, n(c.price)-n(c.paidThisMonth)); 
    });
    let pendM = Math.max(0, projM - collM - owedM);
    let totalExp = (db.expenses||[]).reduce((s, e) => s + n(e.amt), 0);

    if(document.getElementById('statGross')) document.getElementById('statGross').innerText = '£' + collM.toFixed(2);
    if(document.getElementById('statExp')) document.getElementById('statExp').innerText = '£' + totalExp.toFixed(2);
    if(document.getElementById('statNet')) document.getElementById('statNet').innerText = '£' + (collM - totalExp).toFixed(2);
    
    updatePieChart(collM, owedM, pendM);
};

// --- CORE FUNCTIONS ---
window.saveData = function() { localStorage.setItem(MASTER_KEY, JSON.stringify(db)); renderAll(); };

window.calculateTrueDebt = function(c) {
    if (!c) return 0;
    const past = (c.debtHistory || []).reduce((s, e) => s + n(e.amount), 0);
    const current = c.cleaned ? (n(c.price) - n(c.paidThisMonth)) : (0 - n(c.paidThisMonth));
    return Math.max(0, past + current);
};

window.saveCustomer = function() {
    const id = document.getElementById('editId').value || Date.now();
    const name = document.getElementById('cName').value; if(!name) return;
    const entry = { id: id, name: name, address: document.getElementById('cAddr').value, postcode: document.getElementById('cPostcode').value, phone: document.getElementById('cPhone').value, price: n(document.getElementById('cPrice').value), week: document.getElementById('cWeek').value, freq: document.getElementById('cFreq').value, day: document.getElementById('cDay').value, notes: document.getElementById('cNotes').value, cleaned: false, paidThisMonth: 0, debtHistory: [], paymentHistory: [], nextDue: '' };
    const idx = db.customers.findIndex(x => String(x.id) === String(id));
    if(idx > -1) { 
        const old = db.customers[idx];
        entry.cleaned = old.cleaned; entry.paidThisMonth = old.paidThisMonth; 
        entry.debtHistory = old.debtHistory || []; entry.paymentHistory = old.paymentHistory || [];
        db.customers[idx] = entry; 
    } else { db.customers.push(entry); }
    clearForm(); saveData(); openTab(null, 'master');
};

window.editCustomer = function(id) { 
    const c = db.customers.find(x => String(x.id) === String(id)); if(!c) return; 
    document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cAddr').value = c.address;
    document.getElementById('cPrice').value = c.price; document.getElementById('cWeek').value = c.week; document.getElementById('cFreq').value = c.freq || "4";
    document.getElementById('editActions').classList.remove('hidden'); openTab(null, 'admin'); 
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

window.openMessageTemplates = function(id) { activeMsgId = id; document.getElementById('msgModal').style.display = 'flex'; };

window.executeMessage = function(type) {
    const c = db.customers.find(x => String(x.id) === String(activeMsgId));
    if(!c) return;
    const b = db.bank || {name:'', sort:'', acc:''};
    let msg = type === 'coming' ? `Hey ${c.name}, coming tomorrow to wash windows at ${c.address}. Jonathan @Hydro` : `Hey ${c.name}, windows cleaned! Total: £${calculateTrueDebt(c).toFixed(2)}. Bank: ${b.name}, Sort: ${b.sort}, Acc: ${b.acc}. Jonathan @Hydro`;
    window.location.href = `https://wa.me/${c.phone.replace(/\s+/g, '')}?text=${encodeURIComponent(msg)}`;
    document.getElementById('msgModal').style.display = 'none';
};

window.exportFullCSV = function() {
    let csv = "ID,Name,Address,Postcode,Phone,Price,Week,Freq,Day,Notes,Cleaned,PaidThisMonth,DebtHistory,PaymentHistory,NextDue\n";
    db.customers.forEach(c => {
        csv += `${c.id},"${c.name}","${c.address}","${c.postcode}","${c.phone}",${n(c.price)},${c.week},${c.freq},"${c.day}","${c.notes}",${c.cleaned?1:0},${n(c.paidThisMonth)},"${JSON.stringify(c.debtHistory||[]).replace(/"/g, '""')}","${JSON.stringify(c.paymentHistory||[]).replace(/"/g, '""')}","${c.nextDue}"\n`;
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = `HydroPro_Backup.csv`;
    link.click();
};

window.toggleDarkMode = function() { 
    const isDark = document.getElementById('darkModeToggle').checked; 
    document.body.className = isDark ? 'dark-mode' : 'light-mode'; 
    localStorage.setItem('Hydro_Dark_Pref', isDark); 
};

window.openCustomerModal = function(id) {
    const c = db.customers.find(x => String(x.id) === String(id)); if(!c) return;
    document.getElementById('modName').innerText = c.name;
    document.getElementById('modAddr').innerText = c.address;
    const debt = calculateTrueDebt(c);
    document.getElementById('modOwed').innerText = '£' + debt.toFixed(2);
    document.getElementById('customerModal').style.display = 'flex';
};

window.closeCustomerModal = function() { document.getElementById('customerModal').style.display = 'none'; };
window.clearForm = function() { ['editId','cName','cAddr','cPostcode','cPhone','cPrice','cNotes'].forEach(id => document.getElementById(id).value = ''); document.getElementById('editActions').classList.add('hidden'); };
window.handleSearch = function() { renderMasterTable(); };
window.runUATClear = function() { if(confirm("Wipe all data?")) { localStorage.clear(); location.reload(); } };
