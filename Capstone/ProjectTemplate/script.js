// Retrieve the project name from localStorage
document.addEventListener('DOMContentLoaded', () => {
    const projectName = localStorage.getItem('selectedProjectName');
    // Display the project name
    document.getElementById('projectName').textContent = projectName || "Unnamed Project";
  });
