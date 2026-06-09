/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  MessageSquare, 
  Mic, 
  Image as ImageIcon, 
  Send, 
  ArrowLeft, 
  Trash2, 
  CornerDownRight, 
  Clock, 
  Globe, 
  VolumeX, 
  Volume2, 
  Heart,
  ChevronRight,
  Share2,
  X,
  Plus,
  Settings,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Persona, ChatMessage, DreamRecord, AppStage } from './types';
import { 
  PERSONAS, 
  INSPIRE_IMAGES, 
  generateAIResponse, 
  getPersonaGreeting, 
  getCompanionInteractionLine,
  suggestAutomaticTitle, 
  getSavedDreams, 
  saveDreamToStorage, 
  deleteDreamFromStorage,
  seedDefaultHistoricalEntries
} from './utils';

import DreamNebulaUniverse from './components/DreamNebulaUniverse';

class GeminiClientError extends Error {
  constructor(
    message: string,
    public readonly errorType: 'api_key_missing' | 'gemini_request_failed' | 'network_error' | 'invalid_response' = 'gemini_request_failed',
    public readonly detail?: string
  ) {
    super(message);
    this.name = 'GeminiClientError';
  }
}

export default function App() {
  // --- STATES ---
  const [stage, setStage] = useState<AppStage>('HOME');
  const [selectedPersonaId, setSelectedPersonaId] = useState<'gentle' | 'poetic' | 'listener'>('gentle');
  const [interactionState, setInteractionState] = useState<'idle' | 'userListening' | 'userTyping' | 'aiThinking' | 'aiSpeaking' | 'done'>('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  
  // Custom Chat system states
  const [currentSessionMessages, setCurrentSessionMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  // Storage and Archive states
  const [savedDreams, setSavedDreams] = useState<DreamRecord[]>([]);
  const [selectedArchiveDream, setSelectedArchiveDream] = useState<DreamRecord | null>(null);
  
  // Interactive mock feature states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  // Save Dialog Form modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [customDreamTitle, setCustomDreamTitle] = useState('');
  const [isSavingAnimation, setIsSavingAnimation] = useState(false);

  // API settings modal states
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [apiTestStatus, setApiTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [apiTestMsg, setApiTestMsg] = useState('');

  // Companion interactive click/tap feedback
  const [clickCount, setClickCount] = useState(0);
  const [activePokeBubble, setActivePokeBubble] = useState<string | null>(null);
  const [pokeTimer, setPokeTimer] = useState<NodeJS.Timeout | null>(null);
  const [showManualKeyboardInput, setShowManualKeyboardInput] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);

  // Auto Scroll
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Background particles (glowing slow-orbit stardust points)
  const [stars, setStars] = useState<{ id: number; x: number; y: number; s: number; d: number }[]>([]);

  // Seed default items and initialize stars
  useEffect(() => {
    seedDefaultHistoricalEntries();
    setSavedDreams(getSavedDreams());
    
    // Generate star coordinates
    const generated = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      s: Math.random() * 3 + 1.2,
      d: Math.random() * 15 + 15
    }));
    setStars(generated);
  }, []);

  // Initialize Speech Recognition & Speech Synthesis Reset
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'zh-CN';

        rec.onresult = (event: any) => {
          let lastResult = event.results[event.results.length - 1];
          if (lastResult.isFinal) {
            const transcript = lastResult[0].transcript;
            if (transcript && transcript.trim()) {
              setInputText(prev => {
                const trimmed = prev.trim();
                return trimmed ? `${trimmed} ${transcript.trim()}` : transcript.trim();
              });
            }
          }
        };

        rec.onerror = (e: any) => {
          console.error('Speech recognition error', e);
        };

        recognitionRef.current = rec;
      } catch (err) {
        console.error('Failed to init speech recognition:', err);
      }
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (stage === 'CHAT_RECORD') {
      scrollToBottom();
    }
  }, [currentSessionMessages, isTyping, stage]);

  // Audio tone cue synthesizer (web audio)
  const playAmbientTone = (frequency: number, type: 'sine' | 'triangle' = 'sine', duration: number = 1.0, gainVal: number = 0.05) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      
      gainNode.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Ignored browser audio restriction
    }
  };

  // --- TRANSITIONS ---
  const handleStageChange = (newStage: AppStage) => {
    setStage(newStage);
    playAmbientTone(newStage === 'HOME' ? 220 : 330, 'sine', 0.8, 0.04);
  };

  // Start new recording flow
  const handleStartRecordingFlow = () => {
    const greetingText = getPersonaGreeting(selectedPersonaId);
    
    // Build initial chat message
    const initialMsg: ChatMessage = {
      id: 'greeting_ai',
      sender: 'ai',
      text: greetingText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setCurrentSessionMessages([initialMsg]);
    setAttachedImage(null);
    setInputText('');
    setStage('CHAT_RECORD');
    setShowFullHistory(false);
    playAmbientTone(440, 'sine', 1.2, 0.05);
  };

  // Complete persona selection and setup first AI message Greeting
  const handlePersonaSelected = () => {
    const greetingText = getPersonaGreeting(selectedPersonaId);
    
    // Build initial chat message
    const initialMsg: ChatMessage = {
      id: 'greeting_ai',
      sender: 'ai',
      text: greetingText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setCurrentSessionMessages([initialMsg]);
    setAttachedImage(null);
    setInputText('');
    setStage('CHAT_RECORD');
    playAmbientTone(440, 'sine', 1.2, 0.05);
  };

  // --- CHAT INTERACTION & SIMULATION ---
  const getPersonaSystemPrompt = (personaId: 'gentle' | 'poetic' | 'listener') => {
    const common = `你是一款名为《巡梦》的潜意识梦中绘卷手记应用的“筑梦伴眠者”AI。你的职责是帮助醒来的用户回忆、拼接并安全归档他们容易淡化蒸发的梦境断章。代表黑客松现场 Demo 展示。
请务必遵循以下回复规则：
1. 始终使用中文作答。
2. 回复语调必须极具梦境感、朦胧、治愈且富有共情，要像伴眠者在枕边轻轻低语。
3. **字数必须极其精炼**（控制在100字左右，绝对不要超过125字！由于在演示中你的话会被慢速朗读，文字太长会导致播放极度冗长，请首重精简扼要）。
4. **绝对不要使用任何 Markdown 符号**（例如 ** 粗体、项目符号-、# 标题等），不要用括号（如（微笑）或 [动作]）附加非语言描述。这些符号在语音合成中会被读出，体验很差，请完全用纯文学性文字或逗号、句号进行呼吸停顿。
5. 不要进行逻辑过载的客观解释，除非你是屿深。`;

    if (personaId === 'gentle') {
      return `${common}
你当前扮演的角色是「阿暖 Anuan」（温柔陪伴型梦境引导者）。性格特征：极致温柔、体贴入微、接住破碎。
常用治愈语言，如：“温热的水流、拥抱、暖光、乖、帮你折起来放进心底……”
对话时，要多从感官和心灵温度上安慰对方，陪伴他接住任何不安或失重，多用温柔的启发性提问。`;
    }
    if (personaId === 'poetic') {
      return `${common}
你当前扮演的角色是「暮歌 Muge」（文学意象梦境翻译师）。性格特征：沉静优雅、字带星华、富于诗歌隐喻。
常用文学艺术词句，如：“白夜、星纱、时间的羊皮卷、液态的蓝色、蝴蝶、露水……”
对话时，要帮对方把琐碎的梦境断简，翻译为极富电影胶片镜头感与诗意格调的段落，宛如编撰黑夜的歌谣。`;
    }
    return `${common}
你当前扮演的角色是「屿深 Yushen」（心理分析与自我觉察陪伴者）。性格特征：冷静自省、真切克制、注重感官指标。
常用理性心理学与自察学术语，如：“认知触点、变量、自我映射、反射波频、环境温差、光源定位……”
对话时，要客观冷静地梳理梦中标志物（冷热、光源、边界），引导用户从潜意识的角度找到自愈的信息归档。`;
  };

  const callGeminiAPI = async (
    sessionHistory: ChatMessage[],
    personaId: 'gentle' | 'poetic' | 'listener',
    attachedImageUrl: string | null
  ): Promise<string> => {
    const recentHist = sessionHistory.slice(-8).map(m => {
      let text = m.text;

      if (m.sender === 'user' && m.image) {
        const imgDesc = INSPIRE_IMAGES.find(img => img.url === m.image)?.description || '意象草图';
        text = `${text}\n[系统提示：用户当时上传了代表梦境潜意识的意象碎片图片，画面为：“${imgDesc}”]`;
      }

      if (m.sender === 'user' && attachedImageUrl && m === sessionHistory[sessionHistory.length - 1]) {
        const imgDesc = INSPIRE_IMAGES.find(img => img.url === attachedImageUrl)?.description || '意象草图';
        text += `\n[系统提示：用户当前正载入了一件视觉潜意识标本图斑，画面描述为：“${imgDesc}”。请你像看到它一样温柔提及：'我看见了这个画面。它像是这场梦里的一个视觉锚点……' 并且以此意境进行文学/共情层面的梦境拼接！]`;
      }

      return {
        sender: m.sender,
        text,
      };
    });

    try {
      const response = await fetch('/.netlify/functions/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: recentHist[recentHist.length - 1]?.text || '',
          currentCompanion: personaId,
          conversationHistory: recentHist,
          systemInstruction: getPersonaSystemPrompt(personaId),
        }),
      });

      let payload: any = null;
      try {
        payload = await response.json();
      } catch (parseErr) {
        throw new GeminiClientError('Gemini 返回结构异常。', 'invalid_response', String(parseErr));
      }

      if (!response.ok) {
        const type = payload?.errorType || 'gemini_request_failed';
        const message = payload?.message || payload?.error || 'Gemini 请求失败。';
        throw new GeminiClientError(message, type, payload?.detail);
      }

      if (!payload || typeof payload.reply !== 'string' || !payload.reply.trim()) {
        throw new GeminiClientError('Gemini 返回结构异常。', 'invalid_response', JSON.stringify(payload));
      }

      return payload.reply.trim();
    } catch (err) {
      if (err instanceof GeminiClientError) {
        throw err;
      }
      throw new GeminiClientError('网络错误，无法连接到 Gemini 代理函数。', 'network_error', String(err));
    }
  };

  // --- API KEY CONFIG & TESTERS ---
  const handleTestConnection = async () => {
    setApiTestStatus('testing');
    setApiTestMsg('正在测试连接……');
    try {
      const response = await fetch('/.netlify/functions/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: '请只回复：巡梦 API 已连接。',
          currentCompanion: selectedPersonaId,
          conversationHistory: [{ sender: 'user', text: '请只回复：巡梦 API 已连接。' }],
          systemInstruction: '请只回复：巡梦 API 已连接。',
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new GeminiClientError(
          payload?.message || 'Gemini 请求失败。',
          payload?.errorType || 'gemini_request_failed',
          payload?.detail
        );
      }

      if (payload && typeof payload.reply === 'string' && payload.reply.trim()) {
        setApiTestStatus('success');
        setApiTestMsg(`连接成功：${payload.reply.trim()}`);
      } else {
        throw new GeminiClientError('返回结构异常：未收到有效 reply。', 'invalid_response', JSON.stringify(payload));
      }
    } catch (err: any) {
      console.error('Gemini API test connection failed:', err);
      setApiTestStatus('error');
      setApiTestMsg(err?.message || '连接失败，请检查 Netlify 环境变量或网络。');
    }
  };

  const handleSaveApiKey = () => {
    setApiTestStatus('idle');
    setApiTestMsg('请在 Netlify 环境变量中配置 GEMINI_API_KEY，前端不会保存真实 Key。');
  };

  const handleClearApiKey = () => {
    setTempApiKey('');
    setApiTestStatus('idle');
    setApiTestMsg('本地输入已清空。真实 Key 只应在 Netlify 环境变量中管理。');
  };

  const handleSendMessage = async (textToSend?: string, isAudioMsg: boolean = false, audioSecs: number = 0, customImg: string | null = null) => {
    const text = textToSend !== undefined ? textToSend : inputText;
    const finalImage = customImg || attachedImage;
    
    if (!text.trim() && !finalImage && !isAudioMsg) return;

    // CANCEL active reading
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // Build user message
    const userMsg: ChatMessage = {
      id: 'user_' + Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: text.trim() || (isAudioMsg ? `🎙️ 梦境碎片语音 (${audioSecs}秒)` : '🎨 带来了梦中模糊的视觉碎片'),
      image: finalImage || undefined,
      isAudio: isAudioMsg,
      audioDuration: isAudioMsg ? audioSecs : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Append user message
    const nextMessages = [...currentSessionMessages, userMsg];
    setCurrentSessionMessages(nextMessages);
    setInputText('');
    setAttachedImage(null);
    setShowImagePicker(false);
    
    playAmbientTone(520, 'sine', 0.5, 0.03);

    // Transitions state: aiThinking
    setIsTyping(true);
    setInteractionState('aiThinking');
    
    let simulatedText = '';
    const userMsgCount = nextMessages.filter(m => m.sender === 'user').length;

    try {
      // 1. Try to call Google Gemini API Live
      simulatedText = await callGeminiAPI(nextMessages, selectedPersonaId, finalImage);
    } catch (err: any) {
      console.error('Gemini API call failed, falling back to mock response:', err);
      
      // Show notification
      setVoiceError(`${err?.message || 'Gemini 请求失败。'} 已切换为 Demo 模拟回复。`);
      setTimeout(() => setVoiceError(null), 4000);

      // Gentle fallback / mock
      simulatedText = `我刚刚好像在梦的边缘短暂失联了。你可以再说一次，或者先把这个碎片留在这里。（API 调用失败，已切换为 Demo 模拟回复）`;
    }

    // Prepare typing message
    setIsTyping(false);
    const aiMessageId = 'ai_' + Math.random().toString(36).substring(2, 9);
    const aiMsgPlaceholder: ChatMessage = {
      id: aiMessageId,
      sender: 'ai',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setCurrentSessionMessages(prev => [...prev, aiMsgPlaceholder]);
    setInteractionState('aiSpeaking');

    // Typewriter state tracking
    let charIndex = 0;
    const typingSpeed = 45; // 45ms per char feels beautifully gentle & human
    
    const typingInterval = setInterval(() => {
      if (charIndex <= simulatedText.length) {
        const typed = simulatedText.slice(0, charIndex);
        setCurrentSessionMessages(prev => 
          prev.map(m => m.id === aiMessageId ? { ...m, text: typed } : m)
        );
        charIndex++;
      } else {
        clearInterval(typingInterval);
        setInteractionState('done');
        setTimeout(() => setInteractionState('idle'), 1500);
      }
    }, typingSpeed);

    // Voices synthesizer speech output
    const playVoiceSynthesis = () => {
      if (!window.speechSynthesis) {
        // Fallback timer simulation if speech is unsupported
        setTimeout(() => {
          setInteractionState('done');
          setTimeout(() => setInteractionState('idle'), 1500);
        }, Math.max(2500, simulatedText.length * 100));
        return;
      }

      // Read clean text of parenthetical narratives so it sounds perfectly natural
      const cleanedVoiceText = simulatedText
        .replace(/（[^）]*）/g, '')
        .replace(/\(([^)]*)\)/g, '')
        .replace(/[✦☾☀*#•🎙️]/g, '')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanedVoiceText);
      utterance.volume = 1.0;
      
      // Speeds: rate: 0.88 to 0.95, slower (0.76) for poetic (暮歌)
      utterance.rate = selectedPersonaId === 'poetic' ? 0.78 : selectedPersonaId === 'listener' ? 0.92 : 0.86;
      // Pitch: 0.65 to 0.85
      utterance.pitch = selectedPersonaId === 'gentle' ? 0.82 : selectedPersonaId === 'poetic' ? 0.66 : 0.72;

      // Select Chinese voice
      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find(v => v.lang.includes('zh') || v.lang.includes('ZH') || v.lang.includes('cn') || v.lang.includes('CN'));
      if (zhVoice) {
        utterance.voice = zhVoice;
      }

      utterance.onend = () => {
        setInteractionState('done');
        setTimeout(() => setInteractionState('idle'), 1500);
      };

      utterance.onerror = (e) => {
        console.error('TTS utterance failed:', e);
        setInteractionState('done');
        setTimeout(() => setInteractionState('idle'), 1500);
      };

      if (soundEnabled) {
        window.speechSynthesis.speak(utterance);
      } else {
        // Simulating duration since muted
        setTimeout(() => {
          setInteractionState('done');
          setTimeout(() => setInteractionState('idle'), 1500);
        }, Math.max(3000, simulatedText.length * 80));
      }
    };

    // Play chime first
    playAmbientTone(selectedPersonaId === 'gentle' ? 392 : selectedPersonaId === 'poetic' ? 494 : 587, 'sine', 1.2, 0.05);

    // Trigger synthesis reading
    playVoiceSynthesis();
  };

  // Trigger quick interactive buttons to append specific predefined fragments
  const handleQuickInput = (sampleText: string) => {
    setInputText(sampleText);
    playAmbientTone(300, 'sine', 0.2);
  };

  // Quick select dream images
  const selectInspireImage = (url: string) => {
    setAttachedImage(url);
    setShowImagePicker(false);
    playAmbientTone(440, 'sine', 0.3);
  };

  // Click/Poke handle for active Companion Orb
  const handlePokeCompanion = () => {
    const nextIndex = clickCount;
    setClickCount(prev => prev + 1);
    const line = getCompanionInteractionLine(selectedPersonaId, nextIndex);
    setActivePokeBubble(line);
    
    // Ambient sound depending on selected persona
    const soundPitch = selectedPersonaId === 'gentle' ? 523.25 : selectedPersonaId === 'poetic' ? 587.33 : 659.25; // beautiful chord C5, D5, E5
    playAmbientTone(soundPitch, 'sine', 1.0, 0.08);

    if (pokeTimer) {
      clearTimeout(pokeTimer);
    }
    const t = setTimeout(() => {
      setActivePokeBubble(null);
    }, 4500);
    setPokeTimer(t);
  };

  // AUDIO RECORDING & SPEECH RECOGNITION
  const handleToggleVoiceInput = () => {
    // If we are currently recording: stop it
    if (isRecording) {
      setIsRecording(false);
      setInteractionState('idle');
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error('Stop recognition error:', err);
        }
      }

      const spokenText = inputText.trim();
      
      // If we spoke nothing (or Speech API didn't pick up anything), fill in a beautiful poetic fallback
      if (!spokenText) {
        const mockTranscriptions = [
          "我梦见自己一直在一座高空的迷宫里奔跑，跑得很快，但脚下没有声音，只有一层灰白色的冷雾。",
          "那里有一扇红色的铁质大门，铜绿斑驳，摸上去非常冰凉。我手里捏着一串没有齿轮的钥匙。",
          "我梦见四周像深海一样安静，我的小猫居然可以像鸟儿一样在头顶缓慢游过，吐出粉红色的泡泡。",
          "醒来只想得起那种感觉——很失重，又像是在某个极度潮湿沉寂的世界里往下落。四周是无声的交谈。"
        ];
        const selectedSpeech = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
        setInputText(selectedSpeech);
        handleSendMessage(selectedSpeech, true, recordingSeconds);
      } else {
        handleSendMessage(spokenText, true, recordingSeconds);
      }
      setRecordingSeconds(0);
    } else {
      // Start voice recording
      // Check if browser supports SpeechRecognition
      const isVoiceSupported = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
      
      if (!isVoiceSupported) {
        // Show beautiful floating alert
        setVoiceError('当前浏览器暂不支持语音输入，系统将为您启动模拟梦呓通道。');
        setTimeout(() => setVoiceError(null), 4000);
      }

      // Initialize recording counters
      setIsRecording(true);
      setInteractionState('userListening');
      setRecordingSeconds(0);
      playAmbientTone(600, 'sine', 0.5, 0.08);

      // Start actual listening if supported
      if (isVoiceSupported && recognitionRef.current) {
        try {
          // Clear text box for fresh spoken inputs
          setInputText('');
          recognitionRef.current.start();
        } catch (err) {
          console.warn('SpeechRecognition failed to start. Falling back to stream:', err);
        }
      }

      // Start secondary transcription timers
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= 25) {
            // Auto timeout stop and send
            clearInterval(recordingTimerRef.current!);
            
            // Auto trigger toggle to stop and send
            setIsRecording(false);
            setInteractionState('idle');
            if (recognitionRef.current) {
              try { recognitionRef.current.stop(); } catch {}
            }

            // Deliver
            setInputText(prevText => {
              const textToSend = prevText.trim() || "在虚空的水流里沉没，听见风吹落松针的声音。";
              handleSendMessage(textToSend, true, 25);
              return textToSend;
            });

            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  // --- SAVE OPERATION ---
  const handleTriggerSave = () => {
    // Generate suggested title based on current chat history
    const guessedTitle = suggestAutomaticTitle(currentSessionMessages);
    setCustomDreamTitle(guessedTitle);
    setShowSaveModal(true);
    playAmbientTone(350, 'sine', 0.5);
  };

  const handleConfirmSave = () => {
    if (!customDreamTitle.trim()) return;

    setIsSavingAnimation(true);
    playAmbientTone(250, 'triangle', 0.5, 0.1);

    setTimeout(() => {
      // Create permanent Record
      const userTxt = currentSessionMessages.filter(m => m.sender === 'user').map(m => m.text).join('；');
      const textToSummarize = userTxt.length > 50 ? userTxt.substring(0, 50) + '...' : userTxt || '记录了散装梦境碎片的低声回响。';
      
      // Find the last AI answer to present as summary
      const aiReplies = currentSessionMessages.filter(m => m.sender === 'ai');
      const lastAiMessage = aiReplies[aiReplies.length - 1]?.text || '无声的空隙。';
      const summaryText = lastAiMessage.length > 100 ? lastAiMessage.substring(0, 100) + '...' : lastAiMessage;

      const newRecord: DreamRecord = {
        id: 'dream_' + Math.random().toString(36).substring(2, 9),
        title: customDreamTitle,
        date: new Date().toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        personaId: selectedPersonaId,
        chatHistory: currentSessionMessages,
        summary: summaryText
      };

      const updatedHistory = saveDreamToStorage(newRecord);
      setSavedDreams(updatedHistory);
      
      // Reset flow
      setIsSavingAnimation(false);
      setShowSaveModal(false);
      
      // Go directly to Archive list (巡梦记忆馆)
      setSelectedArchiveDream(newRecord);
      setStage('DREAM_LIST');
      
      playAmbientTone(880, 'sine', 1.5, 0.08); // high crystalline tone for success
    }, 1500); // Dramatic saving pause
  };

  const handleDeleteArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确认要把这页梦境记忆彻底格式化、归还于虚无中吗？')) {
      const updated = deleteDreamFromStorage(id);
      setSavedDreams(updated);
      playAmbientTone(150, 'sine', 1.0, 0.07);
    }
  };

  const loadToResumeDialogue = (archive: DreamRecord) => {
    // Inject archive state back to dialogue room to allow continuation or continuation of conversation
    setSelectedPersonaId(archive.personaId);
    setCurrentSessionMessages(archive.chatHistory);
    setAttachedImage(null);
    setInputText('');
    setStage('CHAT_RECORD');
    playAmbientTone(440, 'sine', 0.8, 0.04);
  };

  // Toggle meditaion soft hum status
  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    if (nextVal) {
      // Play brief test sound
      setTimeout(() => playAmbientTone(350, 'sine', 1.5, 0.1), 100);
    }
  };

  // --- RENDERING CONSTANTS & LOCS ---
  const currentPersonaData = PERSONAS.find(p => p.id === selectedPersonaId) || PERSONAS[0];

  return (
    <div 
      className="min-h-screen relative flex flex-col justify-between text-gray-200 font-sans select-none overflow-x-hidden antialiased selection:bg-purple-900 selection:text-purple-200"
      style={{
        background: 'radial-gradient(circle at 50% 30%, #0c081f 0%, #05040a 100%)'
      }}
    >
      
      {/* STATIC BACKGROUND DUST CHIP */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Breathing ambient purple energy spheres */}
        <div className="absolute top-[10%] left-[50%] -translate-x-1/2 w-[60vw] h-[60vw] rounded-full bg-indigo-500/[0.03] filter blur-[120px] animate-pulse"></div>
        <div className="absolute top-[60%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-purple-500/[0.03] filter blur-[100px] animate-pulse [animation-duration:9s]"></div>
        
        {/* Micro particles */}
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-purple-200/30"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.s}px`,
              height: `${star.s}px`,
              opacity: (star.s / 4) * 0.4,
              animationName: 'pulse',
              animationDuration: '5s',
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDelay: `${star.id % 4}s`
            }}
          />
        ))}
      </div>

      {/* MINIMAL NAVIGATION HEADER */}
      <nav className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-white/[0.04] backdrop-blur-md bg-[#05040a]/40">
        <div 
          onClick={() => handleStageChange('HOME')}
          className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-800 to-indigo-950 border border-purple-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(138,99,255,0.2)]">
            <Sparkles className="w-4 h-4 text-purple-200" />
          </div>
          <div>
            <h1 className="font-serif text-base tracking-[0.2em] font-semibold text-white">巡梦</h1>
            <p className="text-[9px] font-mono tracking-widest text-indigo-400/50 uppercase">Dream Diary</p>
          </div>
        </div>

        {/* Header Right Menu items */}
        <div className="flex items-center space-x-4">
          
          {/* Poetic Hum audio option */}
          <button
            onClick={handleToggleSound}
            className={`p-2 rounded-lg border transition-all duration-300 flex items-center space-x-1 cursor-pointer text-xs ${
              soundEnabled
                ? 'bg-purple-950/40 border-purple-500/30 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                : 'bg-white/[0.02] border-white/5 text-gray-500 hover:text-gray-300'
            }`}
            title={soundEnabled ? '音效已关' : '音效已开'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-wider">Hum On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-wider">Silent</span>
              </>
            )}
          </button>

          {/* API Setup Button */}
          <button
            onClick={() => {
              setTempApiKey('');
              setApiTestStatus('idle');
              setApiTestMsg('');
              setShowApiKeyModal(true);
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-serif transition-all flex items-center space-x-1.5 cursor-pointer ${
              apiTestStatus === 'success'
                ? 'bg-purple-950/40 border-purple-500/30 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.15)] hover:bg-purple-900/40'
                : 'bg-purple-950/20 border-purple-900/30 text-purple-300 hover:bg-purple-950/30'
            }`}
            title="测试 Gemini API"
          >
            <Settings className="w-3.5 h-3.5 text-purple-400" />
            <span>API 设置</span>
            {apiTestStatus === 'success' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            )}
          </button>

          {/* Gallery button */}
          <button
            onClick={() => handleStageChange('DREAM_LIST')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-serif transition-all flex items-center space-x-1.5 cursor-pointer ${
              stage === 'DREAM_LIST' || stage === 'DREAM_DETAIL'
                ? 'bg-purple-950/40 border-purple-400/30 text-purple-200'
                : 'bg-white/[0.02] border-white/5 text-gray-400 hover:border-indigo-500/20 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>巡梦记忆馆</span>
          </button>
        </div>
      </nav>

      {/* CORE DISPLAY PAGES CONTAINER */}
      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 py-8 md:py-12 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          
          {/* 1) LANDING PAGE */}
          {stage === 'HOME' && (
            <motion.div
              key="landing_page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-10 py-6 max-w-2xl mx-auto"
            >
              <div className="relative inline-block">
                {/* Minimalist pulsing light ring */}
                <div className="absolute inset-0 rounded-full bg-purple-600/10 blur-xl animate-pulse"></div>
                
                {/* Centered slow rotating mystic crystal sphere */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-purple-500/25 bg-[#0e081f] flex items-center justify-center shadow-[0_0_25px_rgba(138,99,255,0.15)] cursor-pointer"
                  onClick={() => playAmbientTone(293.66, 'sine', 2.0, 0.08)}
                >
                  <Sparkles className="w-7 h-7 text-purple-300 animate-pulse" />
                </motion.div>
              </div>

              <div className="space-y-4">
                <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-indigo-400/80">
                  ✦ 会接住散装梦境的日记本 ✦
                </span>
                
                <h2 className="font-serif text-3xl md:text-5xl font-light text-white tracking-[0.2em] font-normal pl-3">
                  巡梦
                </h2>
                
                <div className="max-w-md mx-auto space-y-2.5">
                  <p className="font-serif text-indigo-100/90 text-sm md:text-base leading-relaxed">
                    “醒来后，只记得几个碎片也没关系。”
                  </p>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-serif max-w-xs mx-auto">
                    把没说完的梦，轻轻接住。AI 陪你把模糊的意象整理成可回看的记忆卡。
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto pt-4">
                <button
                  onClick={handleStartRecordingFlow}
                  className="w-full px-6 py-3 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-100 font-serif text-sm tracking-widest shadow-[0_4px_25px_rgba(168,85,247,0.15)] hover:shadow-[0_4px_30px_rgba(168,85,247,0.25)] transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <span>记录今晨碎片</span>
                  <ChevronRight className="w-4 h-4 text-purple-400" />
                </button>

                <button
                  onClick={() => handleStageChange('DREAM_LIST')}
                  className="w-full px-6 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-gray-400 hover:text-white font-serif text-sm tracking-widest transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>查看梦境记忆馆</span>
                </button>
              </div>

              <div className="pt-6 font-mono text-[9px] text-gray-600 tracking-wider">
                NO COMPLEX CHARTS • NO DATA CLUTTER • ONLY SOUND REVERB & PURE GENTLE CHATS
              </div>
            </motion.div>
          )}



          {/* 3) CORE RECORDING INTERACTIVE CHAT ROOM */}
          {stage === 'CHAT_RECORD' && (
            <motion.div
              key="chat_stage"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              className="w-full max-w-2xl min-h-[75vh] flex flex-col justify-between bg-transparent relative"
            >
              {/* Dynamic inline styles for spectacular celestial breathing & wave ripple feedback */}
              <style>{`
                @keyframes orbital-float {
                  0%, 100% { transform: translateY(0px); }
                  50% { transform: translateY(-10px); }
                }
                @keyframes gentle-breath {
                  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(245,158,11,0.2)); }
                  50% { transform: scale(1.05); filter: drop-shadow(0 0 35px rgba(245,158,11,0.4)); }
                }
                @keyframes poetic-orbit {
                  0%, 100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 20px rgba(168,85,247,0.3)); }
                  50% { transform: scale(1.04) rotate(180deg); filter: drop-shadow(0 0 40px rgba(236,72,153,0.5)); }
                }
                @keyframes analyst-crystal {
                  0%, 100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 15px rgba(34,211,238,0.3)); }
                  50% { transform: scale(1.02) rotate(90deg); filter: drop-shadow(0 0 30px rgba(99,102,241,0.5)); }
                }
                @keyframes ripple-wave {
                  0% { transform: scale(0.9); opacity: 0.8; }
                  100% { transform: scale(1.6); opacity: 0; }
                }
                @keyframes wave-bounce {
                  0%, 100% { height: 4px; transform: scaleY(1); }
                  50% { height: 26px; transform: scaleY(1.3); }
                }
                @keyframes text-fade-in {
                  0% { opacity: 0; transform: translateY(8px); }
                  100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes particle-drift {
                  0% { transform: translateY(0px) translateX(0px); opacity: 0; }
                  50% { opacity: 0.8; }
                  100% { transform: translateY(-40px) translateX(10px); opacity: 0; }
                }
                .orb-glow-active {
                  animation: orbital-float 4s ease-in-out infinite;
                }
                .wave-line-bar {
                  animation: wave-bounce 1.2s ease-in-out infinite;
                }
              `}</style>

              {/* RECORDING HEADER: Back, Quick switcher and Save button */}
              <div className="px-4 py-3 border-b border-white/[0.03] bg-black/40 backdrop-blur-md rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 z-20">
                
                {/* Back Node */}
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      if (confirm('确认回到首页并重置本次梦境碎片记录吗？')) {
                        handleStageChange('HOME');
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors cursor-pointer"
                    title="回到首页"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  
                  {/* Status label representing focus */}
                  <div className="text-left">
                    <span className="text-[10px] font-mono tracking-[0.15em] text-indigo-400 uppercase leading-none block">Dream Space</span>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <h4 className="text-xs font-serif text-white opacity-90 leading-none">巡梦进行中</h4>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-mono scale-95 origin-left border ${
                        apiTestStatus === 'success'
                          ? 'bg-[#091a14] text-emerald-400 border-emerald-950'
                          : 'bg-[#1a1409] text-yellow-500 border-yellow-950'
                      }`}>
                        <span className={`w-1 h-1 rounded-full mr-1 ${
                          apiTestStatus === 'success' ? 'bg-emerald-400' : 'bg-yellow-400 animate-pulse'
                        }`} />
                        {apiTestStatus === 'success' ? 'Gemini 已连接' : 'Gemini 待测试'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* MIDDLE CHANNELS: HORIZONTAL COMPANION SWITCHER (SWAP ANYTIME!) */}
                <div className="flex items-center space-x-1.5 bg-[#0a0715]/90 py-1.5 px-3 rounded-full border border-white/[0.06] shadow-lg">
                  {PERSONAS.map((p) => {
                    const isSelected = selectedPersonaId === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          if (selectedPersonaId === p.id) return;
                          setSelectedPersonaId(p.id);
                          playAmbientTone(p.id === 'gentle' ? 392 : p.id === 'poetic' ? 494 : 587, 'sine', 0.8, 0.05);
                          
                          // Transition handover greetings block
                          const handoverNotes = {
                            gentle: '（阿暖轻抚着你的额头，鹅黄暖意晕开）“我在呢，昨夜的梦是不是有些冷？慢点讲，我会替你一网兜住。”',
                            poetic: '（暮歌的手指挥洒开一层幽蓝星尘）“黑夜遗留下冰凉 of 露水，我已备好了羊皮卷，为你记录未消逝的意象。落笔吧。”',
                            listener: '（屿深的指示白光微弱亮起）“巡梦归档信道已接通。记录缓冲区重置完毕，请讲出本次感官标点。”'
                          };
                          
                          // Inject companion transition message to conversation log
                          setCurrentSessionMessages(prev => [
                            ...prev,
                            {
                              id: 'switch_' + Math.random().toString(36).substring(2, 9),
                              sender: 'ai',
                              text: handoverNotes[p.id],
                              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            }
                          ]);
                          
                          // Reset click reactions
                          setActivePokeBubble(null);
                        }}
                        className={`flex items-center space-x-1 py-1 px-3.5 rounded-full text-[10px] font-serif transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? 'bg-purple-950/80 text-purple-200 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                            : 'text-gray-500 hover:text-gray-350 hover:bg-white/[0.02]'
                        }`}
                      >
                        <span className="text-[11px] font-mono">{p.avatarIcon}</span>
                        <span>{p.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Exit Save Button */}
                <button
                  onClick={handleTriggerSave}
                  disabled={currentSessionMessages.length < 2}
                  className={`px-3 py-1.5 rounded-lg border text-[11px] font-serif tracking-wide transition-all duration-500 flex items-center space-x-1 cursor-pointer ${
                    currentSessionMessages.length >= 2
                      ? 'bg-purple-950/50 border-purple-400/40 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:bg-purple-900/40'
                      : 'bg-white/[0.01] border-white/5 text-gray-700 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>保存梦手账</span>
                </button>
              </div>

              {/* CORE DYNAMIC COMPANION PRESENCE ORB (Tap Zone & Wave Canvas) */}
              <div className="relative flex-1 flex flex-col items-center justify-center py-8 px-4 space-y-6">
                
                {/* Visual Glow Clouds specifically behind the companion */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0">
                  <div className={`absolute w-80 h-80 rounded-full bg-gradient-to-tr ${currentPersonaData.glowColor} opacity-20 filter blur-[70px] transition-all duration-1000 animate-pulse`}></div>
                </div>

                {/* INTERACTIVE FLOATING MESSAGE BALLOON (Spoken Proactively upon clicking / poking) */}
                <AnimatePresence>
                  {activePokeBubble && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute top-[5%] md:top-[8%] z-30 max-w-sm px-4 py-3 rounded-2xl bg-[#080512]/95 border border-purple-500/35 text-xs text-gray-200 shadow-[0_10px_25px_rgba(0,0,0,0.8)] font-serif leading-relaxed text-left relative"
                    >
                      {/* Triangle tail */}
                      <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#080512] border-r border-b border-purple-500/35 rotate-45"></div>
                      <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-purple-400 font-mono tracking-wider uppercase">
                        <span>{currentPersonaData.avatarIcon}</span>
                        <span>{currentPersonaData.name} • 悄声耳语</span>
                      </div>
                      <p>{activePokeBubble}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* GORGEOUS ABSTRACT INTUITIVE COMPANION SPIRIT CORE (DYNAMIC CHARACTER) */}
                <div className="relative z-10 flex flex-col items-center select-none pt-2">
                  <div className="absolute inset-0 rounded-full bg-purple-500/5 animate-ping [animation-duration:3s] pointer-events-none"></div>

                  <div className="orb-glow-active">
                    <AnimatePresence mode="wait">
                      {selectedPersonaId === 'gentle' ? (
                        <motion.div
                          key="gentle_companion"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="relative w-36 h-36 flex items-center justify-center cursor-pointer group"
                          onClick={handlePokeCompanion}
                        >
                          {/* Warm golden breathing solar cloud */}
                          <div className="absolute w-32 h-32 rounded-full bg-gradient-to-tr from-amber-500/30 to-pink-500/20 blur-md animate-[gentle-breath_5s_ease-in-out_infinite]" />
                          <div className="absolute w-28 h-28 rounded-full border border-amber-500/20 bg-yellow-950/20 mix-blend-screen flex items-center justify-center animate-[spin_25s_linear_infinite]" />
                          
                          {/* Sun core */}
                          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-300 to-amber-500 flex items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.55)] border border-amber-200/30 z-10 hover:scale-105 transition-transform" >
                            <span className="text-2xl text-amber-950 font-serif font-bold filter drop-shadow-[0_1px_2px_rgba(255,255,255,0.4)]">✦</span>
                          </div>

                          {/* Orbiting star dust spots */}
                          <div className="absolute w-2 h-2 bg-amber-200 rounded-full blur-[1px] animate-[particle-drift_3.2s_ease-in-out_infinite] top-[15%] left-[20%]" />
                          <div className="absolute w-1.5 h-1.5 bg-pink-200 rounded-full blur-[1px] animate-[particle-drift_4.2s_ease-in-out_infinite_1s] bottom-[15%] right-[20%]" />
                          
                          <div className="absolute bottom-[-14px] text-[8px] tracking-wider text-amber-400/60 font-mono scale-90 opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold">
                            Touch / 碰一碰
                          </div>
                        </motion.div>
                      ) : selectedPersonaId === 'poetic' ? (
                        <motion.div
                          key="poetic_companion"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="relative w-36 h-36 flex items-center justify-center cursor-pointer group"
                          onClick={handlePokeCompanion}
                        >
                          {/* Poetic lavender/fuchsia galaxy nebula */}
                          <div className="absolute w-32 h-32 rounded-full bg-gradient-to-tr from-purple-600/35 via-fuchsia-500/10 to-indigo-800/40 blur-md animate-[poetic-orbit_6s_ease-in-out_infinite]" />
                          <div className="absolute w-28 h-28 rounded-full border border-fuchsia-500/25 bg-purple-950/20 mix-blend-screen flex items-center justify-center animate-[spin_18s_linear_infinite_reverse]" />
                          
                          {/* Crescent core */}
                          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-400 to-indigo-600 flex items-center justify-center shadow-[0_0_35px_rgba(168,85,247,0.6)] border border-purple-300/30 z-10 hover:scale-105 transition-transform" >
                            <span className="text-2xl text-purple-100 font-serif font-bold filter drop-shadow-[0_1px_2px_rgba(168,85,247,0.5)]">☾</span>
                          </div>

                          {/* Poetic stardust dots */}
                          <div className="absolute w-1.5 h-1.5 bg-fuchsia-300 rounded-full blur-[0.5px] animate-[particle-drift_2.8s_ease-in-out_infinite_0.5s] top-[22%] right-[18%]" />
                          <div className="absolute w-2 h-2 bg-purple-300 rounded-full blur-[1px] animate-[particle-drift_3.8s_ease-in-out_infinite_2s] bottom-[22%] left-[18%]" />
                          
                          <div className="absolute bottom-[-14px] text-[8px] tracking-wider text-purple-300/60 font-mono scale-90 opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold">
                            Touch / 碰一碰
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="listener_companion"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="relative w-36 h-36 flex items-center justify-center cursor-pointer group"
                          onClick={handlePokeCompanion}
                        >
                          {/* Analytical crystalline signal grid */}
                          <div className="absolute w-32 h-32 rounded-full bg-gradient-to-tr from-cyan-500/25 via-indigo-500/15 to-purple-600/20 blur-md animate-[analyst-crystal_8s_ease-in-out_infinite]" />
                          <div className="absolute w-26 h-26 rounded-full border border-dashed border-cyan-400/20 animate-[spin_30s_linear_infinite]" />
                          <div className="absolute w-28 h-28 rounded-full border border-cyan-500/10" />
                          
                          {/* Diamond core */}
                          <div className="w-16 h-16 rotate-45 bg-gradient-to-tr from-cyan-400 to-indigo-500/90 flex items-center justify-center shadow-[0_0_35px_rgba(34,211,238,0.6)] border border-cyan-300/30 z-10 hover:scale-105 transition-transform" >
                            <span className="-rotate-45 text-xl font-bold text-indigo-950 font-serif">☀</span>
                          </div>

                          {/* Precise light beams */}
                          <div className="absolute w-1.5 h-1.5 bg-cyan-305 animate-[particle-drift_3s_ease-in-out_infinite] top-[28%] left-[14%]" />
                          <div className="absolute w-2 h-2 bg-indigo-305 animate-[particle-drift_4.5s_ease-in-out_infinite_1.5s] bottom-[28%] right-[14%]" />
                          
                          <div className="absolute bottom-[-14px] text-[8px] tracking-wider text-cyan-400/60 font-mono scale-90 opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold">
                            Touch / 碰一碰
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* COMPANION STATUS LABEL SUMMARY */}
                <div className="text-center space-y-1 relative z-10">
                  <div className="text-xs font-serif text-white/95 font-medium flex items-center justify-center space-x-1.5">
                    <span>{currentPersonaData.name}</span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                  </div>
                  <p className="text-[10px] text-indigo-400/70 font-serif italic">
                    {interactionState === 'aiThinking' 
                      ? '“正在整理梦境碎片……”'
                      : interactionState === 'aiSpeaking'
                      ? '“正在向你诉说潜意识的解剖面……”'
                      : selectedPersonaId === 'gentle' 
                      ? '“正在静静聆听风吹松针的温度”' 
                      : selectedPersonaId === 'poetic' 
                      ? '“正在研磨白夜溢出的深紫色墨汁”' 
                      : '“正在客观校准你的心智记录终端”'}
                  </p>
                </div>

                {/* CONCISE DIALOGUE CARD STREAM (DOWNSCALED LOG) */}
                {/* DYNAMIC SPEAKING FEEDBACK EQUALIZER WAVES */}
                <div className="flex items-center justify-center space-x-[3.5px] h-6 select-none opacity-85 pt-1 z-10 animate-fade-in">
                  {Array.from({ length: 15 }).map((_, rIdx) => {
                    const isSpeaking = interactionState === 'aiSpeaking';
                    const animDelay = (rIdx % 5) * 0.15;
                    return (
                      <div
                        key={rIdx}
                        className={`w-[3px] rounded-full transition-all duration-300 ${
                          selectedPersonaId === 'gentle' 
                            ? 'bg-gradient-to-t from-amber-400 to-pink-400' 
                            : selectedPersonaId === 'poetic' 
                            ? 'bg-gradient-to-t from-purple-500 to-fuchsia-400' 
                            : 'bg-gradient-to-t from-cyan-400 to-indigo-400'
                        }`}
                        style={{
                          animationName: 'wave-bounce',
                          animationDuration: isSpeaking ? '0.8s' : '2.4s',
                          animationTimingFunction: 'ease-in-out',
                          animationIterationCount: 'infinite',
                          animationDelay: `${animDelay}s`,
                          height: isSpeaking ? '24px' : '4px'
                        }}
                      />
                    );
                  })}
                </div>

                {/* ACTIVE NARRATIVE DIALOGUE FLUID SCREEN (POETIC SINGLE CARD) */}
                <div className="w-full max-w-lg mx-auto z-10 space-y-3">
                  {/* Faded user whisper echo */}
                  {currentSessionMessages.length > 1 && (
                    <div className="text-[11px] text-gray-500 font-serif italic text-center max-w-sm mx-auto animate-[text-fade-in_0.6s_ease-out] truncate select-none">
                      “ {[...currentSessionMessages].reverse().find(m => m.sender === 'user')?.text || '梦境开始下沉...'} ”
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    {isTyping ? (
                      <motion.div 
                        key="typing"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="p-5 rounded-2xl bg-[#090615]/40 border border-white/[0.04] text-center text-[11px] text-purple-300 font-serif italic tracking-wider flex items-center justify-center space-x-1 shadow-inner backdrop-blur-sm"
                      >
                        <span>{currentPersonaData.name} 正在接住你的梦碎...</span>
                        <span className="inline-flex space-x-0.5">
                          <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1 h-1 rounded-full bg-purple-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      </motion.div>
                    ) : currentSessionMessages.length > 0 ? (
                      (() => {
                        const lastAiMsg = [...currentSessionMessages].reverse().find(m => m.sender === 'ai') || currentSessionMessages[0];
                        return (
                          <motion.div
                            key={lastAiMsg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="p-5 md:p-6 rounded-2xl bg-[#080514]/75 border border-white/[0.05] text-center space-y-3 shadow-[0_12px_35px_rgba(0,0,0,0.6)] backdrop-blur-md relative overflow-hidden"
                          >
                            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
                            
                            {lastAiMsg.image && (
                              <div className="max-w-[200px] mx-auto overflow-hidden rounded-xl border border-white/5 shadow-md mb-2">
                                <img 
                                  src={lastAiMsg.image} 
                                  alt="Sketch sketch" 
                                  className="w-full h-24 object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}

                            <p className="text-xs md:text-[13px] leading-relaxed text-gray-200 font-serif text-justify md:text-center whitespace-pre-wrap">
                              {lastAiMsg.isAudio ? `🎙️ ${lastAiMsg.text}` : lastAiMsg.text}
                            </p>

                            <div className="flex items-center justify-center space-x-1.5 text-[8px] font-mono tracking-widest text-gray-400 uppercase select-none">
                              <span>Companion Response</span>
                              <span>•</span>
                              <span>{lastAiMsg.timestamp}</span>
                            </div>
                          </motion.div>
                        );
                      })()
                    ) : (
                      <div className="py-8 text-center text-[11.5px] text-gray-500 font-serif">
                        “睁开眼后的雾气，还留在床头吗？试着讲讲那幅微光……”
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* COLLAPSIBLE HISTORICAL REMINISCENCE DRAWER (SHOWN ON TOUCH OPT-IN) */}
                <div className="w-full max-w-lg mx-auto z-10">
                  <AnimatePresence>
                    {showFullHistory && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-black/45 border border-white/[0.04] rounded-xl p-3.5 space-y-2.5 max-h-[170px] overflow-y-auto custom-scrollbar shadow-inner text-left backdrop-blur-sm animate-fade-in"
                      >
                        <div className="text-[9px] font-mono tracking-widest text-[#8a63ff]/70 uppercase border-b border-white/[0.04] pb-1.5 mb-2 flex justify-between items-center select-none">
                          <span>Dream Echoes Trail / 拾星脉络</span>
                          <button 
                            onClick={() => {
                              setShowFullHistory(false);
                              playAmbientTone(250, 'sine', 0.2);
                            }}
                            className="text-[9px] text-[#8a63ff] hover:text-white cursor-pointer"
                          >
                            [ 收起历史 ]
                          </button>
                        </div>
                        <div className="space-y-3 pr-1">
                          {currentSessionMessages.map((msg, idx) => {
                            const isAi = msg.sender === 'ai';
                            return (
                              <div key={msg.id || idx} className={`flex ${isAi ? 'justify-start' : 'justify-end'} text-xs font-serif`}>
                                <div className={`max-w-[85%] px-3 py-1.5 rounded-xl leading-relaxed ${
                                  isAi ? 'text-gray-300 bg-white/[0.02]' : 'text-purple-250 bg-purple-950/20 border border-purple-500/10'
                                }`}>
                                  <span className="text-[8px] font-mono text-gray-500 block mb-0.5">
                                    {isAi ? `${currentPersonaData.name}` : `你的述说`}
                                  </span>
                                  <p className="text-[10.5px] leading-relaxed">{msg.text}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!showFullHistory && currentSessionMessages.length > 1 && (
                    <button
                      onClick={() => {
                        setShowFullHistory(true);
                        playAmbientTone(320, 'sine', 0.2);
                      }}
                      className="text-[10px] text-indigo-400/50 hover:text-indigo-300/80 font-serif block mx-auto text-center py-1.5 transition-colors cursor-pointer select-none"
                    >
                      ✦ 展开历史呓语 (已记录 {currentSessionMessages.length} 行叙事)
                    </button>
                  )}
                </div>

                {/* Optional instant quick tags to prompt conversation */}
                {currentSessionMessages.length < 4 && !isRecording && (
                  <div className="flex flex-wrap gap-1.5 items-center justify-center max-w-sm z-10-none">
                    {["我梦见深夜下雨", "一扇沉重的铁制大门", "感觉自己在悬浮飞行", "小时候的自己在招手"].map((phrase, pi) => (
                      <button
                        key={pi}
                        onClick={() => handleQuickInput(phrase)}
                        className="text-[9px] py-1 px-2.5 rounded-full bg-white/[0.02] border border-white/5 hover:border-purple-500/20 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer font-serif"
                      >
                        {phrase}
                      </button>
                    ))}
                  </div>
                )}

              </div>

              {/* LOWER CORE INTERACTION DUST BLOCK (VOICE PORT PRIMARY) */}
              <div className="p-4 border-t border-white/[0.03] bg-black/30 backdrop-blur-md space-y-3 z-10 rounded-b-2xl">
                
                {/* Visual attachments strip */}
                {attachedImage && (
                  <div className="flex items-center justify-between bg-purple-950/20 p-2 rounded-xl border border-purple-500/10 max-w-xs mx-auto animate-fade-in text-[10px]">
                    <div className="flex items-center space-x-2">
                      <img 
                        src={attachedImage} 
                        alt="attachment thumb" 
                        className="w-8 h-8 rounded object-cover border border-white/10"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-left">
                        <span className="text-gray-400 font-serif">梦中斑流已载入</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setAttachedImage(null)}
                      className="p-1 rounded-full hover:bg-white/10 text-gray-500 hover:text-white cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* KEY LAYOUT: Massive Voice Recording Dial centerpiece with supplementary selectors left/right */}
                <div className="flex flex-col items-center justify-center space-y-3.5 w-full">
                  
                  {/* Floating Speech Notice */}
                  <AnimatePresence>
                    {voiceError && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="px-4 py-2 rounded-xl bg-purple-900/60 border border-purple-500/30 text-center text-[10px] text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.15)] max-w-sm mx-auto backdrop-blur-md select-none font-sans"
                      >
                        {voiceError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Master voice button wrapped in symmetrical smaller utility controls */}
                  <div className="flex items-center justify-between w-full max-w-sm px-4">
                    
                    {/* LEFT CONTROLS: Manual writing toggler */}
                    <button
                      onClick={() => {
                        setShowManualKeyboardInput(!showManualKeyboardInput);
                        playAmbientTone(350, 'sine', 0.15);
                      }}
                      className={`p-2.5 rounded-full border transition-all duration-300 flex items-center justify-center cursor-pointer ${
                        showManualKeyboardInput
                          ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                          : 'bg-white/[0.01] border-white/5 text-gray-500 hover:text-gray-200'
                      }`}
                      title={showManualKeyboardInput ? '收起键盘' : '键盘辅助输入'}
                    >
                      <Send className="w-4 h-4 scale-x-[-1]" />
                    </button>

                    {/* CENTER: GIGANTIC OBSIDIAN VOICE DIAL BUTTON */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={handleToggleVoiceInput}
                        className={`w-18 h-18 rounded-full flex items-center justify-center border transition-all duration-500 cursor-pointer ${
                          isRecording
                            ? 'bg-red-950/40 border-red-500/40 text-red-400 scale-105 shadow-[0_0_25px_rgba(239,68,68,0.25)]'
                            : 'bg-purple-950/40 border-purple-500/20 text-purple-300 shadow-[0_0_15px_rgba(138,99,255,0.08)] hover:border-purple-500/40'
                        }`}
                        title={isRecording ? '点击停录并转换为碎墨' : '单点语音述梦碎片'}
                      >
                        <Mic className={`w-7 h-7 ${isRecording ? 'animate-pulse' : ''}`} />
                      </button>
                      
                      {/* Interactive Microtimer */}
                      <span className="text-[9px] font-mono tracking-wider text-gray-500 mt-1.5 select-none">
                        {isRecording ? `聆听中... 00:${recordingSeconds < 10 ? '0' + recordingSeconds : recordingSeconds}` : '点击语音记录碎梦'}
                      </span>
                    </div>

                    {/* RIGHT CONTROLS: Image Library slot */}
                    <button
                      onClick={() => {
                        setShowImagePicker(!showImagePicker);
                        playAmbientTone(350, 'sine', 0.15);
                      }}
                      className={`p-2.5 rounded-full border transition-all duration-300 flex items-center justify-center cursor-pointer ${
                        showImagePicker || attachedImage
                          ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                          : 'bg-white/[0.01] border-white/5 text-gray-500 hover:text-gray-200'
                      }`}
                      title="注入意象图斑"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>

                  </div>

                  {/* ACTIVE EQUALIZER SPECTRUM BARS GRAPH (Triggered upon recording!) */}
                  {isRecording && (
                    <div className="flex items-center justify-center space-x-1 h-8 animate-fade-in select-none">
                      {Array.from({ length: 9 }).map((_, rIdx) => {
                        // Vary frequency delays to look completely natural & responsive
                        const delaySecs = (rIdx % 3) * 0.2;
                        return (
                          <div
                            key={rIdx}
                            className="w-1 rounded bg-gradient-to-t from-purple-500 to-indigo-400 wave-line-bar"
                            style={{
                              animationDelay: `${delaySecs}s`,
                              height: `${Math.random() * 18 + 6}px`
                            }}
                          ></div>
                        );
                      })}
                    </div>
                  )}

                  {/* BOTTOM GRACEFUL KEYBOARD SLIDEDOWN (HIDDEN BY DEFAULT, SHOWN ON DEMAND) */}
                  <AnimatePresence>
                    {showManualKeyboardInput && (
                      <motion.form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendMessage();
                        }}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="w-full max-w-md flex items-center space-x-1.5 pt-1 overflow-hidden"
                      >
                        <input
                          type="text"
                          value={inputText}
                          onChange={(e) => {
                            setInputText(e.target.value);
                            if (e.target.value.trim()) {
                              setInteractionState('userTyping');
                            } else {
                              setInteractionState('idle');
                            }
                          }}
                          placeholder="我梦见了…… 描绘一个画面/气味/温度"
                          className="flex-grow bg-black/60 border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/30 font-serif placeholder-gray-500 focus:bg-[#070512]/60"
                        />
                        <button
                          type="submit"
                          disabled={!inputText.trim() && !attachedImage}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                            inputText.trim() || attachedImage
                              ? 'bg-purple-950/75 border-purple-500/30 text-purple-200 hover:bg-purple-900/70'
                              : 'bg-white/[0.01] border-white/5 text-gray-700 cursor-not-allowed'
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Absolute popover Image Library container */}
                  <AnimatePresence>
                    {showImagePicker && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="p-3 bg-[#0a0715] border border-white/[0.06] rounded-2xl w-full max-w-md text-left space-y-2 z-10 shadow-lg"
                      >
                        <p className="text-[10px] text-gray-500 font-serif">💡 选择一件意象图斑注入宿梦：</p>
                        <div className="grid grid-cols-4 gap-2">
                          {INSPIRE_IMAGES.map((img) => (
                            <div 
                              key={img.id}
                              onClick={() => selectInspireImage(img.url)}
                              className="group relative h-12 rounded-xl overflow-hidden border border-white/5 cursor-pointer hover:border-purple-500/30 transition-colors"
                              title={img.description}
                            >
                              <img 
                                src={img.url} 
                                alt="thumb" 
                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/50 group-hover:bg-transparent transition-colors flex items-end p-1">
                                <span className="text-[7.5px] text-white/85 font-serif truncate w-full">{img.description}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>

              </div>
            </motion.div>
          )}

          {/* 4) DREAM ARCHIVE GALLERY PORTABLE CARD LIST */}
          {stage === 'DREAM_LIST' && (
            <motion.div
              key="archive_list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex justify-center"
            >
              <DreamNebulaUniverse
                savedDreams={savedDreams}
                onBackToHome={() => handleStageChange('HOME')}
                onSelectDreamDetail={(dream) => {
                  setSelectedArchiveDream(dream);
                  handleStageChange('DREAM_DETAIL');
                }}
                onContinueDreamDialogue={(dream) => {
                  loadToResumeDialogue(dream);
                }}
                onDeleteDream={(id, e) => {
                  handleDeleteArchive(id, e);
                }}
                onStartNewDream={() => {
                  handleStartRecordingFlow();
                }}
                playAmbientTone={playAmbientTone}
                soundEnabled={soundEnabled}
              />
            </motion.div>
          )}

          {/* 5) SINGLE DREAM DETAIL VIEW SCREEN */}
          {stage === 'DREAM_DETAIL' && selectedArchiveDream && (
            <motion.div
              key="archive_detail"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-2xl space-y-6 text-left"
            >
              {/* Top Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleStageChange('DREAM_LIST')}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-gray-400 hover:text-white transition-all cursor-pointer flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>返回记忆馆</span>
                </button>

                {/* Continue/resume writing conversation button */}
                <button
                  onClick={() => loadToResumeDialogue(selectedArchiveDream)}
                  className="px-3.5 py-1.5 rounded-lg bg-purple-950/40 border border-purple-500/30 hover:bg-purple-900/30 text-xs text-purple-200 transition-colors cursor-pointer flex items-center space-x-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>续写 / 再次深入聊这个梦</span>
                </button>
              </div>

              {/* Central Sheet presentation card resembling beautiful antique envelope paper */}
              <div className="p-6 md:p-8 rounded-2xl glass-card border border-white/[0.06] bg-[#0c0915]/65 shadow-2xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500/10 via-indigo-500/20 to-purple-500/10"></div>
                
                <div className="space-y-2 border-b border-white/[0.05] pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[10px] font-mono text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-purple-400/80" />
                      <span>收录于时间：{selectedArchiveDream.date}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/[0.02] border border-white/5 max-w-max">
                      伴伴：{PERSONAS.find(p => p.id === selectedArchiveDream.personaId)?.name || '巡梦者'}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl md:text-2xl text-purple-100 font-medium tracking-wide">
                    {selectedArchiveDream.title}
                  </h3>
                </div>

                {/* Chat dialogues transcript visualizer */}
                <div className="space-y-4">
                  <p className="text-[10px] uppercase font-mono tracking-widest text-[#8a63ff]/80">Dialogue transcript / 梦呓复原录</p>
                  
                  <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedArchiveDream.chatHistory.map((item, id) => {
                      const isAi = item.sender === 'ai';
                      const persona = PERSONAS.find(p => p.id === selectedArchiveDream.personaId) || PERSONAS[0];
                      
                      return (
                        <div key={id} className="space-y-1 text-left">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-indigo-400">
                              {isAi ? `[AI - ${persona.name}]` : '[用户碎片]'}
                            </span>
                            <span className="text-[8px] text-gray-600 font-mono">{item.timestamp}</span>
                          </div>
                          
                          <div className="pl-2 border-l border-white/[0.05] py-1 text-xs text-gray-300 leading-relaxed font-serif whitespace-pre-wrap">
                            {item.image && (
                              <img 
                                src={item.image} 
                                alt="Transcript Visual attachment" 
                                className="rounded-lg max-h-32 object-cover w-full max-w-xs mb-2 border border-white/5"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            {item.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Gentle conclusion block */}
                <div className="pt-4 border-t border-white/[0.05] bg-[#120f23]/30 p-4 rounded-xl space-y-1.5 border border-white/[0.02]">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-purple-400">Memory Resonance / 对话回响</span>
                  <p className="text-xs text-indigo-200/90 leading-relaxed font-serif italic">
                    这场梦保留了当时你的情绪轨迹。正如日记本在言语结尾所写的那样，它接住了你在高大槐树、亦或是深渊高墙前的拉扯。它不必是个坏预兆，白昼再次亮起的时候，请记得张开双手，去拉住它。
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 font-serif">
                <span className="flex items-center space-x-1">
                  <Heart className="w-3 h-3 text-rose-500/50" />
                  <span>梦境已经被温柔钉入馆底</span>
                </span>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`《巡梦》梦境档案：《${selectedArchiveDream.title}》- ${selectedArchiveDream.summary}`);
                    alert('游梦档案摘要已复制，可分享。');
                  }}
                  className="hover:text-purple-300 transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>分享游梦链接</span>
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* SAVE DIALOG OVERLAY MODAL */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm p-6 rounded-2xl glass-card border border-purple-500/25 bg-[#0e0c19] text-left space-y-5 shadow-2xl relative"
            >
              <div className="space-y-1 text-center">
                <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400">Save Dream / 钉入记忆库</span>
                <h4 className="font-serif text-lg text-white font-medium">写一个诗性的标题</h4>
                <p className="text-[11px] text-gray-400 font-serif">
                  给这段在指缝流淌的大脑标本起一个温暖的引子，以便在漫长白昼后在记忆馆里随时查找：
                </p>
              </div>

              {/* Title Input field */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={customDreamTitle}
                  onChange={(e) => setCustomDreamTitle(e.target.value)}
                  placeholder="《一个有关红鞋子的梦》"
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/40 font-serif text-center"
                />
                
                {/* Micro automatic feedback suggested */}
                <button
                  type="button"
                  onClick={() => {
                    const r = suggestAutomaticTitle(currentSessionMessages);
                    setCustomDreamTitle(r);
                    playAmbientTone(400, 'sine', 0.2);
                  }}
                  className="text-[9px] text-[#8a63ff] hover:opacity-80 block mx-auto text-center font-mono uppercase tracking-wider cursor-pointer"
                >
                  ✦ 重新生成一个随即建议名 Title Suggestion
                </button>
              </div>

              {/* Confirmation action triggers with beautiful visual animation delay states */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleConfirmSave}
                  disabled={isSavingAnimation || !customDreamTitle.trim()}
                  className="w-full py-3 rounded-xl border border-purple-500/40 bg-purple-950/60 text-purple-200 text-xs font-serif tracking-widest flex items-center justify-center space-x-2 cursor-pointer shadow-glow-purple disabled:opacity-50"
                >
                  {isSavingAnimation ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>正在悄悄钉入记忆轨道...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>将梦钉入记忆馆</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    playAmbientTone(180, 'sine', 0.2);
                  }}
                  disabled={isSavingAnimation}
                  className="w-full py-2.5 rounded-xl text-xs text-gray-500 hover:text-gray-300 font-serif text-center cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  取消，继续写碎语
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GEMINI API SETTINGS OVERLAY MODAL */}
      <AnimatePresence>
        {showApiKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-2xl glass-card border border-indigo-500/35 bg-[#0b0916] text-left space-y-5 shadow-2xl relative animate-fade-in"
            >
              <button
                onClick={() => {
                  setShowApiKeyModal(false);
                  playAmbientTone(180, 'sine', 0.2);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1 text-center">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#8a63ff] flex items-center justify-center gap-1">
                  <Key className="w-3 h-3" /> Gemini Access Tunnel / 梦境密钥接口
                </span>
                <h4 className="font-serif text-base text-white font-medium">测试伴梦者 AI 连接</h4>
                <p className="text-[11px] text-gray-400 font-serif leading-relaxed">
                  真实 API Key 只从 Netlify 环境变量 <strong>GEMINI_API_KEY</strong> 读取，前端不会保存密钥。
                </p>
              </div>

              {/* Input field */}
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="Netlify: GEMINI_API_KEY"
                    readOnly
                    className="w-full bg-black/50 border border-white/[0.08] rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50 font-mono text-center tracking-wider"
                  />
                </div>

                {/* Status Indicator Bar */}
                <div className="p-3 rounded-xl bg-black/30 border border-white/[0.02]">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-gray-500 font-serif font-serif">配置状态 :</span>
                    <span className={`font-serif px-2 py-0.5 rounded-md text-[10px] ${
                      apiTestStatus === 'success'
                        ? 'bg-emerald-950/30 text-emerald-300 border border-emerald-900/10'
                        : 'bg-yellow-950/20 text-yellow-300 border border-yellow-900/20'
                    }`}>
                      {apiTestStatus === 'success' ? '✓ Gemini 已连接' : '需测试 Netlify Function'}
                    </span>
                  </div>

                  {apiTestMsg && (
                    <p className={`text-[11px] font-mono mt-1.5 px-2 py-1 rounded bg-[#0c051a] border border-white/[0.02] ${
                      apiTestStatus === 'testing' ? 'text-yellow-400/90' :
                      apiTestStatus === 'success' ? 'text-emerald-400' :
                      'text-red-400'
                    }`}>
                      {apiTestStatus === 'testing' && '⏳ '}{apiTestMsg}
                    </p>
                  )}
                </div>
              </div>

              {/* Operational Trigger row panel */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleSaveApiKey}
                    className="py-2.5 rounded-xl border border-indigo-500/40 bg-indigo-950/50 hover:bg-indigo-900/40 text-indigo-200 text-xs font-serif tracking-widest cursor-pointer text-center transition-colors"
                  >
                    查看变量名
                  </button>
                  <button
                    onClick={handleClearApiKey}
                    className="py-2.5 rounded-xl border border-white/[0.05] hover:border-red-900/20 hover:bg-red-950/10 text-gray-400 hover:text-red-300 text-xs font-serif tracking-widest cursor-pointer text-center transition-colors"
                  >
                    清空本地输入
                  </button>
                </div>

                <button
                  onClick={handleTestConnection}
                  disabled={apiTestStatus === 'testing'}
                  className="w-full py-2.5 rounded-xl border border-purple-500/30 bg-purple-950/40 text-purple-200 text-xs font-serif tracking-widest flex items-center justify-center space-x-1.5 cursor-pointer shadow-glow-purple disabled:opacity-50 transition-colors"
                >
                  {apiTestStatus === 'testing' ? (
                    <>
                      <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>测试连接中...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>测试连接 Gemini API</span>
                    </>
                  )}
                </button>
              </div>

              {/* Hackathon Disclaimer */}
              <p className="text-[9.5px] text-gray-500 font-serif leading-relaxed text-center select-none pt-2 border-t border-white/[0.03]">
                “Hackathon Demo 稳定方案：前端请求 Netlify Function，由服务端读取 GEMINI_API_KEY 并调用 Gemini。”
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER COOPERATIVE SYSTEM SIGNATURE */}
      <footer className="relative z-10 w-full px-6 py-4 text-center border-t border-white/[0.02] bg-[#05040a]/25 text-[10px] text-gray-600 font-mono flex flex-col sm:flex-row items-center justify-between gap-2 max-w-4xl mx-auto">
        <div className="flex items-center space-x-1.5">
          <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
          <span>巡梦 • AI 暖色对话记录端已就绪</span>
        </div>
        <div>
          <span>© 1024-2026 Dream Patrol INC. 陪伴你收起梦里的微光。</span>
        </div>
      </footer>

    </div>
  );
}
