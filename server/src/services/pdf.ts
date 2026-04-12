import pool from '../db';
import { getPatientAnalytics } from './analytics';

const ARABIC_MONTHS = [
  '', 'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'
];

function formatDurationMonths(months: number | null): string {
  if (!months || months <= 0) return 'أقل من شهر';
  if (months < 12) return `${months} شهر`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return years === 1 ? 'سنة' : years === 2 ? 'سنتان' : `${years} سنة`;
  return `${years === 1 ? 'سنة' : years === 2 ? 'سنتان' : `${years} سنة`} و${rem} شهر`;
}

function periodTypeAr(type: string): string {
  if (type === 'abstinent') return 'فترة امتناع';
  if (type === 'relapse') return 'انتكاسة';
  return 'تعاطي منخفض';
}

function classificationLabel(c: string): string {
  if (c === 'i') return 'داخلي';
  if (c === 'x') return 'خارجي';
  return 'الاثنان';
}

function sawItComingLabel(s: string): string {
  if (s === 'y') return 'نعم';
  if (s === 'p') return 'جزئياً';
  return 'لا';
}

export async function generatePatientPDF(patientId: number): Promise<Buffer> {
  let puppeteer: typeof import('puppeteer');
  try {
    puppeteer = await import('puppeteer');
  } catch {
    throw new Error('Puppeteer not available');
  }

  const patientResult = await pool.query('SELECT * FROM patients WHERE id = $1', [patientId]);
  if (patientResult.rows.length === 0) throw new Error('Patient not found');
  const patient = patientResult.rows[0];

  const periodsResult = await pool.query(
    `SELECT * FROM periods WHERE patient_id = $1 ORDER BY (start_year * 12 + start_month) ASC`,
    [patientId]
  );
  const periods = await Promise.all(
    periodsResult.rows.map(async (period) => {
      const eventsResult = await pool.query(
        'SELECT * FROM events WHERE period_id = $1 ORDER BY created_at ASC',
        [period.id]
      );
      return { ...period, events: eventsResult.rows };
    })
  );

  const analytics = await getPatientAnalytics(patientId);

  const periodRows = periods.map((p) => {
    const dateRange = `${ARABIC_MONTHS[p.start_month]} ${p.start_year} → ${p.end_month ? `${ARABIC_MONTHS[p.end_month]} ${p.end_year}` : 'الآن'}`;
    const eventRows = p.events.map((e: Record<string, unknown>) => `
      <tr>
        <td>${String(e.description || '')}</td>
        <td>${(e.feelings as string[] || []).join('، ')}</td>
        <td>${(e.external_triggers as string[] || []).join('، ')}</td>
        <td>${(e.internal_triggers as string[] || []).join('، ')}</td>
        <td>${classificationLabel(String(e.classification || ''))}</td>
        <td>${sawItComingLabel(String(e.saw_it_coming || ''))}</td>
      </tr>`).join('');
    const eventsTable = p.events.length > 0 ? `
      <table class="events-table">
        <thead><tr><th>الوصف</th><th>المشاعر</th><th>خارجي</th><th>داخلي</th><th>التصنيف</th><th>توقّعه؟</th></tr></thead>
        <tbody>${eventRows}</tbody>
      </table>` : '';

    return `
      <tr>
        <td><strong>${periodTypeAr(p.type)}</strong></td>
        <td>${dateRange}</td>
        <td>${formatDurationMonths(p.duration_months)}</td>
        <td>${p.note || '—'}</td>
      </tr>
      ${p.events.length > 0 ? `<tr><td colspan="4">${eventsTable}</td></tr>` : ''}
    `;
  }).join('');

  const analyticsSection = analytics ? `
    <h2>Trigger Pattern Analysis</h2>
    <p>Total events: ${analytics.event_count} | Internal: ${analytics.classification_counts.i} | External: ${analytics.classification_counts.x} | Both: ${analytics.classification_counts.b}</p>
    <h3>Top Feelings</h3><p>${analytics.top_feelings.map((f: { name: string; count: number }) => `${f.name} (${f.count})`).join(' · ')}</p>
    <h3>Top External Triggers</h3><p>${analytics.top_external_triggers.map((f: { name: string; count: number }) => `${f.name} (${f.count})`).join(' · ')}</p>
    <h3>Top Internal Triggers</h3><p>${analytics.top_internal_triggers.map((f: { name: string; count: number }) => `${f.name} (${f.count})`).join(' · ')}</p>
  ` : '';

  const html = `
  <!DOCTYPE html>
  <html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600&display=swap');
      body { font-family: 'Cairo', Arial, sans-serif; font-size: 11pt; color: #1a1a1a; margin: 20mm; }
      h1 { font-size: 18pt; color: #16A34A; }
      h2 { font-size: 13pt; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 16px; }
      h3 { font-size: 11pt; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th { background: #f0fdf4; text-align: right; padding: 6px; font-size: 10pt; border: 1px solid #d1d5db; }
      td { padding: 5px 6px; border: 1px solid #e5e7eb; vertical-align: top; font-size: 10pt; }
      .events-table { margin-top: 6px; background: #fafafa; font-size: 9pt; }
      .events-table th { background: #fef9c3; }
      .header-meta { color: #555; font-size: 10pt; }
      .footer { margin-top: 30px; font-size: 9pt; color: #888; border-top: 1px solid #ccc; padding-top: 8px; }
    </style>
  </head>
  <body>
    <h1>Recovery Center for Psychiatry & Addiction — رحلة التعافي</h1>
    <p class="header-meta">
      Patient Code: <strong>${patient.code}</strong> &nbsp;|&nbsp;
      Name: <strong>${patient.display_name}</strong> &nbsp;|&nbsp;
      Substances: ${(patient.substances || []).join(', ')} &nbsp;|&nbsp;
      Generated: ${new Date().toLocaleDateString('en-GB')}
    </p>

    <h2>Timeline Summary</h2>
    <table>
      <thead>
        <tr><th>النوع</th><th>الفترة</th><th>المدة</th><th>ملاحظة</th></tr>
      </thead>
      <tbody>${periodRows}</tbody>
    </table>

    ${analyticsSection}

    <div class="footer">CONFIDENTIAL — Recovery Center for Psychiatry & Addiction, Alexandria, Egypt</div>
  </body>
  </html>`;

  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    ...(executablePath ? { executablePath } : {}),
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  return Buffer.from(pdfBuffer);
}
