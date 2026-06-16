const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

// Ensure downloads directory exists
const DOWNLOADS_DIR = path.join(__dirname, 'ppt-downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// Clean old files (older than 1 hour)
function cleanOldFiles() {
  try {
    const files = fs.readdirSync(DOWNLOADS_DIR);
    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join(DOWNLOADS_DIR, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > 3600000) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (e) { /* ignore */ }
}

// Theme
const THEME = {
  bg: '0B1120',
  accent: '00D4FF',
  accent2: '7C3AED',
  accent3: 'FF3366',
  text: 'F1F5F9',
  subtext: '94A3B8',
  darkBar: '111827',
  cardBg: '151D30',
};

// Visual icon shapes per slide (decorative geometric shapes to make slides visual)
const VISUAL_LAYOUTS = [
  // Layout 0: right-side icon panel
  (slide, pptx, theme) => {
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 10.5, y: 1.8, w: 2.3, h: 2.3, fill: { color: theme.accent, transparency: 88 }, rectRadius: 0.3, line: { color: theme.accent, width: 1.5, transparency: 50 } });
    slide.addShape(pptx.shapes.OVAL, { x: 11.0, y: 4.5, w: 1.5, h: 1.5, fill: { color: theme.accent2, transparency: 85 }, line: { color: theme.accent2, width: 1, transparency: 50 } });
  },
  // Layout 1: bottom-right triangle + circle
  (slide, pptx, theme) => {
    slide.addShape(pptx.shapes.OVAL, { x: 10.8, y: 2.2, w: 2, h: 2, fill: { color: theme.accent2, transparency: 87 }, line: { color: theme.accent2, width: 1.5, transparency: 40 } });
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 11.2, y: 4.8, w: 1.6, h: 1.4, fill: { color: theme.accent, transparency: 90 }, rectRadius: 0.2 });
  },
  // Layout 2: stacked rectangles
  (slide, pptx, theme) => {
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 10.6, y: 1.6, w: 2.4, h: 1.2, fill: { color: theme.accent, transparency: 88 }, rectRadius: 0.15 });
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 10.8, y: 3.1, w: 2, h: 1.2, fill: { color: theme.accent2, transparency: 88 }, rectRadius: 0.15 });
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 11.0, y: 4.6, w: 1.6, h: 1.2, fill: { color: theme.accent3, transparency: 88 }, rectRadius: 0.15 });
  },
  // Layout 3: large circle + small dots
  (slide, pptx, theme) => {
    slide.addShape(pptx.shapes.OVAL, { x: 10.2, y: 2, w: 2.8, h: 2.8, fill: { color: theme.accent, transparency: 90 }, line: { color: theme.accent, width: 2, transparency: 40 } });
    slide.addShape(pptx.shapes.OVAL, { x: 11.8, y: 5.2, w: 0.6, h: 0.6, fill: { color: theme.accent2, transparency: 60 } });
    slide.addShape(pptx.shapes.OVAL, { x: 10.5, y: 5.5, w: 0.4, h: 0.4, fill: { color: theme.accent3, transparency: 60 } });
  },
];

/**
 * Parse AI-generated slide content from structured text
 */
function parseSlideContent(aiResponse) {
  const slides = [];

  // Try JSON parse first
  try {
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (Array.isArray(parsed.slides || parsed)) {
        return parsed.slides || parsed;
      }
    }
  } catch (e) { /* fall through */ }

  // Text-based parsing
  const slideBlocks = aiResponse.split(/(?=SLIDE\s*\d+\s*:)/i);

  for (const block of slideBlocks) {
    const titleMatch = block.match(/SLIDE\s*\d+\s*:\s*(.*?)(?:\n|$)/i);
    if (!titleMatch) continue;

    const title = titleMatch[1].trim().replace(/\*\*/g, '');
    const contentPart = block.substring(titleMatch[0].length).trim();

    const bullets = [];
    const lines = contentPart.split('\n');
    for (const line of lines) {
      const cleaned = line.replace(/^[-*•]\s*/, '').replace(/\*\*/g, '').trim();
      if (cleaned && !cleaned.match(/^(CONTENT|NOTES|IMAGE|VISUAL):/i) && cleaned.length > 2) {
        bullets.push(cleaned);
      }
    }

    slides.push({ title, bullets });
  }

  return slides;
}

/**
 * Generate a professional PowerPoint presentation
 * - NO branding on any slide
 * - Only clean topic name on title slide
 * - Decorative visual shapes on content slides
 */
async function generatePPT(topic, slides, options = {}) {
  cleanOldFiles();

  const theme = THEME;
  const pptx = new PptxGenJS();

  // Presentation metadata (internal only, not visible)
  pptx.author = 'Presentation Generator';
  pptx.subject = topic;
  pptx.title = topic;
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches

  // Define master slides — NO branding text anywhere
  pptx.defineSlideMaster({
    title: 'TITLE_SLIDE',
    background: { color: theme.bg },
    objects: [
      { rect: { x: 0, y: 0, w: '100%', h: 0.06, fill: { color: theme.accent } } },
      { rect: { x: 0, y: 7.0, w: '100%', h: 0.5, fill: { color: theme.darkBar } } },
    ]
  });

  pptx.defineSlideMaster({
    title: 'CONTENT_SLIDE',
    background: { color: theme.bg },
    objects: [
      { rect: { x: 0, y: 0, w: '100%', h: 0.04, fill: { color: theme.accent } } },
      { rect: { x: 0, y: 0.04, w: 0.08, h: 1.2, fill: { color: theme.accent2 } } },
      { rect: { x: 0, y: 7.1, w: '100%', h: 0.4, fill: { color: theme.darkBar } } },
    ]
  });

  // ==================== SLIDE 1: TITLE SLIDE ====================
  const titleSlide = pptx.addSlide({ masterName: 'TITLE_SLIDE' });

  // Decorative shapes
  titleSlide.addShape(pptx.shapes.OVAL, {
    x: 9.5, y: -1.5, w: 5.5, h: 5.5,
    fill: { color: theme.accent, transparency: 90 },
    line: { color: theme.accent, width: 1.5, transparency: 50 }
  });
  titleSlide.addShape(pptx.shapes.OVAL, {
    x: 10.5, y: 0, w: 3, h: 3,
    fill: { color: theme.accent2, transparency: 92 },
    line: { color: theme.accent2, width: 1, transparency: 60 }
  });
  titleSlide.addShape(pptx.shapes.OVAL, {
    x: -1.5, y: 5, w: 3.5, h: 3.5,
    fill: { color: theme.accent2, transparency: 93 },
    line: { color: theme.accent2, width: 1, transparency: 70 }
  });

  // Topic name ONLY (clean, no prompt text)
  titleSlide.addText(topic, {
    x: 0.8, y: 1.8, w: 9, h: 2.2,
    fontSize: 40,
    fontFace: 'Calibri',
    color: theme.text,
    bold: true,
    align: 'left',
    lineSpacingMultiple: 1.15,
  });

  // Accent line under title
  titleSlide.addShape(pptx.shapes.RECTANGLE, {
    x: 0.8, y: 4.1, w: 3.5, h: 0.06,
    fill: { color: theme.accent }
  });

  // Date only — no branding
  titleSlide.addText(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), {
    x: 0.8, y: 4.4, w: 5, h: 0.5,
    fontSize: 14,
    fontFace: 'Calibri',
    color: theme.subtext
  });

  // ==================== CONTENT SLIDES ====================
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const contentSlide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });

    // Slide number (bottom right)
    contentSlide.addText(`${i + 1} / ${slides.length}`, {
      x: 11.5, y: 7.15, w: 1.5, h: 0.3,
      fontSize: 8,
      fontFace: 'Calibri',
      color: theme.subtext,
      align: 'right'
    });

    // Title
    contentSlide.addText(slide.title, {
      x: 0.5, y: 0.3, w: 9.5, h: 0.9,
      fontSize: 26,
      fontFace: 'Calibri',
      color: theme.accent,
      bold: true,
    });

    // Title underline
    contentSlide.addShape(pptx.shapes.RECTANGLE, {
      x: 0.5, y: 1.25, w: 2.5, h: 0.04,
      fill: { color: theme.accent2 }
    });

    // Bullet content (use left 10 inches, leave right for visuals)
    if (slide.bullets && slide.bullets.length > 0) {
      const bulletRows = slide.bullets.map(b => ({
        text: b,
        options: {
          fontSize: 14,
          color: theme.text,
          fontFace: 'Calibri',
          bullet: { type: 'bullet', color: theme.accent },
          lineSpacingMultiple: 1.5,
          paraSpaceAfter: 6,
        }
      }));

      contentSlide.addText(bulletRows, {
        x: 0.7, y: 1.5, w: 9.5, h: 5.3,
        valign: 'top',
      });
    }

    // Add decorative visual shapes (rotate through layouts)
    const layoutFn = VISUAL_LAYOUTS[i % VISUAL_LAYOUTS.length];
    layoutFn(contentSlide, pptx, theme);
  }

  // ==================== FINAL SLIDE: THANK YOU ====================
  const endSlide = pptx.addSlide({ masterName: 'TITLE_SLIDE' });

  // Decorative shapes
  endSlide.addShape(pptx.shapes.OVAL, {
    x: 4.5, y: 1.2, w: 4.5, h: 4.5,
    fill: { color: theme.accent, transparency: 90 },
    line: { color: theme.accent, width: 2, transparency: 40 }
  });
  endSlide.addShape(pptx.shapes.OVAL, {
    x: 8, y: 3.5, w: 2, h: 2,
    fill: { color: theme.accent2, transparency: 88 },
    line: { color: theme.accent2, width: 1.5, transparency: 50 }
  });

  endSlide.addText('Thank You', {
    x: 2, y: 2.5, w: 9, h: 1.5,
    fontSize: 48,
    fontFace: 'Calibri',
    color: theme.text,
    bold: true,
    align: 'center'
  });

  endSlide.addText(topic, {
    x: 2, y: 4.2, w: 9, h: 0.6,
    fontSize: 16,
    fontFace: 'Calibri',
    color: theme.subtext,
    align: 'center',
    italic: true
  });

  // ==================== SAVE FILE ====================
  const safeTopicName = topic.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_').substring(0, 40);
  const fileName = `${safeTopicName}_${Date.now()}.pptx`;
  const filePath = path.join(DOWNLOADS_DIR, fileName);

  await pptx.writeFile({ fileName: filePath });
  console.log(`[PPT] Generated: ${fileName} (${slides.length + 2} slides)`);

  return { fileName, filePath, slideCount: slides.length + 2 };
}

module.exports = { generatePPT, parseSlideContent, DOWNLOADS_DIR };
