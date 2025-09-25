/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  renderSuggestions,
  renderSelectedRepos,
  renderStatus,
  clearSuggestions
} from './ui.js';
import * as state from './state.js';

describe('UI module', () => {
  let container;

  beforeEach(() => {
    // Создаём контейнер для подсказок
    container = document.createElement('ul');
    container.id = 'suggestions';
    document.body.appendChild(container);
  });

  it('clearSuggestions очищает контейнер', () => {
    container.innerHTML = '<li>Test</li>';
    clearSuggestions(container);
    expect(container.children.length).toBe(0);
  });

  it('renderStatus отображает сообщение', () => {
    renderStatus(container, 'Loading...');
    const item = container.querySelector('li');
    expect(item).toBeTruthy();
    expect(item.textContent).toBe('Loading...');
    expect(item.classList.contains('autocomplete-status')).toBe(true);
    
    // Очищение
    renderStatus(container, '');
    expect(container.children.length).toBe(0);
  });

  it('renderSuggestions не рендерит при пустом массиве', () => {
    renderSuggestions(container, [], () => {});
    expect(container.children.length).toBe(0);
  });

  it('renderSuggestions создаёт элементы и обрабатывает клики', () => {
    const repos = [
      { full_name: 'u/r1' },
      { full_name: 'u/r2' }
    ];
    const onClick = vi.fn(); // ИСПРАВЛЕНО: использовать vi.fn()
    
    renderSuggestions(container, repos, onClick);
    
    const items = container.querySelectorAll('li');
    expect(items.length).toBe(2);
    
    items[0].click();
    expect(onClick).toHaveBeenCalledWith(repos[0]);
  });

  it('renderSuggestions помечает уже добавленные элементы', () => {
    const repos = [{ full_name: 'u/already' }];
    
    // Мокаем state.isRepoSelected
    vi.spyOn(state, 'isRepoSelected').mockReturnValue(true);
    
    renderSuggestions(container, repos, () => {});
    
    const item = container.querySelector('li');
    expect(item.classList.contains('autocomplete-item--added')).toBe(true);
    expect(item.title).toBe('Уже добавлено');
    expect(item.style.cursor).toBe('not-allowed');
  });

  it('renderSelectedRepos отображает выбранные репозитории', () => {
    const list = document.createElement('ul');
    const repos = [
      {
        name: 'repo1',
        html_url: 'https://github.com/u/r1',
        ownerName: 'u',
        ownerUrl: 'https://github.com/u',
        stargazers_count: 10
      }
    ];
    const onRemove = vi.fn();
    
    renderSelectedRepos(list, repos, onRemove);
    
    const item = list.querySelector('li');
    expect(item).toBeTruthy();
    
    const link = item.querySelector('a.results-item__link');
    expect(link.textContent).toBe('repo1');
    // ИСПРАВЛЕНО: убираем слэш в конце
    expect(link.href).toBe('https://github.com/u/r1');
    
    const ownerLink = item.querySelectorAll('a.results-item__link')[1];
    expect(ownerLink.textContent).toBe('u');
    
    const stars = item.querySelector('.results-item__stars');
    expect(stars.textContent.trim()).toBe('★ 10');
    
    // Проверяем удаление
    const btn = item.querySelector('button');
    btn.click();
    expect(onRemove).toHaveBeenCalledWith(0);
  });
});
