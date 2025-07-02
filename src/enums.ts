export enum CsFloatTransactionType {
    Unknown = 'unknown',
    BidPosted = 'bid_posted',
    ContractPurchased = 'contract_purchased',
    Deposit = 'deposit',
    Withdrawal = 'withdrawal',
    OfferSent = 'offer_sent',
    OfferReceived = 'offer_received',
    OfferAccepted = 'offer_accepted',
    OfferCancelled = 'offer_cancelled',
    OfferRejected = 'offer_rejected',
    TradeCompleted = 'trade_completed',
    TradeFailed = 'trade_failed',
    TradeCancelled = 'trade_cancelled',
    TradeDisputeOpened = 'trade_dispute_opened',
    TradeDisputeResolved = 'trade_dispute_resolved',
    TradeDisputeRejected = 'trade_dispute_rejected',
    TradeDisputeEscalated = 'trade_dispute_escalated',
}

export enum Rarity {
    Consumer = 0,
    Industrial = 1,
    MilSpec = 2,
    Restricted = 3,
    Classified = 4,
    Covert = 5,
    Contraband = 6,
}