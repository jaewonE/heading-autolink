# Heading Autolink

[ [English](https://github.com/jaewonE/obsidian-heading-autolink) | [한국어](https://github.com/jaewonE/obsidian-heading-autolink/blob/master/README.ko.md) ]

Heading Autolink is an Obsidian plugin that keeps Markdown heading wikilinks in sync when headings are renamed.

Obsidian already tracks file renames, but it does not automatically update heading targets inside wikilinks. This plugin fills that gap for links such as:

```markdown
[[a#title1]]
[[a#title1|title1]]
```

When the heading `title1` in `a.md` is renamed to `newTitle1`, matching links in the vault are updated:

```markdown
[[a#newTitle1]]
[[a#newTitle1|newTitle1]]
```

## Features

- Detect a single Markdown heading rename and update matching vault wikilinks.
- Preserve custom aliases while updating the heading target.
- Update aliases when the alias exactly matches the old heading text.
- Avoid ambiguous simple links when the old heading text was duplicated.
- Open a heading picker by typing `#` after a simple file wikilink, for example `[[note]]#`.
- Insert a single heading link with `Enter` or mouse click.
- Insert a selected heading and its descendants from the picker using the recursive insert button.
- Support recursive insertion in plain text, ordered lists, unordered lists, and `- {icon}` lists.
- Automatically add aliases to heading wikilinks after leaving the line.
- Ignore fenced code blocks, inline code, YAML frontmatter, and HTML comments by default.
- Show a notice with the number of updated files and links after autolink changes are applied.

## Supported Wikilinks

Supported examples:

```markdown
[[a#title1]]
[[a#title1|title1]]
[[folder/a#title1]]
[[a.md#title1]]
[[a#heading1#heading2]]
[[a#heading1#heading2|heading2]]
```

Unsupported examples:

```markdown
![[a#title1]]
[[#local heading]]
[[a#^block]]
[title](a.md#title1)
[[a|alias]]#
```

## Picker

Type `#` immediately after a simple file wikilink:

```markdown
[[note]]#
```

If the target note resolves to a Markdown file with headings, the picker opens below the cursor.

Default picker controls:

| Action | Control |
| --- | --- |
| Move selection | Arrow keys |
| Insert selected heading | `Enter` or heading click |
| Insert heading and descendants | Left recursive insert button |
| Filter headings | Search input |
| Close picker | `Escape` |

The recursive insert button appears as the heading level label by default. When the row is hovered or selected, headings with descendants show the recursive insert icon.

## Auto Alias

When enabled, auto alias updates alias-free heading links after you move away from the line:

```markdown
[[a#title1]]
```

becomes:

```markdown
[[a#title1|title1]]
```

Hierarchical heading links use the final heading segment as the alias:

```markdown
[[a#heading1#heading2|heading2]]
```

## Settings

- **Enable Title Picker**: Show a heading picker when typing `#` after `[[note]]`.
- **Enable Auto Alias**: Add missing aliases to heading wikilinks after leaving the line.
- **Picker Size**: Choose `small`, `medium`, or `large`.
- **Picker Max Visible Items**: Set how many picker results are visible before scrolling.
- **Ignore links in code blocks**: Skip links inside fenced code blocks, inline code, YAML frontmatter, and HTML comments.

Autolink is always enabled and does not have an off switch.

## Privacy and Network Access

Heading Autolink works locally inside Obsidian.

- It does not send notes or settings to any external service.
- It does not use telemetry.
- It stores settings in Obsidian's normal plugin data file for the current vault.

## Installation

### From Community Plugins

After the plugin is accepted into the Obsidian Community Plugins directory:

1. Open **Settings** in Obsidian.
2. Go to **Community plugins**.
3. Search for **Heading Autolink**.
4. Install and enable the plugin.

### Manual Installation

Download the release assets from the latest GitHub release:

- `main.js`
- `manifest.json`
- `styles.css`

Copy them into:

```text
<Vault>/.obsidian/plugins/obsidian-heading-autolink/
```

Then reload Obsidian and enable **Heading Autolink** from **Settings -> Community plugins**.

## Development

Install dependencies:

```bash
npm install
```

Start the development watcher:

```bash
npm run dev
```

Run a production build:

```bash
npm run build
```

The production build type-checks the plugin, bundles `src/main.ts` into `main.js`, and copies the release files into `build/`.

Generated release files are not committed to the repository:

- `main.js`
- `build/`
