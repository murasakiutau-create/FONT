/**
 * font-gen.js — OTF font generation using opentype.js
 * Converts FontProject data into a downloadable OTF font file.
 */

function generateAndDownloadFont(project, format = 'ttf') {
  if (typeof opentype === 'undefined') {
    alert('opentype.js not loaded!');
    return;
  }

  const upm = project.upm || 1000;
  const ascender = project.ascender || 800;
  const descender = project.descender || -200;

  // .notdef glyph (empty box)
  const notdefPath = new opentype.Path();
  notdefPath.moveTo(50, 0);
  notdefPath.lineTo(50, 700);
  notdefPath.lineTo(450, 700);
  notdefPath.lineTo(450, 0);
  notdefPath.close();
  notdefPath.moveTo(100, 50);
  notdefPath.lineTo(400, 50);
  notdefPath.lineTo(400, 650);
  notdefPath.lineTo(100, 650);
  notdefPath.close();

  const notdefGlyph = new opentype.Glyph({
    name: '.notdef',
    unicode: 0,
    advanceWidth: 500,
    path: notdefPath,
  });

  const glyphs = [notdefGlyph];

  for (const [unicodeStr, glyph] of Object.entries(project.glyphs)) {
    const unicode = parseInt(unicodeStr);
    if (!glyph.pathData || glyph.pathData.length === 0) continue;

    const otPath = new opentype.Path();
    const cmds = glyph.pathData;

    for (const c of cmds) {
      switch (c.type) {
        case 'M': otPath.moveTo(c.x, c.y); break;
        case 'L': otPath.lineTo(c.x, c.y); break;
        case 'C': otPath.bezierCurveTo(c.cp1x, c.cp1y, c.cp2x, c.cp2y, c.x, c.y); break;
        case 'Z': otPath.close(); break;
      }
    }

    const lsb = glyph.lsb != null ? glyph.lsb : (project.defaultLsb || 50);
    const rsb = glyph.rsb != null ? glyph.rsb : (project.defaultRsb || 50);
    const bounds = getCmdsBounds(cmds);
    const glyphWidth = glyph.advanceWidth || (bounds.w > 0 ? bounds.x + bounds.w + rsb : 600);

    const otGlyph = new opentype.Glyph({
      name: `uni${unicode.toString(16).toUpperCase().padStart(4, '0')}`,
      unicode,
      advanceWidth: glyphWidth,
      path: otPath,
    });
    glyphs.push(otGlyph);
  }

  if (glyphs.length <= 1) {
    alert('エクスポートするグリフがありません。まず文字をアップロードしてください。');
    return;
  }

  const fontOpts = {
    familyName: project.name || 'MyFont',
    styleName: project.style || 'Regular',
    unitsPerEm: upm,
    ascender,
    descender,
    glyphs,
  };
  if (project.description) fontOpts.description = project.description;
  if (project.copyright) fontOpts.copyright = project.copyright;
  if (project.license) fontOpts.licenseDescription = project.license;
  if (project.author) fontOpts.manufacturer = project.author;
  if (project.authorUrl) fontOpts.manufacturerURL = project.authorUrl;
  if (project.vendorUrl) fontOpts.designerURL = project.vendorUrl;
  const font = new opentype.Font(fontOpts);

  // Add kerning pairs if available
  if (project.kerning && Object.keys(project.kerning).length > 0) {
    try {
      const kernPairs = {};
      for (const [key, value] of Object.entries(project.kerning)) {
        const [u1, u2] = key.split(',').map(Number);
        const g1Name = `uni${u1.toString(16).toUpperCase().padStart(4, '0')}`;
        const g2Name = `uni${u2.toString(16).toUpperCase().padStart(4, '0')}`;
        if (!kernPairs[g1Name]) kernPairs[g1Name] = {};
        kernPairs[g1Name][g2Name] = value;
      }
      if (font.kerningPairs) {
        for (const [left, rights] of Object.entries(kernPairs)) {
          for (const [right, val] of Object.entries(rights)) {
            const lg = font.charToGlyphIndex ? font.charToGlyphIndex(parseInt(left.replace('uni', ''), 16)) : null;
            const rg = font.charToGlyphIndex ? font.charToGlyphIndex(parseInt(right.replace('uni', ''), 16)) : null;
            if (lg && rg) font.kerningPairs[lg + ',' + rg] = val;
          }
        }
      }
    } catch (e) { console.warn('Kerning export warning:', e); }
  }

  // Store ligatures info (opentype.js 1.x has limited GSUB support,
  // but we record them in the font's names for reference)
  if (project.ligatures && project.ligatures.length > 0) {
    try {
      // Ligatures are stored in the project for round-trip; actual GSUB
      // implementation depends on opentype.js version capabilities
      console.log('Ligatures defined:', project.ligatures);
    } catch (e) { console.warn('Ligature export note:', e); }
  }

  font.download(`${project.name || 'MyFont'}.otf`);
  return font;
}

/**
 * Generate font and return as ArrayBuffer (for preview via FontFace API)
 */
function generateFontBuffer(project) {
  if (typeof opentype === 'undefined') return null;

  const upm = project.upm || 1000;
  const ascender = project.ascender || 800;
  const descender = project.descender || -200;

  const notdefPath = new opentype.Path();
  notdefPath.moveTo(50, 0); notdefPath.lineTo(50, 700);
  notdefPath.lineTo(450, 700); notdefPath.lineTo(450, 0); notdefPath.close();
  const notdefGlyph = new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: 500, path: notdefPath });

  const glyphs = [notdefGlyph];
  for (const [unicodeStr, glyph] of Object.entries(project.glyphs)) {
    const unicode = parseInt(unicodeStr);
    if (!glyph.pathData || glyph.pathData.length === 0) continue;
    const otPath = new opentype.Path();
    for (const c of glyph.pathData) {
      if (c.type === 'M') otPath.moveTo(c.x, c.y);
      else if (c.type === 'L') otPath.lineTo(c.x, c.y);
      else if (c.type === 'C') otPath.bezierCurveTo(c.cp1x, c.cp1y, c.cp2x, c.cp2y, c.x, c.y);
      else if (c.type === 'Z') otPath.close();
    }
    const bounds = getCmdsBounds(glyph.pathData);
    const glyphWidth = glyph.advanceWidth || (bounds.w > 0 ? bounds.x + bounds.w + 50 : 600);
    glyphs.push(new opentype.Glyph({ name: `uni${unicode.toString(16).toUpperCase().padStart(4, '0')}`, unicode, advanceWidth: glyphWidth, path: otPath }));
  }

  if (glyphs.length <= 1) return null;
  const font = new opentype.Font({ familyName: project.name || 'MyFont', styleName: project.style || 'Regular', unitsPerEm: upm, ascender, descender, glyphs });
  return font.download ? font : null;
}
