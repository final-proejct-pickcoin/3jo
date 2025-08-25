// utils/upbit-asset-info.js
// 업비트 디지털 자산 소개 fetcher (비공식)

/**
 * 업비트 디지털 자산 소개를 symbol(예: BTC)로 가져온다.
 * @param {string} symbol - 코인 심볼 (예: BTC)
 * @returns {Promise<string>} - 소개 텍스트(HTML)
 */
export async function fetchUpbitAssetInfo(symbol) {
  // 업비트 공식 API에는 자산 소개가 없으므로, 프론트엔드에서 사용하는 비공식 API를 사용
  // 예시: https://api.upbit.com/v1/coin_info?symbol=BTC-KRW
  // 실제로는 업비트 웹에서 사용하는 내부 API를 크롤링해야 할 수 있음
  // 아래는 예시 URL (실제 동작은 보장되지 않음)
  try {
    const market = symbol.toUpperCase() + '-KRW';
    const url = `https://api.upbit.com/v1/coin_info?symbol=${market}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Upbit API error');
    const data = await res.json();
    // data[0].description 또는 data[0].project_info?.description 등에서 소개 추출
    const info = data[0]?.project_info?.description || data[0]?.description || '';
    return info;
  } catch (e) {
    return '';
  }
}
