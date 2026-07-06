import { useEffect, useState } from 'react';
import { ModelProvider, useModel } from './lib/modelContext';
import { Layout, type PageId } from './components/Layout';
import { LoadingScreen } from './components/LoadingScreen';
import { Dashboard } from './pages/Dashboard';
import { Predict } from './pages/Predict';
import { Models } from './pages/Models';
import { Monitor } from './pages/Monitor';
import { History } from './pages/History';
import { Analytics } from './pages/Analytics';
import { fetchRegions, seedDefaultRegions } from './lib/predictionService';
import type { Region } from './lib/types';

function AppShell() {
  const { training, loading } = useModel();
  const [page, setPage] = useState<PageId>('dashboard');
  const [regions, setRegions] = useState<Region[]>([]);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  useEffect(() => {
    void loadRegions();
  }, []);

  const loadRegions = async () => {
    try {
      await seedDefaultRegions();
      const regs = await fetchRegions();
      setRegions(regs);
    } catch {
      // ignore - pages handle empty state
    }
  };

  const onPredicted = () => {
    setHistoryRefresh((n) => n + 1);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const bestModelName = training?.bestModel.name ?? null;
  const bestAccuracy = training?.bestModel.metrics.accuracy ?? null;

  return (
    <Layout
      current={page}
      onNavigate={setPage}
      bestModelName={bestModelName}
      bestAccuracy={bestAccuracy}
    >
      {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
      {page === 'predict' && <Predict regions={regions} onPredicted={onPredicted} />}
      {page === 'models' && <Models />}
      {page === 'monitor' && <Monitor onPredicted={onPredicted} />}
      {page === 'history' && <History refreshKey={historyRefresh} />}
      {page === 'analytics' && <Analytics />}
    </Layout>
  );
}

function App() {
  return (
    <ModelProvider>
      <AppShell />
    </ModelProvider>
  );
}

export default App;
