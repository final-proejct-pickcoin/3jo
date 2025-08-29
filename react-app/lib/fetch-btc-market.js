import axios from "axios";


  const fastapiUrl = process.env.NEXT_PUBLIC_FASTAPI_BASE_URL;
  const springUrl  = process.env.NEXT_PUBLIC_SPRING_BASE_URL;
  const clean = (u) => (u || "").replace(/\/$/, "");
  
export async function fetchBtcMarketCoins() {
  const res = await axios.get(`${clean(fastapiUrl)}/api/coins/btc`);
  if (res.data && res.data.status === "success") {
    return res.data.data;
  }
  return [];
}
