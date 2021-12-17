/*
    Service Client - 
    1. Solve Challenge 
    2. Upload key to Redis

*/

const express = require('express')
const app = express()
const port = 3000

app.post('/generate', (req, res) => {
  processRawRequest(req);
})

app.listen(port, () => {
  console.log('Started ServiceClient... ');
})

let accountPool = [];

//Functions we might need in the future.

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

//Recieve request from routing server.
//We've already authorized that the user requesting has a valid API key so we don't need to check again. (Check on web server.)

function processRawRequest(req){
    console.log("Processing incoming request: "+req.body);

    //Post body must contain:
    // requestID, siteToken, maybe an auth token?
}

function requestRecieved(siteToken, requestID){
    let token = solveChallenge(siteToken, selectBestGoogleAccount());
    notifyRedis(requestID, token);
}

