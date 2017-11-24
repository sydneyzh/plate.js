module.exports = {

    isPlateModule: true,

    properties: {

        isRenderHelper: true

    },

    init() {

        this._renderContext = undefined;

        this._loopId = undefined;
        this._isLooping = false;

        this._cullFace = false;
        this._scissorTest = false;

        this._stats = undefined;
        this._showStats = false;

        let Stats = global.Stats;
        if ( Stats !== undefined ) {

            this._showStats = true;

            this._stats = new Stats();
            document.body.appendChild( this._stats.dom );

        }

    },

    methods: {

        config( ctx ) {

            if ( ! ctx ) throw Error( 'renderHelper: missing parameter "renderContext".' );
            this._renderContext = ctx;

        },

        draw( camera, drawItems ) {

            for ( let item of drawItems ) {

                let cullFace = item.cullFace;
                let shader = item.shader;
                let textures = item.textures; // array [ { litTexture, unit } ]
                let mesh = item.mesh;
                let mode = item.mode;

                if ( cullFace !== this._cullFace ) {

                    if ( cullFace === undefined ) {

                        if ( this._cullFace !== false ) {

                            LIT.gl.disable( LIT.gl.CULL_FACE );

                        }

                    } else {

                        if ( cullFace === false ) {

                            LIT.gl.disable( LIT.gl.CULL_FACE );

                        } else if ( cullFace === 'front' ) {

                            LIT.gl.enable( LIT.gl.CULL_FACE );
                            LIT.gl.cullFace( LIT.gl.FRONT );

                        } else if ( cullFace === 'back' ) {

                            LIT.gl.enable( LIT.gl.CULL_FACE );
                            LIT.gl.cullFace( LIT.gl.BACK );

                        }

                    }

                    this._cullFace = cullFace;

                }

                shader.use();

                if ( Array.isArray( textures ) ) {

                    for ( let t of textures ) {

                        if ( ! t.texture.isTexture ) throw Error( 'plate renderHelper: invalid texture.' );
                        t.texture.bind( t.unit );

                    }

                }

                shader.draw( camera, mesh, mode );

            }

        },

        render: function() {

            this._loopId = window.requestAnimationFrame( this.render.bind( this ) );

            if ( this._showStats ) this._stats.begin();

            // ------------------------------------

            if ( this._renderContext.beforeDraw && this._renderContext.beforeDraw.length > 0 ) {

                for ( let cb of this._renderContext.beforeDraw ) {

                    cb();

                }

            }

            // ------------------------------------

            // update matrices

            LIT.updateManager.update();

            // ------------------------------------

            LIT.clear();

            let scissorTest = this._renderContext.scissorTest;

            if ( scissorTest !== this._scissorTest ) {

                this._scissorTest = scissorTest;

                if ( scissorTest === true )
                    LIT.gl.enable( LIT.gl.SCISSOR_TEST );
                else
                    LIT.gl.disable( LIT.gl.SCISSOR_TEST );

            }

            let drawItems = this._renderContext.drawItems;

            if ( ! this._renderContext.frames ) {

                if ( ! this._renderContext.camera ) throw Error( 'RenderHelper: missing camera and frames.' );

                this.draw( this._renderContext.camera, drawItems );

            } else {

                for ( let frame of this._renderContext.frames ) {


                    if ( frame.beforeDraw ) frame.beforeDraw();

                    draw( frame.camera, drawItems );

                    if ( frame.afterDraw ) frame.afterDraw();

                }

            }

            if ( this._scissorTest === true ) {

                LIT.gl.disable( LIT.gl.SCISSOR_TEST );
                this._scissorTest = false;

            }

            // ------------------------------------

            if ( this._renderContext.afterDraw && this._renderContext.afterDraw.length > 0 ) {

                for ( let cb of this._renderContext.afterDraw ) {

                    cb();

                }

            }

            // ------------------------------------

            if ( this._showStats ) this._stats.end();

        },

        start() {

            if ( this._isLooping ) this.stop();
            this._isLooping = true;
            this.render();

        },

        stop() {

            if ( this._loopId && this._isLooping )
                window.cancelAnimationFrame( this._loopId );
            this._isLooping = false;

        }

    }

};
