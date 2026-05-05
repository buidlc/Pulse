module pulse::platform {
    use std::error;
    use std::signer;
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin;
    use aptos_framework::event;
    use aptos_framework::timestamp;

    const ARTICLE: u8 = 0;
    const VIDEO: u8 = 1;
    const COURSE: u8 = 2;

    const DEFAULT_PLATFORM_FEE_BPS: u64 = 100;
    const DEFAULT_VOTE_COST_OCTAS: u64 = 10_000_000;
    const FEE_CHANGE_DELAY_SECONDS: u64 = 172_800;
    const MIN_WALLET_AGE_SECONDS: u64 = 86_400;
    const MAX_PLATFORM_FEE_BPS: u64 = 1000;
    const MAX_ROYALTY_BPS: u64 = 5000;
    const AUTOFLAG_DOWNVOTE_THRESHOLD: u64 = 5;


    const E_NOT_ADMIN: u64 = 1001;
    const E_BANNED: u64 = 1002;
    const E_NO_ACCESS: u64 = 1003;
    const E_ALREADY_HAS_ACCESS: u64 = 1004;
    const E_CONTENT_NOT_FOUND: u64 = 1005;
    const E_CONTENT_NOT_ACTIVE: u64 = 1006;
    const E_CONTENT_PENDING: u64 = 1007;
    const E_INVALID_TYPE: u64 = 1008;
    const E_INVALID_PRICE: u64 = 1009;
    const E_INVALID_ROYALTY: u64 = 1010;
    const E_INVALID_FEE: u64 = 1011;
    const E_WALLET_TOO_NEW: u64 = 1012;
    const E_RESALE_DISABLED: u64 = 1013;
    const E_NOT_INITIALIZED: u64 = 1014;
    const E_ALREADY_INITIALIZED: u64 = 1015;
    const E_NO_PENDING_FEE_CHANGE: u64 = 1016;
    const E_TIMELOCK_NOT_EXPIRED: u64 = 1017;
    const E_SAME_BUYER: u64 = 1018;
    const E_SELF_VOTE: u64 = 1019;
    const E_INSUFFICIENT_PAYMENT: u64 = 1020;

    struct ContentMetadata has store, copy, drop {
        id: u64,
        blob_id: vector<u8>,
        title: vector<u8>,
        creator: address,
        price: u64,
        content_type: u8,
        royalty_bps: u64,
        allow_resale: bool,
        upvotes: u64,
        downvotes: u64,
        total_sales: u64,
        is_active: bool,
        is_pending: bool,
        is_flagged: bool,
        submitted_at: u64,
        approved_at: u64,
    }

    struct AccessEntry has store, drop {
        content_id: u64,
        owners: vector<address>,
    }

    struct ContentRegistry has key {
        contents: vector<ContentMetadata>,
        next_id: u64,
    }

    struct AccessRegistry has key {
        entries: vector<AccessEntry>,
    }

    struct BannedWallets has key {
        wallets: vector<address>,
    }

    struct PlatformConfig has key {
        admin: address,
        platform_wallet: address,
        fee_bps: u64,
        vote_cost: u64,
        community_pool: u64,
        require_admin_approval: bool,
        autoflag_enabled: bool,
        pending_fee_bps: u64,
        fee_change_at: u64,
        has_pending_fee_change: bool,
    }


    #[event]
    struct ContentPublished has drop, store {
        content_id: u64,
        creator: address,
        title: vector<u8>,
        content_type: u8,
        price: u64,
        timestamp: u64,
    }

    #[event]
    struct ContentSold has drop, store {
        content_id: u64,
        buyer: address,
        creator: address,
        price: u64,
        platform_fee: u64,
        timestamp: u64,
    }

    #[event]
    struct ContentResold has drop, store {
        content_id: u64,
        seller: address,
        new_buyer: address,
        creator: address,
        sale_price: u64,
        creator_royalty: u64,
        platform_fee: u64,
        seller_proceeds: u64,
        timestamp: u64,
    }

    #[event]
    struct VoteCast has drop, store {
        content_id: u64,
        voter: address,
        is_upvote: bool,
        cost: u64,
        timestamp: u64,
    }

    #[event]
    struct ContentApproved has drop, store {
        content_id: u64,
        is_active: bool,
        timestamp: u64,
    }

    #[event]
    struct ContentFlagged has drop, store {
        content_id: u64,
        timestamp: u64,
    }

    #[event]
    struct WalletBanned has drop, store {
        wallet: address,
        timestamp: u64,
    }

    #[event]
    struct FeeChangeProposed has drop, store {
        new_fee_bps: u64,
        executable_at: u64,
    }

    #[event]
    struct FeeChangeExecuted has drop, store {
        old_fee_bps: u64,
        new_fee_bps: u64,
        timestamp: u64,
    }

    public entry fun initialize(deployer: &signer, platform_wallet: address) {
        let addr = signer::address_of(deployer);
        assert!(addr == @pulse, error::permission_denied(E_NOT_ADMIN));
        assert!(!exists<PlatformConfig>(@pulse), error::already_exists(E_ALREADY_INITIALIZED));

        move_to(deployer, PlatformConfig {
            admin: addr,
            platform_wallet,
            fee_bps: DEFAULT_PLATFORM_FEE_BPS,
            vote_cost: DEFAULT_VOTE_COST_OCTAS,
            community_pool: 0,
            require_admin_approval: true,
            autoflag_enabled: true,
            pending_fee_bps: 0,
            fee_change_at: 0,
            has_pending_fee_change: false,
        });
        move_to(deployer, ContentRegistry { contents: vector::empty<ContentMetadata>(), next_id: 0 });
        move_to(deployer, AccessRegistry { entries: vector::empty<AccessEntry>() });
        move_to(deployer, BannedWallets { wallets: vector::empty<address>() });
    }

    fun assert_admin(account: &signer) acquires PlatformConfig {
        let cfg = borrow_global<PlatformConfig>(@pulse);
        assert!(signer::address_of(account) == cfg.admin, error::permission_denied(E_NOT_ADMIN));
    }

    fun assert_not_banned(wallet: address) acquires BannedWallets {
        let banned = borrow_global<BannedWallets>(@pulse);
        assert!(!vector::contains(&banned.wallets, &wallet), error::permission_denied(E_BANNED));
    }

    fun assert_wallet_age_ok(wallet: address) {
        assert!(account::exists_at(wallet), error::invalid_argument(E_WALLET_TOO_NEW));
    }

    fun find_content_index(reg: &ContentRegistry, content_id: u64): u64 {
        let len = vector::length(&reg.contents);
        let i = 0u64;
        while (i < len) {
            if (vector::borrow(&reg.contents, i).id == content_id) return i;
            i = i + 1;
        };
        abort error::not_found(E_CONTENT_NOT_FOUND)
    }

    fun find_or_create_access(access: &mut AccessRegistry, content_id: u64): u64 {
        let len = vector::length(&access.entries);
        let i = 0u64;
        while (i < len) {
            if (vector::borrow(&access.entries, i).content_id == content_id) return i;
            i = i + 1;
        };
        vector::push_back(&mut access.entries, AccessEntry { content_id, owners: vector::empty<address>() });
        len
    }

    fun split_payment(price: u64, fee_bps: u64): (u64, u64) {
        let fee = (price * fee_bps) / 10_000;
        let creator_share = price - fee;
        (creator_share, fee)
    }

    fun maybe_autoflag(content: &mut ContentMetadata, autoflag_enabled: bool) {
        if (autoflag_enabled && content.downvotes >= AUTOFLAG_DOWNVOTE_THRESHOLD && !content.is_flagged) {
            content.is_flagged = true;
            event::emit(ContentFlagged { content_id: content.id, timestamp: timestamp::now_seconds() });
        }
    }

    public entry fun publish_content(
        creator: &signer,
        blob_id: vector<u8>,
        title: vector<u8>,
        price: u64,
        content_type: u8,
        royalty_bps: u64,
        allow_resale: bool,
    ) acquires ContentRegistry, BannedWallets, PlatformConfig {
        let creator_addr = signer::address_of(creator);
        assert_not_banned(creator_addr);
        assert_wallet_age_ok(creator_addr);
        assert!(content_type <= COURSE, error::invalid_argument(E_INVALID_TYPE));
        assert!(price > 0, error::invalid_argument(E_INVALID_PRICE));
        assert!(royalty_bps <= MAX_ROYALTY_BPS, error::invalid_argument(E_INVALID_ROYALTY));

        let cfg = borrow_global<PlatformConfig>(@pulse);
        let reg = borrow_global_mut<ContentRegistry>(@pulse);
        let id = reg.next_id;
        reg.next_id = id + 1;
        let now = timestamp::now_seconds();

        let pending = cfg.require_admin_approval;
        vector::push_back(&mut reg.contents, ContentMetadata {
            id,
            blob_id,
            title,
            creator: creator_addr,
            price,
            content_type,
            royalty_bps,
            allow_resale,
            upvotes: 0,
            downvotes: 0,
            total_sales: 0,
            is_active: !pending,
            is_pending: pending,
            is_flagged: false,
            submitted_at: now,
            approved_at: if (pending) { 0 } else { now },
        });

        let title_for_event = *&vector::borrow(&reg.contents, vector::length(&reg.contents) - 1).title;
        event::emit(ContentPublished {
            content_id: id,
            creator: creator_addr,
            title: title_for_event,
            content_type,
            price,
            timestamp: now,
        });
    }

    public entry fun purchase_access(buyer: &signer, content_id: u64)
        acquires ContentRegistry, AccessRegistry, PlatformConfig, BannedWallets {
        let buyer_addr = signer::address_of(buyer);
        assert_not_banned(buyer_addr);

        let cfg = borrow_global<PlatformConfig>(@pulse);
        let fee_bps = cfg.fee_bps;
        let platform_wallet = cfg.platform_wallet;

        let reg = borrow_global_mut<ContentRegistry>(@pulse);
        let idx = find_content_index(reg, content_id);
        let content = vector::borrow_mut(&mut reg.contents, idx);

        assert!(!content.is_pending, error::invalid_state(E_CONTENT_PENDING));
        assert!(content.is_active, error::invalid_state(E_CONTENT_NOT_ACTIVE));
        assert!(content.creator != buyer_addr, error::invalid_argument(E_SAME_BUYER));

        let price = content.price;
        let creator_addr = content.creator;

        let access = borrow_global_mut<AccessRegistry>(@pulse);
        let entry_idx = find_or_create_access(access, content_id);
        let entry = vector::borrow_mut(&mut access.entries, entry_idx);
        assert!(!vector::contains(&entry.owners, &buyer_addr), error::already_exists(E_ALREADY_HAS_ACCESS));

        let (creator_share, platform_fee) = split_payment(price, fee_bps);
        coin::transfer<AptosCoin>(buyer, creator_addr, creator_share);
        coin::transfer<AptosCoin>(buyer, platform_wallet, platform_fee);

        vector::push_back(&mut entry.owners, buyer_addr);
        content.total_sales = content.total_sales + 1;

        event::emit(ContentSold {
            content_id,
            buyer: buyer_addr,
            creator: creator_addr,
            price,
            platform_fee,
            timestamp: timestamp::now_seconds(),
        });
    }

    public entry fun resell_access(
        seller: &signer,
        new_buyer: address,
        content_id: u64,
        sale_price: u64,
    ) acquires ContentRegistry, AccessRegistry, PlatformConfig {
        let seller_addr = signer::address_of(seller);
        assert!(seller_addr != new_buyer, error::invalid_argument(E_SAME_BUYER));
        assert!(sale_price > 0, error::invalid_argument(E_INVALID_PRICE));

        let cfg = borrow_global<PlatformConfig>(@pulse);
        let fee_bps = cfg.fee_bps;
        let platform_wallet = cfg.platform_wallet;

        let reg = borrow_global<ContentRegistry>(@pulse);
        let idx = find_content_index(reg, content_id);
        let content = vector::borrow(&reg.contents, idx);
        assert!(content.allow_resale, error::invalid_state(E_RESALE_DISABLED));
        let creator_addr = content.creator;
        let royalty_bps = content.royalty_bps;

        let access = borrow_global_mut<AccessRegistry>(@pulse);
        let entry_idx = find_or_create_access(access, content_id);
        let entry = vector::borrow_mut(&mut access.entries, entry_idx);
        let (seller_owns, seller_pos) = vector::index_of(&entry.owners, &seller_addr);
        assert!(seller_owns, error::permission_denied(E_NO_ACCESS));
        assert!(!vector::contains(&entry.owners, &new_buyer), error::already_exists(E_ALREADY_HAS_ACCESS));

        let creator_royalty = (sale_price * royalty_bps) / 10_000;
        let platform_fee = (sale_price * fee_bps) / 10_000;
        assert!(creator_royalty + platform_fee <= sale_price, error::invalid_argument(E_INSUFFICIENT_PAYMENT));
        let seller_proceeds = sale_price - creator_royalty - platform_fee;

        coin::transfer<AptosCoin>(seller, creator_addr, creator_royalty);
        coin::transfer<AptosCoin>(seller, platform_wallet, platform_fee);

        vector::remove(&mut entry.owners, seller_pos);
        vector::push_back(&mut entry.owners, new_buyer);

        event::emit(ContentResold {
            content_id,
            seller: seller_addr,
            new_buyer,
            creator: creator_addr,
            sale_price,
            creator_royalty,
            platform_fee,
            seller_proceeds,
            timestamp: timestamp::now_seconds(),
        });
    }

    public entry fun accept_resale(
        buyer: &signer,
        seller: address,
        content_id: u64,
        sale_price: u64,
    ) acquires ContentRegistry, AccessRegistry, PlatformConfig {
        let buyer_addr = signer::address_of(buyer);
        assert!(buyer_addr != seller, error::invalid_argument(E_SAME_BUYER));
        assert!(sale_price > 0, error::invalid_argument(E_INVALID_PRICE));

        let cfg = borrow_global<PlatformConfig>(@pulse);
        let fee_bps = cfg.fee_bps;
        let platform_wallet = cfg.platform_wallet;

        let reg = borrow_global<ContentRegistry>(@pulse);
        let idx = find_content_index(reg, content_id);
        let content = vector::borrow(&reg.contents, idx);
        assert!(content.allow_resale, error::invalid_state(E_RESALE_DISABLED));
        let creator_addr = content.creator;
        let royalty_bps = content.royalty_bps;

        let access = borrow_global_mut<AccessRegistry>(@pulse);
        let entry_idx = find_or_create_access(access, content_id);
        let entry = vector::borrow_mut(&mut access.entries, entry_idx);
        let (seller_owns, seller_pos) = vector::index_of(&entry.owners, &seller);
        assert!(seller_owns, error::permission_denied(E_NO_ACCESS));
        assert!(!vector::contains(&entry.owners, &buyer_addr), error::already_exists(E_ALREADY_HAS_ACCESS));

        let creator_royalty = (sale_price * royalty_bps) / 10_000;
        let platform_fee = (sale_price * fee_bps) / 10_000;
        let seller_proceeds = sale_price - creator_royalty - platform_fee;

        coin::transfer<AptosCoin>(buyer, creator_addr, creator_royalty);
        coin::transfer<AptosCoin>(buyer, platform_wallet, platform_fee);
        coin::transfer<AptosCoin>(buyer, seller, seller_proceeds);

        vector::remove(&mut entry.owners, seller_pos);
        vector::push_back(&mut entry.owners, buyer_addr);

        event::emit(ContentResold {
            content_id,
            seller,
            new_buyer: buyer_addr,
            creator: creator_addr,
            sale_price,
            creator_royalty,
            platform_fee,
            seller_proceeds,
            timestamp: timestamp::now_seconds(),
        });
    }

    public entry fun cast_vote(voter: &signer, content_id: u64, is_upvote: bool)
        acquires ContentRegistry, AccessRegistry, PlatformConfig, BannedWallets {
        let voter_addr = signer::address_of(voter);
        assert_not_banned(voter_addr);
        assert_wallet_age_ok(voter_addr);

        let cfg = borrow_global_mut<PlatformConfig>(@pulse);
        let cost = cfg.vote_cost;
        let platform_wallet = cfg.platform_wallet;
        let autoflag = cfg.autoflag_enabled;

        let reg = borrow_global_mut<ContentRegistry>(@pulse);
        let idx = find_content_index(reg, content_id);
        let content = vector::borrow_mut(&mut reg.contents, idx);
        assert!(content.is_active && !content.is_pending, error::invalid_state(E_CONTENT_NOT_ACTIVE));
        assert!(content.creator != voter_addr, error::invalid_argument(E_SELF_VOTE));

        let access = borrow_global<AccessRegistry>(@pulse);
        let owns = false;
        let len = vector::length(&access.entries);
        let i = 0u64;
        while (i < len) {
            let e = vector::borrow(&access.entries, i);
            if (e.content_id == content_id) {
                owns = vector::contains(&e.owners, &voter_addr);
                break
            };
            i = i + 1;
        };
        assert!(owns, error::permission_denied(E_NO_ACCESS));

        if (is_upvote) {
            coin::transfer<AptosCoin>(voter, content.creator, cost);
            content.upvotes = content.upvotes + 1;
        } else {
            coin::transfer<AptosCoin>(voter, platform_wallet, cost);
            cfg.community_pool = cfg.community_pool + cost;
            content.downvotes = content.downvotes + 1;
            maybe_autoflag(content, autoflag);
        };

        event::emit(VoteCast {
            content_id,
            voter: voter_addr,
            is_upvote,
            cost,
            timestamp: timestamp::now_seconds(),
        });
    }

    public entry fun set_content_active(admin: &signer, content_id: u64, is_active: bool)
        acquires ContentRegistry, PlatformConfig {
        assert_admin(admin);
        let reg = borrow_global_mut<ContentRegistry>(@pulse);
        let idx = find_content_index(reg, content_id);
        let content = vector::borrow_mut(&mut reg.contents, idx);
        content.is_active = is_active;
        if (content.is_pending) {
            content.is_pending = false;
            content.approved_at = timestamp::now_seconds();
        };
        if (is_active) content.is_flagged = false;
        event::emit(ContentApproved { content_id, is_active, timestamp: timestamp::now_seconds() });
    }

    public entry fun ban_wallet(admin: &signer, wallet: address)
        acquires PlatformConfig, BannedWallets {
        assert_admin(admin);
        let banned = borrow_global_mut<BannedWallets>(@pulse);
        if (!vector::contains(&banned.wallets, &wallet)) {
            vector::push_back(&mut banned.wallets, wallet);
            event::emit(WalletBanned { wallet, timestamp: timestamp::now_seconds() });
        }
    }

    public entry fun unban_wallet(admin: &signer, wallet: address)
        acquires PlatformConfig, BannedWallets {
        assert_admin(admin);
        let banned = borrow_global_mut<BannedWallets>(@pulse);
        let (found, idx) = vector::index_of(&banned.wallets, &wallet);
        if (found) { vector::remove(&mut banned.wallets, idx); };
    }

    public entry fun set_vote_cost(admin: &signer, new_cost: u64)
        acquires PlatformConfig {
        assert_admin(admin);
        let cfg = borrow_global_mut<PlatformConfig>(@pulse);
        cfg.vote_cost = new_cost;
    }

    public entry fun set_autoflag(admin: &signer, enabled: bool)
        acquires PlatformConfig {
        assert_admin(admin);
        let cfg = borrow_global_mut<PlatformConfig>(@pulse);
        cfg.autoflag_enabled = enabled;
    }

    public entry fun set_platform_wallet(admin: &signer, new_wallet: address)
        acquires PlatformConfig {
        assert_admin(admin);
        let cfg = borrow_global_mut<PlatformConfig>(@pulse);
        cfg.platform_wallet = new_wallet;
    }

    public entry fun propose_fee_change(admin: &signer, new_fee_bps: u64)
        acquires PlatformConfig {
        assert_admin(admin);
        assert!(new_fee_bps <= MAX_PLATFORM_FEE_BPS, error::invalid_argument(E_INVALID_FEE));
        let cfg = borrow_global_mut<PlatformConfig>(@pulse);
        cfg.pending_fee_bps = new_fee_bps;
        cfg.fee_change_at = timestamp::now_seconds() + FEE_CHANGE_DELAY_SECONDS;
        cfg.has_pending_fee_change = true;
        event::emit(FeeChangeProposed {
            new_fee_bps,
            executable_at: cfg.fee_change_at,
        });
    }

    public entry fun execute_fee_change(admin: &signer)
        acquires PlatformConfig {
        assert_admin(admin);
        let cfg = borrow_global_mut<PlatformConfig>(@pulse);
        assert!(cfg.has_pending_fee_change, error::invalid_state(E_NO_PENDING_FEE_CHANGE));
        assert!(timestamp::now_seconds() >= cfg.fee_change_at, error::invalid_state(E_TIMELOCK_NOT_EXPIRED));
        let old = cfg.fee_bps;
        cfg.fee_bps = cfg.pending_fee_bps;
        cfg.has_pending_fee_change = false;
        cfg.pending_fee_bps = 0;
        cfg.fee_change_at = 0;
        event::emit(FeeChangeExecuted {
            old_fee_bps: old,
            new_fee_bps: cfg.fee_bps,
            timestamp: timestamp::now_seconds(),
        });
    }

    public entry fun cancel_fee_change(admin: &signer) acquires PlatformConfig {
        assert_admin(admin);
        let cfg = borrow_global_mut<PlatformConfig>(@pulse);
        cfg.has_pending_fee_change = false;
        cfg.pending_fee_bps = 0;
        cfg.fee_change_at = 0;
    }

    public entry fun withdraw_pool(admin: &signer, recipient: address, amount: u64)
        acquires PlatformConfig {
        assert_admin(admin);
        let cfg = borrow_global_mut<PlatformConfig>(@pulse);
        assert!(amount <= cfg.community_pool, error::invalid_argument(E_INSUFFICIENT_PAYMENT));
        let _ = recipient;
        cfg.community_pool = cfg.community_pool - amount;
    }


    #[view]
    public fun has_access(buyer: address, content_id: u64): bool acquires AccessRegistry {
        if (!exists<AccessRegistry>(@pulse)) return false;
        let access = borrow_global<AccessRegistry>(@pulse);
        let len = vector::length(&access.entries);
        let i = 0u64;
        while (i < len) {
            let e = vector::borrow(&access.entries, i);
            if (e.content_id == content_id) return vector::contains(&e.owners, &buyer);
            i = i + 1;
        };
        false
    }

    #[view]
    public fun get_content(content_id: u64): ContentMetadata acquires ContentRegistry {
        let reg = borrow_global<ContentRegistry>(@pulse);
        let idx = find_content_index(reg, content_id);
        *vector::borrow(&reg.contents, idx)
    }

    #[view]
    public fun get_all_content(): vector<ContentMetadata> acquires ContentRegistry {
        if (!exists<ContentRegistry>(@pulse)) return vector::empty<ContentMetadata>();
        let reg = borrow_global<ContentRegistry>(@pulse);
        reg.contents
    }

    #[view]
    public fun get_content_count(): u64 acquires ContentRegistry {
        if (!exists<ContentRegistry>(@pulse)) return 0;
        borrow_global<ContentRegistry>(@pulse).next_id
    }

    #[view]
    public fun is_banned(wallet: address): bool acquires BannedWallets {
        if (!exists<BannedWallets>(@pulse)) return false;
        vector::contains(&borrow_global<BannedWallets>(@pulse).wallets, &wallet)
    }

    #[view]
    public fun get_config(): (address, address, u64, u64, u64, bool, bool, u64, u64, bool)
        acquires PlatformConfig {
        let c = borrow_global<PlatformConfig>(@pulse);
        (
            c.admin,
            c.platform_wallet,
            c.fee_bps,
            c.vote_cost,
            c.community_pool,
            c.require_admin_approval,
            c.autoflag_enabled,
            c.pending_fee_bps,
            c.fee_change_at,
            c.has_pending_fee_change,
        )
    }

    #[view]
    public fun get_credibility_score(creator: address): u64 acquires ContentRegistry {
        if (!exists<ContentRegistry>(@pulse)) return 50;
        let reg = borrow_global<ContentRegistry>(@pulse);
        let len = vector::length(&reg.contents);
        let upvotes = 0u64;
        let downvotes = 0u64;
        let total_sales = 0u64;
        let i = 0u64;
        while (i < len) {
            let c = vector::borrow(&reg.contents, i);
            if (c.creator == creator) {
                upvotes = upvotes + c.upvotes;
                downvotes = downvotes + c.downvotes;
                total_sales = total_sales + c.total_sales;
            };
            i = i + 1;
        };
        let total_votes = upvotes + downvotes;
        let ratio_x100 = if (total_votes == 0) 50 else (upvotes * 100) / total_votes;
        let sales_x100 = if (total_sales >= 100) 100 else total_sales;
        ((ratio_x100 * 50) + (sales_x100 * 30)) / 100
    }
}
