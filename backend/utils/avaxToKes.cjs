/**
 * Real-time AVAX → KES price converter
 * Sources: Binance (AVAX/USDT) × ExchangeRate-API (USD/KES)
 * Cached 5 min. No API key required.
 */
'use strict';

const axios = require('axios');

let cachedRate = null;
let cacheSetAt = 0;
const TTL_MS = 5 * 60 * 1000;
const FALLBACK = 3500;

const BINANCE = 'https://api.binance.com/api/v3/ticker/price?symbol=AVAXUSDT';
const FX_API = 'https://open.er-api.com/v6/latest/USD';

async function getAvaxKesRate() {
    const now = Date.now();

    if (cachedRate && (now - cacheSetAt) < TTL_MS) {
        return cachedRate;
    }

    try {
        const binRes = await axios.get(BINANCE, { timeout: 7000 });
        const fxRes = await axios.get(FX_API, { timeout: 7000 });

        const avaxUsd = Number(binRes.data && binRes.data.price);
        const usdKes = Number(fxRes.data && fxRes.data.rates && fxRes.data.rates.KES);

        if (!avaxUsd || !usdKes || isNaN(avaxUsd) || isNaN(usdKes)) {
            console.warn(
                '[avaxToKes] Bad payload — avaxUsd:', avaxUsd,
                'usdKes:', usdKes, '— using fallback', FALLBACK
            );
            return FALLBACK;
        }

        cachedRate = Math.round(avaxUsd * usdKes);
        cacheSetAt = now;
        console.log('[avaxToKes] 💱 1 AVAX =', cachedRate, 'KES (live)');
        return cachedRate;

    } catch (err) {
        console.warn(
            '[avaxToKes] Fetch error — code:', err.code,
            'msg:', err.message || '(empty)',
            'status:', err.response && err.response.status,
            '— fallback:', FALLBACK
        );
        return FALLBACK;
    }
}

async function avaxToKes(avaxAmount) {
    const rate = await getAvaxKesRate();
    const kes = parseFloat(avaxAmount) * rate;
    return kes >= 1 ? Math.round(kes) : parseFloat(kes.toFixed(2));
}

function formatKes(kes) {
    return kes >= 1
        ? Math.round(kes).toLocaleString('en-KE') + ' KES'
        : kes.toFixed(2) + ' KES';
}

module.exports = { getAvaxKesRate, avaxToKes, formatKes };
