class GoogleAccount {
    constructor(email, password, needsUserActivity) {
      this.email = email;
      this.password = password;
      this.needsUserActivity = needsUserActivity; 
    }

    getEmail(){
        return this.email;
    }

    getPassword(){
        return this.password;
    }

    needsUserActivity(){
        return this.needsUserActivity;
    }
  }