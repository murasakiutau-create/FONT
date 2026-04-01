/**
 * path-ops.js — SVG path parsing, transformation, cleanup, simplify, smooth
 * All functions operate on arrays of command objects: {type:'M'|'L'|'C'|'Z', ...}
 */

// ─── Parser ────────────────────────────────────────────────────────────────

function parseSVGPath(d) {
  if (!d) return [];
  const result = [];
  let cx = 0, cy = 0, sx = 0, sy = 0;
  let prevCp2x = null, prevCp2y = null, prevQcpx = null, prevQcpy = null;

  const segs = d.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
  for (const seg of segs) {
    const cmd = seg[0];
    const rel = cmd !== cmd.toUpperCase() && cmd.toLowerCase() !== 'z';
    const C = cmd.toUpperCase();
    const rawNums = seg.slice(1).trim();
    const nums = [];
    const _numRe = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;
    let _nm;
    while ((_nm = _numRe.exec(rawNums)) !== null) nums.push(parseFloat(_nm[0]));
    let j = 0;
    const rn = (def = 0) => j < nums.length ? nums[j++] : def;
    const ax = (v) => rel ? cx + v : v;
    const ay = (v) => rel ? cy + v : v;

    prevCp2x = prevCp2y = prevQcpx = prevQcpy = null;

    switch (C) {
      case 'M': {
        let first = true;
        while (j < nums.length) {
          const x = ax(rn()), y = ay(rn());
          cx = x; cy = y;
          if (first) { result.push({ type: 'M', x, y }); sx = x; sy = y; first = false; }
          else result.push({ type: 'L', x, y });
        }
        break;
      }
      case 'L':
        while (j < nums.length) { cx = ax(rn()); cy = ay(rn()); result.push({ type: 'L', x: cx, y: cy }); }
        break;
      case 'H':
        while (j < nums.length) { cx = ax(rn()); result.push({ type: 'L', x: cx, y: cy }); }
        break;
      case 'V':
        while (j < nums.length) { cy = ay(rn()); result.push({ type: 'L', x: cx, y: cy }); }
        break;
      case 'C':
        while (j + 6 <= nums.length) {
          const cp1x = ax(rn()), cp1y = ay(rn()), cp2x = ax(rn()), cp2y = ay(rn());
          const x = ax(rn()), y = ay(rn());
          prevCp2x = cp2x; prevCp2y = cp2y; cx = x; cy = y;
          result.push({ type: 'C', cp1x, cp1y, cp2x, cp2y, x, y });
        }
        break;
      case 'S':
        while (j + 4 <= nums.length) {
          const cp1x = prevCp2x != null ? 2 * cx - prevCp2x : cx;
          const cp1y = prevCp2y != null ? 2 * cy - prevCp2y : cy;
          const cp2x = ax(rn()), cp2y = ay(rn());
          const x = ax(rn()), y = ay(rn());
          prevCp2x = cp2x; prevCp2y = cp2y; cx = x; cy = y;
          result.push({ type: 'C', cp1x, cp1y, cp2x, cp2y, x, y });
        }
        break;
      case 'Q':
        while (j + 4 <= nums.length) {
          const qx = ax(rn()), qy = ay(rn()), x = ax(rn()), y = ay(rn());
          const cp1x = cx + (2 / 3) * (qx - cx), cp1y = cy + (2 / 3) * (qy - cy);
          const cp2x = x + (2 / 3) * (qx - x), cp2y = y + (2 / 3) * (qy - y);
          prevQcpx = qx; prevQcpy = qy; cx = x; cy = y;
          result.push({ type: 'C', cp1x, cp1y, cp2x, cp2y, x, y });
        }
        break;
      case 'T':
        while (j + 2 <= nums.length) {
          const qx = prevQcpx != null ? 2 * cx - prevQcpx : cx;
          const qy = prevQcpy != null ? 2 * cy - prevQcpy : cy;
          const x = ax(rn()), y = ay(rn());
          const cp1x = cx + (2 / 3) * (qx - cx), cp1y = cy + (2 / 3) * (qy - cy);
          const cp2x = x + (2 / 3) * (qx - x), cp2y = y + (2 / 3) * (qy - y);
          prevQcpx = qx; prevQcpy = qy; cx = x; cy = y;
          result.push({ type: 'C', cp1x, cp1y, cp2x, cp2y, x, y });
        }
        break;
      case 'A':
        while (j + 7 <= nums.length) {
          const rx = Math.abs(rn()), ry = Math.abs(rn()), xrot = rn();
          const laf = rn() !== 0, sf = rn() !== 0;
          const x = ax(rn()), y = ay(rn());
          const arcs = arcToCubics(cx, cy, rx, ry, xrot, laf, sf, x, y);
          arcs.forEach(a => result.push(a));
          cx = x; cy = y;
        }
        break;
      case 'Z':
        result.push({ type: 'Z' });
        cx = sx; cy = sy;
        break;
    }
  }
  return result;
}

function arcToCubics(x1, y1, rx, ry, phi, fa, fs, x2, y2) {
  const PI = Math.PI, cos = Math.cos, sin = Math.sin, sqrt = Math.sqrt, abs = Math.abs;
  if (rx === 0 || ry === 0) return [{ type: 'L', x: x2, y: y2 }];
  if (x1 === x2 && y1 === y2) return [];
  const phiR = (phi % 360) * PI / 180;
  const cp = cos(phiR), sp = sin(phiR);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p = cp * dx + sp * dy, y1p = -sp * dx + cp * dy;
  const x1p2 = x1p * x1p, y1p2 = y1p * y1p;
  let rx2 = rx * rx, ry2 = ry * ry;
  const lambda = x1p2 / rx2 + y1p2 / ry2;
  if (lambda > 1) { const sq = sqrt(lambda); rx *= sq; ry *= sq; rx2 = rx * rx; ry2 = ry * ry; }
  const num = rx2 * ry2 - rx2 * y1p2 - ry2 * x1p2;
  const den = rx2 * y1p2 + ry2 * x1p2;
  const sq = den === 0 ? 0 : sqrt(abs(num / den));
  const sign = fa === fs ? -1 : 1;
  const cxp = sign * sq * (rx * y1p / ry);
  const cyp = sign * sq * -(ry * x1p / rx);
  const ccx = cp * cxp - sp * cyp + (x1 + x2) / 2;
  const ccy = sp * cxp + cp * cyp + (y1 + y2) / 2;
  const va = { x: (x1p - cxp) / rx, y: (y1p - cyp) / ry };
  const vb = { x: (-x1p - cxp) / rx, y: (-y1p - cyp) / ry };
  const angleStart = vectorAngle(1, 0, va.x, va.y);
  let dAngle = vectorAngle(va.x, va.y, vb.x, vb.y);
  if (!fs && dAngle > 0) dAngle -= 2 * PI;
  else if (fs && dAngle < 0) dAngle += 2 * PI;
  const n = Math.ceil(abs(dAngle) / (PI / 2));
  const da = dAngle / n;
  const alpha = n > 0 ? sin(da) * (sqrt(4 + 3 * Math.pow(Math.tan(da / 4), 2)) - 1) / 3 : 0;
  const curves = [];
  let angle = angleStart, px = x1, py = y1;
  for (let i = 0; i < n; i++) {
    const ang2 = angle + da;
    const dxs = -cp * rx * sin(angle) - sp * ry * cos(angle);
    const dys = -sp * rx * sin(angle) + cp * ry * cos(angle);
    const ex = cp * rx * cos(ang2) - sp * ry * sin(ang2) + ccx;
    const ey = sp * rx * cos(ang2) + cp * ry * sin(ang2) + ccy;
    const dxe = -cp * rx * sin(ang2) - sp * ry * cos(ang2);
    const dye = -sp * rx * sin(ang2) + cp * ry * cos(ang2);
    curves.push({ type: 'C', cp1x: px + alpha * dxs, cp1y: py + alpha * dys, cp2x: ex - alpha * dxe, cp2y: ey - alpha * dye, x: ex, y: ey });
    px = ex; py = ey; angle = ang2;
  }
  return curves;
}

function vectorAngle(ux, uy, vx, vy) {
  const d = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
  if (d === 0) return 0;
  const c = Math.max(-1, Math.min(1, (ux * vx + uy * vy) / d));
  return (ux * vy - uy * vx < 0 ? -1 : 1) * Math.acos(c);
}

// ─── Serialization ──────────────────────────────────────────────────────────

function cmdsToDString(cmds) {
  return cmds.map(c => {
    const r = v => Math.round(v * 100) / 100;
    switch (c.type) {
      case 'M': return `M ${r(c.x)} ${r(c.y)}`;
      case 'L': return `L ${r(c.x)} ${r(c.y)}`;
      case 'C': return `C ${r(c.cp1x)} ${r(c.cp1y)} ${r(c.cp2x)} ${r(c.cp2y)} ${r(c.x)} ${r(c.y)}`;
      case 'Z': return 'Z';
      default: return '';
    }
  }).join(' ');
}

// ─── Bounds ──────────────────────────────────────────────────────────────────

function getCmdsBounds(cmds) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const add = (x, y) => { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); };
  for (const c of cmds) {
    if (c.type === 'M' || c.type === 'L') add(c.x, c.y);
    else if (c.type === 'C') {
      add(c.cp1x, c.cp1y); add(c.cp2x, c.cp2y); add(c.x, c.y);
    }
  }
  if (!isFinite(minX)) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

// ─── Transform ───────────────────────────────────────────────────────────────

function transformCmds(cmds, tx, ty, sx, sy) {
  if (sy === undefined) sy = sx;
  return cmds.map(c => {
    if (c.type === 'M' || c.type === 'L') return { ...c, x: c.x * sx + tx, y: c.y * sy + ty };
    if (c.type === 'C') return { ...c, cp1x: c.cp1x * sx + tx, cp1y: c.cp1y * sy + ty, cp2x: c.cp2x * sx + tx, cp2y: c.cp2y * sy + ty, x: c.x * sx + tx, y: c.y * sy + ty };
    return { ...c };
  });
}

function flipCmds(cmds, axis, pivot) {
  return cmds.map(c => {
    if (axis === 'h') {
      if (c.type === 'M' || c.type === 'L') return { ...c, x: 2 * pivot - c.x };
      if (c.type === 'C') return { ...c, cp1x: 2 * pivot - c.cp1x, cp2x: 2 * pivot - c.cp2x, x: 2 * pivot - c.x };
    } else {
      if (c.type === 'M' || c.type === 'L') return { ...c, y: 2 * pivot - c.y };
      if (c.type === 'C') return { ...c, cp1y: 2 * pivot - c.cp1y, cp2y: 2 * pivot - c.cp2y, y: 2 * pivot - c.y };
    }
    return { ...c };
  });
}

function rotateCmds(cmds, angleDeg, cx, cy) {
  const rad = angleDeg * Math.PI / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const rot = (x, y) => ({ x: cos * (x - cx) - sin * (y - cy) + cx, y: sin * (x - cx) + cos * (y - cy) + cy });
  return cmds.map(c => {
    if (c.type === 'M' || c.type === 'L') { const p = rot(c.x, c.y); return { ...c, ...p }; }
    if (c.type === 'C') {
      const p1 = rot(c.cp1x, c.cp1y), p2 = rot(c.cp2x, c.cp2y), p = rot(c.x, c.y);
      return { ...c, cp1x: p1.x, cp1y: p1.y, cp2x: p2.x, cp2y: p2.y, x: p.x, y: p.y };
    }
    return { ...c };
  });
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

function cleanupCmds(cmds, tol = 0.5) {
  const result = [];
  let lx = null, ly = null;
  for (const c of cmds) {
    if (c.type === 'Z') { result.push(c); lx = null; ly = null; continue; }
    if (c.type === 'M' || c.type === 'L') {
      if (lx !== null && Math.abs(c.x - lx) < tol && Math.abs(c.y - ly) < tol) continue;
      lx = c.x; ly = c.y;
    } else if (c.type === 'C') {
      if (lx !== null && Math.abs(c.x - lx) < tol && Math.abs(c.y - ly) < tol) continue;
      lx = c.x; ly = c.y;
    }
    result.push(c);
  }
  return result;
}

// ─── Sub-path Utilities ───────────────────────────────────────────────────────

function splitSubpaths(cmds) {
  const subs = [];
  let cur = [], closed = false;
  for (const c of cmds) {
    if (c.type === 'M') {
      if (cur.length) subs.push({ cmds: cur, closed });
      cur = [c]; closed = false;
    } else if (c.type === 'Z') {
      cur.push(c); subs.push({ cmds: cur, closed: true }); cur = []; closed = false;
    } else cur.push(c);
  }
  if (cur.length) subs.push({ cmds: cur, closed });
  return subs;
}

function extractPoints(cmds) {
  const pts = [];
  for (const c of cmds) {
    if (c.type === 'M' || c.type === 'L') pts.push({ x: c.x, y: c.y });
    else if (c.type === 'C') pts.push({ x: c.x, y: c.y });
  }
  return pts;
}

// ─── Simplify (Ramer-Douglas-Peucker) ────────────────────────────────────────

function simplifyCmds(cmds, tolerance = 2) {
  const result = [];
  for (const sub of splitSubpaths(cmds)) {
    let pts = [];
    let px = 0, py = 0;
    for (const c of sub.cmds) {
      if (c.type === 'M') { pts.push({ x: c.x, y: c.y }); px = c.x; py = c.y; }
      else if (c.type === 'L') { pts.push({ x: c.x, y: c.y }); px = c.x; py = c.y; }
      else if (c.type === 'C') {
        for (let t = 0.25; t <= 1; t += 0.25) pts.push(cubicAt(px, py, c.cp1x, c.cp1y, c.cp2x, c.cp2y, c.x, c.y, t));
        px = c.x; py = c.y;
      }
    }
    const simp = rdp(pts, tolerance);
    if (!simp.length) continue;
    result.push({ type: 'M', x: simp[0].x, y: simp[0].y });
    for (let i = 1; i < simp.length; i++) result.push({ type: 'L', x: simp[i].x, y: simp[i].y });
    if (sub.closed) result.push({ type: 'Z' });
  }
  return result;
}

function cubicAt(x0, y0, x1, y1, x2, y2, x3, y3, t) {
  const mt = 1 - t;
  return { x: mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3, y: mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3 };
}

function pointLineDist(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (dx === 0 && dy === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  let maxD = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = pointLineDist(pts[i], pts[0], pts[pts.length - 1]);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD > eps) {
    const L = rdp(pts.slice(0, idx + 1), eps);
    const R = rdp(pts.slice(idx), eps);
    return [...L.slice(0, -1), ...R];
  }
  return [pts[0], pts[pts.length - 1]];
}

// ─── Smooth (Chaikin corner cutting) ─────────────────────────────────────────

function smoothCmds(cmds, steps = 3) {
  const result = [];
  for (const sub of splitSubpaths(cmds)) {
    let pts = extractPoints(sub.cmds);
    if (pts.length < 2) continue;
    for (let s = 0; s < steps; s++) pts = chaikin(pts, sub.closed);
    result.push({ type: 'M', x: pts[0].x, y: pts[0].y });
    for (let i = 1; i < pts.length; i++) result.push({ type: 'L', x: pts[i].x, y: pts[i].y });
    if (sub.closed) result.push({ type: 'Z' });
  }
  return result;
}

function chaikin(pts, closed) {
  const n = pts.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[i], p1 = pts[(i + 1) % n];
    if (!closed && i === n - 1) { out.push(p0); break; }
    out.push({ x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y });
    out.push({ x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y });
  }
  return out;
}

// ─── Fit Smooth Bezier (Catmull-Rom → Cubic) ─────────────────────────────────

function fitSmoothBezier(cmds) {
  const result = [];
  for (const sub of splitSubpaths(cmds)) {
    const pts = extractPoints(sub.cmds);
    const n = pts.length;
    if (n < 2) continue;
    result.push({ type: 'M', x: pts[0].x, y: pts[0].y });
    if (n === 2) { result.push({ type: 'L', x: pts[1].x, y: pts[1].y }); }
    else {
      for (let i = 0; i < (sub.closed ? n : n - 1); i++) {
        const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
        const cp1x = p1.x + (p2.x - p0.x) / 6, cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6, cp2y = p2.y - (p3.y - p1.y) / 6;
        result.push({ type: 'C', cp1x, cp1y, cp2x, cp2y, x: p2.x, y: p2.y });
      }
    }
    if (sub.closed) result.push({ type: 'Z' });
  }
  return result;
}

// ─── Winding ─────────────────────────────────────────────────────────────────

function windingArea(cmds) {
  let area = 0, x0 = 0, y0 = 0, sx = 0, sy = 0;
  for (const c of cmds) {
    if (c.type === 'M') { sx = c.x; sy = c.y; x0 = c.x; y0 = c.y; }
    else if (c.type === 'L') { area += (x0 + c.x) * (c.y - y0); x0 = c.x; y0 = c.y; }
    else if (c.type === 'C') { area += (x0 + c.x) * (c.y - y0); x0 = c.x; y0 = c.y; }
    else if (c.type === 'Z') { area += (x0 + sx) * (sy - y0); }
  }
  return area / 2;
}

function reverseCmds(cmds) {
  const result = [];
  for (const sub of splitSubpaths(cmds)) {
    const segs = [];
    let px = 0, py = 0;
    for (const c of sub.cmds) {
      if (c.type === 'M') { px = c.x; py = c.y; }
      else if (c.type === 'L') { segs.push({ type: 'L', x: px, y: py }); px = c.x; py = c.y; }
      else if (c.type === 'C') { segs.push({ type: 'C', cp1x: c.cp2x, cp1y: c.cp2y, cp2x: c.cp1x, cp2y: c.cp1y, x: px, y: py }); px = c.x; py = c.y; }
    }
    const pts = extractPoints(sub.cmds);
    if (!pts.length) continue;
    const last = pts[pts.length - 1];
    result.push({ type: 'M', x: last.x, y: last.y });
    for (let i = segs.length - 1; i >= 0; i--) result.push(segs[i]);
    if (sub.closed) result.push({ type: 'Z' });
  }
  return result;
}

// ─── SVG Import Helper ───────────────────────────────────────────────────────

function extractPathsFromSVG(svgText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const results = [];
  const processEl = (el, matrix) => {
    const localMatrix = getElementMatrix(el);
    const combined = multiplyMatrix(matrix, localMatrix);
    if (el.tagName === 'path') {
      const d = el.getAttribute('d');
      if (d) {
        let cmds = parseSVGPath(d);
        if (combined) cmds = applyMatrix(cmds, combined);
        results.push(cmds);
      }
    } else if (el.tagName === 'rect') {
      const x = parseFloat(el.getAttribute('x') || 0), y = parseFloat(el.getAttribute('y') || 0);
      const w = parseFloat(el.getAttribute('width') || 0), h = parseFloat(el.getAttribute('height') || 0);
      const rx = parseFloat(el.getAttribute('rx') || 0), ry = parseFloat(el.getAttribute('ry') || rx);
      let cmds;
      if (rx === 0 && ry === 0) {
        cmds = [{ type: 'M', x, y }, { type: 'L', x: x + w, y }, { type: 'L', x: x + w, y: y + h }, { type: 'L', x, y: y + h }, { type: 'Z' }];
      } else {
        const r = Math.min(rx, w / 2, ry, h / 2);
        cmds = parseSVGPath(`M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`);
      }
      if (combined) cmds = applyMatrix(cmds, combined);
      results.push(cmds);
    } else if (el.tagName === 'circle') {
      const cx = parseFloat(el.getAttribute('cx') || 0), cy = parseFloat(el.getAttribute('cy') || 0), r = parseFloat(el.getAttribute('r') || 0);
      let cmds = parseSVGPath(`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} A ${r} ${r} 0 0 1 ${cx - r} ${cy} Z`);
      if (combined) cmds = applyMatrix(cmds, combined);
      results.push(cmds);
    } else if (el.tagName === 'ellipse') {
      const cx = parseFloat(el.getAttribute('cx') || 0), cy = parseFloat(el.getAttribute('cy') || 0);
      const rx = parseFloat(el.getAttribute('rx') || 0), ry = parseFloat(el.getAttribute('ry') || 0);
      let cmds = parseSVGPath(`M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy} Z`);
      if (combined) cmds = applyMatrix(cmds, combined);
      results.push(cmds);
    } else if (el.tagName === 'polygon' || el.tagName === 'polyline') {
      const pts = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number).filter((_, i, a) => i % 2 === 0 ? true : a[i - 1] !== undefined);
      if (pts.length >= 4) {
        let cmds = [{ type: 'M', x: pts[0], y: pts[1] }];
        for (let i = 2; i < pts.length; i += 2) cmds.push({ type: 'L', x: pts[i], y: pts[i + 1] });
        if (el.tagName === 'polygon') cmds.push({ type: 'Z' });
        if (combined) cmds = applyMatrix(cmds, combined);
        results.push(cmds);
      }
    }
    for (const child of el.children) processEl(child, combined);
  };
  const root = doc.documentElement;
  const identity = [1, 0, 0, 1, 0, 0];
  for (const child of root.children) processEl(child, identity);
  return results;
}

function getElementMatrix(el) {
  const t = el.getAttribute('transform');
  if (!t) return null;
  const m = t.match(/matrix\(([^)]+)\)/);
  if (m) return m[1].split(/[\s,]+/).map(Number);
  const tr = t.match(/translate\(([^)]+)\)/);
  if (tr) { const v = tr[1].split(/[\s,]+/).map(Number); return [1, 0, 0, 1, v[0] || 0, v[1] || 0]; }
  const sc = t.match(/scale\(([^)]+)\)/);
  if (sc) { const v = sc[1].split(/[\s,]+/).map(Number); const sx = v[0] || 1, sy = v[1] !== undefined ? v[1] : sx; return [sx, 0, 0, sy, 0, 0]; }
  return null;
}

function multiplyMatrix(a, b) {
  if (!b) return a;
  if (!a) return b;
  return [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
}

function applyMatrix(cmds, m) {
  const pt = (x, y) => ({ x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] });
  return cmds.map(c => {
    if (c.type === 'M' || c.type === 'L') { const p = pt(c.x, c.y); return { ...c, ...p }; }
    if (c.type === 'C') { const p1 = pt(c.cp1x, c.cp1y), p2 = pt(c.cp2x, c.cp2y), p = pt(c.x, c.y); return { ...c, cp1x: p1.x, cp1y: p1.y, cp2x: p2.x, cp2y: p2.y, x: p.x, y: p.y }; }
    return { ...c };
  });
}
