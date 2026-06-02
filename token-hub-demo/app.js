const state = {
  smartMode: true,
  activeTool: null,
  panelOpen: true,
  loggedIn: true,
  balance: 128.5,
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
  "deepseek-v4-flash": { name: "DeepSeek V4 Flash", vendor: "DeepSeek", prices: ["¥0.60", "¥1.20", "¥0.12"] },
  "deepseek-v4-pro": { name: "DeepSeek V4 Pro", vendor: "DeepSeek", prices: ["¥7.20", "¥14.40", "¥1.44"] },
  "qwen3.6-plus": { name: "Qwen 3.6 Plus", vendor: "Qwen", prices: ["¥1.20", "¥7.20", "¥0.24"] },
  "qwen3.6-flash": { name: "Qwen 3.6 Flash", vendor: "Qwen", prices: ["¥0.72", "¥4.32", "¥0.14"] },
  "qwen3.6-max-preview": { name: "Qwen 3.6 Max Preview", vendor: "Qwen", prices: ["¥5.40", "¥32.40", "¥1.08"] },
  "kimi-k2.6": { name: "Kimi K2.6", vendor: "Moonshot", prices: ["¥3.90", "¥16.20", "¥0.78"] },
  "MiniMax-M2.5": { name: "MiniMax M2.5", vendor: "MiniMax", prices: ["¥1.26", "¥5.04", "¥0.25"] },
  "glm-5": { name: "GLM 5", vendor: "智谱", prices: ["¥2.40", "¥10.80", "¥0.48"] },
  "glm-5.1": { name: "GLM 5.1", vendor: "智谱", prices: ["¥3.60", "¥14.40", "¥0.72"] },
};

const webLinks = {
  dashboard: "https://lai-hub.lenovomm.com/",
  marketplace: "https://lai-hub.lenovomm.com/pricing",
  keys: "https://lai-hub.lenovomm.com/keys",
};

const panel = document.querySelector("#tray-panel");
const trayButton = document.querySelector("#tray-app-button");
const toolList = document.querySelector("#tool-list");
const modelList = document.querySelector("#model-list");
const accountBar = document.querySelector("#account-bar");
const accountPage = document.querySelector("#account-page");
const notification = document.querySelector("#tool-notification");
const toast = document.querySelector("#app-toast");

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

function renderAccount() {
  accountBar.innerHTML = state.loggedIn
    ? `
      <button class="account-summary" data-account="true">
        <span class="account-avatar">1</span>
        <span><strong>15*******88</strong><small>可用额度 ¥${state.balance.toFixed(2)}</small></span>
        <i>›</i>
      </button>
      <button class="recharge-button" data-recharge="true">充值</button>
    `
    : `
      <div class="account-login-copy"><strong>登录联想账户</strong><small>同步额度并使用模型服务</small></div>
      <button class="login-button" data-login="true">登录</button>
    `;
}

function renderAccountPage() {
  accountPage.innerHTML = state.loggedIn
    ? `
      <div class="account-profile"><span class="account-avatar large">1</span><div><strong>15*******88</strong><small>联想账户</small></div></div>
      <div class="balance-panel"><span>可用额度</span><strong>¥${state.balance.toFixed(2)}</strong><button data-recharge="true">充值</button></div>
      <button class="logout-row" data-logout="true">退出登录</button>
    `
    : `
      <div class="logged-out-state"><strong>尚未登录</strong><small>登录后可查看额度并使用模型服务。</small><button class="login-button" data-login="true">登录联想账户</button></div>
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
  setTimeout(() => notification.classList.add("show"), 450);
}

function showPage(page) {
  document.querySelectorAll(".panel-page").forEach((item) => {
    item.classList.toggle("active", item.dataset.panelPage === page);
  });
}

function openTool(toolId) {
  const tool = tools.find((item) => item.id === toolId);
  if (!tool) return;
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

  if (target.dataset.refreshTools) {
    target.classList.add("spinning");
    setTimeout(() => {
      target.classList.remove("spinning");
      showToast("检测完成，已发现 5 个工具");
    }, 650);
  }

  if (target.dataset.webLink) {
    window.open(webLinks[target.dataset.webLink], "_blank", "noopener,noreferrer");
  }

  if (target.dataset.dismissNotification) notification.classList.remove("show");
  if (target.dataset.settings) showPage("settings");
  if (target.dataset.account) {
    renderAccountPage();
    showPage("account");
  }
  if (target.dataset.login) {
    state.loggedIn = true;
    renderAccount();
    renderAccountPage();
    showToast("登录成功");
  }
  if (target.dataset.logout) {
    state.loggedIn = false;
    renderAccount();
    renderAccountPage();
    showToast("已退出登录");
  }
  if (target.dataset.recharge) {
    state.balance += 50;
    renderAccount();
    renderAccountPage();
    showToast("充值成功，额度已增加 ¥50.00");
  }

  if (target.matches(".settings-list .toggle")) {
    target.classList.toggle("active");
  }
});

renderTools();
renderAccount();
setTimeout(() => {
  if (!state.panelOpen) notification.classList.add("show");
}, 900);
