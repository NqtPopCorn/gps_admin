import React, { useState } from 'react';

import { AuthState } from './types';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, username: null });

  if (!auth.isAuthenticated) {
    return <LoginPage onLogin={(username) => setAuth({ isAuthenticated: true, username })} />;
  }

  return <DashboardPage onLogout={() => setAuth({ isAuthenticated: false, username: null })} />;
}
