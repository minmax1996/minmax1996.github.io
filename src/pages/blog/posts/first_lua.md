---
layout: "../../../layouts/BlogPostLayout.astro"
title: "What is Lua and Why You Should Try It"
author: "Maxim Minaev"
date: "14 Apr 2023"
draft: false
lang: en
---

# 🐉 What is Lua and Why You Should Try It

Lua is a lightweight, fast, and flexible scripting language that appeared in 1993. It's written in C and is most often used not as a standalone language, but as an **embeddable tool** for other applications.

If you've played *World of Warcraft* and installed addons, you've already encountered Lua. Redis executes Lua scripts internally. Nginx uses it to handle HTTP requests. In NeoVim, plugins can also be written in Lua. In short — the language isn't among the most popular, but it's extremely useful and embeddable in many infrastructural solutions.

---

## 🚀 Lua Syntax: Simple and Clear

Let's start with the classic:

```lua
print("Hello, World!")
```

Lua's syntax slightly resembles Pascal and Python: constructs end with `end`, types are inferred automatically, everything is simple and compact — ideal for scripts and prototypes.

The language has local and global variables:

- Local variables are declared using `local` and only exist within the current block.
- Global variables are the default. They are stored in a special table `_G`, accessible from any piece of code running in the same execution environment.

A slightly more practical example — a problem from [Advent of Code 2022, Day 1](https://adventofcode.com/2022/day/1):
Find the maximum sum of numbers grouped into blocks separated by empty lines.
```lua
local max, current = 0, 0
for line in io.lines("input.txt") do
    if line == "" then
        if current > max then
            max = current
        end
        current = 0
    else
        current = current + tonumber(line)
    end
end

if current > max then
    max = current
end

print(max)
```

---

## 🧩 Data Types in Lua

Lua has only eight basic types:

```
number, string, boolean, nil, function, table, thread, userdata
```

### Some Nuances:

- `number` combines both integers and floating-point numbers.
- `string` — regular strings, are immutable.
- `nil` — Null, Nil, None, call it what you want.
- `function` — functions are first-class values. Functions can be assigned to variables, passed as arguments, and returned from other functions.
- `table` — a universal data structure: array (indexed from 1), dictionary, and object — all in one.
- `thread` — coroutines.
- `userdata` — interface for interacting with C data.

Typing is dynamic and weak: variables can change type on the fly, and Lua often tries to "guess" your intention. For example, the string "42" can be implicitly converted to a number.

---

## 🔌 Embeddability: Lua's Main Strength

Lua can be conveniently embedded into any C or even Go program. The interpreter provides a [simple C API](https://www.lua.org/pil/24.html) through which you can execute scripts, exchange data, and extend the language with new functions.

### Example: How to Execute a Lua Script from Go

Lua file `fib5.lua`:

```lua
function fib(n)
    local fib = {1, 1}
    for i = 3,n,1 do
        fib[#fib+1] = fib[#fib] + fib[#fib-1]
    end
    return fib[n]
end
return fib(5)
```

Go program:

I will use the package [github.com/yuin/gopher-lua](https://github.com/yuin/gopher-lua) which provides a simple interaction interface, but if desired, you can do without extra dependencies using CGO.

```go
package main

import (
	"fmt"

	lua "github.com/yuin/gopher-lua"
)

func main() {
	var l *lua.LState = lua.NewState()
	defer l.Close()
	if err := l.DoFile("fib5.lua"); err != nil {
		panic(err)
	}

	// get the execution result from the top of the stack
	result := l.Get(-1)
	// and clear it
	l.Pop(1)
	fmt.Printf("result: %d\n", result) // result: 5
}
```

If we want to perform the calculation again, we don't need to reload the file; the function fib(n) is already in the global variables of our l *lua.LState. We just need to retrieve it, put it on the stack along with the arguments, and then call l.Call(nargs, nret).

```go
...
// push the function from global variables onto the stack
l.Push(l.GetGlobal("fib")) // stack: function "fib"
// push the function argument onto the stack
l.Push(lua.LNumber(15))    // stack: function "fib", 15
// l.Call takes the function and 1 argument from the stack, and pushes 1 result back
l.Call(1, 1)               // stack: 610
result = l.Get(-1)         // stack: 610
l.Pop(1)                   // stack:
fmt.Printf("result: %d\n", result) //result: 610
```
---

## 🌐 Where Lua is Already Used

Lua is actively used in real projects:

- **World of Warcraft** — addons and interface.
- **Redis** — atomic operations in scripts.
- **Nginx** — `ngx_http_lua_module` module.
- **NeoVim** — modern API for plugins.
- **Game engines** — Defold, Pico-8, Love2D, and others.

---

## 🧪 Why Learn Lua in 2025?

Lua is not a universal language for all occasions. But if you:

- write backend code using Nginx or Redis,
- work with NeoVim and want to create plugins,
- or simply want to embed a scripting language into your application,

...then Lua is the perfect tool. It's small, fast, and flexible. Plus — it pleasantly surprises with its conciseness.

