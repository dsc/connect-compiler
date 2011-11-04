# todo

- **Bug:** compiler errors sometimes propagate to node?! well shit son, somebody needs tests.
- Remove `yaml-python`, `CommonJS` compilers and create a `connect-compiler-extras` package for myself.

## later
- Restructure middleware responder to use events to trigger compiler phases, remove `seq`.
- Make `setup()` a simple proxy to `CompilerMiddleware` class.
- Add post-`write()` cleanup/finally event (which fires whether successful or not).
- GitHub site with introduction, documentation.
- Replace `#token` in config Strings.


## docs

- examples:
    - simple usage
        - with plain connect
        - with express
    - recursive compiling (CommonJS, Uglify; @wraps)
    - custom compilers
        - extending an existing compiler
- per-compiler documentation, options


## New Compilers

- Haml
- yaml-js
- Bundler: cat together multiple files (recursive compiler)


