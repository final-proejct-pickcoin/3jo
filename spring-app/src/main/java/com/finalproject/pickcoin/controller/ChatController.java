package com.finalproject.pickcoin.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RestController;

import com.finalproject.pickcoin.service.ChatService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/chat")
public class ChatController {
    
    @Autowired
    private ChatService chatService;

    @GetMapping("/history/{user_id}")
    public List<String> getMessageHistory(@PathVariable Integer user_id) {

        String key = "chat:room:" + user_id;

        List<String> rawMessages = chatService.getMessageHistory(key);

        return rawMessages;
    }

    @PostMapping("/send")
    public void sendMessage(@RequestBody Map<String, Object> entity) {
        System.out.println("컨트롤러에서 엔터티"+entity.toString());
        chatService.sendMessage(entity);
        
    }
    
    
}
