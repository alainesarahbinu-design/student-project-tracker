const form = document.querySelector('#project-form');
const nameInput = document.querySelector('#name');
const statusInput = document.querySelector('#status');
const projectList = document.querySelector('#project-list');
const emptyState = document.querySelector('#empty-state');
const saveButton = document.querySelector('#save-button');
const cancelButton = document.querySelector('#cancel-button');
const message = document.querySelector('#message');

const STORAGE_KEY = 'workshop-projects-v1';

// Stores projects in memory and, when possible, in localStorage.
let projects = [];
let editingId = null;

// Check whether restored data contains valid project records.
function isValidProjectArray(data) {
  if (!Array.isArray(data)) {
    return false;
  }

  const ids = new Set();

  return data.every(project => {
    if (
      project === null ||
      typeof project !== 'object' ||
      Array.isArray(project) ||
      typeof project.id !== 'string' ||
      project.id.trim() === '' ||
      typeof project.name !== 'string' ||
      project.name.trim() === '' ||
      !['Planned', 'In Progress', 'Completed'].includes(project.status) ||
      ids.has(project.id)
    ) {
      return false;
    }

    ids.add(project.id);
    return true;
  });
}

// Restore saved projects when the page starts.
function loadProjects() {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);

    // No saved data means this is a fresh collection.
    if (storedData === null) {
      projects = [];
      return;
    }

    // Convert the stored text back into a JavaScript value.
    const parsedData = JSON.parse(storedData);

    if (!isValidProjectArray(parsedData)) {
      projects = [];
      message.textContent =
        'Saved project data is invalid. It has not been overwritten. ' +
        'Check the stored data before saving new changes.';
      return;
    }

    projects = parsedData;
  } catch (error) {
    projects = [];
    message.textContent =
      'Could not read saved projects from browser storage. ' +
      'The stored data has not been overwritten.';
  }
}

// Convert the collection to text and save it.
function saveProjects() {
  try {
    const storedData = JSON.stringify(projects);
    localStorage.setItem(STORAGE_KEY, storedData);
    return true;
  } catch (error) {
    message.textContent =
      'Changes could not be saved to browser storage. ' +
      'They remain available only for this page session.';
    return false;
  }
}

// Display all projects and their action buttons.
function renderProjects() {
  projectList.replaceChildren();

  projects.forEach(project => {
    const listItem = document.createElement('li');
    const projectName = document.createElement('span');
    const projectStatus = document.createElement('span');
    const editButton = document.createElement('button');
    const deleteButton = document.createElement('button');

    projectName.textContent = project.name;
    projectStatus.textContent = ` — Status: ${project.status}`;

    // Edit button
    editButton.type = 'button';
    editButton.textContent = 'Edit';

    editButton.addEventListener('click', () => {
      editingId = project.id;

      nameInput.value = project.name;
      statusInput.value = project.status;

      saveButton.textContent = 'Save changes';
      cancelButton.hidden = false;

      message.textContent = 'Editing project.';
      nameInput.focus();
    });

    // Delete button
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';

    deleteButton.addEventListener('click', () => {
      const projectToDelete = projects.find(
        item => item.id === project.id
      );

      if (!projectToDelete) {
        return;
      }

      const confirmed = window.confirm(
        `Are you sure you want to delete "${projectToDelete.name}"?`
      );

      // Cancelling does not change memory or stored data.
      if (!confirmed) {
        return;
      }

      const projectIndex = projects.findIndex(
        item => item.id === projectToDelete.id
      );

      if (projectIndex === -1) {
        return;
      }

      projects.splice(projectIndex, 1);

      // Exit edit mode if the selected project was deleted.
      if (editingId === projectToDelete.id) {
        resetForm();
      }

      renderProjects();

      if (saveProjects()) {
        message.textContent = 'Project deleted successfully.';
      }

      nameInput.focus();
    });

    listItem.append(
      projectName,
      projectStatus,
      document.createTextNode(' '),
      editButton,
      document.createTextNode(' '),
      deleteButton
    );

    projectList.appendChild(listItem);
  });

  emptyState.hidden = projects.length > 0;
}

// Return the form to Add mode.
function resetForm() {
  form.reset();
  editingId = null;

  saveButton.textContent = 'Save Project';
  cancelButton.hidden = true;

  nameInput.setCustomValidity('');
}

// Add a project or save changes to an existing project.
form.addEventListener('submit', event => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const status = statusInput.value;

  if (name === '') {
    nameInput.setCustomValidity('Please enter a project name.');
    nameInput.reportValidity();
    nameInput.setCustomValidity('');
    return;
  }

  if (editingId !== null) {
    // Update the existing record without changing its ID.
    const project = projects.find(
      item => item.id === editingId
    );

    if (!project) {
      message.textContent =
        'Project not found. Please try again.';
      resetForm();
      nameInput.focus();
      return;
    }

    project.name = name;
    project.status = status;

    renderProjects();

    if (saveProjects()) {
      message.textContent = 'Project updated successfully.';
    }
  } else {
    // Create a new project with a unique, stable ID.
    const project = {
      id: crypto.randomUUID(),
      name: name,
      status: status
    };

    projects.push(project);
    renderProjects();

    if (saveProjects()) {
      message.textContent = 'Project added successfully.';
    }
  }

  resetForm();
  nameInput.focus();
});

// Cancel editing without changing any saved record.
cancelButton.addEventListener('click', () => {
  resetForm();
  message.textContent = 'Edit cancelled. No changes were saved.';
  nameInput.focus();
});

// Restore saved data before the initial display.
loadProjects();
renderProjects();