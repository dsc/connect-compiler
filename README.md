# connect-compiler

[`connect`](http://senchalabs.github.com/connect/) middleware for dynamically recompiling derived files at serve-time. This module is designed for speeding up development; best-practices would have you compile all necessary files as part of your production deploy process. But you knew that, of course.

Usage is the same as all other `connect` middleware:

````js
    var connect  = require('connect')
    ,   compiler = require('connect-compiler')
    
    ,   server = connect.createServer(
            connect.logger(),
            compiler({
                enabled : [ 'coffee', 'uglify' ],
                src     : 'src',
                dest    : 'var'
            }),
            connect.static(__dirname + '/public'),
            connect.static(__dirname + '/var')
        )
    ;
    
    server.listen(6969);
````

Of note, earlier versions of `connect` actually came with a module like this, but not any longer.


## Installation

Via [npm](http://npmjs.org/):

````sh
npm install connect-compiler
````

Or if you want to hack on the source:

````sh
git clone https://github.com/dsc/connect-compiler.git
cd connect-compiler
npm link
````


## Settings

The compiler middleware takes a settings object, minimally containing a list of compilers to 
enable (`enabled`). Most uses will also specify a source directory (`src`).

| name                 | type                                          | default                          | description                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **enabled**          | `String`, `String[]`                          |                                  | **Required** Enabled compiler id(s). See below for included compilers.                                                                                                                                                                                                             |
| **src**              | `String`, `String[]`                          | cwd                              | Directories to search for source files to compile.                                                                                                                                                                                                                                 |
| **dest**             | `String`                                      | `src` or <br/> `src[0]` if Array | Directory to write compiled result.                                                                                                                                                                                                                                                |
| **roots**            | `{src:dest, ...}`, <br/> `[[src, dest], ...]` |                                  | Allows you to specify multiple, ordered `src`-`dest` pairs. One of `roots` or `src` is required; `roots` takes precedence over `src` if present.                                                                                                                                   |
| **log_level**        | `String` , `Number`                           | `WARN`                           | Logging verbosity. Valid values (case-insensitive): `error`, `warn`, `info`, `debug`, `silent`, or a numeric constant (as found in `LOG`).                                                                                                                                         |
| **create_dirs**      | `Boolean`                                     | `true`                           | Creates intermediate directories for destination files.                                                                                                                                                                                                                            |
| **mount**            | `String`                                      |                                  | Prefix trimmed off request path before matching/processing.                                                                                                                                                                                                                        |
| **delta**            | `Number`                                      | `0`                              | Delta `mtime` (in seconds) required for a derived file to be considered stale, and therefore recompiled. By default, any change will cause a file to be recompiled on next request.                                                                                                |
| **expires**          | `Boolean`                                     | `false`                          | Automatically treat files as stale if this old in secs.                                                                                                                                                                                                                            |
| **external_timeout** | `Number`                                      | `3000`                           | Milliseconds after which to kill subprocess commands.                                                                                                                                                                                                                              |
| **cascade**          | `Boolean`                                     | `false`                          | Invoke all compilers that match? otherwise, only first.                                                                                                                                                                                                                            |
| **resolve_index**    | `Boolean` , `String`                          | `false`                          | If `true`-y, directories are resolved with the supplied filename, where `true` maps to `'index.html'`.                                                                                                                                                                             |
| **ignore**           | `RegExp`                                      | `/\.(jpe?g!gif!png)$/i`          | Requests matching this pattern are short-circuit ignored, and no compiler matching occurs.                                                                                                                                                                                         |
| **allowed_methods**  | `String[]`                                    | `['GET']`                        | HTTP methods compiler should process. This setting is global-only -- per-compiler overrides specified via `options` will have no effect.                                                                                                                                           |
| **options**          | `{compilerId:settings, ...}`                  |                                  | Hash of additional per-compiler options, mapped by compiler id. Each compiler is supplied a copy of the `settings` object; if additional options are supplied in this way for a given compiler, they will be merged into the settings (and override any colliding top-level keys). |


## Compilers

To enable a compiler, you specify its `id`, which you can get from the handy list that follows. Some
compilers take options, which you pass using the `options` setting using the compiler `id` as the
key.

For example, to disable the `bare` option for the CoffeeScript compiler, you'd do something like:

````js
var server = connect.createServer(
    compiler({
        enabled : [ 'coffee' ],
        src     : 'src',
        dest    : 'var',
        options : {
            'coffee' : {
                'bare' : false
            }
        }
    }),
    connect.static(__dirname + '/public'),
    connect.static(__dirname + '/var')
);
````


### Compiler IDs

-   [CoffeeScript](http://coffeescript.org/) Compiler: `coffee`
-   [Coco](http://satyr.github.com/coco/) Compiler: `coco`
-   [LiveScript](http://livescript.net) Compiler: `livescript`
-   [Uglify](https://github.com/mishoo/UglifyJS) Compiler: `uglify`
-   [Jade](http://jade-lang.com/) Compiler: `jade`
-   [Handlebars](http://handlebarsjs.com/) Compiler: `handlebars`
-   [Stylus](http://learnboost.github.com/stylus/) Compiler: `stylus`
-   [Less](http://lesscss.org/) Compiler: `less`
-   [Sass](http://sass-lang.com/) Compiler: `sass` -- Using [sass.js](https://github.com/visionmedia/sass.js).
-   [SassRuby](http://sass-lang.com/) Compiler: `sass_ruby` -- External compiler using a shell command to 
    the [Ruby version of Sass](http://sass-lang.com/download.html) (install via `gem install sass`).
-   [Jison](http://zaach.github.com/jison/) Compiler: `jison`
-   [YAML](https://github.com/visionmedia/js-yaml) Compiler: `yaml`
-   [Snockets](http://github.com/TrevorBurnham/snockets) Compiler: `snockets`


## Feedback

Find a bug or want to contribute? Open a ticket on [github](http://github.com/dsc/connect-compiler). 
You're also welcome to send me email at [dsc@less.ly](mailto:dsc@less.ly?subject=connect-compiler).

