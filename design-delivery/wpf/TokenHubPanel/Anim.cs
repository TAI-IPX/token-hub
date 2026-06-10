using System;
using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Animation;

namespace TokenHubPanel
{
    /// <summary>
    /// Shared motion helpers. Durations are the app-wide motion scale:
    /// Fast = hover feedback, Normal = content switch, Enter = surface entrance.
    /// Content/state changes are pure fades; page navigation adds a horizontal
    /// drill-in slide (Win11 convention). No layout passes — Opacity + RenderTransform only.
    /// </summary>
    internal static class Anim
    {
        public static readonly TimeSpan Fast   = TimeSpan.FromMilliseconds(100);
        public static readonly TimeSpan Normal = TimeSpan.FromMilliseconds(160);
        public static readonly TimeSpan Enter  = TimeSpan.FromMilliseconds(250);
        public static readonly TimeSpan Exit   = TimeSpan.FromMilliseconds(120);

        private static CubicEase EaseOut => new() { EasingMode = EasingMode.EaseOut };

        /// <summary>Fade-in entrance.</summary>
        public static void FadeIn(FrameworkElement el, TimeSpan? duration = null)
        {
            var d = duration ?? Normal;
            el.Opacity = 0;
            el.BeginAnimation(UIElement.OpacityProperty,
                new DoubleAnimation(0, 1, d) { EasingFunction = EaseOut });
        }

        /// <summary>
        /// Horizontal drill-in for page navigation: fade + slide from fromX
        /// (positive = enter from right / forward, negative = from left / back).
        /// </summary>
        public static void SlideFadeIn(FrameworkElement el, double fromX, TimeSpan? duration = null)
        {
            var d = duration ?? Normal;
            var tt = EnsureTranslate(el);
            el.Opacity = 0;
            el.BeginAnimation(UIElement.OpacityProperty,
                new DoubleAnimation(0, 1, d) { EasingFunction = EaseOut });
            tt.BeginAnimation(TranslateTransform.XProperty,
                new DoubleAnimation(fromX, 0, d) { EasingFunction = EaseOut });
        }

        private static TranslateTransform EnsureTranslate(FrameworkElement el)
        {
            if (el.RenderTransform is TranslateTransform existing)
                return existing;
            var tt = new TranslateTransform();
            el.RenderTransform = tt;
            return tt;
        }
    }
}
