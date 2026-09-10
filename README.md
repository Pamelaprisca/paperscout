# PaperScout

PaperScout 是一个面向论文写作的 AI 文献检索与证据助手。当前版本已经具备：

- React + Vite 前端
- Tailwind CSS 页面骨架
- Express 后端 API
- SQLite 论文、片段和证据存储
- Semantic Scholar 与 OpenAlex 检索
- Redis 可选缓存与内存回退
- 流式 Agent 对话
- `searchPapers`、`comparePapers`、`searchChunks`、`saveEvidence` 工具
- 论文摘要级 RAG

## 本地启动

安装依赖：

```bash
npm install
```

启动前端：

```bash
npm run dev
```

启动后端：

```bash
npm run server:watch
```

前端默认运行在 `http://127.0.0.1:5173`，后端默认运行在 `http://127.0.0.1:3000`。

## 环境变量

创建 `.env` 文件后可以配置：

```text
PORT=3000
REDIS_URL=redis://127.0.0.1:6379
SEMANTIC_SCHOLAR_API_KEY=
AI_API_KEY=
AI_BASE_URL=https://api.deepseek.com/chat/completions
AI_MODEL=deepseek-chat
```

没有配置 Redis 时，系统自动使用内存缓存。没有配置 AI Key 时，Agent 使用本地模拟流完成交互演示。

## 常用命令

```bash
npm run dev
npm run server:watch
npm run server
npm run lint
npm run test
npm run build
npm run preview
```

## 前端路由

- `/`：研究工作台
- `/discover`：文献检索
- `/papers/:paperId`：论文详情
- `/collections/:collectionId`：文献集合
- `/agent`：Agent 对话

## 后端接口

- `GET /api/health`
- `POST /api/search`
- `GET /api/papers/:paperId`
- `POST /api/rag/search`
- `POST /api/agent/chat`
- `POST /api/agent/actions/:actionId/confirm`

## 数据流

```text
React UI
  -> Express API
  -> Semantic Scholar / OpenAlex
  -> SQLite metadata + chunks
  -> RAG retrieval
  -> streaming Agent response
```

## 项目边界

当前阶段不做浏览器插件、PDF 深度解析、多人协作和付费墙绕过。全文证据先通过摘要级 RAG 完成，后续再扩展开放获取 PDF。
