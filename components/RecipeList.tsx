
import React from 'react';
import { Recipe, FoodCost } from '../types';
import RecipeCard from './RecipeCard';

interface RecipeListProps {
  recipes: Recipe[];
  onViewRecipe: (id: string) => void;
  onEditRecipe: (id: string) => void;
  onDeleteRecipe: (id: string) => void;
  calculateFoodCost: (recipe: Recipe) => FoodCost;
}

const RecipeList: React.FC<RecipeListProps> = ({ recipes, onViewRecipe, onEditRecipe, onDeleteRecipe, calculateFoodCost }) => {
  if (recipes.length === 0) {
    return <p className="text-center text-slate-500 text-xl py-10">Nessuna ricetta trovata. Inizia aggiungendone una!</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8">
      {recipes.map(recipe => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onView={onViewRecipe}
          onEdit={onEditRecipe}
          onDelete={onDeleteRecipe}
          foodCost={calculateFoodCost(recipe)}
        />
      ))}
    </div>
  );
};

export default RecipeList;
