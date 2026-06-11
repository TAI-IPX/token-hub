using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Media.Animation;

namespace TokenHubPanel
{
    /// <summary>
    /// Shared motion helpers. All animation through Opacity + RenderTransform only —
    /// no layout-triggering passes. Duration scale: Fast=hover, Normal=content, Enter=surface.
    /// </summary>
    internal static class Anim
    {
        public static readonly TimeSpan Fast   = TimeSpan.FromMilliseconds(100);
        public static readonly TimeSpan Normal = TimeSpan.FromMilliseconds(160);
        public static readonly TimeSpan Enter  = TimeSpan.FromMilliseconds(250);
        public static readonly TimeSpan Exit   = TimeSpan.FromMilliseconds(120);

        private static CubicEase EaseOut => new() { EasingMode = EasingMode.EaseOut };

        public static void FadeIn(FrameworkElement el, TimeSpan? duration = null)
        {
            var d = duration ?? Normal;
            el.Opacity = 0;
            el.BeginAnimation(UIElement.OpacityProperty,
                new DoubleAnimation(0, 1, d) { EasingFunction = EaseOut });
        }

        public static void FadeOut(FrameworkElement el, TimeSpan? duration = null, Action? onCompleted = null)
        {
            var d = duration ?? Exit;
            var anim = new DoubleAnimation(1, 0, d) { EasingFunction = new CubicEase { EasingMode = EasingMode.EaseIn } };
            if (onCompleted != null) anim.Completed += (_, _) => onCompleted();
            el.BeginAnimation(UIElement.OpacityProperty, anim);
        }

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

        /// <summary>Scale+fade entrance for popups.</summary>
        public static void ScaleIn(FrameworkElement el, double fromScale = 0.96, TimeSpan? duration = null)
        {
            var d = duration ?? Normal;
            var st = EnsureScale(el);
            el.Opacity = 0;
            st.ScaleX = fromScale; st.ScaleY = fromScale;
            el.BeginAnimation(UIElement.OpacityProperty,
                new DoubleAnimation(0, 1, d) { EasingFunction = EaseOut });
            st.BeginAnimation(ScaleTransform.ScaleXProperty,
                new DoubleAnimation(fromScale, 1, d) { EasingFunction = EaseOut });
            st.BeginAnimation(ScaleTransform.ScaleYProperty,
                new DoubleAnimation(fromScale, 1, d) { EasingFunction = EaseOut });
        }

        /// <summary>Quick scale bounce for badges/selections.</summary>
        public static void Pulse(FrameworkElement el, double toScale = 1.15)
        {
            var d = TimeSpan.FromMilliseconds(200);
            var st = EnsureScale(el);
            var grow = new DoubleAnimation(1.0, toScale, d) { EasingFunction = new CubicEase { EasingMode = EasingMode.EaseOut } };
            grow.Completed += (_, _) =>
            {
                var shrink = new DoubleAnimation(toScale, 1.0, d) { EasingFunction = new CubicEase { EasingMode = EasingMode.EaseIn } };
                st.BeginAnimation(ScaleTransform.ScaleXProperty, shrink);
                st.BeginAnimation(ScaleTransform.ScaleYProperty, shrink);
            };
            st.BeginAnimation(ScaleTransform.ScaleXProperty, grow);
            st.BeginAnimation(ScaleTransform.ScaleYProperty, grow);
        }

        /// <summary>Slide-out vertical offset for notification dismiss.</summary>
        public static void SlideOutY(FrameworkElement el, double toY, TimeSpan? duration = null, Action? onCompleted = null)
        {
            var d = duration ?? Exit;
            var tt = EnsureTranslate(el);
            var anim = new DoubleAnimation(0, toY, d) { EasingFunction = new CubicEase { EasingMode = EasingMode.EaseIn } };
            if (onCompleted != null) anim.Completed += (_, _) => onCompleted();
            tt.BeginAnimation(TranslateTransform.YProperty, anim);
        }

        /// <summary>Staggered fade-in for list items.</summary>
        public static void StaggerFadeIn(FrameworkElement el, int index, double staggerMs = 40)
        {
            var d = TimeSpan.FromMilliseconds(180);
            el.Opacity = 0;
            el.BeginAnimation(UIElement.OpacityProperty,
                new DoubleAnimation(0, 1, d) { BeginTime = TimeSpan.FromMilliseconds(index * staggerMs), EasingFunction = EaseOut });
        }

        /// <summary>Breathing float for illustrations.</summary>
        public static void BreathingFloat(FrameworkElement el)
        {
            var tt = EnsureTranslate(el);
            tt.BeginAnimation(TranslateTransform.YProperty, new DoubleAnimation(0, -6, TimeSpan.FromMilliseconds(2000))
            {
                AutoReverse = true, RepeatBehavior = RepeatBehavior.Forever,
                EasingFunction = new SineEase { EasingMode = EasingMode.EaseInOut }
            });
        }

        private static TranslateTransform EnsureTranslate(FrameworkElement el)
        {
            if (el.RenderTransform is TranslateTransform existing) return existing;
            var tt = new TranslateTransform();
            el.RenderTransform = tt;
            return tt;
        }

        private static ScaleTransform EnsureScale(FrameworkElement el)
        {
            if (el.RenderTransform is ScaleTransform existing) return existing;
            if (el.RenderTransform is TranslateTransform tt)
            {
                el.RenderTransform = null;
                var tg = new TransformGroup();
                var st = new ScaleTransform(1, 1);
                tg.Children.Add(st); tg.Children.Add(tt);
                el.RenderTransform = tg;
                el.RenderTransformOrigin = new Point(0.5, 0.5);
                return st;
            }
            var ns = new ScaleTransform(1, 1);
            el.RenderTransform = ns;
            el.RenderTransformOrigin = new Point(0.5, 0.5);
            return ns;
        }
    }
}
