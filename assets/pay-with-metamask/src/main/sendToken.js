import React, { useState, useEffect } from "react";
import {
  useWaitForTransaction,
  useAccount,
  useTransaction,
  erc20ABI,
  usePrepareContractWrite,
  useContractWrite,
  useNetwork,
} from "wagmi";
import { parseEther } from "viem";
import {
  displayPopUp,
  getDynamicTransactionData,  
  PaymentInProcess,
  ConfirmTransaction,
  handleSwitchNetworkMessage,
  PaymentUi,
  PaymentLoader,
} from "../component/helper";
import {
  restApiSaveTransaction,
  restApiConfirmTransaction,
  cancelOrder,
} from "../component/handelRestApi";
import { useModal } from "connectkit";
export default function SendTokens() {
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
    network_name,
    place_order_btn,
    token_address,
    fiatSymbol,
    totalFiat,
    decimalchainId,
    without_discount,
    currency_logo,
  } = extradataRest;

  // State variables
  const [getSaveResponse, setSaveResponse] = useState(null);
  const [runOnce, setRunOnce] = useState(null);
  const [runOnceWallet, setRunOnceWallet] = useState(null);
  const [rejectedTransaction, setRejectedTransaction] = useState(null);

  // Hooks
  const { open, setOpen } = useModal();
  const { address } = useAccount();
  const { chain } = useNetwork();

  if (open && chain?.id !== decimalchainId) {
    handleSwitchNetworkMessage(const_msg);
  }
  //Hide the chain change popup
  useEffect(() => {
    if (chain?.id === decimalchainId) {
      setOpen(false);
    }
  }, [chain?.id]);

  const { config } = usePrepareContractWrite({
    address: token_address,
    abi: erc20ABI,
    functionName: "transfer",
    args: [receiver, parseEther(in_crypto)],
    enabled: true,
  });
  const SendData = useContractWrite(config);
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

  useEffect(() => {
    const isPageReloaded =
      performance.getEntriesByType("navigation")[0].type === "reload";

    if (isPageReloaded) {
    } else {
      if (
        SendData.writeAsync &&
        !is_paid &&
        order_status !== "cancelled" &&
        !runOnceWallet &&
        !open
      ) {
        handleTransaction();
        setRunOnceWallet(true);
      }
    }
  }, [SendData.writeAsync]);

  const handleTransaction = () => {
    if (SendData.writeAsync?.()) {
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
}
