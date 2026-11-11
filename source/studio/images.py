"""Build resized WebP and JPEG derivatives. Long edge never exceeds 1600px."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "source" / "public"
OUT = ROOT / "publish" / "media"
WIDTHS = (320, 640, 960, 1280, 1600)


def fit(image, width):
    w, h = image.size
    if w <= width:
        return image
    height = max(1, round(h * (width / w)))
    return image.resize((width, height), Image.Resampling.LANCZOS)


def emit(src, stem):
    image = Image.open(src).convert("RGB")
    w, h = image.size
    long_edge = max(w, h)
    if long_edge > 1600:
        scale = 1600 / long_edge
        image = image.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.Resampling.LANCZOS)
        w, h = image.size
    folder = OUT / Path(stem).parent
    folder.mkdir(parents=True, exist_ok=True)
    targets = [width for width in WIDTHS if width < w]
    targets.append(w)
    made = []
    for width in targets:
        frame = image if width == w else fit(image, width)
        actual = frame.size[0]
        base = OUT / f"{stem}-{actual}"
        frame.save(base.with_suffix(".webp"), "WEBP", quality=62, method=6)
        frame.save(base.with_suffix(".jpg"), "JPEG", quality=76, optimize=True)
        made.append(actual)
    return {"w": w, "h": h, "widths": made}


def main():
    if OUT.exists():
        for path in OUT.rglob("*"):
            if path.is_file():
                path.unlink()
    manifest = {}
    for folder in ("shop", "tattoo"):
        for src in sorted((SRC / folder).glob("*.jpg")):
            stem = f"{folder}/{src.stem}"
            manifest[stem] = emit(src, stem)
    logo = SRC / "brand" / "logo.jpg"
    manifest["brand/logo"] = emit(logo, "brand/logo")
    icon = Image.open(logo).convert("RGBA")
    bbox = icon.getbbox()
    if bbox:
        icon = icon.crop(bbox)

    def square(size):
        tile = icon.copy()
        tile.thumbnail((size, size), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (size, size), (255, 255, 255, 0))
        canvas.paste(tile, ((size - tile.width) // 2, (size - tile.height) // 2), tile)
        return canvas

    square(32).save(OUT / "favicon-32.png")
    square(180).save(OUT / "apple-touch-icon.png")
    og = Image.new("RGB", (1200, 630), "white")
    mark = icon.convert("RGB")
    mark.thumbnail((420, 420), Image.Resampling.LANCZOS)
    og.paste(mark, ((1200 - mark.width) // 2, (630 - mark.height) // 2))
    og.save(OUT / "og.jpg", "JPEG", quality=80, optimize=True)
    (OUT / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
    tattoo = list((OUT / "tattoo").glob("*-640.webp")) or list((OUT / "tattoo").glob("*-320.webp"))
    total = sum(p.stat().st_size for p in (OUT / "tattoo").glob("*-640.webp"))
    print(f"images {len(manifest)} tattoo-640-webp {total}")


if __name__ == "__main__":
    main()
