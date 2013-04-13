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

<table>
    <thead>
        <tr>
            <th>
                name
            </th>
            <th>
                type
            </th>
            <th>
                default
            </th>
            <th>
                description
            </th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>
                <strong>enabled</strong>
            </td>
            <td>
                <code>String</code>, <code>String[]</code>
            </td>
            <td></td>
            <td>
                <strong>Required</strong> Enabled compiler id(s). See below for included compilers.
            </td>
        </tr>
        <tr>
            <td>
                <strong>src</strong>
            </td>
            <td>
                <code>String</code>, <code>String[]</code>
            </td>
            <td>
                cwd
            </td>
            <td>
                Directories to search for source files to compile.
            </td>
        </tr>
        <tr>
            <td>
                <strong>dest</strong>
            </td>
            <td>
                <code>String</code>
            </td>
            <td>
                <code>src</code> or<br>
                <code>src[0]</code> if Array
            </td>
            <td>
                Directory to write compiled result.
            </td>
        </tr>
        <tr>
            <td>
                <strong>roots</strong>
            </td>
            <td>
                <code>{src:dest, ...}</code>,<br>
                <code>[[src, dest], ...]</code>
            </td>
            <td></td>
            <td>
                Allows you to specify multiple, ordered <code>src</code>-<code>dest</code> pairs. One of <code>roots</code> or <code>src</code> is required; <code>roots</code> takes precedence over <code>src</code> if present.
            </td>
        </tr>
        <tr>
            <td>
                <strong>log_level</strong>
            </td>
            <td>
                <code>String</code> , <code>Number</code>
            </td>
            <td>
                <code>WARN</code>
            </td>
            <td>
                Logging verbosity. Valid values (case-insensitive): <code>error</code>, <code>warn</code>, <code>info</code>, <code>debug</code>, <code>silent</code>, or a numeric constant (as found in <code>LOG</code>).
            </td>
        </tr>
        <tr>
            <td>
                <strong>create_dirs</strong>
            </td>
            <td>
                <code>Boolean</code>
            </td>
            <td>
                <code>true</code>
            </td>
            <td>
                Creates intermediate directories for destination files.
            </td>
        </tr>
        <tr>
            <td>
                <strong>mount</strong>
            </td>
            <td>
                <code>String</code>
            </td>
            <td></td>
            <td>
                Prefix trimmed off request path before matching/processing.
            </td>
        </tr>
        <tr>
            <td>
                <strong>delta</strong>
            </td>
            <td>
                <code>Number</code>
            </td>
            <td>
                <code>0</code>
            </td>
            <td>
                Delta <code>mtime</code> (in seconds) required for a derived file to be considered stale, and therefore recompiled. By default, any change will cause a file to be recompiled on next request.
            </td>
        </tr>
        <tr>
            <td>
                <strong>expires</strong>
            </td>
            <td>
                <code>Boolean</code>
            </td>
            <td>
                <code>false</code>
            </td>
            <td>
                Automatically treat files as stale if this old in secs.
            </td>
        </tr>
        <tr>
            <td>
                <strong>external_timeout</strong>
            </td>
            <td>
                <code>Number</code>
            </td>
            <td>
                <code>3000</code>
            </td>
            <td>
                Milliseconds after which to kill subprocess commands.
            </td>
        </tr>
        <tr>
            <td>
                <strong>cascade</strong>
            </td>
            <td>
                <code>Boolean</code>
            </td>
            <td>
                <code>false</code>
            </td>
            <td>
                Invoke all compilers that match? otherwise, only first.
            </td>
        </tr>
        <tr>
            <td>
                <strong>resolve_index</strong>
            </td>
            <td>
                <code>Boolean</code> , <code>String</code>
            </td>
            <td>
                <code>false</code>
            </td>
            <td>
                If <code>true</code>-y, directories are resolved with the supplied filename, where <code>true</code> maps to <code>'index.html'</code>.
            </td>
        </tr>
        <tr>
            <td>
                <strong>ignore</strong>
            </td>
            <td>
                <code>RegExp</code>
            </td>
            <td>
                <code>/\.(jpe?g|gif|png)$/i</code>
            </td>
            <td>
                Requests matching this pattern are short-circuit ignored, and no compiler matching occurs.
            </td>
        </tr>
        <tr>
            <td>
                <strong>allowed_methods</strong>
            </td>
            <td>
                <code>String[]</code>
            </td>
            <td>
                <code>['GET']</code>
            </td>
            <td>
                HTTP methods compiler should process. This setting is global-only -- per-compiler overrides specified via <code>options</code> will have no effect.
            </td>
        </tr>
        <tr>
            <td>
                <strong>options</strong>
            </td>
            <td>
                <code>{compilerId:settings, ...}</code>
            </td>
            <td></td>
            <td>
                Hash of additional per-compiler options, mapped by compiler id. Each compiler is supplied a copy of the <code>settings</code> object; if additional options are supplied in this way for a given compiler, they will be merged into the settings (and override any colliding top-level keys).
            </td>
        </tr>
    </tbody>
</table>



## Compilers

To enable a compiler, you specify its `id`, which you can get from the handy list that follows. Some
compilers take options, which you pass using the `options` setting using the compiler `id` as the
key.

For example, to disable the `bare` option for the CoffeeScript compiler, you'd do something like:

````js
server = connect.createServer(
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
)
````

### Compiler IDs

-   [CoffeeScript](http://coffeescript.org/) Compiler: `coffee`
-   [Coco](http://satyr.github.com/coco/) Compiler: `coco`
-   [LiveScript](http://http://livescript.net) Compiler: `livescript`
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

