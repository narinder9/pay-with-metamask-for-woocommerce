import React, { useState, useEffect } from "react";
import {
  usePrepareSendTransaction,
  useSendTransaction,
  useWaitForTransaction,
  useAccount,
  useTransaction,
  useNetwork,
} from "wagmi";
import { parseEther } from "viem";
import {
  displayPopUp,
  getDynamicTransactionData, 
  PaymentInProcess,
  ConfirmTransaction,
  PaymentUi,
  handleSwitchNetworkMessage,
  PaymentLoader
} from "../component/helper";
import {
  restApiSaveTransaction,
  restApiConfirmTransaction,
  cancelOrder,
} from "../component/handelRestApi";
import { useModal } from "connectkit";

const SendTransaction = () => {
  const {
    receiver,
    in_crypto,
    process_msg,
    wallet_image,
    const_msg,
    block_explorer,
    is_paid,
    order_status,
    currency_symbol,
    connectedWallet,
    confirm_msg,
    place_order_btn,
    currency_logo,
    fiatSymbol,
    network_name,
    totalFiat,
    without_discount,
    decimalchainId, // Add the correct network here
  } = extradataRest;

  const [getSaveResponse, setSaveResponse] = useState(null);
  const [runOnce, setRunOnce] = useState(null);
  const [rejectedTransaction, setRejectedTransaction] = useState(null);
  const { open, setOpen } = useModal();
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { config } = usePrepareSendTransaction({
    to: receiver,
    value: parseEther(in_crypto),
  });
 
  const SendData = useSendTransaction(config); 
  if (open && chain?.id !== decimalchainId) {
    handleSwitchNetworkMessage(const_msg);
  }

  //Hide the chain change popup
  useEffect(() => {
    if (chain?.id === decimalchainId) {
      setOpen(false);
    }
  }, [chain?.id]);
  //Get initilas transaction details using hash
  const saveHashResponse = useTransaction({ hash: SendData.data?.hash });
  //Save the initial transaction detilas in database
  useEffect(() => {
    if (SendData.data?.hash && !runOnce && saveHashResponse.data) {
      PaymentInProcess(
        wallet_image,
        process_msg,
        block_explorer,
        SendData,
        const_msg
      );
      const response = getDynamicTransactionData(
        saveHashResponse.data,
        chain?.id,
        currency_symbol
      );
      restApiSaveTransaction(response, extradataRest).then(function (backData) {
        setSaveResponse(backData);
        setRunOnce(true);
      });
    }
  }, [SendData.data?.hash && saveHashResponse.data]);
  //Wait for transaction completetion
  const waitFordata = useWaitForTransaction({
    hash: SendData.data?.hash,
  });
  // Get confirmed transaction details using hash
  const saveConfirmResponse = useTransaction({
    hash: waitFordata.data?.transactionHash,
  });
  //Confirm the transaction & process order after block confirmation
  useEffect(() => {
    if (waitFordata.data?.transactionHash && getSaveResponse) {
      const response = getDynamicTransactionData(
        saveConfirmResponse.data,
        chain?.id,
        currency_symbol
      );
      restApiConfirmTransaction(response, getSaveResponse, extradataRest);
    }
  }, [saveConfirmResponse.data && getSaveResponse]);
  //auto open the payment module

  useEffect(() => {
    const isPageReloaded =
      performance.getEntriesByType("navigation")[0].type === "reload";

    if (isPageReloaded) {
    } else {
      if (
        SendData.sendTransactionAsync &&
        !is_paid &&
        order_status !== "cancelled" &&
        !open
      ) {
        handleTransaction();
      }
    }
  }, [SendData.sendTransactionAsync]);

  //if any error occur during payment process
  useEffect(() => {
    if (SendData.error) {
      if (
        SendData.error.cause.code === 4001 ||
        SendData.error.cause.code === 5000 ||
        SendData.error.cause.code === -1
      ) {
        // displayPopUp({ msg: rejected_msg, image: wallet_image});
        cancelOrder(extradataRest);
        setRejectedTransaction(true);
      } else {
        displayPopUp({
          msg: SendData.error.cause.message,
          image: wallet_image,
          time: 5000,
        });
      }
    }
  }, [SendData.error]);
  //Send transaction function handling
  const handleTransaction = () => {

    if (SendData.sendTransactionAsync?.()) {
      ConfirmTransaction(wallet_image, confirm_msg, const_msg);
    }
  };

 
  return (
    <>
      {!is_paid &&
        order_status !== "cancelled" &&
        !waitFordata.isSuccess &&
        !rejectedTransaction && (
          <PaymentUi
            wallet_image={wallet_image}
            connectedWallet={connectedWallet}
            const_msg={const_msg}
            address={address}
            without_discount={without_discount}
            currency_symbol={currency_symbol}
            in_crypto={in_crypto}
            network_name={network_name}
            currency_logo={currency_logo}
            fiatSymbol={fiatSymbol}
            totalFiat={totalFiat}
            place_order_btn={place_order_btn}
            handleTransaction={handleTransaction}
            cancelOrder={cancelOrder}
          />
        )}
      {rejectedTransaction && (
        <PaymentLoader/>
      )}
    </>
  );
};
export default SendTransaction;
