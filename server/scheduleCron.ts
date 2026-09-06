function matchField(field: string, value: number): boolean {
  if (field === "*") return true;
  return field.split(",").some((part) => {
    if (part.startsWith("*/")) {
      const step = Number(part.slice(2));
      return Number.isFinite(step) && step > 0 && value % step === 0;
    }
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      return value >= start && value <= end;
    }
    return Number(part) === value;
  });
}

export function nextCronDate(expression: string, from = new Date()): Date {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5 && parts.length !== 6) {
    throw new Error("Cron expressions must have 5 or 6 fields.");
  }
  const hasSeconds = parts.length === 6;
  const [secondField, minuteField, hourField, dayField, monthField, weekdayField] = hasSeconds
    ? parts
    : ["0", ...parts];

  const cursor = new Date(from.getTime());
  if (hasSeconds) cursor.setUTCSeconds(cursor.getUTCSeconds() + 1, 0);
  else cursor.setUTCSeconds(0, 0), cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);

  const limit = from.getTime() + 366 * 24 * 60 * 60 * 1000;
  while (cursor.getTime() <= limit) {
    const ok =
      matchField(secondField, cursor.getUTCSeconds()) &&
      matchField(minuteField, cursor.getUTCMinutes()) &&
      matchField(hourField, cursor.getUTCHours()) &&
      matchField(dayField, cursor.getUTCDate()) &&
      matchField(monthField, cursor.getUTCMonth() + 1) &&
      matchField(weekdayField, cursor.getUTCDay());
    if (ok) return new Date(cursor.getTime());
    if (hasSeconds) cursor.setUTCSeconds(cursor.getUTCSeconds() + 1);
    else cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);
  }
  throw new Error("Could not find the next scheduled time for that cron expression.");
}
