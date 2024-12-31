document.addEventListener("DOMContentLoaded", function() {
    fetch('http://127.0.0.1:3000/api/users')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('Fetched users data:', data); // Log the data to console
            const usersTable = document.getElementById('users-table');
            data.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.first_name}</td>
                    <td>${user.last_name}</td>
                    <td>${user.email}</td>
                    <td>${user.position}</td>
                    <td>${new Date(user.created_at).toLocaleString()}</td>
                    <td>
                        <div class="dropdown">
                            <button class="dropdown-btn">⋮</button>
                            <div class="dropdown-content">
                                <a href="#" onclick="accessPrivileges('${user.id}')">Access Privileges</a>
                                <a href="#" onclick='editAccount(${JSON.stringify(user)})'>Edit Account</a>
                                <a href="#" onclick="deleteAccount('${user.id}')">Delete Account</a>
                            </div>
                        </div>
                    </td>
                `;
                usersTable.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching users:', error));
});

function accessPrivileges(userId) {
    alert(`Access Privileges for user ${userId}`);
    // Implement the logic to manage access privileges
}

function editAccount(user) {
    console.log('Edit user:', user); // Debugging: log user data
    // Show the edit form popup
    const popup = document.getElementById('edit-popup');
    const form = document.getElementById('edit-form');
    popup.style.display = 'block';

    // Populate the form with the user's current data
    form.userId.value = user.id;
    form.firstName.value = user.first_name;
    form.lastName.value = user.last_name;
    form.email.value = user.email;
    form.position.value = user.position;
}

function closePopup() {
    document.getElementById('edit-popup').style.display = 'none';
}

function saveEdits(event) {
    event.preventDefault();
    const form = event.target;

    const userId = form.userId.value;
    const updatedUser = {
        first_name: form.firstName.value,
        last_name: form.lastName.value,
        email: form.email.value,
        position: form.position.value,
        password: form.password.value ? form.password.value : undefined
    };

    console.log('Saving edits for user:', userId, updatedUser); // Debugging: log updated user data

    if (updatedUser.position === 'admin') {
        fetch('http://127.0.0.1:3000/api/users')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                const adminCount = data.filter(user => user.position === 'admin').length;
                if (adminCount >= 1 && !data.some(user => user.id == userId && user.position === 'admin')) {
                    alert('Only one admin is allowed.');
                    return;
                }
                updateUser(userId, updatedUser);
            })
            .catch(error => console.error('Error checking admin count:', error));
    } else {
        updateUser(userId, updatedUser);
    }
}

function updateUser(userId, updatedUser) {
    fetch(`http://127.0.0.1:3000/api/users/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedUser)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        alert('User updated successfully');
        closePopup();
        location.reload(); // Reload the page to reflect changes
    })
    .catch(error => console.error('Error updating user:', error));
}

function deleteAccount(userId) {
    if (confirm('Are you sure you want to delete this account?')) {
        fetch(`http://127.0.0.1:3000/api/users/${userId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            alert('User deleted successfully');
            location.reload(); // Reload the page to reflect changes
        })
        .catch(error => console.error('Error deleting user:', error));
    }
}