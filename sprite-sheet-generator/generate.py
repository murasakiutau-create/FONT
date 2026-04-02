#!/usr/bin/env python3
"""
RPGツクール スプライトシート生成ツール
1枚の正面画像から3列×4行（12フレーム）のスプライトシートを生成します。

行の順序（RPGツクール標準）:
  行1: 正面（下向き）  — 歩行左, 立ち, 歩行右
  行2: 左向き          — 歩行左, 立ち, 歩行右
  行3: 右向き          — 歩行左, 立ち, 歩行右
  行4: 後ろ向き（上向き）— 歩行左, 立ち, 歩行右

使い方:
  python generate.py input.png
  python generate.py input.png --output spritesheet.png --size 48
"""

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageFilter, ImageChops


def load_and_resize(path: str, cell_size: int) -> Image.Image:
    """入力画像を読み込み、セルサイズにリサイズする。"""
    img = Image.open(path).convert("RGBA")
    img = img.resize((cell_size, cell_size), Image.LANCZOS)
    return img


def apply_bounce(img: Image.Image, dy: int) -> Image.Image:
    """画像を上下にdyピクセルずらす（歩行バウンス）。"""
    if dy == 0:
        return img.copy()
    w, h = img.size
    result = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    if dy > 0:
        result.paste(img.crop((0, 0, w, h - dy)), (0, dy))
    else:
        result.paste(img.crop((0, -dy, w, h)), (0, 0))
    return result


def apply_leg_shear(img: Image.Image, direction: int, cell_size: int) -> Image.Image:
    """下半分にシアー変形を適用して歩行フレームを作る。
    direction: -1=左足前, +1=右足前
    """
    w, h = img.size
    mid = h // 2
    upper = img.crop((0, 0, w, mid))
    lower = img.crop((0, mid, w, h))

    shear_px = max(1, cell_size // 16) * direction
    lower_h = h - mid

    sheared_lower = Image.new("RGBA", (w, lower_h), (0, 0, 0, 0))
    for y in range(lower_h):
        progress = y / max(lower_h - 1, 1)
        offset = int(shear_px * progress)
        row = lower.crop((0, y, w, y + 1))
        paste_x = offset
        if 0 <= paste_x < w:
            sheared_lower.paste(row, (paste_x, y))

    result = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    result.paste(upper, (0, 0))
    result.paste(sheared_lower, (0, mid), sheared_lower)
    return result


def make_walk_frames(standing: Image.Image, cell_size: int) -> tuple:
    """立ちフレームから歩行左・歩行右フレームを生成する。"""
    bounce = max(1, cell_size // 24)

    walk_left = apply_leg_shear(standing, -1, cell_size)
    walk_left = apply_bounce(walk_left, -bounce)

    walk_right = apply_leg_shear(standing, 1, cell_size)
    walk_right = apply_bounce(walk_right, -bounce)

    return walk_left, walk_right


def make_side_view(front: Image.Image, cell_size: int) -> Image.Image:
    """正面画像から横向き（左向き）画像を生成する。"""
    w, h = front.size
    compressed_w = int(w * 0.75)
    compressed = front.resize((compressed_w, h), Image.LANCZOS)

    result = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    offset_x = (w - compressed_w) // 2 + max(1, cell_size // 24)
    offset_x = min(offset_x, w - compressed_w)
    result.paste(compressed, (offset_x, 0), compressed)
    return result


def get_dominant_colors(img: Image.Image) -> dict:
    """画像の上部（頭）と中部（胴体）の支配的な色を取得する。"""
    w, h = img.size
    pixels = img.load()

    head_colors = []
    body_colors = []

    head_end = h // 3
    body_start = h // 3
    body_end = 2 * h // 3

    for y in range(0, head_end):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a > 128:
                head_colors.append((r, g, b))

    for y in range(body_start, body_end):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a > 128:
                body_colors.append((r, g, b))

    def average_color(colors):
        if not colors:
            return (128, 128, 128)
        r = sum(c[0] for c in colors) // len(colors)
        g = sum(c[1] for c in colors) // len(colors)
        b = sum(c[2] for c in colors) // len(colors)
        return (r, g, b)

    return {
        "head": average_color(head_colors),
        "body": average_color(body_colors),
    }


def make_back_view(front: Image.Image, cell_size: int) -> Image.Image:
    """正面画像から後ろ向き画像を生成する。
    - シルエットを保持
    - 顔のディテールをぼかして除去
    - 頭部と胴体の色で塗りつぶし
    """
    w, h = front.size
    pixels = front.load()
    colors = get_dominant_colors(front)

    alpha_mask = front.split()[3]

    head_end = h // 3
    body_end = 2 * h // 3

    back = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    back_pixels = back.load()

    for y in range(h):
        for x in range(w):
            _, _, _, a = pixels[x, y]
            if a > 64:
                if y < head_end:
                    base_r, base_g, base_b = colors["head"]
                    dark = max(0, int((1 - 0.15) * 255))
                    r = min(255, int(base_r * dark / 255))
                    g = min(255, int(base_g * dark / 255))
                    b = min(255, int(base_b * dark / 255))
                    back_pixels[x, y] = (r, g, b, a)
                elif y < body_end:
                    base_r, base_g, base_b = colors["body"]
                    dark = max(0, int((1 - 0.1) * 255))
                    r = min(255, int(base_r * dark / 255))
                    g = min(255, int(base_g * dark / 255))
                    b = min(255, int(base_b * dark / 255))
                    back_pixels[x, y] = (r, g, b, a)
                else:
                    r_orig, g_orig, b_orig, _ = pixels[x, y]
                    dark = max(0, int((1 - 0.1) * 255))
                    r = min(255, int(r_orig * dark / 255))
                    g = min(255, int(g_orig * dark / 255))
                    b = min(255, int(b_orig * dark / 255))
                    back_pixels[x, y] = (r, g, b, a)

    blur_region = back.crop((0, 0, w, head_end))
    blur_region = blur_region.filter(ImageFilter.GaussianBlur(radius=max(1, cell_size // 24)))
    back.paste(blur_region, (0, 0))

    back.putalpha(alpha_mask)

    return back


def generate_sprite_sheet(input_path: str, output_path: str, cell_size: int):
    """メイン処理: スプライトシートを生成する。"""
    front_stand = load_and_resize(input_path, cell_size)

    # --- 正面（下向き） ---
    front_walk_l, front_walk_r = make_walk_frames(front_stand, cell_size)

    # --- 左向き ---
    left_stand = make_side_view(front_stand, cell_size)
    left_walk_l, left_walk_r = make_walk_frames(left_stand, cell_size)

    # --- 右向き（左向きの水平反転） ---
    right_stand = left_stand.transpose(Image.FLIP_LEFT_RIGHT)
    right_walk_l = left_walk_r.transpose(Image.FLIP_LEFT_RIGHT)
    right_walk_r = left_walk_l.transpose(Image.FLIP_LEFT_RIGHT)

    # --- 後ろ向き ---
    back_stand = make_back_view(front_stand, cell_size)
    back_walk_l, back_walk_r = make_walk_frames(back_stand, cell_size)

    # スプライトシート組み立て (3列 × 4行)
    sheet_w = cell_size * 3
    sheet_h = cell_size * 4
    sheet = Image.new("RGBA", (sheet_w, sheet_h), (0, 0, 0, 0))

    rows = [
        (front_walk_l, front_stand, front_walk_r),   # 行1: 正面
        (left_walk_l, left_stand, left_walk_r),       # 行2: 左向き
        (right_walk_l, right_stand, right_walk_r),    # 行3: 右向き
        (back_walk_l, back_stand, back_walk_r),       # 行4: 後ろ向き
    ]

    for row_idx, (frame_l, frame_stand, frame_r) in enumerate(rows):
        y = row_idx * cell_size
        sheet.paste(frame_l, (0, y), frame_l)
        sheet.paste(frame_stand, (cell_size, y), frame_stand)
        sheet.paste(frame_r, (cell_size * 2, y), frame_r)

    sheet.save(output_path)
    print(f"スプライトシート生成完了: {output_path}")
    print(f"  サイズ: {sheet_w}x{sheet_h}px ({cell_size}x{cell_size} x 3列x4行)")


def main():
    parser = argparse.ArgumentParser(
        description="1枚の正面画像からRPGツクール用スプライトシートを生成"
    )
    parser.add_argument("input", help="入力画像ファイルのパス")
    parser.add_argument(
        "--output", "-o",
        default=None,
        help="出力ファイルのパス（デフォルト: <入力ファイル名>_spritesheet.png）"
    )
    parser.add_argument(
        "--size", "-s",
        type=int,
        default=48,
        choices=[32, 48, 64, 96],
        help="1セルのサイズ（ピクセル、デフォルト: 48）"
    )
    args = parser.parse_args()

    if not Path(args.input).exists():
        print(f"エラー: 入力ファイルが見つかりません: {args.input}", file=sys.stderr)
        sys.exit(1)

    if args.output is None:
        stem = Path(args.input).stem
        args.output = f"{stem}_spritesheet.png"

    generate_sprite_sheet(args.input, args.output, args.size)


if __name__ == "__main__":
    main()
