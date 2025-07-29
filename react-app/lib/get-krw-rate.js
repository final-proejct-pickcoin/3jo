// Fetches the latest USD/KRW exchange rate from a public API
export async function getKrwRate() {
  try {
    const res = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=KRW")
    const data = await res.json()
    return data.rates.KRW
  } catch (e) {
    return 1350 // fallback to a typical value
  }
}
