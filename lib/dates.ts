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
