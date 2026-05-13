// Test the actual module to see which step fails
'use strict';
const axios = require('axios');

async function test() {
    console.log('Step 1: calling Binance...');
    const binRes = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=AVAXUSDT', { timeout: 7000 });
    console.log('Step 1 OK:', binRes.data.price);

    console.log('Step 2: calling ExchangeRate-API...');
    const fxRes = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 7000 });
    console.log('Step 2 OK: KES =', fxRes.data.rates.KES);

    const rate = Math.round(Number(binRes.data.price) * fxRes.data.rates.KES);
    console.log('FINAL RATE:', rate, 'KES/AVAX');
}

test().catch(e => console.error('FAILED — code:', e.code, '| msg:', e.message || '(empty)', '| status:', e.response && e.response.status));
