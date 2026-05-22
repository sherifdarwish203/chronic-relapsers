import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Toast from '../components/Toast';

interface ToastState { message: string; type: 'success' | 'error' }
interface SeatUsage { total: number; used: number; available: number; percentage: number }

export default function InvitePatient() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'freemium' | 'managed'>('freemium');

  // Shared state
  const [toast, setToastState] = useState<ToastState | null>(null);
  const [loading, setLoading] = useState(false);
  const [seatUsage, setSeatUsage] = useState<SeatUsage | null>(null);
  const [fetchingSeats, setFetchingSeats] = useState(true);

  // Freemium invitation form
  const [freemiumForm, setFreemiumForm] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
  });
  const [generatedLink, setGeneratedLink] = useState<{ token: string; link: string } | null>(null);

  // Managed account form
  const [managedForm, setManagedForm] = useState({
    displayName: '',
    username: '',
    password: '',
    dateOfBirth: '',
    email: '',
    phoneNumber: '',
  });
  const [createdAccount, setCreatedAccount] = useState<{
    displayName: string;
    username: string;
    password: string;
  } | null>(null);

  // Fetch seat usage on mount
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const res = await api.get('/facilitators/seat-usage');
        setSeatUsage(res.data.seat_usage);
      } catch (err) {
        const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
        setToastState({ message: msg || 'خطأ في جلب معلومات المقاعد', type: 'error' });
      } finally {
        setFetchingSeats(false);
      }
    };

    fetchSeats();
  }, []);

  // Freemium: Generate invitation link
  const handleGenerateFreemiumLink = async () => {
    if (!freemiumForm.displayName.trim()) {
      setToastState({ message: 'الاسم مطلوب', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/facilitators/invitations', {
        display_name: freemiumForm.displayName.trim() || undefined,
        email: freemiumForm.email.trim() || undefined,
        phone_number: freemiumForm.phoneNumber.trim() || undefined,
      });
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/register?token=${res.data.token}`;
      setGeneratedLink({ token: res.data.token, link });
      setFreemiumForm({ displayName: '', email: '', phoneNumber: '' });
      setToastState({ message: 'تم إنشاء رابط الدعوة بنجاح!', type: 'success' });
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setToastState({ message: msg || 'خطأ في إنشاء الدعوة', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Managed account: Create patient
  const handleCreateManagedAccount = async () => {
    if (!managedForm.displayName.trim() || !managedForm.username.trim() || !managedForm.password || !managedForm.dateOfBirth) {
      setToastState({ message: 'الاسم واسم المستخدم وكلمة المرور وتاريخ الميلاد مطلوبة', type: 'error' });
      return;
    }

    if (seatUsage && seatUsage.available <= 0) {
      setToastState({ message: 'لا توجد مقاعد متاحة — اشتري المزيد', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/facilitators/patients/create', {
        display_name: managedForm.displayName.trim(),
        username: managedForm.username.trim(),
        password: managedForm.password,
        date_of_birth: managedForm.dateOfBirth,
        email: managedForm.email.trim() || undefined,
        phone_number: managedForm.phoneNumber.trim() || undefined,
      });
      setCreatedAccount({
        displayName: res.data.patient.display_name,
        username: res.data.patient.username,
        password: managedForm.password, // Show the password we sent
      });
      setManagedForm({
        displayName: '',
        username: '',
        password: '',
        dateOfBirth: '',
        email: '',
        phoneNumber: '',
      });
      // Refresh seat usage
      const seatRes = await api.get('/facilitators/seat-usage');
      setSeatUsage(seatRes.data.seat_usage);
      setToastState({ message: 'تم إنشاء الحساب بنجاح!', type: 'success' });
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setToastState({ message: msg || 'خطأ في إنشاء الحساب', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToastState({ message: 'تم النسخ إلى الحافظة', type: 'success' });
  };

  return (
    <div className="min-h-screen flex justify-center p-4 pt-6 sm:pt-8 bg-gray-50">
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToastState(null)} />
      )}

      <div className="w-full max-w-[600px] pb-6">
        {/* Header */}
        <div className="flex items-center justify-center mb-6 gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700 p-2 -ml-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">إضافة مريض</h2>
          <div className="w-10" />
        </div>

        {/* Seat Usage Badge */}
        {!fetchingSeats && seatUsage && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-5 mb-4 border-l-4 border-blue-500">
            <p className="text-xs sm:text-sm text-gray-700">
              <span className="font-bold text-blue-600">
                {seatUsage.available} من {seatUsage.total}
              </span>
              {' '}مقاعد متاحة
            </p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${100 - seatUsage.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab('freemium');
              setGeneratedLink(null);
              setCreatedAccount(null);
            }}
            className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'freemium'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            إرسل دعوة
          </button>
          <button
            onClick={() => {
              setActiveTab('managed');
              setGeneratedLink(null);
              setCreatedAccount(null);
            }}
            className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'managed'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            أنشئ حساب مباشر
          </button>
        </div>

        {/* Tab Content: Freemium Invitation */}
        {activeTab === 'freemium' && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-5 space-y-4">
            {/* Info Card */}
            <div className="bg-blue-50 border-l-4 border-blue-300 p-3 rounded">
              <p className="text-xs sm:text-sm text-gray-700">
                المريض سيقدر على استخدام التطبيق مجاناً لمدة 14 يوم. بعدها، إما يدفع أو يرتبط بمعالج.
              </p>
            </div>

            {/* Form */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                اسم المريض (اختياري)
              </label>
              <input
                type="text"
                value={freemiumForm.displayName}
                onChange={(e) => setFreemiumForm({ ...freemiumForm, displayName: e.target.value })}
                placeholder="مثلاً: أحمد"
                className="input-base text-xs sm:text-sm"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                البريد الإلكتروني (اختياري)
              </label>
              <input
                type="email"
                value={freemiumForm.email}
                onChange={(e) => setFreemiumForm({ ...freemiumForm, email: e.target.value })}
                placeholder="البريد الإلكتروني"
                className="input-base text-xs sm:text-sm"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                رقم الهاتف (اختياري)
              </label>
              <input
                type="tel"
                value={freemiumForm.phoneNumber}
                onChange={(e) => setFreemiumForm({ ...freemiumForm, phoneNumber: e.target.value })}
                placeholder="مثلاً: 0201000000000"
                className="input-base text-xs sm:text-sm"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleGenerateFreemiumLink}
              disabled={loading}
              className="btn-primary w-full text-xs sm:text-sm"
            >
              {loading ? 'جاري الإنشاء...' : 'إنشاء رابط الدعوة'}
            </button>

            {/* Generated Link Display */}
            {generatedLink && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded space-y-3">
                <p className="text-xs sm:text-sm font-bold text-green-700">✅ تم إنشاء رابط الدعوة!</p>
                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="text-xs text-gray-600 mb-2">الرابط:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs sm:text-xs flex-1 break-all font-mono text-gray-700">
                      {generatedLink.link}
                    </code>
                    <button
                      onClick={() => copyToClipboard(generatedLink.link)}
                      className="text-green-600 hover:text-green-700 text-xs font-medium flex-shrink-0"
                    >
                      انسخ
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-700">
                  شارك هذا الرابط مع المريض. سيكون له 14 يوم وصول مجاني.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Managed Account Creation */}
        {activeTab === 'managed' && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-5 space-y-4">
            {/* Info Card */}
            <div className="bg-blue-50 border-l-4 border-blue-300 p-3 rounded">
              <p className="text-xs sm:text-sm text-gray-700">
                سيتم خصم مقعد واحد من رصيدك فوراً. المريض سيحصل على وصول فوري كامل.
              </p>
            </div>

            {/* Form */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                اسم المريض *
              </label>
              <input
                type="text"
                value={managedForm.displayName}
                onChange={(e) => setManagedForm({ ...managedForm, displayName: e.target.value })}
                placeholder="مثلاً: أحمد"
                className="input-base text-xs sm:text-sm"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                اسم المستخدم *
              </label>
              <input
                type="text"
                value={managedForm.username}
                onChange={(e) => setManagedForm({ ...managedForm, username: e.target.value })}
                placeholder="مثلاً: patient_001"
                className="input-base text-xs sm:text-sm"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                كلمة المرور *
              </label>
              <input
                type="password"
                value={managedForm.password}
                onChange={(e) => setManagedForm({ ...managedForm, password: e.target.value })}
                placeholder="كلمة مرور قوية"
                className="input-base text-xs sm:text-sm"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                تاريخ الميلاد *
              </label>
              <input
                type="date"
                value={managedForm.dateOfBirth}
                onChange={(e) => setManagedForm({ ...managedForm, dateOfBirth: e.target.value })}
                className="input-base text-xs sm:text-sm"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                البريد الإلكتروني (اختياري)
              </label>
              <input
                type="email"
                value={managedForm.email}
                onChange={(e) => setManagedForm({ ...managedForm, email: e.target.value })}
                placeholder="البريد الإلكتروني"
                className="input-base text-xs sm:text-sm"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                رقم الهاتف (اختياري)
              </label>
              <input
                type="tel"
                value={managedForm.phoneNumber}
                onChange={(e) => setManagedForm({ ...managedForm, phoneNumber: e.target.value })}
                placeholder="مثلاً: 0201000000000"
                className="input-base text-xs sm:text-sm"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleCreateManagedAccount}
              disabled={loading || (seatUsage ? seatUsage.available <= 0 : false)}
              className="btn-primary w-full text-xs sm:text-sm"
            >
              {loading ? 'جاري الإنشاء...' : 'أنشئ الحساب'}
            </button>

            {/* Created Account Display */}
            {createdAccount && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded space-y-3">
                <p className="text-xs sm:text-sm font-bold text-green-700">✅ تم إنشاء الحساب!</p>
                <div className="bg-white p-3 rounded border border-green-200 space-y-2">
                  <div>
                    <p className="text-xs text-gray-600">الاسم:</p>
                    <p className="text-xs sm:text-sm font-mono text-gray-800">{createdAccount.displayName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">اسم المستخدم:</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-mono text-gray-800 flex-1">{createdAccount.username}</p>
                      <button
                        onClick={() => copyToClipboard(createdAccount.username)}
                        className="text-green-600 hover:text-green-700 text-xs font-medium"
                      >
                        انسخ
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">كلمة المرور:</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-mono text-gray-800 flex-1">{createdAccount.password}</p>
                      <button
                        onClick={() => copyToClipboard(createdAccount.password)}
                        className="text-green-600 hover:text-green-700 text-xs font-medium"
                      >
                        انسخ
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-700">
                  اعط هذه بيانات المرور للمريض مباشرة. سيتمكن من تسجيل الدخول فوراً.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
