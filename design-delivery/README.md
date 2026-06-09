# Design Delivery（设计交付）

本目录为 Token Hub 托盘面板的 **Figma 视觉还原交付物**，与 `token-hub-demo/` 中的产品原型相互独立。

> **当前版本**: v0.5.0 | **构建状态**: 0 错误 0 警告 (.NET 8.0, Windows 11 ARM64)

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
    ├── MainWindow.xaml + .cs           主面板 + 全部场景 + 弹窗/菜单/onboarding 多态
    ├── DemoSwitcherWindow.xaml + .cs   场景切换控制器
    ├── UpdateDialog.xaml + .cs         更新弹窗（发现新版本→更新中→完成 三态, 560×400）
    ├── InstallDialog.xaml + .cs        安装弹窗（560×400）
    ├── UninstallDialog.xaml + .cs      卸载弹窗（560×400）
    ├── RechargeWindow.xaml + .cs       独立充值窗口（金额/确认/扫码/详情 4 视图）
    ├── Styles/
    │   ├── DesignTokens.xaml           设计变量（颜色/字体/间距/尺寸/圆角/阴影）
    │   └── ControlStyles.xaml          组件模板（Toggle/Radio/ScrollBar/Button/Tag/ListItem
    │                                    + FlyoutMenu 菜单 / Secondary 次按钮）
    ├── ViewModels/
    │   ├── MainViewModel.cs            MVVM 状态管理 + 数据（每工具 6 个模型）
    │   ├── RelayCommand.cs             ICommand 辅助
    │   └── Converters.cs               值转换器
    ├── Models/
    │   ├── AppTool.cs                  应用数据模型
    │   └── ModelInfo.cs                模型数据模型
    └── Assets/                         切图资源（36 个 PNG: app/dialog/tray/notification/install 系列）
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

> 环境要求: .NET 8.0 SDK + Windows (WPF)
> 
> 已在 Windows 11 ARM64 VM 上通过 `dotnet build` 编译验证。

## 场景覆盖

| # | 场景 | 面板尺寸 | Web Demo | WPF |
|---|------|----------|----------|-----|
| 1 | 首次使用 - 未登录 | 440×384 | ✅ | ✅ |
| 2 | 首次使用 - 等待登录确认 | 440×384 | ✅ | ✅ |
| 3 | 首次使用 - 配置中 | 440×384 | ✅ | ✅ |
| 4 | 正常使用 - 智能匹配关 | 440×384 | ✅ | ✅ |
| 5 | 正常使用 - 智能匹配开 | 440×384 | ✅ | ✅ |
| 6 | 待选择模型 | 440×384 | ✅ | ✅ |
| 7 | 额度不足 | 440×384 | ✅ | ✅ |
| 8 | 通知 - 发现新应用 (自动) | 364px popup | ✅ | ✅ |
| 9 | 通知 - 发现新应用 (手动) | 364px popup | ✅ | ✅ |
| 10 | 模型详情页 | 440×384 | ✅ | ✅ |
| 11 | 模型设置页 | 440×384 | ✅ | ✅ |
| 12 | 发现新版本 | 440×384 | ✅ | ✅ |
| 13 | 未检测到可配置应用 | 440×384 | ✅ | ✅ |

## 交互与弹窗覆盖

| 交互 / 弹窗 | Web | WPF | 说明 |
|------------|-----|-----|------|
| 应用下拉菜单（数据看板等 4 项） | ✅ | ✅ | Popup，Fluent 菜单样式 |
| 账户下拉菜单（我的账户/登出） | ✅ | ✅ | Popup |
| 智能匹配二次确认 | ✅ | ✅ | 开启/取消按钮等宽 (MinWidth=64) |
| 新版本 hover tooltip | ✅ | ✅ | 显示版本更新内容 |
| onboarding 多态（登录→等待确认→自动配置/3s→完成） | ✅ | ✅ | 含 AuthPending 滑动进度条 |
| 检查更新 / 立即更新 | ✅ | ✅ | 设置页版本行 + loading + toast |
| 更新弹窗（发现新版本→更新中→完成） | — | ✅ | UpdateDialog 三态, 桌面居中 |
| 安装弹窗 | — | ✅ | InstallDialog, 560×400 |
| 卸载弹窗 | — | ✅ | UninstallDialog, 560×400 |
| 充值窗口（4 视图） | ✅ | ✅ | 独立 Window：金额/确认/扫码/详情 |
| 操作 toast 提示 | ✅ | ✅ | 刷新/检查更新等反馈 |
| 托盘右键菜单（刷新/设置/退出） | — | ✅ | WPF Popup 菜单, Win11 风格 |
| 托盘「退出应用」 | ✅ | — | WPF 为紧凑面板窗口，无系统托盘图标 |

## 设计基线

| 属性 | 值 |
|------|-----|
| 面板宽度 | 360px (WPF) / 440px (Web) |
| 面板高度 | 384px（所有功能态统一） |
| 面板圆角 | 8px |
| 面板底色 | #E8F2FA (Figma 基准色, 全局统一) |
| 面板背景 | rgba(248,251,255,0.94) + blur(80px) |
| 面板边框 | 1px rgba(0,0,0,0.18) |
| 面板阴影 | 0 22px 46px rgba(15,23,42,0.22) |
| 标题栏 | 48px |
| 列表项 | 48px (首页) / 80px (二级页) |
| 底部栏 | 64px, 固定不滚动 |
| 主色 | #005FB8 |
| 字体 | Microsoft YaHei |
| 图标尺寸 | App 28×28, Avatar 28×28, Settings 20×20, Close 20×20 |
| Toggle | 42×22, on=#0067C0, off=#CCC, knob 16×16 |
| Radio | 20×20, selected=#005FB8 + white bullet |
| 标签 | 16px高, 圆角2px, 蓝色#CFE3F3 |
| 列表项 hover | 黑色 4% (#0A000000) |
| 滚动条 | 4px 宽, 默认隐藏 hover 出现, 底部距容器 8px |
| 进度条（配置中/登录中） | 自定义滑动条 TranslateTransform 往复动画 |
| 进度条（更新中） | Win 原生 ProgressBar, 蓝色 (#005FB8) |
| 充值按钮 | 正常余额: 白底浅边框; 余额不足: 蓝色主按钮 |
| 按钮 hover | #1A000000 |
| 弹窗尺寸 | 更新/安装/卸载 均为 560×400, 桌面居中 |

## Figma 源文件

https://www.figma.com/design/brmnTFUvvtOb0lMkOcIJS1/联想Token?node-id=355-7022

## 版本历史

| 版本 | 日期 | 内容 |
|------|------|------|
| v0.5.0 | 2026-06-09 | UpdateDialog 三态弹窗、进度条动画修复、AuthPending loading、Install/Uninstall 弹窗、场景切换修复、字色/间距统一、设置页精简、弹窗崩溃修复、面板底色全局统一 |
| v0.4.0 | 2026-06 | 面板样式重构、UpdateDialog 初版 |
| v0.3.0 | 2026-05 | 系统托盘图标 + Win11 原生右键菜单、智能确认弹窗优化 |
| v0.2.0 | 2026-05 | 标题栏重构、Win11 图标体系、标签/模型列表优化 |

## WPF 构建状态

WPF 项目已在 Windows 11 ARM64 VM 上通过 `.NET 8.0` 编译验证（0 错误 0 警告）。

- ✅ 全部 13 种场景在 Windows 上运行验证
- ✅ UpdateDialog / InstallDialog / UninstallDialog 弹窗正常
- ✅ 数据绑定路径、布局像素效果已对照 Figma 微调
- ✅ 自定义 ThinScrollBarStyle 正常工作
- ✅ 通知面板布局对齐
- ✅ onboarding AuthPending 滑动动画正常

> **`visual-demo/` 是视觉唯一标准，后续微调需同步对照。**

## 研发对接说明

1. **WPF 项目可直接运行预览**，DemoSwitcherWindow 切换全部 13 种视觉状态
2. **Styles/DesignTokens.xaml** 中的变量可直接复制到产品项目的 ResourceDictionary
3. **Styles/ControlStyles.xaml** 中的模板可作为自定义控件的起点
4. **Assets/** 中的切图为 3x PNG，WPF 中按实际显示尺寸缩放使用
5. Acrylic 效果需通过 `SetWindowCompositionAttribute` 或 WinUI 3 的 `DesktopAcrylicBackdrop` 实现
6. 滚动条使用 `ThinScrollBarStyle`（4px, 默认隐藏, hover 出现）
7. 面板定位：生产环境中从系统托盘弹出，right=24px, bottom=任务栏高度+24px
8. `MainViewModel.cs` 中每个工具分配了 6 个模型，模型详情页支持滚动查看
9. 所有弹窗共享 ShutdownMode=OnExplicitShutdown 策略，Timer 在 Closing 时统一清理
