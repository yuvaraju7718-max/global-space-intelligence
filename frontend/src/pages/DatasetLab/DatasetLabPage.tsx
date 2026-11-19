import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  Search, 
  Download, 
  FileCheck, 
  AlertCircle, 
  Layers, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Columns,
  Eye,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { 
  CleanedMissionRecord, 
  FilterState, 
  ColumnProfileStat, 
  DatasetSummaryStats 
} from '../../types';
import { 
  loadCleanedSpaceMissions, 
  calculateColumnProfiles, 
  calculateSummaryStats,
  exportRecordsToCSV 
} from '../../services/dataService';
import { MissionDetailModal } from '../../components/Cards/MissionDetailModal';

interface DatasetLabPageProps {
  filters: FilterState;
}

const ALL_COLUMNS: Array<{ key: keyof CleanedMissionRecord; label: string }> = [
  { key: 'launch_tag', label: 'Tag / ID' },
  { key: 'date', label: 'Date' },
  { key: 'time_utc', label: 'Time (UTC)' },
  { key: 'year', label: 'Year' },
  { key: 'launch_vehicle', label: 'Launch Vehicle' },
  { key: 'flight', label: 'Flight No.' },
  { key: 'mission', label: 'Mission Payload' },
  { key: 'launch_site', label: 'Spaceport' },
  { key: 'launch_pad', label: 'Launch Pad' },
  { key: 'site_country', label: 'Site Country' },
  { key: 'agency', label: 'Agency / Operator' },
  { key: 'launch_country', label: 'Launch Country' },
  { key: 'launch_class', label: 'Class' },
  { key: 'outcome', label: 'Outcome' },
  { key: 'launch_code', label: 'Status Code' },
  { key: 'apogee_km', label: 'Apogee (km)' },
  { key: 'perigee_km', label: 'Perigee (km)' },
  { key: 'inclination_deg', label: 'Inclination (°)' },
  { key: 'payload_mass_t', label: 'Payload (t)' }
];

const ESSENTIAL_COLUMNS: Array<keyof CleanedMissionRecord> = [
  'date', 'mission', 'launch_vehicle', 'agency', 'launch_country', 'launch_site', 'launch_class', 'payload_mass_t', 'outcome'
];

const ORBITAL_COLUMNS: Array<keyof CleanedMissionRecord> = [
  'date', 'mission', 'launch_vehicle', 'apogee_km', 'perigee_km', 'inclination_deg', 'payload_mass_t', 'outcome'
];

export const DatasetLabPage: React.FC<DatasetLabPageProps> = () => {
  const [missions, setMissions] = useState<CleanedMissionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Search & Filter States
  const [tableSearch, setTableSearch] = useState<string>('');
  const [filterCountry, setFilterCountry] = useState<string>('All');
  const [filterVehicle, setFilterVehicle] = useState<string>('All');
  const [filterAgency, setFilterAgency] = useState<string>('All');
  const [filterSite, setFilterSite] = useState<string>('All');
  const [filterOutcome, setFilterOutcome] = useState<string>('All');
  const [filterClass, setFilterClass] = useState<string>('All');
  const [filterYear, setFilterYear] = useState<string>('All');

  // Sorting
  const [sortField, setSortField] = useState<keyof CleanedMissionRecord>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);

  // Column Visibility Preset
  const [columnPreset, setColumnPreset] = useState<'essential' | 'orbital' | 'all'>('essential');
  const [visibleColumns, setVisibleColumns] = useState<Array<keyof CleanedMissionRecord>>(ESSENTIAL_COLUMNS);
  const [showColumnDropdown, setShowColumnDropdown] = useState<boolean>(false);

  // Active modal inspection
  const [selectedMission, setSelectedMission] = useState<CleanedMissionRecord | null>(null);

  // Load real dataset
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await loadCleanedSpaceMissions();
        if (isMounted) {
          setMissions(data);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setLoadError(err.message || 'Failed to load canonical space missions dataset');
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Summary statistics calculated dynamically
  const summaryStats: DatasetSummaryStats = useMemo(() => {
    return calculateSummaryStats(missions);
  }, [missions]);

  // Column profiles calculated dynamically
  const columnProfiles: ColumnProfileStat[] = useMemo(() => {
    return calculateColumnProfiles(missions);
  }, [missions]);

  // Overall missing cell count across entire dataset (141,170 total cells)
  const totalMissingCells = useMemo(() => {
    return columnProfiles.reduce((sum, col) => sum + col.nullCount, 0);
  }, [columnProfiles]);

  const totalCells = missions.length * 19;
  const overallCompleteness = totalCells > 0 
    ? (((totalCells - totalMissingCells) / totalCells) * 100).toFixed(2)
    : '0.00';

  // Distinct filter options extracted from real dataset
  const filterOptions = useMemo(() => {
    const countries = new Set<string>();
    const vehicles = new Set<string>();
    const agencies = new Set<string>();
    const sites = new Set<string>();
    const years = new Set<number>();

    missions.forEach(m => {
      if (m.launch_country) countries.add(m.launch_country);
      if (m.launch_vehicle) vehicles.add(m.launch_vehicle);
      if (m.agency) agencies.add(m.agency);
      if (m.launch_site) sites.add(m.launch_site);
      if (m.year) years.add(m.year);
    });

    return {
      countries: Array.from(countries).sort(),
      vehicles: Array.from(vehicles).sort(),
      agencies: Array.from(agencies).sort(),
      sites: Array.from(sites).sort(),
      years: Array.from(years).sort((a, b) => b - a)
    };
  }, [missions]);

  // Update visible columns based on preset
  const handlePresetChange = (preset: 'essential' | 'orbital' | 'all') => {
    setColumnPreset(preset);
    if (preset === 'essential') setVisibleColumns(ESSENTIAL_COLUMNS);
    else if (preset === 'orbital') setVisibleColumns(ORBITAL_COLUMNS);
    else setVisibleColumns(ALL_COLUMNS.map(c => c.key));
  };

  const toggleColumn = (key: keyof CleanedMissionRecord) => {
    if (visibleColumns.includes(key)) {
      if (visibleColumns.length > 2) {
        setVisibleColumns(visibleColumns.filter(c => c !== key));
      }
    } else {
      setVisibleColumns([...visibleColumns, key]);
    }
  };

  // Dataset-wide Search & Multi-Field Filtering
  const filteredMissions = useMemo(() => {
    return missions.filter(m => {
      // Free text search across relevant dimensions
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase().trim();
        const tagMatch = m.launch_tag.toLowerCase().includes(q);
        const nameMatch = m.mission?.toLowerCase().includes(q) ?? false;
        const vehicleMatch = m.launch_vehicle.toLowerCase().includes(q);
        const agencyMatch = m.agency.toLowerCase().includes(q);
        const countryMatch = m.launch_country.toLowerCase().includes(q);
        const siteMatch = m.launch_site.toLowerCase().includes(q);
        const flightMatch = m.flight?.toLowerCase().includes(q) ?? false;

        if (!tagMatch && !nameMatch && !vehicleMatch && !agencyMatch && !countryMatch && !siteMatch && !flightMatch) {
          return false;
        }
      }

      // Dropdown filters
      if (filterCountry !== 'All' && m.launch_country !== filterCountry) return false;
      if (filterVehicle !== 'All' && m.launch_vehicle !== filterVehicle) return false;
      if (filterAgency !== 'All' && m.agency !== filterAgency) return false;
      if (filterSite !== 'All' && m.launch_site !== filterSite) return false;
      if (filterOutcome !== 'All' && m.outcome !== filterOutcome) return false;
      if (filterClass !== 'All' && m.launch_class !== filterClass) return false;
      if (filterYear !== 'All' && m.year !== parseInt(filterYear, 10)) return false;

      return true;
    });
  }, [missions, tableSearch, filterCountry, filterVehicle, filterAgency, filterSite, filterOutcome, filterClass, filterYear]);

  // Sorting
  const sortedMissions = useMemo(() => {
    const list = [...filteredMissions];
    list.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (valA === null || valA === undefined) return sortDirection === 'asc' ? 1 : -1;
      if (valB === null || valB === undefined) return sortDirection === 'asc' ? -1 : 1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
    return list;
  }, [filteredMissions, sortField, sortDirection]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [tableSearch, filterCountry, filterVehicle, filterAgency, filterSite, filterOutcome, filterClass, filterYear, rowsPerPage]);

  // Paginated Rows
  const totalPages = Math.ceil(sortedMissions.length / rowsPerPage) || 1;
  const paginatedMissions = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedMissions.slice(start, start + rowsPerPage);
  }, [sortedMissions, currentPage, rowsPerPage]);

  // Sort handler for table headers
  const handleSort = (field: keyof CleanedMissionRecord) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setTableSearch('');
    setFilterCountry('All');
    setFilterVehicle('All');
    setFilterAgency('All');
    setFilterSite('All');
    setFilterOutcome('All');
    setFilterClass('All');
    setFilterYear('All');
  };

  // CSV Export Handlers
  const handleExportFullCSV = () => {
    const csvData = exportRecordsToCSV(missions);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'global_space_missions_cleaned.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportFilteredCSV = () => {
    const csvData = exportRecordsToCSV(sortedMissions);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `space_missions_filtered_${sortedMissions.length}_records.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#101B2D] via-[#0A1222] to-[#101B2D] border border-[#39D5F2]/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-3.5 h-3.5 text-[#39D5F2]" />
            <span className="text-[10px] font-mono text-[#39D5F2] tracking-widest uppercase">
              DATASET LABORATORY & STATISTICAL AUDIT
            </span>
          </div>
          <h2 className="text-xl font-display font-bold text-white tracking-wide">
            DATA EXPLORATION, SCHEMA PROFILING & EXPORT WORKSPACE
          </h2>
          <p className="text-xs text-[#8798B3]">
            Direct exploration of all 7,430 canonical records across 19 features, with multi-dimensional filtering, statistical profiling, and RFC 4180 export.
          </p>
        </div>

        {/* Action Buttons: Full Export & Filtered Export */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportFullCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0A1222] hover:bg-[#101B2D] border border-white/10 hover:border-white/30 text-white text-xs font-mono transition"
            title="Download complete canonical dataset (7,430 records)"
          >
            <Download className="w-3.5 h-3.5 text-[#8798B3]" />
            <span>EXPORT FULL DATASET (7,430)</span>
          </button>

          <button
            onClick={handleExportFilteredCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#39D5F2]/15 hover:bg-[#39D5F2]/25 border border-[#39D5F2]/40 text-[#39D5F2] text-xs font-mono font-semibold transition"
            title={`Download active filtered dataset (${sortedMissions.length.toLocaleString()} records)`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>EXPORT FILTERED ({sortedMissions.length.toLocaleString()})</span>
          </button>
        </div>
      </div>

      {/* Dataset Overview Cards (Step 2) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0A1222]/90 border border-white/5 space-y-1">
          <span className="text-[10px] font-mono text-[#8798B3] uppercase block">TOTAL RECORDS</span>
          <div className="text-lg font-bold font-mono text-white">{summaryStats.totalLaunches.toLocaleString()} Rows</div>
          <span className="text-[10px] font-mono text-[#39D5F2]">100% Unique Tags</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0A1222]/90 border border-white/5 space-y-1">
          <span className="text-[10px] font-mono text-[#8798B3] uppercase block">SCHEMA DIMENSIONS</span>
          <div className="text-lg font-bold font-mono text-white">19 Features</div>
          <span className="text-[10px] font-mono text-[#8798B3]">141,170 Data Cells</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0A1222]/90 border border-white/5 space-y-1">
          <span className="text-[10px] font-mono text-[#8798B3] uppercase block">DATA COMPLETENESS</span>
          <div className="text-lg font-bold font-mono text-[#10B981]">{overallCompleteness}%</div>
          <span className="text-[10px] font-mono text-[#8798B3]">{totalMissingCells.toLocaleString()} missing cells</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0A1222]/90 border border-white/5 space-y-1">
          <span className="text-[10px] font-mono text-[#8798B3] uppercase block">TEMPORAL RANGE</span>
          <div className="text-lg font-bold font-mono text-white">{summaryStats.yearMin}–{summaryStats.yearMax}</div>
          <span className="text-[10px] font-mono text-[#8798B3]">70 Flight Years</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0A1222]/90 border border-white/5 space-y-1">
          <span className="text-[10px] font-mono text-[#8798B3] uppercase block">SUCCESSFUL OUTCOMES</span>
          <div className="text-lg font-bold font-mono text-[#10B981]">{summaryStats.successfulLaunches.toLocaleString()}</div>
          <span className="text-[10px] font-mono text-[#10B981]">{summaryStats.successRate}% Success Rate</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0A1222]/90 border border-white/5 space-y-1">
          <span className="text-[10px] font-mono text-[#8798B3] uppercase block">FAILED MISSIONS</span>
          <div className="text-lg font-bold font-mono text-[#F43F5E]">{summaryStats.failedLaunches.toLocaleString()}</div>
          <span className="text-[10px] font-mono text-[#F43F5E]">{Number((100 - summaryStats.successRate).toFixed(2))}% Failure Rate</span>
        </div>
      </div>

      {/* Multi-Field Search & Coordinated Filters Bar (Step 4 & 5) */}
      <div className="space-panel p-4 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#39D5F2]" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              DATASET QUERY & FILTER ENGINE ({sortedMissions.length.toLocaleString()} MATCHING)
            </span>
          </div>

          {(tableSearch || filterCountry !== 'All' || filterVehicle !== 'All' || filterAgency !== 'All' || filterSite !== 'All' || filterOutcome !== 'All' || filterClass !== 'All' || filterYear !== 'All') && (
            <button
              onClick={resetFilters}
              className="text-[10px] font-mono text-[#39D5F2] hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {/* Universal Search Input */}
          <div className="sm:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-[#8798B3] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search mission / payload / vehicle / tag..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#0A1222] border border-white/10 text-xs text-white placeholder-[#8798B3] font-mono focus:outline-none focus:border-[#39D5F2]"
            />
          </div>

          {/* Country Filter */}
          <div>
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#0A1222] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#39D5F2]"
            >
              <option value="All">All Countries ({filterOptions.countries.length})</option>
              {filterOptions.countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Vehicle Filter */}
          <div>
            <select
              value={filterVehicle}
              onChange={(e) => setFilterVehicle(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#0A1222] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#39D5F2]"
            >
              <option value="All">All Vehicles ({filterOptions.vehicles.length})</option>
              {filterOptions.vehicles.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {/* Agency Filter */}
          <div>
            <select
              value={filterAgency}
              onChange={(e) => setFilterAgency(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#0A1222] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#39D5F2]"
            >
              <option value="All">All Agencies ({filterOptions.agencies.length})</option>
              {filterOptions.agencies.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Spaceport Site Filter */}
          <div>
            <select
              value={filterSite}
              onChange={(e) => setFilterSite(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#0A1222] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#39D5F2]"
            >
              <option value="All">All Sites ({filterOptions.sites.length})</option>
              {filterOptions.sites.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#0A1222] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#39D5F2]"
            >
              <option value="All">All Classes</option>
              <option value="Orbital">Orbital (7,201)</option>
              <option value="Deep space">Deep space (229)</option>
            </select>
          </div>

          {/* Outcome Filter */}
          <div>
            <select
              value={filterOutcome}
              onChange={(e) => setFilterOutcome(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#0A1222] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#39D5F2]"
            >
              <option value="All">All Outcomes</option>
              <option value="Success">Success (6,923)</option>
              <option value="Failure">Failure (507)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Interactive Data Table (Step 3 & 9) */}
      <div className="space-panel p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#39D5F2]" />
              CANONICAL MISSION MANIFEST ({sortedMissions.length.toLocaleString()} RECORDS)
            </h3>
            <span className="text-[10px] text-[#8798B3] font-mono">
              Click column headers to sort • Click any row to inspect deep mission telemetry
            </span>
          </div>

          {/* Column Presets & Visibility Controls */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#8798B3] hidden md:inline">PRESET:</span>
            <div className="flex rounded-lg overflow-hidden border border-white/10 text-[10px] font-mono">
              <button
                onClick={() => handlePresetChange('essential')}
                className={`px-2.5 py-1 transition ${columnPreset === 'essential' ? 'bg-[#39D5F2]/20 text-[#39D5F2] font-bold' : 'bg-[#0A1222] text-[#8798B3]'}`}
              >
                Essential
              </button>
              <button
                onClick={() => handlePresetChange('orbital')}
                className={`px-2.5 py-1 transition ${columnPreset === 'orbital' ? 'bg-[#39D5F2]/20 text-[#39D5F2] font-bold' : 'bg-[#0A1222] text-[#8798B3]'}`}
              >
                Orbital
              </button>
              <button
                onClick={() => handlePresetChange('all')}
                className={`px-2.5 py-1 transition ${columnPreset === 'all' ? 'bg-[#39D5F2]/20 text-[#39D5F2] font-bold' : 'bg-[#0A1222] text-[#8798B3]'}`}
              >
                All 19
              </button>
            </div>

            {/* Custom Column Toggle Menu */}
            <div className="relative">
              <button
                onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                className="p-1.5 rounded-lg bg-[#0A1222] border border-white/10 hover:border-white/30 text-[#8798B3] hover:text-white"
                title="Toggle Columns"
              >
                <Columns className="w-3.5 h-3.5" />
              </button>

              {showColumnDropdown && (
                <div className="absolute right-0 top-8 w-56 p-2 rounded-xl bg-[#0A1222] border border-white/10 shadow-2xl z-30 max-h-72 overflow-y-auto space-y-1">
                  <div className="text-[10px] font-mono font-bold text-[#39D5F2] px-2 py-1 border-b border-white/10">
                    TOGGLE COLUMNS ({visibleColumns.length}/19)
                  </div>
                  {ALL_COLUMNS.map(col => {
                    const isVisible = visibleColumns.includes(col.key);
                    return (
                      <label 
                        key={col.key} 
                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 cursor-pointer text-xs font-mono text-white"
                      >
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => toggleColumn(col.key)}
                          className="rounded border-white/20 text-[#39D5F2] focus:ring-0"
                        />
                        <span className="truncate">{col.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Rows Per Page */}
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
              className="px-2 py-1 rounded-lg bg-[#0A1222] border border-white/10 text-[10px] font-mono text-white focus:outline-none focus:border-[#39D5F2]"
            >
              <option value="10">10 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>
          </div>
        </div>

        {/* Data Table Container with Horizontal Scroll */}
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-left font-mono text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/10 text-[10px] text-[#8798B3] uppercase bg-[#0A1222]/80 sticky top-0">
                {ALL_COLUMNS.filter(c => visibleColumns.includes(c.key)).map(col => {
                  const isSorted = sortField === col.key;

                  return (
                    <th 
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="py-2.5 px-3 cursor-pointer hover:text-white transition group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.label}</span>
                        {isSorted ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#39D5F2]" /> : <ArrowDown className="w-3 h-3 text-[#39D5F2]" />
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 opacity-20 group-hover:opacity-70 transition" />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedMissions.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="py-8 text-center text-[#8798B3]">
                    No space mission records match your current search and filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedMissions.map((m) => (
                  <tr 
                    key={m.launch_tag} 
                    onClick={() => setSelectedMission(m)}
                    className="hover:bg-[#14233D] transition cursor-pointer group"
                  >
                    {visibleColumns.includes('launch_tag') && (
                      <td className="py-2.5 px-3 text-[#39D5F2] font-semibold">{m.launch_tag}</td>
                    )}
                    {visibleColumns.includes('date') && (
                      <td className="py-2.5 px-3 text-white">{m.date || m.year}</td>
                    )}
                    {visibleColumns.includes('time_utc') && (
                      <td className="py-2.5 px-3 text-[#8798B3]">{m.time_utc || 'N/A'}</td>
                    )}
                    {visibleColumns.includes('year') && (
                      <td className="py-2.5 px-3 text-[#8798B3]">{m.year}</td>
                    )}
                    {visibleColumns.includes('launch_vehicle') && (
                      <td className="py-2.5 px-3 text-white font-medium">{m.launch_vehicle}</td>
                    )}
                    {visibleColumns.includes('flight') && (
                      <td className="py-2.5 px-3 text-[#8798B3]">{m.flight || 'N/A'}</td>
                    )}
                    {visibleColumns.includes('mission') && (
                      <td className="py-2.5 px-3 text-white font-semibold max-w-[200px] truncate">
                        {m.mission || m.flight || m.launch_vehicle}
                      </td>
                    )}
                    {visibleColumns.includes('launch_site') && (
                      <td className="py-2.5 px-3 text-[#8798B3]">{m.launch_site}</td>
                    )}
                    {visibleColumns.includes('launch_pad') && (
                      <td className="py-2.5 px-3 text-[#8798B3]">{m.launch_pad || 'N/A'}</td>
                    )}
                    {visibleColumns.includes('site_country') && (
                      <td className="py-2.5 px-3 text-[#8798B3]">{m.site_country}</td>
                    )}
                    {visibleColumns.includes('agency') && (
                      <td className="py-2.5 px-3 text-[#EAF3FF]">{m.agency}</td>
                    )}
                    {visibleColumns.includes('launch_country') && (
                      <td className="py-2.5 px-3 text-[#8798B3]">{m.launch_country}</td>
                    )}
                    {visibleColumns.includes('launch_class') && (
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          m.launch_class === 'Deep space' 
                            ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30' 
                            : 'bg-white/5 text-white/80'
                        }`}>
                          {m.launch_class}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes('outcome') && (
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          m.outcome === 'Success' ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#F43F5E]/15 text-[#F43F5E]'
                        }`}>
                          {m.outcome === 'Success' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{m.outcome}</span>
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes('launch_code') && (
                      <td className="py-2.5 px-3 text-[#8798B3]">{m.launch_code}</td>
                    )}
                    {visibleColumns.includes('apogee_km') && (
                      <td className="py-2.5 px-3 text-[#39D5F2]">{m.apogee_km !== null ? `${m.apogee_km.toLocaleString()} km` : 'N/A'}</td>
                    )}
                    {visibleColumns.includes('perigee_km') && (
                      <td className="py-2.5 px-3 text-[#648CFF]">{m.perigee_km !== null ? `${m.perigee_km.toLocaleString()} km` : 'N/A'}</td>
                    )}
                    {visibleColumns.includes('inclination_deg') && (
                      <td className="py-2.5 px-3 text-[#A78BFA]">{m.inclination_deg !== null ? `${m.inclination_deg}°` : 'N/A'}</td>
                    )}
                    {visibleColumns.includes('payload_mass_t') && (
                      <td className="py-2.5 px-3 text-white font-bold">{m.payload_mass_t !== null ? `${m.payload_mass_t} t` : 'N/A'}</td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs font-mono text-[#8798B3]">
          <div>
            Showing {((currentPage - 1) * rowsPerPage) + 1}–{Math.min(currentPage * rowsPerPage, sortedMissions.length)} of {sortedMissions.length.toLocaleString()} matching flights
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded bg-[#0A1222] border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white hover:bg-[#101B2D]"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-[#0A1222] border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white hover:bg-[#101B2D]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1 rounded bg-[#0A1222] border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white hover:bg-[#101B2D]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-2 py-1 rounded bg-[#0A1222] border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white hover:bg-[#101B2D]"
            >
              Last
            </button>
          </div>
        </div>
      </div>

      {/* 4. Column Profiling & Data Quality Audit Matrix (Step 6 & 7) */}
      <div className="space-panel p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              FEATURE SCHEMA PROFILING & DATA COMPLETENESS AUDIT (19 COLUMNS)
            </h3>
            <p className="text-[11px] text-[#8798B3]">
              Calculated missing value distributions, distinct cardinalities, and statistical bounds across the canonical dataset.
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#8798B3]">19 CANONICAL FEATURES</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] text-[#8798B3] uppercase bg-[#0A1222]/50">
                <th className="py-2.5 px-3">Field Name</th>
                <th className="py-2.5 px-3">Inferred Type</th>
                <th className="py-2.5 px-3">Completeness</th>
                <th className="py-2.5 px-3">Missing Values</th>
                <th className="py-2.5 px-3">Cardinality</th>
                <th className="py-2.5 px-3">Statistical Bounds / Top Frequencies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {columnProfiles.map(col => {
                const isComplete = col.nullCount === 0;
                const isHighMissing = col.missingPercent > 50;

                return (
                  <tr key={col.field} className="hover:bg-[#14233D] transition">
                    <td className="py-2.5 px-3 font-bold text-[#39D5F2]">{col.field}</td>
                    <td className="py-2.5 px-3 text-[#8798B3]">{col.inferredType}</td>
                    
                    {/* Completeness Bar */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2 w-28">
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              isComplete ? 'bg-[#10B981]' : isHighMissing ? 'bg-[#F59E0B]' : 'bg-[#39D5F2]'
                            }`}
                            style={{ width: `${100 - col.missingPercent}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-bold ${
                          isComplete ? 'text-[#10B981]' : isHighMissing ? 'text-[#F59E0B]' : 'text-white'
                        }`}>
                          {Number((100 - col.missingPercent).toFixed(1))}%
                        </span>
                      </div>
                    </td>

                    {/* Missing Count */}
                    <td className="py-2.5 px-3">
                      {isComplete ? (
                        <span className="text-[#10B981] flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> 0 (0.0%)
                        </span>
                      ) : (
                        <span className={`text-[11px] font-semibold ${isHighMissing ? 'text-[#F59E0B]' : 'text-[#8798B3]'}`}>
                          {col.nullCount.toLocaleString()} ({col.missingPercent}%)
                        </span>
                      )}
                    </td>

                    {/* Distinct Count */}
                    <td className="py-2.5 px-3 text-white font-semibold">
                      {col.distinctCount.toLocaleString()}
                    </td>

                    {/* Statistical Bounds / Top Values */}
                    <td className="py-2.5 px-3 text-[11px] text-[#8798B3]">
                      {col.isNumeric && col.min !== null && col.min !== undefined && col.max !== null && col.max !== undefined ? (
                        <div className="space-y-0.5">
                          <span className="text-white">
                            Range: [{col.min.toLocaleString()} .. {col.max.toLocaleString()}]
                          </span>
                          <span className="block text-[10px] text-[#39D5F2]">
                            Mean: {col.mean?.toLocaleString()} | Median: {col.median?.toLocaleString()}
                          </span>
                        </div>
                      ) : col.topValues && col.topValues.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {col.topValues.map(t => (
                            <span key={t.value} className="px-1.5 py-0.2 rounded bg-white/5 text-white/90 text-[10px]">
                              {t.value} ({t.count.toLocaleString()})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-white/50">{col.sampleValues.slice(0, 2).join(', ')}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Clicked Mission Rows */}
      {selectedMission && (
        <MissionDetailModal 
          mission={selectedMission} 
          onClose={() => setSelectedMission(null)} 
        />
      )}
    </div>
  );
};
