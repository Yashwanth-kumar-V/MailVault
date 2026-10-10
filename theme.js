// ═══════════════════════════════════════════════════════════════════════════════
// THEME SWITCHER (Light / Dark Mode)
// ─────────────────────────────────────────────────────────────────────────────
// Supports Bootstrap 5.3 data-bs-theme and custom data-theme CSS variables.
// Stored in localStorage so user's choice persists across all pages.
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  const savedTheme = localStorage.getItem('mv_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-bs-theme', savedTheme);
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-bs-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-bs-theme', next);
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('mv_theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const icons = document.querySelectorAll('.theme-toggle-icon');
  icons.forEach(el => {
    if (theme === 'dark') {
      el.className = 'bi bi-moon-stars-fill theme-toggle-icon text-warning';
    } else {
      el.className = 'bi bi-sun-fill theme-toggle-icon text-warning';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const current = document.documentElement.getAttribute('data-bs-theme') || 'light';
  updateThemeIcon(current);
});
