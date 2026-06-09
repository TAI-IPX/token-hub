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
using WinForms = System.Windows.Forms;

namespace TokenHubPanel
{
    public partial class MainWindow : Window
    {
        private readonly MainViewModel _vm;
        private DemoSwitcherWindow? _demoSwitcher;
        private WinForms.NotifyIcon? _trayIcon;
        private DispatcherTimer? _configTimer;
        private DispatcherTimer? _toastTimer;
        private DispatcherTimer? _trayMenuOutsideClickTimer;
        private bool _syncingDemoState;
        private bool _notificationVisible;
        private bool _trayMenuAwaitingButtonRelease;

        // Onboarding sub-step (only meaningful while CurrentState == Login)
        private enum OnbStep { Login, AuthPending, FirstRun, ReadyToConfig }
        private OnbStep _onbStep = OnbStep.Login;

        private static Brush BrushFromHex(string hex) =>
            (Brush)(new BrushConverter().ConvertFromString(hex) ?? Brushes.Transparent);

        private void PositionForNotification()
        {
            var workArea = SystemParameters.WorkArea;
            // 10px from right and bottom edges
            Left = workArea.Right  - ActualWidth  - 10;
            Top  = workArea.Bottom - ActualHeight - 10;
        }

        // Animate Window.Left using CompositionTarget.Rendering (WPF has no built-in window position animation)
        private EventHandler? _slideRenderHandler;
        private void SlideWindowIn(double finalLeft, double finalTop)
        {
            // Remove any existing slide handler
            if (_slideRenderHandler != null)
            {
                CompositionTarget.Rendering -= _slideRenderHandler;
                _slideRenderHandler = null;
            }

            double startLeft = SystemParameters.WorkArea.Right + 20; // off-screen right
            Left = startLeft;
            Top  = finalTop;

            var startTime = DateTime.UtcNow;
            const double durationMs = 500.0;

            _slideRenderHandler = (s, e) =>
            {
                double elapsed = (DateTime.UtcNow - startTime).TotalMilliseconds;
                double t = Math.Min(elapsed / durationMs, 1.0);
                // Cubic ease-out
                t = 1.0 - Math.Pow(1.0 - t, 3.0);
                Left = startLeft + (finalLeft - startLeft) * t;

                if (elapsed >= durationMs)
                {
                    CompositionTarget.Rendering -= _slideRenderHandler;
                    _slideRenderHandler = null;
                    Left = finalLeft;
                }
            };
            CompositionTarget.Rendering += _slideRenderHandler;
        }

        public MainWindow()
        {
            // Prevent app shutdown when the last visible window (e.g. dialog) closes
            Application.Current.ShutdownMode = ShutdownMode.OnExplicitShutdown;

            InitializeComponent();
            _vm = (MainViewModel)DataContext;

            SubscribeViewModelEvents();
            InitializeUI();
            Loaded += MainWindow_Loaded;
            Closing += MainWindow_Closing;
        }

        private void MainWindow_Closing(object? sender, System.ComponentModel.CancelEventArgs e)
        {
            // Minimize to tray instead of closing
            e.Cancel = true;
            Hide();
        }

        public void ExitApplication()
        {
            _trayIcon?.Dispose();
            Closing -= MainWindow_Closing;
            Close();
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
            CreateTrayIcon();
            PositionNearTray();
            ShowDemoSwitcher();
        }

        private void CreateTrayIcon()
        {
            // Load tray icon from assets
            var iconPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Assets", "tray-icon@3x.png");
            System.Drawing.Icon trayIcon;
            try
            {
                using var bmp = new System.Drawing.Bitmap(iconPath);
                trayIcon = System.Drawing.Icon.FromHandle(bmp.GetHicon());
            }
            catch
            {
                trayIcon = System.Drawing.Icon.ExtractAssociatedIcon(
                    System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "TokenHubPanel.exe"))
                    ?? System.Drawing.SystemIcons.Application;
            }

            _trayIcon = new WinForms.NotifyIcon
            {
                Icon = trayIcon,
                Text = "联想 TokenHub",
                Visible = true
            };
            _trayIcon.MouseClick += (s, e) =>
            {
                if (e.Button == WinForms.MouseButtons.Left)
                {
                    Show();
                    Activate();
                    PositionNearTray();
                }
            };
            // Figma 632:641 — WPF Popup context menu (stylable)
            _trayIcon.MouseClick += (s, e) =>
            {
                if (e.Button == WinForms.MouseButtons.Right)
                {
                    Dispatcher.Invoke(() => ShowTrayMenu());
                }
            };
        }

        private void ShowTrayMenu()
        {
            // Position like native system tray menu: above taskbar, not covering tray icon
            var mousePos = WinForms.Control.MousePosition;
            var workArea = SystemParameters.WorkArea;
            const double menuWidth = 156;
            const double menuHeight = 96;
            const double gap = 8;

            TrayMenuPopup.Placement = System.Windows.Controls.Primitives.PlacementMode.Absolute;
            // Horizontal: right edge at mouse, left edge to the left
            TrayMenuPopup.HorizontalOffset = Math.Max(0, (mousePos.X / DpiScaleX) - menuWidth);
            // Vertical: bottom of menu sits above taskbar with gap
            TrayMenuPopup.VerticalOffset = Math.Max(0, workArea.Bottom - menuHeight - gap);
            TrayMenuPopup.IsOpen = true;
            StartTrayMenuOutsideClickWatcher();
        }

        private void StartTrayMenuOutsideClickWatcher()
        {
            _trayMenuAwaitingButtonRelease = true;
            _trayMenuOutsideClickTimer?.Stop();
            _trayMenuOutsideClickTimer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(40) };
            _trayMenuOutsideClickTimer.Tick += (_, _) =>
            {
                if (!TrayMenuPopup.IsOpen)
                {
                    _trayMenuOutsideClickTimer?.Stop();
                    return;
                }

                var buttons = WinForms.Control.MouseButtons;
                if (_trayMenuAwaitingButtonRelease)
                {
                    if (buttons == WinForms.MouseButtons.None)
                        _trayMenuAwaitingButtonRelease = false;
                    return;
                }

                if (buttons == WinForms.MouseButtons.None)
                    return;

                var mousePos = WinForms.Control.MousePosition;
                var mouseX = mousePos.X / DpiScaleX;
                var mouseY = mousePos.Y / DpiScaleY;
                var menuBounds = new Rect(TrayMenuPopup.HorizontalOffset, TrayMenuPopup.VerticalOffset, 156, 96);
                if (!menuBounds.Contains(new Point(mouseX, mouseY)))
                    CloseTrayMenu();
            };
            _trayMenuOutsideClickTimer.Start();
        }

        private void CloseTrayMenu()
        {
            TrayMenuPopup.IsOpen = false;
            _trayMenuOutsideClickTimer?.Stop();
            _trayMenuAwaitingButtonRelease = false;
        }

        private void TrayMenuRefresh_Click(object sender, MouseButtonEventArgs e)
        {
            CloseTrayMenu();
            RefreshApps_Click(sender, e);
        }

        private void TrayMenuSettings_Click(object sender, MouseButtonEventArgs e)
        {
            CloseTrayMenu();
            Show();
            Activate();
            _vm.CurrentPage = ViewModels.PanelPage.Settings;
        }

        private void TrayMenuExit_Click(object sender, MouseButtonEventArgs e)
        {
            CloseTrayMenu();
            ExitApplication();
        }

        private void TrayMenuItem_MouseEnter(object sender, MouseEventArgs e)
        {
            if (sender is Border border)
                border.Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#0D000000"));
        }

        private void TrayMenuItem_MouseLeave(object sender, MouseEventArgs e)
        {
            if (sender is Border border)
                border.Background = Brushes.Transparent;
        }

        private double DpiScaleX => PresentationSource.FromVisual(this)?.CompositionTarget?.TransformToDevice.M11 ?? 1.0;
        private double DpiScaleY => PresentationSource.FromVisual(this)?.CompositionTarget?.TransformToDevice.M22 ?? 1.0;

        private void OpenWebLink(string key)
        {
            if (WebLinks.TryGetValue(key, out var url))
            {
                try { Process.Start(new ProcessStartInfo { FileName = url, UseShellExecute = true }); }
                catch { /* ignore */ }
            }
        }

        private void PositionNearTray()
        {
            var workArea = SystemParameters.WorkArea;
            Left = workArea.Right - PanelBorder.Margin.Left - PanelBorder.ActualWidth - 16;
            Top = workArea.Bottom - PanelBorder.Margin.Top - PanelBorder.ActualHeight - 16;
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
            StartLoadingAnimation();
        }

        private void StartLoadingAnimation()
        {
            var isConfiguring = _vm.CurrentState == DemoState.Configuring || _onbStep == OnbStep.AuthPending;
            if (!isConfiguring) return;

            StartIndeterminateSlide(ConfiguringSlide, 360 - 100);
            StartIndeterminateSlide(AuthPendingSlide, 360 - 100);
        }

        private void StartIndeterminateSlide(TranslateTransform? transform, double range)
        {
            if (transform == null) return;

            var anim = new DoubleAnimation
            {
                From = 0,
                To = range,
                Duration = TimeSpan.FromMilliseconds(1000),
                AutoReverse = true,
                RepeatBehavior = RepeatBehavior.Forever,
                EasingFunction = new CubicEase { EasingMode = EasingMode.EaseInOut }
            };
            transform.BeginAnimation(TranslateTransform.XProperty, anim);
        }

        private void UpdatePanelHeight()
        {
            var state = _vm.CurrentState;
            var isDiscovery = state == DemoState.AutoDiscovery || state == DemoState.ManualDiscovery;

            PanelBorder.Width = 360;
            PanelBorder.Margin = isDiscovery
                ? new Thickness(0)
                : new Thickness(12, 12, 12, 20);
            PanelBorder.Height = isDiscovery
                ? double.NaN
                : _vm.PanelHeight;
            PanelBorder.BorderThickness = isDiscovery ? new Thickness(0) : new Thickness(1);
            PanelBorder.Background = isDiscovery
                ? Brushes.Transparent
                : BrushFromHex("#FFE8F2FA");
            PanelBorder.Effect = isDiscovery ? null : (System.Windows.Media.Effects.Effect)FindResource("PanelShadow");

            // Ensure InnerClipBorder doesn't paint its solid background through the transparent PanelBorder,
            // and disable hit-testing on PanelBorder so it can't block NotificationPanel clicks.
            InnerClipBorder.Background = isDiscovery
                ? Brushes.Transparent
                : new SolidColorBrush(Color.FromRgb(0xE8, 0xF2, 0xFA));
            PanelBorder.IsHitTestVisible = !isDiscovery;
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

            // Loading indicators — visibility handled by parent panel
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

            AutoNotificationBody.Visibility = _vm.IsAutoDiscovery ? Visibility.Visible : Visibility.Collapsed;
            ManualNotificationBody.Visibility = _vm.IsManualDiscovery ? Visibility.Visible : Visibility.Collapsed;
            NotificationActions.Visibility = Visibility.Collapsed;

            if (show)
            {
                ShowNotificationPanel();
            }
            else if (_notificationVisible)
            {
                CloseNotificationPanel(dismissNotification: false);
            }
            else
            {
                NotificationPanel.Visibility = Visibility.Collapsed;
            }
        }

        private void ShowNotificationPanel()
        {
            if (_notificationVisible)
            {
                // Already visible — just ensure panel is showing (body was swapped by caller)
                NotificationPanel.Visibility = Visibility.Visible;
                return;
            }

            _notificationVisible = true;

            // Hide main panel — notification is standalone
            PanelBorder.Visibility = Visibility.Collapsed;

            NotificationPanel.Visibility = Visibility.Visible;
            // Clear any held animation clock left by previous click so local values take effect
            NotificationScale.BeginAnimation(ScaleTransform.ScaleXProperty, null);
            NotificationScale.BeginAnimation(ScaleTransform.ScaleYProperty, null);
            NotificationScale.ScaleX = 1;
            NotificationScale.ScaleY = 1;
            NotificationPanel.Opacity = 0;

            Show();

            // Defer to after SizeToContent has resized the window so ActualWidth/Height are correct
            Dispatcher.BeginInvoke(System.Windows.Threading.DispatcherPriority.Render, () =>
            {
                var workArea = SystemParameters.WorkArea;
                // NotificationPanel has Margin="16,8,16,24" for shadow clearance.
                // Align card right edge with main panel (workArea.Right - 16):
                //   card right = window right - rightMargin(16) = workArea.Right - 16  →  finalLeft = workArea.Right - ActualWidth
                // Card bottom 10px from taskbar:
                //   card bottom = window bottom - bottomMargin(24) = workArea.Bottom - 10  →  finalTop = workArea.Bottom - ActualHeight + 14
                double finalLeft = workArea.Right  - ActualWidth;
                double finalTop  = workArea.Bottom - ActualHeight + 14;
                Top = finalTop;

                SlideWindowIn(finalLeft, finalTop);
                NotificationPanel.BeginAnimation(OpacityProperty,
                    new DoubleAnimation(0, 1, TimeSpan.FromMilliseconds(300))
                    {
                        EasingFunction = new CubicEase { EasingMode = EasingMode.EaseOut }
                    });
            });
        }

        private void CloseNotificationPanel(Action? afterClose = null, bool dismissNotification = true)
        {
            if (!_notificationVisible || NotificationPanel.Visibility != Visibility.Visible)
            {
                if (dismissNotification && _vm.IsDiscovering)
                    _vm.DismissNotificationCommand.Execute(null);
                afterClose?.Invoke();
                return;
            }

            // Mark invisible immediately — prevents re-entry if afterClose triggers a state change
            // that calls UpdateNotificationVisibility → CloseNotificationPanel again before fade ends.
            _notificationVisible = false;

            // Stop any in-progress entrance slide
            if (_slideRenderHandler != null)
            {
                CompositionTarget.Rendering -= _slideRenderHandler;
                _slideRenderHandler = null;
            }

            var fadeOut = new DoubleAnimation(NotificationPanel.Opacity, 0, TimeSpan.FromMilliseconds(180))
            {
                EasingFunction = new CubicEase { EasingMode = EasingMode.EaseIn }
            };

            fadeOut.Completed += (_, _) =>
            {
                NotificationPanel.Visibility = Visibility.Collapsed;
                NotificationPanel.Opacity = 1;
                // Release held animation clock (FillBehavior.HoldEnd from click scale) so
                // ScaleX/Y local assignment is honoured next time ShowNotificationPanel runs.
                NotificationScale.BeginAnimation(ScaleTransform.ScaleXProperty, null);
                NotificationScale.BeginAnimation(ScaleTransform.ScaleYProperty, null);
                NotificationScale.ScaleX = 1;
                NotificationScale.ScaleY = 1;

                // Restore main panel and reposition window near tray
                PanelBorder.Visibility = Visibility.Visible;
                UpdateLayout();
                PositionNearTray();

                if (dismissNotification && _vm.IsDiscovering)
                    _vm.DismissNotificationCommand.Execute(null);
                afterClose?.Invoke();
            };

            NotificationPanel.BeginAnimation(OpacityProperty, fadeOut);
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
            OpenUpdateDialog();
        }

        private void NewVersionBadge_Click(object sender, RoutedEventArgs e)
        {
            OpenUpdateDialog();
        }

        public void OpenUpdateDialog()
        {
            var dialog = new UpdateDialog
            {
                UpdateDescription = "v2.1.0"
            };
            dialog.ShowDialog();
        }

        public void OpenInstallDialog()
        {
            var dialog = new InstallDialog();
            dialog.ShowDialog();
        }

        public void OpenUninstallDialog()
        {
            var dialog = new UninstallDialog();
            dialog.ShowDialog();
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
            e.Handled = true;
            CloseNotificationPanel();
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
            if (TrayMenuPopup.IsOpen)
                CloseTrayMenu();
        }

        private void NotificationPanel_MouseLeftButtonUp(object sender, MouseButtonEventArgs e)
        {
            if (IsFromButton(e.OriginalSource as DependencyObject))
                return;

            // Use separate animation instances — reusing the same object causes Completed to fire twice
            // (once per BeginAnimation clock) which double-invokes the afterClose action.
            var ease = new CubicEase { EasingMode = EasingMode.EaseOut };
            var scaleX = new DoubleAnimation(1.0, 0.9, TimeSpan.FromMilliseconds(120)) { EasingFunction = ease };
            var scaleY = new DoubleAnimation(1.0, 0.9, TimeSpan.FromMilliseconds(120)) { EasingFunction = ease };

            // Completed only on scaleX — fires exactly once
            scaleX.Completed += (_, _) =>
            {
                if (_vm.IsManualDiscovery)
                    CloseNotificationPanel(
                        afterClose: () => _vm.GoToToolCommand.Execute("qclaw"),
                        dismissNotification: false);
                else
                    CloseNotificationPanel(dismissNotification: false);
            };

            NotificationScale.BeginAnimation(ScaleTransform.ScaleXProperty, scaleX);
            NotificationScale.BeginAnimation(ScaleTransform.ScaleYProperty, scaleY);
        }

        private void NotificationSettingButton_Click(object sender, RoutedEventArgs e)
        {
            e.Handled = true;
            CloseNotificationPanel(afterClose: () => _vm.CurrentPage = PanelPage.Settings);
        }

        private static bool IsFromButton(DependencyObject? source)
        {
            while (source != null)
            {
                if (source is Button)
                    return true;
                source = VisualTreeHelper.GetParent(source);
            }
            return false;
        }
    }
}
