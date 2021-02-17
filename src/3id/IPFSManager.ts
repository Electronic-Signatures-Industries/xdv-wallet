import dagJose from 'dag-jose'
import multiformats from 'multiformats/cjs/src/basics'
import legacy from 'multiformats/cjs/src/legacy'
import { DID } from 'dids'
import { ethers } from 'ethers'
import moment from 'moment'
import IPFSClient from 'ipfs-http-client';
import { keccak256 } from 'ethers/lib/utils'
const Ipld = require('ipld')
const IpfsBlockService = require('ipfs-block-service')
const multicodec = require('multicodec')

const initIpld = async (repo) => {
  //const repo = new IpfsRepo(ipfsRepoPath)
  //await repo.init({})
  //await repo.open()
  const blockService = new IpfsBlockService(repo)
  return new Ipld({blockService: blockService})
}

export class IPFSManager {
    client: any;
    provider: ethers.providers.JsonRpcProvider;
    ipld: any;

    async start(hostname: string){
       this.client = IPFSClient({ url: hostname || `http://ifesa.ipfs.pa:5001` });
       this.ipld = await initIpld(this.client);
    }


    /**
     * Converts Blob to Keccak 256 hash
     * @param payload 
     */
    async blobToKeccak256(payload: Blob): Promise<string> {
        let ab = await payload.arrayBuffer();
        let buf = new Uint8Array(ab);
        return keccak256(buf) as string;
    }

    async setCurrentNode(
        cid: string,
        key: string = 'self',

    ) {
        const res = await this.client.name.publish(cid, {key});
        return res;
    }

    async getCurrentNode(
        key: string = 'self'
    ) {
        try {
            let query = '';
            const keys = await this.client.key.list();
            const { id } = keys.find(i => i.name === key);
            for await (query of this.client.name.resolve(`/ipns/${id}`)) {
            }
            return query.replace('/ipfs/', '');
        } catch (e) {
            return null;
        }
    }

    /**
     * Add Signed Object
     * @param did DID
     * @param payload Payload, either Buffer or Blob 
     * @param previousNode If it has previous node
     */
    async addSignedObject(
        did: DID,
        payload: File,
        previousNode?: any) {
        let temp: string;
        let content: Buffer;
        if (payload instanceof File) {
            temp = await this.blobToKeccak256(payload);
            content = Buffer.from((await payload.arrayBuffer()));
        } else {
            throw new Error('addSignedObject: must be a file object');

        }
        temp = temp.replace('0x', '');
        // sign the payload as dag-cbor
        
        const { jws, linkedBlock } = await did.createDagJWS({
            contentType: payload.type,
            name: payload.name,
            lastModified: payload.lastModified,
            timestamp: moment().unix(),
            hash: temp,
            id: atob(moment().unix() + temp),
            content: content.toString('base64'),
            documentPubCert: undefined,
            documentSignature: undefined,
            signaturePreset: undefined
        });
        // put the JWS into the ipfs dag
        const jwsCid = await this.client.dag.put(jws, multicodec.DAG_CBOR);
        // put the payload into the ipfs dag
        //await this.client.block.put(linkedBlock, { cid: jws.link })
        console.log('cid', jwsCid.toString());
        return jwsCid.toString()
    }

    createSignedContent({
        contentType,
        name,
        lastModified,
        size,
        content,
        hash,
        documentPubCert,
        documentSignature,
        signaturePreset
    }) {
        return {
            contentType,
            name,
            lastModified,
            size,
            content,
            hash,
            created: moment().unix(),
            documentPubCert,
            documentSignature,
            signaturePreset,
        };
    }

    async addIndex(
        did: DID,
        documents: any[]) {
        // sign the payload as dag-cbor
        const { jws, linkedBlock } = await did.createDagJWS({
            documents
        });
        
        // put the JWS into the ipfs dag
        const jwsCid = await this.client.dag.put(jws, multicodec.DAG_CBOR);
        // put the payload into the ipfs dag
        //await this.client.blocks.put(linkedBlock, { cid: jws.link });
        const cid = jwsCid.toString()
        return cid;
    }
    /**
     * Get IPLD object
     * @param cid content id
     */
    async getObject(cid: string): Promise<any> {
        let temp = await this.client.dag.get(cid);
        const res = {
            metadata: {
                ...temp,
            },
            payload: undefined
        }
        temp = await this.client.dag.get(cid, { path: '/link' });
        res.payload = {
            ...temp,
        };

        return temp;
    }

    verify(did: DID, obj: any): Promise<any> {
        return did.verifyJWS(obj.metadata);
    }

    async encryptObject(did: DID, cleartext, dids: string[]) {
        const jwe = await did.createDagJWE(cleartext, dids)
        return this.client.dag.put(jwe, multicodec.DAG_CBOR);
    }

    async decryptObject(did: DID, cid, query) {
        const jwe = (await this.client.dag.get(cid, query)).value
        const cleartext = await did.decryptDagJWE(jwe)
        return cleartext;
    }
    async addPublicWallet(
        did: DID,
        payload: Buffer) {
        let temp: string;
        let content: Buffer;
        temp = keccak256(payload);
        content = payload;
        temp = temp.replace('0x', '');
        // sign the payload as dag-cbor
        const cid = await this.client.add({
            path: 'index.json',
            content
        });
        return cid.toString()
    }
}