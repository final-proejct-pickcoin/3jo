package com.finalproject.pickcoin.domain;

import java.util.Date;

import com.finalproject.pickcoin.enums.MessageType;
import com.finalproject.pickcoin.enums.Role;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Data
@Entity(name = "chat_message")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer message_id; // 메시지 ID
    private Integer session_id;
    private Integer sender_id; // 발신자 ID
    private Role sender_role;
    private String content; // 메시지 내용
    private MessageType status; // 메시지 상태 (예: "sent", "delivered", "read") enum으로 변경 가능
    private Date timestamp; // 전송 시간
}
