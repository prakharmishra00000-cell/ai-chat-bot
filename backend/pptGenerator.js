const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

// Ensure directories exist
const DOWNLOADS_DIR = path.join(__dirname, 'ppt-downloads');
const IMG_CACHE_DIR = path.join(__dirname, 'ppt-img-cache');
if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
if (!fs.existsSync(IMG_CACHE_DIR)) fs.mkdirSync(IMG_CACHE_DIR, { recursive: true });

// Clean old files (older than 1 hour)
function cleanOldFiles() {
  try {
    [DOWNLOADS_DIR, IMG_CACHE_DIR].forEach(dir => {
      const files = fs.readdirSync(dir);
      const now = Date.now();
      files.forEach(file => {
        const fp = path.join(dir, file);
        try {
          const stat = fs.statSync(fp);
          if (now - stat.mtimeMs > 3600000) fs.unlinkSync(fp);
        } catch (e) { /* skip */ }
      });
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
};

/**
 * Download an image to disk and return the file path.
 * Tries multiple free image sources for the keyword.
 * Returns null if all sources fail — bot response will NOT error.
 */
async function downloadImageForKeyword(keyword, index) {
  const safeKey = keyword.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const outPath = path.join(IMG_CACHE_DIR, `img_${safeKey}_${index}_${Date.now()}.jpg`);
  
  // Build search URLs — multiple fallbacks
  const query = encodeURIComponent(keyword);
  const urls = [
    // Unsplash source — follows redirect to real JPEG
    `https://source.unsplash.com/800x450/?${query}`,
    // Lorem Picsum — always returns a real image (random but reliable)
    `https://picsum.photos/seed/${safeKey}${index}/800/450`,
  ];
  
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/jpeg,image/png,image/*,*/*'
        }
      });
      clearTimeout(timeoutId);
      
      if (!res.ok) continue;
      
      // Check content type — must be an image
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('image')) {
        console.warn(`[PPT-IMG] Not an image for "${keyword}" from ${url}: ${contentType}`);
        continue;
      }
      
      // Read as buffer
      const arrayBuf = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      
      // Must be at least 3KB to be a real image
      if (buffer.length < 3000) {
        console.warn(`[PPT-IMG] Image too small for "${keyword}": ${buffer.length} bytes`);
        continue;
      }
      
      // Save to disk
      fs.writeFileSync(outPath, buffer);
      console.log(`[PPT-IMG] ✅ Downloaded for "${keyword}" (${Math.round(buffer.length / 1024)}KB)`);
      return outPath;
      
    } catch (e) {
      if (e.name === 'AbortError') {
        console.warn(`[PPT-IMG] Timeout for "${keyword}"`);
      } else {
        console.warn(`[PPT-IMG] Error for "${keyword}": ${e.message}`);
      }
    }
  }
  
  console.warn(`[PPT-IMG] ❌ All sources failed for "${keyword}"`);
  return null;
}

/**
 * Extract 1-3 meaningful keywords from a slide title for image search
 */
function extractKeywords(slideTitle, mainTopic) {
  const stopWords = /\b(the|a|an|and|or|of|in|on|for|to|with|is|are|was|were|be|been|have|has|had|do|does|did|will|would|could|should|may|might|can|its|it|this|that|these|those|their|our|your|my|key|main|major|important|overview|introduction|conclusion|summary|future|current|role|impact|effect|types|benefits|challenges|trends|sources|references)\b/gi;
  
  const cleaned = slideTitle
    .replace(/[^a-zA-Z\s]/g, '')
    .replace(stopWords, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = cleaned.split(' ').filter(w => w.length > 2);
  const kw = words.slice(0, 2).join(' ');
  // Combine with main topic for better search relevance
  return kw ? `${kw} ${mainTopic}` : mainTopic;
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
      if (Array.isArray(parsed.slides || parsed)) return parsed.slides || parsed;
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
    const extractPrompt = `Extract ONLY the topic name from this user request. Return NOTHING except the topic name. No quotes, no explanation.

"${userPrompt}"

Examples:
"create a 10 slide presentation on artificial intelligence" → Artificial Intelligence
"make me a ppt about climate change with visuals" → Climate Change
"generate presentation on Indian Economy" → Indian Economy

Topic:`;

    const contents = [{ role: 'user', parts: [{ text: extractPrompt }] }];
    const topicName = await queryGeminiAPI(keys, contents, 'Extract topic name only. Return nothing else.');
    
    const cleaned = topicName.trim().replace(/^["']|["']$/g, '').replace(/\.$/, '').trim();
    if (cleaned.length > 2 && cleaned.length < 100) {
      console.log(`[PPT] AI topic: "${cleaned}"`);
      return cleaned;
    }
  } catch (e) {
    console.warn('[PPT] Topic extraction failed');
  }
  return null;
}

/**
 * Generate a professional PPTX with real images
 */
async function generatePPT(topic, slides, options = {}) {
  cleanOldFiles();

  const theme = THEME;
  const pptx = new PptxGenJS();

  pptx.author = 'Presentation Generator';
  pptx.subject = topic;
  pptx.title = topic;
  pptx.layout = 'LAYOUT_WIDE';

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

  // ==================== DOWNLOAD ALL IMAGES IN PARALLEL ====================
  console.log(`[PPT] Downloading images for ${slides.length + 1} slides...`);
  
  const imagePromises = [];
  // Title image
  imagePromises.push(downloadImageForKeyword(topic, 0));
  // Content slide images
  for (let i = 0; i < slides.length; i++) {
    const kw = extractKeywords(slides[i].title, topic);
    imagePromises.push(downloadImageForKeyword(kw, i + 1));
  }
  
  let imageFiles;
  try {
    imageFiles = await Promise.all(imagePromises);
  } catch (e) {
    console.warn('[PPT] Image download batch error:', e.message);
    imageFiles = new Array(slides.length + 1).fill(null);
  }
  
  const titleImgPath = imageFiles[0];
  const slideImgPaths = imageFiles.slice(1);
  const imgCount = imageFiles.filter(Boolean).length;
  console.log(`[PPT] ✅ Got ${imgCount}/${imageFiles.length} images`);

  // ==================== SLIDE 1: TITLE SLIDE ====================
  const titleSlide = pptx.addSlide({ masterName: 'TITLE_SLIDE' });

  if (titleImgPath && fs.existsSync(titleImgPath)) {
    // Real photo on right side
    titleSlide.addImage({
      path: titleImgPath,
      x: 6.5, y: 0.3, w: 6.5, h: 6.5
    });
    // Dark overlay so text is readable
    titleSlide.addShape(pptx.shapes.RECTANGLE, {
      x: 6.5, y: 0.3, w: 6.5, h: 6.5,
      fill: { color: theme.bg, transparency: 35 }
    });
  } else {
    // Decorative shapes fallback
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

  // Topic name (left side)
  titleSlide.addText(topic, {
    x: 0.8, y: 1.8, w: 6, h: 2.2,
    fontSize: 38, fontFace: 'Calibri', color: theme.text,
    bold: true, align: 'left', lineSpacingMultiple: 1.15,
  });

  titleSlide.addShape(pptx.shapes.RECTANGLE, {
    x: 0.8, y: 4.1, w: 3.5, h: 0.06,
    fill: { color: theme.accent }
  });

  titleSlide.addText(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), {
    x: 0.8, y: 4.4, w: 5, h: 0.5,
    fontSize: 14, fontFace: 'Calibri', color: theme.subtext
  });

  // ==================== CONTENT SLIDES ====================
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const contentSlide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
    const imgPath = slideImgPaths[i];
    const hasImg = imgPath && fs.existsSync(imgPath);

    // Slide number
    contentSlide.addText(`${i + 1} / ${slides.length}`, {
      x: 11.5, y: 7.15, w: 1.5, h: 0.3,
      fontSize: 8, fontFace: 'Calibri', color: theme.subtext, align: 'right'
    });

    // Title
    contentSlide.addText(slide.title, {
      x: 0.5, y: 0.3, w: hasImg ? 8.5 : 12, h: 0.9,
      fontSize: 26, fontFace: 'Calibri', color: theme.accent, bold: true,
    });

    // Underline
    contentSlide.addShape(pptx.shapes.RECTANGLE, {
      x: 0.5, y: 1.25, w: 2.5, h: 0.04,
      fill: { color: theme.accent2 }
    });

    // Bullet content
    const textWidth = hasImg ? 7.8 : 12;
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
        x: 0.7, y: 1.5, w: textWidth, h: 5.3, valign: 'top',
      });
    }

    // REAL IMAGE on right side
    if (hasImg) {
      contentSlide.addImage({
        path: imgPath,
        x: 8.8, y: 1.3, w: 4.1, h: 5.4
      });
      // Cyan border frame
      contentSlide.addShape(pptx.shapes.RECTANGLE, {
        x: 8.8, y: 1.3, w: 4.1, h: 5.4,
        fill: { type: 'none' },
        line: { color: theme.accent, width: 1.5 }
      });
    } else {
      // Fallback decorative shapes
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
  
  // Cleanup cached images
  imageFiles.forEach(f => { try { if (f) fs.unlinkSync(f); } catch(e) {} });
  
  console.log(`[PPT] ✅ Generated: ${fileName} (${slides.length + 2} slides, ${imgCount} real images)`);

  return { fileName, filePath, slideCount: slides.length + 2 };
}

module.exports = { generatePPT, parseSlideContent, extractTopicWithAI, DOWNLOADS_DIR };
