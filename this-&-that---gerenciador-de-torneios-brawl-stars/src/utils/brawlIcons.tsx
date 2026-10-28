import React from 'react';
import { 
  Flame, 
  Skull, 
  Star, 
  Sword, 
  Shield, 
  Zap, 
  Crosshair, 
  Crown,
  Trophy,
  Swords
} from 'lucide-react';
import { TournamentFormat, TournamentStatus, BrawlModality } from '../types/tournament';

export const BADGE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  flame: Flame,
  skull: Skull,
  star: Star,
  sword: Sword,
  shield: Shield,
  zap: Zap,
  crosshair: Crosshair,
  crown: Crown,
  trophy: Trophy,
  swords: Swords,
};

export function renderTeamBadge(badgeName: string, color: string, sizeClass = 'w-8 h-8'): React.ReactNode {
  const IconComponent = BADGE_ICONS[badgeName] || Shield;
  return (
    <div 
      className={`${sizeClass} rounded-xl flex items-center justify-center shrink-0 shadow-md border border-white/20`}
      style={{ backgroundColor: color || '#F97316' }}
    >
      <IconComponent className="w-1/2 h-1/2 text-white drop-shadow-sm" />
    </div>
  );
}

export function formatStatusLabel(status: TournamentStatus): { text: string; bg: string; textCol: string } {
  switch (status) {
    case 'draft':
      return { text: 'Rascunho', bg: 'bg-slate-800', textCol: 'text-slate-300' };
    case 'registration':
      return { text: 'Inscrições Abertas', bg: 'bg-blue-500/20 border border-blue-500/30', textCol: 'text-blue-400' };
    case 'ready':
      return { text: 'Pronto para Iniciar', bg: 'bg-yellow-500/20 border border-yellow-500/30', textCol: 'text-yellow-400' };
    case 'in_progress':
      return { text: 'Em Andamento', bg: 'bg-orange-500/20 border border-orange-500/30', textCol: 'text-orange-400' };
    case 'paused':
      return { text: 'Pausado', bg: 'bg-amber-500/20 border border-amber-500/30', textCol: 'text-amber-400' };
    case 'finished':
      return { text: 'Finalizado', bg: 'bg-emerald-500/20 border border-emerald-500/30', textCol: 'text-emerald-400' };
    case 'archived':
      return { text: 'Arquivado', bg: 'bg-slate-800/80 border border-slate-700', textCol: 'text-slate-400' };
    default:
      return { text: status, bg: 'bg-slate-800', textCol: 'text-slate-300' };
  }
}

export function formatFormatLabel(format: TournamentFormat): string {
  switch (format) {
    case 'single_elimination':
      return 'Mata-Mata (Eliminação Simples)';
    case 'double_elimination':
      return 'Eliminação Dupla';
    case 'groups_playoffs':
      return 'Fase de Grupos + Mata-Mata';
    case 'round_robin':
      return 'Todos Contra Todos';
    case 'league':
      return 'Liga por Pontos Corridos';
    default:
      return format;
  }
}

export const BRAWL_MODALITIES: BrawlModality[] = [
  'Fute-Brawl',
  'Pique-Gema',
  'Zona Estratégica',
  'Nocaute',
  'Roubo',
  'Caça-Estrelas',
  'Combate',
  'Mista',
];

export const BRAWL_MAPS_BY_MODALITY: Record<BrawlModality, string[]> = {
  'Fute-Brawl': ['Super Estádio', 'Pinball Bizarro', 'Campos Esgueirantes', 'Centro de Palco', 'Pátio Traseiro'],
  'Pique-Gema': ['Mina Rochosa', 'Fliperama Cristalino', 'Fuga Frenética', 'Voo de Bastião'],
  'Zona Estratégica': ['Dividido', 'Ringue de Luta', 'Besouros Bárbaros', 'Paraíso do Duelo'],
  'Nocaute': ['Canal Central', 'Barranco Profundo', 'Rocha da Pradaria', 'Extinção'],
  'Roubo': ['Ravina Segura', 'Ponte Remota', 'Bifurcação Quente', 'Tornado'],
  'Caça-Estrelas': ['Canal Principal', 'Ruínas do Templo', 'Planície Nevada', 'Estrela Solitária'],
  'Combate': ['Caverna Traiçoeira', 'Invasão da Ilha', 'Dois Rios', 'Planície da Morte'],
  'Mista': ['Super Estádio', 'Mina Rochosa', 'Canal Central', 'Ringue de Luta'],
};
