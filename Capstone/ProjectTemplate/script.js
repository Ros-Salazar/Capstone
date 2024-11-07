document.addEventListener('DOMContentLoaded', () => {
  const addTaskBtn = document.getElementById('addTaskBtn');
  const taskTable = document.getElementById('taskTable').querySelector('tbody');

  // Add a new row on "+" button click
  addTaskBtn.addEventListener('click', () => {
      // Prompt for each field including the new "Project/Task"
      const projectTask = prompt("Enter Project/Task:");
      const personInCharge = prompt("Enter the Person in Charge:");
      const dateAssigned = prompt("Enter Date Assigned (YYYY-MM-DD):");
      const endDate = prompt("Enter End Date (YYYY-MM-DD):");
      let status = prompt("Enter Status (Done, Pending, To-Do):");
      const sourceOfFund = prompt("Enter Source of Fund:");
      const budget = prompt("Enter Budget:");

      // Set color based on status
      let statusColor;
      switch (status.toLowerCase()) {
        case 'done':
          statusColor = 'green';
          break;
        case 'pending':
          statusColor = 'yellow';
          break;
        case 'to-do':
          statusColor = 'purple';
          break;
        default:
          alert("Invalid status. Defaulting to 'To-Do'.");
          status = 'To-Do';
          statusColor = 'purple';
      }

      // File upload input
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.pdf,.doc,.docx,.txt';
      fileInput.classList.add('document-upload');

      // Create table row
      const newRow = document.createElement('tr');
      newRow.innerHTML = `
        <td class="editable-cell">${projectTask || "N/A"}</td>
        <td class="editable-cell">${personInCharge || "N/A"}</td>
        <td class="editable-cell">${dateAssigned || "N/A"}</td>
        <td class="editable-cell">${endDate || "N/A"}</td>
        <td class="status-cell" style="color: ${statusColor}; font-weight: bold;">${status}</td>
        <td class="editable-cell">${sourceOfFund || "N/A"}</td>
        <td class="document-cell">
          <input type="file" class="file-input" style="display:none;">
          <span class="file-name">Upload Document</span>
        </td>
        <td class="editable-cell">${budget || "N/A"}</td>
      `;

      // Append the new row to the table
      taskTable.appendChild(newRow);

      // Initialize the interactive elements for this new row
      initializeRowInteractions(newRow);
  });

  // Initialize existing table row interactions
  function initializeRowInteractions(row) {
      // Editable cells (non-status cells)
      row.querySelectorAll('.editable-cell').forEach(cell => {
          cell.addEventListener('dblclick', () => {
              cell.contentEditable = 'true';
              cell.focus();
          });

          cell.addEventListener('blur', () => {
              cell.contentEditable = 'false';
          });
      });

      // Make the status cell editable with a dropdown on double-click
      const statusCell = row.querySelector('.status-cell');
      statusCell.addEventListener('dblclick', () => {
          const statusOptions = ['Done', 'Pending', 'To-Do'];
          const statusDropdown = document.createElement('select');

          statusOptions.forEach(status => {
              const option = document.createElement('option');
              option.value = status;
              option.textContent = status;
              if (status === statusCell.textContent) option.selected = true;
              statusDropdown.appendChild(option);
          });

          statusCell.textContent = '';
          statusCell.appendChild(statusDropdown);

          statusDropdown.addEventListener('change', () => {
              const selectedStatus = statusDropdown.value;
              statusCell.style.color = getStatusColor(selectedStatus);
              statusCell.textContent = selectedStatus;
              statusCell.setAttribute('data-status', selectedStatus.toLowerCase());
          });

          // Remove the dropdown and set the content back on blur
          statusDropdown.addEventListener('blur', () => {
              statusCell.textContent = statusDropdown.value;
              statusCell.setAttribute('data-status', statusDropdown.value.toLowerCase());
              statusDropdown.remove();
          });

          statusDropdown.focus();
      });

      // Document upload functionality
      const documentCell = row.querySelector('.document-cell');
      const fileInput = documentCell.querySelector('.file-input');
      const fileNameDisplay = documentCell.querySelector('.file-name');

      documentCell.addEventListener('click', () => {
          fileInput.click();
      });

      fileInput.addEventListener('change', () => {
          const file = fileInput.files[0];
          if (file) {
              fileNameDisplay.textContent = file.name;
          } else {
              fileNameDisplay.textContent = 'Upload Document';
          }
      });
  }

  // Helper function to get color based on status
  function getStatusColor(status) {
      switch (status) {
          case 'Done':
              return 'green';
          case 'Pending':
              return 'yellow';
          case 'To-Do':
              return 'purple';
          default:
              return 'black';
      }
  }

  // Initialize any existing rows (for example, if rows are loaded dynamically)
  taskTable.querySelectorAll('tr').forEach(row => initializeRowInteractions(row));
});
