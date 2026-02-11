---
version: 3

watermark:
  enabled: false
  content: ""
  position: bottom-right  # bottom-right | bottom-left | bottom-center | top-right

# Type: hero | conceptual | typography | metaphor | scene | minimal | null (auto)
preferred_type: conceptual

# Palette: warm | elegant | cool | dark | earth | vivid | pastel | mono | retro | null (auto)
preferred_palette: null

# Rendering: flat-vector | hand-drawn | painterly | digital | pixel | chalk | null (auto)
preferred_rendering: null

# Text: none | title-only | title-subtitle | text-rich
preferred_text: title-only

# Mood: subtle | balanced | bold
preferred_mood: balanced

# Aspect: 2.35:1 | 16:9 | 1:1
default_aspect: "16:9"

# Skip confirmation step
quick_mode: true

# Language: zh | en | ja | ko | auto | null (auto-detect)
language: null

# Custom palettes (uncomment and edit to add)
# custom_palettes:
#   - name: my-palette
#     description: "Palette description"
#     colors:
#       primary: ["#1E3A5F", "#4A90D9"]
#       background: "#F5F7FA"
#       accents: ["#00B4D8"]
#     decorative_hints: "Clean lines, geometric shapes"
#     best_for: "Business, tech content"
---

<!-- Safe Zone Rule — APPEND to every cover prompt's Composition section.

## Safe Zone — MUST FOLLOW

CRITICAL: All important visual content (title text, key icons, main visual elements, watermark) MUST stay within the center 70% of the canvas. The outer 15% margin on each side is a bleed zone — fill it with background color, subtle patterns, or decorative elements that naturally extend from the main composition, but place NO critical content there.

This ensures the cover survives cropping by social platforms (X/Twitter, WeChat, etc.) without losing important information.

Rules:
- Title text: horizontally and vertically centered within the 70% safe area
- Main visual elements: contained within or overlapping the safe area boundary
- Background and decorative elements: freely extend to canvas edges
- Do NOT create a visible border, frame, or distinct padding strip
- The composition should look complete and intentional at full size
-->
