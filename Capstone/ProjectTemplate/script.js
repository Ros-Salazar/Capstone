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
