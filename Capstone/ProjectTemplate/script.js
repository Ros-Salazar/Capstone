// Switch between Main Table and Calendar views
document.getElementById('mainTableBtn').addEventListener('click', function () {
    document.querySelector('.group-section').classList.add('active-section');
    document.querySelector('.calendar-section').classList.remove('active-section');
    setActiveButton('mainTableBtn');
  });
  
  document.getElementById('calendarBtn').addEventListener('click', function () {
    document.querySelector('.group-section').classList.remove('active-section');
    document.querySelector('.calendar-section').classList.add('active-section');
    setActiveButton('calendarBtn');
  });
  
  // Function to set the active button
  function setActiveButton(buttonId) {
    document.getElementById('mainTableBtn').classList.remove('active');
    document.getElementById('calendarBtn').classList.remove('active');
    document.getElementById(buttonId).classList.add('active');
  }
  
  // AJAX Helper Function
  function ajaxRequest(data, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "api.php", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        callback(xhr.responseText);
      }
    };
    xhr.send(data);
  }
  
  // Add Group to Database and UI
  document.getElementById('addGroupBtn').addEventListener('click', function () {
    const groupName = "New Group";
  
    ajaxRequest(`action=add_group&group_name=${encodeURIComponent(groupName)}`, (response) => {
      console.log(response);
      if (response.includes("success")) {
        const table = createTable();
        const container = document.querySelector('.group-container');
        container.appendChild(table);
        container.appendChild(createAddRowButton(table));
      } else {
        console.error("Failed to add group:", response);
      }
    });
  });
  
  // Function to Create a Table
  function createTable() {
    const table = document.createElement('table');
    table.className = 'group-table';
  
    const headerRow = createHeaderRow(table);
    table.appendChild(headerRow);
  
    addRow(table, headerRow); // Add Default Row
    return table;
  }
  
  // Function to Create Header Row
  function createHeaderRow(table) {
    const headerRow = document.createElement('tr');
    headerRow.appendChild(createHeaderCell('⋮', 'fixed-column'));
    headerRow.appendChild(createHeaderCell('New Group', '', true));
  
    const plusHeader = createHeaderCell('+', 'plus-header');
    const dropdownMenu = createDropdownMenu(['Text', 'Numbers', 'Status', 'Key Persons', 'Timeline', 'Upload File'], (option) => {
      option === 'Timeline' ? addTimelineColumns(table, headerRow) : addColumn(option, table, headerRow);
      dropdownMenu.style.display = 'none';
      dropdownMenu.style.cursor = 'pointer';
    });
  
    plusHeader.addEventListener('click', () => {
      dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });
    plusHeader.appendChild(dropdownMenu);
    headerRow.appendChild(plusHeader);
  
    return headerRow;
  }
  
  // Function to Create Add Row Button
  function createAddRowButton(table) {
    const addRowBtn = document.createElement('button');
    addRowBtn.className = 'add-item-btn';
    addRowBtn.textContent = 'Add Item';
    addRowBtn.addEventListener('click', () => addRow(table, table.rows[0]));
    return addRowBtn;
  }
  
  // Function to Create Header Cell
  function createHeaderCell(text, className = '', editable = false) {
    const header = document.createElement('th');
    header.textContent = text;
    header.className = className;
    if (editable) header.contentEditable = true;
    return header;
  }
  
  // Function to Create Dropdown Menu
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
  
  // Function to Add a Column
  function addColumn(option, table, headerRow) {
    if (Array.from(headerRow.cells).some(cell => cell.textContent.trim() === option)) return;
  
    const newHeader = createHeaderCell(option, '', true);
    headerRow.insertBefore(newHeader, headerRow.lastChild);
  
    Array.from(table.rows).forEach((row, index) => {
      if (index === 0) return;
      row.insertBefore(createCell(option), row.lastChild);
    });
  }
  
  // Function to Add Timeline Columns
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
  
  // Function to Add a Row
  function addRow(table, headerRow) {
    const row = document.createElement('tr');
  
    Array.from(headerRow.cells).forEach((header, index) => {
      const cell = index === 0 ? createActionCell(row) : createCell(header.textContent);
      row.appendChild(cell);
    });
  
    table.appendChild(row);
  }
  
  // Function to Create Cell
  function createCell(headerText) {
    const cell = document.createElement('td');
  
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
  
  // Function to Create Date Cell
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
  
  // Synchronize the selected date to the calendar
  function syncDateToCalendar(date) {
    if (!date) return;
    if (!pinnedDates.includes(date)) {
      pinnedDates.push(date); // Add the date to pinnedDates
    }
    renderCalendar(); // Re-render the calendar to reflect the changes
  }
  
  // Function to Handle File Upload
  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        console.log('File content:', e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }
  
  // Calendar Variables and Rendering
  const calendarGrid = document.querySelector('.calendar-grid');
  const monthYearDisplay = document.getElementById('monthYearDisplay');
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let pinnedDates = [];
  
  function renderCalendar() {
    calendarGrid.innerHTML = '';
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
    monthYearDisplay.textContent = `${new Date(currentYear, currentMonth).toLocaleString('en-US', { month: 'long' })} ${currentYear}`;
  
    for (let i = 0; i < firstDay; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.classList.add('calendar-day');
      calendarGrid.appendChild(emptyCell);
    }
  
    for (let day = 1; day <= daysInMonth; day++) {
      const dayCell = document.createElement('div');
      dayCell.classList.add('calendar-day');
      const fullDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      dayCell.textContent = day;
  
      if (pinnedDates.includes(fullDate)) {
        dayCell.classList.add('highlighted');
      }
  
      calendarGrid.appendChild(dayCell);
    }
  }
  
  renderCalendar();
  
  document.getElementById('prevMonth').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
  });
  
  document.getElementById('nextMonth').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
  });
  
  // Function to Create Action Cell
  function createActionCell(row) {
    const actionCell = document.createElement('td');
    actionCell.textContent = '⋮';
    actionCell.className = 'fixed-column';
    actionCell.addEventListener('click', () => {
      row.remove();
    });
    return actionCell;
  }
  
  // Function to Create Input
  function createInput(type, placeholder = '') {
    const input = document.createElement('input');
    input.type = type;
    input.placeholder = placeholder;
    return input;
  }
  
  // Function to Create Select
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
  