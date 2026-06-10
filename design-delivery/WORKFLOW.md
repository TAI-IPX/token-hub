# Token Hub WPF 开发工作流

适用于 Mac (Apple Silicon) + Parallels Windows 11 ARM64 VM 的日常开发→验证流程。

## 前置条件

- Parallels VM `Windows 11` 已启动，Parallels Tools 正常运行
- VM 可通过 `Z:` 盘访问 Mac 文件（`\\Mac\Home` → `Z:\`）
- 源码路径：Mac `~/Documents/Codex/Token Hub/token-hub` / VM `Z:\Documents\Codex\Token Hub\token-hub`

## 三步验证流程

### 1. 编译

```bash
prlctl exec "Windows 11" --current-user cmd /c \
  "cd /d Z:\Documents\Codex\Token Hub\token-hub\design-delivery\wpf\TokenHubPanel && dotnet build -c Release -o C:\Temp\CodexV{N}"
```

- `C:\Temp\CodexV{N}` 每次递增编号（避免文件锁），如 `CodexV178`
- 成功标志：`0 个警告 0 个错误`

### 2. 启动

```bash
prlctl exec "Windows 11" --current-user powershell -Command \
  "Get-Process TokenHubPanel -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Process 'C:\Temp\CodexV{N}\TokenHubPanel.exe'"
```

- `-ErrorAction SilentlyContinue` 避免进程不存在时报错
- 用 PowerShell `Start-Process` 而非 `cmd start`（cmd 版会阻塞 prlctl）

### 3. 截图

```bash
prlctl capture "Windows 11" --file /private/tmp/wpf-v{N}.png && open /private/tmp/wpf-v{N}.png
```

- 直接输出到 `/private/tmp/` 绕过 macOS Downloads sandbox 限制

## 快捷合并脚本

```bash
N=178
prlctl exec "Windows 11" --current-user cmd /c "cd /d Z:\Documents\Codex\Token Hub\token-hub\design-delivery\wpf\TokenHubPanel && dotnet build -c Release -o C:\Temp\CodexV$N"
prlctl exec "Windows 11" --current-user powershell -Command "Get-Process TokenHubPanel -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Process 'C:\Temp\CodexV$N\TokenHubPanel.exe'"
sleep 2 && prlctl capture "Windows 11" --file /private/tmp/wpf-v$N.png && open /private/tmp/wpf-v$N.png
```

## VM 管理

```bash
# 启动
prlctl start "Windows 11"

# 重启
prlctl restart "Windows 11"

# 查看状态
prlctl list "Windows 11"
```

## Git 操作

```bash
cd ~/Documents/Codex/Token\ Hub/token-hub

# Push（注意 GH_TOKEN 会覆盖认证）
env -u GH_TOKEN git push origin main

# 提交前排除不需要的文件
# .figma-to-code-skills/  .claude/  obj/  → 不可提交
```

## x64 测试包

```bash
# 自包含发布
prlctl exec "Windows 11" --current-user cmd /c \
  "cd /d Z:\Documents\Codex\Token Hub\token-hub\design-delivery\wpf\TokenHubPanel && dotnet publish -c Release -r win-x64 --self-contained true -o C:\Temp\TokenHub-x64-v{N}"

# 打包
prlctl exec "Windows 11" --current-user powershell -Command \
  "Compress-Archive -Path 'C:\Temp\TokenHub-x64-v{N}\*' -DestinationPath 'C:\Temp\TokenHub-x64-v{N}.zip' -Force"

# 复制到 Mac
prlctl exec "Windows 11" --current-user powershell -Command \
  "Copy-Item 'C:\Temp\TokenHub-x64-v{N}.zip' 'Z:\Downloads\TokenHub-x64-v{N}.zip' -Force"
```

输出：`~/Downloads/TokenHub-x64-v{N}.zip`（~79MB）

## 路径对照表

| Mac | VM (Windows) |
|-----|-------------|
| `~/Documents/Codex/Token Hub/token-hub/` | `Z:\Documents\Codex\Token Hub\token-hub\` |
| `/private/tmp/wpf-v{N}.png` | 不可直接访问，用 `prlctl capture` |
| `~/Downloads/` | `Z:\Downloads\` |

## 常见问题

| 症状 | 原因 | 解决 |
|------|------|------|
| `Unable to open new session` | VM 未完全启动 | 等待 Windows 登录后再执行 |
| `dotnet build` 文件锁定 | 旧进程仍在运行 | 先 `Stop-Process TokenHubPanel` |
| 截图无法 cp 到 Mac | Downloads 有 Sandbox 限制 | 用 `prlctl capture --file /private/tmp/` |
| push 认证失败 | `GH_TOKEN` 环境变量覆盖 | `env -u GH_TOKEN git push` |
| PowerShell 乱码报错 | prlctl exec 编码问题 | 换用 `cmd /c` 执行 `dotnet build` |
