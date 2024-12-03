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


document.getElementById('addGroupBtn').addEventListener('click', function () {
    const table = createTable();
    const container = document.querySelector('.group-container');
    container.appendChild(table);
    container.appendChild(createAddRowButton(table));
});

// Function to Create a Table
function createTable() {
    const table = document.createElement('table');
    table.className = 'group-table';

    const headerRow = createHeaderRow(table);
    table.appendChild(headerRow);

    addRow(table, headerRow); // Add Default Row
    return table;
}

// Function to Create Header Row
function createHeaderRow(table) {
    const headerRow = document.createElement('tr');
    headerRow.appendChild(createHeaderCell('⋮', 'fixed-column'));
    headerRow.appendChild(createHeaderCell('New Group', '', true));

    const plusHeader = createHeaderCell('+', 'plus-header');
    const dropdownMenu = createDropdownMenu(['Text', 'Numbers', 'Status', 'Key Persons', 'Timeline', 'Upload File'], (option) => {
        option === 'Timeline' ? addTimelineColumns(table, headerRow) : addColumn(option, table, headerRow);
        dropdownMenu.style.display = 'none';
        dropdownMenu.style.cursor = 'pointer';
    });

    plusHeader.addEventListener('click', () => {
        dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });
    plusHeader.appendChild(dropdownMenu);
    headerRow.appendChild(plusHeader);

    return headerRow;
}

// Function to Create Add Row Button
function createAddRowButton(table) {
    const addRowBtn = document.createElement('button');
    addRowBtn.className = 'add-item-btn';
    addRowBtn.textContent = 'Add Item';
    addRowBtn.addEventListener('click', () => addRow(table, table.rows[0]));
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
function addRow(table, headerRow) {
    const row = document.createElement('tr');

    Array.from(headerRow.cells).forEach((header, index) => {
        const cell = index === 0 ? createActionCell(row) : createCell(header.textContent);
        row.appendChild(cell);
    });

    table.appendChild(row);
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

// Synchronize the selected date to the calendar
function syncDateToCalendar(date) {
    if (!date) return;
    if (!pinnedDates.includes(date)) {
        pinnedDates.push(date); // Add the date to pinnedDates
    }
    renderCalendar(); // Re-render the calendar to reflect the changes
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
    deleteOption.addEventListener('click', () => row.remove());

    dropdownBtn.addEventListener('click', () => {
        dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });

    dropdownMenu.appendChild(deleteOption);
    cell.appendChild(dropdownBtn);
    cell.appendChild(dropdownMenu);
    return cell;
}

// Function to Handle File Upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            console.log('File content:', e.target.result);
            // Process the file content or upload it to a server
        };
        reader.readAsDataURL(file);
    }
}

document.getElementById('calendarBtn').addEventListener('click', function () {
    document.querySelector('.group-section').classList.remove('active-section');
    document.querySelector('.calendar-section').classList.add('active-section');
    setActiveButton('calendarBtn');
    renderCalendar();
});

// Calendar Variables
const calendarGrid = document.querySelector('.calendar-grid');
const monthYearDisplay = document.getElementById('monthYearDisplay');
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let pinnedDates = []; // Array to store pinned dates

// Function to Render Calendar
function renderCalendar() {
    calendarGrid.innerHTML = ''; // Clear previous calendar
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Display current month and year
    monthYearDisplay.textContent = `${new Date(currentYear, currentMonth).toLocaleString('en-US', { month: 'long' })} ${currentYear}`;

    // Add empty days for the previous month
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('calendar-day');
        calendarGrid.appendChild(emptyCell);
    }

    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.textContent = day;
        dayCell.classList.add('calendar-day');
        const fullDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Check if the date is pinned
        if (pinnedDates.includes(fullDate)) {
            dayCell.classList.add('pinned');
        }

        dayCell.addEventListener('click', () => togglePinDate(fullDate, dayCell));
        calendarGrid.appendChild(dayCell);
    }
}

// Function to Toggle Pin Date
function togglePinDate(date, dayCell) {
    if (pinnedDates.includes(date)) {
        pinnedDates = pinnedDates.filter(d => d !== date);
        dayCell.classList.remove('pinned');
    } else {
        pinnedDates.push(date);
        dayCell.classList.add('pinned');
    }
    renderCalendar();
}

// Function to Update Table with Pinned Dates
function updateTableWithPinnedDates() {
    const tables = document.querySelectorAll('.group-table');
    tables.forEach(table => {
        const headerRow = table.rows[0];
        const dateHeaders = Array.from(headerRow.cells).map(cell => cell.textContent.trim());

        pinnedDates.forEach(date => {
            if (!dateHeaders.includes(date)) {
                addColumn(date, table, headerRow);
            }
        });
    });
}

// Navigation Buttons for Calendar
document.getElementById('prevMonth').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
});

// Initialize Calendar
document.addEventListener('DOMContentLoaded', renderCalendar);


