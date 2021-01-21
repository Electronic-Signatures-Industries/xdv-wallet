import { ec } from 'elliptic';
import { ethers } from 'ethers';
import { SwarmWallet } from './SwarmWallet';
let FDS = require('FDS.js');

export class SwarmAccounts {
    constructor(public client:any){
        this.client = new FDS({
            swarmGateway: 'https://swarm.fairdatasociety.org',
            ethGateway: 'https://geth-noordung.fairdatasociety.org',
            chainID: '3'
        }); 
    }
    
    async createWallet(username:string, password:string){
        const mnemonic = SwarmWallet.generateMnemonic();
        const swarmWallet = new SwarmWallet(this.client);

        const ethersWallet = ethers.Wallet.fromMnemonic(mnemonic.phrase);
        const privateKey = ethersWallet.privateKey;
        const publicKey = ethersWallet.publicKey;
        const options = { custonId : publicKey, mnemonic : mnemonic };

        const user = await this.client.RestoreAccountFromPrivateKey(username, password, privateKey);

        const wallet = await swarmWallet.createWallet(password, options);
        wallet.setUser(user);
        return { xdv: wallet }; 
    }
}