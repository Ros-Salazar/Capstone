// Get the elements
const newProjectBtn = document.getElementById('newProjectBtn');
const popupWindow = document.getElementById('popupWindow');
const closeBtns = document.querySelectorAll('.close-btn');
const projectForm = document.getElementById('projectForm');
const projectContainer = document.getElementById('projectContainer');
const noProjectsText = document.getElementById('noProjectsText');
const editPopupWindow = document.getElementById('editPopupWindow');
const editProjectForm = document.getElementById('editProjectForm');
let currentProjectBox = null; // Track the project being edited

// Modal for opening project details
const projectDetailModal = document.getElementById('projectDetailModal');

// Show popup when 'Add Project' is clicked
newProjectBtn.addEventListener('click', () => {
    popupWindow.style.display = 'flex';
});

// Close popup when 'X' is clicked
closeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
        popupWindow.style.display = 'none';
        editPopupWindow.style.display = 'none';
        projectDetailModal.style.display = 'none';
    });
});

// Close popup if clicking outside of the popup content
window.addEventListener('click', (event) => {
    if (event.target === popupWindow) {
        popupWindow.style.display = 'none';
    }
    if (event.target === editPopupWindow) {
        editPopupWindow.style.display = 'none';
    }
    if (event.target === projectDetailModal) {
        projectDetailModal.style.display = 'none';
    }
});

// Handle project creation
projectForm.addEventListener('submit', (event) => {
    event.preventDefault();
    
    // Get form values
    const projectName = document.getElementById('project-name').value;
    const location = document.getElementById('location').value;

    // Save the project name in localStorage
    localStorage.setItem('selectedProjectName', projectName);

    // Create project box
    const projectBox = document.createElement('div');
    projectBox.classList.add('project-box');
    projectBox.setAttribute('draggable', true);

    // Progress bar
    const progressBar = document.createElement('div');
    progressBar.classList.add('progress-bar');
    projectBox.innerHTML = `
        <h3>${projectName}</h3>
        <p>${location}</p>
        <p>0% COMPLETED</p>
        <i class="fas fa-pencil-alt edit-icon"></i>
    `;

    projectBox.insertBefore(progressBar, projectBox.firstChild);

    // Add project box to the container
    projectContainer.appendChild(projectBox);

    // Hide "No Current Projects" text
    noProjectsText.style.display = 'none';

    // Close the popup
    popupWindow.style.display = 'none';

    // Clear the form
    projectForm.reset();

    // Make the pencil icon visible only on hover
    const editIcon = projectBox.querySelector('.edit-icon');
    editIcon.style.display = 'none'; // Hide the pencil icon after creation

    projectBox.addEventListener('mouseenter', () => {
        editIcon.style.display = 'block';
    });
    projectBox.addEventListener('mouseleave', () => {
        editIcon.style.display = 'none';
    });

    // Make project box clickable to open details
    projectBox.addEventListener('click', (e) => {
        if (!e.target.classList.contains('edit-icon')) { // Avoid triggering if edit icon is clicked
            // Navigate to the project details HTML file
            window.location.href = "../ProjectTemplate/ProjectTemplate.html";
        }
    });
    projectContainer.appendChild(projectBox);
    noProjectsText.style.display = 'none';
    popupWindow.style.display = 'none';
    projectForm.reset();

    // Edit button functionality: open the edit popup with current project info
    editIcon.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering project details click event

        // Store the current project box for updating later
        currentProjectBox = projectBox;

        // Pre-fill the edit form with current project info
        document.getElementById('edit-project-name').value = projectBox.querySelector('h3').textContent;
        document.getElementById('edit-location').value = projectBox.querySelector('p').textContent;

        // Show the edit popup
        editPopupWindow.style.display = 'flex';
    });

    // Enable drag-and-drop functionality
    enableDragAndDrop(projectBox);
});

// Handle project editing
editProjectForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // Get updated values from the edit form
    const updatedProjectName = document.getElementById('edit-project-name').value;
    const updatedLocation = document.getElementById('edit-location').value;

    // Update the current project box with new values
    currentProjectBox.querySelector('h3').textContent = updatedProjectName;
    currentProjectBox.querySelector('p').textContent = updatedLocation;

    // Close the edit popup
    editPopupWindow.style.display = 'none';

    // Clear the edit form
    editProjectForm.reset();

    // Re-hide the edit icon until the user hovers over the project box again
    const editIcon = currentProjectBox.querySelector('.edit-icon');
    editIcon.style.display = 'none';

    // Re-enable hover effect for showing the edit icon
    currentProjectBox.addEventListener('mouseenter', () => {
        editIcon.style.display = 'block';
    });

    currentProjectBox.addEventListener('mouseleave', () => {
        editIcon.style.display = 'none';
    });
});

// Function to enable drag-and-drop functionality and allow reordering
function enableDragAndDrop(projectBox) {
    projectBox.style.cursor = 'pointer'; // Default cursor for clicking

    projectBox.addEventListener('dragstart', () => {
        projectBox.classList.add('dragging');
        projectBox.style.cursor = 'grabbing'; // Change cursor to grabbing while dragging
    });

    projectBox.addEventListener('dragend', () => {
        projectBox.classList.remove('dragging');
        projectBox.style.cursor = 'pointer'; // Revert cursor back to pointer after dragging
    });

    projectContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(projectContainer, e.clientY);
        if (afterElement == null) {
            projectContainer.appendChild(projectBox);
        } else {
            projectContainer.insertBefore(projectBox, afterElement);
        }
    });
}

// Helper function to get the next draggable element
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.project-box:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateProgressBar(projectBox, completion) {
    const progressBar = projectBox.querySelector('.progress-bar');
    progressBar.style.width = `${completion}%`;
    projectBox.querySelector('.completion-text').textContent = `${completion}% COMPLETED`;
}

