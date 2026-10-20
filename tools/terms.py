"""학술 용어 표시: 원본(한국어 용어)을 그대로 두고, 빌드할 때 용어마다 영어형과 한글형을 함께 넣는다.

화면에는 둘 중 하나만 보인다(<html data-terms="en|ko">, css/quri.css의 .tm 규칙, js/core.js의 전환 버튼).
  <span class="tm"><span class="tm-en" title="고윳값">eigenvalue는</span><span class="tm-ko">고윳값은</span></span>
용어 사전은 curricula/univ-terms.tsv 한 곳이다(열: 한국어, 영어, 끝소리). 끝소리는 영어를 한국어로 읽을 때의 받침:
  v = 받침 없음(eigenvalue → 는·가·를·와·로), c = 받침 있음(determinant 디터미넌트는 v, Laplace transform 트랜스폼은 c),
  l = ㄹ 받침(control → 은·이·을·과, 단 '으로' 대신 '로').
완전한 영문판은 같은 사전의 영어 열을 쓴다(아직 만들지 않음).
"""
import html as H
import re
from pathlib import Path

# (받침 있을 때, 없을 때). 앞에 있을수록 먼저 맞춘다(긴 것부터)
PARTICLES = [("이라는", "라는"), ("이라고", "라고"), ("이라면", "라면"), ("이라서", "라서"), ("이란", "란"),
             ("으로", "로"), ("이나", "나"), ("이랑", "랑"), ("과", "와"), ("은", "는"), ("이", "가"), ("을", "를")]
P_ALT = "|".join(sorted({p for pair in PARTICLES for p in pair}, key=len, reverse=True))
HANGUL = "가-힣"
# 받침과 관계없이 그대로 붙는 말(서술격 조사 '이다'의 활용, 격조사·보조사, 복수 '들')
FREE = "이다|이며|이고|이므로|이면|이어서|이었|인|일|임|입니다|이지|의|에서|에게|에|도|만|까지|부터|보다|처럼|마다|조차|뿐|들|끼리|만큼|대로"
SKIP_BLOCK = re.compile(r"<(script|style|code|pre|textarea)\b.*?</\1>|<([a-z0-9]+)\b[^>]*(?:data-place=\"(?:course|dept|no|term)\"|class=\"[^\"]*\bno-term\b)[^>]*>.*?</\2>", re.S | re.I)
MATH = re.compile(r"\\\(.+?\\\)|\\\[.+?\\\]", re.S)
TAG = re.compile(r"<[^>]+>")


def load(path):
    """사전을 읽어 [(한국어, 영어, 끝소리, 정규식)]으로. 한국어가 긴 것부터 맞춘다"""
    rows = []
    p = Path(path)
    if not p.exists():
        return rows
    for line in p.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        ko, en, fin = (line.split("\t") + ["", ""])[:3]
        ko, en, fin = ko.strip(), en.strip(), (fin.strip() or "c")
        if not ko or not en:
            continue
        words = ko.split()
        # 낱말 사이에 원어 괄호가 끼어 있어도 맞춘다: "테일러(Taylor) 급수"
        par = r"(?:\s?\([A-Za-z][^()]{0,40}\))?"
        body = (par + r"\s*").join(re.escape(w) for w in words) + par
        # 앞에 한글·영문·숫자가 붙어 있으면 다른 낱말의 일부다(예: 2차원, 원자핵)
        rx = re.compile(rf"(?<![{HANGUL}A-Za-z0-9]){body}(?:(?P<p>{P_ALT})(?![{HANGUL}])|(?=(?:{FREE}))|(?![{HANGUL}]))")
        rows.append((ko, en, fin, rx, words[0]))
    rows.sort(key=lambda r: -len(r[0]))
    return rows


def _particle(p, fin):
    if not p:
        return ""
    for cons, vow in PARTICLES:
        if p in (cons, vow):
            if fin == "v":
                return vow
            if fin == "l" and cons == "으로":
                return vow
            return cons
    return p


def _mark_text(text, rows, used):
    """태그 없는 글 한 조각: 수식을 가린 뒤 용어를 표시한다"""
    maths = []
    t = MATH.sub(lambda m: (maths.append(m.group(0)), f"\x00{len(maths) - 1}\x00")[1], text)
    spans = []

    def mk(ko, en, fin, m):
        p = m.group("p") or ""
        whole = m.group(0)
        ko_form = whole                       # 원래 글 그대로(조사 포함)
        en_form = en + _particle(p, fin)
        used[ko] = used.get(ko, 0) + 1
        spans.append(f'<span class="tm"><span class="tm-en" title="{H.escape(ko)}">{H.escape(en_form)}</span>'
                     f'<span class="tm-ko">{ko_form}</span></span>')
        return f"\x01{len(spans) - 1}\x01"

    for ko, en, fin, rx, first in rows:
        if first not in t:   # 빠른 거르기: 첫 낱말이 없으면 정규식을 돌리지 않는다
            continue
        t = rx.sub(lambda m, ko=ko, en=en, fin=fin: mk(ko, en, fin, m), t)
    t = re.sub(r"\x01(\d+)\x01", lambda m: spans[int(m.group(1))], t)
    return re.sub(r"\x00(\d+)\x00", lambda m: maths[int(m.group(1))], t)


def mark(html, rows, used=None):
    """HTML의 글(태그 밖, 수식·코드·과목 이름 밖)에서 용어를 표시한다"""
    if not rows or not html:
        return html
    used = {} if used is None else used
    keep = []
    h = SKIP_BLOCK.sub(lambda m: (keep.append(m.group(0)), f"\x02{len(keep) - 1}\x02")[1], html)
    out, pos = [], 0
    for m in TAG.finditer(h):
        out.append(_mark_text(h[pos:m.start()], rows, used))
        out.append(m.group(0))
        pos = m.end()
    out.append(_mark_text(h[pos:], rows, used))
    h = "".join(out)
    return re.sub(r"\x02(\d+)\x02", lambda m: keep[int(m.group(1))], h)


def selftest():
    rows = load_rows_from_text("고윳값\teigenvalue\tv\n행렬식\tdeterminant\tv\n라플라스 변환\tLaplace transform\tc\n테일러 급수\tTaylor series\tv\n제어\tcontrol\tl\n차원\tdimension\tc\n")
    cases = {
        "고윳값은 3이다.": "eigenvalue는",
        "행렬식을 구한다.": "determinant를",
        "라플라스 변환으로 푼다.": "Laplace transform으로",
        "테일러(Taylor) 급수는": "Taylor series는",
        "제어로 바꾼다": "control로",
        "고윳값이다": "eigenvalue",          # '이다'는 받침과 관계없이 표시 밖에 그대로 둔다
        "고윳값의 합": "eigenvalue",
        "\\(고윳값\\)": None,
        "고유값분해": None,
        "3차원 공간": None,
    }
    for src, want in cases.items():
        got = mark(src, rows)
        if want is None:
            assert "tm-en" not in got, (src, got)
        else:
            assert f">{want}<" in got, (src, want, got)
    print("용어 자체 시험 통과")


def load_rows_from_text(text):
    import tempfile, os
    with tempfile.NamedTemporaryFile("w", suffix=".tsv", delete=False, encoding="utf-8") as f:
        f.write(text)
        name = f.name
    try:
        return load(name)
    finally:
        os.unlink(name)


if __name__ == "__main__":
    selftest()
