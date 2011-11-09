# todo

- **Bug:** compiler errors sometimes propagate to node?! well shit son, somebody needs tests.
- Remove `yaml-python`, `CommonJS` compilers and create a `connect-compiler-extras` package for myself.

## later
- Make `setup()` a simple proxy to `CompilerMiddleware` class.
- Restructure middleware responder to use events to trigger compiler phases, remove `seq`. State machine?
- Add post-`write()` cleanup/finally event (which fires whether successful or not).
- Config: `on` for attaching event handlers to compiler phases
- Replace `#token` in config Strings.
- Allow nested `enabled` list for a more sane `cascade`


## docs

- GitHub site with introduction, documentation.
- examples:
    - simple usage
        - with connect
        - with express
    - recursive compiling (CommonJS, Uglify; @wraps)
    - custom compilers
        - extending an existing compiler
- per-compiler documentation, options


## New Compilers

- Haml
- yaml-js
- Bundler: cat together multiple files (recursive compiler)


