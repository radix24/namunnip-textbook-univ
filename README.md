# QURI (큐리) — 질문에서 증명까지

학부 1~3학년 과정을 혼자서 공부할 수 있는 디지털 교과서입니다. 과목을 대단원과 성취기준으로 나누고, 대단원마다 설명·증명·예제·연습 카드를 둡니다.
화면 바탕은 고등학교 교과서인 [나뭇잎 디지털 교과서](https://github.com/radix24/namunnip-textbook)와 같습니다. 이름, 로고, 색은 [BRAND.md](BRAND.md)를 따릅니다.

**바로 보기: https://radix24.github.io/namunnip-textbook-univ/**

## 무엇이 들어 있나

| 항목 | 규모 |
|---|---|
| 학과 | 7개 + 공통 기초 (수학, 물리학, 화학, 천문우주학, 응용통계학, 전기전자공학, 기계공학) |
| 과목 | 155개 (학부 1~3학년). 과목마다 목차 페이지 |
| 대단원 | 944개. 대단원마다 단원 페이지(학습 요소, 절 목록) |
| 성취기준 = 절 | 2,233개 (개념·계산·증명·모형·적용·실습). 절마다 페이지, 대단원마다 "단원 마무리" 연습 절 |
| 카드 | 124장. 미분적분학과벡터해석(1) 49장, (2) 36장, 일반물리학및실험(1) 39장. 세 과목은 모든 절에 카드가 있고 대단원마다 단원 마무리 연습 카드가 있음 |

- 과목명, 학년·학기, 학점, 종별은 연세대학교 2026학년도 대학요람과 2026-1·2학기 수강편람을 따랐습니다(2026-10-17 확인).
- 대단원, 학습 요소, 성취기준, 카드는 QURI가 만들었습니다. 출처와 표기 규칙은 [curricula/univ-curriculum.md](curricula/univ-curriculum.md)에 있습니다.

## 카드 일곱 종류

설명, 증명, 유도, 예제, 연습, 탐구(그림 조작), 실습(코드·측정). 종류별 구성과 작성 규칙은 [CARDS.md](CARDS.md)에 있습니다.

다른 학습 서비스의 구성 방식도 빌려 왔습니다. 빌린 것은 형식뿐이고 내용은 가져오지 않았습니다. 예제의 의미 칸과 문제 해결 전략 상자, 결과가 말이 되는지 따지는 판단 문제는 OpenStax에서 가져왔습니다. 개념 절로 돌아가는 힌트는 Isaac Physics, 먼저 예측하기는 Brilliant, 오개념으로 만든 확인 문제는 Mazur의 ConcepTest에서 가져왔습니다. 자세한 목록은 CARDS.md 6절에 있습니다.

## 구조

```
curricula/univ-*.md       성취기준 설계 문서 (원본). 학과마다 한 파일
blocks/<학과>/<과목번호>/   카드 한 장 = 파일 하나. 머리 JSON의 "sec"(성취기준 코드 또는 "…-R")로 절에 배치
js/cards/<학과>/           탐구·실습 카드 스크립트
tools/build.py            → js/toc.js, c/<학과>/<과목번호>/index.html(목차), <대단원>.html, <대단원>-<절>.html 생성
tools/icons.py            → assets/icons/*.png (QURI 앱 아이콘)
index.html, js/home.js    메인 화면: 학과 탭, 학년·학기 배치도, 과목·성취기준 목록, 검색
js/progress.js            학습 기록: 성취기준 점검, 카드 완료, 방문 기록 (localStorage "quri-progress")
record.html, js/record.js  학습 기록 화면: 과목별 진도, 최근 방문, 내보내기·가져오기
css/quri.css              QURI 색 테마 (tb.css 변수 덮어쓰기)
css/qcard.css             대학 카드와 단원·과목 페이지 스타일
css/tb.css, css/fonts.css, js/core.js, js/math.js, assets/katex/, assets/fonts/   나뭇잎 교과서와 같은 바탕
```

`js/toc.js`와 `c/` 아래 파일은 빌드가 만드는 파일이므로 직접 고치지 않습니다.

## 만들기

```bash
python tools/build.py
```

## 배포

`main`에 푸시하면 GitHub Actions(`.github/workflows/pages.yml`)가 GitHub Pages에 올립니다.
저장소 **Settings → Pages → Build and deployment → Source**가 **GitHub Actions**여야 합니다.

## 라이선스

- 글꼴: Pretendard, Newsreader, IBM Plex Mono — SIL Open Font License (`assets/fonts/OFL-*.txt`)
- 수식: KaTeX — MIT (`assets/katex/LICENSE`)
