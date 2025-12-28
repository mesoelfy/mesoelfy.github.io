import { ShieldAlert, Download, CreditCard, ArrowRight, Wallet, Lock, Globe, Webcam } from 'lucide-react';

export const CryptoGuide = () => {
  return (
    <div className="mt-8 border-t border-white/10 pt-8 animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-primary-green font-header font-black tracking-widest text-xl">
            // MANUAL_01: SELF_CUSTODY_PROTOCOL
        </h3>
        <span className="text-sm font-mono text-primary-green-dim border border-primary-green-dim/30 px-3 py-1 rounded">
            READ_TIME: 6 MIN
        </span>
      </div>

      <div className="space-y-12 text-base font-mono text-gray-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-6 scrollbar-thin scrollbar-thumb-primary-green/20">
        
        {/* INTRODUCTION: THE ETHOS */}
        <div className="bg-white/5 p-8 border-l-4 border-white/20 rounded-r-lg">
            <h4 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                <Globe size={24} /> THE PHILOSOPHY: SOVEREIGNTY
            </h4>
            <p className="mb-4">
                A crypto wallet is a tool for total digital ownership. 
                It grants you a bank account that exists outside of traditional gatekeepers. 
                It is ID-free, permissionless, and open to anyone with an internet connection.
            </p>
            <p className="text-white/80">
                It is the raw internet of value. You are the admin.
            </p>
        </div>

        {/* STEP 1: THE VAULT */}
        <div>
            <h4 className="text-service-cyan font-bold text-2xl flex items-center gap-3 border-b border-service-cyan/30 pb-4 mb-6">
                <Download size={28} /> STEP 1: THE DIGITAL VAULT
            </h4>
            
            <div className="grid grid-cols-1 gap-8">
                <div>
                    <div className="mb-6 space-y-4 text-gray-400">
                        <p>
                            I am using <strong>Rainbow Wallet</strong>. It seems fine so far. Gemini recommended it for being designed well aesthetically.
                            Unlike an Exchange (Coinbase), Rainbow is &quot;Self-Custody.&quot; You own the keys, you own the coins. <em>(FYI, you&apos;ll be prompted by both platforms to create a secure password.)</em>
                        </p>
                        <p>
                            You ever hear about the darknet black market site <strong>The Silk Road</strong>? The government raided an admin&apos;s home and got full access to the site. Many users were storing their money on their Silk Road site wallet and those bastards drained everyone&apos;s wallets bone dry. Funny story. And then they kept running the site and stole everyone&apos;s money again on the one year anniversary!
                        </p>
                        <p>
                            That is the danger of leaving your money in Coinbase instead of transferring it to your own pocket. Sure would suck if the gov pulled a false flag pretending to be AI and stole everyone&apos;s money, as is their modus operandi.
                        </p>
                        <p>
                            Game developers who make sexual content get banned from payment processors. And don&apos;t forget about Alex Jones being banned from PayPal for not cowtowing to a particular narrative. You feel me?
                        </p>
                    </div>

                    <div className="bg-black/40 p-6 border border-service-cyan/20 rounded">
                        <strong className="text-service-cyan block mb-3 text-lg">ACTION:</strong>
                        <ol className="list-decimal pl-5 space-y-2 text-white">
                            <li>Install the <strong>Rainbow Browser Extension</strong>.</li>
                            <li>Click &quot;Create a new wallet&quot;.</li>
                        </ol>
                    </div>
                </div>
                
                {/* SECURITY COLUMN */}
                <div className="bg-critical-red/10 p-6 border border-critical-red/40 text-critical-red rounded relative">
                    <div className="flex items-center gap-3 font-bold mb-4 text-lg">
                        <ShieldAlert size={24} /> SECURITY IMPERATIVE
                    </div>
                    <div className="space-y-4 text-sm font-mono opacity-90">
                        <p className="text-white font-bold text-base">
                            You will see 12 Words. This is the &quot;KEY&quot; to your bank vault.
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>
                                <strong>THE RISK:</strong> Humans using AI tools (or autonomous agents) may eventually gain access to your computer or cloud accounts in unforeseen ways.
                                If you save these words in your &quot;DOCUMENTS&quot; folder or Dropbox, your money is vulnerable.
                            </li>
                            <li>
                                <strong>THE SOLUTION:</strong> Write it on <strong>PAPER</strong>. Store it with your passport, gold, and birth certificate.
                                <br/>
                                <em>(Pro Tip: Don&apos;t hide it so well that you can&apos;t find it yourself.)</em>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        {/* STEP 2: THE ONRAMP */}
        <div>
            <h4 className="text-alert-yellow font-bold text-2xl flex items-center gap-3 border-b border-alert-yellow/30 pb-4 mb-6">
                <CreditCard size={28} /> STEP 2: THE FIAT BRIDGE
            </h4>
            
            <p className="mb-4 text-lg text-white">
                To turn government money (Dollars) into Freedom Money (ETH), you need a regulated exchange.
            </p>

            <div className="bg-black/40 p-6 border border-white/10 rounded space-y-6">
                <div className="space-y-2">
                    <strong className="text-alert-yellow text-lg block">1. CREATE ACCOUNT</strong>
                    <p>Sign up for <strong className="text-white">Coinbase</strong> (easiest).</p>
                </div>

                <div className="space-y-2">
                    <strong className="text-alert-yellow text-lg flex items-center gap-2">
                        <Webcam size={18} /> 2. VERIFY HUMANITY
                    </strong>
                    <p>
                        To enable purchasing crypto, you will need to verify your ID, Social Security number, and tax information. 
                        <br/>
                        <span className="text-white bg-alert-yellow/20 px-1">NOTE:</span> You are not allowed to upload a JPEG you took yourself. 
                        A device with a camera is required to scan your ID live. All exchanges demand this. It is what it is.
                    </p>
                </div>

                <div className="space-y-2">
                    <strong className="text-alert-yellow text-lg block">3. BUY FUEL</strong>
                    <p>
                        Purchase <strong>$10.00 of Ethereum (ETH)</strong>.
                    </p>
                    <p className="text-xs text-gray-500 italic">
                        This is a low-risk exploration cost. Enough to buy an ENS name, pay the network fees, and finally check off &quot;learn how to buy crypto&quot; from your mental TODO list.
                    </p>
                </div>
            </div>
        </div>

        {/* STEP 3: THE TRANSFER */}
        <div>
            <h4 className="text-primary-green font-bold text-2xl flex items-center gap-3 border-b border-primary-green/30 pb-4 mb-6">
                <ArrowRight size={28} className="text-primary-green" /> 
                STEP 3: THE TRANSFER
            </h4>
            
            <div className="bg-black/60 p-8 border border-white/10 rounded">
                <p className="mb-6 text-gray-400">
                    Now we move the funds from the &quot;Bank&quot; (Coinbase) to your &quot;Pocket&quot; (Rainbow).
                </p>
                <ol className="list-decimal pl-6 space-y-6 text-base">
                    <li>
                        Open your Rainbow Extension → Click the <strong className="text-white bg-white/10 px-2 py-0.5 rounded">Copy Address</strong> button (starts with 0x...).
                    </li>
                    <li>
                        Go to Coinbase → Select <strong className="text-white">Send</strong>.
                    </li>
                    <li>
                        Paste your address.
                    </li>
                    <li className="pt-2">
                        <div className="grid grid-cols-1 gap-6">
                            
                            {/* OPTION A */}
                            <div className="p-4 border border-white/20 rounded bg-white/5 opacity-60 hover:opacity-100 transition-opacity">
                                <strong className="text-white block mb-1 text-lg">OPTION A: BASE (Layer 2)</strong>
                                <span className="text-sm text-primary-green font-bold block mb-2">Cost: ~$0.00</span>
                                <p className="text-sm text-gray-400">
                                    Select &quot;Base&quot; network. Use this for tipping creators or holding funds cheaply.
                                </p>
                            </div>

                            {/* OPTION B - EMPHASIZED */}
                            <div className="p-6 border-2 border-alert-yellow bg-[repeating-linear-gradient(45deg,rgba(234,231,71,0.05),rgba(234,231,71,0.05)_10px,transparent_10px,transparent_20px)] rounded relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-alert-yellow text-black text-xs font-bold px-3 py-1">
                                    ADVANCED
                                </div>
                                <strong className="text-alert-yellow block mb-1 text-lg">OPTION B: ETHEREUM (Mainnet)</strong>
                                <span className="text-sm text-white font-bold block mb-2">Cost: ~$0.06</span>
                                <p className="text-sm text-gray-300">
                                    Select &quot;Ethereum&quot; network. 
                                    <br/><br/>
                                    <span className="text-alert-yellow font-bold">REQUIRED</span> if you plan to buy an .ETH domain name like mine. 
                                    You cannot buy a domain with the Base ETH network (yet).
                                </p>
                            </div>

                        </div>
                    </li>
                </ol>
            </div>
        </div>

        {/* STEP 4: INTERACTION */}
        <div>
            <h4 className="text-latent-purple font-bold text-2xl flex items-center gap-3 border-b border-latent-purple/30 pb-4 mb-6">
                <Wallet size={28} className="text-latent-purple" /> 
                STEP 4: INTERACT
            </h4>
            
            <p className="mb-6">
                Your wallet is now funded. You can send money to anyone in the world instantly, without permission.
            </p>
            <div className="flex items-center gap-6 p-6 bg-latent-purple/10 border border-latent-purple/30 rounded">
                <Lock size={32} className="text-latent-purple shrink-0" />
                <span className="text-lg">
                    To support this project, simply click &quot;Send&quot; in Rainbow and paste: <strong className="text-white text-xl mx-2">mesoelfy.eth</strong>
                </span>
            </div>
        </div>

      </div>
    </div>
  );
};
