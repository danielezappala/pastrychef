
import React from 'react';
import { Recipe, FoodCost, MasterIngredient, IngredientPricePoint, RecipeIngredient, CostCalculationStrategy } from '../types';
import { ArrowLeftIcon, PencilSquareIcon, TrashIcon, CurrencyEuroIcon } from './icons';

interface RecipeDetailViewProps {
  recipe: Recipe;
  foodCost: FoodCost;
  onBack: () => void;
  onEdit: (id:string) => void;
  onDelete: (id:string) => void;
  masterIngredients: MasterIngredient[];
  ingredientPricePoints: IngredientPricePoint[];
  costCalculationStrategy: CostCalculationStrategy;
}

const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({ recipe, foodCost, onBack, onEdit, onDelete, masterIngredients, ingredientPricePoints, costCalculationStrategy }) => {
  const defaultImageUrl = `https://picsum.photos/800/400?random=${recipe.id}`;

  const getMasterIngredientDetails = (masterId: string) => {
    return masterIngredients.find(mi => mi.id === masterId);
  };

  const getIngredientCostDetails = (recipeIngredient: RecipeIngredient) => {
    const masterIng = getMasterIngredientDetails(recipeIngredient.masterIngredientId);
    if (!masterIng) return { costText: "Materia Prima non trovata", unit: "", displayString: "", source: "" };

    const availablePricePoints = ingredientPricePoints.filter(pp => pp.masterIngredientId === recipeIngredient.masterIngredientId);
    let costText = `Nessun prezzo per ${masterIng.name}`;
    let sourceText = "";
    
    if (availablePricePoints.length > 0) {
      let chosenPricePoint: IngredientPricePoint | undefined;
      let costPerBaseUnitForDisplay: number | undefined;

      switch (costCalculationStrategy) {
        case 'latest':
          chosenPricePoint = availablePricePoints.reduce((latest, current) => 
            new Date(current.dateRecorded) > new Date(latest.dateRecorded) ? current : latest
          );
          sourceText = `dal più recente registrato (${new Date(chosenPricePoint.dateRecorded).toLocaleDateString()})`;
          costPerBaseUnitForDisplay = chosenPricePoint.costPerBaseUnit;
          break;
        case 'average':
          const sumOfCostsPerBaseUnit = availablePricePoints.reduce((sum, current) => sum + current.costPerBaseUnit, 0);
          const averageCostPerBaseUnit = sumOfCostsPerBaseUnit / availablePricePoints.length;
          // For display, we don't have a specific "supplier note" for average, so we create a synthetic one
          chosenPricePoint = { ...availablePricePoints[0], costPerBaseUnit: averageCostPerBaseUnit, supplierNotes: "Media dei prezzi" };
          sourceText = "dalla media dei prezzi registrati";
          costPerBaseUnitForDisplay = averageCostPerBaseUnit;
          break;
        case 'cheapest':
        default:
          chosenPricePoint = availablePricePoints.reduce((cheapest, current) => 
            current.costPerBaseUnit < cheapest.costPerBaseUnit ? current : cheapest
          );
          sourceText = `dal più conveniente ("${chosenPricePoint.supplierNotes}")`;
          costPerBaseUnitForDisplay = chosenPricePoint.costPerBaseUnit;
          break;
      }
      
      if (chosenPricePoint && costPerBaseUnitForDisplay !== undefined) {
        const costForIngredient = recipeIngredient.quantity * costPerBaseUnitForDisplay;
        costText = `${costForIngredient.toFixed(2)} € (@ ${costPerBaseUnitForDisplay.toFixed(Math.max(4, (costPerBaseUnitForDisplay.toString().split('.')[1] || '').length))} €/${masterIng.baseUnit})`;
      }
    }
    
    let displayString = `${recipeIngredient.quantity.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 3})} ${masterIng.baseUnit}`;
    if (recipeIngredient.displayQuantity !== undefined && recipeIngredient.displayUnit) {
      const displayQtyStr = typeof recipeIngredient.displayQuantity === 'number' 
        ? recipeIngredient.displayQuantity.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 3})
        : String(recipeIngredient.displayQuantity);

      displayString = `${displayQtyStr} ${recipeIngredient.narrativeUnitLabel || recipeIngredient.displayUnit}`;
      if (recipeIngredient.narrativeUnitLabel && recipeIngredient.narrativeUnitLabel.toLowerCase() !== (recipeIngredient.displayUnit || '').toLowerCase()) {
         // If narrative label is custom and different from the actual unit, show the conversion for clarity
        displayString += ` (corrisp. a ${recipeIngredient.quantity.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 3})} ${masterIng.baseUnit})`;
      } else if (recipeIngredient.displayUnit !== masterIng.baseUnit || recipeIngredient.displayQuantity !== recipeIngredient.quantity) {
        // Only show "corrisp. a" if display unit is different or quantity was converted
        displayString += ` (corrisp. a ${recipeIngredient.quantity.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 3})} ${masterIng.baseUnit})`;
      }
    }

    return {
      costText,
      unit: masterIng.baseUnit,
      displayString,
      source: sourceText
    };
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <button
                onClick={onBack}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-amber-700 bg-amber-100 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Tutte le Ricette
            </button>
            <div className="flex space-x-3">
                <button
                    onClick={() => onEdit(recipe.id)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                    title="Modifica Ricetta" aria-label="Modifica Ricetta"
                >
                    <PencilSquareIcon className="w-5 h-5 mr-2" /> Modifica
                </button>
                 <button
                    onClick={() => onDelete(recipe.id)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    title="Elimina Ricetta" aria-label="Elimina Ricetta"
                >
                    <TrashIcon className="w-5 h-5 mr-2" /> Elimina
                </button>
            </div>
        </div>

        <img 
            className="w-full h-64 sm:h-80 md:h-96 object-cover" 
            src={recipe.imageUrl || defaultImageUrl} 
            alt={recipe.name}
            onError={(e) => (e.currentTarget.src = defaultImageUrl)}
        />

        <div className="p-6 md:p-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">{recipe.name}</h1>
          <p className="text-slate-600 text-lg mb-2">Porzioni: <span className="font-semibold">{recipe.portions}</span></p>

          <div className="my-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h2 className="text-xl font-semibold text-amber-800 mb-3">Dettaglio Costi</h2>
            <p className="text-xs text-slate-500 mb-2">Strategia di calcolo costo attuale: <span className="font-semibold">
              {costCalculationStrategy === 'cheapest' ? 'Prezzo più basso registrato' :
               costCalculationStrategy === 'latest' ? 'Prezzo più recente registrato' :
               'Media dei prezzi registrati'}
            </span>.</p>
            {foodCost.warnings && foodCost.warnings.length > 0 && (
                <div className="mb-3 p-3 bg-red-100 border border-red-300 rounded-md">
                    <p className="text-sm font-semibold text-red-700 mb-1">Avvisi sul Calcolo Costi:</p>
                    <ul className="list-disc list-inside text-xs text-red-600">
                        {foodCost.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center text-slate-700">
                    <CurrencyEuroIcon className="w-6 h-6 mr-2 text-amber-600 flex-shrink-0"/>
                    <div>
                        <p className="text-sm">Costo Totale Ricetta:</p>
                        <p className="text-2xl font-bold">{foodCost.totalCost.toFixed(2)} €</p>
                    </div>
                </div>
                <div className="flex items-center text-slate-700">
                    <CurrencyEuroIcon className="w-6 h-6 mr-2 text-amber-600 flex-shrink-0"/>
                    <div>
                        <p className="text-sm">Costo per Porzione:</p>
                        <p className="text-2xl font-bold">{foodCost.costPerPortion.toFixed(2)} €</p>
                    </div>
                </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-700 mb-3">Preparazione</h2>
            <div className="prose prose-slate max-w-none whitespace-pre-wrap">
                {recipe.description}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-slate-700 mb-4">Ingredienti</h2>
            {recipe.ingredients.length > 0 ? (
              <ul className="space-y-3">
                {recipe.ingredients.map(ingredient => {
                  const masterIng = getMasterIngredientDetails(ingredient.masterIngredientId);
                  const costDetails = getIngredientCostDetails(ingredient);

                  if (!masterIng) { 
                    return (
                      <li key={ingredient.id} className="p-3 bg-red-50 rounded-md border border-red-200 flex justify-between items-center">
                        <span className="font-medium text-red-700">Materia Prima non trovata (ID: {ingredient.masterIngredientId})</span>
                        <span className="text-sm text-red-500">Quantità: {ingredient.quantity}</span>
                      </li>
                    );
                  }
                  return (
                    <li key={ingredient.id} className="p-3 bg-slate-50 rounded-md border border-slate-200">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                        <div className="flex-grow mb-1 sm:mb-0">
                          <span className="font-medium text-slate-800">{masterIng.name}</span>
                          <span className="text-slate-600 text-sm ml-0 sm:ml-2 block sm:inline">
                             ({costDetails.displayString})
                          </span>
                        </div>
                        <span className="text-sm text-slate-500 mt-1 sm:mt-0 sm:ml-4 sm:text-right flex-shrink-0 whitespace-normal">
                          Costo: {costDetails.costText}
                        </span>
                      </div>
                      {costDetails.source && (
                        <p className="text-xs text-slate-400 mt-1 sm:text-right">Fonte costo: {costDetails.source}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-slate-500">Nessun ingrediente specificato per questa ricetta.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailView;
