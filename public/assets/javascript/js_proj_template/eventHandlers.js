import { createTable, setActiveButton } from './domManipulation.js';
import { saveProjectDetails, addGroup } from './apiCalls.js';

export function setupEventListeners({ mainTableBtn, calendarBtn, groupSection, calendarSection, addGroupBtn, groupContainer, projectNameElement, projectDescriptionElement, projectId }) {
    mainTableBtn.addEventListener('click', function() {
        groupSection.classList.add('active-section');
        calendarSection.classList.remove('active-section');
        setActiveButton('mainTableBtn');
    });

    calendarBtn.addEventListener('click', function() {
        groupSection.classList.remove('active-section');
        calendarSection.classList.add('active-section');
        setActiveButton('calendarBtn');
    });

    addGroupBtn.addEventListener('click', async function() {
        await addGroup(projectId, groupContainer);
    });

    projectNameElement.addEventListener('blur', () => saveProjectDetails(projectId));
    projectDescriptionElement.addEventListener('blur', () => saveProjectDetails(projectId));
}