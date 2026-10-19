/* 기계7 기계공학실험(1) 4단원: Taylor 공구 수명과 한 개당 가공 비용 (04-01) */
(() => {
  "use strict";
  const S = QSim.card("lab-me-toollife"); if (!S) return;
  const [cv] = S.$$("canvas");
  // 가상 공구 자료: n, C (m/min)
  const TOOL = { hss: { name: "고속도강", n: 0.125, C: 70, vmax: 120 }, carb: { name: "초경", n: 0.25, C: 400, vmax: 450 }, cer: { name: "세라믹", n: 0.5, C: 1500, vmax: 1500 } };
  const D = 50, L = 200, f = 0.2, Cm = 1000; // 지름 50 mm, 길이 200 mm, 이송 0.2 mm/rev, 기계·인건비 1000원/min
  function draw() {
    const c = QSim.col(), tl = TOOL[S.val("tool")], V = Math.min(S.val("V"), tl.vmax), tc = S.val("tc"), Ct = S.val("Ct");
    const tm = (v) => (L * Math.PI * D) / (f * 1000 * v); // 가공 시간 (min) = L/(f N)
    const T = (v) => Math.pow(tl.C / v, 1 / tl.n);
    const cost = (v) => Cm * tm(v) + ((Cm * tc + Ct) * tm(v)) / T(v);
    const Topt = (1 / tl.n - 1) * (tc + Ct / Cm), Vopt = tl.C / Math.pow(Topt, tl.n);
    const vlo = tl.vmax * 0.2, vhi = tl.vmax, cmax = Math.max(cost(vlo), cost(vhi * 0.98)) * 1.05;
    const v = QSim.view(cv, 0.55), F = QSim.frame(v, { x0: vlo, x1: vhi, y0: 0, y1: Math.min(cmax, cost(Vopt) * 3), xl: "절삭 속도 (m/min)", yl: "한 개당 비용 (원)", pad: 44 });
    F.axes();
    F.fn((x) => Cm * tm(x), c.ink3, 1.5, [5, 4]);
    F.fn((x) => ((Cm * tc + Ct) * tm(x)) / T(x), c.ink3, 1.5, [2, 3]);
    F.fn(cost, c.main, 2.5);
    F.dot(Vopt, cost(Vopt), c.acc, 6); F.dot(V, cost(V), c.warn, 6);
    S.out(`${tl.name} 공구 (n = ${tl.n}, C = ${tl.C} m/min), 지름 50 mm × 길이 200 mm, 이송 0.2 mm/rev\n절삭 속도 ${V} m/min → 회전수 ${((1000 * V) / (Math.PI * D)).toFixed(0)} rpm, 가공 시간 ${tm(V).toFixed(2)} min/개, 공구 수명 ${T(V).toFixed(1)} min (날 하나로 ${(T(V) / tm(V)).toFixed(1)}개)\n한 개당 비용 ${cost(V).toFixed(0)}원 = 가공 ${(Cm * tm(V)).toFixed(0)} + 공구 ${(cost(V) - Cm * tm(V)).toFixed(0)}\n최소 비용: 수명 ${Topt.toFixed(1)} min, 속도 ${Vopt.toFixed(0)} m/min, ${cost(Vopt).toFixed(0)}원 (초록 점)`);
  }
  S.on(draw); QSim.redrawOn(draw); draw();
})();
