"""STYLE.md 7절: 카드 문장·서식 점검. 나뭇잎·QURI 두 저장소에 같은 파일이 있다.

usage: python -I -X utf8 tools/style_check.py [파일이나 폴더 …] [--all] [--kind 본문]
  인자가 없으면 blocks/ 전체를 재서 요약만 보인다. --all이면 기준을 넘는 카드를 모두 적는다.
기준(STYLE.md 3절)을 넘으면 카드 이름과 이유를 적고, 하나라도 넘으면 종료 코드 1."""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TAG = re.compile(r"<script\b.*?</script>|<style\b.*?</style>|<!--.*?-->", re.S)
ALLTAG = re.compile(r"<[^>]+>")
MATH = re.compile(r"\\\(.+?\\\)|\\\[.+?\\\]", re.S)
CONN = ("그러므로", "따라서", "즉", "하지만", "그런데", "그렇다면", "다시 말해", "바꿔 말하면", "여기서", "이제", "한편",
        "예를 들어", "가령", "이 때", "이때", "그러면", "왜냐하면", "물론", "사실", "그래서")
LABEL = re.compile(r"^(확인|복원|판단|연결|설명|적용|질문|핵심|요약|정리|답|힌트|주의|포인트|결론)\s*[:：]")
STOCK = re.compile(r"핵심은|중요합니다|중요한 점은|살펴보겠습니다|알아보겠습니다|살펴봅시다|다음과 같습니다|단순히 [^.]{0,30}아니라|라는 점에서|이처럼|놀랍게도|흥미롭게도")
LIMITS = {"li": 2.0, "bold": 0.5, "dash": 0.1, "colon": 1.0, "stock": 0.3}   # 1천 자당 상한
MIN_CONN = 4.0   # 100문장당 하한 (본문)


def measure(p):
    h = p.read_text(encoding="utf-8", errors="ignore")
    kind = (re.search(r'data-kind="([^"]+)"', h) or [None, "?"])[1]
    body = TAG.sub(" ", h)
    t = re.sub(r"\s+", " ", ALLTAG.sub(" ", MATH.sub(" 식 ", body)))
    C = max(len(t), 1)
    ss = [s.strip() for s in re.split(r"(?<=[.?!])\s+", t) if len(s) > 8 and re.search(r"[가-힣]", s)]
    n = max(len(ss), 1)
    da = sum(bool(re.search(r"다\.$", s)) and not re.search(r"니다\.$", s) for s in ss)
    nida = sum(bool(re.search(r"니다\.$", s)) for s in ss)
    return {
        "kind": kind, "chars": len(t), "sents": len(ss),
        "li": 1000 * len(re.findall(r"<li\b", body)) / C,
        "bold": 1000 * len(re.findall(r"<b>|<strong>", body)) / C,
        "dash": 1000 * len(re.findall(r"—", t)) / C,
        "colon": 1000 * len(re.findall(r"[가-힣a-z)]: ", t)) / C,
        "stock": 1000 * len(STOCK.findall(t)) / C,
        "conn": 100 * sum(s.startswith(CONN) for s in ss) / n,
        "label": sum(bool(LABEL.match(s)) for s in ss),
        "mixed": min(da, nida) >= 3 and min(da, nida) / n > 0.15,
        "figure": bool(re.search(r"<figure|<svg|<canvas|<img", h)),
    }


def problems(m):
    out = [f"{k} {m[k]:.1f}/1천자 > {v}" for k, v in LIMITS.items() if m[k] > v]
    if m["kind"] == "본문" and m["sents"] >= 15 and m["conn"] < MIN_CONN:
        out.append(f"잇는 말 {m['conn']:.1f}/100문장 < {MIN_CONN}")
    if m["label"]:
        out.append(f"꼬리표 문장 {m['label']}개")
    if m["mixed"]:
        out.append("'~다'체와 '~니다'체가 섞임")
    if m["kind"] == "본문" and not m["figure"]:
        out.append("그림 없음")
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    kind = sys.argv[sys.argv.index("--kind") + 1] if "--kind" in sys.argv else None
    if kind in args:
        args.remove(kind)
    paths = [Path(a) for a in args] or [ROOT / "blocks"]
    files = [f for p in paths for f in ([p] if p.is_file() else sorted(p.rglob("*.html")))]
    bad, rows = [], []
    for f in files:
        m = measure(f)
        if kind and m["kind"] != kind:
            continue
        rows.append(m)
        pr = problems(m)
        if pr:
            bad.append((f, m["kind"], pr))
    show = "--all" in sys.argv or bool(args)
    for f, k, pr in (bad if show else bad[:20]):
        print(f"{f.relative_to(ROOT) if f.is_relative_to(ROOT) else f} [{k}]: {'; '.join(pr)}")
    if rows:
        avg = lambda k: sum(r[k] for r in rows) / len(rows)
        print(f"\n카드 {len(rows)}장 중 기준을 넘는 카드 {len(bad)}장 · 평균 목록 {avg('li'):.1f} · 굵게 {avg('bold'):.1f} · 줄표 {avg('dash'):.2f} "
              f"· 쌍점 {avg('colon'):.1f} (1천 자당) · 잇는 말 {avg('conn'):.1f}/100문장 · 그림 있는 카드 {100 * avg('figure'):.0f}%")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
