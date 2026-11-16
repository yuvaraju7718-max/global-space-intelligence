import React from 'react';
import { 
  LayoutDashboard, 
  Globe2, 
  History, 
  BarChart3, 
  Layers, 
  Binary, 
  Database, 
  ChevronLeft, 
  ChevronRight,
  Activity,
  Radio,
  Sparkles
} from 'lucide-react';

export type NavPageId = 
  | 'overview' 
  | 'explorer' 
  | 'timeline' 
  | 'country' 
  | 'analytics' 
  | 'ml' 
  | 'dataset';

interface SidebarProps {
  activePage: NavPageId;
  onSelectPage: (page: NavPageId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  isCollapsed,
  onToggleCollapse,
}) => {
  const navItems = [
    {
      id: 'overview' as NavPageId,
      label: 'Overview',
      subtitle: 'Global Command Center',
      icon: LayoutDashboard,
      badge: 'LIVE',
    },
    {
      id: 'explorer' as NavPageId,
      label: 'Global Explorer',
      subtitle: 'Spaceports & Trajectories',
      icon: Globe2,
    },
    {
      id: 'timeline' as NavPageId,
      label: 'Mission Timeline',
      subtitle: 'Space Exploration 1957+',
      icon: History,
    },
    {
      id: 'country' as NavPageId,
      label: 'Country Analysis',
      subtitle: 'Sovereign Space Programs',
      icon: BarChart3,
    },
    {
      id: 'analytics' as NavPageId,
      label: 'Mission Analytics',
      subtitle: 'Vehicles, Orbits & Classes',
      icon: Layers,
    },
    {
      id: 'ml' as NavPageId,
      label: 'ML Intelligence',
      subtitle: 'Prediction & Governance',
      icon: Binary,
      badge: 'BETA',
    },
    {
      id: 'dataset' as NavPageId,
      label: 'Dataset Lab',
      subtitle: 'Auditing & Quality Schema',
      icon: Database,
    },
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen z-40 bg-[#0A1222] border-r border-[#39D5F2]/15 flex flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-white/5">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Custom Earth Orbital Path Logo */}
          <div className="relative w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#101B2D] to-[#070D1A] border border-[#39D5F2]/30 shadow-glow-cyan">
            {/* Center Earth node */}
            <div className="w-3.5 h-3.5 rounded-full bg-[#39D5F2] shadow-[0_0_12px_#39D5F2]" />
            {/* Elliptical orbit ring 1 */}
            <div className="absolute inset-1 rounded-full border border-[#648CFF]/50 rotate-45 transform scale-x-125" />
            {/* Elliptical orbit ring 2 */}
            <div className="absolute inset-1.5 rounded-full border border-[#A78BFA]/40 -rotate-30 transform scale-y-125" />
            {/* Satellite pip */}
            <div className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-[#A78BFA] animate-ping" />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-display font-bold text-sm tracking-wider text-white uppercase truncate flex items-center gap-1.5">
                GLOBAL SPACE
                <span className="text-[#39D5F2] font-mono text-xs">GSI</span>
              </span>
              <span className="text-[10px] font-mono text-[#8798B3] tracking-widest uppercase">
                INTELLIGENCE OS v4.2
              </span>
            </div>
          )}
        </div>

        {/* Collapse toggle button */}
        <button
          onClick={onToggleCollapse}
          className="w-7 h-7 rounded-lg bg-[#101B2D] hover:bg-[#1C2D4A] border border-white/10 text-[#8798B3] hover:text-white flex items-center justify-center transition shrink-0"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5">
        <div className={`px-3 mb-2 text-[10px] font-mono tracking-widest text-[#8798B3]/70 uppercase ${isCollapsed ? 'text-center' : ''}`}>
          {isCollapsed ? '•••' : 'SYSTEM MODULES'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`w-full group relative flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all duration-200 text-left ${
                isActive
                  ? 'bg-gradient-to-r from-[#101B2D] to-[#14233D] text-[#EAF3FF] border border-[#39D5F2]/35 shadow-lg'
                  : 'text-[#8798B3] hover:text-[#EAF3FF] hover:bg-[#101B2D]/60 border border-transparent'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              {/* Active glow indicator on left */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#39D5F2] rounded-r shadow-[0_0_8px_#39D5F2]" />
              )}

              <div className={`p-2 rounded-lg transition shrink-0 ${
                isActive 
                  ? 'bg-[#39D5F2]/15 text-[#39D5F2]' 
                  : 'bg-white/5 text-[#8798B3] group-hover:text-white group-hover:bg-white/10'
              }`}>
                <Icon className="w-4 h-4" />
              </div>

              {!isCollapsed && (
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="truncate">
                    <p className={`text-xs font-semibold tracking-wide ${isActive ? 'text-white' : 'text-[#8798B3] group-hover:text-white'}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-[#8798B3]/60 truncate font-mono">
                      {item.subtitle}
                    </p>
                  </div>

                  {item.badge && (
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      item.badge === 'LIVE' 
                        ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30' 
                        : 'bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Telemetry Status Footer */}
      <div className="p-3 border-t border-white/5 bg-[#070D1A]/70">
        {!isCollapsed ? (
          <div className="p-3 rounded-xl bg-[#101B2D]/80 border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#8798B3] uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-[#10B981] animate-pulse" />
                TELEMETRY LINK
              </span>
              <span className="text-[10px] font-mono text-[#10B981] font-semibold">
                STABLE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-[10px] font-mono text-[#8798B3]">
              <div>
                <span className="block text-[9px] text-white/40">LATENCY</span>
                <span className="text-[#39D5F2]">18 ms</span>
              </div>
              <div>
                <span className="block text-[9px] text-white/40">DATA FEED</span>
                <span className="text-[#648CFF]">LOCAL HOST</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="System Link Active">
            <div className="w-3 h-3 rounded-full bg-[#10B981] animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
};
