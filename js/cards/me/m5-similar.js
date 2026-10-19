/* 기계5 유체역학 6단원: π 묶음 계산기 (06-01), 펌프 회전 속도 제어와 상사 법칙 (06-02) */
(() => {
  "use strict";

  /* ── 반복 변수법으로 π 묶음 구하기 ── */
  (() => {
    const S = QSim.card("lab-me-pi"); if (!S) return;
    // 차원 [M, L, T]
    const V = {
      F: [1, 1, -2], D: [0, 1, 0], V: [0, 1, -1], "ρ": [1, -3, 0], "μ": [1, -1, -1], "ΔP": [1, -1, -2], L: [0, 1, 0], "ε": [0, 1, 0],
      gH: [0, 2, -2], Q: [0, 3, -1], N: [0, 0, -1], T: [0, 0, 1], m: [1, 0, 0], g: [0, 1, -2]
    };
    const P = {
      drag: { name: "구의 항력", dep: "F", vars: ["F", "D", "V", "ρ", "μ"], reps: [["D", "V", "ρ"], ["D", "V", "μ"]], note: "앞의 것은 F/(ρV²D²), 뒤의 것은 μ/(ρVD) = 1/Re이다 (예제 6.1.1). 반복 변수를 바꾸면 π의 모양은 달라지지만 서로 곱하고 나누어 바꿀 수 있다." },
      pipe: { name: "관의 압력 강하", dep: "ΔP", vars: ["ΔP", "V", "D", "L", "ρ", "μ", "ε"], reps: [["D", "V", "ρ"], ["D", "L", "ρ"]], note: "ΔP/(ρV²), 1/Re, L/D, ε/D (예제 6.1.2). Moody 선도의 축이 된다." },
      pump: { name: "펌프 양정", dep: "gH", vars: ["gH", "Q", "N", "D", "ρ", "μ"], reps: [["N", "D", "ρ"], ["Q", "D", "ρ"]], note: "양정 계수 gH/(N²D²), 유량 계수 Q/(ND³), 1/Re (6.1절 연습문제 2). 6.2절 상사 법칙의 근거이다." },
      pend: { name: "진자의 주기", dep: "T", vars: ["T", "L", "m", "g"], reps: [["L", "m", "g"]], note: "π가 하나뿐이라 T√(g/L) = 상수. 질량은 빠진다." },
      ship: { name: "배의 저항", dep: "F", vars: ["F", "V", "L", "ρ", "μ", "g"], reps: [["L", "V", "ρ"]], note: "F/(ρV²L²), 1/Re, gL/V² = 1/Fr². Re와 Fr를 동시에 맞추기 어렵다 (6.2.3)." }
    };
    const det = (a) => a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
    const frac = (x) => { for (const d of [1, 2, 3, 4, 6]) { const n = Math.round(x * d); if (Math.abs(n / d - x) < 1e-9) return d === 1 ? `${n}` : `${n}/${d}`; } return x.toFixed(3); };
    const pw = (s, e) => (e === 1 ? s : `${s}^${frac(e)}`);
    const sel = S.$("select[name=r]");
    function fill() {
      const p = P[S.val("p")]; sel.innerHTML = p.reps.map((r, i) => `<option value="${i}">${r.join(", ")}</option>`).join("");
    }
    function draw() {
      const p = P[S.val("p")], rep = p.reps[+sel.value || 0];
      const A = [0, 1, 2].map((k) => rep.map((r) => V[r][k])); // 행: 차원, 열: 반복 변수
      const n = p.vars.length, lines = [`${p.name}: 변수 ${n}개 (${p.vars.join(", ")}), 기본 차원 3개 (M, L, T) → π ${n - 3}개`, `반복 변수 ${rep.join(", ")}`];
      const D0 = det(A);
      if (Math.abs(D0) < 1e-12) { lines.push("이 세 변수끼리 무차원 묶음을 만들 수 있어(예: L/D) 반복 변수로 쓸 수 없다. 다른 조합을 고르세요."); S.out(lines.join("\n")); return; }
      let i = 1;
      for (const q of p.vars) {
        if (rep.includes(q)) continue;
        // q · Π r_j^a_j 의 지수가 0: A a = −d_q (Cramer)
        const b = V[q].map((x) => -x), a = [0, 1, 2].map((j) => det(A.map((row, k) => row.map((x, c) => (c === j ? b[k] : x)))) / D0);
        const num = [q], den = [];
        rep.forEach((r, j) => { if (Math.abs(a[j]) < 1e-12) return; (a[j] > 0 ? num : den).push(pw(r, Math.abs(a[j]))); });
        lines.push(`Π${i++} = ${num.join("·")}${den.length > 1 ? " / (" + den.join("·") + ")" : den.length ? " / " + den[0] : ""}    [지수 ${rep.map((r, j) => `${r}: ${frac(a[j])}`).join(", ")}]`);
      }
      lines.push(p.note);
      S.out(lines.join("\n"));
    }
    S.$("select[name=p]").addEventListener("input", () => { fill(); draw(); });
    fill(); S.on(draw); draw();
  })();

  /* ── 펌프 회전 속도 제어: 상사 법칙과 배관 곡선 ── */
  (() => {
    const S = QSim.card("lab-me-affinity"); if (!S) return;
    const [cv] = S.$$("canvas");
    const N0 = 1750, H0 = 70, k = 5600, eta = 0.75, rg = 9810;
    function draw() {
      const c = QSim.col(), N = S.val("N"), Hs = S.val("Hs"), cs = (H0 - 5600 * 0.0025 - Hs) / 0.0025; // 1750 rpm에서 0.05 m³/s를 지나도록
      const r = N / N0, pump = (Q, rr) => H0 * rr * rr - k * Q * Q, sys = (Q) => Hs + cs * Q * Q;
      const Q = Math.sqrt(Math.max(H0 * r * r - Hs, 0) / (k + cs)), H = sys(Q), Pw = (rg * Q * H) / eta;
      const v = QSim.view(cv, 0.6), f = QSim.frame(v, { x0: 0, x1: 0.1, y0: 0, y1: 100, xl: "Q (m³/s)", yl: "H (m)", pad: 34 });
      f.axes();
      f.fn((x) => pump(x, 1), c.ink3, 1.5, [5, 4]);
      f.fn((x) => pump(x, r), c.main, 2.5);
      f.fn(sys, c.acc, 2);
      f.dot(Q, H, c.warn, 6);
      f.text("배관", 0.085, sys(0.085) - 6, c.acc); f.text(`펌프 ${N} rpm`, 0.005, pump(0, r) + 3, c.main);
      let tail = "";
      const Q0 = 0.05;
      if (Q > 1e-4 && Q < Q0 - 1e-6) {
        const Ht = pump(Q, 1), Pt = (rg * Q * Ht) / eta;
        f.dot(Q, Ht, c.ink2, 5);
        tail = `\n같은 유량을 1750 rpm에서 밸브로 조이면: 양정 ${Ht.toFixed(1)} m, 동력 ${(Pt / 1000).toFixed(2)} kW → 회전 속도 제어가 ${(100 * (1 - Pw / Pt)).toFixed(0)}% 절약`;
      }
      const aff = `상사 법칙만 쓰면(정수두 0일 때) 유량 ×${r.toFixed(3)}, 양정 ×${(r * r).toFixed(3)}, 동력 ×${(r ** 3).toFixed(3)}`;
      S.out(Q > 1e-4
        ? `회전 속도 ${N} rpm (1750의 ${r.toFixed(3)}배), 정수두(높이 차) ${Hs} m\n운전점(빨강): 유량 ${Q.toFixed(4)} m³/s, 양정 ${H.toFixed(1)} m, 축동력(효율 75%) ${(Pw / 1000).toFixed(2)} kW\n${aff}${tail}`
        : `회전 속도 ${N} rpm: 체절 양정 ${(H0 * r * r).toFixed(1)} m가 높이 차 ${Hs} m보다 낮아 물이 올라가지 않는다`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
