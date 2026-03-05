"""LabelLens – Ingredient Normalization Pipeline.

Transforms raw OCR / user-entered ingredient strings into canonical forms
for reliable KB matching.  Every KB lookup should normalize BEFORE comparing.

Pipeline steps (in order):
  1. Unicode → ASCII equivalents (dashes, quotes, special chars)
  2. Lowercase + trim
  3. Strip wrapper prefixes ("contains …", "ingredients: …", etc.)
  4. Remove percent values ("2%", "0.5 %")
  5. Handle parentheses (strip unless content has useful chemical terms)
  6. Normalize E-numbers ("E 330" → "e330")
  7. Normalize separators (semicolons, slashes, bullets → comma)
  8. Normalize "&" → "and"
  9. Remove interior hyphens between alpha words (mono-diglycerides → mono diglycerides)
 10. Strip surrounding punctuation
 11. Remove trailing periods
 12. Collapse multiple spaces
"""

from __future__ import annotations

import re
import unicodedata
from typing import List, Tuple

# ── Unicode → ASCII mappings ──────────────────────────────────
_UNICODE_MAP = str.maketrans({
    "\u2010": "-", "\u2011": "-", "\u2012": "-", "\u2013": "-",
    "\u2014": "-", "\u2015": "-",                              # dashes
    "\u2018": "'", "\u2019": "'", "\u201C": '"', "\u201D": '"',  # quotes
    "\u2026": "...",                                            # ellipsis
    "\u00A0": " ",                                              # non-breaking space
    "\u200B": "",                                               # zero-width space
    "\u00AD": "",                                               # soft hyphen
    "\u00AE": "",                                               # registered sign
    "\u2122": "",                                               # trademark sign
    "\u00D7": "x",                                              # multiplication sign
})

# ── Wrapper prefixes to strip ─────────────────────────────────
_WRAPPER_PATTERNS = [
    re.compile(r"^may\s+contain\s*[:\-]?\s*", re.IGNORECASE),
    re.compile(r"^contains?\s*[:\-]?\s*", re.IGNORECASE),
    re.compile(r"^ingredients?\s*[:\-]?\s*", re.IGNORECASE),
    re.compile(r"^made\s+with\s*[:\-]?\s*", re.IGNORECASE),
    re.compile(r"^less\s+than\s+\d+%?\s+of\s*[:\-]?\s*", re.IGNORECASE),
]

# ── Parentheses content that should be KEPT ───────────────────
_USEFUL_PAREN_KEYWORDS = frozenset({
    "acid", "sodium", "potassium", "calcium", "iron", "zinc",
    "vitamin", "phosphate", "chloride", "sulfate", "oxide",
    "acetate", "carbonate", "hydroxide", "magnesium",
})

# ── Percent value pattern ─────────────────────────────────────
_PERCENT_RE = re.compile(r"\b\d+(\.\d+)?\s*%")

# ── E-number normalization ────────────────────────────────────
_E_NUMBER_RE = re.compile(r"\be[\s\-]?(\d{3,4}[a-z]?)\b", re.IGNORECASE)

# ── Light pluralization rules (only for classification keywords) ──
_PLURAL_RULES: List[Tuple[re.Pattern, str]] = [
    (re.compile(r"\bcolours\b"), "color"),
    (re.compile(r"\bcolors\b"), "color"),
    (re.compile(r"\bflavours\b"), "flavor"),
    (re.compile(r"\bflavors\b"), "flavor"),
    (re.compile(r"\bpreservatives\b"), "preservative"),
    (re.compile(r"\bsweeteners\b"), "sweetener"),
    (re.compile(r"\bemulsifiers\b"), "emulsifier"),
    (re.compile(r"\bstabilisers\b"), "stabilizer"),
    (re.compile(r"\bstabilizers\b"), "stabilizer"),
    (re.compile(r"\bthickeners\b"), "thickener"),
    (re.compile(r"\bantioxidants\b"), "antioxidant"),
    (re.compile(r"\bacids\b"), "acid"),
]

# ── Separator normalization ───────────────────────────────────
_SEPARATOR_RE = re.compile(r"[;/|·•]")

# ── Multi-space collapse ──────────────────────────────────────
_MULTISPACE_RE = re.compile(r"\s{2,}")

# ── Leading / trailing non-alnum ──────────────────────────────
_LEADING_JUNK_RE = re.compile(r"^[^a-z0-9]+")
_TRAILING_JUNK_RE = re.compile(r"[^a-z0-9]+$")

# ── Parentheses with content ─────────────────────────────────
_PAREN_RE = re.compile(r"\(([^)]*)\)")


def _strip_parentheses_safe(text: str) -> str:
    """Remove parenthetical content unless it contains useful chemical terms.

    Examples:
        "sodium benzoate (preservative)"  → "sodium benzoate"
        "tocopherol (vitamin e)"          → "tocopherol vitamin e"  (kept)
        "sugar (organic)"                 → "sugar"
    """

    def _replace_paren(m: re.Match) -> str:
        content = m.group(1).lower().strip()
        for kw in _USEFUL_PAREN_KEYWORDS:
            if kw in content:
                return " " + content  # keep content, drop parens
        return ""  # strip entirely

    return _PAREN_RE.sub(_replace_paren, text)


def normalize_ingredient(raw: str) -> str:
    """Full normalization pipeline for a single ingredient string.

    Returns a canonical lowercase string suitable for KB lookup.
    """
    if not raw:
        return ""

    text = raw

    # 1. Unicode → ASCII equivalents
    text = text.translate(_UNICODE_MAP)
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))

    # 2. Lowercase + trim
    text = text.lower().strip()

    # 3. Strip wrapper prefixes
    for pat in _WRAPPER_PATTERNS:
        text = pat.sub("", text)

    # 4. Remove percent values (e.g., "2%", "0.5 %")
    text = _PERCENT_RE.sub("", text)

    # 5. Handle parentheses
    text = _strip_parentheses_safe(text)

    # 6. Normalize E-numbers: "E 330", "e-330" → "e330"
    text = _E_NUMBER_RE.sub(lambda m: f"e{m.group(1).lower()}", text)

    # 7. Normalize separators to commas
    text = _SEPARATOR_RE.sub(",", text)

    # 8. Normalize & → "and"
    text = text.replace("&", " and ")

    # 9. Remove hyphens between/after alpha words
    #    "mono-diglycerides" → "mono diglycerides"
    #    "mono- and diglycerides" → "mono and diglycerides"
    text = re.sub(r"(?<=[a-z])\s*-\s*", " ", text)

    # 10. Strip surrounding punctuation
    text = _LEADING_JUNK_RE.sub("", text)
    text = _TRAILING_JUNK_RE.sub("", text)

    # 11. Remove trailing periods
    text = text.rstrip(".")

    # 12. Collapse multiple spaces
    text = _MULTISPACE_RE.sub(" ", text).strip()

    return text


def normalize_for_classification(raw: str) -> str:
    """Like normalize_ingredient but also applies light pluralization
    rules for keyword-based classification matching."""
    text = normalize_ingredient(raw)
    for pattern, replacement in _PLURAL_RULES:
        text = pattern.sub(replacement, text)
    return text


def split_ingredient_list(raw_text: str) -> List[str]:
    """Split a raw OCR ingredient block into individual ingredient strings.

    Handles commas, semicolons, slashes, bullet points as separators.
    Strips wrapper prefixes from the whole block first.
    """
    if not raw_text:
        return []

    text = raw_text
    text = text.translate(_UNICODE_MAP)
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = text.lower().strip()

    for pat in _WRAPPER_PATTERNS:
        text = pat.sub("", text)

    text = _SEPARATOR_RE.sub(",", text)
    parts = text.split(",")

    result = []
    for part in parts:
        cleaned = normalize_ingredient(part.strip())
        if cleaned and len(cleaned) > 1:
            result.append(cleaned)
    return result


def normalize_e_number(raw: str) -> str | None:
    """If the string contains an E-number, return normalized form like 'e330'.
    Otherwise return None."""
    text = raw.strip().lower()
    m = _E_NUMBER_RE.search(text)
    if m:
        return f"e{m.group(1).lower()}"
    return None
