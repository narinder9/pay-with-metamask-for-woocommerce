import React, { useState, useEffect } from "react";
import * as wagmiChains from "wagmi/chains";
import Swal from "sweetalert2";
import { fetchBalance } from "@wagmi/core";
import { useAccount, useNetwork,createConfig } from "wagmi";
import ContentLoader from "react-content-loader";
import { ethers } from "ethers";
import { ConnectKitButton, useModal,getDefaultConfig } from "connectkit";

//Component to import network by selected single id
export function importNetworkById(networkId) {
  try {
    const networkName = networkIdToName[networkId];


    // eslint-disable-next-line no-prototype-builtins

    if (wagmiChains[networkName] !== undefined) {
      return wagmiChains[networkName];
    } else {
      throw new Error(
        `Network "${networkName}" is not available in wagmi/chains.`
      );
    }
  } catch (error) {
    console.error("Error importing network:", error);
    return null;
  }
}

//Component to display popup
export const displayPopUp = ({
  msg = false,
  icons = false,
  image = false,
  time = false,
  htmls = false,
  text = false,
  cancelbtn = false,
  showLoader = false,
  outsideClick = false,
  footer = false,
  closeBtn = false,
  confirmText = "Ok",
  endSession = false,
}) => {
  // Close any existing SweetAlert popups
  Swal.close();

  // Define the configuration object for SweetAlert
  const popupConfig = {
    title: msg,
    text: text,
    customClass: {
      container: "cpmwp_main_popup_wrap",
      popup: "cpmwp_popup",
    },
    icon: icons,
    html: htmls,
    showCancelButton: cancelbtn,
    confirmButtonColor: "#3085d6",
    confirmButtonText: confirmText,
    reverseButtons: true,
    imageUrl: image,
    footer: footer,
    timer: time,
    showCloseButton: closeBtn,
    showConfirmButton: false,
    allowOutsideClick: outsideClick,
    denyButtonText: "End Session",
    showDenyButton: endSession,
  };

  // Open SweetAlert popup and optionally show loading spinner
  const object = Swal.fire(popupConfig);
  if (showLoader) {
    Swal.showLoading();
  }

  return object;
};

//Change Switch network message
export const handleSwitchNetworkMessage = (const_msg) => {
  const switchPage = document.querySelector(".sc-dcJsrY div");
  const switchNetworkmsg = document.querySelector(".sc-imWYAI");

  if (
    switchNetworkmsg &&
    switchPage.firstChild.textContent === "Switch Networks"
  ) {
    switchNetworkmsg.textContent = const_msg.switch_network_msg;
  }
};

//Ui component for process order page
export const PaymentUi = ({
  wallet_image,
  connectedWallet,
  const_msg,
  address,
  place_order_btn,
  without_discount,
  currency_symbol,
  in_crypto,
  network_name,
  currency_logo,
  fiatSymbol,
  totalFiat,
  handleTransaction,
  cancelOrder,
}) => {
  return (
    <>
      <div className="cpmw_payment_box">
        <div className="cpmw_p_header">
          <div className="cpmw_p_logo">
            <img src={wallet_image} />
          </div>
          <div className="cpmw_p_title">{connectedWallet}</div>
        </div>
        <div className="cpmw_p_connect">
          <div className="cpmw_p_status">{const_msg.connected}</div>
          <div className="cpmw_p_address">{address}</div>
        </div>
        <div className="cpmw_p_body">
          <div className="cpmw_p_desc">
            {const_msg.pay_with}{" "}
            {without_discount && (
              <del>
                {without_discount} {currency_symbol}{" "}
              </del>
            )}
            {in_crypto} {currency_symbol} {const_msg.through} {network_name}{" "}
            {const_msg.to_complete}
          </div>
          <div className="cpmw_p_info">
            <div className="cpmw_p_amount">
              <img src={currency_logo} />
              {without_discount && (
                <del>
                  {without_discount} {currency_symbol}{" "}
                </del>
              )}
              {in_crypto} {currency_symbol}
              <span>
                ({fiatSymbol}
                {totalFiat})
              </span>
            </div>
            <div className="cpmw_p_network">{network_name} </div>
          </div>
          <div className="cpmw_p_button" onClick={handleTransaction}>
            {place_order_btn}
          </div>
          <div className="cpmw_p_note">
            {const_msg.cancel_order}{" "}
            <a onClick={() => cancelOrder(extradataRest, true)}>
              {const_msg.cancel_this_order}
            </a>{" "}
            {const_msg.create_new_one}
          </div>
        </div>
      </div>
    </>
  );
};



//Transaction rejected popup component
export const TransactionRejected = (rejected_msg, const_msg, wallet_image) => {
  let html = `<div class="cpmw_popup trans_error">
	<div class="cpmw_pp_top">
		<div class="cpmw_pp_logo"><img src="${wallet_image}"/></div>
		<div class="cpmw_pp_title">${rejected_msg}</div>
		<div class="cpmw_pp_desc">${const_msg.rejected_msg}</div>
	</div>
	<div class="cpmw_pp_bottom">
		<div class="cpmw_pp_status">${const_msg.payment_status}</div>
		<div class="cpmw_pp_status_btn">${const_msg.failed}</div>
	</div>
</div>`;
  displayPopUp({ htmls: html, outsideClick: true, time: 1500 });
};
//Validatio popup message
export const ErrorPopupMsg = (rejected_msg, const_msg, wallet_image) => {
  let html = `<div class="cpmw_popup trans_error">
	<div class="cpmw_pp_top">
		<div class="cpmw_pp_logo"><img src="${wallet_image}"/></div>
		<div class="cpmw_pp_title">${rejected_msg}</div>		
	</div>
	<div class="cpmw_pp_bottom">
		<div class="cpmw_pp_status">${const_msg.payment_status}</div>
		<div class="cpmw_pp_status_btn">${const_msg.invalid}</div>
	</div>
</div>`;
  displayPopUp({ htmls: html, outsideClick: true, closeBtn: true });
};


//Payment success popup
export const PaymentSuccessFull = (
	wallet_image,
	payment_msg,	
	const_msg
  ) => {	
	let html = `<div class="cpmw_popup trans_success">
	<div class="cpmw_pp_top">
		<div class="cpmw_pp_logo"><img src="${wallet_image}"/></div>
		<div class="cpmw_pp_title">${payment_msg}</div>
		<div class="cpmw_pp_desc">${const_msg.confirmed_payments_msg}</div>
	</div>
	<div class="cpmw_pp_bottom">
		<div class="cpmw_pp_status">${const_msg.payment_status}</div>
		<div class="cpmw_pp_status_btn">${const_msg.completed}</div>
	</div>
</div>`;
	displayPopUp({ htmls: html });
  };

//Pyament in proccess popup message
export const PaymentInProcess = (
  wallet_image,
  process_msg,
  block_explorer,
  SendData,
  const_msg
) => {
  let html = `<div class="cpmw_popup trans_process">
	<div class="cpmw_pp_top">
		<div class="cpmw_pp_logo"><img src="${wallet_image}"/></div>
		<div class="cpmw_pp_title">${process_msg}</div>
		<div class="cpmw_pp_desc">${const_msg.payment_notice_msg}</div>
		<a href="${block_explorer}tx/${SendData.data?.hash}" target="_blank">${const_msg.check_in_explorer} &#8594;</a>
	</div>
	<div class="cpmw_pp_bottom">
	  <div class="cpmw_pp_status">${const_msg.payment_status}</div>
	  <div class="cpmw_pp_status_btn">${const_msg.in_process}</div>
	</div>
</div>`;
  displayPopUp({ htmls: html });
};
//Confirm transaction popup message
export const ConfirmTransaction = (wallet_image, confirm_msg, const_msg) => {
  let html = `<div class="cpmw_popup">
	<div class="cpmw_pp_top">
		<div class="cpmw_pp_logo"><img src="${wallet_image}"/></div>
		<div class="cpmw_pp_title">${confirm_msg}</div>
		<div class="cpmw_pp_desc">${const_msg.notice_msg}</div>
	</div>
	<div class="cpmw_pp_bottom">
		<div class="cpmw_pp_status">${const_msg.payment_status}</div>
		<div class="cpmw_pp_status_btn">${const_msg.pending}</div>
	</div>
</div>`;
  displayPopUp({ htmls: html });
};

//Fetch balance based on selected currency
export const FetchBalance = (props) => {  
  const {isConnected, address } = useAccount();
  const { open } = useModal();
  const { chain } = useNetwork();
  const [balance, setBalance] = useState(null);
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const selectedGateway = document.querySelector(
    'input[name="payment_method"]:checked'
  )?.value;
  const placeOrderButton = document.querySelector("button#place_order");

  const fetchDecimalBalance = async () => {
    try {    
      const contractAddress = props.data.networkResponse.contract_address[props.data.networks.id];  
      const result = await fetchBalance({
        address: address,
        token:contractAddress || false,
      });     
      setBalance(result);
    } catch (error) {
      // Handle errors gracefully
    }
  };
  useEffect(() => {
    setBalance(null);
    if (isConnected) {  
        fetchDecimalBalance();      
    }
  }, [isConnected, chain?.id, props.data.networkResponse.contract_address, props.data.networks.id]);



  useEffect(() => {
    if (selectedGateway === "cpmw") {
      setTimeout(() => {
        if (balance && isConnected&&!open) {
          const isInsufficient =
            parseFloat(balance.formatted) <
            parseFloat(props.data.currentprice.rating);          
          setInsufficientBalance(isInsufficient);
          placeOrderButton.disabled = isInsufficient;
        } else {        
          setInsufficientBalance(false);
          placeOrderButton.disabled = true;
        }
      }, 100);
    } else {
      setInsufficientBalance(false);
      placeOrderButton.disabled = false;
    }
  }, [
    selectedGateway,
    balance,
    isConnected,
    placeOrderButton,
  ]);
 
  return (
    <>
      {isConnected ? (
        balance !== null ? (
          <>
            {!insufficientBalance&&!open && (
              <div className="cpmwp_payment_notice">
                {props.const_msg.payment_notice}
              </div>
            )}
            {insufficientBalance&&!open && (
              <div className="cpmwp_insufficient_blnc">
                {props.const_msg.insufficent}
              </div>
            )}
            {open &&<Loader loader={1} width={250} />}
            <input
              name="current_balance"
              type="hidden"
              value={balance.formatted}
            />
            <input
              type="hidden"
              name="cpmwp_crypto_wallets"
              value="ethereum"
            />
          </>
        ) : (
          <Loader loader={1} width={250} />
        )
      ) : null}
    </>
  );
};
//Loader component
export function PaymentLoader() {
	return <div class="ccpwp-card">
	<div class="ccpwp-card__image ccpwp-loading"></div>
	<div class="ccpwp-card__title ccpwp-loading"></div>
	<div class="ccpwp-card__description ccpwp-loading"></div>
  </div>;
  }

//Loader component
export function Loader(props) {
  return [...Array(props.loader)].map((object, i) => {
    return (
      <ContentLoader
        key={i}
        height={40}
        width={1000}
        speed={2}
        style={{ width: "100%" }}
        backgroundColor={"#d9d9d9"}
        foregroundColor={"#ecebeb"}
      >
        <rect x="30" y="15" rx="4" ry="4" width="20" height="12.8" />
        <rect x="64" y="13" rx="6" ry="6" width="80%" height="18" />
      </ContentLoader>
    );
  });
}

//Generate transaction response data
export const getDynamicTransactionData = (
  details,
  Chainid,
  currency_symbol
) => {
  if (details.input != undefined && details.input != "0x") {
    // Parse the input data to extract the function signature and parameters
    const iface = new ethers.utils.Interface([
      "function transfer(address to, uint256 value)",
    ]);
    const parsedData = iface.parseTransaction({ data: details.input });
    if (parsedData.name === "transfer" && parsedData.args.length === 2) {
      const sentAmount = parsedData.args[1];
      return {
        amount: ethers.utils.formatEther(sentAmount),
        recever: parsedData.args[0],
        hash: details.hash,
        from: details.from,
        chainId: Chainid,
        token_address: details.to,
      };
    }
  } else {
    return {
      amount: ethers.utils.formatEther(details.value),
      recever: details.to,
      hash: details.hash,
      from: details.from,
      chainId: Chainid,
      token_address: currency_symbol,
    };
  }
};

//Connectkit custom connect button
export const CustomConnectButton = ({ const_msg }) => {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, truncatedAddress, ensName, address }) => (
        <>
     
          <div onClick={show} className="cpmwp-connect-button">
            {isConnected
              ? ensName ?? truncatedAddress
              : const_msg
              ? const_msg.connect_wallet
              : "Connect Wallet"}
          </div>
        </>
      )}
    </ConnectKitButton.Custom>
  );
};
export const createCustomConfig = (decimalchainId,) => {
	// Modify the default configuration based on props
	const customConfig = getDefaultConfig({	
	  //alchemyId: 'vE0lCPXbzgBGR3sU4Y68JHmBNsDYBf7S', // or infuraId
  //  walletConnectProjectId: 'ceaf5fd4fffbd074191feccca6bbb761',
	  appName: "Pay With Metamask",
	  chains: [importNetworkById(decimalchainId)],
	  appDescription: window.location.host,
	  appUrl:window.location.host,
	  appIcon: "https://family.co/logo.png",
	});
  
	if (customConfig) {
	  const connectors = [];
  

		connectors.push("metaMask"); 

  
	  const newConnector = customConfig.connectors.filter((item) => {
		if (connectors.includes(item.id)) {		
		  return connectors.includes(item.id);
		}
	  });
	  
	  customConfig.connectors = newConnector;
  
	  return createConfig(customConfig);
	}
  };


//Supported wagmi chains name
export const networkIdToName = { 
  11155111: "sepolia",
  1: "mainnet", 
  5: "goerli",
  97: "bscTestnet", 
  56: "bsc",
};
