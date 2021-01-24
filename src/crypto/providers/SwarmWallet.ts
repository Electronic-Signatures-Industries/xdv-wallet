import { Wallet } from '../Wallet';

export class SwarmWallet extends Wallet {
    fdsUser : any;
    
    constructor(public fds:any){
        super();
        
    }

    setUser(user:any) {
        this.fdsUser = user;
    }

    getUser(){
        return this.fdsUser;
    }

}