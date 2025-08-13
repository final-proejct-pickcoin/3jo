"use client"

import axios from "axios"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Heart, MessageCircle, Share, Plus, TrendingUp, Users, Award, Flag } from "lucide-react"

// 더미 초기값 - user_id 추가
const communityPosts = [
  {
    id: 1,
    user_id: 22, // 콘솔에서 보인 현재 사용자 ID로 변경
    post_id: 1, // 추가
    author: "CryptoTrader_Pro",
    avatar: "/placeholder.svg?height=40&width=40&text=CT",
    time: "2시간 전",
    content:
      "방금 비트코인 차트 분석해봤는데, 4만5천 달러 돌파 흐름이 보입니다. 거래량도 계속 늘고 있고, RSI도 강한 매수 신호네요. 여러분은 어떻게 보시나요?",
    likes: 24,
    like_count: 24, // 추가
    comments: 8,
    tags: ["비트코인", "차트분석"],
    isLiked: false,
  },
  {
    id: 2,
    user_id: 2, // 추가
    post_id: 2, // 추가
    author: "DeFi_Explorer",
    avatar: "/placeholder.svg?height=40&width=40&text=DE",
    time: "4시간 전",
    content:
      "새로운 디파이 프로토콜 나왔는데, 스테이블코인 예치하면 연 15% 수익 준대요. 스마트 컨트랙트도 직접 확인해봤는데 꽤 믿을 만하네요. 혹시 해보신 분 계신가요?",
    likes: 18,
    like_count: 18, // 추가
    comments: 12,
    tags: ["디파이", "예치수익"],
    isLiked: true,
  },
  {
    id: 3,
    user_id: 22, // 현재 사용자 ID로 변경
    post_id: 3, // 추가
    author: "AltcoinHunter",
    avatar: "/placeholder.svg?height=40&width=40&text=AH",
    time: "6시간 전",
    content:
      "포트폴리오 업데이트! 이번 달 SOL, MATIC 미리 담아서 23% 수익 중입니다. 역시 기다림과 위험관리가 제일 중요한 것 같아요. 감당할 수 있는 만큼만 투자하세요!",
    likes: 45,
    like_count: 45, // 추가
    comments: 15,
    tags: ["포트폴리오", "위험관리"],
    isLiked: false,
  },
]

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

export const CommunityHub = () => {
  const [currentUser, setCurrentUser] = useState({ user_id: 1, name: "테스트유저" })
  const [posts, setPosts] = useState(communityPosts)
  const [likedPostIds, setLikedPostIds] = useState([])
  const [newPost, setNewPost] = useState("")
  const [selectedTags, setSelectedTags] = useState([])
  const availableTags = ["BTC", "ETH", "DeFi", "NFT", "Technical Analysis", "News", "Portfolio", "Trading Tips"]

// 신고 기능
const [reportModalOpen, setReportModalOpen] = useState(false)
const [reportReason, setReportReason] = useState("")
const [reportDetail, setReportDetail] = useState("")
const [reportTargetId, setReportTargetId] = useState(null)
const [alreadyReportedIds, setAlreadyReportedIds] = useState([])

const checkReported = async (postId) => {
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
}

const handleOpenReport = async (postId) => {
  if (!currentUser.user_id) return alert("로그인 후 이용해주세요.")
  const already = await checkReported(postId)
  if (already) {
    alert("이미 신고한 게시글입니다.")
    setAlreadyReportedIds(prev => [...prev, postId])
    return
  }
  setReportTargetId(postId)
  setReportModalOpen(true)
}

const handleSubmitReport = async () => {
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
}

  // 세션에서 사용자 정보 로드
  useEffect(() => {
    const raw = sessionStorage.getItem("user_data")
    if (raw) {
      const u = JSON.parse(raw)
      const uid = safeToNumber(u.user_id ?? u.userId ?? u.USER_ID)
      setCurrentUser({ user_id: uid, name: u.nickname ?? u.name ?? "" })
    } else {
      setCurrentUser({ user_id: 22, name: "현재사용자" })
    }
  }, [])

  // 내가 좋아요 누른 게시글 목록 불러오기
  const fetchLikedPosts = async (userId) => {
    try {
      const res = await axios.get(`http://localhost:8080/community/liked`, {
        params: { userId }
      })
      if (Array.isArray(res.data)) {
        setLikedPostIds(res.data)
      }
      return res.data
    } catch (err) {
      console.error("좋아요 목록 불러오기 실패:", err)
      return []
    }
  }

  // 글 목록 불러오기
  const fetchPosts = async () => {
    try {
      const res = await axios.get("http://localhost:8080/community/findAll")
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

          return {
            ...p,
            post_id: safeToNumber(postId),
            user_id: safeToNumber(userId),
            isLiked: likedPostIds.includes(safeToNumber(postId)) // 여기 수정
          }
        })
        setPosts(normalized)
      }
    } catch (err) {
      console.error("게시글 불러오기 실패:", err)
    }
  }

  // 좋아요 목록 먼저 불러오고, 그 다음 게시글 불러오기
  useEffect(() => {
  if (currentUser.user_id != null) {
    fetchLikedPosts(currentUser.user_id)
  }
}, [currentUser.user_id])

// likedPostIds 변경 후 게시글 불러오기
useEffect(() => {
  if (currentUser.user_id != null && likedPostIds.length >= 0) {
    fetchPosts()
  }
}, [likedPostIds])

  const isOwner = (post) => {
    const me = safeToNumber(currentUser.user_id)
    const owner = safeToNumber(post?.user_id)
    return me !== null && owner !== null && me === owner
  }

  const handleLike = async (postId) => {
    if (!postId) return
    if (currentUser.user_id == null) return alert("로그인 후 이용해주세요.")
    try {
      const res = await axios.put(`http://localhost:8080/community/${postId}/like/${currentUser.user_id}`)
      const { liked, like_count } = res.data
      setPosts((prev) =>
        prev.map((p) => p.post_id === postId ? { ...p, like_count, isLiked: liked } : p)
      )
      if (liked) {
        setLikedPostIds(prev => [...prev, postId])
      } else {
        setLikedPostIds(prev => prev.filter(id => id !== postId))
      }
    } catch (err) {
      console.error("좋아요 토글 실패:", err)
    }
  }

  const handleCreatePost = async () => {
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
    }
  }

  const handleDelete = async (postId, postUserId) => {
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
  }

  const handleUpdate = async (postId, currentContent, postUserId) => {
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
  }


  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Debug Info */}
      <div className="lg:col-span-3 mb-4">
        
          <CardContent className="pt-4">
            <p className="text-sm">
            </p>
          </CardContent>
        
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

              <div className="flex flex-wrap gap-2">
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
              </div>

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
            <Card key={post.post_id ?? post.id ?? `row-${idx}`}>
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
                        <p className="text-xs text-gray-400">
                        </p>
                      </div>

                      {/* 내 글일 때만 수정/삭제 */}
                      {isOwner(post) && (
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdate(post.post_id, post.content, post.user_id)}
                          >
                            수정
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(post.post_id, post.user_id)}
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
                        onClick={() => handleLike(post.post_id)}
                        className={post.isLiked ? "text-red-500" : ""}
                      >
                        <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? "fill-current" : ""}`} />
                        {post.like_count || 0}
                      </Button>

                      <Button variant="ghost" size="sm">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {post.comments || 0}
                      </Button>

                      {/* 신고 버튼 추가 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenReport(post.post_id)}
                        disabled={alreadyReportedIds.includes(post.post_id)}
                      >
                        <Flag className="h-4 w-4 mr-1" />
                        신고
                      </Button>

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




                      <Button variant="ghost" size="sm">
                        <Share className="h-4 w-4 mr-1" />
                        공유
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
              인기 토픽
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { tag: "#비트코인ETF", posts: 234 },
                { tag: "#디파이수익", posts: 189 },
                { tag: "#알트코인시즌", posts: 156 },
                { tag: "#기술적분석", posts: 143 },
                { tag: "#크립토뉴스", posts: 98 },
              ].map((topic) => (
                <div key={topic.tag} className="flex items-center justify-between">
                  <span className="font-medium text-primary cursor-pointer hover:underline">{topic.tag}</span>
                  <span className="text-sm text-muted-foreground">{topic.posts}건</span>
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
    </div>
  )
}