var fs, path, parse, EventEmitter, exec, spawn, Seq, setup, exports, compilers, DEFAULTS, LOG, CompilerMiddleware, register, Compiler, ExternalCompiler, CoffeeScriptCompiler, SnocketsCompiler, CocoCompiler, UglifyCompiler, JadeCompiler, JadeBrowserPrecompiler, StylusCompiler, LessCompiler, SassCompiler, SassRubyCompiler, JisonCompiler, YamlCompiler, helpers, expand, extrema, commonPrefix, commonPath, mkdirp, __ref, __slice = [].slice;
fs = require('fs');
path = require('path');
parse = require('url').parse;
EventEmitter = require('events').EventEmitter;
__ref = require('child_process'), exec = __ref.exec, spawn = __ref.spawn;
Seq = require('seq');
/**
 * Sets up an instance of the CompilerMiddleware.
 * 
 * @param {Object} [settings={}] 
 * @param {Compiler[]} [...custom] 
 * @returns {Function}
 */
exports = module.exports = setup = function(settings){
  var custom, cmw;
  settings == null && (settings = {});
  custom = __slice.call(arguments, 1);
  cmw = new CompilerMiddleware(settings, custom);
  return cmw.respond;
};
exports.setup = setup;
/** All known compilers, by id. */
exports.compilers = compilers = {
  __proto__: null
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
  ignore: /\.(jpe?g|gif|png)$/i,
  resolve_index: false,
  allowed_methods: ['GET'],
  options: {
    all: {}
  }
};
/** Log Levels */
exports.LOG = LOG = {
  levelToString: function(level){
    var name, val, __ref;
    for (name in __ref = LOG) {
      val = __ref[name];
      if (val === level) {
        return name;
      }
    }
    return String(level);
  },
  stringToLevel: function(level){
    var name, val, __ref;
    if (typeof level !== 'string') {
      return level;
    }
    level = level.toUpperCase();
    for (name in __ref = LOG) {
      val = __ref[name];
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
/**
 * CompilerMiddleware class.
 * @class
 */
exports.CompilerMiddleware = CompilerMiddleware = (function(superclass){
  /**
   * @constructor
   * @param {Object} [settings={}] Settings object.
   * @param {Compiler[]} [custom=[]] List of custom compilers to add.
   */
  CompilerMiddleware.displayName = 'CompilerMiddleware';
  var prototype = __extend(CompilerMiddleware, superclass).prototype, constructor = CompilerMiddleware;
  function CompilerMiddleware(settings, custom){
    var srcDirs, destDir, src, dest, __ref, __res;
    settings == null && (settings = {});
    this.custom = custom != null
      ? custom
      : [];
    superclass.call(this);
    this.respond = this.respond.bind(this);
    this.settings = settings = __import(__import({}, DEFAULTS), settings);
    if (!settings.enabled || settings.enabled.length === 0) {
      throw new Error("You must supply a list of enabled compilers!");
    }
    if (typeof settings.enabled === 'string') {
      settings.enabled = [settings.enabled];
    }
    if (!settings.roots) {
      srcDirs = (__ref = settings.src, delete settings.src, __ref) || process.cwd();
      if (!Array.isArray(srcDirs)) {
        srcDirs = [srcDirs];
      }
      destDir = (__ref = settings.dest, delete settings.dest, __ref) || srcDirs[0];
      settings.roots = srcDirs.map(function(it){
        return [it, destDir];
      });
    }
    if (!Array.isArray(settings.roots)) {
      __res = [];
      for (src in __ref = settings.roots) {
        dest = __ref[src];
        __res.push([src, dest]);
      }
      settings.roots = __res;
    }
    if (settings.resolve_index === true) {
      settings.resolve_index = 'index.html';
    }
    if (settings.resolve_index) {
      settings.resolve_index = settings.resolve_index.trimLeft('/');
    }
    settings.log_level = LOG.stringToLevel(settings.log_level);
    if (settings.log_level <= LOG.DEBUG) {
      console.log('compiler.setup()');
      console.dir(settings);
      console.log('');
    }
  }
  prototype.respond = function(req, res, next){
    var settings, request, info, success, log_prefix, that, __ref;
    settings = this.settings;
    if (settings.allowed_methods.indexOf(req.method) === -1 || ((__ref = settings.ignore) != null && __ref.test(req.url))) {
      return next();
    }
    request = {
      req: req,
      res: res,
      next: next,
      url: req.url,
      path: parse(req.url).pathname
    };
    request.basename = path.basename(request.path);
    if (settings.mount && request.path.indexOf(settings.mount) === 0) {
      request.path = request.path.slice(settings.mount.length);
    }
    if (settings.resolve_index && /\/$/.test(request.path)) {
      request.path = path.join(request.path, settings.resolve_index);
    }
    info = (__ref = __import(__import({}, settings), request), __ref.settings = settings, __ref.request = request, __ref.cwd = process.cwd(), __ref.matches = 0, __ref);
    success = false;
    log_prefix = ">>>>    [compiler]";
    if (settings.log_level <= LOG.DEBUG) {
      console.log(log_prefix + " Looking up compilers for '" + request.path + "'...");
    }
    try {
      Seq(settings.enabled).seqEach(function(id, i){
        var C, __ref, _info, __this = this;
        C = compilers[id];
        if (!(C && (!success || settings.cascade))) {
          return this(null);
        }
        if (settings.log_level <= LOG.DEBUG) {
          console.log("\n" + log_prefix + " (" + i + ") Checking '" + id + "'...");
        }
        info.compiler = C;
        info.id = id;
        _info = __import(__import({}, info), ((__ref = info.options) != null ? __ref[id] : void 8) || {});
        return C.run(_info, function(err, ok){
          if (!err && ok) {
            success = ok;
            info.matches++;
          }
          if (settings.log_level <= LOG.DEBUG) {
            console.log(log_prefix + " Completed '" + id + "'! (ok=" + ok + ", err=" + err + ") --> success=" + success);
          }
          return __this(null);
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
  return CompilerMiddleware;
}(EventEmitter));
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
  var prototype = __extend(Compiler, superclass).prototype, constructor = Compiler;
  prototype.id = '';
  prototype.match = /(?:\.mod)?(\.min)?\.js$/i;
  prototype.ext = '';
  prototype.destExt = null;
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
    var k, v, mod, __own = {}.hasOwnProperty;
    this.info = info;
    superclass.call(this);
    for (k in this) if (__own.call(this, k)) {
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
    var msgs, that, level_name, compiler, file, len;
    msgs = __slice.call(arguments, 1);
    if (this.info.log_level <= level) {
      level_name = (that = LOG.levelToString(level)) ? that : '';
      compiler = String(this);
      compiler += compiler.length < 8 ? '\t' : '';
      file = this.info.path;
      len = file.length;
      while (len < 48) {
        len += 8;
        file += '\t';
      }
      console.log.apply(console, [level_name + "\t" + compiler + "\t" + file + "\t"].concat(__slice.call(msgs)));
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
      return path.join(srcDir, pathname.replace(this.match, this.ext));
    }
  };
  prototype.srcValid = function(src, cb){
    return fs.stat(src, cb);
  };
  prototype.validate = function(pairs, cb){
    var srcs, destDir, src, __ref, __this = this;
    this.log(LOG.DEBUG, "validate( [" + pairs + "], " + typeof cb + " )");
    if (!(pairs != null && pairs.length)) {
      return cb("No matching sources.");
    }
    __ref = pairs.shift(), srcs = __ref[0], destDir = __ref[1];
    if (typeof srcs === 'string') {
      srcs = [srcs];
    }
    src = srcs.shift();
    if (srcs.length) {
      pairs.unshift([srcs, destDir]);
    }
    return this.srcValid(src, function(err, srcStat){
      if (err || !srcStat) {
        return __this.validate(pairs, cb);
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
    return path.join(destDir, this.destExt ? pathname.replace(this.match, this.destExt) : pathname);
  };
  prototype.destValid = function(dest, cb){
    var __this = this;
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
    var delta, __ref;
    delta = ((__ref = this.info.delta) != null
      ? __ref
      : (__ref = this.delta) != null ? __ref : 0) * 1000;
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
    var WrappedCompiler, wc, info_opts, opts, args, fn, __ref, __this = this;
    if (!cb) {
      __ref = [wrapped, false], cb = __ref[0], wrapped = __ref[1];
    }
    if (this.wraps && !wrapped) {
      WrappedCompiler = compilers[this.wraps];
      wc = new WrappedCompiler(this.info);
      return wc.doCompile(text, false, function(err, data){
        if (err) {
          return cb(err);
        } else {
          return __this.doCompile(data, true, cb);
        }
      });
    }
    info_opts = ((__ref = this.info.options) != null ? __ref[this.id] : void 8) || {};
    if (typeof this.options === 'function') {
      opts = this.options(info_opts);
    } else if (this.options || info_opts) {
      opts = __import(__import({}, this.options), info_opts);
    }
    args = [text].concat(__slice.call(opts));
    if (fn = this.compile) {
      if (typeof fn !== 'function') {
        fn = this.module[fn];
      }
      return fn.apply(this, __slice.call(args).concat([cb]));
    } else if (fn = this.compileSync) {
      if (typeof fn !== 'function') {
        fn = this.module[fn];
      }
      try {
        return cb(null, fn.apply(this, args));
      } catch (err) {
        return cb(err);
      }
    } else {
      return cb(new Error('No compile function defined!?'));
    }
  };
  prototype.write = function(dest, data, cb){
    var prefix, len;
    if (this.info.log_level <= LOG.INFO) {
      prefix = commonPath(this.info.src, dest);
      len = prefix.length;
      if (prefix.indexOf(this.info.cwd === 0)) {
        prefix = prefix.slice(this.info.cwd.length + 1);
      }
      if (len) {
        this.log(LOG.INFO, "writing " + prefix + "{ " + this.info.src.slice(len) + " --> " + dest.slice(len) + " }");
      } else {
        this.log(LOG.INFO, "writing " + this.info.src + " --> " + dest);
      }
    }
    return fs.writeFile(dest, data, 'utf8', cb);
  };
  Compiler.run = function(info, next){
    var Cls, c;
    Cls = this;
    c = info.instance = new Cls(info);
    c.log(LOG.DEBUG, 'run()');
    Seq().seq(function(){
      var srcDir, destDir, that, pairs, __res, __i, __ref, __len, __ref1;
      c.log(LOG.DEBUG, 'roots:', info.roots);
      __res = [];
      for (__i = 0, __len = (__ref = info.roots).length; __i < __len; ++__i) {
        __ref1 = __ref[__i], srcDir = __ref1[0], destDir = __ref1[1];
        if (that = c.matches(srcDir, info.path)) {
          __res.push([that, destDir]);
        }
      }
      pairs = __res;
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
      c.log(LOG.DEBUG, 'Success!');
      return next(null, true);
    })['catch'](function(err){
      this.die();
      if (err instanceof Error) {
        c.log(LOG.ERROR, 'Error:', err.stack || err.message || err.msg || err);
        return next(err);
      } else {
        c.log(LOG.DEBUG, err);
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
  var prototype = __extend(ExternalCompiler, superclass).prototype, constructor = ExternalCompiler;
  prototype.id = 'external';
  prototype.env = null;
  prototype.cwd = null;
  prototype.timeout = 3.000;
  prototype.cmd = null;
  prototype.preprocess = null;
  function ExternalCompiler(){
    superclass.apply(this, arguments);
  }
  prototype.compile = function(text, options, cb){
    var info_options, cmd, child, __ref, __this = this;
    if (!cb) {
      cb = options;
      options = {};
    }
    info_options = ((__ref = this.info.options) != null ? __ref[this.id] : void 8) || {};
    options = __import(__import({}, info_options), options) || {};
    options.timeout = ((__ref = options.external_timeout) != null
      ? __ref
      : (__ref = options.timeout) != null
        ? __ref
        : (__ref = this.info.external_timeout) != null
          ? __ref
          : this.timeout) * 1000;
    options.cwd || (options.cwd = this.cwd);
    options.env || (options.env = this.env);
    cmd = this.preprocess
      ? this.preprocess(this.cmd, text, options)
      : this.cmd;
    this.log(LOG.DEBUG, cmd + "");
    child = exec(cmd, options, function(err, stdout, stderr){
      if (err) {
        return cb(new Error(this + " error:\n" + err));
      } else {
        return cb(null, String(stdout));
      }
    });
    child.stderr.on('data', function(data){
      return __this.log(LOG.WARN, "\n" + data);
    });
    child.stdin.write(text);
    return child.stdin.end();
  };
  return ExternalCompiler;
}(Compiler));
exports.CoffeeScriptCompiler = CoffeeScriptCompiler = (function(superclass){
  CoffeeScriptCompiler.displayName = 'CoffeeScriptCompiler';
  var prototype = __extend(CoffeeScriptCompiler, superclass).prototype, constructor = CoffeeScriptCompiler;
  prototype.id = 'coffee';
  prototype.ext = '.coffee';
  prototype.destExt = '.js';
  prototype.module = 'coffee-script';
  prototype.options = {
    bare: true
  };
  prototype.compileSync = 'compile';
  function CoffeeScriptCompiler(){
    superclass.apply(this, arguments);
  }
  return CoffeeScriptCompiler;
}(Compiler));
exports.SnocketsCompiler = SnocketsCompiler = (function(superclass){
  SnocketsCompiler.displayName = 'SnocketsCompiler';
  var prototype = __extend(SnocketsCompiler, superclass).prototype, constructor = SnocketsCompiler;
  prototype.id = 'snockets';
  prototype.ext = '.coffee';
  prototype.destExt = '.js';
  prototype.module = 'snockets';
  prototype.options = {
    async: false
  };
  function SnocketsCompiler(){
    superclass.apply(this, arguments);
  }
  prototype.compileSync = function(text, options){
    var snockets;
    options == null && (options = {});
    snockets = new this.module;
    return snockets.getConcatenation(this.info.src, options);
  };
  return SnocketsCompiler;
}(Compiler));
exports.CocoCompiler = CocoCompiler = (function(superclass){
  CocoCompiler.displayName = 'CocoCompiler';
  var prototype = __extend(CocoCompiler, superclass).prototype, constructor = CocoCompiler;
  prototype.id = 'coco';
  prototype.ext = '.co';
  prototype.destExt = '.js';
  prototype.module = 'coco';
  prototype.options = {
    bare: true
  };
  prototype.compileSync = 'compile';
  function CocoCompiler(){
    superclass.apply(this, arguments);
  }
  return CocoCompiler;
}(Compiler));
exports.UglifyCompiler = UglifyCompiler = (function(superclass){
  UglifyCompiler.displayName = 'UglifyCompiler';
  var prototype = __extend(UglifyCompiler, superclass).prototype, constructor = UglifyCompiler;
  prototype.id = 'uglify';
  prototype.match = /\.min(\.mod)?\.js$/i;
  prototype.ext = '$1.js';
  prototype.module = 'uglify-js';
  function UglifyCompiler(){
    superclass.apply(this, arguments);
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
  var prototype = __extend(JadeCompiler, superclass).prototype, constructor = JadeCompiler;
  prototype.id = 'jade';
  prototype.match = /\.html?$/i;
  prototype.ext = '.jade';
  prototype.module = 'jade';
  prototype.options = function(opts){
    opts == null && (opts = {});
    return __import({
      pretty: true,
      filename: this.info.src
    }, opts);
  };
  prototype.compile = 'render';
  function JadeCompiler(){
    superclass.apply(this, arguments);
  }
  return JadeCompiler;
}(Compiler));
exports.JadeBrowserPrecompiler = JadeBrowserPrecompiler = (function(superclass){
  JadeBrowserPrecompiler.displayName = 'JadeBrowserPrecompiler';
  var prototype = __extend(JadeBrowserPrecompiler, superclass).prototype, constructor = JadeBrowserPrecompiler;
  prototype.id = 'jade-browser';
  prototype.match = /\.jade(?:\.mod)?(\.min)?\.js$/i;
  prototype.ext = '.jade';
  prototype.destExt = '.jade.js';
  prototype.module = 'jade';
  prototype.options = function(opts){
    opts == null && (opts = {});
    return __import({
      pretty: true,
      client: true,
      compileDebug: false,
      filename: this.info.src
    }, opts);
  };
  function JadeBrowserPrecompiler(){
    superclass.apply(this, arguments);
  }
  prototype.compileSync = function(text, options){
    var template_fn, template;
    options == null && (options = {});
    template_fn = this.module.compile(text, options);
    template = String(template_fn).replace(/^function anonymous\(/, 'function (');
    return "var template = " + template + ";\nif (typeof module != 'undefined') {\n    module.exports = exports = template;\n}";
  };
  return JadeBrowserPrecompiler;
}(Compiler));
exports.StylusCompiler = StylusCompiler = (function(superclass){
  StylusCompiler.displayName = 'StylusCompiler';
  var prototype = __extend(StylusCompiler, superclass).prototype, constructor = StylusCompiler;
  prototype.id = 'stylus';
  prototype.match = /\.css$/i;
  prototype.ext = '.styl';
  prototype.module = 'stylus';
  function StylusCompiler(){
    superclass.apply(this, arguments);
  }
  prototype.compile = function(text, options, cb){
    var stylus, k, v, __ref;
    options == null && (options = {});
    if (!cb) {
      __ref = [options, {}], cb = __ref[0], options = __ref[1];
    }
    stylus = this.module(text);
    options.filename = this.info.src;
    for (k in options) {
      v = options[k];
      if (k === 'nib' && v) {
        if (!this.nib) {
          this.nib = require('nib');
        }
        stylus.use(this.nib());
      } else if (['use', 'import', 'include'].indexOf(k) !== -1) {
        stylus[k](v);
      } else {
        stylus.set(k, v);
      }
    }
    return stylus.render(cb);
  };
  return StylusCompiler;
}(Compiler));
exports.LessCompiler = LessCompiler = (function(superclass){
  LessCompiler.displayName = 'LessCompiler';
  var prototype = __extend(LessCompiler, superclass).prototype, constructor = LessCompiler;
  prototype.id = 'less';
  prototype.match = /\.css$/i;
  prototype.ext = '.less';
  prototype.module = 'less';
  prototype.compile = 'render';
  function LessCompiler(){
    superclass.apply(this, arguments);
  }
  return LessCompiler;
}(Compiler));
exports.SassCompiler = SassCompiler = (function(superclass){
  SassCompiler.displayName = 'SassCompiler';
  var prototype = __extend(SassCompiler, superclass).prototype, constructor = SassCompiler;
  prototype.id = 'sass';
  prototype.match = /\.css$/i;
  prototype.ext = '.sass';
  prototype.module = 'sass';
  prototype.compileSync = 'render';
  function SassCompiler(){
    superclass.apply(this, arguments);
  }
  return SassCompiler;
}(Compiler));
exports.SassRubyCompiler = SassRubyCompiler = (function(superclass){
  SassRubyCompiler.displayName = 'SassRubyCompiler';
  var prototype = __extend(SassRubyCompiler, superclass).prototype, constructor = SassRubyCompiler;
  prototype.id = 'sass_ruby';
  prototype.match = /\.css$/i;
  prototype.ext = '.sass';
  prototype.cmd = 'sass --stdin --no-cache ';
  function SassRubyCompiler(){
    superclass.apply(this, arguments);
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
  var prototype = __extend(JisonCompiler, superclass).prototype, constructor = JisonCompiler;
  prototype.id = 'jison';
  prototype.ext = '.jison';
  prototype.module = 'jison';
  function JisonCompiler(){
    superclass.apply(this, arguments);
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
  var prototype = __extend(YamlCompiler, superclass).prototype, constructor = YamlCompiler;
  prototype.id = 'yaml';
  prototype.match = /\.json$/i;
  prototype.ext = '.yaml';
  prototype.module = 'js-yaml';
  prototype.compileSync = function(data){
    return JSON.stringify(this.module.load(data));
  };
  function YamlCompiler(){
    superclass.apply(this, arguments);
  }
  return YamlCompiler;
}(Compiler));
[CoffeeScriptCompiler, CocoCompiler, UglifyCompiler, JadeCompiler, JadeBrowserPrecompiler, StylusCompiler, LessCompiler, SassCompiler, JisonCompiler, SassRubyCompiler, YamlCompiler, SnocketsCompiler].map(register);
helpers = exports.helpers = {};
helpers.expand = expand = function(){
  var parts, p, home;
  parts = __slice.call(arguments);
  p = path.normalize(path.join.apply(path, parts));
  if (p.indexOf('~') === 0) {
    home = process.env.HOME || process.env.HOMEPATH;
    p = path.join(home, p.slice(1));
  }
  return path.resolve(p);
};
helpers.extrema = extrema = function(its){
  var it, by_length;
  if (!(its != null && its.length)) {
    return [];
  }
  if (its.length < 2) {
    return [its[0], its[0]];
  }
  by_length = (function(){
    var __i, __ref, __len, __results = [];
    for (__i = 0, __len = (__ref = its).length; __i < __len; ++__i) {
      it = __ref[__i];
      __results.push([it.length, it]);
    }
    return __results;
  }()).sort();
  return [by_length[0][1], by_length[by_length.length - 1][1]];
};
helpers.commonPrefix = commonPrefix = function(){
  var lists, shortest, longest, i, c, __ref, __len;
  lists = __slice.call(arguments);
  if (!(lists != null && lists.length)) {
    return '';
  }
  if (lists.length < 2) {
    return lists[0];
  }
  __ref = extrema(lists), shortest = __ref[0], longest = __ref[1];
  if (shortest === longest) {
    return longest;
  }
  for (i = 0, __len = shortest.length; i < __len; ++i) {
    c = shortest[i];
    if (c != longest[i]) {
      return shortest.slice(0, i);
    }
  }
  return shortest;
};
helpers.commonPath = commonPath = function(){
  var paths, shortest, longest, prefix, components, __ref;
  paths = __slice.call(arguments);
  if (!(paths != null && paths.length)) {
    return '';
  }
  if (paths.length < 2) {
    return paths[0];
  }
  __ref = extrema(paths), shortest = __ref[0], longest = __ref[1];
  prefix = commonPrefix.apply(null, paths);
  if (prefix.charAt(prefix.length - 1) === '/') {
    prefix = prefix.slice(0, -1);
  }
  components = commonPrefix(prefix.split('/'), longest.split('/'));
  return components.join('/') + '/';
};
helpers.mkdirp = mkdirp = (function(){
  function mkdirp(p, mode, cb){
    var __ref;
    mode == null && (mode = 493);
    if (typeof mode === 'function') {
      __ref = [mode, 493], cb = __ref[0], mode = __ref[1];
    }
    cb || (cb = function(){});
    p = expand(p);
    return (fs.exists || path.exists)(p, function(exists){
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
  return mkdirp;
}());
function __extend(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}
