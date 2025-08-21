package com.finalproject.pickcoin.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.apache.ibatis.session.SqlSession;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.search.aggregations.AggregationBuilders;
import org.elasticsearch.search.aggregations.bucket.terms.Terms;
import org.elasticsearch.search.aggregations.bucket.terms.TermsAggregationBuilder;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.elasticsearch.xcontent.XContentType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.finalproject.pickcoin.domain.Asset;
import com.finalproject.pickcoin.domain.Community;
import com.finalproject.pickcoin.domain.KeywordCount;

import co.elastic.clients.elasticsearch.indices.GetIndexRequest;
import co.elastic.clients.elasticsearch.indices.RefreshRequest;

import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;

import org.elasticsearch.client.indices.CreateIndexRequest;
import org.elasticsearch.client.indices.CreateIndexResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.common.settings.Settings;

@Service
public class CommunityServiceImpl implements CommunityService {

    @Autowired
    private SqlSession sqlSession; // DAO 대신 SqlSession 직접 사용

    @Autowired
    private AssetService assetService;

    // elastic 시작
    private final RestHighLevelClient esClient;

    public CommunityServiceImpl(RestHighLevelClient esClient) {
        this.esClient = esClient;
    }

    public void indexPostToElasticsearch(Community post) throws IOException{

        IndexRequest request = new IndexRequest("community-posts")
            // .id(String.valueOf(post.getPost_id()))  // post_id 기준으로 id 고정 가능
            .source(
                "content", post.getContent(),
                "author", post.getAuthor(),
                "created_at", post.getCreatedAt()
            );

        esClient.index(request, RequestOptions.DEFAULT);
        esClient.indices().refresh(
            new org.elasticsearch.action.admin.indices.refresh.RefreshRequest("community-posts"),
            RequestOptions.DEFAULT
        );
    }

    public List<KeywordCount> getPopularKeword() throws IOException {
        // 1. ES 집계 쿼리
        SearchRequest searchRequest = new SearchRequest("community-posts");
        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder();

        TermsAggregationBuilder aggregation = AggregationBuilders
            .terms("popular_keywords")
            .field("content")
            .size(50); // 충분히 크게 가져오기 (10개면 asset에 있는 게 누락될 수 있음)

        searchSourceBuilder.aggregation(aggregation).size(0);
        searchRequest.source(searchSourceBuilder);

        SearchResponse response = esClient.search(searchRequest, RequestOptions.DEFAULT);
        Terms terms = response.getAggregations().get("popular_keywords");

        // 2. Asset 리스트 가져오기
        List<Asset> coins = assetService.get_asset_list();
        Set<String> validCoinNames = coins.stream()
            .map(a -> a.getAsset_name().toLowerCase())
            .collect(Collectors.toSet());

        // 3. 결과 필터링
        List<KeywordCount> topics = new ArrayList<>();
        for (Terms.Bucket bucket : terms.getBuckets()) {
            String key = bucket.getKeyAsString().toLowerCase();
            if (validCoinNames.contains(key)) {
                topics.add(new KeywordCount(bucket.getKeyAsString(), bucket.getDocCount()));
            }
        }

        return topics;
    }

    // 인덱스만들기
    public void createCommunityPostsIndex() throws IOException {
        String indexName = "community-posts";

        // 1. 인덱스가 이미 있으면 생성하지 않도록 체크
        boolean exists = esClient.indices().exists(new org.elasticsearch.client.indices.GetIndexRequest(indexName), RequestOptions.DEFAULT);
        if (exists) return;

        // 2. 인덱스 생성 요청
        CreateIndexRequest request = new CreateIndexRequest(indexName);

        // 3. 설정: analyzer, synonym filter
        request.settings(Settings.builder()
            .put("index.number_of_shards", 1)
            .put("index.number_of_replicas", 1)
            .put("analysis.filter.coin_synonym_filter.type", "synonym")
            .putList("analysis.filter.coin_synonym_filter.synonyms", 
                "btc, bit, bitcoin,비트코인 => 비트코인",
                    "eth, ethereum, 이더리움 => 이더리움",
                    "usdt, tether, 테더 => 테더",
                    "ada, 에이다 => 에이다",
                    "doge, dogecoin, 도지, 도지코인 => 도지코인",
                    "xrp, 리플, ripple, 엑스알피 => 리플",
                    "link, 체인링크 => 체인링크",
                    "sol, 솔라나 => 솔라나",
                    "worldcoin, wld => 월드코인",
                    "sui => 수이",
                    "pepe => 페페",
                    "neo => 네오",
                    "shiba inu, shibainu, shiba, shib => 시바이누",
                    "baby doge, baby => 베이비도지",
                    "bora => 보라",
                    "milk => 밀크",
                    "bittorrent, btt => 비트토렌트",
                    "eos => 이오스",
                    "ethereum classic, ethereumclassic, etc => 이더리움클래식",
                    "quantum, qtum => 퀀텀"
            )
            .put("analysis.analyzer.my_synonym_analyzer.type", "custom")
            .putList("analysis.analyzer.my_synonym_analyzer.filter", "lowercase", "coin_synonym_filter")
            .put("analysis.analyzer.my_synonym_analyzer.tokenizer", "standard")
        );

        // 4. 매핑
        String mappingJson = """
        {
        "properties": {
            "author": {"type": "keyword"},
            "content": {"type": "text", "analyzer": "my_synonym_analyzer", "fielddata": true},
            "coin_names": {"type": "keyword"},
            "created_at": {"type": "date"}
        }
        }
        """;
        request.mapping(mappingJson, XContentType.JSON);

        // 5. 생성
        CreateIndexResponse createIndexResponse = esClient.indices().create(request, RequestOptions.DEFAULT);
        System.out.println("Created index: " + createIndexResponse.index());
    }

    // 아래는 주성이 게시판

    @Override
    public List<Community> findAll() {
        return sqlSession.selectList("com.finalproject.pickcoin.repository.CommunityRepository.findAll");
    }

    @Override
    public Community findById(Integer post_id) {
        return sqlSession.selectOne(
            "com.finalproject.pickcoin.repository.CommunityRepository.findById",
            Map.of("post_id", post_id) 
        );
    }

    @Override
    public void insert(Community community) {
        sqlSession.insert("com.finalproject.pickcoin.repository.CommunityRepository.insert", community);
    }

    @Override
    public void update(Community community) {
        sqlSession.update("com.finalproject.pickcoin.repository.CommunityRepository.update", community);
    }

    @Override
    public void delete(Integer post_id) {
        sqlSession.delete(
            "com.finalproject.pickcoin.repository.CommunityRepository.delete",
            Map.of("post_id", post_id)
        );
    }

    @Override
    public void increaseLikeCount(int post_id) {
        sqlSession.update(
            "com.finalproject.pickcoin.repository.CommunityRepository.increaseLikeCount",
            Map.of("post_id", post_id)
        );
    }
}
