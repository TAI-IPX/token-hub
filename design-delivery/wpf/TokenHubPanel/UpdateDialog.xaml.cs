using System;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;

namespace TokenHubPanel
{
    public partial class UpdateDialog : Window
    {
        public string UpdateDescription { get; set; } = "v0.1.1";
        private DispatcherTimer? _progressTimer;
        private double _progress;

        public UpdateDialog()
        {
            InitializeComponent();
            DataContext = this;
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

        private void LaterButton_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }

        private void UpdateButton_Click(object sender, RoutedEventArgs e)
        {
            // Switch to updating state
            ButtonsPanel.Visibility = Visibility.Collapsed;
            ProgressPanel.Visibility = Visibility.Visible;

            _progress = 0;
            _progressTimer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(80) };
            _progressTimer.Tick += (s, args) =>
            {
                _progress += 2.5;
                if (_progress >= 100)
                {
                    _progress = 100;
                    _progressTimer?.Stop();
                    ProgressText.Text = "更新完成，重启后生效";
                    // Auto-close after a moment
                    var closeTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1.5) };
                    closeTimer.Tick += (_, _) => { closeTimer.Stop(); Close(); };
                    closeTimer.Start();
                }
                ProgressText.Text = $"正在更新 {_progress:F0}%";
                ProgressTrack.Width = 348 * (_progress / 100.0);
            };
            _progressTimer.Start();
        }
    }
}
