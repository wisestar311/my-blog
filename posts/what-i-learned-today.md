---
title: 오늘 배운 것
date: 2026-08-21
tags: 회고, HTML, CSS, JavaScript
excerpt: 클로드 코드로 블로그를 만들면서 HTML, CSS, JavaScript가 각각 어떤 역할을 하는지 다시 정리해봤습니다.
---

블로그를 처음부터 만들어보니 세 언어의 역할이 명확하게 나뉘는 걸 몸으로 느꼈습니다. 오늘 배운 걸 간단히 정리합니다.

## HTML — 구조

HTML은 페이지에 어떤 요소들이 있는지, 그 순서와 의미를 정의합니다. `index.html`과 `post.html`은 거의 뼈대만 가지고 있고, 실제 내용은 대부분 비어 있습니다.

```html
<main>
  <ul id="post-list" class="post-list"></ul>
</main>
```

내용은 나중에 JavaScript가 채워 넣습니다. 즉 HTML은 "여기에 목록이 들어갈 자리다"라고 표시만 해두는 역할이었습니다.

## CSS — 표현

CSS는 그 구조를 어떻게 보여줄지 결정합니다. 이번 프로젝트에서 인상 깊었던 건 색상을 변수로 뽑아둔 것입니다.

```css
:root {
  --color-bg: #ffffff;
  --color-text: #1a1a1a;
}

[data-theme="dark"] {
  --color-bg: #15161a;
  --color-text: #e8e8ea;
}
```

같은 HTML, 같은 CSS 규칙인데 `data-theme` 속성 하나로 다크 모드와 라이트 모드가 전환됩니다. `@media (max-width: 768px)` 같은 반응형 규칙도 결국 "화면 크기에 따라 표현만 달리한다"는 CSS의 역할을 보여줍니다.

## JavaScript — 동작

JavaScript는 세 가지 일을 했습니다.

1. **데이터 가져오기** — `fetch`로 `.md` 파일을 읽어옴
2. **가공** — 마크다운 텍스트를 파싱해서 HTML 문자열로 변환
3. **반영과 상호작용** — 변환된 HTML을 페이지에 삽입하고, 다크 모드 토글 클릭 같은 이벤트에 반응

```js
const res = await fetch(`posts/${filename}`);
const raw = await res.text();
const { meta, body } = BlogMarkdown.parseFrontmatter(raw);
```

정리하면 **HTML은 뼈대, CSS는 옷, JavaScript는 움직임**이라는 말이 이번엔 훨씬 구체적으로 와닿았습니다. 세 역할이 분리되어 있어서 그런지, 다크 모드 하나를 추가할 때도 CSS 파일만 건드리면 됐고 JS나 HTML 구조는 거의 손댈 필요가 없었습니다.
