"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Volume2, X, Send, AlertTriangle } from "lucide-react"; // AlertTriangle : 아이콘 

// 애니메이션을 위한 CSS
const styles = `
  .voice-recording { animation: pulse-animation 1.5s infinite; }
  @keyframes pulse-animation {
    0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(255, 0, 0, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
  }
  .pulse-glow { animation: pulse-glow-animation 1.5s infinite; }
  @keyframes pulse-glow-animation {
    0% { transform: scale(1); opacity: 0.7; }
    50% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1); opacity: 0.7; }
  }
`;

export const VoiceAssistant2 = () => {
  // --- 상태 관리 ---
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 마이크 권한 상태 'granted', 'prompt', 'denied'
  const [isVisible, setIsVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statusMessage, setStatusMessage] = useState("대기 중");
  const [userTranscript, setUserTranscript] = useState("");
  const [botResponse, setBotResponse] = useState("");
  const [textInput, setTextInput] = useState(""); // 텍스트 입력 상태 

  // --- 참조 관리 ---
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const chatLogRef = useRef(null);

  // --- 생명주기 및 정리 ---
  useEffect(() => {
    
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // Permissions API를 사용한 권한 상태 확인 로직 추가
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' }).then((result) => {
        setPermissionStatus(result.state);
        // 사용자가 브라우저 설정에서 직접 권한을 변경하는 것을 감지
        result.onchange = () => {
          setPermissionStatus(result.state);
          if(result.state === 'denied') {
              setStatusMessage("마이크 권한이 차단되었습니다.");
              if(isListening) stopListening(); // 듣고 있었다면 중지
          }
        };
      });
    }

    return () => {
      document.head.removeChild(styleSheet);
      if (socketRef.current) socketRef.current.close();
      if (audioStreamRef.current) audioStreamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []); // 최초 한 번만 실행

  // 채팅 로그가 업데이트될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (chatLogRef.current) {
        chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [userTranscript, botResponse]);

  // --- 웹소켓 로직 ---
  const ensureWebSocketConnection = () => {
    return new Promise((resolve, reject) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        resolve(socketRef.current);
        return;
      }
      
      const ws = new WebSocket('ws://localhost:8000/api/voice-chat');

      ws.onopen = () => {
        console.log('WebSocket connected to /api/voice-chat');
        socketRef.current = ws;
        resolve(ws);
      };

      ws.onmessage = (event) => handleServerMessage(JSON.parse(event.data));
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setStatusMessage('서버와 연결이 끊겼습니다.');
        resetStates();
      };
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatusMessage('WebSocket 연결 오류 발생.');
        reject(error);
      };
    });
  };

  const handleServerMessage = (data) => {
    switch (data.type) {
      case 'transcript':
        setStatusMessage(`"${data.text}"`);
        break;
      case 'botResponse':
        setUserTranscript(prev => prev + (prev ? " " : "") + data.userText); // 기존 텍스트에 추가
        setBotResponse(data.botResponseText);
        speakText(data.botResponseText);
        setStatusMessage('응답 완료');
        setIsListening(false);
        break;
      case 'error':
        console.error('Server error:', data.text);
        setStatusMessage(`오류: ${data.text}`);
        stopListening();
        break;
      default:
        break;
    }
  };
  
  // --- 음성 합성 (TTS) ---
  const speakText = (text) => {
    if (!text || typeof window.speechSynthesis === 'undefined') return;
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // --- 컨트롤 핸들러 ---
  // --- handleMicButtonClick(권한 처리)와 startRecording(실제 녹음) ---

  // 실제 녹음 시작 로직만 담당하는 헬퍼 함수
  const startRecording = (stream) => {
    audioStreamRef.current = stream;
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
    
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(event.data);
      }
    };

    // stopListening 호출 시 스트림도 함께 종료되도록 onstop 이벤트 핸들러 추가
    mediaRecorderRef.current.onstop = () => {
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
        }
        setIsListening(false);
        if (statusMessage.startsWith('듣는 중') || statusMessage.startsWith('"')) {
            setStatusMessage('음성 처리 중...');
        }
    };
    
    mediaRecorderRef.current.start(250);
    setIsListening(true);
    setStatusMessage('듣는 중...');
  };

  // stopListening 함수는 MediaRecorder를 중지하는 역할만 
  const stopListening = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // 모든 마이크 관련 클릭 이벤트를 제어하는 통합 핸들러
  const handleMicButtonClick = async () => {
    // 1. 이미 듣고 있는 경우: 녹음 중지
    if (isListening) {
      stopListening();
      return;
    }

    // 2. 웹소켓 연결 보장 (필수)
    try {
      await ensureWebSocketConnection();
    } catch (error) {
      setStatusMessage('서버 연결에 실패했습니다.');
      return;
    }
    
    // 3. 권한 상태에 따른 분기 처리
    if (permissionStatus === 'denied') {
      alert("마이크 권한이 차단되었습니다.\n브라우저 주소창의 자물쇠 🔒 아이콘을 클릭하여 권한을 '허용'으로 변경해주세요.");
      return;
    }

    // 4. 권한이 허용되었거나 아직 묻지 않은 상태: 마이크 사용 시도
    try {
      setUserTranscript("");
      setBotResponse("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      startRecording(stream); // 성공 시 녹음 시작
      
    } catch (err) {
        console.error("마이크 접근 오류:", err); // 콘솔에 실제 오류 객체 기록

        // 오류 유형에 따른 상세 메시지 표시 (catch 블록 로직 재활용)
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setStatusMessage("오류: 마이크 접근 권한이 거부되었습니다.");
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setStatusMessage("오류: 사용 가능한 마이크 장치가 없습니다.");
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setStatusMessage("오류: 마이크를 사용할 수 없습니다. 다른 프로그램이 사용 중인지 확인하세요.");
        } else {
          // 기타 예측하지 못한 오류
          setStatusMessage('오류: 마이크를 시작할 수 없습니다.');
        }
    }
  };


  // 텍스트 제출 핸들러 추가
  const handleSubmitText = async (e) => {
    e.preventDefault();
    if (!textInput.trim() || isListening) return;

    setUserTranscript(textInput);
    setBotResponse(""); // 이전 봇 응답 초기화
    
    try {
        const ws = await ensureWebSocketConnection();
        const message = {
            type: 'text_input',
            text: textInput,
        };
        ws.send(JSON.stringify(message));
        setStatusMessage('생각 중...');
        setTextInput('');
    } catch (error) {
        console.error('Failed to send text:', error);
        setStatusMessage('메시지 전송 실패');
    }
  };

  const resetStates = () => {
      setIsListening(false);
      setIsSpeaking(false);
      setUserTranscript("");
      setBotResponse("");
      setTextInput("");
      setStatusMessage("대기 중");
  }

  const handleToggleVisibility = () => {
    if (isVisible) {
      stopListening();
      if (socketRef.current) {
          socketRef.current.close();
          socketRef.current = null;
      }
    }
    resetStates();
    setIsVisible(!isVisible);
  }

  // --- 렌더링 로직 ---

  if (!isVisible) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button onClick={handleToggleVisibility} className="rounded-full w-16 h-16 shadow-lg" size="lg">
          <Mic className="h-7 w-7" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-96 shadow-xl flex flex-col">
        <CardContent className="p-4 flex-grow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">AI 비서</h3>
            <Button variant="ghost" size="sm" onClick={handleToggleVisibility}><X className="h-5 w-5"/></Button>
          </div>
          
          <div ref={chatLogRef} className="h-64 overflow-y-auto space-y-4 pr-2">
            {/* 초기 상태 또는 에러 상태 */}
            {!userTranscript && !botResponse && (
                 <div className="text-center p-4 h-full flex flex-col justify-center items-center">
                    <p className="text-muted-foreground">{statusMessage}</p>
                    <Badge variant="outline" className="mt-2">음성 또는 텍스트로 질문하세요</Badge>
                </div>
            )}
            
            {/* 상호작용 결과 표시 */}
            {userTranscript && (
                <div className="p-3 bg-muted/50 rounded-lg text-right">
                    <p className="text-sm font-medium">나의 질문:</p>
                    <p className="text-sm text-muted-foreground">"{userTranscript}"</p>
                </div>
            )}

            {isListening && (
                <div className="p-3 text-center">
                    <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center voice-recording">
                        <Mic className="h-8 w-8 text-red-500" />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground mt-2">{statusMessage}</p>
                </div>
            )}

            {isSpeaking ? (
                <div className="p-3 text-left">
                    <div className="inline-flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Volume2 className="h-5 w-5 text-green-600 pulse-glow" />
                        </div>
                        <p className="text-md text-muted-foreground">응답 중...</p>
                    </div>
                </div>
            ) : botResponse && (
                <div className="p-3 bg-green-50 rounded-lg text-left">
                    <p className="text-sm font-medium text-green-700">AI 답변:</p>
                    <p className="text-sm text-green-600">{botResponse}</p>
                </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 border-t">
            <form onSubmit={handleSubmitText} className="w-full flex items-center gap-2">
                {/* 마이크 버튼이 권한 상태까지 고려하여 동적으로 렌더링되도록 변경 */}
                <Button
                    type="button"
                    onClick={handleMicButtonClick} // 통합 핸들러로 변경
                    disabled={isSpeaking || !!textInput}
                    variant={isListening ? "destructive" : "secondary"}
                    size="icon"
                    className="rounded-full flex-shrink-0"
                >
                  {isListening ? (
                    <MicOff className="h-5 w-5" />
                  ) : permissionStatus === 'denied' ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}   
                </Button>
                <Input 
                    placeholder="메시지를 입력하거나 마이크를 누르세요..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    disabled={isListening}
                />
                <Button 
                    type="submit" 
                    size="icon" 
                    className="rounded-full flex-shrink-0"
                    disabled={isListening || !textInput}
                >
                    <Send className="h-5 w-5" />
                </Button>
            </form>
        </CardFooter>
      </Card>
    </div>
  );
};