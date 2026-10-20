"""풀 목차(outline)와 학과 배치표(place), 화면용 학과 요약(data)을 만든다. docs/card-schema/README.md 4~7절.

tools/build.py가 성취기준 문서와 블록을 읽은 뒤 build(depts, blocks)를 부른다. 1단계에서는 세 가지 모두 빌드 산출물이다.
  outline/<모듈>.json          풀 모듈 하나: 대단원 → 절(성취기준) → 카드 id. 학교와 무관
  place/yonsei/<학과>.json      그 학과가 듣는 과목: 이름·학정번호·학기·이수구분·학점·선수·시험 방식 + 쓰는 풀 모듈
  data/yonsei-<학과>.json       메인·과목·절 페이지가 읽는 학과 요약(과목별 대단원 제목과 성취기준 코드)
  data/pool.json               '교재 전체 보기'용 풀 모듈 색인
모듈 id는 영문 짧은 이름(물리3 → phy3, 공통1 → calc1)이고 페이지 주소가 된다(c/<모듈 id>/<대단원>-<절>.html).
한글 코드(물리3, 물리3-02-01)는 내부 키로만 쓴다.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCHOOL = "yonsei"
SCHOOL_NAME = "연세대"

# 학과 코드 접두어 → 모듈 id 접두어
PREFIX = {"수학": "math", "물리": "phy", "화학": "chem", "천우": "astro", "응통": "stat", "전전": "ee", "기계": "me"}
# 공통 기초 모듈은 내용을 드러내는 이름으로
COMMON_ID = {"공통1": "calc1", "공통2": "calc2", "공통3": "genphy1", "공통4": "genphy2", "공통5": "genchem1",
             "공통6": "genchem2", "공통7": "introstat", "공통8": "adcalc1", "공통9": "adcalc2", "공통10": "comp1",
             "공통11": "comp2", "공통12": "probstat"}

# 학과마다 듣는 공통 기초 과목과 그 학과에서의 이름·학정번호.
# 근거: curricula/univ-common.md '과목 목록' 표(S1 연세대 2026 요람)의 '같은 내용으로 보는 과목'·'쓰는 학과' 열.
# 값이 None이면 공통 과목의 이름·학정번호를 그대로 쓴다.
ENG = {"공통1": ("공학수학(1)", "MAT1011"), "공통2": ("공학수학(2)", "MAT1012"),
       "공통3": ("공학물리학및실험(1)", "PHY1011"), "공통4": ("공학물리학및실험(2)", "PHY1012"),
       "공통5": ("공학화학및실험(1)", "CHE1011"), "공통6": ("공학화학및실험(2)", "CHE1012"),
       "공통8": ("공학수학(3)", "MAT2016"), "공통9": ("공학수학(4)", "MAT2017")}
COMMON_USE = {
    "math": {"공통1": ("미분적분학과벡터해석심화(1)", "MAT1016"), "공통2": ("미분적분학과벡터해석심화(2)", "MAT1017"),
             "공통3": None, "공통4": None, "공통5": None, "공통6": None},
    "phy": {"공통1": None, "공통2": None, "공통3": None, "공통4": None, "공통5": None, "공통6": None, "공통8": None},
    "chem": {"공통1": None, "공통2": None, "공통3": None, "공통4": None, "공통5": None, "공통6": None, "공통10": None, "공통11": None},
    "astro": {"공통1": None, "공통2": None, "공통3": None, "공통4": None, "공통5": None, "공통6": None, "공통8": None, "공통9": None},
    "stat": {"공통7": None},
    "ee": dict(ENG),
    "me": {**ENG, "공통12": None},
}
# 학과 배치에 넣는 공통 과목의 대단원(강의계획서 기준. 근거: curricula/univ-syllabi.md 주차별 진도와
# 2026 변형 과목 강의계획서 MAT1011·1012·2016). 없으면 모듈 전체. "02"는 그 모듈의 대단원, "공통2-02"는 다른 모듈의 대단원.
# - 고등미적분학(2) MAT2002는 복소해석(03~06), 공학수학(4) MAT2017은 푸리에 급수(Kreyszig 11.1~11.6)와 수치 선형대수·그래프(07·08).
# - 공학수학(1) MAT1011은 14주에 외적·직선과 평면·이차곡면까지(공통2-01). 공학수학(2) MAT1012도 11장(공통2-01)부터 다시 시작한다.
# - 공학수학(3) MAT2016은 Kreyszig 7장 선형대수(일차독립·계수·벡터공간 → 공통2-02)로 시작하고 연립 상미분방정식(4장)·푸리에 급수는 없다.
_ENG = {
    "공통1": ["01", "02", "03", "04", "05", "06", "07", "08", "09", "공통2-01", "10"],
    "공통2": ["01", "03", "04", "05", "06", "07", "08"],
    "공통8": ["공통2-02", "01", "02", "04", "05", "03", "07"],
    "공통9": ["공통8-06", "01", "02", "07", "08", "09"],
}
COMMON_UNITS = {("astro", "공통9"): ["01", "02", "03", "04", "05", "06"],
                **{(d, k): v for d in ("ee", "me") for k, v in _ENG.items()}}
# 강의계획서 진도에 없는 대단원: 배치에는 남기되 '보충'으로 표시한다(요람 개요에서 왔거나 다음 과목으로 잇는 단원).
SYLLABUS_OUT = {"공통1": ["10"], "공통2": ["02"], "공통4": ["12"], "공통7": ["10"], "공통8": ["07"],
                "공통9": ["09"], "공통10": ["06"], "공통11": ["05"], "공통12": ["07"]}
# 학과마다 다른 '보충'(위 표 대신 쓴다). 공학수학(3)은 연립 상미분방정식(공통8-03)을 다루지 않는다(행렬·고유값 일부만 7~8장에서).
SUP_BY_DEPT = {(d, "공통8"): ["03", "07"] for d in ("ee", "me")}
# 연세대 학과(메인의 학과 고르기에 이 순서로 보인다)
DEPT_ORDER = ["math", "phy", "chem", "astro", "stat", "ee", "me"]


def module_id(code):
    if code in COMMON_ID:
        return COMMON_ID[code]
    m = re.match(r"([가-힣]+)(\d+)$", code)
    return PREFIX[m.group(1)] + m.group(2)


def outline(c, blocks):
    """파싱한 과목 하나 → 풀 모듈"""
    units = []
    for u in c["units"]:
        secs = [{"code": s["c"], "t": s["t"], "ty": s["ty"], "cards": [b["id"] for b in blocks.get(s["c"], [])]} for s in u["s"]]
        units.append({"n": u["n"], "t": u["t"], "el": u["el"], "secs": secs,
                      "review": [b["id"] for b in blocks.get(f'{c["code"]}-{u["n"]}-R', [])]})
    return {"id": module_id(c["code"]), "code": c["code"], "title": c["name"], "field": c["dept"], "units": units}


PRE_RX = re.compile(r"([가-힣]+?)(\d+(?:·\d+)*)(?!\d)")


def pre_ids(text, known):
    """선수 칸('공통1·2, 물리3')의 과목 코드 → 모듈 id(학과 배치에 있는 것만)"""
    out = []
    for m in PRE_RX.finditer(text or ""):
        for k in m.group(2).split("·"):
            code = m.group(1) + k
            if code in known and known[code] not in out:
                out.append(known[code])
    return out


def build(depts, blocks, policy, out_root=ROOT):
    """depts: build.py가 만든 학과 목록(과목은 finish()를 거친 것). 산출물을 쓰고 학과 요약을 돌려준다."""
    by_code = {c["code"]: c for d in depts for c in d["courses"]}
    names = {d["id"]: d for d in depts}
    odir, pdir, ddir = out_root / "outline", out_root / "place" / SCHOOL, out_root / "data"
    for p in (odir, pdir, ddir):
        p.mkdir(parents=True, exist_ok=True)
        for f in p.glob("*.json"):
            f.unlink()

    mods = {}
    for c in by_code.values():
        o = outline(c, blocks)
        mods[c["code"]] = o
        (odir / f'{o["id"]}.json').write_text(json.dumps(o, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")

    pool = [{"id": o["id"], "code": code, "title": o["title"], "field": o["field"], "y": by_code[code]["y"],
             "no": by_code[code].get("sub") or [],   # 화면에는 내부 코드 대신 학정번호를 보인다
             "units": len(o["units"]), "secs": sum(len(u["secs"]) for u in o["units"]),
             "cards": sum(len(s["cards"]) for u in o["units"] for s in u["secs"]) + sum(len(u["review"]) for u in o["units"]),
             "q": by_code[code].get("bank", 0), **({"gone": True} if by_code[code].get("gone") else {})}
            for code, o in mods.items()]
    fields = [{"id": d["id"], "name": d["name"]} for d in depts]
    (ddir / "pool.json").write_text(json.dumps({"fields": fields, "modules": pool}, ensure_ascii=False, separators=(",", ":")),
                                    encoding="utf-8", newline="\n")

    summary = {}
    for did in DEPT_ORDER:
        d = names[did]
        rows = []
        for code, ov in COMMON_USE[did].items():                      # 공통 기초를 그 학과의 이름으로
            c = by_code.get(code)
            if not c:
                continue
            name, no = ov if ov else (c["name"], (c["sub"] or [""])[0])
            rows.append((c, name, no))
        # 최근 3년 연세대 미개설 과목(gone)은 학과 배치에 넣지 않는다(교재 전체 보기에만 '최근 미개설'로)
        rows += [(c, c["name"], (c["sub"] or [""])[0]) for c in d["courses"] if not c.get("gone")]
        known = {c["code"]: module_id(c["code"]) for c, _, _ in rows}
        names_in_dept = {c["code"]: name for c, name, _ in rows}
        place = {"school": SCHOOL_NAME, "dept": d["name"], "courses": []}
        data = {"school": SCHOOL_NAME, "id": did, "name": d["name"], "short": d["short"], "college": d["college"], "courses": []}
        for c, name, no in rows:
            mid = module_id(c["code"])
            exam = {"fin": "fin", "none": "none"}.get(policy.get(c["code"], ""), "mid+fin")
            pre = pre_ids(c.get("pre"), known)
            pick = COMMON_UNITS.get((did, c["code"])) or [u["n"] for u in mods[c["code"]]["units"]]
            sup = SUP_BY_DEPT.get((did, c["code"]), SYLLABUS_OUT.get(c["code"], []))
            units, groups = [], []                  # groups: 배치표의 {"from", "n"} 묶음(모듈이 바뀔 때마다 새 묶음)
            for key in pick:
                src, n = key.rsplit("-", 1) if "-" in key else (c["code"], key)
                u = next(x for x in mods[src]["units"] if x["n"] == n)
                units.append((u, src))
                if not groups or groups[-1]["from"] != src:
                    groups.append({"from": src, "n": []})
                groups[-1]["n"].append(n)
            if len(groups) == 1 and len(units) == len(mods[c["code"]]["units"]):
                del groups[0]["n"]                  # 모듈 전체
            sup = [n for n in sup if n in pick]
            place["courses"].append({"id": mid, "name": name, "no": no, "y": c["y"], "sem": c["sem"], "kind": c["kind"],
                                     "cr": c["cr"], "units": groups, **({"sup": sup} if sup else {}),
                                     "pre": pre, "exam": exam})
            data["courses"].append({
                "id": mid, "code": c["code"], "name": name, "no": no, "y": c["y"], "sem": c["sem"], "kind": c["kind"], "cr": c["cr"],
                "extra": bool(c.get("onlyU")), "pre": pre, "preT": c.get("pre", ""), "hours": c.get("hours", ""), "books": c.get("books", ""),
                "exam": exam, "bank": c.get("bank", 0),
                "units": [{"n": u["n"], "t": u["t"], "el": u["el"], "s": [s["code"] for s in u["secs"]], "st": [s["t"] for s in u["secs"]],
                           "cards": sum(len(s["cards"]) for s in u["secs"]) + len(u["review"]),
                           # 다른 모듈의 대단원이면 그 모듈 id와 이 학과에서의 과목 이름(화면의 링크와 '○○ 단원' 표시)
                           **({"m": module_id(src), "mn": names_in_dept.get(src, mods[src]["title"])} if src != c["code"] else {}),
                           **({"sup": True} if src == c["code"] and u["n"] in sup else {})} for u, src in units],
            })
        (pdir / f"{did}.json").write_text(json.dumps(place, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")
        (ddir / f"{SCHOOL}-{did}.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8", newline="\n")
        summary[did] = data
    (ddir / f"{SCHOOL}.json").write_text(json.dumps({"school": SCHOOL_NAME, "depts": [
        {"id": did, "name": names[did]["name"], "short": names[did]["short"], "college": names[did]["college"],
         "courses": len(summary[did]["courses"])} for did in DEPT_ORDER]}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8", newline="\n")
    return summary
