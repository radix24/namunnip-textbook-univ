/* 공통3 실습: 경사면과 마찰 (03-02) */
(() => {
  "use strict";
  const S = QSim.card("lab-c3-incline"); if (!S) return;
  const cv = S.$("canvas"), G = 9.8, LEN = 3;
  let s = 0, vs = 0, released = false;
  const state = () => {
    const th = (S.val("th") * Math.PI) / 180, ms = S.val("ms"), mk = Math.min(S.val("mk"), ms);
    const slides = Math.tan(th) > ms + 1e-12;
    const a = slides ? G * (Math.sin(th) - mk * Math.cos(th)) : 0;
    return { th, ms, mk, slides, a };
  };
  function draw() {
    const C = QSim.col(), v = QSim.view(cv, 0.6), st = state(), th = st.th;
    const f = QSim.frame(v, { x0: -0.3, x1: 3.6, y0: -0.3, y1: 2.6, equal: true, pad: 10 });
    const top = [0, LEN * Math.sin(th)], bot = [LEN * Math.cos(th), 0];
    const g = v.g; g.save(); g.fillStyle = C.soft; g.globalAlpha = 0.5; g.beginPath();
    g.moveTo(f.X(top[0]), f.Y(top[1])); g.lineTo(f.X(bot[0]), f.Y(0)); g.lineTo(f.X(0), f.Y(0)); g.closePath(); g.fill(); g.restore();
    f.path([top, bot], C.ink2, 2); f.path([[-0.3, 0], [3.6, 0]], C.ink3, 1);
    // 블록 (경사면 위 거리 s, 크기 0.36 m)
    const b = 0.36, ux = Math.cos(th), uy = -Math.sin(th), nx = Math.sin(th), ny = Math.cos(th);
    const px = top[0] + ux * s, py = top[1] + uy * s;
    const cx = px + nx * b / 2 + ux * b / 2, cy = py + ny * b / 2 + uy * b / 2;
    g.save(); g.fillStyle = C.main; g.beginPath();
    const corner = (u, w) => [px + ux * u + nx * w, py + uy * u + ny * w];
    [[0, 0], [b, 0], [b, b], [0, b]].forEach(([u, w], i) => { const [x, y] = corner(u, w); i ? g.lineTo(f.X(x), f.Y(y)) : g.moveTo(f.X(x), f.Y(y)); });
    g.closePath(); g.fill(); g.restore();
    // 힘 화살표: 무게를 길이 0.9 m로
    const k = 0.9, sc = (x) => x * k;
    f.arrow(cx, cy, 0, -sc(1), C.ink, "mg");
    f.arrow(cx, cy, nx * sc(Math.cos(th)), ny * sc(Math.cos(th)), C.main, "N");
    const fr = st.slides ? st.mk * Math.cos(th) : Math.sin(th);
    f.arrow(cx, cy, -ux * sc(fr), -uy * sc(fr), C.acc, st.slides ? "f(운동)" : "f(정지)");
    f.text(`${S.val("th")}°`, bot[0] - 0.55, 0.08, C.ink2);
    const T = st.slides ? Math.sqrt((2 * LEN) / st.a) : Infinity;
    S.out(`tan θ = ${Math.tan(th).toFixed(3)}   μs = ${st.ms.toFixed(2)}   μk = ${st.mk.toFixed(2)}${S.val("mk") > st.ms ? " (μk는 μs보다 클 수 없어 μs로 둠)" : ""}\n` +
      (st.slides ? `미끄러진다: a = g(sinθ − μk cosθ) = ${st.a.toFixed(2)} m/s²   3 m를 내려가는 시간 ${T.toFixed(2)} s`
        : `정지: 필요한 정지 마찰 mg sinθ가 최대 μs mg cosθ 이하 (비 ${(Math.tan(th) / Math.max(st.ms, 1e-9)).toFixed(2)})`) +
      (released ? `\n지금 s = ${s.toFixed(2)} m, v = ${vs.toFixed(2)} m/s` : ""));
  }
  const L = QSim.loop((dt) => { const st = state(); vs += st.a * dt; s += vs * dt; if (s >= LEN - 0.36) { s = LEN - 0.36; draw(); return false; } draw(); }).watch(S.root);
  const setBtn = QSim.playButton(S.$(".play"), L, () => { if (s >= LEN - 0.37) { s = 0; vs = 0; } released = true; });
  S.$(".reset").addEventListener("click", () => { L.stop(); setBtn(); s = 0; vs = 0; released = false; draw(); });
  S.on(() => { if (!L.running) draw(); });
  QSim.redrawOn(draw); draw();
})();
