window.saveCustomer = () => {
    const nameVal = document.getElementById('cName').value;
    if(!nameVal) return;

    const id = document.getElementById('editId').value || Date.now().toString();
    const idx = db.customers.findIndex(x => x.id === id);
    let ex = idx > -1 ? db.customers[idx] : null;

    const entry = {
        id, 
        name: nameVal,
        houseNum: document.getElementById('cHouseNum').value, // New Field
        street: document.getElementById('cStreet').value,     // New Field
        // Combine for legacy address support if needed
        address: `${document.getElementById('cHouseNum').value} ${document.getElementById('cStreet').value}`.trim(),
        postcode: document.getElementById('cPostcode').value,
        phone: document.getElementById('cPhone').value,
        price: n(document.getElementById('cPrice').value),
        week: document.getElementById('cWeek').value,
        day: document.getElementById('cDay').value,
        notes: document.getElementById('cNotes').value,
        cleaned: ex ? ex.cleaned : false, 
        paidThisMonth: ex ? ex.paidThisMonth : 0, 
        debtHistory: ex ? ex.debtHistory : [], 
        paymentLogs: ex ? ex.paymentLogs : []
    };

    if(idx > -1) db.customers[idx] = entry; 
    else db.customers.push(entry);
    
    saveData(); 
    openTab('home'); // Fresh Page return to Hub
};

// Regression fix for editing existing customers
window.editCust = (id) => {
    const c = db.customers.find(x => x.id === id); 
    if(!c) return;
    
    closeModal(); 
    openTab('admin');
    
    document.getElementById('editId').value = c.id; 
    document.getElementById('cName').value = c.name;
    document.getElementById('cHouseNum').value = c.houseNum || "";
    document.getElementById('cStreet').value = c.street || "";
    document.getElementById('cPostcode').value = c.postcode;
    document.getElementById('cPhone').value = c.phone; 
    document.getElementById('cPrice').value = c.price;
    document.getElementById('cWeek').value = c.week; 
    document.getElementById('cDay').value = c.day; 
    document.getElementById('cNotes').value = c.notes;
};
