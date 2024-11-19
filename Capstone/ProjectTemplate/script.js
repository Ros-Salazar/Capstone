document.getElementById('addGroupBtn').addEventListener('click', function () {
    const table = document.createElement('table');
    table.className = 'group-table';

    // Header Row
    const headerRow = document.createElement('tr');

    // Editable Group Header
    const groupHeader = document.createElement('th');
    groupHeader.textContent = 'New Group';
    groupHeader.contentEditable = true;
    headerRow.appendChild(groupHeader);

    // Add Dropdown Header
    const plusHeader = document.createElement('th');
    plusHeader.className = 'plus-header';
    plusHeader.textContent = '+';
    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'dropdown-menu';
    dropdownMenu.style.display = 'none';

    ['Text', 'Numbers', 'Status', 'Key Persons', 'Timeline'].forEach(option => {
        const dropdownItem = document.createElement('div');
        dropdownItem.textContent = option;
        dropdownItem.className = 'dropdown-item';

        dropdownItem.addEventListener('click', function () {
            if (option === 'Timeline') {
                // Add two columns: Start Date and Due Date
                const startDateHeader = document.createElement('th');
                startDateHeader.textContent = 'Start Date';
                startDateHeader.contentEditable = true;
                headerRow.insertBefore(startDateHeader, plusHeader);

                const dueDateHeader = document.createElement('th');
                dueDateHeader.textContent = 'Due Date';
                dueDateHeader.contentEditable = true;
                headerRow.insertBefore(dueDateHeader, plusHeader);

                addHeaderDropdown(startDateHeader);
                addHeaderDropdown(dueDateHeader);

                // Add cells to the existing row
                const existingRows = Array.from(table.rows).filter(row => row !== headerRow);
                existingRows.forEach(row => {
                    const startDateCell = document.createElement('td');
                    const startDateInput = document.createElement('input');
                    startDateInput.type = 'date';
                    startDateInput.style.width = '100%';
                    startDateCell.appendChild(startDateInput);
                    row.insertBefore(startDateCell, row.cells[row.cells.length - 1]);

                    const dueDateCell = document.createElement('td');
                    const dueDateInput = document.createElement('input');
                    dueDateInput.type = 'date';
                    dueDateInput.style.width = '100%';
                    dueDateCell.appendChild(dueDateInput);
                    row.insertBefore(dueDateCell, row.cells[row.cells.length - 1]);
                });
            } else {
                const newHeader = document.createElement('th');
                newHeader.textContent = option;
                newHeader.contentEditable = true;
                headerRow.insertBefore(newHeader, plusHeader);

                addHeaderDropdown(newHeader);

                const existingRows = Array.from(table.rows).filter(row => row !== headerRow);
                existingRows.forEach(row => {
                    const newCell = document.createElement('td');
                    newCell.contentEditable = true;

                    if (option === 'Numbers') {
                        const input = document.createElement('input');
                        input.type = 'number';
                        input.style.width = '100%';
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
                    }

                    row.insertBefore(newCell, row.cells[row.cells.length - 1]);
                });
            }

            dropdownMenu.style.display = 'none';
        });

        dropdownMenu.appendChild(dropdownItem);
    });

    plusHeader.appendChild(dropdownMenu);
    plusHeader.addEventListener('click', function () {
        dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });
    headerRow.appendChild(plusHeader);
    table.appendChild(headerRow);

    // Add a single row by default when the group is created
    const defaultRow = document.createElement('tr');
    Array.from(headerRow.cells).forEach((_, i) => {
        const cell = document.createElement('td');
        cell.contentEditable = i !== headerRow.cells.length - 1;

        // Add dropdown only to the first column of the row
        if (i === 0) {
            addCellDropdown(cell, defaultRow);
        }

        defaultRow.appendChild(cell);
    });
    table.appendChild(defaultRow);

    // Add "Add Item" Button
    const addRowBtn = document.createElement('button');
    addRowBtn.className = 'add-item-btn';
    addRowBtn.textContent = 'Add Item';
    addRowBtn.addEventListener('click', function () {
        const row = document.createElement('tr');
        Array.from(headerRow.cells).forEach((_, i) => {
            const newCell = document.createElement('td');
            newCell.contentEditable = i !== headerRow.cells.length - 1;

            if (i === 0) {
                addCellDropdown(newCell, row);
            }

            row.appendChild(newCell);
        });
        table.appendChild(row);
    });

    // Append Table and Button to the Container
    const container = document.querySelector('.group-container');
    container.appendChild(table);
    container.appendChild(addRowBtn);
    
});

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
    deleteOption.addEventListener('click', function () {
        row.remove();
    });

    dropdownMenu.appendChild(deleteOption);

    dropdownBtn.addEventListener('click', function () {
        dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });

    cell.appendChild(dropdownBtn);
    cell.appendChild(dropdownMenu);
}

// Function to Add Dropdown for Header Actions
function addHeaderDropdown(header) {
    const dropdownBtn = document.createElement('button');
    dropdownBtn.textContent = '⋮';
    dropdownBtn.className = 'dropdown-btn';

    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'dropdown-menu';
    dropdownMenu.style.display = 'none';

    const deleteOption = document.createElement('div');
    deleteOption.textContent = 'Delete Column';
    deleteOption.className = 'dropdown-item';
    deleteOption.addEventListener('click', function () {
        const colIndex = Array.from(header.parentNode.children).indexOf(header);
        Array.from(header.parentNode.parentNode.rows).forEach(row => {
            row.deleteCell(colIndex);
        });
    });

    dropdownMenu.appendChild(deleteOption);

    dropdownBtn.addEventListener('click', function () {
        dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });

    header.appendChild(dropdownBtn);
    header.appendChild(dropdownMenu);
}


