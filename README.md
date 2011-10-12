## connect-compiler

[`connect`](http://senchalabs.github.com/connect/) middleware for dynamically recompiling derived files at serve-time. This module is designed for speeding up development; best-practices would have you compile all necessary files as part of your production deploy process.

Usage is the same as all other `connect` middleware:

````javascript
    var connect  = require('connect')
    ,   compiler = require('connect-compiler')
    
    ,   server = connect.createServer(
            connect.logger(),
            compiler({
                src     : 'src'
                dest    : 'var'
                enabled : [ 'coffee', 'uglify' ]
            }),
            connect.static(__dirname + '/public'),
            connect.static(__dirname + '/var')
        );
    
    server.listen(6969);
````


### Settings

The compiler middleware takes a settings object, minimally containing a list of compilers to enable (`enabled`). Most uses will also specify a source directory (`src`).

<table>
    <col>
    <col width="25%">
    <col>
    <col width="50%">
    <thead>
        <tr>
            <th>name</th>
            <th>type</th>
            <th>default</th>
            <th>description</th>
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
            <td>
                
            </td>
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
                <code>src</code><br>
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
                <code>{src:dest, ...}</code>, <br> <code>[[src, dest], ...]</code>
            </td>
            <td></td>
            <td>
                Allows you to specify multiple, ordered <code>src</code>-<code>dest</code> pairs. Only one of <code>roots</code> or <code>src</code> is required; <code>roots</code> takes precedence over <code>src</code> if present.
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
                <code>warn</code>
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



### Compilers

-   #### CoffeeScriptCompiler
    
    
-   #### CocoCompiler
    
    
-   #### CommonJSCompiler
    
    
-   #### UglifyCompiler
    
    
-   #### JadeCompiler
    
    
-   #### LessCompiler
    
    
-   #### SassJSCompiler
    
    
-   #### SassRubyCompiler
    
    
-   #### JisonCompiler
    
    
-   #### YamlCompiler
    
    

### API

-   #### CompilerMiddleware(settings={}, ...custom)
    
    
-   #### Compiler
    
    
-   #### ExternalCompiler
    
    



### Feedback




