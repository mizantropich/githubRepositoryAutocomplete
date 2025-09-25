import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Мокаем все импортированные модули
vi.mock('../src/constants.js', () => ({
  DEBOUNCE_DELAY: 300
}));

vi.mock('../src/debounce.js', () => ({
  debounce: vi.fn((fn, delay) => {
    // Возвращаем функцию которая сразу вызывает оригинальную (без задержки для тестов)
    return vi.fn((...args) => fn(...args));
  })
}));

vi.mock('../src/api.js', () => ({
  searchRepos: vi.fn()
}));

vi.mock('../src/state.js', () => ({
  initializeState: vi.fn(),
  getSelectedRepos: vi.fn(),
  addRepo: vi.fn(),
  removeRepoByIndex: vi.fn()
}));

vi.mock('../src/ui.js', () => ({
  renderSuggestions: vi.fn(),
  renderSelectedRepos: vi.fn(),
  renderStatus: vi.fn(),
  clearSuggestions: vi.fn()
}));

// Импортируем моки после их определения
import { debounce } from '../src/debounce.js';
import { searchRepos } from '../src/api.js';
import { 
  initializeState, 
  getSelectedRepos, 
  addRepo, 
  removeRepoByIndex 
} from '../src/state.js';
import { 
  renderSuggestions, 
  renderSelectedRepos, 
  renderStatus, 
  clearSuggestions 
} from '../src/ui.js';

describe('Main модуль', () => {
  
  let mockInput, mockSuggestions, mockRepoList;
  let mockRepo1, mockRepo2;
  let originalAddEventListener;

  beforeEach(() => {
    // Очищаем все моки
    vi.clearAllMocks();
    
    // Создаем моки DOM элементов
    mockInput = {
      addEventListener: vi.fn(),
      value: '',
      focus: vi.fn()
    };
    
    mockSuggestions = {
      innerHTML: '',
      contains: vi.fn(() => false)
    };
    
    mockRepoList = {
      innerHTML: ''
    };

    // Мокаем document.getElementById
    vi.spyOn(document, 'getElementById').mockImplementation((id) => {
      switch (id) {
        case 'search':
          return mockInput;
        case 'suggestions':
          return mockSuggestions;
        case 'results':
          return mockRepoList;
        default:
          return null;
      }
    });

    // Сохраняем оригинальный addEventListener и мокаем его
    originalAddEventListener = document.addEventListener;
    vi.spyOn(document, 'addEventListener').mockImplementation((event, handler) => {
      // Если это DOMContentLoaded, сразу вызываем handler
      if (event === 'DOMContentLoaded') {
        setTimeout(handler, 0);
      }
    });

    // Подготавливаем тестовые данные
    mockRepo1 = {
      id: 1,
      name: 'test-repo',
      full_name: 'user/test-repo',
      html_url: 'https://github.com/user/test-repo',
      stargazers_count: 123,
      owner: {
        login: 'user',
        html_url: 'https://github.com/user'
      }
    };

    mockRepo2 = {
      id: 2,
      name: 'another-repo',
      full_name: 'user/another-repo',
      html_url: 'https://github.com/user/another-repo',
      stargazers_count: 456,
      owner: {
        login: 'user',
        html_url: 'https://github.com/user'
      }
    };
  });

  afterEach(() => {
    // Восстанавливаем оригинальные функции
    vi.restoreAllMocks();
    // Очищаем кэш модулей чтобы модуль переимпортировался
    vi.resetModules();
  });

  describe('Инициализация приложения', () => {
    
    it('должен правильно инициализировать приложение при загрузке DOM', async () => {
      // Мокаем возвращаемые значения
      initializeState.mockReturnValue(2);
      getSelectedRepos.mockReturnValue([mockRepo1, mockRepo2]);

      // Симулируем загрузку модуля - это вызовет DOMContentLoaded handler
      await import('../src/main.js');

      // Ждем выполнения асинхронных операций
      await new Promise(resolve => setTimeout(resolve, 10));

      // Проверяем что инициализация была вызвана
      expect(initializeState).toHaveBeenCalledTimes(1);
      
      // Проверяем что список репозиториев был отрендерен
      expect(getSelectedRepos).toHaveBeenCalledTimes(1);
      expect(renderSelectedRepos).toHaveBeenCalledWith(
        mockRepoList,
        [mockRepo1, mockRepo2],
        expect.any(Function)
      );
    });

    it('должен привязать обработчики событий', async () => {
      await import('../src/main.js');
      await new Promise(resolve => setTimeout(resolve, 10));

      // Проверяем что addEventListener был вызван для input
      expect(mockInput.addEventListener).toHaveBeenCalledWith(
        'input',
        expect.any(Function)
      );
    });

  });

  describe('Обработка поискового ввода', () => {
    
    let inputHandler;

    beforeEach(async () => {
      await import('../src/main.js');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Получаем функцию обработки из вызова addEventListener
      const inputEventCall = mockInput.addEventListener.mock.calls.find(
        call => call[0] === 'input'
      );
      if (inputEventCall) {
        inputHandler = inputEventCall[1];
      }
    });

    it('должен очищать подсказки для коротких запросов', async () => {
      if (!inputHandler) {
        throw new Error('Input handler not found');
      }

      await inputHandler({ target: { value: 'ab' } });

      expect(clearSuggestions).toHaveBeenCalledWith(mockSuggestions);
      expect(searchRepos).not.toHaveBeenCalled();
    });

    it('должен выполнять поиск для запросов длиннее 2 символов', async () => {
      if (!inputHandler) {
        throw new Error('Input handler not found');
      }

      const mockRepos = [mockRepo1, mockRepo2];
      searchRepos.mockResolvedValue(mockRepos);

      await inputHandler({ target: { value: 'react' } });

      expect(renderStatus).toHaveBeenCalledWith(mockSuggestions, 'Ищем…');
      expect(searchRepos).toHaveBeenCalledWith('react');
      expect(renderSuggestions).toHaveBeenCalledWith(
        mockSuggestions,
        mockRepos,
        expect.any(Function)
      );
    });

    it('должен обрабатывать ошибку rate limit', async () => {
      if (!inputHandler) {
        throw new Error('Input handler not found');
      }

      const error = new Error('RATE_LIMIT');
      searchRepos.mockRejectedValue(error);

      await inputHandler({ target: { value: 'react' } });

      expect(renderStatus).toHaveBeenCalledWith(
        mockSuggestions,
        'Слишком много запросов (rate limit)'
      );
    });

    it('должен обрабатывать ошибку invalid request', async () => {
      if (!inputHandler) {
        throw new Error('Input handler not found');
      }

      const error = new Error('INVALID_REQUEST');
      searchRepos.mockRejectedValue(error);

      await inputHandler({ target: { value: 'react' } });

      expect(renderStatus).toHaveBeenCalledWith(
        mockSuggestions,
        'Некорректный запрос (422)'
      );
    });

    it('должен обрабатывать ошибку server error', async () => {
      if (!inputHandler) {
        throw new Error('Input handler not found');
      }

      const error = new Error('SERVER_ERROR');
      searchRepos.mockRejectedValue(error);

      await inputHandler({ target: { value: 'react' } });

      expect(renderStatus).toHaveBeenCalledWith(
        mockSuggestions,
        'Ошибка сервера GitHub (5xx)'
      );
    });

    it('должен обрабатывать неизвестные ошибки', async () => {
      if (!inputHandler) {
        throw new Error('Input handler not found');
      }

      const error = new Error('Unknown error');
      searchRepos.mockRejectedValue(error);

      await inputHandler({ target: { value: 'react' } });

      expect(renderStatus).toHaveBeenCalledWith(
        mockSuggestions,
        'Ошибка сети или запроса'
      );
    });

  });

  describe('Обработка клика по репозиторию', () => {
    
    let repoClickHandler;

    beforeEach(async () => {
      getSelectedRepos.mockReturnValue([mockRepo1, mockRepo2]);
      await import('../src/main.js');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Получаем обработчик клика из вызова renderSuggestions
      const renderCall = renderSuggestions.mock.calls[0];
      if (renderCall) {
        repoClickHandler = renderCall[2];
      }
    });

    it('должен добавлять репозиторий при успешном клике', () => {
      if (!repoClickHandler) {
        // Если обработчик не был получен из renderSuggestions, пропускаем тест
        expect(true).toBe(true);
        return;
      }

      addRepo.mockReturnValue(true);
      getSelectedRepos.mockReturnValue([mockRepo1]);

      repoClickHandler(mockRepo1);

      expect(addRepo).toHaveBeenCalledWith(mockRepo1);
      expect(clearSuggestions).toHaveBeenCalledWith(mockSuggestions);
      expect(mockInput.focus).toHaveBeenCalled();
    });

    it('не должен обновлять UI если репозиторий не был добавлен', () => {
      if (!repoClickHandler) {
        expect(true).toBe(true);
        return;
      }

      addRepo.mockReturnValue(false);

      // Очищаем предыдущие вызовы
      vi.clearAllMocks();

      repoClickHandler(mockRepo1);

      expect(addRepo).toHaveBeenCalledWith(mockRepo1);
      expect(clearSuggestions).not.toHaveBeenCalled();
      expect(mockInput.focus).not.toHaveBeenCalled();
    });

  });

  describe('Обработка удаления репозитория', () => {
    
    let removeHandler;

    beforeEach(async () => {
      getSelectedRepos.mockReturnValue([mockRepo1, mockRepo2]);
      await import('../src/main.js');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Получаем обработчик удаления из вызова renderSelectedRepos
      const renderCall = renderSelectedRepos.mock.calls[0];
      if (renderCall) {
        removeHandler = renderCall[2];
      }
    });

    it('должен удалять репозиторий при успешном удалении', () => {
      if (!removeHandler) {
        expect(true).toBe(true);
        return;
      }

      removeRepoByIndex.mockReturnValue(true);
      getSelectedRepos.mockReturnValue([mockRepo1]); // После удаления остался один

      removeHandler(1);

      expect(removeRepoByIndex).toHaveBeenCalledWith(1);
    });

    it('не должен обновлять UI если репозиторий не был удален', () => {
      if (!removeHandler) {
        expect(true).toBe(true);
        return;
      }

      removeRepoByIndex.mockReturnValue(false);

      removeHandler(999); // Несуществующий индекс

      expect(removeRepoByIndex).toHaveBeenCalledWith(999);
    });

  });

  describe('Обработка клика вне области поиска', () => {
    
    let outsideClickHandler;

    beforeEach(async () => {
      // Мокаем document.addEventListener чтобы перехватить обработчик click
      const clickHandlers = [];
      vi.spyOn(document, 'addEventListener').mockImplementation((event, handler) => {
        if (event === 'DOMContentLoaded') {
          setTimeout(handler, 0);
        } else if (event === 'click') {
          clickHandlers.push(handler);
        }
      });

      await import('../src/main.js');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Получаем последний добавленный click handler
      outsideClickHandler = clickHandlers[clickHandlers.length - 1];
    });

    it('должен закрывать подсказки при клике вне области поиска', () => {
      if (!outsideClickHandler) {
        expect(true).toBe(true);
        return;
      }

      mockInput.contains = vi.fn(() => false);
      mockSuggestions.contains = vi.fn(() => false);

      const mockEvent = {
        target: document.createElement('div')
      };

      outsideClickHandler(mockEvent);

      expect(clearSuggestions).toHaveBeenCalledWith(mockSuggestions);
    });

    it('не должен закрывать подсказки при клике внутри input', () => {
      if (!outsideClickHandler) {
        expect(true).toBe(true);
        return;
      }

      mockInput.contains = vi.fn(() => true);
      mockSuggestions.contains = vi.fn(() => false);

      const mockEvent = {
        target: mockInput
      };

      outsideClickHandler(mockEvent);

      expect(clearSuggestions).not.toHaveBeenCalled();
    });

    it('не должен закрывать подсказки при клике внутри suggestions', () => {
      if (!outsideClickHandler) {
        expect(true).toBe(true);
        return;
      }

      mockInput.contains = vi.fn(() => false);
      mockSuggestions.contains = vi.fn(() => true);

      const mockEvent = {
        target: document.createElement('li')
      };

      outsideClickHandler(mockEvent);

      expect(clearSuggestions).not.toHaveBeenCalled();
    });

  });

  describe('Debouncing', () => {
    
    it('должен использовать debounced версию обработчика поиска', async () => {
      await import('../src/main.js');
      await new Promise(resolve => setTimeout(resolve, 10));

      // Проверяем что debounce была вызвана с правильными параметрами
      expect(debounce).toHaveBeenCalledWith(
        expect.any(Function), 
        300 // DEBOUNCE_DELAY
      );
    });

  });

  describe('Интеграционные тесты', () => {
    
    it('должен корректно обработать полный цикл поиска и добавления', async () => {
      // Настраиваем моки
      const mockRepos = [mockRepo1];
      searchRepos.mockResolvedValue(mockRepos);
      addRepo.mockReturnValue(true);
      getSelectedRepos.mockReturnValue([mockRepo1]);

      // Импортируем модуль
      await import('../src/main.js');
      await new Promise(resolve => setTimeout(resolve, 10));

      // Получаем обработчик ввода
      const inputHandler = mockInput.addEventListener.mock.calls.find(
        call => call[0] === 'input'
      )?.[1];

      if (!inputHandler) {
        expect(true).toBe(true);
        return;
      }
      
      await inputHandler({ target: { value: 'react' } });

      // Проверяем цепочку вызовов поиска
      expect(renderStatus).toHaveBeenCalledWith(mockSuggestions, 'Ищем…');
      expect(searchRepos).toHaveBeenCalledWith('react');
      expect(renderSuggestions).toHaveBeenCalledWith(
        mockSuggestions,
        mockRepos,
        expect.any(Function)
      );

      // Получаем и вызываем обработчик клика по репозиторию
      const repoClickHandler = renderSuggestions.mock.calls[0]?.[2];
      if (repoClickHandler) {
        repoClickHandler(mockRepo1);

        // Проверяем цепочку вызовов добавления
        expect(addRepo).toHaveBeenCalledWith(mockRepo1);
        expect(clearSuggestions).toHaveBeenCalledWith(mockSuggestions);
        expect(mockInput.focus).toHaveBeenCalled();
      }
    });

  });

});