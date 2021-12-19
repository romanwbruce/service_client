
class CaptchaInstance {

	constructor(account, siteKey, url) {
		this.puppeteer = require("puppeteer-extra");
		this.puppeteer.use(require("puppeteer-extra-plugin-stealth")());
		this.account = account;
		this.siteKey = siteKey;
		this.url = url;
	}

	async initialize() {
		this.browser = await this.puppeteer.launch({
			headless: false,
			userDataDir: require("path").join(require("path").join(__dirname, "userDataDir"), this.account.toString()),
			args: ['--disable-setuid-sandbox', '--no-sandbox', '--enable-features=NetworkService', '--ignore-certificate-errors', '--ignore-certificate-errors-spki-list', '--disable-session-crashed-bubble', '--disable-dev-shm-usage', '--window-size=512,512']
		});

		this.browser.page = await this.browser.newPage();
		await ((await this.browser.pages())[0]).close();

		let requestInterception = true;
		await this.browser.page.setRequestInterception(true);

		await this.browser.page.on("request", async (req) => {
			// if(req.isNavigationRequest()) {
			// 	console.log(req.url());
			// }
			if(req.isNavigationRequest() && req.url() === this.url) {
				// console.log(req.url());
				req.respond({
					body: `<html>
            <head>
                <title>Slap IO - Working</title>
<!--                <link href="https://fonts.googleapis.com/css2?family=Khula:wght@300;400;600;700;800&display=swap" rel="stylesheet">-->
  <link rel="apple-touch-icon" sizes="180x180" href="https://d17ol771963kd3.cloudfront.net/assets/mobile/apple-icon-180x180-1c9f133de4b011b6b54d1d3622b53675.png">

            </head>
            <body>
                <style>
                    * {
                        outline: 0;
                    }
                    body {
                        position: absolute;
                        background-color: #F4F4F7;
                        border-radius: 0 0 20px 20px;
                        color: #FFFFFF;
                        width: 98vw;
                        height: 90vh;
                        font-family: Roboto, sans-serif;
                        display: flex;
                        justify-content: center;
                    }
                    #submit {
                        border: 1px solid #1EE942;
                        background-color: transparent;
                        color: #FFFFFF;
                        width: 150px;
                        height: 30px;
                    }
                    div {
                        top: 0px !important;
                        left: 0px !important;
                        margin-left: 4px !important;
                        margin-top: -8px !important;
                    }
                </style>
                <center>
                    <form action="" method="POST">
                        <button class="g-recaptcha" data-sitekey="6LeWwRkUAAAAAOBsau7KpuC9AV-6J8mhw4AjC3Xz" data-callback="sub">Submit</button>
                        <br />
                    </form>
                </center>
                <script>
                    if (location.href.includes("6LeWwRkUAAAAAOBsau7KpuC9AV-6J8mhw4AjC3Xz")) {
                        document.querySelector(".g-recaptcha").setAttribute("data-size", "invisible");
                        document.querySelector("#submit").remove();
                    }
                </script>
<!--                <script src="https://www.google.com/recaptcha/api.js?onload=afterCaptchaLoad" async defer></script>-->
<!--                <script src="https://www.google.com/recaptcha/api.js?onload=afterCaptchaLoad" async defer></script>-->
                    <script src="https://www.google.com/recaptcha/api.js" async defer></script>
                <script>
                /* PLEASE DO NOT COPY AND PASTE THIS CODE. */(function(){var w=window,C='___grecaptcha_cfg',cfg=w[C]=w[C]||{},N='grecaptcha';var gr=w[N]=w[N]||{};gr.ready=gr.ready||function(f){(cfg['fns']=cfg['fns']||[]).push(f);};w['__recaptcha_api']='https://www.google.com/recaptcha/api2/';(cfg['render']=cfg['render']||[]).push('onload');(cfg['onload']=cfg['onload']||[]).push('afterCaptchaLoad');w['__google_recaptcha_client']=true;var d=document,po=d.createElement('script');po.type='text/javascript';po.async=true;po.src='https://www.gstatic.com/recaptcha/releases/mrdLhN7MywkJAAbzddTIjTaM/recaptcha__en.js';po.crossOrigin='anonymous';po.integrity='sha384-zy6MpaK2q7ThL2mDEY0TbyvBJDr6lKK9SPTRcXRLbNIBZDn1zpbOT7nMFdXz9mci';var e=d.querySelector('script[nonce]'),n=e&&(e['nonce']||e.getAttribute('nonce'));if(n){po.setAttribute('nonce',n);}var s=d.getElementsByTagName('script')[0];s.parentNode.insertBefore(po, s);})();
</script>
                <script>
                    function sub() {
                        let response = grecaptcha.getResponse();
                        console.log(response);
						window.location.href = "http://www.solved.com/response=" + response;
                        // window.location.href = "slapio-g-recaptcha-response=" + response;
                    }

                    function afterCaptchaLoad() {
                        grecaptcha.execute();
                    }
                </script>

            </body>
        </html>`
				});
			} else req.continue();
			if(req.isNavigationRequest() && req.url().includes("solved.com")) {
				const recaptchaResponse = req.url().split("=")[1];
				// console.log("g-recaptcha-response: " + recaptchaResponse);
				this.resolve(recaptchaResponse);
			}

			// if(req.isNavigationRequest()) req.continue({headers: { "cookies": this.cookies }})
			// else req.continue();
			// try {
			//     if(req.isNavigationRequest() && requestInterception) {
			//         req.respond({
			//             body: `<html><meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'><head><script type='text/javascript' src='https://www.google.com/recaptcha/api.js'></script><script src='http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js' type='text/javascript'></script><style type='text/css'> body{margin: 1em 5em 0 5em; font-family: sans-serif;}fieldset{display: inline; padding: 1em;}</style></head><body style='color: white; background-color: black;'><form action='http://127.0.0.1:${port}/solve' method='POST' id='form'><fieldset><div class='g-recaptcha' data-sitekey='${this.sitekey}' data-bind='recaptcha-submit' data-callback='sub' data-size='invisible'></div><p> <input type='submit' value='Submit' id='recaptcha-submit' style='color: #ffffff;background-color: #3c3c3c;border-color: #3c3c3c;display: inline-block;margin-bottom: 0;font-weight: normal;text-align: center;vertical-align: middle;-ms-touch-action: manipulation;touch-action: manipulation;cursor: pointer;background-image: none;border: 1px solid transparent;white-space: nowrap;padding: 8px 12px;font-size: 15px;line-height: 1.4;border-radius: 0;-webkit-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;'></p></fieldset></form></center><script>function sub(){document.getElementById('form').submit(); grecaptcha.execute();}</script> </body></html>`
			//         });
			//         await this.browser.page.setRequestInterception(false);
			//         requestInterception = false;
			//     } else if(requestInterception) req.continue();
			// } catch (err) {}
		});
	}

	async generate() {
		await this.browser.page.goto(this.url);
		return new Promise(resolve => {
			this.resolve = resolve;
		});
	}

	async setProfile(profile) {
		this.profile = profile;
		// await this.browser.page.setRequestInterception(true);

		let cookies = "";
		for (let i = 0; i < this.profile.cookies.length; i++) {
			let cookie = this.profile.cookies[i];
			cookies = cookies + `${cookie.name}=${cookie.value}; `;
		}
		this.cookies = cookies;
		// await this.browser.page.setRequestInterception(true);

		for(let i = 0; i < this.profile.cookies.length; i++) await this.browser.page.setCookie(this.profile.cookies[i]);
		// await this.browser.page.goto("https://gmail.com");
	}
}
module.exports = CaptchaInstance;

// const profile = {"cookies":[{"name":"GMAIL_LOGIN","value":"T1595624177494/1595624177494/1595624186508","domain":".google.com","path":"/","expires":-1,"size":53,"httpOnly":false,"secure":false,"session":true},{"name":"SIDCC","value":"AJi4QfH7OiOgshVBhioi_jd-X1TFySIPecFlLjeXFzRIgQpXJrl_ubhX2XD9acwLesycxpDl5A","domain":".google.com","path":"/","expires":1627160188.026345,"size":79,"httpOnly":false,"secure":false,"session":false},{"name":"__Secure-3PAPISID","value":"YSlzLWlCYlqWlblo/ABh1025_tc5LZpQyC","domain":".google.com","path":"/","expires":1658696186.481928,"size":51,"httpOnly":false,"secure":true,"session":false,"sameSite":"None"},{"name":"__Secure-APISID","value":"qOVypXLdkaM44HqU/A2GyHLEkywzoqjFI9","domain":".google.com","path":"/","expires":1596265199.481913,"size":49,"httpOnly":false,"secure":true,"session":false,"sameSite":"None"},{"name":"__Secure-SSID","value":"AOpNj2j1ce8iv7gDk","domain":".google.com","path":"/","expires":1596265199.481899,"size":30,"httpOnly":true,"secure":true,"session":false,"sameSite":"None"},{"name":"SSID","value":"AOpNj2j1ce8iv7gDk","domain":".google.com","path":"/","expires":1658696186.481835,"size":21,"httpOnly":true,"secure":true,"session":false},{"name":"HSID","value":"AnXyaKr3aIXDcpDlS","domain":".google.com","path":"/","expires":1658696186.481818,"size":21,"httpOnly":true,"secure":false,"session":false},{"name":"__Secure-OSID","value":"zgfCk6Mznnk9bwiK5JCmX3FHVG76QDbNc8GV4qnfKeYLl2IuAOQJLeQTOp5lfVq52pF4iw.","domain":"mail.google.com","path":"/","expires":1658696186.64223,"size":84,"httpOnly":true,"secure":true,"session":false,"sameSite":"None"},{"name":"__Secure-3PSID","value":"zgfCkzMK9Y05gaFaORGIk9L9iyTGLHOxLo7_GJym5j-vldIqV5kqufxekjn0ImQ3YF3_Pw.","domain":".google.com","path":"/","expires":1658696186.481765,"size":85,"httpOnly":true,"secure":true,"session":false,"sameSite":"None"},{"name":"SID","value":"zgfCkzMK9Y05gaFaORGIk9L9iyTGLHOxLo7_GJym5j-vldIq6c1sOnvAhoBwaTtFn5b-Pg.","domain":".google.com","path":"/","expires":1658696186.481725,"size":74,"httpOnly":false,"secure":false,"session":false},{"name":"NID","value":"204=RmObJ8C8WtzCUq_j7Dn6PDvAXx4Uso6filJKJcS-SlPEl5rGrLtnLCSKlJenwTOOjfASa1IyINGMW-NbnUSzpaQP9IsN8Z-sEkKUhQyASqehv7YHiIedU_inZjXDEruTeG8kjL9_yoXVUnpzMDYa5PJvHR-SurFaj5a-bwTA_53fbx-HzJcz3yA","domain":".google.com","path":"/","expires":1611435386.481993,"size":190,"httpOnly":true,"secure":true,"session":false},{"name":"SDP_PROMO_SHOWN","value":"true","domain":"mail.google.com","path":"/mail/mu","expires":1598216188,"size":19,"httpOnly":false,"secure":false,"session":false},{"name":"WML","value":"1595624187724#frrancis.willits@gmail.com:54:0","domain":"mail.google.com","path":"/mail","expires":1658696188.026247,"size":48,"httpOnly":false,"secure":true,"session":false},{"name":"OSID","value":"zgfCk6Mznnk9bwiK5JCmX3FHVG76QDbNc8GV4qnfKeYLl2IudrcpLKJd7tu7ZtVSUkmYdQ.","domain":"mail.google.com","path":"/","expires":1658696186.642169,"size":75,"httpOnly":true,"secure":true,"session":false},{"name":"GX","value":"DUMMY","domain":".mail.google.com","path":"/mail","expires":1658696187.856312,"size":7,"httpOnly":true,"secure":true,"session":false},{"name":"COMPASS","value":"gmail=Co4BAAlriVfbb29np_SQUOWNWGMe_xiPlQv9PShCFO6agmj5HbY7xAD0mCVOEPXed4J-zBe1uL2ZquPTc2Scs3r8-uZzUaiK4FMKQf3UQP-fBmUS9PKnvCsng7nf1ireqsyUIfc8KtpgdLGma253zJxKR7P0MqUvzin8kPS4004da6D-VrIlEbNVpf0cmuRj2RCvsu34BRqgAQAJa4lXdR9frHmprpNMrxd42kiGrPXY6m-BSxJYP2j4YPph_gYEhcHsgNgTNnWpfq5ztz2G95PTrrpNBEyoH5vgxhOkxbSOeLLdNvKDVZmbkqU6QKlnW521mhVU-LXXJQqW0xl_WPpd7x0OCOVu1fLA8JreDJvAGueilDKtYyL6YlOaHqCqz0kwI4x1pTwGgN6zykOeRvX9YhC1Y4X5A5c","domain":"mail.google.com","path":"/mail","expires":1596488183.856127,"size":432,"httpOnly":true,"secure":true,"session":false,"sameSite":"None"},{"name":"SAPISID","value":"YSlzLWlCYlqWlblo/ABh1025_tc5LZpQyC","domain":".google.com","path":"/","expires":1658696186.481865,"size":41,"httpOnly":false,"secure":true,"session":false},{"name":"__Secure-HSID","value":"AnXyaKr3aIXDcpDlS","domain":".google.com","path":"/","expires":1596265199.481883,"size":30,"httpOnly":true,"secure":true,"session":false,"sameSite":"None"},{"name":"APISID","value":"qOVypXLdkaM44HqU/A2GyHLEkywzoqjFI9","domain":".google.com","path":"/","expires":1658696186.48185,"size":40,"httpOnly":false,"secure":false,"session":false},{"name":"GAUSR","value":"frrancis.willits@gmail.com","domain":"mail.google.com","path":"/mail/mu","expires":1658696188.026309,"size":31,"httpOnly":false,"secure":true,"session":false}],"lastUpdated":1595624188763,"credentials":{"email":"frrancis.willits@gmail.com","password":"Fuck$Off$909","uuid":"683b9c1e-0745-4f16-b16e-fda23fcff935"}};
//
// (async () => {
// 	const instance = new CaptchaInstance(0, "6LeWwRkUAAAAAOBsau7KpuC9AV-6J8mhw4AjC3Xz", "http://www.supremenewyork.com/");
// 	await instance.initialize();
// 	const resp = await instance.generate();
// 	console.log(resp);
// })();