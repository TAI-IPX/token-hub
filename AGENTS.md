# Token Hub

联想 Token Hub 托盘版功能原型项目。当前重点是验证 Windows 11 风格的桌面托盘体验，而不是完整生产应用。

## Current Branch

- Active prototype branch: `feature-prototype`
- Remote: `token-hub` -> `https://github.com/TAI-IPX/token-hub.git`
- GitHub branch URL: `https://github.com/TAI-IPX/token-hub/tree/feature-prototype`

Important: `main` and `feature-prototype` have diverged. Do not pull/rebase/merge `main` into this branch unless the user explicitly asks. This branch is intended to remain an independent feature prototype for review and iteration.

## Project Structure

```text
token-hub-demo/
  index.html   Static prototype markup
  app.js       UI state, interactions, mock data
  styles.css   Windows 11 style layout and components
```

The demo is pure HTML/CSS/JavaScript. There is no build step and no dependency install required.

## Run Locally

From the repository root:

```bash
python3 -m http.server 4173 -d token-hub-demo
```

Then open:

```text
http://127.0.0.1:4173/
```

Alternative:

```bash
npx serve token-hub-demo -l 4173
```

## Product Direction

Token Hub is a lightweight tray-first desktop companion for Lenovo Token Mall model services.

Core idea:

- The main experience lives in the Windows tray panel.
- Web functions open Token Mall pages in the browser.
- The desktop app focuses on installed AI applications, model selection, smart model matching, login, balance, recharge, and software update prompts.
- The UI should feel native to Windows 11: clean, compact, familiar, and trustworthy.

## Current UX Scope

The prototype currently includes:

- Windows 11 desktop mock.
- Desktop app icon for Lenovo Token Hub.
- System tray icon:
  - single click toggles the panel.
  - right click shows menu: open main panel, settings, exit.
- Tray panel home:
  - onboarding/login/service configuration flow.
  - installed application list.
  - smart model matching switch.
  - account/balance/recharge entry.
  - top title menu for web destinations.
- Application model selection page.
- Settings page.
- Recharge flow in a separate app-style window.
- Software update entry, update modal, updating progress, and success state.
- Demo scenario menu in the bottom-left corner for switching states.

## Supported Applications In Prototype

Use this wording unless the user changes scope:

```text
当前支持 OpenClaw、Hermes 和 Claude Code
```

The no-apps state should show:

```text
未检测到可配置的应用
当前支持 OpenClaw、Hermes 和 Claude Code
```

## Confirmed Interaction Decisions

- Do not show a full main dashboard application. This prototype is tray-first.
- Data dashboard, usage logs, key management, model marketplace, and account are web-side functions.
- Title menu links:
  - 数据看板: `https://lai-hub.lenovomm.com/dashboard/models`
  - 使用日志: `https://lai-hub.lenovomm.com/usage-logs/common`
  - 密钥管理: `https://lai-hub.lenovomm.com/keys`
  - 模型广场: `https://lai-hub.lenovomm.com/pricing`
  - 我的账户: `https://lai-hub.lenovomm.com/wallet`
- Login is represented as a desktop-style auth window, not a browser tab with address bar.
- Recharge is represented as a desktop-style payment window.
- Toasts should be rare. Current intended toast:
  - refresh application list feedback.
  - settings page "check update" feedback when already latest.
- No external model configuration support in the current prototype.
- No order history entry in the account menu.
- No check update entry in the tray right-click menu.

## Demo Scenario Menu

The bottom-left hamburger menu is only for prototype review. It simulates states such as:

- first use / not logged in
- smart matching off
- smart matching on
- no detected applications
- unconfigured applications
- low balance
- update available
- new application notification

Do not treat the scenario menu as product UI.

## Development Notes

- Keep edits scoped to `token-hub-demo/` unless the user requests repo-level docs or git changes.
- Prefer simple static UI state changes in `app.js`.
- Avoid introducing frameworks, package managers, build tools, or generated dependency folders.
- Do not commit `.DS_Store`, screenshots, build outputs, or dependencies.
- Before committing, run:

```bash
node --check token-hub-demo/app.js
git diff --check
```

## Git Notes

Current prototype branch:

```bash
git switch feature-prototype
```

Push this branch:

```bash
git push token-hub feature-prototype
```

Do not force-push `main` unless the user explicitly confirms.
