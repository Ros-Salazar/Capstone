import { fetchColumnsAndRender } from './apiCalls.js';

export function setActiveButton(buttonId) {
    const mainTableBtn = document.getElementById('mainTableBtn');
    const calendarBtn = document.getElementById('calendarBtn');
    mainTableBtn.classList.remove('active');
    calendarBtn.classList.remove('active');
    document.getElementById(buttonId).classList.add('active');
}

export function createTable(groupId, groupName) {
    const table = document.createElement('table');
    table.className = 'group-table';
    table.dataset.id = groupId;

    const headerRow = createHeaderRow(table, groupId, groupName);
    table.appendChild(headerRow);

    fetchColumnsAndRender(groupId, table, headerRow);

    return table;
}

export function createAddRowButton(table, groupId, groupContainer) {
    const addRowBtn = document.createElement('button');
    addRowBtn.className = 'add-item-btn';
    addRowBtn.dataset.id = groupId;
    addRowBtn.textContent = 'Add Item';

    const userRole = localStorage.getItem('userRole');
    if (userRole === 'staff') {
        addRowBtn.disabled = true;
        addRowBtn.style.cursor = 'not-allowed'; // Change cursor to indicate action is not allowed
    } else {
        addRowBtn.addEventListener('click', () => addRow(table, table.rows[0]));
    }

    groupContainer.appendChild(addRowBtn);
    return addRowBtn;
}

export function createHeaderRow(table, groupId, groupName) {
    const headerRow = document.createElement('tr');

    // Fixed Column Header
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
    deleteGroupOption.addEventListener('click', async () => {
        try {
            const response = await fetch(`http://127.0.0.1:3000/api/group/${groupId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const addItemButton = document.querySelector(`.add-item-btn[data-id="${groupId}"]`);
            if (addItemButton) addItemButton.remove();
            table.remove();

            console.log('Group deleted successfully');
        } catch (error) {
            console.error('Error deleting group:', error);
        }
    });

    dropdownBtn.addEventListener('click', () => {
        dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });

    dropdownMenu.appendChild(deleteGroupOption);
    fixedColumnHeader.appendChild(dropdownBtn);
    fixedColumnHeader.appendChild(dropdownMenu);
    headerRow.appendChild(fixedColumnHeader);

    // Group Name Header
    headerRow.appendChild(createHeaderCell(groupName, '', true));

    // Plus Header for Adding Columns
    const plusHeader = createHeaderCell('+', 'plus-header');
    plusHeader.style.cursor = 'pointer';

    const columnDropdownMenu = createDropdownMenu(
        ['Text', 'Numbers', 'Status', 'Key Persons', 'Timeline', 'Upload File'],
        async (option) => {
            if (option === 'Timeline') {
                await addTimelineColumns(table, headerRow);
            } else {
                await addColumn(option, table, headerRow);
            }
            columnDropdownMenu.style.display = 'none';
        }
    );

    plusHeader.addEventListener('click', () => {
        columnDropdownMenu.style.display = columnDropdownMenu.style.display === 'none' ? 'block' : 'none';
    });

    plusHeader.appendChild(columnDropdownMenu);
    headerRow.appendChild(plusHeader);

    // Hide the fixed column and plus header for staff users
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'staff') {
        fixedColumnHeader.style.display = 'none';
        plusHeader.style.cursor = 'not-allowed'; // Change cursor to indicate no action
        // Hide plus-header column cells for staff users
        table.querySelectorAll('tr').forEach((row, index) => {
            if (index === 0) return; // Skip the header row
            const plusColumnCell = row.querySelector('.plus-header');
            if (plusColumnCell) {
                plusColumnCell.style.display = 'none';
            }
        });
    }

    return headerRow;
}

export function createActionCell(row) {
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
        try {
            const response = await fetch(`http://127.0.0.1:3000/api/group_row/${rowId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            row.remove();
            console.log('Row deleted successfully');
        } catch (error) {
            console.error('Error deleting row:', error);
        }
    });

    dropdownBtn.addEventListener('click', () => {
        dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });

    dropdownMenu.appendChild(deleteOption);
    cell.appendChild(dropdownBtn);
    cell.appendChild(dropdownMenu);

    // Hide the fixed column for staff users
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'staff') {
        cell.style.display = 'none';
    }

    return cell;
}

export function createHeaderCell(text, className = '', editable = false, columnId = null, field = '') {
    const header = document.createElement('th');
    header.textContent = text;
    header.className = className;
    header.dataset.field = field; // Add field as a data attribute

    // Ensure the "plus-header" column is not editable
    if (text === '+') {
        header.contentEditable = false;
        header.style.cursor = 'default'; // Change cursor to indicate no action
    } else if (editable) {
        header.contentEditable = true;
        header.dataset.columnId = columnId; // Ensure columnId is stored as a data attribute
        header.addEventListener('blur', async function () {
            const newName = header.textContent.trim();

            if (columnId) {
                try {
                    const response = await fetch(`http://127.0.0.1:3000/api/group_column/${columnId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: newName }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
                    }

                    const result = await response.json();
                    console.log('Column name updated:', result);
                } catch (error) {
                    console.error('Error updating column name:', error);
                    alert(`Error updating column name: ${error.message}`);
                }
            }
        });
    }
    return header;
}

export function createDropdownMenu(options, onSelect) {
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

export async function addColumn(option, table, headerRow) {
    const groupId = table.dataset.id;
    try {
        const response = await fetch('http://127.0.0.1:3000/api/group_columns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_id: groupId,
                name: option,
                type: option, // Assuming type and field are the same for simplicity
                field: option
            }),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const column = await response.json();

        const newHeader = createHeaderCell(option, '', true, column.id, column.field); // Pass column.id and column.field
        newHeader.dataset.columnId = column.id;
        headerRow.insertBefore(newHeader, headerRow.lastChild);

        Array.from(table.rows).forEach((row, index) => {
            if (index === 0) return;
            const newCell = createCell(column.id, column.field === 'Upload'); // Determine if it's the upload field
            row.insertBefore(newCell, row.lastChild);
        });

        // Hide the plus-header column and its cells for staff users
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'staff') {
            newHeader.style.display = 'none';
            Array.from(table.rows).forEach(row => {
                row.cells[row.cells.length - 1].style.display = 'none';
            });
        }

    } catch (error) {
        console.error('Error adding column:', error);
    }
}

export async function addTimelineColumns(table, headerRow) {
    ['Start Date', 'Due Date'].forEach(async dateColumn => {
        const newHeader = createHeaderCell(dateColumn, '', true);
        headerRow.insertBefore(newHeader, headerRow.lastChild);

        Array.from(table.rows).forEach((row, index) => {
            if (index === 0) return;
            const dateCell = createDateCell();
            row.insertBefore(dateCell, row.lastChild);

            const dateInput = dateCell.querySelector('input[type="date"]');
            dateInput.addEventListener('change', () => syncDateToCalendar(dateInput.value));
        });

        // Hide the plus-header column and its cells for staff users
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'staff') {
            newHeader.style.display = 'none';
            Array.from(table.rows).forEach(row => {
                row.cells[row.cells.length - 1].style.display = 'none';
            });
        }
    });
}

export async function addRow(table, headerRow) {
    const groupId = table.dataset.id;

    try {
        const response = await fetch('http://127.0.0.1:3000/api/group_rows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_id: groupId,
            }),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const row = await response.json();

        const rowId = row.id;
        const tr = document.createElement('tr');
        tr.dataset.rowId = rowId;

        Array.from(headerRow.cells).forEach((header, index) => {
            const cell = index === 0 ? createActionCell(tr) : createCell(header.dataset.columnId);
            tr.appendChild(cell);
        });

        table.appendChild(tr);

        // Hide the plus-header column and its cells for staff users
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'staff') {
            Array.from(tr.cells).forEach(cell => {
                if (cell.className === 'plus-column') {
                    cell.style.display = 'none';
                }
            });
        }

    } catch (error) {
        console.error('Error adding row:', error);
    }
}

export function createCell(columnId, isNonEditable = false) {
    const cell = document.createElement('td');
    cell.dataset.columnId = columnId; // Ensure columnId is stored as a data attribute

    if (isNonEditable) {
        cell.contentEditable = false;
        cell.style.pointerEvents = 'none';
        cell.style.backgroundColor = '#f0f0f0';
    } else {
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'staff' && columnId !== 'Text' && columnId !== 'Upload') {
            cell.contentEditable = false;
            cell.style.pointerEvents = 'none';
            cell.style.backgroundColor = '#f0f0f0';
        } else {
            cell.contentEditable = true;
            if (columnId === 'Upload') {
                const inputFile = document.createElement('input');
                inputFile.type = 'file';
                cell.appendChild(inputFile);
                inputFile.addEventListener('change', async function () {
                    const file = inputFile.files[0];
                    if (file) {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('column_id', columnId);
                        formData.append('row_id', cell.closest('tr').dataset.rowId);

                        try {
                            const response = await fetch('/api/upload_file', {
                                method: 'POST',
                                body: formData
                            });

                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
                            }

                            const result = await response.json();
                            console.log('File uploaded:', result);
                        } catch (error) {
                            console.error('Error uploading file:', error);
                        }
                    }
                });
            } else {
                cell.addEventListener('blur', async function () {
                    const value = cell.textContent.trim();
                    const rowId = cell.closest('tr').dataset.rowId;
                    const cellColumnId = parseInt(cell.dataset.columnId, 10); // Convert columnId to an integer
                    const field = cell.dataset.field || 'Text'; // Set the appropriate field value

                    console.log('Saving cell data:', { rowId, columnId: cellColumnId, field, value });

                    if (!rowId || isNaN(cellColumnId) || !field) {
                        console.error('Row ID, Column ID, or Field is missing or invalid');
                        return;
                    }

                    try {
                        const response = await fetch('http://127.0.0.1:3000/api/cell_data', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                row_id: rowId,
                                column_id: cellColumnId, // Use the correct column_id
                                field: field, // Include the field value
                                value: value,
                            }),
                        });

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
                        }

                        const result = await response.json();
                        console.log('Cell data saved:', result);

                    } catch (error) {
                        console.error('Error saving cell data:', error);
                    }
                });
            }
        }
    }
    return cell;
}

export function createDateCell() {
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

export function createInput(type, placeholder = '') {
    const input = document.createElement('input');
    input.type = type;
    input.style.width = '100%';
    if (placeholder) input.placeholder = placeholder;
    return input;
}

export function syncDateToCalendar(dateValue) {
    console.log('Synchronizing date to calendar:', dateValue);
}