const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [] };
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
            const isDone = c.cleaned;
            
            // Determine Card Status Class
            let statusClass = "";
            if (debt > 0) statusClass = "status-debt";
            else if (isDone) statusClass = "status-done";

            let card = document.createElement('div');
            card.className = `customer-card fade-in ${statusClass}`;
            card.innerHTML = `
                <div class="card-body">
                    <div class="card-header-row">
                        <span class="card-name">${c.name}</span>
                        <span class="card-price-pill">£${n(c.price).toFixed(2)}</span>
                    </div>
                    <div class="card-addr-row">📍 ${c.address}</div>
                    
                    <div class="card-footer-icons">
                        <span class="icon-badge">📅 ${c.day.substring(0,3)}</span>
                        ${c.phone ? `<span class="icon-badge" style="color:#25D366">💬 WhatsApp</span>` : ''}
                        ${c.notes ? `<span class="icon-badge" style="color:var(--warning)">📝 Note</span>` : ''}
                        ${debt > 0 ? `<span class="icon-badge debt-alert">⚠️ £${debt.toFixed(2)} OWED</span>` : ''}
                    </div>

                    <div class="card-actions">
                        <button class="btn-mini" style="background:#eee;" onclick="editCustomer('${c.id}')">⚙️ Edit</button>
                        <button class="btn-mini" style="background:var(--success); color:white;" onclick="initQuickPay('${c.id}')">£ Pay</button>
                        <button class="btn-main full-width-btn" style="grid-column: span 2; margin-top:5px;" onclick="markJobAsCleaned('${c.id}')">
                            ${isDone ? 'Job Finished ✅' : 'Mark as Cleaned'}
                        </button>
                    </div>
                </div>`;
            div.appendChild(card);
        });
    }
};

window.saveCustomer = function() {
    const id = document.getElementById('editId').value || Date.now().toString();
    const entry = {
        id, name: document.getElementById('cName').value, address: document.getElementById('cAddr').value,
        phone: document.getElementById('cPhone').value, price: n(document.getElementById('cPrice').value),
        week: document.getElementById('cWeek').value, day: document.getElementById('cDay').value,
        freq: document.getElementById('cFreq').value, notes: document.getElementById('cNotes').value,
        cleaned: false, paidThisMonth: 0, debtHistory: []
    };
    const idx = db.customers.findIndex(x => x.id === id);
    if(idx > -1) {
        const old = db.customers[idx];
        entry.cleaned = old.cleaned; entry.paidThisMonth = old.paidThisMonth; entry.debtHistory = old.debtHistory;
        db.customers[idx] = entry;
    } else db.customers.push(entry);
    saveData(); clearForm(); openTab(null, 'master');
};

window.calculateTrueDebt = (c) => {
    const past = (c.debtHistory || []).reduce((s, e) => s + n(e.amount), 0);
    const current = c.cleaned ? (n(c.price) - n(c.paidThisMonth)) : (0 - n(c.paidThisMonth));
    return Math.max(0, past + current);
};

window.saveData = () => { localStorage.setItem(MASTER_KEY, JSON.stringify(db)); renderAll(); };
window.renderAll = () => { renderWeeks(); renderMasterTable(); };
// ... Include other helper logic from v9.6 ...
