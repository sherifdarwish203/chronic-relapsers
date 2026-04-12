export const SUBSTANCES = [
  'كحول',
  'أفيونات',
  'قنب',
  'بنزوديازيبينات',
  'كوكايين',
  'منشطات',
  'متعدد المواد',
  'أخرى',
] as const;

export const FEELINGS = [
  'وحدة',
  'غضب',
  'حزن',
  'خوف',
  'خجل',
  'ملل',
  'ضغط نفسي',
  'إحباط',
  'قلق',
  'ألم',
  'تعب',
  'فرحة مفرطة',
  'يأس',
  'فراغ داخلي',
] as const;

export const EXTERNAL_TRIGGERS = [
  'خلاف مع شخص قريب',
  'مشكلة مادية',
  'ضغط في العمل',
  'مناسبة اجتماعية',
  'تعرض للمادة',
  'مكان مرتبط بالتعاطي',
  'خسارة أو فقدان',
  'تغيير مفاجئ',
  'ضغوط أسرية',
  'فراق أو طلاق',
  'أخرى',
] as const;

export const INTERNAL_TRIGGERS = [
  'أفكار تدفع للتعاطي',
  'إيقاف الدواء',
  'مشاكل في النوم',
  'ألم جسدي',
  'نوبة اكتئاب',
  'نوبة قلق',
  'إحساس بالشفاء التام',
  'إنكار المشكلة',
  'أخرى',
] as const;

export const PERIOD_TYPES = {
  abstinent: 'فترة امتناع',
  relapse: 'انتكاسة / عودة للتعاطي',
  reduced: 'تعاطي منخفض',
} as const;

export const ARABIC_MONTHS = [
  '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
] as const;

export const TIMEFRAMES: Record<string, string> = {
  same_day: 'نفس اليوم',
  days: 'أيام قبلها',
  weeks: 'أسابيع قبلها',
  months: 'شهور قبلها',
};

export const CLASSIFICATIONS: Record<string, string> = {
  i: 'أسباب داخلية (أفكار ومشاعر)',
  x: 'أسباب خارجية (أحداث وناس)',
  b: 'الاثنان معاً',
};

export const SAW_IT_COMING: Record<string, string> = {
  y: 'آه',
  p: 'نص نص',
  n: 'لأ، فاجأتني',
};
