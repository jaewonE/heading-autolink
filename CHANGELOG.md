# Changelog

## 1.3.1

- Preserves an existing heading target when Fast Alias is inserted from a heading wikilink trigger such as `[[note#Heading|Heading]]#`.

## 1.3.0

- Opens the picker after existing heading wikilinks such as `[[note#Heading|Heading]]#`, allowing a selected heading or Fast Alias to replace the trigger link.

## 1.2.2

- Opens the picker for resolved Markdown wikilinks even when the target note has no headings, leaving the heading result list empty while Fast Alias remains available.

## 1.2.1

- Registers picker `Mod+Enter`, `Meta+Enter`, and `Ctrl+Enter` shortcuts so Fast Alias insertion works through Obsidian's keymap scope.

## 1.2.0

- Adds picker-based Fast Alias insertion from the current heading search text.
- Keeps `Enter` selecting the highlighted heading when results are available.
- Uses `Command+Enter` on macOS or `Ctrl+Enter` on Windows/Linux to force alias insertion even when heading results are visible.
- Uses `Enter` to insert a file alias when the search text has no matching heading results.
