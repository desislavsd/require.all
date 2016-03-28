#require.all - function([dirname, options])
Apply filters and `require()`/read all files within a specified directory and optionally resolve them with custom function or arguments.

##Usage
```sh
$ npm install --save require.all
```
```js
var controllers = require('require.all')('./controllers');

// now controllers is an object with references to all your controllers
// for example:
/*
{
    home: function homeController,
    about: function aboutController,
    admin: {
            adminHome: function adminHome 
        }  
}
*/
```
##Advanced
```js
require.all = require('require.all');
var app = require('express')();

var controllers = require.all({
    dir: './controllers',
    match: /controller\.js$/, //only controllers
    // use default mapping function and remove 'Controller' 
    map: (name, path) => require.all.map(name, path).replace(/controller$/i, '')
});

controllers.home; // [function homeController]
controllers.about; // [function aboutController]

// resolve all controllers to have their instances
controllers(function(name, Controller){
    this === controller; // true
    return new Controller(app);
});
// controllers.home is an instance of homeController
```
##Options and defaults
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
* **dir** - `[String]` - absolute or relative path to the directory to be traversed. By default it is the current directory but `require.all` will not require it's parent file to prevent infinite loops. 
    * *default* - `'.'` - current directory
* **not** - `[RegExp/Function/null]` - filter to specify which files to be skipped. Use `null` to disable.
    * *default* - `/^\./` - skip files beginning with '.'
* **match** - `[RegExp/Function/null]` - only matching files will be required. Use `null` to disable.
    * *default* - `null` - do not apply match filter'
* **map** - `[Function(name, path, isFile)]` - function to be used for renaming files and directories. Receives node's *name* and *path* and a flag which is true if the node is a file (false if dir). Must return the new *name* to be used.
    * *default* - `map` - internal function that converts names to camelCased, skipping none word characters and skipping files extensions, allowing modules to be accessed through dot notation. 
        * `require.all.map('my-lucky module.js'); // myLuckyModule`
* **ignore** - `[RegExp/Function/null]` - filter to specify which child directories to be ignored. Applied only in recursive mode. Use `null` to disable.
    * *default* - `/^\.|node_modules/` - ignore `node_modules` and folders beginning with `.`
* **require** - `[RegExp/Function/null]` - filter to specify which files shall be loaded using `require`. Files that do not pass this filter will be loaded as a string. Use `null` to read all files as string.
    * *default* - `/\.(js|json)$/` - only *.js* and *.json* files will be `require`-d
* **recursive** - `[Boolean]` - specifies weather to traverse child directories too.
    * *default* - `true`
* **encoding** - `[String]` - the encoding to use for the files that will be read as string
    * *default* - `'utf-8'`
* **tree** - `[Boolean]` - determines weather the output object should mimic the structure of the files and folders, keeping the nesting level. If set to `false` all files will be on the same level. **WARNING**: *Files with same names will overwrite each other.**
    * *default* - `true`

##Resolve
`require.all` actually returns a function which may be used to resolve all modules. Think of it as a `forEach` loop, that loops trough all the loaded modules. It may be applied as many times as you wish. It may be applied in two modes:

* If you pass no parameter or an array of parameters only the modules that are functions will be executed. If the return value is none falsy it will be the new value that will be available in the output of `require.all`.
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
modules(["some none falsy value", "pointless"]);
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
// but if you want to pass a single argument 
// which is an array or function you should do this:
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
controllers([models]); // models is an array!

Object.assign(app, {controllers, models});

// assume we have model for each page
app.use('/:page*', function(req, res, next){
    var page = req.params.page;
    res.model = models[page];
    next();
});

// pass the controllers to all routes
routes(controllers, undefined); // controllers is also array!

// now the routes are ready to be bound;
routes(function(name, route){
    return app.use('/' + name, route), route;
});

// our app is ready that quickly... :)
app.listen(cfg.port, cfg.host, ()=>{
    console.log('App is running on %s:%s', cfg.port, cfg.host);
});

```