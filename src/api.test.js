import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchRepos } from './api.js';
import { GITHUB_API_URL } from './constants.js';

global.fetch = vi.fn();

describe('searchRepos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('возвращает пустой массив при пустом term', async () => {
    const result = await searchRepos('');
    expect(result).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('вызывает fetch с правильным URL и возвращает items', async () => {
    // Arrange
    const mockItems = [{ id: 1, full_name: 'user/repo' }];
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: mockItems })
    });

    // Act
    const result = await searchRepos('test');

    // Assert
    const expectedUrl = `${GITHUB_API_URL}?q=test&per_page=5`;
    expect(fetch).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
    expect(result).toEqual(mockItems);
  });

  it('обрабатывает статус 403 как RATE_LIMIT', async () => {
    fetch.mockResolvedValueOnce({ status: 403, ok: false });
    await expect(searchRepos('x')).rejects.toThrow('RATE_LIMIT');
  });

  it('обрабатывает статус 422 как INVALID_REQUEST', async () => {
    fetch.mockResolvedValueOnce({ status: 422, ok: false });
    await expect(searchRepos('x')).rejects.toThrow('INVALID_REQUEST');
  });

  it('обрабатывает статус >=500 как SERVER_ERROR', async () => {
    fetch.mockResolvedValueOnce({ status: 500, ok: false });
    await expect(searchRepos('x')).rejects.toThrow('SERVER_ERROR');
  });

  it('возвращает пустой массив при отмене запроса', async () => {
    // Arrange: сделать fetch выбрасывающим AbortError
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    fetch.mockRejectedValueOnce(abortError);

    // Act & Assert
    const result = await searchRepos('test');
    expect(result).toEqual([]);
  });

  it('игнорирует устаревшие ответы при быстром повторном вызове', async () => {
    // Arrange: первая задержанная промис
    let resolveFirst;
    const firstPromise = new Promise(res => { resolveFirst = res; });
    fetch.mockReturnValueOnce(firstPromise);
    // Вызов первого запроса (не дожидаемся)
    const p1 = searchRepos('one');

    // Вторая итерация с мгновенным ответом
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [{ id: 2, full_name: 'u/r2' }] })
    });
    const p2 = searchRepos('two');

    // Завершение первого запроса
    resolveFirst({
      ok: true,
      status: 200,
      json: async () => ({ items: [{ id: 1, full_name: 'u/r1' }] })
    });

    const r1 = await p1;
    const r2 = await p2;

    expect(r1).toEqual([]);       // первый ответ должен быть проигнорирован
    expect(r2).toEqual([{ id: 2, full_name: 'u/r2' }]);
  });
});
