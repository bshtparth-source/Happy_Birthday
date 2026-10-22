/**
 * Derives age statistics from an ISO birthdate string using timezone-safe local date math.
 * @param {string} birthDateStr - ISO date string in YYYY-MM-DD format
 * @returns {{ years: number, months: number, days: number, hours: number }}
 */
export function deriveStats(birthDateStr) {
  if (!birthDateStr || typeof birthDateStr !== 'string') {
    return { years: 0, months: 0, days: 0, hours: 0 };
  }

  const parts = birthDateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return { years: 0, months: 0, days: 0, hours: 0 };
  }

  const [year, month, day] = parts;
  const birth = new Date(year, month - 1, day);
  const now = new Date();

  const diffMs = Math.max(0, now.getTime() - birth.getTime());
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const totalMonths = Math.floor(totalDays / 30.4375);

  let years = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    years--;
  }

  return {
    years: Math.max(0, years),
    months: totalMonths,
    days: totalDays,
    hours: totalHours,
  };
}
