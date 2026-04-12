import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[520px]">
        {/* Logo + title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="32" fill="#DCFCE7" />
              <path
                d="M32 14C23 14 16 24 16 32C16 40 23 46 32 50C41 46 48 40 48 32C48 24 41 14 32 14Z"
                fill="#16A34A"
                opacity="0.9"
              />
              <path
                d="M32 22C28 26 26 30 26 34C26 38 28 42 32 44C36 42 38 38 38 34C38 30 36 26 32 22Z"
                fill="#DCFCE7"
                opacity="0.8"
              />
            </svg>
          </div>
          <h1 className="text-[28px] font-medium text-gray-800">رحلة التعافي</h1>
          <p className="text-sm text-gray-500 mt-1">مساحة آمنة لفهم قصتك</p>
        </div>

        {/* Role cards */}
        <div className="space-y-3">
          {/* Patient card */}
          <button
            onClick={() => navigate('/start')}
            className="w-full card flex items-center justify-between hover:border-primary hover:shadow-md transition-all cursor-pointer text-right"
          >
            <div>
              <p className="text-base font-bold text-gray-800">أنا مريض</p>
              <p className="text-sm text-gray-500 mt-0.5">ابدأ تسجيل رحلتي</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Facilitator card */}
          <button
            onClick={() => navigate('/dashboard/login')}
            className="w-full card flex items-center justify-between hover:border-gray-400 hover:shadow-md transition-all cursor-pointer text-right"
          >
            <div>
              <p className="text-base font-bold text-gray-800">معالج / طبيب</p>
              <p className="text-sm text-gray-500 mt-0.5">لوحة تحكم المعالج</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Recovery Center for Psychiatry & Addiction · Alexandria
        </p>
      </div>
    </div>
  );
}
