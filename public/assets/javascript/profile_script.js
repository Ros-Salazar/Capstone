// DOM Elements
const profileForm = document.getElementById('profileForm');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const positionInput = document.getElementById('position');
const userIdInput = document.getElementById('userId');
const logoutButton = document.getElementById('logoutButton');
const navigationPane = document.getElementById('navigationPane');
const projectList = document.getElementById('projectList');

// Fetch User Profile Data
const fetchUserProfile = async (email) => {
    try {
        const response = await fetch(`http://127.0.0.1:3000/api/user/profile?email=${email}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const userData = await response.json();
        return userData;
    } catch (error) {
        console.error("Error fetching user profile:", error);
    }
};

// Populate Profile Form
const populateProfile = (userData) => {
    if (userData) {
        firstNameInput.value = userData.first_name || "";
        lastNameInput.value = userData.last_name || "";
        emailInput.value = userData.email || "";
        positionInput.value = userData.position || "";

        // Make position and email fields uneditable
        emailInput.setAttribute('readonly', true);
        positionInput.setAttribute('readonly', true);
    } else {
        alert("Failed to load profile information.");
    }
};

// Fetch and populate profile data on page load
document.addEventListener('DOMContentLoaded', async () => {
    const userEmail = 'user@example.com'; // Replace with the actual user's email
    const userData = await fetchUserProfile(userEmail);
    populateProfile(userData);

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const updatedUserData = {
            first_name: firstNameInput.value.trim(),
            last_name: lastNameInput.value.trim(),
            email: emailInput.value.trim(),
            position: positionInput.value.trim(),
            password: passwordInput.value.trim()
        };

        await saveUserProfile(updatedUserData);
    });
});

// Save Profile Data
const saveUserProfile = async (userData) => {
    try {
        const response = await fetch(`/api/user/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        const result = await response.json();
        if (result.success) {
            alert("Profile updated successfully.");
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error("Error saving profile:", error);
        alert("Failed to save profile. Please try again.");
    }
};

// Logout Button Functionality
logoutButton.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/logout', { method: 'POST' });
        const result = await response.json();
        if (result.success) {
            alert("You have been logged out.");
            window.location.href = "/public/index.html";
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error("Error during logout:", error);
        alert("Failed to log out. Please try again.");
    }
});

// Populate Navigation Pane
const fetchProjectsForNav = async () => {
    try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const projects = await response.json();
        return projects;
    } catch (error) {
        console.error("Error fetching projects:", error);
    }
};

const populateNavigationPane = async () => {
    projectList.innerHTML = ''; // Clear existing items
    const projects = await fetchProjectsForNav();
    if (projects) {
        projects.forEach((project) => {
            const li = document.createElement('li');
            li.textContent = project.name;
            li.className = project.group;
            li.addEventListener('click', () => openProject(project.id));
            projectList.appendChild(li);
        });
    }
};

// Handle navigation pane toggle
document.querySelector('.header-right a[href="#projects"]').addEventListener('click', async (e) => {
    e.preventDefault();
    if (navigationPane.style.display === 'none' || !navigationPane.style.display) {
        await populateNavigationPane();
        navigationPane.style.display = 'block';
    } else {
        navigationPane.style.display = 'none';
    }
});

// Redirect to Project Template
const openProject = (projectId) => {
    window.location.href = `projectTemplate.html?projectId=${projectId}`;
};