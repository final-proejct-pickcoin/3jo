const DEFAULT_KRW_RATE = 1350;
const API_URL = "https://api.exchangerate.host/latest?base=USD&symbols=KRW";

// Fetches the latest USD/KRW exchange rate from a public API
export async function getKrwRate() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    return data.rates?.KRW ?? DEFAULT_KRW_RATE;
  } catch {
    return DEFAULT_KRW_RATE; // fallback to a typical value
  }
}
