// ============================================================
// ARQUIVO: GeminiSettingsPanel.tsx
// Cole em src/components/GeminiSettingsPanel.tsx (mesma pasta do modal de configurações)
// ============================================================

import React, { useState } from 'react';
import { Check, Loader2, Trash2 } from 'lucide-react';
import { GeminiLogo } from './GeminiLogo';
import {
  DEFAULT_GEMINI_MODEL,
  GEMINI_MODEL_SUGGESTIONS,
  getGeminiConfig,
  saveGeminiConfig,
  testGeminiConnection,
} from '../lib/gemini';

export const GeminiSettingsPanel: React.FC = () => {
  const initial = getGeminiConfig();
  const [apiKey, setApiKey] = useState(initial.apiKey);
  const [model, setModel] = useState(initial.model);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveGeminiConfig(apiKey, model || DEFAULT_GEMINI_MODEL);
    setSaved(true);
    setStatus({ kind: 'ok', text: 'Configuração salva neste navegador.' });
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    setStatus(null);
    try {
      await testGeminiConnection({
        apiKey: apiKey.trim(),
        model: model.trim() || DEFAULT_GEMINI_MODEL,
      });
      setStatus({ kind: 'ok', text: `Conexão OK com ${model.trim() || DEFAULT_GEMINI_MODEL}.` });
    } catch (err) {
      setStatus({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Falha ao testar a conexão.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClear = () => {
    saveGeminiConfig('', '');
    setApiKey('');
    setModel(DEFAULT_GEMINI_MODEL);
    setStatus({ kind: 'ok', text: 'Chave removida deste navegador.' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <GeminiLogo className="w-5 h-5" />
        <h3 className="text-sm font-semibold text-zinc-900">Gemini AI</h3>
      </div>

      <p className="text-[11px] text-zinc-500">
        Usado pelo botão flutuante para criar e editar tasks por texto ou voz. A chave fica salva
        somente neste navegador e não faz parte do código do projeto.
      </p>

      <div>
        <label className="block text-xs font-semibold text-zinc-700 mb-1">
          Google AI Studio API Key
        </label>
        <input
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="AIza..."
          className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 font-mono focus:outline-none focus:border-zinc-900"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-zinc-700 mb-1">Modelo</label>
        <input
          type="text"
          list="gemini-model-options"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 font-mono focus:outline-none focus:border-zinc-900"
        />
        <datalist id="gemini-model-options">
          {GEMINI_MODEL_SUGGESTIONS.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <span className="text-[10px] text-zinc-400 mt-0.5 block">
          Pode digitar outro nome de modelo disponível na sua conta.
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold"
        >
          {saved && <Check className="w-3.5 h-3.5" strokeWidth={2} />}
          Salvar
        </button>

        <button
          type="button"
          onClick={handleTest}
          disabled={testing || !apiKey.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 text-xs font-semibold disabled:opacity-40"
        >
          {testing && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />}
          Testar conexão
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
          Remover chave
        </button>
      </div>

      {status && (
        <div
          className={`p-3 rounded-lg text-xs border ${
            status.kind === 'ok'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
              : 'bg-rose-50 text-rose-700 border-rose-200/80'
          }`}
        >
          {status.text}
        </div>
      )}
    </div>
  );
};
