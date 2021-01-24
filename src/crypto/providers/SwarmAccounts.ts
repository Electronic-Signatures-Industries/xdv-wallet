import { ethers } from 'ethers';
import { SwarmWallet } from './SwarmWallet';
import { FDS } from 'fds.js';

export class SwarmAccounts {
    constructor(public client: any, options: any = {}) {
        this.client = new FDS(Object.assign({}, {
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
        const options = { id: publicKey, mnemonic };

        const user = await this.client.RestoreAccountFromPrivateKey(username, password, privateKey);

        const wallet = await swarmWallet.createWallet(password, options);
        wallet.setUser(user);
        return { xdv: wallet };
    }
}