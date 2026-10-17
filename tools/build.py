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


# ───── 블록(카드) ─────
RE_HEAD = re.compile(r"^\s*<!--block\s*(\{.*?\})\s*-->", re.S)
RE_STYLE = re.compile(r"<style>(.*?)</style>", re.S)


def load_blocks():
    """blocks/**/*.html → {"공통1-02": [블록, …]} (order 순)"""
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
        blk = {
            "id": p.stem, "unit": meta["unit"], "order": meta.get("order", 100),
            "scripts": meta.get("scripts", []), "style": styles, "html": body,
            "kind": kind.group(1) if kind else "탐구",
            "std": stds.group(1).split() if stds else [],
            "title": re.sub(r"<[^>]+>", "", title.group(1)).strip() if title else p.stem,
        }
        by_unit.setdefault(meta["unit"], []).append(blk)
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


def page(rel, title, desc, body, extra_head="", scripts=(), back=("./", "← 과목 목차")):
    head_js = ('(function(){var d=document.documentElement,q=/[?&]theme=(dark|light)\\b/.exec(location.search),t=q&&q[1];'
               'if(!t)try{t=localStorage.getItem("quri-theme")}catch(e){}if(t!=="dark"&&t!=="light")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";'
               'd.dataset.theme=t;if(t==="dark")document.querySelector(\'meta[name="theme-color"]\').content="#12131c"})()')
    js = "\n".join(f'<script src="{rel}{s}"></script>' for s in scripts)
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
  <link rel="stylesheet" href="{rel}assets/katex/katex.min.css">{extra_head}
</head>
<body>

<header class="top">
  <a class="brand" href="{rel}"><svg class="brand-mark"><use href="#nm"/></svg><span class="q-name">QURI</span></a>
  <div class="top-right"><a href="{rel}#courses">과목</a><a href="{back[0]}">{back[1]}</a>{THEME_BTN}</div>
</header>

<main class="wrap">
{body}
  <footer class="site-foot">
    <p class="mono small">QURI · 큐리 · 질문에서 증명까지</p>
    <p class="mono small dim">과목·학년·학점은 연세대학교 2026학년도 대학요람과 수강편람을 따랐고, 대단원·성취기준·카드는 QURI가 만들었습니다.</p>
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


def ty_span(t):
    return f'<span class="ty mono" data-ty="{esc(t)}">{esc(t)}</span>' if t else ""


def render_card(b, unit_n, idx):
    """번호, 유형 표시, 다루는 성취기준 줄을 넣는다"""
    h = b["html"]
    h = h.replace('<span class="no"></span>', f'<span class="no">{int(unit_n)}.{idx}</span>', 1)
    if b["kind"]:
        h = h.replace("<h2>", f'<h2><span class="q-badge">{esc(b["kind"])}</span>', 1)
    if b["std"]:
        links = " ".join(f'<a href="#std-{esc(s)}">[{esc(s)}]</a>' for s in b["std"])
        h = re.sub(r"(</header>)", rf'\1\n  <p class="q-stds mono"><span>다루는 성취기준</span> {links}</p>', h, count=1)
    return h


def write_pages(depts, blocks):
    cdir = ROOT / "c"
    if cdir.exists():
        for p in sorted(cdir.rglob("*"), reverse=True):
            p.unlink() if p.is_file() else p.rmdir()
    n_pages = n_cards = 0
    for d in depts:
        for c in d["courses"]:
            base = cdir / d["id"] / num(c["code"])
            base.mkdir(parents=True, exist_ok=True)
            rel = "../../../"
            # 단원 페이지
            for i, u in enumerate(c["units"]):
                key = f'{c["code"]}-{u["n"]}'
                bl = blocks.get(key, [])
                u["cards"] = len(bl)
                n_cards += len(bl)
                cards_of = {}
                for j, b in enumerate(bl, 1):
                    for s in b["std"]:
                        cards_of.setdefault(s, []).append((b["id"], f'{int(u["n"])}.{j}'))
                lis = "".join(
                    f'<li id="std-{esc(s["c"])}"><input type="checkbox" data-std="{esc(s["c"])}" aria-label="할 수 있음: {esc(s["c"])}">'
                    f'<span class="code">{esc(s["c"].split("-", 1)[1])}</span><span class="t">{esc(s["t"])} {ty_span(s["ty"])}</span>'
                    f'<span class="cards">{"카드" + "".join(f"<a href=\"#{cid}\">{no}</a>" for cid, no in cards_of.get(s["c"], [])) if s["c"] in cards_of else ""}</span></li>'
                    for s in u["s"])
                prev_u = c["units"][i - 1] if i else None
                next_u = c["units"][i + 1] if i + 1 < len(c["units"]) else None
                toc = "".join(f'<li><a href="#{b["id"]}"><span class="mono">{int(u["n"])}.{j}</span><span>{esc(b["title"])}</span></a></li>' for j, b in enumerate(bl, 1))
                cards_html = "\n".join(render_card(b, u["n"], j) for j, b in enumerate(bl, 1)) if bl else \
                    '<p class="u-empty">이 단원의 카드는 준비 중입니다. 위의 학습 요소와 성취기준을 길잡이로, 과목 목차의 추천 교재에서 해당 부분을 공부하세요.</p>'
                body = f"""  <section class="topic-hero u-hero">
    <div class="meta"><a href="{rel}?dept={d["id"]}#tree">{esc(d["name"])}</a><span class="mono">/</span><a href="./">{esc(c["name"])}</a><span class="mono">대단원 {u["n"]}{" · " + esc(u["src"]) if u["src"] else ""}</span></div>
    <h1>{esc(u["t"])}</h1>
    {f'<p class="u-els"><b>학습 요소</b>{esc(u["el"])}</p>' if u["el"] else ""}
    <div class="q-checklist" data-unit="{esc(key)}">
      <h2><span>성취기준 점검표</span><span class="mono q-count"></span></h2>
      <ol>{lis}</ol>
      <p class="note">단원을 공부한 뒤 성취기준을 직접 해 보고, 할 수 있으면 표시하세요. 기록은 이 브라우저에만 저장됩니다.</p>
    </div>
  </section>

  <div class="topic-layout">
    <aside class="toc" aria-label="이 단원의 카드">
      <p class="mono small toc-title">이 단원의 카드</p>
      {f'<ol id="toc-list">{toc}</ol>' if toc else '<p class="small dim">준비 중</p>'}
    </aside>
    <div>
{cards_html}
      <nav class="u-pager" aria-label="단원 이동">
        <span>{f'<a href="{prev_u["n"]}.html">← {prev_u["n"]} {esc(prev_u["t"])}</a>' if prev_u else ""}</span>
        <span>{f'<a href="{next_u["n"]}.html">{next_u["n"]} {esc(next_u["t"])} →</a>' if next_u else ""}</span>
      </nav>
    </div>
  </div>
"""
                styles = "\n".join(b["style"] for b in bl if b["style"])
                extra = f"\n  <style>\n{styles}\n  </style>" if styles else ""
                scripts = []
                for b in bl:
                    for s in b["scripts"]:
                        if s not in scripts:
                            scripts.append(s)
                desc = f'{c["name"]} {u["n"]}. {u["t"]} — 학습 요소: {u["el"]}'
                (base / f'{u["n"]}.html').write_text(page(rel, f'{u["t"]} · {c["name"]}', desc, body, extra, scripts), encoding="utf-8", newline="\n")
                n_pages += 1
            # 과목 목차
            nstd = sum(len(u["s"]) for u in c["units"])
            units = "".join(f"""
      <div class="c-unit" data-unit="{esc(c["code"])}-{u["n"]}">
        <span class="n">{u["n"]}</span>
        <h2><a href="{u["n"]}.html">{esc(u["t"])}</a></h2>
        <span class="meta"><span class="lp-bar" aria-hidden="true"><i></i></span><span class="lp-t">성취기준 {len(u["s"])}</span> · 카드 {u.get("cards", 0)}</span>
        {f'<p class="el">{esc(u["el"])}</p>' if u["el"] else ""}
      </div>""" for u in c["units"])
            info = [("학년·학기", f'{c["y"]}학년 {c["sem"]}학기 · {c["kind"]} · {c["cr"]}학점'), ("2026 개설", c["open"]),
                    ("선수", c["pre"]), ("학습 시간", c["hours"]), ("교재", c["books"])]
            info_html = "".join(f'<div><dt>{k}</dt><dd>{md(v)}</dd></div>' for k, v in info if v)
            body = f"""  <section class="topic-hero">
    <div class="meta"><a href="{rel}?dept={d["id"]}#tree">{esc(d["name"])}</a><span class="mono">/ {esc(c["code"])} · {esc(" / ".join(c["sub"]))}</span></div>
    <h1>{esc(c["name"])}</h1>
    {f'<p class="lead">{esc(c["yoram"])}</p>' if c["yoram"] else ""}
    {f'<p class="lead small">수강편람 개요: {esc(c["handb"])}</p>' if c["handb"] else ""}
    <dl class="c-info">{info_html}</dl>
  </section>
  <p class="mono small dim" style="margin-top:18px">대단원 {len(c["units"])} · 성취기준 {nstd} · 카드 {sum(u.get("cards", 0) for u in c["units"])}</p>
  <div class="c-units">{units}
  </div>
"""
            (base / "index.html").write_text(page(rel, c["name"], c["yoram"] or c["name"], body, scripts=("js/toc.js",), back=(f'{rel}?dept={d["id"]}#tree', "← 학과")), encoding="utf-8", newline="\n")
            n_pages += 1
            c["path"] = f'c/{d["id"]}/{num(c["code"])}/'
    return n_pages, n_cards


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
    blocks = load_blocks()
    known = {f'{c["code"]}-{u["n"]}' for d in out for c in d["courses"] for u in c["units"]}
    for k in blocks:
        if k not in known:
            print(f"경고: 없는 단원에 배치된 블록 {k}: {[b['id'] for b in blocks[k]]}", file=sys.stderr)
    n_pages, n_cards = write_pages(out, blocks)
    js = "/* tools/build.py가 curricula/univ-*.md와 blocks/에서 만든다. 직접 고치지 않는다. */\n"
    js += "window.UNIV = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n"
    OUT.write_text(js, encoding="utf-8", newline="\n")
    print(f"js/toc.js: 학과 {len(out)} · 과목 {total['courses']} · 대단원 {total['units']} · 성취기준 {total['stds']}")
    print(f"c/: 페이지 {n_pages} · 카드 {n_cards}")


if __name__ == "__main__":
    main()
