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
    // ✅ Use relative path so SWA proxy + auth apply
    const response = await fetch('/api/getTasks');
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
    // ✅ Relative path
    const response = await fetch('/api/addTask', {
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
  const activeTasks = todos.filter((item) => !item.disabled);
  const completedTasks = todos.filter((item) => item.disabled);

  const sortTasks = (tasks) =>
    tasks.sort((a, b) => {
      const dateA = a.createdDate || '0000-01-01';
      const dateB = b.createdDate || '0000-01-01';
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return new Date(dateA) - new Date(dateB);
    });

  sortTasks(activeTasks);
  sortTasks(completedTasks);

  todoList.innerHTML = '';

  activeTasks.forEach((item, index) => {
    const p = document.createElement('p');
    p.classList.add('todo');
    p.innerHTML = `
      <div class="todoContainer">
        <input type="checkbox" class="todoCheckbox" id="input-${index}" ${
      item.disabled ? 'checked' : ''
    }>
        <p id="todo-${index}" class="${item.disabled ? 'disabled ' : ''}${
      item.priority ? 'priorityTask' : ''
    }">
          ${item.text}
        </p>
        <img src="./images/delete.svg" alt="delete" class="deleteIcon">
      </div>
    `;

    p.querySelector('.todoCheckbox').addEventListener('change', () =>
      toggleTask(todos.indexOf(item))
    );
    p.querySelector('.deleteIcon').addEventListener('click', () =>
      deleteTask(todos.indexOf(item))
    );

    todoList.appendChild(p);
  });

  completedTasks.forEach((item, index) => {
    const p = document.createElement('p');
    p.classList.add('todo');
    p.innerHTML = `
      <div class="todoContainer">
        <input type="checkbox" class="todoCheckbox" id="input-completed-${index}" ${
      item.disabled ? 'checked' : ''
    }>
        <p id="todo-completed-${index}" class="${
      item.disabled ? 'disabled ' : ''
    }${item.priority ? 'priorityTask' : ''}">
          ${item.text}
        </p>
        <img src="./images/delete.svg" alt="delete" class="deleteIcon">
      </div>
    `;

    p.querySelector('.todoCheckbox').addEventListener('change', () =>
      toggleTask(todos.indexOf(item))
    );
    p.querySelector('.deleteIcon').addEventListener('click', () =>
      deleteTask(todos.indexOf(item))
    );

    todoList.appendChild(p);
  });

  counter.textContent = activeTasks.length;
};

// Toggle task function to change the status of the task
const toggleTask = async (index) => {
  try {
    const task = todos[index];
    const updatedDisabled = !task.disabled;
    // ✅ Relative path
    const response = await fetch(`/api/updateTask/${task.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        disabled: updatedDisabled,
      }),
    });

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

// Delete a single task
const deleteTask = async (index) => {
  try {
    const task = todos[index];
    // ✅ Relative path
    const response = await fetch(`/api/deleteTask/${task.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    todos.splice(index, 1);
    displayTasks();
  } catch (error) {
    console.error('Error deleting task:', error);
    alert('Failed to delete task. Please try again.');
  }
};

// Delete all tasks
const deleteAll = async () => {
  try {
    // ✅ Relative path
    const response = await fetch('/api/deleteAllTasks', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    todos = [];
    displayTasks();
  } catch (error) {
    console.error('Error deleting all tasks:', error);
    alert('Failed to delete all tasks. Please try again.');
  }
};
