// components/watchlist-manager.jsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";
import { Bell, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:8080/api/mypage";
//const default_user_id = 12; // 추후 JWT로 대체


//=====================
//1) JWT 파싱 함수 (UTF-8 안전)
function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
    return JSON.parse(json);
  } catch (e) {
    console.error("JWT 파싱 실패:", e);
    return null;
  }
}

// 2) 이메일 → user_id 조회 (백엔드에 맞는 URL 하나로 변경)
// async function fetchUserIdByEmail(email, token) {
//  //백엔드에 실제로 있는 “조회용 GET API 하나”로 변경
//   //예시 후보(하나만 살리고 나머진 지워도 됨):
//   const url = `/api/auth/me`;                                   // 토큰만으로 현재 유저 반환형
//   //const url = `/api/users/by-email?email=${encodeURIComponent(email)}`; // 이메일 쿼리형
//   //const url = `/api/users/email/${encodeURIComponent(email)}`;          // 이메일 path형

//   const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
//   if (!res.ok) throw new Error("user_id 조회 실패");
//   const data = await res.json();

//   //응답 스키마에 맞게 user_id 뽑기 (필요시 키 이름 수정)
//   //return data.user_id ?? data.id ?? data?.data?.user_id ?? data?.data?.id ?? null;
// }
//====================
// AuthController 만들기 전
// async function fetchUserIdFromToken(token) {
//   const res = await fetch("http://localhost:8080/api/auth/me", {
//     headers: { Authorization: `Bearer ${token}` },
//   });
//   if (!res.ok) throw new Error("user_id 조회 실패");
//   const data = await res.json();
//   return data.user_id ?? null;
// }


//===================

// AuthController 만들고 나서
async function fetchUserIdFromToken(token) {
  try {
    const res = await fetch("http://localhost:8080/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    // 200이더라도 ok=false일 수 있으니 JSON을 보고 판단
    const data = await res.json().catch(() => ({}));
    if (data && data.ok && (data.user_id ?? null) != null) {
      return Number(data.user_id);
    }
    // id가 없고 email만 온 경우: 필요하면 여기서 email로 백엔드에 user_id 조회 API를 더 호출
    console.warn("[/api/auth/me] no user_id; payload =", data);
    return null;
  } catch (e) {
    console.warn("user_id 조회 실패:", e);
    return null;
  }
}
//=====================
//user_lookupController 만든 뒤
//이메일 추출
function getEmailFromToken(t) {
  try {
    const base64Url = t.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
    const claims = JSON.parse(json);
    return claims?.email || claims?.sub || null;
  } catch {
    return null;
  }
}

//=====================
async function fetchUserIdByEmail(email) {
  const res = await fetch(`http://localhost:8080/api/users/user-id?email=${encodeURIComponent(email)}`);
  const data = await res.json().catch(() => ({}));
  if (data?.ok && data?.user_id != null) return Number(data.user_id);
  return null;
}



export default function MyPageWatchlist() {
  
  const [watchlist, setWatchlist] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [user_id, setUserId] = useState(null); // 초기값 null로 설정
  //const [user_id, setUserId] = useState(default_user_id); // 초기값 12로 설정

  const [token, setToken] = useState(null);


  // 알림 UI 상태
  const [alertDialogOpen, setAlertDialogOpen] = useState({});
  const [newAlertType, setNewAlertType] = useState("price");
  const [newAlertCond, setNewAlertCond] = useState("above");
  const [newAlertValue, setNewAlertValue] = useState("");

  // useEffect(() => {
  //   setLoading(true);
  //   Promise.all([
  //     axios.get(`${API_BASE}/bookmarks/list`, { params: { user_id: user_id } }),
  //     axios.get(`${API_BASE}/assets/unbookmarked`, { params: { user_id: user_id } }),
  //   ])
  //     .then(([wlRes, candRes]) => {
  //       // 알림 배열 초기화(없으면 [])
  //       const wl = (Array.isArray(wlRes.data) ? wlRes.data : []).map(it => ({ ...it, alerts: it.alerts ?? [] }));
  //       const cd = (Array.isArray(candRes.data) ? candRes.data : []).map(it => ({ ...it, alerts: it.alerts ?? [] }));
  //       setWatchlist(wl);
  //       setCandidates(cd);
  //     })
  //     .catch(e => console.error("[mypage load]", e?.response?.status, e?.message))
  //     .finally(() => setLoading(false));
  // }, []);

  useEffect(() => {
  if (!user_id) return;
  setLoading(true);
  Promise.all([
    axios.get(`${API_BASE}/bookmarks/list`,        { params: { user_id } }),
    axios.get(`${API_BASE}/assets/unbookmarked`,   { params: { user_id } }),
  ])
  .then(([wlRes, candRes]) => {
    const wl = (Array.isArray(wlRes.data) ? wlRes.data : []).map(it => ({ ...it, alerts: it.alerts ?? [] }));
    const cd = (Array.isArray(candRes.data) ? candRes.data : []).map(it => ({ ...it, alerts: it.alerts ?? [] }));
    setWatchlist(wl);
    setCandidates(cd);
  })
  .catch(e => console.error("[mypage load]", e?.response?.status, e?.message))
  .finally(() => setLoading(false));
}, [user_id]);



  const filteredCandidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates.slice(0, 30);
    return candidates
      .filter(c => (c.asset_name || "").toLowerCase().includes(q) ||
                    (c.symbol || "").toLowerCase().includes(q) ||
                    (c.market || "").toLowerCase().includes(q))
      .slice(0, 30);
  }, [search, candidates]);

  // 북마크 추가/해제 (낙관적 업데이트)
  const addBookmark = async (asset_id) => {
    try {
      const item = candidates.find(c => c.asset_id === asset_id);
      if (!item) return;
      setCandidates(prev => prev.filter(c => c.asset_id !== asset_id));
      setWatchlist(prev => prev.concat({ ...item, is_bookmarked: 1, alerts: item.alerts ?? [] }));
      await axios.post(`${API_BASE}/bookmarks`, null, { params: { user_id, asset_id } });
    } catch (e) {
      console.error("[add]", e?.response?.status, e?.message);
      // 롤백
      const item = watchlist.find(w => w.asset_id === asset_id);
      if (item) {
        setWatchlist(prev => prev.filter(w => w.asset_id !== asset_id));
        setCandidates(prev => prev.concat({ ...item, is_bookmarked: 0, alerts: item.alerts ?? [] }));
      }
    }
  };

  const removeBookmark = async (asset_id) => {
    try {
      const item = watchlist.find(w => w.asset_id === asset_id);
      if (!item) return;
      setWatchlist(prev => prev.filter(w => w.asset_id !== asset_id));
      setCandidates(prev => prev.concat({ ...item, is_bookmarked: 0, alerts: item.alerts ?? [] }));
      await axios.delete(`${API_BASE}/bookmarks`, { params: { user_id, asset_id } });
    } catch (e) {
      console.error("[remove]", e?.response?.status, e?.message);
      // 롤백
      const item = candidates.find(c => c.asset_id === asset_id);
      if (item) {
        setCandidates(prev => prev.filter(c => c.asset_id !== asset_id));
        setWatchlist(prev => prev.concat({ ...item, is_bookmarked: 1, alerts: item.alerts ?? [] }));
      }
    }
  };

  // 알림 추가/삭제 (프론트 메모리 버전)
  const addAlert = (asset_id) => {
    const value = newAlertValue?.trim();
    if (value === "") return;
    setWatchlist(prev => prev.map(it =>
      it.asset_id === asset_id
        ? { ...it, alerts: [...(it.alerts ?? []), { type: newAlertType, condition: newAlertCond, value }] }
        : it
    ));
    // 모달 닫기 & 입력 초기화
    setAlertDialogOpen(prev => ({ ...prev, [asset_id]: false }));
    setNewAlertValue("");
    setNewAlertType("price");
    setNewAlertCond("above");
  };

  //======================


// useEffect(() => {
//     if (typeof window === "undefined") return;
//     const t = sessionStorage.getItem("auth_token")
// //            || sessionStorage.getItem("jwtToken")
// //            || sessionStorage.getItem("access_token");
//     setToken(t);
//     if (!t) return;

//     const claims = parseJwt(t);
//     const directId = claims?.uid ?? claims?.user_id ?? claims?.user_id ?? claims?.id;

//     if (directId != null) {
//       setUserId(Number(directId));
//       return;
//     }

//     const email = claims?.sub || claims?.email || claims?.username;
//     if (!email) return;

//     fetchUserIdByEmail(email, t)
//       .then(id => setUserId(Number(id)))
//       .catch(err => console.warn("user_id 조회 실패:", err));
//   }, []);

// useEffect(() => {
//   if (typeof window === "undefined") return;
//   const t = sessionStorage.getItem("auth_token");
//   setToken(t);
//   if (!t) return;

//   const claims = parseJwt(t);
//   const directId = claims?.uid ?? claims?.user_id ?? claims?.id;
//   if (directId != null) {
//     setUserId(Number(directId));
//     return;
//   }
//   // 토큰에 id가 없으면 임시 API로 조회
//   fetchUserIdFromToken(t)
//     .then(id => id && setUserId(Number(id)))
//     .catch(err => console.warn("user_id 조회 실패:", err));
// }, []);



  useEffect(() => {
    //if (!user_id || !token) return;
    if (!user_id || Number.isNaN(Number(user_id)) || !token) {
  console.debug("[mypage] skip fetch. userId:", user_id, "token?", !!token);
  return;
  }
    fetch(`http://localhost:8080/api/mypage/bookmarks/list?user_id=${user_id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setWatchlist)
      //.catch(e => console.error("관심코인 불러오기 실패:", e));
      .catch(err => {
      console.error("[mypage load]", err?.response?.status, err?.response?.data);
  });
  }, [user_id, token]);

  //======================

const [email, setEmail] = useState(null);


// 1) 토큰 → email → user_id
// useEffect(() => {
//   if (typeof window === "undefined") return;
//   const t = sessionStorage.getItem("auth_token");
//   setToken(t);
//   if (!t) { setLoading(false); return; }

//   const e = getEmailFromToken(t);
//   setEmail(e);
//   if (!e) { setLoading(false); return; }

//   fetchUserIdByEmail(e)
//     .then(uid => { setUserId(uid); })
//     .finally(() => setLoading(false));
// }, []);
//===========================================================================================
console.log("북마크 추가 요청", user_id);
console.log("토큰확인", JSON.parse(atob(sessionStorage.getItem("auth_token").split('.')[1])));
  
//토큰값을 빼 user_mail변수에 저장
const tokenValue = sessionStorage.getItem("auth_token");
if (tokenValue) {
  const payload = JSON.parse(atob(tokenValue.split('.')[1]));
  const user_mail = payload.email || payload.sub || null;
//이메일 값 확인
  console.log("이메일:", user_mail);
//이메일값 정상적으로 들어왔을때 id값 반환 응답 백엔드 url 호출()
    if (user_mail) {
    fetch(`http://localhost:8080/api/mypage/user-id?email=${encodeURIComponent(user_mail)}`)
      .then(res => res.json())
      .then(data => {
      if(data && data.user_id != null) {
      setUserId(Number(data.user_id));//user_id의 값을 data.user_id로 업데이트
      }
      })
      .catch(err => console.error(err));
  }
}
//변경된 user_id값 최종 확인
useEffect(() => {
  console.log("user_id 변경됨:", user_id);
}, [user_id]);

//===========================================================================================
  const removeAlert = (asset_id, idx) => {
    setWatchlist(prev => prev.map(it =>
      it.asset_id === asset_id
        ? { ...it, alerts: (it.alerts ?? []).filter((_, i) => i !== idx) }
        : it
    ));
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* 왼쪽: 내 관심코인 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            내 관심코인
            <Badge variant="secondary" className="ml-auto">{watchlist.length}개</Badge>
          </CardTitle>
          <CardDescription>북마크한 코인 + 알림 관리</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">불러오는 중…</div>
          ) : watchlist.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6">
              아직 북마크한 코인이 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {watchlist.map(c => (
                <div key={c.asset_id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold">
                        {c.symbol}
                      </div>
                      <div>
                        <div className="font-medium">{c.asset_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.symbol} · {c.market}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* 알림 버튼 + 모달 */}
                      <Dialog
                        open={!!alertDialogOpen[c.asset_id]}
                        onOpenChange={(open) => setAlertDialogOpen(prev => ({ ...prev, [c.asset_id]: open }))}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setAlertDialogOpen(prev => ({ ...prev, [c.asset_id]: true }))}>
                            <Bell className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{c.asset_name} 알림 추가</DialogTitle>
                          </DialogHeader>

                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm">알림 종류</Label>
                              <Select value={newAlertType} onValueChange={setNewAlertType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="price">가격</SelectItem>
                                  <SelectItem value="volume">거래량</SelectItem>
                                  <SelectItem value="change">변동률</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-sm">조건</Label>
                              <Select value={newAlertCond} onValueChange={setNewAlertCond}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="above">이상</SelectItem>
                                  <SelectItem value="below">이하</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-sm">값</Label>
                              <Input
                                placeholder="예: 50000"
                                value={newAlertValue}
                                onChange={(e) => setNewAlertValue(e.target.value)}
                              />
                            </div>

                            <Button className="w-full" onClick={() => addAlert(c.asset_id)}>알림 추가</Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* 북마크 해제 */}
                      <Button size="sm" variant="outline" onClick={() => removeBookmark(c.asset_id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* 알림 뱃지들 */}
                  {(c.alerts ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {c.alerts.map((a, idx) => {
                        const typeMap = { price: "가격", volume: "거래량", change: "변동률" };
                        const condMap = { above: "이상", below: "이하" };
                        const label = `${typeMap[a.type] || a.type} ${condMap[a.condition] || a.condition} ${a.value}`;
                        return (
                          <Badge key={idx} variant="outline" className="text-[11px]">
                            {label}
                            <button
                              type="button"
                              className="ml-2 text-muted-foreground hover:text-destructive"
                              onClick={() => removeAlert(c.asset_id, idx)}
                              aria-label="delete alert"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 오른쪽: 관심코인 담기 + 검색 */}
      <Card>
        <CardHeader>
          <CardTitle>관심코인 담기</CardTitle>
          <CardDescription>북마크하지 않은 코인만 표시됩니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="코인명/심볼/마켓으로 검색 (예: 비트코인, BTC, KRW-BTC)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="text-sm text-muted-foreground">불러오는 중…</div>
            ) : candidates.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6">
                담을 수 있는 코인이 없습니다.
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6">
                검색 결과가 없습니다. 다른 검색어로 시도해보세요.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCandidates.map(c => (
                  <div key={c.asset_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold">
                        {c.symbol}
                      </div>
                      <div>
                        <div className="font-medium">{c.asset_name}</div>
                        <div className="text-xs text-muted-foreground">{c.symbol} · {c.market}</div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => addBookmark(c.asset_id)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export const WatchlistManager = MyPageWatchlist;