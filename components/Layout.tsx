
import React, { useState } from 'react';
import { UserRole, AppTheme } from '../types';
import { BrandingLogo } from './Branding';
import { BRANDING } from '../constants/branding';

interface LayoutProps {
  children: React.ReactNode;
  role: UserRole;
  userName: string;
  onRoleSwitch: () => void;
  appTheme: AppTheme;
  onSetTheme: (theme: AppTheme) => void;
  onOpenSync: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, role, userName, onRoleSwitch, appTheme, onSetTheme, onOpenSync }) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const themes: { id: AppTheme; name: string; bg: string; color: string }[] = [
    { id: 'slate', name: 'Slate', bg: 'bg-slate-50', color: 'bg-slate-500' },
    { id: 'blue', name: 'Ocean', bg: 'bg-blue-50', color: 'bg-blue-500' },
    { id: 'emerald', name: 'Forest', bg: 'bg-emerald-50', color: 'bg-emerald-500' },
    { id: 'rose', name: 'Rose', bg: 'bg-rose-50', color: 'bg-rose-500' }
  ];

  const brandParts = BRANDING.NAME.split(' ');

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${themes.find(t => t.id === appTheme)?.bg}`}>
      <header className="bg-white/90 backdrop-blur-xl border-b-2 border-slate-200 sticky top-0 z-[60]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-1 rounded-xl shadow-md border-2 border-slate-200">
                <BrandingLogo className="w-12 h-12 object-contain" />
              </div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tighter uppercase hidden md:inline">
                {brandParts[0]} <span className="text-indigo-600">{brandParts.slice(1).join(' ')}</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-4 md:space-x-6">
              <button 
                onClick={onOpenSync}
                className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-all border border-slate-200"
                title="Sync Data Across Devices"
              >
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 hidden sm:inline">Sync Link</span>
              </button>

              <div className="relative">
                <button 
                  onClick={() => setShowThemeMenu(!showThemeMenu)}
                  className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-all border border-slate-200"
                >
                  <div className={`w-3 h-3 rounded-full ${themes.find(t => t.id === appTheme)?.color}`}></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 hidden sm:inline">Theme</span>
                </button>

                {showThemeMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border-2 border-slate-100 p-2 z-[70] animate-in zoom-in-95 duration-200">
                    <p className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Select Appearance</p>
                    {themes.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { onSetTheme(t.id); setShowThemeMenu(false); }}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${appTheme === t.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <div className={`w-4 h-4 rounded-md ${t.bg} border-2 ${appTheme === t.id ? 'border-indigo-600' : 'border-slate-200'}`}></div>
                        <span>{t.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-black text-slate-900 tracking-tight">{userName}</span>
                <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${
                  role === UserRole.ADMIN ? 'text-amber-500' : 
                  role === UserRole.EXAMINER ? 'text-indigo-500' : 'text-emerald-500'
                }`}>
                  {role} Portal
                </span>
              </div>
              <button 
                onClick={onRoleSwitch}
                className="text-[10px] bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl transition-all font-bold shadow-sm active:scale-95 uppercase tracking-widest"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </main>

      <footer className="bg-white border-t-2 border-slate-200 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-2 grayscale opacity-50">
               <div className="bg-white p-1 rounded-lg border-2 border-slate-200">
                <BrandingLogo className="w-8 h-8 object-contain" />
              </div>
              <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">{BRANDING.NAME}</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Node 1.2.0 • Neural Engine: Gemini Flash</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
