document.addEventListener('DOMContentLoaded', () => {
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskTable = document.getElementById('taskTable').querySelector('tbody');
    const mainTableBtn = document.querySelector('.main-table-btn');
    const projectDetailContainer = document.getElementById('projectDetailContainer');
    const calendarBtn = document.querySelector('.calendar-btn');
    const calendarModal = document.getElementById('calendarModal');
    const closeModalBtn = document.querySelector('.close-btn');
    const calendarGrid = document.getElementById('calendarGrid');

    // Function to add a new task row
    addTaskBtn.addEventListener('click', () => {
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
    }

    // Calendar button functionality
    calendarBtn.addEventListener('click', () => {
        populateCalendar();
        calendarModal.style.display = 'flex';
    });

    // Close modal
    closeModalBtn.addEventListener('click', () => {
        calendarModal.style.display = 'none';
    });

    // Populate Calendar
    function populateCalendar() {
        calendarGrid.innerHTML = ''; // Clear previous cells

        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        daysOfWeek.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });

        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // Day index of the first day of the month
        const daysInMonth = new Date(year, month + 1, 0).getDate(); // Total days in the month

        // Empty cells for days before the start of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-date empty';
            calendarGrid.appendChild(emptyCell);
        }

        // Populate days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-date';
            dayCell.innerHTML = `<span class="date-number">${day}</span>`;
            calendarGrid.appendChild(dayCell);
        }

        // Add tasks to calendar
        taskTable.querySelectorAll('tr').forEach(row => {
            const task = row.cells[0].textContent;
            const startDate = new Date(row.cells[2].textContent);
            const endDate = new Date(row.cells[3].textContent);

            for (let day = startDate.getDate(); day <= endDate.getDate(); day++) {
                const dayCell = calendarGrid.children[day - 1];
                const taskLabel = document.createElement('div');
                taskLabel.className = 'task';
                taskLabel.textContent = task;
                dayCell.appendChild(taskLabel);
            }
        });
    }
});
