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

    // Ensure elements are found
    if (!mainTableBtn || !calendarBtn || !groupSection || !calendarSection || !addGroupBtn || !groupContainer || !projectNameElement || !projectDescriptionElement) {
        console.error('One or more DOM elements are missing');
        return;
    }

    // Get project ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId');

    if (!projectId) {
        console.error('Project ID not found in URL');
        return;
    }

    // Fetch project details
    try {
        const response = await fetch(`http://127.0.0.1:3000/api/project/${projectId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const project = await response.json();
        projectNameElement.textContent = project.project_name;
        projectDescriptionElement.textContent = project.project_description;
    } catch (error) {
        console.error('Fetch error:', error);
    }

    // Event listeners for switching sections
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

    // Event listener for adding a new group
    addGroupBtn.addEventListener('click', function() {
        const groupId = `group-${Date.now()}`; // Generate a unique ID for each group
        const table = createTable(groupId);
        groupContainer.appendChild(table); // Append the table to the container
        createAddRowButton(table, groupId); // Append the Add Item button to the container
    });

    // Save project details when content is changed and focus is lost
    projectNameElement.addEventListener('blur', saveProjectDetails);
    projectDescriptionElement.addEventListener('blur', saveProjectDetails);

    // Function to save project details
    async function saveProjectDetails() {
        const projectName = projectNameElement.textContent.trim();
        const projectDescription = projectDescriptionElement.textContent.trim();

        // Make an update request to the server
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

            // Optionally show a success message or handle success feedback
        } catch (error) {
            console.error('Update error:', error);
            alert(`Error updating project details: ${error.message}`);
        }
    }

    // Function to set the active button
    function setActiveButton(buttonId) {
        mainTableBtn.classList.remove('active');
        calendarBtn.classList.remove('active');
        document.getElementById(buttonId).classList.add('active');
    }

    // Function to create a table
    function createTable(groupId) {
        const table = document.createElement('table');
        table.className = 'group-table';
        table.dataset.id = groupId; // Associate the table with the group ID

        const headerRow = createHeaderRow(table, groupId);
        table.appendChild(headerRow);

        addRow(table, headerRow); // Add Default Row
        return table;
    }

    // Function to create header row
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

        // Create and attach the column type dropdown menu
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

        return headerRow;
    }

    // Function to create action cell
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

    // Function to create add row button
    function createAddRowButton(table, groupId) {
        const addRowBtn = document.createElement('button');
        addRowBtn.className = 'add-item-btn';
        addRowBtn.dataset.id = groupId; // Associate the button with the group ID
        addRowBtn.textContent = 'Add Item';
        addRowBtn.addEventListener('click', () => addRow(table, table.rows[0]));
        groupContainer.appendChild(addRowBtn);
        return addRowBtn;
    }

    // Function to create header cell
    function createHeaderCell(text, className = '', editable = false) {
        const header = document.createElement('th');
        header.textContent = text;
        header.className = className;
        if (editable) header.contentEditable = true;
        return header;
    }

    // Function to create dropdown menu
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

    // Function to add a column
    function addColumn(option, table, headerRow) {
        console.log('Attempting to add column:', option);

        // Create a new header for the column
        const newHeader = createHeaderCell(option, '', true);
        headerRow.insertBefore(newHeader, headerRow.lastChild);
        console.log('New header added:', newHeader.textContent);

        // Add the new column to each row in the table
        Array.from(table.rows).forEach((row, index) => {
            if (index === 0) return; // Skip the header row
            const newCell = createCell(option);
            row.insertBefore(newCell, row.lastChild);
            console.log('New cell added to row:', newCell);
        });
    }

    // Function to add timeline columns
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

    // Function to add a row
    function addRow(table, headerRow) {
        const row = document.createElement('tr');

        Array.from(headerRow.cells).forEach((header, index) => {
            const cell = index === 0 ? createActionCell(row) : createCell(header.textContent);
            row.appendChild(cell);
        });

        table.appendChild(row);
    }

    // Function to create cell
    function createCell(headerText) {
        const cell = document.createElement('td');
        // Logic to handle different types of cells based on headerText
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

    // Function to create date cell
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

    // Function to create input
    function createInput(type, placeholder = '') {
        const input = document.createElement('input');
        input.type = type;
        input.style.width = '100%';
        if (placeholder) input.placeholder = placeholder;
        return input;
    }

    // Function to create select
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

    // Function to handle file upload
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

    // Function to synchronize date to calendar
    function syncDateToCalendar(dateValue) {
        // Implement calendar synchronization logic here
        console.log('Synchronizing date to calendar:', dateValue);
    }
});