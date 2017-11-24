let proto = {

    setStrict() {

        this._strict = true;

    },

    cancelStrict() {

        this._strict = false;

    },

    // map operations

    _set( key, item, m ) {

        if ( m.has( key ) && this._strict )

            throw Error( 'mapo set(): duplicated key "' + key + '".' );

        m.set( key, item );

    },

    set: function( key, item ) {

        this._set( key, item, this.map );

    },

    _get( key, m ) {

        if ( ( ! m.has( key ) ) && this._strict ) {

            throw Error( 'mapo get(): cannot find key "' + key + '".' );

        }

        return m.get( key );

    },

    get( key ) {

        return this._get( key, this.map );

    },

    has( key ) {

        return this.map.has( key );

    },

    delete( key ) {

        if ( ! this.has( key ) && this._strict )

            throw Error( 'mapo delete(): cannot find key "' + key + '"' );

        this.map.delete( key );

    },

    clear() {

        this.map.clear();

    },

    copy( m ) {

        if ( m instanceof Map ) {

            this.clear();

            m.forEach( ( val, key ) => {

                this.map.set( key, val );

            } );

        } else if ( m.isMapo ) {

            this.clear();

            m.map.forEach( ( val, key ) => {

                this.map.set( key, val );

            } );

        } else {

            throw Error( 'mapo copy(): invalid data type.' );

        }

    },

    getSize() {

        return this.map.size;

    },

    callFunctionItem( key, isRequired, ...args ) {

        if ( ! this.has( key ) ) {

            if ( isRequired )

                throw Error( 'mapo callFunctionItem(): cannot find key "' + key + '".' );

            else return;

        } else {

            let f = this.get( key );

            if ( typeof f !== 'function' )

                throw Error( 'mapo callFunctionItem(): item is not a function.' );

            return f( ...args );

        }

    },

    toObject() {

        let obj = {};
        this.map.forEach( ( item, key ) => {

            obj[ key ] = item;

        } );

        return obj;

    },

    // operate on array items

    getArrayItem( key ) {

        let item = this.get( key );

        if ( ! Array.isArray( item ) )

            throw Error( 'mapo pushIn(): item with key "' + key + '" is not an array.' );

        return item;

    },

    pushInArrayItem( key, val ) {

        return this.getArrayItem( key ).push( val );

    },

    removeFromArrayItem( key, val ) {

        let arr = this.getArrayItem( key );

        let i = arr.indexOf( val );

        if ( i > - 1 )

            return arr.splice( i, 1 );

        else if ( this._strict )

            throw Error( 'mapo removeFromArrayItem(): cannot find "' + val + '" in array with key " ' + key + '".' );

    },

    // operate on key items
    // ( items of this map is the keys another maps )

    getInKeyItem( key, m ) {

        // equivalent to m.get( this.map.get( key ) )

        let keyItem = this.get( key );

        if ( m.isMapo )

            return m.get( keyItem );

        else if ( m instanceof Map )

            return this._get( keyItem, m );

        else

            throw Error( 'mapo getKeyMapItem(): ' + m + ' is neither a Map nor a Mapo.' );

    }

};

let collectionProto = {

    _getMapItem( key ) {

        let item = this.get( key );

        if ( item.isMapo || item instanceof Map )

            return item;

        throw Error( 'mapo getInCollection(): item is neither a Map nor a Mapo.' );

    },

    getInCollection( mapoKey, key ) {

        return this._getMapItem( mapoKey ).get( key );

    },

    hasInCollection( mapoKey, key ) {

        return this._getMapItem( mapoKey ).has( key );

    },

    setInCollection( mapoKey, key, item ) {

        this._getMapItem( mapoKey ).set( key, item );

    },

    deleteInCollection( mapoKey, key ) {

        this._getMapItem( mapoKey ).delete( key );

    }

};

let withTypeProto = {

    _checkTypedItemsComplete( map ) {

        let res = true;

        this._typeConfigs.forEach( ( val, key ) => {

            if ( val[ 0 ] && ! map.has( key ) )

                res = false;

        } );

        return res;

    },

    setTypedItems( data ) {

        let m = new Map();

        for ( let itemKey in data ) {

            if ( data.hasOwnProperty( itemKey ) ) {

                if ( ! this._typeConfigs.has( itemKey ) )

                    throw Error( 'mapo setTypedItems(): invalid key "' + itemKey + '".' );

                let val = data[ itemKey ];

                let dataType = this._typeConfigs.get( itemKey )[ 1 ];

                if ( typeof dataType === 'function' && ! ( val instanceof dataType ) )

                    throw Error( 'mapo setTypedItems(): invalid datatype for key "' + itemKey + '".' );

                if ( typeof dataType === 'string' && typeof val !== dataType && val[ dataType ] === undefined )

                    throw Error( 'mapo setTypedItems(): invalid datatype for key "' + itemKey + '".' );

                this._set( itemKey, val, m );

            }

        }

        if ( this._checkTypedItemsComplete( m ) === false )

            throw Error( 'mapo setTypedItems(): data incomplete.' );

        this.copy( m );

    },

    resetTypeConfigs( ...configs ) {

        this.clear();
        this._typeConfigs.clear();

        if ( ! configs || configs.length % 3 !== 0 )

            throw Error( 'mapo createWithType(): missing type property configs.' );

        let count = 0,
            key,
            isRequired,
            dataType;

        configs.forEach( ( config ) => {

            if ( count % 3 === 0 ) {

                if ( typeof config !== 'string' )

                    throw Error( 'mapo createWithType(): invalid config key "' + config + '" format.' );

                key = config;

            } else if ( count % 3 === 1 ) {

                if ( typeof config !== 'boolean' )

                    throw Error( 'mapo createWithType(): invalid config isRequired "' + config + '" format.' );

                isRequired = config;

            } else {

                if ( typeof config !== 'string' && typeof config !== 'function' )

                    throw Error( 'mapo createWithType(): invalid config dataType "' + config + '" format.' );

                dataType = config;

                this._set( key, [ isRequired, dataType ], this._typeConfigs );

            }

            count ++;

        } );

    }

};

let create = () => {

    let m = Object.create( proto );

    Object.assign( m, {

        isMapo: true,
        map: new Map(),
        _strict: true

    } );

    return m;

};

let createCollection = (  ...mapoKeys ) => {

    // a map of mapos
    // 'mapoKey' represents the key in this.map
    // 'key' represents the key in a child mapo

    let c = Object.create( Object.assign( proto, collectionProto ) );

    Object.assign( c, {

        isMapo: true,
        isMapoCollection: true,
        map: new Map(),
        _strict: true

    } );

    if ( mapoKeys ) {

        mapoKeys.forEach( mapoKey => {

            if ( typeof mapoKey === 'string' )

                c.set( mapoKey, create( c._strict ) );

            else

                throw Error( 'mapo createCollection(): invalid parameters.' );

        } );

    }

    return c;

};

let createWithType = ( ...configs ) => {

    // a map with fixed keys, pairing with fix-typed item
    // format of congigs: key, isRequired, dataType...
    // this._typeConfigs is map containing "key - [ isRequired, dataType ]" configs

    let wt = Object.create( Object.assign( proto, withTypeProto ) );

    Object.assign( wt, {

        isMapo: true,
        isMapoWithType: true,
        map: new Map(),
        _typeConfigs: new Map(),
        _strict: true

    } );

    wt.resetTypeConfigs( ...configs );

    return wt;

};

module.exports = {

    create, createCollection, createWithType

};
