document.addEventListener("DOMContentLoaded", function() {
    fetch('http://127.0.0.1:3000/api/users')
        .then(response => response.json())
        .then(data => {
            const usersTable = document.getElementById('users-table');
            data.forEach(user => {
                const row = document.createElement('tr');
                
                // Generate options conditionally
                let optionsHtml = `
                    <a href="#" onclick='editAccount(${JSON.stringify(user)})'>Edit Account</a>
                    <a href="#" onclick="deleteAccount('${user.id}')">Delete Account</a>
                `;

                if (user.position !== 'admin' && user.position !== 'manager') {
                    optionsHtml = `
                        <a href="#" onclick="accessPrivileges('${user.id}', '${user.position}', '${encodeURIComponent(JSON.stringify(user.privileges))}')">Access Privileges</a>
                        ${optionsHtml}
                    `;
                }

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
                                ${optionsHtml}
                            </div>
                        </div>
                    </td>
                `;
                usersTable.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching users:', error));
});

function accessPrivileges(userId, position, encodedPrivileges) {
    // Decode the privileges object
    let privileges = {};
    try {
        privileges = JSON.parse(decodeURIComponent(encodedPrivileges));
    } catch (e) {
        console.error('Error parsing privileges:', e);
        privileges = {
            canViewProjects: true,
            canEditProjects: false
        };
    }

    // Check if privileges is null and set default values if necessary
    if (!privileges) {
        privileges = {
            canViewProjects: true,
            canEditProjects: false
        };
    }

    // Show the privileges form popup
    const popup = document.getElementById('privileges-popup');
    const form = document.getElementById('privileges-form');
    popup.style.display = 'block';

    // Populate the form with the user's current privileges
    form.privilegesUserId.value = userId;
    form.position.value = position; // Set the position field
    form.canViewProjects.checked = privileges.canViewProjects;
    form.canEditProjects.checked = privileges.canEditProjects;

    // Disable the checkboxes if the user's position is admin or manager
    if (position === 'admin' || position === 'manager') {
        form.canViewProjects.disabled = true;
        form.canEditProjects.disabled = true;
    } else {
        form.canViewProjects.disabled = false;
        form.canEditProjects.disabled = false;
    }
}

function closePrivilegesPopup() {
    const popup = document.getElementById('privileges-popup');
    popup.style.display = 'none';
    const form = document.getElementById('privileges-form');
    form.reset(); // Reset the form to clear previous values
}

function savePrivileges(event) {
    event.preventDefault();
    const form = event.target;

    const userId = form.privilegesUserId.value;
    const position = form.position.value; // Get the position from the hidden field

    // Do not proceed if the user's position is admin or manager
    if (position === 'admin' || position === 'manager') {
        alert('Cannot change privileges for admin or manager.');
        return;
    }

    const updatedPrivileges = {
        canViewProjects: form.canViewProjects.checked,
        canEditProjects: form.canEditProjects.checked
    };

    updateUserPrivileges(userId, updatedPrivileges);
}

function updateUserPrivileges(userId, updatedPrivileges) {
    fetch(`http://127.0.0.1:3000/api/users/${userId}/privileges`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ privileges: updatedPrivileges })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        alert('Privileges updated successfully');
        closePrivilegesPopup();
        // Optionally, refresh the user list or update the UI
    })
    .catch(error => console.error('Error updating privileges:', error));
}

function editAccount(user) {
    const popup = document.getElementById('edit-popup');
    const form = document.getElementById('edit-form');
    popup.style.display = 'block';

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

    fetch(`http://127.0.0.1:3000/api/users/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedUser)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.message || 'Error updating user');
            });
        }
        return response.json();
    })
    .then(data => {
        alert('User updated successfully');
        closePopup();
        location.reload();
    })
    .catch(error => {
        console.error('Error updating user:', error);
        alert(error.message);
    });
}

function deleteAccount(userId) {
    if (confirm('Are you sure you want to delete this account?')) {
        fetch(`http://127.0.0.1:3000/api/users/${userId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            alert('User deleted successfully');
            location.reload();
        })
        .catch(error => console.error('Error deleting user:', error));
    }
}