using System;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;

namespace TokenHubPanel
{
    public partial class InstallDialog : Window
    {
        private DispatcherTimer? _progressTimer;
        private double _progress;
        private double _progressMaxWidth;

        public InstallDialog()
        {
            InitializeComponent();
            Loaded += (_, _) => Anim.PopIn((FrameworkElement)Content);
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

        private void InstallButton_Click(object sender, RoutedEventArgs e)
        {
            IntroPanel.Visibility = Visibility.Collapsed;
            StatusPanel.Visibility = Visibility.Visible;
            ProgressPanel.Visibility = Visibility.Visible;
            CompleteButton.Visibility = Visibility.Collapsed;
            WindowFrame.Height = 400;
            Anim.FadeSlideIn(StatusPanel);
            Anim.FadeSlideIn(ProgressPanel);

            _progress = 0;
            ProgressTrack.Width = 0;
            ProgressText.Text = "正在安装组件 0%";
            StatusTitle.Text = "正在安装";
            StatusDescription.Text = "正在安装 TokenHub，请稍候。";

            _progressTimer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(70) };
            _progressTimer.Tick += (_, _) =>
            {
                _progress = Math.Min(100, _progress + 3.5);
                ProgressTrack.Width = _progressMaxWidth * (_progress / 100.0);
                ProgressText.Text = $"正在安装组件 {_progress:F0}%";

                if (_progress < 100)
                    return;

                _progressTimer?.Stop();
                ProgressPanel.Visibility = Visibility.Collapsed;
                CompleteButton.Visibility = Visibility.Visible;
                Anim.FadeSlideIn(CompleteButton);
                StatusTitle.Text = "安装完成";
                StatusDescription.Text = "TokenHub 已安装完成，可从系统托盘启动。";
            };
            _progressTimer.Start();
        }

        private void ProgressGrid_SizeChanged(object sender, SizeChangedEventArgs e)
        {
            _progressMaxWidth = e.NewSize.Width;
            ProgressTrack.Width = _progressMaxWidth * (_progress / 100.0);
        }
    }
}
