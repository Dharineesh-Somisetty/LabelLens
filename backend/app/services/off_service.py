"""Open Food Facts lookup service."""

from __future__ import annotations
import logging, requests
from typing import Optional, Dict, Any

logger = logging.getLogger("labellens.off")

OFF_URL = "https://world.openfoodfacts.org/api/v0/product/{barcode}.json"


def fetch_product_from_off(barcode: str) -> Optional[Dict[str, Any]]:
    """Lookup a barcode on Open Food Facts.

    Returns dict with product_name, brand, image_url, ingredients_text,
    and a cleaned ingredients tag list.
    """
    url = OFF_URL.format(barcode=barcode)
    try:
        resp = requests.get(url, timeout=10, headers={"User-Agent": "LabelLens/1.0"})
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        logger.warning("OFF request failed for %s: %s", barcode, exc)
        return None

    if data.get("status") != 1:
        return None

    product = data.get("product", {})

    # Clean ingredient tags (e.g. "en:sugar" → "sugar")
    raw_tags = product.get("ingredients_tags", [])
    clean_ingredients = []
    for tag in raw_tags:
        value = tag.split(":", 1)[-1] if ":" in tag else tag
        clean_ingredients.append(value.replace("-", " "))

    return {
        "product_name": product.get("product_name") or product.get("product_name_en", "Unknown Product"),
        "brand": product.get("brands", ""),
        "image_url": product.get("image_url", ""),
        "ingredients_text": product.get("ingredients_text") or product.get("ingredients_text_en", ""),
        "ingredients": clean_ingredients,
    }

