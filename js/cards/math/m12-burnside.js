/* 수학12 탐구: 번사이드 보조정리로 목걸이 세기 — 원소마다 고정되는 색칠 k^(순환 수)를 평균 */
(() => {
  "use strict";
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const S = MKit.setup("card-m12-burnside", 0.5, draw);
  if (!S) return;
  const { k, v } = S;
  function draw() {
    const c = QSim.col(), n = k.val("n"), K = k.val("k"), dih = k.val("g") === "dih";
    const els = [];
    for (let j = 0; j < n; j++) els.push({ name: j ? `r${j}` : "e", cyc: gcd(n, j), refl: false });
    if (dih) for (let j = 0; j < n; j++) {
      // 반사 i ↦ j − i: 고정점 수 t, 순환 수 = t + (n − t)/2
      let t = 0; for (let i = 0; i < n; i++) if (((j - i) % n + n) % n === i) t++;
      els.push({ name: `s${j}`, cyc: t + (n - t) / 2, refl: true });
    }
    const fix = els.map((e) => K ** e.cyc), sum = fix.reduce((s, x) => s + x, 0), G = els.length, top = Math.max(...fix);
    const f = QSim.frame(v, { x0: -0.7, x1: G - 0.3, y0: 0, y1: Math.log10(top) * 1.12 + 0.2, pad: 30, yl: "log₁₀ Fix(g)" });
    f.axes({ noGrid: false });
    els.forEach((e, i) => {
      f.path([[i, 0], [i, Math.log10(fix[i])]], e.refl ? c.acc : c.main, Math.max(3, Math.min(18, f.sx * 0.6)));
      if (f.sx > 16) f.text(String(e.cyc), i, Math.log10(fix[i]) + 0.05, c.ink2, "center");
    });
    const total = K ** n;
    k.out(`${dih ? "D" : "C"}_${n} (원소 ${G}개), 색 ${K}가지: 색칠 전체 ${K}^${n} = ${total}\n`
      + `Σ Fix(g) = ${sum} → 서로 다른 목걸이 ${sum} / ${G} = ${sum / G}` + (Number.isInteger(total / G) ? "" : ` · 전체/|G| = ${(total / G).toFixed(2)}는 정수도 아님`)
      + `\n막대 위 숫자: 그 원소의 순환 수 c(g), 막대 높이: Fix(g) = ${K}^c(g) (로그 눈금, 파랑 = 회전, 노랑 = 반사)`);
  }
  S.redraw();
})();
