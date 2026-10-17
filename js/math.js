/* 수식: 본문의 \( … \)(글 속)과 \[ … \](따로 한 줄)를 KaTeX(assets/katex — 이 프로젝트가 허용한 유일한 외부 라이브러리)로 그린다.
   잘못된 식은 console.error로 남겨 tools/check.py가 잡게 한다. 카드 스크립트가 글을 새로 쓴 뒤에는 NMMath.render(요소)를 부른다.
   notes.js의 형광펜 복원이 그린 뒤의 글자를 기준으로 하므로 notes.js보다 먼저 불러온다. */
window.NMMath = (() => {
  "use strict";
  const RE = /\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]/g;
  const skip = (el) => !el || el.closest("script, style, textarea, code, pre, .katex");
  function render(root) {
    if (!window.katex || !root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (/\\[([]/.test(n.nodeValue) && !skip(n.parentElement) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.forEach((t) => {
      const s = t.nodeValue, frag = document.createDocumentFragment();
      let last = 0;
      s.replace(RE, (whole, inline, display, at) => {
        frag.append(s.slice(last, at));
        const span = document.createElement("span");
        if (display == null) span.className = "k-in";
        try {
          katex.render(inline ?? display, span, { displayMode: display != null, throwOnError: true, output: "htmlAndMathml" });
        } catch (e) {
          console.error("수식을 그리지 못함:", whole, e.message);
          span.textContent = whole;
        }
        frag.append(span);
        last = at + whole.length;
        return whole;
      });
      frag.append(s.slice(last));
      t.replaceWith(frag);
    });
  }
  /* 좁은 화면에서 글 속 수식이 줄보다 길면 그 수식만 가로로 밀어 보게 한다(페이지 전체가 옆으로 밀리지 않게) */
  function fit() {
    document.querySelectorAll(".k-in").forEach((s) => {
      s.classList.remove("k-wide");
      const box = s.parentElement && s.parentElement.clientWidth;
      if (box && s.getBoundingClientRect().width > box) s.classList.add("k-wide");
    });
  }
  render(document.body);
  fit();
  window.addEventListener("resize", () => { clearTimeout(fit.t); fit.t = setTimeout(fit, 150); });
  document.addEventListener("toggle", fit, true);
  return { render, fit };
})();
