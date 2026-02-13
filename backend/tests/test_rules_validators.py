"""Unit tests for rules_engine and validators."""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.schemas import IngredientItem, UserProfile, EvidenceSnippet, PersonalizedSummaryResult, ChatAnswerResult
from app.services.rules_engine import run_rules
from app.services.validators import (
    validate_personalized_summary,
    validate_chat_answer,
)


# ── helpers ──────────────────────────────────────────────────────
def _ing(name, tags=None):
    return IngredientItem(name_raw=name, name_canonical=name, tags=tags or [])


def _evidence(cid="kb:cit-001"):
    return EvidenceSnippet(citation_id=cid, title="Test", snippet="desc", source_url="https://example.com")


# ── Rules engine tests ───────────────────────────────────────────
def test_allergen_flag():
    profile = UserProfile(allergies=["milk"])
    ings = [_ing("whey protein", tags=["allergen-milk", "dairy"])]
    flags = run_rules(ings, profile, [])
    assert any(f.type == "allergen" and f.severity == "high" for f in flags), "Should flag milk allergen"


def test_vegan_conflict():
    profile = UserProfile(vegan=True)
    ings = [_ing("gelatin", tags=["animal-derived", "non-vegan"])]
    flags = run_rules(ings, profile, [])
    assert any(f.type == "diet_conflict" for f in flags), "Should flag vegan conflict for gelatin"


def test_vegetarian_conflict():
    profile = UserProfile(vegetarian=True)
    ings = [_ing("anchovy", tags=["allergen-fish", "non-vegetarian"])]
    flags = run_rules(ings, profile, [])
    assert any(f.type == "diet_conflict" for f in flags), "Should flag vegetarian conflict for anchovy"


def test_halal_conflict():
    profile = UserProfile(halal=True)
    ings = [_ing("gelatin", tags=["non-halal-unless-certified"])]
    flags = run_rules(ings, profile, [])
    assert any(f.type == "diet_conflict" for f in flags), "Should flag halal concern for gelatin"


def test_caffeine_warning():
    profile = UserProfile(caffeine_limit_mg=200)
    ings = [_ing("caffeine", tags=["caffeine-source", "stimulant"])]
    flags = run_rules(ings, profile, [])
    assert any(f.type == "caffeine" and f.severity == "warn" for f in flags), "Should warn about caffeine"


def test_umbrella_term():
    profile = UserProfile()
    ings = [_ing("natural flavors", tags=["umbrella-term"])]
    flags = run_rules(ings, profile, [])
    assert any(f.type == "umbrella_term" for f in flags), "Should flag umbrella term"


def test_avoid_term():
    profile = UserProfile(avoid_terms=["palm oil"])
    ings = [_ing("palm oil")]
    flags = run_rules(ings, profile, [])
    assert any(f.type == "avoid_term" for f in flags), "Should flag avoided term"


def test_no_false_positive():
    profile = UserProfile()
    ings = [_ing("water")]
    flags = run_rules(ings, profile, [])
    assert len(flags) == 0, "Water should produce no flags for default profile"


# ── Validator tests ──────────────────────────────────────────────
def test_validator_strips_invalid_citations():
    result = PersonalizedSummaryResult(summary="Great product.", citations_used=["kb:cit-001", "kb:cit-999"])
    valid_ids = {"kb:cit-001"}
    validated = validate_personalized_summary(result, valid_ids, {"sugar"})
    assert "kb:cit-999" not in validated.citations_used
    assert "kb:cit-001" in validated.citations_used


def test_validator_blocks_medical_language():
    result = PersonalizedSummaryResult(summary="You should consult your doctor about this diagnosis.", citations_used=[])
    validated = validate_personalized_summary(result, set(), set())
    assert "not medical advice" in validated.summary.lower()


def test_chat_validator():
    result = ChatAnswerResult(answer="This provides a cure for your condition.", citations_used=["kb:cit-bad"])
    validated = validate_chat_answer(result, set(), set())
    assert "not medical advice" in validated.answer.lower()
    assert len(validated.citations_used) == 0  # invalid citation removed


# ── Run ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    tests = [v for k, v in list(globals().items()) if k.startswith("test_")]
    passed = 0
    for t in tests:
        try:
            t()
            print(f"  ✓ {t.__name__}")
            passed += 1
        except AssertionError as e:
            print(f"  ✗ {t.__name__}: {e}")
        except Exception as e:
            print(f"  ✗ {t.__name__}: {type(e).__name__}: {e}")
    print(f"\n{passed}/{len(tests)} tests passed.")
