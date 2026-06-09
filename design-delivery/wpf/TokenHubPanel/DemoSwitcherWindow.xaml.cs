using System;
using System.Windows;
using System.Windows.Controls;

namespace TokenHubPanel
{
    public partial class DemoSwitcherWindow : Window
    {
        private readonly MainWindow _mainWindow;

        public DemoSwitcherWindow(MainWindow mainWindow)
        {
            InitializeComponent();
            _mainWindow = mainWindow;
            Owner = mainWindow;
            Loaded += (_, _) => PositionTopRight();
        }

        private void PositionTopRight()
        {
            var workArea = SystemParameters.WorkArea;
            Left = workArea.Right - ActualWidth - 24;
            Top = workArea.Top + 24;
        }

        private void DemoStateButton_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button { Tag: string tag } && int.TryParse(tag, out var idx))
                _mainWindow.SetDemoStateByIndex(idx);
        }

        private void ShowUpdateDialog_Click(object sender, RoutedEventArgs e)
        {
            _mainWindow.OpenUpdateDialog();
        }
    }
}
