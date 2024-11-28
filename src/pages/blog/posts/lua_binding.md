---
layout: "../../../layouts/BlogPostLayout.astro"
title: "Первый биндинг для Lua"
author: "Maxim Minaev"
date: "28 Nov 2024"
draft: false
lang: ru
---
# Первый биндинг для Lua

Создание своих биндингов — это способ связать разные языки программирования, чтобы использовать возможности одного языка в другом. Например, можно подключить функционал Go-приложения к Lua-скриптам. Сегодня я расскажу, как написать свои биндинги 2 разными способами.

# Подготовка
 Предположим у вас есть программа, которая делает какую-то специфичную логику, и имеет какой-то интерфейс, предположим она считает sha256 от query параметров по заданной логике:
```go
 //lib.go
 func sha256Raw(input string) string {
	// Parse the input URL
	urlParsed, err := url.Parse(input)
	if err != nil {
		return ""
	}
	// Hash the raw query string
	hash := sha256.New()
	hash.Write([]byte(urlParsed.RawQuery))
	return hex.EncodeToString(hash.Sum(nil))
}
```
и есть такой main
```go
//main.go
package main

import (
	"flag"
)

var (
	algorithmFlag = flag.String("algorithm", "", "The hashing algorithm to use")
	inputFlag     = flag.String("input", "", "The input to hash")
)

func init() {
	flag.Parse()
}

func main() {
	switch *algorithmFlag {
	case "sha256_raw":
		hash := sha256Raw(*inputFlag)
		println(hash)
	default:
		println("Unknown algorithm")
	}
}
```
Билдим и устанавливаем в `/usr/local/bin/` чтобы наша программа была доступна везде
```bash
$ go build -o hasher .
$ cp hasher /usr/local/bin/hasher
```
Теперь у нас есть бинарник hasher который можно использовать так:
```bash
$ hasher -algorithm sha256_raw -input 'https://example.com/some/link?q1=1&q2=2&g=3'
ca2a598def71c556327b531e2be48fbba879e2d596acdb60006b6ff4626dec2d
```
# Переходим к Lua
Для начала посмотрим на самый простой биндинг: как обертку вокруг cli команды и ее аргументов.

Наш интерфейс — это hasher с 2 обязательным параметрами-флагами `algorithm` и `input`, который возвращает результирующую строку.
> Тут и дальше, я буду использовать `test.lua` как один из вариантов использования:
```lua
-- test.lua
local hasherbinding = require("hasherbinding")
print(hasherbinding.hash("sha256_raw", "https://example.com/some/link?q1=1&q2=2&g=3")) -- Should print ca2a598def71c556327b531e2be48fbba879e2d596acdb60006b6ff4626dec2d`
```

Начнем с создания самого простого модуля `hasherbinder` на Lua:
```lua
-- hasherbinder.lua
local hasherbinder = {}

function hasherbinder.hash(alg, input)
     return "result"
end

return hasherbinder
```
На данном этапе он только возвращает строку `"result"`. Добавим вызов [io.popen](https://www.lua.org/manual/5.4/manual.html#pdf-io.popen) со строкой вызова с параметрами, и прочитаем ответ.
В итоге наш `hasherbinder.lua` будет выглядеть примерно так:
```lua
-- hasherbinder.lua
local hasherbinder = {}

local hasherformat = "hasher -algorithm %s -input '%s'"

function hasherbinder.hash(alg, input)
    local handle = io.popen(string.format(hasherformat, alg, input))
    local result = handle:read("*a")
    handle:close()
    return result
end

return hasherbinder
```
запустим `test.lua` и проверим работу:
```
$ lua test.lua
ca2a598def71c556327b531e2be48fbba879e2d596acdb60006b6ff4626dec2d
```
## Итог
У нас получилось выполнить код написанный на Go из Lua, через собранный бинарник.

Но... нам же этого мало??
# Let’s go down the rabbit hole

Предположим, мы не хотим использовать cli для вызова всего бинарника, а хотим вызывать определенные методы напрямую и **у нас есть доступ к коду**. Чтобы решить эту проблему можно собрать **C-Shared-Library** с помощью cgo.

> Небольшой дисклеймер: все что происходит дальше было выполнено на MacOS, с версией Lua 5.4.7. На других операционных системах и версиях могут отличаться пути, к либам и хедерам. Как устанавливать gcc и где найти хедеры и либы Lua, я пожалуй опущу из повествования. 

Ну, продолжим…
Предположим в нашем коде на Go есть еще один метод, который мы хотим открыть для использования:
```go
//lib.go
func doubleMd5Sorted(input string) string {
	// Parse the input URL
	urlParsed, err := url.Parse(input)
	if err != nil {
		return ""
	}
	// Sort the query parameters
	queryParams := urlParsed.Query()
	keys := make([]string, 0, len(queryParams))
	for key := range queryParams {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	// Create the sorted query string
	sortedParams := []string{}
	for _, key := range keys {
		sortedParams = append(sortedParams, key+"="+queryParams.Get(key))
	}
	sortedParamsStr := strings.Join(sortedParams, "&")
	// Hash the sorted query string twice
	firstHash := md5.Sum([]byte(sortedParamsStr))
	secondHash := md5.Sum(firstHash[:])
	return hex.EncodeToString(secondHash[:])
}
```

Изменим наш `test.lua` чтобы вызывать оба метода:
```lua
-- test.lua
local hasherbinding = require("hasherbinding")
print(hasherbinding.sha256_raw("https://example.com/some/link?q1=1&q2=2&g=3") -- Should print ca2a598def71c556327b531e2be48fbba879e2d596acdb60006b6ff4626dec2d
print(hasherbinding.double_md5_sorted("https://example.com/some/link?q1=1&q2=2&g=3")) -- Should print 72df8c4cc5ae9c072fc101de65124298
```

Добавим к нашему проекту файл `cgo.go` и определим в нем экспортируемые функции
```go
//cgo.go
package main

import "C"

//export DoubleMd5Sorted
func DoubleMd5Sorted(input *C.char) *C.char {
	goInput := C.GoString(input)
	result := doubleMd5Sorted(goInput)
	return C.CString(result)
}

//export Sha256Raw
func Sha256Raw(input *C.char) *C.char {
	goInput := C.GoString(input)
	result := sha256Raw(goInput)
	return C.CString(result)
}
```
> Note: в этих методах мы конвертируем Си-шные строки (`*char`) в гошные строки и обратно. По хорошему, память под `C.CString` надо вручную освобождать с помощью `C.free`, но т.к. именно тут результат будет использован в другом месте, то освободим ее уже там.

 Сбилдим из проекта **C Shared Library**
```
go build -o lib/libhasher.so -buildmode=c-shared .
```
на выходе в папке `lib` у нас появилось 2 файла `libhasher.h` и `libhasher.so` 
они нам понадобятся для того чтобы написать binder к Lua уже на языке C.
`libhasher.so` Мы установим в `/usr/local/lib/`
```
sudo cp lib/libhasher.so /usr/local/lib/libhasher.so
```

Чтобы ОС видела, где находятся либы, надо не забыть добавить папку /usr/local/lib в `DYLD_LIBRARY_PATH` или `LD_LIBRARY_PATH` если еще нет. Это поможет нам в будущем не прописывать все пути к пользовательским библиотекам.
```
$ export DYLD_LIBRARY_PATH=/usr/local/lib:$DYLD_LIBRARY_PATH
$ export LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH
```
## Перейдем к написанию самого биндера

Создадим директорию src/ и положим туда наш хедер файл  `libhasher.h` , а рядом
Создадим `hasherbinding.c` в котором опишем наш модуль для Lua на языке C:
```c
#include <lua.h>
#include <lauxlib.h>
#include "libhasher.h"

int lua_sha256_raw(lua_State *L) {
    const char* str = luaL_checkstring(L, 1);
    char* result = Sha256Raw((char*)str);
    lua_pushstring(L, result);
    free(result);
    return 1;
}

int lua_double_md5_sorted(lua_State *L) {
    const char* str = luaL_checkstring(L, 1);
    char* result = DoubleMd5Sorted((char*)str);
    lua_pushstring(L, result);
    free(result);
    return 1;
}

// Register your functions
int luaopen_hasherbinding(lua_State *L) {
    static const struct luaL_Reg mylib[] = {
        {"sha256_raw", lua_sha256_raw},
        {"double_md5_sorted", lua_double_md5_sorted},
        {NULL, NULL}
    };
    luaL_newlib(L, mylib);
    return 1;
}
```

Главная магия тут происходит в функции `luaopen_hasherbinding`: когда интерпретатор Lua пытается подключить модуль через `require("mymodule")`, он ищет shared libraries и пытается найти функцию `luaopen_<module_name>` чтобы проинициализировать модуль `<module_name>`. В нашем случае, используя Lua C API и с помощью `lua_State *L` инициализируем 2 функции нашего модуля, которые уже и занимаются основной логикой. 

Сбилдим же наш биндер и проверим результат
```
gcc -shared -o hasherbinding.so \ 
	-fPIC src/hasherbinding.c \
	-I/opt/homebrew/Cellar/lua/5.4.7/include/lua5.4 \
	-L/opt/homebrew/Cellar/lua/5.4.7/lib \
	-llua -lhasher
```
Что же тут происходит:
- `src/hasherbinding.c` и  `-o hasherbinding.so` какой именно файл нужно компилировать и куда положить результат
- `-shared` и `-fPIC` говорят компилятору что нужно скомпилировать shared library и что нам нужен Position-Independent Code, те тот который может быть загружен в память без изменений (необходимо для shared)
- `-I/opt/homebrew/Cellar/lua/5.4.7/include/lua5.4` говорит где найти header файлы `lua.h` и `lauxlib.h` в `#include`
- `-L/opt/homebrew/Cellar/lua/5.4.7/lib` говорит где найти либы определенные в header файлах
- `-llua` и `-lhasher` говорят какие именно либы нужно искать, и тк мы добавили `/usr/local/lib` в `LD_LIBRARY_PATH` то hasher мы найдем именно там

## Проверим результат
Посмотрим еще раз на `test.lua`:
```lua
local hasher = require("hasherbinding")
print(hasher.sha256_raw("https://example.com/some/link?q1=1&q2=2&g=3") -- Should print ca2a598def71c556327b531e2be48fbba879e2d596acdb60006b6ff4626dec2d
print(hasher.double_md5_sorted("https://example.com/some/link?q1=1&q2=2&g=3")) -- Should print 72df8c4cc5ae9c072fc101de65124298
```
и запустим:
```bash
lua test.lua 
ca2a598def71c556327b531e2be48fbba879e2d596acdb60006b6ff4626dec2d
72df8c4cc5ae9c072fc101de65124298
```
# Итог

Написание биндингов открывает много новых возможностей: от интеграции языков до расширения функционала приложений. Итого у нас сегодня получилось написать самый простой биндер для Lua к программе написанной на Go.

Полный репозиторий с кодом можно найти на https://github.com/minmax1996/luabindingtutorial