# 나뭇잎 대학 교과서

학부 1~3학년 과정을 혼자서 공부할 수 있도록 과목·대단원·성취기준으로 정리한 대학 디지털 교과서입니다.
[나뭇잎 디지털 교과서](https://github.com/radix24/namunnip-textbook)(고등학교)의 대학판이며, 같은 디자인을 씁니다.

**바로 보기: https://radix24.github.io/namunnip-textbook-univ/** (Pages를 켠 뒤)

## 무엇이 들어 있나

| 항목 | 규모 |
|---|---|
| 학과 | 7개 + 공통 기초 (수학, 물리학, 화학, 천문우주학, 응용통계학, 전기전자공학, 기계공학) |
| 과목 | 155개 (학부 1~3학년) |
| 대단원 | 944개 |
| 성취기준 | 2,233개 |
| 개념 카드 | 준비 중 |

- 과목명, 학년·학기, 학점, 종별은 연세대학교 2026학년도 대학요람과 2026-1·2학기 수강편람을 따랐습니다(2026-10-17 확인).
- 대단원, 학습 요소, 성취기준, 독학 안내는 나뭇잎이 설계했습니다. 출처와 표기 규칙은 [curricula/univ-curriculum.md](curricula/univ-curriculum.md)에 있습니다.
- 성취기준은 여섯 유형(개념, 계산, 증명, 모형, 적용, 실습)으로 나누었습니다.

## 구조

```
curricula/univ-*.md     성취기준 설계 문서 (원본). 학과마다 한 파일
tools/build.py          → js/toc.js 생성 (window.UNIV: 학과 → 과목 → 대단원 → 성취기준)
index.html, js/home.js  메인 화면: 학과 탭, 학년·학기 배치도, 과목·성취기준 목록, 검색
css/tb.css, css/fonts.css, js/core.js, assets/   고등학교 교과서와 같은 바탕 (복사본)
css/univ.css            대학 교과서 전용 스타일
```

`js/toc.js`는 빌드가 만드는 파일이므로 직접 고치지 않습니다. 설계 문서를 고친 뒤 다시 빌드하세요.

## 만들기

```bash
python tools/build.py
```

## 배포

`main`에 푸시하면 GitHub Actions(`.github/workflows/pages.yml`)가 GitHub Pages에 올립니다.
저장소 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 바꿔야 합니다.

## 라이선스

- 글꼴: Pretendard, Newsreader, IBM Plex Mono — SIL Open Font License (`assets/fonts/OFL-*.txt`)
