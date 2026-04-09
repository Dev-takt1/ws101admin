async function loadAppointments() {
    try {
        const response = await fetch('http://localhost:4000/all-appointments');
        const data = await response.json();
        
        const tableBody = document.querySelector('tbody');
        tableBody.innerHTML = ''; // Clear static rows

        data.forEach(app => {
            // This part checks if status is 'Paid' or 'Down Payment' to pick the right CSS class
            const statusClass = app.status === 'Paid' ? 'paid' : 'down-payment';

            const row = `
                <tr>
                    <td>${app.fName}</td>
                    <td>${app.lName}</td>
                    <td>${app.contact_number}</td>
                    <td>${app.eventDate}</td>
                    <td><span class="status-btn ${statusClass}">${app.status}</span></td>
                    <td class="action-cell">...</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (err) {
        console.error("Error loading appointments:", err);
    }
}

document.addEventListener('DOMContentLoaded', loadAppointments);