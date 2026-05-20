import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/auth_provider.dart';
import 'core/router.dart';
import 'core/theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final auth = AuthProvider();
  await auth.init();
  runApp(
    ChangeNotifierProvider.value(
      value: auth,
      child: IsBulApp(auth: auth),
    ),
  );
}

class IsBulApp extends StatelessWidget {
  final AuthProvider auth;
  const IsBulApp({super.key, required this.auth});

  @override
  Widget build(BuildContext context) {
    final router = createRouter(auth);
    return MaterialApp.router(
      title: 'İşine Bak',
      debugShowCheckedModeBanner: false,
      theme: appTheme,
      routerConfig: router,
    );
  }
}
