class GoogleAccount {
    constructor(email, password, sms, recovery, needsUserActivity) {
      this.email = email;
      this.password = password;
      this.needsUserActivity = needsUserActivity; 
      this.sms = sms;
      this.recovery = recovery;
    }

    getEmail(){
        return this.email;
    }

    getPassword(){
        return this.password;
    }

    getSMS(){
        return this.sms;
    }

    getRecovery(){
        return this.recovery;
    }

    needsUserActivity(){
        return this.needsUserActivity;
    }
  }

  module.exports = GoogleAccount;