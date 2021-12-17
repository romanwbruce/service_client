
/* TEMPORARY CAPTCHA CLASS */
/* TEMPORARY CAPTCHA CLASS */
/* TEMPORARY CAPTCHA CLASS */
/* TEMPORARY CAPTCHA CLASS */
/* TEMPORARY CAPTCHA CLASS */
/* TEMPORARY CAPTCHA CLASS */

class CaptchaGenInstance {

	constructor(email, password, smsrecovery) {
		this.helper = require("./Helper");
		this.request = require("request-promise");
		this.puppeteer = require("puppeteer-extra");
		const stealth = require("puppeteer-extra-plugin-stealth");
		this.puppeteer.use(stealth());
		this.email = email;
		this.password = password;
		this.smsrecovery = smsrecovery;

		//this.session_usage = session_usage;
		this.isworking = false;
		this.oneclick = true; //turns false when/if the account encounters a challenge

		this.startme = [false];
		this.autoclick = [true];
		this.autoclickms = [10]; //delay between captcha button load -> and click IF autoclick is enabled (in ms)
		this.totalcaptchas = 0;
		this.gcaptchaval = '';
	}

	isavailable() {
		if ((this.isworking == false) && (this.oneclick == true)) {
			return true;
		}
	}

	async startacaptcha() {
		// check more than just if startme is false here, like if it should be used, etc
		if ((this.startme[0] == false) && (this.isworking == false)) {
			this.isworking = true;
			this.startme[0] = true;
			this.autoclick[0] = true;
			this.autoclickms[0] = [100];
			let _this = this;
			var captchacompletetoken = await new Promise(function (resolve, reject) {
				(function waitForFoo() {
					if (_this.gcaptchaval != '') return resolve(_this.gcaptchaval);
					setTimeout(waitForFoo, 10);
				})();
			});

			return captchacompletetoken;
		}
	}

	sendcaptcha(gcaptchaval) {
		console.log("Captcha Completed: " + gcaptchaval);
		global.captchas.set(this.totalcaptchas, gcaptchaval);
		this.totalcaptchas++;
	}

	async initialize(browser) {
		const request_client = require('request-promise-native');

		function delay(time) {
			return new Promise(function (resolve) {
				setTimeout(resolve, time)
			});
		}

		var page = await browser.newPage();
		await page.on('load', msg => {
			//console.log(msg);

		}); //javascript load events

		var buttonhtml = "<html><head><title>Waiting...</title></head><body style='color: white; background-color: black;'><h1 style='font-family: sans-serif'><center>SlapIO Captcha Harvester</center></h1><p style='width: 400px; text-align: center; margin: 0 auto;'>Waiting for captcha.<br><br>Do NOT Close this Tab!<br><br>Please make sure you are signed into a google account (check in another tab). You may also open YouTube in other tabs and have GMail open to increase one-clicks!<br><form><input style='visibility: hidden' id=mybutton onclick=msg() type=button value=Start></form><script>function msg(){var t=document.getElementById('mybutton');'Start'==t.value?t.value='Stop':t.value='Start'}</script></body></html>";

		await page.evaluate('document.write("' + buttonhtml + '")');

		var _startme = this.startme;
		var _autoclick = this.autoclick;
		var promise1 = await new Promise(function (resolve, reject) {
			console.log(_startme);
			(function waitForFoo() {
				if (_startme[0]) return resolve('one');
				setTimeout(waitForFoo, 10);
			})();
		});

		_startme[0] = false;
		console.log("Loading a captcha...");

		// await Promise.race([promise1, page.waitForFunction('document.getElementById("mybutton").value != "Start"', {
		// 	timeout: 0
		// })]).then(function (value) {
		// 	_startme[0] = false;
		// 	console.log("Loading a captcha...")
		// });

		//console.log(this.startme);

		const replacehtml = "<html><meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'><head><script type='text/javascript' src='https://www.google.com/recaptcha/api.js'></script><script src='http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js' type='text/javascript'></script> <title>Captcha Harvester</title> <style type='text/css'> body{margin: 1em 5em 0 5em; font-family: sans-serif;}fieldset{display: inline; padding: 1em;}</style></head><body style='color: white; background-color: black;'> <center> <h3>Captcha Token Harvester</h3> <h5></h5> <h5>SlapIO</h5> <form id='theform'> <fieldset> <div class='g-recaptcha' data-sitekey='6LdyC2cUAAAAACGuDKpXeDorzUDWXmdqeg-xy696' data-bind='recaptcha-submit' data-callback='sub' data-size='invisible'></div><p> <input type='submit' value='Submit' id='recaptcha-submit' style='color: #ffffff;background-color: #3c3c3c;border-color: #3c3c3c;display: inline-block;margin-bottom: 0;font-weight: normal;text-align: center;vertical-align: middle;-ms-touch-action: manipulation;touch-action: manipulation;cursor: pointer;background-image: none;border: 1px solid transparent;white-space: nowrap;padding: 8px 12px;font-size: 15px;line-height: 1.4;border-radius: 0;-webkit-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'> </p></fieldset> </div> <fieldset> <h5 style='width: 10vh;'> <a style='text-decoration: none;' href='http://127.0.0.1:5414/json' target='_blank'>Usable Tokens</a> </h5> </fieldset> </center> <script>function sub(token){window.captchatoken = token; grecaptcha.execute();}</script> </body></html>";

		await page.setRequestInterception(true);
		page.once('request', req => {
			if (req.isNavigationRequest()) {
				req.respond({
					body: replacehtml
				});
			}
			page.setRequestInterception(false);
		});

		await page.goto('http://recaptcha-demo.appspot.com/');

		await delay(50);

		await page.bringToFront();

		await page.evaluate("var evt = document.createEvent('Event');evt.initEvent('load', false, false);window.dispatchEvent(evt);");
		if (_autoclick[0]) {
			await delay(this.autoclickms[0]);
			for (const frame of page.mainFrame().childFrames()) {
				if (frame.url().includes('anchor')) {
					await page.evaluate("document.getElementById('recaptcha-submit').click()");
				}
			}

			//PROMISE 1 -> CHECK FOR CHALLENGE
			let frameobj;
			for (const frame of page.mainFrame().childFrames()) {
				if (frame.url().includes('bframe')) {
					frameobj = frame;
				}
			}
			// maybe check if frameobj was found here? idk
			let checkforchallengepromise = new Promise(async function (resolve, reject) {
				try {
					await frameobj.waitForSelector("#rc-imageselect", {timeout: 5000});
					console.log("Challenge encountered.");
					return resolve('challenge');
				} catch (error) {
					console.log("Challenge promise-check timedout.");
				}

			});

			//PROIMSE 2 -> CHECK FOR TOKEN
			let captchacompletedpromise = new Promise(async function (resolve, reject) {
				await page.waitForFunction(() => 'captchatoken' in window, {timeout: 0});
				const ctoken = await page.evaluate(() => {
					return window.captchatoken;
				});
				return resolve(ctoken);
			});

			let _this = this;
			await Promise.race([checkforchallengepromise, captchacompletedpromise]).then(function (value) {
				// either returns 'challenge' OR the token...
				if (value == 'challenge') {
					console.log("Challenge encountered -> Sending to activity generator.");
					_this.gcaptchaval = 'challenge';
					_this.oneclick = false;
				} else {
					console.log("Captcha completed!");
					_this.gcaptchaval = value;
					console.log('token: ' + value);
				}
			});

		}
		//await page.close();
		this.isworking = false;

		//await page.waitForNavigation();
	}
}

CaptchaGenInstance.LOGIN_TYPE_DELAY = 10;

module.exports = CaptchaGenInstance;