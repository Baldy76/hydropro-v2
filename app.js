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

    // UI DYNAMICS: Ensure these only show on relevant tabs
    const searchBar = document.getElementById('globalSearchContainer');
    const filterBar = document.getElementById('dayFilterBar');
    
    if(name === 'master') {
        searchBar.classList.remove('hidden');
    } else {
        searchBar.classList.add('hidden');
    }

    if(name.startsWith('week')) {
        filterBar.classList.remove('hidden');
    } else {
        filterBar.classList.add('hidden');
    }

    renderAll();
    window.scrollTo(0,0);
};

// ... Include all other v10.0 logic functions (renderWeeks, saveCustomer, calculateTrueDebt) ...
