import React, { createContext, useContext, useState, useEffect } from 'react';

// Exchange rates
const RATES = { AVAX_TO_USDT: 35.50, USDT_TO_KSH: 129.50, AVAX_TO_KSH: 4597.25 };

const fetchRates = async () => {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd');
    const data = await res.json();
    const avaxUsd = data['avalanche-2']?.usd || RATES.AVAX_TO_USDT;
    return { AVAX_TO_USDT: avaxUsd, USDT_TO_KSH: RATES.USDT_TO_KSH, AVAX_TO_KSH: avaxUsd * RATES.USDT_TO_KSH };
  } catch { return RATES; }
};

const convert = (avax, to, rates) => {
  const val = parseFloat(avax);
  if (isNaN(val)) return '0.00';
  if (to === 'AVAX') return val.toFixed(4);
  if (to === 'USDT') return (val * rates.AVAX_TO_USDT).toFixed(2);
  return (val * rates.AVAX_TO_KSH).toFixed(2);
};

const toAVAX = (amount, from, rates) => {
  const val = parseFloat(amount);
  if (isNaN(val)) return '0';
  if (from === 'AVAX') return val.toString();
  if (from === 'USDT') return (val / rates.AVAX_TO_USDT).toString();
  return (val / rates.AVAX_TO_KSH).toString();
};

// Context
const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => localStorage.getItem('preferredCurrency') || 'AVAX');
  const [rates, setRates] = useState(RATES);

  useEffect(() => {
    fetchRates().then(setRates);
    const interval = setInterval(() => fetchRates().then(setRates), 300000);
    return () => clearInterval(interval);
  }, []);

  const changeCurrency = (curr) => {
    setCurrency(curr);
    localStorage.setItem('preferredCurrency', curr);
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      changeCurrency,
      convert: (avax) => convert(avax, currency, rates),
      toAVAX: (amt) => toAVAX(amt, currency, rates),
      format: (avax) => {
        const symbols = { AVAX: 'AVAX ', USDT: 'USDT ', KSH: 'KSh ' };
        return `${symbols[currency]}${convert(avax, currency, rates)}`;
      }
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);

// Price Display Component
export const PriceDisplay = ({ avaxAmount, showEquivalent = true }) => {
  const { format, currency } = useCurrency();
  return (
    <span>
      {format(avaxAmount)}
      {showEquivalent && currency !== 'AVAX' && (
        <span className="text-xs text-gray-400 ml-2">
          (≈ {parseFloat(avaxAmount).toFixed(4)} AVAX)
        </span>
      )}
    </span>
  );
};
