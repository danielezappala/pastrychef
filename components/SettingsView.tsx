
import React from 'react';
import { CostCalculationStrategy } from '../types';
import { ArrowLeftIcon } from './icons';

interface SettingsViewProps {
  currentStrategy: CostCalculationStrategy;
  onStrategyChange: (strategy: CostCalculationStrategy) => void;
  onNavigateBack: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ currentStrategy, onStrategyChange, onNavigateBack }) => {
  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 bg-white shadow-xl rounded-lg">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <h2 className="text-3xl font-bold text-slate-800">Impostazioni</h2>
        <button
            onClick={onNavigateBack}
            className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            title="Torna indietro"
        >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Indietro
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="costStrategy" className="block text-sm font-medium text-slate-700 mb-1">
            Metodo di Calcolo del Costo delle Materie Prime
          </label>
          <select
            id="costStrategy"
            name="costStrategy"
            value={currentStrategy}
            onChange={(e) => onStrategyChange(e.target.value as CostCalculationStrategy)}
            className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="cheapest">Usa il prezzo più basso registrato</option>
            <option value="latest">Usa il prezzo più recente registrato</option>
            <option value="average">Usa il prezzo medio registrato</option>
          </select>
          <p className="mt-2 text-xs text-slate-500">
            Questa impostazione determina come viene selezionato il costo di acquisto di una materia prima quando si calcola il food cost di una ricetta.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
