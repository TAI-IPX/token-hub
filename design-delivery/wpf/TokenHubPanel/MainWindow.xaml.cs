using System;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Threading;
using TokenHubPanel.Models;
using TokenHubPanel.ViewModels;

namespace TokenHubPanel
{
    public partial class MainWindow : Window
    {
        private readonly MainViewModel _vm;
        private DispatcherTimer? _progressAnimTimer;
        private DispatcherTimer? _configTimer;
        private DispatcherTimer? _toastTimer;

        public MainWindow()
        {
            InitializeComponent();
            _vm = (MainViewModel)DataContext;

            SubscribeViewModelEvents();
            InitializeUI();
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
                        AnimateToggle();
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
                }
            };
        }

        private void InitializeUI()
        {
            UpdatePageVisibility();
            UpdateNotificationVisibility();
            UpdateBalanceBadge();
            SyncToggleVisual();
            OnStateChanged();
        }

        private void OnStateChanged()
        {
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
            PanelBorder.Height = (state == DemoState.Login || state == DemoState.Configuring
                || state == DemoState.AutoDiscovery || state == DemoState.ManualDiscovery)
                ? 318 : 384;
        }

        private void UpdatePanelStateVisibility()
        {
            var isLogin = _vm.CurrentState == DemoState.Login;
            var isConfiguring = _vm.CurrentState == DemoState.Configuring;
            var isReady = _vm.IsReady;

            LoginPanel.Visibility = isLogin ? Visibility.Visible : Visibility.Collapsed;
            ConfiguringPanel.Visibility = isConfiguring ? Visibility.Visible : Visibility.Collapsed;
            ReadyContent.Visibility = isReady ? Visibility.Visible : Visibility.Collapsed;

            bool showFooter = isReady || isConfiguring;
            bool loggedInFooter = isReady;
            bool loggedOutFooter = isLogin;

            AccountFooter.Visibility = loggedInFooter ? Visibility.Visible : Visibility.Collapsed;
            LoggedOutFooter.Visibility = loggedOutFooter ? Visibility.Visible : Visibility.Collapsed;

            // Start/stop progress animation for configuring state
            if (isConfiguring)
                StartProgressAnimation();
            else
                StopProgressAnimation();
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

        private void UpdatePageVisibility()
        {
            var page = _vm.CurrentPage;
            HomePage.Visibility = page == PanelPage.Home ? Visibility.Visible : Visibility.Collapsed;
            ModelsPage.Visibility = page == PanelPage.Models ? Visibility.Visible : Visibility.Collapsed;
            SettingsPage.Visibility = page == PanelPage.Settings ? Visibility.Visible : Visibility.Collapsed;
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
                BalanceBadge.Background = (Brush)new BrushConverter().ConvertFrom(bgColor);

                string fgColor = _vm.Balance < 1 ? "#B42318" : "#8A5700";
                BalanceBadgeText.Foreground = (Brush)new BrushConverter().ConvertFrom(fgColor);
            }
        }

        private void SyncToggleVisual()
        {
            UpdateToggleVisual(_vm.IsSmartMode, false);
        }

        private void AnimateToggle()
        {
            UpdateToggleVisual(_vm.IsSmartMode, true);
        }

        private void UpdateToggleVisual(bool isOn, bool animate)
        {
            var duration = animate ? TimeSpan.FromMilliseconds(180) : TimeSpan.Zero;

            var targetBg = isOn
                ? (Brush)new BrushConverter().ConvertFrom("#005FB8")
                : (Brush)new BrushConverter().ConvertFrom("#8A929D");

            var targetMargin = isOn
                ? new Thickness(23, 3, 0, 0)
                : new Thickness(3, 3, 0, 0);

            if (animate)
            {
                var bgAnim = new ColorAnimation
                {
                    To = isOn ? Color.FromRgb(0, 95, 184) : Color.FromRgb(138, 146, 157),
                    Duration = duration
                };
                ToggleTrack.Background = targetBg; // For simplicity, set directly

                var marginAnim = new ThicknessAnimation
                {
                    To = targetMargin,
                    Duration = duration,
                    EasingFunction = new QuadraticEase { EasingMode = EasingMode.EaseInOut }
                };
                ToggleKnob.BeginAnimation(Border.MarginProperty, marginAnim);
            }
            else
            {
                ToggleTrack.Background = targetBg;
                ToggleKnob.Margin = targetMargin;
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
                    var templateRoot = VisualTreeHelper.GetChild(cp, 0);
                    if (templateRoot != null)
                        SetToolModelName(templateRoot, tool);
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
            if (!IsLoaded) return;
            var idx = ((ComboBox)sender).SelectedIndex;
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

        private void ToggleSwitch_Click(object sender, MouseButtonEventArgs e)
        {
            _vm.ToggleSmartCommand.Execute(null);
        }

        private void LoginButton_Click(object sender, RoutedEventArgs e)
        {
            _vm.SetState(DemoState.Configuring);
        }

        private void LoginFromFooter_Click(object sender, RoutedEventArgs e)
        {
            _vm.SetState(DemoState.Login);
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
            ToastText.Text = message;
            ToastBorder.Visibility = Visibility.Visible;
            _toastTimer?.Stop();
            _toastTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(2.2) };
            _toastTimer.Tick += (s, args) =>
            {
                _toastTimer?.Stop();
                ToastBorder.Visibility = Visibility.Collapsed;
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
            _vm.RechargeCommand.Execute(null);
        }

        private void RefreshApps_Click(object sender, RoutedEventArgs e)
        {
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
            if (sender is Border border && border.Tag is string modelId)
            {
                _vm.SelectModelCommand.Execute(modelId);
                UpdateModelRadioSelection(modelId);
            }
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
                        b.BorderBrush = (Brush)new BrushConverter().ConvertFrom("#005FB8");
                        b.Background = (Brush)new BrushConverter().ConvertFrom("#005FB8");
                    }
                    else
                    {
                        b.BorderBrush = (Brush)new BrushConverter().ConvertFrom("#9B000000");
                        b.Background = (Brush)new BrushConverter().ConvertFrom("#05000000");
                    }

                    for (int j = 0; j < VisualTreeHelper.GetChildrenCount(b); j++)
                    {
                        var inner = VisualTreeHelper.GetChild(b, j);
                        if (inner is Ellipse el && el.Name == "RadioBullet")
                        {
                            el.Fill = selected ? Brushes.White : Brushes.Transparent;
                            el.Stroke = selected ? (Brush)new BrushConverter().ConvertFrom("#0F000000") : Brushes.Transparent;
                            el.StrokeThickness = selected ? 1 : 0;
                        }
                    }
                    return;
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
            // Context menu placeholder
        }

        private void SettingToggle_Click(object sender, MouseButtonEventArgs e)
        {
            if (sender is Border border)
            {
                bool isOn = border.Background.ToString() != "#FF8A929D";
                var brush = isOn
                    ? (Brush)new BrushConverter().ConvertFrom("#8A929D")
                    : (Brush)new BrushConverter().ConvertFrom("#005FB8");
                border.Background = brush;

                // Find the knob inside
                var knob = border.Child as Border;
                if (knob != null)
                {
                    var anim = new ThicknessAnimation
                    {
                        To = isOn
                            ? new Thickness(3, 3, 0, 0)
                            : new Thickness(23, 3, 0, 0),
                        Duration = TimeSpan.FromMilliseconds(180)
                    };
                    knob.BeginAnimation(Border.MarginProperty, anim);
                }
            }
        }

        private void Window_MouseDown(object sender, MouseButtonEventArgs e)
        {
            // Close popups
            if (AppMenuPopup.IsOpen)
                AppMenuPopup.IsOpen = false;
        }
    }
}
