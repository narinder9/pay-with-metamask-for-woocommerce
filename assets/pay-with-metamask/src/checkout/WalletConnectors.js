import React, { useState, useEffect } from "react";
import {
  WagmiConfig,
  createConfig,
  useNetwork,
  useAccount,
  useDisconnect,
} from "wagmi";
import { ConnectKitProvider, getDefaultConfig, useModal } from "connectkit";
import {
  FetchBalance,
  CustomConnectButton
} from "../component/helper";

const {const_msg,networkName } = connect_wallts;
const BalanceAndConnect = ({ currentchain }) => {
  const [triggered, setTriggered] = useState(false);
  const { chain } = useNetwork();
  const { open, setOpen } = useModal();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  useEffect(() => {
    if (chain?.id === currentchain.networks.id) {
      setOpen(false);
    }
    if(!open){
      setTriggered(false)
    }
  }, [chain?.id,open]);
 

  if (open) {
    const switchPage = document.querySelector(".sc-dcJsrY div");
    const switchNetworkmsg = document.querySelector(".sc-imWYAI");
    const triggerWallet = document.querySelector("#__CONNECTKIT__ button.sc-bypJrT");
  if(triggerWallet&&!triggered){
    triggerWallet.click();
    setTriggered(true)
  }
    if (
      switchNetworkmsg &&
      switchPage.firstChild.textContent == "Switch Networks"
    ) {
      switchNetworkmsg.textContent = const_msg.switch_network_msg;
    }
  }


  return (
    <>
    {!isConnected && <div class="cpmw_selected_wallet"><div className="cpmw_p_network"><strong>{const_msg.select_network}:</strong>{networkName}</div></div>}
      {chain && isConnected && (
        <>
          <div class="cpmw_p_connect">
            <div class="cpmw_p_status">{const_msg.connected}</div>
            <div
              className="cpmw_disconnect_wallet"
              onClick={() => {
                disconnect();
              }}
            >
              {const_msg.disconnect}
            </div>
          </div>
          <div class="cpmw_p_info">
            <div class="cpmw_address_wrap">
              <strong>{const_msg.wallet}:</strong>
              <span className="cpmw_p_address">{address}</span>
            </div>
            <div class="cpmw_p_network">
              <strong>{const_msg.network}:</strong>{" "}
              {currentchain.networkResponse.decimal_networks[chain?.id]
                ? currentchain.networkResponse.decimal_networks[chain?.id]
                : chain.name}
            </div>
          </div>
        </>
      )}

      <FetchBalance data={currentchain} const_msg={const_msg} />
      {!isConnected && <CustomConnectButton const_msg={const_msg} />}
    </>
  );
};

const createCustomConfig = (props) => {
  // Modify the default configuration based on props
  const customConfig = getDefaultConfig({ 
    //alchemyId: 'vE0lCPXbzgBGR3sU4Y68JHmBNsDYBf7S',
    //walletConnectProjectId: 'ceaf5fd4fffbd074191feccca6bbb761',
    appName: props.appName,
    chains: [props.chains],
    appDescription: props.appDescription,
    appUrl: props.appUrl,
    appIcon: props.appIcon,
  });

  if (customConfig) {
    const connectors = [];
 
    connectors.push("metaMask");


    //Elements to remove: 'metaMask', 'walletConnect', 'coinbaseWallet', 'injected'
    const newConnector = customConfig.connectors.filter((item) => {
      if (connectors.includes(item.id)) {      
        return connectors.includes(item.id);
      }
    });

    customConfig.connectors = newConnector;

    return createConfig(customConfig);
  }
};

const App = (props) => {
  try {
    const [config, setConfig] = useState(null);

    useEffect(() => {
      // Define props to be passed to the config
      const configProps = {
        //walletConnectProjectId: ccpw_wc_id,
        appName: "Pay With Metamask",
        appDescription: window.location.host,
        chains: props.networks,
        appUrl: window.location.host, // your app's URL
        appIcon: "https://family.co/logo.png", // your app's icon URL
        // Add other props as needed
      };
      setConfig(createCustomConfig(configProps));
    }, [props.networks]);

    return (
      <>
        {config && props.networks && (
          <WagmiConfig config={config}>
            <ConnectKitProvider
              options={{
                hideBalance: true,             
                hideQuestionMarkCTA:true,
              }}
              mode="auto"
            >
              <BalanceAndConnect currentchain={props} />
            </ConnectKitProvider>
          </WagmiConfig>
        )}
      </>
    );
  } catch (error) {
    console.log(error);
  }
};

export default App;
