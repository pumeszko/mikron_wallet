import { defineError } from 'ember-exex/error';

export const MIKRON = Symbol.for('MIKRON');
export const BTC = Symbol.for('BTC');
export const USD = Symbol.for('USD');
export const EUR = Symbol.for('EUR');

export const CURRENCIES = new Set([
  MIKRON, EUR, BTC,
]);
//  BTC, USD, EUR,

export const DEFAULT_CURRENCY = MIKRON;
export const DEFAULT_EXCHANGE_RATE = 1;

export const InvalidCurrencyError = defineError({
  name: 'InvalidCurrencyError',
  message: 'Invalid currency: {currency}',
  extends: TypeError,
});

export const RequestExchangeRateError = defineError({
  name: 'RequestExchangeRateError',
  message: 'Error requesting exchange rate',
});

export const InvalidExchangeRateError = defineError({
  name: 'InvalidExchangeRateError',
  message: 'Invalid exchange rate: {value}',
  extends: TypeError,
});

async function getMikronRateFromMikronIo(currencyTo, currencyFrom) {
  const urlTemplate = 'https://mikron.io/rates/mikron/{currency_to}';
  if (currencyTo.toLowerCase() !== 'mikron') {
    throw new InvalidCurrencyError({ params: { currencyTo } });
  }
  const currency = currencyFrom.toLowerCase();
  if (currency !== 'btc' && currency !== 'eur' && currency !== 'usd') {
    throw new InvalidCurrencyError({ params: { currency } });
  }
  const url = urlTemplate.replace('{currency_to}', currency);
  const http = new XMLHttpRequest();
  await http.open('GET', url, false);
  await http.send();
  if (http.status !== 200) {
    throw new InvalidCurrencyError({ params: { currency } });
  }
  const respJson = JSON.parse(http.responseText);
  return respJson.value;
}

export default async function getExchangeRate(currency = DEFAULT_CURRENCY) {
  if (currency === DEFAULT_CURRENCY) {
    return DEFAULT_EXCHANGE_RATE;
  }

  if (!CURRENCIES.has(currency)) {
    throw new InvalidCurrencyError({ params: { currency } });
  }

  const asset = Symbol.keyFor(DEFAULT_CURRENCY);
  const convert = Symbol.keyFor(currency).toLowerCase();

  let exchangeRate;
  try {
    exchangeRate = await getMikronRateFromMikronIo(asset, convert);
  } catch (err) {
    throw new InvalidExchangeRateError({ params: { convert } }).withPreviousError(err);
  }

  return exchangeRate;
}
