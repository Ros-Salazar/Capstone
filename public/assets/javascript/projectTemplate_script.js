document.addEventListener('DOMContentLoaded', function() {
    const mainTableBtn = document.getElementById('mainTableBtn');
    const calendarBtn = document.getElementById('calendarBtn');
    const groupSection = document.querySelector('.group-section');
    const calendarSection = document.querySelector('.calendar-section');

    if (!mainTableBtn || !calendarBtn || !groupSection || !calendarSection) {
        console.error('One or more DOM elements are missing');
        return;
    }

    mainTableBtn.addEventListener('click', function() {
        groupSection.classList.add('active-section');
        calendarSection.classList.remove('active-section');
        setActiveButton('mainTableBtn');
    });

    calendarBtn.addEventListener('click', function() {
        groupSection.classList.remove('active-section');
        calendarSection.classList.add('active-section');
        setActiveButton('calendarBtn');
        renderCalendar(); // Ensure calendar is rendered when the button is clicked
    });

    // Set main table as the default active section on page load
    groupSection.classList.add('active-section');
    calendarSection.classList.remove('active-section');
    setActiveButton('mainTableBtn');

    function setActiveButton(buttonId) {
        mainTableBtn.classList.remove('active');
        calendarBtn.classList.remove('active');
        document.getElementById(buttonId).classList.add('active');
    }

    // Data structure to store group information
    let groupData = [];

    document.getElementById('addGroupBtn').addEventListener('click', function () {
        const container = document.querySelector('.group-container');
        const groupId = `group-${Date.now()}`;
        const table = createTable(container, groupId);
        container.appendChild(table);
        createAddRowButton(table, container, groupId);
        groupData.push({ id: groupId, name: `Group ${groupData.length + 1}`, rows: [] }); // Add new group to groupData
    });

    // Function to Create a Table
    function createTable(container, groupId) {
        const table = document.createElement('table');
        table.className = 'group-table';
        table.dataset.id = groupId;

        const headerRow = createHeaderRow(table, groupId);
        table.appendChild(headerRow);

        addRow(table, headerRow);
        return table;
    }

    // Function to Create Header Row
    function createHeaderRow(table, groupId) {
        const headerRow = document.createElement('tr');

        const fixedColumnHeader = document.createElement('th');
        fixedColumnHeader.className = 'fixed-column';
        const dropdownBtn = document.createElement('button');
        dropdownBtn.textContent = '⋮';
        dropdownBtn.className = 'dropdown-btn';

        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'dropdown-menu';
        dropdownMenu.style.display = 'none';

        const deleteGroupOption = document.createElement('div');
        deleteGroupOption.textContent = 'Delete Group';
        deleteGroupOption.className = 'dropdown-item';
        deleteGroupOption.addEventListener('click', () => {
            const groupContainer = document.querySelector('.group-container');
            const addItemButton = document.querySelector(`.add-item-btn[data-id="${groupId}"]`);
            if (addItemButton) addItemButton.remove();
            groupContainer.removeChild(table);

            // Remove from groupData
            groupData = groupData.filter(group => group.id !== groupId);
        });

        dropdownBtn.addEventListener('click', () => {
            dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
        });

        dropdownMenu.appendChild(deleteGroupOption);
        fixedColumnHeader.appendChild(dropdownBtn);
        fixedColumnHeader.appendChild(dropdownMenu);
        headerRow.appendChild(fixedColumnHeader);

        headerRow.appendChild(createHeaderCell('New Group', '', true));

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

    function createActionCell(row) {
        const cell = document.createElement('td');
        cell.className = 'fixed-column';
        return cell;
    }

    // Function to Create Add Row Button
    function createAddRowButton(table, container, groupId) {
        const addRowBtn = document.createElement('button');
        addRowBtn.className = 'add-item-btn';
        addRowBtn.dataset.id = groupId;
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
            row.insertBefore(createCell(option, row), row.lastChild);
        });
    }

    // Function to Add Timeline Columns
    function addTimelineColumns(table, headerRow) {
        ['Start Date', 'Due Date'].forEach(dateColumn => {
            const newHeader = createHeaderCell(dateColumn, '', true);
            headerRow.insertBefore(newHeader, headerRow.lastChild);

            Array.from(table.rows).forEach((row, index) => {
                if (index === 0) return;
                const dateCell = createDateCell(row, dateColumn);
                row.insertBefore(dateCell, row.lastChild);
            });
        });
    }

    // Function to Add a Row
    function addRow(table, headerRow) {
        const row = document.createElement('tr');

        Array.from(headerRow.cells).forEach((header, index) => {
            const cell = index === 0 ? createActionCell(row) : createCell(header.textContent, row);
            row.appendChild(cell);
        });

        table.appendChild(row);
    }

    // Function to Create Cell
    function createCell(headerText, row) {
        const cell = document.createElement('td');

        if (headerText === 'Start Date' || headerText === 'Due Date') {
            return createDateCell(row, headerText);
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
            cell.addEventListener('blur', () => {
                const groupId = row.closest('table').dataset.id;
                const group = groupData.find(g => g.id === groupId);
                if (group) {
                    const cellIndex = Array.from(row.cells).indexOf(cell);
                    const headerText = headerRow.cells[cellIndex].textContent;
                    const existingRow = group.rows.find(r => r.id === row.dataset.rowId);
                    if (existingRow) {
                        existingRow[headerText] = cell.textContent;
                    } else {
                        const newRow = { id: row.dataset.rowId || Date.now().toString(), [headerText]: cell.textContent };
                        group.rows.push(newRow);
                        row.dataset.rowId = newRow.id;
                    }
                }
            });
        }

        return cell;
    }

    // Function to Create Date Cell
    function createDateCell(row, headerText) {
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

                const groupId = row.closest('table').dataset.id;
                const group = groupData.find(g => g.id === groupId);
                if (group) {
                    const existingRow = group.rows.find(r => r.id === row.dataset.rowId);
                    if (existingRow) {
                        existingRow[headerText] = dateInput.value;
                    } else {
                        const newRow = { id: row.dataset.rowId || Date.now().toString(), [headerText]: dateInput.value };
                        group.rows.push(newRow);
                        row.dataset.rowId = newRow.id;
                    }
                }

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
            pinnedDates.push(date);
        }
        renderCalendar();
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

    // Function to Handle File Upload
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                console.log('File content:', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    // Calendar Variables
    const calendarGrid = document.querySelector('.calendar-grid');
    const monthYearDisplay = document.getElementById('monthYearDisplay');
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let pinnedDates = [];

    // Function to Render Calendar
    // Function to Render Calendar
function renderCalendar() {
    calendarGrid.innerHTML = '';
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    monthYearDisplay.textContent = `${new Date(currentYear, currentMonth).toLocaleString('en-US', { month: 'long' })} ${currentYear}`;

    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('calendar-day');
        calendarGrid.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.textContent = day;
        dayCell.classList.add('calendar-day');
        const fullDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        if (pinnedDates.includes(fullDate)) {
            dayCell.classList.add('pinned');
        }

        // Display group information in the calendar
        groupData.forEach(group => {
            group.rows.forEach(row => {
                if (row['Start Date'] === fullDate || row['Due Date'] === fullDate) {
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'calendar-info';
                    infoDiv.textContent = `${group.name}: ${row['Task'] || ''}`;
                    dayCell.appendChild(infoDiv);
                }
            });
        });

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
});