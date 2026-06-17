using System;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;

namespace TokenHubPanel
{
    public partial class UninstallDialog : Window
    {
        private DispatcherTimer? _progressTimer;
        private double _progress;
        private double _progressMaxWidth;

        public UninstallDialog()
        {
            InitializeComponent();
            Loaded += (_, _) => Anim.FadeIn((FrameworkElement)Content);
        }

        private void Window_MouseDown(object sender, MouseButtonEventArgs e)
        {
            if (e.ChangedButton == MouseButton.Left)
                DragMove();
        }

        private void MinimizeButton_Click(object sender, RoutedEventArgs e)
        {
            WindowState = WindowState.Minimized;
        }

        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            _progressTimer?.Stop();
            Close();
        }

        private void UninstallButton_Click(object sender, RoutedEventArgs e)
        {
            DefaultButtonsPanel.Visibility = Visibility.Collapsed;
            ProgressPanel.Visibility = Visibility.Visible;
            Anim.FadeIn(ProgressPanel);
            CompleteButton.Visibility = Visibility.Collapsed;
            StatusTitle.Text = "联想 TokenHub";
            StatusDescription.Text = "一键切换，多身份随心掌控";

            _progress = 0;
            ProgressTrack.Width = 0;
            ProgressText.Text = "正在卸载 0%";

            _progressTimer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(80) };
            _progressTimer.Tick += (_, _) =>
            {
                _progress = Math.Min(100, _progress + 2.5);
                ProgressTrack.Width = _progressMaxWidth * (_progress / 100.0);
                ProgressText.Text = $"正在卸载 {_progress:F0}%";

                if (_progress < 100)
                    return;

                _progressTimer?.Stop();
                ProgressPanel.Visibility = Visibility.Collapsed;
                CompleteButton.Visibility = Visibility.Visible;
                Anim.FadeIn(CompleteButton);
                StatusTitle.Text = "卸载完成";
                StatusDescription.Text = "TokenHub 已从此设备移除。";
            };
            _progressTimer.Start();
        }

        private void ProgressGrid_SizeChanged(object sender, SizeChangedEventArgs e)
        {
            _progressMaxWidth = e.NewSize.Width;
            ProgressTrack.Width = _progressMaxWidth * (_progress / 100.0);
        }

        public void ShowFailed()
        {
            StatusPanel.Visibility = Visibility.Collapsed;
            DefaultButtonsPanel.Visibility = Visibility.Collapsed;
            ProgressPanel.Visibility = Visibility.Collapsed;
            CompleteButton.Visibility = Visibility.Collapsed;
            FailedPanel.Visibility = Visibility.Visible;
            FailedButtonsPanel.Visibility = Visibility.Visible;
            Anim.FadeIn(FailedPanel);
        }

        private void RetryUninstall_Click(object sender, RoutedEventArgs e)
        {
            FailedPanel.Visibility = Visibility.Collapsed;
            FailedButtonsPanel.Visibility = Visibility.Collapsed;
            StatusPanel.Visibility = Visibility.Visible;
            UninstallButton_Click(sender, e);
        }
    }
}
