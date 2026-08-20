import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/Dashboard';
import { DisastersPage } from './pages/Disasters';
import { InventoryPage } from './pages/Inventory';
import { AllocationPage } from './pages/Allocation';
import { RescueTeamsPage } from './pages/RescueTeams';
import { DisasterMapPage } from './pages/DisasterMap';
import { AlertsPage } from './pages/Alerts';
import { WhatsAppReportsPage } from './pages/WhatsAppReports';
import { SettingsPage } from './pages/Settings';
import { LoginPage } from './pages/Login';

const MainApp = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage setActiveTab={setActiveTab} />;
      case 'whatsapp':
        return <WhatsAppReportsPage />;
      case 'disasters':
      case 'areas': // Consolidated legacy route
        return <DisastersPage />;
      case 'resources':
      case 'vehicles': // Consolidated legacy route
        return <InventoryPage />;
      case 'allocation':
        return <AllocationPage />;
      case 'teams':
        return <RescueTeamsPage />;
      case 'map':
        return <DisasterMapPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'settings':
        return <SettingsPage setActiveTab={setActiveTab} />;
      default:
        return <DashboardPage setActiveTab={setActiveTab} />;
    }
  };

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </MainLayout>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
