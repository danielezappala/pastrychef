
import React, { useState, useEffect, useCallback } from 'react';
import { Recipe, RecipeIngredient, MasterIngredient, FoodCost, IngredientPricePoint, CostCalculationStrategy } from './types';
import RecipeList from './components/RecipeList';
import RecipeDetailView from './components/RecipeDetailView';
import RecipeForm from './components/RecipeForm';
import Modal from './components/Modal';
import MasterIngredientManager from './components/MasterIngredientManager';
import SettingsView from './components/SettingsView'; // Import SettingsView
import { PlusIcon, CakeIcon, ArrowLeftIcon, ArchiveBoxIcon, CogIcon } from './components/icons';
import { convertDisplayToRecipeBase } from './utils/conversionUtils';

export const pseudoUuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const SAMPLE_MASTER_INGREDIENTS: MasterIngredient[] = [
  { id: "mi1", name: "Cioccolato fondente 70%", baseUnit: "g", category: "Cioccolati" },
  { id: "mi2", name: "Uova fresche medie", baseUnit: "pz", category: "Uova" },
  { id: "mi3", name: "Zucchero semolato", baseUnit: "g", category: "Zuccheri" },
  { id: "mi4", name: "Panna fresca liquida 35% m.g.", baseUnit: "ml", category: "Latticini" },
  { id: "mi5", name: "Mascarpone", baseUnit: "g", category: "Latticini" },
  { id: "mi6", name: "Savoiardi", baseUnit: "g", category: "Biscotti" },
  { id: "mi7", name: "Caffè espresso (non zuccherato)", baseUnit: "ml", category: "Bevande" },
  { id: "mi8", name: "Cacao amaro in polvere", baseUnit: "g", category: "Polveri" },
  { id: "mi9", name: "Farina 00", baseUnit: "g", category: "Farine" },
  { id: "mi10", name: "Burro", baseUnit: "g", category: "Latticini" },
];

const SAMPLE_INGREDIENT_PRICE_POINTS: IngredientPricePoint[] = [
  { id: pseudoUuid(), masterIngredientId: "mi1", supplierNotes: "Fornitore A - Blocco 1kg", purchaseQuantityInBaseUnits: 1000, purchaseCost: 22, costPerBaseUnit: 0.022, dateRecorded: new Date(2023, 0, 15).toISOString() },
  { id: pseudoUuid(), masterIngredientId: "mi1", supplierNotes: "Supermercato - Tavoletta 200g", purchaseQuantityInBaseUnits: 200, purchaseCost: 5, costPerBaseUnit: 0.025, dateRecorded: new Date(2023, 2, 10).toISOString() },
  { id: pseudoUuid(), masterIngredientId: "mi1", supplierNotes: "Offerta Online - 500g", purchaseQuantityInBaseUnits: 500, purchaseCost: 9.50, costPerBaseUnit: 0.019, dateRecorded: new Date(2023, 5, 20).toISOString() }, // Più recente e più economico
  { id: pseudoUuid(), masterIngredientId: "mi2", supplierNotes: "Allevatore locale - Confezione da 6", purchaseQuantityInBaseUnits: 6, purchaseCost: 1.80, costPerBaseUnit: 0.30, dateRecorded: new Date(2023, 0, 1).toISOString() },
  { id: pseudoUuid(), masterIngredientId: "mi2", supplierNotes: "Supermercato - Confezione da 10", purchaseQuantityInBaseUnits: 10, purchaseCost: 2.80, costPerBaseUnit: 0.28, dateRecorded: new Date(2023, 4, 5).toISOString() },
  { id: pseudoUuid(), masterIngredientId: "mi3", supplierNotes: "Grossista - Sacco 5kg", purchaseQuantityInBaseUnits: 5000, purchaseCost: 6.50, costPerBaseUnit: 0.0013, dateRecorded: new Date(2022, 11, 1).toISOString() },
  { id: pseudoUuid(), masterIngredientId: "mi3", supplierNotes: "Supermercato - Pacco 1kg", purchaseQuantityInBaseUnits: 1000, purchaseCost: 1.50, costPerBaseUnit: 0.0015, dateRecorded: new Date(2023, 3, 12).toISOString() },
  { id: pseudoUuid(), masterIngredientId: "mi4", supplierNotes: "Centrale del latte - Bottiglia 1L", purchaseQuantityInBaseUnits: 1000, purchaseCost: 3.00, costPerBaseUnit: 0.003, dateRecorded: new Date().toISOString() },
  { id: pseudoUuid(), masterIngredientId: "mi9", supplierNotes: "Mulino - Sacco 25kg", purchaseQuantityInBaseUnits: 25000, purchaseCost: 20.00, costPerBaseUnit: 0.0008, dateRecorded: new Date().toISOString()},
  { id: pseudoUuid(), masterIngredientId: "mi9", supplierNotes: "Supermercato - Pacco 1kg", purchaseQuantityInBaseUnits: 1000, purchaseCost: 1.20, costPerBaseUnit: 0.0012, dateRecorded: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString()}, // più recente
  { id: pseudoUuid(), masterIngredientId: "mi10", supplierNotes: "Caseificio - Panetto 500g", purchaseQuantityInBaseUnits: 500, purchaseCost: 4.50, costPerBaseUnit: 0.009, dateRecorded: new Date().toISOString()},
];

const getInitialData = <T,>(key: string, sampleData: T[]): T[] => {
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return parsed;
    } catch (e) {
      console.error("Failed to parse from localStorage for key:", key, e);
      return sampleData;
    }
  }
  return sampleData;
};

const App: React.FC = () => {
  const [masterIngredients, setMasterIngredients] = useState<MasterIngredient[]>(() => getInitialData('pastryMasterIngredients_v2', SAMPLE_MASTER_INGREDIENTS));
  const [ingredientPricePoints, setIngredientPricePoints] = useState<IngredientPricePoint[]>(() => getInitialData('pastryIngredientPricePoints_v2', SAMPLE_INGREDIENT_PRICE_POINTS));
  
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const savedRecipes = localStorage.getItem('pastryRecipes_v2');
    if (savedRecipes) {
      try {
        const parsedRecipes = JSON.parse(savedRecipes);
         return parsedRecipes.map((recipe: any) => ({
          ...recipe,
          ingredients: recipe.ingredients?.map((ing: any) => {
            const masterIng = masterIngredients.find(mi => mi.id === ing.masterIngredientId);
            const displayUnit = ing.displayUnit || masterIng?.baseUnit || '';
            const displayQuantity = ing.displayQuantity !== undefined ? ing.displayQuantity : ing.quantity;
            const quantity = convertDisplayToRecipeBase(displayQuantity, displayUnit, masterIng?.baseUnit || '');
            return { ...ing, displayUnit, displayQuantity, quantity };
          }) || []
        }));
      } catch (e) { console.error("Error parsing recipes from localStorage, falling back to sample.", e); }
    }
    if (masterIngredients.length > 0) {
        const cioccolato = masterIngredients.find(mi => mi.id === "mi1"); 
        const uova = masterIngredients.find(mi => mi.id === "mi2");       
        const zucchero = masterIngredients.find(mi => mi.id === "mi3");   
        const panna = masterIngredients.find(mi => mi.id === "mi4");      
        if (cioccolato && uova && zucchero && panna) {
            return [{
                id: pseudoUuid(),
                name: "Mousse al Cioccolato Semplice",
                description: "1. Sciogliere il cioccolato...\n2. Montare la panna...\n3. Incorporare delicatamente.",
                portions: 6,
                imageUrl: "https://picsum.photos/400/300?random=101",
                ingredients: [
                  { id: pseudoUuid(), masterIngredientId: cioccolato.id, displayQuantity: 200, displayUnit: cioccolato.baseUnit, quantity: convertDisplayToRecipeBase(200, cioccolato.baseUnit, cioccolato.baseUnit) }, 
                  { id: pseudoUuid(), masterIngredientId: uova.id, displayQuantity: 4, displayUnit: uova.baseUnit, quantity: convertDisplayToRecipeBase(4, uova.baseUnit, uova.baseUnit) },
                  { id: pseudoUuid(), masterIngredientId: zucchero.id, displayQuantity: 80, displayUnit: zucchero.baseUnit, quantity: convertDisplayToRecipeBase(80, zucchero.baseUnit, zucchero.baseUnit) }, 
                  { id: pseudoUuid(), masterIngredientId: panna.id, displayQuantity: 250, displayUnit: panna.baseUnit, quantity: convertDisplayToRecipeBase(250, panna.baseUnit, panna.baseUnit) },
                ],
            }];
        }
    }
    return [];
  });

  type View = 
    | { type: 'list' } 
    | { type: 'detail', recipeId: string } 
    | { type: 'form', recipeIdToEdit?: string } 
    | { type: 'masterIngredients' }
    | { type: 'settings' }; // Added settings view

  const [currentView, setCurrentView] = useState<View>({ type: 'list' });
  const [showDeleteRecipeModal, setShowDeleteRecipeModal] = useState<boolean>(false);
  const [recipeIdToDelete, setRecipeIdToDelete] = useState<string | null>(null);

  const [costCalculationStrategy, setCostCalculationStrategy] = useState<CostCalculationStrategy>(() => {
    const savedStrategy = localStorage.getItem('pastryCostStrategy_v1') as CostCalculationStrategy | null;
    return savedStrategy || 'cheapest';
  });

  useEffect(() => {
    localStorage.setItem('pastryRecipes_v2', JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('pastryMasterIngredients_v2', JSON.stringify(masterIngredients));
  }, [masterIngredients]);

  useEffect(() => {
    localStorage.setItem('pastryIngredientPricePoints_v2', JSON.stringify(ingredientPricePoints));
  }, [ingredientPricePoints]);

  useEffect(() => {
    localStorage.setItem('pastryCostStrategy_v1', costCalculationStrategy);
  }, [costCalculationStrategy]);

  const calculateFoodCost = useCallback((recipe: Recipe): FoodCost => {
    let totalCost = 0;
    const warnings: string[] = [];

    recipe.ingredients.forEach(ing => {
      const masterIng = masterIngredients.find(mi => mi.id === ing.masterIngredientId);
      if (!masterIng) {
        warnings.push(`Definizione Materia Prima non trovata per ID: ${ing.masterIngredientId} (Ingrediente: ${ing.id}). Ingrediente ignorato nel costo.`);
        return; 
      }
      
      if (typeof ing.quantity !== 'number' || isNaN(ing.quantity) || ing.quantity <= 0) {
         warnings.push(`Quantità non valida o nulla per ${masterIng.name} (Quantità: ${ing.quantity}). Ingrediente ignorato nel costo.`);
         return;
      }

      const availablePricePoints = ingredientPricePoints.filter(pp => pp.masterIngredientId === ing.masterIngredientId);
      if (availablePricePoints.length === 0) {
        warnings.push(`Nessun Punto Prezzo trovato per ${masterIng.name}. Ingrediente ignorato nel costo.`);
        return; 
      }

      let chosenPricePoint: IngredientPricePoint | undefined;
      switch (costCalculationStrategy) {
        case 'latest':
          chosenPricePoint = availablePricePoints.reduce((latest, current) => 
            new Date(current.dateRecorded) > new Date(latest.dateRecorded) ? current : latest
          );
          break;
        case 'average':
          const sumOfCostsPerBaseUnit = availablePricePoints.reduce((sum, current) => sum + current.costPerBaseUnit, 0);
          const averageCostPerBaseUnit = sumOfCostsPerBaseUnit / availablePricePoints.length;
          chosenPricePoint = { ...availablePricePoints[0], costPerBaseUnit: averageCostPerBaseUnit, supplierNotes: "Media dei prezzi registrati" }; // Create a synthetic price point for average
          break;
        case 'cheapest':
        default:
          chosenPricePoint = availablePricePoints.reduce((cheapest, current) => 
            current.costPerBaseUnit < cheapest.costPerBaseUnit ? current : cheapest
          );
          break;
      }
      
      if (chosenPricePoint) {
        totalCost += ing.quantity * chosenPricePoint.costPerBaseUnit;
      } else {
         warnings.push(`Impossibile determinare il punto prezzo per ${masterIng.name} con la strategia '${costCalculationStrategy}'.`);
      }
    });

    const costPerPortion = recipe.portions > 0 ? totalCost / recipe.portions : 0;
    return { totalCost, costPerPortion, warnings: warnings.length > 0 ? warnings : undefined };
  }, [masterIngredients, ingredientPricePoints, costCalculationStrategy]);

  const handleAddRecipeClick = () => { setCurrentView({ type: 'form' }); };
  const handleEditRecipe = (id: string) => { setCurrentView({ type: 'form', recipeIdToEdit: id }); };
  const handleViewRecipe = (id: string) => { setCurrentView({ type: 'detail', recipeId: id }); };

  const handleFormSubmit = (recipeData: Recipe) => {
    setRecipes(prev => {
        const existing = prev.find(r => r.id === recipeData.id);
        if (existing) return prev.map(r => r.id === recipeData.id ? recipeData : r);
        return [...prev, recipeData];
    });
    setCurrentView({ type: 'detail', recipeId: recipeData.id });
  };

  const handleFormCancel = (recipeIdBeingEdited?: string) => {
    if (recipeIdBeingEdited && recipes.some(r => r.id === recipeIdBeingEdited)) {
        setCurrentView({ type: 'detail', recipeId: recipeIdBeingEdited });
    } else {
        setCurrentView({ type: 'list' });
    }
  };
  
  const handleDeleteRecipeRequest = (id: string) => {
    setRecipeIdToDelete(id);
    setShowDeleteRecipeModal(true);
  };

  const confirmDeleteRecipe = () => {
    if (recipeIdToDelete) {
      setRecipes(prev => prev.filter(r => r.id !== recipeIdToDelete));
      if(currentView.type === 'detail' && currentView.recipeId === recipeIdToDelete) {
        setCurrentView({ type: 'list' }); 
      }
      setRecipeIdToDelete(null);
      setShowDeleteRecipeModal(false);
    }
  };

  const addMasterIngredient = (mi: MasterIngredient) => { setMasterIngredients(prev => [...prev, mi]); };
  const updateMasterIngredient = (updatedMi: MasterIngredient) => { setMasterIngredients(prev => prev.map(mi => mi.id === updatedMi.id ? updatedMi : mi)); };
  const deleteMasterIngredient = (id: string) => {
    setMasterIngredients(prev => prev.filter(mi => mi.id !== id));
    setIngredientPricePoints(prev => prev.filter(pp => pp.masterIngredientId !== id));
    setRecipes(prevRecipes => prevRecipes.map(r => ({
        ...r,
        ingredients: r.ingredients.filter(ing => ing.masterIngredientId !== id)
    })).filter(r => r.ingredients.length > 0));
  };
  
  const addIngredientPricePoint = (pp: IngredientPricePoint) => { setIngredientPricePoints(prev => [...prev, pp]); };
  const updateIngredientPricePoint = (updatedPp: IngredientPricePoint) => { setIngredientPricePoints(prev => prev.map(pp => pp.id === updatedPp.id ? updatedPp : pp)); };
  const deleteIngredientPricePoint = (id: string) => { setIngredientPricePoints(prev => prev.filter(pp => pp.id !== id)); };

  let content;
  const activeRecipe = currentView.type === 'detail' ? recipes.find(r => r.id === currentView.recipeId) : undefined;
  const recipeToEdit = currentView.type === 'form' && currentView.recipeIdToEdit ? recipes.find(r => r.id === currentView.recipeIdToEdit) : undefined;

  if (currentView.type === 'form') {
    content = (
      <RecipeForm
        initialData={recipeToEdit}
        onSubmit={handleFormSubmit}
        onCancel={() => handleFormCancel(currentView.recipeIdToEdit)}
        masterIngredients={masterIngredients}
      />
    );
  } else if (currentView.type === 'detail' && activeRecipe) {
    content = (
      <RecipeDetailView
        recipe={activeRecipe}
        foodCost={calculateFoodCost(activeRecipe)}
        onBack={() => setCurrentView({ type: 'list' })}
        onEdit={handleEditRecipe}
        onDelete={handleDeleteRecipeRequest}
        masterIngredients={masterIngredients}
        ingredientPricePoints={ingredientPricePoints}
        costCalculationStrategy={costCalculationStrategy}
      />
    );
  } else if (currentView.type === 'masterIngredients') {
    content = (
      <MasterIngredientManager
        masterIngredients={masterIngredients}
        ingredientPricePoints={ingredientPricePoints}
        onAddMasterIngredient={addMasterIngredient}
        onUpdateMasterIngredient={updateMasterIngredient}
        onDeleteMasterIngredient={deleteMasterIngredient}
        onAddPricePoint={addIngredientPricePoint}
        onUpdatePricePoint={updateIngredientPricePoint}
        onDeletePricePoint={deleteIngredientPricePoint}
        onNavigateBack={() => setCurrentView({type: 'list'})}
      />
    );
  } else if (currentView.type === 'settings') {
    content = (
      <SettingsView 
        currentStrategy={costCalculationStrategy}
        onStrategyChange={setCostCalculationStrategy}
        onNavigateBack={() => setCurrentView({ type: 'list' })}
      />
    );
  }
  else { 
    content = (
      <RecipeList
        recipes={recipes}
        onViewRecipe={handleViewRecipe}
        onEditRecipe={handleEditRecipe}
        onDeleteRecipe={handleDeleteRecipeRequest}
        calculateFoodCost={calculateFoodCost}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-amber-600 text-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <button onClick={() => setCurrentView({type: 'list'})} className="flex items-center" aria-label="Pagina principale">
            <CakeIcon className="w-10 h-10 mr-3"/>
            <h1 className="text-2xl sm:text-3xl font-bold">Pasticceria Pro</h1>
          </button>
          <div className="flex items-center space-x-2 sm:space-x-3">
            {currentView.type === 'list' && (
              <>
                <button
                  onClick={() => setCurrentView({ type: 'masterIngredients' })}
                  className="inline-flex items-center px-3 py-2 sm:px-4 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-600 focus:ring-white"
                  title="Gestisci Materie Prime e Prezzi"
                >
                  <ArchiveBoxIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-0 sm:mr-2" />
                  <span className="hidden sm:inline">Materie Prime</span>
                </button>
                <button
                  onClick={handleAddRecipeClick}
                  className="inline-flex items-center px-3 py-2 sm:px-4 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-600 focus:ring-white"
                  title="Crea Nuova Ricetta"
                >
                  <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-0 sm:mr-2" />
                  <span className="hidden sm:inline">Nuova Ricetta</span>
                </button>
                 <button
                  onClick={() => setCurrentView({ type: 'settings' })}
                  className="p-2 text-white hover:bg-amber-700 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-600 focus:ring-white"
                  title="Impostazioni"
                  aria-label="Impostazioni"
                >
                  <CogIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}
             {(currentView.type === 'masterIngredients' || currentView.type === 'detail' || currentView.type === 'form' || currentView.type === 'settings') && (
                <button
                  onClick={() => setCurrentView({ type: 'list' })}
                  className="inline-flex items-center px-3 py-2 sm:px-4 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-600 focus:ring-white"
                  title="Torna alle Ricette"
                >
                  <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-0 sm:mr-2" />
                   <span className="hidden sm:inline">Torna alle Ricette</span>
                </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6">
        {content}
      </main>
      
      <Modal
        isOpen={showDeleteRecipeModal}
        onClose={() => setShowDeleteRecipeModal(false)}
        onConfirm={confirmDeleteRecipe}
        title="Conferma Eliminazione Ricetta"
      >
        Sei sicuro di voler eliminare questa ricetta? L'azione è irreversibile.
      </Modal>

      <footer className="bg-slate-800 text-slate-400 text-center p-6 mt-12">
        <p>&copy; {new Date().getFullYear()} Pasticceria Pro. Tutti i diritti riservati.</p>
        <p className="text-sm">Un'app per professionisti della pasticceria.</p>
      </footer>
    </div>
  );
};

export default App;
