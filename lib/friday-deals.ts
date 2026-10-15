const WAT_OFFSET_MS = 60 * 60 * 1000;
const FRIDAY = 5;
const HOUR_MS = 60 * 60 * 1000;

export type FridayDealWindow = {
  active: boolean;
  target: Date;
};

/** Friday 01:00–02:00 in Africa/Lagos (WAT is UTC+1 year-round). */
export function getFridayDealWindow(now = new Date()): FridayDealWindow {
  const wat = new Date(now.getTime() + WAT_OFFSET_MS);
  const day = wat.getUTCDay();
  const daysUntilFriday = (FRIDAY - day + 7) % 7;
  const fridayOneAmWat = Date.UTC(
    wat.getUTCFullYear(), wat.getUTCMonth(), wat.getUTCDate() + daysUntilFriday, 1,
  );
  let start = fridayOneAmWat - WAT_OFFSET_MS;
  const end = start + HOUR_MS;

  if (now.getTime() >= start && now.getTime() < end) {
    return { active: true, target: new Date(end) };
  }
  if (now.getTime() >= end) start += 7 * 24 * HOUR_MS;
  return { active: false, target: new Date(start) };
}

export function isFridayDealActive(now = new Date()) {
  return getFridayDealWindow(now).active;
}

export function formatCountdown(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  const clock = [hours, minutes, remainder].map((part) => String(part).padStart(2, "0")).join(":");
  return days > 0 ? `${days}d ${clock}` : clock;
}
