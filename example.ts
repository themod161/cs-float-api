
import { BuyOrderExpressionBuilder } from './src/BuyOrderExpressionBuilder';
import { CsFloatClient } from './src/index';
import { SchemaFetcher } from './src/SchemaFetcher';
import { Rarity } from './src/enums';

const client = new CsFloatClient({
    //apiKey: "<API_KEY>"
    session: '',
});


(async () => {
    // const me = await client.getMe();
    // console.log('User info:', me);

    // console.log('Rate limit info:', client.getRateLimit());
    // const listings = await client.getListings();
    // console.log('Rate limit listings info:', client.getRateLimit("listings"));

    // const buyOrders = await client.getBuyOrders(0, 10, 'desc');
    // console.log('Buy orders:', buyOrders.orders);
    // const buyOrdersToDelete = buyOrders.orders.map(async order => await client.deleteBuyOrder(order.id));
    // const res = await Promise.all(buyOrdersToDelete);
    // console.log('Deleted buy orders:', res);

    
    // // @ts-ignore
    // console.log('Parsed expression:', r.buildExpression().rules[3].expression.rules);

    // const weapon = await SchemaFetcher.getWeaponByMarketHashName('AK-47 | Redline (Field-Tested)');
    // if (!weapon) {
    //     console.error('Weapon not found');
    //     return;
    // }
    // const sticker = await SchemaFetcher.getCustomStickerByName('Sticker | vexite');
    // //console.log('Weapon info:', weapon);
    // //console.log('Sticker info:', sticker);
    // if (!sticker) {
    //     console.error('Sticker not found');
    //     return;
    // }

    // const builder = new BuyOrderExpressionBuilder()
    //     .addRule('DefIndex', '==', weapon.defIndex)
    //     .addRule('PaintIndex', '==', weapon.paintIndex)
    //     .addRule('FloatValue', '>', 0.3)
    //     .addRule('FloatValue', '<=', 0.4)
    //     .addGroup('or', g => {
    //         g.addStickerRule(+sticker.id, { qty: 5 });
    //     });


    // const buyOrders = await client.getBuyOrders(0, 10, 'desc');
    // const order = buyOrders.orders[0];
    // if (!order) {
    //     console.error('No buy orders found');
    //     return;
    // }

    // console.log('First buy order:', order);
    // const newOrder = await client.updateBuyOrderDetails(order, {
    //     expression: new BuyOrderExpressionBuilder("(DefIndex == 7 and PaintIndex == 316 and FloatValue == 0.3 and (HasSticker(5918, 1, 1) or HasSticker(5919, 1, 1)))").buildExpression(),
    //     max_price: 55
    // }).catch(error => {
    //     console.error('Error updating buy order:', error);
    //     return null;
    // });

    // if (!newOrder) {
    //     console.error('Failed to update buy order');
    //     return;
    // }
    // console.log('Updated buy order:', newOrder);


    // console.log('Rate limit info:', client.getRateLimits());

    // client.on('rateLimit:Update', (key, info) => {
    //     console.log(`[RateLimit] [${key}] updated: limit=${info.limit}, remaining=${info.remaining}, reset=${info.reset}`);
    // });
    // client.on('api:UpdateMe', (me) => {
    //     //console.log('User info updated:', me);
    // });

    
    // const r = new BuyOrderExpressionBuilder("(DefIndex == 7 and PaintIndex == 316 and FloatValue == 0.3 and (HasSticker(5918, 1, 1) or HasSticker(5919, 1, 1)))");

    // const body = r.buildExpression();
    // console.log('Buy order body:', JSON.stringify(body, null, 3));

    // const result = await client.placeBuyOrder({
    //     expression: body,
    //     max_price: 30,
    //     quantity: 1,
    // }).catch(error => {
    //     console.error('Error placing buy order:', error)
    // });
    // console.log('Buy order result:', result);

    // const newItem = await client.changeListingPrice("", 2000).catch(error => {
    //     console.error('Error changing listing price:', error)
    //     return null;
    // });
    // console.log('Changed listing price:', newItem);

    // const res = await client.acceptTrades([""]).catch(error => {
    //     console.error('Error accepting trades:', error)
    // });
    // console.log('Accepted trades:', res);

    // // Example of using steam-user and steam-tradeoffer-manager to fetch inventory and create a trade offer
    // manager.setCookies([""])
    // const offer = manager.createOffer("https://steamcommunity.com/tradeoffer/new/?partner=");
    // const promise = await new Promise((resolve, reject) => {
    //     manager.getInventoryContents(730, 2, true, (err, inventory) => {
    //         if (err) {
    //             console.error('Error fetching inventory:', err);
    //             reject(err);
    //             return;
    //         }
    //         inventory.forEach(item => {
    //             if (item.assetid === '34829593549') {
    //                 offer.addMyItem(item);
    //                 resolve(item);
    //             }
    //         })
    //         resolve(null);
    //     });
    // });
    // console.log('Inventory fetch promise resolved:', promise);

    // // Example of using steam-user and steam-tradeoffer-manager to fetch inventory and create a trade offer
    // manager.setCookies([""])
    // const offer = manager.createOffer("https://steamcommunity.com/tradeoffer/new/?partner=");
    // const promise = await new Promise((resolve, reject) => {
    //     manager.getInventoryContents(730, 2, true, (err, inventory) => {
    //         if (err) {
    //             console.error('Error fetching inventory:', err);
    //             reject(err);
    //             return;
    //         }
    //         inventory.forEach(item => {
    //             if (item.assetid === '34829593549') {
    //                 offer.addMyItem(item);
    //                 resolve(item);
    //             }
    //         })
    //         resolve(null);
    //     });
    // });
    // console.log('Inventory fetch promise resolved:', promise);

    // // Example of updating a trade offer (assuming you have the offer ID and other details)
    // const g = await client.updateTradeOffer({
    //     sent_offers: [{
    //         offer_id: '', // Replace with actual offer ID
    //         given_asset_ids: ['34829593549'], // Replace with actual asset IDs
    //         state: 3, // Check https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/blob/master/resources/ETradeStatus.js
    //         received_asset_ids: [],
    //         time_created: 1750964042,
    //         time_updated: 1750964450,
    //         other_steam_id64: '', // Replace with actual Steam ID (steam64)
    //     }],
    //     type: 1 // 1 for sent offers, 2 for received offers
    // })
    // console.log('Trade offer update result:', g);

    // const buyOrder = new BuyOrderExpressionBuilder();
    // const item = await SchemaFetcher.getWeaponByMarketHashName('AK-47 | Redline (Field-Tested)');
    // const sticker = await SchemaFetcher.getStickerByMarketHashName('Sticker | vexite | Paris 2023');
    // if (!item || !sticker) {
    //     console.error('Item or sticker not found');
    //     return;
    // }
    // buyOrder
    //     .addRule('DefIndex', '==', item.defIndex)
    //     .addRule('PaintIndex', '==', item.paintIndex)
    //     .addRule('FloatValue', '>', 0.3)
    //     .addRule('FloatValue', '<=', 0.4)
    //     .addGroup('or', g => {
    //         g.addStickerRule(+sticker.id, { qty: 5 });
    //         g.addRule('Rarity', '==', Rarity.Classified);
    //     });

    // const body = buyOrder.buildBuyOrder(30, 1);
    // console.log('Buy order body:', JSON.stringify(body, null, 3));

    // const m = await client.placeBuyOrder({
    //     market_hash_name: 'AK-47 | Redline (Field-Tested)',
    //     "max_price": 30,
    //     "quantity": 1,
    //     //or
    //     expression: body,
    //     "max_price": 30,
    //     "quantity": 1
    // });
    // console.log('Placed buy order:', m);

    // const r = new BuyOrderExpressionBuilder("(DefIndex == 7 and PaintIndex == 316 and (((FloatValue >= 0.4 and FloatValue < 0.7) or (StatTrak == true)) and (HasSticker(5918, 1, 1) or HasSticker(5919, 1, 1))))");

    // const body = await r.getSkinVariants();
    // console.log('Generated skin variants:', JSON.stringify(body, null, 3));

    // const rdd = new BuyOrderExpressionBuilder().createExpressionsFromVariants(body);
    // console.log('Generated expressions:', JSON.stringify(rdd, null, 3));
})();
