export interface DateInput {
  start_month: number;
  start_year: number;
  end_month?: number | null;
  end_year?: number | null;
}

export function validatePeriodDates(data: DateInput): string | null {
  const { start_month, start_year, end_month, end_year } = data;

  if (!start_month || !start_year) {
    return 'تاريخ البداية مطلوب';
  }

  if (start_month < 1 || start_month > 12) {
    return 'شهر البداية غير صالح';
  }

  // Only validate end date if both end fields are provided
  if (end_month && end_year) {
    if (end_month < 1 || end_month > 12) {
      return 'شهر النهاية غير صالح';
    }
    const startAbsolute = start_year * 12 + start_month;
    const endAbsolute = end_year * 12 + end_month;
    if (endAbsolute <= startAbsolute) {
      return 'تاريخ النهاية لازم يكون بعد تاريخ البداية';
    }
  }

  return null;
}

export function calcDurationMonths(
  startMonth: number,
  startYear: number,
  endMonth?: number | null,
  endYear?: number | null
): number | null {
  if (!endMonth || !endYear) return null;
  return (endYear * 12 + endMonth) - (startYear * 12 + startMonth);
}

// Sanitise a string: trim and strip basic HTML to prevent XSS
export function sanitiseText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, 2000);
}

export function sanitiseArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is string => typeof item === 'string')
    .map((item) => sanitiseText(item))
    .slice(0, 50);
}
