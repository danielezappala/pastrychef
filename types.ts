export interface MasterIngredient {
  id: string;
  name: string; // e.g., "Farina 00", "Cioccolato Fondente 70%"
  baseUnit: string; // e.g., "g", "ml", "pz". The canonical unit for this ingredient in recipes.
  category?: string; // Optional: e.g., "Farine", "Cioccolati"
}

export interface IngredientPricePoint {
  id: string;
  masterIngredientId: string; // Foreign Key to MasterIngredient
  supplierNotes: string; // e.g., "Fornitore Grossi S.p.A.", "Offerta Supermercato XYZ", "Sacco da 25kg"
  purchaseQuantityInBaseUnits: number; // e.g., 25000 (if MasterIngredient.baseUnit is 'g' for a 25kg sack)
  purchaseCost: number; // e.g., 50.00 (cost for the 25000g sack)
  costPerBaseUnit: number; // Calculated: purchaseCost / purchaseQuantityInBaseUnits. Stored for efficiency.
  dateRecorded: string; // ISO date string, e.g., "2023-10-27T10:00:00.000Z"
}

// Questo è l'ingrediente come parte di una ricetta
export interface RecipeIngredient {
  id: string; // Unique ID for this ingredient instance within the recipe
  masterIngredientId: string; // ID of the MasterIngredient
  quantity: number; // Quantity in MasterIngredient.baseUnit (for calculation)
  displayUnit?: string; // Optional: Unit used for display/entry (e.g., "tazza", "cucchiaio")
  displayQuantity?: number; // Optional: Quantity in displayUnit
  narrativeUnitLabel?: string; // Optional: Free-text descriptive label for the unit, e.g., "un cucchiaio", "un pizzico"
}

export interface Recipe {
  id: string;
  name: string;
  description: string; // Instructions and notes
  ingredients: RecipeIngredient[];
  portions: number; // How many portions this recipe yields
  imageUrl?: string;
}

export interface FoodCost {
  totalCost: number;
  costPerPortion: number;
  warnings?: string[]; // To flag issues like missing price points or ingredients
}

// Form state for IngredientPricePoint to handle numeric inputs
export interface IngredientPricePointFormState extends Omit<Partial<IngredientPricePoint>, 'purchaseQuantityInBaseUnits' | 'purchaseCost' | 'costPerBaseUnit' | 'dateRecorded' > {
  purchaseQuantityInBaseUnits?: string | number;
  purchaseCost?: string | number;
}

export type CostCalculationStrategy = 'cheapest' | 'latest' | 'average';
