/* 수학19 탐구: 갈루아 대응 — 부분군 격자(왼쪽)와 중간체 격자(오른쪽), 선택한 부분군과 그 고정체를 강조 */
(() => {
  "use strict";
  const S = MKit.setup("card-m19-galois", 0.62, draw);
  if (!S) return;
  const { k, v } = S;
  // 각 노드: 부분군 이름, 위수, 고정체, 차수 [E^H : Q], 정규 여부, 가로 위치
  const EX = {
    v4: { name: "Q(√2, √3), G ≅ V₄", n: 4, nodes: [
      { h: "{1}", o: 1, f: "Q(√2, √3)", d: 4, nrm: true, x: 0.5 },
      { h: "⟨σ⟩", o: 2, f: "Q(√3)", d: 2, nrm: true, x: 0.1 },
      { h: "⟨τ⟩", o: 2, f: "Q(√2)", d: 2, nrm: true, x: 0.5 },
      { h: "⟨στ⟩", o: 2, f: "Q(√6)", d: 2, nrm: true, x: 0.9 },
      { h: "G", o: 4, f: "Q", d: 1, nrm: true, x: 0.5 }],
      edges: [[0, 1], [0, 2], [0, 3], [1, 4], [2, 4], [3, 4]], note: "σ: √2 ↦ −√2, τ: √3 ↦ −√3" },
    s3: { name: "Q(∛2, ω), G ≅ S₃", n: 6, nodes: [
      { h: "{1}", o: 1, f: "Q(∛2, ω)", d: 6, nrm: true, x: 0.5 },
      { h: "⟨(2 3)⟩", o: 2, f: "Q(α₁) = Q(∛2)", d: 3, nrm: false, x: 0.05 },
      { h: "⟨(1 3)⟩", o: 2, f: "Q(α₂)", d: 3, nrm: false, x: 0.35 },
      { h: "⟨(1 2)⟩", o: 2, f: "Q(α₃)", d: 3, nrm: false, x: 0.65 },
      { h: "A₃", o: 3, f: "Q(ω)", d: 2, nrm: true, x: 0.95 },
      { h: "G", o: 6, f: "Q", d: 1, nrm: true, x: 0.5 }],
      edges: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [2, 5], [3, 5], [4, 5]], note: "근 α₁ = ∛2, α₂ = ∛2ω, α₃ = ∛2ω², 치환은 근의 번호" },
    z4: { name: "Q(ζ₅), G ≅ Z₄", n: 4, nodes: [
      { h: "{1}", o: 1, f: "Q(ζ₅)", d: 4, nrm: true, x: 0.5 },
      { h: "⟨σ²⟩", o: 2, f: "Q(√5)", d: 2, nrm: true, x: 0.5 },
      { h: "G = ⟨σ⟩", o: 4, f: "Q", d: 1, nrm: true, x: 0.5 }],
      edges: [[0, 1], [1, 2]], note: "σ: ζ ↦ ζ², σ²: ζ ↦ ζ⁴ = ζ̄" },
  };
  function draw() {
    const E = EX[k.val("e")], hi = k.$('[name="h"]');
    if (hi) { const was = Number(hi.value); hi.max = E.nodes.length - 1; if (was > E.nodes.length - 1) { hi.value = E.nodes.length - 1; hi.dispatchEvent(new Event("input", { bubbles: true })); return; } }
    const c = QSim.col(), sel = Math.min(Number(k.val("h")), E.nodes.length - 1);
    const F = QSim.frame(v, { x0: -0.15, x1: 2.55, y0: -0.25, y1: 1.25, pad: 8, xl: "", yl: "" });
    const Y = (nd) => Math.log(nd.d) / Math.log(E.n);
    const P = (nd, side) => [nd.x + (side ? 1.4 : 0), Y(nd)];
    for (const side of [0, 1]) {
      for (const [a, b] of E.edges) F.path([P(E.nodes[a], side), P(E.nodes[b], side)], c.rule, 1.4);
      E.nodes.forEach((nd, i) => { const [x, y] = P(nd, side); const on = i === sel; F.dot(x, y, on ? c.warn : c.main, on ? 7 : 5); F.text(side ? nd.f : nd.h, x, y + 0.09, on ? c.warn : c.ink2, "center"); });
    }
    F.text("부분군 H", 0.5, -0.18, c.ink3, "center");
    F.text("고정체 E^H", 1.9, -0.18, c.ink3, "center");
    const nd = E.nodes[sel];
    k.out(`${E.name} (${E.note})\nH = ${nd.h}, |H| = ${nd.o} ↔ 고정체 ${nd.f} · [E : E^H] = ${E.n / nd.d} = |H|, [E^H : Q] = ${nd.d} = [G : H] · ${nd.nrm ? "H가 정규부분군 → E^H/Q 정규" : "H가 정규부분군이 아님 → E^H/Q 정규 아님"}`);
  }
  S.redraw();
})();
