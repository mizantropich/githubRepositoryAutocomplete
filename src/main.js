const input = document.getElementById("search");
const suggestionsEl = document.getElementById("suggestions");
const repoListEl = document.getElementById("results");

const selectedRepos = [];

let currentAbortController = null;
let lastRequestId = 0;

async function fetchRepos(query, requestId) {
  if (!query) return [];
  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();
  try {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(
      query
    )}&per_page=5`;
    const res = await fetch(url, {
      headers: { Accept: "application/vnd.github.v3+json" },
      signal: currentAbortController.signal,
    });

    if (res.status === 403) {
      renderStatus("Слишком много запросов (rate limit)");
      return [];
    }
    if (res.status === 422) {
      renderStatus("Некорректный запрос (422)");
      return [];
    }
    if (res.status >= 500) {
      renderStatus("Ошибка сервера GitHub (5xx)");
      return [];
    }
    if (!res.ok) {
      renderStatus(`Ошибка: ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (requestId !== lastRequestId) return [];
    return Array.isArray(data.items) ? data.items : [];
  } catch (e) {
    if (e.name === "AbortError") return [];
    renderStatus("Ошибка сети или запроса");
    return [];
  }
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

async function handleSearchInput(text) {
  if (text.trim().length < 2) {
    renderSuggestions([]);
    return;
  }
  renderStatus("Ищем…");
  lastRequestId += 1;
  const requestId = lastRequestId;
  const repos = await fetchRepos(text, requestId);
  if (requestId === lastRequestId) {
    renderSuggestions(repos);
  }
}

const debouncedHandleInput = debounce(handleSearchInput, 800);

input.addEventListener("input", (e) => {
  debouncedHandleInput(e.target.value);
});

function renderSuggestions(repos) {
  suggestionsEl.innerHTML = "";
  if (!repos.length) {
    renderStatus("Ничего не найдено");
    return;
  }
  repos.forEach((repo) => {
    const li = document.createElement("li");
    li.textContent = repo.full_name;
    li.tabIndex = 0;
    li.className = "autocomplete-item";

    const isAdded = selectedRepos.some((r) => r.full_name === repo.full_name);
    if (isAdded) {
      li.classList.add("autocomplete-item--added");
      li.title = "Уже добавлено";
      li.style.background = "#e0ffe0";
      li.style.cursor = "not-allowed";
    } else {
      li.addEventListener("click", () => {
        addRepo(repo);
        input.value = "";
        suggestionsEl.innerHTML = "";
        input.focus();
      });
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter") li.click();
      });
    }
    suggestionsEl.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const saved = localStorage.getItem("selectedRepos");
  if (saved) {
    try {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr)) {
        selectedRepos.push(...arr);
        renderSelectedRepos();
      }
    } catch (e) {
      console.warn(e);
    }
  }
});

function saveSelectedRepos() {
  localStorage.setItem("selectedRepos", JSON.stringify(selectedRepos));
}

function addRepo(repo) {
  const exists = selectedRepos.some((r) => r.full_name === repo.full_name);
  if (exists) return;
  selectedRepos.push({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    html_url: repo.html_url,
    stargazers_count: repo.stargazers_count,
    ownerName: repo.owner.login,
  });
  saveSelectedRepos();
  renderSelectedRepos();
}

function renderSelectedRepos() {
  repoListEl.innerHTML = "";
  selectedRepos.forEach((r, idx) => {
    const li = document.createElement("li");
    li.className = "results-item";
    li.dataset.idx = idx;

    const infoDiv = document.createElement("div");
    infoDiv.className = "results-item__info";

    const link = document.createElement("a");
    link.href = r.html_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = r.name;
    link.className = "results-item__link";

    const owner = document.createElement("span");
    owner.textContent = ` by ${r.ownerName}`;
    owner.className = "results-item__owner";

    const stars = document.createElement("span");
    stars.textContent = ` ★ ${r.stargazers_count}`;
    stars.className = "results-item__stars";

    infoDiv.appendChild(link);
    infoDiv.appendChild(owner);
    infoDiv.appendChild(stars);

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "✕";
    removeBtn.className = "results-item__remove";
    removeBtn.title = "Удалить";
    removeBtn.type = "button";
    removeBtn.dataset.idx = idx;

    li.appendChild(infoDiv);
    li.appendChild(removeBtn);
    repoListEl.appendChild(li);
  });
}

repoListEl.addEventListener("click", function (e) {
  const btn = e.target.closest(".results-item__remove");
  if (btn) {
    const idx = parseInt(btn.dataset.idx, 10);
    if (!isNaN(idx)) {
      selectedRepos.splice(idx, 1);
      saveSelectedRepos();
      renderSelectedRepos();
    }
  }
});

function renderStatus(message) {
  suggestionsEl.innerHTML = "";
  if (message) {
    const li = document.createElement("li");
    li.textContent = message;
    li.className = "autocomplete-item autocomplete-status";
    li.style.cursor = "default";
    suggestionsEl.appendChild(li);
  }
}

document.addEventListener("click", (e) => {
  if (
    !input.contains(e.target) &&
    !suggestionsEl.contains(e.target)
  ) {
    suggestionsEl.innerHTML = "";
  }
});
