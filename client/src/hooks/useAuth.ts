export function usePatientAuth() {
  const getToken = () => localStorage.getItem('patient_token');
  const isLoggedIn = () => !!getToken();

  const login = (token: string) => {
    localStorage.setItem('patient_token', token);
    localStorage.setItem('role', 'patient');
  };

  const logout = () => {
    localStorage.removeItem('patient_token');
    localStorage.removeItem('role');
    localStorage.removeItem('patient_data');
  };

  return { getToken, isLoggedIn, login, logout };
}

export function useFacilitatorAuth() {
  const getToken = () => localStorage.getItem('facilitator_token');
  const isLoggedIn = () => !!getToken();

  const login = (token: string) => {
    localStorage.setItem('facilitator_token', token);
    localStorage.setItem('role', 'facilitator');
  };

  const logout = () => {
    localStorage.removeItem('facilitator_token');
    localStorage.removeItem('role');
    localStorage.removeItem('facilitator_data');
  };

  return { getToken, isLoggedIn, login, logout };
}
