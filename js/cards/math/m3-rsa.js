/* 수학3 탐구: 작은 RSA — 소수 p, q와 공개 지수 e를 고르고 평문을 암호화·복호화 */
(() => {
  "use strict";
  const S = MKit.setup("card-m3-rsa", 0.35, draw);
  if (!S) return;
  const { k, v } = S;
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const inv = (a, m) => { let [r0, r1, t0, t1] = [m, a % m, 0, 1]; while (r1) { const q = Math.floor(r0 / r1); [r0, r1] = [r1, r0 - q * r1]; [t0, t1] = [t1, t0 - q * t1]; } return r0 === 1 ? ((t0 % m) + m) % m : null; };
  const powmod = (b, e, m) => { let r = 1n, x = BigInt(b) % BigInt(m), E = BigInt(e), M = BigInt(m); while (E > 0n) { if (E & 1n) r = (r * x) % M; x = (x * x) % M; E >>= 1n; } return Number(r); };
  function draw() {
    const c = QSim.col(), p = +k.val("p"), q = +k.val("q"), e = k.val("e"), m = k.val("m"), g = v.g, W = v.W, H = v.H;
    const n = p * q, phi = (p - 1) * (q - 1), ok = p !== q && gcd(e, phi) === 1, d = ok ? inv(e, phi) : null;
    const mm = m % n, cph = ok ? powmod(mm, e, n) : null, back = ok ? powmod(cph, d, n) : null;
    g.save(); g.font = "14px monospace"; g.textBaseline = "middle"; g.textAlign = "center";
    const boxes = [["평문 m", mm, c.main], ["암호문 c = mᵉ mod n", cph, c.warn], ["복호 c^d mod n", back, c.main]];
    const bw = W / 3.4;
    boxes.forEach(([lab, val, col], i) => {
      const x = W * (0.17 + i * 0.33);
      g.strokeStyle = col; g.lineWidth = 2; g.strokeRect(x - bw / 2, H * 0.3, bw, H * 0.4);
      g.fillStyle = c.ink2; g.fillText(lab, x, H * 0.2); g.fillStyle = c.ink; g.font = "20px monospace"; g.fillText(val === null ? "—" : String(val), x, H * 0.5); g.font = "14px monospace";
      if (i < 2) { g.fillStyle = c.ink3; g.fillText(i === 0 ? `^${e}` : `^${d ?? "?"}`, x + W * 0.165, H * 0.5); }
    });
    g.restore();
    k.out(ok ? `n = ${p}×${q} = ${n}, φ = ${phi}, 공개 키 (n, e) = (${n}, ${e}), 비밀 키 d = e⁻¹ mod φ = ${d} (검산 e·d = ${e * d} = ${Math.floor((e * d) / phi)}·φ + ${(e * d) % phi})\n평문 ${mm} → 암호문 ${cph} → 복호 ${back}${m >= n ? ` (평문은 n보다 작아야 해서 ${m} mod ${n} = ${mm}로 바꿈)` : ""}`
      : p === q ? "p와 q는 서로 다른 소수여야 합니다" : `gcd(e, φ) = gcd(${e}, ${phi}) = ${gcd(e, phi)} ≠ 1이라 e의 역원 d가 없습니다. e를 바꾸세요`);
  }
  S.redraw();
})();
