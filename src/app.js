//retrieve data from local storage or create an empty array

let todos = JSON.parse(localStorage.getItem('todo')) || [];

//create variables for the input field, add button, counter and todo list
const tdInput = document.getElementById('tdInput');
const addButton = document.querySelector('.btnAdd');
const counter = document.getElementById('taskCounter');
const todoList = document.getElementById('todoList');
const deleteButton = document.querySelector('.btnDel');

//add event listener to the document

document.addEventListener('DOMContentLoaded', () => {
  //add event listener to the add button whenever it is clicked
  addButton.addEventListener('click', addTask);
  //add event listener to the input field whenever a key is pressed
  tdInput.addEventListener('keydown', (event) => {
    //If the key pressed is the enter key, call the addTask function
    if (event.key === 'Enter') {
      event.preventDefault();
      addTask();
    }
  });
  //display the tasks
  displayTasks();
  //add event listener to the delete button whenever it is clicked
  deleteButton.addEventListener('click', deleteAll);
});

//add task function
const addTask = () => {
  //create a new task variable and assign the value of the input field to it after trimming it.
  const newTask = tdInput.value.trim();
  //if the input field is empty, alert the user to enter a task
  if (newTask === '') {
    alert('Please enter a task');
    return;
    //if the input field is not empty, push the new task to the todos array, save to local storage, clear the input field and display the tasks
  } else {
    todos.push({
      text: newTask,
      disabled: false,
    });
    //save to local storage
    saveToLocalStorage();
    //clear the input field
    tdInput.value = '';
    //display the tasks
    displayTasks();
  }
};

//save to local storage function
const saveToLocalStorage = () => {
  //save the todos array to local storage by converting the javascript object to a string
  localStorage.setItem('todo', JSON.stringify(todos));
};

//display tasks function
const displayTasks = () => {
  // Clear the todoList element
  todoList.innerHTML = '';

  // Loop through the todos array and display each task
  todos.forEach((item, index) => {
    // Create a new paragraph element
    const p = document.createElement('p');
    p.classList.add('todo');
    // Set the inner HTML of the paragraph element
    p.innerHTML = `
      <div class="todoContainer">
        <input type="checkbox" class="todoCheckbox" id="input-${index}" ${
      item.disabled ? 'checked' : ''
    }>
        <p id="todo-${index}" class="${
      item.disabled ? 'disabled' : ''
    }" onclick="editTask(${index})">${item.text}</p>
        <img src="./images/delete.svg" alt="delete" class="deleteIcon"> 
      </div>
    `;

    // Add event listener to the checkbox to toggle the task
    p.querySelector('.todoCheckbox').addEventListener('change', () =>
      toggleTask(index)
    );

    // Add event listener to the delete icon to delete the task
    p.querySelector('.deleteIcon').addEventListener('click', () => {
      // Remove the task from the todos array
      todos.splice(index, 1);
      // Re-render the task list
      displayTasks();
      // Optionally, update localStorage if you're using it
      // localStorage.setItem('todos', JSON.stringify(todos));
    });

    // Append the paragraph element to the todoList
    todoList.appendChild(p);
  });

  // Update the counter
  counter.textContent = todos.length;
};

//Toggle task function to change the status of the task from disabled = false to disabled = true
const toggleTask = (index) => {
  //toggle the status of the task
  todos[index].disabled = !todos[index].disabled;
  //save to local storage
  saveToLocalStorage();
  //display the tasks
  displayTasks();
  //update the counter to show the number of tasks disabled = false
  counter.textContent = todos.filter((item) => !item.disabled).length;
};

//delete all tasks function
const deleteAll = () => {
  //clear the todos array
  todos = [];
  //save to local storage
  saveToLocalStorage();
  //display the tasks
  displayTasks();
};
