import React, { useState, useEffect } from 'react';
import { MasterIngredient, IngredientPricePoint, IngredientPricePointFormState } from '../types';
import { PlusIcon, PencilSquareIcon, TrashIcon, ArrowLeftIcon, CheckCircleIcon, XCircleIcon, EyeIcon, CurrencyEuroIcon, DocumentDuplicateIcon } from './icons';
import { pseudoUuid } from '../App';
import Modal from './Modal';
import { SUPPORTED_UNITS, UnitDefinition, ABSOLUTE_BASE_UNITS, UNIT_CATEGORIES } from '../utils/conversionUtils';

interface MasterIngredientManagerProps {
  masterIngredients: MasterIngredient[];
  ingredientPricePoints: IngredientPricePoint[];
  onAddMasterIngredient: (ingredient: MasterIngredient) => void;
  onUpdateMasterIngredient: (ingredient: MasterIngredient) => void;
  onDeleteMasterIngredient: (id: string) => void; // This will also delete its price points from App.tsx
  onAddPricePoint: (pricePoint: IngredientPricePoint) => void;
  onUpdatePricePoint: (pricePoint: IngredientPricePoint) => void;
  onDeletePricePoint: (id: string) => void;
  onNavigateBack: () => void;
}

interface MasterIngredientFormState extends Partial<Omit<MasterIngredient, 'id'>> {}

// Defines which units can be selected as the "baseUnit" for a MasterIngredient.
// These should correspond to the absolute base units of our supported categories.
const SELECTABLE_BASE_UNITS: UnitDefinition[] = SUPPORTED_UNITS.filter(u => 
    (u.category === UNIT_CATEGORIES.WEIGHT && u.abbreviation === ABSOLUTE_BASE_UNITS.weight) ||
    (u.category === UNIT_CATEGORIES.VOLUME && u.abbreviation === ABSOLUTE_BASE_UNITS.volume) ||
    (u.category === UNIT_CATEGORIES.PIECES && u.abbreviation === ABSOLUTE_BASE_UNITS.pieces)
);


const MasterIngredientManager: React.FC<MasterIngredientManagerProps> = ({
  masterIngredients,
  ingredientPricePoints,
  onAddMasterIngredient,
  onUpdateMasterIngredient,
  onDeleteMasterIngredient,
  onAddPricePoint,
  onUpdatePricePoint,
  onDeletePricePoint,
  onNavigateBack
}) => {
  const [isMIFormVisible, setIsMIFormVisible] = useState(false);
  const [editingMI, setEditingMI] = useState<MasterIngredient | null>(null);
  const [miFormState, setMiFormState] = useState<MasterIngredientFormState>({});

  const [isPPFormVisible, setIsPPFormVisible] = useState(false);
  const [editingPP, setEditingPP] = useState<IngredientPricePoint | null>(null);
  const [ppFormState, setPpFormState] = useState<IngredientPricePointFormState>({});
  const [currentMasterIngredientForPP, setCurrentMasterIngredientForPP] = useState<MasterIngredient | null>(null);
  
  const [showDeleteMIModal, setShowDeleteMIModal] = useState(false);
  const [miIdToDelete, setMiIdToDelete] = useState<string | null>(null);
  const [showDeletePPModal, setShowDeletePPModal] = useState(false);
  const [ppIdToDelete, setPpIdToDelete] = useState<string | null>(null);

  const uniqueCategories = Array.from(new Set(masterIngredients.map(mi => mi.category).filter(c => typeof c === 'string' && c.trim() !== ''))).sort() as string[];


  useEffect(() => {
    if (editingMI) {
      setMiFormState(editingMI);
      setIsMIFormVisible(true);
    } else {
      setMiFormState({ name: '', baseUnit: '', category: '' });
    }
  }, [editingMI]);

  useEffect(() => {
    if (editingPP && currentMasterIngredientForPP) {
      setPpFormState({
        ...editingPP,
        purchaseQuantityInBaseUnits: editingPP.purchaseQuantityInBaseUnits?.toString() ?? '',
        purchaseCost: editingPP.purchaseCost?.toString() ?? '',
      });
      setIsPPFormVisible(true);
    } else {
      setPpFormState({ supplierNotes: '', purchaseQuantityInBaseUnits: '', purchaseCost: '' });
    }
  }, [editingPP, currentMasterIngredientForPP]);

  // Master Ingredient (MI) Handlers
  const handleMIInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMiFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleMISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!miFormState.name || !miFormState.baseUnit) {
      alert("Nome e Unità Base sono obbligatori per la materia prima.");
      return;
    }
    const miData: MasterIngredient = {
      id: editingMI?.id || pseudoUuid(),
      name: miFormState.name!,
      baseUnit: miFormState.baseUnit!,
      category: miFormState.category || '', // Ensure category is a string
    };
    if (editingMI?.id) {
      onUpdateMasterIngredient(miData);
    } else {
      onAddMasterIngredient(miData);
    }
    setEditingMI(null);
    setIsMIFormVisible(false);
  };

  const handleAddNewMI = () => {
    setEditingMI(null);
    setMiFormState({ name: '', baseUnit: '', category: '' });
    setIsMIFormVisible(true);
    setCurrentMasterIngredientForPP(null); // Close PP view if open
    setIsPPFormVisible(false);
  };

  const handleEditMI = (mi: MasterIngredient) => {
    setEditingMI(mi);
    setCurrentMasterIngredientForPP(null); // Close PP view if open
    setIsPPFormVisible(false);
  };

  const requestDeleteMI = (id: string) => {
    setMiIdToDelete(id);
    setShowDeleteMIModal(true);
  };

  const confirmDeleteMI = () => {
    if (miIdToDelete) {
      onDeleteMasterIngredient(miIdToDelete); 
      if(currentMasterIngredientForPP?.id === miIdToDelete) {
        setCurrentMasterIngredientForPP(null);
        setIsPPFormVisible(false);
      }
    }
    setMiIdToDelete(null);
    setShowDeleteMIModal(false);
  };
  
  const handleCancelMIForm = () => {
    setEditingMI(null);
    setIsMIFormVisible(false);
  }

  // Ingredient Price Point (PP) Handlers
  const handlePPInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPpFormState(prev => ({ ...prev, [name]: value }));
  };

  const handlePPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMasterIngredientForPP) return;

    if (!ppFormState.supplierNotes || !ppFormState.purchaseQuantityInBaseUnits || !ppFormState.purchaseCost) {
      alert("Tutti i campi del punto prezzo sono obbligatori.");
      return;
    }
    const quantity = parseFloat(ppFormState.purchaseQuantityInBaseUnits.toString());
    const cost = parseFloat(ppFormState.purchaseCost.toString());

    if (isNaN(quantity) || quantity <= 0 || isNaN(cost) || cost <= 0) {
      alert("Quantità e Costo d'Acquisto devono essere numeri positivi.");
      return;
    }
    
    const ppData: IngredientPricePoint = {
      id: editingPP?.id || pseudoUuid(),
      masterIngredientId: currentMasterIngredientForPP.id,
      supplierNotes: ppFormState.supplierNotes!,
      purchaseQuantityInBaseUnits: quantity,
      purchaseCost: cost,
      costPerBaseUnit: cost / quantity,
      dateRecorded: editingPP?.dateRecorded || new Date().toISOString(), 
    };

    if (editingPP?.id) {
      onUpdatePricePoint({...ppData, dateRecorded: new Date().toISOString()}); 
    } else {
      onAddPricePoint(ppData);
    }
    setEditingPP(null);
    setIsPPFormVisible(false);
  };

  const handleManagePricePoints = (mi: MasterIngredient) => {
    setCurrentMasterIngredientForPP(mi);
    setEditingPP(null); 
    setPpFormState({ supplierNotes: '', purchaseQuantityInBaseUnits: '', purchaseCost: '' });
    setIsPPFormVisible(false); 
    setIsMIFormVisible(false); 
  };
  
  const handleAddNewPP = () => {
    if (!currentMasterIngredientForPP) return;
    setEditingPP(null);
    setPpFormState({ supplierNotes: '', purchaseQuantityInBaseUnits: '', purchaseCost: '' });
    setIsPPFormVisible(true);
  };

  const handleEditPP = (pp: IngredientPricePoint) => {
    setEditingPP(pp);
  };
  
  const handleDuplicatePP = (ppToDuplicate: IngredientPricePoint) => {
    if (!currentMasterIngredientForPP) return;

    const duplicatedPP: IngredientPricePoint = {
      ...ppToDuplicate,
      id: pseudoUuid(),
      dateRecorded: new Date().toISOString(),
      supplierNotes: `${ppToDuplicate.supplierNotes} (Copia)`,
    };
    onAddPricePoint(duplicatedPP);
  };

  const requestDeletePP = (id: string) => {
    setPpIdToDelete(id);
    setShowDeletePPModal(true);
  };

  const confirmDeletePP = () => {
    if (ppIdToDelete) {
      onDeletePricePoint(ppIdToDelete);
    }
    setPpIdToDelete(null);
    setShowDeletePPModal(false);
  };

  const handleCancelPPForm = () => {
    setEditingPP(null);
    setIsPPFormVisible(false);
  }

  const getPricePointsForMaster = (masterId: string) => {
    return ingredientPricePoints.filter(pp => pp.masterIngredientId === masterId)
                                .sort((a,b) => new Date(b.dateRecorded).getTime() - new Date(a.dateRecorded).getTime());
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Gestione Materie Prime e Prezzi</h1>
        {!isMIFormVisible && !currentMasterIngredientForPP && (
          <button
            onClick={handleAddNewMI}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <PlusIcon className="w-5 h-5 mr-2" /> Aggiungi Materia Prima
          </button>
        )}
      </div>

      {isMIFormVisible && (
        <form onSubmit={handleMISubmit} className="mb-8 p-6 bg-white shadow-xl rounded-lg space-y-4 border border-amber-300">
          <h2 className="text-2xl font-semibold text-slate-700">{editingMI?.id ? 'Modifica' : 'Nuova'} Materia Prima</h2>
          <div>
            <label htmlFor="mi-name" className="block text-sm font-medium text-slate-700">Nome Materia Prima</label>
            <input type="text" name="name" id="mi-name" value={miFormState.name || ''} onChange={handleMIInputChange} required className="mt-1 block w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500" placeholder="Es. Cioccolato Fondente 70%" />
          </div>
          <div>
            <label htmlFor="mi-baseUnit" className="block text-sm font-medium text-slate-700">Unità Base (per ricette e calcoli)</label>
            <select
              name="baseUnit"
              id="mi-baseUnit"
              value={miFormState.baseUnit || ''}
              onChange={handleMIInputChange}
              required
              className="mt-1 block w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="" disabled>Seleziona unità base...</option>
              {SELECTABLE_BASE_UNITS.map(unit => (
                <option key={unit.abbreviation} value={unit.abbreviation}>{unit.name} ({unit.abbreviation})</option>
              ))}
            </select>
             <p className="mt-1 text-xs text-slate-500">Questa è l'unità fondamentale per i calcoli di costo e inventario.</p>
          </div>
          <div>
            <label htmlFor="mi-category" className="block text-sm font-medium text-slate-700">Categoria (Opzionale)</label>
            <input 
              type="text" 
              name="category" 
              id="mi-category" 
              value={miFormState.category || ''} 
              onChange={handleMIInputChange} 
              list="category-suggestions"
              className="mt-1 block w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500" 
              placeholder="Es. Cioccolati, Farine" 
            />
            <datalist id="category-suggestions">
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
            <p className="mt-1 text-xs text-slate-500">Seleziona o digita una categoria.</p>
          </div>
          <div className="flex justify-end space-x-3 pt-3">
            <button type="button" onClick={handleCancelMIForm} className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"><XCircleIcon className="w-5 h-5 mr-2"/>Annulla</button>
            <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"><CheckCircleIcon className="w-5 h-5 mr-2"/>{editingMI?.id ? 'Salva Modifiche' : 'Crea Materia Prima'}</button>
          </div>
        </form>
      )}

      {currentMasterIngredientForPP && isPPFormVisible && (
        <form onSubmit={handlePPSubmit} className="my-8 p-6 bg-white shadow-xl rounded-lg space-y-4 border border-sky-300">
          <h2 className="text-2xl font-semibold text-slate-700">{editingPP?.id ? 'Modifica' : 'Nuovo'} Punto Prezzo per: <span className="text-sky-600">{currentMasterIngredientForPP.name}</span></h2>
          <p className="text-sm text-slate-500">Unità Base per questa materia prima: <strong>{currentMasterIngredientForPP.baseUnit}</strong>. Inserisci la quantità acquistata in questa unità.</p>
          <div>
            <label htmlFor="pp-supplierNotes" className="block text-sm font-medium text-slate-700">Descrizione Fornitore/Acquisto</label>
            <input type="text" name="supplierNotes" id="pp-supplierNotes" value={ppFormState.supplierNotes || ''} onChange={handlePPInputChange} required className="mt-1 block w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500" placeholder="Es. Fornitore X - Sacco 25kg, Supermercato Y - Offerta" />
          </div>
          <div>
            <label htmlFor="pp-purchaseQuantity" className="block text-sm font-medium text-slate-700">Quantità Acquistata (in {currentMasterIngredientForPP.baseUnit})</label>
            <input type="number" name="purchaseQuantityInBaseUnits" id="pp-purchaseQuantity" value={ppFormState.purchaseQuantityInBaseUnits || ''} onChange={handlePPInputChange} required min="0.000001" step="any" className="mt-1 block w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500" placeholder={`Es. 25000 (per 25kg se unità base è 'g')`} />
          </div>
          <div>
            <label htmlFor="pp-purchaseCost" className="block text-sm font-medium text-slate-700">Costo Totale Acquisto (€)</label>
            <input type="number" name="purchaseCost" id="pp-purchaseCost" value={ppFormState.purchaseCost || ''} onChange={handlePPInputChange} required min="0.01" step="any" className="mt-1 block w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500" placeholder="Es. 50.00" />
          </div>
          <div className="flex justify-end space-x-3 pt-3">
            <button type="button" onClick={handleCancelPPForm} className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"><XCircleIcon className="w-5 h-5 mr-2"/>Annulla</button>
            <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700"><CheckCircleIcon className="w-5 h-5 mr-2"/>{editingPP?.id ? 'Salva Modifiche Prezzo' : 'Aggiungi Prezzo'}</button>
          </div>
        </form>
      )}
      
      {!isMIFormVisible && (
        currentMasterIngredientForPP ? (
          <div className="mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div>
                    <button onClick={() => { setCurrentMasterIngredientForPP(null); setIsPPFormVisible(false);}} className="inline-flex items-center text-sm text-amber-700 hover:text-amber-900 mb-2 sm:mb-0">
                        <ArrowLeftIcon className="w-4 h-4 mr-1" /> Torna alle Materie Prime
                    </button>
                    <h2 className="text-2xl font-semibold text-slate-700">Punti Prezzo per: <span className="text-sky-700">{currentMasterIngredientForPP.name}</span> ({currentMasterIngredientForPP.baseUnit})</h2>
                </div>
                {!isPPFormVisible && (
                    <button onClick={handleAddNewPP} className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700">
                        <PlusIcon className="w-5 h-5 mr-2" /> Aggiungi Punto Prezzo
                    </button>
                )}
            </div>
            {getPricePointsForMaster(currentMasterIngredientForPP.id).length === 0 && !isPPFormVisible ? (
              <p className="text-center text-slate-500 py-8">Nessun punto prezzo definito per questa materia prima. Aggiungine uno.</p>
            ) : !isPPFormVisible && (
              <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Descrizione Acquisto/Fornitore</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quantità Acq.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Costo Acq. (€)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Costo / {currentMasterIngredientForPP.baseUnit} (€)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Registrato il</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {getPricePointsForMaster(currentMasterIngredientForPP.id).map(pp => (
                      <tr key={pp.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 whitespace-normal text-sm font-medium text-slate-800">{pp.supplierNotes}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{pp.purchaseQuantityInBaseUnits.toLocaleString()} {currentMasterIngredientForPP.baseUnit}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{pp.purchaseCost.toFixed(2)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-sky-700">{pp.costPerBaseUnit.toFixed(Math.max(4, (pp.costPerBaseUnit.toString().split('.')[1] || '').length))}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{new Date(pp.dateRecorded).toLocaleDateString()}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-1">
                          <button onClick={() => handleEditPP(pp)} className="p-1 text-amber-600 hover:text-amber-800 rounded-full hover:bg-amber-100" title="Modifica Prezzo"><PencilSquareIcon className="w-5 h-5" /></button>
                          <button onClick={() => handleDuplicatePP(pp)} className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100" title="Duplica Prezzo"><DocumentDuplicateIcon className="w-5 h-5" /></button>
                          <button onClick={() => requestDeletePP(pp.id)} className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100" title="Elimina Prezzo"><TrashIcon className="w-5 h-5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          masterIngredients.length === 0 && !isMIFormVisible ? (
            <p className="text-center text-slate-500 text-xl py-10">Nessuna materia prima definita. Inizia aggiungendone una!</p>
          ) : !isMIFormVisible && (
            <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nome Materia Prima</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Unità Base</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Punti Prezzo</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Azioni</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {masterIngredients.map(mi => (
                    <tr key={mi.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{mi.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{mi.baseUnit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{mi.category || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <button onClick={() => handleManagePricePoints(mi)} className="inline-flex items-center text-sky-600 hover:text-sky-800 text-sm font-medium" title="Gestisci Punti Prezzo">
                            <CurrencyEuroIcon className="w-4 h-4 mr-1"/> Vedi/Gestisci ({getPricePointsForMaster(mi.id).length})
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button onClick={() => handleEditMI(mi)} className="p-1 text-amber-600 hover:text-amber-800 rounded-full hover:bg-amber-100" title="Modifica Materia Prima"><PencilSquareIcon className="w-5 h-5" /></button>
                        <button onClick={() => requestDeleteMI(mi.id)} className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100" title="Elimina Materia Prima"><TrashIcon className="w-5 h-5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )
      )}
      
      {!isMIFormVisible && !currentMasterIngredientForPP && (
         <button onClick={onNavigateBack} className="mt-8 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-amber-700 bg-amber-100 hover:bg-amber-200">
            <ArrowLeftIcon className="w-5 h-5 mr-2" /> Torna alle Ricette
        </button>
      )}

      <Modal
        isOpen={showDeleteMIModal}
        onClose={() => setShowDeleteMIModal(false)}
        onConfirm={confirmDeleteMI}
        title="Conferma Eliminazione Materia Prima"
      >
        Sei sicuro di voler eliminare la materia prima "<strong>{masterIngredients.find(mi => mi.id === miIdToDelete)?.name || ''}</strong>"? <br/>
        Questa azione eliminerà anche tutti i suoi punti prezzo associati. L'azione è irreversibile e potrebbe rendere inaccurati i costi delle ricette che la usano o rimuovere ingredienti dalle ricette.
      </Modal>
      <Modal
        isOpen={showDeletePPModal}
        onClose={() => setShowDeletePPModal(false)}
        onConfirm={confirmDeletePP}
        title="Conferma Eliminazione Punto Prezzo"
      >
        Sei sicuro di voler eliminare questo punto prezzo ("<strong>{ingredientPricePoints.find(pp => pp.id === ppIdToDelete)?.supplierNotes || ''}</strong>")? <br/>L'azione è irreversibile.
      </Modal>

    </div>
  );
};

export default MasterIngredientManager;