import { useState, useEffect } from 'react';
import useAuth from './hooks/useAuth.js';
import useTradingStore from './store/useTradingStore.js';
import Header from './components/ui/Header.jsx';
import Sidebar from './components/ui/Sidebar.jsx';
import Dashboard from './components/sections/Dashboard.jsx';
import TradingPlan from './components/sections/TradingPlan.jsx';
import Login from './components/sections/Login.jsx';

function App() {
  const { user, loading } = useAuth();
  const fetchTrades = useTradingStore((s) => s.fetchTrades);
  const [activeTab,    setActiveTab]    = useState('dashboard');
  const [sidebarOpen,  setSidebarOpen]  = useState(false);

  // user?.id como dependencia: el token refresh de Supabase crea un nuevo
  // objeto user pero con el mismo id → evita llamar fetchTrades en cada refresh
  // y así elimina el parpadeo del skeleton al volver a la pestaña del browser.
  useEffect(() => {
    if (user?.id) fetchTrades();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cierra el drawer al cambiar de pestaña (mobile)
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  if (loading) {
    return <div className="tt-app-loading">Cargando...</div>;
  }

  if (!user) return <Login />;

  return (
    <div className="tt-app">
      <div className="tt-layout">
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="tt-main" aria-label="Contenido principal">
          <Header onOpenSidebar={() => setSidebarOpen(true)} />
          <div className="tt-main__container">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'plan'      && <TradingPlan />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
