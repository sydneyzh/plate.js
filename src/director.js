var utils = require( './utils.js' );

module.exports = {

    isPlateModule: true,

    properties: {

        isDirector: true

    },

    init() {

        this.sceneHelper = undefined;
        this.vrManager = undefined;

    },

    methods: {

        config( sharedEvents ) {

            this.sceneHelper = utils.createObject( require( './sceneHelper.js' ),
                                                   sharedEvents );
            this.vrManager = utils.createObject( require( './vrManager.js' ),
                                                 sharedEvents );

        }

    }

};
