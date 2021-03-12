'use strict';

const Homey = require('homey');

class Lighting extends Homey.App {
	
	async onInit() {
		try {
			await this._initFlows();
			this.log('Running...');
		} catch (err) {
			this.log('onInit error', err);
		}
	}

	async _initFlows() {
		new Homey.FlowCardAction('activate_animation')
				.register()
				.registerRunListener((args, state) => args.device.activateAnimation(args.animation));
	}
	
}

module.exports = Lighting;