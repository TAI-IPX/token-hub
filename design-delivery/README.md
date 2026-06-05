# Design Delivery（设计交付）

本目录为 Token Hub 托盘面板的 **Figma 视觉还原交付物**，与 `token-hub-demo/` 中的产品原型相互独立。

## 目录结构

```
design-delivery/
├── README.md                          ← 本文件
├── visual-demo/                       ← Web 可视化 Demo（预览用）
│   ├── index.html / styles.css / app.js
│   └── assets/3x/                    ← 切图资源 (PNG/SVG)
└── wpf/TokenHubPanel/                 ← WPF 完整项目（研发交付）
    ├── TokenHubPanel.csproj           (.NET 8.0)
    ├── App.xaml                        入口 + 资源引用
    ├── MainWindow.xaml + .cs           全部场景面板 + 状态切换
    ├── Styles/
    │   ├── DesignTokens.xaml           设计变量（颜色/字体/间距/尺寸/圆角/阴影）
    │   └── ControlStyles.xaml          组件模板（Toggle/Radio/ScrollBar/Button/Tag/ListItem）
    ├── ViewModels/
    │   ├── MainViewModel.cs            MVVM 状态管理 + 数据
    │   ├── RelayCommand.cs             ICommand 辅助
    │   └── Converters.cs               值转换器
    ├── Models/
    │   ├── AppTool.cs                  应用数据模型
    │   └── ModelInfo.cs                模型数据模型
    └── Assets/                         切图资源
```

## 运行 Web 视觉 Demo

```bash
python3 -m http.server 4182 -d design-delivery/visual-demo
# 打开 http://127.0.0.1:4182/
```

左下角汉堡菜单切换全部场景状态。

## 运行 WPF 项目

```bash
cd design-delivery/wpf/TokenHubPanel
dotnet build
dotnet run
```

顶部 ComboBox 切换场景，与 Web Demo 体验一致。

> 环境要求: .NET 8.0 SDK + Windows (WPF)

## 场景覆盖

| # | 场景 | 面板尺寸 | Web Demo | WPF |
|---|------|----------|----------|-----|
| 1 | 首次使用 - 未登录 | 440×318 | ✅ | ✅ |
| 2 | 首次使用 - 配置中 | 440×318 | ✅ | ✅ |
| 3 | 正常使用 - 智能匹配关 | 440×384 | ✅ | ✅ |
| 4 | 正常使用 - 智能匹配开 | 440×384 | ✅ | ✅ |
| 5 | 待选择模型 | 440×384 | ✅ | ✅ |
| 6 | 额度不足 | 440×384 | ✅ | ✅ |
| 7 | 通知 - 发现新应用 (自动) | 364px popup | ✅ | ✅ |
| 8 | 通知 - 发现新应用 (手动) | 364px popup | ✅ | ✅ |
| 9 | 模型详情页 | 440×384 | ✅ | ✅ |

## 设计基线

| 属性 | 值 |
|------|-----|
| 面板宽度 | 440px |
| 面板高度 | 384px (功能态) / 318px (onboarding) |
| 面板圆角 | 8px |
| 面板背景 | rgba(248,251,255,0.94) + blur(80px) |
| 面板边框 | 1px rgba(0,0,0,0.18) |
| 面板阴影 | 0 22px 46px rgba(15,23,42,0.22) |
| 标题栏 | 48px, rgba(246,248,252,0.44) blur(18px) |
| 列表项 | 48px (首页) / 72px (二级页) |
| 底部栏 | 64px, 固定不滚动 |
| 主色 | #005FB8 |
| 字体 | Microsoft YaHei |
| 图标尺寸 | App 28×28, Avatar 28×28, Button 20×20 |
| Toggle | 42×22, on=#0067C0, off=#CCC, knob 16×16 |
| Radio | 20×20, selected=#005FB8 + white bullet |
| 标签 | 16px高, 圆角4px, 绿色#16A34A / 红色#DC2626 |

## Figma 源文件

https://www.figma.com/design/brmnTFUvvtOb0lMkOcIJS1/联想Token?node-id=355-7022

## 研发对接说明

1. **WPF 项目可直接运行预览**，顶部 ComboBox 切换全部 9 种视觉状态
2. **Styles/DesignTokens.xaml** 中的变量可直接复制到产品项目的 ResourceDictionary
3. **Styles/ControlStyles.xaml** 中的模板可作为自定义控件的起点
4. **Assets/** 中的切图为 3x PNG，WPF 中按实际显示尺寸缩放使用
5. Acrylic 效果需通过 `SetWindowCompositionAttribute` 或 WinUI 3 的 `DesktopAcrylicBackdrop` 实现
6. 滚动条使用自定义 ScrollBar 模板还原为 6px thin 样式
7. 面板定位：生产环境中从系统托盘弹出，right=24px, bottom=任务栏高度+24px
