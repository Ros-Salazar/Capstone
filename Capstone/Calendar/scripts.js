let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
const calendarGrid = document.querySelector('.calendar-grid');
const taskModal = document.getElementById('taskModal');
const taskTitle = document.getElementById('taskTitle');
const taskStatus = document.getElementById('taskStatus');
const saveTaskBtn = document.getElementById('saveTaskBtn');
let selectedDate = null;

// Generate Calendar Grid
function generateCalendar(month, year) {
  document.getElementById('monthYear').textContent = `${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year}`;
  calendarGrid.innerHTML = '<div class="day-header">Mon</div><div class="day-header">Tue</div><div class="day-header">Wed</div><div class="day-header">Thu</div><div class="day-header">Fri</div><div class="day-header">Sat</div><div class="day-header">Sun</div>';

  const firstDay = new Date(year, month).getDay() || 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 1; i < firstDay; i++) calendarGrid.appendChild(document.createElement('div'));

  for (let day = 1; day <= daysInMonth; day++) {
    const dayElem = document.createElement('div');
    dayElem.classList.add('day');
    dayElem.innerHTML = `<div class="date">${day}</div>`;
    dayElem.addEventListener('click', () => openTaskModal(day));
    calendarGrid.appendChild(dayElem);
  }
}

function openTaskModal(day) {
  selectedDate = new Date(currentYear, currentMonth, day);
  taskTitle.value = '';
  taskStatus.value = 'done';
  taskModal.style.display = 'block';
}

document.getElementById('prevMonth').addEventListener('click', () => {
  currentMonth = (currentMonth - 1 + 12) % 12;
  if (currentMonth === 11) currentYear--;
  generateCalendar(currentMonth, currentYear);
});

document.getElementById('nextMonth').addEventListener('click', () => {
  currentMonth = (currentMonth + 1) % 12;
  if (currentMonth === 0) currentYear++;
  generateCalendar(currentMonth, currentYear);
});

document.getElementById('closeModal').addEventListener('click', () => {
  taskModal.style.display = 'none';
});

saveTaskBtn.addEventListener('click', () => {
  const task = {
    title: taskTitle.value,
    status: taskStatus.value,
    date: selectedDate.toISOString().split('T')[0]
  };

  localStorage.setItem(task.date, JSON.stringify(task));
  taskModal.style.display = 'none';
  generateCalendar(currentMonth, currentYear); // Refresh the calendar
});

generateCalendar(currentMonth, currentYear);
