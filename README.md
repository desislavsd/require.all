# require.all
Easy way to `require()` all your modules in a directory.
## Getting started
```sh
$ npm install require.all --save
```
myFile.js:
```js
require.all = require('require.all');
var controllers = require.all('./controllers');
var homeController = controllers.home;
```
## Advanced usage
All parameters are optional. Executing `require('require.all')()` will require all the modules from the current (`'.'`) directory, using default options, and will return an object with their references. `require.all` accepts string parameter for the directory or object parameter with options or both. All of the followings are valid:
```js
var require.all = require('require.all');

require.all();
require.all('./');
require.all( {dir: './'} );
require.all('./', {recursive: true});
```
Check out the full list of available options in the defaults section.

When executed, the `require.all` module actually returns a function. Since in javascript functions are objects, you can access your modules using `.` notation and at the same time have some extra functionality. Here you are allowed to quickly resolve all your modules. 

For example, imagine that all your controllers are function constructors. In this case you are not interested in the controllers themselves but in having their instances. The next snippet will do exactly this:
```js
var controllers = require('require.all')('./controllers')(function(controllerName, Controller){
        return new Controller();
    })
// now controllers holds instances to the required modules
```
same as: 
```js
// assumes you have controllers home.js and user.js
var controllers = {
    home: new require('./controllers/home.js')(),
    user: new require('./controllers/user.js')(),
    ...
}
```
The *resolve* functionality depends on the provided arguments: 
##### Case 1: provide one argument of type 'function'
```js
// executes the provided function on every module
require('require.all')()(function(name, module){
    console.log(this == module); // true
})
```
##### Case 2: provide list or array of arguments
```js
// resolves every module of type 'function' with the provided arguments
require('require.all')()(1,2,3,4)

//same as
require('require.all')()([1,2,3,4])

//same as
require('require.all')()(function(name, module){
    return module(1,2,3,4)
})
```
*Notice:* If you want to resolve your modules with a single argument and it's type is `'function'`, you should use: `require('require.all')('./')([app])`.
## Defaults
You can see the defaults by `require('require.all').defaults`; Modifying this object will not have effect.
```js
var defaults = {
        dir:        '.',                // current directory
        match:      null,               // match any file
        not:        /^\./,              // do not require files which name begins with '.'
        ignore:     /^\.|node_modules/, // do not traverse dirs which name begins with '.'; ignore node_modules
        map:        map,                // remove extensions & transform to camelCased
        recursive:  false,              // do not traverse child directories
}
```
- **dir** - [string] - the directory to be required
- **match** - [regular expression] - require only files that match; If array of regular expressions is provided, files must match all of them
- **not** - [regular expression] - require only files that do not match; If array of regular expressions is provided, files must not match all of them at the same time; use `|` in the RegExp to provide alternative criterias.
- **ignore** - [regular expression] - traverse only directories that do not match; If array of regular expressions is provided, directories must not match all of them at the same time; use `|` in the RegExp to provide alternative criterias.
- **map** - [function] - the function that the package uses for renaming directories and files; the default is:
```js
// removes extensions and converts names containing [\s\._-] to camelCased
function map(name, path){

    return Path.basename(name, Path.extname(name))
        .replace(/[\s\._-](\w)/g, function (m, c) {
            return c.toUpperCase();
        });
}

map('home')             // home
map('home_controller')  // homeController
map('_me to')           // MeTo
```
- **recursive** - [boolean] - weather the package shuld traverse child directories or not

## Example
```js
var app = require('express')();
var controllers = require('require.all')('./controllers');

app.get('/:controller', function(req, res, next){
    if (controllers[req.params.controller])
        return controllers[req.params.controller]();
    next();
})
app.listen(3000)
```