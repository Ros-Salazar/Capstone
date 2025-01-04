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
        addRowBtn.style.cursor = 'not-allowed';
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
    const enumFields = ['TEXT', 'Numbers', 'Status', 'Key Persons', 'Timeline', 'Upload File'];

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

        // Ensure the field value matches the MySQL ENUM values
        const field = enumFields.includes(option) ? option : 'TEXT';

        const newHeader = createHeaderCell(option, '', true, column.id, field); // Pass column.id and field
        newHeader.dataset.columnId = column.id;
        newHeader.dataset.field = field;
        headerRow.insertBefore(newHeader, headerRow.lastChild);

        Array.from(table.rows).forEach((row, index) => {
            if (index === 0) return;
            let newCell;
            if (field === 'Numbers') {
                newCell = createNumberCell(column.id); // Use the function for Numbers field
            } else if (field === 'Status') {
                newCell = createStatusCell(column.id); // Use the function for Status field
            } else if (field === 'Timeline') {
                newCell = createDateCell(column.id, field);
            } else if (field === 'Key Persons') {
                newCell = createKeyPersonsCell(column.id); // Use the function for Key Persons field
            } else if (field === 'Upload File') {
                newCell = createUploadFileCell(column.id); // Use the function for Upload File field
            } else {
                newCell = createCell(column.id, field === 'Upload File'); // Determine if it's the upload field
            }
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
    const groupId = table.dataset.id;
    const dateFields = [
        { name: 'Start Date', field: 'start_date' },
        { name: 'Due Date', field: 'due_date' }
    ];

    for (let { name, field } of dateFields) {
        try {
            // Add the column to the group_columns table
            const response = await fetch('http://127.0.0.1:3000/api/group_columns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    group_id: groupId,
                    name: name,
                    type: 'Timeline',
                    field: field
                }),
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const column = await response.json();

            const newHeader = createHeaderCell(name, '', true, column.id, field);
            headerRow.insertBefore(newHeader, headerRow.lastChild);

            Array.from(table.rows).forEach((row, rowIndex) => {
                if (rowIndex === 0) return;
                const dateCell = createDateCell(column.id, field);
                row.insertBefore(dateCell, row.lastChild);
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
            console.error('Error adding timeline column:', error);
        }
    }
}
// Create a cell with an input for file uploads and a link to download the file
export function createUploadFileCell(columnId, existingFilePath = null, originalFileName = null) {
    const cell = document.createElement('td');
    cell.dataset.columnId = columnId;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';

    const fileLink = document.createElement('a');
    fileLink.style.display = 'none';
    fileLink.target = '_blank';
    
    if (existingFilePath && originalFileName) {
        fileLink.href = existingFilePath;
        fileLink.textContent = originalFileName;
        fileLink.style.display = 'block';
    }

    fileInput.addEventListener('change', async function () {
        const file = fileInput.files[0];
        if (!file) return;

        const rowId = cell.closest('tr').dataset.rowId;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('row_id', rowId);
        formData.append('column_id', columnId);
        formData.append('field', 'Upload File');

        try {
            const response = await fetch('http://127.0.0.1:3000/api/upload_file', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
            }

            const result = await response.json();
            console.log('File uploaded:', result);

            // Update the cell to show the file path or URL
            fileLink.href = result.filePath;
            fileLink.textContent = result.originalFileName;
            fileLink.style.display = 'block';
            cell.appendChild(fileLink);

        } catch (error) {
            console.error('Error uploading file:', error);
        }
    });

    cell.appendChild(fileInput);
    if (existingFilePath && originalFileName) {
        cell.appendChild(fileLink);
    }
    return cell;
}
export async function addRow(table, headerRow) {
    const groupId = table.dataset.id;

    try {
        const response = await fetch('http://127.0.0.1:3000/api/group_rows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_id: groupId }),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const row = await response.json();

        const rowId = row.id;
        const tr = document.createElement('tr');
        tr.dataset.rowId = rowId;

        Array.from(headerRow.cells).forEach((header, index) => {
            let newCell;
            const columnId = header.dataset.columnId;
            const field = header.dataset.field;

            if (index === 0) {
                newCell = createActionCell(tr);
            } else {
                switch (field) {
                    case 'Numbers':
                        newCell = createNumberCell(columnId);
                        break;
                    case 'Status':
                        newCell = createStatusCell(columnId);
                        break;
                    case 'Key Persons':
                        newCell = createKeyPersonsCell(columnId);
                        break;
                    case 'start_date':
                        newCell = createDateCell(columnId, 'start_date');
                        break;
                    case 'due_date':
                        newCell = createDateCell(columnId, 'due_date');
                        break;
                    case 'Upload File':
                        newCell = createUploadFileCell(columnId);
                        break;
                    default:
                        newCell = createCell(columnId);
                }
            }
            tr.appendChild(newCell);
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
    cell.dataset.columnId = columnId;

    if (isNonEditable) {
        cell.contentEditable = false;
        cell.style.pointerEvents = 'none';
        cell.style.backgroundColor = '#f0f0f0';
    } else {
        cell.contentEditable = true;
        cell.addEventListener('blur', async function () {
            const value = cell.textContent.trim();
            const rowId = cell.closest('tr').dataset.rowId;
            const cellColumnId = parseInt(cell.dataset.columnId, 10);
            let field = cell.closest('table').querySelector(`th[data-column-id="${cellColumnId}"]`).dataset.field || 'TEXT';

            console.log('Saving cell data:', { rowId, columnId: cellColumnId, field, value });

            if (!rowId || isNaN(cellColumnId) || !field) {
                console.error('Row ID, Column ID, or Field is missing or invalid');
                return;
            }

            const enumFields = ['TEXT', 'Numbers', 'Status', 'Key Persons', 'Timeline', 'Upload File'];
            if (!enumFields.includes(field)) {
                console.error('Invalid field value');
                return;
            }

            try {
                const response = await fetch('http://127.0.0.1:3000/api/cell_data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        row_id: rowId,
                        column_id: cellColumnId,
                        field: field,
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
    return cell;
}
// Create a cell for numeric input, restricted to integers
export function createNumberCell(columnId) {
    const cell = document.createElement('td');
    cell.dataset.columnId = columnId;

    const numberInput = document.createElement('input');
    numberInput.type = 'text';
    numberInput.pattern = '\\d*';
    numberInput.title = 'Please enter a valid integer';
    numberInput.placeholder = 'Enter a number';

    numberInput.addEventListener('input', function () {
        numberInput.value = numberInput.value.replace(/\D/g, ''); // Remove non-digit characters
    });

    numberInput.addEventListener('blur', async function () {
        const value = numberInput.value;
        const rowId = cell.closest('tr').dataset.rowId;

        if (!columnId || !rowId) {
            console.error('Invalid columnId or rowId:', { columnId, rowId });
            return;
        }

        console.log('Saving cell data:', { rowId, columnId, field: 'Numbers', value });

        try {
            const response = await fetch('http://127.0.0.1:3000/api/cell_data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    row_id: rowId,
                    column_id: columnId,
                    field: 'Numbers',
                    value: value
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

    cell.appendChild(numberInput);
    return cell;
}
// Create a cell with a dropdown menu for status options
export function createStatusCell(columnId) {
    const cell = document.createElement('td');
    cell.dataset.columnId = columnId;

    const statusSelect = document.createElement('select');
    const options = ["Not Started", "In Progress", "Done"];

    options.forEach(option => {
        const statusOption = document.createElement('option');
        statusOption.value = option;
        statusOption.textContent = option;
        statusSelect.appendChild(statusOption);
    });

    statusSelect.addEventListener('change', async function () {
        const value = statusSelect.value;
        const rowId = cell.closest('tr').dataset.rowId;

        if (!columnId || !rowId) {
            console.error('Invalid columnId or rowId:', { columnId, rowId });
            return;
        }

        console.log('Saving cell data:', { rowId, columnId, field: 'Status', value });

        try {
            const response = await fetch('http://127.0.0.1:3000/api/cell_data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    row_id: rowId,
                    column_id: columnId,
                    field: 'Status',
                    value: value
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

    cell.appendChild(statusSelect);
    return cell;
}
// Create a cell with an input for Gmail addresses
export function createKeyPersonsCell(columnId, existingValue = '') {
    const cell = document.createElement('td');
    cell.dataset.columnId = columnId;

    const input = document.createElement('input');
    input.type = 'email';
    input.value = existingValue;
    input.placeholder = 'Enter Gmail address';
    input.pattern = '[a-zA-Z0-9._%+-]+@gmail.com';

    input.addEventListener('blur', async function () {
        const value = input.value;
        const rowId = cell.closest('tr').dataset.rowId;

        if (!columnId || !rowId) {
            console.error('Invalid columnId or rowId:', { columnId, rowId });
            return;
        }

        // Validate Gmail address
        const gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail.com$/;
        if (!gmailPattern.test(value)) {
            alert('Please enter a valid Gmail address.');
            input.focus();
            return;
        }

        console.log('Saving cell data:', { rowId, columnId, field: 'Key Persons', value });

        try {
            const response = await fetch('http://127.0.0.1:3000/api/cell_data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    row_id: rowId,
                    column_id: columnId,
                    field: 'Key Persons',
                    value: value
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

    cell.appendChild(input);
    return cell;
}
//Date cell
export function createDateCell(columnId, field) {
    const cell = document.createElement('td');
    cell.dataset.columnId = columnId;
    cell.dataset.field = field;

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    const dateDisplay = document.createElement('span');
    dateDisplay.className = 'formatted-date';
    dateDisplay.style.cursor = 'pointer';
    dateDisplay.style.display = 'none';

    dateInput.addEventListener('change', async function () {
        const date = new Date(dateInput.value);
        if (!isNaN(date)) {
            dateDisplay.textContent = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            dateInput.style.display = 'none';
            dateDisplay.style.display = 'block';

            const rowId = cell.closest('tr').dataset.rowId;
            const value = dateInput.value;

            if (!columnId || !rowId) {
                console.error('Invalid columnId or rowId:', { columnId, rowId });
                return;
            }

            console.log('Saving cell data:', { rowId, columnId, field, value });

            try {
                const response = await fetch('http://127.0.0.1:3000/api/cell_data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        row_id: rowId,
                        column_id: columnId,
                        field: 'Timeline',
                        value: value,
                        start_date: field === 'start_date' ? value : null,
                        due_date: field === 'due_date' ? value : null
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
