import { fetchProjectDetails, fetchAndRenderGroups } from './apiCalls.js';
import { setActiveButton, createAddRowButton, addRow } from './domManipulation.js';
import { setupEventListeners } from './eventHandlers.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize buttons and sections
    const mainTableBtn = document.getElementById('mainTableBtn');
    const calendarBtn = document.getElementById('calendarBtn');
    const groupSection = document.querySelector('.group-section');
    const calendarSection = document.querySelector('.calendar-section');
    const addGroupBtn = document.getElementById('addGroupBtn');
    const groupContainer = document.querySelector('.group-container');
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
        projectId,
        addRow // Pass the addRow function
    });

    // Set main table as the default active section on page load
    groupSection.classList.add('active-section');
    calendarSection.classList.remove('active-section');
    setActiveButton('mainTableBtn');
});