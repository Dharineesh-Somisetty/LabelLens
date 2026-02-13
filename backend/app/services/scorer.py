import pandas as pd
from typing import List, Dict, Any

# ==========================================
# 1. HEURISTIC RULES (The "Common Sense" Logic)
# ==========================================
# Instead of exact matches, we look for these substrings.
# Priority: High to Low (e.g., check 'whey' before 'protein')
KEYWORD_RULES = [
    # --- High Quality Proteins ---
    {'tag': 'whey',       'type': 'Protein', 'bio': 100, 'bloat': 2},
    {'tag': 'casein',     'type': 'Protein', 'bio': 90,  'bloat': 2},
    {'tag': 'egg white',  'type': 'Protein', 'bio': 100, 'bloat': 1},
    {'tag': 'beef',       'type': 'Protein', 'bio': 90,  'bloat': 0},
    
    # --- Medium/Plant Proteins ---
    {'tag': 'soy',        'type': 'Protein', 'bio': 70,  'bloat': 3},
    {'tag': 'pea',        'type': 'Protein', 'bio': 75,  'bloat': 4},
    {'tag': 'hemp',       'type': 'Protein', 'bio': 60,  'bloat': 2},
    {'tag': 'collagen',   'type': 'Protein', 'bio': 30,  'bloat': 0}, # Low muscle building
    {'tag': 'gluten',     'type': 'Protein', 'bio': 25,  'bloat': 8}, # Wheat gluten
    
    # --- Carbs / Sugars (The "Cut" Killers) ---
    {'tag': 'sugar',      'type': 'Carb',    'bio': 0,   'bloat': 2},
    {'tag': 'syrup',      'type': 'Carb',    'bio': 0,   'bloat': 3},
    {'tag': 'dextrose',   'type': 'Carb',    'bio': 0,   'bloat': 1},
    {'tag': 'maltodextrin','type':'Carb',    'bio': 0,   'bloat': 4},
    {'tag': 'oat',        'type': 'Carb',    'bio': 0,   'bloat': 1},
    {'tag': 'flour',      'type': 'Carb',    'bio': 0,   'bloat': 2},
    
    # --- The "Bad" Stuff (Bloat/Inflammation) ---
    {'tag': 'maltitol',   'type': 'Sweetener', 'bio': 0, 'bloat': 9}, # High penalty
    {'tag': 'sorbitol',   'type': 'Sweetener', 'bio': 0, 'bloat': 8},
    {'tag': 'xylitol',    'type': 'Sweetener', 'bio': 0, 'bloat': 7},
    {'tag': 'palm oil',   'type': 'Fat',       'bio': 0, 'bloat': 2},
    {'tag': 'vegetable oil','type':'Fat',      'bio': 0, 'bloat': 4},
    
    # --- Generic Fallbacks ---
    {'tag': 'protein',    'type': 'Protein', 'bio': 60,  'bloat': 2}, # Generic protein
    {'tag': 'gum',        'type': 'Additive','bio': 0,   'bloat': 5}, # Thickeners

    # --- Vitamins & Minerals (The "Micro" Fix) ---
    {'tag': 'vitamin',    'type': 'Micronutrient', 'bio': 100, 'bloat': 0},
    {'tag': 'ascorbic',   'type': 'Micronutrient', 'bio': 100, 'bloat': 0}, # Vitamin C
    {'tag': 'zinc',       'type': 'Micronutrient', 'bio': 100, 'bloat': 0},
    {'tag': 'magnesium',  'type': 'Micronutrient', 'bio': 100, 'bloat': 1}, # Some forms bloat
    {'tag': 'calcium',    'type': 'Micronutrient', 'bio': 80,  'bloat': 0},
    {'tag': 'iron',       'type': 'Micronutrient', 'bio': 80,  'bloat': 2}, # Can cause stomach upset
    {'tag': 'niacin',     'type': 'Micronutrient', 'bio': 100, 'bloat': 0}, # Vitamin B3

    # --- US-Specific "Bad" Ingredients (The American Diet) ---
    {'tag': 'high fructose', 'type': 'Sugar', 'bio': 0, 'bloat': 8}, # HFCS (Huge in US)
    {'tag': 'corn syrup',    'type': 'Sugar', 'bio': 0, 'bloat': 5},
    {'tag': 'soybean oil',   'type': 'Fat',   'bio': 0, 'bloat': 4}, # Most common US cheap fat
    {'tag': 'canola',        'type': 'Fat',   'bio': 0, 'bloat': 3},
    {'tag': 'red 40',        'type': 'Additive', 'bio': 0, 'bloat': 2}, # US Artificial Color
    {'tag': 'yellow 5',      'type': 'Additive', 'bio': 0, 'bloat': 2},
    {'tag': 'blue 1',        'type': 'Additive', 'bio': 0, 'bloat': 2},
    {'tag': 'enriched flour','type': 'Carb',  'bio': 0, 'bloat': 3}, # US processed wheat
    {'tag': 'carrageenan',   'type': 'Additive', 'bio': 0, 'bloat': 6}, # Common US thickener (gut irritant)
]

def analyze_ingredient_heuristic(ingredient_name: str) -> dict:
    """
    Scans the ingredient string for keywords to guess its properties.
    """
    clean_name = ingredient_name.lower()
    
    for rule in KEYWORD_RULES:
        if rule['tag'] in clean_name:
            return rule
            
    # Default if absolutely nothing matches (e.g., "Water", "Natural Flavors")
    return {'type': 'Other', 'bio': 0, 'bloat': 0}

# ==========================================
# 2. THE SCORING ENGINE
# ==========================================
def calculate_apex_score(ingredients: List[str], mode: str) -> Dict[str, Any]:
    final_score = 0.0
    good_ingredients = []
    bad_ingredients = []
    warnings = []
    analysis_log = []
    
    current_weight = 1.0
    decay_factor = 0.85 # Higher decay ensures top 3 ingredients dominate the score
    
    analysis_log.append(f"🔎 Analyzing {len(ingredients)} ingredients in {mode} mode.")

    # 1. Normalize Ingredient List (Handle OFF format quirks)
    # OFF sometimes sends "en:sugar", so we clean it just in case
    clean_ingredients = [i.replace("en:", "").replace("-", " ") for i in ingredients]

    for ingredient in clean_ingredients:
        ing_clean = ingredient.lower().strip()
        
        # --- LOGIC UPGRADE: HEURISTIC LOOKUP ---
        # Instead of failing on lookup, we "guess" based on the name
        data = analyze_ingredient_heuristic(ing_clean)
        
        ing_type = data['type']
        bioavailability = data['bio']
        bloat_risk = data['bloat']
        
        points_gained = 0
        penalty_applied = 0
        
        # --- SCORING RULES ---
        
        # A. Proteins Build Score
        if ing_type == 'Protein':
            # Logic: 100 bio * weight 1.0 = 100 pts.
            # We cap generic "protein" keywords lower so they don't game the system.
            points = (bioavailability) * current_weight
            
            # Cap max points per ingredient to avoid overflow
            points = min(points, 40) 
            
            final_score += points
            good_ingredients.append(f"{ingredient} (+{points:.1f})")

        # E. Micronutrient Bonus
        if ing_type == 'Micronutrient':
             # Small flat bonus for vitamins (don't decay weight as heavily)
             final_score += 5.0
             good_ingredients.append(f"{ingredient} (Essential)")

        # B. Bloat Penalties (Universal)
        if bloat_risk >= 5:
            penalty = 15.0 # Harsh penalty for bloat
            final_score -= penalty
            bad_ingredients.append(f"{ingredient} (Bloat Risk)")
            warnings.append(f"⚠️ High Bloat: {ingredient}")

        # C. Contextual Penalties (CUT vs BULK)
        if mode == 'CUT':
            # In Cut, we hate Sugar and Carbs early in the list
            if ing_type == 'Carb' or ing_type == 'Sweetener':
                # Higher penalty if it's the 1st or 2nd ingredient
                impact_score = 20.0 * current_weight
                if impact_score > 5:
                    final_score -= impact_score
                    bad_ingredients.append(f"{ingredient} (Carb)")
        
        elif mode == 'BULK':
            # In Bulk, we actually LIKE safe carbs (Oats/Rice)
            if ing_type == 'Carb' and bloat_risk < 3:
                bonus = 5.0 * current_weight
                final_score += bonus
                good_ingredients.append(f"{ingredient} (Fuel)")

        # D. The "Trash Filler" Penalty
        # If the first ingredient is Sugar or Palm Oil, automatic Fail.
        if current_weight == 1.0 and (ing_type == 'Sweetener' or ing_type == 'Carb') and mode == 'CUT':
             final_score -= 30
             warnings.append("❌ Primary ingredient is Sugar/Carb")

        # E. Categorization Catch-All (User Request)
        # If it's not "Good" and hasn't been flagged "Bad" yet, check if it should be a concern.
        # We check if the ingredient string (or a substring) is already in the list to avoid dupes, 
        # but easier to track status flags.
        
        is_good = any(ingredient in s for s in good_ingredients)
        is_bad = any(ingredient in s for s in bad_ingredients)
        
        if not is_good and not is_bad:
            # If it's Fat, Sweetener, Additive, or non-bonus Carb -> Concern
            if ing_type in ['Fat', 'Sweetener', 'Additive', 'Carb']:
                # Penalize slightly? Or just list it? 
                # User said "go to concerns", implying visual. 
                # Let's deduct tiny points to reflect "Empty" status if we want, 
                # or just list it. Let's just list it.
                bad_ingredients.append(f"{ingredient} (Low Quality/Empty)")
                
                # Optional: slight penalty for accumulation of trash?
                final_score -= 1.0 
        
        # Decay weight for next item
        current_weight *= decay_factor

    # --- FINAL MATH ---
    # Normalize score. If we found NO protein, the score shouldn't be high.
    if not good_ingredients and final_score > 0:
        final_score = final_score * 0.3 # Slash score if it's just "safe" but not "active"

    # Clamp 0-100
    final_score = max(0.0, min(100.0, final_score))

    # Verdict Generation
    if final_score >= 80:
        verdict = "🏆 Apex Fuel"
    elif final_score >= 60:
        verdict = "✅ Solid Choice"
    elif final_score >= 40:
        verdict = "⚠️ Mediocre"
    else:
        verdict = "❌ Trash"

    return {
        "final_score": round(final_score, 1),
        "verdict": verdict,
        "good_ingredients": good_ingredients,
        "bad_ingredients": bad_ingredients,
        "warnings": warnings,
        "analysis_log": analysis_log
    }