import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/auth_provider.dart';
import '../../core/theme.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Ayarlar')),
        body: ListView(
          children: [
            const _Section(title: 'Hesap'),
            ListTile(
              leading: const Icon(Icons.phone_outlined, color: kPrimary),
              title: const Text('Telefon numarası'),
              subtitle: Text(
                  context.watch<AuthProvider>().user?.phone ?? '',
                  style: const TextStyle(color: kMuted)),
            ),
            const Divider(height: 0),
            ListTile(
              leading: const Icon(Icons.notifications_outlined, color: kPrimary),
              title: const Text('Bildirim tercihleri'),
              trailing: const Icon(Icons.chevron_right, color: kMuted),
              onTap: () {},
            ),
            const _Section(title: 'Uygulama'),
            ListTile(
              leading: const Icon(Icons.info_outline, color: kPrimary),
              title: const Text('Hakkında'),
              subtitle: const Text('Sürüm 1.0.0', style: TextStyle(color: kMuted)),
            ),
            const Divider(height: 0),
            ListTile(
              leading: const Icon(Icons.privacy_tip_outlined, color: kPrimary),
              title: const Text('Gizlilik politikası'),
              trailing: const Icon(Icons.chevron_right, color: kMuted),
              onTap: () {},
            ),
            const Divider(height: 0),
            ListTile(
              leading: const Icon(Icons.description_outlined, color: kPrimary),
              title: const Text('Kullanım koşulları'),
              trailing: const Icon(Icons.chevron_right, color: kMuted),
              onTap: () {},
            ),
            const _Section(title: 'Hesap işlemleri'),
            ListTile(
              leading: const Icon(Icons.logout_rounded, color: kDestructive),
              title: const Text('Çıkış yap',
                  style: TextStyle(color: kDestructive, fontWeight: FontWeight.w600)),
              onTap: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (_) => AlertDialog(
                    title: const Text('Çıkış yap'),
                    content: const Text('Çıkış yapmak istediğinize emin misiniz?'),
                    actions: [
                      TextButton(
                          onPressed: () => Navigator.pop(context, false),
                          child: const Text('İptal')),
                      TextButton(
                        onPressed: () => Navigator.pop(context, true),
                        child: const Text('Çıkış yap',
                            style: TextStyle(color: kDestructive)),
                      ),
                    ],
                  ),
                );
                if (confirm == true && context.mounted) {
                  await context.read<AuthProvider>().signOut();
                }
              },
            ),
            const Divider(height: 0),
            ListTile(
              leading: const Icon(Icons.delete_outline, color: kDestructive),
              title: const Text('Hesabı sil',
                  style: TextStyle(color: kDestructive)),
              onTap: () {},
            ),
          ],
        ),
      );
}

class _Section extends StatelessWidget {
  final String title;
  const _Section({required this.title});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 6),
        child: Text(title.toUpperCase(),
            style: const TextStyle(
                color: kMuted, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.8)),
      );
}
