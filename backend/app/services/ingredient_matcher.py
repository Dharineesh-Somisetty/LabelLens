"""LabelLens – Ingredient Matcher.

Matches normalized ingredient strings against the KB with:
  1. Exact match (canonical name or synonym)
  2. E-number lookup
  3. Category-level pattern fallback
  → Returns structured IngredientMatchResult per ingredient

No fuzzy matching — only deterministic, safe matches.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Any, Dict, List, Optional

from .ingredient_normalizer import normalize_ingredient, normalize_e_number

logger = logging.getLogger("labellens.matcher")


# ── Match status enum ─────────────────────────────────────────
class MatchStatus(str, Enum):
    MATCHED = "matched"
    FALLBACK = "fallback"
    UNKNOWN = "unknown"


@dataclass
class IngredientMatchResult:
    raw: str                          # original text as received
    normalized: str                   # after normalization pipeline
    status: MatchStatus = MatchStatus.UNKNOWN
    display_name: str = ""            # what to show in UI
    kb_name: str | None = None        # canonical KB entry name if matched
    penalty: float = 0.0
    category: str = "unknown"
    reason: str = "No KB match"
    confidence: float = 0.0
    fallback_category: str | None = None
    tags: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["status"] = self.status.value
        return d


# ── Category patterns for fallback classification ─────────────
_CATEGORY_PATTERNS: Dict[str, List[re.Pattern]] = {
    "preservative": [
        re.compile(r"benzoate", re.I),
        re.compile(r"sorbate", re.I),
        re.compile(r"nitrite", re.I),
        re.compile(r"nitrate", re.I),
        re.compile(r"sulfite", re.I),
        re.compile(r"sulphite", re.I),
        re.compile(r"propionate", re.I),
        re.compile(r"bisulfite", re.I),
        re.compile(r"metabisulfite", re.I),
        re.compile(r"\bbht\b", re.I),
        re.compile(r"\bbha\b", re.I),
        re.compile(r"\btbhq\b", re.I),
        re.compile(r"\bedta\b", re.I),
    ],
    "artificial_color": [
        re.compile(r"red\s*\d+", re.I),
        re.compile(r"yellow\s*\d+", re.I),
        re.compile(r"blue\s*\d+", re.I),
        re.compile(r"green\s*\d+", re.I),
        re.compile(r"\blake\b", re.I),
        re.compile(r"fd\s*and\s*c\b", re.I),
        re.compile(r"fd\s*&\s*c\b", re.I),
        re.compile(r"tartrazine", re.I),
        re.compile(r"amaranth", re.I),
        re.compile(r"allura", re.I),
        re.compile(r"brilliant\s+blue", re.I),
        re.compile(r"sunset\s+yellow", re.I),
        re.compile(r"caramel\s+color", re.I),
    ],
    "sweetener": [
        re.compile(r"aspartame", re.I),
        re.compile(r"sucralose", re.I),
        re.compile(r"acesulfame", re.I),
        re.compile(r"saccharin", re.I),
        re.compile(r"neotame", re.I),
        re.compile(r"advantame", re.I),
        re.compile(r"\bstevia\b", re.I),
        re.compile(r"monk\s*fruit", re.I),
        re.compile(r"erythritol", re.I),
        re.compile(r"\bxylitol\b", re.I),
        re.compile(r"\bsorbitol\b", re.I),
        re.compile(r"maltitol", re.I),
        re.compile(r"mannitol", re.I),
    ],
    "emulsifier": [
        re.compile(r"lecithin", re.I),
        re.compile(r"mono\s*and\s*diglycerides", re.I),
        re.compile(r"mono\s*diglycerides", re.I),
        re.compile(r"polysorbate", re.I),
        re.compile(r"sorbitan", re.I),
        re.compile(r"glyceryl\s*mono", re.I),
        re.compile(r"diacetyl\s*tartaric", re.I),
    ],
    "thickener": [
        re.compile(r"\bgum\b", re.I),
        re.compile(r"carrageenan", re.I),
        re.compile(r"\bcellulose\b", re.I),
        re.compile(r"\bpectin\b", re.I),
        re.compile(r"\bagar\b", re.I),
        re.compile(r"\bstarch\b", re.I),
        re.compile(r"dextrin", re.I),
        re.compile(r"\bgelatin\b", re.I),
    ],
    "flavor_enhancer": [
        re.compile(r"monosodium\s*glutamate", re.I),
        re.compile(r"\bmsg\b", re.I),
        re.compile(r"disodium\s*(inosinate|guanylate)", re.I),
        re.compile(r"hydrolyzed.*protein", re.I),
        re.compile(r"autolyzed.*yeast", re.I),
    ],
}

# ── Confidence levels for fallback categories ─────────────────
_FALLBACK_CONFIDENCE: Dict[str, float] = {
    "preservative": 0.5,
    "artificial_color": 0.6,
    "sweetener": 0.5,
    "emulsifier": 0.4,
    "thickener": 0.4,
    "flavor_enhancer": 0.5,
    "additive": 0.3,   # generic E-number fallback
}


# ── E-number → ingredient name map ───────────────────────────
# Comprehensive set covering the most common E numbers found on labels.
_E_NUMBER_MAP: Dict[str, str] = {
    "e100": "curcumin", "e101": "riboflavin", "e102": "tartrazine",
    "e110": "sunset yellow", "e120": "cochineal", "e122": "azorubine",
    "e124": "ponceau 4r", "e129": "allura red",
    "e131": "patent blue v", "e132": "indigotine",
    "e133": "brilliant blue fcf", "e140": "chlorophyll",
    "e141": "copper chlorophyll",
    "e150a": "plain caramel", "e150d": "sulfite ammonia caramel",
    "e151": "brilliant black",
    "e160a": "beta carotene", "e160b": "annatto", "e160c": "paprika extract",
    "e161b": "lutein", "e162": "beetroot red",
    "e170": "calcium carbonate", "e171": "titanium dioxide",
    "e200": "sorbic acid", "e202": "potassium sorbate",
    "e210": "benzoic acid", "e211": "sodium benzoate",
    "e212": "potassium benzoate",
    "e220": "sulfur dioxide", "e221": "sodium sulfite",
    "e223": "sodium metabisulfite",
    "e250": "sodium nitrite", "e251": "sodium nitrate",
    "e252": "potassium nitrate",
    "e260": "acetic acid", "e270": "lactic acid",
    "e280": "propionic acid", "e281": "sodium propionate",
    "e282": "calcium propionate",
    "e290": "carbon dioxide", "e296": "malic acid", "e297": "fumaric acid",
    "e300": "ascorbic acid", "e301": "sodium ascorbate",
    "e302": "calcium ascorbate", "e304": "ascorbyl palmitate",
    "e306": "tocopherol", "e307": "alpha tocopherol",
    "e310": "propyl gallate", "e319": "tbhq", "e320": "bha", "e321": "bht",
    "e322": "lecithin",
    "e325": "sodium lactate", "e326": "potassium lactate",
    "e327": "calcium lactate",
    "e330": "citric acid", "e331": "sodium citrate",
    "e332": "potassium citrate", "e333": "calcium citrate",
    "e334": "tartaric acid", "e335": "sodium tartrate",
    "e336": "potassium tartrate", "e337": "sodium potassium tartrate",
    "e338": "phosphoric acid", "e339": "sodium phosphate",
    "e340": "potassium phosphate", "e341": "calcium phosphate",
    "e385": "calcium disodium edta", "e392": "rosemary extract",
    "e400": "alginic acid", "e401": "sodium alginate",
    "e406": "agar", "e407": "carrageenan",
    "e410": "locust bean gum", "e412": "guar gum",
    "e414": "gum arabic", "e415": "xanthan gum",
    "e416": "karaya gum", "e418": "gellan gum",
    "e420": "sorbitol", "e421": "mannitol", "e422": "glycerol",
    "e432": "polysorbate 20", "e433": "polysorbate 80",
    "e440": "pectin", "e441": "gelatin",
    "e450": "diphosphate", "e451": "triphosphate",
    "e452": "polyphosphate", "e460": "cellulose",
    "e461": "methyl cellulose",
    "e464": "hydroxypropyl methyl cellulose",
    "e466": "carboxymethyl cellulose",
    "e470": "fatty acid salts", "e471": "mono and diglycerides",
    "e472e": "diacetyl tartaric acid esters",
    "e473": "sucrose esters", "e475": "polyglycerol esters",
    "e476": "polyglycerol polyricinoleate",
    "e481": "sodium stearoyl lactylate",
    "e491": "sorbitan monostearate",
    "e500": "sodium carbonate", "e501": "potassium carbonate",
    "e503": "ammonium carbonate", "e504": "magnesium carbonate",
    "e507": "hydrochloric acid", "e508": "potassium chloride",
    "e509": "calcium chloride", "e511": "magnesium chloride",
    "e516": "calcium sulfate", "e524": "sodium hydroxide",
    "e551": "silicon dioxide", "e553": "talc",
    "e621": "monosodium glutamate",
    "e627": "disodium guanylate", "e631": "disodium inosinate",
    "e635": "disodium ribonucleotides",
    "e900": "dimethylpolysiloxane", "e901": "beeswax",
    "e903": "carnauba wax", "e904": "shellac",
    "e920": "l cysteine",
    "e938": "argon", "e941": "nitrogen", "e942": "nitrous oxide",
    "e948": "oxygen",
    "e950": "acesulfame potassium", "e951": "aspartame",
    "e952": "cyclamate", "e953": "isomalt", "e954": "saccharin",
    "e955": "sucralose", "e960": "stevia", "e961": "neotame",
    "e965": "maltitol", "e966": "lactitol", "e967": "xylitol",
    "e968": "erythritol", "e999": "quillaia extract",
    "e1200": "polydextrose",
    "e1404": "oxidized starch", "e1410": "monostarch phosphate",
    "e1412": "distarch phosphate",
    "e1414": "acetylated distarch phosphate",
    "e1420": "acetylated starch",
    "e1422": "acetylated distarch adipate",
    "e1442": "hydroxypropyl distarch phosphate",
    "e1450": "starch sodium octenylsuccinate",
    "e1505": "triethyl citrate", "e1510": "ethanol",
    "e1520": "propylene glycol",
}


def _get_kb_index() -> Dict[str, Dict]:
    """Lazily import and return the KB name index, normalized with the new
    normalizer.  Avoids circular imports (kb_service → ingredient_normalizer).

    We import the *module* rather than the variable so we read the live
    reference after ``_load_kb()`` has populated it.
    """
    from app.services import kb_service as _kb
    _kb._load_kb()
    assert _kb._name_index is not None
    return _kb._name_index


def _try_exact_match(normalized: str) -> Optional[Dict[str, Any]]:
    """Try exact match against KB canonical names and synonym index."""
    index = _get_kb_index()
    return index.get(normalized)


def _try_e_number_match(normalized: str) -> Optional[Dict[str, Any]]:
    """Try matching as an E-number."""
    e_num = normalize_e_number(normalized)
    if not e_num:
        # Also try if the whole normalized string IS an e-number
        if re.fullmatch(r"e\d{3,4}[a-z]?", normalized):
            e_num = normalized
        else:
            return None

    # Check E-number map
    mapped_name = _E_NUMBER_MAP.get(e_num)
    if mapped_name:
        # Try to find the mapped ingredient in KB
        kb_entry = _try_exact_match(normalize_ingredient(mapped_name))
        if kb_entry:
            return kb_entry
        # Return a synthetic entry
        return {
            "canonicalName": mapped_name,
            "tags": ["additive", "e-number"],
            "_source": "e_number_map",
        }

    # E-number exists but not in our map
    return None


def _try_e_number_unmapped(normalized: str) -> bool:
    """Return True if the string looks like an E-number but isn't in the map."""
    e_num = normalize_e_number(normalized)
    if not e_num:
        if re.fullmatch(r"e\d{3,4}[a-z]?", normalized):
            e_num = normalized
        else:
            return False
    return e_num not in _E_NUMBER_MAP


def _try_category_fallback(normalized: str) -> Optional[IngredientMatchResult]:
    """Try pattern-based category classification."""
    for category, patterns in _CATEGORY_PATTERNS.items():
        for pat in patterns:
            if pat.search(normalized):
                return IngredientMatchResult(
                    raw="",
                    normalized=normalized,
                    status=MatchStatus.FALLBACK,
                    category=category,
                    fallback_category=category,
                    penalty=0.0,  # fallbacks don't add penalties (conservative)
                    confidence=_FALLBACK_CONFIDENCE.get(category, 0.3),
                    reason=f"Pattern match: {category}",
                    tags=[category, "fallback"],
                )
    return None


def match_ingredient(raw: str) -> IngredientMatchResult:
    """Match a single raw ingredient string against the KB.

    Tries in order:
      1. Exact match (canonical name or synonym)
      2. E-number lookup
      3. Category pattern fallback
      4. Unknown
    """
    normalized = normalize_ingredient(raw)
    display_name = raw.strip() or normalized

    if not normalized:
        return IngredientMatchResult(
            raw=raw, normalized="", display_name=display_name,
            status=MatchStatus.UNKNOWN, reason="Empty after normalization",
        )

    # 1. Exact match
    entry = _try_exact_match(normalized)
    if entry:
        return IngredientMatchResult(
            raw=raw, normalized=normalized,
            display_name=entry.get("canonicalName", display_name),
            status=MatchStatus.MATCHED,
            kb_name=entry.get("canonicalName"),
            category=_primary_category(entry),
            reason="KB exact match",
            confidence=1.0,
            tags=entry.get("tags", []),
        )

    # 2. E-number
    entry = _try_e_number_match(normalized)
    if entry:
        return IngredientMatchResult(
            raw=raw, normalized=normalized,
            display_name=entry.get("canonicalName", display_name),
            status=MatchStatus.MATCHED,
            kb_name=entry.get("canonicalName"),
            category=_primary_category(entry),
            reason="E-number match",
            confidence=0.9,
            tags=list(set(entry.get("tags", []) + ["e-number"])),
        )

    # 2b. Unmapped E-number → fallback "additive"
    if _try_e_number_unmapped(normalized):
        return IngredientMatchResult(
            raw=raw, normalized=normalized,
            display_name=display_name,
            status=MatchStatus.FALLBACK,
            fallback_category="additive",
            category="additive",
            reason="E-number (unmapped)",
            confidence=0.3,
            tags=["additive", "e-number", "fallback"],
        )

    # 3. Category fallback
    fallback = _try_category_fallback(normalized)
    if fallback:
        fallback.raw = raw
        fallback.display_name = display_name
        return fallback

    # 4. Unknown
    return IngredientMatchResult(
        raw=raw, normalized=normalized, display_name=display_name,
        status=MatchStatus.UNKNOWN, reason="No KB match", confidence=0.0,
    )


def match_ingredients(raw_list: List[str]) -> Dict[str, Any]:
    """Match a list of raw ingredient strings.

    Returns a summary dict with counts and per-ingredient results.
    """
    results: List[IngredientMatchResult] = []
    for raw in raw_list:
        results.append(match_ingredient(raw))

    matched = [r for r in results if r.status == MatchStatus.MATCHED]
    fallback = [r for r in results if r.status == MatchStatus.FALLBACK]
    unknown = [r for r in results if r.status == MatchStatus.UNKNOWN]

    total = len(results)
    return {
        "total_count": total,
        "recognized_count": len(matched) + len(fallback),
        "matched_count": len(matched),
        "fallback_count": len(fallback),
        "unknown_count": len(unknown),
        "unknown_items": [r.to_dict() for r in unknown],
        "fallback_items": [r.to_dict() for r in fallback],
        "results": [r.to_dict() for r in results],
        "unknown_rate": len(unknown) / total if total else 0.0,
    }


def _primary_category(entry: Dict) -> str:
    """Extract the primary (non-UPF-indicator) category from a KB entry's tags."""
    tags = entry.get("tags") or []
    for t in tags:
        if not t.startswith("upf_indicator") and t not in ("additive", "e-number", "fallback"):
            return t
    return "other"
