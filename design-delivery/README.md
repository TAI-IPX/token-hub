# Design Delivery（设计交付）

本目录为 Token Hub 托盘面板的 **Figma 视觉还原交付物**，与 `token-hub-demo/` 中的产品原型相互独立。

## 目录结构

```
design-delivery/
├── README.md                       ← 本文件
├── TokenHubDesignSystem.xaml       ← WPF 设计系统规范（变量/组件/布局）
├── TokenHubTray.xaml               ← WPF 面板 Window 布局参考
└── visual-demo/                    ← Web 可视化 Demo（预览用）
    ├── index.html
    ├── styles.css
    ├── app.js
    └── assets/3x/                  ← 切图资源 (PNG/SVG)
```

## 运行视觉 Demo

```bash
python3 -m http.server 4182 -d design-delivery/visual-demo
# 打开 http://127.0.0.1:4182/
```

## XAML 使用方式

```xml
<Application.Resources>
  <ResourceDictionary Source="TokenHubDesignSystem.xaml" />
</Application.Resources>
```

## Figma 源

https://www.figma.com/design/brmnTFUvvtOb0lMkOcIJS1/联想Token?node-id=355-7022

## 设计基线

| 属性 | 值 |
|------|-----|
| 面板宽度 | 440px |
| 面板高度 | 384px (功能态) / 318px (onboarding) |
| 面板圆角 | 8px |
| 面板背景 | rgba(248,251,255,0.94) + blur(80px) |
| 面板阴影 | 0 22px 46px rgba(15,23,42,0.22) |
| 标题栏 | 48px, rgba(246,248,252,0.44) blur(18px) |
| 列表项 | 48px (首页) / 72px (二级页) |
| 底部栏 | 64px, 固定不滚动 |
| 主色 | #005FB8 |
| 字体 | Microsoft YaHei |
