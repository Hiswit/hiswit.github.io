// ===== 隙光博客 - 核心脚本 =====

// ---- 打字机效果 ----
function typewriterEffect() {
  const el = document.getElementById('typewriter');
  if (!el) return;

  const fullText = el.dataset.text || '捕捉思维的隙光';
  const accentStart = 4;
  const cursorEl = el.querySelector('.cursor');
  let current = 0;

  const beforeAccentEl = document.createElement('span');
  const accentEl = document.createElement('span');
  accentEl.className = 'accent';

  el.insertBefore(beforeAccentEl, cursorEl);
  el.insertBefore(accentEl, cursorEl);

  const interval = setInterval(() => {
    if (current <= fullText.length) {
      const before = fullText.slice(0, Math.min(current, accentStart));
      const accent = fullText.slice(accentStart, current);
      beforeAccentEl.textContent = before;
      accentEl.textContent = accent;
      current++;
    } else {
      clearInterval(interval);
      const subtitle = document.querySelector('.hero p');
      if (subtitle) subtitle.classList.add('visible');
    }
  }, 120);
}

// ---- 目录排序 ----
function initFeed() {
  const feedContainer = document.getElementById('feed-list');
  const btnDate = document.getElementById('sort-date');
  const btnPinned = document.getElementById('sort-pinned');
  if (!feedContainer) return;

  // ============================================
  // 在此数组中添加新文章
  // ============================================
  const posts = [
    {
      id: 'minimalist-workspace',
      title: '极简工作台的构成法则',
      category: 'ESSAY',
      date: '2025-10-24',
      pinned: true
    },
    {
      id: 'late-night-coffee',
      title: '凌晨两点的咖啡与代码',
      category: 'TECH',
      date: '2025-10-18',
      pinned: false
    }
  ];
  // ============================================

  let currentSort = 'date';

  function sortPosts(mode) {
    currentSort = mode;
    const sorted = [...posts];

    if (mode === 'pinned') {
      sorted.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.date) - new Date(a.date);
      });
    } else {
      sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    renderFeed(sorted);

    if (btnDate) btnDate.classList.toggle('active', mode === 'date');
    if (btnPinned) btnPinned.classList.toggle('active', mode === 'pinned');
  }

  function renderFeed(items) {
    feedContainer.innerHTML = items.map(post => `
      <a href="post/${post.id}.html" class="feed-row">
        <span class="feed-cat ${post.pinned ? 'pinned' : ''}">[${post.category}]${post.pinned ? ' *' : ''}</span>
        <span class="feed-row-title">${post.title}</span>
        <span class="feed-date">${post.date.replace(/-/g, '.')}</span>
      </a>
    `).join('');
  }

  if (btnDate) btnDate.addEventListener('click', () => sortPosts('date'));
  if (btnPinned) btnPinned.addEventListener('click', () => sortPosts('pinned'));

  sortPosts('date');
}

// ---- 视差滚动 ----
function initParallax() {
  const img = document.querySelector('.parallax-img');
  const container = document.querySelector('.parallax-header');
  if (!img || !container) return;

  window.addEventListener('scroll', () => {
    const rect = container.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) {
      const rate = window.scrollY * 0.2;
      img.style.transform = `translateY(${rate}px)`;
    }
  }, { passive: true });
}

// ---- 留言板：GitHub Issues + localStorage 双轨 ----
function initCommentBoard() {
  const form = document.getElementById('comment-form');
  const successEl = document.getElementById('comment-success');
  if (!form) return;

  const postId = form.dataset.postid;
  const postTitle = form.dataset.posttitle || postId;
  if (!postId) return;

  // 检查 GitHub 配置是否就绪
  const githubReady = typeof USE_GITHUB_ISSUES !== 'undefined'
    && USE_GITHUB_ISSUES === true
    && typeof GITHUB_CONFIG !== 'undefined'
    && GITHUB_CONFIG.owner
    && GITHUB_CONFIG.repo
    && GITHUB_CONFIG.token;

  // 本地存储备用
  function saveLocal(comment) {
    let comments = [];
    try {
      const data = localStorage.getItem(`comments-${postId}`);
      if (data) comments = JSON.parse(data);
    } catch { /* ignore */ }

    comments.push({
      id: Date.now().toString(36),
      name: comment.name,
      email: comment.email,
      content: comment.content,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(`comments-${postId}`, JSON.stringify(comments));
  }

  // 通过 GitHub API 创建 Issue
  async function createGitHubIssue(comment) {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/issues`;
    const body = `**来自文章：** ${postTitle}\n**留言者：** ${comment.name}${comment.email ? ' <' + comment.email + '>' : ''}\n\n---\n\n${comment.content}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: `[留言] ${postTitle} - ${comment.name}`,
        body: body,
        labels: GITHUB_CONFIG.label ? [GITHUB_CONFIG.label] : []
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.querySelector('[name="name"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const content = form.querySelector('[name="content"]').value.trim();

    if (!name || !content) return;

    const comment = { name, email, content };

    // 按钮置为提交中状态
    const btn = form.querySelector('.comment-btn');
    const originalText = btn.textContent;
    btn.textContent = '发送中...';
    btn.disabled = true;

    let savedToGithub = false;

    // 尝试 GitHub Issues
    if (githubReady) {
      try {
        await createGitHubIssue(comment);
        savedToGithub = true;
      } catch (err) {
        console.warn('GitHub Issues 提交失败，已降级到本地存储：', err.message);
      }
    }

    // 无论 GitHub 成功与否，都存一份本地备份
    saveLocal(comment);

    // 清空表单
    form.querySelector('[name="name"]').value = '';
    form.querySelector('[name="email"]').value = '';
    form.querySelector('[name="content"]').value = '';

    // 恢复按钮
    btn.textContent = originalText;
    btn.disabled = false;

    // 显示成功提示
    if (successEl) {
      if (savedToGithub) {
        successEl.textContent = '已提交到 GitHub Issues ✓';
      } else if (githubReady) {
        successEl.textContent = 'GitHub 提交失败，已保存到本地。';
      } else {
        successEl.textContent = '已保存到本地（GitHub 未配置）。';
      }
      setTimeout(() => { successEl.textContent = ''; }, 4000);
    }
  });
}

// ---- 初始化 ----
document.addEventListener('DOMContentLoaded', () => {
  typewriterEffect();
  initFeed();
  initParallax();
  initCommentBoard();
});
