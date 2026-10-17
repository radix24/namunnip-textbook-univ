"""curricula/univ-*.md (성취기준 설계 문서) → js/toc.js (window.UNIV)

설계 문서의 형식은 curricula/univ-curriculum.md에 있다.
  ### 코드. 과목명 (학정번호)        과목
  | 항목 | 값 | 근거 |               과목 머리 표
  #### 01. 대단원 〔근거〕             대단원
  학습 요소: ...
  - [코드-01-01] 문장 〈유형〉         성취기준
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "curricula"
OUT = ROOT / "js" / "toc.js"

# 학과: id, 이름, 짧은 이름, 파일, 소속
DEPTS = [
    ("common", "공통 기초", "공통", "univ-common.md", "1~2학년 공통"),
    ("math", "수학과", "수학", "univ-math.md", "이과대학"),
    ("phy", "물리학과", "물리", "univ-physics.md", "이과대학"),
    ("chem", "화학과", "화학", "univ-chem.md", "이과대학"),
    ("astro", "천문우주학과", "천문우주", "univ-astro.md", "이과대학"),
    ("stat", "응용통계학과", "응용통계", "univ-stats.md", "상경대학"),
    ("ee", "전기전자공학부", "전기전자", "univ-ee.md", "공과대학"),
    ("me", "기계공학부", "기계", "univ-me.md", "공과대학"),
]

RE_COURSE = re.compile(r"^### ([가-힣]+\d+)\. (.+)$")
RE_ROW = re.compile(r"^\| (.+?) \| (.*?) \| (.*?) \|\s*$")
RE_UNIT = re.compile(r"^#### (\d\d)\. (.+?)(?: 〔(.+?)〕)?\s*$")
RE_STD = re.compile(r"^- \[([가-힣]+\d+-\d\d-\d\d)\] (.+?)(?: 〈(.+?)〉)?\s*$")
RE_YS = [
    re.compile(r"(\d)-(\d)"),
    re.compile(r"(\d)(?:·\d)*학년\s*(\d)(?:,(\d))?학기"),
]


def year_sem(text):
    """'2-1', '3·4학년 1학기', '2학년 1,2학기' → (학년, 학기 문자열)"""
    for rx in RE_YS:
        m = rx.search(text or "")
        if m:
            y, s = int(m.group(1)), m.group(2)
            if m.lastindex and m.lastindex >= 3 and m.group(3):
                s = f"{s}·{m.group(3)}"
            return y, s
    return 0, ""


def parse(path, dept_id):
    courses, cur, unit = [], None, None
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.rstrip()
        m = RE_COURSE.match(line)
        if m:
            code, rest = m.group(1), m.group(2)
            name = re.split(r" \(", rest, 1)[0].split(" / ")[0]
            cur = {
                "code": code, "name": name,
                "sub": re.findall(r"\b([A-Z]{3}\d{4})\b", rest),
                "dept": dept_id, "row": {}, "units": [],
                "pre": "", "hours": "", "books": "",
            }
            courses.append(cur)
            unit = None
            continue
        if cur is None:
            continue
        if line.startswith("## "):          # 과목 밖의 절(학년 구분 등)
            unit = None
            continue
        m = RE_UNIT.match(line)
        if m:
            unit = {"n": m.group(1), "t": m.group(2), "src": m.group(3) or "", "el": "", "s": []}
            cur["units"].append(unit)
            continue
        if unit is None:
            m = RE_ROW.match(line)
            if m and m.group(1) not in ("항목", "---"):
                cur["row"].setdefault(m.group(1), m.group(2))
            elif line.startswith("- 선수:"):
                cur["pre"] = line[len("- 선수:"):].strip()
            elif line.startswith("- 학습 시간:"):
                cur["hours"] = line[len("- 학습 시간:"):].strip()
            elif re.match(r"^- (추천 )?교재", line):
                cur["books"] = line.split(":", 1)[1].strip() if ":" in line else ""
            continue
        if line.startswith("학습 요소:"):
            unit["el"] = line[len("학습 요소:"):].strip()
            continue
        m = RE_STD.match(line)
        if m:
            unit["s"].append({"c": m.group(1), "t": m.group(2), "ty": m.group(3) or ""})
    return courses


def finish(c):
    row = c.pop("row")
    ys = row.get("학년-학기") or row.get("배치") or ""
    c["y"], c["sem"] = year_sem(ys)
    kind = row.get("종별, 학점") or row.get("종별") or ""
    if not kind and c["dept"] == "common":
        kind = "대학교양" if "대학교양" in ys else "전공기초"
    c["kind"] = re.split(r"[,(]", kind)[0].strip()
    m = re.search(r"(?:^|, )(\d)(?:,|$| )", kind)
    c["cr"] = int(m.group(1)) if m else 3
    op = row.get("2026 개설", "")
    c["open"] = op
    c["closed"] = "미개설" in op or "개설되지 않음" in op
    yoram = row.get("요람", "")
    c["onlyU"] = ("없음" in yoram or "찾지 못함" in yoram)
    c["yoram"] = next((v for k, v in row.items() if k.startswith("요람 개요")), "")
    c["handb"] = next((v for k, v in row.items() if k.startswith("수강편람 개요") or k.endswith("수강편람 개요")), "")
    return c


def main():
    out, total = [], {"courses": 0, "units": 0, "stds": 0}
    for did, name, short, fname, college in DEPTS:
        cs = [finish(c) for c in parse(SRC / fname, did)]
        out.append({"id": did, "name": name, "short": short, "college": college, "courses": cs})
        total["courses"] += len(cs)
        total["units"] += sum(len(c["units"]) for c in cs)
        total["stds"] += sum(len(u["s"]) for c in cs for u in c["units"])
        bad = [c["code"] for c in cs if not c["y"]]
        if bad:
            print(f"경고: {did} 학년을 못 읽은 과목 {bad}", file=sys.stderr)
    js = "/* tools/build.py가 curricula/univ-*.md에서 만든다. 직접 고치지 않는다. */\n"
    js += "window.UNIV = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n"
    OUT.write_text(js, encoding="utf-8", newline="\n")
    print(f"js/toc.js: 학과 {len(out)} · 과목 {total['courses']} · 대단원 {total['units']} · 성취기준 {total['stds']}")


if __name__ == "__main__":
    main()
