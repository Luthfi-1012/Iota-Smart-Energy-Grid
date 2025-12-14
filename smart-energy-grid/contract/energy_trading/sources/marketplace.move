module energy_trading::marketplace {
    use iota::object::{UID, ID};
    use iota::object;
    use iota::tx_context::{TxContext, sender};
    use iota::event;
    use iota::transfer;
    use iota::coin::{Coin, split, value, into_balance};
    use iota::balance::{Balance, join, zero};
    use iota::iota::IOTA;

    /// Error codes
    const E_NOT_ACTIVE: u64 = 1001;
    const E_INVALID_AMOUNT: u64 = 1002;
    const E_INVALID_PRICE: u64 = 1003;
    const E_UNAUTHORIZED: u64 = 2001;
    const E_INSUFFICIENT_PAYMENT: u64 = 2002;
    const E_INVALID_ENERGY_TYPE: u64 = 2003;

    /// Marketplace shared object that tracks global stats and collects platform fees
    public struct Marketplace has key {
        id: UID,
        total_listings: u64,
        total_transactions: u64,
        total_energy_traded: u64,
        platform_fee_percent: u64, // basis points, 100 = 1%
        platform_balance: Balance<IOTA>,
    }

    /// A listing of energy produced by a seller
    public struct EnergyListing has key, store {
        id: UID,
        seller: address,
        energy_amount: u64,      // Wh
        price_per_kwh: u64,      // IOTA per kWh
        energy_type: u8,         // 0=Solar,1=Wind,2=Hydro,3=Grid
        location: vector<u8>,    // arbitrary UTF-8 bytes
        timestamp: u64,
        is_active: bool,
    }

    /// A transaction record of purchased energy
    public struct EnergyTransaction has key, store {
        id: UID,
        listing_id: ID,
        buyer: address,
        seller: address,
        energy_amount: u64,
        total_price: u64,
        energy_type: u8,
        timestamp: u64,
    }

    /// A user profile with aggregate stats
    public struct UserProfile has key, store {
        id: UID,
        owner: address,
        total_sold: u64,
        total_bought: u64,
        total_earned: u64,
        total_spent: u64,
        reputation: u64,
        joined_at: u64,
    }

    /// Events for frontend indexing
    public struct ListingCreated has copy, drop {
        listing_id: ID,
        seller: address,
        energy_amount: u64,
        price_per_kwh: u64,
        energy_type: u8,
    }
    public struct EnergyPurchased has copy, drop {
        listing_id: ID,
        buyer: address,
        seller: address,
        energy_amount: u64,
        total_price: u64,
    }
    public struct ListingCancelled has copy, drop {
        listing_id: ID,
        seller: address,
    }

    /// Initialize marketplace shared object with default platform fee = 1%
    fun init(ctx: &mut TxContext) {
        let marketplace = Marketplace {
            id: object::new(ctx),
            total_listings: 0,
            total_transactions: 0,
            total_energy_traded: 0,
            platform_fee_percent: 100,
            platform_balance: zero<IOTA>(),
        };
        transfer::share_object(marketplace);
    }

    /// Create a user profile with zeroed stats
    public entry fun create_profile(ctx: &mut TxContext) {
        let owner_addr = sender(ctx);
        let profile = UserProfile {
            id: object::new(ctx),
            owner: owner_addr,
            total_sold: 0,
            total_bought: 0,
            total_earned: 0,
            total_spent: 0,
            reputation: 0,
            joined_at: 0,
        };
        transfer::public_transfer(profile, owner_addr);
    }

    /// Create an energy listing
    public entry fun create_listing(
        marketplace: &mut Marketplace,
        energy_amount: u64,
        price_per_kwh: u64,
        energy_type: u8,
        location: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(energy_amount > 0, E_INVALID_AMOUNT);
        assert!(price_per_kwh > 0, E_INVALID_PRICE);
        assert!(energy_type <= 3, E_INVALID_ENERGY_TYPE);

        let seller_addr = sender(ctx);
        let listing = EnergyListing {
            id: object::new(ctx),
            seller: seller_addr,
            energy_amount,
            price_per_kwh,
            energy_type,
            location,
            timestamp: 0,
            is_active: true,
        };
        marketplace.total_listings = marketplace.total_listings + 1;

        event::emit(ListingCreated {
            listing_id: object::id(&listing),
            seller: seller_addr,
            energy_amount,
            price_per_kwh,
            energy_type,
        });

        transfer::public_transfer(listing, seller_addr);
    }

    /// Buy energy from a listing using IOTA coin; splits payment into seller and platform fee
    public entry fun buy_energy(
        marketplace: &mut Marketplace,
        listing: &mut EnergyListing,
        profile: &mut UserProfile,
        payment: Coin<IOTA>,
        ctx: &mut TxContext
    ) {
        assert!(listing.is_active, E_NOT_ACTIVE);
        let buyer_addr = sender(ctx);
        let kwh = listing.energy_amount / 1000;
        let total_price = kwh * listing.price_per_kwh;
        assert!(value(&payment) == total_price, E_INSUFFICIENT_PAYMENT);

        // Platform fee = 1% (100 basis points)
        let fee = (total_price * marketplace.platform_fee_percent) / 10_000;
        let seller_amount = total_price - fee;

        let mut pay = payment;
        let seller_coin = split(&mut pay, seller_amount, ctx);
        let fee_coin = pay;

        // Transfer 99% to seller
        transfer::public_transfer(seller_coin, listing.seller);
        // Deposit fee into platform balance
        let fee_balance = into_balance<IOTA>(fee_coin);
        join<IOTA>(&mut marketplace.platform_balance, fee_balance);

        // Update stats and deactivate listing
        listing.is_active = false;
        marketplace.total_transactions = marketplace.total_transactions + 1;
        marketplace.total_energy_traded = marketplace.total_energy_traded + listing.energy_amount;
        profile.total_bought = profile.total_bought + listing.energy_amount;
        profile.total_spent = profile.total_spent + total_price;

        let tx = EnergyTransaction {
            id: object::new(ctx),
            listing_id: object::id(listing),
            buyer: buyer_addr,
            seller: listing.seller,
            energy_amount: listing.energy_amount,
            total_price,
            energy_type: listing.energy_type,
            timestamp: 0,
        };

        event::emit(EnergyPurchased {
            listing_id: object::id(listing),
            buyer: buyer_addr,
            seller: listing.seller,
            energy_amount: listing.energy_amount,
            total_price,
        });

        transfer::public_transfer(tx, buyer_addr);
    }

    /// Cancel listing (only seller)
    public entry fun cancel_listing(
        listing: &mut EnergyListing,
        ctx: &mut TxContext
    ) {
        let caller = sender(ctx);
        assert!(caller == listing.seller, E_UNAUTHORIZED);
        assert!(listing.is_active, E_NOT_ACTIVE);
        listing.is_active = false;

        event::emit(ListingCancelled {
            listing_id: object::id(listing),
            seller: listing.seller,
        });
    }

    /// Update price (only seller)
    public entry fun update_price(
        listing: &mut EnergyListing,
        new_price: u64,
        ctx: &mut TxContext
    ) {
        assert!(new_price > 0, E_INVALID_PRICE);
        let caller = sender(ctx);
        assert!(caller == listing.seller, E_UNAUTHORIZED);
        listing.price_per_kwh = new_price;
    }
}
