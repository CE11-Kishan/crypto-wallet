/* eslint-disable @typescript-eslint/no-unused-vars */
import { Dialog } from 'primereact/dialog';
import './App.css'
import { Button } from 'primereact/button';
import { useRef, useState } from 'react';
import nacl from "tweetnacl";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";

import { Badge } from 'primereact/badge';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Toast } from 'primereact/toast';
import { RadioButton } from 'primereact/radiobutton';

type Wallet = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [seed: string]: { publicKey: string; privateKey: any; walletType: string }[];
}



function App() {
      const [visible, setVisible] = useState(false);
      const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
      const [wallet, setWallet] = useState<Wallet>({});
      const [blockchain, setBlockchain] = useState<string>('0');
      const toast = useRef(null);

      const createWallet = async () => {
            const mnemonic = await generateMnemonic();
            setSeedPhrase(mnemonic.split(' '));
            const seed = await mnemonicToSeedSync(mnemonic).toString('hex');
            createKeyPair(seed)
            //setBlockchain(undefined);
      };

      const createKeyPair = async (seed: string) => {
            const size = Object.keys(wallet).length + 1;
            const path = `m/44'/${blockchain}'/${size}'/0'`; // This is the derivation path
            const derivedSeed = await derivePath(path, seed).key;
            const secret = await nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;

            await setWallet(prevWallet => {
                  // Create a copy of the current wallet
                  const newWallet = { ...prevWallet };

                  // Initialize the keyPair array if it doesn't exist for the seed
                  if (!newWallet[seed]) {
                        newWallet[seed] = [];
                  }

                  // Add the new key pair to the wallet
                  newWallet[seed].push({
                        privateKey: secret,
                        publicKey: Keypair.fromSecretKey(secret).publicKey.toBase58(),
                        walletType: blockchain
                  });

                  return newWallet;
            });
      }

      const copyToClipboard = (phrase: string) => {
            navigator.clipboard.writeText(phrase);
            toast.current.show({ severity: 'info', summary: 'Info', detail: 'Seed Phrase Copied To Clipboard. !!!' });
      }
      
      const getBlockchainBadge = (blockchain: string) => {
            switch (blockchain){
                  case '0': return ['info', 'BITCOIN'];
                  case '60': return ['danger', 'ETHEREUM'];
                  case '501': return ['success', 'SOLANA'];
            }
      }


      return (
            <main>
                  <Toast ref={toast} />
                  <header>
                        <h1 style={{ color: 'white' }}>
                              Crypto Wallet - Kishan
                        </h1>

                        {/* <i className="pi pi-wallet" style={{ fontSize: '5rem' }}></i> */}
                  </header>
                  <div className="content">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <div style={{ display: 'flex', margin: '20px', gap: '20px' }}>
                                    <div className="flex align-items-center">
                                          <RadioButton inputId="solana" name="blockchain" value="501" onChange={(e) => setBlockchain(e.value)
                                          } checked={blockchain === '501'} />
                                          <label htmlFor="solana" className="ml-2">Solana</label>
                                    </div>
                                    <div className="flex align-items-center">
                                          <RadioButton inputId="bitcoin" name="blockchain" value="0" onChange={(e) => setBlockchain(e.value)} checked={blockchain === '0'} />
                                          <label htmlFor="bitcoin" className="ml-2">Bitcoin</label>
                                    </div>
                                    <div className="flex align-items-center">
                                          <RadioButton inputId="eth" name="blockchain" value="60" onChange={(e) => setBlockchain(e.value)} checked={blockchain === '60'} />
                                          <label htmlFor="eth" className="ml-2">Ethereum</label>
                                    </div>
                              </div>
                              <Button label="Add Wallet" severity="info" onClick={() => { setVisible(true); createWallet(); }} rounded />
                        </div>

                        <Dialog draggable={false} header="Seed Phrase" visible={visible} style={{ width: '100vw', height: '100vh', margin: '100px', color: 'black', backgroundColor: 'white', padding: '20px', borderRadius: '10px' }} onHide={() => { if (!visible) return; setVisible(false); }}>

                              <div className="badge-container">
                                    {seedPhrase.map((word, index) => (
                                          <Badge size={'xlarge'} key={index} value={word} />
                                    ))}

                                    {seedPhrase.length > 0 ? <Button style={{ display: 'flex', margin: 'auto', marginTop: '20px' }} onClick={() => copyToClipboard(seedPhrase.join(' '))} label="Copy" icon='pi pi-copy' severity="danger" rounded /> : ''}
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
                                                header={() => (
                                                      <span style={{display: 'flex'}}> 
                                                          <Badge 
                                                              value={(i+1)  + '. '+ getBlockchainBadge(wallet[seed][0]['walletType'])[1] + ' Wallet'} 
                                                              severity={getBlockchainBadge(wallet[seed][0]['walletType'])[0]} 
                                                          />
                                                      </span>
                                                  )}
>
                                                <div style={{ display: 'flex' }}>
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
