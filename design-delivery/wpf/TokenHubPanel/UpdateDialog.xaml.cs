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
        private double _progressMaxWidth = 512;

        public UpdateDialog()
        {
            InitializeComponent();
            DataContext = this;
            Closing += (_, _) => _progressTimer?.Stop();
        }

        private void ProgressGrid_SizeChanged(object sender, SizeChangedEventArgs e)
        {
            _progressMaxWidth = e.NewSize.Width;
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

        private void CompleteButton_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }

        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
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
                    // Switch to complete state
                    ProgressPanel.Visibility = Visibility.Collapsed;
                    CompleteButton.Visibility = Visibility.Visible;
                    TitleText.Text = "更新完成";
                    DescText.Text = $"Token Hub 已更新至 {UpdateDescription}，现在可以继续使用。";
                }
                else
                {
                    ProgressText.Text = $"正在更新 {_progress:F0}%";
                    ProgressTrack.Width = _progressMaxWidth * (_progress / 100.0);
                }
            };
            _progressTimer.Start();
        }
    }
}
