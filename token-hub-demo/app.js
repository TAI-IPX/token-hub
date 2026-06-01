const state = {
  activeView: "dashboard",
  activeTool: "openclaw",
  activeRange: "24h",
  providerSubView: "list",
  currentProviderId: "deepseek",
  toolSelections: {
    openclaw: "deepseek",
    "tianxi-claw": "qwen",
    "claude-code": "deepseek",
    codex: "deepseek",
    gemini: "deepseek",
    opencode: "deepseek",
    hermes: "deepseek",
  },
  // 累加模式工具（OpenCode/OpenClaw/Hermes）：已添加到该工具配置中的 provider ID 列表
  toolConfigs: {
    openclaw: ["deepseek", "qwen", "kimi"],
    "tianxi-claw": ["qwen", "minimax"],
    opencode: ["deepseek", "glm", "minimax"],
    hermes: ["deepseek", "qwen", "kimi", "minimax"],
  },
  // 默认模型（OpenClaw/Hermes）：该工具当前默认使用的 provider ID
  defaultModels: {
    openclaw: "deepseek",
    "tianxi-claw": "qwen",
    hermes: "deepseek",
  },
  walletBalance: 128.5,
  autoMatchModels: false,
  autoMatchTools: ["openclaw", "claude-code", "codex", "opencode"],
  hasSeenAutoMatchIntro: false,
  providers: [
    {
      id: "deepseek",
      name: "DeepSeek",
      url: "https://platform.deepseek.com",
      models: ["deepseek-v4-flash", "deepseek-v4-pro"],
      tools: ["openclaw", "claude-code", "codex", "opencode", "hermes"],
    },
    {
      id: "qwen",
      name: "Qwen",
      url: "https://dashscope.aliyuncs.com",
      models: ["qwen3.5-plus", "qwen3.6-flash", "qwen3.6-max-preview", "qwen3.6-plus"],
      tools: ["openclaw", "tianxi-claw", "gemini", "hermes"],
    },
    {
      id: "glm",
      name: "GLM",
      url: "https://open.bigmodel.cn",
      models: ["glm-5", "glm-5.1"],
      tools: ["claude-code", "codex", "opencode"],
    },
    {
      id: "kimi",
      name: "Kimi",
      url: "https://api.moonshot.cn",
      models: ["kimi-k2.5", "kimi-k2.6"],
      tools: ["openclaw", "claude-code", "gemini", "hermes"],
    },
    {
      id: "minimax",
      name: "MiniMax",
      url: "https://api.minimax.chat",
      models: ["MiniMax-M2.5"],
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
  ["deepseek-v4-flash", "¥0.6", "¥1.2", "高效轻量化 MoE 模型，总参 284B，激活 13B，原生支持百万超长上下文能力。推理速度快、延迟低、调用成本低廉，适合日常对话、内容创作、基础 RAG 与批量文本处理。", ["文本生成", "深度思考", "1M"]],
  ["deepseek-v4-pro", "¥7.2", "¥14.4", "旗舰级 MoE 大模型，总参 1.6T，激活 49B，原生支持百万级超长上下文。依托海量高质量训练数据，具备顶尖的复杂推理、代码生成和专业写作能力。", ["文本生成", "深度思考", "1M"]],
  ["glm-5", "¥2.4", "¥10.8", "GLM-5 是面向 Coding 与 Agent 场景的新一代大模型，在复杂系统工程与长程任务中达到开源 SOTA，拥有扎实的编程、工具调用和逻辑推理能力。", ["文本生成", "Agent", "1M"]],
  ["glm-5.1", "¥3.6", "¥14.4", "GLM-5.1 是智谱 AI 推出的面向长程任务模型，支持 200K 超长上下文和最大 128K tokens 输出，适合复杂分析、代码工程和持续性工作流。", ["文本生成", "深度思考", "1M"]],
  ["kimi-k2.5", "¥2.4", "¥12.6", "Kimi K2.5 是面向 Agent、代码与视觉理解的智能模型，在通用智能任务上取得优秀表现，适合多步骤规划、工具使用和多模态内容处理。", ["文本生成", "深度思考", "1M"]],
  ["kimi-k2.6", "¥3.9", "¥16.2", "Kimi K2.6 的通用 Agent、代码和视觉理解等综合能力得到全面提升，在高难度推理和复杂工具协作场景中表现稳定。", ["文本生成", "深度思考", "1M"]],
  ["MiniMax-M2.5", "¥1.26", "¥5.04", "MiniMax-M2.5 是旗舰级开源大模型，经过复杂真实环境中的大规模强化学习训练，在编程、工具调用、搜索和办公等生产力场景中表现出色。", ["文本生成", "深度思考", "1M"]],
  ["qwen3.5-plus", "¥0.48", "¥2.88", "Qwen3.5 原生视觉语言系列 Plus 模型，融合线性注意力机制与稀疏混合专家架构，在多项任务评测中展现出更高的推理效率。", ["文本生成", "深度思考", "1M"]],
  ["qwen3.6-flash", "¥0.72", "¥4.32", "Qwen3.6 原生视觉语言系列 Flash 模型，重点提升 Agentic Coding、视觉理解与高吞吐调用体验，适合强调速度和性价比的应用。", ["深度思考", "视觉理解", "1M"]],
  ["qwen3.6-max-preview", "¥5.4", "¥32.4", "Qwen3.6 系列中规模最大、综合能力最强的 Max Preview 模型，为复杂推理、代码生成和多模态理解提供旗舰体验。", ["文本生成", "深度思考", "1M"]],
  ["qwen3.6-plus", "¥1.2", "¥7.2", "Qwen3.6 原生视觉语言系列 Plus 模型，展现出均衡的卓越性能，在通用问答、视觉理解、深度思考与工具协作中保持良好表现。", ["深度思考", "视觉理解", "1M"]],
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

// 判断工具是否为累加模式（添加/移除，而非切换/启用）
function isAdditiveTool(toolId) {
  return toolId === "opencode" || toolId === "openclaw" || toolId === "tianxi-claw" || toolId === "hermes";
}
// 判断 provider 是否已添加到指定工具的配置中
function isInToolConfig(providerId, toolId) {
  if (!isAdditiveTool(toolId)) return true; // Switch 模式始终在配置中
  return (state.toolConfigs[toolId] || []).includes(providerId);
}
// 获取工具当前选中的 provider ID（Switch 模式用）
function getToolCurrentProviderId(toolId) {
  return state.toolSelections[toolId] || null;
}
// 获取工具默认模型 provider ID（OpenClaw/Hermes）
function getToolDefaultModelId(toolId) {
  return state.defaultModels[toolId] || null;
}

function renderShell() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.activeView);
  });
}

function providersForTool(toolId) {
  return state.providers.filter((provider) => provider.tools.includes(toolId));
}

function configuredProvidersForTool(toolId) {
  const providers = providersForTool(toolId);
  if (!isAdditiveTool(toolId)) return providers;
  return providers.filter((provider) => isInToolConfig(provider.id, toolId));
}

function selectedProviderForTool(toolId, providers = configuredProvidersForTool(toolId)) {
  const selectedId = isAdditiveTool(toolId)
    ? state.defaultModels[toolId] ?? state.toolSelections[toolId]
    : state.toolSelections[toolId];
  return providers.find((provider) => provider.id === selectedId) ?? providers[0];
}

function tagsForProvider(provider) {
  const tagsByModel = {
    "deepseek-chat": ["深度思考", "文本生成"],
    "claude-sonnet-4.5": ["深度思考", "文本生成"],
    "gpt-4.1": ["文本生成"],
    "qwen3.6-flash": ["深度思考", "视觉理解"],
    "glm-5": ["文本生成", "深度思考"],
    "kimi-k2.6": ["文本生成", "深度思考"],
    "MiniMax-M2.5": ["文本生成", "深度思考"],
  };
  return tagsByModel[provider.model] ?? ["文本生成"];
}

function renderTrayMenu() {
  trayMenu.innerHTML = `
    <button class="tray-menu-item" data-tray-action="open">打开主界面</button>
    <div class="tray-separator"></div>
    ${tools
      .map(([id, label]) => {
        const toolProviders = configuredProvidersForTool(id);
        const current = selectedProviderForTool(id, toolProviders);
        return `
          <div class="tray-tool">
            <button class="tray-menu-item" type="button" data-tray-tool-menu="${id}">
              <span>${label}</span>
              <span class="tray-tool-current">${current?.name ?? "未配置"}</span>
              <span class="tray-tool-arrow">›</span>
            </button>
            <div class="tray-submenu">
              ${
                toolProviders.length
                  ? toolProviders
                      .map(
                        (provider) => `
                          <button class="tray-menu-item tray-model-button ${provider.id === current?.id ? "active" : ""}" data-tray-model="${provider.id}" data-tray-tool="${id}">
                            <span class="tray-model-copy">
                              <strong>${provider.name}</strong>
                              <small>${provider.models.join(" · ")}</small>
                            </span>
                          </button>
                        `,
                      )
                      .join("")
                  : `<span class="tray-empty">暂未配置模型</span>`
              }
            </div>
          </div>
        `;
      })
      .join("")}
    <div class="tray-separator"></div>
    <button class="tray-menu-item" data-tray-view="marketplace">模型广场</button>
    <button class="tray-menu-item" data-tray-view="api-keys">我的 API 密钥</button>
    <button class="tray-menu-item" data-tray-view="settings">设置</button>
    <div class="tray-separator"></div>
    <button class="tray-menu-item tray-exit" data-tray-action="exit">退出</button>
  `;
}

function renderProviders() {
  if (state.providerSubView === "marketplace") {
    renderMarketplace();
    return;
  }

  const toolId = state.activeTool;
  const additive = isAdditiveTool(toolId);
  const currentProviderId = getToolCurrentProviderId(toolId);
  const defaultModelId = getToolDefaultModelId(toolId);

  const filteredProviders = state.providers.filter(
    (provider) => provider.tools.includes(toolId) && !provider.url?.startsWith("Key "),
  );
  const rows = filteredProviders
    .map((provider) => {
      const inConfig = isInToolConfig(provider.id, toolId);
      const isCurrent = provider.id === currentProviderId;
      const isDefault = provider.id === defaultModelId;

      let mainBtnHtml = "";
      if (additive) {
        // 累加模式：添加/移除
        if (inConfig) {
          const disabledAttr = isDefault ? 'disabled' : '';
          mainBtnHtml = `<button class="soft-button remove-btn" ${disabledAttr} data-remove="${provider.id}" data-tool="${toolId}">${isDefault ? "默认模型" : "移除"}</button>`;
        } else {
          mainBtnHtml = `<button class="soft-button add-btn" data-add="${provider.id}" data-tool="${toolId}">添加</button>`;
        }
      } else {
        // Switch 模式：启用/切换
        mainBtnHtml = `<button class="soft-button" ${isCurrent ? 'disabled' : `data-switch="${provider.id}" data-tool="${toolId}"`}>${isCurrent ? '已在用' : '启用'}</button>`;
      }

      // OpenClaw/Hermes: 设为默认按钮
      let defaultBtnHtml = "";
      if ((toolId === "openclaw" || toolId === "tianxi-claw" || toolId === "hermes") && inConfig && !isDefault) {
        defaultBtnHtml = `<button class="soft-button default-btn" data-set-default="${provider.id}" data-tool="${toolId}">设为默认</button>`;
      }

      const cardActive = additive ? (inConfig && isDefault) : isCurrent;
      return `
        <article class="provider-card${cardActive ? " active" : ""}">
          <div class="drag-handle">⁝</div>
          <div class="provider-logo">${provider.name.slice(0, 2).toUpperCase()}</div>
          <div class="provider-main">
            <h2>${provider.name}</h2>
            <div class="provider-models">
              ${provider.models.map(m => `<span class="provider-model-tag">${m}</span>`).join("")}
            </div>


          </div>
          <div class="card-actions">
            ${defaultBtnHtml}
            ${mainBtnHtml}
          </div>
        </article>
      `;
    })
    .join("");

  content.innerHTML = `
    <section class="page-heading dashboard-heading heading-with-action">
      <h2>模型配置</h2>
    </section>
    <section class="tool-filter-bar">
      <div class="tool-filter-list">
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
        <button class="refresh-tools-button" data-refresh-tools="true" data-tooltip="重新检测已安装工具" title="重新检测已安装工具" aria-label="重新检测已安装工具">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 11a8.1 8.1 0 0 0-14.9-4.3L3 9" />
            <path d="M3 4v5h5" />
            <path d="M4 13a8.1 8.1 0 0 0 14.9 4.3L21 15" />
            <path d="M21 20v-5h-5" />
          </svg>
        </button>
      </div>
      <div class="auto-match-group">
        <div class="auto-match-info-wrap${!state.hasSeenAutoMatchIntro ? " auto-match-popover-open" : ""}">
          <button class="auto-match-info-btn" data-auto-match-info="true" aria-label="智能模型匹配说明">ⓘ</button>
          ${state.hasSeenAutoMatchIntro ? "" : `<div class="auto-match-guide-backdrop"></div>`}
          <div class="auto-match-popover">
            <p>开启后，系统将根据每个工具的特性自动匹配最合适的默认模型，无需手动逐个配置。</p>
            ${state.hasSeenAutoMatchIntro ? "" : `
              <div class="auto-match-popover-actions">
                <button class="primary-button" data-enable-auto-match="true">开启</button>
                <button class="ghost-button" data-dismiss-auto-match-intro="true">暂不开启</button>
              </div>
            `}
          </div>
        </div>
        <div class="auto-match-row">
          <span class="auto-match-icon">⚡</span>
          <span class="auto-match-label">智能模型匹配</span>
          <button class="toggle${state.autoMatchModels ? " active" : ""}" data-toggle-auto-match="true" aria-label="智能模型匹配开关"></button>
        </div>
      </div>
    </section>
    <section class="provider-list">
      ${rows || `<div class="empty-state">当前工具暂无 API Key，可切换其他工具筛选。</div>`}
    </section>
  `;
}

function renderApiKeys() {
  content.innerHTML = `
    <section class="page-heading dashboard-heading heading-with-action">
      <h2>API 密钥</h2>
      <button class="outline-action" data-create-api-key="true">＋ 创建 API 密钥</button>
    </section>
    <section class="key-table-wrap">
      <table class="key-table">
        <thead>
          <tr><th>○</th><th>名称 ↕</th><th>状态 ↕</th><th>API 密钥</th><th>额度 ↕</th><th>分组 ↕</th><th>模型</th><th>IP 限制</th><th>创建时间 ↕</th><th>最后使用时间 ↕</th><th>过期 ↕</th><th></th></tr>
        </thead>
        <tbody>
          <tr><td>○</td><td>02</td><td><span class="key-status">已启用</span></td><td><code>sk-0bDC**********grKN</code> ⧉</td><td>无限制</td><td><span class="key-group">default</span> <span class="key-rate">0.6x</span></td><td>3 model(s)</td><td>无限制</td><td>2026-05-31 23:16:44</td><td>2026-05-31 23:16:44</td><td>永不</td><td>•••</td></tr>
          <tr><td>○</td><td>01</td><td><span class="key-status">已启用</span></td><td><code>sk-QNsM**********0FDI</code> ⧉</td><td>无限制</td><td><span class="key-group">default</span> <span class="key-rate">0.6x</span></td><td>3 model(s)</td><td>无限制</td><td>2026-05-31 23:16:16</td><td>2026-05-31 23:16:16</td><td>永不</td><td>•••</td></tr>
        </tbody>
      </table>
    </section>
  `;
}

function renderMarketplace() {
  const nested = state.activeView === "providers";
  content.innerHTML = `
    <section class="store-toolbar">
      <div class="title-with-back">
        ${
          nested
            ? `<button class="back-button" data-back-providers="true" title="返回 API Key" aria-label="返回 API Key">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
              </button>`
            : ""
        }
        <div>
          <h2>${nested ? "添加模型" : "模型广场"}</h2>
          ${nested ? "<p>选择模型后，再指定需要添加到的工具。</p>" : ""}
        </div>
      </div>
      <div class="marketplace-tools">
        <strong>${models.length} 个模型</strong>
        <div>
          <div class="pricing-unit-switch" aria-label="计价单位">
            <button class="active" data-pricing-unit="1M">/1M</button>
            <button data-pricing-unit="1K">/1K</button>
          </div>
          <span>↕ 名称</span>
          <button class="marketplace-filter-button" data-marketplace-filter="true">▽ 筛选</button>
        </div>
      </div>
    </section>
    <section class="marketplace-shell">
      <div class="marketplace-main">
        <section class="model-grid">
          ${models
            .map(
              ([name, inputPrice, outputPrice, summary, tags]) => `
                <article class="model-card">
                  <div class="model-card-head">
                    <span class="model-logo">${name.slice(0, 1).toUpperCase()}</span>
                    <div class="model-card-title">
                      <h2>${name}</h2>
                      <div class="inline-pricing">
                        <span>输入 <strong>${inputPrice}<small>/1M</small></strong></span>
                        <span>输出 <strong>${outputPrice}<small>/1M</small></strong></span>
                      </div>
                    </div>
                    <div class="model-card-actions"><button data-model-detail="${name}">详情 ›</button></div>
                  </div>
                  <p>${summary}</p>
                  <div class="model-tags">
                    <span>default 分组</span>
                    <span>按量计费</span>
                    ${tags.map((tag) => `<span>${tag}</span>`).join("")}
                  </div>
                </article>
              `,
            )
            .join("")}
        </section>
      </div>
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
          <button class="recharge-link" data-open-recharge="true">+ 充值</button>
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
      <div class="setting-section-body">
        <div class="setting-list">
          <div class="setting-row">
            <div><strong>主题模式</strong><span>选择应用的外观主题，立即生效。</span></div>
            <div class="segmented-control compact">
              <button class="active" data-theme-option="light">浅色</button>
              <button data-theme-option="dark">深色</button>
              <button data-theme-option="system">跟随系统</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="setting-section">
      <div class="setting-section-body">
        <div class="setting-list">
          <div class="setting-row"><div><strong>余额预警阈值</strong><span>低于 ¥10.00 时提醒充值</span></div><button class="mini-pill">修改</button></div>
          <div class="setting-row"><div><strong>失败自动切换</strong><span>当前 API Key 不可用时自动切换</span></div><button class="toggle active" aria-label="失败自动切换"></button></div>
          <div class="setting-row"><div><strong>智能模型匹配</strong><span>根据工具特性自动匹配合适的默认模型</span></div><button class="toggle${state.autoMatchModels ? " active" : ""}" data-toggle-auto-match="true" aria-label="智能模型匹配"></button></div>
          <div class="setting-row setting-row-stacked">
            <div><strong>支持工具</strong><span>选择启用智能模型匹配的工具</span></div>
            <div class="settings-tool-picker">
              ${tools
                .map(
                  ([id, label, mark]) => `
                    <button class="${state.autoMatchTools.includes(id) ? "active" : ""}" data-auto-match-tool="${id}">
                      <b>${mark}</b>
                      ${label}
                    </button>
                  `,
                )
                .join("")}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="setting-section">
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
  if (state.activeView === "api-keys") renderApiKeys();
  if (state.activeView === "marketplace") renderMarketplace();
  if (state.activeView === "settings") renderSettings();
  content.scrollTop = 0;
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;

  if (target.dataset.profileToggle) {
    const profileMenu = target.closest(".profile-menu");
    const open = profileMenu.classList.toggle("open");
    target.setAttribute("aria-expanded", String(open));
  }

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

  if (target.dataset.trayView) {
    state.activeView = target.dataset.trayView;
    state.providerSubView = "list";
    appShell.classList.remove("hidden");
    trayMenu.classList.remove("open");
    render();
  }

  if (target.dataset.trayAction === "exit") {
    appShell.classList.add("hidden");
    trayMenu.classList.remove("open");
    showToast("联想 Token Hub 已退出");
  }

  if (target.dataset.trayModel) {
    const toolId = target.dataset.trayTool;
    const providerId = target.dataset.trayModel;
    state.currentProviderId = providerId;
    state.activeTool = toolId;
    state.toolSelections[toolId] = providerId;
    if (isAdditiveTool(toolId) && toolId !== "opencode") {
      state.defaultModels[toolId] = providerId;
    }
    // 如果是累加模式且 provider 不在配置中，自动添加
    if (isAdditiveTool(toolId)) {
      if (!state.toolConfigs[toolId]) state.toolConfigs[toolId] = [];
      if (!state.toolConfigs[toolId].includes(providerId)) {
        state.toolConfigs[toolId].push(providerId);
      }
    }
    render();
    renderTrayMenu();
    trayMenu.classList.remove("open");
    showToast(`已切换至 ${state.providers.find((provider) => provider.id === state.currentProviderId)?.name}`);
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

  if (target.dataset.globalAction === "billing") {
    showBillingHistoryDialog();
  }

  if (target.dataset.openRecharge) {
    showRechargeDialog();
  }

  if (target.dataset.closeDrawer) {
    closeSideDrawer();
  }

  if (target.dataset.createApiKey) {
    showCreateApiKeyDrawer();
  }

  if (target.dataset.saveApiKey) {
    closeSideDrawer();
    showToast("API 密钥已创建");
  }

  if (target.dataset.expiryPreset) {
    target
      .closest(".api-key-expiry-presets")
      .querySelectorAll("button")
      .forEach((button) => button.classList.toggle("active", button === target));
  }

  if (target.dataset.rechargeAmount) {
    document
      .querySelectorAll(".amount-option")
      .forEach((button) => button.classList.toggle("active", button === target));
    document.querySelector(".custom-amount-input").value = target.dataset.rechargeAmount;
    document.querySelector("#pending-amount").textContent = target.dataset.rechargeAmount;
  }

  if (target.dataset.confirmRecharge) {
    const amount = document.querySelector(".custom-amount-input")?.value || "0";
    document.querySelector(".recharge-modal")?.close();
    showPaymentConfirmDialog(amount);
  }

  if (target.dataset.startPayment) {
    const amount = target.dataset.startPayment;
    document.querySelector(".payment-confirm-modal")?.close();
    showPaymentDialog(amount);
  }

  if (target.dataset.paymentTab) {
    const dialog = target.closest(".payment-modal");
    dialog
      .querySelectorAll("[data-payment-tab]")
      .forEach((button) => button.classList.toggle("active", button === target));
    dialog
      .querySelectorAll("[data-payment-panel]")
      .forEach((panel) => panel.classList.toggle("active", panel.dataset.paymentPanel === target.dataset.paymentTab));
  }

  if (target.dataset.copyOrder) {
    showToast("订单编号已复制");
  }

  if (target.dataset.billingCopy) {
    showToast("订单编号已复制");
  }

  if (target.dataset.billingPage) {
    showToast("演示数据仅有 1 页");
  }

  if (target.dataset.closePayment) {
    target.closest("dialog").close();
  }

  if (target.dataset.modelDetail) {
    showModelDetailDrawer(target.dataset.modelDetail);
  }

  if (target.dataset.tool) {
    state.activeTool = target.dataset.tool;
    const toolId = state.activeTool;
    state.currentProviderId =
      state.toolSelections[toolId] ?? providersForTool(toolId)[0]?.id ?? "";
    render();
  }

  if (target.dataset.toggleAutoMatch) {
    state.autoMatchModels = !state.autoMatchModels;
    if (state.autoMatchModels) state.hasSeenAutoMatchIntro = true;
    render();
  }

  if (target.dataset.autoMatchTool) {
    const toolId = target.dataset.autoMatchTool;
    state.autoMatchTools = state.autoMatchTools.includes(toolId)
      ? state.autoMatchTools.filter((id) => id !== toolId)
      : [...state.autoMatchTools, toolId];
    render();
  }

  if (target.dataset.enableAutoMatch) {
    state.autoMatchModels = true;
    state.hasSeenAutoMatchIntro = true;
    showToast("已开启智能模型匹配");
    render();
  }

  if (target.dataset.dismissAutoMatchIntro) {
    state.hasSeenAutoMatchIntro = true;
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

  // 累加模式：添加到配置
  if (target.dataset.add) {
    const toolId = target.dataset.tool;
    const providerId = target.dataset.add;
    if (!state.toolConfigs[toolId]) state.toolConfigs[toolId] = [];
    if (!state.toolConfigs[toolId].includes(providerId)) {
      state.toolConfigs[toolId].push(providerId);
      showToast(`已添加 \${state.providers.find(p => p.id === providerId)?.model}`);
      state.toolSelections[toolId] = providerId;
      state.currentProviderId = providerId;
      renderTrayMenu();
    }
    render();
  }

  // 累加模式：从配置移除
  if (target.dataset.remove) {
    const toolId = target.dataset.tool;
    const providerId = target.dataset.remove;
    if (state.toolConfigs[toolId]) {
      state.toolConfigs[toolId] = state.toolConfigs[toolId].filter(id => id !== providerId);
      showToast(`已移除 \${state.providers.find(p => p.id === providerId)?.model}`);
    }
    render();
  }

  // OpenClaw/Hermes: 设为默认模型
  if (target.dataset.setDefault) {
    const toolId = target.dataset.tool;
    const providerId = target.dataset.setDefault;
    state.defaultModels[toolId] = providerId;
    showToast(`已设为默认模型`);
    state.toolSelections[toolId] = providerId;
    state.currentProviderId = providerId;
    renderTrayMenu();
    render();
  }

  if (target.dataset.switch) {
    const toolId = target.dataset.tool || state.activeTool;
    state.currentProviderId = target.dataset.switch;
    state.toolSelections[toolId] = target.dataset.switch;
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

  if (target.dataset.marketplaceFilter) {
    showMarketplaceFilter();
  }

  if (target.dataset.pricingUnit) {
    target
      .closest(".pricing-unit-switch")
      .querySelectorAll("button")
      .forEach((button) => button.classList.toggle("active", button === target));
  }

  if (target.dataset.themeOption) {
    target
      .closest(".segmented-control")
      .querySelectorAll("button")
      .forEach((button) => button.classList.toggle("active", button === target));
  }

  if (target.matches(".marketplace-filter-modal .filter-block button")) {
    target
      .closest(".filter-block")
      .querySelectorAll("button")
      .forEach((button) => button.classList.toggle("active", button === target));
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

document.addEventListener("input", (event) => {
  if (!event.target.matches(".custom-amount-input")) return;
  document.querySelector("#pending-amount").textContent = event.target.value || "0";
  document.querySelectorAll(".amount-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.rechargeAmount === event.target.value);
  });
});

function closeSideDrawer() {
  document.querySelector(".side-drawer-layer")?.remove();
}

function showSideDrawer(contentHtml, className = "") {
  closeSideDrawer();
  const layer = document.createElement("div");
  layer.className = "side-drawer-layer";
  layer.innerHTML = `<aside class="side-drawer ${className}">${contentHtml}</aside>`;
  appShell.appendChild(layer);
  layer.addEventListener("click", (event) => {
    if (event.target === layer) closeSideDrawer();
  });
}

function showModelDetailDrawer(modelName) {
  const model = models.find(([name]) => name === modelName);
  if (!model) return;
  const [name, inputPrice, outputPrice, description, tags] = model;
  showSideDrawer(
    `
      <div class="drawer-head model-drawer-head">
        <div>
          <h2><span class="drawer-model-logo">${name.slice(0, 1).toUpperCase()}</span>${name}</h2>
          <div class="drawer-subtitle">default 分组 · 按量计费 · <b>动态计费</b></div>
        </div>
        <button class="drawer-close" data-close-drawer="true" aria-label="关闭">×</button>
      </div>
      <div class="drawer-body model-detail-body">
        <p class="drawer-description">${description}</p>
        <div class="drawer-tag-row">${tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
        <div class="detail-tabs"><span class="active">ⓘ 概览</span><span>♡ 性能</span><span>‹/› API</span></div>
        <section class="performance-strip">
          <div><small>TPS</small><strong>108.3 t/s</strong></div>
          <div><small>平均延迟</small><strong>42.82s</strong></div>
          <div><small>成功率</small><strong class="success">100.00%</strong></div>
        </section>
        <section class="detail-section">
          <h3>模型价格</h3>
          <p>基础价格</p>
          <div class="price-cards"><div><span>输入</span><strong>${inputPrice}<small> / 1M</small></strong></div><div><span>输出</span><strong>${outputPrice}<small> / 1M</small></strong></div></div>
          <div class="cache-price"><span>缓存读取</span><strong>¥0.2 / 1M</strong></div>
          <h3>动态计费</h3>
          <p>价格根据用量档位和请求条件动态调整</p>
          <table class="detail-table"><thead><tr><th>档位</th><th>输入</th><th>输出</th><th>缓存读取</th></tr></thead><tbody><tr><td><span>base</span></td><td>${inputPrice}</td><td>${outputPrice}</td><td>¥0.20</td></tr></tbody></table>
        </section>
        <section class="spec-strip"><div><small>上下文</small><strong>1M</strong></div><div><small>最大输出</small><strong>128K</strong></div><div><small>模态</small><strong>T → T</strong></div><div><small>知识截止</small><strong>2025年3月</strong></div></section>
        <section class="detail-section"><h3>能力 / 支持的模态</h3><div class="drawer-tag-row"><span>流式输出</span><span>系统提示词</span><span>函数调用</span><span>工具</span><span>JSON 模式</span><span>结构化输出</span></div></section>
      </div>
    `,
    "model-detail-drawer",
  );
}

function showCreateApiKeyDrawer() {
  showSideDrawer(
    `
      <div class="drawer-head">
        <div><h2>创建 API 密钥</h2><p>通过提供必要信息添加新的 API 密钥。</p></div>
        <button class="drawer-close" data-close-drawer="true" aria-label="关闭">×</button>
      </div>
      <div class="drawer-body api-key-drawer-body">
        <section class="api-key-form-section">
          <div class="api-key-form-heading"><span>⚿</span><div><h3>基本信息</h3><p>设置令牌的基本信息</p></div></div>
          <label class="api-key-field"><strong>名称</strong><input type="text" placeholder="输入名称" /></label>
          <label class="api-key-field"><strong>分组</strong><select><option>选择一个分组</option><option>default</option><option>开发环境</option></select></label>
          <div class="api-key-field">
            <strong>过期时间</strong>
            <div class="api-key-expiry-row">
              <select><option>永不过期</option><option>指定日期</option></select>
              <input type="time" value="00:00" aria-label="过期时间" />
              <div class="api-key-expiry-presets">
                <button class="active" data-expiry-preset="forever">永不</button>
                <button data-expiry-preset="month">1 个月</button>
                <button data-expiry-preset="day">1 天</button>
                <button data-expiry-preset="hour">1 小时</button>
              </div>
            </div>
          </div>
          <label class="api-key-field"><strong>数量</strong><input type="number" min="1" value="1" /><small>一次性创建多个 API 密钥（名称将添加随机后缀）</small></label>
        </section>
        <section class="api-key-form-section">
          <div class="api-key-form-heading"><span>▣</span><div><h3>额度设置</h3><p>设置令牌可用额度和数量</p></div></div>
          <div class="api-key-toggle-row"><div><strong>无限配额</strong><span>为此 API 密钥启用无限配额</span></div><button class="toggle active" aria-label="无限配额"></button></div>
        </section>
        <details class="api-key-advanced">
          <summary><span>☷</span><div><strong>高级设置</strong><small>设置令牌的访问限制</small></div><b>⌄</b></summary>
          <div class="api-key-advanced-body">
            <label class="api-key-field"><strong>IP 限制</strong><input type="text" placeholder="例如：192.168.1.0/24" /></label>
          </div>
        </details>
      </div>
      <div class="drawer-actions">
        <button class="primary-button" data-save-api-key="true">保存更改</button>
      </div>
    `,
    "api-key-create-drawer",
  );
}

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

  const profileMenu = document.querySelector(".profile-menu");
  if (!profileMenu.contains(event.target)) {
    profileMenu.classList.remove("open");
    profileMenu.querySelector(".profile-trigger").setAttribute("aria-expanded", "false");
  }
});

function showToast(message) {
  document.querySelector(".app-toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "app-toast";
  toast.textContent = message;
  appShell.appendChild(toast);
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

function showRechargeDialog() {
  const dialog = document.createElement("dialog");
  dialog.className = "dashboard-modal recharge-modal";
  dialog.innerHTML = `
    <form method="dialog" class="dashboard-modal-panel recharge-flow-panel">
      <div class="dashboard-modal-head">
        <div><h2>充值</h2><p>选择金额和支付方式</p></div>
        <button class="picker-close" value="cancel" aria-label="关闭">×</button>
      </div>
      <div class="dashboard-modal-body recharge-body recharge-flow-content">
        <h3>金额</h3>
        <div class="amount-grid">
          ${[10, 20, 50, 100, 200, 500]
            .map(
              (amount) => `<button type="button" class="amount-option ${amount === 50 ? "active" : ""}" data-recharge-amount="${amount}">${amount}元</button>`,
            )
            .join("")}
        </div>
        <h3>自定义金额</h3>
        <div class="custom-amount-row">
          <input class="custom-amount-input" type="number" min="1" value="50" aria-label="自定义金额" />
          <div class="pending-amount"><span>待支付金额：</span><strong>¥<b id="pending-amount">50</b></strong></div>
        </div>
        <h3>付款方式</h3>
        <button type="button" class="payment-option active">
          <span class="payment-option-icon">◉</span>
          <span class="payment-option-label">微信 / 支付宝</span>
          <span class="payment-option-check">✓</span>
        </button>
      </div>
      <div class="dashboard-modal-actions">
        <button type="button" class="primary-button" data-confirm-recharge="true">确认付款</button>
      </div>
    </form>
  `;
  document.body.appendChild(dialog);
  dialog.addEventListener("close", () => dialog.remove());
  dialog.showModal();
}

function showPaymentDialog(amount) {
  const dialog = document.createElement("dialog");
  dialog.className = "dashboard-modal payment-modal";
  dialog.innerHTML = `
    <section class="dashboard-modal-panel recharge-flow-panel">
      <div class="dashboard-modal-head">
        <div><h2>扫码支付</h2><p>请使用手机 app 完成支付</p></div>
        <button class="picker-close" data-close-payment="true" aria-label="关闭">×</button>
      </div>
      <div class="recharge-flow-content payment-flow-content">
        <div class="payment-tabs">
          <button class="active" data-payment-tab="qr">▦ 二维码</button>
          <button data-payment-tab="detail">◷ 详情</button>
        </div>
        <div class="payment-panel active" data-payment-panel="qr">
          <div class="qr-code" aria-label="演示二维码">
            <span class="qr-finder top-left"></span>
            <span class="qr-finder top-right"></span>
            <span class="qr-finder bottom-left"></span>
          </div>
          <p class="payment-waiting">◔ 等待支付...</p>
          <strong>扫描聚合码</strong>
          <span>到期时间: 2026/6/1 10:46:33</span>
        </div>
        <div class="payment-panel payment-detail-panel" data-payment-panel="detail">
          <div><span>金额</span><strong class="payment-amount">¥${Number(amount).toFixed(2)}</strong></div>
          <div><span>订单编号</span><strong>dfa029f7_121 <button data-copy-order="true" aria-label="复制订单编号">⧉</button></strong></div>
          <div><span>付款方式</span><strong>聚合码</strong></div>
          <div><span>到期时间</span><strong>2026/6/1 10:46:33</strong></div>
        </div>
      </div>
    </section>
  `;
  document.body.appendChild(dialog);
  dialog.addEventListener("close", () => dialog.remove());
  dialog.showModal();
}

function showPaymentConfirmDialog(amount) {
  const dialog = document.createElement("dialog");
  dialog.className = "dashboard-modal payment-confirm-modal";
  dialog.innerHTML = `
    <section class="dashboard-modal-panel recharge-flow-panel">
      <div class="dashboard-modal-head">
        <div><h2>确认付款</h2><p>查看您的付款详情</p></div>
        <button class="picker-close" data-close-payment="true" aria-label="关闭">×</button>
      </div>
      <div class="payment-confirm-body recharge-flow-content">
        <div><span>充值金额</span><strong>¥${Number(amount).toFixed(2)}</strong></div>
        <div><span>您支付</span><strong>${Number(amount).toFixed(2)}</strong></div>
        <div><span>付款方式</span><strong><i>◉</i> 微信/支付宝</strong></div>
      </div>
      <div class="dashboard-modal-actions">
        <button class="primary-button" data-start-payment="${amount}">去支付</button>
      </div>
    </section>
  `;
  document.body.appendChild(dialog);
  dialog.addEventListener("close", () => dialog.remove());
  dialog.showModal();
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

function showMarketplaceFilter() {
  createDashboardDialog(
    "筛选模型",
    "按供应商、分组、类型和标签细化模型。",
    `
      <section class="marketplace-filter-modal">
        <div class="filter-block"><h4>分组⌃</h4><div><button type="button" class="active">所有分组</button><button type="button">default</button><button type="button">x0.6</button></div></div>
        <div class="filter-block"><h4>所有供应商⌃</h4><div><button type="button" class="active">所有供应商 11</button><button type="button">DeepSeek 2</button><button type="button">阿里巴巴 4</button><button type="button">Moonshot 2</button><button type="button">智谱 2</button><button type="button">MiniMax AI 1</button></div></div>
        <div class="filter-block"><h4>模型标签⌃</h4><div><button type="button" class="active">所有标签 11</button><button type="button">深度思考 9</button><button type="button">视觉理解 5</button><button type="button">文本生成 11</button></div></div>
        <div class="filter-block"><h4>定价类型⌃</h4><div><button type="button" class="active">所有模型 11</button><button type="button">按量计费 11</button></div></div>
      </section>
    `,
    `<button class="ghost-button" value="reset">重置</button><button class="primary-button" value="confirm">应用筛选器</button>`,
  );
}

function showBillingHistoryDialog() {
  const orders = [
    ["lenovo_75f4bae6387ef438_121", "2026-06-01 10:41:33", "¥1.00", "1"],
    ["lenovo_85c9aa0edfa029f7_121", "2026-06-01 10:31:33", "¥1.00", "1"],
    ["lenovo_0673b98a2e038b0a_121", "2026-06-01 10:31:08", "¥1.00", "1"],
    ["lenovo_81a9ee6833b0b7ef_121", "2026-06-01 10:29:17", "¥1.00", "1"],
    ["lenovo_384da29bc61f743c_121", "2026-05-31 22:16:40", "¥50.00", "50"],
    ["lenovo_b30c78de205a6f91_121", "2026-05-31 18:08:12", "¥20.00", "20"],
  ];
  const dialog = document.createElement("dialog");
  dialog.className = "dashboard-modal billing-modal";
  dialog.innerHTML = `
    <section class="dashboard-modal-panel billing-modal-panel">
      <div class="dashboard-modal-head">
        <div><h2>计费历史</h2><p>查看您的充值交易记录和付款历史</p></div>
        <button class="picker-close" data-close-payment="true" aria-label="关闭">×</button>
      </div>
      <div class="billing-toolbar">
        <label><span>⌕</span><input type="search" placeholder="按订单号搜索..." aria-label="按订单号搜索" /></label>
        <select aria-label="每页显示条数"><option>10 条/页</option><option>20 条/页</option></select>
      </div>
      <div class="billing-list">
        ${orders
          .map(
            ([orderId, time, amount, paid]) => `
              <article class="billing-card">
                <div class="billing-card-head">
                  <div><strong>${orderId}</strong><button data-billing-copy="${orderId}" aria-label="复制订单编号">⧉</button><span>${time}</span></div>
                  <em>待确认</em>
                </div>
                <div class="billing-card-grid">
                  <div><span>付款方式</span><strong>lenovo</strong></div>
                  <div><span>金额</span><strong>${amount}</strong></div>
                  <div><span>支付</span><strong class="billing-paid">${paid}</strong></div>
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
      <div class="billing-footer">
        <span>显示第 1-6 条，共 6</span>
        <div><button data-billing-page="prev" aria-label="上一页">‹</button><strong>1 / 1</strong><button data-billing-page="next" aria-label="下一页">›</button></div>
      </div>
    </section>
  `;
  document.body.appendChild(dialog);
  dialog.addEventListener("close", () => dialog.remove());
  dialog.showModal();
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
