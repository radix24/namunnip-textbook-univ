"""curricula/univ-*.md (성취기준 설계 문서) → js/toc.js (window.UNIV)

설계 문서의 형식은 curricula/univ-curriculum.md에 있다.
  ### 코드. 과목명 (학정번호)        과목
  | 항목 | 값 | 근거 |               과목 머리 표
  #### 01. 대단원 〔근거〕             대단원
  학습 요소: ...
  - [코드-01-01] 문장 〈유형〉 《서울대 연세대》   성취기준 (《》 = 그 내용 요소가 있는 대학)
과목 머리 표의 '| 개설 대학 | 서울대(과목명), KAIST(과목명) | 출처 |' 줄은 그 과목을 여는 대학이다.
자체 시험: python -I -X utf8 tools/build.py --selftest
시험용 원본 폴더: python -I -X utf8 tools/build.py --src 폴더  (curricula/ 대신 그 폴더의 univ-*.md를 읽는다)
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
RE_STD = re.compile(r"^- \[([가-힣]+\d+-\d\d-\d\d)\] (.+?)(?: 〈(.+?)〉)?(?: 《(.+?)》)?\s*$")   # 《서울대 연세대 …》: 그 내용 요소가 있는 대학
# 학교별 보기에 쓰는 대학(이 순서로 보인다). 경희대는 천문우주학과만 비교한다
UNIS = ["서울대", "연세대", "고려대", "KAIST", "POSTECH", "서강대", "성균관대", "한양대", "경희대"]
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
            u = (m.group(4) or "").split()
            bad = [x for x in u if x not in UNIS]
            if bad:
                print(f"경고: {m.group(1)}의 모르는 대학 표시 {bad}", file=sys.stderr)
            unit["s"].append({"c": m.group(1), "t": m.group(2), "ty": m.group(3) or "", "u": [x for x in UNIS if x in u]})
    return courses


def uni_names(text, code=""):
    """'서울대(해석학1), 연세대(해석개론), KAIST(MAS241 해석학 I)' → ["서울대", "연세대", "KAIST"] (UNIS 순서)"""
    out, depth, cur = [], 0, ""
    for ch in (text or "") + ",":
        if ch in "(（":
            depth += 1
        elif ch in ")）":
            depth = max(0, depth - 1)
        if ch in ",，、" and depth == 0:
            name = re.split(r"[(（]", cur, 1)[0].strip()
            if name and name not in ("-", "—", "없음"):
                if name in UNIS:
                    out.append(name)
                else:
                    print(f"경고: {code} 개설 대학의 모르는 이름 {name!r}", file=sys.stderr)
            cur = ""
        else:
            cur += ch
    return [x for x in UNIS if x in out]


def apply_unis(c):
    """과목의 대학(c.unis)과 성취기준의 대학(s.u)을 맞춘다.
    - 과목 대학 = '개설 대학' 줄 ∪ 성취기준 표시 전부 (성취기준에만 표시해도 과목이 그 대학에 보인다)
    - 과목 안에 《》 표시가 하나도 없으면 성취기준은 과목의 대학을 물려받는다(과목 단위로만 비교한 경우)
    - 표시가 전혀 없으면 둘 다 빈 목록 = '미표시'. 연세대로 여기지 않는다"""
    stds = [s for u in c["units"] for s in u["s"]]
    own = uni_names(c.get("unis_raw", ""), c["code"])
    marked = any(s["u"] for s in stds)
    if not marked:
        for s in stds:
            s["u"] = list(own)
    elif own:
        extra = sorted({x for s in stds for x in s["u"] if x not in own})
        if extra:
            print(f"경고: {c['code']} 성취기준에만 있는 대학 {extra} (개설 대학 줄에 없음)", file=sys.stderr)
    c["unis"] = [x for x in UNIS if x in own or any(x in s["u"] for s in stds)]
    return c


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
    c["unis_raw"] = row.get("개설 대학", "")
    apply_unis(c)
    c["unisT"] = c.pop("unis_raw")      # 과목 목차의 '개설 대학' 줄(대학별 과목명 그대로)
    return c


# ───── 블록(카드) ─────
RE_HEAD = re.compile(r"^\s*<!--block\s*(\{.*?\})\s*-->", re.S)
RE_STYLE = re.compile(r"<style>(.*?)</style>", re.S)


def load_blocks():
    """blocks/**/*.html → {"공통1-02-01": [블록, …], "공통1-02-R": [...]} (절 코드별, order 순)
    머리 JSON의 "sec"는 성취기준 코드(= 절) 또는 "<과목>-<대단원>-R"(단원 마무리)."""
    by_unit = {}
    for p in sorted((ROOT / "blocks").rglob("*.html")):
        text = p.read_text(encoding="utf-8")
        m = RE_HEAD.match(text)
        if not m:
            print(f"경고: 블록 머리 없음 {p.relative_to(ROOT)}", file=sys.stderr)
            continue
        meta = json.loads(m.group(1))
        body = text[m.end():]
        styles = "\n".join(s.strip() for s in RE_STYLE.findall(body))
        body = RE_STYLE.sub("", body).strip()
        am = re.search(r'<article[^>]*\bid="([^"]+)"', body)
        if not am or am.group(1) != p.stem:
            print(f"경고: 블록 id가 파일 이름과 다름 {p.relative_to(ROOT)}", file=sys.stderr)
        kind = re.search(r'data-kind="([^"]+)"', body)
        stds = re.search(r'data-std="([^"]+)"', body)
        title = re.search(r"<h2>(.*?)</h2>", body, re.S)
        if "sec" not in meta:
            print(f"경고: 블록 머리에 sec 없음 {p.relative_to(ROOT)}", file=sys.stderr)
            continue
        blk = {
            "id": p.stem, "sec": meta["sec"], "order": meta.get("order", 100),
            "scripts": meta.get("scripts", []), "style": styles, "html": body,
            "kind": kind.group(1) if kind else "탐구",
            "std": stds.group(1).split() if stds else [],
            "title": re.sub(r"<[^>]+>", "", title.group(1)).strip() if title else p.stem,
        }
        by_unit.setdefault(meta["sec"], []).append(blk)
    for v in by_unit.values():
        v.sort(key=lambda b: (b["order"], b["id"]))
    return by_unit


# ───── 페이지 ─────
def esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def md(s):
    return re.sub(r"\*([^*]+)\*", r"<i>\1</i>", esc(s))


THEME_BTN = ('<button type="button" class="theme-btn" aria-label="다크 모드" aria-pressed="false" title="다크 모드 켜고 끄기">'
             '<svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
             '<svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>')


def page(rel, title, desc, body, extra_head="", scripts=(), back=("./", "← 과목 목차"), record=None, body_attrs=""):
    head_js = ('(function(){var d=document.documentElement,q=/[?&]theme=(dark|light)\\b/.exec(location.search),t=q&&q[1];'
               'if(!t)try{t=localStorage.getItem("quri-theme")}catch(e){}if(t!=="dark"&&t!=="light")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";'
               'd.dataset.theme=t;if(t==="dark")document.querySelector(\'meta[name="theme-color"]\').content="#12131c"})()')
    js = "\n".join(f'<script src="{rel}{s}"></script>' for s in scripts)
    rec = f" data-rec='{esc(json.dumps(record, ensure_ascii=False))}'" if record else ""
    return f"""<!doctype html>
<!-- 자동 생성: python -I tools/build.py — 직접 고치지 말고 blocks/ 와 curricula/ 를 고칠 것 -->
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)} — QURI</title>
  <meta name="description" content="{esc(desc)}">
  <link rel="icon" href="{rel}assets/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="{rel}assets/icons/apple-touch-icon.png">
  <link rel="manifest" href="{rel}manifest.webmanifest">
  <meta name="theme-color" content="#f5f5f2">
  <script>{head_js}</script>
  <meta name="apple-mobile-web-app-title" content="QURI">
  <link rel="stylesheet" href="{rel}css/fonts.css">
  <link rel="stylesheet" href="{rel}css/tb.css">
  <link rel="stylesheet" href="{rel}css/quri.css">
  <link rel="stylesheet" href="{rel}css/qcard.css">
  <link rel="stylesheet" href="{rel}css/qtext.css">
  <link rel="stylesheet" href="{rel}assets/katex/katex.min.css">{extra_head}
</head>
<body{rec}{body_attrs}>

<header class="top">
  <a class="brand" href="{rel}"><svg class="brand-mark"><use href="#nm"/></svg><span class="q-name">QURI</span></a>
  <div class="top-right"><a href="{rel}record.html">학습 기록</a><a href="{back[0]}">{back[1]}</a>{THEME_BTN}</div>
</header>

<main class="wrap">
{body}
  <footer class="site-foot">
    <p class="foot-org"><a class="foot-home" href="https://nmnp.kr"><svg class="brand-mark" aria-hidden="true"><use href="#nm"/></svg><b>나뭇잎</b><span class="mono">nmnp.kr</span></a><a class="foot-mail mono" href="mailto:contact@nmnp.kr">contact@nmnp.kr</a></p>
    <p class="mono small">QURI · 큐리 · 질문에서 증명까지</p>
    <p class="mono small dim">과목·대단원·성취기준·카드는 QURI가 만들었습니다.</p>
  </footer>
</main>

<script src="{rel}assets/katex/katex.min.js"></script>
<script src="{rel}js/core.js"></script>
{js}
<script src="{rel}js/math.js"></script>
<script src="{rel}js/progress.js"></script>
</body>
</html>
"""


def num(code):
    return re.match(r"[가-힣]+(\d+)", code).group(1)


LIEUL_STEM = {"풀": "풀기", "만들": "만들기", "알": "알기", "열": "열기", "늘": "늘기", "줄": "줄기", "벌": "벌기"}


def sec_title(std_text):
    """성취기준 문장 → 절 제목. '…을 증명할 수 있다.' → '…을 증명하기'"""
    t = std_text.strip().rstrip(".")
    m = re.match(r"^(.*?)(\S+) 수 있다$", t)
    if not m:
        return t
    head, verb = m.group(1), m.group(2)
    if verb in LIEUL_STEM:
        return head + LIEUL_STEM[verb]
    if verb.endswith("을") and len(verb) > 1:          # 찾을, 읽을, 얻을 → 찾기
        return head + verb[:-1] + "기"
    last = verb[-1]
    code = ord(last) - 0xAC00
    if 0 <= code < 11172 and code % 28 == 8:           # 받침 ㄹ: 그릴 → 그리기, 할 → 하기, 낼 → 내기
        return head + verb[:-1] + chr(ord(last) - 8) + "기"
    return t


def ty_span(t):
    return f'<span class="ty mono" data-ty="{esc(t)}">{esc(t)}</span>' if t else ""


def uni_span(us):
    """성취기준 옆의 작은 대학 표시(회색). 표시가 없으면 '미표시'라고 쓰지 않고 비워 둔다"""
    return f'<span class="unis mono" title="이 내용이 있는 대학">{" · ".join(esc(x) for x in us)}</span>' if us else ""


def uni_attr(us):
    """학교별 보기(js/core.js)가 읽는 data-u. 빈 값 = 미표시(전체 보기에서만 보인다)"""
    return f' data-u="{esc(" ".join(us))}"'


def unit_unis(u):
    return [x for x in UNIS if any(x in s["u"] for s in u["s"])]


def render_card(b, no, std_href):
    """번호, 유형 표시, 다루는 성취기준 줄, 학습 기록 칸을 넣는다"""
    h = b["html"]
    h = h.replace('<span class="no"></span>', f'<span class="no">{no}</span>', 1)
    if b["kind"]:
        h = h.replace("<h2>", f'<h2><span class="q-badge">{esc(b["kind"])}</span>', 1)
    if b["std"]:
        links = " ".join(f'<a href="{std_href(s)}">[{esc(s)}]</a>' for s in b["std"])
        h = re.sub(r"(</header>)", rf'\1\n  <p class="q-stds mono"><span>다루는 성취기준</span> {links}</p>', h, count=1)
    seen = (f'\n  <div class="q-seen"><button type="button" class="q-seen-btn" data-card="{esc(b["id"])}" aria-pressed="false">'
            f'<span class="box" aria-hidden="true"></span><span class="lb">이 카드를 끝까지 공부했어요</span></button></div>\n</article>')
    i = h.rfind("</article>")
    return h[:i] + seen + h[i + len("</article>"):] if i >= 0 else h


ENV_KIND = r"(정의|정리|예제|공리|따름정리|보조정리)"


def renumber(h, secno, hstart=0, estart=0):
    """본문의 번호를 절 번호에 맞춰 다시 매긴다. 절이 옮겨져도 번호가 맞도록 블록 안의 번호는 무시한다.
    소절 제목(h3 .no)은 secno.1, secno.2 …, 정의·정리·예제는 secno.1 … 차례로. 본문 속 참조도 같은 대응으로 바꾼다."""
    i = hstart

    def h3(m):
        nonlocal i
        i += 1
        return f'<h3><span class="no">{secno}.{i}</span>'

    h = re.sub(r'<h3><span class="no">[\d.]+</span>', h3, h)
    k, mp = estart, {}
    for m in re.finditer(r'<span class="lb">' + ENV_KIND + r" (\d+(?:\.\d+)+)", h):
        if m.group(2) not in mp:
            k += 1
            mp[m.group(2)] = f"{secno}.{k}"
    if mp:
        h = re.sub(ENV_KIND + r" (\d+(?:\.\d+){2})(?![\d.]*\d)", lambda m: f"{m.group(1)} {mp.get(m.group(2), m.group(2))}", h)
    return h, i, k


def render_text(b, secno=None):
    """본문(전공서적식) 블록 → 책 지면. 카드 머리는 페이지 제목이 대신하므로 빼고, 소절 제목에 앵커를 단다.
    돌려주는 값: (html, [(앵커, 번호, 소절 제목)], (소절 수, 정의·정리 수))"""
    h = b["html"]
    cnt = (0, 0)
    if secno:
        h, ci, ck = renumber(h, secno)
        cnt = (ci, ck)
    h = re.sub(r"\s*<header class=\"card-head\">.*?</header>", "", h, count=1, flags=re.S)
    h = h.replace('class="card q-card"', 'class="q-card tb-page"', 1)
    subs = []

    def anchor(m):
        no, title = m.group(1), m.group(2)
        aid = "s" + no.replace(".", "-")
        subs.append((aid, no, re.sub(r"<[^>]+>", "", title).strip()))
        return f'<h3 id="{aid}"><span class="no">{no}</span>{title}</h3>'

    h = re.sub(r'<h3><span class="no">([\d.]+)</span>(.*?)</h3>', anchor, h)
    seen = (f'\n  <div class="q-seen"><button type="button" class="q-seen-btn" data-card="{esc(b["id"])}" data-kind="본문" aria-pressed="false">'
            f'<span class="box" aria-hidden="true"></span><span class="lb">이 절의 본문을 끝까지 읽었어요</span></button></div>\n</article>')
    i = h.rfind("</article>")
    return (h[:i] + seen + h[i + len("</article>"):] if i >= 0 else h), subs, cnt


CODE = re.compile(r"^[가-힣]+\d+-\d\d(?:-\d\d)?$")


def build_index(depts, blocks):
    """성취기준·대단원 코드 → 페이지 경로와 이름 (학과를 넘나드는 링크용)"""
    idx = {}
    for d in depts:
        for c in d["courses"]:
            base = f'c/{d["id"]}/{num(c["code"])}/'
            for u in c["units"]:
                un = int(u["n"])
                idx[f'{c["code"]}-{u["n"]}'] = {"path": base + f'{u["n"]}.html', "course": c["code"], "cname": c["name"],
                                                "no": f"{un}", "title": u["t"], "unit": True}
                for k, s in enumerate(u["s"], 1):
                    tb = next((b for b in blocks.get(s["c"], []) if b["kind"] == "본문"), None)
                    idx[s["c"]] = {"path": base + f'{u["n"]}-{k:02d}.html', "course": c["code"], "cname": c["name"],
                                   "no": f"{un}.{k}", "title": tb["title"] if tb else sec_title(s["t"]), "unit": False}
    return idx


def load_links(idx):
    """curricula/univ-prereq.md 7절 연결표 → {"pre": 대상→[선수], "post": 선수→[대상]}"""
    f = SRC / "univ-prereq.md"
    pre, post = {}, {}
    if not f.exists():
        return {"pre": pre, "post": post}
    for line in f.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^- (\S+) ← (.+)$", line.strip())
        if not m:
            continue
        tgt = m.group(1)
        if tgt not in idx:
            print(f"경고: 연결표의 없는 코드 {tgt}", file=sys.stderr)
            continue
        items = []
        for it in re.sub(r"\([^)]*\)", "", m.group(2)).split(","):
            it = it.strip()
            if not it:
                continue
            if it == tgt:
                continue
            if it.startswith("고교:"):
                items.append(it)
            elif CODE.match(it) and it in idx:
                items.append(it)
                if tgt not in post.setdefault(it, []):
                    post[it].append(tgt)
            else:
                print(f"경고: 연결표 {tgt}의 알 수 없는 선수 {it}", file=sys.stderr)
        lst = pre.setdefault(tgt, [])
        lst.extend(x for x in items if x not in lst)
    return {"pre": pre, "post": post}


def links_box(code, unit_code, links, idx, rel, here_course):
    """절(또는 대단원) 페이지의 '먼저 볼 것 / 이 절을 쓰는 곳' 상자"""
    def item(c):
        if c.startswith("고교:"):
            return f'<li class="hs"><span class="mono">고교</span><span>{esc(c[3:].strip())}</span></li>'
        x = idx[c]
        where = "" if x["course"] == here_course else f'{esc(x["cname"])} '
        kind = "대단원 " if x["unit"] else ""
        return (f'<li><a href="{rel}{x["path"]}"><span class="mono">{kind}{x["no"]}</span>'   # 과목 코드(공통1) 대신 과목 이름을 뒤에 쓴다
                f'<span>{where}<b>{esc(x["title"])}</b></span></a></li>')

    pre = list(links["pre"].get(code, []))
    if unit_code and unit_code != code:
        pre += [p for p in links["pre"].get(unit_code, []) if p not in pre and p != code]
    post = [t for t in links["post"].get(code, [])]
    if not pre and not post:
        return ""
    noun = "단원" if idx.get(code, {}).get("unit") else "절"
    cols = []
    if pre:
        cols.append(f'<div><h3>먼저 볼 것</h3><ul>{"".join(item(c) for c in pre)}</ul></div>')
    if post:
        cols.append(f'<div><h3>이 {noun}을 쓰는 곳</h3><ul>{"".join(item(c) for c in post)}</ul></div>')
    return (f'\n    <aside class="q-links" aria-label="선수와 후속">\n      <p class="q-links-title">이 {noun}의 앞과 뒤</p>'
            f'\n      <div class="q-links-cols">{"".join(cols)}</div>\n    </aside>')


def collect(blist):
    styles = "\n".join(b["style"] for b in blist if b["style"])
    scripts = []
    for b in blist:
        for s in b["scripts"]:
            if s not in scripts:
                scripts.append(s)
    return (f"\n  <style>\n{styles}\n  </style>" if styles else ""), scripts


# ───── 문제은행(시험 연습) ─────
# 이미 있는 문제를 과목별로 모은다. 출처 세 가지:
#   R  단원 마무리 연습 카드(<과목>-<대단원>-R)의 ol.q-exlist > li  (p.q-prob, 힌트 1·2, details.q-sol)
#   ex 절의 예제 카드: p.q-prob, 힌트 1 = 출발점·전략 구역, 힌트 2 = 풀이 첫 단계, 풀이 = 풀이 구역 + 검산
#   tb 본문 끝의 div.tb-exercises > ol > li  (p.tb-lv = 기본·응용·심화, 힌트, 답)
# 마크업이 조금씩 달라도 받아 준다: 요약 이름이 '힌트…'면 힌트, '풀이·답·답안'이거나 q-sol이면 풀이.
RE_DET = re.compile(r"<details\b([^>]*)>\s*<summary>(.*?)</summary>(.*)</details>\s*$", re.S)
EX_HINT_H3 = ("출발점", "전략", "아이디어", "근거", "생각", "핵심 생각", "방법", "방법과 근거", "도구", "쓰는 것", "모형과 가정", "모형")
EX_SOL_H3 = ("풀이", "증명", "정리된 증명", "유도")
BANK_TAGS = ("개념", "계산", "증명", "판단", "도전", "적용", "모형")


def top_elems(html, tag):
    """html 안에서 바깥쪽(중첩되지 않은) <tag …>…</tag> 들의 (시작, 끝, 여는 태그, 안쪽 html)"""
    out, depth, start, open_tag, inner0 = [], 0, 0, "", 0
    for m in re.finditer(rf"<(/?){tag}\b[^>]*>", html):
        if not m.group(1):
            if depth == 0:
                start, open_tag, inner0 = m.start(), m.group(0), m.end()
            depth += 1
        elif depth:
            depth -= 1
            if depth == 0:
                out.append((start, m.end(), open_tag, html[inner0:m.start()]))
    return out


def find_elem(html, tag, cls):
    """class에 cls가 든 첫 <tag> 요소(중첩을 세어서)의 (여는 태그, 안쪽 html) 또는 None"""
    m = re.search(rf'<{tag}\b[^>]*class="[^"]*\b{cls}\b[^"]*"[^>]*>', html)
    if not m:
        return None
    for s, e, ot, inner in top_elems(html[m.start():], tag):
        return ot, inner
    return None


def split_li(inner):
    """연습 문제 한 칸 → (문제 html, [힌트 html], 풀이 html). 풀이가 없으면 None"""
    dets = top_elems(inner, "details")
    if not dets:
        return None
    prob = inner[:dets[0][0]].strip()
    hints, sol = [], None
    for s, e, ot, _ in dets:
        m = RE_DET.match(inner[s:e])
        if not m:
            continue
        summ = re.sub(r"<[^>]+>", "", m.group(2)).strip()
        body = m.group(3).strip()
        if "q-sol" in m.group(1) or summ.startswith(("풀이", "답")):
            sol = body if sol is None else sol + body
        elif summ.startswith("힌트"):
            hints.append(body)
    return (prob, hints, sol) if sol and prob else None


def take_tag(prob):
    """문제 html의 <span class="q-tag">계산</span> → ("계산", 태그를 뺀 html)"""
    tags = re.findall(r'<span class="q-tag[^"]*">([^<]+)</span>', prob)
    prob = re.sub(r'<span class="q-tag[^"]*">[^<]+</span>\s*', "", prob)
    return [t.strip() for t in tags if t.strip()], prob


def fix_links(h, file):
    """같은 절 페이지 안의 앵커(#s3-1-2)를 그 절 파일로 잇는다(시험 연습 페이지는 같은 폴더)"""
    return re.sub(r'href="#', f'href="{file}.html#', h)


def bank_items(u, sc, b, html):
    """블록 하나에서 문제를 뽑는다"""
    base = {"u": u["n"], "s": sc["no"], "card": b["id"], "href": f'{sc["file"]}.html#{b["id"]}', "ct": b["title"]}
    sty = [sc["std"]["ty"]] if sc.get("std") and sc["std"].get("ty") else []
    out = []
    if b["kind"] == "연습":
        ol = find_elem(html, "ol", "q-exlist")
        for k, (_, _, _, li) in enumerate(top_elems(ol[1], "li") if ol else [], 1):
            got = split_li(li)
            if not got:
                continue
            prob, hints, sol = got
            tags, prob = take_tag(prob)
            ty = [t for t in tags if t in BANK_TAGS] or sty
            out.append({**base, "id": f'{b["id"]}:{k}', "src": "R" if sc["code"].endswith("-R") else "ex",
                        "ty": ty[0] if ty else "", "lv": "심화" if "도전" in tags else "",
                        "q": prob, "h": hints[:2], "a": sol})
    elif b["kind"] == "예제":
        probs = re.findall(r'<p class="q-prob[^"]*">(.*?)</p>', html, re.S)
        secs = {}
        for m in re.finditer(r'<section class="([^"]*)">\s*<h3>([^<]+)</h3>', html):
            el = top_elems(html[m.start():], "section")
            if el:
                secs.setdefault(re.sub(r"\s*\(.*\)$", "", m.group(2).strip()),   # '풀이 (10000명으로 세기)' → '풀이'
(m.group(1), re.sub(r"^\s*<h3>[^<]+</h3>", "", el[0][3]).strip()))
        sol = next((secs[h][1] for h in EX_SOL_H3 if h in secs), None)
        if probs and sol:
            prob = "".join(f'<p class="q-prob">{re.sub(r"^<b>문제\.?</b>\s*", "", p.strip())}</p>' for p in probs)
            tags, prob = take_tag(prob)
            hints = []
            h1 = next((secs[h][1] for h in EX_HINT_H3 if h in secs), None)
            if not h1:
                st = find_elem(html, "div", "q-strategy")
                h1 = st[1] if st else None
            if h1:
                hints.append(h1)
            step = find_elem(sol, "ol", "q-proof")
            if step:
                first = top_elems(step[1], "li")
                if first:
                    hints.append(f'<p class="dim small">풀이의 첫 단계</p><ol class="q-proof"><li>{first[0][3]}</li></ol>')
            chk = next((v for k, v in secs.items() if "q-check" in v[0]), None)
            if chk:
                sol += f'<div class="q-check"><h3>검산</h3>{chk[1]}</div>'
            ty = [t for t in tags if t in BANK_TAGS] or sty
            out.append({**base, "id": b["id"], "src": "ex", "ty": ty[0] if ty else "", "lv": "",
                        "q": prob, "h": hints[:2], "a": sol})
    elif b["kind"] == "본문":
        box = find_elem(html, "div", "tb-exercises")
        if box:
            k = 0
            lvs = [(m.start(), m.group(1).strip()) for m in re.finditer(r'<p class="tb-lv">([^<]*)</p>', box[1])]
            for s, _, _, ol in top_elems(box[1], "ol"):
                lv = next((t for p, t in reversed(lvs) if p < s), "")
                for _, _, _, item in top_elems(ol, "li"):
                    k += 1
                    got = split_li(item)
                    if not got:
                        continue
                    prob, hints, sol = got
                    tags, prob = take_tag(prob)
                    ty = [t for t in tags if t in BANK_TAGS] or sty
                    out.append({**base, "id": f'{b["id"]}:{k}', "src": "tb", "ty": ty[0] if ty else "",
                                "lv": lv if lv in ("기본", "응용", "심화") else "",
                                "q": f'<div class="q-prob">{prob}</div>', "h": hints[:2], "a": sol})
    for it in out:
        for f in ("q", "a"):
            it[f] = fix_links(it[f], sc["file"])
        it["h"] = [fix_links(h, sc["file"]) for h in it["h"]]
    return out


def course_bank(c):
    """과목의 모든 절에서 문제를 모은다(본문 번호는 절 번호로 다시 매긴 뒤)"""
    items = []
    for u in c["units"]:
        for sc in u["secs"]:
            for b in sc["blocks"]:
                html = b["html"]
                if b["kind"] == "본문" and b is next((x for x in sc["blocks"] if x["kind"] == "본문"), None):
                    html = renumber(html, sc["no"])[0]
                items += bank_items(u, sc, b, html)
    seen = set()
    for it in items:
        if it["id"] in seen:
            print(f"경고: 문제은행 id 겹침 {it['id']}", file=sys.stderr)
        seen.add(it["id"])
    return items


# ───── 시험 전용 문항(exams/<학과>/<과목번호>.json) ─────
# 본문·예제·연습에 없는 새 문항. 형식은 docs/card-schema/의 "시험 문항"(kind: exam) 그대로다.
#   {"schema": "qcard/1", "kind": "exam", "course": "물리1", "items": [
#     {"id", "std": "물리1-03"(대단원) 또는 "물리1-03-02"(절), "type": "mc|short|free", "ty", "lv": "기본|응용|심화",
#      "q", "choices"(mc), "answer"(mc는 1부터 센 번호 문자열), "hints": [힌트 1, 힌트 2], "sol"}]}
# 시험 연습은 이 문항을 기본으로 쓰고, 블록에서 모은 복습 문항(R·ex·tb)은 고를 때만 섞는다.
EXAMS = ROOT / "exams"
EXAM_TYPES = ("mc", "short", "free")


def exam_items(c):
    p = EXAMS / c["dept"] / f'{num(c["code"])}.json'
    if not p.exists():
        return []
    data = json.loads(p.read_text(encoding="utf-8"))
    if data.get("course") != c["code"]:
        print(f"경고: {p.relative_to(ROOT)}의 course가 {c['code']}가 아님", file=sys.stderr)
    units = {u["n"]: u for u in c["units"]}
    out = []
    for it in data.get("items", []):
        std = it.get("std")
        std = std[0] if isinstance(std, list) else std
        m = re.match(rf'{re.escape(c["code"])}-(\d\d)(?:-(\d\d))?$', std or "")
        if not m or m.group(1) not in units or it.get("type") not in EXAM_TYPES:
            print(f"경고: 시험 문항 {it.get('id')}의 std·type이 맞지 않음 ({std}, {it.get('type')})", file=sys.stderr)
            continue
        u = units[m.group(1)]
        sc = next((s for s in u["secs"] if s["code"] == std), None) if m.group(2) else None
        sol = it.get("sol", "")
        if it["type"] != "mc" and it.get("answer"):
            sol = f'<p class="ex-ans"><b>답</b> {it["answer"]}</p>{sol}'
        row = {"u": u["n"], "s": sc["no"] if sc else "", "card": "", "href": f'{sc["file"] if sc else u["n"]}.html',
               "ct": sc["title"] if sc else u["t"], "id": it["id"], "src": "x",
               "ty": it.get("ty", ""), "lv": it.get("lv", ""), "q": it["q"], "h": it.get("hints", [])[:2], "a": sol}
        if it["type"] == "mc":
            row["ch"], row["ans"] = it["choices"], int(it["answer"])
        out.append(row)
    return out


EXAM_SRC = {"x": "시험 전용", "R": "단원 마무리 연습", "ex": "예제", "tb": "본문 연습문제"}


def exam_page(c, d, items, rel, dept_link):
    """과목의 시험 연습 페이지 본문(문제는 bank.js에서 js/exam.js가 그린다)"""
    units = [{"n": u["n"], "t": u["t"], "k": sum(1 for it in items if it["u"] == u["n"])} for u in c["units"]]
    cnt = {k: sum(1 for it in items if it["src"] == k) for k in EXAM_SRC}
    conf = {"course": c["code"], "name": c["name"], "units": units, "src": EXAM_SRC, "cnt": cnt}
    if not items:
        inner = ('<p class="u-empty">이 과목의 문제은행은 준비 중입니다. 단원 마무리 연습과 예제 카드가 채워지면 '
                 '여기서 중간고사·기말고사 연습 세트를 뽑을 수 있습니다.</p>')
    else:
        inner = ('<div id="exam" class="ex-app" aria-live="polite"><p class="dim small">문제를 불러오는 중입니다…</p></div>'
                 '<noscript><p class="u-empty">시험 연습은 자바스크립트가 켜져 있어야 합니다.</p></noscript>')
    return f"""  <section class="topic-hero u-hero ex-hero">
    <div class="meta">{dept_link}<span class="mono">/</span><a href="./">{esc(c["name"])}</a><span class="mono">시험 연습</span></div>
    <h1>시험 연습</h1>
    {f'<p class="lead">{esc(c["name"])}의 시험 전용 문항 {cnt["x"]}개(본문에 나오지 않는 새 문제, 응용·심화 {sum(1 for it in items if it["src"] == "x" and it["lv"] in ("응용", "심화"))}개)에서 중간고사·기말고사 범위로 한 세트를 뽑아 풉니다. 공부하며 본 단원 마무리 연습, 예제, 본문 연습문제 {len(items) - cnt["x"]}개는 \'복습 문항 포함\'을 고를 때만 섞입니다. 객관식은 바로 채점되고, 나머지는 풀이를 보고 스스로 채점합니다. 틀린 문제는 학습 기록에 남아 다시 풀 수 있습니다.</p>' if cnt["x"] else f'<p class="lead">{esc(c["name"])}의 단원 마무리 연습, 예제, 본문 연습문제 {len(items)}개에서 중간고사·기말고사 범위로 한 세트를 뽑아 풉니다. 힌트와 풀이를 보고 스스로 채점하면, 틀린 문제는 학습 기록에 남아 다시 풀 수 있습니다.</p>' if items else ""}
  </section>
  <script type="application/json" id="exam-conf">{json.dumps(conf, ensure_ascii=False).replace("</", "<\\/")}</script>
  {inner}
"""


def write_pages(depts, blocks, sidx, links):
    cdir = ROOT / "c"
    if cdir.exists():
        for p in sorted(cdir.rglob("*"), reverse=True):
            p.unlink() if p.is_file() else p.rmdir()
    n_pages = n_cards = 0
    n_bank = [0, 0]   # 문제 수, 문제은행이 있는 과목 수
    used = set()
    for d in depts:
        for c in d["courses"]:
            base = cdir / d["id"] / num(c["code"])
            base.mkdir(parents=True, exist_ok=True)
            rel = "../../../"
            c["path"] = f'c/{d["id"]}/{num(c["code"])}/'
            dept_link = f'<a href="{rel}?dept={d["id"]}#tree">{esc(d["name"])}</a>'

            # 1) 절 목록 만들기: 성취기준마다 절 하나 + 카드가 있으면 단원 마무리 절
            for u in c["units"]:
                un = int(u["n"])
                secs = []
                for k, s in enumerate(u["s"], 1):
                    secs.append({"code": s["c"], "file": f'{u["n"]}-{k:02d}', "no": f"{un}.{k}",
                                 "title": sec_title(s["t"]), "std": s, "blocks": blocks.get(s["c"], [])})
                rkey = f'{c["code"]}-{u["n"]}-R'
                if blocks.get(rkey):
                    secs.append({"code": rkey, "file": f'{u["n"]}-R', "no": f"{un}.R",
                                 "title": "단원 마무리", "std": None, "blocks": blocks[rkey]})
                for sc in secs:
                    used.add(sc["code"])
                    tb = next((b for b in sc["blocks"] if b["kind"] == "본문"), None)
                    if tb:   # 본문이 있는 절은 책의 절 제목을 쓴다(성취기준 문장은 그 아래에)
                        sc["title"] = tb["title"]
                    sc["cards"] = [{"id": b["id"], "kind": b["kind"], "title": b["title"], "no": f'{sc["no"]}.{j}'}
                                   for j, b in enumerate(sc["blocks"], 1)]
                u["secs"] = secs
                u["cards"] = sum(len(sc["blocks"]) for sc in secs)
                # toc.js용: 성취기준마다 그 절의 카드 id, 단원 마무리 카드는 u["r"]
                for sc in secs:
                    if sc["std"]:
                        sc["std"]["k"] = [x["id"] for x in sc["cards"]]
                        sc["std"]["f"] = sc["file"]
                u["r"] = [x["id"] for sc in secs if not sc["std"] for x in sc["cards"]]

            # 성취기준 코드 → 그 절 페이지 링크
            std_page = {sc["code"]: sc["file"] for u in c["units"] for sc in u["secs"]}

            def std_href(code, here=None):
                f = std_page.get(code)
                return f"{f}.html#std" if f else "#"

            flat = [(u, sc) for u in c["units"] for sc in u["secs"]]
            for idx, (u, sc) in enumerate(flat):
                un = int(u["n"])
                prev_s = flat[idx - 1] if idx else None
                next_s = flat[idx + 1] if idx + 1 < len(flat) else None
                bl = sc["blocks"]
                n_cards += len(bl)
                # 본문(전공서적식)이 있으면 그것이 이 절의 중심이고, 나머지 카드는 보충 자료가 된다
                text_b = next((b for b in bl if b["kind"] == "본문"), None)
                rest = [(b, x) for b, x in zip(bl, sc["cards"]) if b is not text_b]
                text_html, subs, cnt = render_text(text_b, sc["no"]) if text_b else ("", [], (0, 0))
                # 같은 절의 다른 본문(보충 본문)은 본문 번호에 이어서 매긴다
                ci, ck = cnt
                for b, _ in rest:
                    if b["kind"] == "본문":
                        b["html"], ci, ck = renumber(b["html"], sc["no"], ci, ck)
                cards_html = "\n".join(render_card(b, x["no"], std_href) for b, x in rest)
                if not bl:
                    cards_html = ('<p class="u-empty">이 절의 카드는 준비 중입니다. 위의 성취기준과 대단원의 학습 요소를 길잡이로, '
                                  '과목 목차의 추천 교재에서 해당 부분을 공부하세요.</p>')
                if text_b and rest:
                    cards_html = ('<div class="supp-head"><h2>보충 카드</h2><p>본문의 내용을 다른 각도에서 다시 보는 카드입니다. '
                                  '예제를 더 풀어 보고 싶거나 증명을 단계별로 따라가고 싶을 때 펼쳐 보세요.</p></div>\n' + cards_html)
                toc = "".join(f'<li><a href="#{x["id"]}"><span class="mono">{"본문" if b is text_b else x["no"]}</span><span>{esc(x["title"])}</span></a></li>'
                              for b, x in zip(bl, sc["cards"]))
                sub_toc = "".join(f'<li><a href="#{a}"><span class="mono">{n}</span><span>{esc(t)}</span></a></li>' for a, n, t in subs)
                if sc["std"]:
                    s = sc["std"]
                    std_box = f"""
    <div class="q-checklist q-one" id="std" data-unit="{esc(sc["code"])}">
      <h2><span>이 절의 성취기준</span><span class="mono">[{esc(s["c"])}] {ty_span(s["ty"])} {uni_span(s["u"])}</span></h2>
      <ol><li><input type="checkbox" data-std="{esc(s["c"])}" aria-label="할 수 있음"><span class="t">{esc(s["t"])}</span></li></ol>
      <p class="note">카드를 공부한 뒤 직접 해 보고, 할 수 있으면 표시하세요. 기록은 이 브라우저에만 저장됩니다.</p>
    </div>"""
                    lead = ""
                else:
                    lis = "".join(f'<li{uni_attr(s["u"])}><input type="checkbox" data-std="{esc(s["c"])}" aria-label="할 수 있음: {esc(s["c"])}">'
                                  f'<span class="code">{esc(s["c"].split("-", 1)[1])}</span><span class="t"><a href="{std_href(s["c"])}">{esc(s["t"])}</a> {ty_span(s["ty"])} {uni_span(s["u"])}</span><span class="cards"></span></li>'
                                  for s in u["s"])
                    std_box = f"""
    <div class="q-checklist" data-unit="{esc(sc["code"])}">
      <h2><span>대단원 성취기준 점검표</span><span class="mono q-count"></span></h2>
      <ol>{lis}</ol>
      <p class="note">연습 문제를 풀고 나서 성취기준을 다시 점검하세요.</p>
    </div>"""
                    lead = '<p class="lead">대단원 전체를 아우르는 연습 문제입니다. 앞 절들의 카드를 마친 뒤 푸세요.</p>'
                lbox = links_box(sc["code"], f'{c["code"]}-{u["n"]}', links, sidx, rel, c["code"]) if sc["std"] else ""
                if text_b:
                    s = sc["std"]
                    hero_extra = (f'<p class="sec-std"><span class="mono">[{esc(s["c"])}]</span> {esc(s["t"])} {ty_span(s["ty"])} {uni_span(s["u"])}</p>' if s else "")
                    std_after = std_box.replace('class="q-checklist', 'class="q-checklist after-text', 1).replace(
                        "카드를 공부한 뒤 직접 해 보고", "본문과 연습문제를 마친 뒤 직접 해 보고")
                    hero_inner = f'{hero_extra}'
                    main_html = f"{text_html}\n    {std_after}{lbox}\n{cards_html}"
                    h1_title = text_b["title"]
                    side = (f'<p class="mono small toc-title">이 절의 차례</p>\n      <ol class="toc-sub">{sub_toc}</ol>\n'
                            f'      <p class="mono small toc-title toc-title-2">이 절의 카드</p>')
                else:
                    hero_inner = f"{lead}{std_box}"
                    main_html = f"{lbox}\n{cards_html}" if lbox else cards_html
                    h1_title = sc["title"]
                    side = '<p class="mono small toc-title">이 절의 카드</p>'
                sec_u = sc["std"]["u"] if sc["std"] else unit_unis(u)
                body = f"""  <section class="topic-hero u-hero{' has-text' if text_b else ''}" data-sec="{esc(sc["code"])}"{uni_attr(sec_u)}>
    <div class="meta">{dept_link}<span class="mono">/</span><a href="./">{esc(c["name"])}</a><span class="mono">/</span><a href="{u["n"]}.html">{un}. {esc(u["t"])}</a></div>
    <h1><span class="sec-no mono">{sc["no"]}</span>{esc(h1_title)}</h1>
    {hero_inner}
  </section>

  <div class="topic-layout{' with-text' if text_b else ''}">
    <aside class="toc" aria-label="이 절의 차례">
      {side}
      {f'<ol id="toc-list">{toc}</ol>' if toc else '<p class="small dim">준비 중</p>'}
      <p class="progress mono small"></p>
      <p class="toc-links mono small"><a href="{u["n"]}.html">대단원 {un} 절 목록</a><br><a href="{rel}record.html">내 학습 기록</a></p>
    </aside>
    <div class="sec-main">
{main_html}
      <nav class="u-pager" aria-label="절 이동">
        <span>{f'<a href="{prev_s[1]["file"]}.html">← {prev_s[1]["no"]} {esc(prev_s[1]["title"])}</a>' if prev_s else ""}</span>
        <span>{f'<a href="{next_s[1]["file"]}.html">{next_s[1]["no"]} {esc(next_s[1]["title"])} →</a>' if next_s else ""}</span>
      </nav>
    </div>
  </div>
"""
                extra, scripts = collect(bl)
                desc = f'{c["name"]} {sc["no"]} {sc["title"]}' + (f' — 성취기준: {sc["std"]["t"]}' if sc["std"] else "")
                (base / f'{sc["file"]}.html').write_text(
                    page(rel, f'{sc["title"]} · {c["name"]}', desc, body, extra, scripts, back=(f'{u["n"]}.html', "← 절 목록"),
                         record={"course": c["code"], "title": f'{sc["no"]} {sc["title"]}', "sub": c["name"]}),
                    encoding="utf-8", newline="\n")
                n_pages += 1

            # 2) 대단원 페이지: 절 목록
            for i, u in enumerate(c["units"]):
                un = int(u["n"])
                prev_u = c["units"][i - 1] if i else None
                next_u = c["units"][i + 1] if i + 1 < len(c["units"]) else None
                rows = "".join(f"""
        <li class="s-row"{uni_attr(sc["std"]["u"] if sc["std"] else unit_unis(u))} data-std="{esc(sc["std"]["c"]) if sc["std"] else ""}" data-cards="{esc(" ".join(x["id"] for x in sc["cards"]))}">
          <span class="mono n">{sc["no"]}</span>
          <a href="{sc["file"]}.html"><b>{esc(sc["title"])}</b></a>
          <span class="s-meta mono">{ty_span(sc["std"]["ty"]) if sc["std"] else '<span class="ty mono">연습</span>'} {uni_span(sc["std"]["u"]) if sc["std"] else ""} <span class="s-cards">카드 {len(sc["cards"]) or "준비 중"}</span></span>
          {f'<span class="s-std small">{esc(sc["std"]["t"])}</span>' if sc["std"] else ""}
        </li>""" for sc in u["secs"])
                body = f"""  <section class="topic-hero u-hero"{uni_attr(unit_unis(u))}>
    <div class="meta">{dept_link}<span class="mono">/</span><a href="./">{esc(c["name"])}</a><span class="mono">대단원 {u["n"]}{" · " + esc(u["src"]) if u["src"] else ""}</span></div>
    <h1>{esc(u["t"])}</h1>
    {f'<p class="u-els"><b>학습 요소</b>{esc(u["el"])}</p>' if u["el"] else ""}
    <p class="u-prog mono small"></p>
  </section>{links_box(f'{c["code"]}-{u["n"]}', None, links, sidx, rel, c["code"])}
  <ol class="s-list">{rows}
  </ol>
  <nav class="u-pager" aria-label="대단원 이동">
    <span>{f'<a href="{prev_u["n"]}.html">← {int(prev_u["n"])}. {esc(prev_u["t"])}</a>' if prev_u else ""}</span>
    <span>{f'<a href="{next_u["n"]}.html">{int(next_u["n"])}. {esc(next_u["t"])} →</a>' if next_u else ""}</span>
  </nav>
"""
                desc = f'{c["name"]} {un}. {u["t"]} — 학습 요소: {u["el"]}'
                (base / f'{u["n"]}.html').write_text(page(rel, f'{u["t"]} · {c["name"]}', desc, body), encoding="utf-8", newline="\n")
                n_pages += 1

            # 2-1) 시험 연습: 문제은행(bank.js)과 연습 페이지(exam.html)
            xs = exam_items(c)
            items = xs + course_bank(c)
            c["bank"], c["xbank"] = len(items), len(xs)
            if items:
                (base / "bank.js").write_text(
                    "/* tools/build.py가 exams/의 시험 전용 문항과 blocks/의 연습·예제·본문 연습문제에서 모은 문제은행. 직접 고치지 않는다. */\n"
                    "window.QBANK = " + json.dumps(items, ensure_ascii=False, separators=(",", ":")) + ";\n",
                    encoding="utf-8", newline="\n")
            (base / "exam.html").write_text(
                page(rel, f'시험 연습 · {c["name"]}', f'{c["name"]} 중간고사·기말고사 연습 문제은행', exam_page(c, d, items, rel, dept_link),
                     '\n  <link rel="stylesheet" href="' + rel + 'css/exam.css">', (["c/" + f'{d["id"]}/{num(c["code"])}/bank.js'] if items else []) + ["js/exam.js"],
                     body_attrs=f' data-dept="{d["id"]}"'),
                encoding="utf-8", newline="\n")
            n_pages += 1
            n_bank[0] += len(items)
            n_bank[1] += 1 if items else 0

            # 3) 과목 목차(책 목차형): 왼쪽에 과목 정보·진도·선수/다음 과목, 오른쪽에 대단원 → 절 → 카드
            nstd =sum(len(u["s"]) for u in c["units"])
            ncard = sum(u["cards"] for u in c["units"])
            nsec = sum(len(u["secs"]) for u in c["units"])

            def sec_row(sc, u):
                # 본문 블록은 제목이 절 제목과 같아 목록에서 뺀다(진도에는 data-cards로 들어간다)
                cards = "".join(f'<li data-card="{esc(x["id"])}"><a href="{sc["file"]}.html#{esc(x["id"])}"><span class="cx-k mono">{esc(x["kind"])}</span>{esc(x["title"])}</a></li>'
                                for x in sc["cards"] if x["kind"] != "본문")
                code = f'<span class="cx-code mono">[{esc(sc["std"]["c"])}] {ty_span(sc["std"]["ty"])} {uni_span(sc["std"]["u"])}</span>' if sc["std"] else ""
                return f"""
          <li class="cx-sec"{uni_attr(sc["std"]["u"] if sc["std"] else unit_unis(u))} data-std="{esc(sc["std"]["c"]) if sc["std"] else ""}" data-cards="{esc(" ".join(x["id"] for x in sc["cards"]))}" data-href="{sc["file"]}.html" data-title="{sc["no"]} {esc(sc["title"])}">
            <span class="cx-n mono">{sc["no"]}</span>
            <div class="cx-t"><b><a href="{sc["file"]}.html">{esc(sc["title"])}</a></b>{code}</div>
            <span class="cx-badge mono">{f'카드 {len(sc["cards"])}' if sc["cards"] else "준비 중"}</span>
            {f'<ul class="cx-qs">{cards}</ul>' if cards else ""}
          </li>"""
            units = "".join(f"""
      <section class="c-unit cx-ch" data-unit="{esc(c["code"])}-{u["n"]}"{uni_attr(unit_unis(u))}>
        <div class="cx-ch-head"><span class="cx-no">{int(u["n"])}</span><h2><a href="{u["n"]}.html">{esc(u["t"])}</a></h2><span class="cx-meta mono"><span class="lp-bar" aria-hidden="true"><i></i></span><span class="lp-t"></span></span></div>
        {f'<p class="cx-goal">{esc(u["el"])}</p>' if u["el"] else ""}
        <ol class="c-secs">{"".join(sec_row(sc, u) for sc in u["secs"])}
        </ol>
      </section>""" for u in c["units"])
            # 선수 칸의 과목 코드(공통1, 수학7, 공통1·2)를 링크로, 이어지는 과목은 다른 과목의 선수 코드를 거꾸로 찾는다
            by_code = {x["code"]: (dd, x) for dd in depts for x in dd["courses"]}

            def pre_codes(text):
                out = []
                for m in re.finditer(r"([가-힣]+?)(\d+(?:·\d+)*)(?!\d)", text or ""):
                    out += [f"{m.group(1)}{k}" for k in m.group(2).split("·") if f"{m.group(1)}{k}" in by_code]
                return out

            def pre_html(text):
                def rep(m):
                    parts = [f"{m.group(1)}{k}" for k in m.group(2).split("·")]
                    if not all(p in by_code for p in parts):
                        return m.group(0)
                    return ", ".join(f'<a href="{rel}c/{by_code[p][0]["id"]}/{num(p)}/">{esc(by_code[p][1]["name"])}</a>' for p in parts)
                return re.sub(r"([가-힣]+?)(\d+(?:·\d+)*)(?!\d)", rep, esc(text))
            nexts = next_courses(c, [(dd, x) for dd in depts for x in dd["courses"] if x is not c and c["code"] in pre_codes(x.get("pre"))])
            first = next((sc for u in c["units"] for sc in u["secs"] if sc["cards"]), None)
            info = [("학기", f'{c["y"]}학년 {c["sem"]}학기 · {c["kind"]} · {c["cr"]}학점'), ("구성", f'대단원 {len(c["units"])} · 절 {nsec} · 카드 {ncard}'),
                    ("개설 대학", c["unisT"] or " · ".join(c["unis"])), ("연세대 개설", c.get("offered") or (c["open"] if c["sub"] else "")), ("학습", c["hours"]), ("교재", c["books"])]
            info_html = "".join(f'<div><dt>{k}</dt><dd>{md(v)}</dd></div>' for k, v in info if v)
            path_html = (f'<p><span class="dim">먼저 공부할 내용</span>{pre_html(c["pre"])}</p>' if c["pre"] else "") + (
                f'<p><span class="dim">이어지는 과목</span>{" · ".join(f"<a href=\"{rel}c/{dd["id"]}/{num(x["code"])}/\">{esc(x["name"])}</a>" for dd, x in nexts)}</p>' if nexts else "")
            body = f"""  <div class="cx" data-course="{esc(c["code"])}"{uni_attr(c["unis"])}>
    <aside class="cx-side">
      <div class="meta">{dept_link}<span class="mono">/ {esc(c["code"])}{" · " + esc(" / ".join(c["sub"])) if c["sub"] else ""}</span></div>
      <h1>{esc(c["name"])}</h1>
      {f'<p class="cx-lead">{esc(c["yoram"])}</p>' if c["yoram"] else ""}
      {f'<p class="cx-lead small">{esc(c["handb"])}</p>' if c["handb"] else ""}
      <p class="c-prog mono small"></p>
      {f'<a class="cx-go" href="{first["file"]}.html">처음부터 공부하기 · {first["no"]} {esc(first["title"])}</a>' if first else ""}
      {f'<a class="cx-exam" href="exam.html"><b>시험 연습</b><span class="mono">중간·기말 · 시험 전용 {c["xbank"]}문항</span></a>' if c["xbank"] else f'<a class="cx-exam" href="exam.html"><b>시험 연습</b><span class="mono">중간·기말 문제은행 · {c["bank"]}문제</span></a>' if c["bank"] else '<a class="cx-exam is-off" href="exam.html"><b>시험 연습</b><span class="mono">문제은행 준비 중</span></a>'}
      <dl class="cx-info">{info_html}</dl>
      {f'<div class="cx-path small">{path_html}</div>' if path_html else ""}
    </aside>
    <div class="cx-main">{units}
    </div>
  </div>
"""
            (base / "index.html").write_text(page(rel, c["name"], c["yoram"] or c["name"], body, back=(f'{rel}?dept={d["id"]}#tree', "← 학과")),
                                            encoding="utf-8", newline="\n")
            n_pages += 1
            for u in c["units"]:
                for sc in u["secs"]:
                    sc.pop("blocks", None)
                    sc.pop("std", None)
                u.pop("secs", None)
            c.pop("unisT", None)
    for k in blocks:
        if k not in used:
            print(f"경고: 없는 절에 배치된 블록 {k}: {[b['id'] for b in blocks[k]]}", file=sys.stderr)
    print(f"문제은행: 문제 {n_bank[0]} · 과목 {n_bank[1]}")
    return n_pages, n_cards


def terms_of(c):
    """요람 배치 학기를 0부터 센 번호로: 1학년 1학기 = 0, 1학년 2학기 = 1, … ("1·2"는 두 학기 모두)"""
    return {(c["y"] - 1) * 2 + int(s) - 1 for s in re.findall(r"[12]", str(c.get("sem", ""))) or ["1"]}


def next_courses(c, cands):
    """이어지는 과목은 로드맵의 바로 다음 학기만 보인다. 다음 학기에 없으면 그 뒤 가장 가까운 학기의 과목.
    공통 기초 뒤에는 2학년 과목부터 잇는다. cands는 (학과, 과목) 쌍"""
    base = min(terms_of(c))
    later = [(dd, x) for dd, x in cands if (c["dept"] != "common" or x["y"] >= 2) and min(terms_of(x)) > base]
    if not later:
        return []
    near = min(min(terms_of(x)) for _, x in later)
    return [(dd, x) for dd, x in later if min(terms_of(x)) == near]


OFFERED = SRC / "univ-offered.json"   # 연세대학교 수강편람에서 모은 학정번호별 개설 학기 {"terms": [...], "codes": {"MAT1001": ["2023-1", …]}}
RECENT_FROM = 2024                     # 이 해부터 한 번도 열리지 않은 과목(3년 이상 미개설)은 목록에서 뺀다


def offered_text(terms):
    """["2004-1", …, "2024-1", "2026-1", "2026-2"] → "2004년부터 · 최근 2024년 1학기, 2026년 1·2학기" (최근 = RECENT_FROM 이후)"""
    if not terms:
        return "최근 개설 기록 없음"
    by = {}
    for t in terms:
        y, s = t.split("-")
        by.setdefault(y, []).append(s)
    recent = ", ".join(f'{y}년 {"·".join(sorted(ss))}학기' for y, ss in sorted(by.items()) if int(y) >= RECENT_FROM)
    first = min(by)
    head = f"{first}년부터 · " if int(first) < RECENT_FROM else ""
    return head + (f"최근 {recent}" if recent else f"마지막 {max(by)}년")


def apply_offered(cs):
    """연세대 개설 이력을 붙이고, 최근 3년 동안 연세대에서 한 번도 열리지 않은 과목은 뺀다. 자료가 없으면 그대로 둔다.
    - 다른 대학(연세대 밖)에도 표시된 과목은 연세대에서 안 열려도 남긴다.
    - 학정번호가 없는 과목(다른 대학에만 있는 과목)은 이력을 붙이지 않고 남긴다."""
    if not OFFERED.exists():
        return cs, []
    data = json.loads(OFFERED.read_text(encoding="utf-8"))
    keep, gone = [], []
    for c in cs:
        other = any(x != "연세대" for x in c.get("unis", []))
        if not c["sub"]:
            if not c.get("unis"):
                print(f"경고: {c['code']} 학정번호도 개설 대학 표시도 없음", file=sys.stderr)
            keep.append(c)
            continue
        terms = sorted({t for s in c["sub"] for t in data["codes"].get(s, [])})
        c["offered"] = offered_text(terms)
        (keep if other or any(int(t[:4]) >= RECENT_FROM for t in terms) else gone).append(c)
    return keep, gone


def selftest():
    """대학 표시 읽기와 개설 규칙을 임시 문서로 확인한다(원본 curricula/는 건드리지 않는다)"""
    import tempfile
    doc = """### 수학1. 선형대수(1) (MAT2001)
| 항목 | 값 | 근거 |
|---|---|---|
| 학년-학기 | 2-1 | S1 |
| 개설 대학 | 서울대(선형대수학 1, 2), 연세대(선형대수(1)), KAIST(MAS109) | S |
#### 01. 행렬
- [수학1-01-01] 행렬을 곱할 수 있다. 〈계산〉 《서울대 연세대 KAIST》
- [수학1-01-02] 행렬식을 구할 수 있다. 〈계산〉 《KAIST 서울대》
- [수학1-01-03] 표시 없는 성취기준이다. 〈개념〉
### 수학2. 위상기하 (MAT9999)
| 학년-학기 | 3-1 | S1 |
| 개설 대학 | 고려대(위상기하) | S |
#### 01. 곡면
- [수학2-01-01] 곡면을 분류할 수 있다. 〈개념〉
### 수학3. 연세대만 옛 과목 (MAT9998)
| 학년-학기 | 3-2 | S1 |
| 개설 대학 | 연세대(옛 과목) | S |
#### 01. 옛 단원
- [수학3-01-01] 옛 내용을 설명할 수 있다. 〈개념〉
### 수학4. 다른 대학에만 있는 과목
| 학년-학기 | 3-2 | S1 |
| 개설 대학 | POSTECH(MATH301), 서강대(위상수학) | S |
#### 01. 단원
- [수학4-01-01] 무엇을 할 수 있다. 〈개념〉 《POSTECH》
### 수학5. 표시 없는 과목 (MAT2002)
| 학년-학기 | 2-2 | S1 |
#### 01. 단원
- [수학5-01-01] 무엇을 할 수 있다. 〈개념〉
"""
    with tempfile.TemporaryDirectory() as tmp:
        f = Path(tmp) / "t.md"
        f.write_text(doc, encoding="utf-8")
        cs = [finish(c) for c in parse(f, "math")]
    a, b, old, other, none = cs
    s1, s2, s3 = a["units"][0]["s"]
    assert a["unis"] == ["서울대", "연세대", "KAIST"], a["unis"]
    assert s1["u"] == ["서울대", "연세대", "KAIST"] and s2["u"] == ["서울대", "KAIST"] and s3["u"] == [], (s1, s2, s3)
    assert b["unis"] == ["고려대"] and b["units"][0]["s"][0]["u"] == ["고려대"], b     # 《》가 없으면 과목 대학을 물려받는다
    assert other["unis"] == ["POSTECH", "서강대"] and other["sub"] == [], other
    assert none["unis"] == [] and none["units"][0]["s"][0]["u"] == [], none          # 미표시: 연세대로 여기지 않는다
    assert uni_names("서울대(해석학 1, 2), 연세대（해석개론）, KAIST") == ["서울대", "연세대", "KAIST"]
    global OFFERED
    keep_off = OFFERED
    with tempfile.TemporaryDirectory() as tmp:
        OFFERED = Path(tmp) / "o.json"
        OFFERED.write_text(json.dumps({"codes": {"MAT2001": ["2025-1"], "MAT9999": ["2010-1"], "MAT9998": ["2010-2"], "MAT2002": ["2026-2"]}}), encoding="utf-8")
        keep, gone = apply_offered(cs)
    OFFERED = keep_off
    assert [c["code"] for c in gone] == ["수학3"], gone                                  # 연세대에만 있고 오래 안 열린 과목만 빠진다
    assert "offered" not in other and "2010" in b["offered"], (other, b)
    print("자체 시험 통과")


def main():
    global SRC
    if "--selftest" in sys.argv:
        selftest()
        return
    if "--src" in sys.argv:
        SRC = Path(sys.argv[sys.argv.index("--src") + 1]).resolve()
    out, total = [], {"courses": 0, "units": 0, "stds": 0}
    for did, name, short, fname, college in DEPTS:
        cs, gone = apply_offered([finish(c) for c in parse(SRC / fname, did)])
        if gone:
            print(f"{did}: {RECENT_FROM}년 이후 미개설로 뺀 과목 {len(gone)}: {', '.join(c['name'] for c in gone)}")
        out.append({"id": did, "name": name, "short": short, "college": college, "courses": cs})
        total["courses"] += len(cs)
        total["units"] += sum(len(c["units"]) for c in cs)
        total["stds"] += sum(len(u["s"]) for c in cs for u in c["units"])
        bad = [c["code"] for c in cs if not c["y"]]
        if bad:
            print(f"경고: {did} 학년을 못 읽은 과목 {bad}", file=sys.stderr)
    blocks = load_blocks()
    idx = build_index(out, blocks)
    links = load_links(idx)
    n_pages, n_cards = write_pages(out, blocks, idx, links)
    print(f"연결표: 대상 {len(links['pre'])} · 선수로 쓰인 코드 {len(links['post'])}")
    js = "/* tools/build.py가 curricula/univ-*.md와 blocks/에서 만든다. 직접 고치지 않는다. */\n"
    js += "window.UNIV = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n"
    OUT.write_text(js, encoding="utf-8", newline="\n")
    print(f"js/toc.js: 학과 {len(out)} · 과목 {total['courses']} · 대단원 {total['units']} · 성취기준 {total['stds']}")
    print(f"c/: 페이지 {n_pages} · 카드 {n_cards}")


if __name__ == "__main__":
    main()
