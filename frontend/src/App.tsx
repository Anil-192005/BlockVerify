import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { VerifyPage } from './pages/VerifyPage';
import { QRScannerPage } from './pages/QRScannerPage';
import { UploadPage } from './pages/UploadPage';
import { MyDocumentsPage } from './pages/MyDocumentsPage';
import { DocumentDetailsPage } from './pages/DocumentDetailsPage';
import { TxExplorerPage } from './pages/TxExplorerPage';
import { VerificationHistoryPage } from './pages/VerificationHistoryPage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          
          <main style={{ flex: 1 }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage onSuccess={() => window.location.href = '/dashboard'} />} />
              <Route path="/register" element={<LoginPage onSuccess={() => window.location.href = '/dashboard'} />} />
              
              {/* Verification Routes */}
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/verify/:documentId" element={<VerifyPage />} />
              <Route path="/qr" element={<QRScannerPage />} />

              {/* Dashboard & Issuer Routes */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/issuer" element={<DashboardPage />} />
              <Route path="/issuer/upload" element={<UploadPage />} />
              <Route path="/issuer/documents" element={<MyDocumentsPage />} />
              <Route path="/issuer/documents/:id" element={<DocumentDetailsPage />} />

              {/* Admin & Governance Routes */}
              <Route path="/admin" element={<AdminPanelPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/documents" element={<MyDocumentsPage />} />
              <Route path="/admin/verifications" element={<VerificationHistoryPage />} />

              {/* Explorer, History & Profile */}
              <Route path="/explorer" element={<TxExplorerPage />} />
              <Route path="/history" element={<VerificationHistoryPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
