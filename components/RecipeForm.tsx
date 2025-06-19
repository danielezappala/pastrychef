import React, { useState, useEffect } from 'react';
import { Recipe, RecipeIngredient, MasterIngredient } from '../types';
import IngredientSelectorRow from './IngredientSelectorRow';
import { PlusIcon, ArrowLeftIcon } from './icons';
import { pseudoUuid } from '../App';
import { convertDisplayToRecipeBase, getUnitDefinition } from '../utils/conversionUtils';

interface RecipeFormProps {
  initialData?: Recipe | null;
  onSubmit: (recipe: Recipe) => void;
  onCancel: (recipeIdBeingEdited?: string) => void;
  masterIngredients: MasterIngredient[];
}

const RecipeForm: React.FC<RecipeFormProps> = ({ initialData, onSubmit, onCancel, masterIngredients }) => {
  const [recipe, setRecipe] = useState<Partial<Recipe>>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);


  useEffect(() => {
    if (initialData) {
      const ingredientsWithOptionalFields = initialData.ingredients.map(ing => {
        const masterIng = masterIngredients.find(mi => mi.id === ing.masterIngredientId);
        const displayUnit = ing.displayUnit || masterIng?.baseUnit || '';
        const displayQuantity = ing.displayQuantity !== undefined ? ing.displayQuantity : ing.quantity;
        
        let narrativeLabel = ing.narrativeUnitLabel || '';
        if (!narrativeLabel) {
            const unitDef = getUnitDefinition(displayUnit);
            narrativeLabel = unitDef ? unitDef.name : displayUnit;
        }

        return {
          ...ing,
          displayQuantity: displayQuantity,
          displayUnit: displayUnit,
          narrativeUnitLabel: narrativeLabel,
          quantity: convertDisplayToRecipeBase(displayQuantity, displayUnit, masterIng?.baseUnit || '')
        };
      });
      setRecipe({...initialData, ingredients: ingredientsWithOptionalFields});
    } else {
      setRecipe({
        name: '',
        description: '',
        portions: 1,
        ingredients: [{ id: pseudoUuid(), masterIngredientId: '', quantity: 0, displayQuantity: undefined, displayUnit: '', narrativeUnitLabel: '' }],
        imageUrl: ''
      });
    }
  }, [initialData, masterIngredients]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRecipe(prev => ({ ...prev, [name]: name === 'portions' ? Math.max(1, parseInt(value, 10) || 1) : value }));
  };

  const handleIngredientChange = (index: number, field: keyof RecipeIngredient | 'displayQuantity' | 'displayUnit' | 'narrativeUnitLabel', value: string | number | undefined) => {
    const updatedIngredients = [...(recipe.ingredients || [])];
    
    if (!updatedIngredients[index]) { 
        updatedIngredients[index] = { id: pseudoUuid(), masterIngredientId: '', quantity: 0, displayQuantity: undefined, displayUnit: '', narrativeUnitLabel: '' };
    }

    const ingredientToUpdate = { ...updatedIngredients[index] };
    const selectedMasterIngredient = masterIngredients.find(mi => mi.id === ingredientToUpdate.masterIngredientId);

    if (field === 'masterIngredientId') {
        const newMasterIngredientId = value as string;
        ingredientToUpdate.masterIngredientId = newMasterIngredientId;
        const newMasterIngredient = masterIngredients.find(mi => mi.id === newMasterIngredientId);

        if (newMasterIngredient) {
            const baseUnitDef = getUnitDefinition(newMasterIngredient.baseUnit);
            ingredientToUpdate.displayUnit = newMasterIngredient.baseUnit;
            ingredientToUpdate.narrativeUnitLabel = baseUnitDef ? baseUnitDef.name : newMasterIngredient.baseUnit;
            
            // Recalculate quantity using the current displayQuantity and the new base unit as displayUnit
            ingredientToUpdate.quantity = convertDisplayToRecipeBase(
              ingredientToUpdate.displayQuantity, 
              newMasterIngredient.baseUnit,      
              newMasterIngredient.baseUnit        
            );
        } else {
            ingredientToUpdate.masterIngredientId = '';
            ingredientToUpdate.displayUnit = '';
            ingredientToUpdate.narrativeUnitLabel = '';
            ingredientToUpdate.quantity = 0;
            ingredientToUpdate.displayQuantity = undefined;
        }
    } else if (field === 'displayQuantity') {
        const newDisplayQuantity = value === undefined ? undefined : Number(value);
        ingredientToUpdate.displayQuantity = newDisplayQuantity;
        if (selectedMasterIngredient && ingredientToUpdate.displayUnit) {
            ingredientToUpdate.quantity = convertDisplayToRecipeBase(newDisplayQuantity, ingredientToUpdate.displayUnit, selectedMasterIngredient.baseUnit);
        } else {
            ingredientToUpdate.quantity = 0;
        }
    } else if (field === 'displayUnit') {
        const newDisplayUnitAbbr = value as string;
        const oldDisplayUnitAbbr = ingredientToUpdate.displayUnit;
        
        ingredientToUpdate.displayUnit = newDisplayUnitAbbr;

        // Update narrativeUnitLabel based on the new displayUnit
        const newUnitDef = getUnitDefinition(newDisplayUnitAbbr);
        const oldUnitDef = getUnitDefinition(oldDisplayUnitAbbr || '');
        const currentNarrative = ingredientToUpdate.narrativeUnitLabel;

        if (newUnitDef && (!currentNarrative || currentNarrative === (oldUnitDef ? oldUnitDef.name : oldDisplayUnitAbbr))) {
            ingredientToUpdate.narrativeUnitLabel = newUnitDef.name;
        } else if (!newUnitDef && (!currentNarrative || currentNarrative === oldDisplayUnitAbbr)) {
            ingredientToUpdate.narrativeUnitLabel = newDisplayUnitAbbr;
        }

        // Update quantity based on the new displayUnit
        if (selectedMasterIngredient) {
            ingredientToUpdate.quantity = convertDisplayToRecipeBase(ingredientToUpdate.displayQuantity, newDisplayUnitAbbr, selectedMasterIngredient.baseUnit);
        } else {
            ingredientToUpdate.quantity = 0;
        }
    } else if (field === 'narrativeUnitLabel') {
        ingredientToUpdate.narrativeUnitLabel = value as string;
    } else if (field === 'quantity') { // Should generally not be set directly if displayQuantity/Unit are used
        ingredientToUpdate.quantity = Number(value) || 0;
    }


    updatedIngredients[index] = ingredientToUpdate;
    setRecipe(prev => ({ ...prev, ingredients: updatedIngredients }));
  };

  const addIngredient = () => {
    setRecipe(prev => ({
      ...prev,
      ingredients: [
        ...(prev.ingredients || []),
        { id: pseudoUuid(), masterIngredientId: '', quantity: 0, displayQuantity: undefined, displayUnit: '', narrativeUnitLabel: '' }
      ]
    }));
  };

  const removeIngredient = (index: number) => {
    if (recipe.ingredients && recipe.ingredients.length <= 1) {
      const updatedIngredients = [...(recipe.ingredients || [])];
      updatedIngredients[index] = { id: pseudoUuid(), masterIngredientId: '', quantity: 0, displayQuantity: undefined, displayUnit: '', narrativeUnitLabel: '' };
       setRecipe(prev => ({
        ...prev,
        ingredients: updatedIngredients
      }));
      alert("Una ricetta deve avere almeno un ingrediente. L'ingrediente corrente è stato resettato.");
      return;
    }
    setRecipe(prev => ({
      ...prev,
      ingredients: (prev.ingredients || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]); 
    const errors: string[] = [];

    if (!recipe.name?.trim()) errors.push("Il nome della ricetta è obbligatorio.");
    if (!recipe.description?.trim()) errors.push("La descrizione/preparazione è obbligatoria.");
    if (!recipe.portions || recipe.portions < 1) errors.push("Le porzioni devono essere almeno 1.");
    
    let allIngredientsEffectivelyEmpty = true;
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      allIngredientsEffectivelyEmpty = recipe.ingredients.every(ing => !ing.masterIngredientId && (ing.displayQuantity === undefined || ing.displayQuantity === 0));
    }

    if (!recipe.ingredients || recipe.ingredients.length === 0 || allIngredientsEffectivelyEmpty) {
        errors.push("La ricetta deve contenere almeno un ingrediente valido.");
    } else {
        recipe.ingredients.forEach((ing, idx) => {
            const isRowEmpty = !ing.masterIngredientId && (ing.displayQuantity === undefined || ing.displayQuantity === 0) && !ing.displayUnit && !ing.narrativeUnitLabel;
            
            if (recipe.ingredients!.length > 1 && isRowEmpty) {
              return; 
            }

            if (!ing.masterIngredientId && !isRowEmpty) { // Error if not empty but no master ingredient
                errors.push(`Ingrediente ${idx + 1}: Selezionare una materia prima.`);
            }
            if (ing.masterIngredientId && (ing.displayQuantity === undefined || ing.displayQuantity < 0)) {
                 errors.push(`Ingrediente ${idx + 1} (${masterIngredients.find(mi => mi.id === ing.masterIngredientId)?.name || 'N/A'}): La quantità misurata deve essere specificata e non negativa.`);
            }
            if (ing.masterIngredientId && !ing.displayUnit) {
                 errors.push(`Ingrediente ${idx + 1} (${masterIngredients.find(mi => mi.id === ing.masterIngredientId)?.name || 'N/A'}): Selezionare un'unità misurata.`);
            }
             if (ing.masterIngredientId && (typeof ing.quantity !== 'number' || isNaN(ing.quantity) || ing.quantity < 0)) {
                if (!(ing.displayQuantity === 0 && ing.quantity === 0)) { 
                     errors.push(`Ingrediente ${idx + 1} (${masterIngredients.find(mi => mi.id === ing.masterIngredientId)?.name || 'N/A'}): Errore nel calcolo della quantità base. Controllare i valori (Qtà calcolata: ${ing.quantity}).`);
                }
            }
        });
    }

    if (errors.length > 0) {
        setFormErrors(errors);
        window.scrollTo(0,0); 
        return;
    }
    
    const finalIngredients = recipe.ingredients!.filter(ing => 
      ing.masterIngredientId && ing.displayUnit && (ing.displayQuantity !== undefined || (ing.quantity !== undefined && ing.quantity >=0))
    ).map(ing => ({
        id: ing.id,
        masterIngredientId: ing.masterIngredientId!,
        quantity: typeof ing.quantity === 'number' && !isNaN(ing.quantity) ? ing.quantity : 0,
        displayQuantity: ing.displayQuantity,
        displayUnit: ing.displayUnit || '',
        narrativeUnitLabel: ing.narrativeUnitLabel || '',
      }));

    if (finalIngredients.length === 0) { 
        setFormErrors(["La ricetta deve contenere almeno un ingrediente valido dopo aver rimosso le righe vuote o incompleto."]);
        window.scrollTo(0,0);
        return;
    }

    const finalRecipe: Recipe = {
      id: recipe.id || pseudoUuid(),
      name: recipe.name!,
      description: recipe.description!,
      portions: recipe.portions!,
      ingredients: finalIngredients,
      imageUrl: recipe.imageUrl || '',
    };
    onSubmit(finalRecipe);
  };

  if (!recipe || Object.keys(recipe).length === 0) {
    return <div className="text-center py-10">Caricamento del modulo...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 bg-white shadow-xl rounded-lg">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <h2 className="text-3xl font-bold text-slate-800">
          {initialData?.id ? 'Modifica Ricetta' : 'Crea Nuova Ricetta'}
        </h2>
        <button
            onClick={() => onCancel(initialData?.id)}
            className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            title="Annulla e torna indietro"
        >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Annulla
        </button>
      </div>

      {formErrors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-md">
          <p className="text-sm font-semibold text-red-700 mb-1">Si prega di correggere i seguenti errori:</p>
          <ul className="list-disc list-inside text-xs text-red-600">
            {formErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Nome Ricetta <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="name"
            id="name"
            value={recipe.name || ''}
            onChange={handleChange}
            
            className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
            placeholder="Es. Torta Sacher"
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Descrizione / Preparazione <span className="text-red-500">*</span></label>
          <textarea
            name="description"
            id="description"
            rows={6}
            value={recipe.description || ''}
            onChange={handleChange}
            
            className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
            placeholder="Descrivi i passaggi della preparazione..."
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="portions" className="block text-sm font-medium text-slate-700 mb-1">Porzioni <span className="text-red-500">*</span></label>
          <input
            type="number"
            name="portions"
            id="portions"
            value={recipe.portions || 1}
            onChange={handleChange}
            min="1"
            
            className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-slate-700 mb-1">URL Immagine (Opzionale)</label>
          <input
            type="url"
            name="imageUrl"
            id="imageUrl"
            value={recipe.imageUrl || ''}
            onChange={handleChange}
            className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
            placeholder="https://esempio.com/immagine.jpg"
          />
        </div>

        <div className="pt-2">
          <h3 className="text-xl font-semibold text-slate-700 mb-3">Ingredienti</h3>
          <p className="text-xs text-slate-500 mb-4">
            Per ogni ingrediente, seleziona la materia prima, inserisci la quantità e l'unità che usi per misurare (es. "2 cucchiai", "250 ml").
            Il sistema calcolerà automaticamente la quantità nell'unità base della materia prima (es. grammi, millilitri) per il food cost.
            L'etichetta descrittiva è opzionale e serve per dare un nome più colloquiale all'unità nella visualizzazione della ricetta (es. "un pizzico").
            <span className="text-red-500"> I campi Materia Prima, Qtà Misurata e Unità Misurata sono obbligatori se la riga ingrediente non è completamente vuota.</span>
          </p>
          {(recipe.ingredients || []).map((ing, index) => (
            <IngredientSelectorRow
              key={ing.id || index} 
              ingredient={ing}
              index={index}
              onIngredientChange={handleIngredientChange}
              onRemoveIngredient={removeIngredient}
              masterIngredients={masterIngredients}
              isOnlyIngredient={(recipe.ingredients || []).length === 1}
            />
          ))}
          <button
            type="button"
            onClick={addIngredient}
            className="mt-2 inline-flex items-center px-4 py-2 border border-dashed border-slate-400 text-sm font-medium rounded-md text-slate-700 bg-slate-50 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Aggiungi Ingrediente
          </button>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={() => onCancel(initialData?.id)}
            className="px-6 py-2.5 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            Annulla
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
          >
            {initialData?.id ? 'Salva Modifiche' : 'Crea Ricetta'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecipeForm;