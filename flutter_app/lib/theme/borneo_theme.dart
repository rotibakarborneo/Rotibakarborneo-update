import 'dart:ui';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class BorneoTheme {
  static const Color bg = Color(0xFF040711);
  static const Color card = Color(0x99101729);
  static const Color surface = Color(0xFF0F172A);
  static const Color fieldBg = Color(0x9918233C);
  static const Color border = Color(0x28FFFFFF);
  static const Color highlightBorder = Color(0x38FFFFFF);
  static const Color primary = Color(0xFF0A84FF); // iOS System Blue
  static const Color accent = Color(0xFFFF9F0A); // iOS System Orange/Amber
  static const Color success = Color(0xFF30D158); // iOS System Green
  static const Color danger = Color(0xFFFF453A); // iOS System Red
  static const Color purple = Color(0xFFBF5AF2); // iOS System Purple
  static const Color textMuted = Color(0xFF94A3B8);

  static final NumberFormat _idr = NumberFormat.currency(
    locale: 'id_ID',
    symbol: 'Rp ',
    decimalDigits: 0,
  );

  static String rupiah(num value) => _idr.format(value);

  static String wibTodayIso() {
    final wib = DateTime.now().toUtc().add(const Duration(hours: 7));
    return '${wib.year.toString().padLeft(4, '0')}-${wib.month.toString().padLeft(2, '0')}-${wib.day.toString().padLeft(2, '0')}';
  }

  static String wibDaysAgoIso(int days) {
    final wib = DateTime.now()
        .toUtc()
        .add(const Duration(hours: 7))
        .subtract(Duration(days: days));
    return '${wib.year.toString().padLeft(4, '0')}-${wib.month.toString().padLeft(2, '0')}-${wib.day.toString().padLeft(2, '0')}';
  }

  static String wibClockNow() {
    final wib = DateTime.now().toUtc().add(const Duration(hours: 7));
    return '${wib.hour.toString().padLeft(2, '0')}:${wib.minute.toString().padLeft(2, '0')} WIB';
  }

  static ThemeData iosDarkTheme() => ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: bg,
        colorScheme: const ColorScheme.dark(
          primary: primary,
          secondary: accent,
          surface: surface,
        ),
        useMaterial3: true,
        pageTransitionsTheme: const PageTransitionsTheme(
          builders: {
            TargetPlatform.android: CupertinoPageTransitionsBuilder(),
            TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
          },
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
          scrolledUnderElevation: 0,
          centerTitle: false,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: fieldBg,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: primary, width: 1.5),
          ),
        ),
        cupertinoOverrideTheme: const CupertinoThemeData(
          brightness: Brightness.dark,
          primaryColor: primary,
        ),
      );
}

/// Kartu kaca frosted ala iOS (Blur + border hairline halus)
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color? borderColor;
  final double radius;
  final bool blur;

  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.borderColor,
    this.radius = 22,
    this.blur = true,
  });

  @override
  Widget build(BuildContext context) {
    final box = Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white.withOpacity(0.08),
            BorneoTheme.card,
          ],
        ),
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(
          color: borderColor ?? BorneoTheme.border,
          width: 0.9,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.28),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      padding: padding,
      child: child,
    );

    if (!blur) return box;

    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: box,
      ),
    );
  }
}

class IosPill extends StatelessWidget {
  final String text;
  final Color color;
  final IconData? icon;

  const IosPill({
    super.key,
    required this.text,
    required this.color,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.16),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withOpacity(0.35), width: 0.8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            text,
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }
}

class IosSlidingSegment<T extends Object> extends StatelessWidget {
  final T groupValue;
  final Map<T, String> labels;
  final ValueChanged<T> onChanged;

  const IosSlidingSegment({
    super.key,
    required this.groupValue,
    required this.labels,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: CupertinoSlidingSegmentedControl<T>(
        groupValue: groupValue,
        backgroundColor: const Color(0xAA0D1526),
        thumbColor: BorneoTheme.primary,
        padding: const EdgeInsets.all(4),
        children: labels.map(
          (k, label) => MapEntry(
            k,
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 7, horizontal: 6),
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight:
                      groupValue == k ? FontWeight.w700 : FontWeight.w500,
                  color: groupValue == k ? Colors.white : BorneoTheme.textMuted,
                ),
              ),
            ),
          ),
        ),
        onValueChanged: (val) {
          if (val != null) onChanged(val);
        },
      ),
    );
  }
}

class OrbBackdrop extends StatelessWidget {
  final Widget child;
  const OrbBackdrop({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(color: BorneoTheme.bg),
        Positioned(
          top: -70,
          right: -50,
          child: Container(
            width: 240,
            height: 240,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                center: Alignment(-0.3, -0.3),
                colors: [
                  Color(0xFFFDE047),
                  Color(0xFFF59E0B),
                  Color(0x00451A03),
                ],
              ),
            ),
          ),
        ),
        Positioned(
          top: 220,
          right: -90,
          child: Container(
            width: 190,
            height: 190,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [Color(0x550EA5E9), Color(0x00050811)],
              ),
            ),
          ),
        ),
        Positioned(
          bottom: -80,
          left: -60,
          child: Container(
            width: 270,
            height: 270,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                center: Alignment(-0.3, -0.3),
                colors: [
                  Color(0xFF60A5FA),
                  Color(0xFF2563EB),
                  Color(0x000F172A),
                ],
              ),
            ),
          ),
        ),
        child,
      ],
    );
  }
}
