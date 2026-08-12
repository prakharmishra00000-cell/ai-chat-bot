const fetch = require('node-fetch');

/**
 * Searches DuckDuckGo for the given query and returns top results.
 * @param {string} query The search query.
 * @returns {Promise<Array<{title: string, link: string, snippet: string}>>}
 */
async function performWebSearch(query) {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!response.ok) {
      console.warn(`DDG search failed with status: ${response.status}`);
      return [];
    }

    const html = await response.text();
    const results = [];
    
    // DuckDuckGo HTML structure search using regex:
    // Typical result block:
    // <div class="web-result ...">
    //   <a class="result__a" href="...uddg=URL...">TITLE</a>
    //   <a class="result__snippet" ...>SNIPPET</a>
    // </div>
    
    // Let's extract blocks of results first
    const resultBlockRegex = /<div class="[^"]*result[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
    let match;
    let limit = 5; // Get top 5 results

    while ((match = resultBlockRegex.exec(html)) !== null && results.length < limit) {
      const blockContent = match[1];
      
      // Extract URL
      // Look for href="...uddg=(encodedUrl)..."
      const hrefMatch = blockContent.match(/href="([^"]+)"/);
      if (!hrefMatch) continue;
      
      let rawUrl = hrefMatch[1];
      let cleanUrl = rawUrl;
      
      // DuckDuckGo clean-up for redirect URLs
      if (rawUrl.includes('uddg=')) {
        const uddgIndex = rawUrl.indexOf('uddg=');
        const encodedUrl = rawUrl.substring(uddgIndex + 5).split('&')[0];
        cleanUrl = decodeURIComponent(encodedUrl);
      } else if (rawUrl.startsWith('//')) {
        cleanUrl = 'https:' + rawUrl;
      }
      
      // Skip DuckDuckGo internal links
      if (cleanUrl.includes('duckduckgo.com/') && !rawUrl.includes('uddg=')) {
        continue;
      }
      
      // Extract Title
      const titleMatch = blockContent.match(/class="result__a"[^>]*>([\s\S]*?)<\/a>/);
      if (!titleMatch) continue;
      let title = titleMatch[1].replace(/<[^>]*>/g, '').trim(); // Remove any nested tags
      
      // Extract Snippet
      const snippetMatch = blockContent.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
      let snippet = '';
      if (snippetMatch) {
        snippet = snippetMatch[1].replace(/<[^>]*>/g, '').trim();
      }
      
      // Decode HTML entities
      title = decodeEntities(title);
      snippet = decodeEntities(snippet);
      
      if (title && cleanUrl) {
        results.push({
          title,
          link: cleanUrl,
          snippet: snippet || 'No snippet available.'
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error in performWebSearch:', error);
    return [];
  }
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');
}

module.exports = { performWebSearch };
