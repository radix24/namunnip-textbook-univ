"""exams/<학과>/<과목번호>.json (시험 전용 문항) 검사

  python -I -X utf8 tools/check_exams.py            모든 파일
  python -I -X utf8 tools/check_exams.py phy/1      한 과목
  python -I -X utf8 tools/check_exams.py --sim      세트 뽑기 모의(난이도 흔들림)도 함께

오류(종료 코드 1): 형식(필수 필드, type별 필드, id 겹침), std가 과목 대단원에 없음, 60문항 미만, 응용·심화 60% 미만,
  수식 괄호 짝·수식 안 맨 '<', 탭 문자, rubric 형식.
주의: 중간·기말 비율, 범위마다 16문제 세트를 비율대로 뽑을 만큼 층별 문항이 있는지, 난이도 표시와 풀이 길이가 어긋나 보이는 문항,
  서로 거의 같은 문항, 힌트 부족.
--sim: 범위마다 12문제 세트를 2000번 뽑아 평균 난이도(기본 1·응용 2·심화 3)의 평균과 표준편차를 층별 뽑기와 무작위 뽑기로 비교한다.
형식은 docs/card-schema/README.md 3절. 최상위는 {"items": [...]}만 읽는다. 과목은 파일 위치로 정한다.
시험 방식은 exams/policy.json({"과목 코드": "fin" | "none"})을 따른다: fin은 전 범위 한 범위, none은 문항을 두지 않는다.
"""
import json
import random
import re
import statistics
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MIN_N, MIN_HARD = 60, 0.6
LV = ("기본", "응용", "심화")
TY = ("개념", "계산", "증명", "판단", "적용", "모형", "실습")
MIX = (0.30, 0.45, 0.25)          # js/exam.js의 MIX와 같은 값
SET_MAX = 16
RX_MATH = re.compile(r"\\\((.*?)\\\)|\\\[(.*?)\\\]", re.S)
POLICY = json.loads((ROOT / "exams/policy.json").read_text(encoding="utf-8")) if (ROOT / "exams/policy.json").exists() else {}


def units_of():
    """data/univ.json(빌드 결과, 전 학과 합본)에서 (학과, 과목번호) → (과목 코드, 대단원 번호 목록).
    없으면 옛 js/toc.js를 읽고, 둘 다 없으면 tools/build.py를 먼저 돌리라고 알린다."""
    f = ROOT / "data" / "univ.json"
    if f.exists():
        data = json.loads(f.read_text(encoding="utf-8"))
    elif (ROOT / "js" / "toc.js").exists():
        t = (ROOT / "js" / "toc.js").read_text(encoding="utf-8")
        data = json.loads(t[t.index("=") + 1:].strip().rstrip(";"))
    else:
        sys.exit("data/univ.json이 없습니다. 먼저 python -I -X utf8 tools/build.py를 돌리세요.")
    return {(d["id"], re.sub(r"\D", "", c["code"])): (c["code"], [u["n"] for u in c["units"]]) for d in data for c in d["courses"]}


def math_ok(s):
    """괄호 짝이 맞고, 수식 안에 맨 '<'가 없어야 한다(HTML 태그로 읽혀 수식이 깨진다. &lt;로 쓴다)"""
    return (s.count("\\(") == s.count("\\)") and s.count("\\[") == s.count("\\]")
            and not any("<" in m.group(0) for m in RX_MATH.finditer(s)))


def plain(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s or "")).strip()


def grams(s, k=3):
    s = re.sub(r"[\s\\{}()^_.,·]", "", plain(s))
    return {s[i:i + k] for i in range(max(0, len(s) - k + 1))}


def quotas(n, mix, have):
    """js/exam.js quotas()와 같은 규칙"""
    raw = [m * n for m in mix]
    q = [int(r) for r in raw]
    left = n - sum(q)
    for _, i in sorted(((raw[i] - q[i], i) for i in range(3)), reverse=True):
        if left > 0 and mix[i] > 0:
            q[i] += 1
            left -= 1
    near = [[1, 2], [2, 0], [1, 0]]
    for i in range(3):
        short = q[i] - have[i]
        if short <= 0:
            continue
        q[i] = have[i]
        for j in near[i]:
            t = min(have[j] - q[j], short)
            if t > 0:
                q[j] += t
                short -= t
    return q


def simulate(items, n=12, runs=2000, seed=1):
    """층별 뽑기와 무작위 뽑기의 세트 평균 난이도 (평균, 표준편차)"""
    rnd = random.Random(seed)
    lv = [LV.index(it["lv"]) for it in items if it.get("lv") in LV]
    by = [[x for x in lv if x == i] for i in range(3)]
    n = min(n, len(lv))
    strat, flat = [], []
    for _ in range(runs):
        want = quotas(n, MIX, [len(b) for b in by])
        strat.append(sum((i + 1) * want[i] for i in range(3)) / n)
        flat.append(sum(x + 1 for x in rnd.sample(lv, n)) / n)
    return (statistics.mean(strat), statistics.pstdev(strat)), (statistics.mean(flat), statistics.pstdev(flat))


def check(p, U, sim=False):
    errs, warns = [], []
    raw = p.read_text(encoding="utf-8")
    data = json.loads(raw)
    if "\t" in raw:
        errs.append("탭 문자가 있음(\\t가 깨졌을 수 있음)")
    key = (p.parent.name, p.stem)
    if key not in U:   # 개설되지 않아 사이트에서 뺀 과목(tools/build.py apply_offered). 다시 열리면 쓰이므로 지우지 않는다
        return [], [f"{p.parent.name}/{p.stem}: 개설되지 않아 사이트에서 뺀 과목의 문항 파일 — 빌드에 쓰이지 않음"], None
    code, units = U[key]
    pol = POLICY.get(code, "")
    if pol == "none":
        warns.append("시험 방식이 none(중간·기말 없음)이라 빌드에 쓰이지 않는 문항 파일 — 삭제 대상")
    one = pol in ("fin", "mid")             # 전 범위 시험 하나(기말만·중간만)
    half = len(units) if one else (len(units) + 1) // 2
    items = data.get("items", [])
    seen, n_lv, mid, scope = set(), {k: 0 for k in LV}, 0, {"mid": [], "fin": []}
    for it in items:
        i = it.get("id", "?")
        if i in seen:
            errs.append(f"{i}: id 겹침")
        seen.add(i)
        for f in ("id", "std", "type", "ty", "lv", "q", "sol"):
            if not it.get(f):
                errs.append(f"{i}: {f} 없음")
        m = re.match(rf"{re.escape(code)}-(\d\d)(?:-\d\d)?$", it.get("std", ""))
        if not m or m.group(1) not in units:
            errs.append(f"{i}: std {it.get('std')}가 과목의 대단원에 없음")
        else:
            k = "mid" if units.index(m.group(1)) < half else "fin"
            scope[k].append(it)
            mid += k == "mid"
        if it.get("lv") in LV:
            n_lv[it["lv"]] += 1
        else:
            errs.append(f"{i}: lv {it.get('lv')}")
        if it.get("ty") not in TY:
            warns.append(f"{i}: ty {it.get('ty')}")
        t = it.get("type")
        if t == "mc":
            ch = it.get("choices") or []
            if len(ch) < 4 or not str(it.get("answer", "")).isdigit() or not 1 <= int(it["answer"]) <= len(ch):
                errs.append(f"{i}: 객관식 보기·정답 번호가 맞지 않음")
        elif t in ("short", "free"):
            if not it.get("answer"):
                warns.append(f"{i}: answer(짧은 답) 없음")
        else:
            errs.append(f"{i}: type {t}")
        rb = it.get("rubric")
        if rb is not None and not (isinstance(rb, list) and all(isinstance(r, dict) and isinstance(r.get("pt"), int) and r.get("t") for r in rb)):
            errs.append(f"{i}: rubric은 [{{\"pt\": 정수, \"t\": 글}}] 형식")
        if len(it.get("hints", [])) < 2:
            warns.append(f"{i}: 힌트가 2개 미만")
        for f in ("q", "sol", "answer"):
            if isinstance(it.get(f), str) and not math_ok(it[f]):
                errs.append(f"{i}: {f}의 수식 괄호 짝이 맞지 않거나 수식 안에 맨 '<'가 있음")
        for k, h in enumerate(it.get("hints", []) + it.get("choices", [])):
            if not math_ok(h):
                errs.append(f"{i}: 힌트·보기 {k + 1}의 수식 괄호 짝이 맞지 않거나 수식 안에 맨 '<'가 있음")
        # 난이도 근거 점검: 풀이 분량(글자)과 표시가 크게 어긋나면 다시 보게 한다
        L = len(plain(it.get("sol", "")))
        if it.get("lv") == "심화" and L < 220:
            warns.append(f"{i}: 심화인데 풀이가 짧음({L}자) — 단계·개념 수를 다시 보세요")
        if it.get("lv") == "기본" and L > 700:
            warns.append(f"{i}: 기본인데 풀이가 김({L}자) — 응용이 아닌지 보세요")
    # 서로 거의 같은 문항
    gs = [(it.get("id"), grams(it.get("q", ""))) for it in items]
    for a in range(len(gs)):
        for b in range(a + 1, len(gs)):
            A, B = gs[a][1], gs[b][1]
            if A and B and len(A & B) / len(A | B) > 0.7:
                warns.append(f"{gs[a][0]} ~ {gs[b][0]}: 문제가 거의 같음")
    n = len(seen)
    hard = (n_lv["응용"] + n_lv["심화"]) / n if n else 0
    if n < MIN_N:
        errs.append(f"문항 {n}개 (최소 {MIN_N})")
    if hard < MIN_HARD:
        errs.append(f"응용·심화 {hard:.0%} (최소 {MIN_HARD:.0%})")
    if not one and n and not 0.4 <= mid / n <= 0.6:
        warns.append(f"중간 범위 {mid}/{n}: 반씩이 아님")
    need = quotas(SET_MAX, MIX, [99, 99, 99])
    sims = {}
    for k, lst in scope.items():
        if not lst:
            continue
        have = [sum(1 for it in lst if it.get("lv") == l) for l in LV]
        short = [f"{LV[j]} {have[j]}/{need[j]}" for j in range(3) if have[j] < need[j]]
        if short:
            warns.append(f"{({'fin': '기말', 'mid': '중간'}[pol] if one else {'mid': '중간', 'fin': '기말'}[k])} 범위: {SET_MAX}문제 세트의 층별 몫이 모자람 ({', '.join(short)})")
        if sim:
            sims[k] = simulate(lst)
    return errs, warns, {"course": code, "n": n, "mid": mid, "fin": n - mid, **n_lv, "hard": hard, "pol": pol, "sim": sims}


def main():
    U = units_of()
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    sim = "--sim" in sys.argv
    files = [ROOT / "exams" / f"{a}.json" for a in args] if args else sorted(p for p in (ROOT / "exams").glob("*/*.json"))
    bad, tot = 0, [0, 0]
    for p in files:
        errs, warns, st = check(p, U, sim)
        rel = p.relative_to(ROOT).as_posix()
        if st:
            tot[0] += st["n"]
            tot[1] += st["응용"] + st["심화"]
            split = {"fin": "전 범위 기말", "mid": "전 범위 중간"}.get(st["pol"]) or f'중간 {st["mid"]} · 기말 {st["fin"]}'
            print(f'{rel}: {st["course"]} {st["n"]}문항 ({split}) 기본 {st["기본"]} · 응용 {st["응용"]} · 심화 {st["심화"]} → 응용·심화 {st["hard"]:.0%}')
            for k, ((ms, ss), (mf, sf)) in st["sim"].items():
                print(f"  모의 12문제×2000 [{k}] 평균 난이도 층별 {ms:.2f}±{ss:.2f} / 무작위 {mf:.2f}±{sf:.2f}")
        for e in errs:
            print(f"  오류: {e}")
        for w in warns:
            print(f"  주의: {w}")
        bad += bool(errs)
    if tot[0]:
        print(f"합계 {len(files)}과목 {tot[0]}문항, 응용·심화 {tot[1] / tot[0]:.0%}")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
