'''
Prompt templates for AI pixel art desktop pet generation.
'''

# ── 直接生图提示词（无需视觉分析）──────────────────────────

DIRECT_GENERATION_PROMPT: str = (
    'Create a pixel art desktop pet sprite based on the reference image.\n\n'
    'Requirements:\n'
    '- 16-bit pixel art style\n'
    '- Transparent background\n'
    '- Front-facing view, centered\n'
    '- Cute chibi proportions (large head, small body)\n'
    '- Desktop pet / virtual pet aesthetic\n'
    '- Clean, readable pixels with visible pixel grid\n'
    '- Game sprite quality\n'
    '- Stay faithful to the original character\'s appearance\n'
    '- High contrast, vibrant colors\n'
    '- Crisp edges with minimal anti-aliasing\n\n'
    'The image must be a standalone character sprite on a transparent background, '
    'suitable for display as a desktop pet. No UI elements, no text, no backgrounds.'
)

# ── Additional prompts ─────────────────────────────────────────

SPRITE_SHEET_PROMPT: str = (
    'Create a pixel art sprite sheet for a desktop pet character.\n'
    'The sprite sheet should contain the following frames in a horizontal strip:\n'
    '- Frame 1: Idle pose (blinking)\n'
    '- Frame 2: Idle pose (eyes open)\n'
    '- Frame 3: Happy animation\n'
    '- Frame 4: Walking frame\n\n'
    'Style: 16-bit pixel art, transparent background, game sprite quality.'
)

NEGATIVE_PROMPT: str = (
    'realistic, 3D, photograph, gradient, blurry, low quality, '
    'watermark, signature, text, logo, background, frame, border, '
    'abstract, messy pixels, deformed, distorted'
)
