/* 화학과 무기화학2 카드 묶음 (화학13)
   d³ 착물의 Tanabe-Sugano 맞춤, 치환 반응 메커니즘의 속도 자료, 헤모글로빈의 협동적 산소 결합, 18전자 규칙 계산기 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const Q = window.QChem;
  const RED = "#b5562a", GRN = "#2f8f5b";

  /* 1. d³ 팔면체 착물의 Tanabe-Sugano 맞춤 (화학13-03-01) */
  (() => {
    const S = QSim.card("lab-ch13-ts"); if (!S) return;
    const cv = S.$("canvas");
    // 관측 띠 (cm⁻¹): 첫 띠 ⁴T₂g, 둘째 ⁴T₁g(F), 셋째 ⁴T₁g(P) (없으면 null)
    const OBS = { aq: ["[Cr(H₂O)₆]³⁺", 17400, 24600, 37800], nh3: ["[Cr(NH₃)₆]³⁺", 21550, 28500, null], cl: ["[CrCl₆]³⁻", 13200, 18700, null] };
    const T1 = (x) => { const s = Math.sqrt(225 - 18 * x + x * x); return [7.5 + 1.5 * x - 0.5 * s, 7.5 + 1.5 * x + 0.5 * s]; };   // E/B, x = Δ/B
    function draw() {
      const c = C(), key = S.val("cx"), D = S.val("D"), B = S.val("B"), o = OBS[key];
      const x = D / B, [f, p] = T1(x), pred = [D, f * B, p * B];
      const v = QSim.view(cv, 0.6), fr = QSim.frame(v, { x0: 0, x1: 40, y0: 0, y1: 80, xl: "Δo/B", yl: "E/B", pad: 44 }); fr.axes();
      fr.fn((t) => t, c.main, 2); fr.fn((t) => T1(t)[0], RED, 2); fr.fn((t) => T1(t)[1], GRN, 2);
      fr.text("⁴T₂g", 36, 37.5, c.main); fr.text("⁴T₁g(F)", 33, Math.min(T1(33)[0] + 3, 76), RED); fr.text("⁴T₁g(P)", 18, Math.min(T1(18)[1] + 3, 76), GRN);
      fr.path([[x, 0], [x, 80]], c.ink3, 1.2, [4, 4]);
      pred.forEach((e, i) => fr.dot(x, e / B, [c.main, RED, GRN][i], 5));
      o.slice(1).forEach((e) => { if (e) fr.path([[x - 1.2, e / B], [x + 1.2, e / B]], c.ink, 2.5); });
      const res = o.slice(1).map((e, i) => (e ? pred[i] - e : null));
      const fmt = (r) => (r === null ? "관측 없음" : (r >= 0 ? "+" : "") + r.toFixed(0));
      S.out(`${o[0]} · Δo = ${D} cm⁻¹, B = ${B} cm⁻¹ → Δo/B = ${x.toFixed(1)}\n예측 띠: ⁴T₂g ${pred[0].toFixed(0)}, ⁴T₁g(F) ${pred[1].toFixed(0)}, ⁴T₁g(P) ${pred[2].toFixed(0)} cm⁻¹\n관측: ${o.slice(1).map((e) => (e ? e : "—")).join(", ")} cm⁻¹ · 예측 − 관측: ${res.map(fmt).join(", ")}\n네펠라욱세틱 비 β = B/B(자유 Cr³⁺ 이온 918) = ${(B / 918).toFixed(3)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 치환 반응 메커니즘을 속도 자료로 가리기 (화학13-04-01) */
  (() => {
    const S = QSim.card("lab-ch13-subst"); if (!S) return;
    const cv = S.$("canvas");
    const YY = [0.02, 0.05, 0.1, 0.2, 0.4, 0.7, 1.0, 1.5, 2.0];   // 들어오는 리간드 농도 (M)
    const TRUE = { x: (y) => 5e-3 * 2.0 * y / (1 + 2.0 * y), y: (y) => 1e-3 + 2e-3 * y };   // 반응 X: 포화형(K = 2.0 M⁻¹, k = 5.0×10⁻³ s⁻¹), 반응 Y: 두 경로 직선형
    function draw() {
      const c = C(), ds = S.val("ds"), model = S.val("model"), r = Q.rng(ds === "x" ? 101 : 202);
      const data = YY.map((y) => [y, TRUE[ds](y) * (1 + 0.03 * Q.gauss(r))]);
      let fit, txt;
      if (model === "lin") {
        const L = Q.linfit(data.map((d) => d[0]), data.map((d) => d[1]));
        fit = (y) => L.b + L.m * y; txt = `직선 k_obs = k₁ + k₂[Y]: k₁ = ${Q.sci(L.b, 2)} s⁻¹, k₂ = ${Q.sci(L.m, 2)} M⁻¹s⁻¹`;
      } else {
        const L = Q.linfit(data.map((d) => 1 / d[0]), data.map((d) => 1 / d[1]));   // 1/k_obs = 1/k + 1/(kK[Y])
        const k = 1 / L.b, K = L.b / L.m;
        fit = (y) => k * K * y / (1 + K * y); txt = `포화형 k_obs = kK[Y]/(1 + K[Y]) (역수 직선으로 맞춤): k = ${Q.sci(k, 2)} s⁻¹, K = ${K.toFixed(2)} M⁻¹`;
      }
      const rms = Math.sqrt(data.reduce((s, [y, k]) => s + ((fit(y) - k) / k) ** 2, 0) / data.length);
      const ymax = Math.max(...data.map((d) => d[1])) * 1.2;
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: 2.1, y0: 0, y1: ymax * 1000, xl: "[Y] (M)", yl: "k_obs (×10⁻³ s⁻¹)", pad: 46 }); f.axes();
      f.fn((y) => fit(y) * 1000, c.main, 2);
      data.forEach(([y, k]) => f.dot(y, k * 1000, RED, 4.5));
      S.out(`${ds === "x" ? "반응 X" : "반응 Y"} (가상 측정값 9점, 잡음 3%)\n${txt}\n맞춤의 상대 잔차(제곱평균) = ${(100 * rms).toFixed(1)}% (잡음 수준 3%에 가까우면 모형이 자료와 맞음)`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 3. 헤모글로빈과 미오글로빈의 산소 결합 (화학13-05-01) */
  (() => {
    const S = QSim.card("lab-ch13-hb"); if (!S) return;
    const cv = S.$("canvas");
    const hill = (p, p50, n) => p ** n / (p50 ** n + p ** n);
    function draw() {
      const c = C(), p50 = S.val("p50"), n = S.val("n"), pt = S.val("pt"), pl = 100;
      const v = QSim.view(cv, 0.55), f = QSim.frame(v, { x0: 0, x1: 120, y0: 0, y1: 1.05, xl: "산소 분압 pO₂ (mmHg)", yl: "포화도 Y", pad: 44 }); f.axes();
      f.fn((p) => hill(p, 2.8, 1), c.ink3, 1.5, [5, 4]);
      f.fn((p) => hill(p, p50, n), c.main, 2.5);
      f.path([[pt, 0], [pt, 1.05]], RED, 1.2, [3, 3]); f.path([[pl, 0], [pl, 1.05]], GRN, 1.2, [3, 3]);
      const yl = hill(pl, p50, n), yt = hill(pt, p50, n), ml = hill(pl, 2.8, 1), mt = hill(pt, 2.8, 1);
      f.dot(pl, yl, GRN, 5); f.dot(pt, yt, RED, 5);
      S.out(`헤모글로빈 모형: p50 = ${p50} mmHg, 힐 계수 n = ${n.toFixed(1)} · 점선: 미오글로빈 (p50 2.8 mmHg, n = 1)\n허파(100 mmHg) 포화도 ${yl.toFixed(3)}, 조직(${pt} mmHg) ${yt.toFixed(3)} → 조직에 내려놓는 몫 ${(yl - yt).toFixed(3)}\n미오글로빈이었다면: ${ml.toFixed(3)} → ${mt.toFixed(3)}, 내려놓는 몫 ${(ml - mt).toFixed(3)}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 4. 18전자 규칙 계산기 (화학13-06-01) */
  (() => {
    const S = QSim.card("lab-ch13-18e"); if (!S) return;
    const cv = S.$("canvas");
    const MET = { Cr: 6, Mo: 6, W: 6, Mn: 7, Re: 7, Fe: 8, Ru: 8, Co: 9, Rh: 9, Ir: 9, Ni: 10, Pd: 10, Pt: 10 };   // 족 번호 = 중성 원자의 원자가 전자 수
    // [중성 원자 계산법의 전자 수, 산화수 계산에서 X형(음이온)이면 1]
    const LIG = { CO: [2, 0], PR3: [2, 0], NH3: [2, 0], alkene: [2, 0], Cl: [1, 1], H: [1, 1], CH3: [1, 1], Cp: [5, 1], C6H6: [6, 0] };
    const NAME = { CO: "CO", PR3: "PR₃", NH3: "NH₃", alkene: "알켄(η²)", Cl: "Cl", H: "H", CH3: "CH₃", Cp: "Cp(η⁵)", C6H6: "C₆H₆(η⁶)" };
    function draw() {
      const c = C(), m = S.val("m"), q = S.val("q"), mm = S.val("mm");
      let e = MET[m] - q + mm, X = 0; const used = [];
      Object.keys(LIG).forEach((k) => { const nL = S.val(k); if (nL > 0) { e += nL * LIG[k][0]; X += nL * LIG[k][1]; used.push(`${NAME[k]}×${nL}`); } });
      const ox = q + X, dn = MET[m] - ox;
      const v = QSim.view(cv, 0.3), f = QSim.frame(v, { x0: 0, x1: 22, y0: 0, y1: 1, pad: 8, noGrid: true });
      const g = v.g; for (let i = 0; i < 20; i++) { g.fillStyle = i < e ? (e === 18 ? GRN : e === 16 ? c.acc : RED) : c.grid || "#ddd"; g.fillRect(f.X(i + 1) + 1, f.Y(0.8), f.X(i + 2) - f.X(i + 1) - 2, f.Y(0.2) - f.Y(0.8)); }
      f.path([[19, 0.05], [19, 0.95]], c.ink, 2); f.text("18", 19, 0.98, c.ink, "center");
      const verdict = e === 18 ? "18전자: 안정한 포화 착물" : e === 16 ? "16전자: d⁸ 평면 사각형에서 흔함(촉매가 여기서 반응을 시작)" : e < 18 ? `${e}전자: 전자 부족(리간드가 더 붙거나 금속-금속 결합을 만들려 함)` : `${e}전자: 18을 넘음(드묾, 리간드가 떨어지기 쉬움)`;
      S.out(`${m} (${MET[m]}족), 착물 전하 ${q > 0 ? "+" : ""}${q}, 리간드: ${used.join(", ") || "없음"}${mm ? `, 금속-금속 결합 ${mm}개` : ""}\n중성 원자 계산법: ${MET[m]} − (${q}) + 리간드 전자${mm ? " + M−M 결합" : ""} = ${e}전자\n산화수 = 전하 + X형 리간드 수 = ${ox > 0 ? "+" : ""}${ox}, d 전자 수 = ${MET[m]} − (${ox}) = d${dn}\n판정: ${verdict}`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
