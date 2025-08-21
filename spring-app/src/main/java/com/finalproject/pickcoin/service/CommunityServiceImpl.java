package com.finalproject.pickcoin.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.session.SqlSession;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.search.aggregations.AggregationBuilders;
import org.elasticsearch.search.aggregations.bucket.terms.Terms;
import org.elasticsearch.search.aggregations.bucket.terms.TermsAggregationBuilder;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.finalproject.pickcoin.domain.Asset;
import com.finalproject.pickcoin.domain.Community;
import com.finalproject.pickcoin.domain.KeywordCount;

import co.elastic.clients.elasticsearch.indices.RefreshRequest;

import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;

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

        List<Asset> coins = assetService.get_asset_list();

        String contentLower = (post.getContent() == null ? "" : post.getContent()).toLowerCase();

        List<String> coin_names = new ArrayList<>();
        for(Asset coin : coins){
            String coin_name = coin.getAsset_name().toLowerCase();
            if(contentLower.contains(coin_name)){
                coin_names.add(coin.getAsset_name());
            }
        }

        // System.out.println("코인 포함 네임:"+coin_names.toString());
        IndexRequest request = new IndexRequest("community-posts")
        // .id(String.valueOf(post.getPost_id()))
        .source(
            "content", post.getContent(),
            "author", post.getAuthor(),
            "created_at", post.getCreatedAt(),
            "coin_names", coin_names
        );

        // Map<String, Object> jsonMap = new HashMap<>();
        // jsonMap.put("content", post.getContent());
        // jsonMap.put("author", post.getAuthor());
        // jsonMap.put("created_at", post.getCreatedAt());


        esClient.index(request, RequestOptions.DEFAULT);
        esClient.indices().refresh(new org.elasticsearch.action.admin.indices.refresh.RefreshRequest("community-posts"), RequestOptions.DEFAULT);
    }

    public List<KeywordCount> getPopularKeword() throws IOException {
        SearchRequest searchRequest = new SearchRequest("community-posts");
        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder();

        TermsAggregationBuilder aggregation = AggregationBuilders
            .terms("popular_keywords")
            .field("coin_names") // 분석기 설정에 따라 적절히 변경
            .size(10);

        searchSourceBuilder.aggregation(aggregation).size(0);
        searchRequest.source(searchSourceBuilder);

        SearchResponse response = esClient.search(searchRequest, RequestOptions.DEFAULT);
        Terms terms = response.getAggregations().get("popular_keywords");

        List<KeywordCount> topics = new ArrayList<>();
        for (Terms.Bucket bucket : terms.getBuckets()) {
            topics.add(new KeywordCount(bucket.getKeyAsString(), bucket.getDocCount()));
        }

        // System.out.println("서비스에서 인기코인 검색 시:"+topics.toString());
        return topics;
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
