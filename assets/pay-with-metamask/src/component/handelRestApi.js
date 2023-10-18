import Axios from "axios";
import { displayPopUp, TransactionRejected,PaymentSuccessFull,ErrorPopupMsg} from "./helper";

//Fetch active network specific to selected coins
export const restApiGetNetworks = async (
  symbol,
  { nonce,restUrl }
) => {
  try {
    // Check if the symbol is provided
    if (symbol) {
      // Create the request data object with the required parameters
      const requestData = {
        _wpnonce: nonce,
        symbol: symbol        
      };

      // Set the X-WP-Nonce header for the Axios request
      Axios.defaults.headers.common["X-WP-Nonce"] = nonce;

      // Define the API endpoint for selecting the network
      const apiEndpoint = `${restUrl}selected-network`;

      // Send a POST request to retrieve network data
      const response = await Axios.post(apiEndpoint, requestData);

      // Return the response data
      return response.data;
    }
  } catch (error) {
    console.error(error);

    // Handle errors and log them for debugging
    // You can add additional error handling here if needed
  }
};

//Send final payment confirmation response
export const restApiConfirmTransaction = async (
  { hash, from, amount, recever, token_address, chainId },
  { nonce, signature, order_id },
  {
    restUrl,
    in_crypto,
    payment_status,
    payment_msg,
    wallet_image,
    redirect,
    const_msg,
  }
) => {
  try {
    // Calculate the active chain ID in hexadecimal format
    const activechain_id = "0x" + Number(chainId).toString(16);

    // Define the API endpoint for verifying the transaction
    const apiEndpoint = `${restUrl}verify-transaction`;

    // Create the request data object with all necessary parameters
    const requestData = {
      _wpnonce: nonce,
      order_id: order_id,
      payment_status: payment_status,
      payment_processed: hash,
      selected_network: activechain_id,
      sender: from,
      token_address: token_address,
      receiver: recever,
      amount: amount !== 0.0 ? amount : in_crypto,
      signature: signature,
    };

    // Set the X-WP-Nonce header for the Axios request
    Axios.defaults.headers.common["X-WP-Nonce"] = nonce;

    // Send a POST request to verify the transaction
    const response = await Axios.post(apiEndpoint, requestData);

    if (response.data.is_paid) {
      // Transaction is confirmed and paid
      PaymentSuccessFull(wallet_image,payment_msg,const_msg)
      if (redirect !== "") {
        window.location.href = redirect;
      } else {
        window.location.href = response.data.order_received_url;
      }
    }
  } catch (error) {
    console.error(error);
    ErrorPopupMsg(error.message, const_msg, wallet_image);  
  }
};

//Send initialize payment hash response
export const restApiSaveTransaction = async (
  { hash, from, amount, recever, token_address },
  { restUrl, nonce, id, in_crypto, signature }
) => {
  try {
    // Define the API endpoint for saving the transaction
    const apiEndpoint = `${restUrl}save-transaction`;

    // Create the request data object with all necessary parameters
    const requestData = {
      _wpnonce: nonce,
      transaction_id: hash,
      sender: from,
      amount: amount !== 0.0 ? amount : in_crypto,
      receiver: recever,
      token_address: token_address,
      order_id: id,
      signature: signature,
    };

    // Set the X-WP-Nonce header for the Axios request
    Axios.defaults.headers.common["X-WP-Nonce"] = nonce;

    // Send a POST request to save the transaction
    const response = await Axios.post(apiEndpoint, requestData);

    // If successful, return the response data
    return response.data;
  } catch (error) {
    console.error(error);

    // Handle errors and display a pop-up message
    if (error.response) {
      displayPopUp({
        msg: error.message,
        icons: "error",
        text: error.message,
      });

      // Reload the page after a delay (e.g., 3.5 seconds)
      // setTimeout(function () {
      //   location.reload();
      // }, 3500);
    } else {
      displayPopUp({
        msg: error,
        icons: "error",
        text: error.message,
      });
    }

    // Return null in case of an error (or handle it according to your needs)
    return null;
  }
};

/**
 * Cancel order
 */
export const cancelOrder = async (
  { restUrl, nonce, id, wallet_image, const_msg, rejected_msg },
  canlceled = false
) => {
  try {
    // Define the API endpoint for cancelling the order
    const apiEndpoint = `${restUrl}cancel-order`;

    // Create the request data object with the nonce and order_id
    const requestData = {
      _wpnonce: nonce,
      order_id: id,
      canceled: canlceled,
    };

    // Set the X-WP-Nonce header for the Axios request
    Axios.defaults.headers.common["X-WP-Nonce"] = nonce;

    // Send a POST request to cancel the order
    await Axios.post(apiEndpoint, requestData);

    // If successful, you can return a response or handle it as needed
    // return response.data ? response.data : null;
  } catch (error) {
    console.log(error);

    // Handle errors and display a pop-up message
    if (error.response) {
      if (error.response.data.url) {
        window.location.href = error.response.data.url;
      } else {
        TransactionRejected(rejected_msg, const_msg, wallet_image);
        // Reload the page after a delay (e.g., 2.5 seconds)
        setTimeout(function () {
          window.location.reload();
        }, 2500);
      }
    } else {
      displayPopUp({
        msg: error,
        icons: "error",
        text: error.message,
      });
    }

    // You can choose to return or handle the error further based on your needs
    return;
  }
};

