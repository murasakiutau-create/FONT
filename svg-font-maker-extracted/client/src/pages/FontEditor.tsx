import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import {
  Upload, Trash2, Download, Loader2, Type, ArrowLeft,
  Settings, Eye, RefreshCw, ChevronDown, ChevronUp, Wand2, AlignJustify
} from "lucide-react";
import { toast } from "sonner";

// Character groups
const CHAR_GROUPS = [
  {
    label: "Uppercase",
    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c) => ({ char: c, unicode: c.charCodeAt(0) })),
  },
  {
    label: "Lowercase",
    chars: "abcdefghijklmnopqrstuvwxyz".split("").map((c) => ({ char: c, unicode: c.charCodeAt(0) })),
  },
  {
    label: "Digits",
    chars: "0123456789".split("").map((c) => ({ char: c, unicode: c.charCodeAt(0) })),
  },
  {
    label: "Symbols",
    chars: "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~".split("").map((c) => ({ char: c, unicode: c.charCodeAt(0) })),
  },
];

function GlyphSlot({
  char,
  unicode,
  glyph,
  onUpload,
  onDelete,
}: {
  char: string;
  unicode: number;
  glyph?: { id: number; svgUrl: string } | null;
  onUpload: (unicode: number, char: string, file: File) => void;
  onDelete: (id: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!glyph) inputRef.current?.click();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(unicode, char, file);
    e.target.value = "";
  };

  return (
    <div
      className={`glyph-slot ${glyph ? "filled" : ""} group`}
      onClick={handleClick}
      title={`U+${unicode.toString(16).toUpperCase().padStart(4, "0")} "${char}"`}
    >
      <input ref={inputRef} type="file" accept=".svg,image/svg+xml" className="hidden" onChange={handleFile} />

      {glyph ? (
        <>
          <img
            src={glyph.svgUrl}
            alt={char}
            className="w-3/4 h-3/4 object-contain invert"
            style={{ filter: "invert(1)" }}
          />
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(glyph.id); }}
            className="absolute top-1 right-1 w-5 h-5 bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-black"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </>
      ) : (
        <span className="text-lg font-black text-gray-400 group-hover:text-gray-600 select-none">{char}</span>
      )}

      <span className="absolute bottom-0.5 left-0 right-0 text-center font-mono text-[8px] opacity-40 leading-none">
        {char === " " ? "SP" : char}
      </span>
    </div>
  );
}

export default function FontEditor() {
  const params = useParams<{ id: string }>();
  const projectId = parseInt(params.id ?? "0");
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<"glyphs" | "settings" | "preview">("glyphs");
  const [previewText, setPreviewText] = useState("Hello World! ABCDEFGabcdefg 0123456789");
  const [fontSize, setFontSize] = useState(48);
  const [fontUrl, setFontUrl] = useState<string | null>(null);
  const [previewFont, setPreviewFont] = useState<{
    status: "idle" | "loading" | "ready" | "error";
    family: string | null;
    error?: string;
  }>({ status: "idle", family: null });
  const [generatingFormat, setGeneratingFormat] = useState<"ttf" | "otf" | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    name: "", author: "", description: "",
    upm: "1000", ascender: "800", descender: "-200",
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sbForm, setSbForm] = useState({ defaultLsb: "50", defaultRsb: "50" });
  const [selectedGlyphId, setSelectedGlyphId] = useState<number | null>(null);
  const [glyphSbForm, setGlyphSbForm] = useState<Record<number, { lsb: string; rsb: string }>>({});

  const utils = trpc.useUtils();

  const { data: project, isLoading: projectLoading } = trpc.fontProject.get.useQuery(
    { id: projectId },
    { enabled: !!projectId && isAuthenticated }
  );

  const { data: glyphList, isLoading: glyphsLoading } = trpc.glyph.list.useQuery(
    { projectId },
    { enabled: !!projectId && isAuthenticated }
  );

  const { data: fontFiles } = trpc.font.listFiles.useQuery(
    { projectId },
    { enabled: !!projectId && isAuthenticated }
  );

  useEffect(() => {
    if (project) {
      setSettingsForm({
        name: project.name,
        author: project.author ?? "",
        description: project.description ?? "",
        upm: String(project.upm),
        ascender: String(project.ascender),
        descender: String(project.descender),
      });
      setSbForm({
        defaultLsb: String(project.defaultLsb ?? 50),
        defaultRsb: String(project.defaultRsb ?? 50),
      });
    }
  }, [project]);

  // Load latest TTF for preview
  useEffect(() => {
    if (fontFiles && fontFiles.length > 0) {
      const ttf = fontFiles.find((f) => f.format === "ttf") ?? fontFiles[0];
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

  const glyphMap = new Map(glyphList?.map((g) => [g.unicode, g]) ?? []);

  const uploadMutation = trpc.glyph.upload.useMutation({
    onSuccess: () => utils.glyph.list.invalidate(),
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.glyph.delete.useMutation({
    onSuccess: () => utils.glyph.list.invalidate(),
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.fontProject.update.useMutation({
    onSuccess: () => {
      utils.fontProject.get.invalidate({ id: projectId });
      toast.success("Settings saved");
    },
    onError: (err) => toast.error(err.message),
  });

  const setDefaultSbMutation = trpc.fontProject.setDefaultSideBearings.useMutation({
    onSuccess: () => {
      utils.fontProject.get.invalidate({ id: projectId });
      toast.success("Default side bearings saved");
    },
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
    onSuccess: () => {
      utils.glyph.list.invalidate({ projectId });
      toast.success("Side bearings updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const autoSbMutation = trpc.glyph.autoSideBearings.useMutation({
    onSuccess: (data) => {
      utils.glyph.list.invalidate({ projectId });
      toast.success(`Auto side bearings applied to ${data.applied} glyphs`);
    },
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
    onError: (err) => {
      setGeneratingFormat(null);
      toast.error(err.message);
    },
  });

  const handleUpload = useCallback(async (unicode: number, char: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMutation.mutate({ projectId, unicode, char, svgBase64: base64 });
    };
    reader.readAsDataURL(file);
  }, [projectId, uploadMutation]);

  const handleDelete = useCallback((id: number) => {
    deleteMutation.mutate({ id, projectId });
  }, [projectId, deleteMutation]);

  const handleGenerate = (format: "ttf" | "otf") => {
    setGeneratingFormat(format);
    generateMutation.mutate({ projectId, format });
  };

  const handleSaveSettings = () => {
    updateMutation.mutate({
      id: projectId,
      name: settingsForm.name,
      author: settingsForm.author,
      description: settingsForm.description,
      upm: parseInt(settingsForm.upm) || 1000,
      ascender: parseInt(settingsForm.ascender) || 800,
      descender: parseInt(settingsForm.descender) || -200,
    });
  };

  const uploadedCount = glyphList?.length ?? 0;

  if (projectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-4xl font-black uppercase">Project not found</div>
        <button onClick={() => navigate("/projects")} className="brutal-btn">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Nav */}
      <nav className="border-b-4 border-black px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/projects")} className="flex items-center gap-2 hover:underline font-black text-sm uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Projects
          </button>
          <div className="w-px h-6 bg-black" />
          <div>
            <span className="font-black text-lg uppercase tracking-tight">{project.name}</span>
            {project.author && <span className="text-sm text-gray-500 font-mono ml-2">by {project.author}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-gray-400 mr-2">{uploadedCount} glyphs</span>
          <button
            onClick={() => handleGenerate("ttf")}
            disabled={!!generatingFormat || uploadedCount === 0}
            className="brutal-btn text-sm"
          >
            {generatingFormat === "ttf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            TTF
          </button>
          <button
            onClick={() => handleGenerate("otf")}
            disabled={!!generatingFormat || uploadedCount === 0}
            className="brutal-btn-outline text-sm"
          >
            {generatingFormat === "otf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            OTF
          </button>
        </div>
      </nav>

      {/* Tab bar */}
      <div className="border-b-3 border-black flex flex-shrink-0">
        {(["glyphs", "settings", "preview"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-3 font-black text-sm uppercase tracking-widest border-r-3 border-black transition-colors
              ${activeTab === tab ? "bg-black text-white" : "bg-white text-black hover:bg-gray-50"}`}
          >
            {tab === "glyphs" && <><Type className="w-4 h-4 inline mr-2" />Glyphs</>}
            {tab === "settings" && <><Settings className="w-4 h-4 inline mr-2" />Settings</>}
            {tab === "preview" && <><Eye className="w-4 h-4 inline mr-2" />Preview</>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">

        {/* Glyphs tab */}
        {activeTab === "glyphs" && (
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <div>
                <div className="brutal-tag mb-2">Glyph Manager</div>
                <p className="text-sm text-gray-500 font-mono">
                  Click any empty slot to upload an SVG. Hover filled slots to delete.
                </p>
              </div>
            </div>

            {CHAR_GROUPS.map((group) => (
              <div key={group.label} className="mb-10">
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="font-black text-sm uppercase tracking-widest">{group.label}</h2>
                  <div className="h-px flex-1 bg-black opacity-20" />
                  <span className="font-mono text-xs text-gray-400">
                    {group.chars.filter((c) => glyphMap.has(c.unicode)).length}/{group.chars.length}
                  </span>
                </div>
                <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))" }}>
                  {group.chars.map(({ char, unicode }) => (
                    <GlyphSlot
                      key={unicode}
                      char={char}
                      unicode={unicode}
                      glyph={glyphMap.get(unicode) ?? null}
                      onUpload={handleUpload}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Settings tab */}
        {activeTab === "settings" && (
          <div className="p-8 max-w-2xl">
            <div className="brutal-tag mb-6">Font Metadata</div>
            <div className="grid grid-cols-1 gap-6 mb-8">
              <div>
                <label className="block font-black text-xs uppercase tracking-widest mb-2">Font Name *</label>
                <input
                  className="brutal-input"
                  value={settingsForm.name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-black text-xs uppercase tracking-widest mb-2">Author / Designer</label>
                <input
                  className="brutal-input"
                  value={settingsForm.author}
                  onChange={(e) => setSettingsForm({ ...settingsForm, author: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-black text-xs uppercase tracking-widest mb-2">Description</label>
                <textarea
                  className="brutal-input resize-none"
                  rows={3}
                  value={settingsForm.description}
                  onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t-3 border-black pt-6 mb-6">
              <div className="brutal-tag mb-6">Font Metrics</div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-black text-xs uppercase tracking-widest mb-2">UPM</label>
                  <input
                    type="number"
                    className="brutal-input"
                    value={settingsForm.upm}
                    onChange={(e) => setSettingsForm({ ...settingsForm, upm: e.target.value })}
                  />
                  <p className="text-xs text-gray-400 mt-1 font-mono">Units per em (100–4096)</p>
                </div>
                <div>
                  <label className="block font-black text-xs uppercase tracking-widest mb-2">Ascender</label>
                  <input
                    type="number"
                    className="brutal-input"
                    value={settingsForm.ascender}
                    onChange={(e) => setSettingsForm({ ...settingsForm, ascender: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-black text-xs uppercase tracking-widest mb-2">Descender</label>
                  <input
                    type="number"
                    className="brutal-input"
                    value={settingsForm.descender}
                    onChange={(e) => setSettingsForm({ ...settingsForm, descender: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={updateMutation.isPending}
              className="brutal-btn"
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Settings
            </button>

            {/* ── Side Bearings ── */}
            <div className="border-t-3 border-black pt-6 mt-8">
              <div className="brutal-tag mb-2">Side Bearings</div>
              <p className="text-xs text-gray-500 font-mono mb-6">
                Set the default left/right margin (in font units) applied to every glyph.
                Use <strong>Apply to All</strong> to reset all per-glyph overrides, or
                <strong> Auto</strong> to let AI suggest per-glyph values.
              </p>

              {/* Default preset row */}
              <div className="flex items-end gap-4 mb-4">
                <div>
                  <label className="block font-black text-xs uppercase tracking-widest mb-2">Default LSB</label>
                  <input
                    type="number"
                    min={0} max={2000}
                    className="brutal-input w-28"
                    value={sbForm.defaultLsb}
                    onChange={(e) => setSbForm({ ...sbForm, defaultLsb: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-black text-xs uppercase tracking-widest mb-2">Default RSB</label>
                  <input
                    type="number"
                    min={0} max={2000}
                    className="brutal-input w-28"
                    value={sbForm.defaultRsb}
                    onChange={(e) => setSbForm({ ...sbForm, defaultRsb: e.target.value })}
                  />
                </div>
                <button
                  className="brutal-btn text-sm"
                  disabled={setDefaultSbMutation.isPending}
                  onClick={() => setDefaultSbMutation.mutate({ id: projectId, defaultLsb: parseInt(sbForm.defaultLsb) || 0, defaultRsb: parseInt(sbForm.defaultRsb) || 0 })}
                >
                  {setDefaultSbMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlignJustify className="w-4 h-4" />}
                  Save Default
                </button>
                <button
                  className="brutal-btn-outline text-sm"
                  disabled={applyAllSbMutation.isPending}
                  onClick={() => applyAllSbMutation.mutate({ id: projectId, defaultLsb: parseInt(sbForm.defaultLsb) || 0, defaultRsb: parseInt(sbForm.defaultRsb) || 0 })}
                >
                  {applyAllSbMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Apply to All
                </button>
              </div>

              {/* Auto button */}
              <button
                className="brutal-btn text-sm"
                disabled={autoSbMutation.isPending || (glyphList?.length ?? 0) === 0}
                onClick={() => autoSbMutation.mutate({ projectId })}
              >
                {autoSbMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Auto Side Bearings (AI)
              </button>

              {/* Per-glyph table */}
              {(glyphList?.length ?? 0) > 0 && (
                <div className="mt-6">
                  <div className="font-black text-xs uppercase tracking-widest mb-3">Per-Glyph Overrides</div>
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
                          const lsbVal = local?.lsb ?? (g.lsb != null ? String(g.lsb) : "");
                          const rsbVal = local?.rsb ?? (g.rsb != null ? String(g.rsb) : "");
                          return (
                            <tr key={g.id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="px-3 py-2 font-black text-base">{g.char}</td>
                              <td className="px-3 py-2 text-gray-400">U+{g.unicode.toString(16).toUpperCase().padStart(4, "0")}</td>
                              <td className="px-3 py-2">
                                <input
                                  type="number" min={0} max={2000}
                                  className="brutal-input w-20 py-1 text-sm"
                                  placeholder={String(project?.defaultLsb ?? 50)}
                                  value={lsbVal}
                                  onChange={(e) => setGlyphSbForm(prev => ({ ...prev, [key]: { lsb: e.target.value, rsb: prev[key]?.rsb ?? rsbVal } }))}
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number" min={0} max={2000}
                                  className="brutal-input w-20 py-1 text-sm"
                                  placeholder={String(project?.defaultRsb ?? 50)}
                                  value={rsbVal}
                                  onChange={(e) => setGlyphSbForm(prev => ({ ...prev, [key]: { lsb: prev[key]?.lsb ?? lsbVal, rsb: e.target.value } }))}
                                />
                              </td>
                              <td className="px-3 py-2 flex gap-1">
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
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 font-mono">
                    Empty = use project default. Reset clears per-glyph override.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview tab */}
        {activeTab === "preview" && (
          <div className="p-8">
            <div className="brutal-tag mb-6">Live Preview</div>

            {/* No font generated yet */}
            {!fontUrl ? (
              <div className="border-3 border-black border-dashed p-20 text-center">
                <div className="text-5xl font-black text-gray-200 uppercase tracking-tighter mb-4">No Font Yet</div>
                <p className="text-gray-500 mb-6 font-mono text-sm">
                  Upload glyphs and generate a font to preview it here.
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => handleGenerate("ttf")}
                    disabled={!!generatingFormat || uploadedCount === 0}
                    className="brutal-btn"
                  >
                    {generatingFormat === "ttf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Generate TTF
                  </button>
                  <button
                    onClick={() => handleGenerate("otf")}
                    disabled={!!generatingFormat || uploadedCount === 0}
                    className="brutal-btn-outline"
                  >
                    {generatingFormat === "otf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Generate OTF
                  </button>
                </div>
                {uploadedCount === 0 && (
                  <p className="text-xs text-gray-400 mt-4 font-mono">
                    You need to upload at least one glyph first.
                  </p>
                )}
              </div>
            ) : previewFont.status === "loading" ? (
              /* Loading state */
              <div className="border-3 border-black p-20 text-center">
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" />
                <p className="font-mono text-sm text-gray-500">Loading font...</p>
              </div>
            ) : previewFont.status === "error" ? (
              /* Error state */
              <div className="border-3 border-black border-dashed p-16 text-center">
                <div className="text-3xl font-black text-red-400 uppercase tracking-tighter mb-3">Load Failed</div>
                <p className="font-mono text-xs text-gray-500 mb-6">{previewFont.error}</p>
                <button
                  onClick={() => { setFontUrl(null); setTimeout(() => setFontUrl(fontUrl), 50); }}
                  className="brutal-btn"
                >
                  <RefreshCw className="w-4 h-4" /> Retry
                </button>
              </div>
            ) : (
              /* Ready state */
              <>
                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border-3 border-black p-6 brutal-shadow">
                  <div>
                    <label className="block font-black text-xs uppercase tracking-widest mb-2">Preview Text</label>
                    <textarea
                      className="brutal-input resize-none font-mono"
                      rows={3}
                      value={previewText}
                      onChange={(e) => setPreviewText(e.target.value)}
                      placeholder="Type something..."
                    />
                  </div>
                  <div>
                    <label className="block font-black text-xs uppercase tracking-widest mb-2">
                      Font Size: {fontSize}px
                    </label>
                    <input
                      type="range"
                      min={12}
                      max={200}
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full accent-black mb-4"
                      style={{ height: "4px" }}
                    />
                    <div className="flex gap-2 flex-wrap">
                      {[16, 24, 36, 48, 72, 96, 128].map((s) => (
                        <button
                          key={s}
                          onClick={() => setFontSize(s)}
                          className={`brutal-btn-sm ${fontSize === s ? "bg-black text-white" : "bg-white text-black"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview display */}
                <div className="border-3 border-black p-8 brutal-shadow-lg min-h-40 bg-white overflow-auto mb-6">
                  <div
                    style={{
                      fontFamily: `'${previewFont.family}', sans-serif`,
                      fontSize: `${fontSize}px`,
                      lineHeight: 1.4,
                      wordBreak: "break-all",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {previewText || "Type something in the preview text box..."}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-4 flex-wrap">
                  {fontFiles?.map((f) => (
                    <a
                      key={f.id}
                      href={f.fileUrl}
                      download={`${project.name}.${f.format}`}
                      className="brutal-btn"
                    >
                      <Download className="w-4 h-4" />
                      Download {f.format.toUpperCase()}
                    </a>
                  ))}
                  <button
                    onClick={() => handleGenerate("ttf")}
                    disabled={!!generatingFormat}
                    className="brutal-btn-outline"
                  >
                    {generatingFormat === "ttf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Regenerate TTF
                  </button>
                </div>
              </>
            )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
