package com.finalproject.pickcoin.service;

import java.util.List;
import java.util.Map;

public interface ChatService {
    List<String> getMessageHistory(String key);
    void sendMessage(Map<String, Object> entity);
}
