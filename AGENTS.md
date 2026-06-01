# Token Hub

联想 Token Hub 原型项目。

---

## 项目结构

```
token-hub-demo/      原型 Demo（纯前端 HTML/CSS/JS）
```

## 分支说明

| 分支 | 内容 |
|---|---|
| `main` | token-hub-demo 原型 |
| `prototype/desktop-a` | token-hub-demo 原型（含 .gitignore） |
| `prototype/desktop-b` | token-hub-demo（当前） |

---

## 运行 token-hub-demo

```bash
# 方式一：Python
python3 -m http.server 3456 -d token-hub-demo

# 方式二：Node
npx serve token-hub-demo -l 3456
```

访问 http://localhost:3456

---

## 开发注意事项

- token-hub-demo 是纯静态页面，修改 `app.js` / `styles.css` / `index.html` 后刷新即可
