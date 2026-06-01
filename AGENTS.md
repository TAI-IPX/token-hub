# Token Hub

联想 Token Hub 原型项目。

---

## 项目结构

```
token-hub-demo/      原型 Demo（纯前端 HTML/CSS/JS）
cc-switch-main/      CC Switch 桌面应用（Tauri + React + Rust）
```

## 分支说明

| 分支 | 内容 |
|---|---|
| `main` | token-hub-demo 原型 |
| `prototype/desktop-a` | token-hub-demo 原型（含 .gitignore） |
| `prototype/desktop-b` | token-hub-demo + cc-switch-main（当前） |

---

## 运行 token-hub-demo

```bash
# 方式一：Python
python3 -m http.server 3456 -d token-hub-demo

# 方式二：Node
npx serve token-hub-demo -l 3456
```

访问 http://localhost:3456

## 运行 cc-switch-main

### 前置要求

- Node.js >= 20
- pnpm
- Rust（仅 Tauri 桌面端需要）

### 启动

```bash
cd cc-switch-main
pnpm install
pnpm dev:renderer    # 仅 Web 渲染端（浏览模式）
pnpm tauri dev       # 完整 Tauri 桌面端
```

### 构建

```bash
cd cc-switch-main
pnpm build:renderer  # 构建 Web
pnpm tauri build     # 构建桌面安装包
```

---

## 开发注意事项

- token-hub-demo 是纯静态页面，修改 `app.js` / `styles.css` / `index.html` 后刷新即可
- cc-switch-main 的 Tauri 命令在 `src-tauri/src/commands/`；前端在 `src/`；IPC API 层在 `src/lib/api/`
- 设计系统：shadcn/ui + TailwindCSS
- 数据存储：SQLite（`~/.cc-switch/cc-switch.db`）
