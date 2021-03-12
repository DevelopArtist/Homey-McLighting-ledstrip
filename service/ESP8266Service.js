'use strict';

const request = require('axios');

class ESP8266Service {
    constructor(getIpAddressCallback) {
      this.getIpAddress = getIpAddressCallback;
    }

    setRgb(rgb) {
      let url = 'http://' + this.getIpAddress() + '/all?r=' + 
          rgb.red   + '&g=' + 
          rgb.green + '&b=' + 
          rgb.blue  + '&d=0';  

      this._sendRequest(url);
    }

    dim(value) {
      let url = 'http://' + this.getIpAddress() + '/set_brightness?c=' + value;
      this._sendRequest(url);
    }

    setAnimation(animation, rgb, dim, speed) {
      let url = 'http://' + this.getIpAddress() + '/set_mode?m=' + 
        animation   + '&r=' + 
        rgb.red     + '&g=' + 
        rgb.green   + '&b=' + 
        rgb.blue    + '&c=' +
        dim         + '&s=' + 
        speed;      

      this._sendRequest(url);
    }

    setAnimationSpeed(value) {
      var url = 'http://' + this.getIpAddress() + '/set_speed?d=' + value; 
      this._sendRequest(url);
    }

    turnOff() {
      this._sendRequest('http://' + this.getIpAddress() + '/off');
    }

    turnOn(rgb) {
      this.setRgb(rgb);
    }

    _sendRequest(url) {
      request.get(url).catch(error => {});      
    }
}

module.exports = { ESP8266Service }