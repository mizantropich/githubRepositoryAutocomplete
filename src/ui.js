import { isRepoSelected } from './state.js';

// Рендерит список предложений автодополнения
export function renderSuggestions(suggestionsEl, repos, onRepoClick) {
  // Очищаем контейнер
  suggestionsEl.innerHTML = "";
  
  // Если репозиториев нет, не рендерим ничего
  if (!repos.length) {
    return;
  }

  // Создаём элементы для каждого репозитория
  repos.forEach((repo) => {
    // Создаём основной элемент списка
    const li = document.createElement("li");
    li.textContent = repo.full_name;
    li.tabIndex = 0;
    li.className = "autocomplete-item";

    // Проверяем, добавлен ли уже этот репозиторий
    const isAdded = isRepoSelected(repo);
    
    if (isAdded) {
      // Стилизуем уже добавленные элементы
      li.classList.add("autocomplete-item--added");
      li.title = "Уже добавлено";
      li.style.background = "#e0ffe0";
      li.style.cursor = "not-allowed";
    } else {
      // Навешиваем обработчики событий только на новые элементы
      li.addEventListener("click", () => {
        // Вызываем колбэк, передаём репозиторий
        onRepoClick(repo);
      });
      
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          li.click();
        }
      });
    }

    // Добавляем элемент в DOM
    suggestionsEl.appendChild(li);
  });
}

// Рендерит список выбранных репозиториев
export function renderSelectedRepos(repoListEl, repos, onRemoveClick) {
  // Очищаем контейнер
  repoListEl.innerHTML = "";

  // Создаём элементы для каждого выбранного репозитория
  repos.forEach((repo, index) => {
    // Основной контейнер элемента
    const li = document.createElement("li");
    li.className = "results-item";
    li.dataset.idx = index;

    // Контейнер с информацией о репозитории
    const infoDiv = document.createElement("div");
    infoDiv.className = "results-item__info";

    // Ссылка на репозиторий
    const link = document.createElement("a");
    link.href = repo.html_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = repo.name;
    link.className = "results-item__link";

    // Имя владельца
    const owner = document.createElement("span");
    owner.textContent = " by ";
    owner.className = "results-item__owner";

		const ownerLink = document.createElement("a");
		ownerLink.href = repo.ownerUrl;
		ownerLink.target = "_blank";
		ownerLink.rel = "noopener noreferrer";
    ownerLink.textContent = repo.ownerName;
    ownerLink.className = "results-item__link";

    // Количество звёзд
    const stars = document.createElement("span");
    stars.textContent = ` ★ ${repo.stargazers_count}`;
    stars.className = "results-item__stars";

    // Собираем информационный блок
    infoDiv.appendChild(link);
    infoDiv.appendChild(owner);
		owner.appendChild(ownerLink);
    infoDiv.appendChild(stars);

    // Кнопка удаления
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "✕";
    removeBtn.className = "results-item__remove";
    removeBtn.title = "Удалить";
    removeBtn.type = "button";
    removeBtn.dataset.idx = index;
    
    // Обработчик клика по кнопке удаления
    removeBtn.addEventListener("click", () => {
      // Вызываем колбэк, передаём индекс
      onRemoveClick(index);
    });

    // Собираем элемент целиком
    li.appendChild(infoDiv);
    li.appendChild(removeBtn);
    
    // Добавляем в DOM
    repoListEl.appendChild(li);
  });
}

// Рендерит статусное сообщение
export function renderStatus(suggestionsEl, message) {
  // Очищаем контейнер
  suggestionsEl.innerHTML = "";
  
  // Если сообщения нет, просто очищаем и выходим
  if (!message) {
    return;
  }

  // Создаём элемент с сообщением
  const li = document.createElement("li");
  li.textContent = message;
  li.className = "autocomplete-item autocomplete-status";
  li.style.cursor = "default";
  
  // Добавляем в DOM
  suggestionsEl.appendChild(li);
}

// Очищает контейнер автодополнения
export function clearSuggestions(suggestionsEl) {
  suggestionsEl.innerHTML = "";
}
