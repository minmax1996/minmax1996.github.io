---
layout: "../../../layouts/BlogPostLayout.astro"
title: "Что такое Lua и с чем его едят"
author: "Maxim Minaev"
date: "14 Apr 2023"
draft: false
lang: ru
---
# Что такое Lua и с чем его едят

Lua — это скриптовый язык программирования, который был создан в 1993 году и отличается динамической типизацией. Он широко применяется для написания плагинов, которые расширяют функциональность различных приложений, таких как World of Warcraft, Redis, Nginx, NeoVim и многих других.

<br>

## Синтаксис

Синтаксис языка программирования Lua довольно прост и интуитивно понятен. Вот пример классического "Hello, World!" на Lua:

```lua
print("Hello, World!")
```

В Lua переменные бывают локальными и глобальными. 
Локальные переменные объявляются с ключевым словом `local`, а не ключевое слово `var`, которое используется во многих других языках программирования.

Глобальные переменные в Lua могут быть доступны в любом месте программы до тех пор, пока существует среда выполнения кода.
Также все глобальные переменные добавляются в зарезервированную таблицу **_G** и доступны через неё при исполнении других скриптов в пределах одной среды.

Пример переменной **_G** можно посмотреть в [демке](https://www.lua.org/cgi-bin/demo?globals)

```lua
g = "global"
local a = 1
print(g, _G.g) -- global	global
print(a, _G.a) -- 1	nil
```

В Lua вы можете определять несколько переменных в одной строке, используя запятую. Например:
```lua
local a, b, c = 1, "b", nil
```

Также в Lua можно использовать точку с запятой в конце строки, но это необязательно, если каждый оператор начинается с новой строки.

<br>

## Операторы
Lua поддерживает различные операторы, включая арифметические, отношения, логические и побитовые операторы.
```lua
-- arithmetic operators
a = 10
b = 20
c = a + b -- 30
d = a * b -- 200

-- relational operators
print(a < b) -- true
print(a <= b) -- true
print(a == b) -- false
print(a ~= b) -- true

-- logical operators
a, b = true, false
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

<br>

## Управляющие конструкции

### if-then-else 

В Lua есть конструкция `if-then-else`, которая позволяет выполнить действия в зависимости от условия. Синтаксис следующий:
```lua
if <condition1> then
	<expression1> 
[elseif <conditon2> then
	<expression2>]
[else
	<expression3>]
end
```
Конструкция if-then-else заканчивается ключевым словом `end`.

### while/repeat until

В Lua есть две конструкции для циклических вычислений: `while` и `repeat-until`.

Конструкция `while` выполняет выражение в цикле, пока условие истинно. 
Синтаксис конструкции `while` выглядит следующим образом:
```lua
while <condition> do
	<expression>
end
```

Конструкция `repeat-until` похожа на конструкцию `do-while` в других языках программирования.
Синтаксис конструкции `repeat-until` выглядит следующим образом:
```lua
repeat
	<expression>
until <condition>
```

### Цикл for
В языке Lua есть два вида цикла `for`: *числовой* и *общего вида*. Рассмотрим числовой цикл `for`.

В цикле for параметры задаются через запятую как: начальное значение итератора, конечное значение и шаг. Шаг является опциональным параметром, и по умолчанию равен 1.

То есть запись вида `for i=1,10,1 do` можно представить в виде `for (i=1; i<=10; i=i+1)`.

```lua
res = ""
for i=1,10,1 do res=res..i end
print(res) -- 12345678910

res = ""
for i=10,5,-1 do res=res..i end
print(res) -- 1098765
```

Как видно из примеров, в цикле `for` можно использовать как положительный, так и отрицательный шаг.

Для цикла в общем виде используется функция-итератор, которая возвращает пару значений: ключ и значение. В языке есть две встроенные функции, которые возвращают итераторы для таблиц: `ipairs()` и `pairs()`.

Функция `ipairs()` обычно используется для массивов, а `pairs()` для всего остального.

```lua
local a = {1,2,3}
-- print all values of array `a'
for i,v in ipairs(a) do
    print(i,v)
end
--[[
1	1
2	2
3	3
]]--

local t = {["a"] = 1,["b"] = 2,["c"] = 3}
-- print all keys of table `t'
for k,v in pairs(t) do
    print(k,v)
end
--[[
b	2
a	1
c	3
]]--
```

Также можно определять свои собственные итераторы, которые будут возвращать нужные пары ключ-значение при итерации по таблице.

### break/return

Для выхода из цикла до его завершения можно использовать оператор `break`. В языке Lua нет оператора `continue`, который позволяет перейти к следующей итерации цикла.

```lua
local found = false
for i=1,10,1 do
	if i == n then
		found = true
		break
	end
end
```

Для возврата значения из функции используется оператор `return`. В Lua функции могут возвращать несколько значений, например:

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

<br>

## Типы данных

в Lua есть 8 базовых типов данных:

`number`, `string`, `boolean`, `nil`, `table`, `function`, `thread`, `userdata`, 

### number

В Lua нет разделения на целые числа и числа с плавающей точкой, все считается number

```lua
local a = 42
local b = 3.14
local c = 1.01E+10
local d = 0xFFF
print(a, type(a)) -- 42	number
print(b, type(b)) -- 3.14	number
print(c, type(c)) -- 10100000000.0	number
print(d, type(d)) -- 4095	number
```

встроенная функция приведения к числу `tonumber(s)`

```lua
local sn = tonumber("1234")
print(sn, type(s)) -- 1234	number
```

### string

Строки представляют собой последовательность символов обрамленных в одинарные или двойные ковычки.

для многострочного текста используется `[[ ... ]]` а для конкатенации строк `..`

```lua
local h = "Hello"
local w = 'World'
local ml = [[
Hello
World
]]
print(h..w..'\n'..ml)
--[[
HelloWorld
Hello
World
]]--
```

Строки является иммутабельными, т.е. нельзя изменить один символ в оригинальной строке. Но можно используя встроенные функции получить новую, измененную строку

### Функции для работы со строками

```lua
string.upper("some lowercase string")) 
-- SOME LOWERCASE STRING
string.lower("SOME UPPERCASE STRING")) 
-- some uppercase string
string.gsub("misspell", "mis", "magic")) 
-- magicspell, 1
string.find("helloworldworld", "world"))     
-- 6 	10
string.find("helloworldworld", "world", 10)) 
-- 11	15
string.reverse("helloworld"))         
-- dlrowolleh
string.format("%d %s", 10, 'worlds')) 
-- 10 worlds
string.byte("A"), string.char(65))    
-- 65	A
string.len("Привет")) 
-- 12
string.rep(">", 3))  
-- >>>
```

Так же все функции можно применять к переменным типа string с помощью вызова метода

```lua
local s = "Hello Wordl"
print(s:gsub("Wordl", "World")) -- Hello World	1
```

### boolean

Тип принимающий значения true или false.

В Lua любое значение может представлять условие. Условные выражения считают `false` и `nil` как `false`, все остальное как `true` (включая 0 и пустую строку)

```lua
print(1==1) -- true
print(1==2) -- false
local a, b = "", 0
if a and b then -- true
  print("gotcha") -- prints
end
local c = nil
if c then
  print("never happen")
end
```

### nil

Nil — это ничего: пустое значение переменной, необъявленная переменная, результат выполнения функции, и тд

```lua
local a = nil
print(a, b, string.find("Hello", "World")) -- nil	nil	nil
```

### function


```lua
local function max(a,b)
	if a > b then
		return a
	else
		return b
	end
end
```

функцию можно присвоить переменой

```lua
local max = function(a,b)
	if a > b then
		return a
	else
		return b
	end
end
```

и определить неопределенное кол-во аргументов

```lua
function max(...)
	local args = {...}
	maxval = args[1]
	for i,v in ipairs(args) do
		if v > maxval then
			maxval = v
		end
	end
	return maxval
end
print(max(1,3,5,10)) -- 10
print(max()) -- nil
```

### table

Таблицы в Lua объединяют в себе словари, массивы, объекты

начнем с массивов: посчитаем первые 5 чисел Фиббоначи

```lua
local fib = {1, 1} -- создание таблицы
for i = 3,5,1 do --(i = 3, i <= 5, i = i + 1)
	-- с помощью #fib можно узнать текущую длину массива
	fib[#fib+1] = fib[#fib] + fib[#fib-1]
end

print(fib[1],fib[2],fib[3],fib[4],fib[5])
-- 1	1	2	3	5
```

словарь: посчитаем различные символы в строке “Hello world”

```lua
local chars = {}
local s = "HelloWorld"
-- gmatch возвращает итератор по вхождениям `.` (любой символ)
for c in s:gmatch(".") do
	-- (chars[c] or 0) возвращает 0 если chars[c] = nil тк ключ отсутствует в таблице
	chars[c] = (chars[c] or 0) + 1
end
-- к строковым ключам можно обращаться через точку как к полям объекта
print(chars["H"], chars.l) -- 1 3
```

объект: напишем собаку

```lua
local dog = {
  feeded = false,
  feed = function(self)
    self.feeded = true
  end,
  bark = function(self) 
    if self.feeded then
      print("happy bark")
    else
      print("grumpy bark")
    end
  end
}

dog:bark() -- grumpy bark
dog:feed()
dog:bark() -- happy bark
```


### thread

Тип thread относится к корутинам, создать отдельный тред можно с помощью модуля coroutine, где и находятся все методы взаимодействия с тредами

```lua
co = coroutine.create(function ()
	print("hi")
end)
    
print(type(co)) -- thread
```

Треды могут быть в 3 состояниях suspended, running, и dead. Проверить состояние можно с помощью `coroutine.status(co)` 

Подробнее про корутины можно почитать [тут](https://www.lua.org/pil/9.html)

### userdata

Значение типа `userdata` представляет собой указатель на блок памяти. Обычно используется для встраивания кода на Lua в другие программы, например с помощью **[C API](https://www.lua.org/pil/24.html)**
подробнее про `userdata` можно почитать [тут](https://www.lua.org/pil/28.1.html)