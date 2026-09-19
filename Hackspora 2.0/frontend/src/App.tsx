import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { SystemStatusDrawer } from './components/layout/SystemStatusDrawer';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { BlindModePage } from './features/blind/BlindModePage';
import { DeafModePage } from './features/deaf/DeafModePage';
import { CommunicateModePage } from './features/nonverbal/CommunicateModePage';
import { EmergencyReceiverPage } from './features/emergency/EmergencyReceiverPage';
import { EmergencyActiveView } from './features/emergency/EmergencyActiveView';
import { SosCountdownModal } from './features/emergency/SosCountdownModal';
import { useEmergencyWs } from './hooks/useEmergencyWs';
import { api } from './services/api';
import { AppMode, Emergency } from './types';

export function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('dashboard');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isStatusDrawerOpen, setIsStatusDrawerOpen] = useState<boolean>(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState<boolean>(false);
  const [showActiveEmergencyView, setShowActiveEmergencyView] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 13.0827,
    lng: 80.2707
  });

  // Real-time Emergency WebSocket listener
  const { activeEmergency, setActiveEmergency, isConnected: wsConnected } = useEmergencyWs('default-user');

  // Request user GPS on startup
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => {
          console.warn('Geolocation denied / error:', err);
        }
      );
    }
    // Check for initial active emergency on mount
    api.getActiveEmergency().then((em) => {
      if (em) {
        setActiveEmergency(em);
      }
    });
  }, [setActiveEmergency]);

  // Handle SOS Confirmation after 3-2-1 countdown
  const handleConfirmSos = async () => {
    setIsSosModalOpen(false);
    try {
      const em = await api.triggerEmergency(
        'CANNOT SPEAK',
        'Silent SOS distress alert',
        userLocation.lat,
        userLocation.lng
      );
      setActiveEmergency(em);
      setShowActiveEmergencyView(true);
    } catch (e) {
      console.error('Trigger SOS error:', e);
    }
  };

  const handleSelectEmergencyType = async (type: string) => {
    try {
      const em = await api.triggerEmergency(
        type,
        `Emergency Alert: ${type}`,
        userLocation.lat,
        userLocation.lng
      );
      setActiveEmergency(em);
    } catch (e) {
      console.error('Update type error:', e);
    }
  };

  const handleResolveEmergency = async () => {
    if (activeEmergency) {
      try {
        await api.resolveEmergency(activeEmergency.id);
        setActiveEmergency(null);
        setShowActiveEmergencyView(false);
      } catch (e) {
        console.error('Resolve error:', e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col font-sans selection:bg-accent/30 selection:text-accent-light">
      {/* Universal Header */}
      <Header
        currentMode={currentMode}
        onSelectMode={(mode) => {
          setCurrentMode(mode);
          setShowActiveEmergencyView(false);
        }}
        isDemoMode={isDemoMode}
        onToggleDemoMode={() => setIsDemoMode(!isDemoMode)}
        onOpenStatusDrawer={() => setIsStatusDrawerOpen(true)}
        onTriggerSos={() => setIsSosModalOpen(true)}
        hasActiveEmergency={!!activeEmergency && activeEmergency.status !== 'RESOLVED'}
      />

      {/* Main Mode View */}
      <main className="flex-1 pb-12">
        {showActiveEmergencyView || (activeEmergency && activeEmergency.status === 'ACTIVE' && currentMode !== 'emergency-receiver') ? (
          <EmergencyActiveView
            emergency={activeEmergency}
            onSelectType={handleSelectEmergencyType}
            onResolve={handleResolveEmergency}
            onClose={() => setShowActiveEmergencyView(false)}
          />
        ) : currentMode === 'dashboard' ? (
          <DashboardPage
            onSelectMode={setCurrentMode}
            onTriggerSos={() => setIsSosModalOpen(true)}
            onQuickSearch={() => setCurrentMode('blind')}
            isDemoMode={isDemoMode}
          />
        ) : currentMode === 'blind' ? (
          <BlindModePage isDemoMode={isDemoMode} />
        ) : currentMode === 'deaf' ? (
          <DeafModePage isDemoMode={isDemoMode} />
        ) : currentMode === 'nonverbal' ? (
          <CommunicateModePage isDemoMode={isDemoMode} />
        ) : (
          <EmergencyReceiverPage
            activeEmergency={activeEmergency}
            onEmergencyUpdate={() => {
              api.getActiveEmergency().then(setActiveEmergency);
            }}
          />
        )}
      </main>

      {/* SOS 3-2-1 Countdown Modal */}
      <SosCountdownModal
        isOpen={isSosModalOpen}
        onCancel={() => setIsSosModalOpen(false)}
        onConfirm={handleConfirmSos}
      />

      {/* System Telemetry Diagnostics Drawer */}
      <SystemStatusDrawer
        isOpen={isStatusDrawerOpen}
        onClose={() => setIsStatusDrawerOpen(false)}
        cameraActive={currentMode === 'blind' || currentMode === 'nonverbal'}
        micActive={currentMode === 'deaf' || currentMode === 'blind'}
        wsConnected={wsConnected}
        isDemoMode={isDemoMode}
      />

      {/* Footer Branding */}
      <footer className="border-t border-surface-border py-4 px-6 text-center text-xs text-slate-500 font-mono">
        OBSERVA Multimodal Accessibility OS — "See what matters. Know where it is. Know what you haven't seen."
      </footer>
    </div>
  );
}

export default App;
