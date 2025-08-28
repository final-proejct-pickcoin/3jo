package com.finalproject.pickcoin.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.finalproject.pickcoin.domain.ChatMessage;
import com.finalproject.pickcoin.repository.ChatRepository;

@Service
public class ChatServiceImpl implements ChatService {

    @Autowired
    private ChatRepository chatRepository;

    @Override
    public List<String> getMessageHistory(String key) {
        
        List<String> rawMessages = chatRepository.getMessageHistory(key);

        return rawMessages;
    }

    @Override
    public void sendMessage(Map<String, Object> entity) {
        chatRepository.sendMessage(entity);
    }
    
}
