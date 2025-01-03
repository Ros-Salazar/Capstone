import { fetchProjectDetails, fetchAndRenderGroups, addGroup } from './apiCalls.js';
import { setActiveButton, createTable, createAddRowButton } from './domManipulation.js';
import { setupEventListeners } from './eventHandlers.js';
import { fetchAndRenderRows } from './apiCalls.js'; 

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize buttons and sections
    const mainTableBtn = document.getElementById('mainTableBtn');
    const calendarBtn = document.getElementById('calendarBtn');
    const groupSection = document.querySelector('.group-section');
    const calendarSection = document.querySelector('.calendar-section');
    const addGroupBtn = document.getElementById('addGroupBtn');
    const groupContainer = document.querySelector('.group-container'); // Ensure this selector matches your HTML
    const projectNameElement = document.getElementById('projectName');
    const projectDescriptionElement = document.getElementById('projectDescription');

    // Check if all required DOM elements are present
    if (!mainTableBtn || !calendarBtn || !groupSection || !calendarSection || !addGroupBtn || !groupContainer || !projectNameElement || !projectDescriptionElement) {
        console.error('One or more DOM elements are missing');
        return;
    }

    // Hide the Add New Group button for staff users
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'staff') {
        addGroupBtn.style.display = 'none';
    }

    // Get the project ID from the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId');

    // Check if project ID is present in the URL
    if (!projectId) {
        console.error('Project ID not found in URL');
        return;
    }

    // Fetch project details and render groups
    await fetchProjectDetails(projectId);
    await fetchAndRenderGroups(projectId);

    // Ensure the default group and rows are created
    await ensureDefaultGroupAndRows(projectId, groupContainer);

    // Setup event listeners
    setupEventListeners({
        mainTableBtn,
        calendarBtn,
        groupSection,
        calendarSection,
        addGroupBtn,
        groupContainer,
        projectNameElement,
        projectDescriptionElement,
        projectId
    });

    // Set main table as the default active section on page load
    groupSection.classList.add('active-section');
    calendarSection.classList.remove('active-section');
    setActiveButton('mainTableBtn');
});

// Function to ensure default group and rows are created
async function ensureDefaultGroupAndRows(projectId, groupContainer) {
    try {
        const response = await fetch(`http://127.0.0.1:3000/api/project/${projectId}/default_group`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const group = await response.json();

        if (group) {
            console.log('Default group already exists:', group);
            // Render the existing group and its rows
            const table = createTable(group.id, group.name);
            groupContainer.appendChild(table);
            createAddRowButton(table, group.id, groupContainer);
            await fetchAndRenderRows(group.id, table);
        } else {
            console.log('Creating default group...');
            await addGroup(projectId, groupContainer, 'Sample Group');
        }
    } catch (error) {
        console.error('Error ensuring default group and rows:', error);
    }
}