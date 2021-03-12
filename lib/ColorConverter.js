'use strict';

const space = require('color-space');

module.exports = {
    convertHSVToRGB({ hue, saturation, value }) {
        if (typeof hue !== 'number') hue = 1;
        if (typeof saturation !== 'number') saturation = 1;
        if (typeof value !== 'number') value = 1;

        const [red, green, blue] = space.hsv.rgb([
            hue * 360,
            saturation * 100,
            value * 100
        ]);

        return { red, green, blue };
    }
}