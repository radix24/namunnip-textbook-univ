/* 수학19 탐구: 해밍 (7, 4) 부호 — 정보 4비트를 부호화하고 비트를 뒤집어 증후로 오류 위치를 찾기 */
(() => {
  "use strict";
  const S = MKit.setup("card-m19-hamming", 0.42, draw);
  if (!S) return;
  const { k, v } = S;
  const enc = (d) => { const [d1, d2, d3, d4] = d; return [(d1 + d2 + d4) % 2, (d1 + d3 + d4) % 2, d1, (d2 + d3 + d4) % 2, d2, d3, d4]; };
  const synd = (r) => [(r[0] + r[2] + r[4] + r[6]) % 2, (r[1] + r[2] + r[5] + r[6]) % 2, (r[3] + r[4] + r[5] + r[6]) % 2];
  function draw() {
    const c = QSim.col(), msg = k.val("m");
    const d = [...msg.padStart(4, "0")].map(Number);
    const e1 = Number(k.val("e1")), e2 = Number(k.val("e2"));
    const cw = enc(d), r = cw.slice();
    if (e1) r[e1 - 1] ^= 1;
    if (e2 && e2 !== e1) r[e2 - 1] ^= 1;
    const s = synd(r), pos = s[0] + 2 * s[1] + 4 * s[2];
    const fixed = r.slice(); if (pos) fixed[pos - 1] ^= 1;
    const dec = [fixed[2], fixed[4], fixed[5], fixed[6]];
    const F = QSim.frame(v, { x0: 0, x1: 8, y0: 0, y1: 3.4, pad: 6, xl: "", yl: "" });
    const row = (y, bits, label, mark) => {
      F.text(label, 0.05, y + 0.12, c.ink2, "left");
      bits.forEach((b, i) => { const x = 1.6 + i * 0.9; const col = mark && mark(i) ? c.warn : [0, 1, 3].includes(i) ? c.acc : c.main; F.path([[x - 0.32, y - 0.3], [x + 0.32, y - 0.3], [x + 0.32, y + 0.3], [x - 0.32, y + 0.3], [x - 0.32, y - 0.3]], col, 1.6); F.text(String(b), x, y - 0.08, col, "center"); if (y > 2.5) F.text(String(i + 1), x, y + 0.45, c.ink3, "center"); });
    };
    row(2.6, cw, "보낸 부호어");
    row(1.6, r, "받은 벡터", (i) => r[i] !== cw[i]);
    row(0.6, fixed, "고친 벡터", (i) => pos && i === pos - 1);
    const errs = (e1 ? 1 : 0) + (e2 && e2 !== e1 ? 1 : 0);
    const ok = dec.join("") === d.join("");
    k.out(`정보 ${d.join("")} → 부호어 ${cw.join("")} (주황 칸 1, 2, 4번이 검사 비트) · 뒤집은 비트 ${errs}개\n증후 Hr = (${s.join(", ")}) → 이진수 ${s[2]}${s[1]}${s[0]}₂ = ${pos}${pos ? `번 비트를 고침` : " (오류 없음으로 판정)"} · 복원한 정보 ${dec.join("")} ${ok ? "(맞음)" : "(틀림: 두 비트 오류는 고칠 수 없음)"}`);
  }
  S.redraw();
})();
