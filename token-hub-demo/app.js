const state = {
  activeView: "dashboard",
  activeTool: "openclaw",
  activeRange: "24h",
  providerSubView: "list",
  currentProviderId: "deepseek",
  toolSelections: {
    openclaw: "deepseek",
    "tianxi-claw": "gac-a",
    "claude-code": "deepseek",
    codex: "deepseek",
    gemini: "gac-a",
    opencode: "deepseek",
    hermes: "deepseek",
  },
  walletBalance: 128.5,
  providers: [
    {
      id: "deepseek",
      name: "DeepSeek",
      url: "https://platform.deepseek.com",
      model: "deepseek-chat",
      balance: 32.1,
      todayTokens: 12400,
      monthTokens: 188000,
      status: "可用",
      tools: ["openclaw", "claude-code", "codex", "opencode", "hermes"],
    },
    {
      id: "gac-a",
      name: "GAC Code",
      url: "Key A",
      model: "claude-sonnet-4.5",
      balance: 80,
      todayTokens: 8300,
      monthTokens: 240000,
      status: "可用",
      tools: ["tianxi-claw", "claude-code", "gemini"],
    },
    {
      id: "gac-b",
      name: "GAC Code",
      url: "Key B",
      model: "gpt-4.1",
      balance: 0.2,
      todayTokens: 1200,
      monthTokens: 12000,
      status: "余额不足",
      tools: ["codex", "opencode"],
    },
    {
      id: "qwen-flash",
      name: "Qwen",
      url: "https://dashscope.aliyuncs.com",
      model: "qwen3.6-flash",
      balance: 26.8,
      todayTokens: 9600,
      monthTokens: 92000,
      status: "可用",
      tools: ["openclaw", "tianxi-claw", "gemini", "hermes"],
    },
    {
      id: "glm-5",
      name: "GLM",
      url: "https://open.bigmodel.cn",
      model: "glm-5",
      balance: 42.5,
      todayTokens: 7100,
      monthTokens: 134000,
      status: "可用",
      tools: ["claude-code", "codex", "opencode"],
    },
    {
      id: "kimi-k2-6",
      name: "Kimi",
      url: "https://api.moonshot.cn",
      model: "kimi-k2.6",
      balance: 18.3,
      todayTokens: 15200,
      monthTokens: 218000,
      status: "可用",
      tools: ["openclaw", "claude-code", "gemini", "hermes"],
    },
    {
      id: "minimax-m2-5",
      name: "MiniMax",
      url: "https://api.minimax.chat",
      model: "MiniMax-M2.5",
      balance: 31.6,
      todayTokens: 5400,
      monthTokens: 76000,
      status: "可用",
      tools: ["tianxi-claw", "codex", "opencode", "hermes"],
    },
  ],
  bills: [
    ["2026-05-29 15:20", "充值", "标准包", "+¥79.00", "成功"],
    ["2026-05-29 14:52", "消费", "DeepSeek", "-¥2.31", "已扣费"],
    ["2026-05-28 21:17", "消费", "GAC Code", "-¥8.42", "已扣费"],
  ],
};

const models = [
  ["deepseek-v4-flash", "¥0.6", "¥1.2", "轻量高速", ["文本生成", "深度思考", "1M"]],
  ["deepseek-v4-pro", "¥7.2", "¥14.4", "旗舰推理", ["文本生成", "深度思考", "1M"]],
  ["glm-5", "¥2.4", "¥10.8", "Coding 与 Agent", ["文本生成", "1M"]],
  ["glm-5.1", "¥3.6", "¥14.4", "长程任务", ["文本生成", "1M"]],
  ["kimi-k2.5", "¥2.4", "¥12.6", "多模态 Agent", ["文本生成", "深度思考", "1M"]],
  ["kimi-k2.6", "¥3.9", "¥16.2", "通用 Agent", ["文本生成", "深度思考", "1M"]],
  ["MiniMax-M2.5", "¥1.26", "¥5.04", "生产力场景", ["文本生成", "深度思考", "1M"]],
  ["qwen3.5-plus", "¥0.48", "¥2.88", "视觉语言", ["文本生成", "深度思考", "1M"]],
  ["qwen3.6-flash", "¥0.72", "¥4.32", "高效多模态", ["深度思考", "视觉理解", "1M"]],
  ["qwen3.6-max-preview", "¥5.4", "¥32.4", "最强 Max 预览", ["文本生成", "深度思考", "1M"]],
  ["qwen3.6-plus", "¥1.2", "¥7.2", "增强多模态", ["深度思考", "视觉理解", "1M"]],
];

const tools = [
  ["openclaw", "OpenClaw", "OC"],
  ["tianxi-claw", "天禧Claw", "TC"],
  ["claude-code", "Claude Code", "CC"],
  ["codex", "Codex", "CX"],
  ["gemini", "Gemini", "GM"],
  ["opencode", "OpenCode", "OP"],
  ["hermes", "Hermes", "HM"],
];

const content = document.querySelector("#content");
const appShell = document.querySelector("#app-shell");
const trayButton = document.querySelector("#tray-app-button");
const trayMenu = document.querySelector("#tray-menu");
const ranges = [
  ["24h", "24小时"],
  ["7d", "7天"],
  ["14d", "14天"],
  ["30d", "30天"],
];

function money(value) {
  return `¥${value.toFixed(2)}`;
}

function tokens(value) {
  if (value >= 10000) return `${(value / 1000).toFixed(1)}K tok`;
  return `${value} tok`;
}

function renderShell() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.activeView);
  });
  document
    .querySelector("#global-actions")
    .classList.toggle("hidden", state.activeView === "settings");
}

function providersForTool(toolId) {
  return state.providers.filter((provider) => provider.tools.includes(toolId));
}

function renderTrayMenu() {
  trayMenu.innerHTML = `
    <button class="tray-menu-item" data-tray-action="open">打开主界面</button>
    <a class="tray-menu-item" href="https://lai-hub.lenovomm.com/pricing" target="_blank" rel="noreferrer">模型广场</a>
    <a class="tray-menu-item" href="https://lai-hub.lenovomm.com/keys" target="_blank" rel="noreferrer">我的 API 密钥</a>
    <div class="tray-separator"></div>
    ${tools
      .map(([id, label]) => {
        const toolProviders = providersForTool(id);
        const current =
          toolProviders.find((provider) => provider.id === state.toolSelections[id]) ??
          toolProviders[0];
        return `
          <div class="tray-tool">
            <button class="tray-menu-item" type="button" data-tray-tool-menu="${id}">
              <span>${label}</span>
              <span class="tray-tool-current">${current?.model ?? "未配置"}</span>
              <span class="tray-tool-arrow">›</span>
            </button>
            <div class="tray-submenu">
              ${toolProviders
                .map(
                  (provider) => `
                    <button class="tray-menu-item tray-model-button ${provider.id === current?.id ? "active" : ""}" data-tray-model="${provider.id}" data-tray-tool="${id}">
                      <span>${provider.model}</span>
                    </button>
                  `,
                )
                .join("")}
            </div>
          </div>
        `;
      })
      .join("")}
    <div class="tray-separator"></div>
    <button class="tray-menu-item tray-exit" data-tray-action="exit">退出</button>
  `;
}

function renderProviders() {
  if (state.providerSubView === "marketplace") {
    renderMarketplace();
    return;
  }

  const filteredProviders = state.providers.filter(
    (provider) => provider.tools.includes(state.activeTool),
  );
  const rows = filteredProviders
    .map((provider) => {
      const active = provider.id === state.currentProviderId;
      return `
        <article class="provider-card ${active ? "active" : ""}">
          <div class="drag-handle">⁝</div>
          <div class="provider-logo">${provider.name.slice(0, 2).toUpperCase()}</div>
          <div class="provider-main">
            <h2>${provider.model}</h2>
            <div class="provider-usage">
              <div class="usage-line">
                <span>总用量 ${tokens(provider.monthTokens)}</span>
                <span>今日 ${tokens(provider.todayTokens)}</span>
              </div>
            </div>
          </div>
          <div class="card-actions">
            <button class="soft-button" ${active ? "disabled" : `data-switch="${provider.id}"`}>${active ? "使用中" : "切换"}</button>
          </div>
        </article>
      `;
    })
    .join("");

  content.innerHTML = `
    <section class="page-heading dashboard-heading heading-with-action">
      <h2>模型切换</h2>
    </section>
    <section class="tool-filter-bar">
      <div class="tool-filter-tabs">
        ${tools
          .map(
            ([id, label, mark]) => `
              <button class="tool-filter ${state.activeTool === id ? "active" : ""}" data-tool="${id}">
                <span>${mark}</span>
                ${label}
              </button>
            `,
          )
          .join("")}
      </div>
      <button class="refresh-tools-button" data-refresh-tools="true" title="重新检测已安装工具" aria-label="重新检测已安装工具">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 11a8.1 8.1 0 0 0-14.9-4.3L3 9" />
          <path d="M3 4v5h5" />
          <path d="M4 13a8.1 8.1 0 0 0 14.9 4.3L21 15" />
          <path d="M21 20v-5h-5" />
        </svg>
      </button>
    </section>
    <section class="provider-list">
      ${rows || `<div class="empty-state">当前工具暂无 API Key，可切换其他工具筛选。</div>`}
    </section>
  `;
}

function renderMarketplace() {
  content.innerHTML = `
    <section class="store-toolbar">
      <div class="title-with-back">
        <button class="back-button" data-back-providers="true" title="返回 API Key" aria-label="返回 API Key">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div>
          <h2>添加模型</h2>
          <p>选择模型后，再指定需要添加到的工具。</p>
        </div>
      </div>
      <span class="model-count">共 ${models.length} 个模型</span>
    </section>
    <section class="model-grid">
      ${models
        .map(
          ([name, inputPrice, outputPrice, summary, tags]) => `
            <article class="model-card">
              <div class="model-card-head">
                <span class="model-logo">${name.slice(0, 1).toUpperCase()}</span>
                <span class="billing-tag">按量计费</span>
              </div>
              <h2>${name}</h2>
              <p>${summary}</p>
              <div class="model-pricing">
                <div><span>输入</span><strong>${inputPrice}<small>/1M</small></strong></div>
                <div><span>输出</span><strong>${outputPrice}<small>/1M</small></strong></div>
              </div>
              <div class="model-tags">
                ${tags.map((tag) => `<span>${tag}</span>`).join("")}
              </div>
              <button class="primary-button model-detail-button" data-add-model="${name}">添加</button>
            </article>
          `,
        )
        .join("")}
    </section>
  `;
}

function renderDashboard() {
  const spendData = [
    ["05/26", 8.42],
    ["05/27", 11.86],
    ["05/28", 9.64],
    ["05/29", 16.28],
    ["05/30", 13.72],
    ["05/31", 18.34],
    ["06/01", 15.59],
  ];
  const callData = [
    ["05/26", 1820],
    ["05/27", 2310],
    ["05/28", 2140],
    ["05/29", 2980],
    ["05/30", 2760],
    ["05/31", 3610],
    ["06/01", 3310],
  ];
  const maxSpend = Math.max(...spendData.map(([, value]) => value));
  const maxCalls = Math.max(...callData.map(([, value]) => value));
  content.innerHTML = `
    <section class="dashboard-heading">
      <h2>👋 下午好，user</h2>
      <div class="dashboard-actions">
        <button class="outline-action" data-dashboard-preferences="true"><span>☷</span>偏好设置</button>
        <button class="outline-action" data-dashboard-filter="true"><span>▽</span>筛选</button>
      </div>
    </section>

    <section class="dashboard-summary">
      <article class="summary-item">
        <span class="summary-label"><b>#</b>总数</span>
        <strong>18,930</strong>
        <small>统计计数</small>
      </article>
      <article class="summary-item">
        <span class="summary-label"><b>◎</b>总额度</span>
        <div class="summary-value">
          <strong>¥128.50</strong>
          <a class="recharge-link" href="https://lai-hub.lenovomm.com/wallet" target="_blank" rel="noreferrer">+ 充值</a>
        </div>
        <small>统计配额</small>
      </article>
      <article class="summary-item">
        <span class="summary-label"><b>▤</b>总 TOKEN 数</span>
        <strong>962,400</strong>
        <small>统计 Token 数</small>
      </article>
      <article class="summary-item">
        <span class="summary-label"><b>◔</b>平均 RPM</span>
        <strong>18.6</strong>
        <small>每分钟请求数</small>
      </article>
      <article class="summary-item">
        <span class="summary-label"><b>ϟ</b>平均 TPM</span>
        <strong>4,250</strong>
        <small>每分钟 Token 数</small>
      </article>
    </section>

    <section class="analytics-panel">
      <div class="analytics-head">
        <div class="analytics-title">
          <span>▣</span>
          <h2>消耗分布</h2>
          <small>总计：¥93.85</small>
        </div>
        <div class="chart-tabs">
          <button class="active"><span>▥</span>柱状图</button>
          <button><span>⌁</span>面积图</button>
        </div>
      </div>
      <div class="data-chart">
        <div class="chart-grid"><span>¥20</span><span>¥15</span><span>¥10</span><span>¥5</span><span>¥0</span></div>
        <div class="chart-columns">
          ${spendData
            .map(
              ([label, value]) => `
                <div class="chart-column">
                  <strong>¥${value.toFixed(2)}</strong>
                  <i style="height:${Math.round((value / maxSpend) * 82)}%"></i>
                  <span>${label}</span>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
    </section>

    <section class="analytics-panel model-analysis">
      <div class="analytics-head">
        <div class="analytics-title">
          <span>◔</span>
          <h2>模型调用分析</h2>
          <small>总计：18,930</small>
        </div>
        <div class="chart-tabs">
          <button class="active">调用趋势</button>
          <button>调用次数分布</button>
          <button>调用次数排行</button>
        </div>
      </div>
      <div class="analysis-body">
        <h3>调用趋势</h3>
        <div class="data-chart call-chart">
          <div class="chart-grid"><span>4K</span><span>3K</span><span>2K</span><span>1K</span><span>0</span></div>
          <div class="chart-columns">
            ${callData
              .map(
                ([label, value]) => `
                  <div class="chart-column">
                    <strong>${value.toLocaleString()}</strong>
                    <i style="height:${Math.round((value / maxCalls) * 82)}%"></i>
                    <span>${label}</span>
                  </div>
                `,
              )
              .join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderSettings() {
  content.innerHTML = `
    <section class="page-heading">
      <h2>设置</h2>
    </section>
    <section class="setting-section">
      <div class="setting-section-head">
        <div>
          <h3>外观主题</h3>
          <p>选择应用的外观主题，立即生效。</p>
        </div>
      </div>
      <div class="setting-section-body">
        <div class="segmented-control compact">
          <button class="active">浅色</button>
          <button>深色</button>
          <button>跟随系统</button>
        </div>
      </div>
    </section>

    <section class="setting-section">
      <div class="setting-section-head">
        <div>
          <h3>API Key 偏好</h3>
          <p>控制余额提醒和服务切换策略。</p>
        </div>
      </div>
      <div class="setting-section-body">
        <div class="setting-list">
          <div class="setting-row"><div><strong>余额预警阈值</strong><span>低于 ¥10.00 时提醒充值</span></div><button class="mini-pill">修改</button></div>
          <div class="setting-row"><div><strong>失败自动切换</strong><span>当前 API Key 不可用时自动切换</span></div><button class="toggle active" aria-label="失败自动切换"></button></div>
        </div>
      </div>
    </section>

    <section class="setting-section">
      <div class="setting-section-head">
        <div>
          <h3>应用行为</h3>
          <p>管理应用启动、托盘和更新策略。</p>
        </div>
      </div>
      <div class="setting-section-body">
        <div class="setting-list">
          <div class="setting-row"><div><strong>开机自启</strong><span>随系统启动自动运行联想Token Hub</span></div><button class="toggle" aria-label="开机自启"></button></div>
          <div class="setting-row"><div><strong>关闭时最小化到托盘</strong><span>点击关闭按钮后隐藏到系统托盘</span></div><button class="toggle active" aria-label="关闭时最小化到托盘"></button></div>
          <div class="setting-row"><div><strong>自动检查更新</strong><span>启动时检查新版本</span></div><button class="toggle active" aria-label="自动检查更新"></button></div>
        </div>
      </div>
    </section>
  `;
}

function activeProviderName() {
  return (
    state.providers.find((provider) => provider.id === state.currentProviderId)
      ?.name ?? "未配置"
  );
}

function render() {
  renderShell();
  if (state.activeView === "dashboard") renderDashboard();
  if (state.activeView === "providers") renderProviders();
  if (state.activeView === "settings") renderSettings();
  content.scrollTop = 0;
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;

  if (target.dataset.view) {
    state.activeView = target.dataset.view;
    state.providerSubView = "list";
    render();
  }

  if (target.dataset.windowAction === "hide") {
    appShell.classList.add("hidden");
  }

  if (target.dataset.trayAction === "open") {
    appShell.classList.remove("hidden");
    trayMenu.classList.remove("open");
  }

  if (target.dataset.trayAction === "exit") {
    appShell.classList.add("hidden");
    trayMenu.classList.remove("open");
    showToast("联想 Token Hub 已退出");
  }

  if (target.dataset.trayModel) {
    state.currentProviderId = target.dataset.trayModel;
    state.activeTool = target.dataset.trayTool;
    state.toolSelections[state.activeTool] = target.dataset.trayModel;
    render();
    renderTrayMenu();
    trayMenu.classList.remove("open");
    showToast(`已切换至 ${state.providers.find((provider) => provider.id === state.currentProviderId)?.model}`);
  }

  if (target.dataset.trayToolMenu) {
    const toolItem = target.closest(".tray-tool");
    trayMenu
      .querySelectorAll(".tray-tool.open")
      .forEach((item) => item.classList.toggle("open", item === toolItem && !toolItem.classList.contains("open")));
    if (!toolItem.classList.contains("open")) {
      toolItem.classList.add("open");
    }
  }

  if (target.dataset.globalAction === "logout") {
    alert("演示：已退出登录。");
  }

  if (target.dataset.tool) {
    state.activeTool = target.dataset.tool;
    state.currentProviderId =
      state.toolSelections[state.activeTool] ?? providersForTool(state.activeTool)[0]?.id ?? "";
    render();
  }

  if (target.dataset.refreshTools) {
    target.classList.add("refreshing");
    window.setTimeout(() => {
      target.classList.remove("refreshing");
      showToast("已重新检测工具");
    }, 650);
  }

  if (target.dataset.range) {
    state.activeRange = target.dataset.range;
    render();
  }

  if (target.dataset.openMarketplace) {
    state.providerSubView = "marketplace";
    render();
  }

  if (target.dataset.backProviders) {
    state.providerSubView = "list";
    render();
  }

  if (target.dataset.switch) {
    state.currentProviderId = target.dataset.switch;
    state.toolSelections[state.activeTool] = target.dataset.switch;
    renderTrayMenu();
    render();
  }

  if (target.dataset.recharge) {
    const provider = state.providers.find((item) => item.id === target.dataset.recharge);
    provider.balance += 20;
    state.walletBalance += 20;
    state.bills.unshift([
      "刚刚",
      "充值",
      `${provider.name} 余额充值`,
      "+¥20.00",
      "成功",
    ]);
    render();
  }

  if (target.dataset.addModel) {
    showToolPicker(target.dataset.addModel);
  }

  if (target.dataset.dashboardPreferences) {
    showDashboardPreferences();
  }

  if (target.dataset.dashboardFilter) {
    showDashboardFilter();
  }

  if (target.dataset.filterRange) {
    target
      .closest(".quick-range")
      .querySelectorAll("button")
      .forEach((button) => button.classList.toggle("active", button === target));
  }

  if (target.classList.contains("toggle")) {
    target.classList.toggle("active");
  }
});

trayButton.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  renderTrayMenu();
  trayMenu.classList.add("open");
});

trayButton.addEventListener("click", () => {
  appShell.classList.remove("hidden");
});

document.addEventListener("click", (event) => {
  if (!trayMenu.contains(event.target) && event.target !== trayButton) {
    trayMenu.classList.remove("open");
  }
});

function showToast(message) {
  document.querySelector(".app-toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "app-toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 1800);
}

function createDashboardDialog(title, description, body, actions) {
  const dialog = document.createElement("dialog");
  dialog.className = "dashboard-modal";
  dialog.innerHTML = `
    <form method="dialog" class="dashboard-modal-panel">
      <div class="dashboard-modal-head">
        <div>
          <h2>${title}</h2>
          <p>${description}</p>
        </div>
        <button class="picker-close" value="cancel" aria-label="关闭">×</button>
      </div>
      <div class="dashboard-modal-body">${body}</div>
      <div class="dashboard-modal-actions">${actions}</div>
    </form>
  `;
  document.body.appendChild(dialog);
  dialog.addEventListener("close", () => dialog.remove());
  dialog.showModal();
}

function showDashboardPreferences() {
  createDashboardDialog(
    "看板偏好设置",
    "选择模型调用分析的默认图表、范围和时间粒度。",
    `
      <label class="modal-field"><strong>默认范围</strong><select><option>1 天</option><option>7 天</option><option>14 天</option><option>30 天</option></select></label>
      <label class="modal-field"><strong>默认时间粒度</strong><select><option>小时</option><option>天</option></select></label>
      <label class="modal-field"><strong>默认消耗分布图</strong><select><option>柱状图</option><option>面积图</option></select></label>
      <label class="modal-field"><strong>默认模型调用图</strong><select><option>调用趋势</option><option>调用次数分布</option><option>调用次数排行</option></select></label>
    `,
    `<button class="primary-button" value="confirm">保存偏好设置</button>`,
  );
}

function showDashboardFilter() {
  createDashboardDialog(
    "筛选仪表板模型",
    "设置筛选器以自定义您的仪表板统计数据和图表。",
    `
      <section class="filter-section">
        <strong>快速范围</strong>
        <div class="quick-range">
          <button type="button" class="active" data-filter-range="1d">1 天</button>
          <button type="button" data-filter-range="7d">7 天</button>
          <button type="button" data-filter-range="14d">14 天</button>
          <button type="button" data-filter-range="30d">30 天</button>
        </div>
      </section>
      <section class="filter-section">
        <strong>自定义时间范围</strong>
        <div class="date-grid">
          <label><span>起始时间</span><input type="date" value="2026-05-31" /></label>
          <label><span>时间</span><input type="time" value="00:20" /></label>
          <label><span>结束时间</span><input type="date" value="2026-06-01" /></label>
          <label><span>时间</span><input type="time" value="00:20" /></label>
        </div>
      </section>
      <label class="modal-field"><strong>时间粒度</strong><select><option>小时</option><option>天</option></select></label>
    `,
    `<button class="ghost-button" value="reset">重置</button><button class="primary-button" value="confirm">应用筛选器</button>`,
  );
}

function showToolPicker(modelName) {
  const picker = document.createElement("dialog");
  picker.className = "tool-picker-modal";
  picker.innerHTML = `
    <form method="dialog" class="tool-picker-panel">
      <div class="tool-picker-head">
        <div>
          <h2>添加 ${modelName}</h2>
          <p>选择需要使用该模型的工具。</p>
        </div>
        <button class="picker-close" value="cancel" aria-label="关闭">×</button>
      </div>
      <div class="picker-tool-grid">
        ${tools
          .filter(([id]) => id !== "all")
          .map(
            ([id, label, mark]) => `
              <label class="picker-tool">
                <input type="checkbox" name="tool" value="${id}" />
                <span class="picker-mark">${mark}</span>
                <strong>${label}</strong>
              </label>
            `,
          )
          .join("")}
      </div>
      <div class="tool-picker-actions">
        <button class="ghost-button" value="cancel">取消</button>
        <button class="primary-button" value="confirm">确认添加</button>
      </div>
    </form>
  `;
  document.body.appendChild(picker);
  picker.addEventListener("close", () => picker.remove());
  picker.showModal();
}

renderTrayMenu();
render();
