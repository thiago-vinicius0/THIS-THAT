import React, { useState, useEffect } from 'react';
import { X, Trophy, Settings, Users, Shield, Check, AlertCircle } from 'lucide-react';
import { BrawlModality, ScoringRules, TeamType, TiebreakerCriterion, Tournament, TournamentFormat, TournamentStatus } from '../types/tournament';
import { BRAWL_MODALITIES } from '../utils/brawlIcons';

interface TournamentFormModalProps {
  isOpen: boolean;
  initialData?: Tournament | null;
  onSave: (data: Partial<Tournament>) => void;
  onClose: () => void;
}

export const TournamentFormModal: React.FC<TournamentFormModalProps> = ({
  isOpen,
  initialData,
  onSave,
  onClose,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [modality, setModality] = useState<BrawlModality>('Fute-Brawl');
  const [format, setFormat] = useState<TournamentFormat>('groups_playoffs');
  const [teamType, setTeamType] = useState<TeamType>('3v3');
  const [teamsCount, setTeamsCount] = useState<number>(8);
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(3);
  const [isPublic, setIsPublic] = useState(true);
  const [status, setStatus] = useState<TournamentStatus>('draft');
  const [startDate, setStartDate] = useState('');
  const [groupsCount, setGroupsCount] = useState<number>(2);
  const [qualifiersPerGroup, setQualifiersPerGroup] = useState<number>(2);
  
  // Scoring & Tiebreakers
  const [winPoints, setWinPoints] = useState(3);
  const [drawPoints, setDrawPoints] = useState(1);
  const [lossPoints, setLossPoints] = useState(0);
  const [allowDraws, setAllowDraws] = useState(false);
  const [tiebreakerOrder, setTiebreakerOrder] = useState<TiebreakerCriterion[]>([
    'points',
    'wins',
    'diff',
    'scored',
    'head_to_head',
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setOrganizer(initialData.organizer || '');
      setModality(initialData.modality || 'Fute-Brawl');
      setFormat(initialData.format || 'groups_playoffs');
      setTeamType(initialData.teamType || '3v3');
      setTeamsCount(initialData.teamsCount || 8);
      setPlayersPerTeam(initialData.playersPerTeam || 3);
      setIsPublic(initialData.isPublic ?? true);
      setStatus(initialData.status || 'draft');
      setStartDate(initialData.startDate ? initialData.startDate.split('T')[0] : '');
      setGroupsCount(initialData.groupsCount || 2);
      setQualifiersPerGroup(initialData.qualifiersPerGroup || 2);
      setWinPoints(initialData.scoring?.win ?? 3);
      setDrawPoints(initialData.scoring?.draw ?? 1);
      setLossPoints(initialData.scoring?.loss ?? 0);
      setAllowDraws(initialData.scoring?.allowDraws ?? false);
      setTiebreakerOrder(initialData.tiebreakerOrder || ['points', 'wins', 'diff', 'scored', 'head_to_head']);
    } else {
      // Defaults for new tournament
      setName('');
      setDescription('');
      setOrganizer('');
      setModality('Fute-Brawl');
      setFormat('groups_playoffs');
      setTeamType('3v3');
      setTeamsCount(8);
      setPlayersPerTeam(3);
      setIsPublic(true);
      setStatus('draft');
      setStartDate(new Date().toISOString().split('T')[0]);
      setGroupsCount(2);
      setQualifiersPerGroup(2);
      setWinPoints(3);
      setDrawPoints(1);
      setLossPoints(0);
      setAllowDraws(false);
      setTiebreakerOrder(['points', 'wins', 'diff', 'scored', 'head_to_head']);
    }
    setStep(1);
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'O nome do campeonato é obrigatório.';
    if (!organizer.trim()) errs.organizer = 'Informe o nome do organizador.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleFinalSubmit = () => {
    if (!validateStep1()) {
      setStep(1);
      return;
    }

    const scoring: ScoringRules = {
      win: winPoints,
      draw: drawPoints,
      loss: lossPoints,
      allowDraws: allowDraws,
    };

    onSave({
      name: name.trim(),
      description: description.trim(),
      organizer: organizer.trim(),
      modality,
      format,
      teamType,
      teamsCount,
      playersPerTeam: teamType === '1v1' ? 1 : playersPerTeam,
      isPublic,
      status,
      startDate: startDate || new Date().toISOString(),
      groupsCount: format === 'groups_playoffs' ? groupsCount : undefined,
      qualifiersPerGroup: format === 'groups_playoffs' ? qualifiersPerGroup : undefined,
      scoring,
      tiebreakerOrder,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tournament-form-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div>
            <span className="text-xs font-semibold text-orange-400 bg-orange-950/60 border border-orange-800/60 px-2.5 py-0.5 rounded-full">
              {initialData ? 'Editar Campeonato' : 'Novo Campeonato Brawl Stars'}
            </span>
            <h3 id="tournament-form-title" className="text-xl font-bold text-white font-display mt-1">
              {initialData ? initialData.name : 'Configuração do Torneio'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
            aria-label="Fechar formulário"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between py-4 border-b border-slate-800/60 shrink-0">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
              step === 1 ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>1. Informações Gerais</span>
          </button>
          <button
            onClick={() => {
              if (validateStep1()) setStep(2);
            }}
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
              step === 2 ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. Formato & Equipes</span>
          </button>
          <button
            onClick={() => {
              if (validateStep1()) setStep(3);
            }}
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
              step === 3 ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>3. Pontuação & Desempate</span>
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <div className="overflow-y-auto py-5 flex-1 pr-1 space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Nome Oficial do Torneio *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Taça Estelar de Fute-Brawl 2026"
                  className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-sm text-white focus:outline-none ${
                    errors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-orange-500'
                  }`}
                />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Organizador / Comunidade *
                </label>
                <input
                  type="text"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  placeholder="Ex: Liga Brawl Brasil ou Nick do Criador"
                  className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-sm text-white focus:outline-none ${
                    errors.organizer ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-orange-500'
                  }`}
                />
                {errors.organizer && <p className="text-xs text-red-400 mt-1">{errors.organizer}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Modalidade Brawl Stars
                  </label>
                  <select
                    value={modality}
                    onChange={(e) => setModality(e.target.value as BrawlModality)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    {BRAWL_MODALITIES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Data Prevista de Início
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Descrição e Regras Gerais
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Informações adicionais, premiação, formato das séries (ex: MD3) ou canais do Discord..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  <span className="text-sm text-slate-200 font-medium">
                    Exibir nas Páginas Públicas (para espectadores e jogadores)
                  </span>
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-2">
                  Formato Competitivo
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'groups_playoffs', label: 'Grupos + Mata-Mata', desc: 'Fase de grupos classificatória com playoffs eliminatórios.' },
                    { id: 'single_elimination', label: 'Eliminação Simples', desc: 'Mata-mata tradicional direto. Perdeu, está fora.' },
                    { id: 'double_elimination', label: 'Eliminação Dupla', desc: 'Chave superior e repescagem na chave inferior.' },
                    { id: 'round_robin', label: 'Todos Contra Todos', desc: 'Todas as equipes se enfrentam sem eliminação.' },
                    { id: 'league', label: 'Liga por Pontos Corridos', desc: 'Tabela corrida com classificação por pontos e saldo.' },
                  ].map((f) => (
                    <div
                      key={f.id}
                      onClick={() => setFormat(f.id as TournamentFormat)}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        format === f.id
                          ? 'bg-orange-500/10 border-orange-500 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <h4 className="font-bold text-sm font-display">{f.label}</h4>
                      <p className="text-xs text-slate-400 mt-1">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Tipo de Equipe
                  </label>
                  <select
                    value={teamType}
                    onChange={(e) => setTeamType(e.target.value as TeamType)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="3v3">Trios (3v3 Clássico)</option>
                    <option value="1v1">Solo (1v1 Duelo)</option>
                    <option value="duo">Duplas (Duo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Qtd. de Participantes
                  </label>
                  <select
                    value={teamsCount}
                    onChange={(e) => setTeamsCount(parseInt(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value={4}>4 Equipes</option>
                    <option value={8}>8 Equipes (Recomendado)</option>
                    <option value={16}>16 Equipes</option>
                    <option value={32}>32 Equipes</option>
                  </select>
                </div>

                {teamType !== '1v1' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Jogadores por Equipe
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={playersPerTeam}
                      onChange={(e) => setPlayersPerTeam(Math.max(1, parseInt(e.target.value) || 3))}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                )}
              </div>

              {format === 'groups_playoffs' && (
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    Configuração da Fase de Grupos
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">
                        Número de Grupos
                      </label>
                      <select
                        value={groupsCount}
                        onChange={(e) => setGroupsCount(parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                      >
                        <option value={2}>2 Grupos (A e B)</option>
                        <option value={4}>4 Grupos (A, B, C, D)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">
                        Classificados por Grupo
                      </label>
                      <select
                        value={qualifiersPerGroup}
                        onChange={(e) => setQualifiersPerGroup(parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                      >
                        <option value={1}>Top 1 Avança</option>
                        <option value={2}>Top 2 Avançam (Cruzamento)</option>
                        <option value={4}>Top 4 Avançam</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">
                  Tabela de Pontuação por Partida
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <label className="block text-xs text-slate-400 mb-1">Vitória</label>
                    <input
                      type="number"
                      value={winPoints}
                      onChange={(e) => setWinPoints(parseInt(e.target.value) || 0)}
                      className="w-full bg-transparent text-lg font-bold text-emerald-400 font-mono focus:outline-none"
                    />
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <label className="block text-xs text-slate-400 mb-1">Empate</label>
                    <input
                      type="number"
                      disabled={!allowDraws}
                      value={drawPoints}
                      onChange={(e) => setDrawPoints(parseInt(e.target.value) || 0)}
                      className={`w-full bg-transparent text-lg font-bold font-mono focus:outline-none ${
                        allowDraws ? 'text-cyan-400' : 'text-slate-600 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <label className="block text-xs text-slate-400 mb-1">Derrota</label>
                    <input
                      type="number"
                      value={lossPoints}
                      onChange={(e) => setLossPoints(parseInt(e.target.value) || 0)}
                      className="w-full bg-transparent text-lg font-bold text-red-400 font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allowDraws}
                      onChange={(e) => setAllowDraws(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-0 bg-slate-950 border-slate-700"
                    />
                    <span className="text-xs text-slate-300">
                      Permitir empates na fase de pontos (No Brawl Stars tradicional, a prorrogação sempre define um vencedor)
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
                  Ordem dos Critérios de Desempate
                </h4>
                <div className="space-y-1.5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  {tiebreakerOrder.map((criterion, idx) => {
                    const labels: Record<TiebreakerCriterion, string> = {
                      points: '1. Pontos Acumulados',
                      wins: '2. Número de Vitórias',
                      diff: '3. Saldo de Sets / Gols',
                      scored: '4. Pontos / Gols Marcados Pró',
                      head_to_head: '5. Confronto Direto',
                    };
                    return (
                      <div key={criterion} className="flex items-center justify-between p-2 bg-slate-900 rounded-xl text-xs text-slate-200">
                        <span className="font-semibold">{idx + 1}º Critério: {labels[criterion]}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Automático</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 shrink-0">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl transition-colors"
              >
                Voltar
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-xl shadow-lg shadow-orange-600/30 transition-all active:scale-95"
              >
                Próximo
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                {initialData ? 'Salvar Alterações' : 'Criar Campeonato'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
