export function addMonths(date, months) {
  const result = new Date(date.getTime());
  const dayOfMonth = result.getUTCDate();

  // Shift from the 1st so the month arithmetic can never overflow: setting the
  // month while sitting on the 31st would turn "Feb 31" into March 3rd.
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);

  // Day 0 of the following month is the last day of this one.
  const lastDayOfMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();

  result.setUTCDate(Math.min(dayOfMonth, lastDayOfMonth));

  return result;
}
