/**
 * i18n.js — Lightweight internationalization for SVG Font Maker
 */
const I18N = {
  current: 'ja',
  translations: {
    // ─── Landing page ───
    site_title: { ja: 'SVG Font Maker', en: 'SVG Font Maker' },
    site_subtitle: { ja: 'ブラウザだけでオリジナルフォントを作成', en: 'Create original fonts in your browser' },
    hero_title: { ja: 'あなただけのフォントを作ろう', en: 'Create Your Own Font' },
    hero_desc: { ja: 'SVG Font Makerは、ブラウザ上で動作するフォント作成ツールです。\nSVGファイルのインポート、ノード編集、カーニング、リガチャなど\nプロ仕様の機能を備えながら、誰でも簡単に使えます。\nひらがな・カタカナにも完全対応。OTF形式でエクスポートできます。',
      en: 'SVG Font Maker is a browser-based font creation tool.\nImport SVGs, edit nodes, adjust kerning, add ligatures and more.\nProfessional features with an easy-to-use interface.\nFull Japanese hiragana/katakana support. Export as OTF.' },
    hero_btn: { ja: 'プロジェクトを始める →', en: 'Start a Project →' },
    feat_svg: { ja: 'SVGインポート', en: 'SVG Import' },
    feat_svg_d: { ja: 'SVGファイルをドラッグ&ドロップで簡単にインポート。一括取込やテンプレートにも対応しています。', en: 'Easily import SVG files by drag & drop. Supports batch import and templates.' },
    feat_node: { ja: 'ノード編集 & ペンツール', en: 'Node Editing & Pen Tool' },
    feat_node_d: { ja: 'ベジェ曲線のノードを直接編集。ペンツールで新しいパスをゼロから描くこともできます。', en: 'Edit bezier curve nodes directly. Draw new paths from scratch with the pen tool.' },
    feat_jp: { ja: '日本語対応', en: 'Japanese Support' },
    feat_jp_d: { ja: 'ひらがな・カタカナ（濁音・小文字含む）に完全対応。お手本フォントを参照しながら作成できます。', en: 'Full support for hiragana and katakana (including voiced/small). Reference fonts available while designing.' },
    feat_kern: { ja: 'カーニング & ベアリング', en: 'Kerning & Bearings' },
    feat_kern_d: { ja: '手動・自動カーニング、サイドベアリングの個別/一括/自動調整。しきい値スライダーでリアルタイムプレビュー。', en: 'Manual and auto kerning, individual/batch/auto side bearing adjustment with real-time threshold slider.' },
    feat_tpl: { ja: 'テンプレート', en: 'Templates' },
    feat_tpl_d: { ja: 'カリグラフィー用テンプレートをダウンロードして手書き文字を描画。再アップロードで自動反映。', en: 'Download calligraphy templates, draw characters by hand, and re-upload for automatic import.' },
    feat_otf: { ja: 'OTF エクスポート', en: 'OTF Export' },
    feat_otf_d: { ja: '完成したフォントをOTF形式でダウンロード。メタデータやライセンス情報も設定可能。', en: 'Download your finished font as OTF. Set metadata, license info, and more.' },
    how_title: { ja: '使い方', en: 'How to Use' },
    how1_t: { ja: 'プロジェクトを作成', en: 'Create a Project' },
    how1_d: { ja: '「プロジェクトを始める」ボタンからプロジェクトを新規作成します。最大30個まで保存できます。', en: 'Click "Start a Project" to create a new project. Up to 30 projects can be saved.' },
    how2_t: { ja: '文字をデザイン', en: 'Design Characters' },
    how2_d: { ja: 'SVGファイルをインポートするか、ペンツールで直接描画。テンプレートを使った手書きも可能です。', en: 'Import SVG files or draw directly with the pen tool. Handwriting via templates is also supported.' },
    how3_t: { ja: '調整 & プレビュー', en: 'Adjust & Preview' },
    how3_d: { ja: 'ノード編集、カーニング、ベアリングを調整。ウォーターフォールプレビューで複数サイズを確認。', en: 'Edit nodes, adjust kerning and bearings. Check multiple sizes with waterfall preview.' },
    how4_t: { ja: 'フォントをエクスポート', en: 'Export Your Font' },
    how4_d: { ja: 'OTF形式でダウンロード。PCやスマホにインストールして使えます。', en: 'Download as OTF format. Install on PC or smartphone to use.' },
    terms_link: { ja: '利用規約', en: 'Terms of Service' },

    // ─── Projects page ───
    new_project: { ja: '＋ 新規プロジェクト', en: '+ New Project' },
    modal_new: { ja: '新規プロジェクト', en: 'New Project' },
    modal_edit: { ja: 'プロジェクト編集', en: 'Edit Project' },
    modal_create: { ja: '作成', en: 'Create' },
    modal_save: { ja: '保存', en: 'Save' },
    p_fontname: { ja: 'フォント名', en: 'Font Name' },
    p_author: { ja: '作者', en: 'Author' },
    p_style: { ja: 'スタイル', en: 'Style' },
    p_empty: { ja: 'プロジェクトがありません', en: 'No projects yet' },
    p_empty2: { ja: '「新規プロジェクト」で始めましょう', en: 'Click "New Project" to get started' },
    p_delete_confirm: { ja: 'このプロジェクトを削除しますか？', en: 'Delete this project?' },

    // ─── Terms page ───
    terms_title: { ja: '利用規約', en: 'Terms of Service' },
    terms_date: { ja: '最終更新日: 2026年4月1日', en: 'Last updated: April 1, 2026' },
    t_s1_title: { ja: '1. はじめに', en: '1. Introduction' },
    t_s1_body: { ja: 'SVG Font Maker（以下「本ツール」）は、ブラウザ上でオリジナルフォントを作成するための個人制作ツールです。本ツールのご利用にあたっては、以下の利用規約にご同意いただいたものとみなします。', en: 'SVG Font Maker ("the Tool") is a personal project for creating original fonts in the browser. By using the Tool, you agree to the following terms.' },
    t_s2_title: { ja: '2. 利用条件', en: '2. Usage' },
    t_s2_body: { ja: '本ツールは無料でご利用いただけます。アカウント登録は不要で、ブラウザのみで動作します。インターネット接続があれば、どなたでもご利用可能です。', en: 'The Tool is free to use. No account registration is required. It runs entirely in your browser and is available to anyone with an internet connection.' },
    t_s3_title: { ja: '3. 著作権・商用利用', en: '3. Copyright & Commercial Use' },
    t_s3_body: { ja: '本ツールを使用して作成されたフォントの著作権は、作成者であるユーザー自身に帰属します。作成したフォントの商用利用は自由に行っていただけます。販売、配布、Webフォントとしての利用など、用途に制限はありません。', en: 'Copyright of fonts created with the Tool belongs to the user who created them. Commercial use of created fonts is freely permitted, including selling, distributing, and using as web fonts.' },
    t_s4_title: { ja: '4. AI学習について', en: '4. AI Training' },
    t_s4_body: { ja: '本ツールは、ユーザーが作成したフォントデータやデザインをAI（人工知能）の学習に利用することはありません。ユーザーのデータはブラウザ内にのみ保存され、外部サーバーに送信されることはありません。', en: 'The Tool does NOT use any user-created font data or designs for AI (artificial intelligence) training. User data is stored only in the browser and is never sent to external servers.' },
    t_s5_title: { ja: '5. 免責事項', en: '5. Disclaimer' },
    t_s5_body: { ja: '本ツールは個人が制作したプロジェクトであり、商用ソフトウェアとしての保証はありません。以下の点についてご了承ください。', en: 'The Tool is a personal project and comes with no warranty as commercial software. Please note the following:' },
    t_s5_li1: { ja: '本ツールの使用により生じたいかなる損害についても、制作者は責任を負いません', en: 'The creator is not responsible for any damages arising from use of the Tool' },
    t_s5_li2: { ja: 'フォントの互換性や品質について保証するものではありません', en: 'No guarantee is made regarding font compatibility or quality' },
    t_s5_li3: { ja: 'データの消失や破損について責任を負いません', en: 'No responsibility for data loss or corruption' },
    t_s5_li4: { ja: '予告なくサービスを変更・終了する場合があります', en: 'The service may be changed or discontinued without notice' },
    t_s6_title: { ja: '6. データの保存', en: '6. Data Storage' },
    t_s6_body: { ja: '本ツールのプロジェクトデータは、お使いのブラウザのlocalStorageに保存されます。サーバーへのデータ収集・送信は行いません。ブラウザのキャッシュをクリアするとデータが失われる可能性がありますので、定期的にプロジェクトファイルのバックアップをお勧めします。', en: 'Project data is saved in your browser\'s localStorage. No data is collected or sent to servers. Clearing browser cache may result in data loss, so regular backup of project files is recommended.' },
    t_s7_title: { ja: '7. 禁止事項', en: '7. Prohibited Actions' },
    t_s7_li1: { ja: '本ツール自体のリバースエンジニアリングや再配布', en: 'Reverse engineering or redistributing the Tool itself' },
    t_s7_li2: { ja: '違法な目的での使用', en: 'Use for illegal purposes' },
    t_s7_li3: { ja: '他者の著作権を侵害するフォントの作成', en: 'Creating fonts that infringe on others\' copyrights' },
    t_s8_title: { ja: '8. 規約の変更', en: '8. Changes to Terms' },
    t_s8_body: { ja: '本利用規約は、必要に応じて予告なく変更される場合があります。変更後の規約は本ページに掲載された時点で効力を生じます。', en: 'These terms may be updated without prior notice. Updated terms take effect when published on this page.' },
    t_s9_title: { ja: '9. お問い合わせ', en: '9. Contact' },
    t_s9_body: { ja: '本ツールに関するご質問やお問い合わせは、GitHubリポジトリのIssuesよりお願いいたします。', en: 'For questions about the Tool, please use the GitHub repository Issues.' },

    // ─── Font Editor UI ───
    ed_import: { ja: '取込', en: 'Import' },
    ed_template: { ja: 'テンプレ', en: 'Template' },
    ed_copy: { ja: 'コピー', en: 'Copy' },
    ed_paste: { ja: '貼付', en: 'Paste' },
    ed_delete: { ja: '削除', en: 'Delete' },
    ed_save: { ja: '保存', en: 'Save' },
    ed_open: { ja: '開く', en: 'Open' },
    ed_export: { ja: 'Export OTF', en: 'Export OTF' },
    ed_settings: { ja: '設定', en: 'Settings' },
    ed_editor: { ja: 'エディタ', en: 'Editor' },
    ed_preview: { ja: 'プレビュー', en: 'Preview' },
    ed_tab_transform: { ja: '変形', en: 'Transform' },
    ed_tab_nodes: { ja: 'ノード', en: 'Nodes' },
    ed_tab_bearing: { ja: 'ベアリング', en: 'Bearing' },
    ed_tab_kerning: { ja: 'カーニング', en: 'Kerning' },
    ed_tab_path: { ja: 'パス', en: 'Path' },
    ed_tab_view: { ja: '表示', en: 'View' },
    ed_tab_liga: { ja: 'リガチャ', en: 'Ligature' },
    ed_glyph_list: { ja: 'グリフ一覧', en: 'Glyph List' },
    ed_import_single: { ja: '1文字ずつ取り込み', en: 'Import Single Glyph' },
    ed_import_single_d: { ja: '現在選択中の文字スロットにSVGをインポートします。', en: 'Import an SVG into the currently selected character slot.' },
    ed_import_batch: { ja: '一括取り込み', en: 'Batch Import' },
    ed_import_batch_d: { ja: 'ファイル名からUnicodeを判定して自動で割り当てます。\n例: A.svg, U+0041.svg', en: 'Automatically assign characters based on filename.\nExample: A.svg, U+0041.svg' },
    ed_import_template: { ja: 'テンプレートから取り込み', en: 'Import from Template' },
    ed_import_template_d: { ja: 'テンプレートに描いた文字を自動検出して一括インポートします。', en: 'Auto-detect characters drawn on template and import.' },
    ed_import_font: { ja: 'OTF / TTF / WOFF から取り込み', en: 'Import from OTF / TTF / WOFF' },
    ed_import_font_d: { ja: '既存のフォントファイルからグリフをインポートします。', en: 'Import glyphs from an existing font file.' },
    ed_tpl_title: { ja: 'テンプレートをダウンロード', en: 'Download Template' },
    ed_tpl_which: { ja: 'どちらのテンプレートをダウンロードしますか？', en: 'Which template would you like to download?' },
    ed_tpl_ref: { ja: 'お手本付き', en: 'With Reference' },
    ed_tpl_ref_d: { ja: '薄い参照文字付き。なぞって描けます。\n※テキストをパスに変換しないでください', en: 'With light reference characters. Trace to draw.\n*Do not convert text to paths.' },
    ed_tpl_noref: { ja: '枠のみ', en: 'Grid Only' },
    ed_tpl_noref_d: { ja: 'Unicode・文字ラベルのみ。自由に描けます。', en: 'Unicode labels only. Draw freely.' },
  },

  init() {
    this.current = localStorage.getItem('svgfm_lang') || 'ja';
    this.apply();
  },

  toggle() {
    this.current = this.current === 'ja' ? 'en' : 'ja';
    localStorage.setItem('svgfm_lang', this.current);
    this.apply();
  },

  t(key) {
    const entry = this.translations[key];
    if (!entry) return key;
    return entry[this.current] || entry['ja'] || key;
  },

  apply() {
    // Update all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = this.t(key);
      if (el.tagName === 'INPUT' && el.type !== 'submit') {
        el.placeholder = text;
      } else {
        el.textContent = text;
      }
    });
    // Update lang toggle buttons
    document.querySelectorAll('.lang-toggle').forEach(btn => {
      btn.textContent = this.current === 'ja' ? 'EN' : 'JA';
    });
    // Update html lang
    document.documentElement.lang = this.current === 'ja' ? 'ja' : 'en';
  }
};

document.addEventListener('DOMContentLoaded', () => I18N.init());
