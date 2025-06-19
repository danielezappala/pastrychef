
import React, { useState, useEffect } from 'react';
import { RecipeIngredient, MasterIngredient } from '../types';
import { TrashIcon } from './icons';
import { UnitDefinition, getCompatibleUnitsForMasterIngredient, convertDisplayToRecipeBase, getUnitDefinition } from '../utils/conversionUtils';

interface IngredientSelectorRowProps {
  ingredient: RecipeIngredient;
  index: number;
  onIngredientChange: (index: number, field: keyof RecipeIngredient | 'displayQuantity' | 'displayUnit' | 'narrativeUnitLabel', value: string | number | undefined) => void;
  onRemoveIngredient: (index: number) => void;
  masterIngredients: MasterIngredient[];
  isOnlyIngredient: boolean; 
}

const IngredientSelectorRow: React.FC<IngredientSelectorRowProps> = ({
  ingredient,
  index,
  onIngredientChange,
  onRemoveIngredient,
  masterIngredients,
  isOnlyIngredient
}) => {
  const [displayUnitOptions, setDisplayUnitOptions] = useState<UnitDefinition[]>([]);
  const [localDisplayQuantityStr, setLocalDisplayQuantityStr] = useState<string>(
    () => (ingredient.displayQuantity === undefined ? '' : String(ingredient.displayQuantity))
  );
  
  const selectedMasterIngredient = masterIngredients.find(mi => mi.id === ingredient.masterIngredientId);
  const baseUnitLabel = selectedMasterIngredient ? selectedMasterIngredient.baseUnit : 'unità base';

  useEffect(() => {
    const propValueStr = ingredient.displayQuantity === undefined ? '' : String(ingredient.displayQuantity);
    
    // Convert localDisplayQuantityStr to a number for comparison, if possible
    let localNumericValue: number | undefined;
    const sanitizedLocal = localDisplayQuantityStr.replace(',', '.').trim();
    if (sanitizedLocal !== '') {
        const parsed = parseFloat(sanitizedLocal);
        if (!isNaN(parsed) && /^\d*\.?\d*$/.test(sanitizedLocal)) { // check if it's a simple number string
            localNumericValue = parsed;
        }
    }
    
    // Only update local string if the effective numeric value of the prop has changed
    // and it's different from what local string currently represents numerically.
    // This prevents wiping "1." when prop becomes 1.
    if (ingredient.displayQuantity !== localNumericValue) {
        setLocalDisplayQuantityStr(propValueStr);
    }

  }, [ingredient.displayQuantity]);


  useEffect(() => {
    if (selectedMasterIngredient) {
      const compatibleUnits = getCompatibleUnitsForMasterIngredient(selectedMasterIngredient.baseUnit);
      setDisplayUnitOptions(compatibleUnits);
      // If the current displayUnit is no longer compatible (e.g. master ingredient changed category),
      // or if displayUnit is empty, try to set it to the base unit of the new master ingredient.
      if (!ingredient.displayUnit || !compatibleUnits.find(u => u.abbreviation === ingredient.displayUnit)) {
         // This logic is now primarily handled in RecipeForm when masterIngredientId changes.
         // Here, we just ensure options are updated.
      }
    } else {
      setDisplayUnitOptions([]);
    }
  }, [selectedMasterIngredient, ingredient.displayUnit]); // Added ingredient.displayUnit to dependencies

  const handleMasterIngredientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMasterIngredientId = e.target.value;
    onIngredientChange(index, 'masterIngredientId', newMasterIngredientId);
  };
  
  const handleDisplayQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentInputStr = e.target.value;
    setLocalDisplayQuantityStr(currentInputStr); 

    let parsedNumericValue: number | undefined = undefined;
    const sanitizedInputStr = currentInputStr.replace(',', '.');

    if (sanitizedInputStr.trim() === '') {
        parsedNumericValue = undefined;
    } else {
        const validNumericPattern = /^\d*\.?\d*$/; 
        if (validNumericPattern.test(sanitizedInputStr)) {
            const parsed = parseFloat(sanitizedInputStr);
            if (!isNaN(parsed) && parsed >= 0) {
                parsedNumericValue = parsed;
            }
        }
    }

    // Only call onIngredientChange if the parsed numeric value is different from the prop's displayQuantity
    // or if the input was cleared and the prop had a value.
    if ( (sanitizedInputStr.trim() === '' && ingredient.displayQuantity !== undefined) ||
         (parsedNumericValue !== undefined && parsedNumericValue !== ingredient.displayQuantity) ||
         (parsedNumericValue === undefined && sanitizedInputStr.trim() !== '' && ingredient.displayQuantity !== undefined) // Case where input is invalid text but prop was a number
        ) {
      onIngredientChange(index, 'displayQuantity', parsedNumericValue);
    }
  };
  
  const handleDisplayUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDisplayUnitAbbr = e.target.value;
    // RecipeForm will handle updating narrativeUnitLabel and quantity
    onIngredientChange(index, 'displayUnit', newDisplayUnitAbbr);
  };

  const handleNarrativeUnitLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onIngredientChange(index, 'narrativeUnitLabel', e.target.value);
  };
  
  const calculatedQuantityForDisplay = (ingredient.quantity === 0 && ingredient.displayQuantity === undefined && localDisplayQuantityStr === '') 
    ? '' 
    : (typeof ingredient.quantity === 'number' && !isNaN(ingredient.quantity) 
        ? ingredient.quantity.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 3}) 
        : 'Errore');


  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-x-3 gap-y-3 items-end mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200 relative shadow-sm">
      {/* Row 1: Master Ingredient and Narrative Label */}
      <div className="md:col-span-6">
        <label htmlFor={`ingredient-master-${index}`} className="block text-sm font-medium text-slate-700 mb-1">
          Materia Prima <span className="text-red-500">*</span>
        </label>
        <select
          id={`ingredient-master-${index}`}
          name="masterIngredientId"
          value={ingredient.masterIngredientId}
          onChange={handleMasterIngredientChange}
          className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
          required
          aria-required="true"
        >
          <option value="" disabled>Seleziona materia prima...</option>
          {masterIngredients.map(mi => (
            <option key={mi.id} value={mi.id}>
              {mi.name} {mi.category ? `(${mi.category})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-6">
        <label htmlFor={`ingredient-narrative-unit-${index}`} className="block text-sm font-medium text-slate-700 mb-1">
          Etichetta Descrittiva (Opz.)
        </label>
        <input
          type="text"
          id={`ingredient-narrative-unit-${index}`}
          name="narrativeUnitLabel"
          value={ingredient.narrativeUnitLabel || ''}
          onChange={handleNarrativeUnitLabelChange}
          className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
          placeholder="Es. un cucchiaio, q.b."
          disabled={!selectedMasterIngredient}
          aria-label="Etichetta descrittiva per l'unità"
        />
      </div>
      
      {/* Row 2: Display Quantity, Display Unit, Calculated Quantity, Remove Button */}
      <div className="md:col-span-3">
        <label htmlFor={`ingredient-display-quantity-${index}`} className="block text-sm font-medium text-slate-700 mb-1">
          Qtà Misurata <span className="text-red-500">*</span>
        </label>
        <input
          type="text" 
          inputMode="decimal" 
          id={`ingredient-display-quantity-${index}`}
          name="displayQuantity"
          value={localDisplayQuantityStr} 
          onChange={handleDisplayQuantityChange}
          className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
          placeholder="Es. 2"
          disabled={!selectedMasterIngredient}
          aria-label="Quantità misurata"
          required={!!selectedMasterIngredient} 
        />
      </div>

      <div className="md:col-span-4"> {/* Increased span for display unit */}
        <label htmlFor={`ingredient-display-unit-${index}`} className="block text-sm font-medium text-slate-700 mb-1">
          Unità Misurata <span className="text-red-500">*</span>
        </label>
        <select
          id={`ingredient-display-unit-${index}`}
          name="displayUnit"
          value={ingredient.displayUnit || ''}
          onChange={handleDisplayUnitChange}
          className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
          disabled={!selectedMasterIngredient || displayUnitOptions.length === 0}
          aria-label="Unità misurata"
          required={!!selectedMasterIngredient}
        >
          <option value="" disabled>Seleziona unità...</option>
          {displayUnitOptions.map(unitDef => (
            <option key={unitDef.abbreviation} value={unitDef.abbreviation}>
              {unitDef.name} ({unitDef.abbreviation})
            </option>
          ))}
        </select>
      </div>
      
      <div className="md:col-span-4"> {/* Increased span for calculated quantity */}
        <label htmlFor={`ingredient-calculated-quantity-${index}`} className="block text-sm font-medium text-slate-700 mb-1">
           Calcolato (in {baseUnitLabel})
        </label>
        <input
          type="text"
          id={`ingredient-calculated-quantity-${index}`}
          value={calculatedQuantityForDisplay}
          readOnly
          className="w-full p-2.5 border border-slate-200 bg-slate-100 rounded-md shadow-sm text-slate-600 sm:text-sm focus:ring-0 focus:border-slate-200"
          aria-label={`Quantità calcolata in ${baseUnitLabel}`}
          tabIndex={-1}
        />
      </div>

      <div className="md:col-span-1 flex items-end justify-center pb-0.5">
        {!isOnlyIngredient && (
          <button
            type="button"
            onClick={() => onRemoveIngredient(index)}
            className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
            title="Rimuovi ingrediente"
            aria-label="Rimuovi ingrediente"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default IngredientSelectorRow;