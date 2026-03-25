const DB_KEY = 'HydroPro_Gold_V36';
let db = { customers: [], expenses: [], history: [] };
const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) db = JSON.parse(saved);
    updateHeader(); renderAll();
});

window.renderMaster = () => {
    const list = document.getElementById('master-list-container'); if(!list) return; list.innerHTML = '';
    const search = (document.getElementById('mainSearch')?.value || "").toLowerCase();
    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const div = document.createElement('div');
            div.className = 'CUST-BLOCK';
            div.onclick = () => showBriefing(c.id);
            div.innerHTML = `<div><strong>${c.name}</strong><br><small>${c.houseNum} ${c.street}</small></div><div style="font-weight:950; color:var(--success);">£${n(c.price).toFixed(2)}</div>`;
            list.appendChild(div);
        }
    });
};

window.showBriefing = (id) => {
    const c = db.customers.find(x => x.id === id);
    const modal = document.getElementById('briefingModal');
    const container = document.getElementById('briefingData');
    
    // Arrears Check
    const isPaid = n(c.paidThisMonth) >= n(c.price);
    const arrearsHtml = !isPaid ? `<div class="brief-arrears">⚠️ PAYMENT MISSED THIS MONTH (£${(n(c.price) - n(c.paidThisMonth)).toFixed(2)})</div>` : `<div style="color:var(--success); text-align:center; font-weight:900; margin:10px 0;">✅ PAID THIS MONTH</div>`;

    // History (Last 3 transactions)
    const history = db.history.filter(h => h.custId === id).slice(-3).reverse();
    let historyHtml = history.map(h => `<div class="brief-history-row"><span>${h.date}</span><span>£${n(h.amt).toFixed(2)}</span></div>`).join('') || '<p style="text-align:center; opacity:0.5;">No history found</p>';

    container.innerHTML = `
        <h2 style="margin:0; color:var(--accent);">${c.name}</h2>
        <p style="margin:5px 0 20px; opacity:0.6; font-weight:800;">${c.houseNum} ${c.street}, ${c.postcode||''}</p>
        
        <div class="brief-section"><strong>Base Price:</strong> £${n(c.price).toFixed(2)}</div>
        ${arrearsHtml}
        
        <div class="brief-section">
            <h3 style="font-size:14px; margin-bottom:10px; opacity:0.4;">LAST 3 TRANSACTIONS</h3>
            ${historyHtml}
        </div>
    `;
    modal.classList.remove('hidden');
};

window.closeBriefing = () => document.getElementById('briefingModal').classList.add('hidden');

window.saveCustomer = () => {
    const name = document.getElementById('cName').value;
    if(!name) return alert("Required");
    db.customers.push({ id: Date.now().toString(), name, houseNum: document.getElementById('cHouseNum').value, street: document.getElementById('cStreet').value, price: n(document.getElementById('cPrice').value), paidThisMonth: 0, cleaned: false });
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    alert("Saved!"); location.reload();
};

window.openTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0); renderAll();
};

window.renderAll = () => {
    if(document.getElementById('master-root').classList.contains('active')) renderMaster();
};
window.updateHeader = () => { if(el = document.getElementById('dateText')) el.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
