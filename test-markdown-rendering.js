// Test script for markdown rendering
const testMarkdown = `
# Heading 1
## Heading 2
### Heading 3

This is a paragraph with **bold text** and *italic text*.

- List item 1
- List item 2
  - Nested list item

1. Ordered item 1
2. Ordered item 2

> This is a blockquote

\`\`\`javascript
// This is a code block
function hello() {
  console.log("Hello world!");
}
\`\`\`

And here is \`inline code\` within text.

[A link](https://example.com)

![An image](https://example.com/image.jpg)

---

Task list:
- [x] Completed task
- [ ] Incomplete task
`;

console.log('Test markdown content for rendering:');
console.log(testMarkdown);
