import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Upload, Trash2,
  Download, Loader2, Settings, Eye, Type, RefreshCw, Save,
  Move, MousePointer, Lock, Unlock, Wand2, AlignJustify
} from "lucide-react";
import { toast } from "sonner";
import GlyphCanvas, { BBox, computeBBox, parsePath, serializePath, transformCmds, cleanupPath, simplifyPath, smoothPath } from "@/components/GlyphCanvas";
import type { EditMode } from "@/components/GlyphCanvas";

// Hiragana: U+3041–U+3096 (small + regular)
const HIRAGANA_CHARS = Array.from({ length: 0x3097 - 0x3041 }, (_, i) => String.fromCodePoint(0x3041 + i)).join("");
// Katakana: U+30A1–U+30F6
const KATAKANA_CHARS = Array.from({ length: 0x30F7 - 0x30A1 }, (_, i) => String.fromCodePoint(0x30A1 + i)).join("");

const CHAR_GROUPS = [
  { label: "UPPERCASE", chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
  { label: "lowercase", chars: "abcdefghijklmnopqrstuvwxyz" },
  { label: "0–9", chars: "0123456789" },
  { label: "Symbols", chars: "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~" },
  { label: "ひらがな", chars: HIRAGANA_CHARS },
  { label: "カタカナ", chars: KATAKANA_CHARS },
];

const ALL_CHARS = CHAR_GROUPS.flatMap(g =>
  Array.from(g.chars).map(c => ({ char: c, unicode: c.codePointAt(0)! }))
);

type TabType = "editor" | "preview" | "settings";

export default function GlyphEditorPage() {
  const params = useParams<{ id: string; unicode?: string }>();
  const projectId = parseInt(params.id ?? "0");
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("editor");
  const [selectedUnicode, setSelectedUnicode] = useState<number>(65);
  const [previewText, setPreviewText] = useState("Hello World! ABCDEFGabcdefg 0123456789");
  const [fontSize, setFontSize] = useState(48);
  const [fontUrl, setFontUrl] = useState<string | null>(null);
  const [previewFont, setPreviewFont] = useState<{
    status: "idle" | "loading" | "ready" | "error";
    family: string | null;
    error?: string;
  }>({ status: "idle", family: null });
  const [generatingFormat, setGeneratingFormat] = useState<"ttf" | "otf" | null>(null);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [pendingWidth, setPendingWidth] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>("node");
  const [lockAspect, setLockAspect] = useState(false);
  const [currentBBox, setCurrentBBox] = useState<BBox | null>(null);
  const [editorZoom, setEditorZoom] = useState(1);
  const [simplifyTolerance, setSimplifyTolerance] = useState(2);
  const [smoothTension, setSmoothTension] = useState(0.3);
  // Temporary string states for bbox numeric inputs so empty string is allowed while typing
  const [bboxXInput, setBboxXInput] = useState<string | null>(null);
  const [bboxYInput, setBboxYInput] = useState<string | null>(null);
  const [bboxWInput, setBboxWInput] = useState<string | null>(null);
  const [bboxHInput, setBboxHInput] = useState<string | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    name: "", author: "", description: "",
    upm: "1000", ascender: "800", descender: "-200",
  });
  const [sbForm, setSbForm] = useState({ defaultLsb: "50", defaultRsb: "50" });
  const [glyphSbForm, setGlyphSbForm] = useState<Record<number, { lsb: string; rsb: string }>>({});
  const uploadRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const { data: project, isLoading: projectLoading, error: projectError, refetch: refetchProject } = trpc.fontProject.get.useQuery(
    { id: projectId }, { enabled: !!projectId && isAuthenticated, retry: 3, retryDelay: 1000 }
  );
  const { data: glyphList, error: glyphError, refetch: refetchGlyphs } = trpc.glyph.list.useQuery(
    { projectId }, { enabled: !!projectId && isAuthenticated, retry: 3, retryDelay: 1000 }
  );
  const { data: fontFiles } = trpc.font.listFiles.useQuery(
    { projectId }, { enabled: !!projectId && isAuthenticated, retry: 3, retryDelay: 1000 }
  );

  useEffect(() => {
    if (project) {
      setSettingsForm({
        name: project.name, author: project.author ?? "",
        description: project.description ?? "",
        upm: String(project.upm), ascender: String(project.ascender), descender: String(project.descender),
      });
      setSbForm({
        defaultLsb: String((project as any).defaultLsb ?? 50),
        defaultRsb: String((project as any).defaultRsb ?? 50),
      });
    }
  }, [project]);

  useEffect(() => {
    if (fontFiles && fontFiles.length > 0) {
      const ttf = fontFiles.find(f => f.format === "ttf") ?? fontFiles[0];
      setFontUrl(ttf.fileUrl);
    }
  }, [fontFiles]);

  // Fetch font as binary → FontFace API (bypasses HTTP cache and auth issues)
  useEffect(() => {
    if (!fontUrl) {
      setPreviewFont({ status: "idle", family: null });
      return;
    }
    let cancelled = false;
    const family = `CustomFont_${Date.now()}`;
    setPreviewFont({ status: "loading", family: null });

    fetch(fontUrl, { credentials: "include", cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch font (HTTP ${res.status})`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        if (cancelled) return;
        const face = new FontFace(family, buffer);
        return face.load();
      })
      .then((loadedFace) => {
        if (cancelled || !loadedFace) return;
        document.fonts.add(loadedFace);
        setPreviewFont({ status: "ready", family });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Font load failed";
        setPreviewFont({ status: "error", family: null, error: msg });
      });

    return () => { cancelled = true; };
  }, [fontUrl]);

  useEffect(() => {
    setPendingPath(null);
    setPendingWidth(null);
    setCurrentBBox(null);
  }, [selectedUnicode]);

  const glyphMap = new Map(glyphList?.map(g => [g.unicode, g]) ?? []);
  const currentGlyph = glyphMap.get(selectedUnicode) ?? null;

  const uploadMutation = trpc.glyph.upload.useMutation({
    onSuccess: () => {
      // Reset pending edits so the new SVG is re-normalized from scratch
      setPendingPath(null);
      setPendingWidth(null);
      setCurrentBBox(null);
      utils.glyph.list.invalidate();
      toast.success("Glyph uploaded");
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.glyph.delete.useMutation({
    onSuccess: () => {
      // Clear any pending edits so the canvas is blank after deletion
      setPendingPath(null);
      setPendingWidth(null);
      setCurrentBBox(null);
      utils.glyph.list.invalidate();
      toast.success("Glyph deleted");
    },
    onError: (err) => toast.error(err.message),
  });
  const updateWidthMutation = trpc.glyph.updateWidth.useMutation({
    onSuccess: () => utils.glyph.list.invalidate(),
    onError: (err) => toast.error(err.message),
  });
  const updatePathMutation = trpc.glyph.updatePathData.useMutation({
    onSuccess: () => utils.glyph.list.invalidate(),
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.fontProject.update.useMutation({
    onSuccess: () => { utils.fontProject.get.invalidate({ id: projectId }); toast.success("Settings saved"); },
    onError: (err) => toast.error(err.message),
  });
  const setDefaultSbMutation = trpc.fontProject.setDefaultSideBearings.useMutation({
    onSuccess: () => { utils.fontProject.get.invalidate({ id: projectId }); toast.success("Default side bearings saved"); },
    onError: (err) => toast.error(err.message),
  });
  const applyAllSbMutation = trpc.fontProject.applyDefaultSideBearingsToAll.useMutation({
    onSuccess: () => {
      utils.fontProject.get.invalidate({ id: projectId });
      utils.glyph.list.invalidate({ projectId });
      toast.success("Applied to all glyphs — per-glyph overrides cleared");
    },
    onError: (err) => toast.error(err.message),
  });
  const updateGlyphSbMutation = trpc.glyph.updateSideBearings.useMutation({
    onSuccess: () => { utils.glyph.list.invalidate({ projectId }); toast.success("Side bearings updated"); },
    onError: (err) => toast.error(err.message),
  });
  const generateMutation = trpc.font.generate.useMutation({
    onSuccess: (data) => {
      setGeneratingFormat(null);
      utils.font.listFiles.invalidate({ projectId });
      setFontUrl(data.url);
      setActiveTab("preview");
      toast.success(`${data.format.toUpperCase()} generated!`);
    },
    onError: (err) => { setGeneratingFormat(null); toast.error(err.message); },
  });
  const autoSbMutation = trpc.glyph.autoSideBearings.useMutation({
    onSuccess: (data) => {
      utils.glyph.list.invalidate({ projectId });
      toast.success(`Auto side bearings applied to ${data.applied} glyphs. Regenerating font...`);
      // Automatically regenerate the font so the preview reflects the new bearings
      generateMutation.mutate({ projectId, format: "ttf" });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleUploadFile = useCallback((file: File) => {
    // Reset pending state immediately so GlyphCanvas sees null pathData
    // and re-normalizes the new SVG from scratch (avoids stale pendingPath)
    setPendingPath(null);
    setPendingWidth(null);
    setCurrentBBox(null);
    const char = String.fromCodePoint(selectedUnicode);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMutation.mutate({ projectId, unicode: selectedUnicode, char, svgBase64: base64 });
    };
    reader.readAsDataURL(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, selectedUnicode]);

  const handleSaveEdits = useCallback(async () => {
    if (!currentGlyph) return;
    setIsSaving(true);
    try {
      if (pendingWidth !== null) {
        await updateWidthMutation.mutateAsync({ id: currentGlyph.id, projectId, width: pendingWidth });
      }
      if (pendingPath !== null) {
        await updatePathMutation.mutateAsync({ id: currentGlyph.id, projectId, pathData: pendingPath });
      }
      setPendingPath(null);
      setPendingWidth(null);
      toast.success("Changes saved");
    } catch {
      // errors handled by mutation
    } finally {
      setIsSaving(false);
    }
  }, [currentGlyph, pendingWidth, pendingPath, projectId, updateWidthMutation, updatePathMutation]);

  const handleGenerate = (format: "ttf" | "otf") => {
    setGeneratingFormat(format);
    generateMutation.mutate({ projectId, format });
  };

  const navigateGlyph = (dir: -1 | 1) => {
    const idx = ALL_CHARS.findIndex(c => c.unicode === selectedUnicode);
    const next = ALL_CHARS[idx + dir];
    if (next) switchGlyph(next.unicode);
  };

  const currentChar = String.fromCodePoint(selectedUnicode);
  const currentCharName = `U+${selectedUnicode.toString(16).toUpperCase().padStart(4, "0")} "${currentChar}"`;
  const uploadedCount = glyphList?.length ?? 0;
  const hasEdits = pendingPath !== null || pendingWidth !== null;

  const switchGlyph = useCallback((unicode: number) => {
    // Switch immediately without confirmation – unsaved edits are discarded silently
    setSelectedUnicode(unicode);
  }, []);

  // --- Transform: numeric input handlers ---
  const activePath = pendingPath ?? currentGlyph?.pathData ?? null;
  const activeCmds = useMemo(() => activePath ? parsePath(activePath) : [], [activePath]);
  const bbox = currentBBox ?? (activeCmds.length > 0 ? computeBBox(activeCmds) : null);

  const bboxX = bbox ? Math.round(bbox.minX) : 0;
  const bboxY = bbox ? Math.round(bbox.minY) : 0;
  const bboxW = bbox ? Math.round(bbox.maxX - bbox.minX) : 0;
  const bboxH = bbox ? Math.round(bbox.maxY - bbox.minY) : 0;

  const applyTransformFromBBox = useCallback((
    newX: number, newY: number, newW: number, newH: number
  ) => {
    if (!bbox || activeCmds.length === 0) return;
    const origW = bbox.maxX - bbox.minX;
    const origH = bbox.maxY - bbox.minY;
    const scaleX = origW > 0 ? newW / origW : 1;
    const scaleY = origH > 0 ? newH / origH : 1;
    const dx = newX - bbox.minX;
    const dy = newY - bbox.minY;
    const newCmds = transformCmds(activeCmds, dx, dy, scaleX, scaleY, bbox.minX, bbox.minY);
    const newPath = serializePath(newCmds);
    setPendingPath(newPath);
  }, [bbox, activeCmds]);

  const handleNumericX = (val: number) => {
    if (!bbox) return;
    applyTransformFromBBox(val, bboxY, bboxW, bboxH);
  };
  const handleNumericY = (val: number) => {
    if (!bbox) return;
    applyTransformFromBBox(bboxX, val, bboxW, bboxH);
  };
  const handleNumericW = (val: number) => {
    if (!bbox || val <= 0) return;
    const newH = lockAspect && bboxW > 0 ? Math.round(bboxH * val / bboxW) : bboxH;
    applyTransformFromBBox(bboxX, bboxY, val, newH);
  };
  const handleNumericH = (val: number) => {
    if (!bbox || val <= 0) return;
    const newW = lockAspect && bboxH > 0 ? Math.round(bboxW * val / bboxH) : bboxW;
    applyTransformFromBBox(bboxX, bboxY, newW, val);
  };

  if (projectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (projectError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white">
        <div className="text-5xl font-black uppercase border-b-4 border-black pb-2">Connection Error</div>
        <p className="text-gray-600 font-mono text-sm max-w-md text-center">
          Failed to load project data. This may be a temporary network issue.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => { refetchProject(); refetchGlyphs(); }}
            className="brutal-btn flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
          <button onClick={() => navigate("/projects")} className="brutal-btn-outline flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <div className="text-4xl font-black uppercase">Project not found</div>
        <button onClick={() => navigate("/projects")} className="brutal-btn flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* FontFace API loads font imperatively – bypasses browser @font-face cache */}
      {/* ── Top bar ── */}
      <nav className="border-b-4 border-black px-4 py-2 flex items-center justify-between flex-shrink-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/projects")}
            className="flex items-center gap-1 hover:underline font-black text-xs uppercase tracking-widest"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Projects
          </button>
          <div className="w-px h-5 bg-black" />
          <span className="font-black text-sm uppercase tracking-tight">{project.name}</span>
          {project.author && <span className="text-xs text-gray-400 font-mono">by {project.author}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-gray-400">{uploadedCount} glyphs</span>
          <button
            onClick={() => handleGenerate("ttf")}
            disabled={!!generatingFormat || uploadedCount === 0}
            className="brutal-btn text-xs py-1.5 px-3 flex items-center gap-1"
          >
            {generatingFormat === "ttf" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            TTF
          </button>
          <button
            onClick={() => handleGenerate("otf")}
            disabled={!!generatingFormat || uploadedCount === 0}
            className="brutal-btn-outline text-xs py-1.5 px-3 flex items-center gap-1"
          >
            {generatingFormat === "otf" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            OTF
          </button>
        </div>
      </nav>

      {/* ── Tab bar ── */}
      <div className="border-b-3 border-black flex flex-shrink-0">
        {(["editor", "preview", "settings"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 font-black text-xs uppercase tracking-widest border-r-2 border-black transition-colors flex items-center gap-1.5
              ${activeTab === tab ? "bg-black text-white" : "bg-white text-black hover:bg-gray-50"}`}
          >
            {tab === "editor" && <><Type className="w-3.5 h-3.5" />Glyph Editor</>}
            {tab === "preview" && <><Eye className="w-3.5 h-3.5" />Preview</>}
            {tab === "settings" && <><Settings className="w-3.5 h-3.5" />Settings</>}
          </button>
        ))}
      </div>

      {/* ── Editor layout ── */}
      {activeTab === "editor" && (
        <div className="flex flex-1 overflow-hidden">

          {/* Left panel: character list */}
          <div className="w-52 border-r-4 border-black flex flex-col flex-shrink-0 overflow-hidden bg-white">
            <div className="border-b-2 border-black px-3 py-2">
              <div className="font-black text-xs uppercase tracking-widest text-gray-500">Characters</div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {CHAR_GROUPS.map(group => (
                <div key={group.label}>
                  <div className="px-3 py-1.5 font-black text-[10px] uppercase tracking-widest text-gray-400 bg-gray-50 border-b border-gray-200 sticky top-0">
                    {group.label}
                  </div>
                  <div className="grid grid-cols-4 gap-0">
                    {Array.from(group.chars).map(c => {
                      const uni = c.codePointAt(0)!;
                      const hasGlyph = glyphMap.has(uni);
                      const isSelected = uni === selectedUnicode;
                      return (
                        <button
                          key={uni}
                          onClick={() => switchGlyph(uni)}
                          className={`relative h-10 flex items-center justify-center text-sm font-black border-b border-r border-gray-100 transition-colors
                            ${isSelected ? "bg-black text-white" : hasGlyph ? "bg-white text-black hover:bg-gray-50" : "bg-white text-gray-300 hover:bg-gray-50 hover:text-gray-500"}`}
                          title={`U+${uni.toString(16).toUpperCase().padStart(4, "0")} "${c}"`}
                        >
                          {c}
                          {hasGlyph && (
                            <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-green-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center: canvas */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Glyph header */}
            <div className="border-b-2 border-black px-4 py-2 flex items-center justify-between bg-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => navigateGlyph(-1)} className="p-1 hover:bg-gray-100 border border-black">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="font-black text-base uppercase tracking-tight">{currentChar}</div>
                  <div className="font-mono text-[10px] text-gray-400">{currentCharName}</div>
                </div>
                <button onClick={() => navigateGlyph(1)} className="p-1 hover:bg-gray-100 border border-black">
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Edit mode toggle */}
                {currentGlyph && (
                  <div className="flex items-center gap-1 ml-2 border-2 border-black">
                    <button
                      onClick={() => setEditMode("node")}
                      title="Node edit mode"
                      className={`p-1.5 flex items-center gap-1 text-[10px] font-black uppercase transition-colors
                        ${editMode === "node" ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"}`}
                    >
                      <MousePointer className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Nodes</span>
                    </button>
                    <button
                      onClick={() => setEditMode("transform")}
                      title="Transform mode"
                      className={`p-1.5 flex items-center gap-1 text-[10px] font-black uppercase transition-colors border-l-2 border-black
                        ${editMode === "transform" ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"}`}
                    >
                      <Move className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Transform</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Zoom slider */}
                <div className="flex items-center gap-1 border-2 border-black bg-white px-2 py-1">
                  <button
                    onClick={() => setEditorZoom(z => Math.max(0.2, z / 1.25))}
                    className="w-5 h-5 font-black text-sm hover:bg-black hover:text-white transition-colors flex items-center justify-center"
                    title="Zoom out"
                  >−</button>
                  <input
                    type="range" min={20} max={800} step={5}
                    value={Math.round(editorZoom * 100)}
                    onChange={e => setEditorZoom(parseInt(e.target.value) / 100)}
                    className="w-20 accent-black" style={{ height: "3px" }}
                  />
                  <button
                    onClick={() => setEditorZoom(z => Math.min(8, z * 1.25))}
                    className="w-5 h-5 font-black text-sm hover:bg-black hover:text-white transition-colors flex items-center justify-center"
                    title="Zoom in"
                  >+</button>
                  <span className="font-mono text-[10px] min-w-[36px] text-center">{Math.round(editorZoom * 100)}%</span>
                  <button
                    onClick={() => setEditorZoom(1)}
                    className="w-5 h-5 font-black text-[10px] hover:bg-black hover:text-white transition-colors flex items-center justify-center"
                    title="Reset zoom"
                  >⌂</button>
                </div>
                {currentGlyph ? (
                  <>
                    {hasEdits && (
                      <button
                        onClick={handleSaveEdits}
                        disabled={isSaving}
                        className="brutal-btn text-xs py-1 px-3 flex items-center gap-1 bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                      >
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Save
                      </button>
                    )}
                    <button
                      onClick={() => uploadRef.current?.click()}
                      className="brutal-btn-outline text-xs py-1 px-3 flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" /> Replace SVG
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate({ id: currentGlyph.id, projectId })}
                      className="p-1.5 border-2 border-black hover:bg-black hover:text-white transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => uploadRef.current?.click()}
                    className="brutal-btn text-xs py-1 px-3 flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" /> Upload SVG
                  </button>
                )}
                <input
                  ref={uploadRef}
                  type="file"
                  accept=".svg,image/svg+xml"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadFile(f); e.target.value = ""; }}
                />
              </div>
            </div>

            {/* Canvas area */}
            <div className="flex-1 overflow-hidden">
              {currentGlyph ? (
                <GlyphCanvas
                  svgUrl={currentGlyph.svgUrl}
                  pathData={pendingPath ?? currentGlyph.pathData}
                  glyphId={currentGlyph.id}
                  char={currentChar}
                  upm={project.upm}
                  ascender={project.ascender}
                  descender={project.descender}
                  xHeight={Math.round(project.ascender * 0.55)}
                  capHeight={Math.round(project.ascender * 0.72)}
                  advanceWidth={pendingWidth ?? currentGlyph.width}
                  onPathChange={path => setPendingPath(path)}
                  onWidthChange={w => setPendingWidth(w)}
                  onBBoxChange={bb => setCurrentBBox(bb)}
                  editMode={editMode}
                  zoomLevel={editorZoom}
                  onZoomChange={setEditorZoom}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-gray-50">
                  <div className="text-8xl font-black text-gray-100 select-none">{currentChar}</div>
                  <div className="text-center">
                    <div className="font-black text-lg uppercase tracking-tight text-gray-400 mb-1">No glyph yet</div>
                    <div className="font-mono text-xs text-gray-400 mb-4">{currentCharName}</div>
                    <button
                      onClick={() => uploadRef.current?.click()}
                      className="brutal-btn flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" /> Upload SVG for "{currentChar}"
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right panel: attributes */}
          <div className="w-60 border-l-4 border-black flex flex-col flex-shrink-0 bg-white overflow-y-auto">
            <div className="border-b-2 border-black px-3 py-2">
              <div className="font-black text-xs uppercase tracking-widest text-gray-500">Attributes</div>
            </div>

            {currentGlyph ? (
              <div className="p-3 space-y-4">
                {/* Glyph section */}
                <div>
                  <div className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-2 border-b border-gray-200 pb-1">Glyph</div>
                  <div className="space-y-2">
                    <div>
                      <label className="block font-black text-[10px] uppercase tracking-widest text-gray-500 mb-1">Advance Width</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={pendingWidth ?? currentGlyph.width}
                          onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) setPendingWidth(v); }}
                          className="brutal-input text-xs py-1 px-2 w-full"
                          min={0} max={4096}
                        />
                        <span className="text-[10px] font-mono text-gray-400">u</span>
                      </div>
                    </div>
                    <div>
                      <label className="block font-black text-[10px] uppercase tracking-widest text-gray-500 mb-1">Unicode</label>
                      <div className="font-mono text-xs bg-gray-50 border border-gray-200 px-2 py-1">
                        U+{selectedUnicode.toString(16).toUpperCase().padStart(4, "0")}
                      </div>
                    </div>
                    <div>
                      <label className="block font-black text-[10px] uppercase tracking-widest text-gray-500 mb-1">Character</label>
                      <div className="font-black text-2xl text-center py-2 bg-gray-50 border border-gray-200">
                        {currentChar}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transform: position & size */}
                {bbox && (
                  <div>
                    <div className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-2 border-b border-gray-200 pb-1 flex items-center justify-between">
                      <span>Transform</span>
                      <button
                        onClick={() => setLockAspect(v => !v)}
                        title={lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"}
                        className={`p-0.5 border border-gray-300 rounded transition-colors ${lockAspect ? "bg-black text-white border-black" : "bg-white text-gray-400 hover:border-gray-500"}`}
                      >
                        {lockAspect ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="block font-black text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">X</label>
                        <input
                          type="number"
                          value={bboxXInput !== null ? bboxXInput : bboxX}
                          onChange={e => setBboxXInput(e.target.value)}
                          onBlur={() => {
                            const v = parseInt(bboxXInput ?? "");
                            if (!isNaN(v)) handleNumericX(v);
                            setBboxXInput(null);
                          }}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              const v = parseInt(bboxXInput ?? "");
                              if (!isNaN(v)) handleNumericX(v);
                              setBboxXInput(null);
                            }
                          }}
                          className="brutal-input text-xs py-1 px-2 w-full"
                        />
                      </div>
                      <div>
                        <label className="block font-black text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">Y</label>
                        <input
                          type="number"
                          value={bboxYInput !== null ? bboxYInput : bboxY}
                          onChange={e => setBboxYInput(e.target.value)}
                          onBlur={() => {
                            const v = parseInt(bboxYInput ?? "");
                            if (!isNaN(v)) handleNumericY(v);
                            setBboxYInput(null);
                          }}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              const v = parseInt(bboxYInput ?? "");
                              if (!isNaN(v)) handleNumericY(v);
                              setBboxYInput(null);
                            }
                          }}
                          className="brutal-input text-xs py-1 px-2 w-full"
                        />
                      </div>
                      <div>
                        <label className="block font-black text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">
                          W {lockAspect && <span className="text-orange-500">&#x26D3;</span>}
                        </label>
                        <input
                          type="number"
                          value={bboxWInput !== null ? bboxWInput : bboxW}
                          onChange={e => setBboxWInput(e.target.value)}
                          onBlur={() => {
                            const v = parseInt(bboxWInput ?? "");
                            if (!isNaN(v) && v > 0) handleNumericW(v);
                            setBboxWInput(null);
                          }}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              const v = parseInt(bboxWInput ?? "");
                              if (!isNaN(v) && v > 0) handleNumericW(v);
                              setBboxWInput(null);
                            }
                          }}
                          className="brutal-input text-xs py-1 px-2 w-full"
                          min={1}
                        />
                      </div>
                      <div>
                        <label className="block font-black text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">
                          H {lockAspect && <span className="text-orange-500">&#x26D3;</span>}
                        </label>
                        <input
                          type="number"
                          value={bboxHInput !== null ? bboxHInput : bboxH}
                          onChange={e => setBboxHInput(e.target.value)}
                          onBlur={() => {
                            const v = parseInt(bboxHInput ?? "");
                            if (!isNaN(v) && v > 0) handleNumericH(v);
                            setBboxHInput(null);
                          }}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              const v = parseInt(bboxHInput ?? "");
                              if (!isNaN(v) && v > 0) handleNumericH(v);
                              setBboxHInput(null);
                            }
                          }}
                          className="brutal-input text-xs py-1 px-2 w-full"
                          min={1}
                        />
                      </div>
                    </div>
                    <div className="mt-1.5 font-mono text-[9px] text-gray-400">
                      units: font units (UPM={project.upm})
                    </div>
                    <button
                      onClick={async () => {
                        // Reset: clear pendingPath AND pendingWidth AND saved pathData so SVG is re-normalized with auto advance width
                        setPendingPath(null);
                        setPendingWidth(null);
                        setCurrentBBox(null);
                        if (currentGlyph?.pathData) {
                          try {
                            await updatePathMutation.mutateAsync({ id: currentGlyph.id, projectId, pathData: "" });
                            toast.info("Reset to original SVG — advance width will be recalculated");
                          } catch {
                            toast.info("Transform reset to original SVG");
                          }
                        } else {
                          toast.info("Reset to original SVG — advance width will be recalculated");
                        }
                      }}
                      className="mt-2 w-full text-[10px] font-black uppercase tracking-widest border border-gray-300 px-2 py-1 hover:bg-gray-100 transition-colors"
                    >
                      ↺ Reset Transform
                    </button>
                  </div>
                )}
                {/* Path Operations */}
                {currentGlyph && (
                  <div>
                    <div className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-2 border-b border-gray-200 pb-1">Path Operations</div>
                    <div className="space-y-1.5">
                      {/* Cleanup */}
                      <button
                        onClick={() => {
                          const src = pendingPath ?? currentGlyph.pathData;
                          if (!src) return toast.error("No path to clean up");
                          const cleaned = cleanupPath(parsePath(src));
                          setPendingPath(serializePath(cleaned));
                          toast.success(`Cleanup: ${parsePath(src).length} → ${cleaned.length} cmds`);
                        }}
                        className="w-full text-[10px] font-black uppercase tracking-widest border border-gray-300 px-2 py-1 hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
                        title="Remove duplicate points and degenerate segments"
                      >
                        <span>✦</span> Cleanup Path
                      </button>
                      {/* Simplify */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const src = pendingPath ?? currentGlyph.pathData;
                            if (!src) return toast.error("No path to simplify");
                            const simplified = simplifyPath(parsePath(src), simplifyTolerance);
                            setPendingPath(serializePath(simplified));
                            toast.success(`Simplify: ${parsePath(src).length} → ${simplified.length} cmds`);
                          }}
                          className="flex-1 text-[10px] font-black uppercase tracking-widest border border-gray-300 px-2 py-1 hover:bg-gray-100 transition-colors"
                          title="Reduce point count (Ramer-Douglas-Peucker)"
                        >
                          ◈ Simplify
                        </button>
                        <input
                          type="number" min={0.5} max={50} step={0.5}
                          value={simplifyTolerance}
                          onChange={e => setSimplifyTolerance(parseFloat(e.target.value) || 2)}
                          className="w-12 brutal-input text-[10px] py-1 px-1 text-center"
                          title="Tolerance (font units)"
                        />
                      </div>
                      {/* Smooth */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const src = pendingPath ?? currentGlyph.pathData;
                            if (!src) return toast.error("No path to smooth");
                            const smoothed = smoothPath(parsePath(src), smoothTension);
                            setPendingPath(serializePath(smoothed));
                            toast.success(`Smoothed path (tension ${smoothTension})`);
                          }}
                          className="flex-1 text-[10px] font-black uppercase tracking-widest border border-gray-300 px-2 py-1 hover:bg-gray-100 transition-colors"
                          title="Convert L segments to smooth cubic Bezier curves"
                        >
                          ≋ Smooth
                        </button>
                        <input
                          type="number" min={0.05} max={1} step={0.05}
                          value={smoothTension}
                          onChange={e => setSmoothTension(parseFloat(e.target.value) || 0.3)}
                          className="w-12 brutal-input text-[10px] py-1 px-1 text-center"
                          title="Tension (0.05–1.0)"
                        />
                      </div>
                    </div>
                  </div>
                )}
                 {/* Font metrics reference */}
                <div>
                  <div className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-2 border-b border-gray-200 pb-1">Font Metrics</div>
                  <div className="space-y-1 font-mono text-[10px] text-gray-500">
                    <div className="flex justify-between"><span>UPM</span><span className="font-black text-black">{project.upm}</span></div>
                    <div className="flex justify-between"><span>Ascender</span><span className="font-black text-black">{project.ascender}</span></div>
                    <div className="flex justify-between"><span>Descender</span><span className="font-black text-black">{project.descender}</span></div>
                    <div className="flex justify-between"><span>x-height</span><span className="font-black text-black">{Math.round(project.ascender * 0.55)}</span></div>
                    <div className="flex justify-between"><span>Cap-height</span><span className="font-black text-black">{Math.round(project.ascender * 0.72)}</span></div>
                  </div>
                </div>

                {/* Guidelines legend */}
                <div>
                  <div className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-2 border-b border-gray-200 pb-1">Guidelines</div>
                  <div className="space-y-1 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-blue-400 opacity-50 inline-block" style={{ borderTop: "2px dashed rgba(0,120,255,0.4)" }} />ascender</div>
                    <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-blue-500 inline-block" />baseline</div>
                    <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-green-500 opacity-60 inline-block" style={{ borderTop: "2px dashed rgba(0,180,0,0.5)" }} />advance width</div>
                    {editMode === "node" && <>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-blue-600 inline-block" />anchor node</div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />control handle</div>
                    </>}
                    {editMode === "transform" && <>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-orange-400 inline-block" />scale handle</div>
                      <div className="flex items-center gap-1.5 text-gray-400">drag body to move</div>
                    </>}
                  </div>
                </div>

                {hasEdits && (
                  <button
                    onClick={handleSaveEdits}
                    disabled={isSaving}
                    className="w-full brutal-btn text-xs py-2 flex items-center justify-center gap-1 bg-black text-white"
                  >
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Save Changes
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3 text-center text-gray-400 font-mono text-xs mt-4">
                Upload an SVG to edit this glyph
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Preview tab ── */}
      {activeTab === "preview" && (
        <div className="flex-1 p-8 overflow-auto">
          <div className="brutal-tag mb-6">Live Preview</div>

          {/* No font yet */}
          {!fontUrl ? (
            <div className="border-3 border-black border-dashed p-20 text-center">
              <div className="text-5xl font-black text-gray-200 uppercase tracking-tighter mb-4">No Font Yet</div>
              <p className="text-gray-500 mb-6 font-mono text-sm">Upload glyphs and generate a font to preview it here.</p>
              <div className="flex gap-4 justify-center">
                <button onClick={() => handleGenerate("ttf")} disabled={!!generatingFormat || uploadedCount === 0} className="brutal-btn flex items-center gap-2">
                  {generatingFormat === "ttf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Generate TTF
                </button>
                <button onClick={() => handleGenerate("otf")} disabled={!!generatingFormat || uploadedCount === 0} className="brutal-btn-outline flex items-center gap-2">
                  {generatingFormat === "otf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Generate OTF
                </button>
              </div>
            </div>
          ) : previewFont.status === "loading" ? (
            <div className="border-3 border-black p-20 text-center">
              <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" />
              <p className="font-mono text-sm text-gray-500">Loading font...</p>
            </div>
          ) : previewFont.status === "error" ? (
            <div className="border-3 border-black border-dashed p-16 text-center">
              <div className="text-3xl font-black text-red-400 uppercase tracking-tighter mb-3">Load Failed</div>
              <p className="font-mono text-xs text-gray-500 mb-6">{previewFont.error}</p>
              <button
                onClick={() => { setFontUrl(null); setTimeout(() => setFontUrl(fontUrl), 50); }}
                className="brutal-btn flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border-3 border-black p-6 brutal-shadow">
                <div>
                  <label className="block font-black text-xs uppercase tracking-widest mb-2">Preview Text</label>
                  <textarea
                    className="brutal-input resize-none font-mono"
                    rows={3}
                    value={previewText}
                    onChange={e => setPreviewText(e.target.value)}
                    placeholder="Type something..."
                  />
                </div>
                <div>
                  <label className="block font-black text-xs uppercase tracking-widest mb-2">Font Size: {fontSize}px</label>
                  <input
                    type="range" min={12} max={200} value={fontSize}
                    onChange={e => setFontSize(parseInt(e.target.value))}
                    className="w-full accent-black mb-4" style={{ height: "4px" }}
                  />
                  <div className="flex gap-2 flex-wrap">
                    {[16, 24, 36, 48, 72, 96, 128].map(s => (
                      <button key={s} onClick={() => setFontSize(s)}
                        className={`brutal-btn-sm ${fontSize === s ? "bg-black text-white" : "bg-white text-black"}`}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-3 border-black p-8 brutal-shadow-lg min-h-40 bg-white overflow-auto mb-6">
                <div style={{ fontFamily: `'${previewFont.family}', sans-serif`, fontSize: `${fontSize}px`, lineHeight: 1.4, wordBreak: "break-all", whiteSpace: "pre-wrap" }}>
                  {previewText || "Type something in the preview text box..."}
                </div>
              </div>

              <div className="flex gap-4 flex-wrap">
                {fontFiles?.map(f => (
                  <a key={f.id} href={f.fileUrl} download={`${project.name}.${f.format}`} className="brutal-btn flex items-center gap-2">
                    <Download className="w-4 h-4" /> Download {f.format.toUpperCase()}
                  </a>
                ))}
                <button onClick={() => handleGenerate("ttf")} disabled={!!generatingFormat} className="brutal-btn-outline flex items-center gap-2">
                  {generatingFormat === "ttf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Regenerate TTF
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Settings tab ── */}
      {activeTab === "settings" && (
        <div className="flex-1 p-8 overflow-auto">
          <div className="brutal-tag mb-6">Font Settings</div>
          <div className="max-w-xl border-3 border-black p-6 brutal-shadow space-y-4">
            {(["name", "author", "description"] as const).map(field => (
              <div key={field}>
                <label className="block font-black text-xs uppercase tracking-widest mb-1">{field}</label>
                {field === "description" ? (
                  <textarea
                    className="brutal-input resize-none"
                    rows={3}
                    value={settingsForm[field]}
                    onChange={e => setSettingsForm(f => ({ ...f, [field]: e.target.value }))}
                  />
                ) : (
                  <input
                    type="text"
                    className="brutal-input"
                    value={settingsForm[field]}
                    onChange={e => setSettingsForm(f => ({ ...f, [field]: e.target.value }))}
                  />
                )}
              </div>
            ))}
            <div className="grid grid-cols-3 gap-4">
              {(["upm", "ascender", "descender"] as const).map(field => (
                <div key={field}>
                  <label className="block font-black text-xs uppercase tracking-widest mb-1">{field}</label>
                  <input
                    type="number"
                    className="brutal-input"
                    value={settingsForm[field]}
                    onChange={e => setSettingsForm(f => ({ ...f, [field]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => updateMutation.mutate({
                id: projectId,
                name: settingsForm.name,
                author: settingsForm.author,
                description: settingsForm.description,
                upm: parseInt(settingsForm.upm) || 1000,
                ascender: parseInt(settingsForm.ascender) || 800,
                descender: parseInt(settingsForm.descender) || -200,
              })}
              disabled={updateMutation.isPending}
              className="brutal-btn flex items-center gap-2"
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </button>
          </div>

          {/* ── Side Bearings ── */}
          <div className="max-w-xl mt-8 border-3 border-black p-6 brutal-shadow space-y-4">
            <div className="brutal-tag mb-2">Side Bearings</div>
            <p className="text-xs text-gray-500 font-mono">
              各文字の左右余白（LSB/RSB）をフォントユニット単位で設定します。
              <strong>Apply to All</strong> で全グリフに一括適用、<strong>Auto (AI)</strong> でAIが自動提案します。
            </p>

            {/* Default preset row */}
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block font-black text-xs uppercase tracking-widest mb-1">Default LSB</label>
                <input
                  type="number" min={0} max={2000}
                  className="brutal-input w-24"
                  value={sbForm.defaultLsb}
                  onChange={(e) => setSbForm(f => ({ ...f, defaultLsb: e.target.value }))}
                />
              </div>
              <div>
                <label className="block font-black text-xs uppercase tracking-widest mb-1">Default RSB</label>
                <input
                  type="number" min={0} max={2000}
                  className="brutal-input w-24"
                  value={sbForm.defaultRsb}
                  onChange={(e) => setSbForm(f => ({ ...f, defaultRsb: e.target.value }))}
                />
              </div>
              <button
                className="brutal-btn flex items-center gap-2 text-sm"
                disabled={setDefaultSbMutation.isPending}
                onClick={() => setDefaultSbMutation.mutate({ id: projectId, defaultLsb: parseInt(sbForm.defaultLsb) || 0, defaultRsb: parseInt(sbForm.defaultRsb) || 0 })}
              >
                {setDefaultSbMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlignJustify className="w-4 h-4" />}
                Save Default
              </button>
              <button
                className="brutal-btn-outline flex items-center gap-2 text-sm"
                disabled={applyAllSbMutation.isPending}
                onClick={() => applyAllSbMutation.mutate({ id: projectId, defaultLsb: parseInt(sbForm.defaultLsb) || 0, defaultRsb: parseInt(sbForm.defaultRsb) || 0 })}
              >
                {applyAllSbMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Apply to All
              </button>
            </div>

            {/* Auto AI button */}
            <button
              className="brutal-btn flex items-center gap-2 text-sm"
              disabled={autoSbMutation.isPending || (glyphList?.length ?? 0) === 0}
              onClick={() => autoSbMutation.mutate({ projectId })}
            >
              {autoSbMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Auto Side Bearings (AI)
            </button>

            {/* ── Bulk Path Operations ── */}
            <div className="mt-6">
              <div className="brutal-tag mb-3">Bulk Path Operations</div>
              <p className="text-xs text-gray-500 font-mono mb-3">全グリフに一括適用します。元に戻せないため、適用前に保存してください。</p>
              <div className="space-y-3">
                {/* Cleanup All */}
                <div className="flex items-center justify-between border-2 border-black p-3">
                  <div>
                    <div className="font-black text-xs uppercase tracking-widest">✦ Cleanup All</div>
                    <div className="text-[10px] text-gray-500 font-mono">重複点・ゼロ長セグメントを除去</div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!glyphList?.length) return toast.error("No glyphs");
                      let count = 0;
                      for (const g of glyphList) {
                        const src = g.pathData;
                        if (!src) continue;
                        const cleaned = serializePath(cleanupPath(parsePath(src)));
                        if (cleaned !== src) {
                          await updatePathMutation.mutateAsync({ id: g.id, projectId, pathData: cleaned });
                          count++;
                        }
                      }
                      toast.success(`Cleanup: ${count} glyphs updated`);
                    }}
                    className="brutal-btn text-xs py-1 px-3"
                  >
                    Apply to All
                  </button>
                </div>
                {/* Simplify All */}
                <div className="flex items-center justify-between border-2 border-black p-3">
                  <div className="flex-1">
                    <div className="font-black text-xs uppercase tracking-widest">◈ Simplify All</div>
                    <div className="text-[10px] text-gray-500 font-mono">ポイント間引き (RDP)</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] font-mono text-gray-500">tol:</label>
                      <input
                        type="number" min={0.5} max={50} step={0.5}
                        value={simplifyTolerance}
                        onChange={e => setSimplifyTolerance(parseFloat(e.target.value) || 2)}
                        className="w-14 brutal-input text-xs py-1 px-1 text-center"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        if (!glyphList?.length) return toast.error("No glyphs");
                        let count = 0;
                        for (const g of glyphList) {
                          const src = g.pathData;
                          if (!src) continue;
                          const simplified = serializePath(simplifyPath(parsePath(src), simplifyTolerance));
                          if (simplified !== src) {
                            await updatePathMutation.mutateAsync({ id: g.id, projectId, pathData: simplified });
                            count++;
                          }
                        }
                        toast.success(`Simplify: ${count} glyphs updated`);
                      }}
                      className="brutal-btn text-xs py-1 px-3"
                    >
                      Apply to All
                    </button>
                  </div>
                </div>
                {/* Smooth All */}
                <div className="flex items-center justify-between border-2 border-black p-3">
                  <div className="flex-1">
                    <div className="font-black text-xs uppercase tracking-widest">≋ Smooth All</div>
                    <div className="text-[10px] text-gray-500 font-mono">L→曲線変換 (Catmull-Rom)</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] font-mono text-gray-500">tension:</label>
                      <input
                        type="number" min={0.05} max={1} step={0.05}
                        value={smoothTension}
                        onChange={e => setSmoothTension(parseFloat(e.target.value) || 0.3)}
                        className="w-14 brutal-input text-xs py-1 px-1 text-center"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        if (!glyphList?.length) return toast.error("No glyphs");
                        let count = 0;
                        for (const g of glyphList) {
                          const src = g.pathData;
                          if (!src) continue;
                          const smoothed = serializePath(smoothPath(parsePath(src), smoothTension));
                          if (smoothed !== src) {
                            await updatePathMutation.mutateAsync({ id: g.id, projectId, pathData: smoothed });
                            count++;
                          }
                        }
                        toast.success(`Smooth: ${count} glyphs updated`);
                      }}
                      className="brutal-btn text-xs py-1 px-3"
                    >
                      Apply to All
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* Per-glyph overrides table */}
            {(glyphList?.length ?? 0) > 0 && (
              <div>
                <div className="font-black text-xs uppercase tracking-widest mb-2">Per-Glyph Overrides</div>
                <div className="border-3 border-black overflow-auto max-h-72">
                  <table className="w-full text-sm font-mono">
                    <thead>
                      <tr className="border-b-3 border-black bg-black text-white">
                        <th className="px-3 py-2 text-left">Char</th>
                        <th className="px-3 py-2 text-left">Unicode</th>
                        <th className="px-3 py-2 text-left">LSB</th>
                        <th className="px-3 py-2 text-left">RSB</th>
                        <th className="px-3 py-2 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {glyphList?.map((g) => {
                        const key = g.id;
                        const local = glyphSbForm[key];
                        const lsbVal = local?.lsb ?? ((g as any).lsb != null ? String((g as any).lsb) : "");
                        const rsbVal = local?.rsb ?? ((g as any).rsb != null ? String((g as any).rsb) : "");
                        return (
                          <tr key={g.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-3 py-2 font-black text-base">{g.char}</td>
                            <td className="px-3 py-2 text-gray-400">U+{g.unicode.toString(16).toUpperCase().padStart(4, "0")}</td>
                            <td className="px-3 py-2">
                              <input
                                type="number" min={0} max={2000}
                                className="brutal-input w-20 py-1 text-sm"
                                placeholder={String(sbForm.defaultLsb)}
                                value={lsbVal}
                                onChange={(e) => setGlyphSbForm(prev => ({ ...prev, [key]: { lsb: e.target.value, rsb: prev[key]?.rsb ?? rsbVal } }))}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number" min={0} max={2000}
                                className="brutal-input w-20 py-1 text-sm"
                                placeholder={String(sbForm.defaultRsb)}
                                value={rsbVal}
                                onChange={(e) => setGlyphSbForm(prev => ({ ...prev, [key]: { lsb: prev[key]?.lsb ?? lsbVal, rsb: e.target.value } }))}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex gap-1">
                                <button
                                  className="brutal-btn-sm text-xs"
                                  disabled={updateGlyphSbMutation.isPending}
                                  onClick={() => {
                                    const l = parseInt(lsbVal);
                                    const r = parseInt(rsbVal);
                                    updateGlyphSbMutation.mutate({
                                      id: g.id, projectId,
                                      lsb: isNaN(l) ? null : l,
                                      rsb: isNaN(r) ? null : r,
                                    });
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  className="brutal-btn-sm text-xs bg-white text-black"
                                  title="Reset to project default"
                                  onClick={() => {
                                    setGlyphSbForm(prev => { const n = { ...prev }; delete n[key]; return n; });
                                    updateGlyphSbMutation.mutate({ id: g.id, projectId, lsb: null, rsb: null });
                                  }}
                                >
                                  Reset
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-2 font-mono">
                  空欄 = プロジェクトデフォルトを使用。Reset で個別設定をクリア。
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
