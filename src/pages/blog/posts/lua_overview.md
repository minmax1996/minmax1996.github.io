---
layout: "../../../layouts/BlogPostLayout.astro"
title: "Lua programming language"
author: "Maxim Minaev"
date: "14 Apr 2023"
draft: false
lang: en
---
# Lua programming language
Lua is a lightweight, high-level programming language designed for embedded systems and scripting. It is a powerful language with a simple syntax that makes it easy to learn and use.

# Syntax
## Variables
Variables in Lua can be local or global.

Local variables are declared with the local keyword, while all others are considered global.

Global variables are accessible as long as the code execution environment exists.

All variables declared as global are added to the reserved table _G and are accessible through it when executing other scripts within the same environment.

```lua
-- local variable
local x = 10 

-- global variable
y = 20 
```

## Operators
Lua has a variety of operators, including arithmetic, relational, logical, and bitwise operators.

```lua
-- arithmetic operators
a = 10
b = 20
c = a + b -- 30
d = a * b -- 200

-- relational operators
a = 10
b = 20
print(a < b) -- true
print(a <= b) -- true
print(a == b) -- false
print(a ~= b) -- true

-- logical operators
a = true
b = false
print(a and b) -- false
print(a or b) -- true
print(not a) -- false

-- bitwise operators
a = 5 -- 00000101
b = 3 -- 00000011
print(a & b) -- 00000001 (1)
print(a | b) -- 00000111 (7)
print(a ~ b) -- 00000110 (6)
print(a << 1) -- 00001010 (10)
print(a >> 1) -- 00000010 (2)
```

## Control Structures
### if then else
```lua
if <condition> then
	<expression> 
[elseif <conditon> then
	<expression>]
[else
	<expression>]
end
```
### while/repeat until
```lua
while <condition> do
	<expression>
end
```
repeat
	<expression>
until <condition>

### Numeric for
```lua
for i=1,10,1 do
	<expression>
end
```
### Generic for
```lua
for k,v in pairs(t) do
	<expression>
end

for i,v in ipairs(a) do
	<expression>
end
```
### Break/Return
To exit a loop early, you can use the break statement.
```lua
for i=1,10,1 do
	if i == n then
		found = true
		break
	end
end
```
To return a value from a function, use the return keyword.
```lua
local function contains(arr, element)
	for i,v in ipairs(arr) do
		if v == element then
			return true, i
		end
	end
	return false, 0
end

print(contains({1,2,3,4,5},3)) -- true	3
```
### Conclusion
Lua is a powerful and versatile language that can be used for a variety of tasks, from game development to web programming. Its simplicity and flexibility make it a popular choice for developers worldwide.