import React, { useState } from 'react';
import { Trophy, Menu, X, Plus, Shield, Eye, Database, Sparkles, Shuffle } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isAdmin: boolean;
  onToggleAdmin: () => void;
  onOpenCreateTournament: () => void;
  onOpenBackupModal: () => void;
  hasDemoData: boolean;
  onLoadDemoData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  isAdmin,
  onToggleAdmin,
  onOpenCreateTournament,
  onOpenBackupModal,
  hasDemoData,
  onLoadDemoData,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'tournaments', label: 'Campeonatos' },
    { id: 'teams', label: 'Equipes' },
    { id: 'draws', label: 'Sorteios' },
    { id: 'standings', label: 'Tabelas' },
  ];

  const handleLinkClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-8 py-3.5">
        {/* Zone 1: Brand Wordmark (One single element) */}
        <button
          onClick={() => handleLinkClick('dashboard')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-orange-600/30 group-hover:scale-105 transition-transform">
            <Trophy className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="text-xl font-black font-display tracking-tight text-white whitespace-nowrap shrink-0 group-hover:text-orange-400 transition-colors">
            THIS & THAT
          </span>
        </button>

        {/* Zone 2: Nav Links (4-5 single-line clean text links) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id)}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentView === link.id
                  ? 'text-orange-400 font-bold border-b-2 border-orange-500'
                  : 'text-slate-300'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 Primary Action + Mode / Mobile Toggles */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Admin / Public Switcher */}
          <button
            onClick={onToggleAdmin}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              isAdmin
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            }`}
            title="Alternar entre modo Organizador (Admin) e modo Espectador (Público)"
          >
            {isAdmin ? <Shield className="w-3.5 h-3.5 text-orange-400" /> : <Eye className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isAdmin ? 'Modo Organizador' : 'Modo Espectador'}</span>
          </button>

          {/* Backup Button */}
          <button
            onClick={onOpenBackupModal}
            className="hidden sm:flex p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Backup e Restauração"
            aria-label="Abrir modal de backup"
          >
            <Database className="w-4 h-4" />
          </button>

          {/* Primary Action Button */}
          {isAdmin ? (
            <button
              onClick={onOpenCreateTournament}
              className="hidden sm:flex px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-xl shadow-lg shadow-orange-600/30 items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Campeonato</span>
            </button>
          ) : (
            <button
              onClick={onToggleAdmin}
              className="hidden sm:flex px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-600/30 items-center gap-1.5 transition-all whitespace-nowrap shrink-0"
            >
              <span>Acessar Painel</span>
            </button>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 py-4 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  currentView === link.id
                    ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            {isAdmin && (
              <button
                onClick={() => {
                  onOpenCreateTournament();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-orange-600 text-white flex items-center justify-center gap-2 shadow-md shadow-orange-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Novo Campeonato</span>
              </button>
            )}

            <button
              onClick={() => {
                onToggleAdmin();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-between"
            >
              <span>{isAdmin ? 'Modo Organizador (Admin)' : 'Modo Espectador'}</span>
              <span className="text-orange-400 text-[11px]">Alternar</span>
            </button>

            <button
              onClick={() => {
                onOpenBackupModal();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-2"
            >
              <Database className="w-4 h-4 text-orange-400" />
              <span>Backup e Dados</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
