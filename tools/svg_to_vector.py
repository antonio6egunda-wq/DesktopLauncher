#!/usr/bin/env python3
"""Converte os SVG de icons-src/svg em VectorDrawables do Android.

Uso (a partir da raiz do projeto):
    python3 tools/svg_to_vector.py

Resultado:
    app/src/main/res/drawable/ic_<nome>.xml   (um por cada SVG)
    app/src/main/res/drawable/ic_launcher.xml (ícone da aplicação, gerado a partir de category.svg)

Os ficheiros gerados têm a marca "Gerado por tools/svg_to_vector.py".
Edita os SVG em icons-src/ e volta a correr o script, nunca os XML à mão.
Os ícones saem brancos (COLOR) para ficarem legíveis no fundo escuro.
"""
import pathlib
import re
import sys
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "icons-src" / "svg"
DST = ROOT / "app" / "src" / "main" / "res" / "drawable"
COLOR = "#FFFFFFFF"
MARK = "Gerado por tools/svg_to_vector.py"
SVG_NS = "{http://www.w3.org/2000/svg}"
ANDROID_NS = "{http://schemas.android.com/apk/res/android}"
NAME_OK = re.compile(r"^ic_[a-z0-9_]+$")


def fail(msg):
    sys.exit(f"erro: {msg}")


def circle_path(cx, cy, r):
    return f"M{cx - r},{cy} a{r},{r} 0 1,0 {2 * r},0 a{r},{r} 0 1,0 {-2 * r},0 Z"


def rect_path(x, y, w, h):
    return f"M{x},{y} h{w} v{h} h{-w} Z"


def polygon_path(points):
    nums = points.replace(",", " ").split()
    pairs = list(zip(nums[0::2], nums[1::2]))
    return "M" + " L".join(f"{x},{y}" for x, y in pairs) + " Z"


def svg_to_paths(svg_file):
    root = ET.parse(svg_file).getroot()
    viewbox = root.get("viewBox")
    if not viewbox:
        fail(f"{svg_file.name}: falta viewBox")
    _, _, vw, vh = viewbox.split()
    paths = []
    for el in root.iter():
        tag = el.tag.replace(SVG_NS, "")
        if el.get("transform"):
            fail(f"{svg_file.name}: transform não suportado")
        if tag == "path" and el.get("d") and el.get("fill") != "none":
            paths.append(" ".join(el.get("d").split()))
        elif tag == "circle":
            paths.append(circle_path(float(el.get("cx", 0)), float(el.get("cy", 0)), float(el.get("r", 0))))
        elif tag == "rect":
            paths.append(rect_path(float(el.get("x", 0)), float(el.get("y", 0)),
                                   float(el.get("width", 0)), float(el.get("height", 0))))
        elif tag == "polygon":
            paths.append(polygon_path(el.get("points", "")))
    if not paths:
        fail(f"{svg_file.name}: nenhum desenho encontrado")
    return vw, vh, paths


def write_xml(name, text):
    path = DST / f"{name}.xml"
    path.write_text(text, encoding="utf-8")
    ET.parse(path)  # valida que o XML está bem formado
    return path


def build_icon(svg_file):
    name = "ic_" + svg_file.stem
    if not NAME_OK.match(name):
        fail(f"nome inválido para recurso Android: {svg_file.name}")
    vw, vh, paths = svg_to_paths(svg_file)
    lines = [
        '<?xml version="1.0" encoding="utf-8"?>',
        f"<!-- {MARK} a partir de {svg_file.name}. -->",
        '<vector xmlns:android="http://schemas.android.com/apk/res/android"',
        '    android:width="24dp"',
        '    android:height="24dp"',
        f'    android:viewportWidth="{vw}"',
        f'    android:viewportHeight="{vh}">',
    ]
    for d in paths:
        lines.append(f'    <path android:fillColor="{COLOR}" android:pathData="{d}"/>')
    lines.append("</vector>")
    write_xml(name, "\n".join(lines) + "\n")
    return name


def build_launcher():
    """Ícone da aplicação: fundo azul arredondado e o glifo de category.svg centrado."""
    category = DST / "ic_category.xml"
    glyphs = [p.get(ANDROID_NS + "pathData") for p in ET.parse(category).getroot().iter("path")]
    body = "\n".join(
        f'        <path android:fillColor="{COLOR}" android:pathData="{d}"/>' for d in glyphs
    )
    text = f"""<?xml version="1.0" encoding="utf-8"?>
<!-- {MARK} (ícone da aplicação). -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path android:fillColor="#1687E8"
        android:pathData="M24,0h60a24,24 0 0 1 24,24v60a24,24 0 0 1 -24,24h-60a24,24 0 0 1 -24,-24v-60a24,24 0 0 1 24,-24z"/>
    <group android:translateX="24" android:translateY="24" android:scaleX="1.25" android:scaleY="1.25">
{body}
    </group>
</vector>
"""
    write_xml("ic_launcher", text)


def main():
    DST.mkdir(parents=True, exist_ok=True)
    for old in DST.glob("ic_*.xml"):
        if MARK in old.read_text(encoding="utf-8"):
            old.unlink()
    names = [build_icon(svg) for svg in sorted(SRC.glob("*.svg"))]
    build_launcher()
    print(f"{len(names)} ícones convertidos + ic_launcher")


if __name__ == "__main__":
    main()
