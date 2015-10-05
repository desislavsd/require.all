var fs = require('fs');
var Path = require('path');

// The package defaults 
var dfts = {
        dir:        '.',
        match:      null,               // no match filter
        not:        /^\./,              // ignore files starting with .
        ignore:     /^\.|node_modules/, // ignore dirs  starting with .
        map:        map,
        recursive:  false
    }, options = extend(dfts), rsv = false, index, private = '_';



// default function for renaming files and dirs names
// removes extensions and transform names conatining [\s_.-] to camelCased
function map(name, path){

    return Path.basename(name, Path.extname(name))
        .replace(/[\s\._-](\w)/g, function (m, c) {
            return c.toUpperCase();
        });
}

// checks if given parameter (prop) passes the provided test/s (ts) 
// returns true if all tests are passed
function check(ts, prop, inv){
    ts.constructor != Array && (ts = [ts]);

    for(var t of ts) 
        if( (t.test || (t.test = t)) && !t.test(prop) ) 
            return false;

    return  true;
}

function addModule(name, path, opts){

    // check if modules name passes match criteria 
    if(opts.match && !check(opts.match, name)) return;

    // check if modules name passes not criteria 
    if(opts.not && check(opts.not, name)) return;

    // modify the name with the map function
    name = opts.map ? opts.map.call(name, name, path) : name;

    mdl = require(path);
    return (this[name] = opts.resolve ? opts.resolve.call(mdl, name) : mdl) && this;
}

//simple but useful implementation of un "extend" method/function
function extend(ps, noExtend){
    var p, me = this == global ? {} : this;

    for(p in ps || {}) ps.hasOwnProperty(p) && (me[p] = ps[p]);

    return  (noExtend || me.exetend || (me.extend = extend)) && me;
}

function requireAll(dir, opts){
    var files, file, dir, 
        // make mdls an empty object with inherited push & extend mothods
        mdls = Object.create(extend({push: addModule})); 

    // mark mdls as not resolveable using not enumerable property
    Object.defineProperty(mdls, private, {value: true});

    dir = Path.resolve(dir); // lets use absolute path

    // if file is passed as dir simply require it
    if( fs.statSync(dir).isFile() ) return require(dir);

    // return 
    files = fs.readdirSync(dir);

    for(file of files){
        var path = Path.join(dir, file),
            stat = fs.statSync(path);

        if(stat.isFile()){
            path != index && mdls.push(file, path, opts); 
            continue;
        }

        if(opts.recursive && !(opts.ignore && check(opts.ignore, file)))
            mdls[opts.map ? opts.map(file) : file] = requireAll(path, extend(opts)); 
    }

    return mdls; 
}

function resolve(f){

    for(var i in this){
        // here skip the inherited extend and push methods 
        if(!this.hasOwnProperty(i)) continue;

        //if directory -> resolve again 
        if(this[i][private]){
            resolve.apply(this[i], arguments);

        //if it must me resolved with external function
        } else if(arguments.length == 1 && typeof f == 'function'){
            this[i] = f.call(this[i], i, this[i])

        //if it is function itself and must be resolved with given arguments
        } else if(typeof this[i] == 'function'){
            this[i] = this[i].apply(this[i], f.constructor == Array && arguments.length == 1 ? f : arguments)
        }
    }

    return this;
}

// Export the provided from the package functionality.
// The exported function accepts parameters and returns 
// another function which is extended with all the required modules.
// The second function might be esecuted in two modes depending on the 
// provided parameters. It's purpose is to resolve the modules 
// with a given function or parameters if needed.
require.all = module.exports = extend.call(function(dir, opts){
        if(typeof dir == 'string') dir = {dir: dir};
        opts = extend(options).extend(opts).extend(dir);
        index = module.parent ? module.parent.filename : module.filename;
        opts.dir = Path.resolve(Path.dirname(index), opts.dir);
        var mdls = requireAll.call(null, opts.dir, opts);
        return extend.call(resolve.bind(mdls), mdls, true);
    }, {
        reset: function(){options = extend(dfts, true); return this},
        clear: function(){options = {}; return this},
        set: function(o){options = extend(o, true); return this},
        // you can not modify the defaults but you can awlays see them
        // *useful extend method exported 
        defaults: extend.bind({}, dfts)  
    }, true);