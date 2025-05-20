# Markdown Code Formatting Guide for MyNotes

## Inline Code

In Markdown, you can create inline code using backticks:
- Single backticks: `const example = "This is inline code";`
- Double backticks when you need to include backticks inside: ``const template = `Hello ${name}`;``

## Code Blocks

For code blocks, use triple backticks, optionally followed by a language name:

```javascript
// This is a JavaScript code block
function example() {
  return "Hello world";
}
```

```python
# This is a Python code block
def example():
    return "Hello world"
```

## How It Works in MyNotes

The Markdown rendering in MyNotes differentiates between:

1. **Inline Code** - Uses single or double backticks, displays inline with your text
2. **Code Blocks** - Uses triple backticks, displays as a separate block with syntax highlighting

Our renderer uses:
- The `inline` prop from ReactMarkdown to detect if code is inline
- CSS classes (`inline-code` vs `block-code`) to apply appropriate styling
- A DOM-manipulation technique to ensure code elements are properly classified

## Common Issues and Solutions

- If your inline code displays as a block, make sure:
  - You're using single backticks: `code`
  - You're not putting backticks on separate lines

- If your code block doesn't highlight properly:
  - Make sure there's no space between the opening triple backticks and the language name
  - Example: ```javascript (not ``` javascript)
  - Add a newline after the opening backticks

- If you need to include backticks in your inline code:
  - Use double backticks: ``code with `backticks` inside``

## Special Character Conversions

MyNotes automatically converts certain character sequences to special symbols:

| Type this | Get this | Description |
|-----------|----------|-------------|
| `->` | → | Right arrow |
| `--` | — | Em dash |

These conversions happen automatically as you type, making it easier to use these special characters in your notes.
