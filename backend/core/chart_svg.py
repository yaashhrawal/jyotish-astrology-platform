"""
SVG chart wheel generator (North Indian + South Indian style).
Returns inline SVG strings for embedding in HTML/PDF templates.
"""
from typing import Dict, List

SIGN_ABBR = ["Ar","Ta","Ge","Cn","Le","Vi","Li","Sc","Sg","Cp","Aq","Pi"]
PLANET_ABBR = {
    "Sun": "Su", "Moon": "Mo", "Mars": "Ma", "Mercury": "Me", "Jupiter": "Ju",
    "Venus": "Ve", "Saturn": "Sa", "Rahu": "Ra", "Ketu": "Ke",
}


def north_indian_svg(planets: dict, asc_sign_index: int, size: int = 320,
                     primary: str = "#7C2D12") -> str:
    """North Indian diamond chart. House 1 = top diamond. Houses go counter-clockwise.
    asc_sign_index = ascendant zodiac index (0=Aries..11=Pisces).
    """
    s = size
    h = s / 2
    # 12 house regions in north-indian style. Coords for label/planet placement.
    # Houses 1,4,7,10 are diamonds at center cardinal points.
    # Houses 2,3,5,6,8,9,11,12 are corner triangles.
    # Order around the chart (starting from house 1 at top, going counter-clockwise):
    house_centers = [
        (h, h*0.50),     # H1 top diamond
        (h*0.50, h*0.30),# H2 top-left triangle
        (h*0.30, h*0.50),# H3 left triangle
        (h*0.50, h),     # H4 left diamond
        (h*0.30, h*1.50),# H5
        (h*0.50, h*1.70),# H6
        (h, h*1.50),     # H7 bottom diamond
        (h*1.50, h*1.70),# H8
        (h*1.70, h*1.50),# H9
        (h*1.50, h),     # H10 right diamond
        (h*1.70, h*0.50),# H11
        (h*1.50, h*0.30),# H12
    ]

    # Build planet → house map (houses 1..12)
    house_planets: Dict[int, List[str]] = {i: [] for i in range(1, 13)}
    for pname, pdata in planets.items():
        sign_idx = pdata.get("sign_index", 0)
        house = ((sign_idx - asc_sign_index) % 12) + 1
        house_planets[house].append(PLANET_ABBR.get(pname, pname[:2]))

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {s} {s}" width="{s}" height="{s}">',
        f'<rect x="1" y="1" width="{s-2}" height="{s-2}" fill="#fffbeb" stroke="{primary}" stroke-width="2"/>',
        # Outer diagonals (X)
        f'<line x1="0" y1="0" x2="{s}" y2="{s}" stroke="{primary}" stroke-width="1.2"/>',
        f'<line x1="{s}" y1="0" x2="0" y2="{s}" stroke="{primary}" stroke-width="1.2"/>',
        # Inner diamond (rotated square through midpoints)
        f'<polygon points="{h},0 {s},{h} {h},{s} 0,{h}" fill="none" stroke="{primary}" stroke-width="1.5"/>',
    ]

    for i in range(12):
        house = i + 1
        cx, cy = house_centers[i]
        sign_idx = (asc_sign_index + i) % 12
        # Sign number (1..12 in small)
        parts.append(f'<text x="{cx}" y="{cy - 14}" font-family="serif" font-size="9" fill="#92400E" text-anchor="middle">{sign_idx + 1}</text>')
        # House number badge
        parts.append(f'<text x="{cx}" y="{cy + 4}" font-family="serif" font-size="11" font-weight="bold" fill="{primary}" text-anchor="middle">{house}</text>')
        # Planets
        ps = house_planets[house]
        if ps:
            parts.append(f'<text x="{cx}" y="{cy + 18}" font-family="serif" font-size="9" font-weight="600" fill="#1f2937" text-anchor="middle">{" ".join(ps)}</text>')

    # Lagna marker on house 1
    parts.append(f'<text x="{house_centers[0][0]}" y="{house_centers[0][1] - 26}" font-family="serif" font-size="9" fill="{primary}" text-anchor="middle" font-weight="bold">Lagna</text>')

    parts.append('</svg>')
    return "".join(parts)


def south_indian_svg(planets: dict, asc_sign_index: int, size: int = 320,
                     primary: str = "#7C2D12") -> str:
    """South Indian fixed-grid chart (Pisces top-left, clockwise).
    Sign positions are fixed; ascendant marked with arrow."""
    s = size
    cell = s / 4
    # Sign → grid position (col, row) in 4x4 with center 2x2 empty
    # Standard: Pi(0,0) Ar(1,0) Ta(2,0) Ge(3,0)
    #           Aq(0,1)               Cn(3,1)
    #           Cp(0,2)               Le(3,2)
    #           Sg(0,3) Sc(1,3) Li(2,3) Vi(3,3)
    SIGN_POS = {
        11: (0, 0), 0: (1, 0), 1: (2, 0), 2: (3, 0),
        10: (0, 1),                       3: (3, 1),
        9:  (0, 2),                       4: (3, 2),
        8:  (0, 3), 7: (1, 3), 6: (2, 3), 5: (3, 3),
    }
    house_planets: Dict[int, List[str]] = {i: [] for i in range(0, 12)}
    for pname, pdata in planets.items():
        sign_idx = pdata.get("sign_index", 0)
        house_planets[sign_idx].append(PLANET_ABBR.get(pname, pname[:2]))

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {s} {s}" width="{s}" height="{s}">',
        f'<rect width="{s}" height="{s}" fill="#fffbeb" stroke="{primary}" stroke-width="2"/>',
    ]
    # Grid lines (only outer cells used)
    for i in range(1, 4):
        parts.append(f'<line x1="{i*cell}" y1="0" x2="{i*cell}" y2="{s}" stroke="{primary}" stroke-width="0.8"/>')
        parts.append(f'<line x1="0" y1="{i*cell}" x2="{s}" y2="{i*cell}" stroke="{primary}" stroke-width="0.8"/>')
    # Mask center 2x2
    parts.append(f'<rect x="{cell}" y="{cell}" width="{cell*2}" height="{cell*2}" fill="#fffbeb" stroke="none"/>')

    for sign_idx, (col, row) in SIGN_POS.items():
        x = col * cell
        y = row * cell
        is_asc = sign_idx == asc_sign_index
        bg = "#fef3c7" if is_asc else "transparent"
        parts.append(f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" fill="{bg}"/>')
        parts.append(f'<text x="{x+5}" y="{y+12}" font-family="serif" font-size="9" fill="#92400E">{SIGN_ABBR[sign_idx]}</text>')
        if is_asc:
            parts.append(f'<text x="{x+cell-5}" y="{y+12}" font-family="serif" font-size="9" font-weight="bold" fill="{primary}" text-anchor="end">Asc</text>')
        ps = house_planets[sign_idx]
        if ps:
            for i, p in enumerate(ps[:6]):
                parts.append(f'<text x="{x+cell/2}" y="{y+24+i*11}" font-family="serif" font-size="9" font-weight="600" fill="#1f2937" text-anchor="middle">{p}</text>')

    parts.append('</svg>')
    return "".join(parts)
