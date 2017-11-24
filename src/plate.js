let PLATE = {

    utils: require( './utils.js' ),
    events: require( './events.js' ),
    clock: require( './clock.js' ),
    keyboardInput: require( './keyboardInput.js' ),
    pointerInput: require( './pointerInput.js' ),
    orbitControl: require( './orbitControl.js' ),
    firstPersonControl: require( './firstPersonControl.js' )

};

PLATE.create = function() {

    let plateInts = {

        sharedEvents: PLATE.utils.createObject( PLATE.events )

    };

    // preloader, director, audioPlayer

    plateInts.createPreloader = ( ...modules ) => {

        return PLATE.utils.createObject( require( './preloader.js' ),
                                         plateInts.sharedEvents,
                                         ...modules );

    };
    plateInts.createDirector = ( ...modules ) => {

        let director = PLATE.utils.createObject( require( './director.js' ),
                                                 plateInts.sharedEvents,
                                                 ...modules );
        director.config( plateInts.sharedEvents );
        return director;

    };
    plateInts.createAudioPlayer = ( ...modules ) => {

        return PLATE.utils.createObject( require( './audioPlayer.js' ),
                                         plateInts.sharedEvents,
                                         ...modules );

    };


    // connector

    let connectorModules = require( './connector.js' );
    let connectorProto = Object.assign( {},
                                        connectorModules.methods,
                                        plateInts.sharedEvents );
    plateInts.createConnector = ( ...modules ) => {

        return PLATE.utils.createObjectWithProto( connectorProto,
                                                  connectorModules.init,
                                                  connectorModules.properties,
                                                  ...modules );

    };

    return plateInts;

};

module.exports = PLATE;
