import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './debounce.js';

describe('debounce', () => {
  beforeEach(() => {
    // Включаем fake timers для контроля времени в тестах
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Восстанавливаем реальные таймеры после каждого теста
    vi.useRealTimers();
  });

  it('откладывает выполнение функции на заданное время', () => {
    // Arrange
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    // Act
    debouncedFn('test');

    // Assert - функция еще не вызвана
    expect(mockFn).not.toHaveBeenCalled();

    // Act - "проматываем" время на 50ms
    vi.advanceTimersByTime(50);

    // Assert - всё ещё не вызвана
    expect(mockFn).not.toHaveBeenCalled();

    // Act - проматываем ещё 50ms (итого 100ms)
    vi.advanceTimersByTime(50);

    // Assert - теперь функция должна быть вызвана
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('отменяет предыдущий вызов при повторном вызове', () => {
    // Arrange
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    // Act - первый вызов
    debouncedFn('first');
    
    // Act - проматываем 50ms
    vi.advanceTimersByTime(50);
    
    // Act - второй вызов (должен отменить первый)
    debouncedFn('second');
    
    // Act - ждём полные 100ms от второго вызова
    vi.advanceTimersByTime(100);

    // Assert - функция вызвана только один раз с последним аргументом
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('second');
  });

  it('вызывается только один раз при множественных быстрых вызовах', () => {
    // Arrange
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    // Act - делаем много быстрых вызовов
    debouncedFn('call1');
    debouncedFn('call2');
    debouncedFn('call3');
    debouncedFn('call4');
    debouncedFn('call5');

    // Assert - функция ещё не вызвана
    expect(mockFn).not.toHaveBeenCalled();

    // Act - проматываем время
    vi.advanceTimersByTime(100);

    // Assert - функция вызвана только один раз с последним аргументом
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('call5');
  });

  it('правильно передаёт несколько аргументов', () => {
    // Arrange
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 50);

    // Act
    debouncedFn('arg1', 'arg2', 123, { key: 'value' });
    vi.advanceTimersByTime(50);

    // Assert
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 123, { key: 'value' });
  });

  it('работает с delay равным 0', () => {
    // Arrange
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 0);

    // Act
    debouncedFn('instant');
    
    // Assert - функция ещё не вызвана (setTimeout с 0 всё равно асинхронный)
    expect(mockFn).not.toHaveBeenCalled();
    
    // Act - проматываем на 0ms (выполняет все pending таймеры)
    vi.runAllTimers();

    // Assert
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('instant');
  });

  it('каждый debounced экземпляр работает независимо', () => {
    // Arrange
    const mockFn1 = vi.fn();
    const mockFn2 = vi.fn();
    const debouncedFn1 = debounce(mockFn1, 100);
    const debouncedFn2 = debounce(mockFn2, 200);

    // Act
    debouncedFn1('first');
    debouncedFn2('second');

    // Act - проматываем 100ms
    vi.advanceTimersByTime(100);

    // Assert - только первая функция вызвана
    expect(mockFn1).toHaveBeenCalledTimes(1);
    expect(mockFn1).toHaveBeenCalledWith('first');
    expect(mockFn2).not.toHaveBeenCalled();

    // Act - проматываем ещё 100ms (итого 200ms)
    vi.advanceTimersByTime(100);

    // Assert - теперь вызвана и вторая
    expect(mockFn2).toHaveBeenCalledTimes(1);
    expect(mockFn2).toHaveBeenCalledWith('second');
  });
});
