import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSelected, saveSelected } from '../src/storage.js';

// Мокаем константы
vi.mock('../src/constants.js', () => ({
  STORAGE_KEY: 'test-selectedRepos'
}));

describe('Storage модуль', () => {
  
  beforeEach(() => {
    // Очищаем localStorage перед каждым тестом
    localStorage.clear();
    // Очищаем все моки консоли
    vi.clearAllMocks();
  });

  describe('loadSelected()', () => {
    
    it('должен возвращать пустой массив если в localStorage ничего нет', () => {
      const result = loadSelected();
      expect(result).toEqual([]);
    });

    it('должен возвращать пустой массив если в localStorage null', () => {
      localStorage.setItem('test-selectedRepos', null);
      const result = loadSelected();
      expect(result).toEqual([]);
    });

    it('должен корректно загружать валидный массив из localStorage', () => {
      const testData = [
        { id: 1, name: 'test-repo', full_name: 'user/test-repo' },
        { id: 2, name: 'another-repo', full_name: 'user/another-repo' }
      ];
      
      localStorage.setItem('test-selectedRepos', JSON.stringify(testData));
      
      const result = loadSelected();
      expect(result).toEqual(testData);
    });

    it('должен возвращать пустой массив для невалидного JSON', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      localStorage.setItem('test-selectedRepos', 'invalid-json{');
      
      const result = loadSelected();
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Ошибка загрузки из localStorage:', 
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('должен возвращать пустой массив если данные не являются массивом', () => {
      localStorage.setItem('test-selectedRepos', JSON.stringify({ not: 'array' }));
      
      const result = loadSelected();
      expect(result).toEqual([]);
    });

    it('должен возвращать пустой массив если данные - строка', () => {
      localStorage.setItem('test-selectedRepos', JSON.stringify('string'));
      
      const result = loadSelected();
      expect(result).toEqual([]);
    });

    it('должен возвращать пустой массив если данные - число', () => {
      localStorage.setItem('test-selectedRepos', JSON.stringify(123));
      
      const result = loadSelected();
      expect(result).toEqual([]);
    });

    it('должен обрабатывать ошибки доступа к localStorage', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Мокаем localStorage.getItem чтобы выбросить ошибку
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage недоступен');
      });
      
      const result = loadSelected();
      
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Ошибка загрузки из localStorage:', 
        expect.any(Error)
      );
      
      getItemSpy.mockRestore();
      consoleSpy.mockRestore();
    });

  });

  describe('saveSelected()', () => {
    
    it('должен корректно сохранять валидный массив в localStorage', () => {
      const testData = [
        { id: 1, name: 'test-repo', full_name: 'user/test-repo' },
        { id: 2, name: 'another-repo', full_name: 'user/another-repo' }
      ];
      
      saveSelected(testData);
      
      const saved = localStorage.getItem('test-selectedRepos');
      expect(JSON.parse(saved)).toEqual(testData);
    });

    it('должен сохранять пустой массив', () => {
      saveSelected([]);
      
      const saved = localStorage.getItem('test-selectedRepos');
      expect(JSON.parse(saved)).toEqual([]);
    });

    it('должен логировать предупреждение если передан не массив - строка', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      saveSelected('not-array');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'saveSelected: ожидался массив, получено:', 
        'string'
      );
      
      consoleSpy.mockRestore();
    });

    it('должен логировать предупреждение если передан не массив - объект', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      saveSelected({ not: 'array' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'saveSelected: ожидался массив, получено:', 
        'object'
      );
      
      consoleSpy.mockRestore();
    });

    it('должен логировать предупреждение если передан не массив - null', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      saveSelected(null);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'saveSelected: ожидался массив, получено:', 
        'object'
      );
      
      consoleSpy.mockRestore();
    });

    it('должен логировать предупреждение если передан не массив - undefined', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      saveSelected(undefined);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'saveSelected: ожидался массив, получено:', 
        'undefined'
      );
      
      consoleSpy.mockRestore();
    });

    it('должен обрабатывать ошибки при сохранении в localStorage', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Мокаем localStorage.setItem чтобы выбросить ошибку
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage переполнен');
      });
      
      saveSelected([{ id: 1, name: 'test' }]);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Ошибка сохранения в localStorage:', 
        expect.any(Error)
      );
      
      setItemSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('не должен изменять localStorage если передан не массив', () => {
      // Сначала сохраняем валидные данные
      const validData = [{ id: 1, name: 'test' }];
      saveSelected(validData);
      
      // Затем пытаемся сохранить невалидные данные
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      saveSelected('invalid-data');
      
      // Проверяем что данные в localStorage не изменились
      const saved = localStorage.getItem('test-selectedRepos');
      expect(JSON.parse(saved)).toEqual(validData);
      
      consoleSpy.mockRestore();
    });

  });

  describe('Интеграционные тесты', () => {
    
    it('должен сохранять и затем загружать те же данные', () => {
      const testData = [
        { 
          id: 1, 
          name: 'test-repo', 
          full_name: 'user/test-repo',
          stargazers_count: 123
        },
        { 
          id: 2, 
          name: 'another-repo', 
          full_name: 'user/another-repo',
          stargazers_count: 456
        }
      ];
      
      // Сохраняем данные
      saveSelected(testData);
      
      // Загружаем данные
      const loaded = loadSelected();
      
      // Проверяем что данные идентичны
      expect(loaded).toEqual(testData);
    });

    it('должен работать с циклом сохранения-загрузки', () => {
      const testData1 = [{ id: 1, name: 'repo1' }];
      const testData2 = [{ id: 2, name: 'repo2' }, { id: 3, name: 'repo3' }];
      
      // Первый цикл
      saveSelected(testData1);
      expect(loadSelected()).toEqual(testData1);
      
      // Второй цикл
      saveSelected(testData2);
      expect(loadSelected()).toEqual(testData2);
      
      // Третий цикл - пустой массив
      saveSelected([]);
      expect(loadSelected()).toEqual([]);
    });

  });

});