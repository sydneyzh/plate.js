module.exports = {

    isPlateModule: true,

    properties: {

        hasEvents: true

    },

    init() {

        let map = new Map();
        this._map = map;

    },

    methods: {

        getHandlerArray( evn ) {

            return this._map.get( evn );

        },

        on( evn, hdl ) {

            if ( this._map.get( evn ) === undefined )
                this._map.set( evn, [] );

            this._map.get( evn ).push( hdl );

        },

        off( evn, hdl ) {

            let hdlArr = this.getHandlerArray( evn );

            if ( ! hdlArr ) return;

            for ( let existingHdl of hdlArr ) {

                if ( existingHdl === hdl ) {

                    hdlArr.splice( hdlArr.indexOf( hdl ), 1 );
                    return;

                }

            }

            throw Error( 'events: cannot find handler for event "' + evn + '".' );

        },

        trigger( evn, data, cb ) {

            let hdlArr = this.getHandlerArray( evn );

            if ( ! hdlArr ) {

                console.warn( 'events: cannot find event "' + evn + '".' );
                return;

            }

            for ( let hdl of hdlArr ) {

                if ( typeof hdl === 'function' ) hdl( data );
                else
                    throw Error( 'events: unable to trigger handler for event "' + evn + '". ' );

            }

            if ( typeof cb === 'function' ) cb();

        }

    }

};
