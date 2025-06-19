
import React from 'react';
import { Recipe, FoodCost } from '../types';
import { PencilSquareIcon, TrashIcon, EyeIcon, CurrencyEuroIcon } from './icons';

interface RecipeCardProps {
  recipe: Recipe;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  foodCost: FoodCost;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onView, onEdit, onDelete, foodCost }) => {
  const defaultImageUrl = `https://picsum.photos/400/300?random=${recipe.id}`;
  const hasWarnings = foodCost.warnings && foodCost.warnings.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 ease-in-out flex flex-col">
      <img 
        className="w-full h-48 object-cover" 
        src={recipe.imageUrl || defaultImageUrl} 
        alt={recipe.name} 
        onError={(e) => (e.currentTarget.src = defaultImageUrl)}
      />
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-2xl font-semibold text-slate-800 mb-2">{recipe.name}</h3>
        <p className="text-sm text-slate-600 mb-1">Porzioni: {recipe.portions}</p>
        <div className={`mt-2 mb-1 flex items-center ${hasWarnings ? 'text-orange-600' : 'text-slate-700'}`}>
            <CurrencyEuroIcon className={`w-5 h-5 mr-1 ${hasWarnings ? 'text-orange-500' : 'text-amber-600'}`}/>
            <p className="text-sm">Costo Totale: <span className="font-semibold">{foodCost.totalCost.toFixed(2)} €</span></p>
        </div>
        <div className={`mb-4 flex items-center ${hasWarnings ? 'text-orange-600' : 'text-slate-700'}`}>
             <CurrencyEuroIcon className={`w-5 h-5 mr-1 ${hasWarnings ? 'text-orange-500' : 'text-amber-600'}`}/>
            <p className="text-sm">Costo/Porzione: <span className="font-semibold">{foodCost.costPerPortion.toFixed(2)} €</span></p>
        </div>
        {hasWarnings && (
            <p className="text-xs text-orange-500 mb-2">Costo potenzialmente inaccurato (vedi dettagli)</p>
        )}
        
        <div className="mt-auto pt-4 flex justify-end space-x-2 border-t border-slate-200">
          <button
            onClick={() => onView(recipe.id)}
            className="p-2 text-sky-600 hover:text-sky-800 rounded-full hover:bg-sky-100 transition-colors"
            title="Visualizza Dettagli"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => onEdit(recipe.id)}
            className="p-2 text-amber-600 hover:text-amber-800 rounded-full hover:bg-amber-100 transition-colors"
            title="Modifica Ricetta"
          >
            <PencilSquareIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(recipe.id)}
            className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100 transition-colors"
            title="Elimina Ricetta"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
