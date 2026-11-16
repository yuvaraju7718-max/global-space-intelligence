import React, { useState } from 'react';
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
  Clock,
  RefreshCw
} from 'lucide-react';
import { SAMPLE_MISSIONS } from '../../data/spaceData';
import { SpaceMission, FilterState } from '../../types';

interface DatasetLabPageProps {
  filters: FilterState;
}

export const DatasetLabPage: React.FC<DatasetLabPageProps> = ({ filters }) => {
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;

  const dataDictionary = [
    { field: 'Mission_ID', type: 'String (UUID)', nullCount: 0, distinct: 4682, viz: 'Yes', ml: 'No (Identifier)', desc: 'Unique mission tracking code' },
    { field: 'Mission_Name', type: 'String', nullCount: 0, distinct: 4410, viz: 'Yes', ml: 'No (Target Leakage)', desc: 'Official flight designation' },
    { field: 'Agency_Operator', type: 'String (Categorical)', nullCount: 0, distinct: 142, viz: 'Yes', ml: 'Yes (One-Hot / Target Encode)', desc: 'Launch customer or organizing agency' },
    { field: 'Country_Sovereign', type: 'String (Categorical)', nullCount: 0, distinct: 38, viz: 'Yes', ml: 'Yes (Categorical)', desc: 'Country of registration/launch' },
    { field: 'Launch_Date', type: 'Date (ISO-8601)', nullCount: 0, distinct: 3950, viz: 'Yes', ml: 'Feature Extract (Month/Season)', desc: 'Calendar date of T-0 liftoff' },
    { field: 'Launch_Vehicle', type: 'String (Categorical)', nullCount: 0, distinct: 185, viz: 'Yes', ml: 'Yes (Booster Family Class)', desc: 'Rocket launcher name and model' },
    { field: 'Payload_Type', type: 'String (Categorical)', nullCount: 0, distinct: 8, viz: 'Yes', ml: 'Yes (Mission Category)', desc: 'Primary payload functional domain' },
    { field: 'Payload_Mass_kg', type: 'Float64 (Continuous)', nullCount: 312, distinct: 1250, viz: 'Yes', ml: 'Yes (Imputed / Scaled)', desc: 'Mass of deployed payload at separation' },
    { field: 'Orbit_Destination', type: 'String (Categorical)', nullCount: 0, distinct: 8, viz: 'Yes', ml: 'Yes (Pre-launch target)', desc: 'Target orbital regime (LEO, GEO, Lunar)' },
    { field: 'Mission_Status', type: 'String (Categorical)', nullCount: 0, distinct: 3, viz: 'Yes', ml: 'Target Variable (y)', desc: 'Outcome: Success, Failure, Partial' },
  ];

  const filteredMissions = SAMPLE_MISSIONS.filter(m => 
    m.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
    m.agency.toLowerCase().includes(tableSearch.toLowerCase()) ||
    m.vehicle.toLowerCase().includes(tableSearch.toLowerCase()) ||
    m.country.toLowerCase().includes(tableSearch.toLowerCase()) ||
    m.orbit.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const totalPages = Math.ceil(filteredMissions.length / rowsPerPage);
  const paginatedMissions = filteredMissions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleExportCSV = () => {
    const headers = ['id', 'name', 'agency', 'country', 'launchSite', 'launchDate', 'vehicle', 'orbit', 'status'];
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...SAMPLE_MISSIONS.map(m => 
        [m.id, `"${m.name}"`, `"${m.agency}"`, `"${m.country}"`, `"${m.launchSite}"`, m.launchDate, `"${m.vehicle}"`, m.orbit, m.status].join(',')
      )].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'canonical_space_missions_preview.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#101B2D] via-[#0A1222] to-[#101B2D] border border-[#39D5F2]/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-3.5 h-3.5 text-[#39D5F2]" />
            <span className="text-[10px] font-mono text-[#39D5F2] tracking-widest uppercase">
              DATASET LABORATORY & QUALITY SCHEMA
            </span>
          </div>
          <h2 className="text-xl font-display font-bold text-white tracking-wide">
            DATA GOVERNANCE, AUDIT LOGS & SCHEMA VALIDATION
          </h2>
          <p className="text-xs text-[#8798B3]">
            Raw space-missions dataset inspection, missing-value profile, deduplication audit, and export tools.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#39D5F2]/10 hover:bg-[#39D5F2]/20 border border-[#39D5F2]/30 text-[#39D5F2] text-xs font-mono font-semibold transition shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>EXPORT PREVIEW DATA (CSV)</span>
        </button>
      </div>

      {/* Data Health & Integrity Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#101B2D]/70 border border-white/5 space-y-1">
          <span className="text-[10px] font-mono text-[#8798B3] uppercase">RAW RECORDS AVAILABLE</span>
          <div className="text-xl font-bold font-mono text-white">4,682 Rows</div>
          <span className="text-[10px] font-mono text-[#10B981] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Source CSV Verified
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#101B2D]/70 border border-white/5 space-y-1">
          <span className="text-[10px] font-mono text-[#8798B3] uppercase">CONFIRMED DUPLICATES</span>
          <div className="text-xl font-bold font-mono text-white">0 Records</div>
          <span className="text-[10px] font-mono text-[#39D5F2]">100% Unique Primary Keys</span>
        </div>

        <div className="p-4 rounded-xl bg-[#101B2D]/70 border border-white/5 space-y-1">
          <span className="text-[10px] font-mono text-[#8798B3] uppercase">FEATURE COMPLETENESS</span>
          <div className="text-xl font-bold font-mono text-white">96.8% Valid</div>
          <span className="text-[10px] font-mono text-[#8798B3]">Minimal missing mass values</span>
        </div>

        <div className="p-4 rounded-xl bg-[#101B2D]/70 border border-white/5 space-y-1">
          <span className="text-[10px] font-mono text-[#8798B3] uppercase">PIPELINE READINESS</span>
          <div className="text-xl font-bold font-mono text-[#39D5F2]">READY</div>
          <span className="text-[10px] font-mono text-[#8798B3]">data_cleaning.py standby</span>
        </div>
      </div>

      {/* Interactive Paginated Dataset Table */}
      <div className="space-panel p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#39D5F2]" />
              CANONICAL MISSION DATASET PREVIEW ({filteredMissions.length} RECORDS)
            </h3>
            <span className="text-[10px] text-[#8798B3] font-mono">Real-time searchable tabular view</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#8798B3] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter table rows..."
              className="w-full bg-[#0A1222] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#8798B3] focus:outline-none focus:border-[#39D5F2]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] text-[#8798B3] uppercase bg-[#0A1222]/50">
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Mission Name</th>
                <th className="py-2.5 px-3">Agency</th>
                <th className="py-2.5 px-3">Country</th>
                <th className="py-2.5 px-3">Vehicle</th>
                <th className="py-2.5 px-3">Orbit</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedMissions.map((m) => (
                <tr key={m.id} className="hover:bg-[#14233D] transition">
                  <td className="py-2.5 px-3 text-[#39D5F2] font-semibold">{m.id}</td>
                  <td className="py-2.5 px-3 font-sans font-medium text-white">{m.name}</td>
                  <td className="py-2.5 px-3 text-[#8798B3]">{m.agency}</td>
                  <td className="py-2.5 px-3 text-[#8798B3]">{m.country}</td>
                  <td className="py-2.5 px-3 text-white/90">{m.vehicle}</td>
                  <td className="py-2.5 px-3 text-[#648CFF]">{m.orbit}</td>
                  <td className="py-2.5 px-3 text-[#8798B3]">{m.launchDate}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      m.status === 'Success'
                        ? 'bg-[#10B981]/15 text-[#10B981]'
                        : 'bg-[#F43F5E]/15 text-[#F43F5E]'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs font-mono text-[#8798B3]">
          <span>
            Page {currentPage} of {Math.max(1, totalPages)}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-[#0A1222] border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#101B2D]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg bg-[#0A1222] border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#101B2D]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Data Dictionary & ML Eligibility Matrix */}
      <div className="space-panel p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            DATA DICTIONARY & FEATURE ELIGIBILITY AUDIT
          </h3>
          <span className="text-[10px] font-mono text-[#8798B3]">10 COLUMNS PROFILED</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] text-[#8798B3] uppercase">
                <th className="pb-2">Field Name</th>
                <th className="pb-2">Inferred Type</th>
                <th className="pb-2">Missing Values</th>
                <th className="pb-2">Distinct Count</th>
                <th className="pb-2">Viz Eligible</th>
                <th className="pb-2">ML Feature Eligible</th>
                <th className="pb-2">Semantic Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dataDictionary.map(col => (
                <tr key={col.field} className="hover:bg-[#14233D] transition">
                  <td className="py-2.5 font-bold text-white text-[#39D5F2]">{col.field}</td>
                  <td className="py-2.5 text-[#8798B3]">{col.type}</td>
                  <td className="py-2.5">
                    {col.nullCount === 0 ? (
                      <span className="text-[#10B981]">0 (0%)</span>
                    ) : (
                      <span className="text-[#F59E0B]">{col.nullCount} (6.6%)</span>
                    )}
                  </td>
                  <td className="py-2.5 text-white">{col.distinct}</td>
                  <td className="py-2.5 text-[#10B981]">{col.viz}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      col.ml.startsWith('Yes') 
                        ? 'bg-[#10B981]/15 text-[#10B981]' 
                        : col.ml.startsWith('Target')
                          ? 'bg-[#39D5F2]/15 text-[#39D5F2]'
                          : 'bg-white/5 text-[#8798B3]'
                    }`}>
                      {col.ml}
                    </span>
                  </td>
                  <td className="py-2.5 text-[#8798B3] font-sans">{col.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
