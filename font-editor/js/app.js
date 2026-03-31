/**
 * app.js — Main application logic
 * Glyphr Studio-like UI with FontForge-like features
 */

// ─── Default character set ───────────────────────────────────────────────────

const CHAR_GROUPS = [
  { label: 'UPPERCASE', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
  { label: 'lowercase', chars: 'abcdefghijklmnopqrstuvwxyz' },
  { label: '0 – 9', chars: '0123456789' },
  { label: 'Symbols', chars: '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~' },
  { label: 'Space', chars: ' ' },
];

const ALL_CHARS = [];
for (const g of CHAR_GROUPS) {
  for (const ch of g.chars) {
    ALL_CHARS.push({ char: ch, unicode: ch.codePointAt(0) });
  }
}

// ─── Application State ───────────────────────────────────────────────────────

const App = {
  project: {
    name: 'MyFont',
    style: 'Regular',
    upm: 1000,
    ascender: 800,
    descender: -200,
    capHeight: 700,
    xHeight: 500,
    defaultLsb: 50,
    defaultRsb: 50,
    glyphs: {}, // unicode -> glyph object
  },
  editor: null,
  currentUnicode: null,
  activeRightTab: 'transform',
  previewFontFamily: null,
  previewFontKey: 0,
  undoStack: [],
  redoStack: [],

  init() {
    this.editor = new GlyphEditor(document.getElementById('editor-svg'), {
      upm: this.project.upm,
      ascender: this.project.ascender,
      descender: this.project.descender,
      capHeight: this.project.capHeight,
      xHeight: this.project.xHeight,
      onGlyphChange: (glyph) => this._onGlyphChange(glyph),
      onBBoxChange: (bbox) => this._onBBoxChange(bbox),
      onSelectionChange: (cmd, idx) => this._onSelectionChange(cmd, idx),
      onZoomChange: (z) => this._onZoomChange(z),
    });

    this._buildGlyphGrid();
    this._bindUIEvents();
    this._bindDropZone();
    this._bindKeyboard();
    this.selectChar(65); // Start with 'A'
    this._updateSettingsForm();

    // Bind zoom slider
    const zSlider = document.getElementById('zoom-slider');
    if (zSlider) {
      zSlider.value = 50;
      zSlider.addEventListener('input', () => {
        const z = Math.pow(2, (zSlider.value - 50) / 25);
        this.editor.setZoom(z);
        document.getElementById('zoom-label').textContent = Math.round(z * 100) + '%';
      });
    }

    // Window resize
    window.addEventListener('resize', () => {
      if (this.editor && this.currentUnicode != null) this.editor.render();
    });
  },

  // ─── Glyph Grid ─────────────────────────────────────────────────────────────

  _buildGlyphGrid() {
    const container = document.getElementById('glyph-grid');
    if (!container) return;
    container.innerHTML = '';

    for (const group of CHAR_GROUPS) {
      const header = document.createElement('div');
      header.className = 'glyph-group-header';
      header.textContent = group.label;
      container.appendChild(header);

      const grid = document.createElement('div');
      grid.className = 'glyph-row';

      for (const ch of group.chars) {
        const unicode = ch.codePointAt(0);
        const cell = document.createElement('div');
        cell.className = 'glyph-cell';
        cell.id = `gcell-${unicode}`;
        cell.title = `U+${unicode.toString(16).toUpperCase().padStart(4, '0')} "${ch}"`;

        const label = document.createElement('span');
        label.className = 'glyph-char';
        label.textContent = ch === ' ' ? '·' : ch;
        cell.appendChild(label);

        const badge = document.createElement('span');
        badge.className = 'glyph-badge';
        badge.id = `gbadge-${unicode}`;
        cell.appendChild(badge);

        cell.addEventListener('click', () => this.selectChar(unicode));
        cell.addEventListener('dragover', e => { e.preventDefault(); cell.classList.add('drag-over'); });
        cell.addEventListener('dragleave', () => cell.classList.remove('drag-over'));
        cell.addEventListener('drop', e => {
          e.preventDefault(); cell.classList.remove('drag-over');
          const file = e.dataTransfer.files[0];
          if (file) this._importSVGForChar(unicode, file);
        });
        grid.appendChild(cell);
      }
      container.appendChild(grid);
    }
    this._refreshGlyphGrid();
  },

  _refreshGlyphGrid() {
    for (const g of ALL_CHARS) {
      const cell = document.getElementById(`gcell-${g.unicode}`);
      if (!cell) continue;
      const badge = document.getElementById(`gbadge-${g.unicode}`);
      if (this.project.glyphs[g.unicode]) {
        cell.classList.add('has-glyph');
        if (badge) badge.textContent = '●';
      } else {
        cell.classList.remove('has-glyph');
        if (badge) badge.textContent = '';
      }
      if (g.unicode === this.currentUnicode) cell.classList.add('active');
      else cell.classList.remove('active');
    }
  },

  // ─── Glyph Selection ─────────────────────────────────────────────────────────

  selectChar(unicode) {
    this._saveCurrentGlyph();
    this.currentUnicode = unicode;

    const char = String.fromCodePoint(unicode);
    document.getElementById('current-char-label').textContent = char === ' ' ? 'Space' : char;
    document.getElementById('current-unicode-label').textContent = `U+${unicode.toString(16).toUpperCase().padStart(4, '0')}`;

    const glyph = this.project.glyphs[unicode] || {
      unicode,
      char,
      advanceWidth: 600,
      lsb: this.project.defaultLsb,
      rsb: this.project.defaultRsb,
      pathData: [],
    };

    document.getElementById('advance-width').value = glyph.advanceWidth;
    this.editor.loadGlyph(glyph);
    this._refreshGlyphGrid();
    this._refreshNavButtons();
  },

  _saveCurrentGlyph() {
    if (this.currentUnicode == null || !this.editor.glyph) return;
    this.project.glyphs[this.currentUnicode] = this.editor.getGlyph();
  },

  _prevNextChar(dir) {
    const chars = ALL_CHARS;
    const idx = chars.findIndex(c => c.unicode === this.currentUnicode);
    const next = chars[idx + dir];
    if (next) this.selectChar(next.unicode);
  },

  _refreshNavButtons() {
    const chars = ALL_CHARS;
    const idx = chars.findIndex(c => c.unicode === this.currentUnicode);
    const prevBtn = document.getElementById('nav-prev');
    const nextBtn = document.getElementById('nav-next');
    if (prevBtn) prevBtn.disabled = idx <= 0;
    if (nextBtn) nextBtn.disabled = idx >= chars.length - 1;
  },

  // ─── SVG Import ──────────────────────────────────────────────────────────────

  _importSVGForChar(unicode, file) {
    if (!file.name.toLowerCase().endsWith('.svg') && file.type !== 'image/svg+xml') {
      this._notify('SVGファイルを選択してください', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const pathsFromSVG = extractPathsFromSVG(e.target.result);
        if (!pathsFromSVG.length) {
          this._notify('パスが見つかりませんでした', 'error');
          return;
        }
        // Merge all extracted paths into one command array
        let allCmds = [];
        for (const p of pathsFromSVG) allCmds = allCmds.concat(p);

        // Fit to font space
        const fitted = this._fitToFontSpace(allCmds);
        const char = String.fromCodePoint(unicode);
        const aw = fitted.advanceWidth;

        this.project.glyphs[unicode] = {
          unicode,
          char,
          advanceWidth: aw,
          lsb: this.project.defaultLsb,
          rsb: this.project.defaultRsb,
          pathData: fitted.cmds,
        };

        this._refreshGlyphGrid();
        if (unicode === this.currentUnicode) {
          this.editor.loadGlyph(this.project.glyphs[unicode]);
          document.getElementById('advance-width').value = aw;
        }
        this._notify(`"${char}" をインポートしました`);
      } catch (err) {
        console.error(err);
        this._notify('SVGの読み込みに失敗しました: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  },

  _fitToFontSpace(cmds) {
    const { ascender, descender, defaultLsb, defaultRsb } = this.project;
    const fontH = ascender - descender;
    const b = getCmdsBounds(cmds);
    if (b.w === 0 || b.h === 0) return { cmds, advanceWidth: 600 };

    // Scale to fit height
    const scale = fontH / b.h;
    // Translate: move bottom-left of glyph to (lsb, descender), flip Y
    // SVG Y increases down, font Y increases up:
    //   fontX = (svgX - b.x) * scale + lsb
    //   fontY = ascender - (svgY - b.y) * scale   [flip]
    const lsb = defaultLsb || 50;
    const tx = -b.x * scale + lsb;
    const ty_svg = b.y; // top of SVG bbox

    const fitted = cmds.map(c => {
      const pt = (x, y) => ({ x: x * scale + tx, y: ascender - (y - ty_svg) * scale });
      if (c.type === 'M' || c.type === 'L') { const p = pt(c.x, c.y); return { ...c, ...p }; }
      if (c.type === 'C') {
        const p1 = pt(c.cp1x, c.cp1y), p2 = pt(c.cp2x, c.cp2y), p = pt(c.x, c.y);
        return { ...c, cp1x: p1.x, cp1y: p1.y, cp2x: p2.x, cp2y: p2.y, x: p.x, y: p.y };
      }
      return { ...c };
    });

    const newB = getCmdsBounds(fitted);
    const advanceWidth = newB.w + lsb + (defaultRsb || 50);
    return { cmds: fitted, advanceWidth };
  },

  // ─── Batch import ────────────────────────────────────────────────────────────

  _batchImportSVGs(files) {
    let count = 0;
    for (const file of files) {
      const match = file.name.match(/[Uu]\+?([0-9A-Fa-f]{4,5})|^([A-Za-z0-9])\.svg$/i);
      if (match) {
        let unicode;
        if (match[1]) unicode = parseInt(match[1], 16);
        else if (match[2]) unicode = match[2].codePointAt(0);
        if (unicode) { this._importSVGForChar(unicode, file); count++; }
      }
    }
    if (count) this._notify(`${count}個のSVGをインポートしました`);
    else this._notify('ファイル名からUnicodeを解析できませんでした。ファイル名を "A.svg" や "U+0041.svg" の形式にしてください。', 'error');
  },

  // ─── Editor callbacks ─────────────────────────────────────────────────────────

  _onGlyphChange(glyph) {
    this.project.glyphs[glyph.unicode] = glyph;
    this._refreshGlyphGrid();
  },

  _onBBoxChange(bbox) {
    if (!bbox) return;
    const r = v => Math.round(v);
    const xI = document.getElementById('tx');
    const yI = document.getElementById('ty');
    const wI = document.getElementById('tw');
    const hI = document.getElementById('th');
    if (document.activeElement !== xI) { if (xI) xI.value = r(bbox.x); }
    if (document.activeElement !== yI) { if (yI) yI.value = r(bbox.y); }
    if (document.activeElement !== wI) { if (wI) wI.value = r(bbox.w); }
    if (document.activeElement !== hI) { if (hI) hI.value = r(bbox.h); }
  },

  _onSelectionChange(cmd, idx) {
    if (cmd && (cmd.type === 'M' || cmd.type === 'L' || cmd.type === 'C')) {
      document.getElementById('node-info-empty').style.display = 'none';
      document.getElementById('node-editor').style.display = 'block';
      const r = v => Math.round(v * 10) / 10;
      document.getElementById('nx').value = r(cmd.x);
      document.getElementById('ny').value = r(cmd.y);
      if (cmd.type === 'C') {
        document.getElementById('handle-section').style.display = 'block';
        document.getElementById('h1x').value = r(cmd.cp1x);
        document.getElementById('h1y').value = r(cmd.cp1y);
        document.getElementById('h2x').value = r(cmd.cp2x);
        document.getElementById('h2y').value = r(cmd.cp2y);
      } else {
        document.getElementById('handle-section').style.display = 'none';
      }
    } else {
      document.getElementById('node-info-empty').style.display = 'block';
      document.getElementById('node-editor').style.display = 'none';
    }
  },

  _onZoomChange(z) {
    document.getElementById('zoom-label').textContent = Math.round(z * 100) + '%';
    const sl = document.getElementById('zoom-slider');
    if (sl) sl.value = Math.round(50 + 25 * Math.log2(z));
  },

  // ─── UI Event Binding ─────────────────────────────────────────────────────────

  _bindUIEvents() {
    // Tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.tool;
        this.editor.setEditMode(mode);
      });
    });

    // Zoom buttons
    document.getElementById('zoom-in')?.addEventListener('click', () => {
      const z = Math.min(5, this.editor.zoom * 1.3);
      this.editor.setZoom(z);
      this._onZoomChange(z);
    });
    document.getElementById('zoom-out')?.addEventListener('click', () => {
      const z = Math.max(0.05, this.editor.zoom / 1.3);
      this.editor.setZoom(z);
      this._onZoomChange(z);
    });
    document.getElementById('fit-view')?.addEventListener('click', () => {
      this.editor.fitToView();
      this._onZoomChange(this.editor.zoom);
    });

    // Nav
    document.getElementById('nav-prev')?.addEventListener('click', () => this._prevNextChar(-1));
    document.getElementById('nav-next')?.addEventListener('click', () => this._prevNextChar(1));

    // Advance width
    document.getElementById('advance-width')?.addEventListener('change', e => {
      const v = parseInt(e.target.value);
      if (!isNaN(v) && v > 0) {
        this.editor.setAdvanceWidth(v);
        if (this.editor.glyph) this.editor.glyph.advanceWidth = v;
      }
    });

    // SVG upload button
    document.getElementById('upload-svg-btn')?.addEventListener('click', () => {
      if (this.currentUnicode == null) return;
      const inp = document.getElementById('svg-file-input');
      inp.value = '';
      inp.click();
    });
    document.getElementById('svg-file-input')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file && this.currentUnicode != null) this._importSVGForChar(this.currentUnicode, file);
    });

    // Batch upload
    document.getElementById('batch-upload-btn')?.addEventListener('click', () => {
      const inp = document.getElementById('batch-file-input');
      inp.value = '';
      inp.click();
    });
    document.getElementById('batch-file-input')?.addEventListener('change', e => {
      this._batchImportSVGs(Array.from(e.target.files));
    });

    // Delete glyph
    document.getElementById('delete-glyph-btn')?.addEventListener('click', () => {
      if (this.currentUnicode == null) return;
      delete this.project.glyphs[this.currentUnicode];
      this.editor.loadGlyph({ unicode: this.currentUnicode, char: String.fromCodePoint(this.currentUnicode), advanceWidth: 600, pathData: [] });
      this._refreshGlyphGrid();
      this._notify('グリフを削除しました');
    });

    // Export buttons
    document.getElementById('export-ttf')?.addEventListener('click', () => {
      this._saveCurrentGlyph();
      generateAndDownloadFont(this.project, 'ttf');
      this._notify('TTFをダウンロードしています...');
    });
    document.getElementById('export-otf')?.addEventListener('click', () => {
      this._saveCurrentGlyph();
      generateAndDownloadFont(this.project, 'otf');
      this._notify('OTFをダウンロードしています...');
    });

    // Save / Load project
    document.getElementById('save-project')?.addEventListener('click', () => this._saveProject());
    document.getElementById('load-project')?.addEventListener('click', () => {
      const inp = document.getElementById('load-file-input');
      inp.value = '';
      inp.click();
    });
    document.getElementById('load-file-input')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) this._loadProject(file);
    });

    // Right tabs
    document.querySelectorAll('.rtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.rtab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.rtab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        document.getElementById(`rtab-${tab}`)?.classList.add('active');
        this.activeRightTab = tab;
      });
    });

    // ── Transform tab ──
    document.getElementById('tx')?.addEventListener('change', e => {
      const bbox = this.editor.getBBox(); if (!bbox) return;
      this.editor.setPosition(parseFloat(e.target.value) || 0, bbox.y);
    });
    document.getElementById('ty')?.addEventListener('change', e => {
      const bbox = this.editor.getBBox(); if (!bbox) return;
      this.editor.setPosition(bbox.x, parseFloat(e.target.value) || 0);
    });
    document.getElementById('tw')?.addEventListener('change', e => {
      const bbox = this.editor.getBBox(); if (!bbox) return;
      const lock = document.getElementById('lock-aspect')?.checked;
      this.editor.scaleToSize(parseFloat(e.target.value) || bbox.w, lock ? (parseFloat(e.target.value) / bbox.w) * bbox.h : bbox.h, lock);
    });
    document.getElementById('th')?.addEventListener('change', e => {
      const bbox = this.editor.getBBox(); if (!bbox) return;
      const lock = document.getElementById('lock-aspect')?.checked;
      this.editor.scaleToSize(lock ? (parseFloat(e.target.value) / bbox.h) * bbox.w : bbox.w, parseFloat(e.target.value) || bbox.h, lock);
    });
    document.getElementById('flip-h')?.addEventListener('click', () => this.editor.flipH());
    document.getElementById('flip-v')?.addEventListener('click', () => this.editor.flipV());
    document.getElementById('rotate-apply')?.addEventListener('click', () => {
      const angle = parseFloat(document.getElementById('rotate-angle')?.value) || 0;
      this.editor.rotate(angle);
    });

    // ── Nodes tab ──
    document.getElementById('nx')?.addEventListener('change', e => {
      const cmd = this.editor.getSelectedNodeData();
      if (cmd) this.editor.updateSelectedNode(parseFloat(e.target.value) || 0, cmd.y);
    });
    document.getElementById('ny')?.addEventListener('change', e => {
      const cmd = this.editor.getSelectedNodeData();
      if (cmd) this.editor.updateSelectedNode(cmd.x, parseFloat(e.target.value) || 0);
    });
    document.getElementById('h1x')?.addEventListener('change', e => {
      const sel = this.editor.selectedHandle;
      if (sel) { const c = this.editor.getSelectedNodeData(); if (c) this.editor.updateSelectedHandle('cp1', parseFloat(e.target.value) || 0, c.cp1y); }
    });
    document.getElementById('h1y')?.addEventListener('change', e => {
      const sel = this.editor.selectedHandle;
      if (sel) { const c = this.editor.getSelectedNodeData(); if (c) this.editor.updateSelectedHandle('cp1', c.cp1x, parseFloat(e.target.value) || 0); }
    });
    document.getElementById('h2x')?.addEventListener('change', e => {
      const cmd = this.editor.getSelectedNodeData();
      if (cmd) this.editor.updateSelectedHandle('cp2', parseFloat(e.target.value) || 0, cmd.cp2y);
    });
    document.getElementById('h2y')?.addEventListener('change', e => {
      const cmd = this.editor.getSelectedNodeData();
      if (cmd) this.editor.updateSelectedHandle('cp2', cmd.cp2x, parseFloat(e.target.value) || 0);
    });

    // ── Path tools tab ──
    document.getElementById('simplify-tol')?.addEventListener('input', e => {
      document.getElementById('simplify-tol-val').textContent = e.target.value;
    });
    document.getElementById('smooth-steps')?.addEventListener('input', e => {
      document.getElementById('smooth-steps-val').textContent = e.target.value;
    });

    document.getElementById('cleanup-btn')?.addEventListener('click', () => {
      this.editor.applyCleanup();
      this._notify('クリーンアップ完了');
    });
    document.getElementById('cleanup-all-btn')?.addEventListener('click', () => {
      this._saveCurrentGlyph();
      let count = 0;
      for (const [uni, g] of Object.entries(this.project.glyphs)) {
        if (g.pathData && g.pathData.length) { g.pathData = cleanupCmds(g.pathData); count++; }
      }
      this.editor.loadGlyph(this.project.glyphs[this.currentUnicode] || this.editor.glyph);
      this._notify(`${count}グリフをクリーンアップしました`);
    });

    document.getElementById('simplify-btn')?.addEventListener('click', () => {
      const tol = parseFloat(document.getElementById('simplify-tol')?.value) || 2;
      this.editor.applySimplify(tol);
      this._notify(`パスを間引きました (tol=${tol})`);
    });
    document.getElementById('simplify-all-btn')?.addEventListener('click', () => {
      const tol = parseFloat(document.getElementById('simplify-tol')?.value) || 2;
      this._saveCurrentGlyph();
      let count = 0;
      for (const [uni, g] of Object.entries(this.project.glyphs)) {
        if (g.pathData && g.pathData.length) { g.pathData = simplifyCmds(g.pathData, tol); count++; }
      }
      this.editor.loadGlyph(this.project.glyphs[this.currentUnicode] || this.editor.glyph);
      this._notify(`${count}グリフを間引きました`);
    });

    document.getElementById('smooth-btn')?.addEventListener('click', () => {
      const steps = parseInt(document.getElementById('smooth-steps')?.value) || 3;
      this.editor.applySmooth(steps);
      this._notify(`曲線を平滑化しました (${steps}回)`);
    });
    document.getElementById('smooth-all-btn')?.addEventListener('click', () => {
      const steps = parseInt(document.getElementById('smooth-steps')?.value) || 3;
      this._saveCurrentGlyph();
      let count = 0;
      for (const [uni, g] of Object.entries(this.project.glyphs)) {
        if (g.pathData && g.pathData.length) { g.pathData = smoothCmds(g.pathData, steps); count++; }
      }
      this.editor.loadGlyph(this.project.glyphs[this.currentUnicode] || this.editor.glyph);
      this._notify(`${count}グリフを平滑化しました`);
    });

    document.getElementById('fitbezier-btn')?.addEventListener('click', () => {
      this.editor.applyFitBezier();
      this._notify('スムーズベジェに変換しました');
    });
    document.getElementById('fitbezier-all-btn')?.addEventListener('click', () => {
      this._saveCurrentGlyph();
      let count = 0;
      for (const [uni, g] of Object.entries(this.project.glyphs)) {
        if (g.pathData && g.pathData.length) { g.pathData = fitSmoothBezier(g.pathData); count++; }
      }
      this.editor.loadGlyph(this.project.glyphs[this.currentUnicode] || this.editor.glyph);
      this._notify(`${count}グリフにスムーズベジェを適用しました`);
    });

    document.getElementById('reverse-btn')?.addEventListener('click', () => {
      this.editor.applyReverse();
      this._notify('パスの向きを逆にしました');
    });

    // ── Reference font ──
    document.getElementById('ref-font-select')?.addEventListener('change', e => {
      this.editor.setReferenceFont(e.target.value);
    });
    document.getElementById('show-reference')?.addEventListener('change', e => {
      this.editor.setShowReference(e.target.checked);
    });
    document.getElementById('show-handles')?.addEventListener('change', e => {
      this.editor.setShowHandles(e.target.checked);
    });

    // ── Settings panel ──
    document.getElementById('settings-form')?.addEventListener('submit', e => {
      e.preventDefault();
      this.project.name = document.getElementById('s-name').value || 'MyFont';
      this.project.style = document.getElementById('s-style').value || 'Regular';
      this.project.upm = parseInt(document.getElementById('s-upm').value) || 1000;
      this.project.ascender = parseInt(document.getElementById('s-ascender').value) || 800;
      this.project.descender = parseInt(document.getElementById('s-descender').value) || -200;
      this.project.capHeight = parseInt(document.getElementById('s-capheight').value) || 700;
      this.project.xHeight = parseInt(document.getElementById('s-xheight').value) || 500;
      this.project.defaultLsb = parseInt(document.getElementById('s-lsb').value) || 50;
      this.project.defaultRsb = parseInt(document.getElementById('s-rsb').value) || 50;
      // Update editor options
      this.editor.options = { ...this.editor.options, ...this.project };
      this.editor.render();
      this._notify('設定を保存しました');
      document.getElementById('settings-panel')?.classList.remove('open');
    });

    // Settings toggle
    document.getElementById('settings-btn')?.addEventListener('click', () => {
      document.getElementById('settings-panel')?.classList.toggle('open');
    });
    document.getElementById('settings-close')?.addEventListener('click', () => {
      document.getElementById('settings-panel')?.classList.remove('open');
    });

    // ── Preview tab ──
    document.getElementById('preview-text')?.addEventListener('input', () => this._renderPreview());
    document.getElementById('preview-size')?.addEventListener('input', e => {
      document.getElementById('preview-size-label').textContent = e.target.value + 'px';
      this._renderPreview();
    });
    document.getElementById('preview-bg')?.addEventListener('change', () => this._renderPreview());
    document.getElementById('update-preview-btn')?.addEventListener('click', () => {
      this._saveCurrentGlyph();
      this._loadFontForPreview();
    });

    // Main tab switching (Editor / Preview)
    document.querySelectorAll('.main-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.main-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        document.getElementById('editor-view').style.display = tab === 'editor' ? 'flex' : 'none';
        document.getElementById('preview-view').style.display = tab === 'preview' ? 'flex' : 'none';
        if (tab === 'preview') this._loadFontForPreview();
      });
    });
  },

  // ─── Drop zone ───────────────────────────────────────────────────────────────

  _bindDropZone() {
    const editorContainer = document.getElementById('editor-container');
    if (!editorContainer) return;
    editorContainer.addEventListener('dragover', e => { e.preventDefault(); editorContainer.classList.add('drag-over'); });
    editorContainer.addEventListener('dragleave', () => editorContainer.classList.remove('drag-over'));
    editorContainer.addEventListener('drop', e => {
      e.preventDefault(); editorContainer.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && this.currentUnicode != null) this._importSVGForChar(this.currentUnicode, file);
    });
  },

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────────

  _bindKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') this._prevNextChar(-1);
      else if (e.key === 'ArrowRight') this._prevNextChar(1);
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.editor.selectedNode >= 0) this.editor.deleteSelectedNode();
      } else if (e.key === 'f' || e.key === 'F') this.editor.fitToView();
      else if (e.key === '+' || e.key === '=') { const z = Math.min(5, this.editor.zoom * 1.3); this.editor.setZoom(z); this._onZoomChange(z); }
      else if (e.key === '-') { const z = Math.max(0.05, this.editor.zoom / 1.3); this.editor.setZoom(z); this._onZoomChange(z); }
    });
  },

  // ─── Preview ─────────────────────────────────────────────────────────────────

  _loadFontForPreview() {
    this._saveCurrentGlyph();
    const hasGlyphs = Object.keys(this.project.glyphs).some(k => this.project.glyphs[k]?.pathData?.length > 0);
    if (!hasGlyphs) { this._notify('プレビューするグリフがありません', 'error'); return; }

    if (typeof opentype === 'undefined') { this._notify('opentype.js が読み込まれていません', 'error'); return; }
    try {
      const upm = this.project.upm || 1000;
      const ascender = this.project.ascender || 800;
      const descender = this.project.descender || -200;

      const notdefPath = new opentype.Path();
      notdefPath.moveTo(50, 0); notdefPath.lineTo(50, 700); notdefPath.lineTo(450, 700); notdefPath.lineTo(450, 0); notdefPath.close();
      const notdefGlyph = new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: 500, path: notdefPath });

      const glyphs = [notdefGlyph];
      for (const [unicodeStr, glyph] of Object.entries(this.project.glyphs)) {
        const unicode = parseInt(unicodeStr);
        if (!glyph.pathData || !glyph.pathData.length) continue;
        const otPath = new opentype.Path();
        for (const c of glyph.pathData) {
          if (c.type === 'M') otPath.moveTo(c.x, c.y);
          else if (c.type === 'L') otPath.lineTo(c.x, c.y);
          else if (c.type === 'C') otPath.bezierCurveTo(c.cp1x, c.cp1y, c.cp2x, c.cp2y, c.x, c.y);
          else if (c.type === 'Z') otPath.close();
        }
        glyphs.push(new opentype.Glyph({ name: `uni${unicode.toString(16).toUpperCase().padStart(4, '0')}`, unicode, advanceWidth: glyph.advanceWidth || 600, path: otPath }));
      }

      const font = new opentype.Font({ familyName: this.project.name || 'MyFont', styleName: 'Regular', unitsPerEm: upm, ascender, descender, glyphs });
      // Use toArrayBuffer for preview
      const ab = font.toArrayBuffer ? font.toArrayBuffer() : this._fontToArrayBuffer(font);
      const blob = new Blob([ab], { type: 'font/truetype' });
      const url = URL.createObjectURL(blob);
      const familyName = `PreviewFont_${++this.previewFontKey}`;
      const ff = new FontFace(familyName, `url('${url}')`);
      ff.load().then(face => {
        document.fonts.add(face);
        this.previewFontFamily = familyName;
        this._renderPreview();
        this._notify('プレビューを更新しました');
      }).catch(err => {
        console.error(err);
        this._notify('フォントのロードに失敗しました', 'error');
      });
    } catch (err) {
      console.error(err);
      this._notify('プレビュー生成に失敗: ' + err.message, 'error');
    }
  },

  _fontToArrayBuffer(font) {
    // opentype.js font.toArrayBuffer() method
    if (font.toArrayBuffer) return font.toArrayBuffer();
    return new ArrayBuffer(0);
  },

  _renderPreview() {
    const container = document.getElementById('preview-display');
    if (!container) return;
    const text = document.getElementById('preview-text')?.value || 'Hello World!';
    const size = parseInt(document.getElementById('preview-size')?.value) || 48;
    const bg = document.getElementById('preview-bg')?.value || 'white';
    container.style.backgroundColor = bg === 'black' ? '#111' : bg === 'gray' ? '#888' : '#fff';
    container.style.color = bg === 'black' ? '#fff' : '#000';

    const lines = text.split('\n');
    container.innerHTML = '';
    for (const line of lines) {
      const div = document.createElement('div');
      div.style.fontFamily = this.previewFontFamily ? `'${this.previewFontFamily}', sans-serif` : 'sans-serif';
      div.style.fontSize = size + 'px';
      div.style.lineHeight = '1.4';
      div.style.whiteSpace = 'pre';
      div.textContent = line || ' ';
      container.appendChild(div);
    }
  },

  // ─── Settings Form ────────────────────────────────────────────────────────────

  _updateSettingsForm() {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    set('s-name', this.project.name);
    set('s-style', this.project.style);
    set('s-upm', this.project.upm);
    set('s-ascender', this.project.ascender);
    set('s-descender', this.project.descender);
    set('s-capheight', this.project.capHeight);
    set('s-xheight', this.project.xHeight);
    set('s-lsb', this.project.defaultLsb);
    set('s-rsb', this.project.defaultRsb);
    if (document.getElementById('font-name-display')) document.getElementById('font-name-display').textContent = this.project.name;
  },

  // ─── Project Save/Load ────────────────────────────────────────────────────────

  _saveProject() {
    this._saveCurrentGlyph();
    const data = JSON.stringify(this.project, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${this.project.name}.fontproj`;
    a.click(); URL.revokeObjectURL(url);
    this._notify('プロジェクトを保存しました');
  },

  _loadProject(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.glyphs) throw new Error('無効なプロジェクトファイルです');
        this.project = data;
        this._buildGlyphGrid();
        this._updateSettingsForm();
        const firstUni = parseInt(Object.keys(data.glyphs)[0]) || 65;
        this.currentUnicode = null;
        this.selectChar(firstUni);
        this._notify('プロジェクトを読み込みました');
      } catch (err) {
        this._notify('読み込みエラー: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  },

  // ─── Notification ─────────────────────────────────────────────────────────────

  _notify(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  },
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
