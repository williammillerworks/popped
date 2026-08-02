export const DEFAULT_PUZZLE_TIME_ZONE = "Asia/Seoul";

export function getTodayDateInTimeZone(
  timeZone = DEFAULT_PUZZLE_TIME_ZONE,
): string {
  const dateParts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(new Date());

  const year = getDatePart(dateParts, "year");
  const month = getDatePart(dateParts, "month");
  const day = getDatePart(dateParts, "day");

  return `${year}-${month}-${day}`;
}

export function getHourInTimeZone(
  timeZone = DEFAULT_PUZZLE_TIME_ZONE,
): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone,
    }).format(new Date()),
  );
}

export function getPreviousCalendarDate(date: string): string {
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  parsedDate.setUTCDate(parsedDate.getUTCDate() - 1);
  return parsedDate.toISOString().slice(0, 10);
}

export function formatPuzzleDisplayDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

function getDatePart(
  dateParts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
) {
  const value = dateParts.find((part) => part.type === type)?.value;

  if (!value) {
    throw new Error(`Unable to format ${type} for puzzle date.`);
  }

  return value;
}
