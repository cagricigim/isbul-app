type NotifsBadge = {
  setBadgeCountAsync: (count: number) => Promise<boolean>;
};

const NotifsBadge: NotifsBadge | null = (() => {
  try {
    return require("expo-notifications") as NotifsBadge;
  } catch {
    return null;
  }
})();

export function setBadgeCount(count: number): void {
  void NotifsBadge?.setBadgeCountAsync(Math.max(0, count));
}
