let addGroupBtn;
import { 
    doc, collection, addDoc, getDocs, updateDoc, deleteDoc,query, where 
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { db } from './dashboard_script.js';

document.addEventListener('DOMContentLoaded', async function () {// Wait for DOM to load before accessing elements
    addGroupBtn = document.getElementById('addGroupBtn');
    console.log('Add Group Button:', addGroupBtn);
    if (addGroupBtn) {
        addGroupBtn.addEventListener('click', async function () {
            console.log('Add New Group button clicked');
            const container = document.querySelector('.group-container');
            const groupId = `group-${Date.now()}`;
            const groupData = { groupId, rows: [] };

            const docRef = await saveGroupData(groupData);
            
            const table = createTable(container, docRef.id); // Use Firestore document ID
            container.appendChild(table);
            createAddRowButton(table, container, docRef.id);
        });
    }
    try {
        const projectId = new URLSearchParams(window.location.search).get('projectId');
        const groupsQuery = query(
            collection(db, "groups"),
            where("projectId", "==", projectId)
        );
        const groupsSnapshot = await getDocs(groupsQuery);
        const container = document.querySelector('.group-container');
        groupsSnapshot.forEach((doc) => {
            const groupData = doc.data();
            const table = createTable(container, doc.id);
            container.appendChild(table);
            createAddRowButton(table, container, doc.id);
            if (groupData.columns) {// Populate existing columns
                groupData.columns.forEach(columnName => {
                    if (columnName !== "New Group") {
                        addColumn(columnName, table, table.rows[0]);
                    }
                });
            }
            if (groupData.rows) {// Populate existing rows
                groupData.rows.forEach(rowData => {
                    populateRow(table, rowData);
                });
            }
        });
    } catch (e) {
        console.error('Error loading groups:', e);
    }
});

async function saveGroupData(groupData) {//? main issue with data persistence is in how structuring and saving the group data.
    try {
        console.log('Creating new group with data:', groupData);
        const docRef = await addDoc(collection(db, "groups"), {
            groupId: groupData.groupId,
            projectId: new URLSearchParams(window.location.search).get('projectId'), // Get current project ID
            name: "New Group",
            columns: ["New Group"], // Initial columns
            createdAt: new Date().toISOString(),
            rows: []
        });
        console.log("Group created with ID:", docRef.id);
        return docRef;
    } catch (e) {
        console.error('Error saving group:', e);
        throw e;
    }
}

//? when adding columns, we need to update the Firestore document
async function updateGroupColumns(groupId, columns) {
    try {
        const groupRef = doc(db, "groups", groupId);
        await updateDoc(groupRef, {
            columns: columns
        });
    } catch (error) {
        console.error('Error updating columns:', error);
    }
}

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
function setActiveButton(buttonId) {// Function to set the active button
    document.getElementById('mainTableBtn').classList.remove('active');
    document.getElementById('calendarBtn').classList.remove('active');
    document.getElementById(buttonId).classList.add('active');
}
document.addEventListener('DOMContentLoaded', function() {// Set main table as the default active section on page load
    document.querySelector('.group-section').classList.add('active-section');
    document.querySelector('.calendar-section').classList.remove('active-section');
    setActiveButton('mainTableBtn');
});
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-menu') && !e.target.closest('.dropdown-btn') && !e.target.closest('.plus-header')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => menu.style.display = 'none');
    }
});

//!Implement Update for storing
function populateRow(table, rowData) {
    const row = document.createElement('tr');
    row.dataset.rowId = rowData.id; //! Store the row ID
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

// having problems of updating the group name
function createHeaderRow(table, groupId) {// Function to Create Header Row
    const headerRow = document.createElement('tr');
    const fixedColumnHeader = document.createElement('th');// Create a header cell for the dropdown button
    fixedColumnHeader.className = 'fixed-column';
    const dropdownBtn = document.createElement('button');
    dropdownBtn.textContent = '⋮';
    dropdownBtn.className = 'dropdown-btn';
    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'dropdown-menu';
    dropdownMenu.style.display = 'none';

    // Implement Updates
    const groupNameHeader = createHeaderCell('New Group', '', true);
    groupNameHeader.contentEditable = true;
    groupNameHeader.addEventListener('blur', async () => {
        const newName = groupNameHeader.textContent.trim();
        if (newName) {
            try {
                const groupRef = doc(db, 'groups', groupId);
                await updateGroupName(groupRef, { name: newName });
                console.log('Group name updated successfully');
            } catch (error) {
                console.error('Error updating group name:', error);
            }
        }
    });

    // Add "Delete Group" Option with proper event handling
    const deleteGroupOption = document.createElement('div');
    deleteGroupOption.textContent = 'Delete Group';
    deleteGroupOption.className = 'dropdown-item';
    
    deleteGroupOption.addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevent event bubbling
        try {
            await deleteGroup(groupId);
            const groupContainer = document.querySelector('.group-container');
            const addItemButton = document.querySelector(`.add-item-btn[data-id="${groupId}"]`);
            if (addItemButton) {
                addItemButton.remove();
            }
            if (table && table.parentNode) {
                table.parentNode.removeChild(table);
            }
            dropdownMenu.style.display = 'none';
        } catch (error) {
            console.error('Error deleting group:', error);
        }
    });

    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });

    dropdownMenu.appendChild(deleteGroupOption);
    fixedColumnHeader.appendChild(dropdownBtn);
    fixedColumnHeader.appendChild(dropdownMenu);
    headerRow.appendChild(fixedColumnHeader);

    headerRow.appendChild(createHeaderCell('New Group', '', true));// Add "New Group" header
    const plusHeader = createHeaderCell('+', 'plus-header');// Add the "+" header with dropdown for column types
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
async function updateGroupName(groupId, newName) {
    try {
        const groupRef = doc(db, 'groups', groupId);
        await updateDoc(groupRef, { name: newName });
        console.log('Group name updated successfully');
    } catch (error) {
        console.error('Error updating group name:', error);
    }
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
        const rowId = row.dataset.rowId;
        if (rowId) {
            await deleteRow(groupId, rowId);
            row.remove();
        }
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
//? add the updateColukmn
async function addColumn(option, table, headerRow) {
    if (Array.from(headerRow.cells).some(cell => cell.textContent.trim() === option)) return;

    const newHeader = createHeaderCell(option, '', true);
    headerRow.insertBefore(newHeader, headerRow.lastChild);

    // Get all current column headers
    const columns = Array.from(headerRow.cells)
        .map(cell => cell.textContent.trim())
        .filter(text => text !== '⋮' && text !== '+');

    // Update in Firestore
    const groupId = table.dataset.id;
    await updateGroupColumns(groupId, columns);

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
//? never actually called when adding new rows [1]
async function addRow(table, headerRow) {
    const row = document.createElement('tr');
    const groupId = table.dataset.id;
    const rowData = { 
        groupId, 
        cells: {},
        createdAt: new Date().toISOString()
    };

    Array.from(headerRow.cells).forEach((header, index) => {
        const headerText = header.textContent.trim();
        let cell;

        if (index === 0) {
            cell = createActionCell(row, groupId);
        } else {
            cell = createCell(headerText);

            rowData.cells[headerText] = '';
        }
        row.appendChild(cell);
    });

    // Save to Firestore first
    const docRef = await saveRowData(groupId, rowData);
    row.dataset.rowId = docRef.id; // Store the row ID for later use

    // Add event listeners to all editable cells
    row.querySelectorAll('td').forEach((cell, index) => {
        if (index > 0) { // Skip action cell
            addCellEventListeners(cell, headerRow.cells[index].textContent.trim(), row);
        }
    });

    table.appendChild(row);
    return row;
}

//! helper for renaming or creating item rows
function addCellEventListeners(cell, headerText, row) {
    if (headerText === 'Status') {
        const select = cell.querySelector('select');
        if (select) {
            select.addEventListener('change', () => saveRowChanges(row));
        }
    } else if (headerText === 'Start Date' || headerText === 'Due Date') {
        const dateInput = cell.querySelector('input[type="date"]');
        if (dateInput) {
            dateInput.addEventListener('change', () => saveRowChanges(row));
        }
    } else if (headerText === 'Upload File') {
        const fileInput = cell.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileUpload);
        }
    } else {
        cell.addEventListener('input', () => saveRowChanges(row));
        cell.addEventListener('blur', () => saveRowChanges(row));
    }
}

//! Update was not implemented bro
async function updateRowData(groupId, rowId, cells) {
    try {
        const groupRef = doc(db, 'groups', groupId);
        const rowRef = doc(collection(groupRef, 'contents'), rowId);
        await updateDoc(rowRef, {
            cells: cells,
            updatedAt: new Date().toISOString()
        });
        console.log('Row updated successfully:', cells);
    } catch (error) {
        console.error('Error updating row:', error);
        throw error;
    }
}

//? First, keep  saveRow function to collect the data [2]
function saveRow(groupId, row) {
    console.log('Starting saveRow with groupId:', groupId);
    const rowData = {
        groupId: groupId,
        cells: {},
        createdAt: new Date().toISOString()
    };

    row.querySelectorAll('td').forEach((cell, index) => {
        const headerText = table.querySelectorAll('thead th')[index].textContent.trim();
        console.log('Processing cell:', headerText, cell.textContent);
        rowData.cells[headerText] =
            headerText === 'Start Date' || headerText === 'Due Date'
                ? new Date(cell.querySelector('input[type="date"]').value).toISOString()
                : headerText === 'Upload File'
                ? cell.dataset.fileUrl
                : cell.textContent;
    });

    console.log('Row data before saving:', rowData);
    return saveRowData(groupId, rowData);
}

//? Then add the new saveRowData function to handle Firestore operations
async function saveRowData(groupId, rowData) {
    try {
        console.log('Starting saveRowData with:', { groupId, rowData });
        const groupRef = doc(db, 'groups', groupId);
        const contentsRef = collection(groupRef, 'contents');
        
        // Ensure all required fields are present
        const enhancedRowData = {
            ...rowData,
            updatedAt: new Date().toISOString(),
            cells: {
                ...rowData.cells,
                'Status': rowData.cells['Status'] || 'Pending',
                'Key Persons': rowData.cells['Key Persons'] || '',
                'Text': rowData.cells['Text'] || '',
                'Numbers': rowData.cells['Numbers'] || '',
                'Start Date': rowData.cells['Start Date'] || null,
                'Due Date': rowData.cells['Due Date'] || null,
                'Upload File': rowData.cells['Upload File'] || null
            }
        };
        
        const docRef = await addDoc(contentsRef, enhancedRowData);
        console.log('Row data saved successfully with ID:', docRef.id);
        return docRef;
    } catch (error) {
        console.error('Error in saveRowData:', error);
        throw error;
    }
}

//! add Updates
async function saveRowChanges(row) {
    const table = row.closest('table');
    const groupId = table.dataset.id;
    const rowId = row.dataset.rowId;
    
    if (!groupId || !rowId) {
        console.error('Missing groupId or rowId');
        return;
    }

    const cells = {};
    const headerRow = table.rows[0];
    
    Array.from(row.cells).forEach((cell, index) => {
        if (index === 0) return; // Skip action column
        
        const headerText = headerRow.cells[index].textContent.trim();
        let value;

        // Handle different types of inputs
        if (headerText === 'Status') {
            const select = cell.querySelector('select');
            value = select ? select.value : '';
        } else if (headerText === 'Start Date' || headerText === 'Due Date') {
            const dateInput = cell.querySelector('input[type="date"]');
            value = dateInput ? dateInput.value : '';
        } else if (headerText === 'Upload File') {
            value = cell.dataset.fileUrl || '';
        } else {
            value = cell.textContent.trim();
        }

        cells[headerText] = value;
    });

    try {
        await updateRowData(groupId, rowId, cells);
        console.log('Row updated successfully');
    } catch (error) {
        console.error('Error updating row:', error);
    }
}


function createCell(headerText) {// Function to Create Cell
    const cell = document.createElement('td');
    if (headerText === 'Start Date' || headerText === 'Due Date') {
        return createDateCell();
    } else if (headerText === 'Numbers') {
        cell.contentEditable = true;
        cell.addEventListener('input', () => {
            cell.textContent = cell.textContent.replace(/[^0-9]/g, '');
        });
    } else if (headerText === 'Status') {
        const select = createSelect(['To-do', 'In Progress', 'Done']);
        cell.appendChild(select);
    } else if (headerText === 'Key Persons') {
        const input = document.createElement('input');
        input.type = 'email';
        input.placeholder = 'Enter Google email';
        input.addEventListener('change', async () => {
            const email = input.value.trim();
            if (validateEmail(email)) {
                await sendEmailNotification(email);
            } else {
                alert('Please enter a valid email address.');
            }
        });
        cell.appendChild(input);
    } else if (headerText === 'Upload File') {
        const fileInput = createInput('file');
        fileInput.addEventListener('change', handleFileUpload);
        cell.appendChild(fileInput);
    } else {
        cell.contentEditable = true;
    }
    return cell;
}
function validateEmail(email) {// Helper: Validate Email
    const re = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return re.test(email);
}
async function sendEmailNotification(email) {
    try {
        const response = await fetch('/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        if (response.ok) {
            alert('Notification sent successfully!');
        } else {
            const error = await response.json();
            console.error('Error sending email:', error);
            alert('Failed to send notification.');
        }
    } catch (error) {
        console.error('Network error:', error);
        alert('Failed to send notification.');
    }
}




function createDateCell() {// Function to Create Date Cell
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
function createInput(type, placeholder = '') {// Function to Create Input
    const input = document.createElement('input');
    input.type = type;
    input.style.width = '100%';
    if (placeholder) input.placeholder = placeholder;
    return input;
}
function createSelect(options) {// Function to Create Select
    const select = document.createElement('select');
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
    });
    return select;
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
        console.log('Deleting group:', groupId);
        const groupRef = doc(db, 'groups', groupId);// First, delete all rows in the group's contents subcollection
        const contentsRef = collection(groupRef, 'contents');
        const contentsSnapshot = await getDocs(contentsRef);
        const deletionPromises = contentsSnapshot.docs.map(doc => 
            deleteDoc(doc.ref)
        );
        await Promise.all(deletionPromises);
        await deleteDoc(groupRef);// Then delete the group document itself
        console.log('Group and all contents deleted:', groupId);
    } catch (e) {
        console.error('Error deleting group:', e);
        throw e;
    }
}
async function deleteRow(groupId, rowId) {
    try {
        const groupRef = doc(db, 'groups', groupId);
        const rowRef = doc(collection(groupRef, 'contents'), rowId);
        await deleteDoc(rowRef);
        console.log('Row deleted:', rowId);
    } catch (e) {
        console.error('Error deleting row:', e);
        throw e;
    }
}