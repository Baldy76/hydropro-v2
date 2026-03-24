const OLD_DB_KEY = 'HydroPro_App_Production'; // The old safe-haven
const NEW_DB_KEY = 'HydroPro_V25_Master';      // The newModular Vault

let db = { customers: [], expenses: [], history: [], bank: { name: '', sort: '', acc: '' } };

window.onload = () => {
    // 🛡️ DATA MIGRATION ENGINE
    const oldData = localStorage.getItem(OLD_DB_KEY);
    const newData = localStorage.getItem(NEW_DB_KEY);

    if (oldData && !newData) {
        console.log("Old data found. Migrating to v25 Vault...");
        db = JSON.parse(oldData);
        localStorage.setItem(NEW_DB_KEY, JSON.stringify(db));
        alert("✨ Previous customer data successfully recovered!");
    } else if (newData) {
        db = JSON.parse(newData);
    }

    if (!db.bank) db.bank = { name: '', sort: '', acc: '' };

    const isDark = localStorage.getItem('HP_Theme') === 'true';
    document.body.classList.toggle('dark-mode', isDark);
    document.getElementById('themeToggleBtn').innerText = isDark ? '☀️' : '🌙';

    updateHeader();
    renderAll();
};

window.toggleDarkMode = () => {
    const isNowDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('HP_Theme', isNowDark);
    document.getElementById('themeToggleBtn').innerText = isNowDark ? '☀️' : '🌙';
};

window.openTab = (fenceId) => {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(fenceId).classList.add('active');
    window.scrollTo(0,0);
    renderAll();
};

window.renderMasterFence = () => {
    const container = document.getElementById('master-list-container');
    if(!container) return;
    container.innerHTML = '';
    const search = (document.getElementById('mainSearch').value || "").toLowerCase();
    
    if(db.customers.length === 0) {
        container.innerHTML = '<div class="cust-tile" style="justify-content:center; opacity:0.5;">No customers found.</div>';
    }

    db.customers.forEach(c => {
        if(c.name.toLowerCase().includes(search) || (c.street||"").toLowerCase().includes(search)) {
            const tile = document.createElement('div');
            tile.className = 'cust-tile';
            tile.onclick = () => editCust(c.id);
            tile.innerHTML = `
                <div>
                    <strong style="display:block; font-size:22px; margin-bottom:4px;">${c.name}</strong>
                    <small style="color:var(--accent); font-weight:700; font-size:16px; text-transform:uppercase;">${c.houseNum} ${c.street}</small>
                </div>
                <div style="font-weight:900; color:var(--success); font-size:20px;">
                    £${(parseFloat(c.price) || 0).toFixed(2)}
                </div>`;
            container.appendChild(tile);
        }
    });
};

window.saveCustomer = () => {
    const name = document.getElementById('cName').value;
    if(!name) return alert("Name is required!");
    const id = document.getElementById('editId').value || Date.now().toString();
    const entry = {
        id, name,
        phone: document.getElementById('cPhone').value,
        houseNum: document.getElementById('cHouseNum').value,
        street: document.getElementById('cStreet').value,
        postcode: document.getElementById('cPostcode').value.toUpperCase(),
        price: parseFloat(document.getElementById('cPrice').value) || 0,
        notes: document.getElementById('cNotes').value,
        week: "1", cleaned: false, paidThisMonth: 0
    };
    const idx = db.customers.findIndex(c => c.id === id);
    if(idx > -1) db.customers[idx] = {...db.customers[idx], ...entry}; 
    else db.customers.push(entry);
    saveData(); alert("Saved! ✨"); openTab('fence-master');
};

window.editCust = (id) => {
    const c = db.customers.find(x => x.id === id);
    if(!c) return;
    openTab('fence-setup');
    document.getElementById('editId').value = c.id;
    document.getElementById('cName').value = c.name;
    document.getElementById('cPhone').value = c.phone || '';
    document.getElementById('cHouseNum').value = c.houseNum;
    document.getElementById('cStreet').value = c.street;
    document.getElementById('cPostcode').value = c.postcode;
    document.getElementById('cPrice').value = c.price;
    document.getElementById('cNotes').value = c.notes;
};

window.saveData = () => localStorage.setItem(NEW_DB_KEY, JSON.stringify(db));

window.renderAll = () => {
    renderMasterFence();
    // Stats calculation...
};

window.updateHeader = () => {
    document.getElementById('dateText').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
};

window.completeCycle = () => {
    if(!confirm("🚀 Start a new month?")) return;
    db.customers.forEach(c => { c.cleaned = false; c.paidThisMonth = 0; });
    saveData(); location.reload();
};
