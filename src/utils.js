module.exports = {

    safeAssign( a, b ) {

        // safeAssign b to a

        for ( let key in b ) {

            if ( a.hasOwnProperty( key ) && b.hasOwnProperty( key ) )
                throw Error( 'utils.safeAssign(): Duplicated property key "' + key + '".' );

        }

        Object.assign( a, b );

    },

    _mergeModules( obj, ...modules ) {

        if ( modules.length === 0 ) return;

        let inits = [];

        for ( let m of modules ) {

            if ( m === undefined ) continue;

            if ( m.isPlateModule ) {

                // look for "init", "methods", and "properties"

                if ( m.init && typeof m.init === 'function' )

                    inits.push( m.init );

                if ( m.methods && typeof m.methods === 'object' )

                    this.safeAssign( obj, m.methods );

                if ( m.properties && typeof m.properties === 'object' )

                    // properties are shared with all objects created using the same module

                    this.safeAssign( obj, m.properties );

            } else if ( typeof m === 'function' )

                inits.push( m );

            else

                this.safeAssign( obj, m );

        }

        for ( let f of inits ) {

            f.call( obj );

        }


    },

    createObject( ...modules ) {

        // create a new object using the modules, init functions, and additional properties

        var obj = {};
        this._mergeModules( obj, ...modules );
        return obj;

    },

    createObjectWithProto( proto, ...modules ) {


        let obj = Object.create( proto );
        this._mergeModules( obj, ...modules );
        return obj;

    },

    checkMobile() {

        return /Android/i.test( navigator.userAgent ) ||
            /iPhone|iPad|iPod/i.test( navigator.userAgent );

    },

    checkLandscape( w, h ) {

        w = w || window.innerWidth;
        h = h || window.innerHeight;

        if ( w > h ) return true;
        return false;

    },

    cloneArray( arr ) {

        return arr.map( val => val );

    }

};
