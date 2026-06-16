const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

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

/**
 * Fetch a real photo from Unsplash for a given keyword
 * Returns base64 image data or null if failed
 */
async function fetchImage(keyword, topicContext) {
  const searchTerms = `${keyword} ${topicContext}`.trim();
  const encodedQuery = encodeURIComponent(searchTerms);
  
  // Try multiple image sources
  const sources = [
    `https://source.unsplash.com/960x540/?${encodedQuery}`,
    `https://source.unsplash.com/960x540/?${encodeURIComponent(keyword)}`,
  ];
  
  for (const url of sources) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(url, { 
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const buffer = await response.buffer();
        if (buffer.length > 5000) { // Valid image (>5KB)
          const base64 = buffer.toString('base64');
          console.log(`[PPT-IMG] ✅ Fetched image for: "${keyword}" (${Math.round(buffer.length/1024)}KB)`);
          return `image/jpeg;base64,${base64}`;
        }
      }
    } catch (e) {
      console.warn(`[PPT-IMG] ⚠ Failed for "${keyword}": ${e.message}`);
    }
  }
  return null;
}

/**
 * Extract 1-2 keywords from a slide title for image search
 */
function extractKeywords(slideTitle, mainTopic) {
  // Remove common filler words
  const stopWords = /\b(the|a|an|and|or|of|in|on|for|to|with|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|can|shall|its|it|this|that|these|those|their|our|your|my|key|main|major|important|overview|introduction|conclusion|summary|future|current|role)\b/gi;
  
  const cleaned = slideTitle
    .replace(/[^a-zA-Z\s]/g, '')
    .replace(stopWords, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = cleaned.split(' ').filter(w => w.length > 2);
  // Take first 2-3 meaningful words
  return words.slice(0, 3).join(' ') || mainTopic;
}

/**
 * Parse AI-generated slide content from structured text
 */
function parseSlideContent(aiResponse) {
  const slides = [];

  try {
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (Array.isArray(parsed.slides || parsed)) {
        return parsed.slides || parsed;
      }
    }
  } catch (e) { /* fall through */ }

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
 * Use AI to extract clean topic name from user prompt
 */
async function extractTopicWithAI(userPrompt, queryGeminiAPI, keys) {
  try {
    const extractPrompt = `Extract ONLY the topic name from this user request. Return NOTHING except the topic name itself. No quotes, no extra words.

User request: "${userPrompt}"

Examples:
- "create a 10 slide presentation on artificial intelligence" → Artificial Intelligence
- "make me a ppt about climate change with more visuals 15 pages" → Climate Change
- "generate a professional presentation on Indian Economy" → Indian Economy
- "build a powerpoint on machine learning for beginners" → Machine Learning

Topic name:`;

    const contents = [{ role: 'user', parts: [{ text: extractPrompt }] }];
    const topicName = await queryGeminiAPI(keys, contents, 'You extract topic names. Return only the topic name, nothing else.');
    
    const cleaned = topicName.trim().replace(/^["']|["']$/g, '').replace(/\.$/, '').trim();
    if (cleaned.length > 2 && cleaned.length < 100) {
      console.log(`[PPT] AI extracted topic: "${cleaned}"`);
      return cleaned;
    }
  } catch (e) {
    console.warn('[PPT] AI topic extraction failed, using fallback');
  }
  return null;
}

/**
 * Generate a professional PowerPoint presentation with real images
 */
async function generatePPT(topic, slides, options = {}) {
  cleanOldFiles();

  const theme = THEME;
  const pptx = new PptxGenJS();

  pptx.author = 'Presentation Generator';
  pptx.subject = topic;
  pptx.title = topic;
  pptx.layout = 'LAYOUT_WIDE';

  // Define master slides — NO branding
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

  // ==================== FETCH IMAGES IN PARALLEL ====================
  console.log(`[PPT] Fetching images for ${slides.length} slides...`);
  
  // Fetch title image + one image per slide (in parallel, max 6 concurrent)
  const imagePromises = [];
  
  // Title slide image
  imagePromises.push(fetchImage(topic, ''));
  
  // Content slide images (extract keywords from each title)
  for (const slide of slides) {
    const keywords = extractKeywords(slide.title, topic);
    imagePromises.push(fetchImage(keywords, topic));
  }
  
  const images = await Promise.all(imagePromises);
  const titleImage = images[0];
  const slideImages = images.slice(1);
  
  const successCount = images.filter(Boolean).length;
  console.log(`[PPT] Fetched ${successCount}/${images.length} images successfully`);

  // ==================== SLIDE 1: TITLE SLIDE ====================
  const titleSlide = pptx.addSlide({ masterName: 'TITLE_SLIDE' });

  // Title image (right side, large)
  if (titleImage) {
    // Image on right half with rounded overlay effect
    titleSlide.addImage({
      data: titleImage, x: 6.5, y: 0.5, w: 6.3, h: 6.2,
      rounding: true, sizing: { type: 'cover', w: 6.3, h: 6.2 }
    });
    // Semi-transparent overlay on image for blending
    titleSlide.addShape(pptx.shapes.RECTANGLE, {
      x: 6.5, y: 0.5, w: 6.3, h: 6.2,
      fill: { color: theme.bg, transparency: 40 }
    });
  } else {
    // Decorative shapes if no image
    titleSlide.addShape(pptx.shapes.OVAL, {
      x: 9.0, y: -1, w: 5.5, h: 5.5,
      fill: { color: theme.accent, transparency: 40 },
      line: { color: theme.accent, width: 2.5 }
    });
    titleSlide.addShape(pptx.shapes.OVAL, {
      x: 10.5, y: 3, w: 3, h: 3,
      fill: { color: theme.accent2, transparency: 35 },
      line: { color: theme.accent2, width: 2 }
    });
  }

  // Topic name
  titleSlide.addText(topic, {
    x: 0.8, y: 1.8, w: 6, h: 2.2,
    fontSize: 38, fontFace: 'Calibri', color: theme.text,
    bold: true, align: 'left', lineSpacingMultiple: 1.15,
  });

  // Accent line
  titleSlide.addShape(pptx.shapes.RECTANGLE, {
    x: 0.8, y: 4.1, w: 3.5, h: 0.06,
    fill: { color: theme.accent }
  });

  // Date
  titleSlide.addText(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), {
    x: 0.8, y: 4.4, w: 5, h: 0.5,
    fontSize: 14, fontFace: 'Calibri', color: theme.subtext
  });

  // ==================== CONTENT SLIDES ====================
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const contentSlide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
    const hasImage = !!slideImages[i];

    // Slide number
    contentSlide.addText(`${i + 1} / ${slides.length}`, {
      x: 11.5, y: 7.15, w: 1.5, h: 0.3,
      fontSize: 8, fontFace: 'Calibri', color: theme.subtext, align: 'right'
    });

    // Title
    contentSlide.addText(slide.title, {
      x: 0.5, y: 0.3, w: hasImage ? 8.5 : 12, h: 0.9,
      fontSize: 26, fontFace: 'Calibri', color: theme.accent, bold: true,
    });

    // Title underline
    contentSlide.addShape(pptx.shapes.RECTANGLE, {
      x: 0.5, y: 1.25, w: 2.5, h: 0.04,
      fill: { color: theme.accent2 }
    });

    // Content layout depends on whether we have an image
    const contentWidth = hasImage ? 7.5 : 12;
    
    if (slide.bullets && slide.bullets.length > 0) {
      const bulletRows = slide.bullets.map(b => ({
        text: b,
        options: {
          fontSize: 14, color: theme.text, fontFace: 'Calibri',
          bullet: { type: 'bullet', color: theme.accent },
          lineSpacingMultiple: 1.5, paraSpaceAfter: 6,
        }
      }));

      contentSlide.addText(bulletRows, {
        x: 0.7, y: 1.5, w: contentWidth, h: 5.3, valign: 'top',
      });
    }

    // Add real image on right side
    if (hasImage) {
      contentSlide.addImage({
        data: slideImages[i], x: 8.6, y: 1.3, w: 4.3, h: 5.4,
        rounding: true, sizing: { type: 'cover', w: 4.3, h: 5.4 }
      });
      // Thin border around image
      contentSlide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 8.6, y: 1.3, w: 4.3, h: 5.4,
        fill: { type: 'none' },
        line: { color: theme.accent, width: 1.5 },
        rectRadius: 0.1
      });
    } else {
      // Fallback decorative shape if image failed
      contentSlide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 10.3, y: 1.8, w: 2.5, h: 2.5,
        fill: { color: theme.accent, transparency: 35 },
        rectRadius: 0.3, line: { color: theme.accent, width: 2 }
      });
      contentSlide.addShape(pptx.shapes.OVAL, {
        x: 10.8, y: 4.5, w: 1.8, h: 1.8,
        fill: { color: theme.accent2, transparency: 30 },
        line: { color: theme.accent2, width: 2 }
      });
    }
  }

  // ==================== FINAL SLIDE: THANK YOU ====================
  const endSlide = pptx.addSlide({ masterName: 'TITLE_SLIDE' });

  // Decorative shapes
  endSlide.addShape(pptx.shapes.OVAL, {
    x: 4.2, y: 1.0, w: 5, h: 5,
    fill: { color: theme.accent, transparency: 40 },
    line: { color: theme.accent, width: 3 }
  });
  endSlide.addShape(pptx.shapes.OVAL, {
    x: 8.5, y: 3.5, w: 2.5, h: 2.5,
    fill: { color: theme.accent2, transparency: 30 },
    line: { color: theme.accent2, width: 2 }
  });
  endSlide.addShape(pptx.shapes.OVAL, {
    x: 1, y: 2, w: 2, h: 2,
    fill: { color: theme.accent3, transparency: 40 },
    line: { color: theme.accent3, width: 1.5 }
  });

  endSlide.addText('Thank You', {
    x: 2, y: 2.5, w: 9, h: 1.5,
    fontSize: 48, fontFace: 'Calibri', color: theme.text, bold: true, align: 'center'
  });

  endSlide.addText(topic, {
    x: 2, y: 4.2, w: 9, h: 0.6,
    fontSize: 16, fontFace: 'Calibri', color: theme.subtext, align: 'center', italic: true
  });

  // ==================== SAVE FILE ====================
  const safeTopicName = topic.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_').substring(0, 40);
  const fileName = `${safeTopicName}_${Date.now()}.pptx`;
  const filePath = path.join(DOWNLOADS_DIR, fileName);

  await pptx.writeFile({ fileName: filePath });
  console.log(`[PPT] Generated: ${fileName} (${slides.length + 2} slides, ${successCount} images)`);

  return { fileName, filePath, slideCount: slides.length + 2 };
}

module.exports = { generatePPT, parseSlideContent, extractTopicWithAI, DOWNLOADS_DIR };
