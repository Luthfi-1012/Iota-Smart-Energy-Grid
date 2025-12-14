module pizza_box::pizza {

    public struct Pizza has store {
        pepperoni: u16,
        sausage: u16,
        cheese: u16,
        onion: u16,
        chives: u16
    }

    public struct PizzaBox has key, store {
        id: UID,
        pizza: Pizza,
    }

    #[allow(lint(self_transfer))]
    public fun cook(pepperoni: u16, sausage: u16, cheese: u16, onion: u16, chives: u16, ctx: &mut tx_context::TxContext) {
        let sender = tx_context::sender(ctx);

        let p = Pizza {
            pepperoni,
            sausage,
            cheese,
            onion,
            chives  
        };
    
        transfer::public_transfer(PizzaBox { id: object::new(ctx), pizza: p }, sender);
    }
}