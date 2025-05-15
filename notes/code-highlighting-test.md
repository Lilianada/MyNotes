# Testing Code Syntax Highlighting

This note demonstrates syntax highlighting for various code languages and handling of unknown languages.

## JavaScript
```javascript
function greet(name) {
  return `Hello, ${name}!`;
}

// Call the function
const message = greet("World");
console.log(message); // Hello, World!
```

## Python
```python
def greet(name):
    return f"Hello, {name}!"

# Call the function
message = greet("World")
print(message)  # Hello, World!
```

## Unknown Language
```code
This is some code with an unknown language identifier.
It should default to plaintext highlighting without errors.
```

## No Language Specified
```
This code block has no language specified.
It should render without errors as plaintext.
```

## CSS
```css
.container {
  display: flex;
  justify-content: center;
  color: #333;
}

/* Media query example */
@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
}
```

## TypeScript
```typescript
interface Person {
  name: string;
  age: number;
}

class Employee implements Person {
  name: string;
  age: number;
  salary: number;
  
  constructor(name: string, age: number, salary: number) {
    this.name = name;
    this.age = age;
    this.salary = salary;
  }
  
  greet(): string {
    return `Hello, my name is ${this.name}`;
  }
}
```
