Iota Smart Energy Grid

Iota Smart Energy Grid is a decentralized platform for trading energy (DePIN) that allows energy transactions through two methods: Global Marketplace and P2P (Peer-to-Peer). This platform leverages IOTA Testnet for efficient energy transactions, enabling users to buy and sell energy directly with low fees and fast finality.

Key Features
1. User Onboarding

Landing Page: Users can connect to the app by clicking “Enter App,” which opens a connection modal.

User Profile: The user profile is automatically created if it doesn’t exist, and the active profile information and user ID are displayed in the header.

2. Energy Products

Create Listing: Users can create an energy listing by specifying the energy amount (Wh), price per kWh (IOTA), energy type, and location (lat, lng).

Listing Updates: Processed listings are displayed in:

My Listings: Sorted by most recent (created_at_ms).

Marketplace: Global index, can be filtered by type, price, and location.

P2P: Listings sorted by the nearest distance, pinned to the leftmost position.

3. Energy Purchase

Marketplace:

Filters by Energy Type, Price, and Location.

Sorting by price, distance, and newest.

Payment calculated by formula: floor(Wh/1000) * price_per_kwh.

After purchase, the listing is marked as "Sold".

P2P:

Peer recommendations are based on user geolocation and the seller’s listing location.

4. Transactions & History

Payment: Uses IOTA Coin for energy payment; transactions are completed via the buy_energy contract.

History: Purchase transaction history is stored and displayed sorted by timestamp (timestampMs).

5. Data Layer

My Listings & Transactions: Uses getOwnedObjects to retrieve the user's listings.

Global Marketplace: Fetches event IDs from ListingCreated and combines with owned objects to quickly display new listings.

P2P: Calculates the distance using Haversine and sorts listings by proximity.

Location: Location is stored as a vector<u8> and decoded into a string for a clean display and accurate P2P transactions.

6. Frontend

Smart Grid Dashboard: Displays production, consumption, and net energy with green/red indicators for surplus/deficit.

Sell Energy: Form for creating energy listings and ideal location for P2P.

Marketplace: Filters by Energy Type, Price, and Location; sorting by price, distance, and newest; listing disappears after purchase; success notifications.

P2P: Shows nearest peers based on geolocation and seller listing.

My Listings: Sorted by most recent with created_at_ms; badges for Active/Sold.

Transactions: Displays transactions from owned objects and purchase events, sorted by the latest.

7. UX & Reliability

Toast & Status Banner: Displays transaction status (pending → submitted → confirmed/failed) with user-friendly notifications.

Auto-create Profile Guard: The user profile is created only once per session to avoid duplication.

Accurate Location: Location is decoded for clean display and accuracy in P2P transactions.

Why DePIN (Decentralized Physical Infrastructure Networks)?

Iota Smart Energy Grid models physical resources (energy and location) as on-chain objects. The use of IOTA Coin for transaction settlement offers an efficient solution with low costs and fast finality. The P2P system prioritizes local neighbors, empowering the community with low-cost and efficient energy transactions.

How to Use

Connect & Profile:

Click "Enter App" to connect your wallet.

The user profile will be created automatically if it doesn't already exist.

Create Energy Listing:

After login, choose Create Listing and enter the energy amount, price, energy type, and location.

Energy Purchase:

Choose a listing in Marketplace or P2P, adjust the filters, and calculate the total cost.

After completing the transaction, the listing will be marked as Sold.

Transaction History:

View your transaction history on the Transactions page, with purchase details sorted by timestamp.

Local Setup and Installation

Clone the Repository:

git clone https://github.com/Luthfi-1012/Iota-Smart-Energy-Grid.git
cd Iota-Smart-Energy-Grid


Install Dependencies:

npm install


Run the Application:

npm start


Testing & Deployment:
Perform testing and deploy the app according to your needs on the IOTA testnet or mainnet.

Technologies Used

IOTA: For blockchain-based energy transactions.

React: For the user interface (UI).

IOTA Dapp Kit: For interacting with the IOTA blockchain.

Geolocation: For P2P and peer-to-peer recommendations.

Contribution

If you'd like to contribute, fork this repository, create a new branch, and submit a pull request. All contributions are welcome!
