// components/my-page-watchlist.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Trash2, Bell } from "lucide-react";

const API_BASE = "http://localhost:8080/api/mypage";
const USER_ID = 15; // TODO: JWT로 대체

export default function MyPageWatchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // 알림 UI 상태
  const [alertDialogOpen, setAlertDialogOpen] = useState({});
  const [newAlertType, setNewAlertType] = useState("price");
  const [newAlertCond, setNewAlertCond] = useState("above");
  const [newAlertValue, setNewAlertValue] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API_BASE}/bookmarks/list`, { params: { user_id: USER_ID } }),
      axios.get(`${API_BASE}/assets/unbookmarked`, { params: { user_id: USER_ID } }),
    ])
      .then(([wlRes, candRes]) => {
        // 알림 배열 초기화(없으면 [])
        const wl = (Array.isArray(wlRes.data) ? wlRes.data : []).map(it => ({ ...it, alerts: it.alerts ?? [] }));
        const cd = (Array.isArray(candRes.data) ? candRes.data : []).map(it => ({ ...it, alerts: it.alerts ?? [] }));
        setWatchlist(wl);
        setCandidates(cd);
      })
      .catch(e => console.error("[mypage load]", e?.response?.status, e?.message))
      .finally(() => setLoading(false));
  }, []);

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
      await axios.post(`${API_BASE}/bookmarks`, null, { params: { user_id: USER_ID, asset_id } });
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
      await axios.delete(`${API_BASE}/bookmarks`, { params: { user_id: USER_ID, asset_id } });
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
              아직 북마크한 코인이 없습니다. 오른쪽에서 추가하세요.
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
                담을 수 있는 코인이 없습니다. (이미 모두 북마크했을 수 있어요)
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
