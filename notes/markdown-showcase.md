# NoteItDown Markdown Showcase

This document demonstrates all the markdown features supported by NoteItDown.

## Text Formatting

**Bold text** and *italic text* or _another italic_ or even **_bold and italic_**

~~Strikethrough text~~ 

## Headers

# Header 1
## Header 2
### Header 3
#### Header 4
##### Header 5
###### Header 6

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
- [x] Completed task
- [ ] Another task

## Links and Images
[Link to Google](https://www.google.com)

![Image Alt Text](https://picsum.photos/200/300)

## Blockquotes

> This is a blockquote
> It can span multiple lines
>
> And even have multiple paragraphs

## Code

### Inline Code
Use the `console.log()` function to log messages.

### Code Blocks

```javascript
// JavaScript code block
function greet(name) {
  return `Hello, ${name}!`;
}

// Call the function
console.log(greet('World')); // Hello, World!
```

```python
# Python code block
def greet(name):
    return f"Hello, {name}!"

# Call the function
print(greet("World"))  # Hello, World!
```

```html
<!-- HTML code block -->
<div class="container">
  <h1>Hello World</h1>
  <p>This is a paragraph</p>
</div>
```

```css
/* CSS code block */
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

h1 {
  color: #3b82f6;
}
```

```jsx
// JSX code block
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}

const element = <Welcome name="Sara" />;
```

```sql
-- SQL code block
SELECT users.name, orders.order_date
FROM users
JOIN orders ON users.id = orders.user_id
WHERE orders.status = 'completed'
ORDER BY orders.order_date DESC;
```

### Unknown Languages

```unknown-language
This is a code block with an unknown language.
It should still be properly formatted.
```

## Tables

| Name     | Age | Occupation    |
|----------|-----|---------------|
| John     | 25  | Developer     |
| Jane     | 30  | Designer      |
| Bob      | 22  | Student       |

## Horizontal Rule

---

## Escaping Characters

\*This text is surrounded by asterisks but not italic\*

## Special Features

Automatic arrow conversion: -> should become → 

## Math (if supported)

Inline math: $E = mc^2$

Block math:
$$
\frac{d}{dx}(e^x) = e^x
$$
