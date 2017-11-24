module.exports = {

    isPlateModule: true,

    properties: {

        isPreloader: true

    },

    init() {

        this._progress = 0;
        this._total = 0;
        this._assets = new Map();

    },

    methods: {

        loadFile( path, callback ) {

            var rq = new XMLHttpRequest();
            rq.open( 'GET', path, true );

            rq.onreadystatechange = () => {

                if ( rq.readyState === 4 && rq.status === 200 ) {

                    callback( rq.response );

                }

            };

            rq.onerror = ( err ) => {

                throw Error( "preloader loadFile(): XHR error " + err );

            };

            rq.send( null );

        },

        loadBuffer( path, callback ) {

            var rq = new XMLHttpRequest();
            rq.open( "GET", path, true );
            rq.responseType = "arraybuffer";

            rq.onload = () => {

                callback( rq.response );

            };

            rq.onerror = ( err ) => {

                throw Error( "preloader loadBuffer(): XHR error " + err );

            };

            rq.send( null );

        },

        _getType( ext ) {

            let type;

            switch ( ext ) {

            case 'mp3':
            case 'wav':
                type = 'audioBuffer';
                break;

            case 'json':
            case 'obj':
                type = 'text';
                break;

            case 'jpg':
            case 'png':
            case 'gif':
            case 'svg':
                type = 'image';
                break;

            default:
                throw Error( 'preloader: invalid file extension "' + ext + '".' );

            }

            return type;

        },

        addAsset: ( function() {

            let patt = /\.[0-9a-z]+$/i;

            return function( key, path ) {

                let match = patt.exec( path );
                if ( match === null )
                    throw Error( 'prolader: invalid asset "' + path + '".' );

                let type = this._getType( match.pop().slice( 1 ) );

                if ( this._assets.get( key ) === undefined )
                    this._total += 1;

                this._assets.set( key, { type: type, path: path } );

                return this;

            };

        } )(),

        _updateProgress( p ) {

            if ( p !== undefined ) this._progress = p;
            else {

                if ( this._total === 0 ) throw Error( 'proloader: update progress error.' );

                this._progress += 1 / this._total;

            }

            this.trigger( 'preloader:progress', this._progress );

            if ( this._progress > 0.999 ) {

                this.trigger( 'preloader:finish', this );

            }

        },

        getLoadedAsset( key ) {

            let asset = this._assets.get( key );
            if ( ! asset || ! asset.response ) throw Error( 'preloader: cannot get loaded asset "' + key + '".' );

            return asset.response;

        },

        clear() {

            this._assets.clear();
            this._progress = 0;
            this._total = 0;

        },

        start( cb ) {

            // cb is called after each asset is loaded

            if ( this._assets.size === 0 ) {

                this._updateProgress( 1 );
                return;

            }

            for ( let [ key, asset ] of this._assets ) {

                switch ( asset.type ) {

                case 'image': {

                    let image = new Image();
                    image.src = asset.path;
                    image.onload = () => {

                        asset.response = image;

                        this._updateProgress();

                        if ( typeof cb === 'function' ) cb();

                    };

                }
                break;

                case 'text': {

                    this.loadFile( asset.path, response => {

                        asset.response = response;

                        this._updateProgress();

                        if ( typeof cb === 'function' ) cb();

                    } );

                }
                break;

                case 'audioBuffer': {

                    this.loadBuffer( asset.path, response => {

                        asset.response = this.decodeAudioData( response, asset, cb );

                    } );

                }
                break;

                default: throw Error( 'preloader: asset type "' + asset.type + '" error.' );

                } // end of switch

            } // end of for-of

        },

        decodeAudioData( response, asset, cb ) {

            let ctx = new window.AudioContext();
            ctx.decodeAudioData( response, buffer => {

                if ( buffer === undefined )
                    throw Error( 'preloader: error decoding audio data from "' + asset.path + '".' );

                asset.response = buffer;

                this._updateProgress();

                if ( typeof cb === 'function' ) cb();

            }, function( err ) {

                throw Error( err );

            } );

        }


    }

};
