const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [] };
let currentDayFilter = 'All';

const n = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

// --- STARTUP ---
window.onload = () => {
    const dateElement = document.getElementById('headerDate');
    if (dateElement) dateElement.innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    
    const saved = localStorage.getItem(MASTER_KEY);
    if (saved) db = JSON.parse(saved);
    if (!db.customers) db.customers = [];
    
    const isDark = localStorage.getItem('Hydro_Dark_Pref') === 'true';
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    if(document.getElementById('darkModeToggle')) document.getElementById('darkModeToggle').checked = isDark;
    
    renderAll();
};

// --- DATA PERSISTENCE ---
window.saveData = () => { 
    localStorage.setItem(MASTER_KEY, JSON.stringify(db)); 
    renderAll(); 
};

// --- EXPORT ---
window.exportFullCSV = function() {
    let csv = "ID,Name,Address,Postcode,Phone,Price,Week,Day,Freq,Notes,Cleaned,PaidThisMonth,DebtHistory\n";
    db.customers.forEach(c => {
        csv += `${c.id},"${c.name}","${c.address}","${c.postcode}","${c.phone}",${n(c.price)},${c.week},"${c.day}","${c.freq||'4'}","${(c.notes||'').replace(/"/g, '""')}",${c.cleaned?1:0},${n(c.paidThisMonth)},"${JSON.stringify(c.debtHistory||[]).replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `HydroPro_Backup_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
};

// --- IMPORT ---
window.importFullCSV = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const lines = ev.target.result.split(/\r?\n/);
        if (lines.length <= 1) return;
        let newCusts = [];
        lines.slice(1).forEach(l => {
            if(!l.trim()) return;
            // Matches columns even with commas inside quotes
            const cols = l.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g).map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
            if(cols.length < 5) return;
            newCusts.push({
                id: cols[0], name: cols[1], address: cols[2], postcode: cols[3], phone: cols[4],
                price: n(cols[5]), week: cols[6], day: cols[7], freq: cols[8], notes: cols[9],
                cleaned: cols[10] === "1", paidThisMonth: n(cols[11]),
                debtHistory: JSON.parse(cols[12] || "[]")
            });
        });
        if(confirm(`Import ${newCusts.length} customers? This replaces current data.`)) {
            db.customers = newCusts;
            saveData();
            location.reload();
        }
    };
    reader.readAsText(file);
};

// --- RESET ---
window.runUATClear = () => {
    if(confirm("🛑 WARNING: This will permanently delete ALL data. Are you sure?")) {
        if(confirm("Final confirmation: Proceed with Wipe?")) {
            localStorage.clear();
            location.reload();
        }
    }
};

// --- MONTHLY RESET ---
window.completeCycle = () => {
    if(!confirm("🚀 Start New Month? All unpaid work will be moved to Debt.")) return;
    db.customers.forEach(c => {
        const owed = c.cleaned ? (n(c.price) - n(c.paidThisMonth)) : (0 - n(c.paidThisMonth));
        if (owed > 0) {
            if(!c.debtHistory) c.debtHistory = [];
            c.debtHistory.push({ date: new Date().toLocaleDateString(), amount: owed });
        }
        c.cleaned = false;
        c.paidThisMonth = 0;
    });
    saveData();
    alert("New Month Started!");
};

// --- TABS ---
window.openTab = (evt, name) => {
    document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.getElementById(name).style.display = "block";
    if(evt) evt.currentTarget.classList.add("active");
    
    const search = document.getElementById('globalSearchContainer');
    const filters = document.getElementById('dayFilterBar');
    name === 'master' ? search.classList.remove('hidden') : search.classList.add('hidden');
    name.startsWith('week') ? filters.classList.remove('hidden') : filters.classList.add('hidden');
};

window.renderAll = () => { /* Logic to render week lists and master table goes here */ };
window.saveCustomer = () => { /* Logic to grab inputs and push to db.customers */ };
window.toggleDarkMode = () => {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    localStorage.setItem('Hydro_Dark_Pref', isDark);
};
