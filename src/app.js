// Retrieve data from local storage or create an empty array
let todos = [];

// Create variables for the input field, add button, counter, todo list, and priority checkbox
const tdInput = document.getElementById('tdInput');
const addButton = document.querySelector('.btnAdd');
const counter = document.getElementById('taskCounter');
const todoList = document.getElementById('todoList');
const deleteButton = document.querySelector('.btnDel');
const priorityCheckbox = document.getElementById('priorityCheckbox');

// Add event listener to the document
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('http://localhost:7071/api/getTasks');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    todos = await response.json();
    displayTasks();
  } catch (error) {
    console.error('Error fetching tasks:', error);
    todos = []; // Fallback to empty array
    displayTasks();
  }
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
  // Add event listener to the delete button whenever it is clicked
  deleteButton.addEventListener('click', deleteAll);
});

// Add task function
const addTask = async () => {
  const newTask = tdInput.value.trim();
  if (newTask === '') {
    alert('Please enter a task');
    return;
  }

  try {
    const response = await fetch('http://localhost:7071/api/addTask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: newTask,
        priority: priorityCheckbox.checked,
        createdDate: new Date().toISOString().split('T')[0],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    priorityCheckbox.checked = false;
    tdInput.value = '';
    const responseData = await response.json();
    todos.push(responseData);
    displayTasks();
  } catch (error) {
    console.error('Error adding task:', error);
    alert('Failed to add task. Please try again.');
  }
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
const toggleTask = async (index) => {
  try {
    const task = todos[index];
    const updatedDisabled = !task.disabled;
    const response = await fetch(
      `http://localhost:7071/api/updateTask/${task.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          disabled: updatedDisabled,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const updatedTask = await response.json();
    todos[index] = updatedTask;
    displayTasks();
  } catch (error) {
    console.error('Error toggling task:', error);
    alert('Failed to toggle task. Please try again.');
  }
};

// Delete all tasks function
const deleteAll = () => {
  // Clear the todos array
  todos = [];
  // Display the tasks
  displayTasks();
};
