/*
    Service Client - 
    1. Solve Challenge 
    2. Upload key to Redis



    CaptchaInstance.js
      Each instance of this class is a single window open

      Functions
        async solveCaptcha (siteKey)
        async initialize ()
*/

const express = require("express");
const bodyParser = require('body-parser')
const app = express()
const port = 3000

app.use(bodyParser.urlencoded({ extended: false }));

const authenticatedAPIKeys = [
    "3555399e00c44f48907fa459c3976631"
]

const CaptchaInstance = require("./CaptchaInstance.js");
const instance = new CaptchaInstance(0, "6LeWwRkUAAAAAOBsau7KpuC9AV-6J8mhw4AjC3Xz", "http://www.supremenewyork.com/");
instance.initialize();

app.get("/generate", async (req, res) => {
    console.log(req.query);
    if(req.query && req.query.key && req.query.siteKey) {
        const apiKey = req.query.key;
        const captchaSiteKey = req.query.sitekey;
        console.log(apiKey);
        if(authenticatedAPIKeys.includes(apiKey)) {
            // Generate a captcha
            const response = await instance.generate();
            res.send(JSON.stringify({ status: true, response }));
            return;
        }
    }
    res.send(JSON.stringify({ status: false }));
});

app.listen(port, () => {
  console.log('Started ServiceClient... ');
  // this.loadAccounts();
});







/* Account Management */
let AccountPool = [];
const puppeteer = require('puppeteer');









let accountPool = [];

//Connects to redis
function doRedisConnect(){

}

//Loads the google accounts from our database.
function loadGoogleAccounts(){

}

//Gets the a google account thats not in need of user activity.
function selectBestGoogleAccount(){
  
}

//Returns key.
function solveChallenge(siteToken, googleAccount){
    //Connect to browser.
    //One click authorize
    //return the key.
}

//Insert into redis.
function notifyRedis(requestID, oneTimeClickToken){

}


function requestRecieved(siteToken, requestID){
    let token = solveChallenge(siteToken, selectBestGoogleAccount());
    notifyRedis(requestID, token);
}

function loadAccounts(){
    AccountStorage.load();

}

function load(){
  let json = require('./data.json');  

  console.log("Length: "+json.length)
  let x = 0;

  for(x=0;x<json.length;x++){
      var datea= { 
          name: json[x]['User name'],
          password: json[x]['Password'],
          phone: json[x]['Phone no'],
          recoveremail: json[x]['Recovery mail'],
          needsActivity: false
      };

      console.log(datea);

  }
}