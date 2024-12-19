document.getElementById('mainTableBtn').addEventListener('click', function() {
    document.querySelector('.group-section').classList.add('active-section');
    document.querySelector('.calendar-section').classList.remove('active-section');
    setActiveButton('mainTableBtn');
});
document.getElementById('calendarBtn').addEventListener('click', function() {
    document.querySelector('.group-section').classList.remove('active-section');
    document.querySelector('.calendar-section').classList.add('active-section');
    setActiveButton('calendarBtn');
});
// Function to set the active button
function setActiveButton(buttonId) {
    document.getElementById('mainTableBtn').classList.remove('active');
    document.getElementById('calendarBtn').classList.remove('active');
    document.getElementById(buttonId).classList.add('active');
}
// Set main table as the default active section on page load
document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.group-section').classList.add('active-section');
    document.querySelector('.calendar-section').classList.remove('active-section');
    setActiveButton('mainTableBtn');
});
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-menu') && !e.target.closest('.dropdown-btn') && !e.target.closest('.plus-header')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => menu.style.display = 'none');
    }
});


document.getElementById('addGroupBtn').addEventListener('click', async function () {
    console.log('Add New Group button clicked');
    const container = document.querySelector('.group-container');
    const groupId = `group-${Date.now()}`;
    const groupData = { groupId, rows: [] };
        
    await saveGroupData(groupData); // Ensure Firestore integration is correct
        
    const table = createTable(container, groupId);
    container.appendChild(table);
    createAddRowButton(table, container, groupId);
});
async function saveGroupData(groupData) {
    try {
        const docRef = await db.collection('groups').doc(groupData.groupId).set(groupData);
        console.log('Group saved with ID:', docRef.id);
    } catch (e) {
        console.error('Error saving group:', e);
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    try {
        const groupsSnapshot = await db.collection('groups').get();
        const container = document.querySelector('.group-container');

        for (const doc of groupsSnapshot.docs) {
            const groupData = doc.data();
            const table = createTable(container, groupData.groupId);
            container.appendChild(table);
            createAddRowButton(table, container, groupData.groupId);

            // Fetch and populate rows from the subcollection
            const rowsSnapshot = await doc.ref.collection('contents').get();
            rowsSnapshot.forEach(rowDoc => {
                const rowData = rowDoc.data();
                populateRow(table, rowData);
            });
        }
    } catch (e) {
        console.error('Error loading groups:', e);
    }
});


function populateRow(table, rowData) {
    const row = document.createElement('tr');
    const headerRow = table.rows[0];

    Array.from(headerRow.cells).forEach((header, index) => {
        const headerText = header.textContent.trim();
        const cell = index === 0 ? createActionCell(row) : createCell(headerText);
        row.appendChild(cell);

        if (index > 0) {
            const value = rowData.cells[headerText] || '';
            if (headerText === 'Upload File') {
                cell.dataset.fileUrl = value;
                const fileInput = createInput('file');
                fileInput.addEventListener('change', handleFileUpload);
                cell.appendChild(fileInput);
            } else if (headerText === 'Status') {
                const select = createSelect(['To-do', 'In Progress', 'Done']);
                select.value = value;
                cell.appendChild(select);
            } else {
                cell.contentEditable = true;
                cell.textContent = value;
            }
        }
    });

    table.appendChild(row);
}

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCOo_r7lBGB_FiuwFIcsc-ecRsd43pDXF0",
    authDomain: "ceo-projectmanagementweb.firebaseapp.com",
    projectId: "ceo-projectmanagementweb",
    storageBucket: "ceo-projectmanagementweb.appspot.com",
    messagingSenderId: "60010633148",
    appId: "1:60010633148:web:abaa3776928df2a351fdb9",
};
// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();


// Function to Create a Table
function createTable(container, groupId) {
    const table = document.createElement('table');
    table.className = 'group-table';
    table.dataset.id = groupId; // Associate the table with the group ID

    const headerRow = createHeaderRow(table, groupId);
    table.appendChild(headerRow);

    addRow(table, headerRow); // Add Default Row
    return table;
}

// Function to Create Header Row
function createHeaderRow(table, groupId) {
    const headerRow = document.createElement('tr');

    // Create a header cell for the dropdown button
    const fixedColumnHeader = document.createElement('th');
    fixedColumnHeader.className = 'fixed-column';
    const dropdownBtn = document.createElement('button');
    dropdownBtn.textContent = '⋮';
    dropdownBtn.className = 'dropdown-btn';

    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'dropdown-menu';
    dropdownMenu.style.display = 'none';

    // Add "Delete Group" Option
    const deleteGroupOption = document.createElement('div');
    deleteGroupOption.textContent = 'Delete Group';
    deleteGroupOption.className = 'dropdown-item';
    deleteGroupOption.addEventListener('click', () => {
        const groupContainer = document.querySelector('.group-container'); // Reference the container
        const addItemButton = document.querySelector(`.add-item-btn[data-id="${groupId}"]`); // Find the associated "Add Item" button
        if (addItemButton) addItemButton.remove(); // Remove the button
        groupContainer.removeChild(table); // Remove the table from the container
    });

    dropdownBtn.addEventListener('click', () => {
        dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });

    dropdownMenu.appendChild(deleteGroupOption);
    fixedColumnHeader.appendChild(dropdownBtn);
    fixedColumnHeader.appendChild(dropdownMenu);
    headerRow.appendChild(fixedColumnHeader);

    // Add "New Group" header
    headerRow.appendChild(createHeaderCell('New Group', '', true));

    // Add the "+" header with dropdown for column types
    const plusHeader = createHeaderCell('+', 'plus-header');
    plusHeader.style.cursor = 'pointer';

    const columnDropdownMenu = createDropdownMenu(
        ['Text', 'Numbers', 'Status', 'Key Persons', 'Timeline', 'Upload File'],
        (option) => {
            option === 'Timeline'
                ? addTimelineColumns(table, headerRow)
                : addColumn(option, table, headerRow);
            columnDropdownMenu.style.display = 'none';
        }
    );

    plusHeader.addEventListener('click', () => {
        columnDropdownMenu.style.display = columnDropdownMenu.style.display === 'none' ? 'block' : 'none';
    });

    plusHeader.appendChild(columnDropdownMenu);
    headerRow.appendChild(plusHeader);

    return headerRow;
}

function createActionCell(row, groupId) {
    const cell = document.createElement('td');
    cell.className = 'fixed-column';

    const dropdownBtn = document.createElement('button');
    dropdownBtn.textContent = '⋮';
    dropdownBtn.className = 'dropdown-btn';

    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'dropdown-menu';
    dropdownMenu.style.display = 'none';

    const deleteOption = document.createElement('div');
    deleteOption.textContent = 'Delete Row';
    deleteOption.className = 'dropdown-item';
    deleteOption.addEventListener('click', async () => {
        row.remove();
        const rowData = {}; // Define or pass the correct rowData structure
        await deleteRow(groupId, rowData);
    });

    dropdownBtn.addEventListener('click', () => {
        dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });

    dropdownMenu.appendChild(deleteOption);
    cell.appendChild(dropdownBtn);
    cell.appendChild(dropdownMenu);
    return cell;
}


// Function to Create Add Row Button
function createAddRowButton(table, container, groupId) {
    const addRowBtn = document.createElement('button');
    addRowBtn.className = 'add-item-btn';
    addRowBtn.dataset.id = groupId; // Associate the button with the group ID
    addRowBtn.textContent = 'Add Item';
    addRowBtn.addEventListener('click', () => addRow(table, table.rows[0]));
    container.appendChild(addRowBtn);
    return addRowBtn;
}

// Function to Create Header Cell
function createHeaderCell(text, className = '', editable = false) {
    const header = document.createElement('th');
    header.textContent = text;
    header.className = className;
    if (editable) header.contentEditable = true;
    return header;
}

// Function to Create Dropdown Menu
function createDropdownMenu(options, onSelect) {
    const menu = document.createElement('div');
    menu.className = 'dropdown-menu';
    menu.style.display = 'none';

    options.forEach(option => {
        const item = document.createElement('div');
        item.textContent = option;
        item.className = 'dropdown-item';
        item.addEventListener('click', () => onSelect(option));
        menu.appendChild(item);
    });

    return menu;
}

// Function to Add a Column
function addColumn(option, table, headerRow) {
    if (Array.from(headerRow.cells).some(cell => cell.textContent.trim() === option)) return;

    const newHeader = createHeaderCell(option, '', true);
    headerRow.insertBefore(newHeader, headerRow.lastChild);

    Array.from(table.rows).forEach((row, index) => {
        if (index === 0) return;
        row.insertBefore(createCell(option), row.lastChild);
    });
}

// Function to Add Timeline Columns
function addTimelineColumns(table, headerRow) {
    ['Start Date', 'Due Date'].forEach(dateColumn => {
        const newHeader = createHeaderCell(dateColumn, '', true);
        headerRow.insertBefore(newHeader, headerRow.lastChild);

        Array.from(table.rows).forEach((row, index) => {
            if (index === 0) return; // Skip the header row
            const dateCell = createDateCell();
            row.insertBefore(dateCell, row.lastChild);

            // Add synchronization to the calendar
            const dateInput = dateCell.querySelector('input[type="date"]');
            dateInput.addEventListener('change', () => syncDateToCalendar(dateInput.value));
        });
    });
}

// Function to Add a Row
async function addRow(table, headerRow) {
    const row = document.createElement('tr');
    const groupId = table.dataset.id;
    const projectId = "currentProjectId"; // Replace with the actual project ID context.
    const rowData = { groupId, cells: {} };

    Array.from(headerRow.cells).forEach((header, index) => {
        const headerText = header.textContent.trim();
        const cell = index === 0 ? createActionCell(row) : createCell(headerText);
        row.appendChild(cell);

        if (index > 0) {
            rowData.cells[headerText] = headerText === 'Upload File' ? null : '';
        }
    });

    table.appendChild(row);
    await saveToSubCollection(projectId, rowData); // Save row data to the project's subcollection.
}

function saveRow(groupId, row) {
    const rowData = {
        groupId: groupId,
        cells: {},
    };

    row.querySelectorAll('td').forEach((cell, index) => {
        const headerText = table.querySelectorAll('thead th')[index].textContent.trim();
        rowData.cells[headerText] =
            headerText === 'Start Date' || headerText === 'Due Date'
                ? new Date(cell.querySelector('input[type="date"]').value).toISOString()
                : headerText === 'Upload File'
                ? cell.dataset.fileUrl
                : cell.textContent;
    });

    saveRowData(rowData);
}

// Function to Create Cell
function createCell(headerText) {
    const cell = document.createElement('td');

    if (headerText === 'Start Date' || headerText === 'Due Date') {
        return createDateCell();
    } else if (headerText === 'Numbers') {
        cell.appendChild(createInput('text', 'Enter Value'));
    } else if (headerText === 'Status') {
        cell.appendChild(createSelect(['To-do', 'In Progress', 'Done']));
    } else if (headerText === 'Key Persons') {
        cell.appendChild(createInput('email'));
    } else if (headerText === 'Upload File') {
        const fileInput = createInput('file');
        fileInput.addEventListener('change', handleFileUpload);
        cell.appendChild(fileInput);
    } else {
        cell.contentEditable = true;
    }

    return cell;
}

// Function to Create Date Cell
function createDateCell() {
    const cell = document.createElement('td');
    const dateInput = createInput('date');
    const dateDisplay = document.createElement('span');
    dateDisplay.className = 'formatted-date';
    dateDisplay.style.cursor = 'pointer';
    dateDisplay.style.display = 'none';

    dateInput.addEventListener('change', () => {
        const date = new Date(dateInput.value);
        if (!isNaN(date)) {
            dateDisplay.textContent = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
            dateInput.style.display = 'none';
            dateDisplay.style.display = 'block';

            // Synchronize with calendar
            syncDateToCalendar(dateInput.value);
        }
    });

    dateDisplay.addEventListener('click', () => {
        dateInput.style.display = 'block';
        dateDisplay.style.display = 'none';
    });

    cell.appendChild(dateInput);
    cell.appendChild(dateDisplay);
    return cell;
}

// Function to Create Input
function createInput(type, placeholder = '') {
    const input = document.createElement('input');
    input.type = type;
    input.style.width = '100%';
    if (placeholder) input.placeholder = placeholder;
    return input;
}

// Function to Create Select
function createSelect(options) {
    const select = document.createElement('select');
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
    });
    return select;
}

// Function to Create Action Cell
function createActionCell(row) {
    const cell = document.createElement('td');
    cell.className = 'fixed-column';

    const dropdownBtn = document.createElement('button');
    dropdownBtn.textContent = '⋮';
    dropdownBtn.className = 'dropdown-btn';

    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'dropdown-menu';
    dropdownMenu.style.display = 'none';

    const deleteOption = document.createElement('div');
    deleteOption.textContent = 'Delete Row';
    deleteOption.className = 'dropdown-item';
    deleteOption.addEventListener('click', async () => {
        row.remove();
        await deleteRow(groupId, rowData);
    });

    dropdownBtn.addEventListener('click', () => {
        dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });

    dropdownMenu.appendChild(deleteOption);
    cell.appendChild(dropdownBtn);
    cell.appendChild(dropdownMenu);
    return cell;
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const progressIndicator = document.createElement('div');
        progressIndicator.textContent = 'Uploading...';
        event.target.parentElement.appendChild(progressIndicator);

        const fileUrl = await uploadFile(file);
        progressIndicator.textContent = 'Upload complete!';
        event.target.parentElement.dataset.fileUrl = fileUrl;

        console.log('File uploaded and URL saved:', fileUrl);
    }
}
async function uploadFile(file) {
    const storageRef = storage.ref(`uploads/${Date.now()}-${file.name}`);
    const snapshot = await storageRef.put(file);
    return await snapshot.ref.getDownloadURL();
}


async function deleteGroup(groupId) {
    try {
        await db.collection('groups').doc(groupId).delete();
        console.log('Group deleted:', groupId);
    } catch (e) {
        console.error('Error deleting group:', e);
    }
}

async function deleteRow(groupId, rowId) {
    try {
        const groupRef = db.collection('groups').doc(groupId);
        await groupRef.collection('contents').doc(rowId).delete();
        console.log('Row deleted from subcollection:', rowId);
    } catch (e) {
        console.error('Error deleting row:', e);
    }
}


async function saveToSubCollection(projectId, data) {
    try {
        // Access the "projects" collection and then the specified project's sub-collection
        const projectRef = db.collection('projects').doc(projectId);
        await projectRef.collection('contents').add(data); // Save data into the "contents" sub-collection

        console.log('Data successfully saved in the sub-collection');
    } catch (error) {
        console.error('Error saving to sub-collection:', error);
    }
}

