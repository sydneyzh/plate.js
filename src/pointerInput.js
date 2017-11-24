var utils = require( './utils.js' );

module.exports = {

    isPlateModule: true,

    properties: {

        isPointerInput: true

    },

    init() {

        this._isStart = false;
        this._output = {};
        this.reset();
        this._state = 'none';

        this._panStart = [ 0, 0 ];
        this._zoomStart = 0;

        this._canvasX = LIT.cssWidth;
        this._canvasY = LIT.cssHeight;

        let handlePointerMove = e => {

            this._nPointerXY[ 0 ] = 2 * e.clientX / this._canvasX - 1;
            this._nPointerXY[ 1 ] = 1 - 2 * e.clientY / this._canvasY;

            this._gotData();

        };

        let handleWindowResize = () => {

            this._canvasX = LIT.cssWidth;
            this._canvasY = LIT.cssHeight;

        };

        let handleMouseWheel = e => {

            this._wheelDelta = ( e.deltaY > 0 ) ? 1 : - 1;

            this._gotData();

        };

        let handlePanMouseMove = e => {

            if ( this._state !== 'pan' ) return;

            e.preventDefault();

            let panDeltaX = e.clientX - this._panStart[ 0 ];
            let panDeltaY = e.clientY - this._panStart[ 1 ];

            this._panStart[ 0 ] = e.clientX;
            this._panStart[ 1 ] = e.clientY;

            this._nPanDelta[ 0 ] = panDeltaX / this._canvasX;
            this._nPanDelta[ 1 ] = panDeltaY / this._canvasY;

            this._gotData();

        };

        let handlePanMouseUp = e => {

            window.removeEventListener( "mousemove", handlePanMouseMove, false );
            window.removeEventListener( "mouseup", handlePanMouseUp, false );
            this._state = 'none';

            this.reset();

        };

        let handlePanMouseDown = e => {

            if ( this._state !== 'none' ) return;

            this._panStart[ 0 ] = e.clientX;
            this._panStart[ 1 ] = e.clientY;

            this._state = 'pan';

            window.addEventListener( "mousemove", handlePanMouseMove, false );
            window.addEventListener( 'mouseup', handlePanMouseUp, false );

        };

        let handleTouchMove = e => {

            if ( this._state === 'none' ) return;

            e.preventDefault();
            e.stopPropagation();

            switch ( e.touches.length ) {

            case 1:
                let panDeltaX = e.touches[ 0 ].pageX - this._panStart[ 0 ];
                let panDeltaY = e.touches[ 0 ].pageY - this._panStart[ 1 ];

                this._panStart[ 0 ] = e.touches[ 0 ].pageX;
                this._panStart[ 1 ] = e.touches[ 0 ].pageY;

                this._nPanDelta[ 0 ] = panDeltaX / this._canvasX;
                this._nPanDelta[ 1 ] = panDeltaY / this._canvasY;

                this._gotData();
                break;

            case 2:
                let dx = e.touches[ 0 ].pageX - e.touches[ 1 ].pageX;
                let dy = e.touches[ 0 ].pageY - e.touches[ 1 ].pageY;
                let zoomEnd = Math.sqrt( dx * dx + dy * dy );
                let zoomDelta = zoomEnd - this._zoomStart;

                if ( zoomDelta > 0 ) this._wheelDelta = 1;
                else if ( zoomDelta < 0 ) this._wheelDelta = - 1;

                this._zoomStart = zoomEnd;

                this._gotData();
                break;

            default:
                this._status = 'none';

            }

        };

        let handleTouchEnd = () => {

            this._status = 'none';


            window.removeEventListener( 'touchmove', handleTouchMove, false );
            window.removeEventListener( 'touchend', handleTouchEnd, false );

            this.reset();

        };

        let handleTouchStart = e => {

            e.stopPropagation(); // prevent touch scroll page

            switch ( e.touches.length ) {

            case 1:

                this._panStart[ 0 ] = e.touches[ 0 ].pageX;
                this._panStart[ 1 ] = e.touches[ 0 ].pageY;
                this._state = 'pan';
                break;

            case 2:

                let dx = e.touches[ 0 ].pageX - e.touches[ 1 ].pageX;
                let dy = e.touches[ 0 ].pageY - e.touches[ 1 ].pageY;
                this._zoomStart = Math.sqrt( dx * dx + dy * dy );
                this._state = 'zoom';
                break;

            default:
                this._status = 'none';

            }

            window.addEventListener( 'touchmove', handleTouchMove, false );
            window.addEventListener( 'touchend', handleTouchEnd, false );

        };

        this._bind = function() {

            window.addEventListener( 'mousemove', handlePointerMove, false );
            window.addEventListener( 'wheel', handleMouseWheel, false );
            window.addEventListener( 'mousedown', handlePanMouseDown, false );
            window.addEventListener( 'touchstart', handleTouchStart, false );
            // window.addEventListener( 'touchend', handleTouchEnd, false );
            // window.addEventListener( 'touchmove', handleTouchMove, false );

            window.addEventListener( 'resize', handleWindowResize, false );
            window.addEventListener( 'fullscreenchange', handleWindowResize, false );
            window.addEventListener( 'webkitfullscreenchange', handleWindowResize, false );
            window.addEventListener( 'mozfullscreenchange', handleWindowResize, false );


        };

        this._unbind = function() {

            window.removeEventListener( 'mousemove', handlePointerMove, false );
            window.removeEventListener( 'wheel', handleMouseWheel, false );
            window.removeEventListener( 'mousedown', handlePanMouseDown, false );
            window.removeEventListener( 'touchstart', handleTouchStart, false );
            // window.removeEventListener( 'touchend', handleTouchEnd, false );
            // window.removeEventListener( 'touchmove', handleTouchMove, false );

            window.removeEventListener( 'resize', handleWindowResize, false );
            window.removeEventListener( 'fullscreenchange', handleWindowResize, false );
            window.removeEventListener( 'webkitfullscreenchange', handleWindowResize, false );
            window.removeEventListener( 'mozfullscreenchange', handleWindowResize, false );

        };


    },

    methods: {

        _gotData() {

            if ( this.isConnector ) {

                this._output.wheelDelta = this._wheelDelta;
                this._output.nPanDelta = utils.cloneArray( this._nPanDelta );
                this._output.nPointerXY = utils.cloneArray( this._nPointerXY );

                this.forward( this._output );

            }

            this._wheelDelta = 0;

        },

        reset() {

            this._wheelDelta = 0;
            this._nPanDelta = [ 0, 0 ];
            this._nPointerXY = [ 0, 0 ];

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
