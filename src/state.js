import { loadSelected, saveSelected } from './storage.js';

// Приватное состояние модуля
let selectedRepos = [];

// Инициализация состояния - загружаем данные из localStorage
export function initializeState() {
  selectedRepos = loadSelected();
  return selectedRepos.length;
}

// Получить все выбранные репозитории
export function getSelectedRepos() {
  // Возвращаем копию массива, чтобы внешний код не мог изменить состояние напрямую
  return [...selectedRepos];
}

// Проверить, добавлен ли репозиторий в выбранные
export function isRepoSelected(repo) {
  // Проверяем по уникальному идентификатору full_name
  return selectedRepos.some(r => r.full_name === repo.full_name);
}

// Добавить репозиторий в выбранные
export function addRepo(repo) {
  // Проверяем, не добавлен ли уже этот репозиторий
  if (isRepoSelected(repo)) {
    return false; // Не добавляем дубликаты
  }
  
  // Создаём объект с нужными полями (нормализация данных)
  const normalizedRepo = {
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    html_url: repo.html_url,
    stargazers_count: repo.stargazers_count,
    ownerName: repo.owner.login, // Переименовываем для удобства
  };
  
  // Добавляем в массив
  selectedRepos.push(normalizedRepo);
  
  // Автоматически сохраняем в localStorage
  saveSelected(selectedRepos);
  
  return true; // Успешно добавлено
}

// Удалить репозиторий по индексу
export function removeRepoByIndex(index) {
  // Валидация индекса
  if (index < 0 || index >= selectedRepos.length) {
    return false; // Неверный индекс
  }
  
  // Удаляем элемент по индексу
  selectedRepos.splice(index, 1);
  
  // Автоматически сохраняем в localStorage
  saveSelected(selectedRepos);
  
  return true; // Успешно удалено
}

// Удалить репозиторий по full_name
export function removeRepoByName(fullName) {
  // Найти индекс репозитория
  const index = selectedRepos.findIndex(r => r.full_name === fullName);
  
  if (index === -1) {
    return false; // Репозиторий не найден
  }
  
  // Используем уже готовую функцию удаления по индексу
  return removeRepoByIndex(index);
}

// Очистить все выбранные репозитории
export function clearAllRepos() {
  selectedRepos = [];
  saveSelected(selectedRepos);
  return true;
}

// Получить количество выбранных репозиториев
export function getSelectedCount() {
  return selectedRepos.length;
}
