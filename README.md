# require.all - function([dirname, options])
Apply filters and `require()`/read all files within a specified directory and optionally resolve them with custom function or arguments.

## Usage
```sh
$ npm install --save require.all
```
```js
var controllers = require('require.all')('./controllers');

// same as
var controllers = {
    homeController: require('./controllers/home-controller.js'),
    aboutController: require('./controllers/about-controller.js'),
    admin: {
        dashboardController: require('./controllers/admin/dashboard-controller.js')
    }
    // ...
}
```
## Advanced
```js
require.all = require('require.all');

var controllers = require.all({
    dir: './controllers',
    match: /controller\.js$/i, //only files that end with 'controller.js'
    recursive: false,

    // rename module: use default mapping function and remove 'controller' from the end
    map: (name, path, isFile) => require.all.map(name, path, isFile).replace(/controller$/i, '')
});

// resolve all controllers to have their instances
controllers(function(name, Controller){
    this === controller; // true
    return new Controller();
});

// the above code does the same as
var controllers = {
    home: new require('./controllers/home-controller.js')(),
    about: new require('./controllers/about-controller.js')()
    // ...
};
```
## Options and defaults
```js
require.all = require('require.all');

var modules = require.all({
        dir:        '.',
        not:        /^\./,
        match:      null,
        map:        map,
        ignore:     /^\.|node_modules/,
        require:    /\.(js|json)$/,
        recursive:  true,
        encoding:   'utf-8',
        tree:       true
})
```
Option | Type | Default | Description
-|-|:-:|-
`dir` | String | `'.'` | Absolute or relative path to the directory to be traversed. `require.all` will not require it's parent file to prevent infinite loops. _Default: current directory_
`not`|RegExp/Function(name)/null| `/^\./` | Filter to specify which files to be skipped. Use `null` to disable. _Default: skip files beginning with `'.'`_
`match` | RegExp/Function(name)/null | `null` | Only matching files will be required. Use `null` to disable.
`map`| Function(name, path, isFile) | `require.all.map` | Function to be used for renaming files and directories. Receives node's *name* and *path* and a flag which is true if the node is a file (false if dir). Must return the new *name* to be used. _Default: convert to camelCased_
`ignore`| RegExp/Function(name)/null | <code>/^\\.&#124;node_modules/</code> | Filter to specify which child directories to be ignored. Applied only in recursive mode. Use `null` to disable. _Default: ignore `node_modules` and folders beginning with `.`_
`require` | RegExp/Function(name)/null | <code>/\\.(js&#124;json)$/</code> | Filter to specify which files shall be loaded using `require`. Files that do not pass this filter will be loaded as a string. Use `null` to read all files as string. _Default: only *.js* and *.json* files will be `require`-d_
`recursive` | Boolean | `true` | Specifies whether to traverse child directories too.
`encoding` | String | `'utf-8'` | The encoding to use for the files that will be read as string.
`tree` | Boolean | `true` | Determines whether the output object should mimic the structure of the files and folders, keeping the nesting level. If set to `false` all files will be on the same level.

**WARNING**: *Nodes (files and dirs) with same names on the same level will overwrite each other. If `tree` option is set to `false` directory names don't matter but keep in mind that all files are loaded on the same level so they all must have unique names.*

**WARNING**: *File names and dirnames must not resolve (after the map function if any) to one of the following: name, arguments, caller, length*
## Resolve
`require.all()` actually returns a function which may be used to resolve all modules. It acts much like `Array.prototype.map`, looping trough all the loaded modules (see examples below!). It may be applied as many times as you wish in two possible modes:

* If you pass no parameter or an array of parameters only the modules that are functions will be executed. If the return value is none falsy it will be the new value that will be available in the returned from `require.all()` object (function).
```js
var modules = require.all('./modules');
// assume we have module foo
modules.foo; // function foo(){return function bar(a){ return a}}
// execute all functions (resolve foo with no arguments)
modules();
// foo is now bar
modules.foo; // function bar(a){ return a}
// lets resolve bar
modules();
modules.foo; // function bar(a){ return a}
// bar was resolved but since `a` was undefined modules.foo is still `bar`
// lets resolve with array of none falsy values, that shall be passed as arguments 
modules(["some none falsy value", "pointless"]);
// modules.foo returns `a`, the first argument, which now is none falsy so:
modules.foo; // "some none falsy value"
```
* You may pass a single function and deal with the modules as you wish. The function is applied in the context of the module itself and receives the name of the module and the module as arguments.
```js
var modules = require.all('./modules');
modules.foo; //function foo(){return true}
modules(function(name, module){
    this === module; // true
    return module
})
modules.foo;// function foo
//again we may keep on resolving
modules()()()()();
//modules.foo is now true since we resolved it in mode 1 and it returns true
modules.foo; // true
```
*Notice:*
```js
require.all()(1,2,3);
//same as 
require.all()([1,2,3]);
//same as 
require.all()(funnction(name, mdl){
    return mdl(1,2,3)
});
// so you may pass arguments as normal 
// but if you want to pass a SINGLE argument 
// which is an ARRAY or FUNCTION you should do this:
var arr = [], f = function(){};
require.all()([arr]);
require.all()([f]);
// or 
require.all()(arr, undefined);
require.all()(f, undefined);
```
## Complete example
```js
require.all = require('require.all');
var express = require('express');
var app = express(),
    cfg = require.all('./config/'),
    controllers = require.all('./controllers'),
    models = require.all('./models'),
    routes = require.all('./routes');
    
//pass models to controllers
controllers([models]); // models is function!

Object.assign(app, {controllers, models});

// assume we have model for each page
app.use('/:page*', function(req, res, next){
    var page = req.params.page;
    res.model = models[page];
    next();
});

// pass the controllers to all routes
routes(controllers, undefined); // controllers is also function!

// now the routes are ready to be bound;
routes(function(name, route){
    return app.use('/' + name, route), route;
});

// our app is ready that quickly... :)
app.listen(cfg.port, cfg.host, ()=>{
    console.log('App is running on %s:%s', cfg.port, cfg.host);
});

```

*Hey, if something is missing or you want to suggest improvements and features, you are welcome.*
