// utils/conversionUtils.ts

export const UNIT_CATEGORIES = {
  WEIGHT: 'weight',
  VOLUME: 'volume',
  PIECES: 'pieces',
} as const;

export type UnitCategory = typeof UNIT_CATEGORIES[keyof typeof UNIT_CATEGORIES];

export interface UnitDefinition {
  name: string; // e.g., "Grammi"
  abbreviation: string; // e.g., "g"
  category: UnitCategory;
  // isBaseUnit: boolean; // Indicates if this is THE reference unit for its category (e.g. g for weight, ml for volume)
  conversionFactorToBase: number; // Factor to convert this unit TO its category's absolute base unit (g, ml, pz).
}

// Absolute base units for each category
export const ABSOLUTE_BASE_UNITS = {
  [UNIT_CATEGORIES.WEIGHT]: 'g',
  [UNIT_CATEGORIES.VOLUME]: 'ml',
  [UNIT_CATEGORIES.PIECES]: 'pz',
};

export const SUPPORTED_UNITS: UnitDefinition[] = [
  // Weight (Absolute Base: g)
  { name: 'Grammi', abbreviation: 'g', category: UNIT_CATEGORIES.WEIGHT, conversionFactorToBase: 1 },
  { name: 'Kilogrammi', abbreviation: 'kg', category: UNIT_CATEGORIES.WEIGHT, conversionFactorToBase: 1000 },
  { name: 'Milligrammi', abbreviation: 'mg', category: UNIT_CATEGORIES.WEIGHT, conversionFactorToBase: 0.001 },
  // Volume (Absolute Base: ml)
  { name: 'Millilitri', abbreviation: 'ml', category: UNIT_CATEGORIES.VOLUME, conversionFactorToBase: 1 },
  { name: 'Litri', abbreviation: 'l', category: UNIT_CATEGORIES.VOLUME, conversionFactorToBase: 1000 },
  // Pieces (Absolute Base: pz)
  { name: 'Pezzi', abbreviation: 'pz', category: UNIT_CATEGORIES.PIECES, conversionFactorToBase: 1 },
  // { name: 'Dozzina', abbreviation: 'dz', category: UNIT_CATEGORIES.PIECES, conversionFactorToBase: 12 },
];

export const getUnitDefinition = (unitAbbreviation: string): UnitDefinition | undefined => {
  return SUPPORTED_UNITS.find(u => u.abbreviation === unitAbbreviation);
};

export const getUnitCategory = (unitAbbreviation: string): UnitCategory | undefined => {
  return getUnitDefinition(unitAbbreviation)?.category;
};

// Returns a list of units compatible with the master ingredient's base unit category.
export const getCompatibleUnitsForMasterIngredient = (masterIngredientBaseUnit: string): UnitDefinition[] => {
  const category = getUnitCategory(masterIngredientBaseUnit);
  if (!category) return [];
  return SUPPORTED_UNITS.filter(u => u.category === category);
};

export function convertDisplayToRecipeBase(
  displayValue: number | undefined,
  displayUnitAbbr: string | undefined,
  recipeMasterIngredientBaseUnitAbbr: string
): number {
  if (typeof displayValue !== 'number' || !displayUnitAbbr) {
    return 0;
  }

  const displayUnitDef = getUnitDefinition(displayUnitAbbr);
  const recipeBaseUnitDef = getUnitDefinition(recipeMasterIngredientBaseUnitAbbr);

  if (!displayUnitDef || !recipeBaseUnitDef || displayUnitDef.category !== recipeBaseUnitDef.category) {
    // console.error("Conversion not possible: Incompatible units or unit not found.", displayUnitAbbr, recipeMasterIngredientBaseUnitAbbr);
    return 0; // Error in conversion, units not compatible or not found.
  }

  // Convert displayValue from its unit to the category's absolute base unit (g, ml, or pz)
  const valueInAbsoluteBase = displayValue * displayUnitDef.conversionFactorToBase;

  // Now, convert from the category's absolute base unit to the recipe's master ingredient base unit
  // This step is mostly relevant if a master ingredient could have a base unit like 'kg'
  // but our system standardizes on g, ml, pz for calculation.
  // For now, recipeMasterIngredientBaseUnitAbbr IS one of g, ml, pz.
  // So, if displayUnitDef.category === recipeBaseUnitDef.category, and recipeMasterIngredientBaseUnitAbbr is already an absolute base,
  // then valueInAbsoluteBase is the final value.
  // If recipeMasterIngredientBaseUnitAbbr was (hypothetically) 'kg', we'd divide by 1000.
  // But since it's 'g', recipeBaseUnitDef.conversionFactorToBase is 1.
  
  // This effectively means: value in 'g' = valueInAbsoluteBase / 1 (if recipeBaseUnit is 'g')
  const finalValue = valueInAbsoluteBase / recipeBaseUnitDef.conversionFactorToBase;

  return finalValue;
}
