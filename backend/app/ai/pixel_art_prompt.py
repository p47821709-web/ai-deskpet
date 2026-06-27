'''
Prompt templates for AI pixel art desktop pet generation.
Provides structured prompts for both vision analysis and image generation steps.
'''

# ── System prompt for vision analysis ──────────────────────────

VISION_SYSTEM_PROMPT: str = (
    'You are a professional pixel art designer specializing in creating '
    'adorable desktop pet sprites. Your task is to analyze uploaded character '
    'images and produce detailed, pixel-precise descriptions that can be used '
    'to generate pixel art versions.\n\n'
    'Focus on:\n'
    '- Character proportions (head size, body shape)\n'
    '- Color palette (dominant colors, accent colors)\n'
    '- Distinctive features (ears, eyes, accessories, markings)\n'
    '- Pose and expression\n'
    '- Style cues for pixel art conversion'
)

# ── User prompt for vision analysis ────────────────────────────

VISION_USER_PROMPT: str = (
    'Analyze this character image in detail for pixel art conversion.\n\n'
    'Please provide:\n'
    '1. Character type (cat, dog, bunny, robot, fantasy creature, etc.)\n'
    '2. Body proportions and shape description\n'
    '3. Complete color palette (list all colors with approximate hex values)\n'
    '4. Key identifying features (ears, tail, eyes, markings, accessories)\n'
    '5. Suggested pixel art size (16x16, 24x24, or 32x32) based on complexity\n'
    '6. Expression/mood that best represents the character\n\n'
    'Format your response as a structured design brief.'
)

# ── Image generation prompt builder ────────────────────────────

IMAGE_GENERATION_PROMPT_TEMPLATE: str = (
    'Create a pixel art desktop pet sprite based on this design brief.\n\n'
    'Design Brief:\n{design_brief}\n\n'
    'Requirements:\n'
    '- 16-bit pixel style\n'
    '- Transparent background\n'
    '- Front-facing view, centered\n'
    '- Cute chibi proportions (large head, small body)\n'
    '- Desktop pet / virtual pet aesthetic\n'
    '- Clean, readable pixels with visible pixel grid\n'
    '- Game sprite quality\n'
    '- Stay faithful to the original character\'\'s appearance\n'
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


def build_design_brief(analysis_result: str) -> str:
    '''
    Build a compressed design brief from the vision analysis result
    suitable for inclusion in the image generation prompt.
    '''
    return (
        f'Character Design Analysis:\n{analysis_result.strip()}\n\n'
        f'Convert this character into a cute pixel art desktop pet following '
        f'the requirements above.'
    )


def build_generation_prompt(analysis_result: str) -> str:
    '''
    Build the complete image generation prompt by combining the
    analysis result with the generation template.
    '''
    design_brief: str = build_design_brief(analysis_result)
    return IMAGE_GENERATION_PROMPT_TEMPLATE.format(design_brief=design_brief)
