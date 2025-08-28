package com.finalproject.pickcoin.config;

import org.apache.http.HttpHost;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestHighLevelClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ElasticsearchConfig {
    
    @Bean(destroyMethod = "close")
    public RestHighLevelClient restHighLevelClient(){
        return new RestHighLevelClient(
            RestClient.builder(
                new HttpHost("elasticsearch", 9200, "http")  // Elasticsearch 주소, 포트, 프로토콜에 맞게 수정
            )
        );
    }
}
