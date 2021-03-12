'use strict';

const Homey = require('homey');
const request = require('axios');
const colorConverter = require ('../../lib/ColorConverter.js');
const Service = require ('../../service/ESP8266Service.js');

class LedstripDevice extends Homey.Device {

    onInit() {
        // register all capability listener
        this.registerMultipleCapabilityListener([ 'light_hue', 'light_saturation' ], this._onCapabilityHueSaturation.bind(this), 500);
        this.registerMultipleCapabilityListener([ 'animation', 'animation_speed' ], this._onCapabilityAnimation.bind(this), 500);
        this.registerCapabilityListener('onoff', this._onCapabilityOnoff.bind(this));
        this.registerCapabilityListener('dim', this._onCapabilityDim.bind(this));

        // Initialize variables
        this.setCapabilityValue('animation', '0');
        this.setCapabilityValue('animation_speed', 150);
        this.savedColor = {red: 0, green: 0, blue: 255};

        // Initialize service
        var getIpAddressCallback = (function() { 
            return this.getSettings().ipAddress;
        }).bind(this);

        this.service = new Service.ESP8266Service(boundFunction);
    }

    async activateAnimation(animation) {
        try {
            if (!this._isLedStripOn()) {
                this.setCapabilityValue('onoff', '1');
                this.service.turnOn(this.savedColor, this.getCapabilityValue('animation_speed'));
            }

            this._setAnimation(animation);
            this.setCapabilityValue('animation', animation);

        } catch (error) {
            this.log('setAnimation', error);
        }
    }

    _onCapabilityDim(dim) {
        if (this._isLedStripOn()) {
            this.service.dim(dim*100);
        }  

        return Promise.resolve();
    }

    _onCapabilityAnimation(valueObj) {
        if (this._isLedStripOn()) {
            if (typeof valueObj.animation !== 'undefined') {
                this._setAnimation(valueObj.animation);
            } else if (typeof valueObj.animation_speed !== 'undefined') {
                this.service.setAnimationSpeed(valueObj.animation_speed); 
            }
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
            if (this._isAnimationActive()) {
                this._setAnimation(this.getCapabilityValue('animation'));
            } else {
                this.service.setRgb(this.savedColor);
            }
        }
        
        return Promise.resolve();
    }

    _onCapabilityOnoff(onoff) {
        if (onoff == '1') {
            if (this._isAnimationActive()) {
                this._setAnimation(this.getCapabilityValue('animation'));
            } else {
                this.service.turnOn(this.savedColor);
            }
        } else {
            this.service.turnOff();
        }

        return Promise.resolve();
    }

    _setAnimation(animation) {
        this.service.setAnimation(animation,    
                                  this.savedColor, 
                                 (this.getCapabilityValue('dim') * 100), 
                                  this.getCapabilityValue('animation_speed'));     
    }

    _updateAnimationCapability(status) {
        this.setCapabilityValue('animation', status);
    }

    _isAnimationActive() {
        return this.getCapabilityValue('animation') != '0';
    }

    _isLedStripOn() {
        return this.getCapabilityValue('onoff') == '1';
    }
}

module.exports = LedstripDevice;
