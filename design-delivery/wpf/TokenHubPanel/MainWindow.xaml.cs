using System;
using System.Diagnostics;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;
using System.Windows.Threading;
using TokenHubPanel.Models;
using TokenHubPanel.ViewModels;

namespace TokenHubPanel
{
    public partial class MainWindow : Window
    {
        private readonly MainViewModel _vm;
        private DemoSwitcherWindow? _demoSwitcher;
        private DispatcherTimer? _configTimer;
        private DispatcherTimer? _toastTimer;
        private bool _syncingDemoState;

        // Onboarding sub-step (only meaningful while CurrentState == Login)
        private enum OnbStep { Login, AuthPending, FirstRun, ReadyToConfig }
        private OnbStep _onbStep = OnbStep.Login;

        private static Brush BrushFromHex(string hex) =>
            (Brush)(new BrushConverter().ConvertFromString(hex) ?? Brushes.Transparent);

        public MainWindow()
        {
            InitializeComponent();
            _vm = (MainViewModel)DataContext;

            SubscribeViewModelEvents();
            InitializeUI();
            Loaded += MainWindow_Loaded;
        }

        private void SubscribeViewModelEvents()
        {
            _vm.PropertyChanged += (s, e) =>
            {
                switch (e.PropertyName)
                {
                    case nameof(MainViewModel.CurrentState):
                        OnStateChanged();
                        break;
                    case nameof(MainViewModel.IsSmartMode):
                        UpdateToolListModelNames();
                        break;
                    case nameof(MainViewModel.CurrentPage):
                        UpdatePageVisibility();
                        break;
                    case nameof(MainViewModel.BalanceBadgeVisibility):
                    case nameof(MainViewModel.BalanceBadgeText):
                    case nameof(MainViewModel.BalanceBadgeBrush):
                        UpdateBalanceBadge();
                        break;
                    case nameof(MainViewModel.SmartConfirmVisibility):
                        AnimateSmartConfirm(_vm.ShowSmartConfirm);
                        break;
                }
            };
        }

        private void InitializeUI()
        {
            UpdatePageVisibility();
            UpdateNotificationVisibility();
            UpdateBalanceBadge();
            OnStateChanged();
        }

        private void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            PositionNearTray();
            ShowDemoSwitcher();
        }

        private void PositionNearTray()
        {
            var workArea = SystemParameters.WorkArea;
            Left = workArea.Right - ActualWidth - 24;
            Top = workArea.Bottom - ActualHeight - 24;
        }

        private void ShowDemoSwitcher()
        {
            if (_demoSwitcher != null)
                return;

            _demoSwitcher = new DemoSwitcherWindow(this);
            _demoSwitcher.Show();
        }

        private void Window_SizeChanged(object sender, SizeChangedEventArgs e)
        {
            if (IsLoaded)
                PositionNearTray();
        }

        private void InnerClipBorder_SizeChanged(object sender, SizeChangedEventArgs e)
        {
            ((Border)sender).Clip = new RectangleGeometry(
                new Rect(0, 0, e.NewSize.Width, e.NewSize.Height), 7, 7);
        }

        private void OnStateChanged()
        {
            // Entering Login state from a demo switch resets onboarding to the login step.
            // (The auth-pending sub-step does not change CurrentState, so it won't be reset here.)
            if (_vm.CurrentState == DemoState.Login)
                _onbStep = OnbStep.Login;

            UpdatePanelHeight();
            UpdatePanelStateVisibility();
            UpdateToolListModelNames();
            UpdateNotificationVisibility();
            UpdateBalanceBadge();
            StartConfigTimerIfNeeded();
        }

        private void UpdatePanelHeight()
        {
            var state = _vm.CurrentState;
            var isDiscovery = state == DemoState.AutoDiscovery || state == DemoState.ManualDiscovery;

            PanelBorder.Width = isDiscovery ? 364 : 440;
            PanelBorder.Height = isDiscovery
                ? double.NaN
                : (state == DemoState.Login || state == DemoState.Configuring ? 318 : 384);
            PanelBorder.BorderThickness = isDiscovery ? new Thickness(0) : new Thickness(1);
            PanelBorder.Background = isDiscovery
                ? Brushes.Transparent
                : BrushFromHex("#F0F8FBFF");
            PanelBorder.Effect = isDiscovery ? null : (System.Windows.Media.Effects.Effect)FindResource("PanelShadow");
        }

        private void UpdatePanelStateVisibility()
        {
            var isLogin = _vm.CurrentState == DemoState.Login;
            var isConfiguring = _vm.CurrentState == DemoState.Configuring;
            var isReady = _vm.IsReady;
            var isDiscovering = _vm.IsDiscovering;

            UpdateTitleBarVisibility();
            ContentHost.Visibility = isDiscovering ? Visibility.Collapsed : Visibility.Visible;

            // Onboarding sub-panels (only when in Login state)
            LoginPanel.Visibility = (isLogin && _onbStep == OnbStep.Login) ? Visibility.Visible : Visibility.Collapsed;
            AuthPendingPanel.Visibility = (isLogin && _onbStep == OnbStep.AuthPending) ? Visibility.Visible : Visibility.Collapsed;
            FirstRunPanel.Visibility = (isLogin && _onbStep == OnbStep.FirstRun) ? Visibility.Visible : Visibility.Collapsed;
            ReadyToConfigPanel.Visibility = (isLogin && _onbStep == OnbStep.ReadyToConfig) ? Visibility.Visible : Visibility.Collapsed;
            ConfiguringPanel.Visibility = isConfiguring ? Visibility.Visible : Visibility.Collapsed;
            ReadyContent.Visibility = isReady ? Visibility.Visible : Visibility.Collapsed;

            // Footer: account bar only when ready (logged-out footer is permanently hidden per design)
            AccountFooter.Visibility = isReady ? Visibility.Visible : Visibility.Collapsed;

            // Progress animations
            if (isConfiguring)
                StartProgressAnimation();
            else
                StopProgressAnimation();

            if (isLogin && _onbStep == OnbStep.AuthPending)
                StartAuthProgressAnimation();
            else
                StopAuthProgressAnimation();
        }

        private void StartConfigTimerIfNeeded()
        {
            // Clear any existing timers
            _configTimer?.Stop();

            if (_vm.CurrentState == DemoState.Configuring)
            {
                _configTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(3) };
                _configTimer.Tick += (s, e) =>
                {
                    _configTimer?.Stop();
                    _vm.SetState(DemoState.SmartOff);
                };
                _configTimer.Start();
            }
        }

        private void StartProgressAnimation()
        {
            StopProgressAnimation();

            var anim = new ThicknessAnimation
            {
                From = new Thickness(-72, 0, 0, 0),
                To = new Thickness(168, 0, 0, 0),
                Duration = TimeSpan.FromSeconds(1.6),
                AutoReverse = true,
                RepeatBehavior = RepeatBehavior.Forever
            };

            ProgressBarFill.BeginAnimation(Border.MarginProperty, anim);
        }

        private void StopProgressAnimation()
        {
            ProgressBarFill.BeginAnimation(Border.MarginProperty, null);
        }

        private void StartAuthProgressAnimation()
        {
            StopAuthProgressAnimation();
            var anim = new ThicknessAnimation
            {
                From = new Thickness(-72, 0, 0, 0),
                To = new Thickness(168, 0, 0, 0),
                Duration = TimeSpan.FromSeconds(1.6),
                AutoReverse = true,
                RepeatBehavior = RepeatBehavior.Forever
            };
            AuthProgressFill.BeginAnimation(Border.MarginProperty, anim);
        }

        private void StopAuthProgressAnimation()
        {
            AuthProgressFill.BeginAnimation(Border.MarginProperty, null);
        }

        private void UpdatePageVisibility()
        {
            var page = _vm.CurrentPage;
            HomePage.Visibility     = page == PanelPage.Home     ? Visibility.Visible : Visibility.Collapsed;
            ModelsPage.Visibility   = page == PanelPage.Models   ? Visibility.Visible : Visibility.Collapsed;
            SettingsPage.Visibility = page == PanelPage.Settings ? Visibility.Visible : Visibility.Collapsed;
            UpdateTitleBarVisibility();

            UIElement? target = page switch
            {
                PanelPage.Home     => HomePage,
                PanelPage.Models   => ModelsPage,
                PanelPage.Settings => SettingsPage,
                _                  => null
            };
            if (target != null) FadePage(target);

            if (page == PanelPage.Models)
                Dispatcher.BeginInvoke((Action)SyncCurrentModelSelection, DispatcherPriority.Loaded);
        }

        private void UpdateTitleBarVisibility()
        {
            TitleBarBorder.Visibility =
                !_vm.IsDiscovering && _vm.CurrentPage == PanelPage.Home
                    ? Visibility.Visible
                    : Visibility.Collapsed;
        }

        private static void FadePage(UIElement target)
        {
            target.Opacity = 0;
            target.BeginAnimation(OpacityProperty,
                new DoubleAnimation(0, 1, TimeSpan.FromMilliseconds(160)));
        }

        private void AnimateSmartConfirm(bool show)
        {
            if (show)
            {
                SmartConfirmPanel.Opacity = 0;
                SmartConfirmPanel.Visibility = Visibility.Visible;
                SmartConfirmPanel.BeginAnimation(OpacityProperty,
                    new DoubleAnimation(0, 1, TimeSpan.FromMilliseconds(160)));
            }
            else
            {
                var fadeOut = new DoubleAnimation(1, 0, TimeSpan.FromMilliseconds(120));
                fadeOut.Completed += (_, _) => SmartConfirmPanel.Visibility = Visibility.Collapsed;
                SmartConfirmPanel.BeginAnimation(OpacityProperty, fadeOut);
            }
        }

        private void UpdateNotificationVisibility()
        {
            bool show = _vm.IsDiscovering;
            NotificationPanel.Visibility = show ? Visibility.Visible : Visibility.Collapsed;

            AutoNotificationBody.Visibility = _vm.IsAutoDiscovery ? Visibility.Visible : Visibility.Collapsed;
            ManualNotificationBody.Visibility = _vm.IsManualDiscovery ? Visibility.Visible : Visibility.Collapsed;
            NotificationActions.Visibility = _vm.IsManualDiscovery ? Visibility.Visible : Visibility.Collapsed;
        }

        private void UpdateBalanceBadge()
        {
            bool visible = _vm.BalanceBadgeVisibility == Visibility.Visible;
            BalanceBadge.Visibility = visible ? Visibility.Visible : Visibility.Collapsed;

            if (visible)
            {
                BalanceBadgeText.Text = _vm.BalanceBadgeText;
                string bgColor = _vm.BalanceBadgeBrush;
                BalanceBadge.Background = BrushFromHex(bgColor);

                string fgColor = _vm.Balance < 1 ? "#B42318" : "#8A5700";
                BalanceBadgeText.Foreground = BrushFromHex(fgColor);
            }
        }

        private void UpdateToolListModelNames()
        {
            foreach (var item in _vm.Tools)
            {
                var container = ToolListControl.ItemContainerGenerator.ContainerFromItem(item);
                if (container != null)
                    SetToolModelName(container, item);
            }
        }

        private void SetToolModelName(DependencyObject parent, AppTool tool)
        {
            int count = VisualTreeHelper.GetChildrenCount(parent);
            for (int i = 0; i < count; i++)
            {
                var child = VisualTreeHelper.GetChild(parent, i);
                if (child is ContentPresenter cp)
                {
                    if (VisualTreeHelper.GetChildrenCount(cp) > 0)
                    {
                        var templateRoot = VisualTreeHelper.GetChild(cp, 0);
                        SetToolModelName(templateRoot, tool);
                    }
                }
                else if (child is TextBlock tb && tb.Name == "ModelNameText")
                {
                    tb.Text = _vm.GetModelName(tool.Id);
                    return;
                }
                else
                {
                    SetToolModelName(child, tool);
                }
            }
        }

        // ======= EVENT HANDLERS =======

        private void StateCombo_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (!IsLoaded || _syncingDemoState) return;
            var idx = ((ComboBox)sender).SelectedIndex;
            ApplyDemoStateByIndex(idx);
        }

        public void SetDemoStateByIndex(int idx)
        {
            if (StateCombo.SelectedIndex != idx)
            {
                _syncingDemoState = true;
                StateCombo.SelectedIndex = idx;
                _syncingDemoState = false;
            }

            ApplyDemoStateByIndex(idx);
        }

        private void ApplyDemoStateByIndex(int idx)
        {
            var state = idx switch
            {
                0 => DemoState.Login,
                1 => DemoState.Configuring,
                2 => DemoState.SmartOff,
                3 => DemoState.SmartOn,
                4 => DemoState.Unconfigured,
                5 => DemoState.LowBalance,
                6 => DemoState.AutoDiscovery,
                7 => DemoState.ManualDiscovery,
                8 => DemoState.NewVersion,
                9 => DemoState.NoApp,
                _ => DemoState.SmartOff
            };
            _vm.SetState(state);
        }

        private void SmartToggle_PreviewMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            e.Handled = true;
            ToggleSmartModeWithConfirm();
        }

        private void SmartToggle_PreviewKeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key != Key.Space && e.Key != Key.Enter)
                return;

            e.Handled = true;
            ToggleSmartModeWithConfirm();
        }

        private void ToggleSmartModeWithConfirm()
        {
            if (_vm.IsSmartMode)
            {
                // Turn OFF directly
                _vm.ShowSmartConfirm = false;
                _vm.ToggleSmartCommand.Execute(null);
            }
            else
            {
                // Turn ON → show secondary confirm first
                _vm.ShowSmartConfirm = true;
            }
        }

        private void ConfirmSmartMatch_Click(object sender, RoutedEventArgs e)
        {
            _vm.ShowSmartConfirm = false;
            if (!_vm.IsSmartMode)
                _vm.ToggleSmartCommand.Execute(null);
        }

        private void CancelSmartConfirm_Click(object sender, RoutedEventArgs e)
        {
            _vm.ShowSmartConfirm = false;
        }

        private void LoginButton_Click(object sender, RoutedEventArgs e)
        {
            // Login → auth-pending (waiting for confirmation) → auto-complete after 3s
            _onbStep = OnbStep.AuthPending;
            UpdatePanelStateVisibility();
            _configTimer?.Stop();
            _configTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(3) };
            _configTimer.Tick += (s, ev) =>
            {
                _configTimer?.Stop();
                _onbStep = OnbStep.Login;
                _vm.SetState(DemoState.SmartOff);
            };
            _configTimer.Start();
        }

        private void LoginFromFooter_Click(object sender, RoutedEventArgs e)
        {
            _vm.SetState(DemoState.Login);
        }

        private void StartOnboarding_Click(object sender, RoutedEventArgs e)
        {
            // first-run → ready-to-config (自动配置 page)
            _onbStep = OnbStep.ReadyToConfig;
            UpdatePanelStateVisibility();
        }

        private void ConfigureHub_Click(object sender, RoutedEventArgs e)
        {
            // ready-to-config → configuring → auto-complete (handled by StartConfigTimerIfNeeded)
            _onbStep = OnbStep.Login;
            _vm.SetState(DemoState.Configuring);
        }

        private void SettingsButton_Click(object sender, RoutedEventArgs e)
        {
            _vm.CurrentPage = PanelPage.Settings;
        }

        private void CheckUpdate_Click(object sender, RoutedEventArgs e)
        {
            if (sender is not Button btn) return;
            btn.IsEnabled = false;
            var original = btn.Content;
            btn.Content = "检查中…";
            var timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1.5) };
            timer.Tick += (s, args) =>
            {
                timer.Stop();
                btn.IsEnabled = true;
                btn.Content = original;
                ShowToast("当前已是最新版本");
            };
            timer.Start();
        }

        private void DoUpdate_Click(object sender, RoutedEventArgs e)
        {
            _vm.NewVersionAvailable = false;
            ShowToast("正在后台更新，完成后自动重启");
        }

        private void ShowToast(string message)
        {
            _toastTimer?.Stop();
            ToastText.Text = message;
            ToastBorder.Opacity = 0;
            ToastBorder.Visibility = Visibility.Visible;
            ToastBorder.BeginAnimation(OpacityProperty,
                new DoubleAnimation(0, 1, TimeSpan.FromMilliseconds(160)));

            _toastTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(2.2) };
            _toastTimer.Tick += (s, args) =>
            {
                _toastTimer?.Stop();
                var fadeOut = new DoubleAnimation(1, 0, TimeSpan.FromMilliseconds(160));
                fadeOut.Completed += (_, _) => ToastBorder.Visibility = Visibility.Collapsed;
                ToastBorder.BeginAnimation(OpacityProperty, fadeOut);
            };
            _toastTimer.Start();
        }

        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }

        private void BackToHome_Click(object sender, RoutedEventArgs e)
        {
            _vm.CurrentPage = PanelPage.Home;
        }

        private void DismissNotification_Click(object sender, RoutedEventArgs e)
        {
            _vm.DismissNotificationCommand.Execute(null);
        }

        private void GoToToolFromNotification_Click(object sender, RoutedEventArgs e)
        {
            _vm.GoToToolCommand.Execute("qclaw");
        }

        private void RechargeButton_Click(object sender, RoutedEventArgs e)
        {
            var win = new RechargeWindow { Owner = this };
            win.ShowDialog();
            if (win.RechargeResult is double amount && amount > 0)
            {
                _vm.Balance += amount;
                UpdateBalanceBadge();
            }
        }

        private void RefreshApps_Click(object sender, RoutedEventArgs e)
        {
            var spinAnim = new DoubleAnimation(0, 360, TimeSpan.FromSeconds(0.65))
            {
                EasingFunction = new CubicEase { EasingMode = EasingMode.EaseOut }
            };
            RefreshRotate.BeginAnimation(RotateTransform.AngleProperty, spinAnim);

            var timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(0.65) };
            timer.Tick += (s, args) =>
            {
                timer.Stop();
                if (_vm.NoApps)
                {
                    _vm.NoApps = false;
                    UpdateToolListModelNames();
                    ShowToast("检测到 5 个可配置应用");
                }
                else
                {
                    ShowToast("应用列表已刷新");
                }
            };
            timer.Start();
        }

        private void ModelItem_Click(object sender, MouseButtonEventArgs e)
        {
            if (_vm.IsSmartMode)
                return;

            if (sender is Border border && border.Tag is string modelId)
            {
                _vm.SelectModelCommand.Execute(modelId);
                UpdateModelRadioSelection(modelId);
            }
        }

        private void ModelRow_Loaded(object sender, RoutedEventArgs e)
        {
            if (sender is Border border && border.Tag is string modelId && _vm.SelectedToolId != null)
                SetRadioVisualInTemplate(border, modelId == _vm.GetSelectedModelId(_vm.SelectedToolId));
        }

        private void SyncCurrentModelSelection()
        {
            if (_vm.SelectedToolId == null)
                return;

            UpdateModelRadioSelection(_vm.GetSelectedModelId(_vm.SelectedToolId));
        }

        private void UpdateModelRadioSelection(string selectedModelId)
        {
            foreach (var item in _vm.CurrentModels)
            {
                var container = ModelListControl.ItemContainerGenerator.ContainerFromItem(item);
                if (container != null)
                    SetRadioVisual(container, item.Id == selectedModelId);
            }
        }

        private void SetRadioVisual(DependencyObject parent, bool selected)
        {
            int count = VisualTreeHelper.GetChildrenCount(parent);
            for (int i = 0; i < count; i++)
            {
                var child = VisualTreeHelper.GetChild(parent, i);
                if (child is ContentPresenter cp)
                {
                    var root = VisualTreeHelper.GetChild(cp, 0);
                    if (root != null)
                        SetRadioVisualInTemplate(root, selected);
                }
            }
        }

        private void SetRadioVisualInTemplate(DependencyObject parent, bool selected)
        {
            int count = VisualTreeHelper.GetChildrenCount(parent);
            for (int i = 0; i < count; i++)
            {
                var child = VisualTreeHelper.GetChild(parent, i);
                if (child is Border b && b.Name == "RadioOuter")
                {
                    if (selected)
                    {
                        b.BorderBrush = BrushFromHex("#005FB8");
                        b.Background = BrushFromHex("#005FB8");
                    }
                    else
                    {
                        b.BorderBrush = BrushFromHex("#9B000000");
                        b.Background = BrushFromHex("#05000000");
                    }

                    for (int j = 0; j < VisualTreeHelper.GetChildrenCount(b); j++)
                    {
                        var inner = VisualTreeHelper.GetChild(b, j);
                        if (inner is Ellipse el && el.Name == "RadioBullet")
                        {
                            el.Fill = selected ? Brushes.White : Brushes.Transparent;
                            el.Stroke = selected ? BrushFromHex("#0F000000") : Brushes.Transparent;
                            el.StrokeThickness = selected ? 1 : 0;
                        }
                    }
                }
                else if (child is Border badge && badge.Name == "ModelBadge")
                {
                    badge.Visibility = selected ? Visibility.Visible : Visibility.Collapsed;
                }
                else if (child is TextBlock tb && tb.Name == "ModelBadgeText")
                {
                    tb.Text = _vm.IsSmartMode ? "智能匹配" : "当前模型";
                }

                SetRadioVisualInTemplate(child, selected);
            }
        }

        private void AppMenuButton_Click(object sender, RoutedEventArgs e)
        {
            AppMenuPopup.IsOpen = !AppMenuPopup.IsOpen;
        }

        private void MoreButton_Click(object sender, RoutedEventArgs e)
        {
            AccountMenuPopup.IsOpen = !AccountMenuPopup.IsOpen;
        }

        private static readonly System.Collections.Generic.Dictionary<string, string> WebLinks = new()
        {
            ["dashboard"] = "https://lai-hub.lenovomm.com/",
            ["logs"] = "https://lai-hub.lenovomm.com/logs",
            ["keys"] = "https://lai-hub.lenovomm.com/keys",
            ["marketplace"] = "https://lai-hub.lenovomm.com/pricing",
            ["account"] = "https://lai-hub.lenovomm.com/account",
        };

        private void WebLink_Click(object sender, RoutedEventArgs e)
        {
            AppMenuPopup.IsOpen = false;
            AccountMenuPopup.IsOpen = false;
            if (sender is Button btn && btn.Tag is string key && WebLinks.TryGetValue(key, out var url))
            {
                try
                {
                    Process.Start(new ProcessStartInfo { FileName = url, UseShellExecute = true });
                }
                catch { /* ignore in demo */ }
            }
        }

        private void Logout_Click(object sender, RoutedEventArgs e)
        {
            AccountMenuPopup.IsOpen = false;
            _vm.SetState(DemoState.Login);
        }

        private void Window_MouseDown(object sender, MouseButtonEventArgs e)
        {
            // Close popups
            if (AppMenuPopup.IsOpen)
                AppMenuPopup.IsOpen = false;
            if (AccountMenuPopup.IsOpen)
                AccountMenuPopup.IsOpen = false;
        }
    }
}
