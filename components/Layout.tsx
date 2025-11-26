
import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  PieChart, 
  Settings, 
  LogOut, 
  Menu, 
  Bell, 
  Search,
  TrendingUp,
  ShieldCheck,
  User,
  Briefcase,
  ClipboardCheck,
  X
} from 'lucide-react';
import { AppContext } from '../App';
import { UserRole } from '../types';

const SidebarItem = ({ icon: Icon, label, to, active, onClick }: { icon: any, label: string, to: string, active: boolean, onClick?: () => void }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium text-sm">{label}</span>
  </Link>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const context = useContext(AppContext);
  const location = useLocation();
  const pathname = location.pathname;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!context || !context.currentUser) return null;
  const { currentUser, logout } = context;

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const SidebarContent = () => (
    <>
        <div className="h-16 flex items-center px-6 border-b border-slate-800 justify-between">
            <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center mr-3">
                    <span className="font-bold text-white">B</span>
                </div>
                <span className="font-bold text-lg tracking-tight text-white">Budget & Investment System</span>
            </div>
            {/* Mobile Close Button */}
            <button onClick={toggleMobileMenu} className="md:hidden text-slate-400 hover:text-white">
                <X size={24} />
            </button>
        </div>

        <div className="flex-1 py-6 flex flex-col gap-1 overflow-y-auto">
          <div className="px-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Main Menu</div>
          <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" active={pathname === '/'} onClick={closeMobileMenu} />
          <SidebarItem icon={PieChart} label="Budget Plan" to="/budget" active={pathname.startsWith('/budget')} onClick={closeMobileMenu} />
          <SidebarItem 
            icon={FileText} 
            label="Purchase Request" 
            to="/pr" 
            active={pathname === '/pr' || pathname.startsWith('/pr/')} 
            onClick={closeMobileMenu} 
          />
          <SidebarItem icon={Briefcase} label="Projects" to="/projects" active={pathname.startsWith('/projects')} onClick={closeMobileMenu} />
          
          <div className="px-6 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Analysis</div>
          <SidebarItem icon={TrendingUp} label="Plan vs Realization" to="/comparison" active={pathname === '/comparison'} onClick={closeMobileMenu} />
          <SidebarItem icon={ClipboardCheck} label="Evaluasi Budget vs PR" to="/evaluation" active={pathname === '/evaluation'} onClick={closeMobileMenu} />
          
          {isAdmin && (
            <>
                <div className="px-6 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">System</div>
                <SidebarItem icon={Settings} label="Master Data" to="/admin" active={pathname === '/admin'} onClick={closeMobileMenu} />
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                isAdmin ? 'bg-gradient-to-tr from-blue-500 to-indigo-600' : 'bg-gradient-to-tr from-emerald-500 to-teal-600'
            }`}>
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate text-white">{currentUser.name}</p>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                 {isAdmin ? <ShieldCheck size={10} /> : <User size={10} />}
                 <span className="truncate">{currentUser.role}</span>
              </div>
            </div>
            <button 
                onClick={logout}
                className="text-slate-400 hover:text-white transition-colors"
                title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col border-r border-slate-800">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeMobileMenu}></div>
            <aside className="relative w-64 bg-slate-900 text-white flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-200">
                <SidebarContent />
            </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={toggleMobileMenu} className="md:hidden text-slate-600 hover:bg-slate-100 p-2 rounded-lg">
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center bg-slate-100 rounded-lg px-3 py-2 w-64">
                <Search size={18} className="text-slate-400 mr-2" />
                <input 
                    type="text" 
                    placeholder="Search PR, Budget..." 
                    className="bg-transparent border-none outline-none text-sm text-slate-700 w-full placeholder:text-slate-400"
                />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
