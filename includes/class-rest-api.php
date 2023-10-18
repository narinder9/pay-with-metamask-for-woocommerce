<?PHP

class CpmwRestApi
{
    use CPMW_HELPER;
    public static $instanceApi;
    const Rest_End_Point= 'pay-with-metamask/v1';
    public static function getInstance()
    {
        if (!isset(self::$instanceApi)) {
            self::$instanceApi = new self();
        }
        return self::$instanceApi;
    }

    public function __construct()
    {
        add_action('rest_api_init', array($this, 'registerRestApi'));
    }
    //Register all required rest roots
    public function registerRestApi()
    {
        register_rest_route(self::Rest_End_Point, 'verify-transaction', array(
            'methods' => 'POST',
            'callback' => array($this, 'verify_transaction_handler'),
            'permission_callback' => '__return_true',
        ));
        register_rest_route(self::Rest_End_Point, 'save-transaction', array(
            'methods' => 'POST',
            'callback' => array($this, 'save_transaction_handler'),
            'permission_callback' => '__return_true',
        ));
        register_rest_route(self::Rest_End_Point, 'cancel-order', array(
            'methods' => 'POST',
            'callback' => array($this, 'set_order_failed'),
            'permission_callback' => '__return_true',
        ));
        register_rest_route(self::Rest_End_Point, 'selected-network', array(
            'methods' => 'POST',
            'callback' => array($this, 'get_selected_network'),
            'permission_callback' => '__return_true',
        ));

    }

        // Get network on selected coin base
        public function get_selected_network($request) {
            $data = $request->get_json_params();
            // Verify the nonce           
            $nonce =isset($_POST['_wpnonce']) ? $_POST['_wpnonce'] : (isset($_SERVER['HTTP_X_WP_NONCE']) ? $_SERVER['HTTP_X_WP_NONCE'] : '');
              
           
            if (!wp_verify_nonce($nonce, 'wp_rest')) {  
                wp_send_json_error( 'Nonce verification failed' );
    
            }
            $symbol              = ! empty( $data['symbol'] ) ? sanitize_text_field( $data['symbol'] ) : '';	
          
            $network_array     = $this->cpmwp_get_active_networks_for_currency($symbol);                
            return new WP_REST_Response($network_array);
           
    
        }
    // Canel or fail Order
    public static function set_order_failed($request) {
        $data = $request->get_json_params();
        // Verify the nonce
        $order_id =(int) sanitize_text_field($data['order_id']);
        $nonce =isset($_POST['_wpnonce']) ? $_POST['_wpnonce'] : (isset($_SERVER['HTTP_X_WP_NONCE']) ? $_SERVER['HTTP_X_WP_NONCE'] : '');
          
       
        if (!wp_verify_nonce($nonce, 'wp_rest')) {  
            wp_send_json_error( 'Nonce verification failed' );

        }
        $canceled =sanitize_text_field($data['canceled']);
        $message= __( 'Payment has been failed due to user rejection', 'cpmwp' );
        
        $order  = new WC_Order( $order_id );
        $order->update_status( 'wc-failed',$message );      
        $checkout_page=wc_get_checkout_url();         
        
        $order->save_meta_data();      
        return new WP_REST_Response(array('error' => $message,'url'=>$canceled?$checkout_page:''), 400);
       

    }
  

    // On successfull payment handle order status & save transaction in database
    public function verify_transaction_handler($request)
    {
        global $woocommerce;
        $data = $request->get_json_params();
        // Verify the nonce
        $order_id =(int) sanitize_text_field($data['order_id']);
        $nonce =isset($_POST['_wpnonce']) ? $_POST['_wpnonce'] : (isset($_SERVER['HTTP_X_WP_NONCE']) ? $_SERVER['HTTP_X_WP_NONCE'] : '');
       
        if (!wp_verify_nonce($nonce, 'wp_rest')) {
            $error_message = __('Nonce verification failed.', 'cpmwp');
            return new WP_REST_Response(array('error' => $error_message), 400);
        }
        
        $order = new WC_Order($order_id);
        if ($order->is_paid()) {
            $error_message = __('This order has already paid', 'cpmwp');
            return new WP_REST_Response(array('error' => $error_message), 400);
        }

        $options_settings = get_option('cpmw_settings');
        $block_explorer = $this->cpmw_get_explorer_url();     
        $trasn_id = !empty($data['payment_processed']) ? sanitize_text_field($data['payment_processed']) : '';
        $payment_status_d = !empty($data['payment_status']) ? sanitize_text_field($data['payment_status']) : '';  
        $selected_network = !empty($data['selected_network']) ? sanitize_text_field($data['selected_network']) : '';
        $sender = !empty($data['sender']) ? sanitize_text_field($data['sender']) : '';
        $receiver = !empty($data['receiver']) ? sanitize_text_field($data['receiver']) : '';
        $token_address=sanitize_text_field( $data['token_address'] );
        $amount = !empty($data['amount']) ? $data['amount'] : '';
        $amount = $this->cpmw_format_number($amount);
        $secret_code = !empty($data['secret_code']) ? $data['secret_code'] : '';

        $networks = $this->cpmw_supported_networks();

        $user_address = $order->get_meta('cpmwp_user_wallet');
        $total = $order->get_meta('cpmwp_in_crypto');
        $total = str_replace(',', '', $total);
        $transaction_local_id = $order->get_meta('transaction_id');
        $dbnetwork = $order->get_meta('cpmwp_network');
        $secret_key = $this->cpmw_get_secret_key();
        $signature = !empty($data['signature']) ? $data['signature'] : '';
        $receve_tx_req_data = json_encode(
            array(
                'order_id' => $order_id,
                'selected_network' => $selected_network,
                'receiver' => strtoupper($receiver),
                'amount' => str_replace(',', '', $amount),
                'token_address'		=>strtoupper($token_address),
                'tx_id' => $trasn_id,
            )
        );

        $get_sign = hash_hmac('sha256', $receve_tx_req_data, $secret_key);
        // Verify signature
        if ($get_sign !== $signature) {
            $order->update_status('wc-failed', __('Order has been canceled due to Order Information mismatch', 'cpmwp'));
            $error_message = __('Signature verification failed', 'cpmwp');
            return new WP_REST_Response(array('error' => $error_message), 400);

        }

        if ($transaction_local_id != $trasn_id) {
            $order->update_status('wc-failed', __('Order has been canceled due to Order Information mismatch', 'cpmwp'));
            $error_message = __('Transaction mismatch.', 'cpmwp');
            return new WP_REST_Response(array('error' => $error_message), 400);
        }
        $amount =str_replace( ',', '', $amount );
        if ($amount != $total) {
            $order->update_status('wc-failed', __('Order has been canceled due to Order Information mismatch', 'cpmwp'));

            $error_message = __('Order Information mismatch', 'cpmwp');
            return new WP_REST_Response(array('error' => $error_message), 400);
        }

        $transaction = array();
        $current_user = wp_get_current_user();
        $user_name = $current_user->user_firstname . ' ' . $current_user->user_lastname;
        $transaction['order_id'] = $order_id;
        $transaction['chain_id'] = $selected_network;
        $transaction['order_price'] = get_woocommerce_currency_symbol() . $order->get_total();
        $transaction['user_name'] = $user_name;
        $transaction['crypto_price'] = $order->get_meta('cpmwp_in_crypto') . ' ' . $order->get_meta('cpmwp_currency_symbol');
        $transaction['selected_currency'] = $order->get_meta('cpmwp_currency_symbol');
        $transaction['chain_name'] = $networks[$selected_network];

        try {           
            if ($trasn_id != 'false') {
                $link_hash = '';

                $link_hash = '<a href="' . $block_explorer[$selected_network] . 'tx/' . $trasn_id . '" target="_blank">' . $trasn_id . '</a>';

                if ($payment_status_d == 'default') {
                    $order->add_meta_data('TransactionId', $trasn_id);
                    $order->add_meta_data('Sender', $sender);
                    $transection = __('Payment Received via Pay with MetaMask - Transaction ID:', 'cpmwp') . $link_hash;
                    $order->add_order_note($transection);
                    $order->payment_complete($trasn_id);
                    // send email to costumer
                    WC()->mailer()->emails['WC_Email_Customer_Processing_Order']->trigger($order_id);
                    // send email to admin
                    WC()->mailer()->emails['WC_Email_New_Order']->trigger($order_id);
                   // WC()->cart->empty_cart();

                } else {
                    $order->add_meta_data('TransactionId', $trasn_id);
                    $order->add_meta_data('Sender', $sender);
                    $transection = __('Payment Received via Pay with MetaMask - Transaction ID:', 'cpmwp') . $link_hash;
                    $order->add_order_note($transection);
                    $order->update_status(apply_filters('cpmwp_capture_payment_order_status', $payment_status_d));
                    // send email to costumer
                    WC()->mailer()->emails['WC_Email_Customer_Processing_Order']->trigger($order_id);
                    // send email to admin
                    WC()->mailer()->emails['WC_Email_New_Order']->trigger($order_id);
                   // WC()->cart->empty_cart();
                }
            }
            $db = new CPMW_database();
            $transaction['status'] = 'completed';
            $transaction['sender'] = $sender;
            $transaction['transaction_id'] = !empty($trasn_id) ? $trasn_id : 'false';
            $order->save_meta_data();
            $data = array(
                'is_paid' => ($order->get_status() == 'on-hold' && !empty($trasn_id)) ? true : $order->is_paid(),
                'order_status' => $order->get_status(),
                'order_received_url'=>$order->get_checkout_order_received_url()
            );
            $order->save_meta_data();
            $db->cpmw_insert_data($transaction);
            return new WP_REST_Response($data);
            // return $data;

        } catch (Exception $e) {
            return new WP_REST_Response(array('error' => $e), 400);

        }
        return new WP_REST_Response(array('error' => __('not a valid order_id', 'cpmwp')), 400);

    }
    // validate and save transation info inside transaction table and order
    public function save_transaction_handler($request)
    {
        global $woocommerce;      
        $data = $request->get_json_params();
        $order_id =(int) sanitize_text_field( $data['order_id'] );      
        $nonce =isset($_POST['_wpnonce']) ? $_POST['_wpnonce'] : (isset($_SERVER['HTTP_X_WP_NONCE']) ? $_SERVER['HTTP_X_WP_NONCE'] : '');
       
        if (!wp_verify_nonce($nonce, 'wp_rest')) {
            $error_message = __('Nonce verification failed.', 'cpmwp');
            return new WP_REST_Response(array('error' => $error_message), 400);

        }
      
        $amount = sanitize_text_field($data['amount']);
        $amount = $this->cpmw_format_number($amount);
        $receiver = sanitize_text_field($data['receiver']);       
        $signature = sanitize_text_field($data['signature']);
        $sender = !empty($data['sender']) ? sanitize_text_field($data['sender']) : '';
        $token_address=sanitize_text_field( $data['token_address'] );
       // $verifyRequest = stripslashes($tx_req_data);
        $tx_data_arr = json_decode($verifyRequest, true); // Decode JSON to associative array
        $order = new WC_Order($order_id);
        $order->add_meta_data('transactionverification',sanitize_text_field($data['transaction_id']));
		$order->save_meta_data();
        $selected_network = $order->get_meta( 'cpmwp_network' );      
        $secret_key = $this->cpmw_get_secret_key();
        $create_tx_req_data = json_encode(
            array(
                'order_id' => $order_id,
                'selected_network' => $selected_network ,
                'receiver' => strtoupper($receiver),
                'amount' => str_replace(',', '', $amount),
                'token_address'		=>strtoupper($token_address) 
            )
        );
        $get_sign = hash_hmac('sha256', $create_tx_req_data, $secret_key);
        // Verify signature
        if ($get_sign !== $signature) {
            $order->update_status('wc-failed', __('Order has been canceled due to Order Information mismatch', 'cpmwp'));
            $error_message = __('Signature verification failed', 'cpmwp');
            return new WP_REST_Response(array('error' => $error_message), 400);
        }

       // if (is_array($tx_data_arr)) {

            
            $tx_db_id = $order->get_meta('transaction_id');
            if (!empty($tx_db_id)) {
                $order->update_status('wc-failed', __('Order canceled: Transaction already exists.', 'cpmwp'));
                $error_message = __('Order canceled: Transaction already exists..', 'cpmwp');
                return new WP_REST_Response(array('error' => $error_message), 400);
            }
            
          
            $saved_receiver = $order->get_meta('cpmwp_user_wallet');
            $saved_amount = $order->get_meta('cpmwp_in_crypto');
            $nonce = !empty($data['nonce']) ? sanitize_text_field($data['nonce']) : '';
            $trasn_id = !empty($data['transaction_id']) ? sanitize_text_field($data['transaction_id']) : '';

            $block_explorer = $this->cpmw_get_explorer_url();

            $networks = $this->cpmw_supported_networks();
            $transaction = array();
            $current_user = wp_get_current_user();
            $user_name = $current_user->user_firstname . ' ' . $current_user->user_lastname;
            $order->update_meta_data('transaction_id', $trasn_id);            
            $saved_token_address = $order->get_meta( 'cpmwp_contract_address' );
            $db_currency_symbol=$order->get_meta( 'cpmwp_currency_symbol' );
            $transaction['order_id'] = $order_id;
            $transaction['chain_id'] = $selected_network;
            $transaction['order_price'] = get_woocommerce_currency_symbol() . $order->get_total();
            $transaction['user_name'] = $user_name;
            $transaction['crypto_price'] = $order->get_meta('cpmwp_in_crypto') . ' ' . $db_currency_symbol;
            $transaction['selected_currency'] = $db_currency_symbol;
            $transaction['chain_name'] = $networks[$selected_network];
            $transaction['status'] = 'awaiting';
            $transaction['sender'] = $sender;
            $transaction['transaction_id'] = !empty($trasn_id) ? $trasn_id : 'false';
            $order->save_meta_data();
            $db = new CPMW_database();

            $pass_tx_req_data = json_encode(
                array(
                    'order_id' => $order_id,
                    'selected_network' => $selected_network,
                    'receiver' => strtoupper($saved_receiver),
                    'amount' => str_replace(',', '', $saved_amount),
                    'token_address'		=>strtoupper($saved_token_address),
                    'tx_id' => $trasn_id,
                )
            );
            $signature = hash_hmac('sha256', $pass_tx_req_data, $secret_key);
            $db->cpmw_insert_data($transaction);
            // save transation
            $data = array(                
                'nonce'=> wp_create_nonce('wp_rest'),
                'signature' => $signature,
                'order_id' => $order_id,
            );
            return new WP_REST_Response($data);
       // }
        die();
    }

  
}

CpmwRestApi::getInstance();
