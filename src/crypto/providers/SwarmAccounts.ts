import { ethers } from 'ethers';
import { SwarmWallet } from './SwarmWallet';
const fds = require('fds.js');

/**
 * Account management for swarm wallets
 */
export class SwarmAccounts {
    private client: any;
    constructor(options: any = {}) {
        this.client = new fds(Object.assign({}, {
            swarmGateway: 'https://swarm.fairdatasociety.org',
            // ethGateway: 'https://geth-noordung.fairdatasociety.org',
            // chainID: '3'
        }, options));
    }

    /**
     * Creates a wallet
     * @param username username
     * @param password password
     */
    async createWallet(username: string, password: string) {
        const mnemonic = SwarmWallet.generateMnemonic();
        const swarmWallet = new SwarmWallet(this.client);

        const ethersWallet = ethers.Wallet.fromMnemonic(mnemonic.phrase);
        const privateKey = ethersWallet.privateKey;
        const publicKey = ethersWallet.publicKey;
        const options = { id: publicKey, mnemonic: mnemonic.phrase };

        const user = await this.client.RestoreAccountFromPrivateKey(username, password, privateKey);

        const wallet = await swarmWallet.createWallet(password, options);
        wallet.setUser(user);
        return { xdv: wallet };
    }

    async openFDS(username: string, password: string) {
        const user = await this.client.UnlockAccount(username, password);
        return user;
    }    
}