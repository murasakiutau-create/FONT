/**
 * editor.js — SVG-based glyph editor
 * Handles zoom/pan, node editing, transform, path display, reference font
 */

class GlyphEditor {
  constructor(svgEl, options = {}) {
    this.svg = svgEl;
    this.options = Object.assign({
      upm: 1000,
      ascender: 800,
      descender: -200,
      capHeight: 700,
      xHeight: 500,
      onGlyphChange: null,
      onSelectionChange: null,
      onBBoxChange: null,
    }, options);

    this.glyph = null;        // current glyph data
    this.zoom = 0.5;
    this.panX = 60;
    this.panY = 40;
    this.editMode = 'select'; // 'select' | 'node' | 'pen' | 'move'
    this.selectedPath = -1;   // index into glyph.pathData
    this.selectedNode = -1;   // index within subpath
    this.selectedHandle = null; // {nodeIdx, side: 'cp1'|'cp2'}
    this.showReference = true;
    this.referenceFont = 'serif';
    this.showHandles = true;
    this.dragState = null;
    this.customGuides = [];   // array of Y values for custom guidelines
    // Pen tool state
    this.penState = null;     // { cmds: [], firstPoint: {x,y}, dragging: false, dragStart: {x,y} }

    this._buildLayers();
    this._bindEvents();
  }

  _buildLayers() {
    this.svg.innerHTML = '';
    this.svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Defs for arrow markers etc.
    const defs = this._el('defs');
    this.svg.appendChild(defs);

    // Grid layer (screen space)
    this.gridLayer = this._el('g', { id: 'grid-layer' });
    this.svg.appendChild(this.gridLayer);

    // Main editing group — font coordinate transform applied here
    this.mainGroup = this._el('g', { id: 'main-group' });
    this.svg.appendChild(this.mainGroup);

    // Reference layer (inside main group = font coords)
    this.refLayer = this._el('g', { id: 'ref-layer', opacity: '0.35' });
    this.mainGroup.appendChild(this.refLayer);

    // Glyph paths layer
    this.pathsLayer = this._el('g', { id: 'paths-layer' });
    this.mainGroup.appendChild(this.pathsLayer);

    // Advance width line (in main group)
    this.awLine = this._el('line', { id: 'aw-line', 'stroke': '#000', 'stroke-width': '1', 'stroke-dasharray': '4,4', opacity: '0.4' });
    this.mainGroup.appendChild(this.awLine);

    // Nodes layer (inside main group, compensated sizes)
    this.nodesLayer = this._el('g', { id: 'nodes-layer' });
    this.mainGroup.appendChild(this.nodesLayer);

    // Resize handles layer (inside main group)
    this.resizeLayer = this._el('g', { id: 'resize-layer' });
    this.mainGroup.appendChild(this.resizeLayer);

    // Overlay (screen space — for grid guide labels)
    this.overlayLayer = this._el('g', { id: 'overlay-layer' });
    this.svg.appendChild(this.overlayLayer);
  }

  _el(tag, attrs = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  // ─── Coordinate conversion ─────────────────────────────────────────────────

  screenToFont(sx, sy) {
    const { ascender } = this.options;
    return { x: (sx - this.panX) / this.zoom, y: ascender - (sy - this.panY) / this.zoom };
  }

  fontToScreen(fx, fy) {
    const { ascender } = this.options;
    return { x: fx * this.zoom + this.panX, y: (ascender - fy) * this.zoom + this.panY };
  }

  _updateTransform() {
    const { ascender } = this.options;
    // translate(panX, panY + ascender*zoom) scale(zoom, -zoom)
    this.mainGroup.setAttribute('transform', `translate(${this.panX}, ${this.panY + ascender * this.zoom}) scale(${this.zoom}, ${-this.zoom})`);
  }

  // ─── Load / Get ────────────────────────────────────────────────────────────

  loadGlyph(glyph) {
    this.glyph = JSON.parse(JSON.stringify(glyph)); // deep clone
    this.selectedPath = -1;
    this.selectedNode = -1;
    this.selectedHandle = null;
    this.penState = null;
    const penPreview = this.mainGroup?.querySelector('#pen-preview');
    if (penPreview) penPreview.remove();
    this.fitToView();
    this.render();
    this._notifyBBox();
  }

  getGlyph() {
    return JSON.parse(JSON.stringify(this.glyph));
  }

  updatePathData(pathData) {
    if (!this.glyph) return;
    this.glyph.pathData = pathData;
    this.render();
    this._notifyBBox();
    this._notifyChange();
  }

  // ─── View ──────────────────────────────────────────────────────────────────

  fitToView() {
    const rect = this.svg.getBoundingClientRect();
    if (!rect.width) return;
    const { ascender, descender } = this.options;
    const fontH = ascender - descender;
    const margin = 60;
    this.zoom = (rect.height - margin * 2) / fontH;
    const aw = this.glyph ? this.glyph.advanceWidth : 600;
    const totalW = aw * this.zoom;
    this.panX = (rect.width - totalW) / 2;
    this.panY = margin;
    this._updateTransform();
    this._renderGrid();
  }

  setZoom(z) {
    const rect = this.svg.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    const fpt = this.screenToFont(cx, cy);
    this.zoom = Math.max(0.05, Math.min(5, z));
    const newScreen = this.fontToScreen(fpt.x, fpt.y);
    this.panX += cx - newScreen.x;
    this.panY += cy - newScreen.y;
    this._updateTransform();
    this._renderGrid();
    this.render();
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  render() {
    if (!this.glyph) return;
    this._updateTransform();
    this._renderGrid();
    this._renderReference();
    this._renderPaths();
    this._renderNodes();
    this._renderAdvanceWidth();
    this._renderResizeHandles();
  }

  _renderGrid() {
    this.gridLayer.innerHTML = '';
    const rect = this.svg.getBoundingClientRect();
    const W = rect.width || 800, H = rect.height || 600;
    const { ascender, descender, capHeight, xHeight } = this.options;
    const aw = this.glyph ? this.glyph.advanceWidth : 600;

    const makeH = (fontY, cls) => {
      const sy = this.fontToScreen(0, fontY).y;
      const line = this._el('line', { x1: 0, y1: sy, x2: W, y2: sy, class: cls });
      this.gridLayer.appendChild(line);
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', 4);
      label.setAttribute('y', sy - 3);
      label.setAttribute('class', 'guide-label');
      label.textContent = fontY;
      this.gridLayer.appendChild(label);
    };

    // Major grid lines at font metric positions
    makeH(ascender, 'guide-line guide-ascender');
    makeH(capHeight, 'guide-line guide-capheight');
    makeH(xHeight, 'guide-line guide-xheight');
    makeH(0, 'guide-line guide-baseline');
    makeH(descender, 'guide-line guide-descender');

    // Left side bearing line (x=0)
    const sx0 = this.fontToScreen(0, 0).x;
    const lsb = this._el('line', { x1: sx0, y1: 0, x2: sx0, y2: H, class: 'guide-line guide-lsb' });
    this.gridLayer.appendChild(lsb);

    // Custom guidelines
    if (this.customGuides && this.customGuides.length) {
      for (const gy of this.customGuides) {
        const sy = this.fontToScreen(0, gy).y;
        const gLine = this._el('line', { x1: 0, y1: sy, x2: W, y2: sy, class: 'guide-line guide-custom' });
        this.gridLayer.appendChild(gLine);
        const gLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        gLabel.setAttribute('x', W - 4);
        gLabel.setAttribute('y', sy - 3);
        gLabel.setAttribute('class', 'guide-label');
        gLabel.setAttribute('text-anchor', 'end');
        gLabel.textContent = gy;
        this.gridLayer.appendChild(gLabel);
      }
    }
  }

  _renderReference() {
    this.refLayer.innerHTML = '';
    if (!this.showReference || !this.glyph || !this.glyph.char) return;
    const { ascender, descender, upm, capHeight } = this.options;
    const fontH = ascender - descender;
    const aw = this.glyph.advanceWidth || 600;

    // Size: UPM * 0.98
    const adjustedSize = (upm || fontH) * 0.98;
    // Nudge down by 3% of size to sit on baseline
    const nudge = adjustedSize * 0.03;
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('transform', `translate(${aw / 2}, ${-nudge}) scale(1, -1)`);
    text.setAttribute('x', 0);
    text.setAttribute('y', 0);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', adjustedSize);
    text.setAttribute('font-family', this.referenceFont);
    text.setAttribute('fill', '#888888');
    text.textContent = this.glyph.char;
    this.refLayer.appendChild(text);
  }


  _renderPaths() {
    this.pathsLayer.innerHTML = '';
    if (!this.glyph || !this.glyph.pathData) return;
    const pathData = this.glyph.pathData;
    if (!pathData.length) return;

    // Combine all subpaths into one d string for display
    const d = cmdsToDString(pathData);
    const pathEl = this._el('path', {
      d,
      fill: '#000000',
      'fill-rule': 'evenodd',
      stroke: '#000000',
      'stroke-width': String(1 / this.zoom),
      opacity: '1',
      class: 'glyph-path',
    });
    this.pathsLayer.appendChild(pathEl);
  }

  _renderNodes() {
    this.nodesLayer.innerHTML = '';
    if (this.editMode === 'move' || this.editMode === 'pen' || !this.glyph || !this.glyph.pathData) return;
    const cmds = this.glyph.pathData;
    const nR = 5 / this.zoom;    // node radius in font units
    const hR = 3.5 / this.zoom;  // handle radius
    const sw = 1 / this.zoom;    // stroke width

    let mx = 0, my = 0;
    let nodeIdx = 0;
    // Build list of on-curve points and handles per segment
    const subpaths = splitSubpaths(cmds);
    for (const sub of subpaths) {
      let px = 0, py = 0;
      const pts = [];
      for (const c of sub.cmds) {
        if (c.type === 'M') { px = c.x; py = c.y; pts.push({ type: 'anchor', x: c.x, y: c.y, cmdIdx: nodeIdx }); }
        else if (c.type === 'L') { pts.push({ type: 'anchor', x: c.x, y: c.y, cmdIdx: nodeIdx }); px = c.x; py = c.y; }
        else if (c.type === 'C') {
          pts.push({ type: 'handle', hx: c.cp1x, hy: c.cp1y, ax: px, ay: py, cmdIdx: nodeIdx, side: 'cp1' });
          pts.push({ type: 'handle', hx: c.cp2x, hy: c.cp2y, ax: c.x, ay: c.y, cmdIdx: nodeIdx, side: 'cp2' });
          pts.push({ type: 'anchor', x: c.x, y: c.y, cmdIdx: nodeIdx });
          px = c.x; py = c.y;
        }
        nodeIdx++;
      }

      // Draw handle lines first
      if (this.showHandles) {
        for (const p of pts) {
          if (p.type === 'handle') {
            const line = this._el('line', { x1: p.ax, y1: p.ay, x2: p.hx, y2: p.hy, stroke: '#888', 'stroke-width': sw, 'stroke-dasharray': `${3 / this.zoom},${2 / this.zoom}`, 'pointer-events': 'none' });
            this.nodesLayer.appendChild(line);
          }
        }
        // Draw handle circles
        for (const p of pts) {
          if (p.type === 'handle') {
            const isSel = this.selectedHandle && this.selectedHandle.cmdIdx === p.cmdIdx && this.selectedHandle.side === p.side;
            const circle = this._el('circle', { cx: p.hx, cy: p.hy, r: hR, fill: 'none', stroke: isSel ? '#000' : '#888', 'stroke-width': sw, cursor: 'move', 'data-cmd': p.cmdIdx, 'data-side': p.side });
            circle.addEventListener('mousedown', e => this._handleHandleMousedown(e, p.cmdIdx, p.side));
            this.nodesLayer.appendChild(circle);
          }
        }
      }

      // Draw anchor circles on top
      for (const p of pts) {
        if (p.type === 'anchor') {
          const isSel = this.selectedNode === p.cmdIdx;
          const circle = this._el('circle', { cx: p.x, cy: p.y, r: nR, fill: isSel ? '#000' : '#fff', stroke: '#000', 'stroke-width': sw * 1.5, cursor: 'move', 'data-cmd': p.cmdIdx });
          circle.addEventListener('mousedown', e => this._handleNodeMousedown(e, p.cmdIdx));
          this.nodesLayer.appendChild(circle);
        }
      }
    }
  }

  _renderAdvanceWidth() {
    const aw = this.glyph ? this.glyph.advanceWidth : 600;
    const { ascender, descender } = this.options;
    this.awLine.setAttribute('x1', aw);
    this.awLine.setAttribute('y1', descender - 100);
    this.awLine.setAttribute('x2', aw);
    this.awLine.setAttribute('y2', ascender + 100);
    this.awLine.setAttribute('stroke-width', 1.5 / this.zoom);
    this.awLine.setAttribute('stroke-dasharray', `${6 / this.zoom},${4 / this.zoom}`);
  }

  // ─── Mouse events ──────────────────────────────────────────────────────────

  _bindEvents() {
    this.svg.addEventListener('mousedown', e => this._onMousedown(e));
    this.svg.addEventListener('mousemove', e => this._onMousemove(e));
    this.svg.addEventListener('mouseup', e => this._onMouseup(e));
    this.svg.addEventListener('wheel', e => this._onWheel(e), { passive: false });
    this.svg.addEventListener('dblclick', e => this._onDblclick(e));
    this.svg.addEventListener('contextmenu', e => e.preventDefault());
    // Escape to finalize pen path
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.editMode === 'pen' && this.penState) {
        if (this.penState.cmds.length > 1) {
          this._finalizePenPath();
        } else {
          this.penState = null;
          this._renderPenPreview();
        }
      }
    });
  }

  _getEventPos(e) {
    const rect = this.svg.getBoundingClientRect();
    return { sx: e.clientX - rect.left, sy: e.clientY - rect.top };
  }

  _onMousedown(e) {
    // Pen tool: accept clicks anywhere on the canvas
    if (this.editMode === 'pen' && e.button === 0 && !e.altKey) {
      const { sx, sy } = this._getEventPos(e);
      const fp = this.screenToFont(sx, sy);
      if (e.button === 1 || (e.button === 0 && (e.altKey || e.spaceKey))) {
        this.dragState = { type: 'pan', startSx: sx, startSy: sy, startPanX: this.panX, startPanY: this.panY };
        e.preventDefault(); return;
      }
      this._penMousedown(fp, e);
      e.preventDefault();
      return;
    }
    if (e.target === this.svg || e.target === this.pathsLayer || e.target.closest('#paths-layer') || e.target.closest('#resize-layer') || e.target.closest('#nodes-layer') || e.target.closest('#pen-preview')) {
      const { sx, sy } = this._getEventPos(e);
      const fp = this.screenToFont(sx, sy);
      if (e.button === 1 || (e.button === 0 && (e.altKey || e.spaceKey))) {
        this.dragState = { type: 'pan', startSx: sx, startSy: sy, startPanX: this.panX, startPanY: this.panY };
        e.preventDefault(); return;
      }
      if (this.editMode === 'select' || this.editMode === 'node') {
        // Check if clicking on the glyph path for move (select mode only)
        if (this.editMode === 'select' && this.glyph && this.glyph.pathData.length > 0) {
          const b = getCmdsBounds(this.glyph.pathData);
          if (b.w > 0 && fp.x >= b.x && fp.x <= b.x + b.w && fp.y >= b.y && fp.y <= b.y + b.h) {
            this.dragState = { type: 'move-glyph', startSx: sx, startSy: sy, origData: JSON.parse(JSON.stringify(this.glyph.pathData)) };
            return;
          }
        }
        this.selectedNode = -1; this.selectedHandle = null;
        this._renderNodes();
        if (this.options.onSelectionChange) this.options.onSelectionChange(null, null);
      }
    }
  }

  _handleNodeMousedown(e, cmdIdx) {
    e.stopPropagation();
    const { sx, sy } = this._getEventPos(e);
    this.selectedNode = cmdIdx;
    this.selectedHandle = null;
    this._renderNodes();
    this.dragState = { type: 'move-node', cmdIdx, startFx: this.screenToFont(sx, sy).x, startFy: this.screenToFont(sx, sy).y, origCmds: JSON.parse(JSON.stringify(this.glyph.pathData)) };
    const cmd = this.glyph.pathData[cmdIdx];
    if (this.options.onSelectionChange) this.options.onSelectionChange(cmd, cmdIdx);
  }

  _handleHandleMousedown(e, cmdIdx, side) {
    e.stopPropagation();
    const { sx, sy } = this._getEventPos(e);
    this.selectedHandle = { cmdIdx, side };
    this.selectedNode = -1;
    this._renderNodes();
    this.dragState = { type: 'move-handle', cmdIdx, side, startFx: this.screenToFont(sx, sy).x, startFy: this.screenToFont(sx, sy).y, origCmds: JSON.parse(JSON.stringify(this.glyph.pathData)) };
  }

  _onMousemove(e) {
    // Pen tool preview (always track cursor for preview line)
    if (this.editMode === 'pen' && this.penState) {
      const { sx, sy } = this._getEventPos(e);
      const fp = this.screenToFont(sx, sy);
      this._penMousemove(fp);
      if (!this.dragState) return;
    }
    if (!this.dragState) return;
    const { sx, sy } = this._getEventPos(e);
    const ds = this.dragState;

    if (ds.type === 'pan') {
      this.panX = ds.startPanX + (sx - ds.startSx);
      this.panY = ds.startPanY + (sy - ds.startSy);
      this._updateTransform(); this._renderGrid(); return;
    }
    if (ds.type === 'move-node') {
      const fp = this.screenToFont(sx, sy);
      const dx = fp.x - ds.startFx, dy = fp.y - ds.startFy;
      const cmds = JSON.parse(JSON.stringify(ds.origCmds));
      const c = cmds[ds.cmdIdx];
      if (c.type === 'M' || c.type === 'L') { c.x += dx; c.y += dy; }
      else if (c.type === 'C') { c.x += dx; c.y += dy; c.cp2x += dx; c.cp2y += dy; }
      this.glyph.pathData = cmds;
      this._renderPaths(); this._renderNodes(); this._notifyBBox(); this._notifyChange();
      return;
    }
    if (ds.type === 'move-handle') {
      const fp = this.screenToFont(sx, sy);
      const dx = fp.x - ds.startFx, dy = fp.y - ds.startFy;
      const cmds = JSON.parse(JSON.stringify(ds.origCmds));
      const c = cmds[ds.cmdIdx];
      if (c.type === 'C') {
        if (ds.side === 'cp1') { c.cp1x += dx; c.cp1y += dy; }
        else { c.cp2x += dx; c.cp2y += dy; }
      }
      this.glyph.pathData = cmds;
      this._renderPaths(); this._renderNodes(); this._notifyChange();
      return;
    }
    if (ds.type === 'move-glyph') {
      const fp = this.screenToFont(sx, sy);
      const fp0 = this.screenToFont(ds.startSx, ds.startSy);
      const dx = fp.x - fp0.x, dy = fp.y - fp0.y;
      this.glyph.pathData = transformCmds(JSON.parse(JSON.stringify(ds.origData)), dx, dy, 1, 1);
      this._renderPaths(); this._renderNodes(); this._renderResizeHandles(); this._notifyBBox(); this._notifyChange();
    }
    if (ds.type === 'resize') {
      const fp = this.screenToFont(sx, sy);
      this._applyResize(ds, fp.x, fp.y);
    }
  }

  _applyResize(ds, fx, fy) {
    const ob = ds.origBBox;
    const handle = ds.handle;
    let newMinX = ob.x, newMinY = ob.y, newMaxX = ob.x + ob.w, newMaxY = ob.y + ob.h;

    // Which edges move depends on handle
    if (handle.includes('l')) newMinX = Math.min(fx, newMaxX - 1);
    if (handle.includes('r')) newMaxX = Math.max(fx, newMinX + 1);
    if (handle.includes('b')) newMinY = Math.min(fy, newMaxY - 1);
    if (handle.includes('t')) newMaxY = Math.max(fy, newMinY + 1);

    const newW = newMaxX - newMinX;
    const newH = newMaxY - newMinY;
    const sx = newW / ob.w;
    const sy = newH / ob.h;

    // Scale from original bbox origin, then translate to new position
    const cmds = JSON.parse(JSON.stringify(ds.origData));
    const scaled = cmds.map(c => {
      const pt = (x, y) => ({
        x: (x - ob.x) * sx + newMinX,
        y: (y - ob.y) * sy + newMinY,
      });
      if (c.type === 'M' || c.type === 'L') { const p = pt(c.x, c.y); return { ...c, x: p.x, y: p.y }; }
      if (c.type === 'C') {
        const p1 = pt(c.cp1x, c.cp1y), p2 = pt(c.cp2x, c.cp2y), p = pt(c.x, c.y);
        return { ...c, cp1x: p1.x, cp1y: p1.y, cp2x: p2.x, cp2y: p2.y, x: p.x, y: p.y };
      }
      return { ...c };
    });
    this.glyph.pathData = scaled;
    this._renderPaths(); this._renderNodes(); this._renderResizeHandles(); this._notifyBBox(); this._notifyChange();
  }

  _onMouseup(e) {
    if (this.editMode === 'pen' && this.penState) {
      const { sx, sy } = this._getEventPos(e);
      const fp = this.screenToFont(sx, sy);
      if (this.penState.dragging) {
        this._penMouseup(fp);
      }
    }
    this.dragState = null;
  }

  // ─── Pen Tool ───────────────────────────────────────────────────────────────

  _penMousedown(fp, e) {
    if (!this.glyph) return;
    const closeDist = 12 / this.zoom;
    if (!this.penState) {
      // Start a new subpath
      this.penState = { cmds: [{ type: 'M', x: fp.x, y: fp.y }], firstPoint: { x: fp.x, y: fp.y }, dragging: true, dragStart: { x: fp.x, y: fp.y }, lastCp: null };
      this._renderPenPreview();
      return;
    }
    // Check if clicking near first point to close
    const dx = fp.x - this.penState.firstPoint.x;
    const dy = fp.y - this.penState.firstPoint.y;
    if (this.penState.cmds.length > 2 && Math.sqrt(dx * dx + dy * dy) < closeDist) {
      // Close the path
      this.penState.cmds.push({ type: 'Z' });
      this._finalizePenPath();
      return;
    }
    // Add a new point (will determine line vs curve on mouseup based on drag)
    this.penState.dragging = true;
    this.penState.dragStart = { x: fp.x, y: fp.y };
    this.penState.pendingPoint = { x: fp.x, y: fp.y };
  }

  _penMousemove(fp) {
    if (!this.penState) return;
    if (this.penState.dragging && this.penState.pendingPoint) {
      // Show preview of curve handle
      this._renderPenPreview(fp);
    } else {
      // Show preview line to cursor
      this._renderPenPreview(fp);
    }
  }

  _penMouseup(fp) {
    if (!this.penState || !this.penState.dragging) return;
    if (!this.penState.pendingPoint) {
      // First point drag - record the outgoing handle for next segment
      const dx = fp.x - this.penState.dragStart.x;
      const dy = fp.y - this.penState.dragStart.y;
      if (Math.abs(dx) > 2 / this.zoom || Math.abs(dy) > 2 / this.zoom) {
        this.penState.lastCp = { x: fp.x, y: fp.y };
      }
      this.penState.dragging = false;
      this._renderPenPreview();
      return;
    }
    const pp = this.penState.pendingPoint;
    const dx = fp.x - pp.x;
    const dy = fp.y - pp.y;
    const dragged = Math.abs(dx) > 2 / this.zoom || Math.abs(dy) > 2 / this.zoom;
    if (dragged) {
      // Curve: compute cp1 from lastCp reflection, cp2 from drag
      const cp2x = 2 * pp.x - fp.x;
      const cp2y = 2 * pp.y - fp.y;
      let cp1x, cp1y;
      if (this.penState.lastCp) {
        cp1x = this.penState.lastCp.x;
        cp1y = this.penState.lastCp.y;
      } else {
        // No previous handle, use the previous point
        const prevCmds = this.penState.cmds;
        const lastCmd = prevCmds[prevCmds.length - 1];
        const prevPt = lastCmd.type === 'C' ? { x: lastCmd.x, y: lastCmd.y } : { x: lastCmd.x, y: lastCmd.y };
        cp1x = prevPt.x;
        cp1y = prevPt.y;
      }
      this.penState.cmds.push({ type: 'C', cp1x, cp1y, cp2x, cp2y, x: pp.x, y: pp.y });
      this.penState.lastCp = { x: fp.x, y: fp.y };
    } else {
      // Line segment
      this.penState.cmds.push({ type: 'L', x: pp.x, y: pp.y });
      this.penState.lastCp = null;
    }
    this.penState.pendingPoint = null;
    this.penState.dragging = false;
    this._renderPenPreview();
  }

  _finalizePenPath() {
    if (!this.penState || !this.glyph) return;
    const newCmds = this.penState.cmds;
    this.glyph.pathData = this.glyph.pathData.concat(newCmds);
    this.penState = null;
    this.render();
    this._notifyBBox();
    this._notifyChange();
  }

  _renderPenPreview(cursorFp) {
    // Remove old preview
    const old = this.mainGroup.querySelector('#pen-preview');
    if (old) old.remove();
    if (!this.penState) return;
    const g = this._el('g', { id: 'pen-preview' });
    const sw = 1.5 / this.zoom;
    const nR = 4 / this.zoom;
    // Draw existing pen path segments
    if (this.penState.cmds.length > 0) {
      const d = cmdsToDString(this.penState.cmds);
      const path = this._el('path', { d, fill: 'none', stroke: '#000', 'stroke-width': String(sw), 'stroke-dasharray': `${4/this.zoom},${3/this.zoom}` });
      g.appendChild(path);
    }
    // Draw dots at each point
    for (const c of this.penState.cmds) {
      if (c.type === 'M' || c.type === 'L' || c.type === 'C') {
        const dot = this._el('circle', { cx: c.x, cy: c.y, r: nR, fill: '#000', stroke: 'none' });
        g.appendChild(dot);
      }
    }
    // First point indicator (larger)
    if (this.penState.firstPoint) {
      const fp = this.penState.firstPoint;
      const ring = this._el('circle', { cx: fp.x, cy: fp.y, r: nR * 1.5, fill: 'none', stroke: '#000', 'stroke-width': String(sw) });
      g.appendChild(ring);
    }
    // Preview line from last point to cursor
    if (cursorFp && this.penState.cmds.length > 0) {
      const lastCmd = this.penState.cmds[this.penState.cmds.length - 1];
      if (lastCmd.type !== 'Z') {
        const lx = lastCmd.x, ly = lastCmd.y;
        const line = this._el('line', { x1: lx, y1: ly, x2: cursorFp.x, y2: cursorFp.y, stroke: '#666', 'stroke-width': String(sw), 'stroke-dasharray': `${3/this.zoom},${2/this.zoom}` });
        g.appendChild(line);
      }
    }
    this.mainGroup.appendChild(g);
  }

  _onWheel(e) {
    e.preventDefault();
    const { sx, sy } = this._getEventPos(e);
    const fpt = this.screenToFont(sx, sy);
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    this.zoom = Math.max(0.05, Math.min(5, this.zoom * factor));
    const ns = this.fontToScreen(fpt.x, fpt.y);
    this.panX += sx - ns.x;
    this.panY += sy - ns.y;
    this._updateTransform(); this._renderGrid(); this.render();
    if (this.options.onZoomChange) this.options.onZoomChange(this.zoom);
  }

  _onDblclick(e) {
    // Future: add node on double-click on path
  }

  // ─── Resize Handles ──────────────────────────────────────────────────────────

  _renderResizeHandles() {
    this.resizeLayer.innerHTML = '';
    if (this.editMode !== 'select' || !this.glyph || !this.glyph.pathData || !this.glyph.pathData.length) return;
    const b = getCmdsBounds(this.glyph.pathData);
    if (b.w === 0 && b.h === 0) return;

    const sw = 1 / this.zoom;
    const hSize = 6 / this.zoom;

    // Bounding box outline
    const rect = this._el('rect', {
      x: b.x, y: b.y, width: b.w, height: b.h,
      fill: 'none', stroke: '#000', 'stroke-width': sw,
      'stroke-dasharray': `${4 / this.zoom},${3 / this.zoom}`,
      'pointer-events': 'none', opacity: '0.5',
    });
    this.resizeLayer.appendChild(rect);

    // 8 handles: corners + midpoints
    const handles = [
      { id: 'tl', x: b.x,            y: b.y + b.h,      cursor: 'nwse-resize' },
      { id: 'tr', x: b.x + b.w,      y: b.y + b.h,      cursor: 'nesw-resize' },
      { id: 'bl', x: b.x,            y: b.y,             cursor: 'nesw-resize' },
      { id: 'br', x: b.x + b.w,      y: b.y,             cursor: 'nwse-resize' },
      { id: 't',  x: b.x + b.w / 2,  y: b.y + b.h,      cursor: 'ns-resize' },
      { id: 'b',  x: b.x + b.w / 2,  y: b.y,             cursor: 'ns-resize' },
      { id: 'l',  x: b.x,            y: b.y + b.h / 2,   cursor: 'ew-resize' },
      { id: 'r',  x: b.x + b.w,      y: b.y + b.h / 2,   cursor: 'ew-resize' },
    ];

    for (const h of handles) {
      const el = this._el('rect', {
        x: h.x - hSize / 2, y: h.y - hSize / 2,
        width: hSize, height: hSize,
        fill: '#fff', stroke: '#000', 'stroke-width': sw,
        cursor: h.cursor, 'data-handle': h.id,
      });
      el.addEventListener('mousedown', e => this._handleResizeMousedown(e, h.id));
      this.resizeLayer.appendChild(el);
    }
  }

  _handleResizeMousedown(e, handleId) {
    e.stopPropagation();
    if (!this.glyph || !this.glyph.pathData.length) return;
    const { sx, sy } = this._getEventPos(e);
    const b = getCmdsBounds(this.glyph.pathData);
    this.dragState = {
      type: 'resize',
      handle: handleId,
      startSx: sx, startSy: sy,
      origBBox: { ...b },
      origData: JSON.parse(JSON.stringify(this.glyph.pathData)),
    };
  }

  // ─── Transform operations ─────────────────────────────────────────────────

  translateBy(dx, dy) {
    if (!this.glyph) return;
    this.glyph.pathData = transformCmds(this.glyph.pathData, dx, dy, 1, 1);
    this.render(); this._notifyBBox(); this._notifyChange();
  }

  scaleToSize(newW, newH, lockAspect) {
    if (!this.glyph) return;
    const b = getCmdsBounds(this.glyph.pathData);
    if (b.w === 0 || b.h === 0) return;
    let sx = newW / b.w, sy = newH / b.h;
    if (lockAspect) { const s = Math.min(sx, sy); sx = s; sy = s; }
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    let cmds = transformCmds(this.glyph.pathData, -cx, -cy, sx, sy);
    cmds = transformCmds(cmds, cx, cy, 1, 1);
    this.glyph.pathData = cmds;
    this.render(); this._notifyBBox(); this._notifyChange();
  }

  flipH() {
    if (!this.glyph) return;
    const b = getCmdsBounds(this.glyph.pathData);
    const cx = b.x + b.w / 2;
    this.glyph.pathData = flipCmds(this.glyph.pathData, 'h', cx);
    this.render(); this._notifyBBox(); this._notifyChange();
  }

  flipV() {
    if (!this.glyph) return;
    const b = getCmdsBounds(this.glyph.pathData);
    const cy = b.y + b.h / 2;
    this.glyph.pathData = flipCmds(this.glyph.pathData, 'v', cy);
    this.render(); this._notifyBBox(); this._notifyChange();
  }

  rotate(angle) {
    if (!this.glyph) return;
    const b = getCmdsBounds(this.glyph.pathData);
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    this.glyph.pathData = rotateCmds(this.glyph.pathData, angle, cx, cy);
    this.render(); this._notifyBBox(); this._notifyChange();
  }

  setPosition(x, y) {
    if (!this.glyph) return;
    const b = getCmdsBounds(this.glyph.pathData);
    this.translateBy(x - b.x, y - b.y);
  }

  getBBox() {
    if (!this.glyph || !this.glyph.pathData.length) return null;
    return getCmdsBounds(this.glyph.pathData);
  }

  // ─── Node editing ─────────────────────────────────────────────────────────

  getSelectedNodeData() {
    if (!this.glyph || this.selectedNode < 0) return null;
    return this.glyph.pathData[this.selectedNode];
  }

  updateSelectedNode(x, y) {
    if (!this.glyph || this.selectedNode < 0) return;
    const c = this.glyph.pathData[this.selectedNode];
    if (!c) return;
    const dx = x - c.x, dy = y - c.y;
    c.x = x; c.y = y;
    if (c.type === 'C') { c.cp2x += dx; c.cp2y += dy; }
    // Move cp1 of NEXT segment if it exists
    this.render(); this._notifyBBox(); this._notifyChange();
  }

  updateSelectedHandle(side, x, y) {
    if (!this.glyph || !this.selectedHandle) return;
    const c = this.glyph.pathData[this.selectedHandle.cmdIdx];
    if (!c || c.type !== 'C') return;
    if (side === 'cp1') { c.cp1x = x; c.cp1y = y; }
    else { c.cp2x = x; c.cp2y = y; }
    this.render(); this._notifyChange();
  }

  deleteSelectedNode() {
    if (!this.glyph || this.selectedNode < 0) return;
    this.glyph.pathData.splice(this.selectedNode, 1);
    this.selectedNode = -1;
    this.render(); this._notifyChange();
  }

  // ─── Path tools (delegating to path-ops) ──────────────────────────────────

  applyCleanup(tol = 0.5) {
    if (!this.glyph) return;
    this.glyph.pathData = cleanupCmds(this.glyph.pathData, tol);
    this.render(); this._notifyBBox(); this._notifyChange();
  }

  applySimplify(tol = 2) {
    if (!this.glyph) return;
    this.glyph.pathData = simplifyCmds(this.glyph.pathData, tol);
    this.render(); this._notifyBBox(); this._notifyChange();
  }

  applySmooth(steps = 3) {
    if (!this.glyph) return;
    this.glyph.pathData = smoothCmds(this.glyph.pathData, steps);
    this.render(); this._notifyBBox(); this._notifyChange();
  }

  applyFitBezier() {
    if (!this.glyph) return;
    this.glyph.pathData = fitSmoothBezier(this.glyph.pathData);
    this.render(); this._notifyBBox(); this._notifyChange();
  }

  applyReverse() {
    if (!this.glyph) return;
    this.glyph.pathData = reverseCmds(this.glyph.pathData);
    this.render(); this._notifyChange();
  }

  // ─── Settings ─────────────────────────────────────────────────────────────

  setEditMode(mode) {
    // If leaving pen mode, finalize any in-progress path
    if (this.editMode === 'pen' && mode !== 'pen' && this.penState) {
      if (this.penState.cmds.length > 1) {
        this._finalizePenPath();
      } else {
        this.penState = null;
        const old = this.mainGroup.querySelector('#pen-preview');
        if (old) old.remove();
      }
    }
    this.editMode = mode;
    this.svg.style.cursor = mode === 'pen' ? 'crosshair' : 'default';
    this.render();
  }

  setShowReference(v) {
    this.showReference = v;
    this._renderReference();
  }

  setReferenceFont(font) {
    this.referenceFont = font;
    this._renderReference();
  }

  setShowHandles(v) {
    this.showHandles = v;
    this._renderNodes();
  }

  setAdvanceWidth(aw) {
    if (!this.glyph) return;
    this.glyph.advanceWidth = aw;
    this._renderAdvanceWidth();
  }

  // ─── Notifications ────────────────────────────────────────────────────────

  _notifyChange() {
    if (this.options.onGlyphChange) this.options.onGlyphChange(this.getGlyph());
  }

  _notifyBBox() {
    if (this.options.onBBoxChange) {
      this.options.onBBoxChange(this.getBBox());
    }
  }
}
