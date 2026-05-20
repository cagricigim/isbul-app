import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Bildirimler')),
        body: const EmptyState(
          icon: Icons.notifications_outlined,
          title: 'Bildirim yok',
          subtitle: 'Yeni teklifler, mesajlar ve güncellemeler burada görünecek.',
        ),
      );
}
