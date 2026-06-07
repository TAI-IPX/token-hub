using System;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Windows;
using System.Windows.Input;
using TokenHubPanel.Models;

namespace TokenHubPanel.ViewModels
{
    public enum DemoState
    {
        Login,
        Configuring,
        SmartOff,
        SmartOn,
        Unconfigured,
        LowBalance,
        AutoDiscovery,
        ManualDiscovery,
        NewVersion,
        NoApp
    }

    public enum PanelPage
    {
        Home,
        Models,
        Settings
    }

    public class MainViewModel : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler? PropertyChanged;

        private void OnPropertyChanged([CallerMemberName] string? name = null)
            => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));

        // === State ===
        private DemoState _currentState = DemoState.SmartOff;
        public DemoState CurrentState
        {
            get => _currentState;
            set
            {
                _currentState = value;
                // Reset transient states on state switch
                _newVersionAvailable = value == DemoState.NewVersion;
                _noApps = value == DemoState.NoApp;
                _showSmartConfirmPending = false;
                OnPropertyChanged();
                OnPropertyChanged(nameof(IsLogin)); OnPropertyChanged(nameof(IsConfiguring));
                OnPropertyChanged(nameof(IsReady)); OnPropertyChanged(nameof(IsDiscovering));
                OnPropertyChanged(nameof(IsManualDiscovery)); OnPropertyChanged(nameof(IsAutoDiscovery));
                OnPropertyChanged(nameof(PanelHeight)); OnPropertyChanged(nameof(IsLoggedIn));
                OnPropertyChanged(nameof(ShowOnboarding)); OnPropertyChanged(nameof(ShowReadyContent));
                OnPropertyChanged(nameof(ShowFooter)); OnPropertyChanged(nameof(ShowAccountBar));
                OnPropertyChanged(nameof(IsNotLoggedIn));
                OnPropertyChanged(nameof(NewVersionAvailable)); OnPropertyChanged(nameof(ShowNewVersionBadge));
                OnPropertyChanged(nameof(NewVersionBadgeVisibility)); OnPropertyChanged(nameof(SettingsButtonVisibility));
                OnPropertyChanged(nameof(NoApps)); OnPropertyChanged(nameof(ShowNoAppsEmpty));
                OnPropertyChanged(nameof(NoAppsEmptyVisibility)); OnPropertyChanged(nameof(ToolListVisibility));
                OnPropertyChanged(nameof(SmartConfirmVisibility));
            }
        }

        private PanelPage _currentPage = PanelPage.Home;
        public PanelPage CurrentPage
        {
            get => _currentPage;
            set { _currentPage = value; OnPropertyChanged(); OnPropertyChanged(nameof(IsHomePage)); OnPropertyChanged(nameof(IsModelsPage)); OnPropertyChanged(nameof(IsSettingsPage)); }
        }

        private bool _smartMode;
        public bool IsSmartMode
        {
            get => _smartMode;
            set { _smartMode = value; OnPropertyChanged(); OnPropertyChanged(nameof(SmartToggleState)); OnPropertyChanged(nameof(SmartKnobOffset)); OnPropertyChanged(nameof(SmartTrackBackground)); OnPropertyChanged(nameof(ShowSmartConfirm)); OnPropertyChanged(nameof(IsSmartOff)); }
        }

        private double _balance = 128.5;
        public double Balance
        {
            get => _balance;
            set { _balance = value; OnPropertyChanged(); OnPropertyChanged(nameof(BalanceText)); OnPropertyChanged(nameof(BalanceStatus)); OnPropertyChanged(nameof(IsLowBalance)); OnPropertyChanged(nameof(ShowBalanceWarning)); OnPropertyChanged(nameof(BalanceWarningText)); OnPropertyChanged(nameof(BalanceBadgeVisibility)); OnPropertyChanged(nameof(BalanceBadgeText)); OnPropertyChanged(nameof(BalanceBadgeBrush)); }
        }

        public string BalanceText => $"可用额度 ¥{Balance:F2}";

        public bool IsLowBalance => Balance < 1;

        public bool ShowBalanceWarning => IsLowBalance && IsLoggedIn;

        public string BalanceWarningText => IsLowBalance ? "余额不足" : "";

        public Visibility BalanceBadgeVisibility => Balance < 10 ? Visibility.Visible : Visibility.Collapsed;

        public string BalanceBadgeText
        {
            get
            {
                if (Balance < 1) return "余额不足";
                if (Balance < 10) return "额度较低";
                return "";
            }
        }

        public string BalanceBadgeBrush
        {
            get
            {
                if (Balance < 1) return "#FFE4E1";
                return "#FFF0C2";
            }
        }

        public string BalanceStatus
        {
            get
            {
                if (Balance < 1) return "empty";
                if (Balance < 10) return "low";
                return "normal";
            }
        }

        private string? _selectedToolId;
        public string? SelectedToolId
        {
            get => _selectedToolId;
            set { _selectedToolId = value; OnPropertyChanged(); OnPropertyChanged(nameof(SelectedTool)); OnPropertyChanged(nameof(DetailToolName)); OnPropertyChanged(nameof(CurrentModels)); }
        }

        public AppTool? SelectedTool => Tools.FirstOrDefault(t => t.Id == SelectedToolId);

        public string DetailToolName => SelectedTool?.Name ?? "";

        // === Collections ===
        public ObservableCollection<AppTool> Tools { get; } = new();
        public ObservableCollection<ModelInfo> AllModels { get; } = new();

        public ObservableCollection<ModelInfo> CurrentModels
        {
            get
            {
                if (SelectedTool == null) return new ObservableCollection<ModelInfo>();
                return new ObservableCollection<ModelInfo>(
                    AllModels.Where(m => SelectedTool.ModelIds.Contains(m.Id)));
            }
        }

        public ObservableCollection<ModelInfo> SmartMatchedModels
        {
            get
            {
                var selectedId = SelectedToolId;
                if (selectedId != null && Selections.ContainsKey(selectedId))
                {
                    var modelId = Selections[selectedId];
                    var model = AllModels.FirstOrDefault(m => m.Id == modelId);
                    if (model != null) return new ObservableCollection<ModelInfo> { model };
                }
                return new ObservableCollection<ModelInfo>();
            }
        }

        // === Selections & Management ===
        public System.Collections.Generic.Dictionary<string, string> Selections { get; } = new();
        public System.Collections.Generic.Dictionary<string, string> Management { get; } = new();

        // === Computed Properties ===
        public bool IsLogin => CurrentState == DemoState.Login;
        public bool IsConfiguring => CurrentState == DemoState.Configuring;
        public bool IsReady => CurrentState == DemoState.SmartOff || CurrentState == DemoState.SmartOn
            || CurrentState == DemoState.Unconfigured || CurrentState == DemoState.LowBalance
            || CurrentState == DemoState.NewVersion || CurrentState == DemoState.NoApp;
        public bool IsDiscovering => CurrentState == DemoState.AutoDiscovery || CurrentState == DemoState.ManualDiscovery;
        public bool IsAutoDiscovery => CurrentState == DemoState.AutoDiscovery;
        public bool IsManualDiscovery => CurrentState == DemoState.ManualDiscovery;
        public bool IsHomePage => CurrentPage == PanelPage.Home;
        public bool IsModelsPage => CurrentPage == PanelPage.Models;
        public bool IsSettingsPage => CurrentPage == PanelPage.Settings;
        public bool IsNotLoggedIn => !IsLoggedIn;

        public bool IsLoggedIn
        {
            get
            {
                return CurrentState != DemoState.Login;
            }
        }

        public bool ShowOnboarding => !IsReady && !IsDiscovering;
        public bool ShowReadyContent => IsReady;
        public bool ShowFooter => IsReady;
        public bool ShowAccountBar => IsReady;

        public int PanelHeight
        {
            get
            {
                if (IsLogin || IsConfiguring || IsDiscovering) return 318;
                return 384;
            }
        }

        // === New Version & No-App State ===
        private bool _newVersionAvailable;
        public bool NewVersionAvailable
        {
            get => _newVersionAvailable;
            set { _newVersionAvailable = value; OnPropertyChanged(); OnPropertyChanged(nameof(ShowNewVersionBadge)); }
        }

        private bool _noApps;
        public bool NoApps
        {
            get => _noApps;
            set { _noApps = value; OnPropertyChanged(); OnPropertyChanged(nameof(ShowNoAppsEmpty)); }
        }

        private bool _showSmartConfirmPending;
        public bool ShowSmartConfirm
        {
            get => _showSmartConfirmPending;
            set { _showSmartConfirmPending = value; OnPropertyChanged(); OnPropertyChanged(nameof(SmartConfirmVisibility)); }
        }

        // ShowNewVersionBadge: only when logged in AND new version available
        public bool ShowNewVersionBadge => IsLoggedIn && NewVersionAvailable;
        public Visibility NewVersionBadgeVisibility => ShowNewVersionBadge ? Visibility.Visible : Visibility.Collapsed;

        // Settings button hidden when not logged in
        public Visibility SettingsButtonVisibility => IsLoggedIn ? Visibility.Visible : Visibility.Collapsed;

        // No-app empty state
        public bool ShowNoAppsEmpty => NoApps;
        public Visibility NoAppsEmptyVisibility => NoApps ? Visibility.Visible : Visibility.Collapsed;
        public Visibility ToolListVisibility => !NoApps ? Visibility.Visible : Visibility.Collapsed;

        // Smart confirm overlay
        public Visibility SmartConfirmVisibility => ShowSmartConfirm ? Visibility.Visible : Visibility.Collapsed;

        public Thickness SmartKnobOffset => IsSmartMode
            ? new Thickness(23, 3, 0, 0)
            : new Thickness(3, 3, 0, 0);

        public string SmartTrackBackground => IsSmartMode ? "#005FB8" : "#8A929D";

        public string SmartToggleState => IsSmartMode ? "On" : "Off";
        public bool IsSmartOff => !IsSmartMode;

        // === Visibility helpers for discovery ===
        public Visibility NotificationVisibility => IsDiscovering ? Visibility.Visible : Visibility.Collapsed;
        public Visibility AutoNotificationVisibility => IsAutoDiscovery ? Visibility.Visible : Visibility.Collapsed;
        public Visibility ManualNotificationVisibility => IsManualDiscovery ? Visibility.Visible : Visibility.Collapsed;
        public Visibility SmartBadgeVisibility => IsSmartMode ? Visibility.Visible : Visibility.Collapsed;
        public Visibility NormalBadgeVisibility => !IsSmartMode ? Visibility.Visible : Visibility.Collapsed;

        // === Phone ===
        private string _phoneNumber = "159*****788";
        public string PhoneNumber
        {
            get => _phoneNumber;
            set { _phoneNumber = value; OnPropertyChanged(); }
        }

        // === Recharge ===
        private double _rechargeAmount = 50;
        public double RechargeAmount
        {
            get => _rechargeAmount;
            set
            {
                _rechargeAmount = value;
                OnPropertyChanged();
                OnPropertyChanged(nameof(RechargeAmountText));
            }
        }
        public string RechargeAmountText => $"¥{RechargeAmount:F2}";
        public string RechargeOrderId { get; set; } = "lenovo_75f4bae6_121";

        // === Discovery ===
        private string _discoveryToolName = "QClaw";
        public string DiscoveryToolName
        {
            get => _discoveryToolName;
            set { _discoveryToolName = value; OnPropertyChanged(); }
        }

        private string _discoveryModelName = "DeepSeek V4 Flash";
        public string DiscoveryModelName
        {
            get => _discoveryModelName;
            set { _discoveryModelName = value; OnPropertyChanged(); }
        }

        public ObservableCollection<string> DiscoveryTags { get; } = new();

        // === Commands ===
        public ICommand ToggleSmartCommand { get; }
        public ICommand SelectToolCommand { get; }
        public ICommand BackToHomeCommand { get; }
        public ICommand LoginCommand { get; }
        public ICommand OpenSettingsCommand { get; }
        public ICommand DismissNotificationCommand { get; }
        public ICommand GoToToolCommand { get; }
        public ICommand SelectModelCommand { get; }
        public ICommand SetStateCommand { get; }
        public ICommand RefreshAppsCommand { get; }
        public ICommand RechargeCommand { get; }

        public MainViewModel()
        {
            InitializeData();
            InitializeCommands();
            SetState(DemoState.SmartOff);
        }

        private void InitializeData()
        {
            // Define models
            AllModels.Add(new ModelInfo { Id = "deepseek-v4-flash", Name = "DeepSeek V4 Flash", Vendor = "DeepSeek", InputPrice = "¥0.60", OutputPrice = "¥1.20", CachePrice = "¥0.12" });
            AllModels.Add(new ModelInfo { Id = "deepseek-v4-pro", Name = "DeepSeek V4 Pro", Vendor = "DeepSeek", InputPrice = "¥7.20", OutputPrice = "¥14.40", CachePrice = "¥1.44" });
            AllModels.Add(new ModelInfo { Id = "qwen3.6-plus", Name = "Qwen 3.6 Plus", Vendor = "Qwen", InputPrice = "¥1.20", OutputPrice = "¥7.20", CachePrice = "¥0.24" });
            AllModels.Add(new ModelInfo { Id = "qwen3.6-flash", Name = "Qwen 3.6 Flash", Vendor = "Qwen", InputPrice = "¥0.72", OutputPrice = "¥4.32", CachePrice = "¥0.14" });
            AllModels.Add(new ModelInfo { Id = "qwen3.6-max-preview", Name = "Qwen 3.6 Max Preview", Vendor = "Qwen", InputPrice = "¥5.40", OutputPrice = "¥32.40", CachePrice = "¥1.08" });
            AllModels.Add(new ModelInfo { Id = "kimi-k2.6", Name = "Kimi K2.6", Vendor = "Moonshot", InputPrice = "¥3.90", OutputPrice = "¥16.20", CachePrice = "¥0.78" });
            AllModels.Add(new ModelInfo { Id = "MiniMax-M2.5", Name = "MiniMax M2.5", Vendor = "MiniMax", InputPrice = "¥1.26", OutputPrice = "¥5.04", CachePrice = "¥0.25" });
            AllModels.Add(new ModelInfo { Id = "glm-5", Name = "GLM 5", Vendor = "智谱", InputPrice = "¥2.40", OutputPrice = "¥10.80", CachePrice = "¥0.48" });
            AllModels.Add(new ModelInfo { Id = "glm-5.1", Name = "GLM 5.1", Vendor = "智谱", InputPrice = "¥3.60", OutputPrice = "¥14.40", CachePrice = "¥0.72" });

            // Assign tags
            AllModels.First(m => m.Id == "deepseek-v4-flash").Tags.Add("文本生成");
            AllModels.First(m => m.Id == "deepseek-v4-flash").Tags.Add("轻量快速");
            AllModels.First(m => m.Id == "deepseek-v4-pro").Tags.Add("深度思考");
            AllModels.First(m => m.Id == "deepseek-v4-pro").Tags.Add("文本生成");
            AllModels.First(m => m.Id == "qwen3.6-plus").Tags.Add("文本生成");
            AllModels.First(m => m.Id == "qwen3.6-plus").Tags.Add("视觉理解");
            AllModels.First(m => m.Id == "qwen3.6-flash").Tags.Add("文本生成");
            AllModels.First(m => m.Id == "qwen3.6-flash").Tags.Add("轻量快速");
            AllModels.First(m => m.Id == "qwen3.6-max-preview").Tags.Add("深度思考");
            AllModels.First(m => m.Id == "qwen3.6-max-preview").Tags.Add("视觉理解");
            AllModels.First(m => m.Id == "kimi-k2.6").Tags.Add("深度思考");
            AllModels.First(m => m.Id == "kimi-k2.6").Tags.Add("文本生成");
            AllModels.First(m => m.Id == "MiniMax-M2.5").Tags.Add("文本生成");
            AllModels.First(m => m.Id == "MiniMax-M2.5").Tags.Add("工具调用");
            AllModels.First(m => m.Id == "glm-5").Tags.Add("文本生成");
            AllModels.First(m => m.Id == "glm-5").Tags.Add("工具调用");
            AllModels.First(m => m.Id == "glm-5.1").Tags.Add("深度思考");
            AllModels.First(m => m.Id == "glm-5.1").Tags.Add("文本生成");

            // Define tools
            var tool1 = new AppTool { Id = "openclaw", Name = "Open Claw", IconPath = "Assets/app-openclaw@3x.png", Mark = "OC" };
            tool1.ModelIds.Add("deepseek-v4-flash");
            tool1.ModelIds.Add("deepseek-v4-pro");
            tool1.ModelIds.Add("qwen3.6-plus");
            Tools.Add(tool1);

            var tool2 = new AppTool { Id = "qclaw", Name = "Q Claw", IconPath = "Assets/app-qclaw@3x.png", Mark = "QC" };
            tool2.ModelIds.Add("deepseek-v4-flash");
            tool2.ModelIds.Add("qwen3.6-flash");
            tool2.ModelIds.Add("kimi-k2.6");
            Tools.Add(tool2);

            var tool3 = new AppTool { Id = "claude-code", Name = "Claude Code", IconPath = "Assets/app-claude@3x.png", Mark = "CC" };
            tool3.ModelIds.Add("deepseek-v4-pro");
            tool3.ModelIds.Add("glm-5.1");
            tool3.ModelIds.Add("qwen3.6-max-preview");
            Tools.Add(tool3);

            var tool4 = new AppTool { Id = "workbuddy", Name = "OpenClaw", IconPath = "Assets/app-openclaw2@3x.png", Mark = "WB" };
            tool4.ModelIds.Add("qwen3.6-plus");
            tool4.ModelIds.Add("kimi-k2.6");
            tool4.ModelIds.Add("MiniMax-M2.5");
            Tools.Add(tool4);

            var tool5 = new AppTool { Id = "hermes", Name = "Hermes", IconPath = "Assets/app-openclaw2@3x.png", Mark = "HM" };
            tool5.ModelIds.Add("kimi-k2.6");
            tool5.ModelIds.Add("deepseek-v4-pro");
            tool5.ModelIds.Add("glm-5");
            Tools.Add(tool5);

            // Default selections
            Selections["openclaw"] = "deepseek-v4-flash";
            Selections["claude-code"] = "deepseek-v4-pro";
            Selections["qclaw"] = "deepseek-v4-flash";
            Selections["workbuddy"] = "qwen3.6-plus";
            Selections["hermes"] = "kimi-k2.6";

            // Default management
            foreach (var tool in Tools)
                Management[tool.Id] = "token-hub";

            // Discovery notification defaults
            DiscoveryTags.Add("文本生成");
            DiscoveryTags.Add("轻量快速");
            DiscoveryTags.Add("DeepSeek");
        }

        private void InitializeCommands()
        {
            ToggleSmartCommand = new RelayCommand(_ =>
            {
                IsSmartMode = !IsSmartMode;
                if (IsSmartMode)
                {
                    foreach (var tool in Tools)
                    {
                        if (Selections.ContainsKey(tool.Id) && tool.ModelIds.Count > 0)
                            Selections[tool.Id] = tool.ModelIds[0];
                    }
                }
                OnPropertyChanged(nameof(GetModelName));
                RefreshToolList();
            });

            SelectToolCommand = new RelayCommand(param =>
            {
                if (param is string toolId)
                {
                    SelectedToolId = toolId;
                    OnPropertyChanged(nameof(CurrentModels));
                    CurrentPage = PanelPage.Models;
                }
            });

            BackToHomeCommand = new RelayCommand(_ =>
            {
                CurrentPage = PanelPage.Home;
            });

            LoginCommand = new RelayCommand(_ =>
            {
                CurrentState = DemoState.Configuring;
                // Auto-transition after 3 seconds
                var timer = new System.Timers.Timer(3000) { AutoReset = false };
                timer.Elapsed += (s, e) =>
                {
                    Application.Current.Dispatcher.Invoke(() =>
                    {
                        CurrentState = DemoState.SmartOff;
                    });
                    timer.Dispose();
                };
                timer.Start();
            });

            OpenSettingsCommand = new RelayCommand(_ =>
            {
                CurrentPage = PanelPage.Settings;
            });

            DismissNotificationCommand = new RelayCommand(_ =>
            {
                if (IsDiscovering)
                {
                    CurrentState = DemoState.SmartOff;
                }
            });

            GoToToolCommand = new RelayCommand(param =>
            {
                if (param is string toolId)
                {
                    SelectedToolId = toolId;
                    OnPropertyChanged(nameof(CurrentModels));
                    CurrentPage = PanelPage.Models;
                    if (IsDiscovering)
                        CurrentState = DemoState.SmartOff;
                }
            });

            SelectModelCommand = new RelayCommand(param =>
            {
                if (param is string modelId && SelectedToolId != null)
                {
                    Selections[SelectedToolId] = modelId;
                    if (Management[SelectedToolId] == "unconfigured")
                        Management[SelectedToolId] = "token-hub";
                    RefreshToolList();
                    OnPropertyChanged(nameof(CurrentModels));
                }
            });

            SetStateCommand = new RelayCommand(param =>
            {
                if (param is string stateName)
                {
                    if (Enum.TryParse<DemoState>(stateName, true, out var state))
                        SetState(state);
                }
            });

            RefreshAppsCommand = new RelayCommand(_ =>
            {
                // Refresh visual state
                RefreshToolList();
            });

            RechargeCommand = new RelayCommand(_ =>
            {
                Balance += 50;
                OnPropertyChanged(nameof(BalanceText));
                OnPropertyChanged(nameof(BalanceBadgeVisibility));
                OnPropertyChanged(nameof(BalanceBadgeText));
                OnPropertyChanged(nameof(BalanceBadgeBrush));
                OnPropertyChanged(nameof(ShowBalanceWarning));
                OnPropertyChanged(nameof(IsLowBalance));
            });
        }

        public void SetState(DemoState state)
        {
            CurrentPage = PanelPage.Home;

            switch (state)
            {
                case DemoState.Login:
                    CurrentState = DemoState.Login;
                    IsSmartMode = false;
                    Balance = 128.5;
                    ResetSelections();
                    break;

                case DemoState.Configuring:
                    CurrentState = DemoState.Configuring;
                    IsSmartMode = false;
                    Balance = 128.5;
                    ResetSelections();
                    break;

                case DemoState.SmartOff:
                    CurrentState = DemoState.SmartOff;
                    IsSmartMode = false;
                    Balance = 128.5;
                    ResetSelections();
                    break;

                case DemoState.SmartOn:
                    CurrentState = DemoState.SmartOn;
                    IsSmartMode = true;
                    Balance = 128.5;
                    ResetSelections();
                    foreach (var tool in Tools)
                        if (Selections.ContainsKey(tool.Id) && tool.ModelIds.Count > 0)
                            Selections[tool.Id] = tool.ModelIds[0];
                    break;

                case DemoState.Unconfigured:
                    CurrentState = DemoState.Unconfigured;
                    IsSmartMode = false;
                    Balance = 128.5;
                    foreach (var tool in Tools)
                    {
                        Management[tool.Id] = "unconfigured";
                        if (Selections.ContainsKey(tool.Id) && tool.ModelIds.Count > 0)
                            Selections[tool.Id] = tool.ModelIds[0];
                    }
                    break;

                case DemoState.LowBalance:
                    CurrentState = DemoState.LowBalance;
                    IsSmartMode = false;
                    Balance = 0.8;
                    ResetSelections();
                    break;

                case DemoState.AutoDiscovery:
                    CurrentState = DemoState.AutoDiscovery;
                    IsSmartMode = true;
                    Balance = 128.5;
                    ResetSelections();
                    DiscoveryToolName = "QClaw";
                    DiscoveryModelName = "DeepSeek V4 Flash";
                    DiscoveryTags.Clear();
                    DiscoveryTags.Add("文本生成");
                    DiscoveryTags.Add("轻量快速");
                    DiscoveryTags.Add("DeepSeek");
                    Tools.First(t => t.Id == "qclaw").IsNew = true;
                    break;

                case DemoState.ManualDiscovery:
                    CurrentState = DemoState.ManualDiscovery;
                    IsSmartMode = false;
                    Balance = 128.5;
                    ResetSelections();
                    DiscoveryToolName = "QClaw";
                    DiscoveryModelName = "DeepSeek V4 Flash";
                    Tools.First(t => t.Id == "qclaw").IsNew = true;
                    break;
            }

            RefreshToolList();
        }

        private void ResetSelections()
        {
            foreach (var tool in Tools)
                Management[tool.Id] = "token-hub";
            Selections["openclaw"] = "deepseek-v4-flash";
            Selections["claude-code"] = "deepseek-v4-pro";
            Selections["qclaw"] = "deepseek-v4-flash";
            Selections["workbuddy"] = "qwen3.6-plus";
            Selections["hermes"] = "kimi-k2.6";
            foreach (var tool in Tools)
                tool.IsNew = false;
        }

        private void RefreshToolList()
        {
            OnPropertyChanged(nameof(GetModelName));
            var temp = SelectedToolId;
            SelectedToolId = null;
            SelectedToolId = temp;
            OnPropertyChanged(nameof(CurrentModels));
        }

        public string GetModelName(string toolId)
        {
            if (Management.TryGetValue(toolId, out var mgmt) && mgmt == "unconfigured")
                return "待选择模型";
            if (Selections.TryGetValue(toolId, out var modelId))
            {
                var model = AllModels.FirstOrDefault(m => m.Id == modelId);
                return model?.Name ?? "未选择";
            }
            return "未选择";
        }

        public string GetSelectedModelId(string toolId)
        {
            if (!IsSmartMode && Selections.TryGetValue(toolId, out var modelId))
                return modelId;
            if (IsSmartMode && Selections.TryGetValue(toolId, out var smartId))
                return smartId;
            return string.Empty;
        }

        public string GetModelNameForDisplay(string modelId)
        {
            var model = AllModels.FirstOrDefault(m => m.Id == modelId);
            return model?.Name ?? "";
        }
    }
}
