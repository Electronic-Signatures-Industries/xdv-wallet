import { DIDDocumentBuilder } from '../did/DIDDocumentBuilder'
import { ethers } from 'ethers'
import { expect } from 'chai'
import { JOSEService } from './JOSEService'
import { JWTService } from './JWTService'
import { KeyConvert, X509Info } from './KeyConvert'
import { LDCryptoTypes } from './LDCryptoTypes'
import { Wallet } from './Wallet'
import { DIDManager } from '../3id/DIDManager'
import { DriveManager } from '../3id/DriveManager'
import { IPFSManager } from '../3id/IPFSManager'
let localStorage = {}

describe('universal wallet - wallet and 3ID', function () {
  let selectedWallet: Wallet
  before(async function () {})

  it('when calling createWeb3Provider, should return a web3 instance and wallet id', async function () {
    const result = await Wallet.createWeb3Provider(
      'https://ropsten.infura.io/v3/79110f2241304162b087759b5c49cf99',
      { passphrase: '1234' },
    )
    expect(result.id.length).to.be.above(0)
  })

  it('when calling createWeb3Provider and create3IDWeb3, should return a web3 instance and wallet id', async function () {
    const result = await Wallet.createWeb3Provider(
      'https://ropsten.infura.io/v3/79110f2241304162b087759b5c49cf99',
      { passphrase: '1234' },
    )
    expect(result.id.length).to.be.above(0)

    const didManager = new DIDManager()
    didManager.create3IDWeb3(result.web3, result.address)
  })

  it('when calling create3IDEd25519 , should return a did instance and wallet id', async function () {
    const result = await Wallet.createWeb3Provider(
      'https://ropsten.infura.io/v3/79110f2241304162b087759b5c49cf99',
      { passphrase: '1234' },
    )
    expect(result.id.length).to.be.above(0)

    const did = await Wallet.create3IDEd25519({
      passphrase: 'abcdef123456',
    })
    expect(did.id.length).to.be.above(0)
  })
})

describe('universal wallet - wallet, 3ID and IPLD', function () {
  let selectedWallet: Wallet
  before(async function () {})

  it('when adding a signed DID/IPLD object , should fetch and return uploaded data', async function () {
    const result = await Wallet.createWeb3Provider(
      'https://ropsten.infura.io/v3/79110f2241304162b087759b5c49cf99',
      { passphrase: '1234' },
    )
    expect(result.id.length).to.be.above(0)

    const did = await Wallet.create3IDEd25519({
      passphrase: 'abcdef123456',
    })
    expect(did.id.length).to.be.above(0)

    const ipfsManager = new IPFSManager(did.did)
    await ipfsManager.start()

    const fil = Buffer.from('fffffffffffffffffffffff')
    // auth
    await did.did.authenticate()
    const cid = await ipfsManager.addSignedObject(fil, {
      name: 'UnitTest.txt',
      contentType: 'text/text',
      lastModified: new Date(),
    })
    expect(cid.length).to.be.above(0)

    const res = await ipfsManager.getObject(cid)
    expect(res.value.name).equal('UnitTest.txt')
  })

  it('when adding a signed and encrypted DID/IPLD object , should fetch and return uploaded data', async function () {
    const result = await Wallet.createWeb3Provider(
      'https://ropsten.infura.io/v3/79110f2241304162b087759b5c49cf99',
      { passphrase: '1234' },
    )
    expect(result.id.length).to.be.above(0)

    const did = await Wallet.create3IDEd25519({
      passphrase: 'abcdef123456',
    })
    const didBob = await Wallet.create3IDEd25519({
      passphrase: 'abcdef123456!@#$%^^&*',
    })
    expect(did.id.length).to.be.above(0)

    const ipfsManager = new IPFSManager(did.did)
    await ipfsManager.start()

    // auth
    await did.did.authenticate()
    await didBob.did.authenticate()
    // Alice encrypts, and both Alice and Bob can decrypt
    const enc = await ipfsManager.encryptObject('Hola Mundo !!!', [
      didBob.did.id,
    ])

    console.log(enc.toString())

    // const cid = await ipfsManager.addSignedObject(Buffer.from(enc.toString()), {
    //   name: 'UnitTestEnc.txt',
    //   contentType: 'text/text',
    //   lastModified: new Date(),
    // })
    // expect(cid.length).to.be.above(0)
    const res = await ipfsManager.decryptObject(didBob.did, enc.toString(), {})
    expect(res.cleartext).equal('Hola Mundo !!!')
  })

  it('when adding a signed and encrypted DID/IPLD object , should failed decrypting if not allowed', async function () {
    const result = await Wallet.createWeb3Provider(
      'https://ropsten.infura.io/v3/79110f2241304162b087759b5c49cf99',
      { passphrase: '1234' },
    )
    expect(result.id.length).to.be.above(0)

    const did = await Wallet.create3IDEd25519({
      passphrase: 'abcdef123456',
    })
    const didBob = await Wallet.create3IDEd25519({
      passphrase: 'abcdef123456!@#$%^^&*',
    })
    expect(did.id.length).to.be.above(0)

    const ipfsManager = new IPFSManager(did.did)
    await ipfsManager.start()

    // auth
    await did.did.authenticate()
    await didBob.did.authenticate()
    // Alice encrypts, and only Alice can decrypt
    const enc = await ipfsManager.encryptObject('Hola Mundo !!!', 
    [didBob.did.id]
    )


    // const cid = await ipfsManager.addSignedObject(Buffer.from(enc.toString()), {
    //   name: 'UnitTestEnc.txt',
    //   contentType: 'text/text',
    //   lastModified: new Date(),
    // })
    // expect(cid.length).to.be.above(0)
//    try {
      const res = await ipfsManager.decryptObject(
        did.did,
        enc.toString(),
        {},
      )
      
    // } catch (e) {
    //   console.log(e)
       expect(res.cleartext).equal({})
    // }
  })
})
