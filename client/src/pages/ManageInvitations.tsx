import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Toast from '../components/Toast';

interface ToastState { message: string; type: 'success' | 'error' }

interface Invitation {
  id: number;
  token_code: string;
  email?: string;
  display_name?: string;
  phone_number?: string;
  used_at?: string;
  patient_id?: number;
  cancelled_at?: string;
  created_at: string;
}

export default function ManageInvitations() {
  const navigate = useNavigate();
  const [toast, setToastState] = useState<ToastState | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<number | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const res = await api.get('/facilitators/invitations');
      setInvitations(res.data.invitations || []);
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setToastState({ message: msg || 'خطأ في جلب الدعوات', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeInvitation = async (tokenCode: string, invitationId: number) => {
    setRevoking(invitationId);
    try {
      await api.patch(`/facilitators/invitations/${tokenCode}/revoke`);
      setToastState({ message: 'تم إلغاء الدعوة بنجاح', type: 'success' });
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === invitationId ? { ...inv, cancelled_at: new Date().toISOString() } : inv
        )
      );
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setToastState({ message: msg || 'خطأ في إلغاء الدعوة', type: 'error' });
    } finally {
      setRevoking(null);
    }
  };

  const getInvitationStatus = (invitation: Invitation) => {
    if (invitation.cancelled_at) {
      return { label: 'ملغاة', color: 'text-gray-500', badge: 'bg-gray-100' };
    }
    if (invitation.used_at) {
      return { label: 'مستخدمة', color: 'text-green-600', badge: 'bg-green-100' };
    }
    return { label: 'قيد الانتظار', color: 'text-blue-600', badge: 'bg-blue-100' };
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG');
    } catch {
      return dateString;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToastState({ message: 'تم النسخ إلى الحافظة', type: 'success' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-3" />
          <p className="text-gray-600">جاري تحميل الدعوات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center p-4 pt-6 sm:pt-8 bg-gray-50">
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToastState(null)} />
      )}

      <div className="w-full max-w-[700px] pb-6">
        {/* Header */}
        <div className="flex items-center justify-center mb-6 gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700 p-2 -ml-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">إدارة الدعوات</h2>
          <div className="w-10" />
        </div>

        {invitations.length === 0 ? (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-6 text-center">
            <p className="text-gray-600 text-sm">لم تُنشِ أي دعوات حتى الآن</p>
            <button
              onClick={() => navigate('/dashboard/invite-patient')}
              className="btn-primary mt-4 inline-block text-xs sm:text-sm"
            >
              إنشاء دعوة جديدة
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => {
              const status = getInvitationStatus(invitation);
              const baseUrl = window.location.origin;
              const inviteLink = `${baseUrl}/register?token=${invitation.token_code}`;

              return (
                <div
                  key={invitation.id}
                  className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-5 border-l-4 border-gray-300"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-gray-800">
                        {invitation.display_name || 'بدون اسم'}
                      </h3>
                      <p className={`text-xs font-medium mt-1 ${status.color}`}>{status.label}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${status.badge}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="text-xs text-gray-600 space-y-1 mb-3">
                    {invitation.email && (
                      <p>📧 البريد: {invitation.email}</p>
                    )}
                    {invitation.phone_number && (
                      <p>📱 الهاتف: {invitation.phone_number}</p>
                    )}
                    <p>📅 التاريخ: {formatDate(invitation.created_at)}</p>
                    {invitation.used_at && (
                      <p className="text-green-600">✅ تم الاستخدام: {formatDate(invitation.used_at)}</p>
                    )}
                    {invitation.cancelled_at && (
                      <p className="text-gray-500">❌ ملغاة: {formatDate(invitation.cancelled_at)}</p>
                    )}
                  </div>

                  {/* Invite Link */}
                  {!invitation.used_at && !invitation.cancelled_at && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-3">
                      <p className="text-xs text-gray-600 mb-1">الرابط:</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-gray-700 flex-1 break-all">
                          {inviteLink}
                        </code>
                        <button
                          onClick={() => copyToClipboard(inviteLink)}
                          className="text-blue-600 hover:text-blue-700 text-xs font-medium flex-shrink-0 whitespace-nowrap"
                        >
                          انسخ
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {!invitation.used_at && !invitation.cancelled_at && (
                    <button
                      onClick={() => handleRevokeInvitation(invitation.token_code, invitation.id)}
                      disabled={revoking === invitation.id}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      {revoking === invitation.id ? 'جاري الإلغاء...' : 'إلغاء الدعوة'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
