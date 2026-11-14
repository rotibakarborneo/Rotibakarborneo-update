import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/notification_service.dart';
import '../services/session_service.dart';
import '../theme/borneo_theme.dart';
import 'karyawan/bon_screen.dart';
import 'login_screen.dart';

class ProfilTab extends StatelessWidget {
  final KaryawanData user;
  const ProfilTab({super.key, required this.user});

  Future<void> _logout(BuildContext context) async {
    final confirm = await showCupertinoDialog<bool>(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: const Text('Keluar Akun?'),
        content: Text('Sesi untuk ${user.nama} akan ditutup.'),
        actions: [
          CupertinoDialogAction(
            child: const Text('Batal'),
            onPressed: () => Navigator.pop(ctx, false),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            child: const Text('Keluar'),
            onPressed: () => Navigator.pop(ctx, true),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    NotificationService.instance.stopPolling();
    await SessionService.logout();
    if (!context.mounted) return;
    Navigator.pushAndRemoveUntil(
      context,
      CupertinoPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        GlassCard(
          child: Row(
            children: [
              Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [BorneoTheme.primary, Color(0xFF2563EB)],
                  ),
                  borderRadius: BorderRadius.circular(18),
                ),
                alignment: Alignment.center,
                child: Text(
                  user.nama.isNotEmpty ? user.nama[0].toUpperCase() : 'B',
                  style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.nama,
                      style: const TextStyle(
                          fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${user.idKaryawan} • ${user.role}',
                      style: const TextStyle(
                          fontSize: 13, color: BorneoTheme.textMuted),
                    ),
                    const SizedBox(height: 6),
                    IosPill(
                      text: 'Cabang ${user.idCabang}',
                      color: BorneoTheme.accent,
                      icon: CupertinoIcons.location_solid,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        GlassCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              if (!user.isBos) ...[
                ListTile(
                  leading: const Icon(CupertinoIcons.creditcard_fill,
                      color: BorneoTheme.accent),
                  title: const Text('Ajukan / Cek Kasbon'),
                  trailing: const Icon(CupertinoIcons.chevron_forward,
                      size: 16, color: BorneoTheme.textMuted),
                  onTap: () {
                    Navigator.push(
                      context,
                      CupertinoPageRoute(builder: (_) => BonScreen(user: user)),
                    );
                  },
                ),
                const Divider(height: 1, color: BorneoTheme.border),
              ],
              ListTile(
                leading: const Icon(CupertinoIcons.bell_circle_fill,
                    color: BorneoTheme.primary),
                title: const Text('Tes Notifikasi Outlet'),
                subtitle: const Text('Cek suara & banner notifikasi di HP',
                    style:
                        TextStyle(fontSize: 12, color: BorneoTheme.textMuted)),
                trailing: const Icon(CupertinoIcons.chevron_forward,
                    size: 16, color: BorneoTheme.textMuted),
                onTap: () {
                  NotificationService.instance.pushAlert(
                    title: 'Notifikasi Aktif',
                    body:
                        'Anda akan mendapat pemberitahuan otomatis saat outlet buka, tutup, atau ada kasbon.',
                    category: 'BUKA',
                  );
                },
              ),
              const Divider(height: 1, color: BorneoTheme.border),
              ListTile(
                leading: const Icon(CupertinoIcons.square_arrow_right,
                    color: BorneoTheme.danger),
                title: const Text(
                  'Keluar Akun',
                  style: TextStyle(
                      color: BorneoTheme.danger, fontWeight: FontWeight.w600),
                ),
                onTap: () => _logout(context),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
