module.exports = {

    isPlateModule: true,

    properties: {

        isVRManager: true

    },

    init() {

        this._bufferScale = 0.5;
        this._isPresenting = false;

        // get VRDisplay

        if ( navigator.getVRDisplays )
            navigator.getVRDisplays().then( this._gotVRDisplays.bind( this ) );

        else if ( navigator.getVRDevices )
            navigator.getVRDevices().then( this._gotVRDisplays.bind( this ) );

        else
            console.warn( "vrManager: cannot get vrDisplay." );


    },

    methods: {

        changeBufferScale( scale ) {

            if ( ! Number.isNaN( scale ) && typeof scale !== 'boolean' )
                this._bufferScale = scale;

        },

        isPresenting() {

            return this._isPresenting;

        },

        _gotVRDisplays( displays ) {

            this._vrDisplays = displays;

            for ( let i = 0; i < displays.length; i ++ ) {

                if ( 'VRDisplay' in window && displays[ i ] instanceof VRDisplay ) {

                    this._vrDisplay = displays[ i ];
                    this._isWebVR1 = true;
                    break;

                } else if ( 'HMDVRDevice' in window && displays[ i ] instanceof HMDVRDevice ) {

                    this._vrDisplay = displays[ i ];
                    this._isWebVR1 = false;
                    break;

                }

            }

            if ( this._vrDisplay === undefined ) {

                console.warn( 'HMD not available' );

            } else {

                window.addEventListener( 'vrdisplaypresentchange', this.handleVRDisplayPresentChange.bind( this ), false );

                // init vr effect

                this._cameraL = new LIT.Camera();
                this._cameraR = new LIT.Camera();
                this._cameraL.type = LIT.cameraTypes.PERSPECTIVE;
                this._cameraR.type = LIT.cameraTypes.PERSPECTIVE;

                this._eyeFOVL = undefined;
                this._eyeFOVR = undefined;

                this._eyeTranslationL = vec3.create();
                this._eyeTranslationR = vec3.create();

                this._eyeWidth = undefined;
                this._eyeHeight = undefined;

                this._renderRectL = undefined;
                this._renderRectR = undefined;

                this._leftBounds = [ 0.0, 0.0, 0.5, 1.0 ];
                this._rightBounds = [ 0.5, 0.0, 0.5, 1.0 ];

                this._isPresenting = false;

            }

            this.trigger( 'gotVRDisplay', this._vrDisplay !== undefined );

        },

        handleVRDisplayPresentChange() {

            // for resizing viewport after enter/exit vr

            let wasPresenting = this._isPresenting;

            this._isPresenting = this._vrDisplay !== undefined && ( this._vrDisplay.isPresenting || ( ! this._isWebVR1 && document[ this.fullscreenElement ] instanceof window.HTMLElement ) );

            // only resize viewport once

            if ( this._isPresenting ) {

                // resize vr viewport

                this._vrResizeViewport();

                if ( ! wasPresenting ) {

                    this._vrDisplay.resetPose();

                }

                this.trigger( 'change:vrDisplayPresent', 'start' );

            } else if ( wasPresenting ) {

                this.trigger( 'change:vrDisplayPresent', 'cancel' );

            }


        },

        requestPresent() {

            this._vrDisplay.requestPresent( [ { source: LIT.canvas } ] );
            // this fires vrdisplaypresentchange

        },

        exitPresent() {

            this._vrDisplay.exitPresent();
            // this fires vrdisplaypresentchange

        },

        resetPose() {

            this._vrDisplay.resetPose();

        },

        submitFrame() {

            if ( this._isWebVR1 && this._isPresenting ) {

                this._vrDisplay.submitFrame();

            }

        },

        beforeDraw( side ) {

            let renderRect = this[ '_renderRect' + side ];
            let x = renderRect.x,
                y = renderRect.y,
                width = renderRect.width,
                height = renderRect.height;

            LIT.gl.viewport( x, y, width, height );
            LIT.gl.scissor( x, y, width, height );

        },

        _vrResizeViewport() {

            this._updateEyeParameters();

            if ( this._isWebVR1 ) {

                LIT.resizeViewport( this._eyeWidth * 2 / this._bufferScale / LIT.devicePixelRatio, this._eyeHeight / this._bufferScale / LIT.devicePixelRatio );

            } else {

                LIT.resizeViewport( this._renderRectL.width * 2 / LIT.devicePixelRatio, this._renderRectL.height / LIT.devicePixelRatio );

            }

        },

        _updateEyeParameters() {

            let eyeParamsL = this._vrDisplay.getEyeParameters( 'left' );
            let eyeParamsR = this._vrDisplay.getEyeParameters( 'right' );

            if ( this._isWebVR1 ) {

                this._eyeWidth = eyeParamsL.renderWidth;
                this._eyeHeight = eyeParamsL.renderHeight;

                if ( this._vrDisplay.getLayers ) {

                    let layers = this._vrDisplay.getLayers();
                    if ( layers.length ) {

                        this._leftBounds = layers[ 0 ].leftBounds || [ 0.0, 0.0, 0.5, 1.0 ];
                        this._rightBounds = layers[ 0 ].rightBounds || [ 0.5, 0.0, 0.5, 1.0 ];

                    }

                }

                vec3.copy( this._eyeTranslationL, eyeParamsL.offset );
                vec3.copy( this._eyeTranslationR, eyeParamsR.offset );
                this._eyeFOVL = eyeParamsL.fieldOfView;
                this._eyeFOVR = eyeParamsR.fieldOfView;

            } else {

                this._eyeWidth = eyeParamsL.renderRect.width;
                this._eyeHeight = eyeParamsL.renderRect.height;

                vec3.set( this._eyeTranslationL, eyeParamsL.eyeTranslation.x, eyeParamsL.eyeTranslation.y, eyeParamsL.eyeTranslation.z );
                vec3.set( this._eyeTranslationR, eyeParamsR.eyeTranslation.x, eyeParamsR.eyeTranslation.y, eyeParamsR.eyeTranslation.z );
                this._eyeFOVL = eyeParamsL.recommendedFieldOfView;
                this._eyeFOVR = eyeParamsR.recommendedFieldOfView;

            }

            this._renderRectL = {

                x: Math.round( this._eyeWidth * 2 * this._leftBounds[ 0 ] ) / this._bufferScale,
                y: Math.round( this._eyeHeight * this._leftBounds[ 1 ] ) / this._bufferScale,
                width: Math.round( this._eyeWidth * 2 * this._leftBounds[ 2 ] ) / this._bufferScale,
                height:  Math.round( this._eyeHeight * this._leftBounds[ 3 ] ) / this._bufferScale

            };

            this._renderRectR = {

                x: Math.round( this._eyeWidth * 2 * this._rightBounds[ 0 ] ) / this._bufferScale,
                y: Math.round( this._eyeHeight * this._rightBounds[ 1 ] ) / this._bufferScale,
                width: Math.round( this._eyeWidth * 2 * this._rightBounds[ 2 ] ) / this._bufferScale,
                height:  Math.round( this._eyeHeight * this._rightBounds[ 3 ] ) / this._bufferScale

            };

        },

        updateCameras( camera ) {

            if ( this._isPresenting === true ) {

                this._updateEyeParameters();

                let near = camera.near;
                let far = camera.far;

                this._cameraL.projectionMatrix = this._fovToProjection( this._eyeFOVL, true, near, far );
                this._cameraR.projectionMatrix = this._fovToProjection( this._eyeFOVR, true, near, far );

                let pos = camera.getWorldPosition();
                let posL = vec3.create();
                let posR = vec3.create();

                vec3.add( posL, pos, this._eyeTranslationL );
                vec3.add( posR, pos, this._eyeTranslationR );

                this._cameraL.translateTo( posL );
                this._cameraR.translateTo( posR );


                let qt = camera.getQuaternion();

                this._cameraL.setQuaternion( qt );
                this._cameraR.setQuaternion( qt );

            }

        },

        getCameraParams( side ) {

            // vr cameras are not in a camera group

            if ( side === 'l' ) {

                return {

                    position: this._cameraL.getPosition(),
                    fov: this._eyeFOVL,
                    aspect: this._renderRectL.width / this._renderRectL.height

                };

            } else if ( side === 'r' ) {

                return {

                    position: this._cameraR.getPosition(),
                    fov: this._eyeFOVR,
                    aspect: this._renderRectR.width / this._renderRectR.height

                };

            } else {

                console.error( "VRManager: Invalid parameter." );

            }

        },

        _fovToNDCScaleOffset( fov ) {

            let pxScale = 2.0 / ( fov.leftTan + fov.rightTan );
            let pxOffset = ( fov.leftTan - fov.rightTan ) * pxScale * 0.5;
            let pyScale = 2.0 / ( fov.upTan + fov.downTan );
            let pyOffset = ( fov.upTan - fov.downTan ) * pyScale * 0.5;
            return { scale: [ pxScale, pyScale ], offset: [ pxOffset, pyOffset ] };

        },

        _fovToProjection( fov, rightHanded, zNear, zFar ) {

            let DEG2RAD = Math.PI / 180.0;

            let fovPort = {
                upTan: Math.tan( fov.upDegrees * DEG2RAD ),
                downTan: Math.tan( fov.downDegrees * DEG2RAD ),
                leftTan: Math.tan( fov.leftDegrees * DEG2RAD ),
                rightTan: Math.tan( fov.rightDegrees * DEG2RAD )
            };

            return this._fovPortToProjection( fovPort, rightHanded, zNear, zFar );

        },

        _fovPortToProjection( fov, rightHanded, zNear, zFar ) {

            rightHanded = rightHanded === undefined ? true : rightHanded;
            zNear = zNear === undefined ? 0.01 : zNear;
            zFar = zFar === undefined ? 10000.0 : zFar;

            let handednessScale = rightHanded ? - 1.0 : 1.0;

            // start with an identity matrix
            let m = mat4.create();

            // and with scale/offset info for normalized device coords
            let scaleAndOffset = this._fovToNDCScaleOffset( fov );

            // X result, map clip edges to [-w,+w]
            m[ 0 ] = scaleAndOffset.scale[ 0 ];
            m[ 1 ] = 0.0;
            m[ 2 ] = scaleAndOffset.offset[ 0 ] * handednessScale;
            m[ 3 ] = 0.0;

            // Y result, map clip edges to [-w,+w]
            // Y offset is negated because this proj matrix transforms from world coords with Y=up,
            // but the NDC scaling has Y=down (thanks D3D?)
            m[ 4 ] = 0.0;
            m[ 4 + 1 ] = scaleAndOffset.scale[ 1 ];
            m[ 4 + 2 ] = - scaleAndOffset.offset[ 1 ] * handednessScale;
            m[ 4 + 3 ] = 0.0;

            // Z result (up to the app)
            m[ 2 * 4 ] = 0.0;
            m[ 2 * 4 + 1 ] = 0.0;
            m[ 2 * 4 + 2 ] = zFar / ( zNear - zFar ) * - handednessScale;
            m[ 2 * 4 + 3 ] = zFar * zNear / ( zNear - zFar );

            // W result (= Z in)
            m[ 3 * 4 ] = 0.0;
            m[ 3 * 4 + 1 ] = 0.0;
            m[ 3 * 4 + 2 ] = handednessScale;
            m[ 3 * 4 + 3 ] = 0.0;

            mat4.transpose( m, m );

            return m;

        }

    }

};
