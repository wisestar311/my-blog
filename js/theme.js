// Dark mode toggle, shared across pages.
(function () {
  const STORAGE_KEY = "theme";

  function getStoredTheme() {
    return localStorage.getItem(STORAGE_KEY);
  }

  function applyTheme(theme) {
    if (theme) {
      document.documentElement.setAttribute("data-theme", theme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  function currentEffectiveTheme() {
    const stored = getStoredTheme();
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  applyTheme(getStoredTheme());

  function updateToggleLabel(button) {
    if (!button) return;
    button.textContent = currentEffectiveTheme() === "dark" ? "☀️" : "🌙";
  }

  function initThemeToggle(buttonId) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    updateToggleLabel(button);
    button.addEventListener("click", () => {
      const next = currentEffectiveTheme() === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
      updateToggleLabel(button);
    });
  }

  window.BlogTheme = { initThemeToggle };
})();
