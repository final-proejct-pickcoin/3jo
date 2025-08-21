"use client"

import axios from "axios"
import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Heart, MessageCircle, Share, Plus, TrendingUp, Users, Award, Flag } from "lucide-react"

// 더미 초기값 - user_id 추가
const communityPosts = []

const topTraders = [
  { name: "CryptoKing", profit: "+156%", followers: 2340, badge: "🏆" },
  { name: "BlockchainBull", profit: "+134%", followers: 1890, badge: "🥈" },
  { name: "DeFiMaster", profit: "+128%", followers: 1650, badge: "🥉" },
  { name: "AltcoinAce", profit: "+98%", followers: 1200, badge: "⭐" },
]

// 안전 숫자 변환
const safeToNumber = (v) => {
  if (v === null || v === undefined || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// 태그 한글 변환
const tagToKr = (tag) => {
  if (tag === "BTC" || tag === "비트코인") return "비트코인"
  if (tag === "ETH" || tag === "이더리움") return "이더리움"
  if (tag === "DeFi" || tag === "디파이") return "디파이"
  if (tag === "NFT") return "NFT"
  if (["Technical Analysis", "기술적 분석", "차트분석"].includes(tag)) return "차트분석"
  if (tag === "News" || tag === "뉴스") return "뉴스"
  if (tag === "Portfolio" || tag === "포트폴리오") return "포트폴리오"
  if (tag === "Trading Tips" || tag === "트레이딩 팁") return "트레이딩 팁"
  if (["Yield Farming", "수익 파밍", "예치수익"].includes(tag)) return "예치수익"
  if (["Risk Management", "리스크 관리", "위험관리"].includes(tag)) return "위험관리"
  return tag
}

/** =========================
 *  PostCard (댓글/대댓글 로컬화 + memo)
 *  ========================= */
const PostCard = memo(function PostCard({
  post,
  currentUserId,
  isOwner,
  onLike,
  onDelete,
  onUpdate,
  onReportOpen,
  reported,
}) {
  // 댓글 상태(로컬)
  const [openReply, setOpenReply] = useState(false)
  const [replies, setReplies] = useState([])
  const [newReply, setNewReply] = useState("")
  const [childrenMap, setChildrenMap] = useState({}) // parentId => children[]
  const [childTextMap, setChildTextMap] = useState({}) // parentId => input text
  const [openChildOf, setOpenChildOf] = useState(null)
  const [editingReplyId, setEditingReplyId] = useState(null)
  const [editReplyText, setEditReplyText] = useState("")

  // 댓글 목록 로드
  const fetchReplies = useCallback(async () => {
    try {
      const res  = await axios.get(`http://localhost:8080/community/${post.post_id}/replies`)
      const list = Array.isArray(res.data) ? res.data : []
      setReplies(list)
      // 댓글창 열 때 하위 상태 초기화
      setChildrenMap({})
      setOpenChildOf(null)
      setEditingReplyId(null)
      setEditReplyText("")
    } catch (e) {
      console.error("댓글 불러오기 실패:", e)
    }
  }, [post.post_id])

  // 댓글 등록
  const submitReply = useCallback(async () => {
    if (!newReply.trim()) return
    if (!currentUserId) return alert("로그인 후 이용해주세요.")
    try {
      await axios.post(`http://localhost:8080/community/${post.post_id}/replies`, {
        post_id: post.post_id,
        user_id: currentUserId,
        content: newReply
      })
      setNewReply("")
      fetchReplies()
    } catch (e) {
      console.error("댓글 등록 실패:", e)
    }
  }, [newReply, currentUserId, post.post_id, fetchReplies])

  // 대댓글 목록 로드 (이미 있으면 재요청 방지)
  const fetchChildren = useCallback(async (parentId) => {
    if (childrenMap[parentId] && Array.isArray(childrenMap[parentId])) return
    try {
      const res = await axios.get(`http://localhost:8080/community/replies/${parentId}/children`)
      const list = Array.isArray(res.data) ? res.data : []
      setChildrenMap(prev => ({ ...prev, [parentId]: list }))
    } catch (e) {
      console.error("대댓글 불러오기 실패:", e)
    }
  }, [childrenMap])

  // 대댓글 등록
  const submitChild = useCallback(async (parentId) => {
    const text = (childTextMap[parentId] || "").trim()
    if (!text) return
    if (!currentUserId) return alert("로그인 후 이용해주세요.")
    try {
      await axios.post(`http://localhost:8080/community/replies/${parentId}`, {
        post_id: post.post_id,
        user_id: currentUserId,
        content: text
      })
      setChildTextMap(prev => ({ ...prev, [parentId]: "" }))
      await fetchChildren(parentId)
    } catch (e) {
      console.error("대댓글 등록 실패:", e)
    }
  }, [childTextMap, currentUserId, post.post_id, fetchChildren])

  // 댓글/대댓글 수정 시작
  const startEdit = useCallback((reply) => {
    if (safeToNumber(currentUserId) !== safeToNumber(reply.user_id)) {
      return alert("본인 댓글만 수정할 수 있습니다.")
    }
    setEditingReplyId(reply.reply_id)
    setEditReplyText(reply.content || "")
  }, [currentUserId])

  // 댓글/대댓글 저장
  const saveEdit = useCallback(async (replyId, parentId) => {
    const text = editReplyText.trim()
    if (!text) return
    try {
      await axios.put(`http://localhost:8080/community/replies/${replyId}`, null, {
        params: { userId: currentUserId, content: text }
      })
      setEditingReplyId(null)
      setEditReplyText("")
      await fetchReplies()
      if (parentId) await fetchChildren(parentId)
    } catch (e) {
      console.error("댓글 수정 실패:", e)
    }
  }, [editReplyText, currentUserId, fetchReplies, fetchChildren])

  // 댓글/대댓글 삭제
  const removeReply = useCallback(async (replyId, parentId) => {
    if (!window.confirm("삭제하시겠습니까?")) return
    try {
      await axios.delete(`http://localhost:8080/community/replies/${replyId}`, {
        params: { userId: currentUserId }
      })
      await fetchReplies()
      if (parentId) await fetchChildren(parentId)
    } catch (e) {
      console.error("댓글 삭제 실패:", e)
    }
  }, [currentUserId, fetchReplies, fetchChildren])

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start space-x-3">
          <Avatar>
            <AvatarImage src={post.avatar || "/placeholder.svg"} />
            <AvatarFallback>{post.author?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{post.author || "익명"}</p>
                <p className="text-sm text-muted-foreground">{post.time || ""}</p>
                <p className="text-xs text-gray-400"></p>
              </div>

              {/* 내 글일 때만 수정/삭제 */}
              {isOwner(post) && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdate(post.post_id, post.content, post.user_id)}
                  >
                    수정
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(post.post_id, post.user_id)}
                  >
                    삭제
                  </Button>
                </div>
              )}
            </div>

            <p className="text-sm leading-relaxed">{post.content}</p>

            <div className="flex flex-wrap gap-2">
              {post.tags?.map((tag, tIdx) => (
                <Badge key={`${tag}-${tIdx}`} variant="secondary" className="text-xs">
                  {tagToKr(tag)}
                </Badge>
              ))}
            </div>

            <div className="flex items-center space-x-4 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLike(post.post_id)}
                className={post.isLiked ? "text-red-500" : ""}
              >
                <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? "fill-current" : ""}`} />
                {post.like_count || 0}
              </Button>

              {/* 댓글 버튼: 열 때만 목록 로드 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const next = !openReply
                  setOpenReply(next)
                  if (next) await fetchReplies()
                }}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                {post.reply_count ?? post.comments ?? replies.length ?? 0}
              </Button>

              {/* 신고 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReportOpen(post.post_id)}
                disabled={reported}
              >
                <Flag className="h-4 w-4 mr-1" />
                신고
              </Button>
            </div>

            {/* ---------- 댓글 영역 ---------- */}
            {openReply && (
              <div className="mt-3 space-y-3 border-t pt-3">
                {/* 댓글 목록 */}
                <div className="space-y-3">
                  {replies.length === 0 && (
                    <p className="text-xs text-muted-foreground">아직 댓글이 없습니다.</p>
                  )}
                  {replies.map((r) => (
                    <div key={r.reply_id} className="text-sm">
                      {/* 댓글 단위: 수정/삭제/대댓글 */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {editingReplyId === r.reply_id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editReplyText}
                                onChange={(e) => setEditReplyText(e.target.value)}
                                className="min-h-[60px]"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => saveEdit(r.reply_id, null)}>저장</Button>
                                <Button size="sm" variant="outline" onClick={() => { setEditingReplyId(null); setEditReplyText(""); }}>취소</Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <span className="font-semibold mr-2">{r.author || `#${r.user_id}`}</span>
                              <span>{r.content}</span>
                            </>
                          )}
                        </div>
                        {safeToNumber(currentUserId) === safeToNumber(r.user_id) && editingReplyId !== r.reply_id && (
                          <div className="shrink-0 flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit(r)}>수정</Button>
                            <Button size="sm" variant="destructive" onClick={() => removeReply(r.reply_id, null)}>삭제</Button>
                          </div>
                        )}
                      </div>

                      {/* 대댓글/토글 & 입력 */}
                      <div className="mt-2 ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const next = openChildOf === r.reply_id ? null : r.reply_id
                            setOpenChildOf(next)
                            if (next) fetchChildren(r.reply_id)
                          }}
                        >
                          댓글 더보기
                        </Button>

                        {openChildOf === r.reply_id && (
                          <div className="mt-2 space-y-2">
                            {/* 대댓글 목록 */}
                            <div className="space-y-2">
                              {(childrenMap[r.reply_id] || []).map((c) => (
                                <div key={c.reply_id} className="pl-3 border-l text-sm">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      {editingReplyId === c.reply_id ? (
                                        <div className="space-y-2">
                                          <Textarea
                                            value={editReplyText}
                                            onChange={(e) => setEditReplyText(e.target.value)}
                                            className="min-h-[60px]"
                                          />
                                          <div className="flex gap-2">
                                            <Button size="sm" onClick={() => saveEdit(c.reply_id, r.reply_id)}>저장</Button>
                                            <Button size="sm" variant="outline" onClick={() => { setEditingReplyId(null); setEditReplyText(""); }}>취소</Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <span className="font-semibold mr-2">{c.author || `#${c.user_id}`}</span>
                                          <span>{c.content}</span>
                                        </>
                                      )}
                                    </div>
                                    {safeToNumber(currentUserId) === safeToNumber(c.user_id) && editingReplyId !== c.reply_id && (
                                      <div className="shrink-0 flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => startEdit(c)}>수정</Button>
                                        <Button size="sm" variant="destructive" onClick={() => removeReply(c.reply_id, r.reply_id)}>삭제</Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* 대댓글 입력 */}
                            <div className="flex items-start gap-2">
                              <Textarea
                                value={childTextMap[r.reply_id] || ""}
                                onChange={(e) =>
                                  setChildTextMap(prev => ({ ...prev, [r.reply_id]: e.target.value }))
                                }
                                placeholder="대댓글을 입력하세요..."
                                className="min-h-[50px] flex-1"
                              />
                              <Button onClick={() => submitChild(r.reply_id)}>등록</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 댓글 입력 */}
                <div className="flex items-start gap-2">
                  <Textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="댓글을 입력하세요..."
                    className="min-h-[50px] flex-1"
                  />
                  <Button onClick={submitReply}>등록</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}, 
// memo 비교: 핵심 값이 같으면 재렌더 방지
(prev, next) => {
  const p = prev.post, n = next.post
  return (
    p.post_id === n.post_id &&
    p.isLiked === n.isLiked &&
    p.like_count === n.like_count &&
    p.content === n.content &&
    p.user_id === n.user_id &&
    prev.reported === next.reported
  )
})

export const CommunityHub = () => {
  const [currentUser, setCurrentUser] = useState({ user_id: 1, name: "테스트유저" })
  const [posts, setPosts] = useState(communityPosts)
  const [likedPostIds, setLikedPostIds] = useState([])
  const [likedLoaded, setLikedLoaded] = useState(false) // ✅ 1단계: 좋아요 로드 완료 플래그
  const [newPost, setNewPost] = useState("")
  const [selectedTags, setSelectedTags] = useState([])
  const [popularKeywords, setPopularKeywords] = useState([])

  // 신고 기능
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportDetail, setReportDetail] = useState("")
  const [reportTargetId, setReportTargetId] = useState(null)
  const [alreadyReportedIds, setAlreadyReportedIds] = useState([])

  // ===== 인기 키워드 캐싱 (60초) =====
  const KW_TTL_MS = 60_000
  const kwCacheRef = useRef({ ts: 0, data: null, loading: false })

  const getPopularKeyword = useCallback(async (force = false) => {
    const now = Date.now()
    // 캐시 유효하면 재사용
    if (!force && kwCacheRef.current.data && (now - kwCacheRef.current.ts) < KW_TTL_MS) {
      setPopularKeywords(kwCacheRef.current.data)
      return
    }
    // 로딩 중복 차단
    if (kwCacheRef.current.loading) return
    kwCacheRef.current.loading = true

    try {
      const res = await axios.get("http://localhost:8080/community/popular-keword")
      const data = Array.isArray(res.data) ? res.data : []
      kwCacheRef.current = { ts: now, data, loading: false }
      setPopularKeywords(data)
    } catch (err) {
      console.log("인기 키워드 조회 실패:", err)
      kwCacheRef.current.loading = false
    }
  }, [])

  // 신고 여부 체크
  const checkReported = useCallback(async (postId) => {
    try {
      const res = await axios.get("http://localhost:8080/report/exists", {
        params: {
          reporter_id: currentUser.user_id,
          reported_type: "POST",
          reported_id: postId
        }
      })
      return res.data > 0
    } catch (err) {
      console.error("신고 여부 확인 실패:", err)
      return false
    }
  }, [currentUser.user_id])

  const handleOpenReport = useCallback(async (postId) => {
    if (!currentUser.user_id) return alert("로그인 후 이용해주세요.")
    const already = await checkReported(postId)
    if (already) {
      alert("이미 신고한 게시글입니다.")
      setAlreadyReportedIds(prev => [...prev, postId])
      return
    }
    setReportTargetId(postId)
    setReportModalOpen(true)
  }, [currentUser.user_id, checkReported])

  const handleSubmitReport = useCallback(async () => {
    if (!reportReason) return alert("신고 사유를 선택해주세요.")
    try {
      await axios.post("http://localhost:8080/report", {
        reporter_id: currentUser.user_id,
        reported_id: reportTargetId,
        reported_type: "POST",
        description: reportReason + (reportDetail ? ` - ${reportDetail}` : "")
        // status 제거 → 서버에서 기본값 IN_PROGRESS 설정
      })
      alert("신고가 접수되었습니다.")
      setAlreadyReportedIds(prev => [...prev, reportTargetId])
      setReportModalOpen(false)
      setReportReason("")
      setReportDetail("")
    } catch (err) {
      console.error("신고 실패:", err)
      alert("신고 처리 중 오류가 발생했습니다.")
    }
  }, [currentUser.user_id, reportTargetId, reportReason, reportDetail])

  // 세션에서 사용자 정보 로드
  useEffect(() => {
    const raw = sessionStorage.getItem("user_data")
    if (raw) {
      const u = JSON.parse(raw)
      const uid = u.user_id
      setCurrentUser({ user_id: uid, name: u.nickname ?? u.name ?? "" })
      getPopularKeyword() // 캐싱되어 있으므로 여러 번 불려도 네트워크 1회
    } else {
      setCurrentUser({ user_id: 22, name: "현재사용자" })
      getPopularKeyword()
    }
  }, [getPopularKeyword])

  // 내가 좋아요 누른 게시글 목록 불러오기
  const fetchLikedPosts = useCallback(async (userId) => {
    try {
      const res = await axios.get(`http://localhost:8080/community/liked`, {
        params: { userId }
      })
      if (Array.isArray(res.data)) {
        setLikedPostIds(res.data)
      } else {
        setLikedPostIds([])
      }
    } catch (err) {
      console.error("좋아요 목록 불러오기 실패:", err)
      setLikedPostIds([])
    } finally {
      // ✅ 로드 완료 신호
      setLikedLoaded(true)
    }
  }, [])

  // 글 목록 불러오기 (AbortController 옵션)
  const fetchPosts = useCallback(() => {
    const controller = new AbortController()
    ;(async () => {
      try {
        const res = await axios.get("http://localhost:8080/community/findAll", {
          signal: controller.signal,
        })
        if (Array.isArray(res.data)) {
          const normalized = res.data.map((p) => {
            const possibleUserIds = [
              p.user_id, p.USER_ID, p.userId, p.USERID, 
              p.writer_id, p.WRITER_ID, p.writerId,
              p.author_id, p.AUTHOR_ID, p.authorId
            ]
            const possiblePostIds = [
              p.post_id, p.POST_ID, p.postId, p.id, p.ID
            ]
            const userId = possibleUserIds.find(id => id != null && id !== "") ?? null
            const postId = possiblePostIds.find(id => id != null && id !== "") ?? null

            const nUserId = safeToNumber(userId)
            const nPostId = safeToNumber(postId)

            return {
              ...p,
              post_id: nPostId,
              user_id: nUserId,
              isLiked: nPostId != null ? likedPostIds.includes(nPostId) : false
            }
          })
          setPosts(normalized)
        } else {
          setPosts([])
        }
      } catch (err) {
        // axios 취소 호환
        if (axios.isCancel?.(err)) return
        if (err?.name === "CanceledError") return
        console.error("게시글 불러오기 실패:", err)
      }
    })()
    return () => controller.abort()
  }, [likedPostIds])

  // ✅ user_id가 생기면 좋아요 목록부터
  useEffect(() => {
    if (currentUser.user_id != null) {
      setLikedLoaded(false)        // 새 사용자 기준으로 초기화
      fetchLikedPosts(currentUser.user_id)
    }
  }, [currentUser.user_id, fetchLikedPosts])

  // ✅ 좋아요 목록 로딩이 끝나면 게시글 한 번만 조회
  useEffect(() => {
    if (likedLoaded) {
      const cancel = fetchPosts()
      return () => {
        if (typeof cancel === "function") cancel()
      }
    }
  }, [likedLoaded, fetchPosts])

  const isOwner = useCallback((post) => {
    const me = safeToNumber(currentUser.user_id)
    const owner = safeToNumber(post?.user_id)
    return me !== null && owner !== null && me === owner
  }, [currentUser.user_id])

  const handleLike = useCallback(async (postId) => {
    if (!postId) return
    if (currentUser.user_id == null) return alert("로그인 후 이용해주세요.")
    try {
      const res = await axios.put(`http://localhost:8080/community/${postId}/like/${currentUser.user_id}`)
      const { liked, like_count } = res.data
      setPosts((prev) =>
        prev.map((p) => p.post_id === postId ? { ...p, like_count, isLiked: liked } : p)
      )
      setLikedPostIds((prev) => liked ? [...prev, postId] : prev.filter(id => id !== postId))
    } catch (err) {
      console.error("좋아요 토글 실패:", err)
    }
  }, [currentUser.user_id])

  const handleCreatePost = useCallback(async () => {
    if (!newPost.trim()) return
    if (currentUser.user_id == null) return alert("로그인 후 글을 작성해주세요.")
    try {
      await axios.post("http://localhost:8080/community/insert", {
        user_id: currentUser.user_id,
        coin_id: null,
        title: newPost,
        content: newPost,
        status: "NORMAL",
      })
      setNewPost("")
      setSelectedTags([])
      getPopularKeyword(true) // ✅ 성공 시에만 강제 새로고침
      fetchPosts()
    } catch (error) {
      console.error("글 등록 실패:", error?.response?.data || error?.message)
      const newPostObj = {
        id: Date.now(),
        post_id: Date.now(),
        user_id: currentUser.user_id,
        author: currentUser.name || "나",
        content: newPost,
        time: "방금 전",
        like_count: 0,
        comments: 0,
        tags: selectedTags,
        isLiked: false,
      }
      setPosts(prev => [newPostObj, ...prev])
      setNewPost("")
      setSelectedTags([])
      // 실패 시에는 서버 데이터가 갱신되지 않았으므로 키워드 강제 새로고침 불필요
    }
  }, [newPost, selectedTags, currentUser.user_id, currentUser.name, fetchPosts, getPopularKeyword])

  const handleDelete = useCallback(async (postId, postUserId) => {
    const me = safeToNumber(currentUser.user_id)
    const owner = safeToNumber(postUserId)
    if (me == null) return alert("로그인 후 이용해주세요.")
    if (owner == null || owner !== me) return alert("본인 글만 삭제할 수 있습니다.")
    if (!window.confirm("정말 삭제하시겠습니까?")) return

    try {
      await axios.delete(`http://localhost:8080/community/${postId}`, { params: { userId: me } })
      alert("삭제 완료되었습니다.")
      fetchPosts()
    } catch (err) {
      console.error("삭제 실패:", err)
      setPosts(prev => prev.filter(p => p.post_id !== postId))
      alert("삭제 완료되었습니다.")
    }
  }, [currentUser.user_id, fetchPosts])

  const handleUpdate = useCallback(async (postId, currentContent, postUserId) => {
    const me = safeToNumber(currentUser.user_id)
    const owner = safeToNumber(postUserId)
    if (me == null) return alert("로그인 후 이용해주세요.")
    if (owner == null || owner !== me) return alert("본인 글만 수정할 수 있습니다.")

    const newContent = prompt("수정할 내용을 입력하세요:", currentContent)
    if (!newContent?.trim()) return

    try {
      await axios.put(`http://localhost:8080/community/${postId}`, {
        user_id: me,
        coin_id: null,
        title: newContent,
        content: newContent,
        status: "NORMAL",
      })
      fetchPosts()
    } catch (err) {
      console.error("수정 실패:", err)
      setPosts(prev => prev.map(p => 
        p.post_id === postId ? { ...p, content: newContent, title: newContent } : p
      ))
    }
  }, [currentUser.user_id, fetchPosts])

  // 파생값 메모화: 상위 5개 키워드
  const topKeywords = useMemo(() => {
    return [...popularKeywords]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [popularKeywords])

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Debug Info */}
      <div className="lg:col-span-3 mb-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm"></p>
          </CardContent>
        </Card>
      </div>

      {/* Main Feed */}
      <div className="lg:col-span-2 space-y-6">
        {/* Create Post */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              커뮤니티에 공유하기
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="생각, 분석, 트레이딩 인사이트를 자유롭게 남겨보세요..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[100px]"
              />

              {/* 태그 선택은 주석 처리 (원본 유지) */}
              {/* <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() =>
                      setSelectedTags(
                        selectedTags.includes(tag)
                          ? selectedTags.filter((t) => t !== tag)
                          : [...selectedTags, tag]
                      )
                    }
                  >
                    {tagToKr(tag)}
                  </Badge>
                ))}
              </div> */}

              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">{newPost.length}/500자</p>
                <Button onClick={handleCreatePost} disabled={!newPost.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  등록
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.map((post, idx) => (
            <PostCard
              key={post.post_id ?? post.id ?? `row-${idx}`}
              post={post}
              currentUserId={currentUser.user_id}
              isOwner={isOwner}
              onLike={handleLike}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              onReportOpen={handleOpenReport}
              reported={alreadyReportedIds.includes(post.post_id)}
            />
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Top Traders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              수익률 상위 트레이더
            </CardTitle>
            <CardDescription>이달의 베스트 트레이더</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topTraders.map((trader) => (
                <div key={trader.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{trader.badge}</span>
                    <div>
                      <p className="font-medium">{trader.name}</p>
                      <p className="text-sm text-muted-foreground">
                        <Users className="h-3 w-3 inline mr-1" />
                        팔로워 {trader.followers.toLocaleString()}명
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700">{trader.profit}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trending Topics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              인기 키워드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topKeywords.map((topic) => (
                <div key={topic.keyword} className="flex items-center justify-between">
                  <span className="font-medium text-primary cursor-pointer hover:underline"># {topic.keyword}</span>
                  <span className="text-sm text-muted-foreground">{topic.count}건</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Community Stats */}
        <Card>
          <CardHeader>
            <CardTitle>커뮤니티 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">활동 회원</span>
                <span className="font-semibold">12,456</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">오늘의 게시글</span>
                <span className="font-semibold">89</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">현재 접속자</span>
                <span className="font-semibold text-green-500">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">누적 토론 수</span>
                <span className="font-semibold">45,678</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 신고 모달 */}
      {reportModalOpen && (
        <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>게시글 신고</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <select value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                <option value="">신고 사유 선택</option>
                <option value="욕설/비방">욕설/비방</option>
                <option value="광고/홍보">광고/홍보</option>
                <option value="음란물">음란물</option>
                <option value="기타">기타</option>
              </select>
              <Textarea
                placeholder="상세 사유를 입력하세요..."
                value={reportDetail}
                onChange={(e) => setReportDetail(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReportModalOpen(false)}>취소</Button>
                <Button onClick={handleSubmitReport}>제출</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}