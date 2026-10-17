"""QURI 앱 아이콘 PNG 만들기 (외부 라이브러리 없이). 모양은 assets/quri-mark.svg와 같다.

바탕: QURI 잉크(#1A1D2E) 둥근 사각형, 고리: 흰색, 네모: QED 앰버(#F2B33D).
python -I tools/icons.py → assets/icons/*.png
"""
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INK, WHITE, AMBER = (0x1A, 0x1D, 0x2E), (0xFF, 0xFF, 0xFF), (0xF2, 0xB3, 0x3D)
SS = 4  # 한 픽셀을 4×4로 나누어 가장자리를 부드럽게


def shade(u, v, maskable, rounded):
    """0~64 좌표의 한 점 색. 바탕 밖이면 None(투명)."""
    if maskable:  # 안전 영역(가운데 80%)에 마크를 넣는다
        u, v = (u - 32) / 0.62 + 32, (v - 32) / 0.62 + 32
    else:
        u, v = (u - 32) / 0.78 + 32, (v - 32) / 0.78 + 32
    d =((u - 29) ** 2 + (v - 29) ** 2) ** 0.5
    if 40 <= u <= 56 and 40 <= v <= 56:
        return AMBER
    if 14.5 <= d <= 23.5:
        return WHITE
    return INK


def inside_bg(x, y, size, rounded):
    if not rounded:
        return True
    r = size * 0.22
    cx = min(max(x, r), size - r)
    cy = min(max(y, r), size - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def render(size, maskable=False, rounded=True):
    rows = []
    for py in range(size):
        row = bytearray([0])
        for px in range(size):
            acc = [0, 0, 0, 0]
            for sy in range(SS):
                for sx in range(SS):
                    x = px + (sx + 0.5) / SS
                    y = py + (sy + 0.5) / SS
                    if not inside_bg(x, y, size, rounded and not maskable):
                        continue
                    c = shade(x / size * 64, y / size * 64, maskable, rounded)
                    acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2]; acc[3] += 255
            n = SS * SS
            a = acc[3] / n
            if a:
                k = acc[3] / 255
                row += bytes([round(acc[0] / k), round(acc[1] / k), round(acc[2] / k), round(a)])
            else:
                row += bytes([0, 0, 0, 0])
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def main():
    out = ROOT / "assets" / "icons"
    out.mkdir(parents=True, exist_ok=True)
    (out / "icon-192.png").write_bytes(render(192))
    (out / "icon-512.png").write_bytes(render(512))
    (out / "icon-maskable-512.png").write_bytes(render(512, maskable=True))
    (out / "apple-touch-icon.png").write_bytes(render(180, rounded=False))
    print("assets/icons: 192, 512, maskable-512, apple-touch-icon(180)")


if __name__ == "__main__":
    main()
