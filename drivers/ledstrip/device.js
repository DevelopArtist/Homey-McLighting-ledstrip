'use strict';

const Homey = require('homey');
const request = require('axios');
const colorConverter = require ('../../lib/ColorConverter.js');


class LedstripDevice extends Homey.Device {

    onInit() {
        // register all capability listener
        this.registerMultipleCapabilityListener([ 'light_hue', 'light_saturation' ], this._onCapabilityHueSaturation.bind(this), 500);
        this.registerMultipleCapabilityListener([ 'theme', 'theme_speed' ], this._onCapabilityTheme.bind(this), 500);
        this.registerCapabilityListener('onoff', this._onCapabilityOnoff.bind(this));
        this.registerCapabilityListener('dim', this._onCapabilityDim.bind(this));

        // Initialize variables
        this.setCapabilityValue('theme', "0");
        this.setCapabilityValue('theme_speed', 150);
        this.savedColor = {red: 0, green: 0, blue: 255};
    }

    _onCapabilityDim(dim) {
        if (this._isLedStripOn()) {
            let url = 'http://' + this.getSettings().ipAddress + '/set_brightness?c=' + (dim * 100);
            this._sendRequest(url); 
        }  

        return Promise.resolve();
    }

    _onCapabilityTheme(valueObj) {
        if (this._isLedStripOn()) {
            if (typeof valueObj.theme !== 'undefined') {
                var url = this._createModeUrl(valueObj.theme);
            } else if (typeof valueObj.theme_speed !== 'undefined') {
                var url = 'http://' + this.getSettings().ipAddress + '/set_speed?d=' + valueObj.theme_speed; 
            }

            this._sendRequest(url);
        }

        return Promise.resolve();
    }

    _onCapabilityHueSaturation(valueObj) {
        let dimValue = this.getCapabilityValue('dim');
        
        if (typeof valueObj.light_hue !== 'undefined') {
            var hueValue = valueObj.light_hue;
        } else {
            var hueValue = this.getCapabilityValue('light_hue');
        }

        if (typeof valueObj.light_saturation !== 'undefined') {
            var saturationValue = valueObj.light_saturation;
        } else {
            var saturationValue = this.getCapabilityValue('light_saturation'); 
        }

        let rgb = colorConverter.convertHSVToRGB({
			hue: hueValue,
			saturation: saturationValue,
			value: dimValue
        });

        this.savedColor.red   = Math.ceil(rgb.red); 
        this.savedColor.green = Math.ceil(rgb.green); 
        this.savedColor.blue  = Math.ceil(rgb.blue); 

        if (this._isLedStripOn()) {
            if (this._isThemeActive()) {
                var url = this._createModeUrl(this.getCapabilityValue('theme'));
            } else {
                var url = this._createRgbUrl(this.savedColor);
            }

            this._sendRequest(url);
        }
        
        return Promise.resolve();
    }

    _onCapabilityOnoff(onoff) {
        if (onoff == '1') {
            if (this._isThemeActive()) {
                let url = this._createModeUrl(this.getCapabilityValue('theme'));
                this._sendRequest(url);
            } else {
                this._turnOn();
            }
        } else {
            this._turnOff();
        }

        return Promise.resolve();
    }

    _turnOff() {
        this._sendRequest('http://' + this.getSettings().ipAddress + '/off');
    }

    _turnOn() {
        let url = this._createRgbUrl(this.savedColor);
        this._sendRequest(url);
    }

    _sendRequest(url) {
        request.get(url).catch(error => {
            // TODO: add alert/error handling.
        });      
    }

    _isThemeActive() {
        return this.getCapabilityValue('theme') != '0';
    }

    _isLedStripOn() {
        return this.getCapabilityValue('onoff') == '1';
    }

    _createModeUrl(newMode) {
        let url = 'http://' + this.getSettings().ipAddress + '/set_mode?m=' + 
            newMode                                + '&r=' + 
            this.savedColor.red                    + '&g=' + 
            this.savedColor.green                  + '&b=' + 
            this.savedColor.blue                   + '&c=' +
            (this.getCapabilityValue('dim') * 100) + '&s=' + 
            this.getCapabilityValue('theme_speed');        

        return url;
    }

    _createRgbUrl(rgb) {
        let url = 'http://' + this.getSettings().ipAddress + '/all?r=' + 
            rgb.red   + '&g=' + 
            rgb.green + '&b=' + 
            rgb.blue  + '&d=' + 
            this.getCapabilityValue('theme_speed');  

        return url;                                           
    }
}

module.exports = LedstripDevice;
