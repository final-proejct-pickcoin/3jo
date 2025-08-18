"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Volume2, X, Send, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"; // 아이콘 추가

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
  .coin-price { 
    font-family: 'Monaco', 'Menlo', monospace; 
    font-weight: bold;
  }
  .price-up { color: #dc2626; }
  .price-down { color: #2563eb; }
  .price-neutral { color: #6b7280; }
`;

export const VoiceAssistant2 = () => {
  // --- 기본 상태 관리 ---
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 마이크 권한 상태
  const [isVisible, setIsVisible] = useState(false); // 컴포넌트 표시 여부
  const [isListening, setIsListening] = useState(false); // 음성 인식 중인지 여부
  const [isSpeaking, setIsSpeaking] = useState(false); // TTS 재생 중인지 여부
  const [statusMessage, setStatusMessage] = useState("대기 중"); // 현재 상태 메시지
  const [userTranscript, setUserTranscript] = useState(""); // 사용자 음성 인식 결과
  const [botResponse, setBotResponse] = useState(""); // 봇 응답 텍스트
  const [textInput, setTextInput] = useState(""); // 텍스트 입력 필드 값
  const [chatHistory, setChatHistory] = useState([]); // 대화 기록 배열
  
  // --- 연결 상태 및 오류 관리 ---
  const [connectionState, setConnectionState] = useState('disconnected'); // WebSocket 연결 상태 // 'disconnected', 'connected', 'voice_mode', 'error'
  const [lastError, setLastError] = useState(""); // 마지막 오류 메시지

  // 코인 정보 관련 상태
  const [isLoadingCoinData, setIsLoadingCoinData] = useState(false); // 코인 데이터 로딩 중인지 여부

  // --- 참조 관리 ---
  const socketRef = useRef(null); // WebSocket 연결 참조
  const mediaRecorderRef = useRef(null); // 미디어 레코더 참조
  const audioStreamRef = useRef(null); // 오디오 스트림 참조
  const chatLogRef = useRef(null); // 채팅 로그 스크롤 참조

  // --- 🔥 새로 추가: TTS 관리 참조 ---
  const speechSynthesisRef = useRef(null); // 현재 재생 중인 TTS 참조
  const currentUtteranceRef = useRef(null); // 현재 SpeechSynthesisUtterance 참조

  // --- 작업 추적 참조 ---
  const transcribeTaskRef = useRef(null); // 음성 인식 작업 참조
  const currentOperationRef = useRef('idle'); // 현재 작업 상태: 'idle', 'voice', 'text'

  /**
   * 백엔드 URL 결정 함수
   * - 개발 환경에서는 localhost 사용
   * - 프로덕션 환경에서는 적절한 URL 사용
   */
  const getBackendUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'ws://localhost:8000';
      } else {
        // Docker 환경이나 기타 환경
        return 'ws://host.docker.internal:8000';
      }
    }
    return 'ws://localhost:8000';
  };

  /*
   * 현재 재생 중인 TTS 음성을 즉시 중단하는 함수
   */
  const stopCurrentSpeech = () => {
    try {
      // Web Speech API의 speechSynthesis를 사용하여 모든 음성 중단
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel(); // 현재 재생 중인 모든 utterance 취소
        console.log("🔇 현재 재생 중인 TTS 음성을 중단했습니다.");
      }

      // 현재 재생 상태 초기화
      setIsSpeaking(false);
      
      // 참조 초기화
      if (currentUtteranceRef.current) {
        currentUtteranceRef.current = null;
      }
      
    } catch (error) {
      console.error("🚨 TTS 중단 중 오류:", error);
    }
  };

  // --- 🔥 개선된 TTS 함수 ---
  /**
   * 텍스트를 음성으로 변환하여 재생하는 함수
   * - 새로운 TTS 시작 시 기존 음성 자동 중단
   * - 재생 상태 추적 및 관리
   */
  const speakText = (text) => {
    if (!text || typeof window.speechSynthesis === 'undefined') {
      console.warn("⚠️ TTS 사용 불가: 텍스트가 없거나 브라우저가 지원하지 않음");
      return;
    }

    // 🔥 새로운 음성 시작 전에 기존 음성 중단
    stopCurrentSpeech();

    console.log("🔊 새로운 TTS 음성 시작:", text.substring(0, 50) + "...");
    
    setIsSpeaking(true);
    
    // 새로운 SpeechSynthesisUtterance 생성
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR'; // 한국어 설정
    utterance.rate = 1.0; // 말하기 속도
    utterance.pitch = 1.0; // 음성 높이
    
    // 음성 재생 완료 시 상태 업데이트
    utterance.onend = () => {
      console.log("✅ TTS 음성 재생 완료");
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };
    
    // 음성 재생 오류 시 상태 업데이트
    utterance.onerror = (event) => {
      console.error("🚨 TTS 재생 오류:", event.error);
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };

    // 음성 재생 시작 시 상태 업데이트
    utterance.onstart = () => {
      console.log("🎵 TTS 음성 재생 시작");
      setIsSpeaking(true);
    };

    // 참조에 현재 utterance 저장
    currentUtteranceRef.current = utterance;
    
    // 음성 재생 시작
    window.speechSynthesis.speak(utterance);
  };

  // --- 생명주기 및 초기화 ---
  useEffect(() => {
    // CSS 스타일 추가
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // 마이크 권한 상태 확인 및 모니터링
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' }).then((result) => {
        setPermissionStatus(result.state);
        console.log(`🎤 마이크 권한 상태: ${result.state}`);

        // 권한 상태 변경 감지
        result.onchange = () => {
          setPermissionStatus(result.state);
          console.log(`🎤 마이크 권한 상태 변경: ${result.state}`);
          
          if(result.state === 'denied') {
            setStatusMessage("마이크 권한이 차단되었습니다.");
            if(isListening) stopListening();
          }
        };
      });
    }

    // 컴포넌트 언마운트 시 정리 작업
    return () => {
      document.head.removeChild(styleSheet);
      if (socketRef.current) socketRef.current.close();
      if (audioStreamRef.current) audioStreamRef.current.getTracks().forEach(track => track.stop());
      stopCurrentSpeech(); // 🔥 TTS 정리 추가
      cleanupCurrentOperation(); // 정리 시 모든 작업 중단
    };
  }, []);

  // 채팅 로그가 업데이트될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (chatLogRef.current) {
        chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [chatHistory]);
  
  /**
   * 현재 진행 중인 모든 작업을 정리하는 함수
   * - 음성 인식 중단
   * - 미디어 스트림 해제
   * - TTS 중단 🔥
   * - 상태 초기화
   */
  // 현재 작업 정리 함수
  const cleanupCurrentOperation = () => {
    console.log("🧹 현재 작업 정리 중...");
  
    // 🔥 진행 중인 TTS 중단
    stopCurrentSpeech();
    
    // 음성 인식 작업 중단
    if (transcribeTaskRef.current) {
      transcribeTaskRef.current = null;
    }
    
    // 미디어 스트림 정리
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    // 미디어 레코더 정리
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    // 작업 상태 초기화
    currentOperationRef.current = 'idle';
    setIsListening(false);
    setConnectionState('connected');
  };


  // --- WebSocket 연결 관리 ---
  /**
   * WebSocket 연결을 보장하는 함수
   * - 기존 연결이 있으면 재사용
   * - 없으면 새로 연결 생성
   */
  // --- 웹소켓 로직 ---
  const ensureWebSocketConnection = () => {
    return new Promise((resolve, reject) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        setConnectionState('connected');
        resolve(socketRef.current);
        return;
      }

      // 기존 연결 정리
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }      
      
      // 동적 URL 사용
      const wsUrl = `${getBackendUrl()}/api/voice-chat`;
      console.log(`🔗 WebSocket 연결 시도: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected to /api/voice-chat');
        socketRef.current = ws;
        setConnectionState('connected');
        setLastError("");        
        resolve(ws);
      };

      ws.onmessage = (event) => handleServerMessage(JSON.parse(event.data));

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setConnectionState('disconnected');        
        setStatusMessage('서버와 연결이 끊겼습니다.');

        // 연결 끊어질 때 모든 작업 정리
        cleanupCurrentOperation();        
        resetStates();
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState('error');
        setLastError("WebSocket 연결 오류가 발생했습니다.");        
        setStatusMessage('WebSocket 연결 오류 발생.');
        reject(error);
      };
    });
  };

  /**
   * 서버로부터 받은 메시지를 처리하는 함수
   * - transcript: 음성 인식 중간 결과
   * - botResponse: 봇의 최종 응답 (TTS 재생)
   * - error: 오류 메시지
   */
  // 서버 메시지 처리 - 상태 관리 추가  
  const handleServerMessage = (data) => {
    switch (data.type) {
      case 'transcript':
        if (currentOperationRef.current === 'voice') {
          setStatusMessage(`"${data.text}"`);
        }
        break;

      case 'botResponse':
        console.log("🤖 봇 응답 수신:", data.botResponseText.substring(0, 50) + "...");
        
        // 🔥 새로운 응답 시작 전에 기존 TTS 중단
        stopCurrentSpeech();

        // 새로운 대화(질문+답변)를 대화 기록에 추가 // chatHistory 배열에 추가
        setChatHistory(prevHistory => [
          ...prevHistory,
          {
            user: data.userText,
            bot: data.botResponseText,
            timestamp: new Date().toLocaleTimeString() // 시간 추가
          }
        ]);

        // 🔥 새로운 응답 TTS 재생
        speakText(data.botResponseText);
        setStatusMessage('응답 완료');

        // setIsListening(false);
        // stopListening();

        // 작업 완료 후 상태 정리
        cleanupCurrentOperation();
        setIsLoadingCoinData(false);
        break;

      case 'error':
        console.error('Server error:', data.text);
        setStatusMessage(`오류: ${data.text}`);
        setLastError(data.text);

        // 🔥 오류 발생 시 TTS 중단
        stopCurrentSpeech();

        // 오류 발생 시 상태 정리
        cleanupCurrentOperation();
        setIsLoadingCoinData(false);

        // stopListening();
        break;
      default:
        console.log("📨 알 수 없는 메시지 타입:", data.type);
        break;
    }
  };
  
  // // --- 음성 합성 (TTS) ---
  // const speakText = (text) => {
  //   if (!text || typeof window.speechSynthesis === 'undefined') return;
  //   setIsSpeaking(true);
  //   const utterance = new SpeechSynthesisUtterance(text);
  //   utterance.lang = 'ko-KR';
  //   utterance.rate = 1.0; // 말하기 속도
  //   utterance.pitch = 1.0; // 음성 높이
  //   utterance.onend = () => setIsSpeaking(false);
  //   utterance.onerror = () => setIsSpeaking(false);
  //   window.speechSynthesis.speak(utterance);
  // };




  // --- 음성 녹음 관리 ---
  /**
   * 음성 녹음을 시작하는 함수
   * - MediaRecorder 설정 및 시작
   * - WebSocket을 통한 실시간 데이터 전송
   */ 
  // --- 컨트롤 핸들러 ---
  const startRecording = (stream) => {
    audioStreamRef.current = stream;
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });

    // 녹음 데이터가 사용 가능할 때 WebSocket으로 전송
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(event.data);
      }
    };

    // 녹음 중단 시 처리
    mediaRecorderRef.current.onstop = () => {
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
        }
        setIsListening(false);
        if (statusMessage.startsWith('듣는 중') || statusMessage.startsWith('"')) {
            setStatusMessage('음성 처리 중...');
        }
    };
    
    // 250ms마다 데이터 청크 전송
    mediaRecorderRef.current.start(250);
    setIsListening(true);
    setConnectionState('voice_mode');
    currentOperationRef.current = 'voice';    
    setStatusMessage('듣는 중...');

    console.log("🎤 음성 녹음 시작");
  };

  /**
   * 음성 인식을 중단하는 함수
   */  
  const stopListening = () => {
    console.log("🛑 음성 인식 중단");

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'end_of_speech' }));
      }
    }

    // 음성 인식 중단 시 상태 정리
    currentOperationRef.current = 'idle';
    setConnectionState('connected');
  };

  /**
   * 마이크 버튼 클릭 시 처리 함수
   * - 기존 TTS 중단 🔥
   * - 음성 인식 시작/중단
   * - 오류 처리 강화
   */
// 마이크 버튼 클릭 핸들러 - 오류 처리 강화  
  const handleMicButtonClick = async () => {
    console.log("🎤 마이크 버튼 클릭");

    // 🔥 마이크 버튼 클릭 시 진행 중인 TTS 즉시 중단
    stopCurrentSpeech();

    if (isListening) {
      stopListening();
      return;
    }

    // 다른 작업 진행 중이면 차단
    if (currentOperationRef.current !== 'idle') {
      setStatusMessage('다른 작업이 진행 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setStatusMessage("연결 중...");
    setLastError(""); // 이전 오류 메시지 지우기

    try {
      // 1. WebSocket 연결 확인
      const ws = await ensureWebSocketConnection();

      // 2. 마이크 권한 및 디바이스 확인
      if (permissionStatus === 'denied') {
        throw new Error('마이크 권한이 거부되어 있습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
      }      

      // 3. 미디어 디바이스 접근 시도
      let stream;
      try {
        // 디바이스 존재 여부 먼저 확인
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
        
        if (audioInputDevices.length === 0) {
          throw new Error('오디오 입력 장치를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.');
        }

        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
      } catch (mediaError) {
        console.error("🎤 미디어 접근 오류:", mediaError);

        // 상세한 오류 메시지 제공
        let errorMessage = "마이크에 접근할 수 없습니다. ";
        
        if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
          errorMessage += "마이크 사용 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.";
        } else if (mediaError.name === 'NotFoundError' || mediaError.name === 'DevicesNotFoundError') {
          errorMessage += "마이크 장치를 찾을 수 없습니다. 마이크가 제대로 연결되어 있는지 확인해주세요.";
        } else if (mediaError.name === 'NotReadableError') {
          errorMessage += "마이크가 다른 애플리케이션에서 사용 중일 수 있습니다.";
        } else {
          errorMessage += "알 수 없는 오류가 발생했습니다. 페이지를 새로고침하고 다시 시도해주세요.";
        }
        
        setStatusMessage(errorMessage);
        setLastError(errorMessage);
        throw new Error(errorMessage);
      }

      // 4. 음성 인식 시작 신호 전송
      try {
        ws.send(JSON.stringify({ type: 'start_speech' }));
        startRecording(stream);
        console.log("🎤 음성 녹음 시작됨");
        
      } catch (wsError) {
        // WebSocket 전송 실패 시 스트림 정리
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        throw new Error("서버 통신 오류가 발생했습니다.");
      }

    } catch (err) {
      console.error("❌ 마이크 버튼 클릭 처리 오류:", err);
      setStatusMessage(err.message || '마이크를 시작할 수 없습니다.');
      setLastError(err.message || '알 수 없는 오류');
      setConnectionState('error');
      
      // 오류 발생 시 상태 완전 초기화
      cleanupCurrentOperation();
    }
  };

  /**
   * 텍스트 입력 제출 시 처리 함수
   * - 기존 TTS 중단 🔥
   * - 상태 관리 강화
   * - 중복 요청 방지
   */  
  // 텍스트 제출 핸들러 - 상태 관리 강화
  const handleSubmitText = async (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    console.log("💬 텍스트 제출:", textInput);

    // 🔥 텍스트 제출 시 진행 중인 TTS 즉시 중단
    stopCurrentSpeech();

    // ✅ [추가] 음성 인식 중이면 차단하고 안내
    if (currentOperationRef.current === 'voice') {
      setStatusMessage('음성 인식이 진행 중입니다. 음성 인식을 중단하고 다시 시도해주세요.');
      return;
    }

    // ✅ [추가] 이미 텍스트 처리 중이면 차단
    if (currentOperationRef.current === 'text') {
      setStatusMessage('이전 메시지를 처리 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // [추가] 코인 관련 키워드 감지 및 로딩 상태 표시
    const coinKeywords = ['가격', '시세', '코인', '비트', '이더', '리플'];
    const hasCoinQuery = coinKeywords.some(keyword => textInput.includes(keyword));
    
    if (hasCoinQuery) {
      setIsLoadingCoinData(true);
    }
    
    try {
        currentOperationRef.current = 'text'; // ✅ [추가] 텍스트 처리 모드 설정
        setConnectionState('connected');
        
        const ws = await ensureWebSocketConnection();
        const message = {
            type: 'text_input',
            text: textInput,
        };
        ws.send(JSON.stringify(message));
        setStatusMessage('생각 중...');
        setTextInput('');
        
    } catch (error) {
        console.error('❌ 텍스트 전송 실패:', error);
        setStatusMessage('메시지 전송 실패. 연결을 확인해주세요.');
        setLastError('메시지 전송 실패');
        
        // ✅ [추가] 오류 시 상태 초기화
        currentOperationRef.current = 'idle';
        setIsLoadingCoinData(false);
    }
  };
  //   } finally {
  //       setIsLoadingCoinData(false);
  //   }
  // };

  // 상태 초기화 함수 - 더 철저한 정리
  const resetStates = () => {
      cleanupCurrentOperation(); // ✅ [추가] 현재 작업 정리
      setIsSpeaking(false);
      setUserTranscript("");
      setBotResponse("");
      setTextInput("");
      setStatusMessage("대기 중");
      setIsLoadingCoinData(false);
      setLastError(""); // ✅ [추가] 오류 상태도 초기화
      setConnectionState('disconnected');
  }

  const handleToggleVisibility = () => {
    if (isVisible) {
      stopListening();
      if (socketRef.current) {
          socketRef.current.close();
          socketRef.current = null;
      }
      // ✅ [추가] 창 닫을 때도 모든 작업 정리
      cleanupCurrentOperation();
    }
    resetStates();
    setIsVisible(!isVisible);
  }

  // [추가] 코인 가격 정보 파싱 및 표시 함수
  const formatCoinInfo = (text) => {
    // 가격 정보가 포함된 텍스트에서 숫자와 변동률 추출
    const priceRegex = /(\d{1,3}(,\d{3})*)\s*원/g;
    const changeRegex = /([+-]?\d+\.?\d*)\s*%/g;
    
    let formattedText = text;
    
    // 가격 하이라이트
    formattedText = formattedText.replace(priceRegex, (match) => {
      return `<span class="coin-price">${match}</span>`;
    });
    
    // 변동률 색상 적용
    formattedText = formattedText.replace(changeRegex, (match, value) => {
      const numValue = parseFloat(value);
      let className = 'price-neutral';
      let icon = '';
      
      if (numValue > 0) {
        className = 'price-up';
        icon = '📈';
      } else if (numValue < 0) {
        className = 'price-down';
        icon = '📉';
      }
      
      return `<span class="${className}">${icon} ${match}</span>`;
    });
    
    return formattedText;
  };

  // ✅ [추가] 연결 상태에 따른 상태 메시지 표시
  const getStatusBadgeInfo = () => {
    switch (connectionState) {
      case 'connected':
        return { variant: "outline", text: "연결됨", color: "text-green-600" };
      case 'voice_mode':
        return { variant: "outline", text: "음성 인식 중", color: "text-blue-600" };
      case 'error':
        return { variant: "destructive", text: "오류 발생", color: "text-red-600" };
      case 'disconnected':
      default:
        return { variant: "secondary", text: "연결 안됨", color: "text-gray-500" };
    }
  };

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

  const statusBadge = getStatusBadgeInfo();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-96 shadow-xl flex flex-col">
        <CardContent className="p-4 flex-grow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">AI 비서 🤖</h3>
            <div className="flex items-center gap-2">
              {/* ✅ [추가] 연결 상태 표시 */}
              <Badge variant={statusBadge.variant} className={`text-xs ${statusBadge.color}`}>
                {statusBadge.text}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleToggleVisibility}>
                <X className="h-5 w-5"/>
              </Button>
            </div>
          </div>
          
          <div ref={chatLogRef} className="h-64 overflow-y-auto space-y-4 pr-2">
            {/* 초기 상태 또는 에러 상태 */}
            {chatHistory.length === 0 && (
                 <div className="text-center p-4 h-full flex flex-col justify-center items-center">
                    <p className="text-muted-foreground">{statusMessage}</p>
                    <Badge variant="outline" className="mt-2">
                      음성 또는 텍스트로 질문하세요
                    </Badge>
                    
                    {/* ✅ [추가] 오류 메시지 표시 */}
                    {lastError && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        {lastError}
                      </div>
                    )}
                    
                    <div className="mt-3 text-xs text-muted-foreground">
                      <p>💡 코인 정보 예시:</p>
                      <p>"비트코인 가격 알려줘"</p>
                      <p>"이더리움 시세는?"</p>
                      <p>"코인 목록 보여줘"</p>
                    </div>
                </div>
            )}
            
            {/* [수정] chatHistory 배열을 순회하며 대화 목록을 표시 */}
            {chatHistory.map((chat, index) => (
              <React.Fragment key={index}>
                <div className="p-3 bg-muted/50 rounded-lg text-right">
                  <p className="text-sm font-medium">나의 질문:</p>
                  <p className="text-sm text-muted-foreground">"{chat.user}"</p>
                  {chat.timestamp && (
                    <p className="text-xs text-muted-foreground mt-1">{chat.timestamp}</p>
                  )}
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-left">
                  <p className="text-sm font-medium text-green-700">AI 답변:</p>
                  <div 
                    className="text-sm text-green-600"
                    dangerouslySetInnerHTML={{ __html: formatCoinInfo(chat.bot) }}
                  />
                </div>
              </React.Fragment>
            ))}            

            {isListening && (
                <div className="p-3 text-center">
                    <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center voice-recording">
                        <Mic className="h-8 w-8 text-red-500" />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground mt-2">{statusMessage}</p>
                </div>
            )}

            {isSpeaking && (
                <div className="p-3 text-left">
                    <div className="inline-flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Volume2 className="h-5 w-5 text-green-600 pulse-glow" />
                        </div>
                        <p className="text-md text-muted-foreground">응답 중...</p>
                    </div>
                </div>
            )}

            {/* [추가] 코인 데이터 로딩 표시 */}
            {isLoadingCoinData && (
                <div className="p-3 text-center">
                    <div className="inline-flex items-center gap-2">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-muted-foreground">코인 정보 조회 중...</p>
                    </div>
                </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 border-t">
            <form onSubmit={handleSubmitText} className="w-full flex items-center gap-2">
                <Button
                    type="button"
                    onClick={handleMicButtonClick}
                    disabled={isSpeaking || !!textInput || currentOperationRef.current === 'text'}
                    variant={isListening ? "destructive" : connectionState === 'error' ? "secondary" : "secondary"}
                    size="icon"
                    className="rounded-full flex-shrink-0"
                >
                  {isListening ? (
                    <MicOff className="h-5 w-5" />
                  ) : permissionStatus === 'denied' || connectionState === 'error' ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}   
                </Button>
                <Input 
                    placeholder={
                      connectionState === 'error' 
                        ? "연결 오류 - 새로고침 후 다시 시도하세요" 
                        : currentOperationRef.current === 'voice' 
                        ? "음성 인식 중..." 
                        : "코인 가격, 시세 등을 물어보세요..."
                    }
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    disabled={isListening || isLoadingCoinData || currentOperationRef.current === 'voice'}
                />
                <Button 
                    type="submit" 
                    size="icon" 
                    className="rounded-full flex-shrink-0"
                    disabled={
                      isListening || 
                      !textInput || 
                      isLoadingCoinData || 
                      currentOperationRef.current !== 'idle' ||
                      connectionState === 'error'
                    }
                >
                    <Send className="h-5 w-5" />
                </Button>
            </form>
            
            {/* ✅ [추가] 하단 상태 정보 표시 */}
            <div className="px-4 pb-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>상태:</span>
                  <span className={`font-semibold ${
                    connectionState === 'connected' ? 'text-green-600' :
                    connectionState === 'voice_mode' ? 'text-blue-600' :
                    connectionState === 'error' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {connectionState === 'connected' && '🟢 준비됨'}
                    {connectionState === 'voice_mode' && '🎤 음성 인식 중'}
                    {connectionState === 'error' && '🔴 오류'}
                    {connectionState === 'disconnected' && '⚪ 연결 안됨'}
                  </span>
                </div>
                
                {/* 현재 작업 표시 */}
                <div className="flex items-center gap-1">
                  {currentOperationRef.current === 'voice' && (
                    <span className="text-blue-600">🎙️ 음성</span>
                  )}
                  {currentOperationRef.current === 'text' && (
                    <span className="text-green-600">💬 텍스트</span>
                  )}
                  {currentOperationRef.current === 'idle' && (
                    <span className="text-gray-400">💤 대기</span>
                  )}
                </div>
              </div>
              
              {/* 오류 상황에서 도움말 표시 */}
              {connectionState === 'error' && (
                <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
                  <div className="font-semibold mb-1">📋 해결 방법:</div>
                  <div>• 페이지 새로고침 (F5)</div>
                  <div>• 마이크 권한 확인</div>
                  <div>• 브라우저 재시작</div>
                </div>
              )}
              
              {/* 마이크 권한 거부 시 안내 */}
              {permissionStatus === 'denied' && (
                <div className="mt-2 text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                  <div className="font-semibold mb-1">🎤 마이크 권한 필요</div>
                  <div>브라우저 주소창 옆 🔒 아이콘 → 마이크 허용</div>
                </div>
              )}
            </div>
        </CardFooter>
      </Card>
    </div>
  );
};