var utils = require( './utils.js' );
var mapo = require( './mapo.js' );

module.exports = {

    isPlateModule: true,

    properties: {

        isSceneHelper: true

    },

    methods: {

        config( vrManager ) {

            if ( vrManager && vrManager.isVRManager ) {

                this._vrManager = vrManager;

            }

        },

        // methods on the pool

        _setInputItemWithType( input, typeName ) {

            let wt = mapo.createWithType( ...this[ '_' + typeName + 'TypeConfigs' ] );
            wt.setTypedItems( input );
            return wt;

        },

        addDefaultCamera( key, camera ) {

            this.addCamera( key, camera );
            this._defaultCameraKey = key;
            return this;

        },

        setDefaultCameraKey( key ) {

            if ( ! this._pool.get( 'cameras' ).has( key ) )
                throw Error( 'sceneHelper: camera is not in the pool.' );
            this._defaultCameraKey = key;
            return this;

        },

        addCamera( key, camera ) {

            if ( ! camera.isCamera )
                throw Error( 'sceneHelper: invalid camera type.' );
            this._pool.setInCollection( 'cameras', key, camera );
            return this;

        },

        addFrame( key, frame ) {

            this._pool.setInCollection( 'frames', key, this._setInputItemWithType( frame, 'frame' ) );
            return this;

        },

        addDrawItemMap( key, drawItemMap ) {

            let m = mapo.createCollection();
            for ( let itemKey in drawItemMap ) {

                m.set( itemKey, this._setInputItemWithType( drawItemMap[ itemKey ], 'drawItem' ) );

            }
            this._pool.setInCollection( 'drawItemMaps', key, m );
            return this;

        },

        addAnimation( key, animation ) {

            if ( this._vrManager !== undefined ) {

                animation.afterDraw = animation.afterDraw || [];
                animation.afterDraw.push( this._vrManager.submitFrame.bind( this._vrManager ) );

            }

            this._pool.setInCollection( 'animations', key, this._setInputItemWithType( animation, 'animation' ) );
            return this;

        },

        // methods on the scenes and renderContext

        addScene( sceneKey, scene ) {

            this._scenes.set( sceneKey, this._setInputItemWithType( scene, 'scene' ) );
            return this;

        },

        getSceneKey() {

            return this._sceneKey;

        },

        _hasSceneItemFromPool( sceneKey, itemType ) {

            return this._scenes.hasInCollection( sceneKey, itemType + 'Key' );

        },

        _getSceneItemFromPool( sceneKey, itemType ) {

            let itemKey = this._scenes.getInCollection( sceneKey, itemType + 'Key' );
            return this._pool.getInCollection( itemType + 's', itemKey );

        },

        _loadScene( sceneKey ) {

            if ( this._sceneKey === sceneKey ) return;

            if ( this._sceneKey !== undefined ) {

                this._renderHelper.stop();

                let prevAnimation = this._getSceneItemFromPool( this._sceneKey, 'animation' );

                prevAnimation.callFunctionItem( 'onCancel', false );

            }

            this._sceneKey = sceneKey;
            if ( ! sceneKey ) return;

            // camera and frames
            let scene = this._scenes.get( sceneKey );
            let camera;
            if ( scene.has( 'cameraKey' ) ) {

                camera = this._getSceneItemFromPool( sceneKey, 'camera' );

            } else {

                if ( ! this._defaultCameraKey )
                    this.setDefaultCameraKey( this._pool.get( 'cameras' ).map.keys().next().value );

                camera = this._pool.getInCollection( 'cameras', this._defaultCameraKey );

            }

            let frames;
            if ( scene.has( 'frameKeys' ) ) {

                frames = scene.get( 'frameKeys' )
                    .map( frameKey => this._pool.getInCollection( 'frames', frameKey ).toObject() );

            }

            this._renderContext.camera = camera;
            this._renderContext.frames = frames;
            this._renderContext.drawItems = [];

            if ( this._hasSceneItemFromPool( sceneKey, 'drawItemMap' ) ) {

                let drawItems = this._getSceneItemFromPool( sceneKey, 'drawItemMap' ).toObject();
                for ( let itemKey in drawItems ) {

                    this._renderContext.drawItems.push( drawItems[ itemKey ].toObject() );

                }

            }

            let animation = this._getSceneItemFromPool( sceneKey, 'animation' );
            this._renderContext.scissorTest = animation.has( 'scissorTest' ) ? animation.get( 'scissorTest' ) : false;
            this._renderContext.beforeDraw = animation.has( 'beforeDraw' ) ? animation.get( 'beforeDraw' ) : undefined;
            this._renderContext.afterDraw = animation.has( 'afterDraw' ) ? animation.get( 'afterDraw' ) : undefined;

            animation.callFunctionItem( 'onStart', false );

            this._renderHelper.start();

            console.log( 'sceneHelper: changed scene to "' + sceneKey + '".' );

        },

        _handleVRDisplayPresentChange( request ) {

            let w, h;
            if ( request === 'start' ) {

                let manager = this._vrManager;

                // add vrFrameL, vrFrameR
                if ( ! this._pool.get( 'frames' ).has( 'vrFrameL' ) ) {

                    this.addFrame( 'vrFrameL', {

                        camera: manager.cameraL,
                        beforeDraw: manager.beforeDraw.bind( manager, 'L' )

                    } );
                    this.addFrame( 'vrFrameR', {

                        camera: manager.cameraR,
                        beforeDraw: manager.beforeDraw.bind( manager, 'R' )

                    } );

                }

                this._configVRFrames();

                w = manager.eyeWidth * 2 / manager.bufferScale / LIT.devicePixelRatio;
                h = manager.eyeHeight / manager.bufferScale / LIT.devicePixelRatio;

            } else if ( request === 'cancel' ) {

                this._unConfigVRFrames();

                w = window.innerWidth;
                h = window.innerHeight;
                LIT.resizeViewport( w, h );

            }

            this._handleResizeViewport( w, h );

        },

        _configVRFrames() {

            // overwite renderContext scissorTest, frames

            let vrFrameL = this._pool.getInCollection( 'frames', 'vrFrameL' );
            let vrFrameR = this._pool.getInCollection( 'frames', 'vrFrameR' );

            this._cachedScissorTest = this._renderContext.scissorTest;
            this._cachedFrames = this._renderContext.frames;

            this._renderContext.scissorTest = true;
            this._renderContext.frames = [ vrFrameL, vrFrameR ];

        },

        _unConfigVRFrames() {

            // recover renderContext scissorTest, frames

            this._renderContext.scissorTest = this._cachedScissorTest || false;
            this._cachedScissorTest = undefined;

            this._renderContext.frames = this._cachedFrames;
            this._cachedFrames = undefined;

        },

        _handleResizeViewport( w, h ) {

            if ( this._sceneKey === undefined ) return;
            let animation = this._getSceneItemFromPool( this._sceneKey, 'animation', true );

            if ( animation.has( 'onResizeViewport' ) ) {

                let cbArray = animation.get( 'onResizeViewport' );
                cbArray.forEach( cb => {

                    cb( w, h );

                } );

            }

        }

    },

    init() {

        this._vrManager = undefined;
        this._renderContext = undefined; // for renderHelper
        this._renderHelper = undefined;
        this._pool = undefined; // objects from director
        this._defaultCameraKey = undefined;
        this._scenes = undefined; // keys from director
        this._sceneKey = undefined;

        this._renderContext = {};

        this._renderHelper = utils.createObject( require( './renderHelper.js' ) );
        this._renderHelper.config( this._renderContext );

        // object pool
        this._pool = mapo.createCollection();
        this._pool.set( 'cameras', mapo.create() );
        this._pool.set( 'frames', mapo.createCollection() );
        this._pool.set( 'drawItemMaps', mapo.createCollection() );
        this._pool.set( 'animations', mapo.createCollection() );

        this._frameTypeConfigs = [

            'camera', false, 'isCamera',
            'beforeDraw', false, 'function',
            'afterDraw', false, 'function'

        ];

        this._drawItemTypeConfigs = [

            'mesh', true, 'isMesh',
            'shader', true, 'isShader',
            'textures', false, Array,
            'cullFace', false, 'string',
            'mode', false, 'string'

        ];

        this._animationTypeConfigs = [

            'onStart', false, 'function',
            'onCancel', false, 'function',
            'beforeDraw', false, Array,
            'afterDraw', false, Array,
            'onResizeViewport', false, Array,
            'scissorTest', false, 'boolean'

        ];

        // indexing map
        this._scenes = mapo.createCollection();
        this._sceneTypeConfigs = [

            'cameraKey', false, 'string',
            'frameKeys', false, Array,
            'drawItemMapKey', false, 'string',
            'animationKey', true, 'string'

        ];

        this.on( 'change:scene', this._loadScene.bind( this ) );

        this.on( 'change:vrDisplayPresent', this._handleVRDisplayPresentChange.bind( this ) );
        this.on( 'resize:viewport', ( dimension ) => {

            let w = dimension.width;
            let h = dimension.height;

            if ( this._vrManager && this._vrManager.isPresenting ) {

                if ( ! utils.checkLandscape() ) {

                    this.vrManager.exitPresent();
                    this.trigger( 'request:vrLandscapePrompt' );

                }


            } else {

                LIT.resizeViewport( w, h );
                this._handleResizeViewport( w, h );

            }

        } );

    }

};
