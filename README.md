# HOLLOW Search Browser（HOLLOW 搜索浏览器）

[HOLLOW](https://hollow.vonish.dev/docs) 自托管深度研究 API 的官方搜索界面——一个纯前端的"搜索引擎形态"浏览器。

线上地址：<https://hollow.vonish.dev/search>

## 项目边界

| | 本仓库（浏览器） | HOLLOW 主仓库（搜索 API） |
|---|---|---|
| 性质 | 纯静态前端（React SPA），无服务端代码 | 服务端（FastAPI + vendored SearXNG + 三档抓取） |
| 职责 | 主页 / 结果页 / 双路赛制阅读模式、会话缓存、hover 预取 | 召回（`/v1/search`）、抓取净化（`/v1/fetch`）、深研（`/v1/research`）等 |
| 依赖关系 | 仅通过 HTTPS 调用**公开** API，不含密钥、不含内部接口 | 不感知前端存在 |
| 部署 | 任意静态托管（当前 Caddy `handle_path /search*`） | 独立 systemd 服务 |

原则：浏览器只做"呈现与交互"，所有搜索/抓取/净化逻辑都在 API 侧。两边仅由公开 HTTP 契约耦合，可各自独立开发、发版、部署。

## 功能

- **主页**：标题 + 输入框 + 9 场景快捷 chip（`/search`）
- **结果页**（`/search?q=`）：引擎三分账（用/失败/零结果）、分页、infobox 即时答案、hover 预取阅读
- **阅读模式**（`/search?url=`）：**双路赛制**——本地 iframe 原网页（Cookie 互通、与服务器无关）× 云端净化正文，两路并行、先就绪先展示、净化失败自动切原框、tab 无缝切换
- **延迟优化**：会话缓存（10min TTL）、分级加载文案
- **URL 即状态**：`q` / `scene` / `page` / `url` 全在地址栏，可分享可后退

## 技术栈

React 19 · TypeScript · Vite 7 · Tailwind CSS 3.4 · react-router 7

## 开发

```bash
npm install
npm run dev        # 默认 3000 端口

# 指向生产 API(或任意 HOLLOW 实例)
VITE_API_BASE=https://hollow.vonish.dev npm run dev
```

## 构建与部署

```bash
npm run build      # 产物在 dist/(vite base=/search/)
```

产物是纯静态文件，挂到任意 Web 服务器即可。当前生产用 Caddy：

```caddy
handle_path /search* {
    root * /var/www/hollow-search
    try_files {path} {path}/ /index.html
    file_server
}
```

## 环境变量

| 变量 | 默认 | 说明 |
|---|---|---|
| `VITE_API_BASE` | `''`（同源） | API 基址；跨域部署/开发时指向 HOLLOW 实例 |

## 目录结构

```
src/
├── lib/api.ts            # API 客户端 + 会话缓存 + 预取(唯一的 API 接触点)
├── components/           # SearchBar / SceneChips
└── pages/
    ├── Home.tsx          # 主页:字标 + 输入框 + 场景 chips
    ├── Results.tsx       # 结果页:结果卡 + 账目行 + 分页 + 预取
    └── Reader.tsx        # 阅读模式:双路赛制(iframe 原框 × 云端净化)
```

## License

与 HOLLOW 主项目一致（AGPL-3.0）。
