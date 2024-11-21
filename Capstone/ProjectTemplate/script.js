document.getElementById('addGroupBtn').addEventListener('click', function () {
    const table = document.createElement('table');
    table.className = 'group-table';

    // Header Row
    const headerRow = document.createElement('tr');

    // Default Group Header
    const groupHeader = document.createElement('th');
    groupHeader.textContent = 'New Group';
    groupHeader.contentEditable = true;
    headerRow.appendChild(groupHeader);

    // Add "+" Header for Adding Columns
    const plusHeader = document.createElement('th');
    plusHeader.className = 'plus-header';
    plusHeader.textContent = '+';
    headerRow.appendChild(plusHeader);

    // Add Dropdown for Column Options
    const dropdownMenu = createDropdownMenu(['Text', 'Numbers', 'Status', 'Key Persons', 'Timeline'], (option) => {
        if (option === 'Timeline') {
            addTimelineColumns(table, headerRow);
        } else {
            addColumn(option, table, headerRow);
        }
        dropdownMenu.style.display = 'none';
    });
    plusHeader.appendChild(dropdownMenu);

    plusHeader.addEventListener('click', function () {
        dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });

    table.appendChild(headerRow);

    // Add Default Row
    addRow(table, headerRow);

    // Add "Add Item" Button
    const addRowBtn = document.createElement('button');
    addRowBtn.className = 'add-item-btn';
    addRowBtn.textContent = 'Add Item';
    addRowBtn.addEventListener('click', function () {
        addRow(table, headerRow);
    });

    // Append Table and Button to the Container
    const container = document.querySelector('.group-container');
    container.appendChild(table);
    container.appendChild(addRowBtn);
});

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
    const newHeader = document.createElement('th');
    newHeader.textContent = option;
    newHeader.contentEditable = true;

    headerRow.insertBefore(newHeader, headerRow.lastChild);

    // Add appropriate cells to all rows
    Array.from(table.rows).forEach((row, index) => {
        if (index === 0) return; // Skip header row

        const newCell = document.createElement('td');
        if (option === 'Numbers') {
            const input = document.createElement('input');
            input.type = 'text'; // Allows both numbers and money
            input.style.width = '100%';
            input.placeholder = 'Enter Value'; // Placeholder for clarity
            newCell.appendChild(input);
        } else if (option === 'Status') {
            const select = document.createElement('select');
            ['To-do', 'In Progress', 'Done'].forEach(status => {
                const opt = document.createElement('option');
                opt.value = status;
                opt.textContent = status;
                select.appendChild(opt);
            });
            newCell.appendChild(select);
        } else if (option === 'Key Persons') {
            const input = document.createElement('input');
            input.type = 'email';
            input.style.width = '100%';
            newCell.appendChild(input);
        } else {
            newCell.contentEditable = true;
        }
        row.insertBefore(newCell, row.lastChild);
    });
}

// Function to Add Timeline Columns (Start Date and Due Date)
function addTimelineColumns(table, headerRow) {
    ['Start Date', 'Due Date'].forEach(dateColumn => {
        const newHeader = document.createElement('th');
        newHeader.textContent = dateColumn;
        newHeader.contentEditable = true;
        headerRow.insertBefore(newHeader, headerRow.lastChild);

        // Add date picker cells to all existing rows
        Array.from(table.rows).forEach((row, index) => {
            if (index === 0) return; // Skip header row

            const dateCell = document.createElement('td');
            const dateInput = document.createElement('input');
            dateInput.type = 'date';
            dateInput.style.width = '100%';
            dateCell.appendChild(dateInput);

            row.insertBefore(dateCell, row.lastChild);
        });
    });
}

// Function to Add a Row
function addRow(table, headerRow) {
    const row = document.createElement('tr');

    Array.from(headerRow.cells).forEach((header, index) => {
        const cell = document.createElement('td');

        if (index === 0) {
            // First cell: Add row actions
            addCellDropdown(cell, row);
        } else if (header.textContent === 'Start Date' || header.textContent === 'Due Date') {
            const dateInput = document.createElement('input');
            dateInput.type = 'date';
            dateInput.style.width = '100%';
            cell.appendChild(dateInput);
        } else if (header.textContent === 'Numbers') {
            const input = document.createElement('input');
            input.type = 'text'; // Allows both numbers and money
            input.style.width = '100%';
            input.placeholder = 'Enter Value'; // Placeholder for clarity
            cell.appendChild(input);
        } else if (header.textContent === 'Status') {
            const select = document.createElement('select');
            ['To-do', 'In Progress', 'Done'].forEach(status => {
                const opt = document.createElement('option');
                opt.value = status;
                opt.textContent = status;
                select.appendChild(opt);
            });
            cell.appendChild(select);
        } else if (header.textContent === 'Key Persons') {
            const input = document.createElement('input');
            input.type = 'email';
            input.style.width = '100%';
            cell.appendChild(input);
        } else {
            cell.contentEditable = true;
        }

        row.appendChild(cell);
    });

    table.appendChild(row);
}

// Function to Add Dropdown for Row Actions
function addCellDropdown(cell, row) {
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

    dropdownMenu.appendChild(deleteOption);

    dropdownBtn.addEventListener('click', () => {
        dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });

    cell.appendChild(dropdownBtn);
    cell.appendChild(dropdownMenu);
}
