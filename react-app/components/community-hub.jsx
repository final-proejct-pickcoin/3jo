"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share, Flag, Plus, TrendingUp, Users, Award } from "lucide-react"

const communityPosts = [
  {
    id: 1,
    author: "CryptoTrader_Pro",
    avatar: "/placeholder.svg?height=40&width=40&text=CT",
    time: "2시간 전",
    content:
      "방금 비트코인 차트 분석해봤는데, 4만5천 달러 돌파 흐름이 보입니다. 거래량도 계속 늘고 있고, RSI도 강한 매수 신호네요. 여러분은 어떻게 보시나요?",
    likes: 24,
    comments: 8,
    tags: ["비트코인", "차트분석"],
    isLiked: false,
  },
  {
    id: 2,
    author: "DeFi_Explorer",
    avatar: "/placeholder.svg?height=40&width=40&text=DE",
    time: "4시간 전",
    content:
      "새로운 디파이 프로토콜 나왔는데, 스테이블코인 예치하면 연 15% 수익 준대요. 스마트 컨트랙트도 직접 확인해봤는데 꽤 믿을 만하네요. 혹시 해보신 분 계신가요?",
    likes: 18,
    comments: 12,
    tags: ["디파이", "예치수익"],
    isLiked: true,
  },
  {
    id: 3,
    author: "AltcoinHunter",
    avatar: "/placeholder.svg?height=40&width=40&text=AH",
    time: "6시간 전",
    content:
      "포트폴리오 업데이트! 이번 달 SOL, MATIC 미리 담아서 23% 수익 중입니다. 역시 기다림과 위험관리가 제일 중요한 것 같아요. 감당할 수 있는 만큼만 투자하세요!",
    likes: 45,
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

// 태그 한글 변환 함수 (중복 제거)
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
  const [posts, setPosts] = useState(communityPosts)
  const [newPost, setNewPost] = useState("")
  const [selectedTags, setSelectedTags] = useState([])
  const availableTags = ["BTC", "ETH", "DeFi", "NFT", "Technical Analysis", "News", "Portfolio", "Trading Tips"]
  const handleLike = (postId) => setPosts(posts.map(post => post.id === postId ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 } : post))
  const handleCreatePost = () => {
    if (!newPost.trim()) return
    setPosts([{ id: Date.now(), author: "You", avatar: "/placeholder.svg?height=40&width=40&text=Y", time: "now", content: newPost, likes: 0, comments: 0, tags: selectedTags, isLiked: false }, ...posts])
    setNewPost("")
    setSelectedTags([])
  }
  return (
    <div className="grid lg:grid-cols-3 gap-6">
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
                    onClick={() => setSelectedTags(selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag])}
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
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Avatar>
                    <AvatarImage src={post.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{post.author}</p>
                        <p className="text-sm text-muted-foreground">{post.time}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Flag className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="text-sm leading-relaxed">{post.content}</p>

                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tagToKr(tag)}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center space-x-4 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(post.id)}
                        className={post.isLiked ? "text-red-500" : ""}
                      >
                        <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? "fill-current" : ""}`} />
                        {post.likes}
                      </Button>

                      <Button variant="ghost" size="sm">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {post.comments}
                      </Button>

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
              {topTraders.map((trader, index) => (
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
