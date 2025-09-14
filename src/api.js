import { GITHUB_API_URL } from './constants.js';

// Приватные переменные модуля
let currentAbortController = null;
let lastRequestId = 0;

export async function searchRepos(term) {
  // Если запрос пустой, возвращаем пустой массив
  if (!term) return [];

  // Отменяем предыдущий запрос если он есть
  if (currentAbortController) {
    currentAbortController.abort();
  }

  // Создаём новый контроллер для отмены запроса
  currentAbortController = new AbortController();
  
  // Увеличиваем счётчик запросов для отслеживания актуального запроса
  lastRequestId += 1;
  const requestId = lastRequestId;

  try {
    // Строим URL с параметрами запроса
    const url = `${GITHUB_API_URL}?q=${encodeURIComponent(term)}&per_page=5`;
    
    // Выполняем fetch запрос
    const res = await fetch(url, {
      headers: { Accept: "application/vnd.github.v3+json" },
      signal: currentAbortController.signal,
    });

    // Проверяем статус ответа и возвращаем ошибки вместо renderStatus
    if (res.status === 403) {
      throw new Error('RATE_LIMIT');
    }
    if (res.status === 422) {
      throw new Error('INVALID_REQUEST');
    }
    if (res.status >= 500) {
      throw new Error('SERVER_ERROR');
    }
    if (!res.ok) {
      throw new Error(`HTTP_ERROR_${res.status}`);
    }

    // Парсим JSON ответ
    const data = await res.json();
    
    // Проверяем, что это всё ещё актуальный запрос
    if (requestId !== lastRequestId) return [];
    
    // Возвращаем массив репозиториев или пустой массив
    return Array.isArray(data.items) ? data.items : [];
    
  } catch (e) {
    // Если запрос был отменён, возвращаем пустой массив
    if (e.name === "AbortError") return [];
    
    // Для других ошибок - пробрасываем их наружу
    throw e;
  }
}
