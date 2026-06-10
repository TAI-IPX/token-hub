using System;
using System.Windows;
using System.Windows.Media.Animation;

namespace TokenHubPanel
{
    /// <summary>
    /// Shared motion helpers. Durations are the app-wide motion scale:
    /// Fast = hover feedback, Normal = content switch, Enter = surface entrance.
    /// Only Opacity is animated — pure fades, no layout passes.
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
    }
}
