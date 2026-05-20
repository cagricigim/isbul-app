import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/api.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  List<Conversation>? _convs;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final c = await getConversations();
      if (mounted) setState(() { _convs = c; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = '$e'; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Mesajlar')),
        body: RefreshIndicator(
          onRefresh: _load,
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: kPrimary))
              : _error != null
                  ? ErrorView(message: _error!, onRetry: _load)
                  : _convs == null || _convs!.isEmpty
                      ? const EmptyState(
                          icon: Icons.chat_bubble_outline,
                          title: 'Henüz mesajınız yok',
                          subtitle: 'Bir teklif kabul edildiğinde sohbet başlayacak.',
                        )
                      : ListView.separated(
                          itemCount: _convs!.length,
                          separatorBuilder: (_, __) => const Divider(height: 0, indent: 72),
                          itemBuilder: (_, i) => _ConvTile(conv: _convs![i]),
                        ),
        ),
      );
}

class _ConvTile extends StatelessWidget {
  final Conversation conv;
  const _ConvTile({required this.conv});

  @override
  Widget build(BuildContext context) {
    final other = conv.otherUser;
    final name = other?.workerProfile?.bio?.split(' ').first ??
        other?.employerProfile?.companyName ??
        other?.phone ??
        'Kullanıcı';
    final photo = other?.workerProfile?.photoUrl ?? other?.employerProfile?.logoUrl;

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      leading: AppAvatar(url: photo, initials: name, size: 48),
      title: Text(name, style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text(
        conv.lastMessage ?? 'Sohbet başladı',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(color: kMuted, fontSize: 13),
      ),
      trailing: conv.unreadCount > 0
          ? Container(
              width: 22,
              height: 22,
              decoration: const BoxDecoration(color: kPrimary, shape: BoxShape.circle),
              child: Center(
                child: Text('${conv.unreadCount}',
                    style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
              ),
            )
          : null,
      onTap: () => context.push('/chat/${conv.id}'),
    );
  }
}
