const dtfDate = new Intl.DateTimeFormat("bg-BG", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const dtfTime = new Intl.DateTimeFormat("bg-BG", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatDate(iso: string) {
  const d = new Date(iso);
  return dtfDate.format(d);
}

export function formatTime(iso: string) {
  const d = new Date(iso);
  return dtfTime.format(d);
}

export function formatDateTime(iso: string) {
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

export function relativeTime(iso: string) {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = (t - now) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return diff > 0 ? "след малко" : "току що";
  if (abs < 3600) {
    const m = Math.round(abs / 60);
    return diff > 0 ? `след ${m} мин` : `преди ${m} мин`;
  }
  if (abs < 86400) {
    const h = Math.round(abs / 3600);
    return diff > 0 ? `след ${h} ч` : `преди ${h} ч`;
  }
  const d = Math.round(abs / 86400);
  return diff > 0 ? `след ${d} дни` : `преди ${d} дни`;
}
