import axios from "axios";

export async function fetchBtcMarketCoins() {
  const res = await axios.get("http://localhost:8000/api/coins/btc");
  if (res.data && res.data.status === "success") {
    return res.data.data;
  }
  return [];
}
