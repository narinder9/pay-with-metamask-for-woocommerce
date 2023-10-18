import React, { useState, useEffect } from 'react';
import { WagmiConfig,useAccount} from 'wagmi';
import {ConnectKitProvider,useModal} from 'connectkit';
import { handleSwitchNetworkMessage} from '../component/helper';
import SendnativeCurrency from './sendNativeCurrency';
import SendToken from './sendToken';
import {createCustomConfig} from '../component/helper';
import {cancelOrder} from '../component/handelRestApi';
const {const_msg,currency_symbol,token_address,wallet_image,decimalchainId,place_order_btn,connectedWallet,
	without_discount,network_name,in_crypto,fiatSymbol,currency_logo,totalFiat} = extradataRest;

  const Checkcurrency=()=>{
	const { isConnected} = useAccount();
	const { open,setOpen} = useModal();
	if(isConnected){
		if(open){
			handleSwitchNetworkMessage(const_msg)
		}
	if (token_address) {
		return <SendToken/>
	}
	else{
		return <SendnativeCurrency/>
	}
	}
	else{
		return (<>	
	    <div class="cpmw_payment_box">
        <div class="cpmw_p_header">
            <div class="cpmw_p_logo"><img src={wallet_image}/></div>
            <div class="cpmw_p_title">{connectedWallet}</div>
        </div>
        <div class="cpmw_p_connect">
            <div class="cpmw_p_status no_connect">{const_msg.not_connected}</div>
            <div class="cpmw_p_address" ><a className='cpmwp-connect-button' onClick={() => setOpen(true)}>{const_msg.connect_wallet} &#8594;</a></div>
        </div>
        <div class="cpmw_p_body">
		<div className="cpmw_p_desc">{const_msg.pay_with} {without_discount&&(<del>{without_discount} { currency_symbol } </del>)}
				 				{ in_crypto } { currency_symbol } {const_msg.through} {network_name } {const_msg.to_complete}</div>
            <div className="cpmw_p_info">
                <div className="cpmw_p_amount"><img src={currency_logo}/>{without_discount&&(<del>{without_discount} { currency_symbol } </del>)}
				 				{ in_crypto } { currency_symbol }<span>({ fiatSymbol }{ totalFiat })</span></div>
                <div class="cpmw_p_network">{network_name}</div>
            </div>
            <div class="cpmw_p_button no_connect" title="Connect Wallet!">{place_order_btn}</div>
            <div class="cpmw_p_note">{const_msg.cancel_order} <a onClick={()=> cancelOrder(extradataRest,true) }>{const_msg.cancel_this_order}</a> {const_msg.create_new_one}</div>
        </div>
    </div>
	
	</>)
	}
  }
  
 
const App = ( props ) => {
	const [ config, setConfig ] = useState( null );
	useEffect( () => {
		setConfig( createCustomConfig(decimalchainId));
	}, [] );

	return (
		<>
			{ config && (
				<WagmiConfig config={ config }>
					<ConnectKitProvider
						options={ {
							hideQuestionMarkCTA:true,
							hideBalance: true,
						} }
						mode="auto"
					>
						<Checkcurrency />
					</ConnectKitProvider>
				</WagmiConfig>
			) }
		</>
	);
};
export default App;

