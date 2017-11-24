var utils = require( './utils.js' );

module.exports = {

    isPlateModule: true,

    properties: {

        isKeyboardInput: true,
        _keyCodes: {

            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            SPACE: 32,
            a: 65,
            d: 68,
            w: 87,
            s: 83,
            r: 82,
            f: 70

        }

    },

    init() {

        this._isStart = false;
        this._output = {};
        this.reset();

        var onKeydown = e => {

            switch ( e.keyCode ) {

            case this._keyCodes.LEFT:
            case this._keyCodes.a:
                this._keyDir[ 0 ] = - 1;
                break;

            case this._keyCodes.RIGHT:
            case this._keyCodes.d:
                this._keyDir[ 0 ] = 1;
                break;

            case this._keyCodes.UP:
            case this._keyCodes.w:
                this._keyDir[ 1 ] = 1;
                break;

            case this._keyCodes.DOWN:
            case this._keyCodes.s:
                this._keyDir[ 1 ] = - 1;
                break;

            case this._keyCodes.r:
                this._keyRFDir = 1;
                break;

            case this._keyCodes.f:
                this._keyRFDir = - 1;
                break;

            case this._keyCodes.SPACE:
                this._key = 'space';
                break;

            default:
                break;

            }

            this._gotData();

        };

        this._bind = () => {

            window.addEventListener( 'keydown', onKeydown, false );

        };

        this._unbind = () => {

            window.removeEventListener( 'keydown', onKeydown, false );

        };

    },

    methods: {

        _gotData() {

            if ( this.isConnector ) {

                this._output.keyDir = utils.cloneArray( this._keyDir );
                this._output.keyRFDir = this._keyRFDir;
                this._output.key = this._key;

                this.forward( this._output );

            }

            this.reset();

        },

        reset() {

            this._keyDir = [ 0, 0 ];
            this._keyRFDir = 0;
            this._key = undefined;

        },

        start() {

            if ( this._isStart ) return;
            this._bind();
            this._isStart = true;

        },

        cancel() {

            if ( ! this._isStart ) return;
            this._unbind();
            this._isStart = false;

        }

    }

};
