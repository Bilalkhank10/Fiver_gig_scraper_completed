import React, { useState, useEffect } from 'react';
import { PanelLeftOpen } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ScraperHub from './components/ScraperHub';
import AnalyticsView from './components/AnalyticsView';
import GigExplorer from './components/GigExplorer';
import GigDetailModal from './components/GigDetailModal';
import ComparisonMatrix from './components/ComparisonMatrix';
import DatasetManager from './components/DatasetManager';
import ExportModal from './components/ExportModal';
import {
  fetchDatasets, fetchDataset, deleteDataset, loadSampleDataset
} from './services/api';

export default function App() {
  const [datasets, setDatasets] = useState([]);
  const [activeDatasetId, setActiveDatasetId] = useState(null);
  const [activeDataset, setActiveDataset] = useState(null);
  const [activeTab, setActiveTab] = useState('explorer'); // 'explorer' | 'analytics' | 'scraper' | 'datasets'
  const [inspectedGig, setInspectedGig] = useState(null);
  const [selectedGigs, setSelectedGigs] = useState([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingSample, setLoadingSample] = useState(false);
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Load initial datasets list
  const loadDatasetsList = async (targetIdToSelect = null) => {
    try {
      setLoading(true);
      const list = await fetchDatasets();
      setDatasets(list);

      const toSelect = targetIdToSelect || (list.length > 0 ? list[0].id : null);
      if (toSelect) {
        setActiveDatasetId(toSelect);
        const full = await fetchDataset(toSelect);
        setActiveDataset(full);
      } else {
        setActiveDatasetId(null);
        setActiveDataset(null);
      }
    } catch (err) {
      console.error('Failed to load datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasetsList();
  }, []);

  // Handle switching active dataset
  const handleSelectDataset = async (id) => {
    try {
      setActiveDatasetId(id);
      setSelectedGigs([]);
      setInspectedGig(null);
      setIsCompareOpen(false);
      const full = await fetchDataset(id);
      setActiveDataset(full);
    } catch (err) {
      console.error('Failed to switch dataset:', err);
    }
  };

  // Handle deleting dataset
  const handleDeleteDataset = async (id) => {
    if (!window.confirm('Are you sure you want to delete this dataset?')) return;
    try {
      await deleteDataset(id);
      setSelectedGigs([]);
      setInspectedGig(null);
      setIsCompareOpen(false);
      const remaining = datasets.filter(d => d.id !== id);
      setDatasets(remaining);
      if (activeDatasetId === id) {
        if (remaining.length > 0) {
          handleSelectDataset(remaining[0].id);
        } else {
          setActiveDatasetId(null);
          setActiveDataset(null);
        }
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Handle loading sample benchmark
  const handleLoadSample = async (type = 'logo') => {
    try {
      setLoadingSample(true);
      const created = await loadSampleDataset(type);
      await loadDatasetsList(created.id);
      setActiveTab('explorer');
    } catch (err) {
      console.error('Sample loading error:', err);
    } finally {
      setLoadingSample(false);
    }
  };

  // Handle scrape finished
  const handleScrapeComplete = async (datasetId) => {
    await loadDatasetsList(datasetId);
  };

  // Toggle selection for comparison matrix
  const handleToggleSelectGig = (gig) => {
    setSelectedGigs(prev => {
      const exists = prev.some(g => g.id === gig.id);
      if (exists) {
        return prev.filter(g => g.id !== gig.id);
      } else {
        if (prev.length >= 4) {
          alert('You can compare up to 4 gigs at a time.');
          return prev;
        }
        return [...prev, gig];
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#090d14] text-slate-100 flex flex-col md:flex-row">
      
      {/* Left Sidebar Navigation */}
      <Sidebar
        datasets={datasets}
        activeDatasetId={activeDatasetId}
        onSelectDataset={handleSelectDataset}
        onOpenScraper={() => setActiveTab('scraper')}
        onLoadSample={handleLoadSample}
        loadingSample={loadingSample}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currencyCode={currencyCode}
        onSelectCurrency={setCurrencyCode}
        onOpenExport={() => setIsExportOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area (Offset by sidebar on desktop when expanded) */}
      <div className={`flex-1 ${isSidebarCollapsed ? 'md:pl-0' : 'md:pl-56 xl:pl-60'} min-h-screen flex flex-col justify-between overflow-x-hidden transition-all duration-300 ease-in-out relative`}>
        
        {/* Floating Expand Sidebar Button (Only visible on desktop when navbar is hidden) */}
        {isSidebarCollapsed && (
          <div className="hidden md:block fixed top-4 left-4 z-40">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0e1422]/95 hover:bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 text-slate-300 hover:text-white shadow-2xl backdrop-blur-md transition-all group"
              title="Show Navigation Bar"
            >
              <PanelLeftOpen className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">Show Navbar</span>
            </button>
          </div>
        )}
        
        <main className="flex-1 pb-10">
          {loading && !activeDataset ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-3">
              <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <p className="text-xs text-slate-400 font-medium tracking-wide">Connecting to Scraper Engine...</p>
            </div>
          ) : (
            <>
              {activeTab === 'explorer' && (
                <GigExplorer
                  dataset={activeDataset}
                  onInspectGig={(gig) => setInspectedGig(gig)}
                  selectedGigs={selectedGigs}
                  onToggleSelectGig={handleToggleSelectGig}
                  onOpenCompare={() => setIsCompareOpen(true)}
                  currencyCode={currencyCode}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView
                  dataset={activeDataset}
                  currencyCode={currencyCode}
                />
              )}

              {activeTab === 'scraper' && (
                <ScraperHub
                  onScrapeComplete={handleScrapeComplete}
                  onSwitchToExplorer={() => setActiveTab('explorer')}
                />
              )}

              {activeTab === 'datasets' && (
                <DatasetManager
                  datasets={datasets}
                  activeDatasetId={activeDatasetId}
                  onSelectDataset={(id) => {
                    handleSelectDataset(id);
                    setActiveTab('explorer');
                  }}
                  onDeleteDataset={handleDeleteDataset}
                  onLoadSample={handleLoadSample}
                  loadingSample={loadingSample}
                />
              )}
            </>
          )}
        </main>

        {/* Subtle Bottom Footer matching screenshot */}
        <footer className="py-4 text-center text-xs text-slate-500 border-t border-white/5">
          <p>GigRadar - Premium • Crafted by <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent font-bold">Bilal Iqbal</span></p>
        </footer>

      </div>

      {/* Gig Dossier Modal */}
      {inspectedGig && (
        <GigDetailModal
          gig={inspectedGig}
          onClose={() => setInspectedGig(null)}
          onAddToCompare={(gig) => {
            handleToggleSelectGig(gig);
            setInspectedGig(null);
            setIsCompareOpen(true);
          }}
          currencyCode={currencyCode}
        />
      )}

      {/* Comparison Matrix Modal */}
      {isCompareOpen && (
        <ComparisonMatrix
          gigs={selectedGigs}
          onClose={() => setIsCompareOpen(false)}
          onRemoveGig={handleToggleSelectGig}
          onInspectGig={(gig) => setInspectedGig(gig)}
          currencyCode={currencyCode}
        />
      )}

      {/* Export Modal */}
      {isExportOpen && activeDataset && (
        <ExportModal
          dataset={activeDataset}
          onClose={() => setIsExportOpen(false)}
        />
      )}

    </div>
  );
}
