module.exports = {

    isPlateModule: true,

    properties: {

        isConnector: true

    },

    init() {

        this._callback = undefined;
        this._dests = []; // must be connectors

    },

    methods: {

        config( callback, ...dests ) {

            if ( typeof callback !== 'function' )

                throw Error( 'connector: "' + callback + '" is not a function.' );

            this._callback = callback;

            if ( dests.length > 0 )

                this.addDest( ...dests );

        },

        addDest( ...dests ) {

            // add fixed destinations

            this._dests.push( ...dests );

        },

        clearDest() {

            this._dests.length = 0;

        },

        forward( input, ...dests ) {

            // run callback and forward data to destinations

            // dests are temporary

            // since the output of an upstream connector is single
            // the input of a connector can only be single as well

            if ( ! this._callback )

                throw Error( 'connector: unconfiged.' );

            let output = this._callback( input );

            if ( output === 'end' ) return;

            let allDests;

            if ( this._dests && this._dests.length > 0 )

                allDests = dests.concat( this._dests );

            else

                allDests = dests;

            if ( allDests && allDests.length > 0 ) {

                for ( let dest of allDests ) {

                    // the connector iteself does not lable the processed data

                    if ( ! dest.isConnector ) throw Error( 'connector: destination "' + dest + '" is not a connector.' );

                    dest.forward( output );

                }

            } else

                return output;

        }

    }

};
