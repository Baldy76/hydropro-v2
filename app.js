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
                    <div style="font-weight: 700; font-size: 16px;">${c.name}</div>
                    <div style="font-size: 13px; opacity: 0.5;">${c.address}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 800; color: ${debt > 0 ? 'var(--danger)' : 'var(--success)'}; font-size: 17px;">£${debt.toFixed(2)}</div>
                    <small style="font-size: 10px; opacity: 0.4; font-weight: 700;">BALANCE</small>
                </div>
            `;
            body.appendChild(row);
        }
    });
};
