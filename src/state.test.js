import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as storage from './storage.js';
import {
  initializeState,
  getSelectedRepos,
  isRepoSelected,
  addRepo,
  removeRepoByIndex,
  removeRepoByName,
  clearAllRepos,
  getSelectedCount,
} from './state.js';

describe('state module', () => {
  const mockRepos = [
    { id: 1, full_name: 'u/one', name: 'one', html_url: '', stargazers_count: 0, ownerName: 'u', ownerUrl: '' },
    { id: 2, full_name: 'u/two', name: 'two', html_url: '', stargazers_count: 0, ownerName: 'u', ownerUrl: '' },
  ];

  beforeEach(() => {
    // Сначала мокаем storage функции
    vi.spyOn(storage, 'loadSelected').mockReturnValue([]);
    vi.spyOn(storage, 'saveSelected').mockImplementation(() => {});
    
    // Затем очищаем состояние модуля
    clearAllRepos();
  });

  afterEach(() => {
    // Восстанавливаем все моки
    vi.restoreAllMocks();
  });

  it('initializeState загружает данные из storage и возвращает длину', () => {
    storage.loadSelected.mockReturnValueOnce(mockRepos);
    const length = initializeState();
    expect(length).toBe(2);
    expect(storage.loadSelected).toHaveBeenCalled();
  });

  it('getSelectedRepos возвращает копию массива', () => {
    storage.loadSelected.mockReturnValueOnce(mockRepos);
    initializeState();
    
    const repos1 = getSelectedRepos();
    const repos2 = getSelectedRepos();
    
    expect(repos1).toEqual(mockRepos);
    expect(repos1).not.toBe(repos2); // Каждый вызов возвращает новую копию
    
    // Модификация копии не влияет на внутренний массив
    repos1.push({ id: 3 });
    expect(getSelectedCount()).toBe(2);
  });

  it('isRepoSelected корректно проверяет наличие', () => {
    storage.loadSelected.mockReturnValueOnce([mockRepos[0]]);
    initializeState();
    
    expect(isRepoSelected(mockRepos[0])).toBe(true);
    expect(isRepoSelected(mockRepos[1])).toBe(false);
  });

  it('addRepo добавляет новый и сохраняет, возвращая true', () => {
    const sample = { 
      id: 3, 
      full_name: 'u/three', 
      name: 'three', 
      html_url: 'https://github.com/u/three', 
      stargazers_count: 0, 
      owner: { login: 'u', html_url: 'https://github.com/u' } 
    };
    
    const result = addRepo(sample);
    
    expect(result).toBe(true);
    expect(storage.saveSelected).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ 
          id: 3, 
          full_name: 'u/three', 
          ownerName: 'u', 
          ownerUrl: 'https://github.com/u' 
        })
      ])
    );
    expect(getSelectedCount()).toBe(1);
  });

  it('addRepo не добавляет дубликаты и возвращает false', () => {
    const sample = { 
      ...mockRepos[0], 
      owner: { login: 'u', html_url: 'https://github.com/u' } 
    };
    
    // Сначала добавляем репозиторий
    addRepo(sample);
    vi.clearAllMocks(); // Очищаем вызовы после первого добавления
    
    // Пытаемся добавить тот же репозиторий
    const result = addRepo(sample);
    
    expect(result).toBe(false);
    expect(storage.saveSelected).not.toHaveBeenCalled();
    expect(getSelectedCount()).toBe(1);
  });

  it('removeRepoByIndex удаляет по индексу и возвращает true', () => {
    // Добавляем репозитории
    storage.loadSelected.mockReturnValueOnce(mockRepos);
    initializeState();
    
    const result = removeRepoByIndex(0);
    
    expect(result).toBe(true);
    expect(getSelectedCount()).toBe(1);
    expect(storage.saveSelected).toHaveBeenCalled();
  });

  it('removeRepoByIndex при некорректном индексе возвращает false', () => {
    // ИСПРАВЛЕНО: правильно инициализируем состояние
    storage.loadSelected.mockReturnValueOnce(mockRepos);
    initializeState();
    
    const initialCount = getSelectedCount(); // Сохраняем изначальное количество
    
    expect(removeRepoByIndex(-1)).toBe(false);
    expect(removeRepoByIndex(2)).toBe(false);
    expect(getSelectedCount()).toBe(initialCount); // Количество не изменилось
  });

  it('clearAllRepos очищает массив и сохраняет', () => {
    storage.loadSelected.mockReturnValueOnce(mockRepos);
    initializeState();
    
    const result = clearAllRepos();
    
    expect(result).toBe(true);
    expect(getSelectedCount()).toBe(0);
    expect(storage.saveSelected).toHaveBeenCalledWith([]);
  });
});
