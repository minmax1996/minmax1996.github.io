---
layout: "../../../layouts/BlogPostLayout.astro"
title: "Your First Lua Binding"
author: "Maxim Minaev"
date: "28 Nov 2024"
draft: false
lang: en
---
# Your First Lua Binding

Creating your own bindings is a way to connect different programming languages, allowing you to use the capabilities of one language in another. For example, you can connect the functionality of a Go application to Lua scripts. Today, I'll show you how to write your own bindings in two different ways.

# Preparation
Let's assume you have a program that performs some specific logic and has an interface. Suppose it calculates the sha256 hash of query parameters according to a given logic:
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
and there's a `main` like this:
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
Build and install it in `/usr/local/bin/` so our program is available everywhere:
```bash
$ go build -o hasher .
$ cp hasher /usr/local/bin/hasher
```
Now we have a `hasher` binary that can be used like this:
```bash
$ hasher -algorithm sha256_raw -input 'https://example.com/some/link?q1=1&q2=2&g=3'
ca2a598def71c556327b531e2be48fbba879e2d596acdb60006b6ff4626dec2d
```
# Moving on to Lua
First, let's look at the simplest binding: a wrapper around a CLI command and its arguments.

Our interface is `hasher` with two mandatory flag parameters, `algorithm` and `input`, which returns the resulting string.
> From here on, I'll use `test.lua` as one of the usage examples:
```lua
-- test.lua
local hasherbinding = require("hasherbinding")
print(hasherbinding.hash("sha256_raw", "https://example.com/some/link?q1=1&q2=2&g=3")) -- Should print ca2a598def71c556327b531e2be48fbba879e2d596acdb60006b6ff4626dec2d`
```

Let's start by creating the simplest Lua module, `hasherbinder`:
```lua
-- hasherbinder.lua
local hasherbinder = {}

function hasherbinder.hash(alg, input)
     return "result"
end

return hasherbinder
```
At this stage, it only returns the string `"result"`. Let's add a call to [io.popen](https://www.lua.org/manual/5.4/manual.html#pdf-io.popen) with the command string and parameters, and read the response.
Ultimately, our `hasherbinder.lua` will look something like this:
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
Run `test.lua` and check the result:
```
$ lua test.lua
ca2a598def71c556327b531e2be48fbba879e2d596acdb60006b6ff4626dec2d
```
## Outcome
We managed to execute Go code from Lua using the compiled binary.

But... that's not enough for us, right?
# Let's go down the rabbit hole

Suppose we don't want to use the CLI to call the entire binary, but want to call specific methods directly, and **we have access to the source code**. To solve this problem, we can build a **C-Shared-Library** using cgo.

> Small disclaimer: Everything that follows was done on MacOS with Lua version 5.4.7. Paths to libraries and headers might differ on other operating systems and versions. I'll omit the details on how to install gcc and where to find Lua headers and libraries.

Well, let's continue…
Suppose our Go code has another method we want to expose:
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

Let's modify our `test.lua` to call both methods:
```lua
-- test.lua
local hasherbinding = require("hasherbinding")
print(hasherbinding.sha256_raw("https://example.com/some/link?q1=1&q2=2&g=3")) -- Should print ca2a598def71c556327b531e2be48fbba879e2d596acdb60006b6ff4626dec2d
print(hasherbinding.double_md5_sorted("https://example.com/some/link?q1=1&q2=2&g=3")) -- Should print 72df8c4cc5ae9c072fc101de65124298
```

Add a `cgo.go` file to our project and define the exported functions in it:
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
> Note: In these methods, we convert C strings (`*C.char`) to Go strings and back. Ideally, the memory allocated for `C.CString` should be freed manually using `C.free`, but since the result will be used elsewhere here, we'll free it there.

Build a **C Shared Library** from the project:
```bash
go build -o lib/libhasher.so -buildmode=c-shared .
```
In the output `lib` folder, we now have two files: `libhasher.h` and `libhasher.so`.
We'll need these to write the Lua binder in C.
Install `libhasher.so` into `/usr/local/lib/`:
```bash
sudo cp lib/libhasher.so /usr/local/lib/libhasher.so
```

To ensure the OS knows where the libraries are, don't forget to add the `/usr/local/lib` directory to `DYLD_LIBRARY_PATH` or `LD_LIBRARY_PATH` if it's not already there. This will save us from having to specify full paths to custom libraries in the future.
```bash
$ export DYLD_LIBRARY_PATH=/usr/local/lib:$DYLD_LIBRARY_PATH
$ export LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH
```
## Let's write the binder itself

Create a `src/` directory and place our header file `libhasher.h` there. Next to it, create `hasherbinding.c` where we describe our Lua module in C:
```c
#include <lua.h>
#include <lauxlib.h>
#include "libhasher.h"

int lua_sha256_raw(lua_State *L) {
    const char* str = luaL_checkstring(L, 1);
    char* result = Sha256Raw((char*)str);
    lua_pushstring(L, result);
    free(result); // Free the C string allocated by C.CString
    return 1;
}

int lua_double_md5_sorted(lua_State *L) {
    const char* str = luaL_checkstring(L, 1);
    char* result = DoubleMd5Sorted((char*)str);
    lua_pushstring(L, result);
    free(result); // Free the C string allocated by C.CString
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

The main magic happens in the `luaopen_hasherbinding` function: when the Lua interpreter tries to load a module via `require("mymodule")`, it looks for shared libraries and tries to find the function `luaopen_<module_name>` to initialize the `<module_name>` module. In our case, using the Lua C API and `lua_State *L`, we initialize the two functions of our module, which handle the core logic.

Let's build our binder and check the result:
```bash
gcc -shared -o hasherbinding.so \
	-fPIC src/hasherbinding.c \
	-I/opt/homebrew/Cellar/lua/5.4.7/include/lua5.4 \
	-L/opt/homebrew/Cellar/lua/5.4.7/lib \
	-llua -lhasher
```
What's happening here:
- `src/hasherbinding.c` and `-o hasherbinding.so` specify which file to compile and where to put the result.
- `-shared` and `-fPIC` tell the compiler to create a shared library and that we need Position-Independent Code (necessary for shared libraries), meaning code that can be loaded into memory without modification.
- `-I/opt/homebrew/Cellar/lua/5.4.7/include/lua5.4` tells the compiler where to find the header files `lua.h` and `lauxlib.h` for the `#include` directives.
- `-L/opt/homebrew/Cellar/lua/5.4.7/lib` tells the compiler where to find the libraries defined in the header files.
- `-llua` and `-lhasher` specify which libraries to link. Since we added `/usr/local/lib` to `LD_LIBRARY_PATH`, `hasher` will be found there.

## Let's check the result
Look at `test.lua` again:
```lua
-- test.lua
local hasher = require("hasherbinding")
print(hasher.sha256_raw("https://example.com/some/link?q1=1&q2=2&g=3")) -- Should print ca2a598def71c556327b531e2be48fbba879e2d596acdb60006b6ff4626dec2d
print(hasher.double_md5_sorted("https://example.com/some/link?q1=1&q2=2&g=3")) -- Should print 72df8c4cc5ae9c072fc101de65124298
```
and run it:
```bash
lua test.lua
ca2a598def71c556327b531e2be48fbba879e2d596acdb60006b6ff4626dec2d
72df8c4cc5ae9c072fc101de65124298
```
# Conclusion

Writing bindings opens up many new possibilities, from integrating languages to extending application functionality. Today, we successfully wrote a simple Lua binder for a program written in Go.

The complete code repository can be found at https://github.com/minmax1996/luabindingtutorial