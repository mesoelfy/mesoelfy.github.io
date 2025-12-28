import { Globe, AlertTriangle, Clock, Coins, CheckCircle2, Fingerprint } from 'lucide-react';

export const ENSGuide = () => {
  return (
    <div className="mt-8 border-t border-white/10 pt-8 animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-primary-green font-header font-black tracking-widest text-xl">
            // MANUAL_02: IDENTITY_ACQUISITION
        </h3>
        <span className="text-sm font-mono text-primary-green-dim border border-primary-green-dim/30 px-3 py-1 rounded">
            READ_TIME: 4 MIN
        </span>
      </div>

      <div className="space-y-12 text-base font-mono text-gray-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-6 scrollbar-thin scrollbar-thumb-primary-green/20">
        
        {/* INTRODUCTION */}
        <div className="bg-white/5 p-8 border-l-4 border-white/20 rounded-r-lg">
            <h4 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                <Fingerprint size={24} /> THE SINGULARITY GRAB
            </h4>
            <p className="mb-4">
                <strong>ENS (Ethereum Name Service)</strong> is the phonebook of the future internet. 
                It turns that long, spicy &quot;0x773...&quot; string into a human name like <span className="text-white">mesoelfy.eth</span>.
            </p>
            <p className="text-white/80">
                We are approaching an AI singularity. Soon, billions of agents will need wallets. 
                Securing your unique handle <strong>now</strong> (for $5) is like buying a .com domain in 1995. 
                It is street cred that proves you were here early.
            </p>
        </div>

        {/* PREREQUISITES */}
        <div className="bg-alert-yellow/10 border-l-4 border-alert-yellow p-6 text-alert-yellow relative overflow-hidden rounded-r-lg">
            <h4 className="font-bold text-xl mb-3 flex items-center gap-3 relative z-10">
                <AlertTriangle size={24} /> PREREQUISITES
            </h4>
            <ul className="list-disc pl-5 space-y-2 opacity-90 relative z-10">
                <li>
                You need ETH to obtain your ENS.
                </li>
                <li>
                    <strong>Network:</strong> While purchasing your ETH on Coinbase, you will see a list of networks. 
                    You might be tempted to choose &quot;Base&quot; for $0.00 instead of &quot;Ethereum (default)&quot; for $0.06. 
                    <br/><span className="text-white font-bold bg-black/20 px-1">STOP.</span> To buy the ENS, you must have ETH on the <strong>Ethereum Mainnet</strong>.
                </li>
                <li>
                    <strong>Buffer:</strong> If transferring your max total balance from Coinbase, ensure you leave at least $1.00 behind, or Coinbase will block the transfer saying &quot;add at least $1.00 to cover the network fee.&quot;
                </li>
            </ul>
        </div>

        {/* STEP 1: SEARCH & CONNECT */}
        <div>
          <h4 className="text-white font-bold text-2xl mb-4 flex items-center gap-3 border-b border-white/10 pb-2">
            <Globe size={24} className="text-service-cyan" /> 
            1. THE REGISTRAR
          </h4>
          <div className="bg-black/40 p-6 border border-service-cyan/20 rounded">
              <strong className="text-service-cyan block mb-3 text-lg">ACTION:</strong>
              <ol className="list-decimal pl-6 space-y-4">
               <li>Go to: <strong className="text-white">app.ens.domains</strong></li>
               <li>In <strong>Search for a name</strong> (center of screen) → Type <strong>yourname</strong>.</li>
               <li>Search for your handle (e.g. <em>yourname.eth</em>).</li>
               <li>Select how many years you want.</li>
               <li>Open up Rainbow in your browser extensions. </li>
               <li>Go to "Connected Apps" in the top left drop down menu in Rainbow and add ENS</li>
               <li>You may need to refresh. Make sure the Rainbow extension is open. The ENS site will show "Rainbow Installed" and let you continue with the purchase using your ETH.</li>
               <li>You'll be asked to choose a profile picture and banner. You can skip for now. Each will cost about $.01 to upload. If you do it now make sure to click the "sign" button that pops up in the Rainbow extension.</li>
              </ol>
          </div>
        </div>

        {/* STEP 2: THE TRANSACTION FLOW */}
        <div>
          <h4 className="text-white font-bold text-2xl mb-4 flex items-center gap-3 border-b border-white/10 pb-2">
            <Clock size={24} className="text-white" /> 
            2. SIGNING
          </h4>
          <p className="mb-6 text-lg">
            Almost done! Next is a multi-step handshake with the blockchain.
          </p>
          
          <div className="space-y-8 bg-black/60 p-8 border border-white/10 rounded">
              
              {/* SUB-STEP 1 */}
              <div className="flex gap-6">
                  <div className="flex-none w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-xl">1</div>
                  <div>
                      <strong className="block text-white text-lg">Request to Register</strong>
                      <p className="text-gray-400 mt-1">
                       Complete the transaction to begin the timer.
                      </p>
                  </div>
              </div>

              {/* SUB-STEP 2 */}
              <div className="flex gap-6">
                  <div className="flex-none w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-xl">2</div>
                  <div>
                      <strong className="block text-white text-lg">The 60-Second Wait</strong>
                      <p className="text-gray-400 mt-1">
                        A progress bar will fill up. You must wait. You may have to wait a minute even after the bar is full.
                      </p>
                  </div>
              </div>

              {/* SUB-STEP 3 */}
              <div className="flex gap-6">
                  <div className="flex-none w-10 h-10 rounded-full bg-primary-green/20 text-primary-green flex items-center justify-center font-bold text-xl">3</div>
                  <div>
                      <strong className="block text-primary-green text-lg">Register (The Purchase)</strong>
                      <div className="text-gray-400 mt-2 space-y-2 text-sm">
                       <p> You will be asked to complete a second transaction to secure your name. Nothing extra and unforseen is being charged. Don't worry. You'll see the loading bar process a second time.</p>
                        <p>Rainbow will pop up with a detailed confirmation screen:</p>
                        <div className="p-3 bg-black border border-white/20 rounded font-mono text-xs">
                            Simulated Result - Sent ~$10.00<br/>
                            Received 1 NFT<br/>
                            Chain: Ethereum, App: ENS<br/>
                            Est Fee: ~$0.03
                        </div>
                        <p>Click &quot;Sign&quot; to acknowledge.</p>
                        <p><strong>Total Cost:</strong> About $10.03 for 2 years of ownership. Then you'll get a screen that says...</p>
                      </div>
                  </div>
              </div>

              {/* FINALE */}
              <div className="pt-4 border-t border-white/10 text-center">
                  <p className="text-white font-bold text-lg animate-pulse">
                    ...Processing...
                  </p>
                  <p className="text-primary-green font-black text-2xl mt-2">
                    &quot;CONGRATULATIONS!&quot;
                  </p>
                  <p className="text-gray-500 text-sm">
                    You are now the owner of [name].eth
                  </p>
              </div>
          </div>
        </div>

        {/* STEP 3: REVERSE RECORD & CONCEPT */}
        <div className="bg-gradient-to-r from-primary-green/10 to-transparent p-8 border-l-4 border-primary-green rounded-r-lg">
            <h4 className="text-primary-green font-bold text-xl mb-4 flex items-center gap-3">
                <CheckCircle2 size={32} /> FINAL BOSS: REVERSE RECORD
            </h4>
            
            <div className="mb-6 space-y-4 text-base">
                <div>
                    <strong className="text-white block">The Concept:</strong> 
                    <span className="text-gray-400"> Your domain is technically a &quot;Non-Fungible Token&quot; (ERC-721).</span>
                </div>
                <div>
                    <strong className="text-white block">The Practicality:</strong> 
              <span className="text-gray-400"> You now own an NFT, and it isn't worthless! YOU <em>own</em> it. GoDaddy can&apos;t take it away from you. You can trade it, sell it, or transfer it just like a digital trading card.</span>
                </div>
            </div>

            <div className="bg-black/40 p-6 border border-primary-green/20 rounded">
                <strong className="text-white block mb-2 text-lg">THE LAST STEP:</strong>
                <ul className="list-disc pl-6 space-y-2 text-base">
                    <li>Go to &quot;My Profile&quot; on ENS.</li>
                    <li>Find <strong>&quot;Primary Name&quot;</strong>.</li>
                    <li>Select your new name from the dropdown and click <strong>Save</strong>.</li>
                    <li>Sign one last time in Rainbow.</li>
                </ul>
            </div>
            <p className="mt-8 text-xl italic text-white text-center font-header">
                You are now one step closer to sovereignty.
                <br/>
                <span className="text-sm opacity-60 font-mono not-italic">Welcome to the weird world of Web3. Please let me know if any details need to be updated to inform others reading this guide.</span>
            </p>
        </div>

      </div>
    </div>
  );
};
