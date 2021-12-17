class Helper {

	static shuffleArray(a) {
		let j, x, i;
		for (i = a.length - 1; i > 0; i--) {
			j = Math.floor(Math.random() * (i + 1));
			x = a[i];
			a[i] = a[j];
			a[j] = x;
		}
		return a;
	}

	static async auth(page, proxy) {
		if(proxy.isAuth()) {
			await page.authenticate({
				"username": proxy.getUsername(),
				"password": proxy.getPassword()
			});
		}
	}

	static getRandomLanguageLetter() {
		//Omitting O and Q as there are no Google Translate languages starting with these letters
		return "abcdefghijklmnprstuvwxyz".charAt(Math.floor(Math.random() * "abcdefghijklmnprstuvwxyz".length));
	}

	static getRandomInt(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	static async login(browser, account, typeDelay, proxy) {
		let email = account.getEmail();
		let password = account.getPassword();
		let phoneNumber = account.getRecoverySMS();

		require("colors");
		const loginPage = await browser.newPage();
		await Helper.auth(loginPage, proxy);
		// check if login is necessary
		await loginPage.goto("https://myaccount.google.com");
		let bodyHTML = await loginPage.evaluate(() => document.body.innerHTML);
		if (bodyHTML.includes('When you sign in to your Google Account')) {
			await loginPage.goto("https://accounts.google.com/ServiceLogin/signinchooser?continue=https%3A%2F%2Fwww.google.com");
			await loginPage.type("input[type='email']", email, {
				delay: typeDelay
			});
			await loginPage.waitFor(100);

			const [nextButton] = await loginPage.$x("//span[text()='Next']");
			if (nextButton) nextButton.click();
			else {
				console.log("Cannot find next button");
				return false;
			}

			await loginPage.waitForSelector("input[type='password']", {
				visible: true,
				timeout: 5000
			});

			await loginPage.waitFor(100);

			await loginPage.type("input[type='password']", password, {
				delay: typeDelay
			});

			await loginPage.waitFor(100);

			const [nextButton2] = await loginPage.$x("//span[text()='Next']");
			if (nextButton2) nextButton2.click();
			else {
				console.log("Cannot find next button");
				return false;
			}

			await loginPage.waitForNavigation();

			await loginPage.waitFor(1000);

			if (loginPage.url() !== "https://www.google.com") {
				let verifyPageElements = await loginPage.$x("//span[contains(text(), 'Verify')]");
				if (verifyPageElements && verifyPageElements.length && verifyPageElements.length > 0) {
					//At Verify number Page
					require("colors");
					console.log("Number verification for account login required".gray);
					let [confirmPhoneElements] = await loginPage.$x("//div[contains(text(), 'Confirm your recovery phone number')]/parent::div");
					await loginPage.waitFor(500);
					await confirmPhoneElements.click();
					await confirmPhoneElements.click();

					await loginPage.waitForNavigation();

					await loginPage.waitForSelector("input[type='tel']", {
						visible: true,
						timeout: 10000
					});

					await loginPage.waitFor(1000);
					await loginPage.type("input[type='tel']", phoneNumber.toString(), {
						delay: typeDelay
					});

					// wait for next button to appear
					await loginPage.waitFor(100);
					const [nextButton] = await loginPage.$x("//span[text()='Next']");
					if (nextButton) nextButton.click();
					else {
						console.log("Cannot find next button");
						return false;
					}

					await loginPage.waitForNavigation();
				}
			}
			if((await loginPage.url()).includes("speedbump")) {
				await account.removeFromShuffle();
			} else {
				await loginPage.close();
			}

			console.log("[Instance]".red + " Successfully logged in to Google".gray);
			return true;
		} else {
			// account is not logged in
			console.log("[Instance]".red + " Account is already logged in to Google".gray);
		}
	}
}

module.exports = Helper;