import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/Dashboard';
import { DisastersPage } from './pages/Disasters';
import { InventoryPage } from './pages/Inventory';
import { AllocationPage } from './pages/Allocation';
import { RescueTeamsPage } from './pages/RescueTeams';
import { DisasterMapPage } from './pages/DisasterMap';
import { AlertsPage } from './pages/Alerts';
import { WeatherInsightsPage } from './pages/WeatherInsights';
import { SMSReportsPage } from './pages/SMSReports';
import { SettingsPage } from './pages/Settings';
import { LoginPage } from './pages/Login';
import { CitizenPortal } from './pages/CitizenPortal';
import { CitizenReportsPage } from './pages/CitizenReportsPage';

const MainApp = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes('citizen') || search.includes('citizen') || hash.includes('citizen')) {
        return 'citizen';
      }
    }
    return 'dashboard';
  });

  // Citizen Portal is publicly accessible without requiring Admin login
  if (activeTab === 'citizen' || (typeof window !== 'undefined' && (window.location.pathname.toLowerCase().includes('citizen') || window.location.search.toLowerCase().includes('citizen')))) {
    return <CitizenPortal />;
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'citizen-reports':
      case 'citizen-ingestion':
        return <CitizenReportsPage setActiveTab={setActiveTab} />;
      case 'citizen':
      case 'citizen-portal':
        return <CitizenPortal />;
      case 'dashboard':
        return <DashboardPage setActiveTab={setActiveTab} />;
      case 'weather':
        return <WeatherInsightsPage />;
      case 'sms':
      case 'sms-reports':
      case 'reports':
        return <SMSReportsPage />;
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
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
