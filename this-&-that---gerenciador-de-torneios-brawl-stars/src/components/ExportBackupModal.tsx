import React, { useState, useRef } from 'react';
import { X, Download, Upload, Database, Check, AlertTriangle, FileJson, FileSpreadsheet, Trash2 } from 'lucide-react';
import { StorageService } from '../db/indexedDB';
import { AppBackup, Match, Team, TeamStanding, Tournament } from '../types/tournament';

interface ExportBackupModalProps {
  isOpen: boolean;
  tournaments: Tournament[];
  teams: Team[];
  matches: Match[];
  onClose: () => void;
  onDataRestored: () => void;
  onClearAllData: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ExportBackupModal: React.FC<ExportBackupModalProps> = ({
  isOpen,
  tournaments,
  teams,
  matches,
  onClose,
  onDataRestored,
  onClearAllData,
  onShowToast,
}) => {
  const [restorePreview, setRestorePreview] = useState<AppBackup | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Export JSON Full Backup
  const handleDownloadJSONBackup = async () => {
    try {
      const backup = await StorageService.exportFullBackup();
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_this_and_that_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      onShowToast('Backup Concluído', 'O arquivo JSON foi gerado e salvo com sucesso.', 'success');
    } catch (e: any) {
      onShowToast('Erro ao exportar', e.message || 'Falha ao gerar arquivo', 'error');
    }
  };

  // Select File for Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as AppBackup;
        if (!parsed.tournaments || !Array.isArray(parsed.tournaments)) {
          throw new Error('Arquivo não possui estrutura válida de campeonatos.');
        }
        setRestorePreview(parsed);
        setRestoreError(null);
      } catch (err: any) {
        setRestoreError(err.message || 'JSON inválido ou corrompido.');
        setRestorePreview(null);
      }
    };
    reader.readAsText(file);
  };

  // Execute Restore
  const handleConfirmRestore = async () => {
    if (!restorePreview) return;
    const res = await StorageService.restoreFullBackup(restorePreview);
    if (res.success) {
      onShowToast('Restauração Completa!', res.message, 'success');
      onDataRestored();
      setRestorePreview(null);
      onClose();
    } else {
      onShowToast('Falha na Restauração', res.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="backup-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div>
            <h3 id="backup-modal-title" className="text-xl font-bold text-white font-display flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-400" />
              Backup & Exportação de Dados
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Proteja seus campeonatos e garanta a persistência local entre navegadores.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Storage Notice */}
        <div className="my-4 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-amber-300 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Aviso de Armazenamento Local:</strong> Os dados de THIS & THAT são armazenados localmente no seu navegador via IndexedDB. Limpar o cache ou histórico do navegador pode apagá-los. Baixe um backup JSON regularmente!
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Export JSON Option */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <FileJson className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm font-display">Exportar Backup Completo (JSON)</h4>
                <p className="text-xs text-slate-400">
                  Salva todos os campeonatos ({tournaments.length}), equipes ({teams.length}), jogadores e partidas.
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadJSONBackup}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/30 flex items-center gap-1.5 transition-all shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar JSON</span>
            </button>
          </div>

          {/* Restore JSON Option */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm font-display">Restaurar Backup (JSON)</h4>
                  <p className="text-xs text-slate-400">
                    Carregue um arquivo JSON gerado anteriormente.
                  </p>
                </div>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Selecionar</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {restoreError && (
              <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/30">
                {restoreError}
              </p>
            )}

            {restorePreview && (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Arquivo Válido
                  </span>
                  <span className="text-slate-400 font-mono">
                    Exportado em: {new Date(restorePreview.exportedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-950 rounded-lg">
                    <span className="text-slate-400 block">Torneios</span>
                    <strong className="text-white text-sm font-mono">{restorePreview.tournaments.length}</strong>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg">
                    <span className="text-slate-400 block">Equipes</span>
                    <strong className="text-white text-sm font-mono">{restorePreview.teams?.length || 0}</strong>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg">
                    <span className="text-slate-400 block">Partidas</span>
                    <strong className="text-white text-sm font-mono">{restorePreview.matches?.length || 0}</strong>
                  </div>
                </div>

                <button
                  onClick={handleConfirmRestore}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition-all"
                >
                  Confirmar e Restaurar Dados
                </button>
              </div>
            )}
          </div>

          {/* Danger Zone: Clear database */}
          <div className="p-4 rounded-2xl bg-red-950/20 border border-red-900/40 flex items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-red-400 text-xs font-display flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> Resetar Banco de Dados Local
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Apaga todos os campeonatos e participantes armazenados no navegador.
              </p>
            </div>
            {!confirmClear ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded-xl text-xs font-bold border border-red-500/40 transition-all shrink-0"
              >
                Limpar Tudo
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onClearAllData();
                    setConfirmClear(false);
                    onClose();
                  }}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black shadow-lg shadow-red-600/40 transition-all"
                >
                  Confirmar Reset
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
