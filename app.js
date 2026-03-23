const MASTER_KEY = 'HydroPro_App_Production';
let db = { customers: [], expenses: [] };
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

// --- DATA ENGINE: EXPORT ---
window.exportFullCSV = function() {
    let csv = "ID,Name,Address,Postcode,Phone,Price,Week,Day,Freq,Notes,Cleaned,PaidThisMonth,DebtHistory\n";
    db.customers.forEach(c => {
        const debtStr = JSON.stringify(c.debtHistory || []).replace(/"/g, '""');
        csv += `${c.id},"${c.name}","${c.address}","${c.postcode}","${c.phone}",${n(c.price)},${c.week},"${c.day}","${c.freq||'4'}","${(c.notes||'').replace(/"/g, '""')}",${c.cleaned?1:0},${n(c.paidThisMonth)},"${debtStr}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `HydroPro_Backup_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
};

// --- DATA ENGINE: IMPORT ---
window.importFullCSV = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const lines = ev.target.result.split(/\r?\n/);
            if (lines.length <= 1) return;
            let newCusts = [];
            lines.slice(1).forEach(l => {
                if(!l.trim()) return;
                const cols = l.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g).map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
                if(cols.length < 5) return;
                newCusts.push({
                    id: cols[0], name: cols[1], address: cols[2], postcode: cols[3], phone: cols[4],
                    price: n(cols[5]), week: cols[6], day: cols[7], freq: cols[8], notes: cols[9],
                    cleaned: cols[10] === "1", paidThisMonth: n(cols[11]),
                    debtHistory: JSON.parse(cols[12] || "[]")
                });
            });
            if(confirm(`Import ${newCusts.length} customers? This will overwrite current data.`)) {
                db.customers = newCusts;
                localStorage.setItem(MASTER_KEY, JSON.stringify(db));
                location.reload();
            }
        } catch (err) {
            alert("Error parsing CSV. Ensure it is a valid HydroPro backup.");
        }
    };
    reader.readAsText(file);
};

// --- REST OF APP LOGIC ---
window.saveCustomer = function() {
    const name = document.getElementById('cName').value;
    if(!name) return;
    const id = document.getElementById('editId').value || Date.now().toString();
    const entry = {
        id, name, address: document.getElementById('cAddr').value, 
        postcode: document.getElementById('cPostcode').value,
        phone: document.getElementById('cPhone').value, price: n(document.getElementById('cPrice').value),
        week: document.getElementById('cWeek').value, day: document.getElementById('cDay').value,
        notes: document.getElementById('cNotes').value, cleaned: false, paidThisMonth: 0, debtHistory: []
    };
    const idx = db.customers.findIndex(x => x.id === id);
    if(idx > -1) db.customers[idx] = entry; else db.customers.push(entry);
    localStorage.setItem(MASTER_KEY, JSON.stringify(db));
    location.reload();
};

window.openTab = (evt, name) => {
    document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.getElementById(name).style.display = "block";
    if(evt) evt.currentTarget.classList.add("active");
};

window.toggleDarkMode = () => {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.className = isDark ? 'dark-mode' : 'light-mode';
    localStorage.setItem('Hydro_Dark_Pref', isDark);
};

window.renderAll = () => { /* Logic for rendering lists */ };
