# Test of ModernMarkdownRenderer

This document tests the various Markdown features supported by our new implementation.

## Formatting Tests

**Bold text** and *italic text* and sometimes ***both***

~~Strikethrough text~~ is also supported

## Links and Images

[Link to Google](https://www.google.com "Google's Homepage") 

![Sample Image](https://picsum.photos/200/300 "Random Image")

## Code Samples

Inline code: `const x = 42;`

```javascript
// JavaScript code block
function greet(name) {
  console.log(`Hello, ${name}!`);
  return true;
}
```

```python
# Python code block
def factorial(n):
    if n == 0:
        return 1
    else:
        return n * factorial(n-1)
```

## Lists

### Unordered Lists
- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
- Item 3

### Ordered Lists
1. First item
2. Second item
   1. Nested item 2.1
   2. Nested item 2.2
3. Third item

## Task Lists
- [ ] Unchecked task
- [x] Checked task
- [ ] Another task to complete

## Tables

| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
| Cell 7   | Cell 8   | Cell 9   |

## Blockquotes

> This is a blockquote
> It can span multiple lines
>
> And even have paragraphs

## Horizontal Rule

---

## That's all folks!
