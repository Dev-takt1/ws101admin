async function loadMenuManagement() {
    try {
        const response = await fetch('http://localhost:4000/api/menu');
        const items = await response.json();
        const listContainer = document.querySelector('.menu-list');
        
        if (!listContainer) return;

        listContainer.innerHTML = items.map(item => `
            <div class="menu-item" id="item-${item.id}">
                <div class="col-name">
                    <h4>${item.courseName}</h4>
                    <p>De Las Armas</p>
                </div>
                <div class="col-thumb">
                    <img src="${item.image_url || 'assets/img/default.png'}" alt="Thumbnail">
                </div>
                <div class="col-price">₱${Number(item.price).toLocaleString()}</div>
                <div class="col-stat">${item.views || 0}</div>
                <div class="col-stat">${item.orders || 0}</div>
                <div class="col-date">${new Date(item.created_at).toLocaleDateString()}</div>
                <div class="col-actions">
                    <button class="action-btn edit" onclick="editMenuItem(${item.id}, '${item.courseName}', ${item.price})">Edit</button>
                    <button class="action-btn delete" onclick="deleteMenuItem(${item.id})">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error("Failed to load menu", err);
    }
}

// Global functions for buttons
window.editMenuItem = async (id, oldName, oldPrice) => {
    const newName = prompt("Edit Course Name:", oldName);
    const newPrice = prompt("Edit Price:", oldPrice);

    if (newName && newPrice) {
        const res = await fetch(`http://localhost:4000/api/menu/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseName: newName, price: newPrice })
        });
        if (res.ok) loadMenuManagement();
    }
};

window.deleteMenuItem = async (id) => {
    if (confirm("Delete this package?")) {
        await fetch(`http://localhost:4000/api/menu/${id}`, { method: 'DELETE' });
        loadMenuManagement();
    }
};

document.addEventListener('DOMContentLoaded', loadMenuManagement);