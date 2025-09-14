// Импортируем константы
import { DEBOUNCE_DELAY } from './constants.js';

// Импортируем утилиты
import { debounce } from './debounce.js';

// Импортируем API
import { searchRepos } from './api.js';

// Импортируем управление состоянием
import { 
  initializeState, 
  getSelectedRepos, 
  addRepo, 
  removeRepoByIndex 
} from './state.js';

// Импортируем UI функции
import { 
  renderSuggestions, 
  renderSelectedRepos, 
  renderStatus, 
  clearSuggestions 
} from './ui.js';

// Получаем DOM элементы
const input = document.getElementById("search");
const suggestionsEl = document.getElementById("suggestions");
const repoListEl = document.getElementById("results");

// Обработчик поискового ввода
async function handleSearchInput(text) {
  // Если текст слишком короткий, очищаем подсказки
  if (text.trim().length <= 2) {
    clearSuggestions(suggestionsEl);
    return;
  }

  try {
    // Показываем индикатор загрузки
    renderStatus(suggestionsEl, "Ищем…");
    
    // Выполняем поиск через API модуль
    const repos = await searchRepos(text);
    
    // Рендерим результаты через UI модуль
    renderSuggestions(suggestionsEl, repos, handleRepoClick);
    
  } catch (error) {
    // Обрабатываем ошибки от API модуля
    let errorMessage = "Ошибка сети или запроса";
    
    if (error.message === 'RATE_LIMIT') {
      errorMessage = "Слишком много запросов (rate limit)";
    } else if (error.message === 'INVALID_REQUEST') {
      errorMessage = "Некорректный запрос (422)";
    } else if (error.message === 'SERVER_ERROR') {
      errorMessage = "Ошибка сервера GitHub (5xx)";
    }
    
    renderStatus(suggestionsEl, errorMessage);
  }
}

// Колбэк для клика по репозиторию в подсказках
function handleRepoClick(repo) {
  // Добавляем репозиторий через state модуль
  const success = addRepo(repo);
  
  if (success) {
    // Очищаем поле ввода и подсказки
    input.value = "";
    clearSuggestions(suggestionsEl);
    input.focus();
    
    // Перерендериваем список выбранных
    updateSelectedReposList();
  }
}

// Колбэк для удаления репозитория
function handleRemoveRepo(index) {
  // Удаляем через state модуль
  const success = removeRepoByIndex(index);
  
  if (success) {
    // Перерендериваем список
    updateSelectedReposList();
  }
}

// Обновляет отображение списка выбранных репозиториев
function updateSelectedReposList() {
  // Получаем актуальные данные из state модуля
  const repos = getSelectedRepos();
  
  // Рендерим через UI модуль
  renderSelectedRepos(repoListEl, repos, handleRemoveRepo);
}

// Обработчик клика вне области поиска (закрытие подсказок)
function handleOutsideClick(e) {
  // Если клик не внутри поля поиска или подсказок
  if (!input.contains(e.target) && !suggestionsEl.contains(e.target)) {
    clearSuggestions(suggestionsEl);
  }
}

// Создаём debounced версию обработчика поиска
const debouncedHandleInput = debounce(handleSearchInput, DEBOUNCE_DELAY);

// Функция инициализации приложения
function initializeApp() {
  // Инициализируем состояние (загружаем из localStorage)
  initializeState();
  
  // Отображаем уже сохранённые репозитории
  updateSelectedReposList();
  
  // Привязываем события
  input.addEventListener("input", (e) => {
    debouncedHandleInput(e.target.value);
  });
  
  // Обработчик клика вне области поиска
  document.addEventListener("click", handleOutsideClick);
}

// Ждём загрузки DOM и запускаем приложение
document.addEventListener("DOMContentLoaded", initializeApp);
