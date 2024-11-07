document.addEventListener('DOMContentLoaded', () => {
  // Set the name of the group
  const groupName = "Name of Group"; // Replace this with dynamic data if needed
  document.getElementById('groupName').textContent = groupName;

  // Add functionality to the "Add Item" button
  document.querySelector('.add-item-btn').addEventListener('click', () => {
    const itemName = prompt("Please enter the name of the new item:");

    if (itemName) {
      const newItemColumn = document.createElement('div');
      newItemColumn.classList.add('item-column');

      // Add the item name as a heading
      const itemHeading = document.createElement('h3');
      itemHeading.textContent = itemName;

      newItemColumn.appendChild(itemHeading);

      // Append the new item column to the container
      document.getElementById('projectDetailContainer').appendChild(newItemColumn);
    }
  });
});

// Initial document setup, if needed
document.addEventListener('DOMContentLoaded', () => {
  // Existing initialization code goes here

  // New code for the "+" button and table
  const addTaskBtn = document.getElementById('addTaskBtn');
  const taskTable = document.getElementById('taskTable').querySelector('tbody');

  addTaskBtn.addEventListener('click', () => {
      // New table-related function code
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
        <td>${personInCharge || "N/A"}</td>
        <td>${dateAssigned || "N/A"}</td>
        <td>${endDate || "N/A"}</td>
        <td style="color: ${statusColor}; font-weight: bold;">${status}</td>
        <td>${sourceOfFund || "N/A"}</td>
        <td></td> <!-- Placeholder for file input -->
        <td>${budget || "N/A"}</td>
      `;

      // Append file input into document cell
      const documentCell = newRow.children[5];
      documentCell.appendChild(fileInput);

      // Add the row to the table
      taskTable.appendChild(newRow);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const addTaskBtn = document.getElementById('addTaskBtn');
  const taskTable = document.getElementById('taskTable').querySelector('tbody');

  // Add a new row on "+" button click
  addTaskBtn.addEventListener('click', () => {
      const newRow = document.createElement('tr');

      newRow.innerHTML = `
        <td contenteditable="true">N/A</td>
        <td contenteditable="true">N/A</td>
        <td contenteditable="true">N/A</td>
        <td class="status-cell" contenteditable="false">To-Do</td>
        <td contenteditable="true">N/A</td>
        <td class="document-cell">
          <input type="file" class="file-input" style="display:none;">
          <span class="file-name">Upload Document</span>
        </td>
        <td contenteditable="true">N/A</td>
      `;

      taskTable.appendChild(newRow);

      // Initialize the interactive elements for this new row
      initializeRowInteractions(newRow);
  });

  // Initialize existing table row interactions
  function initializeRowInteractions(row) {
      // Make the status cell editable with a dropdown on click
      const statusCell = row.querySelector('.status-cell');
      statusCell.addEventListener('click', () => {
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
            statusCell.style.color = ''; // Reset inline style
            statusCell.textContent = selectedStatus;
            statusCell.setAttribute('data-status', selectedStatus.toLowerCase());
          });
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

// code for making the table elements editable

document.addEventListener('DOMContentLoaded', () => {
  const addTaskBtn = document.getElementById('addTaskBtn');
  const taskTable = document.getElementById('taskTable').querySelector('tbody');

  // Add a new row on "+" button click
  addTaskBtn.addEventListener('click', () => {
      const newRow = document.createElement('tr');

      newRow.innerHTML = `
        <td class="editable-cell">N/A</td>
        <td class="editable-cell">N/A</td>
        <td class="editable-cell">N/A</td>
        <td class="status-cell">To-Do</td>
        <td class="editable-cell">N/A</td>
        <td class="document-cell">
          <input type="file" class="file-input" style="display:none;">
          <span class="file-name">Upload Document</span>
        </td>
        <td class="editable-cell">N/A</td>
      `;

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
