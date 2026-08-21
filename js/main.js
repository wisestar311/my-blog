(async function () {
  const listEl = document.getElementById("post-list");

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  }

  function renderTags(tags) {
    if (!tags || !tags.length) return "";
    const items = tags.map((tag) => `<li class="tag">${BlogMarkdown.escapeHtml(tag)}</li>`).join("");
    return `<ul class="tag-list">${items}</ul>`;
  }

  function renderPosts(posts) {
    listEl.innerHTML = posts
      .map((post) => {
        const { meta, filename } = post;
        const title = meta.title || filename;
        return `
          <li class="post-item">
            <h2 class="post-item-title"><a href="post.html?post=${encodeURIComponent(filename)}">${BlogMarkdown.escapeHtml(title)}</a></h2>
            <div class="post-item-meta">${formatDate(meta.date)}</div>
            ${meta.excerpt ? `<p class="post-item-excerpt">${BlogMarkdown.escapeHtml(meta.excerpt)}</p>` : ""}
            ${renderTags(meta.tags)}
          </li>
        `;
      })
      .join("");
  }

  try {
    const manifestRes = await fetch("posts/posts.json");
    if (!manifestRes.ok) throw new Error("posts.json을 불러올 수 없습니다.");
    const filenames = await manifestRes.json();

    const posts = await Promise.all(
      filenames.map(async (filename) => {
        const res = await fetch(`posts/${filename}`);
        const raw = await res.text();
        const { meta } = BlogMarkdown.parseFrontmatter(raw);
        return { filename, meta };
      })
    );

    posts.sort((a, b) => new Date(b.meta.date) - new Date(a.meta.date));

    if (!posts.length) {
      listEl.innerHTML = '<li class="state-message">아직 글이 없습니다.</li>';
      return;
    }

    renderPosts(posts);
  } catch (err) {
    listEl.innerHTML = `<li class="state-message">글 목록을 불러오는 중 문제가 발생했습니다: ${BlogMarkdown.escapeHtml(err.message)}</li>`;
  }
})();
