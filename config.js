// ===== GitHub Issues 留言配置 =====
// 上传到 GitHub 后，修改以下信息即可启用远程留言功能

const GITHUB_CONFIG = {
  // 你的 GitHub 用户名
  owner: 'Hiswit',

  // 存放留言的仓库名（可以是博客仓库本身，也可以是另一个仓库）
  repo: 'blog-comment',

  // GitHub Personal Access Token
  // 获取方式：GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
  // 权限勾选：repo（完整控制仓库）或 public_repo（仅限公开仓库）
  token: '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',

  // 留言 Issue 的标签（可选，方便筛选）
  label: 'comment'
};

// 是否启用 GitHub Issues 留言（配置完成后设为 true）
const USE_GITHUB_ISSUES = true;
