import { STORAGE_KEY } from './constants.js';

// Загружает выбранные репозитории из localStorage
export function loadSelected() {
  try {
    // Получаем строку из localStorage по ключу
    const saved = localStorage.getItem(STORAGE_KEY);
    
    // Если ничего не сохранено, возвращаем пустой массив
    if (!saved) {
      return [];
    }
    
    // Парсим JSON строку в объект
    const parsed = JSON.parse(saved);
    
    // Проверяем что это действительно массив
    if (Array.isArray(parsed)) {
      return parsed;
    }
    
    // Если не массив, возвращаем пустой массив
    return [];
    
  } catch (error) {
    // Если ошибка парсинга JSON, логируем и возвращаем пустой массив
    console.warn('Ошибка загрузки из localStorage:', error);
    return [];
  }
}

// Сохраняет выбранные репозитории в localStorage
export function saveSelected(repos) {
  try {
    // Проверяем что передан массив
    if (!Array.isArray(repos)) {
      console.warn('saveSelected: ожидался массив, получено:', typeof repos);
      return;
    }
    
    // Конвертируем массив в JSON строку и сохраняем
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repos));
    
  } catch (error) {
    // Если ошибка сохранения, логируем её
    console.warn('Ошибка сохранения в localStorage:', error);
  }
}
