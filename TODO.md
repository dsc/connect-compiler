# todo


## to ship

- Validate compiler module exists on startup
- Restructure middleware responder to use events to trigger compiler phases, remove `seq` due to need of `@die`. (State machine?)
- Allow nested `enabled` list for a more sane `cascade`
    - Rename `enabled` to `compilers`
    - Allow entries in `compilers` to be an identifier or a options/config object
- Add post-`write()` cleanup/finally event (which fires whether successful or not).

- Remove `yaml-python`, `CommonJS` compilers and create a `connect-compiler-extras` package for myself.


## later
- Compile `./src` (coco) -> `./lib` (js)
- Move compilers to `lib/compilers.co`


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


