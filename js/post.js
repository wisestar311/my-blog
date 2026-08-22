(async function () {
  const contentEl = document.getElementById("post-container");

  function formatDate(dateStr) {
    if (!dateStr) return "";
    // Parse YYYY-MM-DD as a local date, not UTC midnight — new Date(dateStr)
    // shifts to the previous day for readers west of UTC.
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    const d = isoMatch
      ? new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
      : new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  }

  function renderTags(tags) {
    if (!tags || !tags.length) return "";
    const items = tags.map((tag) => `<li class="tag">${BlogMarkdown.escapeHtml(tag)}</li>`).join("");
    return `<ul class="tag-list">${items}</ul>`;
  }

  function showError(message) {
    contentEl.innerHTML = `<p class="state-message">${BlogMarkdown.escapeHtml(message)}</p>`;
  }

  const params = new URLSearchParams(window.location.search);
  const filename = params.get("post");

  if (!filename) {
    showError("포스트를 찾을 수 없습니다.");
    return;
  }

  try {
    const res = await fetch(`posts/${filename}`);
    if (!res.ok) throw new Error("포스트를 찾을 수 없습니다.");
    const raw = await res.text();
    const { meta, body } = BlogMarkdown.parseFrontmatter(raw);
    const title = meta.title || filename;

    document.title = `${title} · My Blog`;
    contentEl.innerHTML = `
      <div class="post-header">
        <h1>${BlogMarkdown.escapeHtml(title)}</h1>
        <div class="post-item-meta">${BlogMarkdown.escapeHtml(formatDate(meta.date))}</div>
        ${renderTags(meta.tags)}
      </div>
      <div class="post-content">${BlogMarkdown.renderMarkdown(body)}</div>
    `;
  } catch (err) {
    showError(err.message || "포스트를 불러오는 중 문제가 발생했습니다.");
  }
})();
