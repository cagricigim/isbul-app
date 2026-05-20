import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/api.dart';
import '../../core/auth_provider.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class RoleScreen extends StatefulWidget {
  const RoleScreen({super.key});

  @override
  State<RoleScreen> createState() => _RoleScreenState();
}

class _RoleScreenState extends State<RoleScreen> {
  String? _selected;
  bool _loading = false;

  Future<void> _submit() async {
    if (_selected == null) return;
    setState(() => _loading = true);
    try {
      await selectRole(_selected!);
      await context.read<AuthProvider>().refreshUser();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Spacer(),
                const Text('Sen kimsin?',
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                const Text('Platformu nasıl kullanacağını seç.',
                    style: TextStyle(color: kMuted, fontSize: 15)),
                const SizedBox(height: 32),
                _RoleTile(
                  icon: Icons.engineering_rounded,
                  title: 'İş arıyorum',
                  subtitle: 'Teklifler al, işverenlere başvur',
                  selected: _selected == 'worker',
                  onTap: () => setState(() => _selected = 'worker'),
                ),
                const SizedBox(height: 12),
                _RoleTile(
                  icon: Icons.business_center_rounded,
                  title: 'İşçi arıyorum',
                  subtitle: 'İlan ver, çalışan bul',
                  selected: _selected == 'employer',
                  onTap: () => setState(() => _selected = 'employer'),
                ),
                const SizedBox(height: 32),
                AppButton(
                  label: 'Devam et',
                  onPressed: _selected != null ? _submit : null,
                  loading: _loading,
                ),
                const Spacer(),
              ],
            ),
          ),
        ),
      );
}

class _RoleTile extends StatelessWidget {
  final IconData icon;
  final String title, subtitle;
  final bool selected;
  final VoidCallback onTap;

  const _RoleTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: selected ? kPrimary.withOpacity(0.06) : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? kPrimary : kBorder,
              width: selected ? 2 : 1,
            ),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: selected ? kPrimary : kBackground,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon,
                    color: selected ? Colors.white : kMuted, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w700)),
                    Text(subtitle,
                        style: const TextStyle(color: kMuted, fontSize: 13)),
                  ],
                ),
              ),
              if (selected)
                const Icon(Icons.check_circle_rounded, color: kPrimary),
            ],
          ),
        ),
      );
}
