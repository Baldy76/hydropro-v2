const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], incomeHistory: [], expenses: [], bank: {name:'', sort:'', acc:''} };
let currentDayFilter = 'All';
let activePayId = null;

const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

window.onload = () => {
    const dateElement = document.getElementById('headerDate');
    if (dateElement) {
        dateElement.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    renderAll();
};

window.openTab = function(evt, name) {
    const contents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < contents.length; i++) {
        contents[i].style.display = "none";
        contents[i].classList.remove("active");
    }
    const tabs = document.getElementsByClassName("tab");
    for (let i = 0; i < tabs.length; i++) { tabs[i].classList.remove("active"); }
    document.getElementById(name).style.display = "block";
    document.getElementById(name).classList.add("active");
    if (evt) evt.currentTarget.classList.add("active");

    // Show/Hide Day Filter
    const filterBar = document.getElementById('dayFilterBar');
    if(name.startsWith('week')) filterBar.classList.remove('hidden');
    else filterBar.classList.add('hidden');

    renderAll();
    window.scrollTo(0,0);
};

window.setDayFilter = function(day) {
    currentDayFilter = day;
    const pills = document.getElementsByClassName('day-pill');
    for (let p of pills) {
        p.classList.remove('active');
        if(p.innerText === day || (day === 'All' && p.innerText === 'All') || (day === 'Wednesday' && p.innerText === 'W')) p.classList.add('active');
        // Simple letter mapping for pills
        const map = {"Monday":"M", "Tuesday":"T", "Wednesday":"W", "Thursday":"T", "Friday":"F", "All":"All"};
        if(map[day] === p.innerText || day === p.innerText) p.classList.add('active');
    }
    renderAll();
};

window.renderWeeks = function() {
    for(let i=1; i<=4; i++) {
        const div = document.getElementById('week' + i);
        if(!div) continue; div.innerHTML = '';
        db.customers.filter(c => {
            const weekMatch = String(c.week) === String(i);
            const dayMatch = currentDayFilter === 'All' || c.day === currentDayFilter;
            return weekMatch && dayMatch;
        }).forEach(c => {
            const debt = calculateTrueDebt(c);
            let card = document.createElement('div');
            card.className = `customer-card ${debt > 0 ? 'has-debt' : ''}`;
            card.innerHTML = `
                <div class="card-status-bar"></div>
                <div class="card-main-content" onclick="openCustomerModal('${c.id}')">
                    <div class="card-title-row"><strong>${c.name}</strong><strong class="card-price">£${n(c.price).toFixed(2)}</strong></div>
                    <small style="opacity:0.5">${c.day} - ${c.address}</small>
                </div>
                <div class="card-actions-wrapper">
                    <div class="action-sub-grid">
                        <button class="btn-admin-small" onclick="openMessageTemplates('${c.id}')">💬 Msg</button>
                        <button class="btn-admin-small" onclick="editCustomer('${c.id}')">⚙️ Edit</button>
                    </div>
                    <div class="action-sub-grid">
                        <button class="btn-main" onclick="markJobAsCleaned('${c.id}')">${c.cleaned?'Done ✅':'Clean'}</button>
                        <button class="btn-alt" style="background:var(--success); color:white;" onclick="initQuickPay('${c.id}')">Payment</button>
                    </div>
                </div>`;
            div.appendChild(card);
        });
    }
};

window.initQuickPay = function(id) {
    const c = db.customers.find(x => String(x.id) === String(id));
    activePayId = id;
    document.getElementById('payCustName').innerText = c.name + " (Balance: £" + calculateTrueDebt(c).toFixed(2) + ")";
    document.getElementById('payModal').style.display = 'flex';
};

window.confirmQuickPay = function(type) {
    const c = db.customers.find(x => String(x.id) === String(activePayId));
    document.getElementById('payModal').style.display = 'none';
    if(type === 'full') {
        processActualPayment(activePayId, calculateTrueDebt(c));
    } else {
        const amt = prompt("Amount paid?", calculateTrueDebt(c).toFixed(2));
        if(amt) processActualPayment(activePayId, n(amt));
    }
};

function processActualPayment(id, amount) {
    const c = db.customers.find(x => String(x.id) === String(id));
    let pay = n(amount);
    if(c.debtHistory) {
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
}

window.saveCustomer = function() {
    const id = document.getElementById('editId').value || Date.now();
    const entry = { id: id, name: document.getElementById('cName').value, address: document.getElementById('cAddr').value, phone: document.getElementById('cPhone').value, price: n(document.getElementById('cPrice').value), week: document.getElementById('cWeek').value, day: document.getElementById('cDay').value, freq: document.getElementById('cFreq').value, cleaned: false, paidThisMonth: 0, debtHistory: [], paymentHistory: [] };
    const idx = db.customers.findIndex(x => String(x.id) === String(id));
    if(idx > -1) { 
        const old = db.customers[idx];
        entry.cleaned = old.cleaned; entry.paidThisMonth = old.paidThisMonth; entry.debtHistory = old.debtHistory || [];
        db.customers[idx] = entry; 
    } else { db.customers.push(entry); }
    clearForm(); saveData(); openTab(null, 'master');
};

// ... Rest of the functions (renderMasterTable, editCustomer, calculateTrueDebt, etc.) remain unchanged ...
