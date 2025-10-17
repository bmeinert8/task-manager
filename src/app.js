// Retrieve data from local storage or create an empty array
let todos = JSON.parse(localStorage.getItem('todo')) || [];

// Create variables for the input field, add button, counter, todo list, and priority checkbox
const tdInput = document.getElementById('tdInput');
const addButton = document.querySelector('.btnAdd');
const counter = document.getElementById('taskCounter');
const todoList = document.getElementById('todoList');
const deleteButton = document.querySelector('.btnDel');
const priorityCheckbox = document.getElementById('priorityCheckbox');

// Add event listener to the document
document.addEventListener('DOMContentLoaded', () => {
  // Add event listener to the add button whenever it is clicked
  addButton.addEventListener('click', addTask);
  // Add event listener to the input field whenever a key is pressed
  tdInput.addEventListener('keydown', (event) => {
    // If the key pressed is the enter key, call the addTask function
    if (event.key === 'Enter') {
      event.preventDefault();
      addTask();
    }
  });
  // Display the tasks
  displayTasks();
  // Add event listener to the delete button whenever it is clicked
  deleteButton.addEventListener('click', deleteAll);
});

// Add task function
const addTask = () => {
  // Create a new task variable and assign the value of the input field to it after trimming it
  const newTask = tdInput.value.trim();
  // If the input field is empty, alert the user to enter a task
  if (newTask === '') {
    alert('Please enter a task');
    return;
  } else {
    // Get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split('T')[0];
    // Push the new task to the todos array with priority and createdDate
    todos.push({
      text: newTask,
      disabled: false,
      priority: priorityCheckbox.checked, // Set priority to true if checked, false otherwise
      createdDate: currentDate, // Auto-add creation date
    });
    // Reset the priority checkbox after adding
    priorityCheckbox.checked = false;
    // Save to local storage
    saveToLocalStorage();
    // Clear the input field
    tdInput.value = '';
    // Display the tasks
    displayTasks();
  }
};

// Save to local storage function
const saveToLocalStorage = () => {
  // Save the todos array to local storage by converting the javascript object to a string
  localStorage.setItem('todo', JSON.stringify(todos));
};

// Display tasks function
const displayTasks = () => {
  // Split tasks into active and completed
  const activeTasks = todos.filter((item) => !item.disabled);
  const completedTasks = todos.filter((item) => item.disabled);

  // Sort function: priority true first, then oldest createdDate
  const sortTasks = (tasks) =>
    tasks.sort((a, b) => {
      // Handle missing createdDate (backward compatibility)
      const dateA = a.createdDate || '0000-01-01';
      const dateB = b.createdDate || '0000-01-01';
      // Priority true (1) before false (0)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // Within same priority, oldest createdDate first
      return new Date(dateA) - new Date(dateB);
    });

  // Sort both groups
  sortTasks(activeTasks);
  sortTasks(completedTasks);

  // Clear the todoList element
  todoList.innerHTML = '';

  // Render active tasks first
  activeTasks.forEach((item, index) => {
    // Create a new paragraph element
    const p = document.createElement('p');
    p.classList.add('todo');
    // Set the inner HTML of the paragraph element
    p.innerHTML = `
      <div class="todoContainer">
        <input type="checkbox" class="todoCheckbox" id="input-${index}" ${
      item.disabled ? 'checked' : ''
    }>
        <p id="todo-${index}" class="${item.disabled ? 'disabled ' : ''}${
      item.priority ? 'priorityTask' : ''
    }">${item.text}</p>
        <img src="./images/delete.svg" alt="delete" class="deleteIcon"> 
      </div>
    `;

    // Add event listener to the checkbox to toggle the task
    p.querySelector('.todoCheckbox').addEventListener(
      'change',
      () => toggleTask(todos.indexOf(item)) // Use global index for todos array
    );

    // Add event listener to the delete icon to delete the task
    p.querySelector('.deleteIcon').addEventListener('click', () => {
      // Remove the task from the todos array
      todos.splice(todos.indexOf(item), 1);
      // Save to local storage
      saveToLocalStorage();
      // Re-render the task list
      displayTasks();
    });

    // Append the paragraph element to the todoList
    todoList.appendChild(p);
  });

  // Render completed tasks at the bottom
  completedTasks.forEach((item, index) => {
    // Create a new paragraph element
    const p = document.createElement('p');
    p.classList.add('todo');
    // Set the inner HTML of the paragraph element
    p.innerHTML = `
      <div class="todoContainer">
        <input type="checkbox" class="todoCheckbox" id="input-completed-${index}" ${
      item.disabled ? 'checked' : ''
    }>
        <p id="todo-completed-${index}" class="${
      item.disabled ? 'disabled ' : ''
    }${item.priority ? 'priorityTask' : ''}">${item.text}</p>
        <img src="./images/delete.svg" alt="delete" class="deleteIcon"> 
      </div>
    `;

    // Add event listener to the checkbox to toggle the task
    p.querySelector('.todoCheckbox').addEventListener(
      'change',
      () => toggleTask(todos.indexOf(item)) // Use global index for todos array
    );

    // Add event listener to the delete icon to delete the task
    p.querySelector('.deleteIcon').addEventListener('click', () => {
      // Remove the task from the todos array
      todos.splice(todos.indexOf(item), 1);
      // Save to local storage
      saveToLocalStorage();
      // Re-render the task list
      displayTasks();
    });

    // Append the paragraph element to the todoList
    todoList.appendChild(p);
  });

  // Update the counter to show active tasks
  counter.textContent = activeTasks.length;
};

// Toggle task function to change the status of the task from disabled = false to disabled = true
const toggleTask = (index) => {
  // Toggle the status of the task
  todos[index].disabled = !todos[index].disabled;
  // Save to local storage
  saveToLocalStorage();
  // Display the tasks
  displayTasks();
};

// Delete all tasks function
const deleteAll = () => {
  // Clear the todos array
  todos = [];
  // Save to local storage
  saveToLocalStorage();
  // Display the tasks
  displayTasks();
};
