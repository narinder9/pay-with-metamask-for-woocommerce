import React, { Suspense } from 'react';
import { render } from '@wordpress/element';
import { Loader } from '../component/helper';
const App = React.lazy( () => import( './CurrencyAndNetworkManager' ) );
// Function to render your React component
function renderReactComponent() {
	const paymentField = document.getElementById( 'cpmwp-connect-wallets' );

	if ( paymentField ) {
		// Render your React component when the payment field is available
		render(
			<Suspense fallback={ <Loader loader={ 3 } width={ 1000 } /> }>
				<App />
			</Suspense>,
			paymentField
		);
	}
}

// Function to set up the MutationObserver
function observeDOMChanges() {
	const targetNode = document.body; // You can change this to the specific container where changes occur

	const observer = new MutationObserver( ( mutationsList ) => {
		for ( const mutation of mutationsList ) {
			if ( mutation.type === 'childList' ) {
				// Detect changes in the DOM structure
				renderReactComponent();
			}
		}
	} );

	const observerConfig = { childList: true, subtree: true };

	// Start observing DOM changes
	observer.observe( targetNode, observerConfig );
}

// Wait for the DOM to be fully loaded before setting up the observer
document.addEventListener( 'DOMContentLoaded', () => {
	renderReactComponent(); // Render on initial load
	observeDOMChanges(); // Set up the MutationObserver
} );
