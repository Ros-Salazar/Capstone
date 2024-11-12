document.addEventListener('DOMContentLoaded', () => {
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskTable = document.getElementById('taskTable').querySelector('tbody');
    const mainTableBtn = document.querySelector('.main-table-btn');
    const projectDetailContainer = document.getElementById('projectDetailContainer');

    // Function to add a new task row
    addTaskBtn.addEventListener('click', () => {
        // Collect task details with prompts
        const taskDetails = ["Project/Task", "Person in Charge", "Date Assigned", "End Date", "Status", "Source of Fund", "Budget"];
        const [projectTask, personInCharge, dateAssigned, endDate, status, sourceOfFund, budget] = taskDetails.map(detail => prompt(`Enter ${detail}:`));

        const newRow = document.createElement('tr');
        newRow.innerHTML = `
          <td class="editable-cell">${projectTask || "N/A"}</td>
          <td class="editable-cell">${personInCharge || "N/A"}</td>
          <td class="editable-cell">${dateAssigned || "N/A"}</td>
          <td class="editable-cell">${endDate || "N/A"}</td>
          <td class="status-cell">${status || "To-Do"}</td>
          <td class="editable-cell">${sourceOfFund || "N/A"}</td>
          <td class="document-cell"><span class="file-name">Upload Document</span><input type="file" class="file-input" style="display: none;"></td>
          <td class="editable-cell">${budget || "N/A"}</td>
        `;
        taskTable.appendChild(newRow);
        initializeRowInteractions(newRow);
    });

    // Initialize interactivity for each row
    function initializeRowInteractions(row) {
        // Editable cells
        row.querySelectorAll('.editable-cell').forEach(cell => {
            cell.addEventListener('dblclick', () => {
                cell.contentEditable = true;
                cell.focus();
            });
            cell.addEventListener('blur', () => {
                cell.contentEditable = false;
            });
        });

        // Status cell dropdown
        const statusCell = row.querySelector('.status-cell');
        statusCell.addEventListener('dblclick', () => {
            const options = ['Done', 'Pending', 'To-Do'];
            const select = document.createElement('select');
            options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.text = option;
                optionElement.selected = option === statusCell.innerText;
                select.appendChild(optionElement);
            });
            statusCell.innerHTML = '';
            statusCell.appendChild(select);
            select.addEventListener('change', () => {
                statusCell.innerHTML = select.value;
                statusCell.style.color = getStatusColor(select.value);
            });
        });

        // File upload
        const documentCell = row.querySelector('.document-cell');
        const fileInput = documentCell.querySelector('.file-input');
        const fileNameDisplay = documentCell.querySelector('.file-name');
        documentCell.addEventListener('click', () => {
            fileInput.click();
        });
        fileInput.addEventListener('change', () => {
            fileNameDisplay.textContent = fileInput.files[0] ? fileInput.files[0].name : 'Upload Document';
        });
    }

    function getStatusColor(status) {
        switch (status.toLowerCase()) {
            case 'done': return 'green';
            case 'pending': return 'yellow';
            case 'to-do': return 'purple';
            default: return 'black';
        }
    }
    taskTable.querySelectorAll('tr').forEach(row => initializeRowInteractions(row));
  
    // Main Table button functionality
    mainTableBtn.addEventListener('click', () => {
        projectDetailContainer.innerHTML = ''; // Clear existing content
        const clonedTable = taskTable.closest('.task-table-section').cloneNode(true);
        projectDetailContainer.appendChild(clonedTable); // Show table in detail container
        clonedTable.style.border = '2px solid #077d03';
        clonedTable.style.boxShadow = '0 0 10px rgba(7, 125, 3, 0.5)';
        clonedTable.style.marginTop = '1em';
    });
});
