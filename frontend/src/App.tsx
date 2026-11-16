import React, { useState } from 'react';
import { Sidebar, NavPageId } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { SearchModal } from './components/Layout/SearchModal';
import { OverviewPage } from './pages/Overview/OverviewPage';
import { GlobalExplorerPage } from './pages/GlobalExplorer/GlobalExplorerPage';
import { MissionTimelinePage } from './pages/MissionTimeline/MissionTimelinePage';
import { CountryAnalysisPage } from './pages/CountryAnalysis/CountryAnalysisPage';
import { MissionAnalyticsPage } from './pages/MissionAnalytics/MissionAnalyticsPage';
import { MLIntelligencePage } from './pages/MLIntelligence/MLIntelligencePage';
import { DatasetLabPage } from './pages/DatasetLab/DatasetLabPage';
import { FilterState, SpaceMission, LaunchSite } from './types';
import { MissionDetailModal } from './components/Cards/MissionDetailModal';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<NavPageId>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [inspectedMission, setInspectedMission] = useState<SpaceMission | null>(null);

  const initialFilters: FilterState = {
    searchQuery: '',
    yearRange: [1957, 2026],
    selectedCountry: 'All',
    selectedAgency: 'All',
    selectedType: 'All',
    selectedStatus: 'All',
  };

  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  const getPageTitleAndSubtitle = (page: NavPageId) => {
    switch (page) {
      case 'overview':
        return { title: 'GLOBAL COMMAND CENTER', subtitle: 'Live Earth Telemetry & Key Indicators' };
      case 'explorer':
        return { title: 'GLOBAL EXPLORER', subtitle: 'Spaceports, Launch Trajectories & Geodetic Atlas' };
      case 'timeline':
        return { title: 'MISSION TIMELINE', subtitle: 'Chronology of Human Spaceflight 1957 – 2026' };
      case 'country':
        return { title: 'COUNTRY ANALYSIS', subtitle: 'Sovereign Space Programs & Head-to-Head Comparison' };
      case 'analytics':
        return { title: 'MISSION ANALYTICS', subtitle: 'Launch Vehicles, Orbital Destinations & Failure Taxonomy' };
      case 'ml':
        return { title: 'ML INTELLIGENCE', subtitle: 'Pre-Launch Mission Outcome Prediction & Governance' };
      case 'dataset':
        return { title: 'DATASET LABORATORY', subtitle: 'Data Cleaning Audit, Missingness & Canonical Schema' };
    }
  };

  const { title, subtitle } = getPageTitleAndSubtitle(activePage);

  return (
    <div className="min-h-screen bg-[#050914] text-[#EAF3FF] flex flex-col font-sans selection:bg-[#39D5F2]/20 selection:text-[#39D5F2]">
      {/* Fixed Left Sidebar */}
      <Sidebar
        activePage={activePage}
        onSelectPage={(page) => setActivePage(page)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Fixed Top Header */}
      <Header
        pageTitle={title}
        pageSubtitle={subtitle}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onOpenSearch={() => setIsSearchOpen(true)}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Main Content Area */}
      <main 
        className={`flex-1 pt-24 px-6 md:px-8 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'ml-20' : 'ml-72'
        }`}
      >
        <div className="max-w-[1600px] mx-auto">
          {activePage === 'overview' && (
            <OverviewPage
              filters={filters}
              onNavigateToExplorer={() => setActivePage('explorer')}
              onNavigateToAnalytics={() => setActivePage('analytics')}
            />
          )}

          {activePage === 'explorer' && (
            <GlobalExplorerPage filters={filters} />
          )}

          {activePage === 'timeline' && (
            <MissionTimelinePage filters={filters} />
          )}

          {activePage === 'country' && (
            <CountryAnalysisPage filters={filters} />
          )}

          {activePage === 'analytics' && (
            <MissionAnalyticsPage filters={filters} />
          )}

          {activePage === 'ml' && (
            <MLIntelligencePage />
          )}

          {activePage === 'dataset' && (
            <DatasetLabPage filters={filters} />
          )}
        </div>
      </main>

      {/* Global Interactive Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMission={(mission) => setInspectedMission(mission)}
        onSelectSite={() => setActivePage('explorer')}
      />

      {/* Quick Mission Inspection Modal */}
      <MissionDetailModal
        mission={inspectedMission}
        onClose={() => setInspectedMission(null)}
      />
    </div>
  );
};

export default App;
