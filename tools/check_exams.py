"""exams/<학과>/<과목번호>.json (시험 전용 문항) 검사

  python -I -X utf8 tools/check_exams.py            모든 파일
  python -I -X utf8 tools/check_exams.py phy/1      한 과목

검사: 형식(필수 필드, type별 필드, id 겹침), 성취기준 코드가 과목의 대단원에 있는지,
과목당 60문항 이상, 응용·심화 60% 이상, 중간(앞 절반 대단원)·기말 비율, 수식 괄호 짝, 탭 문자.
형식은 docs/card-schema/README.md의 '시험 문항'을 따른다.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MIN_N, MIN_HARD = 60, 0.6
LV = ("기본", "응용", "심화")
TY = ("개념", "계산", "증명", "판단", "적용", "모형", "실습")


def units_of():
    """js/toc.js(빌드 결과)에서 과목 코드 → 대단원 번호 목록"""
    t = (ROOT / "js" / "toc.js").read_text(encoding="utf-8")
    data = json.loads(t[t.index("=") + 1:].strip().rstrip(";"))
    return {c["code"]: (d["id"], [u["n"] for u in c["units"]]) for d in data for c in d["courses"]}


RX_MATH = re.compile(r"\\\((.*?)\\\)|\\\[(.*?)\\\]", re.S)


def math_ok(s):
    """괄호 짝이 맞고, 수식 안에 맨 '<'가 없어야 한다(HTML 태그로 읽혀 수식이 깨진다. &lt;로 쓴다)"""
    return (s.count("\\(") == s.count("\\)") and s.count("\\[") == s.count("\\]")
            and not any("<" in m.group(0) for m in RX_MATH.finditer(s)))


def check(p, U):
    errs, warns = [], []
    data = json.loads(p.read_text(encoding="utf-8"))
    raw = p.read_text(encoding="utf-8")
    if "\t" in raw:
        errs.append("탭 문자가 있음(\\t가 깨졌을 수 있음)")
    code = data.get("course")
    if data.get("kind") != "exam" or code not in U:
        return [f"kind/course가 맞지 않음 ({data.get('kind')}, {code})"], [], None
    dept, units = U[code]
    if p.parent.name != dept or p.stem != re.sub(r"\D", "", code):
        errs.append(f"파일 위치가 exams/{dept}/{re.sub(chr(92) + 'D', '', code)}.json이 아님")
    half = (len(units) + 1) // 2
    seen, n_lv, mid = set(), {k: 0 for k in LV}, 0
    for it in data.get("items", []):
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
        elif units.index(m.group(1)) < half:
            mid += 1
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
        if len(it.get("hints", [])) < 2:
            warns.append(f"{i}: 힌트가 2개 미만")
        for f in ("q", "sol", "answer"):
            if isinstance(it.get(f), str) and not math_ok(it[f]):
                errs.append(f"{i}: {f}의 수식 괄호 짝이 맞지 않거나 수식 안에 맨 '<'가 있음")
        for k, h in enumerate(it.get("hints", []) + it.get("choices", [])):
            if not math_ok(h):
                errs.append(f"{i}: 힌트·보기 {k + 1}의 수식 괄호 짝이 맞지 않거나 수식 안에 맨 '<'가 있음")
    n = len(seen)
    hard = (n_lv["응용"] + n_lv["심화"]) / n if n else 0
    if n < MIN_N:
        errs.append(f"문항 {n}개 (최소 {MIN_N})")
    if hard < MIN_HARD:
        errs.append(f"응용·심화 {hard:.0%} (최소 {MIN_HARD:.0%})")
    if n and not 0.4 <= mid / n <= 0.6:
        warns.append(f"중간 범위 {mid}/{n}: 반씩이 아님")
    return errs, warns, {"course": code, "n": n, "mid": mid, "fin": n - mid, **n_lv, "hard": hard}


def main():
    U = units_of()
    args = sys.argv[1:]
    files = [ROOT / "exams" / f"{a}.json" for a in args] if args else sorted((ROOT / "exams").glob("*/*.json"))
    bad, tot = 0, [0, 0]
    for p in files:
        errs, warns, st = check(p, U)
        rel = p.relative_to(ROOT).as_posix()
        if st:
            tot[0] += st["n"]
            tot[1] += st["응용"] + st["심화"]
            print(f'{rel}: {st["course"]} {st["n"]}문항 (중간 {st["mid"]} · 기말 {st["fin"]}) 기본 {st["기본"]} · 응용 {st["응용"]} · 심화 {st["심화"]} → 응용·심화 {st["hard"]:.0%}')
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
