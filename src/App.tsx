/* eslint-disable @typescript-eslint/no-unused-vars */
import { Dialog } from 'primereact/dialog';
import './App.css'
import { Button } from 'primereact/button';
import { useState } from 'react';
import nacl from "tweetnacl";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";

import { Badge } from 'primereact/badge';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Buffer } from 'buffer';
import { PublicKey } from 'solana';

type Wallet = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [seed: string]: { publicKey: string; privateKey: any }[];
}


function App() {
      const [visible, setVisible] = useState(false);
      const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
      const [wallet, setWallet] = useState<Wallet>({});


      const createWallet = () => {
            const mnemonic = generateMnemonic();
            setSeedPhrase(mnemonic.split(' '));
            const seed = mnemonicToSeedSync(mnemonic).toString('hex');

            createKeyPair(seed)
      };

      const createKeyPair = (seed: string) => {
            const size = Object.keys(wallet).length + 1;
            const path = `m/44'/501'/${size}'/0'`; // This is the derivation path
            const derivedSeed = derivePath(path, seed).key;
            const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;

            setWallet(prevWallet => {
                  // Create a copy of the current wallet
                  const newWallet = { ...prevWallet };

                  // Initialize the keyPair array if it doesn't exist for the seed
                  if (!newWallet[seed]) {
                        newWallet[seed] = [];
                  }

                  // Add the new key pair to the wallet
                  newWallet[seed].push({
                        privateKey: secret,
                        publicKey: Keypair.fromSecretKey(secret).publicKey.toBase58()
                  });

                  return newWallet;
            });
            console.log(Keypair.fromSecretKey(secret).publicKey.toBase58());
      }

      return (
            <main>
                  <header>
                        <h1 style={{ color: 'white' }}>
                              Crypto Wallet - Kishan
                        </h1>

                        {/* <i className="pi pi-wallet" style={{ fontSize: '5rem' }}></i> */}
                  </header>
                  <div className="content">
                        <Button label="Add Wallet" severity="info" onClick={() => { setVisible(true); createWallet(); }} rounded />
                        <Dialog header="Seed Phrase" visible={visible} style={{ width: '70vw', color: 'black', backgroundColor: 'white', padding: '20px', borderRadius: '10px' }} onHide={() => { if (!visible) return; setVisible(false); }}>
                              <div className="badge-container">
                                    {seedPhrase.map((word, index) => (
                                          <Badge key={index} value={word} />
                                    ))}
                              </div>
                        </Dialog>
                  </div>
                  <div className='content'>
                        <Accordion >
                              {
                                    Object.entries(wallet).map(([seed, keyPairs], i) => (
                                          <AccordionTab
                                                style={{ width: '100vw', padding: '0 100px' }}
                                                key={seed}
                                                header={'Wallet ' + (i + 1)}
                                          >
                                                <div style={{display: 'flex'}}>
                                                      <p className="m-0 ellipsis">Seed: {seed}
                                                      </p>
                                                      <Button icon="pi pi-plus" onClick={() => createKeyPair(seed)} rounded text severity="warning" tooltip="Add New Account" tooltipOptions={{ position: 'bottom', mouseTrack: true, mouseTrackTop: 15 }} />
                                                </div>
                                                <Accordion>
                                                      {keyPairs.map((pair, index) => (
                                                            <AccordionTab key={index} header={index + 1 + '. Account'}>
                                                                  <p className="m-0 ellipsis">Public Key: {pair.publicKey}</p>
                                                                  <p className="m-0 ellipsis">Private Key: {pair.privateKey}</p>
                                                            </AccordionTab>
                                                      ))}
                                                </Accordion>
                                          </AccordionTab>
                                    ))
                              }
                        </Accordion>
                  </div>
            </main>
      )
}

export default App
