const DB_KEY = 'HydroPro_V25_Master';
let db = { customers: [], expenses: [], history: [], bank: { name: '', sort: '', acc: '' } };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);
let curWeek = 1;

window.onload = () => {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) db = JSON.parse(saved);
    const isDark = localStorage.getItem('HP_Theme') === 'true';
    document.body.classList.toggle('dark-mode', isDark);
    
    const themeCheckbox = document.getElementById('themeCheckbox');
    if(themeCheckbox) themeCheckbox.checked = isDark;
    
    const mainLogo = document.getElementById('mainLogo');
    if(mainLogo) mainLogo.src = isDark ? 'Logo-Dark.png' : 'Logo.png';

    updateHeader();
    renderAll();
};

window.toggleDarkMode = () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('HP_Theme', isDark);
    
    const themeCheckbox = document.getElementById('themeCheckbox');
    if(themeCheckbox) themeCheckbox.checked = isDark;

    const mainLogo = document.getElementById('mainLogo');
    if(mainLogo) {
        mainLogo.style.opacity = '0';
        setTimeout(() => {
            mainLogo.src = isDark ? 'Logo-Dark.png' : 'Logo.png';
            mainLogo.style.opacity = '1';
        }, 200);
    }
};

window.openTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const target = document.getElementById(tabId);
    if(target) target.classList.add('active');
    window.scrollTo(0,0);
    renderAll();
};

window.renderAll = () => {
    renderMaster(); renderLedger(); renderStats(); renderWeek();
    if(document.getElementById('bankName')) {
        document.getElementById('bankName').value = db.bank.name || '';
        document.getElementById('bankSort').value = db.bank.sort || '';
        document.getElementById('bankAcc').value = db.bank.acc || '';
    }
};

window.renderMaster = () => {
    const container = document.getElementById('master-list-container');
    if(!container) return; container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div'); div.className = 'cust-pill';
            div.onclick = () => editCust(c.id);
            let badge = (c.cleaned && n(c.paidThisMonth) < n(c.price)) ? `<div class="arrears-badge">UNPAID 🚩</div>` : "";
            div.innerHTML = `${badge}<div><strong style="font-size:20px;">${c.name}</strong><br><small style="color:var(--accent); font-weight:700;">${c.houseNum} ${c.street}</small></div><div style="font-weight:900; color:var(--success);">£${n(c.price).toFixed(2)}</div>`;
            container.appendChild(div);
        }
    });
};

window.renderWeek = () => {
    const bulk = document.getElementById('bulk-box'), list = document.getElementById('week-list-container');
    if(!list) return;
    bulk.innerHTML = `<button class="btn-wa" onclick="messageAll(${curWeek},'wa')">WA Message All W${curWeek}</button><button class="btn-sms" onclick="messageAll(${curWeek},'sms')">SMS Message All W${curWeek}</button>`;
    list.innerHTML = '';
    db.customers.filter(c => c.week == curWeek).forEach(c => {
        const div = document.createElement('div'); div.className = 'job-card';
        div.innerHTML = `<div><strong style="font-size:20px;">${c.name} ${c.cleaned?'✅':''}</strong><br><small style="color:var(--accent); font-weight:700;">${c.houseNum} ${c.street}</small></div>
            <div class="job-actions">
                <button class="btn-job btn-map-yellow" onclick="openMap('${c.houseNum} ${c.street} ${c.postcode}')">📍 MAP</button>
                <button class="btn-job" style="background:${c.cleaned?'var(--success)':'#aaa'}" onclick="handleClean('${c.id}')">CLEAN</button>
                <button class="btn-job" style="background:${n(c.paidThisMonth)>0?'var(--accent)':'#aaa'}" onclick="markAsPaid('${c.id}')">PAY</button>
            </div>`;
        list.appendChild(div);
    });
};

window.markAsPaid = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return;
    if(n(c.paidThisMonth) > 0) { if(confirm(`Current paid: £${n(c.paidThisMonth)}. Reset to £0?`)) { c.paidThisMonth = 0; saveData(); renderWeek(); renderStats(); } return; }
    const amt = prompt(`Enter amount paid for ${c.name}:`, c.price); if(amt === null) return;
    const val = n(amt); if(val >= 0) { c.paidThisMonth = val; saveData(); renderWeek(); renderStats(); }
};

window.openMap = (addr) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
    window.open(url, '_blank');
};

window.copyBankDetails = () => {
    const details = `${db.bank.name}\n${db.bank.sort}\n${db.bank.acc}`;
    navigator.clipboard.writeText(details).then(() => {
        const btn = document.getElementById('copyBankBtn');
        btn.innerText = "COPIED! ✅"; btn.style.background = "var(--success)";
        setTimeout(() => { btn.innerText = "📋 COPY"; btn.style.background = "#8e8e93"; }, 2000);
    });
};

/* --- UTILS --- */
window.saveCustomer = () => {
    const name = document.getElementById('cName').value; if(!name) return;
    const id = document.getElementById('editId').value || Date.now().toString();
    const idx = db.customers.findIndex(c => c.id === id);
    const entry = { id, name, phone: document.getElementById('cPhone').value, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, postcode: document.getElementById('cPostcode').value.toUpperCase(), price: n(document.getElementById('cPrice').value), notes: document.getElementById('cNotes').value, week: (idx>-1)?db.customers[idx].week:"1", cleaned: (idx>-1)?db.customers[idx].cleaned:false, paidThisMonth: (idx>-1)?db.customers[idx].paidThisMonth:0 };
    if(idx>-1) db.customers[idx]=entry; else db.customers.push(entry);
    saveData(); openTab('master-root');
};
window.editCust = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return; openTab('setup-root');
    document.getElementById('editId').value = c.id; document.getElementById('cName').value = c.name; document.getElementById('cPhone').value = c.phone; document.getElementById('cHouseNum').value = c.houseNum; document.getElementById('cStreet').value = c.street; document.getElementById('cPostcode').value = c.postcode; document.getElementById('cPrice').value = c.price; document.getElementById('cNotes').value = c.notes;
};
window.toggleBankLock = () => {
    const fields = document.querySelectorAll('.bank-field-fixed'), lockBtn = document.getElementById('bankLockBtn'), saveBtn = document.getElementById('bankSaveBtn');
    const isLocked = fields[0].readOnly; fields.forEach(f => f.readOnly = !isLocked);
    lockBtn.innerText = isLocked ? "🔒 LOCK" : "🔓 UNLOCK"; saveBtn.classList.toggle('hidden', !isLocked);
};
window.saveBankDetails = () => { db.bank = { name: document.getElementById('bankName').value, sort: document.getElementById('bankSort').value, acc: document.getElementById('bankAcc').value }; saveData(); toggleBankLock(); alert("Bank Details Secured!"); };
window.handleClean = (id) => {
    const c = db.customers.find(x => x.id === id); if(!c) return; c.cleaned = !c.cleaned; saveData(); renderWeek();
    if(c.cleaned) {
        const msg = `Hi ${c.name} your windows at ${c.houseNum}, ${c.street}, were cleaned today. If you would like to make a bank transfer payment for £${n(c.price).toFixed(2)}, please use the bank details below.\n\nThank you for your business\nJonathan\n\n${db.bank.name}\n${db.bank.sort}\n${db.bank.acc}`;
        document.getElementById('msgPreview').innerText = msg; document.getElementById('msgModal').classList.remove('hidden');
        document.getElementById('modalButtons').innerHTML = `<button class="btn-wa" style="width:100%;margin-bottom:10px;height:60px;border-radius:15px;border:none;color:white;font-weight:900;" onclick="sendMsg('${c.phone}','wa','${encodeURIComponent(msg)}')">Send WhatsApp</button><button class="btn-sms" style="width:100%;margin-bottom:10px;height:60px;border-radius:15px;border:none;color:white;font-weight:900;" onclick="sendMsg('${c.phone}','sms','${encodeURIComponent(msg)}')">Send SMS</button><button onclick="closeMsgModal()" style="width:100%;height:50px;border-radius:15px;border:none;background:#8e8e93;color:white;font-weight:900;">Skip</button>`;
    }
};
window.sendMsg = (p, m, msg) => { const c = (p||"").replace(/\s+/g,''); window.open(m==='wa' ? `https://wa.me/${c}?text=${msg}` : `sms:${c}?body=${msg}`, '_blank'); closeMsgModal(); };
window.renderLedger = () => {
    const container = document.getElementById('ledger-list-container'), totalEl = document.getElementById('ledgerTotal');
    if(!container) return; container.innerHTML = ''; let total = 0;
    db.expenses.forEach(e => total += n(e.amt)); if(totalEl) totalEl.innerText = `£${total.toFixed(2)}`;
    db.expenses.slice().reverse().forEach(e => {
        const div = document.createElement('div'); div.className = 'exp-pill';
        div.ondblclick = () => deleteExpense(e.id);
        div.innerHTML = `<div><strong>${e.desc}</strong><br><small>📅 ${e.date}</small></div><div style="color:var(--danger); font-weight:900;">-£${n(e.amt).toFixed(2)}</div>`;
        container.appendChild(div);
    });
};
window.addExpense = () => {
    const d = document.getElementById('expDesc').value, a = n(document.getElementById('expAmt').value);
    if(!d || a <= 0) return; db.expenses.push({ id: Date.now(), desc: d, amt: a, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
    saveData(); document.getElementById('expDesc').value=''; document.getElementById('expAmt').value=''; renderLedger(); renderStats();
};
window.renderStats = () => {
    const container = document.getElementById('stats-container'); if(!container) return;
    let target = 0, paid = 0, arrears = 0, spend = 0;
    db.customers.forEach(c => { target += n(c.price); paid += n(c.paidThisMonth); if (c.cleaned && n(c.paidThisMonth) < n(c.price)) arrears += (n(c.price) - n(c.paidThisMonth)); });
    db.expenses.forEach(e => spend += n(e.amt));
    const profit = paid - spend, progress = target > 0 ? Math.round((paid/target)*100) : 0;
    container.innerHTML = `<div class="stats-hero"><div>£${profit.toFixed(2)}</div><small>PROFIT IN POCKET</small></div><div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:20px;"><div style="background:var(--card); padding:20px; border-radius:25px; text-align:center;"><small style="display:block; font-weight:800; opacity:0.5;">MONTH INCOME</small><div style="color:var(--success); font-weight:900;">£${paid.toFixed(2)}</div></div><div style="background:var(--card); padding:20px; border-radius:25px; text-align:center;"><small style="display:block; font-weight:800; opacity:0.5;">MONTH SPEND</small><div style="color:var(--danger); font-weight:900;">£${spend.toFixed(2)}</div></div></div><div style="background:var(--card); padding:25px; border-radius:35px; margin-bottom:20px;"><strong>Progress ${progress}%</strong><div style="background:#eee; height:10px; border-radius:5px; margin:10px 0; overflow:hidden;"><div style="background:var(--accent); height:100%; width:${progress}%"></div></div></div><div style="background:var(--danger); color:white; padding:25px; border-radius:30px; text-align:center; font-weight:900;">ARREARS: £${arrears.toFixed(2)}</div>`;
};
window.completeCycle = () => { if(!confirm("Reset month?")) return; db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; }); db.expenses = []; saveData(); location.reload(); };
window.exportToCSV = (type) => { let csv = type === 'income' ? 'Name,Amount\n' : 'Desc,Amount\n'; if(type === 'income') db.customers.filter(c => n(c.paidThisMonth) > 0).forEach(c => csv += `"${c.name}",${c.paidThisMonth}\n`); else db.expenses.forEach(e => csv += `"${e.desc}",${e.amt}\n`); const b = new Blob([csv], { type: 'text/csv' }); const u = window.URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `HydroPro_${type}.csv`; a.click(); };
window.closeMsgModal = () => document.getElementById('msgModal').classList.add('hidden');
window.saveData = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
window.updateHeader = () => { const hr = new Date().getHours(), g = (hr < 12) ? "GOOD MORNING" : (hr < 18) ? "GOOD AFTERNOON" : "GOOD EVENING"; document.getElementById('greetText').innerText = `${g}, PARTNER! ☕`; document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
