module.exports = {

    isPlateModule: true,

    properties: {

        isOrbitControl: true

    },

    init() {

        this.reset();

        // configurable
        this.target = vec3.create();
        this.rotateSpeed = 1.5;
        this.zoomSpeed = Math.pow( 0.95, 1 );
        this.panSpeed = 7;
        this.minDist = 0;
        this.maxDist = LIT.INF;
        this.minPolar = 0;
        this.maxPolar = Math.PI;
        this.minAzimuth = - LIT.INF;
        this.maxAzimuth = LIT.INF;
        this.dampingFactor = 0.25;

    },

    methods: {

        setCamera( camera ) {

            if ( ! camera.isCamera ) throw Error( 'orbitControl: invalid camera.' );

            this._camera = camera;
            this._cameraType = ( camera.type === LIT.cameraTypes.PERSPECTIVE ) ? 'perspective' : (
                ( camera.type === LIT.cameraTypes.PERSPECTIVE ) ? 'ortho' : undefined );

            this._axisTiltQuat = quat.create();
            this._axisTiltQuatInv = quat.create();
            quat.rotationTo( this._axisTiltQuat, this._camera.getTop(), LIT.AXISY );
            quat.invert( this._axisTiltQuatInv, this._axisTiltQuat );

        },

        gotInput( input ) {

            // rotate

            if ( input.nPanDelta ) {

                let sphericalDelta = spherical.fromValues( 0, - input.nPanDelta[ 1 ], - input.nPanDelta[ 0 ] );
                vec3.scale( sphericalDelta, sphericalDelta, Math.PI * this.rotateSpeed );
                vec3.add( this._sphericalDelta, this._sphericalDelta, sphericalDelta );

            }

            // zoom

            if ( input.wheelDelta !== undefined ) {

                if ( this._cameraType === 'perspective' ) {

                    if ( input.wheelDelta < 0 ) {

                        this._scale /= this.zoomSpeed; // zoom in

                    } else if ( input.wheelDelta > 0 ) {

                        this._scale *= this.zoomSpeed; // zoom out

                    }

                }

            }

            // pan using keyboard

            if ( input.keyDir ) {

                let screenDelta = vec2.fromValues( input.keyDir[ 0 ], input.keyDir[ 1 ] );
                vec2.scale( screenDelta, screenDelta, this.panSpeed );

                if ( this._cameraType === 'perspective' ) {

                    // perspective camera pan, not scaling to distToTarget

                    let mat = this._camera.matrixWorld;
                    let vRight = vec3.fromValues( mat[ 0 ], mat[ 1 ], mat[ 2 ] );
                    let vUp = vec3.fromValues( mat[ 4 ], mat[ 5 ], mat[ 6 ] );

                    // pan right
                    let v = vec3.create();
                    vec3.scale( v, vRight, screenDelta[ 0 ] );
                    vec3.add( this._panDelta, this._panDelta, v );

                    // pan up
                    vec3.scale( v, vUp, screenDelta[ 1 ] );
                    vec3.add( this._panDelta, this._panDelta, v );

                }

            }

            this.updateCamera();

        },

        updateCamera() {

            let toTarget = vec3.create();
            let cameraPosition = this._camera.getPosition();
            vec3.sub( toTarget, cameraPosition, this.target );

            // to spherical local coord
            vec3.transformQuat( toTarget, toTarget, this._axisTiltQuat );
            let sToTarget = spherical.create();
            spherical.setFromVec3( sToTarget, toTarget );

            // rotation
            sToTarget[ 1 ] += this._sphericalDelta[ 1 ];
            sToTarget[ 2 ] += this._sphericalDelta[ 2 ];
            sToTarget[ 1 ] = Math.max(
                this.minPolar, Math.min(
                    this.maxPolar, sToTarget[ 1 ]
                ) );
            sToTarget[ 2 ] = Math.max(
                this.minAzimuth, Math.min(
                    this.maxAzimuth, sToTarget[ 2 ]
                ) );
            spherical.restrict( sToTarget, sToTarget );

            // scale
            sToTarget[ 0 ] *= this._scale;
            sToTarget[ 0 ] = Math.max(
                this.minDist, Math.min(
                    this.maxDist, sToTarget[ 0 ]
                ) );

            // back to world coord
            vec3.setFromSpherical( toTarget, sToTarget );
            vec3.transformQuat( toTarget, toTarget, this._axisTiltQuatInv );

            // pan in world coord
            vec3.add( this.target, this.target, this._panDelta );

            vec3.add( cameraPosition, this.target, toTarget );
            this._camera.translateTo( cameraPosition );
            this._camera.lookAt( this.target );

            // damping

            this._sphericalDelta[ 1 ] *= 1 - this.dampingFactor;
            this._sphericalDelta[ 2 ] *= 1 - this.dampingFactor;
            vec3.scale( this._panDelta, this._panDelta, 1 - this.dampingFactor );


            // todo zoom should has damping too
            this._scale = 1;

            // if ( this._zoomChanged  ) {
            //     // ortho camera zoom
            // }

        },

        reset() {

            // status
            this._scale = 1;
            this._sphericalDelta = spherical.create();
            this._panDelta = vec3.create();

        }

    }

};
