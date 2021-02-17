import { ThreeIdConnect,  EthereumAuthProvider } from '3id-connect';
import { CID, IpfsHttpClient } from 'ipfs-http-client'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import KeyResolver from '@ceramicnetwork/key-did-resolver'
import { DID, DIDOptions } from 'dids'
import { randomBytes } from '@stablelib/random'

export class DIDManager {

    /**
     * Create 3ID
     * using XDV
     * @param wallet 
     * @param messageNotify 
     */
    async create3ID() {
        let seed = randomBytes(32);
        const provider = new Ed25519Provider(seed)
        const did = new DID({ provider, resolver: KeyResolver.getResolver() } as unknown as DIDOptions)
        await did.authenticate();
        return did;
    }    



    /**
     * Create 3ID
     * using XDV
     * @param wallet 
     * @param messageNotify 
     */
    async create3IDWeb3(web3provider: any, address: any) {
        const threeid = new ThreeIdConnect();
        const authProvider = new EthereumAuthProvider(web3provider, address);
        await threeid.connect(authProvider) 
        const did = new DID({ provider: (await threeid.getDidProvider()) as any, resolver: KeyResolver.getResolver() } as unknown)
        await did.authenticate();
        return did;
    }    
}