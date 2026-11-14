import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'models/models.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'services/notification_service.dart';
import 'services/session_service.dart';
import 'theme/borneo_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await NotificationService.instance.init();
  runApp(const RotiBakarBorneoApp());
}

class RotiBakarBorneoApp extends StatelessWidget {
  const RotiBakarBorneoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Roti Bakar Borneo',
      debugShowCheckedModeBanner: false,
      theme: BorneoTheme.iosDarkTheme(),
      home: FutureBuilder<KaryawanData?>(
        future: SessionService.getUser(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Scaffold(
              body: OrbBackdrop(
                child: Center(child: CupertinoActivityIndicator(radius: 16)),
              ),
            );
          }
          final user = snapshot.data;
          if (user != null) {
            return HomeScreen(user: user);
          }
          return const LoginScreen();
        },
      ),
    );
  }
}
