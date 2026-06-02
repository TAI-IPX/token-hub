const state = {
  smartMode: true,
  activeTool: null,
  panelOpen: true,
  loggedIn: false,
  onboardingStarted: false,
  authPending: false,
  configuring: false,
  balance: 128.5,
  apiReady: false,
  selections: {
    openclaw: "deepseek-v4-flash",
    "claude-code": "deepseek-v4-pro",
    qclaw: "deepseek-v4-flash",
    workbuddy: "qwen3.6-plus",
    hermes: "kimi-k2.6",
  },
};

const tools = [
  { id: "openclaw", name: "OpenClaw", mark: "OC", models: ["deepseek-v4-flash", "deepseek-v4-pro", "qwen3.6-plus"] },
  { id: "claude-code", name: "Claude Code", mark: "CC", models: ["deepseek-v4-pro", "glm-5.1", "qwen3.6-max-preview"] },
  { id: "qclaw", name: "QClaw", mark: "QC", isNew: true, models: ["deepseek-v4-flash", "qwen3.6-flash", "kimi-k2.6"] },
  { id: "workbuddy", name: "WorkBuddy", mark: "WB", models: ["qwen3.6-plus", "kimi-k2.6", "MiniMax-M2.5"] },
  { id: "hermes", name: "Hermes", mark: "HM", models: ["kimi-k2.6", "deepseek-v4-pro", "glm-5"] },
];

const models = {
  "deepseek-v4-flash": { name: "DeepSeek V4 Flash", vendor: "DeepSeek", prices: ["¥0.60", "¥1.20", "¥0.12"], tags: ["文本生成", "轻量快速"] },
  "deepseek-v4-pro": { name: "DeepSeek V4 Pro", vendor: "DeepSeek", prices: ["¥7.20", "¥14.40", "¥1.44"], tags: ["深度思考", "文本生成"] },
  "qwen3.6-plus": { name: "Qwen 3.6 Plus", vendor: "Qwen", prices: ["¥1.20", "¥7.20", "¥0.24"], tags: ["文本生成", "视觉理解"] },
  "qwen3.6-flash": { name: "Qwen 3.6 Flash", vendor: "Qwen", prices: ["¥0.72", "¥4.32", "¥0.14"], tags: ["文本生成", "轻量快速"] },
  "qwen3.6-max-preview": { name: "Qwen 3.6 Max Preview", vendor: "Qwen", prices: ["¥5.40", "¥32.40", "¥1.08"], tags: ["深度思考", "视觉理解"] },
  "kimi-k2.6": { name: "Kimi K2.6", vendor: "Moonshot", prices: ["¥3.90", "¥16.20", "¥0.78"], tags: ["深度思考", "文本生成"] },
  "MiniMax-M2.5": { name: "MiniMax M2.5", vendor: "MiniMax", prices: ["¥1.26", "¥5.04", "¥0.25"], tags: ["文本生成", "工具调用"] },
  "glm-5": { name: "GLM 5", vendor: "智谱", prices: ["¥2.40", "¥10.80", "¥0.48"], tags: ["文本生成", "工具调用"] },
  "glm-5.1": { name: "GLM 5.1", vendor: "智谱", prices: ["¥3.60", "¥14.40", "¥0.72"], tags: ["深度思考", "文本生成"] },
};

const webLinks = {
  auth: "https://lai-hub.lenovomm.com/login?source=token-hub-desktop",
  dashboard: "https://lai-hub.lenovomm.com/",
  logs: "https://lai-hub.lenovomm.com/logs",
};

const panel = document.querySelector("#tray-panel");
const trayButton = document.querySelector("#tray-app-button");
const toolList = document.querySelector("#tool-list");
const modelList = document.querySelector("#model-list");
const accountBar = document.querySelector("#account-bar");
const onboardingCard = document.querySelector("#onboarding-card");
const readyContent = document.querySelector("#ready-content");
const settingsButton = document.querySelector(".settings-button");
const notification = document.querySelector("#tool-notification");
const toast = document.querySelector("#app-toast");
const authWindow = document.querySelector("#auth-window");

function renderTools() {
  toolList.innerHTML = tools.map((tool) => {
    const model = models[state.selections[tool.id]];
    return `
      <button class="tool-row" data-open-tool="${tool.id}">
        <span class="tool-mark">${tool.mark}</span>
        <span class="tool-copy">
          <strong>${tool.name}${tool.isNew ? `<em>新发现</em>` : ""}</strong>
          <small>${model.name}</small>
        </span>
        <span class="chevron">›</span>
      </button>
    `;
  }).join("");
}

function renderOnboarding() {
  onboardingCard.hidden = state.apiReady;
  readyContent.hidden = !state.apiReady;
  settingsButton.hidden = !state.apiReady;
  if (state.apiReady) return;
  onboardingCard.innerHTML = state.configuring
    ? `
      <span class="setup-icon progress">↻</span>
      <div class="onboarding-copy">
        <h2>正在完成服务配置</h2>
        <p>正在创建 Token Hub 访问凭证并接入本机服务，请稍候。</p>
        <div class="progress-track"><i></i></div>
        <div class="onboarding-notes">
          <span>✓ 联想账号认证完成</span>
          <span>✓ 正在创建访问凭证</span>
          <span>· 正在启用多模型服务</span>
        </div>
      </div>
    `
    : state.authPending
      ? `
        <span class="setup-icon progress">↻</span>
        <div class="onboarding-copy">
          <h2>等待登录确认</h2>
          <p>请在联想账号登录窗口中完成认证。登录成功后，将自动继续配置。</p>
          <div class="onboarding-notes">
            <span>✓ 已打开联想账号登录窗口</span>
            <span>· 等待完成登录认证</span>
          </div>
        </div>
        <div class="onboarding-actions">
          <button class="setup-primary" data-login="true">重新打开登录窗口</button>
        </div>
      `
      : !state.onboardingStarted
        ? `
          <span class="setup-icon">✦</span>
          <div class="onboarding-copy">
            <h2>自动完成服务配置</h2>
            <p>只需简单几步，即可让已安装的 AI 应用使用 Token Hub 提供的模型服务。无需填写复杂信息，也不用手动修改应用设置。</p>
            <div class="onboarding-notes">
              <span>✓ 自动完成必要设置</span>
              <span>✓ 自动为应用选择合适的模型</span>
              <span>✓ 配置完成后即可使用</span>
            </div>
          </div>
          <button class="setup-primary" data-start-onboarding="true">开始配置</button>
        `
      : state.loggedIn
    ? `
      <span class="setup-icon">✦</span>
      <div class="onboarding-copy">
        <h2>自动完成服务配置</h2>
        <p>Token Hub 将自动创建访问凭证并完成本机接入。所有应用共用一套多模型服务，无需手动复制或修改密钥。</p>
        <div class="onboarding-notes">
          <span>✓ 一套凭证，全局接入</span>
          <span>✓ 自动匹配推荐模型</span>
          <span>✓ 初始化完成后立即可用</span>
        </div>
      </div>
      <button class="setup-primary" data-configure-hub="true">自动配置</button>
    `
    : `
      <span class="setup-icon">♙</span>
      <div class="onboarding-copy">
        <h2>登录联想账号</h2>
        <p>接下来将打开联想账号登录窗口。完成登录后，将自动继续配置。</p>
      </div>
      <button class="setup-primary" data-login="true">打开登录窗口</button>
    `;
}

function openWebLogin() {
  state.authPending = true;
  authWindow.hidden = false;
  renderAccount();
  renderOnboarding();
  showToast("已打开联想账号登录窗口");
}

function startConfiguration() {
  state.configuring = true;
  renderOnboarding();
  setTimeout(() => {
    state.configuring = false;
    state.apiReady = true;
    renderTools();
    renderOnboarding();
    showToast("配置完成，所有应用已接入模型服务");
  }, 1200);
}

function renderAccount() {
  accountBar.innerHTML = state.loggedIn
    ? `
      <div class="account-row">
        <span class="account-avatar">1</span>
        <span class="account-copy"><strong>15*******88</strong><small>可用额度 ¥${state.balance.toFixed(2)}</small></span>
        <button class="account-action" data-recharge="true">充值</button>
        <button class="account-action secondary" data-logout="true">登出</button>
      </div>
    `
    : state.authPending
      ? `
        <div class="account-row">
          <span class="account-avatar">1</span>
          <span class="account-copy"><strong>等待登录窗口确认</strong><small>完成联想账号认证后继续</small></span>
          <button class="account-action secondary" data-login="true">重试</button>
          <button class="account-action" data-complete-login="true">完成认证</button>
        </div>
      `
      : `
      <div class="account-row">
        <span class="account-avatar">1</span>
        <span class="account-copy"><strong>登录联想账户</strong><small>同步额度并使用模型服务</small></span>
        <button class="account-action" data-login="true">登录</button>
      </div>
    `;
}

function openPanel() {
  panel.classList.add("open");
  trayButton.classList.add("active");
  state.panelOpen = true;
}

function closePanel() {
  panel.classList.remove("open");
  trayButton.classList.remove("active");
  state.panelOpen = false;
  if (state.apiReady) setTimeout(() => notification.classList.add("show"), 450);
}

function showPage(page) {
  document.querySelectorAll(".panel-page").forEach((item) => {
    item.classList.toggle("active", item.dataset.panelPage === page);
  });
}

function openTool(toolId) {
  const tool = tools.find((item) => item.id === toolId);
  if (!tool) return;
  if (!state.apiReady) {
    showPage("home");
    onboardingCard.classList.add("attention");
    setTimeout(() => onboardingCard.classList.remove("attention"), 700);
    showToast("请先完成首次初始化");
    return;
  }
  state.activeTool = toolId;
  document.querySelector("#detail-tool-name").textContent = tool.name;
  modelList.innerHTML = tool.models.map((modelId) => {
    const model = models[modelId];
    const active = state.selections[toolId] === modelId;
    return `
      <button class="model-row${active ? " selected" : ""}" data-select-model="${modelId}" ${state.smartMode ? "disabled" : ""}>
        <span class="radio"><i></i></span>
        <span class="model-copy">
          <strong>${model.name}</strong>
          <small>${model.vendor}</small>
          <span class="model-tags">${model.tags.map((tag) => `<i>${tag}</i>`).join("")}</span>
          <span class="model-prices"><b>输入 ${model.prices[0]}</b><b>输出 ${model.prices[1]}</b><b>缓存读取 ${model.prices[2]}</b><i>/1M</i></span>
        </span>
        ${active ? `<em>使用中</em>` : ""}
      </button>
    `;
  }).join("");
  notification.classList.remove("show");
  openPanel();
  showPage("models");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;

  if (target === trayButton) {
    state.panelOpen ? closePanel() : openPanel();
  }

  if (target.dataset.closePanel) closePanel();

  if (target.dataset.smartToggle) {
    state.smartMode = !state.smartMode;
    target.classList.toggle("active", state.smartMode);
    renderTools();
    showToast(state.smartMode ? "已开启智能模型匹配" : "已切换为手动选择");
  }

  if (target.dataset.openTool) openTool(target.dataset.openTool);

  if (target.dataset.backHome) showPage("home");

  if (target.dataset.selectModel) {
    const modelId = target.dataset.selectModel;
    state.selections[state.activeTool] = modelId;
    renderTools();
    openTool(state.activeTool);
    showToast(`已切换至 ${models[modelId].name}`);
  }

  if (target.dataset.configureHub) {
    startConfiguration();
  }

  if (target.dataset.startOnboarding) {
    state.onboardingStarted = true;
    if (state.loggedIn) {
      renderOnboarding();
    } else {
      openWebLogin();
    }
  }

  if (target.dataset.refreshApps) {
    target.classList.add("spinning");
    setTimeout(() => {
      target.classList.remove("spinning");
      showToast("检测完成，已发现 5 个应用");
    }, 650);
  }

  if (target.dataset.webLink) {
    window.open(webLinks[target.dataset.webLink], "_blank", "noopener,noreferrer");
  }

  if (target.dataset.dismissNotification) notification.classList.remove("show");
  if (target.dataset.settings) showPage("settings");
  if (target.dataset.login) {
    openWebLogin();
  }
  if (target.dataset.completeLogin) {
    state.loggedIn = true;
    state.authPending = false;
    authWindow.hidden = true;
    renderAccount();
    startConfiguration();
  }
  if (target.dataset.logout) {
    state.loggedIn = false;
    state.authPending = false;
    renderAccount();
    renderOnboarding();
    showToast("已退出登录");
  }
  if (target.dataset.closeAuth) {
    authWindow.hidden = true;
    showToast("登录窗口已关闭，可随时重新打开");
  }
  if (target.dataset.recharge) {
    state.balance += 50;
    renderAccount();
    showToast("充值成功，额度已增加 ¥50.00");
  }

  if (target.matches(".settings-list .toggle")) {
    target.classList.toggle("active");
  }
});

renderTools();
renderAccount();
renderOnboarding();
setTimeout(() => {
  if (!state.panelOpen && state.apiReady) notification.classList.add("show");
}, 900);
