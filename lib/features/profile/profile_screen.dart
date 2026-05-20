import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/auth_provider.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    if (user == null) return const SizedBox.shrink();

    final isWorker = user.isWorker;
    final wp = user.workerProfile;
    final ep = user.employerProfile;
    final name = isWorker
        ? (wp?.bio?.split('\n').first ?? 'Profil')
        : (ep?.companyName ?? 'Firma');
    final photo = isWorker ? wp?.photoUrl : ep?.logoUrl;
    final subtitle = isWorker ? wp?.location : ep?.sector;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push('/settings'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 32),
              color: Colors.white,
              child: Column(
                children: [
                  AppAvatar(url: photo, initials: name, size: 80),
                  const SizedBox(height: 14),
                  Text(name,
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                  if (subtitle != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(subtitle,
                          style: const TextStyle(color: kMuted, fontSize: 14)),
                    ),
                  if (user.isPremium)
                    Container(
                      margin: const EdgeInsets.only(top: 10),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [Color(0xFFFFD700), Color(0xFFFFA500)]),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text('⭐ Premium',
                          style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
                    ),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.edit_outlined, size: 16),
                    label: const Text('Profili düzenle'),
                    onPressed: () => context.push(
                        isWorker ? '/profile/edit-worker' : '/profile/edit-employer'),
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size(0, 40),
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            if (isWorker) ...[
              _MenuTile(
                icon: Icons.rocket_launch_outlined,
                title: 'Profilimi öne çıkar',
                subtitle: 'Daha fazla işveren görsün',
                onTap: () => context.push('/boost'),
                badge: 'BOOST',
              ),
            ] else ...[
              _MenuTile(
                icon: Icons.people_outline,
                title: 'Profil görüntülemeleri',
                subtitle: 'Kim profilinizi gördü',
                onTap: () {},
              ),
            ],
            _MenuTile(
              icon: Icons.star_border_rounded,
              title: 'Premium üyelik',
              subtitle: 'Tüm özelliklere erişin',
              onTap: () => context.push('/premium'),
              badge: user.isPremium ? null : 'YENİ',
            ),
            _MenuTile(
              icon: Icons.notifications_outlined,
              title: 'Bildirimler',
              subtitle: 'Bildirim tercihlerini yönet',
              onTap: () {},
            ),
            _MenuTile(
              icon: Icons.help_outline_rounded,
              title: 'Yardım & Destek',
              onTap: () {},
            ),
            const SizedBox(height: 8),
            _MenuTile(
              icon: Icons.logout_rounded,
              title: 'Çıkış yap',
              textColor: kDestructive,
              onTap: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (_) => AlertDialog(
                    title: const Text('Çıkış yap'),
                    content: const Text('Çıkış yapmak istediğinize emin misiniz?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('İptal')),
                      TextButton(
                        onPressed: () => Navigator.pop(context, true),
                        child: const Text('Çıkış yap', style: TextStyle(color: kDestructive)),
                      ),
                    ],
                  ),
                );
                if (confirm == true && context.mounted) {
                  await context.read<AuthProvider>().signOut();
                }
              },
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle, badge;
  final Color? textColor;
  final VoidCallback? onTap;

  const _MenuTile({
    required this.icon,
    required this.title,
    this.subtitle,
    this.badge,
    this.textColor,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) => ListTile(
        tileColor: Colors.white,
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: (textColor ?? kPrimary).withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: textColor ?? kPrimary, size: 20),
        ),
        title: Text(title,
            style: TextStyle(
                fontWeight: FontWeight.w600,
                color: textColor,
                fontSize: 15)),
        subtitle: subtitle != null
            ? Text(subtitle!, style: const TextStyle(color: kMuted, fontSize: 13))
            : null,
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (badge != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: kPrimary,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(badge!,
                    style: const TextStyle(
                        color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)),
              ),
            if (textColor == null) const Icon(Icons.chevron_right, color: kMuted),
          ],
        ),
        onTap: onTap,
      );
}
