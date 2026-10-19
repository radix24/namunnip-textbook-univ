/* 천우8 실습 카드: 원 궤도 위성의 지상 궤적(J2 승교점 이동 포함), 서울 지상국에서의 가시 시간 */
(() => {
  "use strict";
  const C = () => QSim.col();
  const fx = (x, n = 2) => (+x).toFixed(n);
  const deg = Math.PI / 180, MU = 398600.4418, RE = 6378.137, J2 = 1.08263e-3, WE = 7.2921159e-5;
  const ST = { lat: 37.57 * deg, lon: 126.98 * deg };   // 서울
  function orbit(alt, incDeg) {
    const a = RE + alt, n = Math.sqrt(MU / (a * a * a)), i = incDeg * deg;
    const dOm = -1.5 * n * J2 * (RE / a) ** 2 * Math.cos(i);
    return { a, n, i, dOm, T: 2 * Math.PI / n };
  }
  // 시각 t(초)의 지구 고정 좌표 (구형 지구), 처음 승교점 경도 lon0(도), 처음에 승교점 통과
  function ecef(o, lon0, t) {
    const u = o.n * t, Om = lon0 * deg + o.dOm * t - WE * t;   // 지구 자전만큼 빼서 지구 고정 좌표의 승교점 경도
    const cu = Math.cos(u), su = Math.sin(u), ci = Math.cos(o.i), si = Math.sin(o.i);
    return [o.a * (Math.cos(Om) * cu - Math.sin(Om) * su * ci), o.a * (Math.sin(Om) * cu + Math.cos(Om) * su * ci), o.a * su * si];
  }
  const latlon = (p) => [Math.asin(p[2] / Math.hypot(...p)) / deg, Math.atan2(p[1], p[0]) / deg];
  function elev(p) {
    const s = [RE * Math.cos(ST.lat) * Math.cos(ST.lon), RE * Math.cos(ST.lat) * Math.sin(ST.lon), RE * Math.sin(ST.lat)];
    const d = [p[0] - s[0], p[1] - s[1], p[2] - s[2]], dn = Math.hypot(...d), up = s.map((x) => x / RE);
    return Math.asin((d[0] * up[0] + d[1] * up[1] + d[2] * up[2]) / dn) / deg;
  }

  /* 1. 지상 궤적 (06-01) */
  (() => {
    const S = QSim.card("lab-a8-track"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), o = orbit(S.val("alt"), S.val("inc")), norb = S.val("norb"), lon0 = S.val("lon0");
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: -180, x1: 180, y0: -90, y1: 90, xl: "경도 (°)", yl: "위도 (°)" }); f.axes();
      const g = v.g; let seg = [], prev = null;
      const tmax = norb * o.T, dt = o.T / 400;
      for (let t = 0; t <= tmax; t += dt) {
        const [la, lo] = latlon(ecef(o, lon0, t));
        if (prev !== null && Math.abs(lo - prev) > 180) { f.path(seg, c.main, 1.6); seg = []; }
        seg.push([lo, la]); prev = lo;
      }
      f.path(seg, c.main, 1.6);
      for (let k = 0; k <= norb; k++) { const [la, lo] = latlon(ecef(o, lon0, k * o.T)); f.dot(lo, la, c.warn, 3.5); }
      f.dot(ST.lon / deg, ST.lat / deg, c.acc, 5); f.text("서울", ST.lon / deg + 3, ST.lat / deg + 3, c.acc);
      const shift = 360 * o.T / 86164.1 - o.dOm * o.T / deg;
      S.out(`고도 ${S.val("alt")} km, 경사각 ${S.val("inc")}°: 주기 ${fx(o.T / 60, 1)}분, 하루 ${fx(86400 / o.T, 2)}바퀴\nJ2에 의한 승교점 이동 ${fx(o.dOm / deg * 86400, 2)}°/일 (태양동기는 +0.986°/일)\n한 바퀴마다 지상 궤적이 서쪽으로 ${fx(shift, 2)}° 옮겨 간다 (지구 자전 ${fx(360 * o.T / 86164.1, 2)}° + 승교점 이동)\n빨간 점: 승교점 통과 위치(한 바퀴마다), 주황 점: 서울. 지구는 구로, 해안선은 그리지 않았다`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();

  /* 2. 서울 지상국의 가시 시간 (06-02) */
  (() => {
    const S = QSim.card("lab-a8-pass"); if (!S) return;
    const cv = S.$("canvas");
    function draw() {
      const c = C(), o = orbit(S.val("alt"), S.val("inc")), lon0 = S.val("lon0"), emin = S.val("emin");
      const v = QSim.view(cv, 0.5), f = QSim.frame(v, { x0: 0, x1: 24, y0: -10, y1: 90, xl: "시간 (h)", yl: "고도각 (°)" }); f.axes();
      f.path([[0, emin], [24, emin]], c.warn, 1, [4, 3]);
      const pts = [], passes = []; let cur = null;
      for (let t = 0; t <= 86400; t += 10) {
        const e = elev(ecef(o, lon0, t)); pts.push([t / 3600, Math.max(-10, e)]);
        if (e >= emin) { if (!cur) cur = { t0: t, max: e, tmax: t }; if (e > cur.max) { cur.max = e; cur.tmax = t; } cur.t1 = t; }
        else if (cur) { passes.push(cur); cur = null; }
      }
      if (cur) passes.push(cur);
      f.path(pts, c.main, 1.4);
      const tot = passes.reduce((s, p) => s + (p.t1 - p.t0), 0);
      const list = passes.slice(0, 6).map((p) => `${fx(p.t0 / 3600, 2)}h~${fx(p.t1 / 3600, 2)}h (${fx((p.t1 - p.t0) / 60, 1)}분, 최고 ${fx(p.max, 0)}°)`).join(", ");
      S.out(`고도 ${S.val("alt")} km, 경사각 ${S.val("inc")}°, 최소 고도각 ${emin}°\n24시간 동안 교신 가능한 통과 ${passes.length}번, 합계 ${fx(tot / 60, 1)}분\n${passes.length ? "처음 통과들: " + list : "이 조건에서는 서울에서 보이지 않는다"}\n가로축은 위성이 승교점을 지난 뒤의 시간. 빨간 점선: 최소 고도각`);
    }
    S.on(draw); QSim.redrawOn(draw); draw();
  })();
})();
