import { createTable, createAddRowButton, createHeaderCell, createCell, createActionCell, addColumn, addRow } from './domManipulation.js';
export async function fetchProjectDetails(projectId) {
    try {
        const projectResponse = await fetch(`http://127.0.0.1:3000/api/project/${projectId}`);
        if (!projectResponse.ok) {
            throw new Error(`HTTP error! status: ${projectResponse.status}`);
        }
        const project = await projectResponse.json();
        const projectNameElement = document.getElementById('projectName');
        const projectDescriptionElement = document.getElementById('projectDescription');
        projectNameElement.textContent = project.project_name;
        projectDescriptionElement.textContent = project.project_description;
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

export async function fetchAndRenderGroups(projectId) {
    try {
        const groupContainer = document.querySelector('.group-container');
        groupContainer.innerHTML = ''; // Clear existing groups to prevent duplication

        const groupsResponse = await fetch(`http://127.0.0.1:3000/api/project/${projectId}/groups`);
        if (!groupsResponse.ok) {
            throw new Error(`HTTP error! status: ${groupsResponse.status}`);
        }
        const groups = await groupsResponse.json();
        console.log('Fetched groups:', groups);//log the fetched groups

        for (const group of groups) {
            const table = createTable(group.id, group.name); // Pass group name to createTable
            groupContainer.appendChild(table);
            createAddRowButton(table, group.id, groupContainer); // Ensure groupContainer is passed

            // Fetch and render rows for each group
            try {
                const rowsResponse = await fetch(`http://127.0.0.1:3000/api/group/${group.id}/rows`);
                if (!rowsResponse.ok) {
                    throw new Error(`HTTP error! status: ${rowsResponse.status}`);
                }
                const rows = await rowsResponse.json();
                console.log('Fetched rows for group: ', group.id, rows); // Add logging

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
}

export async function saveProjectDetails(projectId) {
    const projectNameElement = document.getElementById('projectName');
    const projectDescriptionElement = document.getElementById('projectDescription');
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

export async function addGroup(projectId, groupContainer) {
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
        createAddRowButton(table, groupId, groupContainer);

        // Initialize the group with default columns
        const defaultColumns = ['Text', 'Numbers', 'Status', 'Key Persons', 'Timeline', 'Upload File'];
        const headerRow = table.querySelector('tr');

        for (const column of defaultColumns) {
            await addColumn(column, table, headerRow);
        }

        // Initialize the group with 5 rows
        for (let i = 0; i < 5; i++) {
            await addRow(table, headerRow);
        }

        // Fetch and render cell data for the group
        await fetchCellDataAndRender(groupId, table);

    } catch (error) {
        console.error('Error creating group:', error);
    }
}

export async function fetchColumnsAndRender(groupId, table, headerRow) {
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
                const newCell = createCell(column.id, column.name, column.field === 'Upload'); // Determine if it's the upload field
                row.insertBefore(newCell, row.lastChild);
            });
        });

        // Fetch and render cell data
        await fetchCellDataAndRender(groupId, table);
    } catch (error) {
        console.error('Error fetching columns:', error);
    }
}

export async function fetchCellDataAndRender(groupId, table) {
    try {
        const response = await fetch(`http://127.0.0.1:3000/api/group/${groupId}/cell_data`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const cellData = await response.json();
        console.log('Fetched cell data:', cellData);

        cellData.forEach(data => {
            const row = table.querySelector(`tr[data-row-id="${data.row_id}"]`);
            if (!row) {
                console.error(`Row with ID ${data.row_id} not found`);
                return;
            }
            let cell = row.querySelector(`td[data-column-id="${data.column_id}"]`);
            if (!cell) {
                cell = createCell(data.column_id);
                row.appendChild(cell);
            }
            if (cell.dataset.field === 'Upload') {
                const downloadLink = document.createElement('a');
                downloadLink.href = data.value;
                downloadLink.textContent = 'Download';
                cell.appendChild(downloadLink);
                cell.contentEditable = false; // Upload cells are not editable
            } else {
                cell.textContent = data.value; // Set the cell data
                cell.contentEditable = true; // Ensure the cell remains editable
                cell.dataset.columnId = data.column_id; // Ensure the columnId is set correctly
            }
        });
    } catch (error) {
        console.error('Error fetching cell data:', error);
    }
}