// Dark mode toggle, shared across pages.
(function () {
  const STORAGE_KEY = "theme";
  const buttons = [];

  // Storage can throw (disabled cookies/storage, some sandboxed/file: contexts).
  // Fall back to "no explicit preference" rather than letting the whole page
  // script die before window.BlogTheme is even defined.
  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return null;
    }
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (err) {
      // Preference just won't persist across reloads; theme still applies now.
    }
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
    const isDark = currentEffectiveTheme() === "dark";
    button.textContent = isDark ? "☀️" : "🌙";
    button.setAttribute("aria-label", isDark ? "라이트 모드로 전환" : "다크 모드로 전환");
  }

  // Fires on explicit toggle clicks AND on OS-level scheme changes (when the
  // visitor hasn't picked a theme yet) — other pages' scripts (e.g. the pixel
  // art canvas, which paints CSS variable colors itself) can listen for this
  // instead of trying to detect a data-theme attribute that may never change.
  function notifyThemeChange() {
    buttons.forEach(updateToggleLabel);
    document.dispatchEvent(new CustomEvent("blogthemechange"));
  }

  function initThemeToggle(buttonId) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    buttons.push(button);
    updateToggleLabel(button);
    button.addEventListener("click", () => {
      const next = currentEffectiveTheme() === "dark" ? "light" : "dark";
      setStoredTheme(next);
      applyTheme(next);
      notifyThemeChange();
    });
  }

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (getStoredTheme()) return; // visitor already made an explicit choice
    notifyThemeChange();
  });

  window.BlogTheme = { initThemeToggle };
})();
