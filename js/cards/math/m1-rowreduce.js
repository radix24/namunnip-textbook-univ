/* 수학1 탐구: 가우스-조르당 소거를 한 단계씩 (분수로 정확히 계산) */
(() => {
  "use strict";
  const root = document.getElementById("card-m1-rowreduce");
  if (!root) return;
  const $ = (s) => root.querySelector(s);
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const F = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return [n / g, d / g]; };
  const add = (a, b) => F(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
  const mul = (a, b) => F(a[0] * b[0], a[1] * b[1]);
  const div = (a, b) => F(a[0] * b[1], a[1] * b[0]);
  const neg = (a) => [-a[0], a[1]];
  const isZ = (a) => a[0] === 0;
  const show = (a) => (a[1] === 1 ? `${a[0]}` : `${a[0]}/${a[1]}`);
  const PRE = {
    one: [[1, 2, 1, 4], [2, 5, 3, 9], [-1, 1, 4, 7]],
    many: [[1, 2, -1, 2], [2, 4, -1, 5], [3, 6, -2, 7]],
    none: [[1, 1, 1, 1], [1, 2, 3, 2], [2, 3, 4, 4]],
    swap: [[0, 2, 4, 2], [1, 3, 5, 4], [2, 1, 1, 3]],
  };
  let M, steps, at, log;
  /* 연산 목록을 미리 만든다: 각 원소는 {desc, why, M(적용 후)} */
  function plan(M0) {
    let A = M0.map((r) => r.map((x) => F(x)));
    const out = [], rows = A.length, cols = A[0].length - 1;
    let r = 0;
    const snap = () => A.map((row) => row.slice());
    for (let c = 0; c < cols && r < rows; c++) {
      let p = -1;
      for (let i = r; i < rows; i++) if (!isZ(A[i][c])) { p = i; break; }
      if (p < 0) { out.push({ desc: `${c + 1}열 건너뜀`, why: `${r + 1}행 아래로 ${c + 1}열이 모두 0이라 피벗을 둘 수 없습니다. x${c + 1}은 자유변수가 됩니다.`, M: snap(), piv: null }); continue; }
      if (p !== r) { [A[p], A[r]] = [A[r], A[p]]; out.push({ desc: `R${r + 1} ↔ R${p + 1}`, why: `${c + 1}열에서 0이 아닌 성분이 ${p + 1}행에 있어, 계단의 다음 칸(${r + 1}행)으로 올립니다.`, M: snap(), piv: [r, c] }); }
      const pv = A[r][c];
      if (!(pv[0] === 1 && pv[1] === 1)) { A[r] = A[r].map((x) => div(x, pv)); out.push({ desc: `R${r + 1} → (1/${show(pv)})·R${r + 1}`, why: `피벗을 1로 만듭니다(기약 행사다리꼴의 셋째 조건).`, M: snap(), piv: [r, c] }); }
      for (let i = 0; i < rows; i++) {
        if (i === r || isZ(A[i][c])) continue;
        const k = A[i][c];
        A[i] = A[i].map((x, j) => add(x, neg(mul(k, A[r][j]))));
        out.push({ desc: `R${i + 1} → R${i + 1} − (${show(k)})·R${r + 1}`, why: `${c + 1}열에서 피벗 말고 ${i + 1}행 성분을 0으로 만듭니다(넷째 조건).`, M: snap(), piv: [r, c] });
      }
      r++;
    }
    return out;
  }
  function verdict(A) {
    const cols = A[0].length - 1;
    const piv = A.map((row) => row.findIndex((x) => !isZ(x)));
    if (piv.includes(cols)) return "상수 열에 피벗이 섰습니다: 0 = 1 꼴의 식이 있어 해가 없습니다.";
    const pc = piv.filter((j) => j >= 0);
    const free = [];
    for (let j = 0; j < cols; j++) if (!pc.includes(j)) free.push(`x${j + 1}`);
    return free.length ? `자유변수 ${free.join(", ")}: 해가 무수히 많습니다.` : `자유변수가 없어 해가 하나뿐입니다: ${A.map((row) => show(row[cols])).join(", ")}`;
  }
  function render() {
    const cur = at < 0 ? M.map((r) => r.map((x) => F(x))) : steps[at].M;
    const piv = at < 0 ? null : steps[at].piv;
    const t = $(".rr-mat");
    t.innerHTML = "";
    cur.forEach((row, i) => {
      const tr = document.createElement("tr");
      row.forEach((x, j) => {
        const td = document.createElement("td");
        td.textContent = show(x);
        if (j === row.length - 1) td.className = "aug";
        if (piv && piv[0] === i && piv[1] === j) td.classList.add("piv");
        tr.appendChild(td);
      });
      t.appendChild(tr);
    });
    $(".rr-step").textContent = at < 0 ? "처음 첨가행렬" : `${at + 1}/${steps.length}단계: ${steps[at].desc}`;
    $(".out").textContent = at < 0 ? "‘다음 단계’를 누르세요." : steps[at].why + (at === steps.length - 1 ? "\n끝: " + verdict(cur) : "");
    $(".rr-next").disabled = at >= steps.length - 1;
    $(".rr-prev").disabled = at < 0;
  }
  function load(key) { M = PRE[key]; steps = plan(M); at = -1; render(); }
  $(".rr-next").addEventListener("click", () => { if (at < steps.length - 1) at++; render(); });
  $(".rr-prev").addEventListener("click", () => { if (at >= 0) at--; render(); });
  root.querySelectorAll("[data-pre]").forEach((b) => b.addEventListener("click", () => {
    root.querySelectorAll("[data-pre]").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
    load(b.dataset.pre);
  }));
  load("one");
})();
