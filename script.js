const STORAGE_KEY = 'todos-v1';
const DEFAULT_STATE = { todos: [], filter: 'all' };

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.todos)) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE };
  }
};

const saveState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
};

let state = loadState();

// DOM
const form   = document.getElementById('form');
const input  = document.getElementById('input');
const addBtn = document.getElementById('addBtn');
const list   = document.getElementById('list');
const empty  = document.getElementById('empty');
const count  = document.getElementById('count');
const filters = document.querySelector('.filters');
const clearDoneBtn = document.getElementById('clearDone');
const toggleAllBtn = document.getElementById('toggleAll');

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const filteredTodos = () => {
  switch (state.filter) {
    case 'active': return state.todos.filter(t => !t.done);
    case 'completed': return state.todos.filter(t => t.done);
    default: return state.todos;
  }
};

const plural = (n) => n === 0 ? '0 việc' : (n === 1 ? '1 việc' : `${n} việc`);

const addTodo = (text) => {
  const trimmed = text.trim();
  if (!trimmed) return;
  state.todos.unshift({ id: uid(), text: trimmed, done: false });
  saveState(state);
  input.value = '';
  addBtn.disabled = true;
};

const toggleTodo = (id) => {
  const t = state.todos.find(t => t.id === id);
  if (t) { t.done = !t.done; saveState(state); }
};

const deleteTodo = (id) => {
  state.todos = state.todos.filter(t => t.id !== id);
  saveState(state);
};

const updateTodo = (id, newText) => {
  const t = state.todos.find(t => t.id === id);
  if (!t) return;
  const trimmed = newText.trim();
  if (!trimmed) { deleteTodo(id); return; }
  t.text = trimmed;
  saveState(state);
};

const clearCompleted = () => {
  state.todos = state.todos.filter(t => !t.done);
  saveState(state);
};

const toggleAll = () => {
  const allDone = state.todos.length > 0 && state.todos.every(t => t.done);
  state.todos.forEach(t => { t.done = !allDone; });
  saveState(state);
};

const setFilter = (filter) => {
  state.filter = filter;
  saveState(state);
};

function render() {
  const remaining = state.todos.filter(t => !t.done).length;
  count.textContent = `${plural(remaining)} còn lại`;

  for (const btn of filters.querySelectorAll('.chip')) {
    const active = btn.dataset.filter === state.filter;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  }

  list.innerHTML = '';
  const data = filteredTodos();
  empty.hidden = data.length !== 0;

  for (const t of data) {
    const li = document.createElement('li');
    li.className = 'item' + (t.done ? ' completed' : '');
    li.dataset.id = t.id;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = t.done;
    cb.addEventListener('change', () => toggleTodo(t.id));

    const text = document.createElement('div');
    text.className = 'text';
    text.textContent = t.text;
    text.title = 'Nhấp đúp để chỉnh sửa';
    text.addEventListener('dblclick', () => enterEdit(li, t));

    const right = document.createElement('div');
    right.className = 'right';

    const editBtn = document.createElement('button');
    editBtn.className = 'icon';
    editBtn.textContent = 'Sửa';
    editBtn.addEventListener('click', () => enterEdit(li, t));

    const delBtn = document.createElement('button');
    delBtn.className = 'icon';
    delBtn.textContent = 'Xóa';
    delBtn.addEventListener('click', () => deleteTodo(t.id));

    right.append(editBtn, delBtn);
    li.append(cb, text, right);
    list.appendChild(li);
  }
}

function enterEdit(li, todo) {
  if (li.querySelector('.editbox')) return;

  li.classList.remove('completed');

  const textDiv = li.querySelector('.text');
  const prev = textDiv.textContent;

  const inputEdit = document.createElement('input');
  inputEdit.className = 'editbox';
  inputEdit.value = prev;

  textDiv.replaceWith(inputEdit);
  inputEdit.focus();
  const val = inputEdit.value; inputEdit.value = ''; inputEdit.value = val;

  const commit = () => updateTodo(todo.id, inputEdit.value);
  const cancel = () => { inputEdit.blur(); render(); };

  inputEdit.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commit();
    else if (e.key === 'Escape') cancel();
  });
  inputEdit.addEventListener('blur', commit);
}

// Events
input.addEventListener('input', () => {
  addBtn.disabled = input.value.trim().length === 0;
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  addTodo(input.value);
});

filters.addEventListener('click', (e) => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  setFilter(btn.dataset.filter);
});

clearDoneBtn.addEventListener('click', () => clearCompleted());
toggleAllBtn.addEventListener('click', () => toggleAll());

render();
