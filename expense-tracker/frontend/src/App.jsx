import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AddTransactionPage from './pages/AddTransactionPage';
import IncomePage from './pages/IncomePage';
import SavingsGoalsPage from './pages/SavingsGoalsPage';
import CalendarPage from './pages/CalendarPage';
import SharedExpensesPage from './pages/SharedExpensesPage';
import BillRemindersPage from './pages/BillRemindersPage';
import LoansPage from './pages/LoansPage';
import NotificationsPage from './pages/NotificationsPage';
import ExportPage from './pages/ExportPage';

const ProtectedLayout = () => {
  const { isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="main-content">
        <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="content-body">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/add-transaction" element={<AddTransactionPage />} />
            <Route path="/income" element={<IncomePage />} />
            <Route path="/export" element={<ExportPage />} />
            <Route path="/savings" element={<SavingsGoalsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/shared-expenses" element={<SharedExpensesPage />} />
            <Route path="/bills" element={<BillRemindersPage />} />
            <Route path="/loans" element={<LoansPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
