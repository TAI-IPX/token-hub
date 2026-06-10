using System;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Input;

namespace TokenHubPanel
{
    public partial class RechargeWindow : Window
    {
        private double _amount = 50;

        /// <summary>Set to the recharged amount when the user completes payment; null if cancelled.</summary>
        public double? RechargeResult { get; private set; }

        public RechargeWindow()
        {
            InitializeComponent();
            UpdateAmountDisplays();
            Loaded += (_, _) => Anim.FadeIn((FrameworkElement)Content);
        }

        private void UpdateAmountDisplays()
        {
            string text = $"¥{_amount:F2}";
            AmountTotalText.Text = text;
            ConfirmAmount1.Text = text;
            ConfirmAmount2.Text = $"{_amount:F2}";
            DetailAmount.Text = text;

            // Highlight matching amount card
            foreach (var child in AmountGrid.Children)
            {
                if (child is Button btn)
                    btn.Tag = (ParseAmount(btn.Content?.ToString()) == _amount) ? "active" : "";
            }
        }

        private static double ParseAmount(string? content)
        {
            if (string.IsNullOrEmpty(content)) return -1;
            var digits = content.Replace("元", "").Trim();
            return double.TryParse(digits, out var v) ? v : -1;
        }

        private void ShowView(UIElement view)
        {
            bool wasVisible = view.Visibility == Visibility.Visible;
            AmountView.Visibility = Visibility.Collapsed;
            ConfirmView.Visibility = Visibility.Collapsed;
            PayView.Visibility = Visibility.Collapsed;
            view.Visibility = Visibility.Visible;
            if (!wasVisible && view is FrameworkElement fe)
                Anim.FadeIn(fe);
        }

        private void AmountCard_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn)
            {
                var v = ParseAmount(btn.Content?.ToString());
                if (v > 0)
                    CustomAmountBox.Text = ((int)v).ToString(); // triggers TextChanged → unified update
            }
        }

        private void CustomAmount_TextChanged(object sender, TextChangedEventArgs e)
        {
            if (double.TryParse(CustomAmountBox.Text, out var v) && v >= 1)
                _amount = v;
            else
                _amount = 1;
            UpdateAmountDisplays();
        }

        private void ToConfirm_Click(object sender, RoutedEventArgs e) => ShowView(ConfirmView);
        private void ToPay_Click(object sender, RoutedEventArgs e) => ShowView(PayView);

        private void TabQr_Click(object sender, RoutedEventArgs e)
        {
            TabQr.Tag = "active";
            TabDetail.Tag = "";
            SwitchBox(show: QrBox, hide: DetailBox);
        }

        private void TabDetail_Click(object sender, RoutedEventArgs e)
        {
            TabQr.Tag = "";
            TabDetail.Tag = "active";
            SwitchBox(show: DetailBox, hide: QrBox);
        }

        private static void SwitchBox(FrameworkElement show, FrameworkElement hide)
        {
            bool wasVisible = show.Visibility == Visibility.Visible;
            hide.Visibility = Visibility.Collapsed;
            show.Visibility = Visibility.Visible;
            if (!wasVisible)
                Anim.FadeIn(show);
        }

        private void CompletePay_Click(object sender, RoutedEventArgs e)
        {
            RechargeResult = _amount;
            Close();
        }

        private void Close_Click(object sender, RoutedEventArgs e) => Close();

        private void TitleBar_DragMove(object sender, MouseButtonEventArgs e)
        {
            if (e.ChangedButton == MouseButton.Left)
                DragMove();
        }

        private void WebLink_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = "https://lai-hub.lenovomm.com/account",
                    UseShellExecute = true
                });
            }
            catch { /* ignore in demo */ }
        }
    }
}
