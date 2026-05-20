import 'package:flutter/material.dart';
import 'api.dart';

enum AuthStatus { loading, unauthenticated, authenticated }

class AuthProvider extends ChangeNotifier {
  AuthStatus _status = AuthStatus.loading;
  AppUser? _user;

  AuthStatus get status => _status;
  AppUser? get user => _user;
  bool get isLoading => _status == AuthStatus.loading;
  bool get isAuthenticated => _status == AuthStatus.authenticated;

  Future<void> init() async {
    final token = await getToken();
    if (token == null) {
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }
    try {
      _user = await getMe();
      _status = AuthStatus.authenticated;
    } catch (_) {
      await clearToken();
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<void> loginWithToken(String token, AppUser user) async {
    await saveToken(token);
    _user = user;
    _status = AuthStatus.authenticated;
    notifyListeners();
  }

  Future<void> refreshUser() async {
    try {
      _user = await getMe();
      notifyListeners();
    } catch (_) {}
  }

  Future<void> signOut() async {
    try {
      await logout();
    } catch (_) {}
    await clearToken();
    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  void updateUser(AppUser user) {
    _user = user;
    notifyListeners();
  }
}
