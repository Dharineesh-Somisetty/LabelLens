# Design System Strategy: The Clinical Naturalist

## 1. Overview & Creative North Star
The "Creative North Star" for this design system is **"The Clinical Naturalist."** 

In the high-stress environment of a grocery store, users don't need a cluttered dashboard; they need an authoritative, calm, and breathable interface that feels like a premium medical lab met a high-end wellness editorial. We break the "generic health app" template by moving away from rigid grids and boxy cards. Instead, we use **Intentional Asymmetry** and **Tonal Layering** to guide the eye. Information isn't just displayed; it is curated. By utilizing expansive white space (the "Medical-lite" aesthetic) and overlapping typography, we create a sense of sophisticated ease and uncompromising clarity.

## 2. Colors & Surface Philosophy
This system uses a restricted palette to maintain a "sanitized" yet organic feel. The greens represent vitality and "safe" choices, while the neutrals provide a sterile, high-contrast canvas.

### The "No-Line" Rule
**Borders are prohibited for sectioning.** To define boundaries, designers must use background color shifts. A `surface-container-low` (#f2f4f5) section should sit on a `surface` (#f8fafb) background to create a "zone" without the visual noise of a 1px line. This keeps the UI feeling light and "Medical-lite."

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine vellum paper.
*   **Base:** `surface` (#f8fafb)
*   **Secondary Zones:** `surface-container-low` (#f2f4f5)
*   **Elevated Cards:** `surface-container-lowest` (#ffffff)
*   **Interactive Overlays:** Use `surface-bright` with a 12px backdrop blur (Glassmorphism).

### The "Glass & Gradient" Rule
To prevent a "flat" or "cheap" appearance, main CTAs and hero headers should utilize a subtle linear gradient from `primary` (#006d37) to `primary_container` (#27ae60). This provides "visual soul" and depth. Floating action buttons should use a glassmorphic effect: a semi-transparent `surface` color with a 20px blur to allow product colors to bleed through softly.

## 3. Typography
The typography scale is designed for rapid scanning under fluorescent grocery store lighting.

*   **Display (Lexend):** Used for "Hero" nutritional scores. Large, friendly, and authoritative. Lexend’s wide apertures ensure legibility at a glance.
*   **Headline (Lexend):** For section titles (e.g., "Ingredient Analysis"). These should be set with tight letter-spacing to feel "editorial."
*   **Body (Public Sans):** A neutral, "workhorse" typeface for ingredient lists and medical disclaimers. Public Sans avoids visual fatigue.
*   **Label (Public Sans):** Used for micro-data (e.g., "Per 100g"). 

**Editorial Note:** Use "Overlapping Scales." A `display-lg` nutrition score should intentionally overlap the edge of a `surface-container` to break the grid and create a custom, high-end feel.

## 4. Elevation & Depth
We eschew traditional "drop shadows" in favor of **Tonal Layering**.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` background. The slight shift from #ffffff to #f2f4f5 creates a natural, soft lift.
*   **Ambient Shadows:** If a card must "float" (e.g., a barcode scanner result), use a shadow with a 40px blur at 6% opacity. Use a tint of `on_surface` (#191c1d) for the shadow color to ensure it feels like a natural shadow cast by store lighting.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline_variant` (#bccabc) at **15% opacity**. Never use a 100% opaque border.

## 5. Components

### Buttons
*   **Primary:** Gradient from `primary` to `primary_container`. Roundedness: `full`. No shadow.
*   **Secondary:** `surface-container-high` background with `on_secondary_container` text.
*   **Tertiary:** Ghost style. No container, just `primary` colored text in `label-md`.

### Health Metric Chips
*   **Positive Match:** `primary_fixed` background with `on_primary_fixed` text.
*   **Warning:** `tertiary_container` background with `on_tertiary_container` text.
*   **Dietary Icons:** Icons (Leaf, Wheat-slash) should be enclosed in a circular container with a `surface-variant` background to look like a "seal of approval."

### Cards & Lists
*   **Rule:** Forbid divider lines.
*   **Implementation:** Use a `16` (4rem) spacing block between list items, or shift the background color of alternating items to `surface-container-low`.
*   **Nutrition Info:** Use "asymmetric" cards where the "Sugar" or "Protein" count is vastly larger than the label, creating a clear visual hierarchy for the shopper.

### Contextual Scanner Overlay (Additional Component)
A glassmorphic bottom sheet using `surface-bright` at 80% opacity with a heavy backdrop blur. This allows the user to see the grocery shelf behind the app while reading the analysis, maintaining a connection to the physical environment.

## 6. Do's and Don'ts

### Do:
*   **Do** use `12` (3rem) and `16` (4rem) spacing for massive "breathing room" around critical medical data.
*   **Do** use `rounded-xl` (0.75rem) for most containers to maintain the "Soft Minimalism" feel.
*   **Do** ensure the `primary` green is the only vibrant color; all other elements should remain in the `surface` or `gray` family to highlight the "Success" state.

### Don't:
*   **Don't** use pure black (#000000). Use `on_surface` (#191c1d) for text to keep the "Medical-lite" softness.
*   **Don't** use 1px dividers. If you feel the need for a line, increase the whitespace instead.
*   **Don't** cram data. If a product has 20 ingredients, show the top 5 with a "high-end" fade-out transition into a "View More" button.