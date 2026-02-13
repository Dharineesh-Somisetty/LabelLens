"""Knowledge-base retrieval: match detected ingredients against kb/ingredients_kb.json."""

from __future__ import annotations
import json, os, pathlib
from typing import List, Dict

from ..schemas import EvidenceSnippet

_KB_PATH = pathlib.Path(__file__).resolve().parent.parent.parent / "kb" / "ingredients_kb.json"
_kb_cache: List[Dict] | None = None


def _load_kb() -> List[Dict]:
    global _kb_cache
    if _kb_cache is None:
        with open(_KB_PATH, "r", encoding="utf-8") as f:
            _kb_cache = json.load(f)
    assert _kb_cache is not None  # narrows type for Pylance
    return _kb_cache

def _normalize(s: str) -> str:
    return s.lower().strip().replace("-", " ").replace("_", " ")

def lookup_ingredients(canonical_names: List[str]) -> tuple[List[EvidenceSnippet], Dict[str, Dict]]:
    """Return evidence snippets and a dict mapping canonical_name -> KB entry for matched ingredients."""
    kb = _load_kb()
    snippets: List[EvidenceSnippet] = []
    matched_entries: Dict[str, Dict] = {}
    citation_counter = 0

    norm_lookup = {_normalize(n): n for n in canonical_names}

    for entry in kb:
        entry_names = [_normalize(entry["canonicalName"])] + [_normalize(s) for s in entry.get("synonyms", [])]
        for en in entry_names:
            # check if any queried canonical name matches or is substring
            for norm_q, orig_q in norm_lookup.items():
                if en == norm_q or en in norm_q or norm_q in en:
                    matched_entries[orig_q] = entry
                    for cit in entry.get("citations", []):
                        citation_counter += 1
                        cid = f"kb:cit-{citation_counter:03d}"
                        snippets.append(EvidenceSnippet(
                            citation_id=cid,
                            title=cit["title"],
                            snippet=entry.get("description", ""),
                            source_url=cit["url"],
                        ))
                    break  # matched this entry, move on

    return snippets, matched_entries

def get_kb_tags(canonical_name: str) -> List[str]:
    """Return tags for a given ingredient from KB."""
    kb = _load_kb()
    norm = _normalize(canonical_name)
    for entry in kb:
        names = [_normalize(entry["canonicalName"])] + [_normalize(s) for s in entry.get("synonyms", [])]
        if norm in names or any(norm in n or n in norm for n in names):
            return entry.get("tags", [])
    return []
