# Token Hub

联想 Token Hub 原型项目。

---

## 项目结构

```
token-hub-demo/      原型 Demo（纯前端 HTML/CSS/JS）
```

## 分支说明

项目仅维护 `main` 分支。桌面左下角提供 `A / B` 原型方案切换，选择会保存在浏览器本地存储中。

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
- `A / B` 方案共享同一份功能、数据和交互逻辑，仅通过样式变体控制展示密度
