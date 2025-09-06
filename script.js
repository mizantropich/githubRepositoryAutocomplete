const input = document.getElementById("search");
const suggestionsEl = document.getElementById("suggestions");
const repoListEl = document.getElementById("results");

const selectedRepos = [];

async function fetchRepos(query) {
  if (!query) return [];
  try {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(
      query
    )}&per_page=5`;
    const res = await fetch(url, {
      headers: { Accept: "application/vnd.github.v3+json" },
    });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch (e) {
    console.error("GitHub API error:", e);
    return [];
  }
}

fetchRepos("react").then((repos) => {
  console.log("Test fetchRepos:", repos);
});

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
  const repos = await fetchRepos(text);
  renderSuggestions(repos);
}

const debouncedHandleInput = debounce(handleSearchInput, 800);

input.addEventListener("input", (e) => {
  debouncedHandleInput(e.target.value);
});

function renderSuggestions(repos) {
  suggestionsEl.innerHTML = "";
  if (!repos.length) return;

  repos.forEach((repo) => {
    const li = document.createElement("li");
    li.textContent = repo.full_name;
    li.tabIndex = 0;
    li.className = "autocomplete-item";

    li.addEventListener("click", () => {
      addRepo(repo);
      input.value = "";
      suggestionsEl.innerHTML = "";
      input.focus();
    });

    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter") li.click();
    });

    suggestionsEl.appendChild(li);
  });
}

function addRepo(repo) {
  const exists = selectedRepos.some((r) => r.id === repo.id);
  if (exists) return;
  selectedRepos.push({
    id: repo.id,
    name: repo.name,
    html_url: repo.html_url,
    stargazers_count: repo.stargazers_count,
    ownerName: repo.owner.login,
  });
  renderSelectedRepos();
}

function renderSelectedRepos() {
  repoListEl.innerHTML = "";
  selectedRepos.forEach((r, idx) => {
    const li = document.createElement("li");
    li.className = "results-item";

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

    removeBtn.addEventListener("click", () => {
      selectedRepos.splice(idx, 1);
      renderSelectedRepos();
    });

    li.appendChild(infoDiv);
    li.appendChild(removeBtn);
    repoListEl.appendChild(li);
  });
}
