var fs, path, parse, child_process, exec, spawn, EventEmitter, Seq, CompilerMiddleware, exports, compilers, LOG, DEFAULTS, register, Compiler, ExternalCompiler, CoffeeScriptCompiler, CocoCompiler, CommonJSCompiler, UglifyCompiler, JadeCompiler, LessCompiler, SassJSCompiler, SassRubyCompiler, JisonCompiler, YamlCompiler, cs, c, expand, _i, _len, __slice = [].slice;
fs = require('fs');
path = require('path');
parse = require('url').parse;
child_process = require('child_process');
exec = child_process.exec;
spawn = child_process.spawn;
EventEmitter = require('events').EventEmitter;
Seq = require('seq');
/**
 * Sets up an instance of the CompilerMiddleware.
 * 
 * @param {Object} [settings={}] 
 * @param {Compiler[]} [...custom] 
 * @returns {Function}
 */
exports = module.exports = CompilerMiddleware = function(settings){
  var custom, CWD, srcDirs, destDir, src, dest, _ref, _res;
  settings == null && (settings = {});
  custom = __slice.call(arguments, 1);
  CWD = process.cwd();
  settings = __import(__import({}, DEFAULTS), settings);
  if (!settings.enabled || settings.enabled.length === 0) {
    throw new Error("You must supply a list of enabled compilers!");
  }
  if (typeof settings.enabled === 'string') {
    settings.enabled = [settings.enabled];
  }
  if (!settings.roots) {
    srcDirs = (_ref = settings.src, delete settings.src, _ref) || CWD;
    if (!Array.isArray(srcDirs)) {
      srcDirs = [srcDirs];
    }
    destDir = (_ref = settings.dest, delete settings.dest, _ref) || srcDirs[0];
    settings.roots = srcDirs.map(function(it){
      return [it, destDir];
    });
  }
  if (!Array.isArray(settings.roots)) {
    _res = [];
    for (src in _ref = settings.roots) {
      dest = _ref[src];
      _res.push([src, dest]);
    }
    settings.roots = _res;
  }
  settings.log_level = LOG.stringToLevel(settings.log_level);
  if (settings.log_level <= LOG.DEBUG) {
    console.log('compiler.setup()');
    console.dir(settings);
    console.log('');
  }
  return function(req, res, next){
    var request, info, success, log_prefix, that, _ref;
    if (settings.allowed_methods.indexOf(req.method) === -1) {
      return next();
    }
    request = {
      req: req,
      res: res,
      next: next,
      url: req.url,
      path: parse(req.url).pathname
    };
    if (settings.mount && request.path.indexOf(settings.mount) === 0) {
      request.path = request.path.slice(settings.mount.length);
    }
    info = (_ref = __import(__import({}, settings), request), _ref.settings = settings, _ref.request = request, _ref.cwd = CWD, _ref.matches = 0, _ref);
    success = false;
    log_prefix = ">>>>    [compiler]";
    if (settings.log_level <= LOG.DEBUG) {
      console.log(log_prefix + " Looking up compilers for '" + request.path + "'...");
    }
    try {
      Seq(settings.enabled).seqEach(function(id, i){
        var C, _ref, _info, _this = this;
        C = compilers[id];
        if (!(C && (!success || settings.cascade))) {
          return this(null);
        }
        if (settings.log_level <= LOG.DEBUG) {
          console.log("\n" + log_prefix + " (" + i + ") Checking '" + id + "'...");
        }
        info.compiler = C;
        info.id = id;
        _info = __import(__import({}, info), ((_ref = info.options) != null ? _ref[id] : void 8) || {});
        return C.run(_info, function(err, ok){
          if (!err && ok) {
            success = ok;
            info.matches++;
          }
          if (settings.log_level <= LOG.DEBUG) {
            console.log(log_prefix + " Completed '" + id + "'! (ok=" + ok + ", err=" + err + ") --> success=" + success);
          }
          return _this(null);
        });
      }).seq(function(){
        if (settings.log_level <= LOG.DEBUG) {
          console.log(log_prefix + " Done! (success=" + success + ")");
        }
        return next();
      })['catch'](function(err){
        if (settings.log_level <= LOG.ERROR) {
          if (err) {
            console.log(log_prefix + " Error! ", err);
          }
        }
        this.die();
        return next();
      });
    } catch (err) {
      if (settings.log_level <= LOG.ERROR) {
        console.log(log_prefix + " Caught Err!", err.stack ? '' : err);
        if (that = err.stack) {
          console.log(that);
        }
      }
      next();
    }
  };
};
/** All known compilers, by id. */
exports.compilers = compilers = {};
/** Log Levels */
exports.LOG = LOG = {
  levelToString: function(level){
    var name, val, _ref;
    for (name in _ref = LOG) {
      val = _ref[name];
      if (val === level) {
        return name;
      }
    }
    return String(level);
  },
  stringToLevel: function(level){
    var name, val, _ref;
    if (typeof level !== 'string') {
      return level;
    }
    level = level.toUpperCase();
    for (name in _ref = LOG) {
      val = _ref[name];
      if (name === level) {
        return val;
      }
    }
    return 0;
  },
  SILENT: Infinity,
  ERROR: 40,
  WARN: 30,
  INFO: 20,
  DEBUG: 10
};
/** Default settings. */
exports.DEFAULTS = DEFAULTS = {
  enabled: [],
  src: null,
  dest: null,
  roots: null,
  mount: '',
  delta: null,
  expires: false,
  log_level: 'WARN',
  create_dirs: true,
  external_timeout: 3000,
  cascade: false,
  resolve_index: false,
  allowed_methods: ['GET'],
  options: {
    all: {}
  }
};
/**
 * To create a new Compiler, extend `Compiler` or any other existing compiler, and then call `register(NewCompiler)`.
 * @param {Compiler} Compiler to register.
 * @returns The passed compiler.
 */
exports.register = register = function(NewCompiler){
  var proto, id, name, old, Superclass;
  if (!NewCompiler) {
    return;
  }
  proto = NewCompiler.prototype;
  if (proto.hasOwnProperty('__abstract__')) {
    return NewCompiler;
  }
  id = proto.id;
  name = NewCompiler.displayName || NewCompiler.name || id;
  if (!id) {
    throw new Error("Compiler " + name + " must have a valid id (not '" + id + "')!");
  }
  NewCompiler.id = id;
  old = compilers[id];
  if (old && old !== NewCompiler) {
    throw new Error("Compiler id collision ('" + id + "'): new=" + name + " is not old=" + (old.displayName || old.name || old.id) + "!");
  }
  if (!(proto.compile || proto.compileSync)) {
    throw new Error("Compiler " + name + " missing a compile/compileSync method!");
  }
  Superclass = NewCompiler.superclass || proto.constructor;
  NewCompiler.run == null && (NewCompiler.run = Superclass.run || Compiler.run);
  NewCompiler.extended == null && (NewCompiler.extended = Superclass.extended || Compiler.extended);
  return compilers[id] = NewCompiler;
};
/**
 * Root compiler class.
 * 
 * @class
 */
exports.Compiler = Compiler = (function(superclass){
  Compiler.displayName = 'Compiler';
  var prototype = __extends(Compiler, superclass).prototype, constructor = Compiler;
  prototype.id = '';
  prototype.match = /\.js$/i;
  prototype.ext = '';
  prototype.module = null;
  prototype.options = null;
  prototype.wraps = false;
  prototype.info = null;
  prototype.wrapped = null;
  /**
   * @constructor
   * @param {Object} info Request info merged with settings. (Pointer, not copy.)
   */;
  function Compiler(info){
    var k, v, mod, _own = {}.hasOwnProperty;
    this.info = info;
    Compiler.superclass.call(this);
    for (k in this) if (_own.call(this, k)) {
      v = this[k];
      if (typeof v === 'function') {
        this[k] = v.bind(this);
      }
    }
    mod = this.module;
    if (mod && typeof mod === 'string') {
      this.module = require(mod);
    }
  }
  prototype.log = function(level){
    var msgs, that, level_name, name;
    msgs = __slice.call(arguments, 1);
    if (this.info.log_level <= level) {
      level_name = (that = LOG.levelToString(level)) ? that : '';
      name = String(this);
      if (name.length < 8) {
        name += '\t';
      }
      console.log.apply(console, ["\t" + level_name + "\t" + name + "\t"].concat(__slice.call(msgs)));
    }
    return true;
  };
  /**
   * Tests whether this compiler applies to the request
   * 
   * @param {String} reqpath Request path.
   * @returns {String|String[]|false-y} Resolved source path(s) if compiler matches, false otherwise.
   */
  prototype.matches = function(srcDir, pathname){
    this.log(LOG.DEBUG, "matches(" + srcDir + ", " + pathname + ")");
    if (this.match.exec(pathname)) {
      return path.join(srcDir, pathname).replace(this.match, this.ext);
    }
  };
  prototype.srcValid = function(src, cb){
    return fs.stat(src, cb);
  };
  prototype.validate = function(pairs, cb){
    var srcs, destDir, src, _ref, _this = this;
    this.log(LOG.DEBUG, "validate( [" + pairs + "], " + typeof cb + " )");
    if (!(pairs != null && pairs.length)) {
      return cb("No matching sources.");
    }
    _ref = pairs.shift(), srcs = _ref[0], destDir = _ref[1];
    if (typeof srcs === 'string') {
      srcs = [srcs];
    }
    src = srcs.shift();
    if (srcs.length) {
      pairs.unshift([srcs, destDir]);
    }
    return this.srcValid(src, function(err, srcStat){
      if (err || !srcStat) {
        return _this.validate(pairs, cb);
      } else {
        return cb(null, srcStat, src, destDir);
      }
    });
  };
  /**
   * Resolves request path into destination path.
   * 
   * @param {String} src Source filepath, as calculated by `matches()`.
   * @returns {String} Resolved dest path.
   */
  prototype.lookup = function(src, destDir, pathname){
    return path.join(destDir, pathname);
  };
  prototype.destValid = function(dest, cb){
    var _this = this;
    this.log(LOG.DEBUG, "destValid( " + dest + ", " + typeof cb + " )");
    return fs.stat(dest, function(err, destStat){
      if (err && 'ENOENT' === err.code) {
        return cb(null, null);
      } else {
        return cb(err, destStat);
      }
    });
  };
  prototype.stale = function(srcStat, destStat, cb){
    var delta, _ref;
    delta = ((_ref = this.info.delta) != null
      ? _ref
      : (_ref = this.delta) != null ? _ref : 0) * 1000;
    this.log(LOG.DEBUG, "stale( " + typeof srcStat + ", " + typeof destStat + ", " + typeof cb + " )");
    if (!srcStat) {
      return cb(new Error("Source does not exist?!"));
    } else if (!destStat) {
      return cb(null, true);
    } else if (this.info.expires != null && destStat.ctime.getTime() + this.info.expires > Date.now()) {
      return fs.unlink(dest, function(err){
        if (err) {
          return cb(err);
        } else {
          return cb(null, true);
        }
      });
    } else if (srcStat.mtime.getTime() > destStat.mtime.getTime() + delta) {
      return cb(null, true);
    } else {
      return cb(null, false);
    }
  };
  prototype.read = function(src, cb){
    return fs.readFile(src, 'utf8', cb);
  };
  prototype.compile = null;
  prototype.compileSync = null;
  prototype.doCompile = function(text, wrapped, cb){
    var WrappedCompiler, wc, opts, args, fn, _ref, _this = this;
    if (!cb) {
      _ref = [wrapped, false], cb = _ref[0], wrapped = _ref[1];
    }
    if (this.wraps && !wrapped) {
      WrappedCompiler = compilers[this.wraps];
      wc = new WrappedCompiler(this.info);
      return wc.doCompile(text, false, function(err, data){
        if (err) {
          return cb(err);
        } else {
          return _this.doCompile(data, true, cb);
        }
      });
    }
    opts = typeof this.options === 'function'
      ? this.options()
      : this.options;
    args = [text].concat(opts != null
      ? [opts]
      : []);
    if (fn = this.compile) {
      if (typeof fn !== 'function') {
        fn = this.module[fn];
      }
      return fn.apply(this, __slice.call(args).concat([cb]));
    } else if (fn = this.compileSync) {
      if (typeof fn !== 'function') {
        fn = this.module[fn];
      }
      return cb(null, fn.apply(this, args));
    } else {
      return cb(new Error('No compile function defined!?'));
    }
  };
  prototype.write = function(dest, data, cb){
    this.log(LOG.INFO, "writing " + this.info.src + " --> " + dest);
    return fs.writeFile(dest, data, 'utf8', cb);
  };
  Compiler.run = function(info, next){
    var Cls, c;
    Cls = this;
    c = info.instance = new Cls(info);
    c.log(LOG.DEBUG, 'run()');
    Seq().seq(function(){
      var srcDir, destDir, that, pairs, _res, _i, _ref, _len, _ref2;
      c.log(LOG.DEBUG, 'roots:', info.roots);
      _res = [];
      for (_i = 0, _len = (_ref = info.roots).length; _i < _len; ++_i) {
        _ref2 = _ref[_i], srcDir = _ref2[0], destDir = _ref2[1];
        if (that = c.matches(srcDir, info.path)) {
          _res.push([that, destDir]);
        }
      }
      pairs = _res;
      c.log(LOG.DEBUG, 'pairs:', pairs);
      return c.validate(pairs, this);
    }).seq(function(srcStat, src, destDir){
      info.srcStat = srcStat;
      info.src = src;
      info.destDir = destDir;
      c.log(LOG.DEBUG, 'validated src! srcStat:', srcStat != null ? srcStat.constructor.name : srcStat, 'src:', src, 'destDir:', destDir);
      info.dest = c.lookup(src, destDir, info.path);
      if (info.create_dirs) {
        return mkdirp(path.dirname(info.dest), 493, this);
      } else {
        return this.ok();
      }
    }).seq(function(){
      return c.destValid(info.dest, this);
    }).seq(function(destStat){
      info.destStat = destStat;
      return c.stale(info.srcStat, destStat, this);
    }).seq(function(isStale){
      info.isStale = isStale;
      if (isStale) {
        return c.read(info.src, this);
      } else {
        return this('Source not out of date.');
      }
    }).seq(function(text){
      return c.doCompile(text, this);
    }).seq(function(data){
      return c.write(info.dest, data, this);
    }).seq(function(){
      c.log(LOG.INFO, 'Success!');
      return next(null, true);
    })['catch'](function(err){
      this.die();
      if (err instanceof Error) {
        c.log(LOG.ERROR, 'Error:', err.stack || err.message || err.msg || err);
        return next(err);
      } else {
        c.log(LOG.INFO, err);
        return next(null, false);
      }
    });
    return c;
  };
  Compiler.extended = function(Subclass){
    var Superclass;
    Superclass = this;
    Subclass.run = Superclass.run;
    return Subclass.extended = Superclass.extended;
  };
  prototype.toString = function(){
    return this.id;
  };
  return Compiler;
}(EventEmitter));
/**
 * Executes a shell command, piping the text through stdin, and capturing stdout.
 */
exports.ExternalCompiler = ExternalCompiler = (function(superclass){
  ExternalCompiler.displayName = 'ExternalCompiler';
  var prototype = __extends(ExternalCompiler, superclass).prototype, constructor = ExternalCompiler;
  prototype.id = 'external';
  prototype.env = null;
  prototype.cwd = null;
  prototype.timeout = 3.000;
  prototype.cmd = null;
  prototype.preprocess = null;
  function ExternalCompiler(){
    ExternalCompiler.superclass.apply(this, arguments);
  }
  prototype.compile = function(text, options, cb){
    var info_options, cmd, child, _ref, _this = this;
    if (!cb) {
      cb = options;
      options = {};
    }
    info_options = ((_ref = this.info.options) != null ? _ref[this.id] : void 8) || {};
    options = __import(__import({}, info_options), options) || {};
    options.timeout = ((_ref = options.external_timeout) != null
      ? _ref
      : (_ref = options.timeout) != null
        ? _ref
        : (_ref = this.info.external_timeout) != null
          ? _ref
          : this.timeout) * 1000;
    options.cwd || (options.cwd = this.cwd);
    options.env || (options.env = this.env);
    cmd = this.preprocess
      ? this.preprocess(this.cmd, text, options)
      : this.cmd;
    this.log(LOG.INFO, cmd + "");
    child = exec(cmd, options, function(err, stdout, stderr){
      if (err) {
        return cb(new Error(_this + " error:\n" + err));
      } else {
        return cb(null, String(stdout));
      }
    });
    child.stderr.on('data', function(data){
      return _this.log(LOG.INFO, data);
    });
    child.stdin.write(text);
    return child.stdin.end();
  };
  return ExternalCompiler;
}(Compiler));
exports.CoffeeScriptCompiler = CoffeeScriptCompiler = (function(superclass){
  CoffeeScriptCompiler.displayName = 'CoffeeScriptCompiler';
  var prototype = __extends(CoffeeScriptCompiler, superclass).prototype, constructor = CoffeeScriptCompiler;
  prototype.id = 'coffee';
  prototype.ext = '.coffee';
  prototype.module = 'coffee-script';
  prototype.options = {
    bare: true
  };
  prototype.compileSync = 'compile';
  function CoffeeScriptCompiler(){
    CoffeeScriptCompiler.superclass.apply(this, arguments);
  }
  return CoffeeScriptCompiler;
}(Compiler));
exports.CocoCompiler = CocoCompiler = (function(superclass){
  CocoCompiler.displayName = 'CocoCompiler';
  var prototype = __extends(CocoCompiler, superclass).prototype, constructor = CocoCompiler;
  prototype.id = 'coco';
  prototype.ext = '.co';
  prototype.module = 'coco';
  prototype.options = {
    bare: true
  };
  prototype.compileSync = 'compile';
  function CocoCompiler(){
    CocoCompiler.superclass.apply(this, arguments);
  }
  return CocoCompiler;
}(Compiler));
exports.CommonJSCompiler = CommonJSCompiler = (function(superclass){
  CommonJSCompiler.displayName = 'CommonJSCompiler';
  var prototype = __extends(CommonJSCompiler, superclass).prototype, constructor = CommonJSCompiler;
  prototype.CJS_HEADER = "require.install('{ID}', function(require, exports, module, undefined){\n\n";
  prototype.CJS_FOOTER = "\n\n});\n";
  prototype.id = 'commonjs';
  prototype.match = /\.mod(\.min)?\.js$/i;
  prototype.ext = ['.co', '.coffee', '.jison', '.js'];
  prototype.ext2wraps = {
    co: 'coco',
    coffee: 'coffee',
    jison: 'jison'
  };
  prototype.drop_path_parts = 0;
  function CommonJSCompiler(){
    CommonJSCompiler.superclass.apply(this, arguments);
  }
  prototype.matches = function(srcDir, pathname){
    var src, ext;
    src = path.join(srcDir, pathname);
    if (this.match.exec(pathname)) {
      return (function(){
        var _i, _ref, _len, _results = [];
        for (_i = 0, _len = (_ref = this.ext).length; _i < _len; ++_i) {
          ext = _ref[_i];
          _results.push(src.replace(this.match, ext));
        }
        return _results;
      }.call(this));
    }
  };
  prototype.lookup = function(src, destDir, pathname){
    return path.join(destDir, pathname).replace(this.match, '.mod.js');
  };
  prototype.compileSync = function(data){
    var drop, mod_parts, mod_id, header, _ref;
    drop = (_ref = this.info.drop_path_parts) != null
      ? _ref
      : this.drop_path_parts;
    mod_parts = this.info.url.slice(1).replace(/\.mod(\.min)?\.js$/i, '').split('/').slice(drop);
    if (mod_parts[mod_parts.length] === 'index') {
      mod_parts.pop();
    }
    mod_id = path.normalize(mod_parts.join('/'));
    header = this.CJS_HEADER.replace('{ID}', mod_id);
    return header + data + this.CJS_FOOTER;
  };
  prototype.doCompile = function(text, wrapped, cb){
    var ext, that;
    ext = /\.([^\.]+)$/.exec(this.info.src)[1];
    if (that = this.ext2wraps[ext]) {
      this.wraps = that;
    }
    return CommonJSCompiler.superclass.prototype.doCompile.apply(this, arguments);
  };
  return CommonJSCompiler;
}(Compiler));
exports.UglifyCompiler = UglifyCompiler = (function(superclass){
  UglifyCompiler.displayName = 'UglifyCompiler';
  var prototype = __extends(UglifyCompiler, superclass).prototype, constructor = UglifyCompiler;
  prototype.id = 'uglify';
  prototype.match = /\.min(\.mod)?\.js$/i;
  prototype.ext = '$1.js';
  prototype.module = 'uglify-js';
  function UglifyCompiler(){
    UglifyCompiler.superclass.apply(this, arguments);
  }
  prototype.compileSync = function(text){
    var ast;
    ast = this.module.parser.parse(text);
    ast = this.module.uglify.ast_mangle(ast);
    ast = this.module.uglify.ast_squeeze(ast);
    return this.module.uglify.gen_code(ast);
  };
  return UglifyCompiler;
}(Compiler));
exports.JadeCompiler = JadeCompiler = (function(superclass){
  JadeCompiler.displayName = 'JadeCompiler';
  var prototype = __extends(JadeCompiler, superclass).prototype, constructor = JadeCompiler;
  prototype.id = 'jade';
  prototype.match = /.html?$/i;
  prototype.ext = '.jade';
  prototype.module = 'jade';
  prototype.options = function(){
    return {
      pretty: true,
      filename: this.info.src
    };
  };
  prototype.compileSync = 'compile';
  function JadeCompiler(){
    JadeCompiler.superclass.apply(this, arguments);
  }
  return JadeCompiler;
}(Compiler));
exports.LessCompiler = LessCompiler = (function(superclass){
  LessCompiler.displayName = 'LessCompiler';
  var prototype = __extends(LessCompiler, superclass).prototype, constructor = LessCompiler;
  prototype.id = 'less';
  prototype.match = /\.css$/i;
  prototype.ext = '.less';
  prototype.module = 'less';
  prototype.compile = 'render';
  function LessCompiler(){
    LessCompiler.superclass.apply(this, arguments);
  }
  return LessCompiler;
}(Compiler));
exports.SassJSCompiler = SassJSCompiler = (function(superclass){
  SassJSCompiler.displayName = 'SassJSCompiler';
  var prototype = __extends(SassJSCompiler, superclass).prototype, constructor = SassJSCompiler;
  prototype.id = 'sass_js';
  prototype.match = /\.css$/i;
  prototype.ext = '.sass';
  prototype.module = 'sass';
  prototype.compileSync = 'render';
  function SassJSCompiler(){
    SassJSCompiler.superclass.apply(this, arguments);
  }
  return SassJSCompiler;
}(Compiler));
exports.SassRubyCompiler = SassRubyCompiler = (function(superclass){
  SassRubyCompiler.displayName = 'SassRubyCompiler';
  var prototype = __extends(SassRubyCompiler, superclass).prototype, constructor = SassRubyCompiler;
  prototype.id = 'sass_ruby';
  prototype.match = /\.css$/i;
  prototype.ext = '.sass';
  prototype.cmd = 'sass --stdin --no-cache ';
  function SassRubyCompiler(){
    SassRubyCompiler.superclass.apply(this, arguments);
  }
  prototype.preprocess = function(cmd){
    var that;
    cmd += " --load-path='" + path.dirname(this.info.src) + "'";
    return cmd + ((that = this.info.options.sass_ruby.load_path) ? " --load-path='" + that + "'" : '');
  };
  return SassRubyCompiler;
}(ExternalCompiler));
exports.JisonCompiler = JisonCompiler = (function(superclass){
  JisonCompiler.displayName = 'JisonCompiler';
  var prototype = __extends(JisonCompiler, superclass).prototype, constructor = JisonCompiler;
  prototype.id = 'jison';
  prototype.ext = '.jison';
  prototype.module = 'jison';
  function JisonCompiler(){
    JisonCompiler.superclass.apply(this, arguments);
  }
  prototype.compileSync = function(text){
    var parser;
    parser = new this.module.Parser(text);
    return parser.generate();
  };
  return JisonCompiler;
}(Compiler));
exports.YamlCompiler = YamlCompiler = (function(superclass){
  YamlCompiler.displayName = 'YamlCompiler';
  var prototype = __extends(YamlCompiler, superclass).prototype, constructor = YamlCompiler;
  prototype.id = 'yaml';
  prototype.match = /\.json$/i;
  prototype.ext = '.yaml';
  prototype.cmd = "python -c 'import lessly.data.yaml_omap; import sys, yaml, json; json.dump(yaml.load(sys.stdin), sys.stdout)'";
  function YamlCompiler(){
    YamlCompiler.superclass.apply(this, arguments);
  }
  return YamlCompiler;
}(ExternalCompiler));
cs = [CoffeeScriptCompiler, CocoCompiler, CommonJSCompiler, UglifyCompiler, JadeCompiler, LessCompiler, SassJSCompiler, SassRubyCompiler, JisonCompiler, YamlCompiler];
for (_i = 0, _len = cs.length; _i < _len; ++_i) {
  c = cs[_i];
  register(c);
}
expand = function(){
  var parts, p, home;
  parts = __slice.call(arguments);
  p = path.normalize(path.join.apply(path, parts));
  if (p.indexOf('~') === 0) {
    home = process.env.HOME || process.env.HOMEPATH;
    p = path.join(home, p.slice(1));
  }
  return path.resolve(p);
};
function mkdirp(p, mode, cb){
  var _ref;
  mode == null && (mode = 493);
  if (typeof mode === 'function') {
    _ref = [mode, 493], cb = _ref[0], mode = _ref[1];
  }
  cb || (cb = function(){});
  p = expand(p);
  return path.exists(p, function(exists){
    var ps, _p;
    if (exists) {
      return cb(null);
    }
    ps = p.split('/');
    _p = ps.slice(0, -1).join('/');
    return mkdirp(_p, mode, function(err){
      if ((err != null ? err.code : void 8) === 'EEXIST') {
        return cb(null);
      }
      if (err) {
        return cb(err);
      }
      return fs.mkdir(p, mode, function(err){
        if ((err != null ? err.code : void 8) === 'EEXIST') {
          return cb(null);
        } else {
          return cb(err);
        }
      });
    });
  });
}
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}
function __extends(sub, sup){
  function ctor(){} ctor.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new ctor).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}