package com.finalproject.pickcoin.repository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finalproject.pickcoin.domain.ChatMessage;

@Repository
public class ChatRepository {

    @Autowired
    private StringRedisTemplate redisTemplate;

    private ObjectMapper objectMapper = new ObjectMapper();
    
    public List<String> getMessageHistory(String key){

        List<String> rawMessages = redisTemplate.opsForList().range(key, 0, -1);
        return rawMessages;
    }

    public void sendMessage(Map<String, Object> entity){
        
        try{
            String key = "chat:room:" + entity.get("room_id").toString();
            redisTemplate.opsForList().rightPush(key, objectMapper.writeValueAsString(entity));

        }catch(Exception e){
            e.printStackTrace();
        }
        
    }
}
