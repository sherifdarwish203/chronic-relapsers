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
  endYear?: number | null,
  startDay?: number | null
): string {
  const dayPrefix = startDay ? `${startDay} ` : '';
  const start = `${dayPrefix}${ARABIC_MONTHS[startMonth]} ${startYear}`;
  if (endMonth == null && endYear == null && startDay != null) {
    return start;
  }
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

export function calcAbstinenceDays(
  startMonth: number,
  startYear: number,
  startDay?: number | null
): number {
  const today = new Date();
  const start = new Date(startYear, startMonth - 1, startDay || 1);
  return Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86_400_000));
}

export function formatAbstinenceAr(totalDays: number): string {
  const years = Math.floor(totalDays / 365);
  const rem = totalDays % 365;
  const months = Math.floor(rem / 30);
  const days = rem % 30;
  const parts: string[] = [];
  if (years > 0) parts.push(years === 1 ? 'سنة' : years === 2 ? 'سنتان' : `${years} سنوات`);
  if (months > 0) parts.push(`${months} شهر`);
  if (days > 0 || parts.length === 0) parts.push(`${days} يوم`);
  return parts.join(' و');
}

export interface AbstinenceBadge {
  label: string;
  emoji: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  message: string;
}

export function getAbstinenceBadge(days: number): AbstinenceBadge {
  if (days < 7) return {
    label: 'بداية الرحلة',
    emoji: '🌱',
    colorClass: 'text-green-700',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    message: 'كل يوم بيحسب — إنت بدأت!',
  };
  if (days < 30) return {
    label: 'أسبوع وأكثر',
    emoji: '⭐',
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    message: 'أسبوع صامد — ده إنجاز!',
  };
  if (days < 90) return {
    label: 'شهر وأكثر',
    emoji: '🌟',
    colorClass: 'text-amber-700',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    message: 'شهر صمدت — إنت بتعمل حاجة صعبة!',
  };
  if (days < 180) return {
    label: 'ثلاثة شهور',
    emoji: '🏅',
    colorClass: 'text-orange-700',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-200',
    message: 'ربع سنة وأنت صامد — فخور بيك!',
  };
  if (days < 365) return {
    label: 'نص سنة',
    emoji: '🥈',
    colorClass: 'text-slate-700',
    bgClass: 'bg-slate-50',
    borderClass: 'border-slate-200',
    message: 'ستة شهور وأنت ماشي — قوة حقيقية!',
  };
  if (days < 730) return {
    label: 'سنة كاملة',
    emoji: '🥇',
    colorClass: 'text-yellow-700',
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-300',
    message: 'سنة كاملة! ده إنجاز استثنائي!',
  };
  return {
    label: 'سنتين وأكثر',
    emoji: '🏆',
    colorClass: 'text-purple-700',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    message: 'بطل — مش بيتقال ده!',
  };
}
