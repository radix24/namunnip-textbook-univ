/* 수학24 탐구: IEEE 754 비트 탐색기 — 입력한 수의 부호·지수·가수 비트, 실제 저장값(정확한 십진 전개), 이웃 수와의 간격 */
(() => {
  "use strict";
  const S = MKit.setup("card-m24-float", 0.32, draw);
  if (!S) return;
  const { k, v } = S;
  const exactDecimal = (mant, e2) => {
    // 값 = mant * 2^e2 (mant: BigInt ≥ 0)를 정확한 십진 문자열로
    if (mant === 0n) return "0";
    if (e2 >= 0) return (mant << BigInt(e2)).toString();
    const kk = -e2, num = mant * 5n ** BigInt(kk), s = num.toString().padStart(kk + 1, "0");
    const ip = s.slice(0, s.length - kk), fp = s.slice(s.length - kk).replace(/0+$/, "");
    return fp ? `${ip}.${fp}` : ip;
  };
  function decode(x, single) {
    const buf = new DataView(new ArrayBuffer(8));
    let bits, EB, MB, bias;
    if (single) { buf.setFloat32(0, x); bits = BigInt(buf.getUint32(0)); EB = 8; MB = 23; bias = 127; }
    else { buf.setFloat64(0, x); bits = buf.getBigUint64(0); EB = 11; MB = 52; bias = 1023; }
    const total = 1 + EB + MB, str = bits.toString(2).padStart(total, "0");
    const s = Number(str[0]), E = parseInt(str.slice(1, 1 + EB), 2), F = BigInt("0b" + (str.slice(1 + EB) || "0"));
    const stored = single ? Math.fround(x) : x;
    let kind = "정규수", mant = 0n, e2 = 0;
    if (E === (1 << EB) - 1) kind = F === 0n ? "무한대" : "NaN";
    else if (E === 0) { kind = F === 0n ? "0" : "비정규수"; mant = F; e2 = 1 - bias - MB; }
    else { mant = (1n << BigInt(MB)) | F; e2 = E - bias - MB; }
    return { str, s, E, F, EB, MB, bias, kind, mant, e2, stored, hex: bits.toString(16).padStart(total / 4, "0") };
  }
  function draw() {
    const c = QSim.col(), single = k.val("prec") === "single";
    let x = k.val("x"); if (!Number.isFinite(x) && !Number.isNaN(x)) x = Number(k.$('[name="x"]').value);
    const d = decode(x, single), n = d.str.length;
    const F = QSim.frame(v, { x0: 0, x1: n, y0: 0, y1: 3, pad: 4, xl: "", yl: "" });
    const g = v.g;
    for (let i = 0; i < n; i++) {
      const col = i === 0 ? c.warn : i <= d.EB ? c.acc : c.main;
      const X0 = F.X(i + 0.06), X1 = F.X(i + 0.94), Y0 = F.Y(2.6), Y1 = F.Y(1.2);
      g.globalAlpha = d.str[i] === "1" ? 0.9 : 0.15; g.fillStyle = col; g.fillRect(X0, Y0, X1 - X0, Y1 - Y0); g.globalAlpha = 1;
      if (n <= 32 || i % 4 === 0) F.text(d.str[i], i + 0.5, 0.75, c.ink2, "center");
    }
    F.text("부호", 0.5, 2.85, c.warn, "left"); F.text(`지수 ${d.EB}비트`, 1.5, 2.85, c.acc, "left"); F.text(`가수 ${d.MB}비트`, 1 + d.EB + 1, 2.85, c.main, "left");
    let lines = `입력 ${x} → ${single ? "단정밀도(32비트)" : "배정밀도(64비트)"} 0x${d.hex.toUpperCase()} · ${d.kind}\n`;
    if (d.kind === "정규수" || d.kind === "비정규수") {
      const ex = exactDecimal(d.mant, d.e2), exp = d.kind === "정규수" ? d.E - d.bias : 1 - d.bias;
      const ulp = d.e2 >= 0 ? 2 ** d.e2 : Math.pow(2, d.e2);
      lines += `부호 ${d.s}, 지수 E = ${d.E} → 2^${exp}, 가수 ${d.kind === "정규수" ? "1." : "0."}${d.str.slice(1 + d.EB).replace(/0+$/, "") || "0"}(이진)\n`;
      lines += `실제 저장값 = ${d.s ? "-" : ""}${ex.length > 70 ? ex.slice(0, 70) + "…" : ex}\n`;
      lines += `이웃한 수와의 간격 = 2^${d.e2} ≈ ${ulp.toExponential(3)} · 상대 간격 ≈ ${(ulp / Math.abs(d.stored || 1)).toExponential(3)}`;
    }
    k.out(lines);
  }
  S.redraw();
})();
