package com.finalproject.pickcoin.controller;

import java.util.Map;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class ChatWebSocketController {

    @MessageMapping("/chat.send.{roomId}")
    @SendTo("/topic/chatroom.{roomId}")
    public Map<String, Object> sendMessage(Map<String, Object> message, @DestinationVariable String roomId) {
        System.out.println("웹소켓 백엔드 들어옴"+roomId);
        return message;
    }
}
