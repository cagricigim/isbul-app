export function toIso(display: string): string {
  const digits = display.replace(/\D/g, "");
  if (digits.length === 8) {
    const d = digits.slice(0, 2);
    const m = digits.slice(2, 4);
    const y = digits.slice(4, 8);
    return `${y}-${m}-${d}`;
  }
  return display;
}

export function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (y && m && d) return `${d}/${m}/${y}`;
  return iso;
}

export function formatDateTr(value: string | Date | undefined | null): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTimeTr(value: string | Date | undefined | null): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export function relativeTr(value: string | Date | undefined | null): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "şimdi";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} dk`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} sa`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)} g`;
  return formatDateTr(d);
}

export function formatWorkDate(s?: string | null): string {
  if (!s) return "";
  const d = new Date(s + "T00:00:00");
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", weekday: "short" });
}

export function formatWorkDateLong(s?: string | null): string {
  if (!s) return "";
  const d = new Date(s + "T00:00:00");
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric", weekday: "long" });
}

export function employmentTypeLabel(type: string): string {
  switch (type) {
    case "fullTime":
      return "Tam zamanlı";
    case "partTime":
      return "Yarı zamanlı";
    case "daily":
      return "Günlük";
    default:
      return type;
  }
}

export function offerStatusLabel(status: string): { text: string; color: string } {
  switch (status) {
    case "pending":
      return { text: "Bekliyor", color: "#F79009" };
    case "accepted":
      return { text: "Kabul edildi", color: "#12B76A" };
    case "rejected":
      return { text: "Reddedildi", color: "#F04438" };
    default:
      return { text: status, color: "#667085" };
  }
}
