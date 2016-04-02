'use strict';

var fs = require('fs'),
    p  = require('path');

var readFile = fs.readFileSync,
    readDir = fs.readdirSync,
    stat    = fs.statSync;

var undefined;

module.exports = (function(){

    var _private = '__DIR';

    var defaults = {
        dir:        '.',
        not:        /^\./,
        map:        map,
        match:      null, 
        ignore:     /^\.|node_modules/,
        require:    /\.(js|json)$/,
        recursive:  true,
        encoding:   'utf-8',
        tree:       true
    };

    var extend = Object.assign;
    
    function foo(){}

    /* traverses and indexes directory */
    function craw(dir, opts){
        var nodes = stat(dir).isFile() ? [''] : readDir(dir), 
            store = Object.defineProperty({}, _private, {value: true});

        for (let node of nodes) {
            let name = node,
                path = p.join(dir, node),
                isFile = stat(path).isFile();

            if(opts.map) 
                name = opts.map(node, dir, isFile);

            if( isFile && t(opts.match).test(node) && !t(opts.not).test(node) && path !== opts.index)
                store[name] = load(path, opts);

            if( !isFile && !t(opts.ignore).test(node) && opts.recursive) {
                
                let branch = craw(path, opts);

                opts.tree ? store[name] = branch : extend(store, branch);
            }

        }

        return store;
    }

    /* normalizes `opts[match | ignore ...]` */
    function t(rx, flag) {

        return rx ? rx.test ? rx : (rx.test = rx) : {test: ()=>true};
    }

    /* require or read file */
    function load(path, opts) {
        var name = p.basename(path);

        return opts.require && t(opts.require).test(name) ? require(path) : readFile(path).toString(opts.encoding);
    }
    
    /* renames module */
    function map(name, dir, isFile){

        if(isFile) 
            name = p.basename(name, p.extname(name));

        return name.replace(/\W+(\w|$)/g, (m, c) => c.toUpperCase())
    }

    /* resolves the modules */
    function resolvee(f) {
        // body...
    }

    function resolve(f){

        for(var i in this)

            /* if marked as directory => resolve again */
            if (this[i][_private])
                resolve.apply(this[i], arguments);

            /** if it must be resolved with external function
             *  if the functionon returns false - the reference 
             *  is to the original module */
            else if (arguments.length === 1 && typeof f === 'function')
                this[i] = f.call(this[i], i, this[i]) || this[i];

            /* if it is function itself and must be resolved with given arguments */
            /* if arguments are single array then use it as a list of arguments */
            else if (typeof this[i] == 'function')
                this[i] = this[i].apply(this[i], f && f.constructor === Array && arguments.length === 1 ? f : arguments) || this[i];
            

        return this;
    }

    function expo(dir, opts) {

        var modules;

        /* normalize options and merge with defaults */
        opts = extend({}, defaults, opts, dir ? dir instanceof Object ? dir : {dir} : undefined);

        /* needed to prevent cycle require */
        opts.index = module.parent ? module.parent.filename : module.filename;

        /* convert path to absolute */
        opts.dir = p.resolve(p.dirname(opts.index), opts.dir)

        /* may be executed continuesly to resolve the modules */
        function resolver(){
            return resolve.apply(resolver, arguments);
        }

        return extend(resolver, craw(opts.dir, opts))
    }


    return extend(expo, { defaults, map });
}());
