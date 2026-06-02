const state = {
  smartMode: true,
  activeTool: null,
  panelOpen: true,
  manualTools: new Set(),
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
  "deepseek-v4-flash": { name: "DeepSeek V4 Flash", vendor: "DeepSeek", tags: ["高效", "日常任务"] },
  "deepseek-v4-pro": { name: "DeepSeek V4 Pro", vendor: "DeepSeek", tags: ["深度思考", "代码"] },
  "qwen3.6-plus": { name: "Qwen 3.6 Plus", vendor: "Qwen", tags: ["通用", "视觉理解"] },
  "qwen3.6-flash": { name: "Qwen 3.6 Flash", vendor: "Qwen", tags: ["快速", "视觉理解"] },
  "qwen3.6-max-preview": { name: "Qwen 3.6 Max Preview", vendor: "Qwen", tags: ["旗舰", "复杂任务"] },
  "kimi-k2.6": { name: "Kimi K2.6", vendor: "Moonshot", tags: ["Agent", "长上下文"] },
  "MiniMax-M2.5": { name: "MiniMax M2.5", vendor: "MiniMax", tags: ["生产力", "工具调用"] },
  "glm-5": { name: "GLM 5", vendor: "智谱", tags: ["代码", "Agent"] },
  "glm-5.1": { name: "GLM 5.1", vendor: "智谱", tags: ["长程任务", "代码"] },
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
        ${state.manualTools.has(tool.id) ? `<span class="tool-status manual">手动</span>` : ""}
        <span class="chevron">›</span>
      </button>
    `;
  }).join("");
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
      <button class="model-row${active ? " selected" : ""}" data-select-model="${modelId}">
        <span class="radio"><i></i></span>
        <span class="model-copy">
          <strong>${model.name}</strong>
          <small>${model.vendor} · ${model.tags.join(" · ")}</small>
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
    if (!state.smartMode) state.manualTools = new Set(tools.map((tool) => tool.id));
    if (state.smartMode) state.manualTools.clear();
    renderTools();
    showToast(state.smartMode ? "已开启智能模型匹配" : "已切换为手动选择");
  }

  if (target.dataset.openTool) openTool(target.dataset.openTool);

  if (target.dataset.backHome) showPage("home");

  if (target.dataset.selectModel) {
    const modelId = target.dataset.selectModel;
    state.selections[state.activeTool] = modelId;
    state.manualTools.add(state.activeTool);
    renderTools();
    openTool(state.activeTool);
    showToast(`已切换至 ${models[modelId].name}`);
  }

  if (target.dataset.restoreAuto) {
    state.manualTools.delete(state.activeTool);
    renderTools();
    showToast("已恢复自动匹配");
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

  if (target.matches(".settings-list .toggle")) {
    target.classList.toggle("active");
  }
});

renderTools();
setTimeout(() => {
  if (!state.panelOpen) notification.classList.add("show");
}, 900);
