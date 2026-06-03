const savedSession = (() => {
  try {
    return JSON.parse(localStorage.getItem("tokenHubTraySession")) || {};
  } catch {
    return {};
  }
})();

const state = {
  smartMode: true,
  activeTool: null,
  panelOpen: true,
  appExited: false,
  loggedIn: savedSession.loggedIn || false,
  onboardingStarted: savedSession.onboardingStarted || false,
  authPending: false,
  configuring: false,
  discoveryNotice: null,
  balance: 128.5,
  rechargeAmount: 50,
  rechargeView: "amount",
  rechargeOrderId: "lenovo_75f4bae6_121",
  apiReady: savedSession.apiReady || false,
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
  marketplace: "https://lai-hub.lenovomm.com/pricing",
  keys: "https://lai-hub.lenovomm.com/keys",
  account: "https://lai-hub.lenovomm.com/account",
};

const panel = document.querySelector("#tray-panel");
const trayButton = document.querySelector("#tray-app-button");
const desktopAppIcon = document.querySelector("#desktop-app-icon");
const toolList = document.querySelector("#tool-list");
const modelList = document.querySelector("#model-list");
const accountBar = document.querySelector("#account-bar");
const onboardingCard = document.querySelector("#onboarding-card");
const readyContent = document.querySelector("#ready-content");
const settingsButton = document.querySelector(".settings-button");
const notification = document.querySelector("#tool-notification");
const demoButtons = document.querySelectorAll("[data-demo-state]");
const toast = document.querySelector("#app-toast");
const authWindow = document.querySelector("#auth-window");
const rechargeWindow = document.querySelector("#recharge-window");
const rechargeContent = document.querySelector("#recharge-content");
const appMenuButton = document.querySelector(".app-menu-button");
const appMenu = document.querySelector("#app-menu");
const trayContextMenu = document.querySelector("#tray-context-menu");

function saveSession() {
  localStorage.setItem("tokenHubTraySession", JSON.stringify({
    loggedIn: state.loggedIn,
    onboardingStarted: state.onboardingStarted,
    apiReady: state.apiReady,
  }));
}

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

function renderRecharge() {
  const amount = Number(state.rechargeAmount || 1);
  const orderId = state.rechargeOrderId;
  if (state.rechargeView === "confirm") {
    rechargeContent.innerHTML = `
      <section class="recharge-head">
        <div class="recharge-title">
          <i>▣</i>
          <div>
            <h2>确认付款</h2>
            <p>查看您的付款详情</p>
          </div>
        </div>
      </section>
      <section class="confirm-list">
        <div><span>充值金额</span><strong>¥${amount.toFixed(2)}</strong></div>
        <div><span>您支付</span><strong>${amount.toFixed(2)}</strong></div>
        <div><span>付款方式</span><strong><span class="pay-icon">▢</span> 微信/支付宝</strong></div>
      </section>
      <footer class="recharge-footer">
        <button class="primary" data-recharge-view="pay">去支付</button>
      </footer>
    `;
    return;
  }

  if (state.rechargeView === "pay" || state.rechargeView === "detail") {
    const detail = state.rechargeView === "detail";
    rechargeContent.innerHTML = `
      <section class="recharge-head">
        <div class="recharge-title">
          <i>▣</i>
          <div>
            <h2>扫码支付</h2>
            <p>请使用手机 app 完成支付</p>
          </div>
        </div>
      </section>
      <div class="pay-tabs">
        <button class="${detail ? "" : "active"}" data-recharge-view="pay">▦ 二维码</button>
        <button class="${detail ? "active" : ""}" data-recharge-view="detail">◷ 详情</button>
      </div>
      <section class="qr-box">
        ${detail ? `
          <div class="payment-detail">
            <div><span>金额</span><strong class="red">¥${amount.toFixed(2)}</strong></div>
            <div><span>订单编号</span><strong>${orderId}</strong></div>
            <div><span>付款方式</span><strong>聚合码</strong></div>
            <div><span>到期时间</span><strong>2026/6/1 10:46:33</strong></div>
          </div>
        ` : `
          <div>
            <div class="fake-qr"></div>
            <div class="qr-copy">
              <strong>等待支付...</strong>
              <span>扫描 聚合码</span>
              <span>到期时间：2026/6/1 10:46:33</span>
            </div>
          </div>
        `}
      </section>
      <footer class="recharge-footer">
        <button class="primary" data-complete-recharge="true">模拟支付完成</button>
      </footer>
    `;
    return;
  }

  const amounts = [10, 20, 50, 100, 200, 500];
  rechargeContent.innerHTML = `
    <section class="recharge-head">
      <div class="recharge-title">
        <i>▣</i>
        <div>
          <h2>充值</h2>
          <p>选择金额和支付方式</p>
        </div>
      </div>
      <button class="recharge-history" data-web-link="account">订单历史</button>
    </section>
    <section class="recharge-section">
      <strong>金额</strong>
      <div class="amount-grid">
        ${amounts.map((item) => `<button class="amount-card${amount === item ? " active" : ""}" data-recharge-amount="${item}">${item}元</button>`).join("")}
      </div>
    </section>
    <section class="recharge-section">
      <strong>自定义金额</strong>
      <div class="recharge-input-row">
        <input id="custom-recharge-amount" value="${amount}" inputmode="decimal" aria-label="自定义金额" />
        <div class="recharge-total"><span>待支付金额：</span><strong>¥${amount.toFixed(2)}</strong></div>
      </div>
    </section>
    <section class="recharge-section">
      <strong>付款方式</strong>
      <button class="payment-method"><span class="pay-icon">▢</span> 微信/支付宝</button>
    </section>
    <footer class="recharge-footer">
      <button class="primary" data-recharge-view="confirm">确认付款</button>
    </footer>
  `;
}

function openRechargeWindow() {
  state.rechargeView = "amount";
  state.rechargeOrderId = `lenovo_${String(Math.random()).slice(2, 10)}_121`;
  rechargeWindow.hidden = false;
  renderRecharge();
}

function closeRechargeWindow() {
  rechargeWindow.hidden = true;
}

function startConfiguration() {
  state.configuring = true;
  state.onboardingStarted = true;
  saveSession();
  renderOnboarding();
  setTimeout(() => {
    state.configuring = false;
    state.apiReady = true;
    saveSession();
    renderTools();
    renderAccount();
    renderOnboarding();
    syncAppMenuState();
    setActiveDemoState("ready");
    showToast("配置完成，所有应用已接入模型服务");
  }, 1200);
}

function renderAccount() {
  accountBar.innerHTML = state.loggedIn
    ? `
      <div class="account-row">
        <span class="account-avatar">1</span>
        <span class="account-copy"><strong>15*******88</strong><small>可用额度 ¥${state.balance.toFixed(2)}</small></span>
        <button class="account-action account-recharge" data-recharge="true">充值</button>
        <div class="account-more-wrap">
          <button class="account-more" data-account-menu="true" aria-label="账户更多操作" aria-expanded="false">⋮</button>
          <div class="account-menu" hidden>
            <button data-web-link="account">我的账户</button>
            <button class="danger" data-logout="true">登出</button>
          </div>
        </div>
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
  state.appExited = false;
  trayButton.hidden = false;
  panel.classList.add("open");
  trayButton.classList.add("active");
  state.panelOpen = true;
  trayContextMenu.hidden = true;
}

function closePanel() {
  panel.classList.remove("open");
  trayButton.classList.remove("active");
  state.panelOpen = false;
}

function exitApp() {
  closePanel();
  notification.classList.remove("show");
  trayContextMenu.hidden = true;
  trayButton.hidden = true;
  state.appExited = true;
}

function launchApp() {
  state.appExited = false;
  trayButton.hidden = false;
  openPanel();
  showPage("home");
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

function openAppFromNotification() {
  notification.classList.remove("show");
  openPanel();
  showPage("home");
}

function renderNotification() {
  const matchedModel = models[state.selections.qclaw];
  const isAuto = state.discoveryNotice === "auto";
  notification.classList.toggle("clickable", isAuto);
  notification.innerHTML = isAuto
    ? `
      <header>
        <div class="notification-brand">
          <img src="https://pr1-greenteacdn.lenovo.com.cn/config/202605/1780061482103_svgviewer-output%205.png" alt="" />
          <span>联想 Token Hub</span>
        </div>
        <button data-dismiss-notification="true" aria-label="关闭通知">×</button>
      </header>
      <div class="notification-content">
        <span class="tool-mark">QC</span>
        <div>
          <strong>QClaw 已完成模型匹配</strong>
          <p>已根据应用特性自动选择 ${matchedModel.name}，现在可以直接使用。</p>
          <div class="notification-result">
            ${matchedModel.tags.map((tag) => `<span>${tag}</span>`).join("")}
            <span>${matchedModel.vendor}</span>
          </div>
        </div>
      </div>
    `
    : `
      <header>
        <div class="notification-brand">
          <img src="https://pr1-greenteacdn.lenovo.com.cn/config/202605/1780061482103_svgviewer-output%205.png" alt="" />
          <span>联想 Token Hub</span>
        </div>
        <button data-dismiss-notification="true" aria-label="关闭通知">×</button>
      </header>
      <div class="notification-content">
        <span class="tool-mark">QC</span>
        <div>
          <strong>发现新应用 QClaw</strong>
          <p>为 QClaw 选择一个模型后即可使用。</p>
        </div>
      </div>
      <div class="notification-actions">
        <button class="primary" data-open-tool="qclaw">去选择模型</button>
      </div>
    `;
}

function setDiscoveryNotice(mode) {
  state.discoveryNotice = mode === "clear" ? null : mode;
  if (!state.discoveryNotice) {
    notification.classList.remove("show");
    return;
  }
  state.smartMode = state.discoveryNotice === "auto";
  document.querySelector("[data-smart-toggle]")?.classList.toggle("active", state.smartMode);
  renderTools();
  renderNotification();
  notification.classList.add("show");
}

function renderAll() {
  renderTools();
  renderAccount();
  renderOnboarding();
  syncAppMenuState();
}

function setActiveDemoState(mode) {
  demoButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.demoState === mode);
  });
}

function setDemoState(mode) {
  state.authPending = false;
  state.configuring = false;
  authWindow.hidden = true;
  notification.classList.remove("show");
  setDiscoveryNotice("clear");

  if (mode === "onboard") {
    state.loggedIn = false;
    state.onboardingStarted = false;
    state.apiReady = false;
    state.smartMode = true;
    localStorage.removeItem("tokenHubTraySession");
    showPage("home");
    openPanel();
    renderAll();
    setActiveDemoState(mode);
    return;
  }

  state.loggedIn = true;
  state.onboardingStarted = true;
  state.apiReady = true;
  state.smartMode = mode !== "manual-discovery";
  saveSession();
  showPage("home");
  renderAll();
  document.querySelector("[data-smart-toggle]")?.classList.toggle("active", state.smartMode);
  setActiveDemoState(mode);

  if (mode === "auto-discovery") {
    closePanel();
    setDiscoveryNotice("auto");
    return;
  }

  if (mode === "manual-discovery") {
    closePanel();
    setDiscoveryNotice("manual");
    return;
  }

  openPanel();
  showToast("已切换到正常使用状态");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function setAppMenu(open) {
  const canOpen = state.loggedIn;
  const nextOpen = canOpen && open;
  appMenu.hidden = !nextOpen;
  appMenuButton.classList.toggle("active", nextOpen);
  appMenuButton.classList.toggle("locked", !canOpen);
  appMenuButton.querySelector(".menu-chevron").textContent = canOpen ? "▾" : "";
  appMenuButton.setAttribute("aria-expanded", String(nextOpen));
}

function setAccountMenu(open) {
  const menu = accountBar.querySelector(".account-menu");
  const button = accountBar.querySelector(".account-more");
  if (!menu || !button) return;
  menu.hidden = !open;
  button.classList.toggle("active", open);
  button.setAttribute("aria-expanded", String(open));
}

function syncAppMenuState() {
  setAppMenu(!appMenu.hidden);
}

document.addEventListener("click", (event) => {
  const menuTarget = event.target.closest("[data-app-menu]");
  if (menuTarget) {
    if (!state.loggedIn) {
      setAppMenu(false);
      return;
    }
    setAppMenu(appMenu.hidden);
    return;
  }

  const target = event.target.closest("button");
  if (!target) {
    if (event.target.closest("#tool-notification") && state.discoveryNotice === "auto") {
      openAppFromNotification();
      return;
    }
    if (!event.target.closest(".account-more-wrap")) setAccountMenu(false);
    if (!event.target.closest(".app-menu-wrap")) setAppMenu(false);
    if (!event.target.closest("#tray-context-menu")) trayContextMenu.hidden = true;
    return;
  }

  if (target === trayButton) {
    trayContextMenu.hidden = true;
    state.panelOpen ? closePanel() : openPanel();
  }

  if (!target.closest(".app-menu-wrap")) setAppMenu(false);
  if (!target.closest(".account-more-wrap")) setAccountMenu(false);
  if (!target.closest("#tray-context-menu") && target !== trayButton) trayContextMenu.hidden = true;

  if (target.dataset.accountMenu) {
    setAccountMenu(accountBar.querySelector(".account-menu")?.hidden);
    return;
  }

  if (target.dataset.closePanel) closePanel();
  if (target.dataset.exitApp) exitApp();

  if (target.dataset.smartToggle) {
    state.smartMode = !state.smartMode;
    target.classList.toggle("active", state.smartMode);
    renderTools();
    if (state.discoveryNotice) {
      state.discoveryNotice = state.smartMode ? "auto" : "manual";
      renderNotification();
    }
    showToast(state.smartMode ? "已开启智能模型匹配" : "已切换为手动选择");
  }

  if (target.dataset.openTool) {
    if (target.closest("#tool-notification")) setDiscoveryNotice("clear");
    openTool(target.dataset.openTool);
  }

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
    saveSession();
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

  if (target.dataset.demoState) {
    setDemoState(target.dataset.demoState);
  }

  if (target.dataset.webLink) {
    window.open(webLinks[target.dataset.webLink], "_blank", "noopener,noreferrer");
    setAppMenu(false);
    setAccountMenu(false);
  }

  if (target.dataset.dismissNotification) setDiscoveryNotice("clear");
  if (target.dataset.settings) showPage("settings");
  if (target.dataset.login) {
    openWebLogin();
  }
  if (target.dataset.completeLogin) {
    state.loggedIn = true;
    state.authPending = false;
    authWindow.hidden = true;
    saveSession();
    renderAccount();
    startConfiguration();
  }
  if (target.dataset.logout) {
    state.loggedIn = false;
    state.authPending = false;
    state.apiReady = false;
    state.onboardingStarted = false;
    saveSession();
    syncAppMenuState();
    renderAccount();
    renderOnboarding();
    setActiveDemoState("onboard");
    showToast("已退出登录");
  }
  if (target.dataset.closeAuth) {
    authWindow.hidden = true;
    showToast("登录窗口已关闭，可随时重新打开");
  }
  if (target.dataset.closeRecharge) {
    closeRechargeWindow();
  }
  if (target.dataset.recharge) {
    openRechargeWindow();
  }
  if (target.dataset.rechargeAmount) {
    state.rechargeAmount = Number(target.dataset.rechargeAmount);
    renderRecharge();
  }
  if (target.dataset.rechargeView) {
    state.rechargeView = target.dataset.rechargeView;
    renderRecharge();
  }
  if (target.dataset.completeRecharge) {
    state.balance += Number(state.rechargeAmount || 0);
    closeRechargeWindow();
    renderAccount();
    showToast(`充值成功，额度已增加 ¥${Number(state.rechargeAmount || 0).toFixed(2)}`);
  }

  if (target.matches(".settings-list .toggle")) {
    target.classList.toggle("active");
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id !== "custom-recharge-amount") return;
  const value = Math.max(1, Number(event.target.value || 1));
  state.rechargeAmount = value;
  const total = rechargeContent.querySelector(".recharge-total strong");
  if (total) total.textContent = `¥${value.toFixed(2)}`;
});

trayButton.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  if (state.appExited) return;
  setAppMenu(false);
  setAccountMenu(false);
  const rect = trayButton.getBoundingClientRect();
  trayContextMenu.style.right = `${Math.max(window.innerWidth - rect.right - 6, 8)}px`;
  trayContextMenu.style.bottom = `${Math.max(window.innerHeight - rect.top + 4, 54)}px`;
  trayContextMenu.hidden = false;
});

desktopAppIcon.addEventListener("dblclick", () => {
  launchApp();
});

renderAll();
setActiveDemoState(state.apiReady ? "ready" : "onboard");
