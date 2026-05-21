import 'dart:convert';
  import 'package:http/http.dart' as http;
  import 'package:flutter_secure_storage/flutter_secure_storage.dart';

  const _base = 'https://api.isinebakk.app';
  const _storage = FlutterSecureStorage();
  const _tokenKey = 'isbul.token';

  // ─── Models ────────────────────────────────────────────────────────────────

  class WorkerProfile {
    final String? bio, location, gender, education;
    final String? dob;
    final bool? hasDisability, isStudent;
    final List<String> skills;
    final String? photoUrl;
    final bool isComplete;

    WorkerProfile.fromJson(Map<String, dynamic> j)
        : bio = j['bio'],
          location = j['location'],
          gender = j['gender'],
          education = j['education'],
          dob = j['dob'],
          hasDisability = j['hasDisability'],
          isStudent = j['isStudent'],
          skills = List<String>.from(j['skills'] ?? []),
          photoUrl = j['photoUrl'],
          isComplete = j['isComplete'] ?? false;
  }

  class EmployerProfile {
    final String? companyName, sector, title, taxNumber, logoUrl;
    final bool isVerified, isComplete;

    EmployerProfile.fromJson(Map<String, dynamic> j)
        : companyName = j['companyName'],
          sector = j['sector'],
          title = j['title'],
          taxNumber = j['taxNumber'],
          logoUrl = j['logoUrl'],
          isVerified = j['isVerified'] ?? false,
          isComplete = j['isComplete'] ?? false;
  }

  class AppUser {
    final String id, phone;
    final String? role;
    final bool isAdmin;
    final String subscriptionTier;
    final WorkerProfile? workerProfile;
    final EmployerProfile? employerProfile;

    AppUser.fromJson(Map<String, dynamic> j)
        : id = j['id'],
          phone = j['phone'],
          role = j['role'],
          isAdmin = j['isAdmin'] ?? false,
          subscriptionTier = j['subscriptionTier'] ?? 'free',
          workerProfile = j['workerProfile'] != null
              ? WorkerProfile.fromJson(j['workerProfile'])
              : null,
          employerProfile = j['employerProfile'] != null
              ? EmployerProfile.fromJson(j['employerProfile'])
              : null;

    bool get isWorker => role == 'worker';
    bool get isEmployer => role == 'employer';
    bool get isPremium => subscriptionTier != 'free';
  }

  class Job {
    final String id, title, position, category, location, employmentType;
    final int? salaryMin, salaryMax;
    final String status, createdAt;
    final EmployerProfile? employer;
    final String? workDate;

    Job.fromJson(Map<String, dynamic> j)
        : id = j['id'],
          title = j['title'],
          position = j['position'] ?? '',
          category = j['category'] ?? '',
          location = j['location'] ?? '',
          employmentType = j['employmentType'] ?? '',
          salaryMin = j['salaryMin'],
          salaryMax = j['salaryMax'],
          status = j['status'] ?? 'open',
          createdAt = j['createdAt'] ?? '',
          employer = j['employer'] != null
              ? EmployerProfile.fromJson(j['employer'])
              : null,
          workDate = j['workDate'];
  }

  class WorkerListItem {
    final String id;
    final WorkerProfile? profile;
    final String phone;

    WorkerListItem.fromJson(Map<String, dynamic> j)
        : id = j['id'],
          phone = j['phone'] ?? '',
          profile = j['workerProfile'] != null
              ? WorkerProfile.fromJson(j['workerProfile'])
              : null;
  }

  class Offer {
    final String id, status, createdAt;
    final Job? job;
    final WorkerListItem? worker;
    final String? employerId;

    Offer.fromJson(Map<String, dynamic> j)
        : id = j['id'],
          status = j['status'] ?? 'pending',
          createdAt = j['createdAt'] ?? '',
          job = j['job'] != null ? Job.fromJson(j['job']) : null,
          worker = j['worker'] != null ? WorkerListItem.fromJson(j['worker']) : null,
          employerId = j['employerId'];
  }

  class Conversation {
    final String id;
    final String? lastMessage;
    final int unreadCount;
    final String createdAt;
    final AppUser? otherUser;

    Conversation.fromJson(Map<String, dynamic> j)
        : id = j['id'],
          lastMessage = j['lastMessage'],
          unreadCount = j['unreadCount'] ?? 0,
          createdAt = j['createdAt'] ?? '',
          otherUser = j['otherUser'] != null
              ? AppUser.fromJson(j['otherUser'])
              : null;
  }

  class Message {
    final String id, content, senderId, createdAt;

    Message.fromJson(Map<String, dynamic> j)
        : id = j['id'],
          content = j['content'],
          senderId = j['senderId'],
          createdAt = j['createdAt'] ?? '';
  }

  // ─── HTTP client ────────────────────────────────────────────────────────────

  class ApiException implements Exception {
    final int statusCode;
    final String message;
    ApiException(this.statusCode, this.message);
    @override
    String toString() => message;
  }

  Future<String?> getToken() => _storage.read(key: _tokenKey);
  Future<void> saveToken(String token) => _storage.write(key: _tokenKey, value: token);
  Future<void> clearToken() => _storage.delete(key: _tokenKey);

  Future<Map<String, String>> _headers() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<dynamic> apiGet(String path, {Map<String, String>? query}) async {
    final uri = Uri.parse('$_base$path').replace(queryParameters: query);
    final resp = await http.get(uri, headers: await _headers());
    return _parse(resp);
  }

  Future<dynamic> apiPost(String path, {Map<String, dynamic>? body}) async {
    final resp = await http.post(
      Uri.parse('$_base$path'),
      headers: await _headers(),
      body: jsonEncode(body ?? {}),
    );
    return _parse(resp);
  }

  Future<dynamic> apiPatch(String path, {Map<String, dynamic>? body}) async {
    final resp = await http.patch(
      Uri.parse('$_base$path'),
      headers: await _headers(),
      body: jsonEncode(body ?? {}),
    );
    return _parse(resp);
  }

  Future<dynamic> apiDelete(String path) async {
    final resp = await http.delete(Uri.parse('$_base$path'), headers: await _headers());
    return _parse(resp);
  }

  dynamic _parse(http.Response resp) {
    if (resp.body.isEmpty) return null;
    final decoded = jsonDecode(utf8.decode(resp.bodyBytes));
    if (resp.statusCode >= 400) {
      throw ApiException(resp.statusCode, decoded['message'] ?? 'Bir hata oluştu');
    }
    return decoded;
  }

  // ─── API calls ──────────────────────────────────────────────────────────────

  // Auth
  Future<Map<String, dynamic>> requestCode(String phone) async =>
      await apiPost('/api/auth/request-code', body: {'phone': phone});

  Future<Map<String, dynamic>> verifyCode(String requestId, String code) async =>
      await apiPost('/api/auth/verify-code', body: {'requestId': requestId, 'code': code});

  Future<void> selectRole(String role) =>
      apiPost('/api/auth/select-role', body: {'role': role});

  Future<void> logout() => apiPost('/api/auth/logout');

  // Me
  Future<AppUser> getMe() async {
    final data = await apiGet('/api/me');
    return AppUser.fromJson(data);
  }

  Future<void> savePushToken(String token) =>
      apiPost('/api/me/push-token', body: {'token': token});

  Future<AppUser> updateWorkerProfile(Map<String, dynamic> data) async {
    final res = await apiPatch('/api/me/worker-profile', body: data);
    return AppUser.fromJson(res);
  }

  Future<AppUser> updateEmployerProfile(Map<String, dynamic> data) async {
    final res = await apiPatch('/api/me/employer-profile', body: data);
    return AppUser.fromJson(res);
  }

  // Workers
  Future<List<WorkerListItem>> getWorkers({Map<String, String>? query}) async {
    final data = await apiGet('/api/workers', query: query);
    return (data['workers'] as List).map((w) => WorkerListItem.fromJson(w)).toList();
  }

  Future<WorkerListItem> getWorker(String id) async {
    final data = await apiGet('/api/workers/$id');
    return WorkerListItem.fromJson(data);
  }

  // Jobs
  Future<List<Job>> getOpenJobs({Map<String, String>? query}) async {
    final data = await apiGet('/api/jobs/open', query: query);
    return (data as List).map((j) => Job.fromJson(j)).toList();
  }

  Future<List<Job>> getMyJobs() async {
    final data = await apiGet('/api/jobs/mine');
    return (data as List).map((j) => Job.fromJson(j)).toList();
  }

  Future<Job> getJob(String id) async {
    final data = await apiGet('/api/jobs/$id');
    return Job.fromJson(data);
  }

  Future<Job> createJob(Map<String, dynamic> body) async {
    final data = await apiPost('/api/jobs', body: body);
    return Job.fromJson(data);
  }

  Future<Job> updateJob(String id, Map<String, dynamic> body) async {
    final data = await apiPatch('/api/jobs/$id', body: body);
    return Job.fromJson(data);
  }

  // Offers
  Future<List<Offer>> getIncomingOffers() async {
    final data = await apiGet('/api/offers/incoming');
    return (data as List).map((o) => Offer.fromJson(o)).toList();
  }

  Future<void> sendOffer(String workerId, String jobId) =>
      apiPost('/api/offers', body: {'workerId': workerId, 'jobId': jobId});

  Future<void> respondOffer(String offerId, String status) =>
      apiPatch('/api/offers/$offerId', body: {'status': status});

  // Conversations
  Future<List<Conversation>> getConversations() async {
    final data = await apiGet('/api/conversations');
    return (data as List).map((c) => Conversation.fromJson(c)).toList();
  }

  Future<Conversation> openConversation(String offerId) async {
    final data = await apiPost('/api/conversations', body: {'offerId': offerId});
    return Conversation.fromJson(data);
  }

  Future<List<Message>> getMessages(String conversationId) async {
    final data = await apiGet('/api/conversations/$conversationId/messages');
    return (data as List).map((m) => Message.fromJson(m)).toList();
  }

  Future<Message> sendMessage(String conversationId, String content) async {
    final data = await apiPost('/api/conversations/$conversationId/messages',
        body: {'content': content});
    return Message.fromJson(data);
  }

  // Boost
  Future<void> purchaseBoost() => apiPost('/api/me/boost');

  // Subscription
  Future<void> syncSubscription(String productId) =>
      apiPost('/api/me/subscription/sync', body: {'productId': productId});

  // Upload
  Future<String> uploadImage(String base64) async {
    final data = await apiPost('/api/uploads/image', body: {'image': base64});
    return data['url'];
  }

  // Notifications
  Future<Map<String, dynamic>> getNotificationPrefs() async =>
      (await apiGet('/api/me/notification-preferences')) as Map<String, dynamic>;

  Future<void> updateNotificationPrefs(Map<String, dynamic> data) =>
      apiPatch('/api/me/notification-preferences', body: data);
  