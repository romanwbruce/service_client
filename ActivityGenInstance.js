class ActivityGenInstance {

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//      **         ******    **********   **   **      **   **   **********   **    **       ********    ********   ****     **    //
	//     ****       **////**  /////**///   /**  /**     /**  /**  /////**///   //**  **       **//////**  /**/////   /**/**   /**    //
	//    **//**     **    //       /**      /**  /**     /**  /**      /**       //****       **      //   /**        /**//**  /**    //
	//   **  //**   /**             /**      /**  //**    **   /**      /**        //**       /**           /*******   /** //** /**    //
	//  **********  /**             /**      /**   //**  **    /**      /**         /**       /**    *****  /**////    /**  //**/**    //
	// /**//////**  //**    **      /**      /**    //****     /**      /**         /**       //**  ////**  /**        /**   //**** ** //
	// /**     /**   //******       /**      /**     //**      /**      /**         /**        //********   /********  /**    //***/** //
	// //      //     //////        //       //       //       //       //          //          ////////    ////////   //      /// //  //
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	constructor(account, proxy, id, knex) {
		this.account = account;
		this.proxy = proxy;
		require("colors");
		const SentenceGenerator = require("sentence-generator");
		this.sentenceGenerator = new SentenceGenerator("text-base.txt");
		this.helper = require("./Helper");
		this.request = require("request-promise");
		this.puppeteer = require("puppeteer-extra");
		const stealth = require("puppeteer-extra-plugin-stealth");
		this.puppeteer.use(stealth());
		this.email = account.getEmail();
		this.password = account.getPassword();
		this.phoneNumber = account.getRecoverySMS();
		this.id = id;
		this.doWork = false;
		this.isPassive = false;
		this.knex = knex;
		this.hourlyChance = ActivityGenInstance.ACTIVITY_ACTIVE_CHANCE;

		this.initialize().then(() => {
			this.startSession().then(() => {
				console.log(("[Activity Gen #" + this.id + "]").red + " Started Successfully".gray);
			});
		});
	}

	getAccount() {
		return this.account;
	}

	async auth(page) {
		if(this.proxy.isAuth()) {
			await page.authenticate({
				"username": this.proxy.getUsername(),
				"password": this.proxy.getPassword()
			});
		}
	}

	async initialize() {
		const headless = true;
		if(this.proxy) {
			const proxyServer = "--proxy-server=" + this.proxy.getAddress() + ":" + this.proxy.getPort();
			this.browser = await this.puppeteer.launch({
				headless: headless,
				args: ["--no-sandbox", proxyServer]
			});
		} else {
			this.browser = await this.puppeteer.launch({
				headless: headless,
				args: ["--no-sandbox"]
			});
		}
	}

	getReady() {
		return this.isPassive;
	}

	async startSession() {
		await this.login();

		this.isPassive = await this.isReady();
		this.doWork = true;

		let firstRun = false;
		let _this = this;
		let work = async function() {
			const h = new Date().getHours();
			if (Math.random() > _this.hourlyChance && !firstRun) return;
			if (h < 8 || h > 22) {
				console.log(("[Activity Gen #" + _this.id + "]").red + " Taking a break from activity".gray);
			}
			firstRun = false;

			let options = _this.helper.shuffleArray(["youtube", "translate", "gmail"]);
			for (let i = 0; i < options.length; i++) {
				let option = options[i];
				if (option === "youtube") await _this.doYoutube();
				if (option === "translate") await _this.doTranslate();
				if (option === "gmail") await _this.doGmail();
				_this.isPassive = await _this.isReady();
				if (_this.isPassive) _this.hourlyChance = ActivityGenInstance.ACTIVITY_PASSIVE_CHANCE;
				else _this.hourlyChance = ActivityGenInstance.ACTIVITY_ACTIVE_CHANCE;
			}
		};
		work().then(() => {
			this.hourInterval = setInterval(work, (1000 * 60 * 60));
		});
	}

	async stopSession() {
	    if(this.hourInterval) clearInterval(this.hourInterval);
		//Setting this.doWork = false will safely shutdown YouTube since it is in a for loop
		this.doWork = false;

		//Directly closed GMail
		await this.closeGmail();
	}

	async doQuery(query) {
		return new Promise(async (resolve) => {
			if (!this.queryPage) {
				this.queryPage = await this.browser.newPage();
				await this.auth(this.queryPage);
			}
			await this.queryPage.goto("https://www.google.com/search?client=opera&q=google&sourceid=opera&ie=UTF-8&oe=UTF-8");

			//TODO: Make static waits random
			await this.queryPage.waitFor(2000);

			if(this.queryPage.url().includes("google.com/sorry")) {
				console.log(("[Activity Gen #" + this.id + "]").red + " " + "Has been blocked by Google!".gray.underline);
				await this.account.removeFromShuffle();
				console.log("Account #" + this.account.number + " removed from shuffle");
				delete this;
				resolve();
			}

			await this.queryPage.waitForSelector("#tsf > div:nth-child(2) > div.A8SBwf > div.RNNXgb > div > div.a4bIc > input");

			let inputQuery = await this.queryPage.$("#tsf > div:nth-child(2) > div.A8SBwf > div.RNNXgb > div > div.a4bIc > input");
			await inputQuery.click({
				clickCount: 3
			});

			await this.queryPage.waitFor(750);

			await inputQuery.type(query, {
				delay: ActivityGenInstance.QUERY_TYPE_DELAY
			});

			await this.queryPage.waitFor(1000);

			await this.queryPage.click("#tsf > div:nth-child(2) > div.A8SBwf > div.RNNXgb > button");

			//TODO: Make non-static wait
			//Page#waitForNavigation does not work here with using Google search so we just wait a static time and hope the next page is already loaded
			await this.queryPage.waitFor(2500);

			resolve();
		})
	}

	async doTranslate() {
		return new Promise(async (resolve) => {

			console.log(("[Translate #" + this.id + "]").green + " Starting Translate Session".gray);

			await this.doQuery("google translate").then(async () => {

				if(this.queryPage.url().includes("google.com/sorry")) {
					console.log(("[Activity Gen #" + this.id + "]").red + " " + "Has been blocked by Google!".gray.underline);
					await this.account.removeFromShuffle();
					console.log("Account #" + this.account.number + " removed from shuffle");
					delete this;
					resolve();
				}

				//Figure out by chance how many translations we will do
				const maxTranslateIndex = this.helper.getRandomInt(ActivityGenInstance.TRANSLATE_MIN_PHRASES,
					ActivityGenInstance.TRANSLATE_MAX_PHRASES);

				console.log(("[Translate #" + this.id + "]").green + (" Translating " + maxTranslateIndex + " Phrases in The Session").gray);

				//Switch language
				await this.switchLanguage();

				//Iterate through each translation
				for (let translateIndex = 0; translateIndex < maxTranslateIndex; translateIndex++) {

					//Generate random phrase to translate
					const phrase = this.sentenceGenerator.take(1);
					this.sentenceGenerator.run();

					await this.queryPage.waitFor(1000);

					//Type in phrase to translate
					const input = await this.queryPage.$("#tw-source-text-ta");

					//This clicks 3 times on the element making it so that it selects ALL the characters
					await input.click({
						clickCount: 3
					});

					await this.queryPage.waitFor(750);

					//Override all those characters selected (this is used to remove previous search) with the new phrase
					await input.type(phrase, {
						delay: ActivityGenInstance.TRANSLATE_TYPE_DELAY
					});

					await this.queryPage.waitFor(1000);

					//TODO: Make sure the boolean operation is mathematically correct
					//Use random chance to decide whether or not to switch language to a random one
					if (Math.random() < ActivityGenInstance.TRANSLATE_CHANCE_SWITCH_LANGUAGE) {
						await this.switchLanguage();
						console.log(("[Translate #" + this.id + "]").green + " Switched language".gray);
					}

					await this.queryPage.waitFor(ActivityGenInstance.TRANSLATE_BUFFER_TIME);

					console.log(("[Translate #" + this.id + "]").green + (" Translated Phrase: " + (translateIndex + 1) + "/" + maxTranslateIndex).gray);
				}

				resolve();
			});
		})
	}

	async switchLanguage() {
		return new Promise(async (resolve) => {
			//Click on language button
			await this.queryPage.click("#tw-container > g-expandable-container > div > div > div.pcCUmf.vCOSGb > div:nth-child(3)");

			await this.queryPage.waitFor(1000);

			//Type the first letter of a random language
			await this.queryPage.keyboard.type(this.helper.getRandomLanguageLetter());

			await this.queryPage.waitFor(750);

			//Select that language
			await this.queryPage.keyboard.press(String.fromCharCode(13));

			resolve();
		})
	}

	async doGmail() {
		console.log(("[Gmail #" + this.id + "]").cyan + " Opened GMail".gray);
		this.gmailPage = await this.browser.newPage();
		await this.auth(this.gmailPage);
		await this.gmailPage.goto("https://gmail.com");
		await this.gmailPage.waitFor(10000);
	}

	async login() {
		return await this.helper.login(this.browser, this.account, ActivityGenInstance.LOGIN_TYPE_DELAY, this.proxy);
	}

	//TODO: Add Google Keep, Google Translate, and Google Search / Wiki Crawling Options

	//TODO: Add these further options integrated to scheduling

	async closeGmail() {
		if (this.gmailPage) {
			await this.gmailPage.close();
			console.log(("[GMail #" + this.id + "]").cyan + " GMail successfully shutdown".gray);
		}
	}

	//TODO: Maybe include something to passively run activity, certain setting for HARDCORE get back to one-clicks, and something just to MAINTAIN one-clicks

	//TODO: Make Scheduler and ScheduleOptions class, ScheduleOptions includes information like timezone, startHour, and endHour


	//TODO: Make YoutubeSession class to randomly gen a MIN and MAX videos and have it pre-gen video stop times so we can accurately get expected time to watch current session, useful for scheduling
	async doYoutube() {
		return new Promise(async (resolve) => {
			console.log(("[YouTube #" + this.id + "]").red + " Starting YouTube session".gray);

			this.youtubePage = await this.browser.newPage();
			await this.auth(this.youtubePage);
			//Go to YouTube Trending Page
			await this.youtubePage.goto("https://www.youtube.com/feed/trending?disable_polymer=1");

			//Get all videos on the page
			let elements = await this.youtubePage.$x("//a[@class=' yt-uix-sessionlink      spf-link ' and contains(@href, 'watch?v=')]");
			await this.youtubePage.evaluate((element) => {
				location.href = element.getAttribute("href") + "&disable_polymer=1"; //Get link and add 'disable_polymer=1' to URL
			}, elements[Math.floor(Math.random() * elements.length)]); //Pick random video

			await this.youtubePage.waitForNavigation();

			//TODO: Make this a parameter so you can get a expected amount of watch time
			//Get random number of videos to watch in a row
			let videosToWatch = this.helper.getRandomInt(ActivityGenInstance.YOUTUBE_MIN_WATCH,
				ActivityGenInstance.YOUTUBE_MAX_WATCH);

			console.log(("[YouTube #" + this.id + "]").red + (" Watching " + videosToWatch + " videos in session").gray);

			//Loop for every video to watch, the stuff in this for loop is sync so it will wait for the one video to finish before going to the next video
			for (let videoNumber = 0; videoNumber < videosToWatch; videoNumber++) {

				if (!this.doWork) {
					console.log(("[YouTube #" + this.id + "]").red + " YouTube successfully shutdown".gray);
					this.youtubePage.close();
					this.browser.close();
				}

				if(this.youtubePage.url().includes("google.com/sorry")) {
					console.log(("[Activity Gen #" + this.id + "]").red + " " + "Has been blocked by Google!".gray.underline);
					await this.account.removeFromShuffle();
					console.log("Account #" + this.account.number + " removed from shuffle");
					delete this;
					resolve();
				}

				console.log(("[Video " + (videoNumber + 1) + "/" + videosToWatch + "]").magenta + " Video started!".gray);

				//Check to see if HTML5 error
				let elements = await this.youtubePage.$x("//span[contains(text(), 'Your browser does not currently recognize any of the video formats available.')]");
				if (elements && elements.length && elements.length > 0) {
					videoNumber--;
					await this.youtubePage.waitFor(500);

					let nextVideo = await this.youtubePage.$("#watch7-sidebar-modules > div:nth-child(1) > div > div.watch-sidebar-body > ul > li > div.thumb-wrapper > a");

					await this.youtubePage.evaluate((element) => {
						location.href = element.getAttribute("href") + "&disable_polymer=1"; //Get link and add 'disable_polymer=1' to URL
					}, nextVideo);

					console.log("--> ".gray + ("[Video " + (videoNumber + 1) + "/" + videosToWatch + "]").magenta + " Skipping video, HTML5 not supported".gray);

					await this.youtubePage.waitForNavigation();

					continue;
				}

				//Wait 60 seconds to MAYBE an ad to play, does not matter either way, just wait incase there is an ad
				await new Promise((resolve) => {
					setTimeout(() => {
						resolve();
					}, 60000);
				});

				//Wait for duration element to appear
				await this.youtubePage.waitForXPath("//span[@class='ytp-time-duration']", {
					visible: true,
					timeout: 10000
				});

				//Probably can be removed since the 60s delay is there now
				await this.youtubePage.waitFor(100);

				//Get video length and parse this information to milliseconds
				let videoLengthElement = await this.youtubePage.$x("//span[@class='ytp-time-duration']");
				let videoLength = await this.youtubePage.evaluate((videoLengthElement) => {
					return videoLengthElement.innerHTML;
				}, videoLengthElement[0]);

				//Boolean to decide if we should watch the full video
				let doWatchFull = Math.random() < ActivityGenInstance.YOUTUBE_CHANCE_TO_WATCH_FULL;

				//Parse time like: 15:40 => to milliseconds, then * by 1000 to go to milliseconds, and subtract 60 seconds since we already started the video 60 seconds ago caused by the wait in the beggining
				let finishTime = (((parseInt(videoLength.split(":")[0]) * 60) +
					(parseInt(videoLength.split(":")[1]))) *
					1000) - 60000;

				//Subtract 1s so that we still have time to pause video before the next video recommendations fill the video player
				finishTime = finishTime - 1000;

				//If somehow this time is negative then clamp back to 0
				if (finishTime <= 0) finishTime = 0;

				//If we don't want to watch full then pick a random time to stop watching at
				if (!doWatchFull) {
					finishTime = finishTime * Math.random();
					console.log("--> ".gray + ("[Video " + (videoNumber + 1) + "/" + videosToWatch + "]").magenta + (" Time left: " + finishTime + "ms").gray);
				} else {
					console.log("--> ".gray + ("[Video " + (videoNumber + 1) + "/" + videosToWatch + "]").magenta + (" Full Time Left: " + finishTime + "ms").gray);
				}

				//Wait until our calculated "finish time" to happen
				await new Promise((resolve) => {
					setTimeout(() => {
						resolve();
					}, finishTime);
				});

				//Pause video by clicking on the video player
				let videoElement = await this.youtubePage.$x("//video");
				await this.youtubePage.evaluate((videoElement) => {
					videoElement.click();
				}, videoElement[0]);


				//TODO: Make intermediate commenting and liking, for example ActivityGenInstance.YOUTUBE_CHANCE_TO_INTERACT_HALFWAY = 0.4;
				//Decide based on random chance to comment on the video
				if (Math.random() < ActivityGenInstance.YOUTUBE_CHANGE_TO_COMMENT) {
					//Grab comment using the video ID
					let comment = await this.grabComment(this.youtubePage.url().split("?v=")[1]);
					console.log("--> ".gray + ("[Video " + (videoNumber + 1) + "/" + videosToWatch + "]").magenta + (" Commenting ( " + comment + " )").gray);

					//Wait a lil bit just for LULZIES
					await this.youtubePage.waitFor(500);

					//Scroll down or the comment box won't be in the DOM since it loads dynamically
					await this.youtubePage.evaluate(() => {
						window.scrollTo(0, 750);
					});

					//Wait for YouTube comment box to load, this isn't the proper way to do this, but my half assed way since it's 2 AM
					await this.youtubePage.waitFor(5000);

					//Click on the comment box
					await this.youtubePage.click("#comment-section-renderer > div.comments-header-renderer.vve-check-visible.vve-check-hidden > div.comment-simplebox-renderer.yt-uix-servicelink > div > div.comment-simplebox-renderer-collapsed-content");

					//Wait for the fucking retarded click animatino to stop on the box with CSS so we KNOW we can type, and for EVEN MORE LULZIES
					await this.youtubePage.waitFor(100);

					//Using #Page.keyboard.type vs #Page.type we can NOT have to specify a element and instead just tell it to type naturally and press the keys regardless of the element it's in sinec it's already clicked inside of a text box from last step.
					await this.youtubePage.keyboard.type(comment, {
						delay: ActivityGenInstance.YOUTUBE_COMMENT_TYPE_DELAY
					});

					//More LULZIES
					await this.youtubePage.waitFor(100);

					//Post Comment
					await this.youtubePage.click("#comment-simplebox > div.comment-simplebox-controls > div.comment-simplebox-buttons > button.yt-uix-button.yt-uix-button-size-default.yt-uix-button-primary.yt-uix-button-empty.comment-simplebox-submit.yt-uix-sessionlink");

					//TODO: Make Non-Static Wait
					//Here you have to wait a while so that you are SURE the comment is posted since there is a loading bar and you can't redirect too soon to the next video
					await this.youtubePage.waitFor(10000);
				}

				//Decide based on chance to like the video
				if (Math.random() < ActivityGenInstance.YOUTUBE_CHANCE_TO_LIKE) {
					console.log("--> ".gray + ("[Video " + (videoNumber + 1) + "/" + videosToWatch + "]").magenta + " Liking video".gray);

					await this.youtubePage.waitFor(500);

					//Wait some time then like video
					await this.youtubePage.click("#watch8-sentiment-actions > span > span:nth-child(1) > button");

					await this.youtubePage.waitFor(2000);
				}

				//Everything is done, get next video DOM element in recommended
				let nextVideo = await this.youtubePage.$("#watch7-sidebar-modules > div:nth-child(1) > div > div.watch-sidebar-body > ul > li > div.thumb-wrapper > a");

				//Use CDP to get href value and redirect since Puppeteer is AIDS with this
				await this.youtubePage.evaluate((element) => {
					location.href = element.getAttribute("href") + "&disable_polymer=1"; //Get link and add 'disable_polymer=1' to URL
				}, nextVideo);

				console.log("--> ".gray + ("[Video " + (videoNumber + 1) + "/" + videosToWatch + "]").magenta + " Video ended".gray);

				//This is important as the "location.href" done in the evaluate does not await so here we wait for that to be done redirecting, really cool Puppeteer function
				await this.youtubePage.waitForNavigation();
			}
			this.isPassive = await this.isReady();
			resolve();
		})
	}

	//Returns true or false if we can stop doing activity
	async isReady() {
		function delay(time) {
			return new Promise(function (resolve) {
				setTimeout(resolve, time)
			});
		}

		let page = await this.browser.newPage();
		await this.auth(page);
		await page.on('load', () => {
		});

		const buttonHtml = "<html><head><title>Waiting...</title></head><body style='color: white; background-color: black;'><h1 style='font-family: sans-serif'><center>SlapIO Captcha Harvester</center></h1><p style='width: 400px; text-align: center; margin: 0 auto;'>Waiting for captcha.<br><br>Do NOT Close this Tab!<br><br>Please make sure you are signed into a google account (check in another tab). You may also open YouTube in other tabs and have GMail open to increase one-clicks!<br><form><input style='visibility: hidden' id=mybutton onclick=msg() type=button value=Start></form><script>function msg(){var t=document.getElementById('mybutton');'Start'==t.value?t.value='Stop':t.value='Start'}</script></body></html>";

		await page.evaluate('document.write("' + buttonHtml + '")');

		console.log(("[PassiveCheck #" + this.id + "]").yellow + " Loading a captcha".gray);

		const replaceHtml = "<html><meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'><head><script type='text/javascript' src='https://www.google.com/recaptcha/api.js'></script><script src='http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js' type='text/javascript'></script> <title>Captcha Harvester</title> <style type='text/css'> body{margin: 1em 5em 0 5em; font-family: sans-serif;}fieldset{display: inline; padding: 1em;}</style></head><body style='color: white; background-color: black;'> <center> <h3>Captcha Token Harvester</h3> <h5></h5> <h5>SlapIO</h5> <form id='theform'> <fieldset> <div class='g-recaptcha' data-sitekey='6LeWwRkUAAAAAOBsau7KpuC9AV-6J8mhw4AjC3Xz' data-bind='recaptcha-submit' data-callback='sub' data-size='invisible'></div><p> <input type='submit' value='Submit' id='recaptcha-submit' style='color: #ffffff;background-color: #3c3c3c;border-color: #3c3c3c;display: inline-block;margin-bottom: 0;font-weight: normal;text-align: center;vertical-align: middle;-ms-touch-action: manipulation;touch-action: manipulation;cursor: pointer;background-image: none;border: 1px solid transparent;white-space: nowrap;padding: 8px 12px;font-size: 15px;line-height: 1.4;border-radius: 0;-webkit-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'> </p></fieldset> </div> <fieldset> <h5 style='width: 10vh;'> <a style='text-decoration: none;' href='http://127.0.0.1:5414/json' target='_blank'>Usable Tokens</a> </h5> </fieldset> </center> <script>function sub(token){window.captchatoken = token; grecaptcha.execute();}</script> </body></html>";

		await page.setRequestInterception(true);
		page.once('request', req => {
			if (req.isNavigationRequest()) {
				req.respond({
					body: replaceHtml
				});
			}
			page.setRequestInterception(false);
		});

		await page.goto('https://supremenewyork.com/');

		await delay(50);

		await page.bringToFront();

		await page.evaluate("var evt = document.createEvent('Event');evt.initEvent('load', false, false);window.dispatchEvent(evt);");

		await delay(10);
		for (const frame of page.mainFrame().childFrames()) {
			if (frame.url().includes('anchor')) {
				await page.evaluate("document.getElementById('recaptcha-submit').click()");
			}
		}

		//Check for challenge
		let frameObj;
		for (const frame of page.mainFrame().childFrames()) {
			if (frame.url().includes('bframe')) {
				frameObj = frame;
			}
		}

		let checkForChallengePromise = new Promise(async function (resolve) {
			try {
				await frameObj.waitForSelector("#rc-imageselect", {timeout: 5000});
				return resolve('challenge');
			} catch (error) {
				console.log("...");
			}
		});

		//Check for token
		let captchaCheckPromise = new Promise(async function (resolve) {
			await page.waitForFunction(() => 'captchatoken' in window, {timeout: 0});
			const captchaToken = await page.evaluate(() => {
				return window.captchatoken;
			});
			return resolve(captchaToken);
		});

		let result = await Promise.race([checkForChallengePromise, captchaCheckPromise]).then((value) => {
			return value;
		}) !== "challenge";

		if (result) {
			console.log(("[PassiveCheck #" + this.id + "]").yellow + " Token retrieved, going or staying passive".gray);
		} else {
			console.log(("[PassiveCheck #" + this.id + "]").yellow + " Challenge encountered, staying active".gray);
		}

		let res = 0;
		if(result) res = 1;

		this.knex("gaccounts").where({
			password: this.password
		}).update({
			oneclick_ready: res
		}).then(() => {
			console.log(("[Activity Gen #" + this.id + "]").red + (" Updated one-click ready status in database to: " + res).gray);
		});

		if(this.isPassive !== result) {
			console.log(("[ONE-CLICK #" + this.id + "]").magenta + " " + "Account is ONE-CLICK ready now".red.underline);
		}

		return result;
	}

	//TODO: Add Error Handling Here
	//Grabs a random comment from the video ID
	async grabComment(video) {
		//Send GET Request to endpoint
		let b = await this.request("https://api.esstudio.site/api/ml/text/comment-words/" + video);
		//Parses response from GET Request
		let r = await JSON.parse(b);
		//Get random comment in array of potential responses
		return r[Math.floor(Math.random() * r.length)];
	}
}


//////////////////////////////////////////////////////////////////////////
// :'######:::'########:'##::: ##:'########:'########::'####::'######:: //
// '##... ##:: ##.....:: ###:: ##: ##.....:: ##.... ##:. ##::'##... ##: //
//  ##:::..::: ##::::::: ####: ##: ##::::::: ##:::: ##:: ##:: ##:::..:: //
//  ##::'####: ######::: ## ## ##: ######::: ########::: ##:: ##::::::: //
//  ##::: ##:: ##...:::: ##. ####: ##...:::: ##.. ##:::: ##:: ##::::::: //
//  ##::: ##:: ##::::::: ##:. ###: ##::::::: ##::. ##::: ##:: ##::: ##: //
// . ######::: ########: ##::. ##: ########: ##:::. ##:'####:. ######:: //
// :......::::........::..::::..::........::..:::::..::....:::......::: //
//////////////////////////////////////////////////////////////////////////

//Chance to do activity on the hour if active
ActivityGenInstance.ACTIVITY_ACTIVE_CHANCE = 0.5;

//Chance to do activity ont he hour if passive
ActivityGenInstance.ACTIVITY_PASSIVE_CHANCE = 0.2;

//Delay between keypress' for logging in
ActivityGenInstance.LOGIN_TYPE_DELAY = 10;


//Time to type query
ActivityGenInstance.QUERY_TYPE_DELAY = 25;


///////////////////////////////////////////////////////////////////////////////////////////////////
//'########:'########:::::'###::::'##::: ##::'######::'##::::::::::'###::::'########:'########:  //
// ... ##..:: ##.... ##:::'## ##::: ###:: ##:'##... ##: ##:::::::::'## ##:::... ##..:: ##.....:: //
// ::: ##:::: ##:::: ##::'##:. ##:: ####: ##: ##:::..:: ##::::::::'##:. ##::::: ##:::: ##::::::: //
// ::: ##:::: ########::'##:::. ##: ## ## ##:. ######:: ##:::::::'##:::. ##:::: ##:::: ######::: //
// ::: ##:::: ##.. ##::: #########: ##. ####::..... ##: ##::::::: #########:::: ##:::: ##...:::: //
// ::: ##:::: ##::. ##:: ##.... ##: ##:. ###:'##::: ##: ##::::::: ##.... ##:::: ##:::: ##::::::: //
// ::: ##:::: ##:::. ##: ##:::: ##: ##::. ##:. ######:: ########: ##:::: ##:::: ##:::: ########: //
// :::..:::::..:::::..::..:::::..::..::::..:::......:::........::..:::::..:::::..:::::........:: //
///////////////////////////////////////////////////////////////////////////////////////////////////

//Time to type phrase to translate
ActivityGenInstance.TRANSLATE_TYPE_DELAY = 25;

//Chance to switch translation language
ActivityGenInstance.TRANSLATE_CHANCE_SWITCH_LANGUAGE = 0.4;

//Translate minimum amount of phrases
ActivityGenInstance.TRANSLATE_MIN_PHRASES = 4;

//Translate maximum amount of phrases
ActivityGenInstance.TRANSLATE_MAX_PHRASES = 10;

//Buffer time between translations
ActivityGenInstance.TRANSLATE_BUFFER_TIME = 5000;


////////////////////////////////////////////////////////////////////////////////
// '##:::'##::'#######::'##::::'##:'########:'##::::'##:'########::'########: //
// . ##:'##::'##.... ##: ##:::: ##:... ##..:: ##:::: ##: ##.... ##: ##.....:: //
// :. ####::: ##:::: ##: ##:::: ##:::: ##:::: ##:::: ##: ##:::: ##: ##::::::: //
// ::. ##:::: ##:::: ##: ##:::: ##:::: ##:::: ##:::: ##: ########:: ######::: //
// ::: ##:::: ##:::: ##: ##:::: ##:::: ##:::: ##:::: ##: ##.... ##: ##...:::: //
// ::: ##:::: ##:::: ##: ##:::: ##:::: ##:::: ##:::: ##: ##:::: ##: ##::::::: //
// ::: ##::::. #######::. #######::::: ##::::. #######:: ########:: ########: //
// :::..::::::.......::::.......::::::..::::::.......:::........:::........:: //
////////////////////////////////////////////////////////////////////////////////

//Delay between keypress' for commenting on videos
ActivityGenInstance.YOUTUBE_COMMENT_TYPE_DELAY = 20;

//The chance per video to comment on the video
ActivityGenInstance.YOUTUBE_CHANGE_TO_COMMENT = 0.15;

//The chance per video to like the video
ActivityGenInstance.YOUTUBE_CHANCE_TO_LIKE = 0.4;

//The chance per video to watch the full length
ActivityGenInstance.YOUTUBE_CHANCE_TO_WATCH_FULL = 0.4;

//The minimum videos to watch in a row
ActivityGenInstance.YOUTUBE_MIN_WATCH = 4;

//The maximum videos to watch in a row
ActivityGenInstance.YOUTUBE_MAX_WATCH = 10;


module.exports = ActivityGenInstance;