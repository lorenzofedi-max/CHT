import React, { useState, useEffect } from 'react';
import { Zap, Fuel, Plus, TrendingUp, History, Euro, Gauge, Trash2, BrainCircuit, Calendar } from 'lucide-react';
import { getLogs, addLog, deleteLog, calculateStats, calculateMonthlyStats } from './services/storageService';
import { analyzeDrivingHabits } from './services/geminiService';
import { LogEntry, Stats, MonthlyStats } from './types';
import StatCard from './components/StatCard';
import InputModal from './components/InputModal';
import Charts from './components/Charts';

const App: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    const loadedLogs = getLogs();
    setLogs(loadedLogs);
  }, []);

  useEffect(() => {
    if (logs.length > 0) {
      setStats(calculateStats(logs));
      setMonthlyStats(calculateMonthlyStats(logs));
    } else {
      setStats(null);
      setMonthlyStats([]);
    }
  }, [logs]);

  const handleSaveEntry = (entry: LogEntry) => {
    const updated = addLog(entry);
    setLogs(updated);
    setAiInsight(null); // Reset insight when data changes
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Sei sicuro di voler eliminare questa voce?")) {
      const updated = deleteLog(id);
      setLogs(updated);
      setAiInsight(null);
    }
  };

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const result = await analyzeDrivingHabits(logs, stats);
    setAiInsight(result);
    setLoadingAi(false);
  };

  const lastOdometer = logs.length > 0 ? logs[0].odometer : 0;

  return (
    <div className="min-h-screen bg-cupra-dark text-cupra-text font-sans pb-24 selection:bg-cupra-copper selection:text-white">
      
      {/* Header */}
      <header className="fixed top-0 w-full z-40 bg-cupra-dark/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cupra-copper to-orange-700 flex items-center justify-center">
              <span className="font-bold text-white text-xs">C</span>
            </div>
            <h1 className="font-bold text-lg tracking-tight text-white">Formentor<span className="text-cupra-copper">Hybrid</span></h1>
          </div>
          <div className="text-xs text-cupra-muted font-mono bg-gray-900 px-2 py-1 rounded border border-gray-800">
            {stats ? `${stats.totalDistance.toLocaleString()} km tracciati` : 'Inizia a tracciare'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 pt-24 space-y-6">
        
        {/* Cost per 100km HERO CARD */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-cupra-dark border border-gray-700 rounded-2xl p-6 shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cupra-copper opacity-10 blur-3xl rounded-full translate-x-10 -translate-y-10 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center justify-center py-4">
            <span className="text-cupra-muted text-sm font-semibold uppercase tracking-widest mb-2">Media Globale / 100km</span>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-white tracking-tighter">
                {stats ? stats.costPer100Km.toFixed(2) : '--'}
              </span>
              <span className="text-2xl text-cupra-copper font-medium">€</span>
            </div>
            {stats && (
              <div className="mt-4 flex gap-4 text-sm">
                 <div className="flex items-center gap-1 text-emerald-400">
                    <Fuel size={14} /> {stats.gasConsumption.toFixed(1)} L
                 </div>
                 <div className="flex items-center gap-1 text-blue-400">
                    <Zap size={14} /> {stats.elecConsumption.toFixed(1)} kWh
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Insight Section */}
        {stats && (
          <div className="bg-cupra-card border border-cupra-copper/30 rounded-xl p-4 shadow-lg">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-cupra-copper text-sm font-bold flex items-center gap-2">
                  <BrainCircuit size={16} /> CUPRA INTELLIGENCE
                </h3>
                {!aiInsight && (
                  <button 
                    onClick={handleAiAnalysis}
                    disabled={loadingAi}
                    className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                  >
                    {loadingAi ? 'Analisi...' : 'Analizza Guida'}
                  </button>
                )}
             </div>
             {aiInsight ? (
               <p className="text-sm text-gray-300 leading-relaxed animate-fade-in">
                 {aiInsight}
               </p>
             ) : (
               <p className="text-xs text-gray-500 italic">
                 Ottieni un'analisi personalizzata del tuo stile ibrido basata sui dati storici.
               </p>
             )}
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard 
            label="Spesa Totale" 
            value={stats ? `€${Math.floor(stats.totalCost)}` : '€0'} 
            subValue={stats ? `${stats.percentageElectricCost.toFixed(0)}% Elettrico` : ''}
            icon={Euro}
            colorClass="text-purple-400"
          />
          <StatCard 
            label="Distanza" 
            value={stats ? `${(stats.totalDistance / 1000).toFixed(1)}k` : '0'} 
            subValue="Km percorsi"
            icon={TrendingUp}
            colorClass="text-gray-200"
          />
        </div>

        <Charts monthlyStats={monthlyStats} />

        {/* Monthly Breakdown List */}
        {monthlyStats.length > 0 && (
          <div>
             <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="text-cupra-copper" size={20} /> Report Mensile
             </h3>
             <div className="space-y-3">
               {monthlyStats.map((m) => (
                 <div key={m.monthKey} className="bg-cupra-card border border-gray-800 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white capitalize">{m.label}</p>
                      <p className="text-xs text-gray-500">{m.totalDistance} km percorsi</p>
                    </div>
                    <div className="text-right">
                       <p className="font-bold text-white">€{m.totalCost.toFixed(0)}</p>
                       <p className="text-xs text-cupra-copper">€{m.costPer100Km.toFixed(2)} /100km</p>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* History List */}
        <div className="pb-12">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <History className="text-gray-500" size={20} /> Storico Inserimenti
          </h3>
          
          {logs.length === 0 ? (
            <div className="text-center py-12 text-gray-600 border border-dashed border-gray-800 rounded-xl">
              <Gauge size={48} className="mx-auto mb-2 opacity-50" />
              <p>Nessun dato registrato.</p>
              <p className="text-sm">Tappa il pulsante + per iniziare.</p>
            </div>
          ) : (
            <div className="space-y-3 opacity-80 hover:opacity-100 transition-opacity">
              {logs.map((log) => (
                <div key={log.id} className="group bg-cupra-card border border-gray-800 rounded-lg p-3 flex justify-between items-center hover:border-gray-600 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${log.type === 'gas' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {log.type === 'gas' ? <Fuel size={16} /> : <Zap size={16} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-300">{log.amount.toFixed(2)} {log.type === 'gas' ? 'L' : 'kWh'}</p>
                      <p className="text-[10px] text-gray-500">{new Date(log.date).toLocaleDateString()} • {log.odometer} km</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="font-mono text-sm text-gray-300">€{log.cost.toFixed(2)}</p>
                    <button onClick={() => handleDelete(log.id)} className="text-red-900 hover:text-red-500 text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Elimina
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-14 h-14 bg-cupra-copper hover:bg-cupra-copperHover text-white rounded-full shadow-2xl shadow-orange-900/50 flex items-center justify-center transition-transform active:scale-90"
        >
          <Plus size={28} />
        </button>
      </div>

      <InputModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveEntry}
        lastOdometer={lastOdometer}
      />
    </div>
  );
};

export default App;