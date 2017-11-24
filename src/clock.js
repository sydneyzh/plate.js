module.exports = {

    isPlateModule: true,

    properties: {

        isClock: true

    },

    init() {

        this._isStart = false;
        this._elapsedTime = 0;
        this._prevTime = 0;
        this._useAudioContext = false;

    },

    methods: {

        isStart() {

            return this._isStart;

        },

        start() {

            this.reset();
            this._prevTime = this._useAudioContext ? this.getAudioContextTime() : this.getSystemTime();
            this._isStart = true;

        },

        reset() {

            this._elapsedTime = 0;
            this._prevTime = 0;
            this._isStart = false;

        },

        initAudioContext( audioContext ) {

            if ( ! audioContext ) throw Error( 'clock: missing parameter "audioContext" ' );

            if ( this._isStart ) this.reset();

            this.audioContext = audioContext;
            this._useAudioContext = true;

        },

        getAudioContextTime() {

            if ( ! this.audioContext )
                throw Error( 'clock: cannot find audio context.' );

            return this.audioContext.currentTime;

        },

        getSystemTime() {

            return ( global.performance || Date ).now() / 1000;

        },

        getElapsedTime() {

            return this._elapsedTime;

        },

        update() {

            if ( this._isStart ) {

                var delta = this._useAudioContext ? this.getAudioContextTime() - this._prevTime : this.getSystemTime() - this._prevTime;
                this._elapsedTime += delta;
                this._prevTime += delta;

                return delta;

            }

            return 0;

        }

    }

};
