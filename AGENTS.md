# 项目验证

- 生产构建：`npm run build`。
- 应用类型检查：`npx tsc --project tsconfig.app.json --noEmit`；Vite 构建本身不执行类型检查。
- 单页 lint：`npx eslint src/pages/dashboard/SearchManagement.tsx`，其他页面替换对应路径。
- 浏览器测试拦截接口时只匹配 `/api/*` 请求，不要匹配 Vite 的 `/src/api/*` 模块；成功响应需包含 `code: 200`。
- 检索页布局验证覆盖桌面及移动端、长 Markdown 与代码块、对话区滚动和输入框可见性。
