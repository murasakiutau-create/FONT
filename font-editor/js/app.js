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
  { label: 'ひらがな', chars: 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん' },
  { label: 'ひらがな濁音', chars: 'がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ' },
  { label: 'ひらがな小文字', chars: 'ぁぃぅぇぉっゃゅょゎ' },
  { label: 'カタカナ', chars: 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン' },
  { label: 'カタカナ濁音', chars: 'ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ' },
  { label: 'カタカナ小文字', chars: 'ァィゥェォッャュョヮヴ' },
  { label: 'カタカナ記号', chars: 'ーヽヾ' },
  { label: '日本語記号', chars: '、。「」・『』〜…' },
  { label: '漢字1年 (80字)', chars: '一右雨円王音下火花貝学気九休玉金空月犬見五口校左三山子四糸字耳七車手十出女小上森人水正生青夕石赤千川先早草足村大男竹中虫町天田土二日入年白八百文木本名目立力林六' },
  { label: '漢字2年 (160字)', chars: '引羽雲園遠何科夏家歌画回会海絵外角楽活間丸岩顔汽記帰弓牛魚京強教近兄形計元言原戸古午後語工公広交光考行高黄合谷国黒今才細作算止市矢姉思紙寺自時室社弱首秋週春書少場色食心新親図数西声星晴切雪船線前組走多太体台地池知茶昼長鳥朝直通弟店点電刀冬当東答頭同道読内南肉馬売買麦半番父風分聞米歩母方北毎妹万明鳴毛門夜野友用曜来里理話' },
  { label: '漢字3年 (200字)', chars: '悪安暗医委意育員院飲運泳駅央横屋温化和荷界開階寒感漢館岸起期客究急級宮球去橋業曲局銀区苦具君係軽血決研県庫湖向幸港号根祭皿仕死使始指歯詩次事持式実写者主守取酒受州拾終習集住重宿所暑助昭消商章勝乗植申身神真深進世整昔全相送想息速族他打対待代第題炭短談着注柱丁帳調追定庭笛鉄転都度投豆島湯登等動童農波配倍箱畑発反坂板皮悲美鼻筆氷表秒病品負部服福物平返勉放味命面問役薬由油有遊予羊洋葉陽様落流旅両緑礼列練路' },
  { label: '漢字4年 (202字)', chars: '愛案以衣位茨印英栄媛塩岡億加果貨課芽賀改械害街各覚潟完官管関観願岐希季旗器機議求泣給挙漁共協鏡競極熊訓軍郡群径景芸欠結建健験固功好香候康佐差菜最埼材崎昨札刷察参産散残氏司試児治滋辞鹿失借種周祝順初松笑唱焼照城縄臣信井成省清静席積折節説浅戦選然争倉巣束側続卒孫帯隊達単置仲沖兆低底的典伝徒努灯働特徳栃奈梨熱念敗梅博阪飯飛必票標不夫付府阜富副兵別辺変便包法望牧末満未民無約勇要養浴利陸良料量輪類令冷例連老労録' },
  { label: '漢字5年 (193字)', chars: '圧囲移因永営衛易益液演応往桜可仮価河過快解格確額刊幹慣眼紀基寄規喜技義逆久旧救居許境均禁句型経潔件険検限現減故個護効厚耕航鉱構興講告混査再災妻採際在財罪殺雑酸賛士支史志枝師資飼示似識質舎謝授修述術準序招証象賞条状常情織職制性政勢精製税責績接設絶祖素総造像増則測属率損貸態団断築貯張停提程適統堂銅導得毒独任燃能破犯判版比肥非費備評貧布婦武復複仏粉編弁保墓報豊防貿暴脈務夢迷綿輸余容略留領歴' },
  { label: '漢字6年 (191字)', chars: '胃異遺域宇映延沿恩我灰拡革閣割株干巻看簡危机揮貴疑吸供胸郷勤筋系敬警劇激穴券絹権憲源厳己呼誤后孝皇紅降鋼刻穀骨困砂座済裁策冊蚕至私姿視詞誌磁射捨尺若樹収宗就衆従縦縮熟純処署諸除承将傷障蒸針仁垂推寸盛聖誠舌宣専泉洗染銭善奏窓創装層操蔵臓存尊退宅担探誕段暖値宙忠著庁頂腸潮賃痛敵展討党糖届難乳認納脳派拝背肺俳班晩否批秘俵腹奮並陛閉片補暮宝訪亡忘棒枚幕密盟模訳郵優預幼欲翌乱卵覧裏律臨朗論' },
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
    description: '',
    copyright: '',
    license: '',
    author: '',
    authorUrl: '',
    vendorUrl: '',
    upm: 1000,
    ascender: 800,
    descender: -200,
    capHeight: 700,
    xHeight: 500,
    defaultLsb: 50,
    defaultRsb: 50,
    glyphs: {}, // unicode -> glyph object
    kerning: {}, // "u1,u2" -> value (kern pair)
    ligatures: [], // [{chars: "fi", unicode: 64257}]
  },
  clipboardGlyph: null, // for copy/paste
  editor: null,
  currentUnicode: null,
  activeRightTab: 'transform',
  kernPair: { left: null, right: null },
  previewFontFamily: null,
  previewFontKey: 0,
  undoStack: [],
  redoStack: [],
  projectId: null,

  init() {
    // Load project from URL parameter if available
    const params = new URLSearchParams(window.location.search);
    this.projectId = params.get('project');
    if (this.projectId) {
      try {
        const saved = localStorage.getItem('svgfontmaker_data_' + this.projectId);
        if (saved) {
          const data = JSON.parse(saved);
          this.project = { ...this.project, ...data };
          this._projectCreated = data.created || new Date().toISOString();
        }
      } catch (e) { console.warn('Failed to load project:', e); }
    }

    // Try to load from Firestore when Firebase becomes available
    this._initFirebaseLoad();

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
      onBeforePenFinalize: () => this._pushUndo(),
    });

    this._buildGlyphGrid();
    this._bindUIEvents();
    this._bindDropZone();
    this._bindKeyboard();
    this._bindGlyphSearch();
    this.selectChar(65); // Start with 'A'
    this._updateSettingsForm();

    // Auto-save every 30 seconds (localStorage)
    if (this.projectId) {
      setInterval(() => this._autoSave(), 30000);
    }

    // Auto-save to Firestore every 30 seconds (debounced separately)
    if (this.projectId) {
      setInterval(() => this._autoSaveCloud(), 30000);
    }

    // Warn before leaving with unsaved data
    window.addEventListener('beforeunload', (e) => {
      this._autoSave();
      if (this.editor && this.editor.glyph && Object.keys(this.project.glyphs).length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

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
    // Debounced thumbnail rendering
    clearTimeout(this._thumbDebounce);
    this._thumbDebounce = setTimeout(() => this._renderGlyphThumbnails(), 200);
  },

  // ─── Glyph Search ──────────────────────────────────────────────────────────

  _bindGlyphSearch() {
    const input = document.getElementById('glyph-search');
    if (!input) return;
    input.addEventListener('input', () => this._filterGlyphGrid(input.value.trim()));
  },

  _filterGlyphGrid(query) {
    const q = query.toLowerCase();
    for (const g of ALL_CHARS) {
      const cell = document.getElementById(`gcell-${g.unicode}`);
      if (!cell) continue;
      if (!q) {
        cell.style.display = '';
        continue;
      }
      const charMatch = g.char.toLowerCase().includes(q);
      const hexStr = g.unicode.toString(16).toLowerCase();
      const unicodeMatch = hexStr.includes(q) || ('u+' + hexStr).includes(q) || g.unicode.toString().includes(q);
      cell.style.display = (charMatch || unicodeMatch) ? '' : 'none';
    }
  },

  // ─── Glyph Thumbnails ────────────────────────────────────────────────────────

  _renderGlyphThumbnails() {
    for (const g of ALL_CHARS) {
      const cell = document.getElementById(`gcell-${g.unicode}`);
      if (!cell) continue;
      // Remove existing thumbnail
      const existing = cell.querySelector('.glyph-thumb');
      if (existing) existing.remove();
      const glyphData = this.project.glyphs[g.unicode];
      if (!glyphData || !glyphData.pathData || !glyphData.pathData.length) continue;
      const d = cmdsToDString(glyphData.pathData);
      if (!d) continue;
      const b = getCmdsBounds(glyphData.pathData);
      if (b.w === 0 && b.h === 0) continue;
      // Create mini SVG
      const wrap = document.createElement('div');
      wrap.className = 'glyph-thumb';
      const margin = 2;
      const vx = b.x - margin;
      const vy = b.y - margin;
      const vw = b.w + margin * 2;
      const vh = b.h + margin * 2;
      // Font coords: Y up. We need to flip for SVG display.
      wrap.innerHTML = `<svg viewBox="${vx} ${-b.y - b.h - margin} ${vw} ${vh}" preserveAspectRatio="xMidYMid meet"><g transform="scale(1,-1)"><path d="${d}" fill="#000" fill-rule="evenodd"/></g></svg>`;
      cell.appendChild(wrap);
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
    this._updateBearingDisplay();
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
        let finalCmds = fitted.cmds;
        const char = String.fromCodePoint(unicode);

        // Auto-optimize if enabled
        const autoOpt = document.getElementById('import-auto-optimize')?.checked;
        if (autoOpt) {
          const targetNodes = parseInt(document.getElementById('import-target-nodes')?.value) || 25;
          finalCmds = this._optimizeCmds(finalCmds, targetNodes);
        }

        const finalB = getCmdsBounds(finalCmds);
        const rsb = this.project.defaultRsb || 50;
        const aw = autoOpt && finalB.w > 0 ? Math.round(finalB.x + finalB.w + rsb) : fitted.advanceWidth;

        this.project.glyphs[unicode] = {
          unicode,
          char,
          advanceWidth: aw,
          lsb: this.project.defaultLsb,
          rsb: this.project.defaultRsb,
          pathData: finalCmds,
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
    // Push to undo stack (debounced to avoid flooding)
    clearTimeout(this._undoDebounce);
    this._undoDebounce = setTimeout(() => {
      this._pushUndo();
    }, 300);
    this.project.glyphs[glyph.unicode] = glyph;
    this._refreshGlyphGrid();
  },

  _pushUndo() {
    const snapshot = {
      unicode: this.currentUnicode,
      glyph: this.editor ? this.editor.getGlyph() : null,
    };
    this.undoStack.push(snapshot);
    if (this.undoStack.length > 30) this.undoStack.shift();
    this.redoStack = [];
    this._updateUndoButtons();
  },

  _undo() {
    if (!this.undoStack.length) return;
    // Save current state to redo
    const current = {
      unicode: this.currentUnicode,
      glyph: this.editor ? this.editor.getGlyph() : null,
    };
    this.redoStack.push(current);
    if (this.redoStack.length > 30) this.redoStack.shift();

    const state = this.undoStack.pop();
    this._restoreState(state);
    this._updateUndoButtons();
  },

  _redo() {
    if (!this.redoStack.length) return;
    // Save current state to undo
    const current = {
      unicode: this.currentUnicode,
      glyph: this.editor ? this.editor.getGlyph() : null,
    };
    this.undoStack.push(current);

    const state = this.redoStack.pop();
    this._restoreState(state);
    this._updateUndoButtons();
  },

  _restoreState(state) {
    if (!state || !state.glyph) return;
    // Navigate to the glyph's unicode if different
    if (state.unicode !== this.currentUnicode) {
      this.currentUnicode = state.unicode;
      const char = String.fromCodePoint(state.unicode);
      document.getElementById('current-char-label').textContent = char === ' ' ? 'Space' : char;
      document.getElementById('current-unicode-label').textContent = `U+${state.unicode.toString(16).toUpperCase().padStart(4, '0')}`;
      this._refreshGlyphGrid();
      this._refreshNavButtons();
    }
    this.project.glyphs[state.unicode] = JSON.parse(JSON.stringify(state.glyph));
    this.editor.loadGlyph(state.glyph);
    document.getElementById('advance-width').value = state.glyph.advanceWidth;
    this._updateBearingDisplay();
    this._refreshGlyphGrid();
  },

  _updateUndoButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    if (undoBtn) undoBtn.disabled = this.undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = this.redoStack.length === 0;
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
    // Tool buttons (only those with data-tool)
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.tool;
        this.editor.setEditMode(mode);
      });
    });

    // Undo / Redo buttons
    document.getElementById('undo-btn')?.addEventListener('click', () => this._undo());
    document.getElementById('redo-btn')?.addEventListener('click', () => this._redo());

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

    // Import dialog
    document.getElementById('import-btn')?.addEventListener('click', () => {
      document.getElementById('import-dialog').style.display = 'flex';
    });
    document.getElementById('import-dialog-close')?.addEventListener('click', () => {
      document.getElementById('import-dialog').style.display = 'none';
    });
    document.getElementById('import-dialog')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
    });
    document.getElementById('import-single')?.addEventListener('click', () => {
      document.getElementById('import-dialog').style.display = 'none';
      if (this.currentUnicode == null) return;
      const inp = document.getElementById('svg-file-input');
      inp.value = '';
      inp.click();
    });
    document.getElementById('import-batch')?.addEventListener('click', () => {
      document.getElementById('import-dialog').style.display = 'none';
      const inp = document.getElementById('batch-file-input');
      inp.value = '';
      inp.click();
    });
    document.getElementById('import-template')?.addEventListener('click', () => {
      document.getElementById('import-dialog').style.display = 'none';
      const inp = document.getElementById('template-file-input');
      inp.value = '';
      inp.click();
    });

    document.getElementById('import-font-file')?.addEventListener('click', () => {
      document.getElementById('import-dialog').style.display = 'none';
      const inp = document.getElementById('font-file-input');
      inp.value = '';
      inp.click();
    });
    document.getElementById('font-file-input')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) this._importFontFile(file);
    });

    // Image import
    document.getElementById('import-image')?.addEventListener('click', () => {
      document.getElementById('import-dialog').style.display = 'none';
      const inp = document.getElementById('image-file-input');
      inp.value = '';
      inp.click();
    });
    document.getElementById('image-file-input')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) this._importImage(file);
    });

    // Image trace dialog
    document.getElementById('image-trace-close')?.addEventListener('click', () => {
      document.getElementById('image-trace-dialog').style.display = 'none';
    });
    document.getElementById('image-trace-dialog')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
    });
    document.getElementById('trace-threshold')?.addEventListener('input', e => {
      document.getElementById('trace-threshold-val').textContent = e.target.value;
      this._updateTracePreview();
    });
    document.getElementById('trace-invert')?.addEventListener('change', () => {
      this._updateTracePreview();
    });
    document.getElementById('trace-smooth')?.addEventListener('change', () => {
      this._updateTracePreview();
    });
    document.getElementById('trace-import-btn')?.addEventListener('click', () => {
      this._importTracedImage();
    });

    // Auto-optimize toggle in import dialog
    document.getElementById('import-auto-optimize')?.addEventListener('change', e => {
      document.getElementById('import-optimize-options').style.display = e.target.checked ? 'block' : 'none';
    });
    document.getElementById('import-target-nodes')?.addEventListener('input', e => {
      document.getElementById('import-target-val').textContent = e.target.value;
    });

    // SVG file inputs (still needed)
    document.getElementById('svg-file-input')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file && this.currentUnicode != null) this._importSVGForChar(this.currentUnicode, file);
    });
    document.getElementById('batch-file-input')?.addEventListener('change', e => {
      this._batchImportSVGs(Array.from(e.target.files));
    });

    // Template dialog
    document.getElementById('template-btn')?.addEventListener('click', () => {
      document.getElementById('template-dialog').style.display = 'flex';
    });
    document.getElementById('template-dialog-close')?.addEventListener('click', () => {
      document.getElementById('template-dialog').style.display = 'none';
    });
    document.getElementById('template-dialog')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
    });
    document.getElementById('tpl-with-ref')?.addEventListener('click', () => {
      document.getElementById('template-dialog').style.display = 'none';
      this._downloadTemplate(true);
    });
    document.getElementById('tpl-no-ref')?.addEventListener('click', () => {
      document.getElementById('template-dialog').style.display = 'none';
      this._downloadTemplate(false);
    });
    document.getElementById('template-upload-btn')?.addEventListener('click', () => {
      const inp = document.getElementById('template-file-input');
      inp.value = '';
      inp.click();
    });
    document.getElementById('template-file-input')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) this._importTemplate(file);
    });

    // Delete glyph
    document.getElementById('delete-glyph-btn')?.addEventListener('click', () => {
      if (this.currentUnicode == null) return;
      delete this.project.glyphs[this.currentUnicode];
      this.editor.loadGlyph({ unicode: this.currentUnicode, char: String.fromCodePoint(this.currentUnicode), advanceWidth: 600, pathData: [] });
      this._refreshGlyphGrid();
      this._notify('グリフを削除しました');
    });

    // Export button
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
        // Populate component select when transform tab opens
        if (tab === 'transform') this._populateComponentSelect();
        // Render ligature list when ligatures tab opens
        if (tab === 'ligatures') this._renderLigatureList();
        // Render custom guides list when view tab opens
        if (tab === 'view') this._renderCustomGuidesList();
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

    // ── Boolean operations ──
    document.getElementById('bool-union-btn')?.addEventListener('click', () => {
      this._boolUnion();
    });
    document.getElementById('bool-subtract-btn')?.addEventListener('click', () => {
      this._boolSubtract();
    });
    document.getElementById('bool-remove-overlap-btn')?.addEventListener('click', () => {
      this._boolRemoveOverlap();
    });

    // ── Validation ──
    document.getElementById('validate-btn')?.addEventListener('click', () => {
      this._validateAllGlyphs();
    });

    // ── Experimental: auto-optimize ──
    this._expRefCmds = null;
    const expDrop = document.getElementById('exp-ref-drop');
    const expFileInput = document.getElementById('exp-ref-file');
    expDrop?.addEventListener('click', () => { expFileInput.value = ''; expFileInput.click(); });
    expDrop?.addEventListener('dragover', e => { e.preventDefault(); expDrop.style.borderColor = '#000'; });
    expDrop?.addEventListener('dragleave', () => { expDrop.style.borderColor = '#ccc'; });
    expDrop?.addEventListener('drop', e => {
      e.preventDefault(); expDrop.style.borderColor = '#ccc';
      const file = e.dataTransfer.files[0];
      if (file) this._loadExpRef(file);
    });
    expFileInput?.addEventListener('change', e => {
      if (e.target.files[0]) this._loadExpRef(e.target.files[0]);
    });
    document.getElementById('exp-target-nodes')?.addEventListener('input', e => {
      document.getElementById('exp-target-val').textContent = e.target.value;
    });
    document.getElementById('exp-optimize-btn')?.addEventListener('click', () => {
      this._runAutoOptimize();
    });

    // ── Copy/Paste buttons ──
    document.getElementById('copy-glyph-btn')?.addEventListener('click', () => this._copyGlyph());
    document.getElementById('paste-glyph-btn')?.addEventListener('click', () => this._pasteGlyph());

    // ── Ligatures ──
    document.getElementById('liga-add-btn')?.addEventListener('click', () => {
      this._addLigature();
    });

    // ── Component/Reference glyphs ──
    document.getElementById('component-add-btn')?.addEventListener('click', () => {
      this._addComponentGlyph();
    });

    // ── Waterfall preview ──
    document.getElementById('waterfall-btn')?.addEventListener('click', () => {
      this._renderWaterfall();
    });

    // ── Custom Guidelines ──
    document.getElementById('guide-add-btn')?.addEventListener('click', () => {
      this._addCustomGuide();
    });

    // ── Side Bearings ──
    document.getElementById('bearing-lsb')?.addEventListener('change', e => {
      this._setLSB(parseInt(e.target.value) || 0);
    });
    document.getElementById('bearing-rsb')?.addEventListener('change', e => {
      this._setRSB(parseInt(e.target.value) || 0);
    });
    document.getElementById('batch-bearing-apply')?.addEventListener('click', () => {
      const lsb = parseInt(document.getElementById('batch-lsb')?.value) || 50;
      const rsb = parseInt(document.getElementById('batch-rsb')?.value) || 50;
      this._batchSetBearings(lsb, rsb);
    });
    document.getElementById('auto-bearing-threshold')?.addEventListener('input', e => {
      document.getElementById('auto-bearing-val').textContent = e.target.value + '%';
    });
    document.getElementById('auto-bearing-apply')?.addEventListener('click', () => {
      const threshold = parseFloat(document.getElementById('auto-bearing-threshold')?.value) || 10;
      this._autoSetBearings(threshold);
    });
    // Real-time bearing preview with slider
    document.getElementById('auto-bearing-threshold')?.addEventListener('input', e => {
      document.getElementById('auto-bearing-val').textContent = e.target.value + '%';
      // Debounced auto-apply for real-time preview
      clearTimeout(this._bearingDebounce);
      this._bearingDebounce = setTimeout(() => {
        const threshold = parseFloat(e.target.value) || 10;
        this._autoSetBearings(threshold);
      }, 150);
    });

    // ── Kerning ──
    document.getElementById('kern-set-left')?.addEventListener('click', () => {
      this.kernPair.left = this.currentUnicode;
      this._updateKernDisplay();
      this._renderKernPreview();
    });
    document.getElementById('kern-set-right')?.addEventListener('click', () => {
      this.kernPair.right = this.currentUnicode;
      this._updateKernDisplay();
      this._renderKernPreview();
    });
    document.getElementById('kern-value')?.addEventListener('change', e => {
      this._setKernValue(parseInt(e.target.value) || 0);
    });
    document.getElementById('kern-value-slider')?.addEventListener('input', e => {
      document.getElementById('kern-value').value = e.target.value;
      this._setKernValue(parseInt(e.target.value) || 0);
    });
    document.getElementById('kern-value')?.addEventListener('input', e => {
      const slider = document.getElementById('kern-value-slider');
      if (slider) slider.value = e.target.value;
    });
    document.getElementById('auto-kern-btn')?.addEventListener('click', () => {
      this._autoKern();
      this._renderKernTable();
    });
    document.getElementById('auto-kern-threshold')?.addEventListener('input', e => {
      document.getElementById('auto-kern-val').textContent = e.target.value + '%';
    });
    document.getElementById('clear-kern-btn')?.addEventListener('click', () => {
      this._clearAllKerning();
      this._renderKernTable();
    });
    document.getElementById('show-kern-table')?.addEventListener('click', () => {
      this._renderKernTable();
      const table = document.getElementById('kern-table-wrap');
      if (table) table.style.display = table.style.display === 'none' ? 'block' : 'none';
    });

    // ── Reference font ──
    document.getElementById('ref-font-select')?.addEventListener('change', e => {
      this.editor.setReferenceFont(e.target.value);
      // Reset overrides to new font defaults
      this.editor.refSizeOverride = null;
      this.editor.refNudgeOverride = null;
      const font = e.target.value;
      let sz = 0.96, nd = 0.0;
      if (font === 'serif') { sz = 0.98; nd = 0.03; }
      else if (font === 'monospace') { sz = 0.91; nd = -0.02; }
      document.getElementById('ref-size-slider').value = sz;
      document.getElementById('ref-size-val').textContent = sz.toFixed(2);
      document.getElementById('ref-nudge-slider').value = nd;
      document.getElementById('ref-nudge-val').textContent = nd.toFixed(3);
    });
    document.getElementById('show-reference')?.addEventListener('change', e => {
      this.editor.setShowReference(e.target.checked);
    });
    document.getElementById('show-handles')?.addEventListener('change', e => {
      this.editor.setShowHandles(e.target.checked);
    });

    // ── Reference size/nudge sliders ──
    document.getElementById('ref-size-slider')?.addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      document.getElementById('ref-size-val').textContent = v.toFixed(2);
      this.editor.refSizeOverride = v;
      this.editor._renderReference();
    });
    document.getElementById('ref-nudge-slider')?.addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      document.getElementById('ref-nudge-val').textContent = v.toFixed(3);
      this.editor.refNudgeOverride = v;
      this.editor._renderReference();
    });
    document.getElementById('ref-reset-btn')?.addEventListener('click', () => {
      this.editor.refSizeOverride = null;
      this.editor.refNudgeOverride = null;
      // Reset sliders to current font defaults
      const font = this.editor.referenceFont;
      let sz = 0.96, nd = 0.0;
      if (font === 'serif') { sz = 0.98; nd = 0.03; }
      else if (font === 'monospace') { sz = 0.91; nd = -0.02; }
      document.getElementById('ref-size-slider').value = sz;
      document.getElementById('ref-size-val').textContent = sz.toFixed(2);
      document.getElementById('ref-nudge-slider').value = nd;
      document.getElementById('ref-nudge-val').textContent = nd.toFixed(3);
      this.editor._renderReference();
    });

    // ── Custom guideline X ──
    document.getElementById('guide-x-add-btn')?.addEventListener('click', () => {
      const val = parseFloat(document.getElementById('guide-x-input')?.value);
      if (isNaN(val)) return;
      if (!this.editor.customGuidesX) this.editor.customGuidesX = [];
      this.editor.customGuidesX.push(val);
      document.getElementById('guide-x-input').value = '';
      this.editor.render();
      this._renderCustomGuidesList();
    });

    // ── Settings panel ──
    document.getElementById('settings-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const gv = id => (document.getElementById(id)?.value || '');
      this.project.name = gv('s-name') || 'MyFont';
      this.project.nameJa = gv('s-name-ja');
      this.project.style = gv('s-style') || 'Regular';
      this.project.styleJa = gv('s-style-ja');
      this.project.fullname = gv('s-fullname');
      this.project.fullnameJa = gv('s-fullname-ja');
      this.project.psName = gv('s-psname');
      this.project.version = gv('s-version');
      this.project.copyright = gv('s-copyright');
      this.project.copyrightJa = gv('s-copyright-ja');
      this.project.description = gv('s-description');
      this.project.descriptionJa = gv('s-description-ja');
      this.project.author = gv('s-author');
      this.project.authorJa = gv('s-author-ja');
      this.project.authorUrl = gv('s-author-url');
      this.project.authorUrlJa = gv('s-author-url-ja');
      this.project.vendor = gv('s-vendor');
      this.project.vendorJa = gv('s-vendor-ja');
      this.project.vendorUrl = gv('s-vendor-url');
      this.project.vendorUrlJa = gv('s-vendor-url-ja');
      this.project.license = gv('s-license');
      this.project.licenseJa = gv('s-license-ja');
      this.project.licenseUrl = gv('s-license-url');
      this.project.trademark = gv('s-trademark');
      this.project.trademarkJa = gv('s-trademark-ja');
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

    // Back to projects (auto-save)
    document.getElementById('back-to-projects')?.addEventListener('click', (e) => {
      this._autoSave();
    });
    // Auto-save on page unload
    window.addEventListener('beforeunload', () => this._autoSave());

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
      // Ctrl+Z / Ctrl+Y work even in inputs
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); this._undo(); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); this._redo(); return; }
      // Copy/Paste (Ctrl+C / Ctrl+V) work even in inputs
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        e.preventDefault(); this._copyGlyph(); return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        e.preventDefault(); this._pasteGlyph(); return;
      }
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') this._prevNextChar(-1);
      else if (e.key === 'ArrowRight') this._prevNextChar(1);
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.editor.selectedNode >= 0) this.editor.deleteSelectedNode();
      } else if (e.key === 'f' || e.key === 'F') this.editor.fitToView();
      else if (e.key === '+' || e.key === '=') { const z = Math.min(5, this.editor.zoom * 1.3); this.editor.setZoom(z); this._onZoomChange(z); }
      else if (e.key === '-') { const z = Math.max(0.05, this.editor.zoom / 1.3); this.editor.setZoom(z); this._onZoomChange(z); }
      // Tool shortcuts
      else if (e.key === 's' || e.key === 'S') this._setToolByKey('select');
      else if (e.key === 'n' || e.key === 'N') this._setToolByKey('node');
      else if (e.key === 'p' || e.key === 'P') this._setToolByKey('pen');
      // Escape to cancel pen drawing
      else if (e.key === 'Escape') {
        if (this.editor.editMode === 'pen' && this.editor.penState) {
          if (this.editor.penState.cmds.length > 1) {
            this.editor._finalizePenPath();
          } else {
            this.editor.penState = null;
            const old = this.editor.mainGroup.querySelector('#pen-preview');
            if (old) old.remove();
          }
        }
      }
    });
  },

  _setToolByKey(mode) {
    document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.tool-btn[data-tool="${mode}"]`);
    if (btn) btn.classList.add('active');
    this.editor.setEditMode(mode);
  },

  // ─── Copy / Paste ───────────────────────────────────────────────────────────

  _copyGlyph() {
    if (this.currentUnicode == null) return;
    this._saveCurrentGlyph();
    const g = this.project.glyphs[this.currentUnicode];
    if (g && g.pathData && g.pathData.length > 0) {
      this.clipboardGlyph = JSON.parse(JSON.stringify(g));
      this._notify('グリフをコピーしました');
    } else {
      this._notify('コピーするパスデータがありません', 'error');
    }
  },

  _pasteGlyph() {
    if (this.currentUnicode == null) return;
    if (!this.clipboardGlyph) {
      this._notify('クリップボードが空です', 'error');
      return;
    }
    const pasted = JSON.parse(JSON.stringify(this.clipboardGlyph));
    pasted.unicode = this.currentUnicode;
    pasted.char = String.fromCodePoint(this.currentUnicode);
    this.project.glyphs[this.currentUnicode] = pasted;
    this.editor.loadGlyph(pasted);
    document.getElementById('advance-width').value = pasted.advanceWidth;
    this._refreshGlyphGrid();
    this._notify('グリフを貼り付けました');
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
    set('s-name-ja', this.project.nameJa || '');
    set('s-style', this.project.style);
    set('s-style-ja', this.project.styleJa || '');
    set('s-fullname', this.project.fullname || '');
    set('s-fullname-ja', this.project.fullnameJa || '');
    set('s-psname', this.project.psName || '');
    set('s-version', this.project.version || 'Version 1.000');
    set('s-copyright', this.project.copyright || '');
    set('s-copyright-ja', this.project.copyrightJa || '');
    set('s-description', this.project.description || '');
    set('s-description-ja', this.project.descriptionJa || '');
    set('s-author', this.project.author || '');
    set('s-author-ja', this.project.authorJa || '');
    set('s-author-url', this.project.authorUrl || '');
    set('s-author-url-ja', this.project.authorUrlJa || '');
    set('s-vendor', this.project.vendor || '');
    set('s-vendor-ja', this.project.vendorJa || '');
    set('s-vendor-url', this.project.vendorUrl || '');
    set('s-vendor-url-ja', this.project.vendorUrlJa || '');
    set('s-license', this.project.license || '');
    set('s-license-ja', this.project.licenseJa || '');
    set('s-license-url', this.project.licenseUrl || '');
    set('s-trademark', this.project.trademark || '');
    set('s-trademark-ja', this.project.trademarkJa || '');
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
    // Save to localStorage if project has an ID
    this._autoSave();
    // Also download as file
    const data = JSON.stringify(this.project, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${this.project.name}.fontproj`;
    a.click(); URL.revokeObjectURL(url);
    this._notify('プロジェクトを保存しました');
  },

  _autoSave() {
    if (!this.projectId) return;
    this._saveCurrentGlyph();
    try {
      localStorage.setItem('svgfontmaker_data_' + this.projectId, JSON.stringify(this.project));
      const now = new Date();
      const ts = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
      const el = document.getElementById('save-status');
      if (el) el.textContent = `✓ 保存済 ${ts}`;
    } catch (e) { console.warn('Auto-save failed:', e); }
  },

  async _autoSaveCloud() {
    if (!this.projectId) return;
    if (typeof FirebaseApp === 'undefined') return;
    const user = FirebaseApp.getCurrentUser();
    if (!user) return;
    this._saveCurrentGlyph();
    try {
      const el = document.getElementById('save-status');
      if (el) el.textContent = '☁ 同期中...';
      // Build save data: project metadata + full data
      const saveData = {
        ...this.project,
        created: this._projectCreated || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await FirebaseApp.saveProject(user.uid, this.projectId, saveData);
      const now = new Date();
      const ts = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
      if (el) el.textContent = `☁ クラウド保存済 ${ts}`;
    } catch (e) {
      console.warn('Cloud auto-save failed:', e);
      const el = document.getElementById('save-status');
      if (el) el.textContent = '☁ 同期エラー';
    }
  },

  _initFirebaseLoad() {
    if (typeof FirebaseApp === 'undefined') {
      setTimeout(() => this._initFirebaseLoad(), 200);
      return;
    }
    FirebaseApp.onAuthChange(async (user) => {
      this._updateEditorAuthUI(user);
      if (!user || !this.projectId) return;
      try {
        const cloudData = await FirebaseApp.loadProject(user.uid, this.projectId);
        if (cloudData && cloudData.glyphs) {
          // Cloud data is newer or local has no glyphs: use cloud
          const localGlyphCount = Object.keys(this.project.glyphs || {}).length;
          const cloudGlyphCount = Object.keys(cloudData.glyphs || {}).length;
          if (cloudGlyphCount > 0 && (localGlyphCount === 0 || (cloudData.updatedAt && cloudData.updatedAt > (this.project.updatedAt || '')))) {
            this.project = { ...this.project, ...cloudData };
            this._projectCreated = cloudData.created || this._projectCreated;
            // Also update localStorage cache
            localStorage.setItem('svgfontmaker_data_' + this.projectId, JSON.stringify(this.project));
            this._buildGlyphGrid();
            this._updateSettingsForm();
            this.currentUnicode = null;
            this.selectChar(65);
            const el = document.getElementById('save-status');
            if (el) el.textContent = '☁ クラウドから読み込み済';
          }
        }
      } catch (e) {
        console.warn('Failed to load from cloud:', e);
      }
    });
  },

  _updateEditorAuthUI(user) {
    const area = document.getElementById('editor-auth-area');
    if (!area) return;
    if (user) {
      area.innerHTML = `
        <img src="${user.photoURL || ''}" alt="" style="width:24px;height:24px;border-radius:50%;border:2px solid #000">
        <span style="font-size:11px;font-weight:600;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${user.displayName || ''}</span>
      `;
    } else {
      area.innerHTML = '';
    }
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

  // ─── OTF/TTF Import ────────────────────────────────────────────────────────────

  _importFontFile(file) {
    if (typeof opentype === 'undefined') {
      this._notify('opentype.js が読み込まれていません', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const font = opentype.parse(e.target.result);
        let count = 0;
        for (let i = 0; i < font.glyphs.length; i++) {
          const g = font.glyphs.get(i);
          if (!g.unicode || g.unicode === 0) continue;
          const path = g.path;
          if (!path || !path.commands || !path.commands.length) continue;
          const cmds = [];
          for (const c of path.commands) {
            if (c.type === 'M') cmds.push({ type: 'M', x: c.x, y: c.y });
            else if (c.type === 'L') cmds.push({ type: 'L', x: c.x, y: c.y });
            else if (c.type === 'C') cmds.push({ type: 'C', cp1x: c.x1, cp1y: c.y1, cp2x: c.x2, cp2y: c.y2, x: c.x, y: c.y });
            else if (c.type === 'Q') {
              // Convert quadratic to cubic
              const prevCmd = cmds.length > 0 ? cmds[cmds.length - 1] : null;
              const px = prevCmd ? (prevCmd.x || 0) : 0;
              const py = prevCmd ? (prevCmd.y || 0) : 0;
              cmds.push({ type: 'C',
                cp1x: px + (2/3) * (c.x1 - px), cp1y: py + (2/3) * (c.y1 - py),
                cp2x: c.x + (2/3) * (c.x1 - c.x), cp2y: c.y + (2/3) * (c.y1 - c.y),
                x: c.x, y: c.y });
            }
            else if (c.type === 'Z') cmds.push({ type: 'Z' });
          }
          if (!cmds.length) continue;
          let finalCmds = cmds;
          const autoOpt = document.getElementById('import-auto-optimize')?.checked;
          if (autoOpt) {
            const targetNodes = parseInt(document.getElementById('import-target-nodes')?.value) || 25;
            finalCmds = this._optimizeCmds(cmds, targetNodes);
          }
          this.project.glyphs[g.unicode] = {
            unicode: g.unicode,
            char: String.fromCodePoint(g.unicode),
            advanceWidth: g.advanceWidth || 600,
            pathData: finalCmds,
          };
          count++;
        }
        this._refreshGlyphGrid();
        if (this.currentUnicode != null && this.project.glyphs[this.currentUnicode]) {
          this.editor.loadGlyph(this.project.glyphs[this.currentUnicode]);
          document.getElementById('advance-width').value = this.project.glyphs[this.currentUnicode].advanceWidth;
        }
        this._notify(`${count}グリフをフォントからインポートしました`);
      } catch (err) {
        console.error(err);
        this._notify('フォントの読み込みに失敗: ' + err.message, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  },

  // ─── Side Bearings ────────────────────────────────────────────────────────────

  _updateBearingDisplay() {
    if (!this.editor || !this.editor.glyph) return;
    const g = this.editor.glyph;
    const b = getCmdsBounds(g.pathData);
    const lsb = b.w > 0 ? Math.round(b.x) : (g.lsb || 0);
    const rsb = b.w > 0 ? Math.round(g.advanceWidth - b.x - b.w) : (g.rsb || 0);
    const lsbEl = document.getElementById('bearing-lsb');
    const rsbEl = document.getElementById('bearing-rsb');
    if (lsbEl && document.activeElement !== lsbEl) lsbEl.value = lsb;
    if (rsbEl && document.activeElement !== rsbEl) rsbEl.value = rsb;
  },

  _setLSB(value) {
    if (!this.editor || !this.editor.glyph || !this.editor.glyph.pathData.length) return;
    const b = getCmdsBounds(this.editor.glyph.pathData);
    if (b.w === 0) return;
    const dx = value - b.x;
    this.editor.glyph.pathData = transformCmds(this.editor.glyph.pathData, dx, 0, 1, 1);
    this.editor.glyph.lsb = value;
    this.editor.render();
    this.editor._notifyBBox();
    this.editor._notifyChange();
    this._updateBearingDisplay();
  },

  _setRSB(value) {
    if (!this.editor || !this.editor.glyph || !this.editor.glyph.pathData.length) return;
    const b = getCmdsBounds(this.editor.glyph.pathData);
    if (b.w === 0) return;
    const newAW = Math.round(b.x + b.w + value);
    this.editor.glyph.advanceWidth = newAW;
    this.editor.glyph.rsb = value;
    document.getElementById('advance-width').value = newAW;
    this.editor.setAdvanceWidth(newAW);
    this.editor._notifyChange();
    this._updateBearingDisplay();
  },

  _batchSetBearings(lsb, rsb) {
    this._saveCurrentGlyph();
    let count = 0;
    for (const [uni, g] of Object.entries(this.project.glyphs)) {
      if (!g.pathData || !g.pathData.length) continue;
      const b = getCmdsBounds(g.pathData);
      if (b.w === 0) continue;
      // Adjust LSB
      const dx = lsb - b.x;
      g.pathData = transformCmds(g.pathData, dx, 0, 1, 1);
      g.lsb = lsb;
      // Adjust RSB
      const newB = getCmdsBounds(g.pathData);
      g.advanceWidth = Math.round(newB.x + newB.w + rsb);
      g.rsb = rsb;
      count++;
    }
    if (this.currentUnicode != null && this.project.glyphs[this.currentUnicode]) {
      this.editor.loadGlyph(this.project.glyphs[this.currentUnicode]);
      document.getElementById('advance-width').value = this.project.glyphs[this.currentUnicode].advanceWidth;
    }
    this._updateBearingDisplay();
    this._notify(`${count}グリフのベアリングを設定しました`);
  },

  _autoSetBearings(threshold) {
    this._saveCurrentGlyph();
    let count = 0;
    const upm = this.project.upm || 1000;
    for (const [uni, g] of Object.entries(this.project.glyphs)) {
      if (!g.pathData || !g.pathData.length) continue;
      const b = getCmdsBounds(g.pathData);
      if (b.w === 0) continue;
      const cp = parseInt(uni);
      const isJapanese = (cp >= 0x3040 && cp <= 0x309F) || (cp >= 0x30A0 && cp <= 0x30FF) ||
                         (cp >= 0x4E00 && cp <= 0x9FFF);
      let lsb, rsb;
      if (isJapanese) {
        // Japanese: center in em-square
        lsb = Math.round((upm - b.w) / 2);
        rsb = lsb;
      } else {
        // Latin: proportional based on threshold
        const ratio = threshold / 100;
        const base = Math.round(b.w * ratio);
        lsb = Math.max(0, Math.min(base, Math.round(upm * 0.15)));
        rsb = lsb;
      }
      const dx = lsb - b.x;
      g.pathData = transformCmds(g.pathData, dx, 0, 1, 1);
      g.lsb = lsb;
      const newB = getCmdsBounds(g.pathData);
      g.advanceWidth = Math.round(newB.x + newB.w + rsb);
      g.rsb = rsb;
      count++;
    }
    if (this.currentUnicode != null && this.project.glyphs[this.currentUnicode]) {
      this.editor.loadGlyph(this.project.glyphs[this.currentUnicode]);
      document.getElementById('advance-width').value = this.project.glyphs[this.currentUnicode].advanceWidth;
    }
    this._updateBearingDisplay();
    this._notify(`${count}グリフの自動ベアリングを設定しました`);
  },

  // ─── Kerning ──────────────────────────────────────────────────────────────────

  _updateKernDisplay() {
    const lCharEl = document.getElementById('kern-left-char');
    const rCharEl = document.getElementById('kern-right-char');
    const valEl = document.getElementById('kern-value');
    if (!lCharEl || !rCharEl || !valEl) return;
    if (this.kernPair.left != null) {
      lCharEl.textContent = String.fromCodePoint(this.kernPair.left);
    } else {
      lCharEl.textContent = '-';
    }
    if (this.kernPair.right != null) {
      rCharEl.textContent = String.fromCodePoint(this.kernPair.right);
    } else {
      rCharEl.textContent = '-';
    }
    if (this.kernPair.left != null && this.kernPair.right != null) {
      const key = `${this.kernPair.left},${this.kernPair.right}`;
      valEl.value = this.project.kerning[key] || 0;
    } else {
      valEl.value = 0;
    }
  },

  _setKernValue(val) {
    if (this.kernPair.left == null || this.kernPair.right == null) return;
    const key = `${this.kernPair.left},${this.kernPair.right}`;
    if (val === 0) {
      delete this.project.kerning[key];
    } else {
      this.project.kerning[key] = val;
    }
    this._renderKernPreview();
  },

  _renderKernPreview() {
    const container = document.getElementById('kern-preview');
    if (!container) return;
    if (this.kernPair.left == null || this.kernPair.right == null) {
      container.textContent = '';
      return;
    }
    const lChar = String.fromCodePoint(this.kernPair.left);
    const rChar = String.fromCodePoint(this.kernPair.right);
    const key = `${this.kernPair.left},${this.kernPair.right}`;
    const kv = this.project.kerning[key] || 0;
    container.innerHTML = '';
    const span = document.createElement('span');
    span.style.fontFamily = this.previewFontFamily ? `'${this.previewFontFamily}', sans-serif` : 'sans-serif';
    span.style.fontSize = '48px';
    span.style.letterSpacing = kv + 'px';
    span.textContent = lChar + rChar;
    container.appendChild(span);
    const info = document.createElement('div');
    info.style.fontSize = '10px';
    info.style.color = 'var(--text3)';
    info.style.marginTop = '4px';
    info.textContent = `カーニング値: ${kv}`;
    container.appendChild(info);
  },

  _autoKern() {
    this._saveCurrentGlyph();
    const glyphs = this.project.glyphs;
    const upm = this.project.upm || 1000;
    const threshold = parseFloat(document.getElementById('auto-kern-threshold')?.value) || 5;
    let count = 0;
    const unicodes = Object.keys(glyphs).map(Number).filter(u => {
      const g = glyphs[u];
      return g && g.pathData && g.pathData.length > 0;
    });

    for (let i = 0; i < unicodes.length; i++) {
      const u1 = unicodes[i];
      const g1 = glyphs[u1];
      const b1 = getCmdsBounds(g1.pathData);
      if (b1.w === 0) continue;
      const rightEdge1 = b1.x + b1.w;
      const rsb1 = g1.advanceWidth - rightEdge1;

      for (let j = 0; j < unicodes.length; j++) {
        const u2 = unicodes[j];
        const g2 = glyphs[u2];
        const b2 = getCmdsBounds(g2.pathData);
        if (b2.w === 0) continue;
        const lsb2 = b2.x;
        // Kern = reduce gap if gap is too wide, add if too tight
        const gap = rsb1 + lsb2;
        const ideal = upm * threshold / 100;
        const kern = Math.round(ideal - gap);
        if (Math.abs(kern) > 2) {
          const key = `${u1},${u2}`;
          this.project.kerning[key] = kern;
          count++;
        }
      }
    }
    this._updateKernDisplay();
    this._renderKernPreview();
    this._notify(`${count}ペアの自動カーニングを設定しました`);
  },

  _clearAllKerning() {
    this.project.kerning = {};
    this._updateKernDisplay();
    this._renderKernPreview();
    this._notify('カーニングをすべてクリアしました');
  },

  _renderKernTable() {
    const tbody = document.getElementById('kern-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    const pairs = Object.entries(this.project.kerning);
    if (!pairs.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="3" style="color:var(--text3);text-align:center;padding:8px">カーニングペアなし</td>';
      tbody.appendChild(tr);
      return;
    }
    // Show max 50 pairs
    const shown = pairs.slice(0, 50);
    for (const [key, val] of shown) {
      const [u1, u2] = key.split(',').map(Number);
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${String.fromCodePoint(u1)}</td><td>${String.fromCodePoint(u2)}</td><td>${val}</td>`;
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => {
        this.kernPair.left = u1;
        this.kernPair.right = u2;
        this._updateKernDisplay();
        this._renderKernPreview();
      });
      tbody.appendChild(tr);
    }
    if (pairs.length > 50) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="3" style="color:var(--text3);text-align:center">…他 ${pairs.length - 50}ペア</td>`;
      tbody.appendChild(tr);
    }
  },

  // ─── Boolean Operations ──────────────────────────────────────────────────────

  _boolUnion() {
    if (!this.editor || !this.editor.glyph || !this.editor.glyph.pathData.length) return;
    // Union: combine all subpaths using evenodd fill rule (already displayed that way)
    // Flatten all subpaths into one continuous path array (already the storage format)
    // Ensure all subpaths are closed
    const cmds = this.editor.glyph.pathData;
    const subs = splitSubpaths(cmds);
    const result = [];
    for (const sub of subs) {
      for (const c of sub.cmds) result.push(c);
      if (!sub.closed) result.push({ type: 'Z' });
    }
    this.editor.updatePathData(result);
    this._notify('合体 (Union) を適用しました');
  },

  _boolSubtract() {
    if (!this.editor || !this.editor.glyph || !this.editor.glyph.pathData.length) return;
    const cmds = this.editor.glyph.pathData;
    const subs = splitSubpaths(cmds);
    if (subs.length < 2) { this._notify('2つ以上のサブパスが必要です', 'error'); return; }
    // Keep first subpath, reverse all subsequent ones (subtract = reverse winding of front paths)
    const result = [];
    for (let i = 0; i < subs.length; i++) {
      if (i === 0) {
        for (const c of subs[i].cmds) result.push(c);
        if (!subs[i].closed) result.push({ type: 'Z' });
      } else {
        const reversed = reverseCmds(subs[i].cmds);
        for (const c of reversed) result.push(c);
        if (!subs[i].closed) result.push({ type: 'Z' });
      }
    }
    this.editor.updatePathData(result);
    this._notify('前面を削除 (Subtract) を適用しました');
  },

  _boolRemoveOverlap() {
    if (!this.editor || !this.editor.glyph || !this.editor.glyph.pathData.length) return;
    // Flatten: ensure consistent winding then combine
    const cmds = this.editor.glyph.pathData;
    const subs = splitSubpaths(cmds);
    const result = [];
    for (const sub of subs) {
      const area = windingArea(sub.cmds);
      let subCmds = sub.cmds;
      // Ensure consistent clockwise winding (positive area in font coords)
      if (area < 0) {
        subCmds = reverseCmds(subCmds);
      }
      for (const c of subCmds) result.push(c);
      if (!sub.closed) result.push({ type: 'Z' });
    }
    this.editor.updatePathData(cleanupCmds(result));
    this._notify('オーバーラップ除去を適用しました');
  },

  // ─── Font Validation ────────────────────────────────────────────────────────

  _validateAllGlyphs() {
    this._saveCurrentGlyph();
    const results = [];
    for (const [unicodeStr, glyph] of Object.entries(this.project.glyphs)) {
      const unicode = parseInt(unicodeStr);
      const char = String.fromCodePoint(unicode);
      if (!glyph.pathData || !glyph.pathData.length) continue;
      const cmds = glyph.pathData;
      const subs = splitSubpaths(cmds);

      // Check open paths
      for (let i = 0; i < subs.length; i++) {
        if (!subs[i].closed) {
          results.push({ unicode, char, issue: `「${char}」のパス${i + 1}/${subs.length}: 閉じていない（Zが不足）`, autofix: 'close', subIdx: i });
        }
      }

      // Check winding: if multiple subpaths, check outer/hole relationship
      if (subs.length > 1) {
        const subData = subs.map((s, idx) => ({
          idx, bounds: getCmdsBounds(s.cmds), area: windingArea(s.cmds)
        }));
        subData.sort((a, b) => Math.abs(b.area) - Math.abs(a.area));
        for (let i = 0; i < subData.length; i++) {
          const sd = subData[i];
          const cx = sd.bounds.x + sd.bounds.w / 2, cy = sd.bounds.y + sd.bounds.h / 2;
          let isHole = false;
          for (let j = 0; j < i; j++) {
            const bj = subData[j].bounds;
            if (cx > bj.x && cx < bj.x + bj.w && cy > bj.y && cy < bj.y + bj.h) {
              isHole = true; break;
            }
          }
          // OTF/CFF: outer = positive area (CCW), hole = negative area (CW)
          const shouldBePos = !isHole;
          if ((shouldBePos && sd.area < 0) || (!shouldBePos && sd.area > 0)) {
            const role = isHole ? '穴' : '外側';
            results.push({ unicode, char, issue: `「${char}」のパス${sd.idx + 1}（${role}）: 巻き方向が逆`, autofix: 'winding' });
          }
        }
      }

      // Check very small segments
      let prevX = 0, prevY = 0;
      let smallCount = 0;
      for (const c of cmds) {
        if (c.type === 'M') { prevX = c.x; prevY = c.y; continue; }
        if (c.type === 'Z') continue;
        if (c.x !== undefined) {
          const dist = Math.hypot(c.x - prevX, c.y - prevY);
          if (dist < 1 && dist > 0) smallCount++;
          prevX = c.x; prevY = c.y;
        }
      }
      if (smallCount > 0) {
        results.push({ unicode, char, issue: `「${char}」: 極小セグメント${smallCount}個`, autofix: 'cleanup' });
      }
    }

    // Render results
    const container = document.getElementById('validation-results');
    if (!container) return;
    container.innerHTML = '';
    if (results.length === 0) {
      container.innerHTML = '<div style="color:#7a9b7e;padding:6px;font-weight:bold">問題は見つかりませんでした ✓</div>';
      this._notify('バリデーション完了: 問題なし');
      return;
    }

    // Auto-fix all button
    const fixAllBtn = document.createElement('button');
    fixAllBtn.className = 'panel-btn btn-green';
    fixAllBtn.style.cssText = 'text-align:center;justify-content:center;margin-bottom:6px';
    fixAllBtn.textContent = `全て自動修正 (${results.length}件)`;
    fixAllBtn.addEventListener('click', () => this._autoFixAll());
    container.appendChild(fixAllBtn);

    for (const r of results) {
      const div = document.createElement('div');
      div.className = 'validation-item';
      div.innerHTML = `<span class="validation-issue">${r.issue}</span>`;
      div.style.cursor = 'pointer';
      div.addEventListener('click', () => this.selectChar(r.unicode));
      container.appendChild(div);
    }
    this._notify(`${results.length}件の問題が見つかりました`);
  },

  _autoFixAll() {
    this._saveCurrentGlyph();
    let fixCount = 0;
    for (const [unicodeStr, glyph] of Object.entries(this.project.glyphs)) {
      if (!glyph.pathData || !glyph.pathData.length) continue;
      // Fix winding direction
      const fixed = fixWindingForExport(glyph.pathData);
      // Close open paths
      const subs = splitSubpaths(fixed);
      const closed = [];
      for (const sub of subs) {
        closed.push(...sub.cmds);
        if (!sub.closed) closed.push({ type: 'Z' });
      }
      // Cleanup small segments
      const cleaned = cleanupCmds(closed, 1);
      if (JSON.stringify(cleaned) !== JSON.stringify(glyph.pathData)) {
        glyph.pathData = cleaned;
        fixCount++;
      }
    }
    if (this.currentUnicode != null && this.project.glyphs[this.currentUnicode]) {
      this.editor.loadGlyph(this.project.glyphs[this.currentUnicode]);
    }
    this._notify(`${fixCount}グリフを自動修正しました`);
    this._validateAllGlyphs(); // Re-validate
  },

  // ─── Ligatures ──────────────────────────────────────────────────────────────

  _addLigature() {
    const charsInput = document.getElementById('liga-chars');
    const unicodeInput = document.getElementById('liga-unicode');
    if (!charsInput || !unicodeInput) return;
    const chars = charsInput.value.trim();
    const unicode = parseInt(unicodeInput.value);
    if (!chars || chars.length < 2) {
      this._notify('2文字以上の文字列を入力してください', 'error');
      return;
    }
    if (!unicode || isNaN(unicode)) {
      this._notify('有効なUnicodeコードポイントを入力してください', 'error');
      return;
    }
    if (!this.project.ligatures) this.project.ligatures = [];
    // Check for duplicates
    if (this.project.ligatures.some(l => l.chars === chars)) {
      this._notify('この文字列のリガチャは既に存在します', 'error');
      return;
    }
    this.project.ligatures.push({ chars, unicode });
    charsInput.value = '';
    unicodeInput.value = '';
    this._renderLigatureList();
    this._notify(`リガチャ "${chars}" を追加しました`);
  },

  _renderLigatureList() {
    const container = document.getElementById('liga-list');
    if (!container) return;
    container.innerHTML = '';
    if (!this.project.ligatures || !this.project.ligatures.length) {
      container.innerHTML = '<div style="color:var(--text3);padding:4px">リガチャなし</div>';
      return;
    }
    for (let i = 0; i < this.project.ligatures.length; i++) {
      const liga = this.project.ligatures[i];
      const item = document.createElement('div');
      item.className = 'liga-item';
      item.innerHTML = `<span class="liga-chars">${liga.chars}</span><span class="liga-unicode">U+${liga.unicode.toString(16).toUpperCase().padStart(4, '0')}</span>`;
      const delBtn = document.createElement('button');
      delBtn.className = 'liga-del';
      delBtn.textContent = '×';
      delBtn.addEventListener('click', () => {
        this.project.ligatures.splice(i, 1);
        this._renderLigatureList();
        this._notify('リガチャを削除しました');
      });
      item.appendChild(delBtn);
      container.appendChild(item);
    }
  },

  // ─── Waterfall Preview ──────────────────────────────────────────────────────

  _renderWaterfall() {
    if (!this.previewFontFamily) {
      this._loadFontForPreview();
      // Wait for font to load then render waterfall
      setTimeout(() => this._renderWaterfallDisplay(), 500);
      return;
    }
    this._renderWaterfallDisplay();
  },

  _renderWaterfallDisplay() {
    const container = document.getElementById('preview-display');
    if (!container) return;
    const text = document.getElementById('preview-text')?.value || 'The quick brown fox jumps over the lazy dog';
    const bg = document.getElementById('preview-bg')?.value || 'white';
    container.style.backgroundColor = bg === 'black' ? '#111' : bg === 'gray' ? '#888' : '#fff';
    container.style.color = bg === 'black' ? '#fff' : '#000';
    container.innerHTML = '';
    const sizes = [12, 16, 20, 24, 32, 48, 72, 96];
    const firstLine = text.split('\n')[0] || text;
    for (const size of sizes) {
      const row = document.createElement('div');
      row.className = 'waterfall-line';
      const label = document.createElement('span');
      label.className = 'waterfall-label';
      label.textContent = size + 'px';
      row.appendChild(label);
      const span = document.createElement('span');
      span.style.fontFamily = this.previewFontFamily ? `'${this.previewFontFamily}', sans-serif` : 'sans-serif';
      span.style.fontSize = size + 'px';
      span.style.lineHeight = '1.3';
      span.textContent = firstLine;
      row.appendChild(span);
      container.appendChild(row);
    }
    this._notify('ウォーターフォールプレビューを表示しました');
  },

  // ─── Component/Reference Glyphs ─────────────────────────────────────────────

  _populateComponentSelect() {
    const select = document.getElementById('component-glyph-select');
    if (!select) return;
    const current = select.value;
    select.innerHTML = '<option value="">グリフを選択...</option>';
    for (const g of ALL_CHARS) {
      if (this.project.glyphs[g.unicode] && this.project.glyphs[g.unicode].pathData && this.project.glyphs[g.unicode].pathData.length > 0) {
        const opt = document.createElement('option');
        opt.value = g.unicode;
        opt.textContent = `${g.char} (U+${g.unicode.toString(16).toUpperCase().padStart(4, '0')})`;
        select.appendChild(opt);
      }
    }
    if (current) select.value = current;
  },

  _addComponentGlyph() {
    const select = document.getElementById('component-glyph-select');
    if (!select || !select.value) { this._notify('グリフを選択してください', 'error'); return; }
    const srcUnicode = parseInt(select.value);
    const srcGlyph = this.project.glyphs[srcUnicode];
    if (!srcGlyph || !srcGlyph.pathData || !srcGlyph.pathData.length) {
      this._notify('選択されたグリフにパスデータがありません', 'error');
      return;
    }
    if (!this.editor || !this.editor.glyph) return;
    // Copy paths from source glyph into current glyph
    const copiedPaths = JSON.parse(JSON.stringify(srcGlyph.pathData));
    this.editor.glyph.pathData = this.editor.glyph.pathData.concat(copiedPaths);
    this.editor.render();
    this.editor._notifyBBox();
    this.editor._notifyChange();
    this._notify(`"${String.fromCodePoint(srcUnicode)}" のパスを参照追加しました`);
  },

  // ─── Custom Guidelines ──────────────────────────────────────────────────────

  _addCustomGuide() {
    const input = document.getElementById('guide-y-input');
    if (!input) return;
    const y = parseFloat(input.value);
    if (isNaN(y)) { this._notify('Y座標を入力してください', 'error'); return; }
    if (!this.editor.customGuides) this.editor.customGuides = [];
    if (this.editor.customGuides.includes(y)) { this._notify('このガイドラインは既に存在します', 'error'); return; }
    this.editor.customGuides.push(y);
    input.value = '';
    this.editor.render();
    this._renderCustomGuidesList();
    this._notify(`Y=${y} にガイドラインを追加しました`);
  },

  // ─── Experimental: Auto-Optimize ────────────────────────────────────────────

  _optimizeCmds(cmds, targetNodes) {
    // Process each subpath separately, distribute node budget proportionally
    const subs = splitSubpaths(cmds);
    if (!subs.length) return cmds;

    // Calculate total points and distribute budget
    const subPoints = subs.map(sub => {
      const pts = [];
      let px = 0, py = 0;
      for (const c of sub.cmds) {
        if (c.type === 'M') { px = c.x; py = c.y; pts.push({ x: px, y: py }); }
        else if (c.type === 'L') { px = c.x; py = c.y; pts.push({ x: px, y: py }); }
        else if (c.type === 'C') {
          // Sample curve at multiple points for accurate representation
          for (let t = 0.1; t <= 1.0; t += 0.1) {
            const mt = 1 - t;
            pts.push({
              x: mt*mt*mt*px + 3*mt*mt*t*c.cp1x + 3*mt*t*t*c.cp2x + t*t*t*c.x,
              y: mt*mt*mt*py + 3*mt*mt*t*c.cp1y + 3*mt*t*t*c.cp2y + t*t*t*c.y,
            });
          }
          px = c.x; py = c.y;
        }
      }
      return { sub, pts, closed: sub.closed };
    });

    const totalPts = subPoints.reduce((s, sp) => s + sp.pts.length, 0);
    // Reserve at least 3 nodes per subpath
    const minPerSub = 3;
    const reserved = subs.length * minPerSub;
    const distributable = Math.max(0, targetNodes - reserved);

    const result = [];
    for (const sp of subPoints) {
      // Allocate nodes proportionally
      const ratio = totalPts > 0 ? sp.pts.length / totalPts : 1 / subs.length;
      const budget = Math.max(minPerSub, Math.round(minPerSub + distributable * ratio));

      // Use RDP with increasing tolerance until we're under budget
      let bestPts = sp.pts;
      for (let tol = 1; tol <= 500; tol *= 1.3) {
        const simplified = this._rdpSimplify(sp.pts, tol);
        if (simplified.length <= budget) {
          bestPts = simplified;
          break;
        }
        bestPts = simplified; // keep last attempt
      }

      // If still over budget, just evenly sample
      if (bestPts.length > budget) {
        const sampled = [bestPts[0]];
        const step = (bestPts.length - 1) / (budget - 1);
        for (let i = 1; i < budget - 1; i++) {
          sampled.push(bestPts[Math.round(i * step)]);
        }
        sampled.push(bestPts[bestPts.length - 1]);
        bestPts = sampled;
      }

      // Fit smooth cubic bezier curves through the simplified points
      if (bestPts.length < 2) continue;
      result.push({ type: 'M', x: bestPts[0].x, y: bestPts[0].y });
      if (bestPts.length === 2) {
        result.push({ type: 'L', x: bestPts[1].x, y: bestPts[1].y });
      } else {
        const n = bestPts.length;
        for (let i = 0; i < (sp.closed ? n : n - 1); i++) {
          const p0 = bestPts[(i - 1 + n) % n];
          const p1 = bestPts[i];
          const p2 = bestPts[(i + 1) % n];
          const p3 = bestPts[(i + 2) % n];
          const cp1x = p1.x + (p2.x - p0.x) / 6;
          const cp1y = p1.y + (p2.y - p0.y) / 6;
          const cp2x = p2.x - (p3.x - p1.x) / 6;
          const cp2y = p2.y - (p3.y - p1.y) / 6;
          result.push({ type: 'C', cp1x, cp1y, cp2x, cp2y, x: p2.x, y: p2.y });
        }
      }
      if (sp.closed) result.push({ type: 'Z' });
    }

    return result;
  },

  _rdpSimplify(pts, epsilon) {
    if (pts.length < 3) return pts;
    let maxD = 0, idx = 0;
    const first = pts[0], last = pts[pts.length - 1];
    for (let i = 1; i < pts.length - 1; i++) {
      const dx = last.x - first.x, dy = last.y - first.y;
      const len2 = dx * dx + dy * dy;
      let d;
      if (len2 === 0) {
        d = Math.hypot(pts[i].x - first.x, pts[i].y - first.y);
      } else {
        const t = ((pts[i].x - first.x) * dx + (pts[i].y - first.y) * dy) / len2;
        d = Math.hypot(pts[i].x - (first.x + t * dx), pts[i].y - (first.y + t * dy));
      }
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > epsilon) {
      const left = this._rdpSimplify(pts.slice(0, idx + 1), epsilon);
      const right = this._rdpSimplify(pts.slice(idx), epsilon);
      return [...left.slice(0, -1), ...right];
    }
    return [first, last];
  },

  _loadExpRef(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const paths = extractPathsFromSVG(e.target.result);
        if (!paths.length) { this._notify('SVGにパスが見つかりません', 'error'); return; }
        let allCmds = [];
        for (const p of paths) allCmds = allCmds.concat(p);
        this._expRefCmds = allCmds;
        document.getElementById('exp-ref-status').textContent = `✓ 元SVG読込済み (${allCmds.filter(c=>c.type!=='Z').length}ノード)`;
        document.getElementById('exp-ref-drop').textContent = file.name;
        document.getElementById('exp-ref-drop').style.borderColor = '#7a9b7e';
      } catch (err) {
        this._notify('SVG読込エラー: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  },

  _runAutoOptimize() {
    if (!this.editor || !this.editor.glyph || !this.editor.glyph.pathData.length) {
      this._notify('グリフにパスがありません', 'error');
      return;
    }
    this._pushUndo(); // Save state before optimization

    const targetNodes = parseInt(document.getElementById('exp-target-nodes')?.value) || 20;
    const resultEl = document.getElementById('exp-result');
    resultEl.textContent = '最適化中...';

    // Use requestAnimationFrame to not block UI
    requestAnimationFrame(() => {
      try {
        const origCmds = JSON.parse(JSON.stringify(this.editor.glyph.pathData));
        // Reference: either loaded SVG or the current glyph itself
        const refCmds = this._expRefCmds
          ? this._fitRefToCurrentSpace(this._expRefCmds)
          : JSON.parse(JSON.stringify(origCmds));

        // Step 1: Simplify to near target node count using increasing tolerance
        let bestCmds = origCmds;
        let bestScore = Infinity;
        const tolerances = [0.5, 1, 1.5, 2, 3, 4, 5, 7, 10, 14, 18, 22];

        for (const tol of tolerances) {
          let simplified = simplifyCmds(JSON.parse(JSON.stringify(origCmds)), tol);
          const nodeCount = simplified.filter(c => c.type === 'M' || c.type === 'L' || c.type === 'C').length;

          if (nodeCount <= targetNodes && nodeCount >= 4) {
            // Step 2: Fit smooth bezier curves to the simplified path
            let fitted = fitSmoothBezier(simplified);
            const fittedCount = fitted.filter(c => c.type === 'M' || c.type === 'L' || c.type === 'C').length;

            // If still over target, simplify a bit more
            if (fittedCount > targetNodes) {
              const extraTol = tol * 1.2;
              simplified = simplifyCmds(JSON.parse(JSON.stringify(origCmds)), extraTol);
              fitted = fitSmoothBezier(simplified);
            }

            // Step 3: Score against reference by sampling points
            const score = this._comparePathSimilarity(fitted, refCmds);
            if (score < bestScore) {
              bestScore = score;
              bestCmds = fitted;
            }
          }
        }

        // If we never found a good fit under target, use the best tolerance that gets close
        if (bestScore === Infinity) {
          for (const tol of tolerances) {
            let simplified = simplifyCmds(JSON.parse(JSON.stringify(origCmds)), tol);
            let fitted = fitSmoothBezier(simplified);
            const nodeCount = fitted.filter(c => c.type === 'M' || c.type === 'L' || c.type === 'C').length;
            if (nodeCount <= targetNodes + 5) {
              bestCmds = fitted;
              break;
            }
          }
        }

        // Apply result
        this.editor.glyph.pathData = bestCmds;
        this.editor.render();
        this.editor._notifyBBox();
        this.editor._notifyChange();

        const finalCount = bestCmds.filter(c => c.type === 'M' || c.type === 'L' || c.type === 'C').length;
        const origCount = origCmds.filter(c => c.type === 'M' || c.type === 'L' || c.type === 'C').length;
        resultEl.innerHTML = `完了! <strong>${origCount}</strong> → <strong>${finalCount}</strong> ノード` +
          (bestScore < Infinity ? ` (類似度スコア: ${bestScore.toFixed(1)})` : '');
        this._notify(`${origCount} → ${finalCount} ノードに最適化しました`);
      } catch (err) {
        console.error(err);
        resultEl.textContent = 'エラー: ' + err.message;
        this._notify('最適化に失敗しました', 'error');
      }
    });
  },

  _fitRefToCurrentSpace(refCmds) {
    // Scale reference SVG to match current glyph's bounding box
    const currentB = getCmdsBounds(this.editor.glyph.pathData);
    const refB = getCmdsBounds(refCmds);
    if (refB.w === 0 || refB.h === 0 || currentB.w === 0) return refCmds;

    const sx = currentB.w / refB.w;
    const sy = currentB.h / refB.h;
    let fitted = transformCmds(JSON.parse(JSON.stringify(refCmds)), -refB.x, -refB.y, 1, 1);
    fitted = transformCmds(fitted, 0, 0, sx, sy);
    fitted = transformCmds(fitted, currentB.x, currentB.y, 1, 1);
    return fitted;
  },

  _comparePathSimilarity(cmdsA, cmdsB) {
    // Sample points along both paths and compute average distance
    const samplePath = (cmds) => {
      const pts = [];
      let px = 0, py = 0;
      for (const c of cmds) {
        if (c.type === 'M') { px = c.x; py = c.y; pts.push({ x: px, y: py }); }
        else if (c.type === 'L') { px = c.x; py = c.y; pts.push({ x: px, y: py }); }
        else if (c.type === 'C') {
          for (let t = 0.25; t <= 1; t += 0.25) {
            const mt = 1 - t;
            pts.push({
              x: mt*mt*mt*px + 3*mt*mt*t*c.cp1x + 3*mt*t*t*c.cp2x + t*t*t*c.x,
              y: mt*mt*mt*py + 3*mt*mt*t*c.cp1y + 3*mt*t*t*c.cp2y + t*t*t*c.y,
            });
          }
          px = c.x; py = c.y;
        }
      }
      return pts;
    };

    const ptsA = samplePath(cmdsA);
    const ptsB = samplePath(cmdsB);
    if (!ptsA.length || !ptsB.length) return Infinity;

    // For each point in A, find nearest point in B
    let totalDist = 0;
    for (const a of ptsA) {
      let minD = Infinity;
      for (const b of ptsB) {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < minD) minD = d;
      }
      totalDist += minD;
    }
    return totalDist / ptsA.length;
  },

  _renderCustomGuidesList() {
    const container = document.getElementById('custom-guides-list');
    if (!container) return;
    container.innerHTML = '';
    const yGuides = this.editor.customGuides || [];
    const xGuides = this.editor.customGuidesX || [];
    if (!yGuides.length && !xGuides.length) {
      container.innerHTML = '<div style="color:var(--text3);padding:4px">ガイドラインなし</div>';
      return;
    }
    for (let i = 0; i < yGuides.length; i++) {
      const item = document.createElement('div');
      item.className = 'guide-item';
      item.innerHTML = `<span class="guide-val">Y = ${yGuides[i]}</span>`;
      const delBtn = document.createElement('button');
      delBtn.className = 'guide-del';
      delBtn.textContent = '×';
      delBtn.addEventListener('click', () => {
        this.editor.customGuides.splice(i, 1);
        this.editor.render();
        this._renderCustomGuidesList();
      });
      item.appendChild(delBtn);
      container.appendChild(item);
    }
    for (let i = 0; i < xGuides.length; i++) {
      const item = document.createElement('div');
      item.className = 'guide-item';
      item.innerHTML = `<span class="guide-val">X = ${xGuides[i]}</span>`;
      const delBtn = document.createElement('button');
      delBtn.className = 'guide-del';
      delBtn.textContent = '×';
      delBtn.addEventListener('click', () => {
        this.editor.customGuidesX.splice(i, 1);
        this.editor.render();
        this._renderCustomGuidesList();
      });
      item.appendChild(delBtn);
      container.appendChild(item);
    }
  },

  // ─── Template ─────────────────────────────────────────────────────────────────

  _downloadTemplate(withRef = true) {
    const { ascender, descender, upm, capHeight, xHeight } = this.project;
    const fontH = ascender - descender;
    const cellSize = upm;
    const cols = 10;
    const chars = [];
    for (const g of CHAR_GROUPS) {
      for (const ch of g.chars) {
        chars.push({ char: ch, unicode: ch.codePointAt(0) });
      }
    }
    const rows = Math.ceil(chars.length / cols);
    const svgW = cols * cellSize;
    const svgH = rows * cellSize;
    const labelSize = Math.round(cellSize * 0.05);
    const charLabelSize = Math.round(cellSize * 0.08);

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
<!-- FONT_TEMPLATE cols="${cols}" cellSize="${cellSize}" upm="${upm}" ascender="${ascender}" descender="${descender}" capHeight="${capHeight}" xHeight="${xHeight}" -->
<style>
  .cell-border { fill: none; stroke: #000; stroke-width: 1; }
  .guide { stroke: #ccc; stroke-width: 0.5; stroke-dasharray: 4,4; }
  .baseline { stroke: #999; stroke-width: 1; }
  .u-label { font-family: monospace; font-size: ${labelSize}px; fill: #999; }
  .c-label { font-family: sans-serif; font-size: ${charLabelSize}px; fill: #bbb; font-weight: bold; }
  .ref-char { font-family: sans-serif; font-size: ${cellSize * 0.7}px; fill: #e0e0e0; text-anchor: middle; dominant-baseline: alphabetic; }
</style>
<rect data-template="1" width="100%" height="100%" fill="white"/>
`;

    for (let i = 0; i < chars.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * cellSize;
      const y = row * cellSize;
      const { char, unicode } = chars[i];
      const uLabel = `U+${unicode.toString(16).toUpperCase().padStart(4, '0')}`;
      const baseY = y + (ascender / fontH) * cellSize;
      const capY = y + ((ascender - capHeight) / fontH) * cellSize;
      const xhY = y + ((ascender - xHeight) / fontH) * cellSize;
      const displayChar = char === ' ' ? 'Space' : char.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

      // Cell border
      svg += `<rect data-template="1" x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" class="cell-border"/>
`;
      // Guide lines
      svg += `<line data-template="1" x1="${x}" y1="${capY}" x2="${x + cellSize}" y2="${capY}" class="guide"/>
`;
      svg += `<line data-template="1" x1="${x}" y1="${xhY}" x2="${x + cellSize}" y2="${xhY}" class="guide"/>
`;
      // Baseline
      svg += `<line data-template="1" x1="${x}" y1="${baseY}" x2="${x + cellSize}" y2="${baseY}" class="baseline"/>
`;

      if (withRef) {
        // === お手本付き ===
        // Unicode label (small, top-left)
        svg += `<text data-template="1" x="${x + 4}" y="${y + labelSize + 2}" class="u-label">${uLabel}</text>
`;
        // Character label (small, top-right)
        svg += `<text data-template="1" x="${x + cellSize - 4}" y="${y + labelSize + 2}" class="u-label" text-anchor="end">${displayChar}</text>
`;
        // Reference character
        svg += `<text data-template="1" x="${x + cellSize / 2}" y="${baseY}" class="ref-char">${displayChar}</text>
`;
      } else {
        // === お手本なし（枠のみ） ===
        // Unicode label centered at top
        svg += `<text data-template="1" x="${x + cellSize / 2}" y="${y + labelSize + 3}" class="u-label" text-anchor="middle">${uLabel}</text>
`;
        // Character label centered below unicode
        svg += `<text data-template="1" x="${x + cellSize / 2}" y="${y + labelSize + charLabelSize + 6}" class="c-label" text-anchor="middle">${displayChar}</text>
`;
      }

      // Placeholder group for user drawing
      svg += `<g id="glyph-${uLabel}" data-unicode="${unicode}" data-char="${displayChar}">
</g>
`;
    }

    svg += `</svg>`;

    const suffix = withRef ? 'with_ref' : 'no_ref';
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.project.name || 'MyFont'}_template_${suffix}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    this._notify(withRef ? 'お手本付きテンプレートをダウンロードしました' : '枠のみテンプレートをダウンロードしました');
  },

  _importTemplate(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const svgText = e.target.result;
        const metaMatch = svgText.match(/FONT_TEMPLATE\s+cols="(\d+)"\s+cellSize="(\d+)"\s+upm="(\d+)"\s+ascender="(-?\d+)"\s+descender="(-?\d+)"\s+capHeight="(\d+)"\s+xHeight="(\d+)"/);
        if (!metaMatch) {
          this._notify('テンプレートのメタデータが見つかりません。テンプレートボタンでダウンロードしたSVGを使ってください。', 'error');
          return;
        }
        const cols = parseInt(metaMatch[1]);
        const cellSize = parseInt(metaMatch[2]);
        const tUpm = parseInt(metaMatch[3]);
        const tAscender = parseInt(metaMatch[4]);
        const tDescender = parseInt(metaMatch[5]);
        const tFontH = tAscender - tDescender;

        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');

        // Build char list in same order as template generation
        const chars = [];
        for (const g of CHAR_GROUPS) {
          for (const ch of g.chars) {
            chars.push({ char: ch, unicode: ch.codePointAt(0) });
          }
        }

        // Step 1: Collect ALL user-drawn paths with their absolute coordinates
        const allUserPaths = [];
        const shapeTypes = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline'];

        const collectPaths = (el, parentMatrix) => {
          const localMatrix = getElementMatrix(el);
          const combined = multiplyMatrix(parentMatrix, localMatrix);

          if (shapeTypes.includes(el.tagName)) {
            // Skip template elements by data-template attribute (on self or any ancestor)
            if (el.getAttribute('data-template')) return;
            if (el.closest('[data-template]')) return;
            // Skip elements with template CSS classes
            if (el.getAttribute('class')) return;
            // Skip style/defs children
            if (el.closest('style') || el.closest('defs')) return;

            let cmds = [];
            if (el.tagName === 'path') {
              const d = el.getAttribute('d');
              if (d) cmds = parseSVGPath(d);
            } else if (el.tagName === 'rect') {
              const rx = parseFloat(el.getAttribute('x') || 0), ry = parseFloat(el.getAttribute('y') || 0);
              const rw = parseFloat(el.getAttribute('width') || 0), rh = parseFloat(el.getAttribute('height') || 0);
              if (rw === 0 || rh === 0) return;
              // Skip background rects (percentage or very large)
              const wAttr = el.getAttribute('width') || '';
              const hAttr = el.getAttribute('height') || '';
              if (wAttr.includes('%') || hAttr.includes('%')) return;
              cmds = [{ type: 'M', x: rx, y: ry }, { type: 'L', x: rx + rw, y: ry }, { type: 'L', x: rx + rw, y: ry + rh }, { type: 'L', x: rx, y: ry + rh }, { type: 'Z' }];
            } else if (el.tagName === 'circle') {
              const cx = parseFloat(el.getAttribute('cx') || 0), cy = parseFloat(el.getAttribute('cy') || 0), r = parseFloat(el.getAttribute('r') || 0);
              if (r === 0) return;
              cmds = parseSVGPath(`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} A ${r} ${r} 0 0 1 ${cx - r} ${cy} Z`);
            } else if (el.tagName === 'ellipse') {
              const cx = parseFloat(el.getAttribute('cx') || 0), cy = parseFloat(el.getAttribute('cy') || 0);
              const erx = parseFloat(el.getAttribute('rx') || 0), ery = parseFloat(el.getAttribute('ry') || 0);
              if (erx === 0 || ery === 0) return;
              cmds = parseSVGPath(`M ${cx - erx} ${cy} A ${erx} ${ery} 0 0 1 ${cx + erx} ${cy} A ${erx} ${ery} 0 0 1 ${cx - erx} ${cy} Z`);
            } else if (el.tagName === 'polygon' || el.tagName === 'polyline') {
              const pts = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
              if (pts.length >= 4) {
                cmds = [{ type: 'M', x: pts[0], y: pts[1] }];
                for (let i = 2; i < pts.length; i += 2) cmds.push({ type: 'L', x: pts[i], y: pts[i + 1] });
                if (el.tagName === 'polygon') cmds.push({ type: 'Z' });
              }
            }

            if (combined) cmds = applyMatrix(cmds, combined);
            if (cmds.length > 0) {
              allUserPaths.push(cmds);
            }
            return;
          }

          // Recurse into children
          for (const child of el.children) {
            collectPaths(child, combined);
          }
        };

        const root = doc.documentElement;
        const identity = [1, 0, 0, 1, 0, 0];
        for (const child of root.children) {
          if (child.tagName === 'style' || child.tagName === 'defs') continue;
          collectPaths(child, identity);
        }

        // Step 2: Assign each path to a cell based on bounding box center
        // cellPaths[cellIndex] = [cmds, cmds, ...]
        const cellPaths = {};
        for (const cmds of allUserPaths) {
          const b = getCmdsBounds(cmds);
          if (b.w === 0 && b.h === 0) continue;
          const cx = b.x + b.w / 2;
          const cy = b.y + b.h / 2;
          const col = Math.floor(cx / cellSize);
          const row = Math.floor(cy / cellSize);
          const cellIdx = row * cols + col;
          if (cellIdx >= 0 && cellIdx < chars.length) {
            if (!cellPaths[cellIdx]) cellPaths[cellIdx] = [];
            cellPaths[cellIdx].push(cmds);
          }
        }

        // Step 3: For each cell that has paths, transform to font space and import
        let importCount = 0;
        const lsb = this.project.defaultLsb || 50;
        const rsb = this.project.defaultRsb || 50;
        const scale = tFontH / cellSize;

        for (const [idxStr, pathsList] of Object.entries(cellPaths)) {
          const idx = parseInt(idxStr);
          if (idx >= chars.length) continue;
          const { char, unicode } = chars[idx];
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const cellX = col * cellSize;
          const cellY = row * cellSize;

          // Merge all paths in this cell
          let allCmds = [];
          for (const cmds of pathsList) {
            allCmds = allCmds.concat(cmds);
          }

          // Transform from cell SVG coordinates to font coordinates
          const fitted = allCmds.map(c => {
            const pt = (px, py) => ({
              x: (px - cellX) * scale,
              y: tAscender - (py - cellY) * scale,
            });
            if (c.type === 'M' || c.type === 'L') { const p = pt(c.x, c.y); return { ...c, ...p }; }
            if (c.type === 'C') {
              const p1 = pt(c.cp1x, c.cp1y), p2 = pt(c.cp2x, c.cp2y), p = pt(c.x, c.y);
              return { ...c, cp1x: p1.x, cp1y: p1.y, cp2x: p2.x, cp2y: p2.y, x: p.x, y: p.y };
            }
            return { ...c };
          });

          // Position with LSB
          const fittedB = getCmdsBounds(fitted);
          const dx = lsb - fittedB.x;
          const centeredCmds = transformCmds(fitted, dx, 0, 1, 1);
          const finalB = getCmdsBounds(centeredCmds);
          const aw = Math.round(finalB.x + finalB.w + rsb);

          this.project.glyphs[unicode] = {
            unicode, char,
            advanceWidth: aw,
            lsb, rsb,
            pathData: centeredCmds,
          };
          importCount++;
        }

        this._refreshGlyphGrid();
        if (this.currentUnicode != null && this.project.glyphs[this.currentUnicode]) {
          this.editor.loadGlyph(this.project.glyphs[this.currentUnicode]);
          document.getElementById('advance-width').value = this.project.glyphs[this.currentUnicode].advanceWidth;
        }
        this._updateBearingDisplay();

        if (importCount > 0) {
          this._notify(`テンプレートから${importCount}文字をインポートしました`);
        } else {
          this._notify('テンプレート内にパスが見つかりませんでした。文字を描いてから再アップロードしてください。', 'error');
        }
      } catch (err) {
        console.error(err);
        this._notify('テンプレートの読み込みに失敗しました: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  },
  // ─── Image Tracing ─────────────────────────────────────────────────────────

  _traceImageData: null, // { img, width, height }

  _importImage(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        this._traceImageData = { img, width: img.width, height: img.height };
        document.getElementById('image-trace-dialog').style.display = 'flex';
        this._updateTracePreview();
      };
      img.onerror = () => {
        this._notify('画像の読み込みに失敗しました', 'error');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  _updateTracePreview() {
    if (!this._traceImageData) return;
    const { img, width, height } = this._traceImageData;
    const canvas = document.getElementById('trace-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Fit image into 300x300 canvas
    const maxSize = 300;
    const scale = Math.min(maxSize / width, maxSize / height, 1);
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    canvas.width = w;
    canvas.height = h;

    // Draw and get pixel data
    ctx.drawImage(img, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);

    const threshold = parseInt(document.getElementById('trace-threshold')?.value) || 128;
    const invert = document.getElementById('trace-invert')?.checked || false;

    // Convert to binary
    const binary = this._thresholdImage(imageData, threshold, invert);

    // Draw binary preview
    const previewData = ctx.createImageData(w, h);
    for (let i = 0; i < binary.length; i++) {
      const v = binary[i] ? 0 : 255;
      previewData.data[i * 4] = v;
      previewData.data[i * 4 + 1] = v;
      previewData.data[i * 4 + 2] = v;
      previewData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(previewData, 0, 0);

    // Trace contours and draw them as overlay
    const contours = this._traceContours(binary, w, h);
    ctx.strokeStyle = '#c07070';
    ctx.lineWidth = 1;
    for (const contour of contours) {
      if (contour.length < 3) continue;
      ctx.beginPath();
      ctx.moveTo(contour[0].x, contour[0].y);
      for (let i = 1; i < contour.length; i++) {
        ctx.lineTo(contour[i].x, contour[i].y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Cache contours for import
    this._tracedContours = contours;
    this._traceScale = scale;
  },

  _thresholdImage(imageData, threshold, invert) {
    const { data, width, height } = imageData;
    const binary = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      const a = data[i * 4 + 3];
      // Grayscale using luminance weights
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      // Transparent pixels are white
      const val = a < 128 ? 255 : gray;
      let isBlack = val < threshold;
      if (invert) isBlack = !isBlack;
      binary[i] = isBlack ? 1 : 0;
    }
    return binary;
  },

  _traceContours(binary, w, h) {
    // Marching squares contour tracing
    const contours = [];
    const visited = new Uint8Array(w * h);

    const getPixel = (x, y) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return 0;
      return binary[y * w + x];
    };

    // Find boundary pixels (black pixel adjacent to white or edge)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!getPixel(x, y)) continue;
        if (visited[y * w + x]) continue;
        // Check if boundary pixel
        const isBoundary = x === 0 || y === 0 || x === w - 1 || y === h - 1 ||
          !getPixel(x - 1, y) || !getPixel(x + 1, y) ||
          !getPixel(x, y - 1) || !getPixel(x, y + 1);
        if (!isBoundary) continue;

        // Moore neighbor tracing
        const contour = this._mooreTrace(binary, w, h, x, y, visited);
        if (contour && contour.length >= 3) {
          contours.push(contour);
        }
      }
    }
    return contours;
  },

  _mooreTrace(binary, w, h, startX, startY, visited) {
    const getPixel = (x, y) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return 0;
      return binary[y * w + x];
    };

    // 8-connectivity neighbors: clockwise from left
    const dx = [-1, -1, 0, 1, 1, 1, 0, -1];
    const dy = [0, -1, -1, -1, 0, 1, 1, 1];

    const contour = [{ x: startX, y: startY }];
    visited[startY * w + startX] = 1;

    let cx = startX, cy = startY;
    // Start searching from left neighbor
    let dir = 0; // direction we came from

    // Find first background neighbor to establish starting direction
    let foundStart = false;
    for (let i = 0; i < 8; i++) {
      const nx = cx + dx[i], ny = cy + dy[i];
      if (!getPixel(nx, ny)) {
        dir = i;
        foundStart = true;
        break;
      }
    }
    if (!foundStart) return null;

    const maxSteps = w * h * 2;
    let steps = 0;

    while (steps < maxSteps) {
      steps++;
      // Search clockwise starting from (dir + 1) % 8
      let found = false;
      let searchStart = (dir + 5) % 8; // backtrack: opposite of where we came from + 1

      for (let i = 0; i < 8; i++) {
        const d = (searchStart + i) % 8;
        const nx = cx + dx[d], ny = cy + dy[d];
        if (getPixel(nx, ny)) {
          cx = nx;
          cy = ny;
          dir = (d + 4) % 8; // direction we came from (opposite)
          found = true;

          if (cx === startX && cy === startY) {
            return contour;
          }

          visited[cy * w + cx] = 1;
          contour.push({ x: cx, y: cy });
          break;
        }
      }

      if (!found) break;
      if (contour.length > maxSteps) break;
    }

    return contour.length >= 3 ? contour : null;
  },

  _contourToPath(contour, canvasW, canvasH) {
    // Convert pixel contour to font-space path commands
    // Canvas: Y goes down, origin top-left
    // Font: Y goes up, baseline at 0, ascender up
    const { ascender, descender, defaultLsb, defaultRsb } = this.project;
    const fontH = ascender - descender;
    const lsb = defaultLsb || 50;
    const rsb = defaultRsb || 50;

    // Scale contour to fit font metrics
    // Find bounding box of contour
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of contour) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const cw = maxX - minX || 1;
    const ch = maxY - minY || 1;

    // Scale to font height
    const scale = fontH / ch;
    // Convert: fontX = (px - minX) * scale + lsb
    //          fontY = ascender - (py - minY) * scale  (flip Y)
    const cmds = [];
    for (let i = 0; i < contour.length; i++) {
      const fx = (contour[i].x - minX) * scale + lsb;
      const fy = ascender - (contour[i].y - minY) * scale;
      if (i === 0) cmds.push({ type: 'M', x: fx, y: fy });
      else cmds.push({ type: 'L', x: fx, y: fy });
    }
    cmds.push({ type: 'Z' });
    return cmds;
  },

  _simplifyContour(contour, tolerance) {
    // RDP simplification for contour points
    if (contour.length < 3) return contour;
    const pts = contour.map(p => ({ x: p.x, y: p.y }));
    return this._rdpSimplify(pts, tolerance);
  },

  _importTracedImage() {
    if (!this._tracedContours || !this._tracedContours.length) {
      this._notify('トレースするパスがありません', 'error');
      return;
    }
    if (this.currentUnicode == null) {
      this._notify('文字を選択してください', 'error');
      return;
    }

    const smooth = document.getElementById('trace-smooth')?.checked || false;
    const { ascender, descender, defaultLsb, defaultRsb } = this.project;
    const fontH = ascender - descender;
    const lsb = defaultLsb || 50;
    const rsb = defaultRsb || 50;

    // Determine bounding box of all contours
    let allMinX = Infinity, allMinY = Infinity, allMaxX = -Infinity, allMaxY = -Infinity;
    for (const contour of this._tracedContours) {
      for (const p of contour) {
        if (p.x < allMinX) allMinX = p.x;
        if (p.y < allMinY) allMinY = p.y;
        if (p.x > allMaxX) allMaxX = p.x;
        if (p.y > allMaxY) allMaxY = p.y;
      }
    }
    const totalW = allMaxX - allMinX || 1;
    const totalH = allMaxY - allMinY || 1;
    const scale = fontH / totalH;

    let allCmds = [];
    for (const contour of this._tracedContours) {
      if (contour.length < 3) continue;

      // Simplify the contour first (reduce point count)
      const simplified = this._simplifyContour(contour, 1.5);
      if (simplified.length < 3) continue;

      // Convert to font coordinates
      const cmds = [];
      for (let i = 0; i < simplified.length; i++) {
        const fx = (simplified[i].x - allMinX) * scale + lsb;
        const fy = ascender - (simplified[i].y - allMinY) * scale;
        if (i === 0) cmds.push({ type: 'M', x: fx, y: fy });
        else cmds.push({ type: 'L', x: fx, y: fy });
      }
      cmds.push({ type: 'Z' });
      allCmds = allCmds.concat(cmds);
    }

    if (!allCmds.length) {
      this._notify('有効なパスが見つかりませんでした', 'error');
      return;
    }

    // Optionally smooth with bezier fitting
    if (smooth) {
      try {
        allCmds = fitSmoothBezier(allCmds);
      } catch (e) {
        console.warn('Bezier fitting failed, using line segments:', e);
      }
    }

    // Calculate advance width
    const b = getCmdsBounds(allCmds);
    const aw = Math.round(b.x + b.w + rsb);

    const unicode = this.currentUnicode;
    const char = String.fromCodePoint(unicode);
    this.project.glyphs[unicode] = {
      unicode, char,
      advanceWidth: aw,
      lsb, rsb: defaultRsb,
      pathData: allCmds,
    };

    this.editor.loadGlyph(this.project.glyphs[unicode]);
    document.getElementById('advance-width').value = aw;
    this._refreshGlyphGrid();
    this._notify(`"${char}" に画像トレース結果をインポートしました`);
    document.getElementById('image-trace-dialog').style.display = 'none';
  },
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
