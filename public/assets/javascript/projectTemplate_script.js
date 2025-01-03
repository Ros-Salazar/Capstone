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

    if (!mainTableBtn || !calendarBtn || !groupSection || !calendarSection || !addGroupBtn || !groupContainer || !projectNameElement || !projectDescriptionElement) {
        console.error('One or more DOM elements are missing');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId');

    if (!projectId) {
        console.error('Project ID not found in URL');
        return;
    }

    try {
        const projectResponse = await fetch(`http://127.0.0.1:3000/api/project/${projectId}`);
        if (!projectResponse.ok) {
            throw new Error(`HTTP error! status: ${projectResponse.status}`);
        }
        const project = await projectResponse.json();
        projectNameElement.textContent = project.project_name;
        projectDescriptionElement.textContent = project.project_description;
    } catch (error) {
        console.error('Fetch error:', error);
    }
    
    // Fetch and render groups and their rows
    try {
        const groupsResponse = await fetch(`http://127.0.0.1:3000/api/project/${projectId}/groups`);
        if (!groupsResponse.ok) {
            throw new Error(`HTTP error! status: ${groupsResponse.status}`);
        }
        const groups = await groupsResponse.json();

        for (const group of groups) {
            const table = createTable(group.id, group.name); // Pass group name to createTable
            groupContainer.appendChild(table);
            createAddRowButton(table, group.id);

            // Fetch and render rows for each group
            try {
                const rowsResponse = await fetch(`http://127.0.0.1:3000/api/group/${group.id}/rows`);
                if (!rowsResponse.ok) {
                    throw new Error(`HTTP error! status: ${rowsResponse.status}`);
                }
                const rows = await rowsResponse.json();

                for (const row of rows) {
                    const headerRow = table.rows[0];
                    const tr = document.createElement('tr');
                    tr.dataset.rowId = row.id; // Set the row ID

                    Array.from(headerRow.cells).forEach((header, index) => {
                        const cell = index === 0 ? createActionCell(tr) : createCell(header.textContent);
                        tr.appendChild(cell);
                    });

                    table.appendChild(tr);
                }
            } catch (error) {
                console.error('Error fetching rows:', error);
            }
        }
    } catch (error) {
        console.error('Error fetching groups:', error);
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
    });

    // Set main table as the default active section on page load
    groupSection.classList.add('active-section');
    calendarSection.classList.remove('active-section');
    setActiveButton('mainTableBtn');

    addGroupBtn.addEventListener('click', async function() {
        try {
            const groupName = prompt("Enter group name:");
            if (!groupName) return;
    
            const response = await fetch('http://127.0.0.1:3000/api/proj_groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_id: projectId,
                    name: groupName,
                }),
            });
    
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const group = await response.json();
    
            const groupId = group.id;
            const table = createTable(groupId, groupName);
            groupContainer.appendChild(table);
            createAddRowButton(table, groupId);
    
        } catch (error) {
            console.error('Error creating group:', error);
        }
    });

    projectNameElement.addEventListener('blur', saveProjectDetails);
    projectDescriptionElement.addEventListener('blur', saveProjectDetails);

    async function saveProjectDetails() {
        const projectName = projectNameElement.textContent.trim();
        const projectDescription = projectDescriptionElement.textContent.trim();

        try {
            const response = await fetch(`http://127.0.0.1:3000/api/update_project_details/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    project_name: projectName,
                    project_description: projectDescription
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
            }

            const result = await response.json();
            console.log('Project details update response:', result);
        } catch (error) {
            console.error('Update error:', error);
            alert(`Error updating project details: ${error.message}`);
        }
    }

    function setActiveButton(buttonId) {
        mainTableBtn.classList.remove('active');
        calendarBtn.classList.remove('active');
        document.getElementById(buttonId).classList.add('active');
    }

    function createTable(groupId, groupName) {
        const table = document.createElement('table');
        table.className = 'group-table';
        table.dataset.id = groupId;
    
        const headerRow = createHeaderRow(table, groupId, groupName);
        table.appendChild(headerRow);
    
        fetchColumnsAndRender(groupId, table, headerRow);
    
        return table;
    }

    async function fetchColumnsAndRender(groupId, table, headerRow) {
        try {
            const response = await fetch(`http://127.0.0.1:3000/api/group/${groupId}/columns`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const columns = await response.json();
            console.log('Fetched columns:', columns); // Add logging
    
            columns.forEach(column => {
                const newHeader = createHeaderCell(column.name, '', true, column.id, column.field); // Pass column.id and column.field
                newHeader.dataset.columnId = column.id;
                headerRow.insertBefore(newHeader, headerRow.lastChild);
    
                Array.from(table.rows).forEach((row, index) => {
                    if (index === 0) return; // Skip header row
                    const newCell = createCell(column.id, column.name === '+'); // Pass column.id and check if column name is "+"
                    row.insertBefore(newCell, row.lastChild);
                });
            });
    
            // Fetch and render cell data
            await fetchCellDataAndRender(groupId, table);
        } catch (error) {
            console.error('Error fetching columns:', error);
        }
    }
    
    async function fetchCellDataAndRender(groupId, table) {
        try {
            const response = await fetch(`http://127.0.0.1:3000/api/group/${groupId}/cell_data`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const cellData = await response.json();
            console.log('Fetched cell data:', cellData); // Add logging
    
            cellData.forEach(data => {
                const row = table.querySelector(`tr[data-row-id="${data.row_id}"]`);
                const cell = row.querySelector(`td[data-column-id="${data.column_id}"]`);
                if (cell) {
                    cell.textContent = data.value; // Set the cell data
                }
            });
        } catch (error) {
            console.error('Error fetching cell data:', error);
        }
    }

    function createHeaderRow(table, groupId, groupName) {
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
        deleteGroupOption.addEventListener('click', async () => {
            try {
                const response = await fetch(`http://127.0.0.1:3000/api/group/${groupId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });
    
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
                const addItemButton = document.querySelector(`.add-item-btn[data-id="${groupId}"]`);
                if (addItemButton) addItemButton.remove();
                groupContainer.removeChild(table);
    
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
    
        headerRow.appendChild(createHeaderCell(groupName, '', true));
    
        const plusHeader = createHeaderCell('+', 'plus-header');
        plusHeader.style.cursor = 'pointer';
    
        const columnDropdownMenu = createDropdownMenu(
            ['Text', 'Numbers', 'Status', 'Key Persons', 'Timeline', 'Upload File'],
            (option) => {
                if (option === 'Timeline') {
                    addTimelineColumns(table, headerRow);
                } else {
                    addColumn(option, table, headerRow);
                }
                columnDropdownMenu.style.display = 'none';
            }
        );
    
        plusHeader.addEventListener('click', () => {
            columnDropdownMenu.style.display = columnDropdownMenu.style.display === 'none' ? 'block' : 'none';
        });
    
        plusHeader.appendChild(columnDropdownMenu);
        headerRow.appendChild(plusHeader);
    
        // Disable input for the plus-header column cells
        table.querySelectorAll('tr').forEach((row, index) => {
            if (index === 0) return; // Skip the header row
            const cell = row.insertCell(-1); // Add a new cell at the end of each row
            cell.style.pointerEvents = 'none'; // Disable input for this cell
        });
    
        return headerRow;
    }
    
    
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
        return cell;
    }

    function createAddRowButton(table, groupId) {
        const addRowBtn = document.createElement('button');
        addRowBtn.className = 'add-item-btn';
        addRowBtn.dataset.id = groupId;
        addRowBtn.textContent = 'Add Item';
        addRowBtn.addEventListener('click', () => addRow(table, table.rows[0]));
        groupContainer.appendChild(addRowBtn);
        return addRowBtn;
    }

    function createHeaderCell(text, className = '', editable = false, columnId = null, field = '') {
        const header = document.createElement('th');
        header.textContent = text;
        header.className = className;
    
        // Ensure the "plus-header" column is not editable
        if (text === '+') {
            header.contentEditable = false;
            header.style.cursor = 'default'; // Change cursor to indicate no action
        } else if (editable) {
            header.contentEditable = true;
            header.dataset.columnId = columnId; // Ensure columnId is stored as a data attribute
            header.dataset.field = field; // Add field as a data attribute
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

    async function addColumn(option, table, headerRow) {
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
                const newCell = createCell(column.id);
    
                // Enable input for the new cell
                newCell.style.pointerEvents = 'auto';
    
                row.insertBefore(newCell, row.lastChild);
            });
    
        } catch (error) {
            console.error('Error adding column:', error);
        }
    }
    
    
    

    function addTimelineColumns(table, headerRow) {
        ['Start Date', 'Due Date'].forEach(dateColumn => {
            const newHeader = createHeaderCell(dateColumn, '', true);
            headerRow.insertBefore(newHeader, headerRow.lastChild);

            Array.from(table.rows).forEach((row, index) => {
                if (index === 0) return;
                const dateCell = createDateCell();
                row.insertBefore(dateCell, row.lastChild);

                const dateInput = dateCell.querySelector('input[type="date"]');
                dateInput.addEventListener('change', () => syncDateToCalendar(dateInput.value));
            });
        });
    }

    async function addRow(table, headerRow) {
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
                const cell = index === 0 ? createActionCell(tr) : createCell(header.textContent);
                tr.appendChild(cell);
            });

            table.appendChild(tr);

        } catch (error) {
            console.error('Error adding row:', error);
        }
    }

    function createCell(columnId, isNonEditable = false) {
        const cell = document.createElement('td');
        cell.dataset.columnId = columnId; // Ensure columnId is stored as a data attribute
    
        // Disable editing for non-editable cells
        if (isNonEditable) {
            cell.contentEditable = false;
            cell.style.pointerEvents = 'none'; // Disable pointer events to prevent input
            cell.style.backgroundColor = '#f0f0f0'; // Optional: style to indicate non-editable
        } else {
            cell.contentEditable = true;
            cell.addEventListener('blur', async function () {
                const value = cell.textContent.trim();
                const rowId = cell.closest('tr').dataset.rowId;
                const cellColumnId = parseInt(cell.dataset.columnId, 10); // Convert columnId to an integer
                const field = 'Text'; // Set the appropriate field value
    
                // Debugging logs
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
    
        return cell;
    }

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

    function createInput(type, placeholder = '') {
        const input = document.createElement('input');
        input.type = type;
        input.style.width = '100%';
        if (placeholder) input.placeholder = placeholder;
        return input;
    }

    function syncDateToCalendar(dateValue) {
        console.log('Synchronizing date to calendar:', dateValue);
    }
});