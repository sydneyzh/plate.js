module.exports = {

    isPlateModule: true,

    properties: {

        isFirstPersonControl: true

    },

    init() {

        this.reset();

        // configurable
        this.rotateSpeed = 0.3;
        this.moveSpeed = vec3.fromValues( 1, 1, 1 ); // local coord
        this.minPolar = 0;
        this.maxPolar = Math.PI;
        this.minAzimuth = - LIT.INF;
        this.maxAzimuth = LIT.INF;
        this.dampingFactor = 0.1;

    },

    methods: {

        setCamera( camera ) {

            if ( ! camera.isCamera || camera.type !== LIT.cameraTypes.PERSPECTIVE ) throw Error( 'orbitControl: invalid camera.' );

            this._camera = camera;

        },

        gotInput( input ) {

            // rotate

            if ( input.nPanDelta ) {

                let sphericalDelta = spherical.fromValues( 0, input.nPanDelta[ 1 ], - input.nPanDelta[ 0 ] );
                vec3.scale( sphericalDelta, sphericalDelta, Math.PI * this.rotateSpeed );
                vec3.add( this._sphericalDelta, this._sphericalDelta, sphericalDelta );

            }

            // zoom from double tap..

            // move using keyboard

            let screenDelta = vec3.create();

            if ( input.keyDir ) {

                // [ x, z ]
                screenDelta[ 0 ] = input.keyDir[ 0 ];
                screenDelta[ 2 ] = input.keyDir[ 1 ];

            }

            if ( input.keyRFDir !== undefined ) {

                // y: -1 or 1
                screenDelta[ 1 ] = input.keyRFDir;

            }

            vec3.multiply( screenDelta, screenDelta, this.moveSpeed );

            let mat = this._camera.matrixWorld;
            let vRight = vec3.fromValues( mat[ 0 ], mat[ 1 ], mat[ 2 ] );
            let vUp = vec3.fromValues( mat[ 4 ], mat[ 5 ], mat[ 6 ] );

            // world coord
            let v = vec3.create();

            // move right
            vec3.scale( v, vRight, screenDelta[ 0 ] );
            vec3.add( this._moveDelta, this._moveDelta, v );

            // move up
            vec3.scale( v, vUp, screenDelta[ 1 ] );
            vec3.add( this._moveDelta, this._moveDelta, v );

            // forward/backward
            vec3.scale( v, this._camera.getFront(), screenDelta[ 2 ] );
            vec3.add( this._moveDelta, this._moveDelta, v );

            this.updateCamera();


        },

        updateCamera() {

            // move in world coord
            let cameraPosition = this._camera.getPosition();
            vec3.add( cameraPosition, cameraPosition, this._moveDelta );
            this._camera.translateTo( cameraPosition );
            LIT.updateManager.update(); // !important

            // rotate in world coord
            let prevFront = this._camera.getFront();
            let front = vec3.clone( prevFront );
            let sFront = spherical.create();
            spherical.setFromVec3( sFront, front );

            sFront[ 1 ] += this._sphericalDelta[ 1 ];
            sFront[ 2 ] += this._sphericalDelta[ 2 ];

            sFront[ 1 ] = Math.max(
                this.minPolar, Math.min(
                    this.maxPolar, sFront[ 1 ]
                ) );
            sFront[ 2 ] = Math.max(
                this.minAzimuth, Math.min(
                    this.maxAzimuth, sFront[ 2 ]
                ) );
            spherical.restrict( sFront, sFront );

            vec3.setFromSpherical( front, sFront );

            this._camera.lookAtFront( front );

            // zoom...

            this._sphericalDelta[ 1 ] *= 1 - this.dampingFactor;
            this._sphericalDelta[ 2 ] *= 1 - this.dampingFactor;
            vec3.scale( this._moveDelta, this._moveDelta, 1 - this.dampingFactor );

            this._scale = 1;

        },

        reset() {

            // yaw, pitch / rotate
            this._sphericalDelta = spherical.create(); // local coord
            // pan / move
            this._moveDelta = vec3.create(); // local coord: left/right, up/down, forward/backward
            this._scale = 1;

        }

    }

};
