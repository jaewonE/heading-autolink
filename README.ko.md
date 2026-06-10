# Heading Autolink

[ [English](https://github.com/jaewonE/obsidian-heading-autolink) | [한국어](https://github.com/jaewonE/obsidian-heading-autolink/blob/master/README.ko.md) ]

Heading Autolink는 Markdown heading 이름이 변경되었을 때 Obsidian wikilink의 heading target을 함께 갱신하는 플러그인입니다.

Obsidian은 파일 이름 변경은 추적하지만, wikilink 내부의 heading target은 자동으로 갱신하지 않습니다. 이 플러그인은 다음과 같은 링크를 처리합니다.

```markdown
[[a#title1]]
[[a#title1|title1]]
```

`a.md` 안의 heading `title1`이 `newTitle1`으로 변경되면 vault 내부의 일치하는 링크를 다음처럼 갱신합니다.

```markdown
[[a#newTitle1]]
[[a#newTitle1|newTitle1]]
```

## 주요 기능

- 단일 Markdown heading rename을 감지해 vault 내부 wikilink를 갱신합니다.
- custom alias는 보존하면서 heading target만 갱신합니다.
- alias가 기존 heading text와 정확히 같으면 alias도 함께 갱신합니다.
- 변경 전 heading text가 중복된 경우 모호한 simple link는 건드리지 않습니다.
- `[[note]]#`처럼 simple file wikilink 뒤에 `#`를 입력하면 heading picker를 엽니다.
- `Enter` 또는 마우스 클릭으로 단일 heading link를 삽입합니다.
- picker의 recursive insert 버튼으로 선택 heading과 하위 heading을 함께 삽입합니다.
- plain text, ordered list, unordered list, `- {icon}` list에서 recursive 삽입을 지원합니다.
- 줄을 벗어났을 때 alias 없는 heading wikilink에 alias를 자동 추가합니다.
- 기본적으로 fenced code block, inline code, YAML frontmatter, HTML comment 내부 링크는 무시합니다.
- autolink가 적용되면 몇 개 파일에서 몇 개 링크가 갱신되었는지 알림으로 표시합니다.

## 지원 Wikilink

지원 예시:

```markdown
[[a#title1]]
[[a#title1|title1]]
[[folder/a#title1]]
[[a.md#title1]]
[[a#heading1#heading2]]
[[a#heading1#heading2|heading2]]
```

비지원 예시:

```markdown
![[a#title1]]
[[#local heading]]
[[a#^block]]
[title](a.md#title1)
[[a|alias]]#
```

## Picker

simple file wikilink 바로 뒤에 `#`를 입력합니다.

```markdown
[[note]]#
```

대상 note가 Markdown 파일로 resolve되고 heading이 있으면 커서 아래에 picker가 열립니다.

기본 조작:

| 동작 | 조작 |
| --- | --- |
| 선택 이동 | 방향키 |
| 선택 heading 삽입 | `Enter` 또는 heading 클릭 |
| heading과 하위 heading 삽입 | 왼쪽 recursive insert 버튼 |
| heading 검색 | 검색 입력 |
| picker 닫기 | `Escape` |

recursive insert 버튼은 기본 상태에서 heading level label로 표시됩니다. row가 hover되거나 선택되었을 때, 하위 heading이 있는 항목은 recursive insert 아이콘으로 전환됩니다.

## Auto Alias

활성화되어 있으면 alias 없는 heading link를 작성한 뒤 다른 줄로 이동할 때 alias를 자동 추가합니다.

```markdown
[[a#title1]]
```

변환 후:

```markdown
[[a#title1|title1]]
```

계층형 heading link는 마지막 heading segment를 alias로 사용합니다.

```markdown
[[a#heading1#heading2|heading2]]
```

## 설정

- **Enable Title Picker**: `[[note]]` 뒤에 `#`를 입력했을 때 heading picker를 엽니다.
- **Enable Auto Alias**: 줄을 벗어났을 때 heading wikilink에 빠진 alias를 추가합니다.
- **Picker Size**: `small`, `medium`, `large` 중 picker 크기를 선택합니다.
- **Picker Max Visible Items**: 스크롤이 생기기 전까지 보이는 picker 결과 수를 설정합니다.
- **Ignore links in code blocks**: fenced code block, inline code, YAML frontmatter, HTML comment 내부 링크를 무시합니다.

Autolink는 항상 활성화되며 끄는 설정은 없습니다.

## 개인정보 및 네트워크 접근

Heading Autolink는 Obsidian 내부에서 로컬로 동작합니다.

- 노트나 설정을 외부 서비스로 전송하지 않습니다.
- Telemetry를 사용하지 않습니다.
- 설정은 현재 vault의 Obsidian plugin data file에 저장됩니다.

## 설치

### Community Plugins에서 설치

Obsidian Community Plugins directory에 등록된 이후:

1. Obsidian에서 **Settings**를 엽니다.
2. **Community plugins**로 이동합니다.
3. **Heading Autolink**를 검색합니다.
4. 플러그인을 설치하고 활성화합니다.

### 수동 설치

최신 GitHub release에서 다음 파일을 다운로드합니다.

- `main.js`
- `manifest.json`
- `styles.css`

아래 위치에 복사합니다.

```text
<Vault>/.obsidian/plugins/obsidian-heading-autolink/
```

Obsidian을 reload한 뒤 **Settings -> Community plugins**에서 **Heading Autolink**를 활성화합니다.

## 개발

의존성 설치:

```bash
npm install
```

개발 watcher 실행:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

Production build는 TypeScript를 검사하고, `src/main.ts`를 `main.js`로 bundle한 뒤 release file을 `build/`에 복사합니다.

다음 generated file은 repository에 commit하지 않습니다.

- `main.js`
- `build/`
