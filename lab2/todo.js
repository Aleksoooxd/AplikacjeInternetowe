class Todo {
    constructor() {
        this.tasks = [];
        this.nextId = 1;
        this.term = '';

        this.todoList = document.getElementById('todoList');
        this.searchBox = document.getElementById('searchBox');
        this.newTaskText = document.getElementById('newTaskText');
        this.newTaskDate = document.getElementById('newTaskDate');
        this.addButton = document.getElementById('addButton');
        this.errorMessage = document.getElementById('errorMessage');

        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.draw();
    }
    get filteredTasks() {
        if (this.term.length < 2) {
            return this.tasks;
        }

        return this.tasks.filter(task =>
            task.text.toLowerCase().includes(this.term.toLowerCase())
        );
    }
    draw() {
        this.todoList.innerHTML = '';

        const tasksToRender = this.filteredTasks;

        tasksToRender.forEach(task => {
            const li = this.createTaskElement(task);
            this.todoList.appendChild(li);
        });
    }

    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.dataset.id = task.id;
        li.dataset.date = task.date;

        const contentSpan = document.createElement('span');
        contentSpan.className = 'todo-content';

        if (this.term.length >= 2) {
            contentSpan.innerHTML = this.highlightText(task.text, this.term);
        } else {
            contentSpan.textContent = task.text;
        }

        contentSpan.addEventListener('click', () => {
            this.startEditingText(li, task);
        });

        const dateSpan = document.createElement('span');
        dateSpan.className = 'todo-date';
        dateSpan.textContent = task.date || 'Bez terminu';
        dateSpan.style.cursor = 'pointer';
        dateSpan.addEventListener('click', () => {
            this.startEditingDate(li, task);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '🗑 Usuń';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteTask(task.id);
        });

        li.appendChild(contentSpan);
        li.appendChild(dateSpan);
        li.appendChild(deleteBtn);

        return li;
    }
    highlightText(text, searchTerm) {
        const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    setupEventListeners() {
        this.searchBox.addEventListener('input', (e) => {
            this.term = e.target.value;
            this.draw();
        });

        this.addButton.addEventListener('click', () => {
            this.addTask();
        });

        this.newTaskText.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });
    }
    addTask() {
        const text = this.newTaskText.value.trim();
        const date = this.newTaskDate.value;
        this.errorMessage.textContent = '';

        if (text.length < 3 || text.length > 255) {
            this.errorMessage.textContent = 'Zadanie musi mieć od 3 - 255 znaków!';
            return;
        }

        if (date) {
            const selectedDate = new Date(date);
            const now = new Date();

            if (selectedDate <= now) {
                this.errorMessage.textContent = 'Data musi być w przyszłości!';
                return;
            }
        }

        const newTask = {
            id: this.nextId++,
            text: text,
            date: date ? date.substring(0, 10) : ''
        };

        this.tasks.push(newTask);
        this.saveToLocalStorage();
        this.draw();

        this.newTaskText.value = '';
        this.newTaskDate.value = '';
    }

    deleteTask(id) {

        if (confirm('Na pewno?')) {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveToLocalStorage();
            this.draw();
        }
    }

    startEditingText(li, task) {
        const contentSpan = li.querySelector('.todo-content');
        const originalText = task.text;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-input';
        input.value = originalText;

        contentSpan.replaceWith(input);
        input.focus();
        input.select();

        const saveEdit = () => {
            const newText = input.value.trim();

            if (newText.length >= 3 && newText.length <= 255) {
                task.text = newText;
                this.saveToLocalStorage();
                this.draw();
            } else {
                this.errorMessage.textContent = 'Zadanie musi mieć od 3 - 255 znaków!';
                this.draw();
            }
        };

        const cancelEdit = () => {
            this.draw();
        };

        const handleClickOutside = (e) => {
            if (!input.contains(e.target)) {
                saveEdit();
                document.removeEventListener('click', handleClickOutside);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.removeEventListener('click', handleClickOutside);
                saveEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                document.removeEventListener('click', handleClickOutside);
                cancelEdit();
            }
        });

        input.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    startEditingDate(li, task) {
        const dateSpan = li.querySelector('.todo-date');
        const originalDate = task.date;

        const input = document.createElement('input');
        input.type = 'date';
        input.className = 'edit-input';
        input.value = originalDate;

        dateSpan.replaceWith(input);
        input.focus();

        const saveEdit = () => {
            const newDate = input.value;

            if (newDate) {
                const selectedDate = new Date(newDate);
                const now = new Date();

                if (selectedDate > now) {
                    task.date = newDate.substring(0, 10);
                    this.saveToLocalStorage();
                    this.draw();
                } else {
                    this.errorMessage.textContent = 'Data musi być w przyszłości!';
                    this.draw();
                }
            } else {
                task.date = '';
                this.saveToLocalStorage();
                this.draw();
            }
        };

        const cancelEdit = () => {
            this.draw();
        };

        const handleClickOutside = (e) => {
            if (!input.contains(e.target)) {
                saveEdit();
                document.removeEventListener('click', handleClickOutside);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.removeEventListener('click', handleClickOutside);
                saveEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                document.removeEventListener('click', handleClickOutside);
                cancelEdit();
            }
        });

        input.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    saveToLocalStorage() {
        const data = {
            tasks: this.tasks,
            nextId: this.nextId
        };
        localStorage.setItem('todos', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const stored = localStorage.getItem('todos');

        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.tasks = data.tasks || [];
                this.nextId = data.nextId || 1;
            } catch (e) {
                this.errorMessage.textContent = 'Błąd ładowania danych z Local Storage:' + e.message;
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const todoApp = new Todo();

    window.todoApp = todoApp;

    console.log('Aplikacja TODO załadowana!');
});
