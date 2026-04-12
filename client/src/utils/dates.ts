import { ARABIC_MONTHS } from '../constants/presets';

export function calcDuration(
  startMonth: number,
  startYear: number,
  endMonth?: number | null,
  endYear?: number | null
): number | null {
  if (!endMonth || !endYear) return null;
  return (endYear * 12 + endMonth) - (startYear * 12 + startMonth);
}

export function formatDurationAr(months: number | null | undefined): string {
  if (months === null || months === undefined) return 'مستمرة';
  if (months <= 0) return 'أقل من شهر';
  if (months < 12) return `${months} شهر`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const yearStr = years === 1 ? 'سنة' : years === 2 ? 'سنتان' : `${years} سنة`;
  if (rem === 0) return yearStr;
  return `${yearStr} و${rem} شهر`;
}

export function formatDateRangeAr(
  startMonth: number,
  startYear: number,
  endMonth?: number | null,
  endYear?: number | null
): string {
  const start = `${ARABIC_MONTHS[startMonth]} ${startYear}`;
  const end = endMonth && endYear
    ? `${ARABIC_MONTHS[endMonth]} ${endYear}`
    : 'الآن';
  return `${start} ← ${end}`;
}

export function validateDates(
  startMonth: number | string,
  startYear: number | string,
  endMonth: number | string | null,
  endYear: number | string | null
): string | null {
  const sm = Number(startMonth);
  const sy = Number(startYear);
  const em = endMonth ? Number(endMonth) : null;
  const ey = endYear ? Number(endYear) : null;

  if (!sm || !sy) return null; // not enough info yet

  if (em && ey) {
    if ((ey * 12 + em) <= (sy * 12 + sm)) {
      return 'تاريخ النهاية لازم يكون بعد تاريخ البداية';
    }
  }
  return null;
}

// Generate year options array descending from current year to 1995
export function getYearOptions(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current; y >= 1995; y--) {
    years.push(y);
  }
  return years;
}
