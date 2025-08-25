'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";

/* ---------------------- 공용 유틸 ---------------------- */
const KRW = n => (Number(n ?? 0)).toLocaleString("ko-KR");
const pct = n => `${Number(n ?? 0).toFixed(2)}%`;
const toMillionKRW = n =>
  `${(Number(n ?? 0) / 1_000_000).toLocaleString("ko-KR")} 백만`;

async function jget(url) {
  const r = await fetch(url);
  const j = await r.json();
  return j?.data ?? j; // 우리 API는 {status,data} 형태
}

function StarIcon({ filled = false, size = 18, className = "" }) {
  const d = "M12 17.27 18.18 21 16.54 13.97 22 9.24 14.81 8.62 12 2 9.19 8.63 2 9.24 7.46 13.97 5.82 21 12 17.27Z";
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      {filled ? (
        <path d={d} fill="currentColor" />
      ) : (
        <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" />
      )}
    </svg>
  );
}

/* ---------------------- 목록 컴포넌트 ---------------------- */
function CoinList({ coins, onPick, loading }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("won"); // won | hold | star
  const [favs, setFavs] = useState(new Set());

  // 관심 저장/로드
  useEffect(() => {
    const raw = localStorage.getItem("pc_favs");
    if (raw) setFavs(new Set(JSON.parse(raw)));
  }, []);
  useEffect(() => {
    localStorage.setItem("pc_favs", JSON.stringify([...favs]));
  }, [favs]);
  const toggleFav = (sym) =>
    setFavs(prev => {
      const next = new Set(prev);
      next.has(sym) ? next.delete(sym) : next.add(sym);
      return next;
    });

  const filtered = useMemo(() => {
    let list = coins;
    if (q) {
      const s = q.toLowerCase();
      list = list.filter(
        c =>
          c.symbol.toLowerCase().includes(s) ||
          (c.korean_name ?? "").toLowerCase().includes(s)
      );
    }
    if (tab === "star") list = list.filter(c => favs.has(c.symbol));
    if (tab === "hold") list = list.filter(c => Number(c.balance ?? 0) > 0);
    return list;
  }, [coins, q, tab, favs]);

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-5xl font-semibold text-center text-gray-600 mb-3">종목 (상품)</h2>
            <br/>

        {/* 검색 입력 + 돋보기 아이콘 */}
        <div className="flex items-center gap-1 mb-1">
          <svg
            className="text-gray-400 mr-1"
            width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="w-full border rounded-lg pl-4 pr-3 py-2 text-lg"
            placeholder="코인명/심볼검색"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>

        {/* 원화/보유/관심 탭 */}
        <div className="flex rounded-md max-w-3xl mx-auto overflow-hidden mt-5">
          {[
            { key: "won", label: "원화" },
            { key: "hold", label: "보유" },
            { key: "star", label: "관심" },
          ].map((t, i) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-center text-base font-semibold transition-colors
                ${tab === t.key
                  ? "bg-white text-black font-bold border-b-2 border-transparent"
                  : "bg-gray-100 text-gray-400 font-normal border-b-2 border-transparent"}
                ${i === 0 ? "rounded-l-xl" : ""} ${i === 2 ? "rounded-r-xl" : ""}`}
              style={{ minWidth: 0 }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden bg-white">
        {/* sticky header */}
        <div className="grid grid-cols-[70px_250px_150px_320px_320px] bg-gray-50 px-4 py-2 text-xs font-semibold sticky top-0 z-10">
          <div className="text-center" />
          <div className="text-left text-gray-500 text-[0.9rem] font-bold">한글명</div>
          <div className="text-right text-gray-500 text-[0.9rem] font-bold">현재가</div>
          <div className="text-right text-gray-500 text-[0.9rem] font-bold">전일대비</div>
          <div className="text-right text-gray-500 text-[0.9rem] font-bold">거래대금</div>
        </div>

        <div className="max-h-[72vh] overflow-auto divide-y">
          {loading && (
            <div className="p-6 text-center text-gray-400 text-sm">로딩 중…</div>
          )}
          {!loading &&
            filtered.map(row => (
              <RowItem
                key={row.symbol}
                row={row}
                onPick={onPick}
                fav={favs.has(row.symbol)}
                onToggleFav={() => toggleFav(row.symbol)}
              />
            ))}
        </div>
      </div>
    </div>
  );
}


function RowItem({ row, onPick, fav, onToggleFav }) {
  const rate = Number(row.change_rate || 0);
  const price = Number(row.current_price || 0);
  const deltaAbs = price * (rate / 100); // 전일 대비 절대 금액(근사)

  return (
    <button
      onClick={() => onPick(row.symbol)}
      className="w-full grid grid-cols-[70px_250px_150px_320px_350px] items-center px-4 py-2 hover:bg-gray-50 text-sm"
    >
      {/* 관심 */}
      <div className="flex justify-center">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
          className="cursor-pointer"
          aria-label="관심"
          title="관심"
        >
          <StarIcon filled={fav} size={22} className={fav ? "text-yellow-400" : "text-gray-400"} />
        </button>
      </div>

      {/* 한글명 + 심볼/KRW */}
      <div className="truncate">
        <div className="text-left truncate text-md font-bold">{row.korean_name || row.symbol}</div>
        <div className="text-left text-md text-gray-400">{row.symbol}/KRW</div>
      </div>

      {/* 현재가 */}
      <div className="text-right tabular-nums text-2xl font-semibold">{KRW(price)}</div>

      {/* 전일대비 + 절대변화 */}
      <div className={`text-right text-[1.08rem] font-medium ${rate >= 0 ? "text-red-600" : "text-blue-600"}`}>
        <div>{pct(rate)}</div>
        <div className={`text-[1.08rem] font-medium ${rate >= 0 ? "+"+"text-red-600" : "text-blue-600"}`}>
          {rate >= 0 ? "+" : "-"}{KRW(Math.abs(deltaAbs))}
        </div>
      </div>

      {/* 거래대금 */}
      <div className="text-right text-2xl font-medium tabular-nums">
        {Math.round(Number(row.volume || 0) / 1_000_000).toLocaleString("ko-KR")}
        <span className="ml-1 text-2xl font-medium">백만</span>
      </div>
    </button>
  );
}


/* ---------------------- 상세 header ---------------------- */
function CoinDetailHeader({ symbol, detail, live }) {
  const price =
    live?.closePrice ??
    detail?.current_price ??
    detail?.global_price_krw ??
    0;
  const rate = detail?.change_rate ?? detail?.global_change_24h ?? 0;

  return (
    <div className="flex items-center justify-between">
      <div className="text-xl font-bold">
        {detail?.korean_name || symbol} <span className="text-gray-400">/ {symbol}</span>
      </div>
      <div className="flex items-baseline gap-3">
        <div className="text-2xl font-extrabold">{KRW(price)} 원</div>
        <div className={Number(rate) >= 0 ? "text-red-600" : "text-blue-600"}>
          {pct(rate)}
        </div>
      </div>
    </div>
  );
}

function CoinTickerStrip({ symbol, detail, live }) {
  const price = live?.closePrice ?? detail?.current_price ?? 0;
  const rate  = detail?.change_rate ?? 0;

  return (
    <div className="flex items-center justify-between bg-blue-50 border rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        {/* 심볼칩(임시) */}
        <div className="w-6 h-6 rounded bg-blue-500 text-white grid place-items-center text-xs font-bold">
          {symbol?.[0] || "-"}
        </div>
        <div className="text-sm leading-tight">
          <div className="font-semibold">{detail?.korean_name || symbol}</div>
          <div className="text-gray-400 text-[11px]">{symbol}/KRW</div>
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <div className="text-base sm:text-lg font-semibold">{KRW(price)} 원</div>
        <div className={`text-xs ${rate >= 0 ? "text-red-600" : "text-blue-600"}`}>
          {rate >= 0 ? "+" : ""}{pct(rate)}
        </div>
      </div>
    </div>
  );
}

/* ---------------------- 차트 박스 (옵션 바 포함) ---------------------- */
function ChartBox({ symbol }) {
  const [range, setRange] = useState("1D");
  const [indis, setIndis] = useState([]);
  const toggleIndi = (k) =>
    setIndis(prev => (prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]));

  const ranges = ["1H","1D","1W","1M","3M","1Y"];
  const overlays = ["SMA","EMA","BOLL"];
  const oscillators = ["MACD","RSI","Williams %R","ATR"];

  return (
    <div className="rounded-2xl border bg-white">
      {/* 상단 바: 좌측 타임프레임, 우측 설정/리셋 */}
      <div className="flex items-center justify-between px-4 py-3 border-b font-medium">
        <div className="flex items-center gap-2">
          {ranges.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-lg text-sm border ${
                range === r ? "bg-gray-900 text-white" : "bg-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 rounded-lg text-sm border">설정</button>
          <button
            onClick={() => { setRange("1D"); setIndis([]); }}
            className="px-3 py-1 rounded-lg text-sm border"
          >
            리셋
          </button>
        </div>
      </div>

      {/* 두 번째 줄: 지표 토글 */}
      <div className="flex items-center gap-3 px-4 py-2 border-b text-sm">
        <div className="text-gray-500">중첩</div>
        <div className="flex gap-2">
          {overlays.map(k => (
            <button
              key={k}
              onClick={() => toggleIndi(k)}
              className={`px-2 py-1 rounded border ${
                indis.includes(k) ? "bg-gray-900 text-white" : "bg-white"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="ml-4 text-gray-500">오실레이터</div>
        <div className="flex gap-2">
          {oscillators.map(k => (
            <button
              key={k}
              onClick={() => toggleIndi(k)}
              className={`px-2 py-1 rounded border ${
                indis.includes(k) ? "bg-gray-900 text-white" : "bg-white"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* 실제 차트 자리(라이브러리 붙이기 전 placeholder) */}
      <div className="h-[460px] flex items-center justify-center text-gray-400">
        차트 – {symbol} / {range} / {indis.join(", ") || "지표 없음"}
      </div>
    </div>
  );
}

/* ---------------------- 주문 패널 ---------------------- */
function OrderPanel({ symbol, price = 0, tickSize = 1, side = "sell", onChangeSide = () => {} }) {
  const [qty, setQty] = useState("");
  const [tab, setTab] = useState("limit"); // limit | market
  const add = step => setQty(q => String((Number(q || 0) + step).toFixed(4)));

  return (
    <div className="rounded-2xl border bg-white p-4">
      {/* 매수/매도/거래내역 작은 탭 */}
      <div className="grid grid-cols-3 text-center text-sm mb-3 rounded-lg overflow-hidden border">
        {[
          {k:"buy",     label:"매수"},
          {k:"sell",    label:"매도"},
          {k:"history", label:"거래 내역"},
        ].map(({k,label}, i) => (
          <button
            key={k}
            onClick={() => onChangeSide(k)}
            className={`py-2 font-semibold ${side===k ? "bg-gray-900 text-white" : "bg-white"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-3">
        {["limit", "market"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded-lg text-sm border ${
              tab === t ? "bg-gray-900 text-white" : "bg-white"
            }`}
          >
            {t === "limit" ? "지정가" : "시장가"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="text-sm text-gray-500">체결가 (KRW)</div>
        <input
          disabled={tab === "market"}
          defaultValue={price}
          className="w-full border rounded-lg px-3 py-2 font-semibold"
        />

        <div className="text-sm text-gray-500">주문수량 (Symbol)</div>
        <div className="flex gap-2">
          <input
            value={qty}
            onChange={e => setQty(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2"
            placeholder="0"
          />
          {[0.1, 0.25, 0.5].map(s => (
            <button
              key={s}
              onClick={() => add(s)}
              className="px-3 py-2 rounded-lg border"
            >
              +{s}
            </button>
          ))}
          <button onClick={() => setQty("")} className="px-3 py-2 rounded-lg border">
            초기화
          </button>
        </div>

        <div className="text-sm text-gray-500">주문총액 (KRW)</div>
        <input
          value={qty ? KRW(Number(qty) * Number(price || 0)) : ""}
          readOnly
          className="w-full border rounded-lg px-3 py-2"
          placeholder="0"
        />

        <button
          className={`w-full py-3 rounded-xl text-white font-semibold
            ${side === "buy" ? "bg-blue-600" : "bg-red-600"}`}
        >
          {side === "buy" ? "매수" : side === "sell" ? "매도" : "거래 내역 보기"}
        </button>

        <div className="text-xs text-gray-400">
          호가단위: {tickSize} (서버 기준)
        </div>
      </div>
    </div>
  );
}

/* ---------------------- 호가 ---------------------- */
function Orderbook({ orderbook, highlightPrice }) {
  const bids = orderbook?.bids ?? [];
  const asks = orderbook?.asks ?? [];
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="font-semibold mb-2">호가</div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-500 text-xs mb-1">매수호가</div>
          <div className="space-y-1 max-h-[220px] overflow-auto pr-2">
            {bids.map((b, i) => (
              <div
                key={i}
                className={`flex justify-between px-2 py-1 rounded ${
                  Number(b.price) === Number(highlightPrice) ? "bg-yellow-50" : ""
                }`}
              >
                <span>{KRW(Number(b.price))}</span>
                <span className="text-gray-500">{KRW(Number(b.quantity))}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-gray-500 text-xs mb-1">매도호가</div>
          <div className="space-y-1 max-h-[220px] overflow-auto pr-2">
            {asks.map((a, i) => (
              <div key={i} className="flex justify-between px-2 py-1 rounded">
                <span>{KRW(Number(a.price))}</span>
                <span className="text-gray-500">{KRW(Number(a.quantity))}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------- 거래정보(아코디언 컨텐츠) ---------------------- */
function TradeStats({ detail }) {
  const rows = [
    ["거래대금(24H)", `${KRW(detail?.bithumb_volume ?? detail?.total_volume)} 원`],
    ["전일대비", pct(detail?.change_rate ?? detail?.global_change_24h)],
    ["시총(전세계)", `${KRW(detail?.global_market_cap ?? 0)} 원`],
    ["가격(USD)", `$${Number(detail?.global_price_usd ?? 0).toFixed(2)}`],
  ];
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="font-semibold mb-2">거래정보</div>
      <div className="text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between py-1 border-b last:border-0">
            <span className="text-gray-500">{k}</span>
            <span className="font-medium">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------- 코인정보 탭 ---------------------- */
function CoinInfoBox({ detail }) {
  if (!detail) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-sm text-gray-400">
        로딩 중…
      </div>
    );
  }
  const supply =
    detail?.supply_info?.used_for_calculation ??
    detail?.circulating_supply ??
    0;

  const rows = [
    ["한글명", detail.korean_name],
    ["심볼", detail.symbol],
    ["글로벌 가격(USD)", `$${Number(detail.global_price_usd ?? 0).toFixed(2)}`],
    ["글로벌 시총(KRW)", `${KRW(detail.global_market_cap ?? 0)} 원`],
    ["유통량", Number(supply).toLocaleString()],
    ["웹사이트", detail.homepage || detail.explorer || "-"],
    ["GitHub", detail?.repos_url?.github || "-"],
    ["Twitter", detail?.twitter_screen_name ? `@${detail.twitter_screen_name}` : "-"],
  ];

  return (
    <div className="rounded-2xl border bg-white p-6">
      <div className="text-lg font-semibold mb-3">코인정보</div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        {rows.map(([k, v]) => (
          <React.Fragment key={k}>
            <div className="text-gray-500">{k}</div>
            <div className="font-medium truncate">{String(v)}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ---------------------- 메인 단일 파일 앱 ---------------------- */
export default function TradingInterface() {
  const [view, setView] = useState("list"); // list | detail
  const [symbol, setSymbol] = useState(null);

  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);

  const [detail, setDetail] = useState(null);
  const [orderbook, setOrderbook] = useState(null);
  const [tickSize, setTickSize] = useState(1);
  const [live, setLive] = useState(null);

  // 상세 하위 탭/패널/아코디언
  const [subTab, setSubTab] = useState("chart");
  const [pane, setPane] = useState("trade");
  const [side, setSide] = useState("sell"); // 'buy' | 'sell' | 'history'
  const [showInfo, setShowInfo] = useState(false);

  const wsRef = useRef(null);

  // 목록
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await jget("http://localhost:8000/api/coins");
        if (mounted) setCoins(data ?? []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    const id = setInterval(async () => {
      const data = await jget("http://localhost:8000/api/coins");
      setCoins(data ?? []);
    }, 30000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  // 상세 로드
  useEffect(() => {
    if (!symbol) return;
    (async () => {
      const d = await jget(`http://localhost:8000/api/coin/${symbol}`);
      setDetail(d);
      const ob = await jget(`http://localhost:8000/api/orderbook/${symbol}`);
      setOrderbook(ob);
      setTickSize(ob?.tick_size ?? 1);
    })();
  }, [symbol]);

  // 실시간 WS(선택 종목만 강조)
  useEffect(() => {
    if (!symbol) return;
    const ws = new WebSocket("ws://localhost:8000/api/realtime");
    wsRef.current = ws;
    ws.onmessage = ev => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "ticker" && msg.content?.symbol?.startsWith(symbol)) {
          setLive(msg.content);
        }
      } catch {}
    };
    return () => ws.close();
  }, [symbol]);

  const goDetail = sym => {
    setSymbol(sym);
    setView("detail");
    // 상세 진입 시 초기 상태
    setSubTab("chart");
    setPane("trade");
    setShowInfo(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar 대용 */}
      <div className="px-6 py-4 border-b bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-2xl font-extrabold">거래소</div>
          <div className="text-xs text-gray-400">실시간 업데이트</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 bg-white">
        {view === "list" && (
          <CoinList coins={coins} loading={loading} onPick={goDetail} />
        )}

        {view === "detail" && (
          <div className="grid grid-cols-[320px_1fr] gap-6">
            {/* 좌측 사이드 – 목록(상단 고정) */}
            <div className="sticky top-6 h-fit">
              <CoinList coins={coins} loading={loading} onPick={goDetail} />
            </div>

            {/* 본문 */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setView("list")}
                  className="text-sm text-gray-500 hover:underline"
                >
                  ← 목록으로
                </button>
                <div />
              </div>

              <CoinDetailHeader symbol={symbol} detail={detail} live={live} />
              <CoinTickerStrip   symbol={symbol} detail={detail} live={live} />

              {/* 서브탭: 차트 / 코인정보 */}
              <div className="flex items-center gap-2 mb-2">
                {[
                  { key: "chart", label: "차트" },
                  { key: "info",  label: "코인정보" },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setSubTab(t.key)}
                    className={`px-3 py-1 rounded-lg text-sm border ${
                      subTab === t.key ? "bg-gray-900 text-white" : "bg-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {subTab === "chart" ? (
                <>
                  <ChartBox symbol={symbol} />

                  {/* 하단: 거래/호가 세그먼트 + 거래정보 버튼 */}
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex-1 grid grid-cols-2 rounded-lg overflow-hidden border">
                      <button
                        onClick={() => setPane("trade")}
                        className={`py-2 font-semibold ${pane === "trade" ? "bg-gray-900 text-white" : "bg-white"}`}
                      >
                        거래
                      </button>
                      <button
                      onClick={() => setPane("orderbook")}
                        className={`py-2 font-semibold border-l ${pane === "orderbook" ? "bg-gray-900 text-white" : "bg-white"}`}
                      >
                        호가
                      </button>
                    </div>
                    <button
                      onClick={() => setShowInfo(s => !s)}
                      className="px-4 py-2 rounded-lg border"
                    >
                      거래정보
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mt-4">
                    {/* 왼쪽: 거래 또는 호가 */}
                    {pane === "trade" ? (
                      <OrderPanel
                        symbol={symbol}
                        price={live?.closePrice ?? detail?.current_price}
                        tickSize={tickSize}
                        side={side}
                        onChangeSide={setSide}
                      />
                    ) : (
                      <Orderbook
                        orderbook={orderbook}
                        highlightPrice={live?.closePrice}
                      />
                    )}

                    {/* 오른쪽: 거래정보(토글) */}
                    {showInfo ? (
                      <TradeStats detail={detail} />
                    ) : (
                      <div className="rounded-2xl border bg-white p-4 text-sm text-gray-400 flex items-center justify-center">
                        거래정보 버튼을 눌러 열 수 있어요
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <CoinInfoBox detail={detail} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* 푸터(간단) */}
      <footer className="mt-10 border-t bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-4 gap-6 py-8 text-xs text-gray-600">
          <div>
            <div className="font-semibold mb-2">PickCoin</div>
            <div className="text-gray-400">가상의 암호화폐 거래 플랫폼.</div>
          </div>
          <div>
            <div className="font-semibold mb-2">Platform</div>
            <ul className="space-y-1 text-gray-500">
              <li>트레이딩 지원센터</li><li>보안관</li><li>표준용어 집대성</li><li>AI 어시스턴트</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Resources</div>
            <ul className="space-y-1 text-gray-500">
              <li>문서</li><li>API 참조</li><li>커뮤니티</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Company</div>
            <ul className="space-y-1 text-gray-500">
              <li>About Us</li><li>개인정보 처리</li><li>서비스 약관</li><li>Contact</li>
            </ul>
          </div>
        </div>
        <div className="text-center text-[11px] text-gray-400 pb-8">
          © 2025 PickCoin. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
