module.exports = {

    isPlateModule: true,

    properties: {

        isAudioPlayer: true

    },

    init() {

        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this._context = new window.AudioContext();
        this._assets = new Map();
        this._defaultGainValue = 1;

    },

    methods: {

        setAssets( ...args ) {

            // key, buffer, key, buffer, ...

            if ( args.length % 2 !== 0 )
                throw Error( 'audioPlayer setAssets() incomplete parameters.' );

            let i = 0;
            let key;
            for ( let arg of args ) {

                if ( i % 2 === 0 && typeof arg === 'string' ) {

                    key = arg;

                } else {

                    this._assets.set( key, {

                        buffer: arg,
                        duration: arg.duration

                    } );

                }

                i ++;

            }

        },

        _getAsset( key ) {

            if ( ! this._assets.has( key ) )
                throw Error( 'audioPlayer: cannot find buffer "' + key + '".' );

            return this._assets.get( key );

        },

        createSource( buffer ) {

            let source = this._context.createBufferSource();
            source.buffer = buffer;

            return source;

        },

        createConvolver( buffer ) {

            let convolver = this._context.createConvolver();
            convolver.buffer = buffer;

            return convolver;

        },

        createGainNode( val ) {

            let gainNode = this._context.createGain();
            gainNode.gain.value = val === undefined ? this._defaultGainValue : val;

            return gainNode;

        },

        createSourceFromAsset( key ) {

            let asset = this._getAsset( key );

            return this.createSource( asset.buffer );

        },

        createConvolverFromAsset( key ) {

            let asset = this._getAsset( key );

            return this.createConvolver( asset.buffer );

        },

        startSource( source, time = 0, offset = 0, duration = undefined ) {

            if ( this._context.state === 'suspended' ) this._context.resume();

            source[ source.start ? 'start' : 'noteOn' ]( time, offset, duration );

        },

        stopSource( source, time = 0 ) {

            source[ source.stop ? 'stop' : 'noteOff' ]( time );

        },

        toDestination( obj ) {

            obj.connect( this._context.destination );

        },

        playAsset( key, time = 0 ) {

            let source = this.createSourceFromAsset( key );

            this.toDestination( source );

            this.startSource( source, time );

            return source;

        },

        setDefaultGainValue( val ) {

            this._defaultGainValue = val;

        },

        setGainValue( gainNode, val ) {

            gainNode.gain.value = val;

        }

    }

};
