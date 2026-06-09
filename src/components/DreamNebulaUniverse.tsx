/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  ArrowLeft, 
  Trash2, 
  Sparkles, 
  MessageSquare, 
  BookOpen, 
  Clock, 
  Move,
  RotateCcw,
  Calendar,
  Layers,
  Search,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Eye,
  CheckCircle,
  HelpCircle,
  Image as ImageIcon,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DreamRecord, Persona } from '../types';
import { PERSONAS } from '../utils';

interface DreamNebulaUniverseProps {
  savedDreams: DreamRecord[];
  onBackToHome: () => void;
  onSelectDreamDetail: (dream: DreamRecord) => void;
  onContinueDreamDialogue: (dream: DreamRecord) => void;
  onDeleteDream: (id: string, e: React.MouseEvent) => void;
  onStartNewDream: () => void;
  playAmbientTone: (frequency: number, type?: 'sine' | 'triangle', duration?: number, gainVal?: number) => void;
  soundEnabled: boolean;
}

// 5/6 high fidelity visual fragments representing the mock database of uploads
interface VisualFragment {
  id: string;
  keyword: string;
  imageUrl: string;
  title: string;
  date: string;
  userExcerpt: string;
  aiExcerp: string;
  dreamId: string; // Links to actual seed identifier if present
  x: number; // 2D layout in dark nebula
  y: number;
}

export default function DreamNebulaUniverse({
  savedDreams,
  onBackToHome,
  onSelectDreamDetail,
  onContinueDreamDialogue,
  onDeleteDream,
  onStartNewDream,
  playAmbientTone,
  soundEnabled
}: DreamNebulaUniverseProps) {
  // --- STATE FOR MAIN VIEW SELECTION ---
  // CARDS: horizontal carousel, NEBULA: dim visual shards, CALENDAR: date-picker
  const [activeView, setActiveView] = useState<'CARDS' | 'NEBULA' | 'CALENDAR'>('CARDS');

  // Interactive coordinate system bounds for Nebula Fragment drag-pan
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isCurrentlyDragging, setIsCurrentlyDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  
  // Search state for visual fragments
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected visual fragment popup details
  const [selectedFragment, setSelectedFragment] = useState<VisualFragment | null>(null);

  // Favorites tracking (local state & persist)
  const [favoritedFragmentIds, setFavoritedFragmentIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('favorited_fragments');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (id: string) => {
    const updated = favoritedFragmentIds.includes(id) 
      ? favoritedFragmentIds.filter(fid => fid !== id)
      : [...favoritedFragmentIds, id];
    setFavoritedFragmentIds(updated);
    localStorage.setItem('favorited_fragments', JSON.stringify(updated));
    
    if (soundEnabled) {
      if (updated.includes(id)) {
        playAmbientTone(659.25, 'sine', 0.6, 0.05); // high E chime
      } else {
        playAmbientTone(440, 'sine', 0.3, 0.04);
      }
    }
  };

  // --- STATIC AND DETAILED SHARDS DATA ---
  const visualFragmentsList: VisualFragment[] = useMemo(() => [
    {
      id: "frag_01",
      keyword: "海",
      imageUrl: "https://images.unsplash.com/photo-1505118380757-91f5f5f229cc?w=400&q=80",
      title: "《门后的海》",
      date: "2026/06/09",
      userExcerpt: "我梦见自己在医院走廊尽头奔跑，推开白木门发现背后是一片黑蓝、极度安静的海。",
      aiExcerp: "最锋利的纠结都会在温暖的海里被包容。黑蓝的海是无边深沉的怀抱，它能温柔并溶解世间所有不安喧嚣。",
      dreamId: "seed_dream_01",
      x: -240,
      y: -140
    },
    {
      id: "frag_02",
      keyword: "飞船",
      imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80",
      title: "《重力失效的飞船》",
      date: "2026/06/08",
      userExcerpt: "我漂浮着，但觉得胸口被无形巨石压着，飞船窄小的控制仓窗外，飘满白色而柔软的绒毛微粒。",
      aiExcerp: "那些无力卸下的执念，在梦中最终化作了一具在真空中缓缓孵化的白色孢子。微重力正帮助你退回最安心的母体。",
      dreamId: "seed_dream_02",
      x: 180,
      y: -220
    },
    {
      id: "frag_03",
      keyword: "邮局",
      imageUrl: "https://images.unsplash.com/photo-1501183007986-d0d080b147f9?w=400&q=80",
      title: "《绿色邮差与无字信笺》",
      date: "2026/06/07",
      userExcerpt: "我来到一个墨绿色的木质邮局，柜台没有人，只有一只长着金色斑纹的松鼠在盖邮戳，纸上没有任何字。",
      aiExcerp: "信纸无字却重如山。那是白昼里未能妥善寄出的和解或抱歉。不要紧，梦在替你为遗失的时光归档。",
      dreamId: "seed_dream_07", // virtual link
      x: -320,
      y: 160
    },
    {
      id: "frag_04",
      keyword: "蓝色",
      imageUrl: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=400&q=80",
      title: "《水汽漫过的深蓝时刻》",
      date: "2026/06/01",
      userExcerpt: "窗外发着幽幽的蓝光，没有任何阳光，空气都是温热潮湿的。好像躺在静谧无声的水族馆最底层。",
      aiExcerp: "梦里的深蓝水汽，是大脑为你精心开启的感官排毒舱。在没有任何白昼嘈杂的真空里，你只需自由浮起。",
      dreamId: "seed_dream_05",
      x: 340,
      y: 100
    },
    {
      id: "frag_05",
      keyword: "门",
      imageUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&q=80",
      title: "《旧门背后的声音》",
      date: "2026/06/04",
      userExcerpt: "红色的木质大院门打不开。里面有人在极轻极低地说话。声音沙沙的，像风吹落干透的法桐树叶。",
      aiExcerp: "难以推开的门通常象征着潜意识的自卫。门后的窃窃低语其实并不是在拒绝，而是在为你妥帖收拾往昔的行囊。",
      dreamId: "seed_dream_04",
      x: 100,
      y: 200
    },
    {
      id: "frag_06",
      keyword: "小时候",
      imageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80",
      title: "《白夜降临前的倒影》",
      date: "2026/06/06",
      userExcerpt: "蓝色迷雾里有一个熟悉又模糊的背影向我伸出手，他脸庞不断闪烁，那一瞬让我想到了十岁那年放学后的斜阳。",
      aiExcerp: "时间并没有被物理裁剪。那个看不清脸的人其实是多年前勇敢纯意的你，她一直在潮汐涌动的冷雾尽头安静等候。",
      dreamId: "seed_dream_03",
      x: -60,
      y: -280
    }
  ], []);

  // --- TAB NAVIGATION SOUND HANDLER ---
  const handleTabChange = (view: 'CARDS' | 'NEBULA' | 'CALENDAR') => {
    setActiveView(view);
    if (soundEnabled) {
      if (view === 'CARDS') playAmbientTone(261.63, 'sine', 0.6, 0.04); // C4
      if (view === 'NEBULA') playAmbientTone(329.63, 'sine', 0.6, 0.04); // E4
      if (view === 'CALENDAR') playAmbientTone(392.00, 'sine', 0.6, 0.04); // G4
    }
  };

  // --- SECTION 1: EDITORIAL 3D PERSPECTIVE CARD VIEWS ---
  // Active Index
  const [activeCardIdx, setActiveCardIdx] = useState(0);

  // Auto wrap active index when dreams change
  useEffect(() => {
    if (activeCardIdx >= savedDreams.length) {
      setActiveCardIdx(Math.max(0, savedDreams.length - 1));
    }
  }, [savedDreams, activeCardIdx]);

  const handleNextCard = () => {
    if (activeCardIdx < savedDreams.length - 1) {
      setActiveCardIdx(prev => prev + 1);
      if (soundEnabled) playAmbientTone(440, 'triangle', 0.15, 0.05);
    }
  };

  const handlePrevCard = () => {
    if (activeCardIdx > 0) {
      setActiveCardIdx(prev => prev - 1);
      if (soundEnabled) playAmbientTone(349.23, 'triangle', 0.15, 0.05);
    }
  };

  // --- SECTION 2: SLOW FLOATING AMBIENT CANVAS particles (low CPU, dim aesthetic) ---
  const nebulaStars = useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 1200,
      y: (Math.random() - 0.5) * 1200,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.25 + 0.05,
      hue: Math.random() > 0.5 ? 'rgba(139, 92, 246, 0.25)' : 'rgba(56, 189, 248, 0.2)'
    }));
  }, []);

  // Filtered visual fragments based on keywords search
  const filteredFragments = useMemo(() => {
    if (!searchQuery.trim()) return visualFragmentsList;
    const query = searchQuery.toLowerCase().trim();
    return visualFragmentsList.map(frag => {
      // Return item with computed highlight match flag
      const matches = 
        frag.keyword.toLowerCase().includes(query) ||
        frag.title.toLowerCase().includes(query) ||
        frag.userExcerpt.toLowerCase().includes(query) ||
        frag.aiExcerp.toLowerCase().includes(query);
      return { ...frag, matches };
    });
  }, [searchQuery, visualFragmentsList]);

  // Handle Drag Move on Nebula viewport
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsCurrentlyDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isCurrentlyDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  };

  const handleMouseUp = () => {
    setIsCurrentlyDragging(false);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    setIsCurrentlyDragging(true);
    dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    panStartRef.current = { ...pan };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isCurrentlyDragging || e.touches.length === 0) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  };

  // --- SECTION 3: DREAM CALENDAR GRID (June 2026 Default) ---
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // 0-indexed, so 5 means June
  const [selectedDayNum, setSelectedDayNum] = useState<number>(9); // Default clicked day is June 9

  // Filter actual saved dreams occurring on dynamic selected year/month/day
  // Month lookup helper: standardizing "2026/06/09" format
  const activeDayDreams = useMemo(() => {
    const paddedMonth = String(currentMonth + 1).padStart(2, '0');
    const paddedDay = String(selectedDayNum).padStart(2, '0');
    const lookupString = `${currentYear}/${paddedMonth}/${paddedDay}`;
    
    return savedDreams.filter(dream => {
      return dream.date.includes(lookupString) || dream.date.startsWith(lookupString);
    });
  }, [savedDreams, currentYear, currentMonth, selectedDayNum]);

  // Days mapping for June 2026 (Mon, Tue, Wed, Thu, Fri, Sat, Sun style - June 1 is Monday)
  // Let's build a functional standard calendar grid for the selected month/year
  // For June 2026, 1st matches Monday. Let's make a real 42-cell arrays representing weeks
  const calendarDaysList = useMemo(() => {
    // In June 2026, May 31st represents Sunday (prev month tail), June 1st is Monday
    // Total days: June has 30 days
    // Empty prefix padding for June 2026, since Monday is June 1st. In 0-indexed Sun-first weekday mapping:
    // Sun=0, Mon=1, Tue=2, etc. June 1st is day of week 1 (Monday).
    // So Sunday at index 0 is mapped to previous month's day (May 31)
    const paddingCount = 1; // 1 day of May (31)
    const totalDays = 30;
    
    const daysArr = [];
    // Prior month days (dim output)
    for (let d = 31; d <= 31; d++) {
      daysArr.push({ day: d, isCurrentMonth: false });
    }
    // Present month days
    for (let d = 1; d <= totalDays; d++) {
      daysArr.push({ day: d, isCurrentMonth: true });
    }
    // Next month days padding to make 42 grid cells
    const remaining = 42 - daysArr.length;
    for (let d = 1; d <= remaining; d++) {
      daysArr.push({ day: d, isCurrentMonth: false });
    }
    return daysArr;
  }, []);

  // Helper arrays mapping visual elements on days for quick dot/star decoration on calendar
  const dayHasDreamMap = useMemo(() => {
    const mapped: Record<number, boolean> = {};
    savedDreams.forEach(dream => {
      // Parse days e.g. "2026/06/09 11:22" -> extract day as integer
      if (dream.date.includes("2026/06/")) {
        const parts = dream.date.split("/");
        if (parts.length >= 3) {
          const dayPart = parseInt(parts[2].split(" ")[0], 10);
          if (!isNaN(dayPart)) mapped[dayPart] = true;
        }
      }
    });
    return mapped;
  }, [savedDreams]);

  const dayHasFragmentMap = useMemo(() => {
    const mapped: Record<number, boolean> = {};
    visualFragmentsList.forEach(frag => {
      // Date: "2026/06/09"
      if (frag.date.includes("2026/06/")) {
        const parts = frag.date.split("/");
        if (parts.length >= 3) {
          const dayPart = parseInt(parts[2], 10);
          if (!isNaN(dayPart)) mapped[dayPart] = true;
        }
      }
    });
    return mapped;
  }, [visualFragmentsList]);

  // Interactive chime on calendar click
  const handleCalendarDayClick = (day: number) => {
    setSelectedDayNum(day);
    if (soundEnabled) {
      const scaleChimes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];
      const pitch = scaleChimes[day % scaleChimes.length];
      playAmbientTone(pitch, 'sine', 0.4, 0.04);
    }
  };

  return (
    <div 
      className="w-full min-h-[82vh] flex flex-col justify-between border border-white/[0.04] rounded-3xl overflow-hidden shadow-3xl bg-[#04010a]/92 text-gray-200 relative select-none"
      id="dream-universe-master"
    >
      <style>{`
        @keyframes float-minimal {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-4px) scale(1.01); }
        }
        @keyframes blurr-ambient {
          0%, 100% { opacity: 0.12; transform: scale(1) translate(0px, 0px); }
          50% { opacity: 0.22; transform: scale(1.08) translate(10px, -10px); }
        }
        .dim-glow-blur {
          filter: blur(55px);
          animation: blurr-ambient 15s ease-in-out infinite;
        }
        .light-float {
          animation: float-minimal 6s ease-in-out infinite;
        }
        /* Custom scrollbar */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* --- BACKGROUND SUBTLE AMBIENT BLUR CLOUDS (Ensuring very dark, dim layout) --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#040108]">
        {/* Soft violet cloud */}
        <div className="absolute w-[350px] h-[350px] rounded-full bg-indigo-950/20 dim-glow-blur -top-10 -left-10" />
        {/* Soft dark amethyst cloud */}
        <div className="absolute w-[400px] h-[400px] rounded-full bg-purple-950/15 dim-glow-blur -bottom-20 -right-10 [animation-delay:4s]" />
        {/* Core dark navy tone */}
        <div className="absolute w-[300px] h-[300px] rounded-full bg-[#110931]/15 dim-glow-blur top-1/2 left-1/3 [animation-delay:8s]" />
      </div>

      {/* --- MASTER NAVIGATION TOP HEADER --- */}
      <div className="px-5 py-4 border-b border-white/[0.03] bg-[#04020a]/85 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 z-30 relative">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={() => {
              playAmbientTone(196, 'sine', 0.5);
              onBackToHome();
            }}
            className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/10 transition-all cursor-pointer flex items-center justify-center"
            title="返回首页"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="text-left">
            <span className="text-[9px] font-mono tracking-[0.25em] text-purple-400 font-semibold uppercase leading-none block mb-0.5">Muted Archives</span>
            <h4 className="text-xs font-serif text-white tracking-widest font-medium">巡梦记忆馆</h4>
          </div>
        </div>

        {/* 3-VIEW SWITCH CAPSULES (Center-aligned) */}
        <div className="bg-[#0b0816]/75 p-1 rounded-xl border border-white/[0.05] flex items-center space-x-1 w-full sm:w-auto justify-between max-w-sm">
          <button
            onClick={() => handleTabChange('CARDS')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-serif tracking-widest transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeView === 'CARDS'
                ? 'bg-purple-900/30 border border-purple-500/20 text-purple-200 font-medium'
                : 'text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>梦境卡片</span>
          </button>

          <button
            onClick={() => handleTabChange('NEBULA')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-serif tracking-widest transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeView === 'NEBULA'
                ? 'bg-purple-900/30 border border-purple-500/20 text-purple-200 font-medium'
                : 'text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-purple-400" />
            <span>星云碎片</span>
          </button>

          <button
            onClick={() => handleTabChange('CALENDAR')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-serif tracking-widest transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeView === 'CALENDAR'
                ? 'bg-purple-900/30 border border-purple-500/20 text-purple-200 font-medium'
                : 'text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <span>梦境日历</span>
          </button>
        </div>

        {/* DIRECT ACTION TRIGGERS */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => {
              playAmbientTone(523, 'sine', 0.8, 0.05);
              onStartNewDream();
            }}
            className="px-3 py-1.5 rounded-xl bg-purple-950/20 border border-purple-500/20 hover:border-purple-400/40 text-[11px] text-purple-300 font-serif leading-none tracking-widest transition-all cursor-pointer flex items-center space-x-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>织绘新梦</span>
          </button>
        </div>
      </div>

      {/* --- MASTER WORKSPACE LAYOUT (SWITCH-DRIVEN) --- */}
      <div className="flex-1 relative min-h-[58vh] flex flex-col items-center justify-center p-4 sm:p-6 z-10 select-none overflow-hidden">
        
        {/* ==================== VIEW 1: 3D CARD CAROUSEL (XIAOHONGSHU STYLE) ==================== */}
        {activeView === 'CARDS' && (
          <div className="w-full max-w-4xl flex flex-col justify-between items-center py-4 space-y-6">
            
            {savedDreams.length === 0 ? (
              <div className="text-center p-8 max-w-sm rounded-2xl border border-white/[0.04] bg-black/40 backdrop-blur-md space-y-4">
                <BookOpen className="w-7 h-7 text-purple-400 mx-auto animate-pulse" />
                <div className="space-y-1">
                  <p className="text-xs font-serif text-white">记忆馆里还落满微尘</p>
                  <p className="text-[10px] text-gray-500 font-serif leading-relaxed">
                    在醒来的早晨去跟伴梦者说几句话，那些不具名的梦境丝线，就会被重织成书存在这里。
                  </p>
                </div>
                <button
                  onClick={onStartNewDream}
                  className="px-4 py-1.5 rounded-lg bg-purple-950/30 border border-purple-500/20 text-[10px] text-purple-200 font-serif hover:bg-purple-900/30 transition-colors cursor-pointer"
                >
                  织制我的第一场梦 &rarr;
                </button>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center space-y-8">
                {/* 3D Perspective Card Track Container */}
                <div className="w-full h-[360px] md:h-[400px] flex items-center justify-center relative overflow-hidden">
                  <div className="relative w-[280px] md:w-[320px] h-full flex items-center justify-center">
                    
                    {savedDreams.map((dream, idx) => {
                      const persona = PERSONAS.find(p => p.id === dream.personaId) || PERSONAS[0];
                      const diff = idx - activeCardIdx;
                      const absDiff = Math.abs(diff);
                      
                      // Show only cards adjacent to active centered element (rendered elegantly in 3D)
                      if (absDiff > 2) return null;

                      // 3D placement parameters
                      const xOffset = diff * 125; // stack sideways spacing
                      const scale = 1 - absDiff * 0.12; // center is largest
                      const rY = diff * -16; // tilting card side perspectives
                      const zIdx = 100 - absDiff; // center stays on top
                      const opacity = absDiff === 0 ? 1 : absDiff === 1 ? 0.6 : 0.22;

                      return (
                        <div
                          key={dream.id}
                          onClick={() => {
                            if (diff !== 0) {
                              setActiveCardIdx(idx);
                              if (soundEnabled) playAmbientTone(293.66 + absDiff * 40, 'sine', 0.2);
                            }
                          }}
                          className={`absolute w-[280px] md:w-[310px] h-[340px] md:h-[370px] rounded-2xl border bg-gradient-to-b from-[#110926]/95 to-[#060410]/98 transition-all duration-500 ease-out select-none cursor-pointer flex flex-col justify-between p-5 md:p-6 text-left shadow-[0_20px_45px_rgba(0,0,0,0.85)] ${
                            diff === 0 
                              ? 'border-purple-500/40 shadow-[0_0_35px_rgba(138,99,255,0.08)] ring-1 ring-purple-500/10' 
                              : 'border-white/[0.04] opacity-50 hover:border-purple-500/15'
                          }`}
                          style={{
                            transform: `translateX(${xOffset}px) scale(${scale}) rotateY(${rY}deg)`,
                            zIndex: zIdx,
                            opacity: opacity,
                            pointerEvents: absDiff > 1 ? 'none' : 'auto'
                          }}
                        >
                          {/* Top Tagline */}
                          <div className="flex items-center justify-between text-[8px] font-mono tracking-widest text-gray-500 uppercase pb-2 border-b border-white/[0.03]">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-2.5 h-2.5 text-purple-400" />
                              <span>{dream.date}</span>
                            </span>
                            <span className="bg-purple-950/20 px-1.5 py-0.5 rounded border border-purple-500/10 text-purple-300">
                              {persona.name.split(' ')[0]}
                            </span>
                          </div>

                          {/* Card Content Excerpt */}
                          <div className="flex-1 flex flex-col justify-center space-y-4 py-4">
                            <h4 className="font-serif text-[14px] md:text-[15.5px] font-medium text-purple-100 tracking-wide line-clamp-2 leading-snug">
                              {dream.title}
                            </h4>
                            <div className="space-y-1 bg-white/[0.01] p-3 rounded-xl border border-white/[0.02]/30 italic">
                              <span className="text-[8px] font-mono tracking-wider text-purple-400/80 block uppercase mb-1">AI 伴梦复原摘录 • Summary</span>
                              <p className="text-[10.5px] font-serif leading-relaxed text-gray-400 line-clamp-4">
                                “ {dream.summary || '在朦胧的梦之彼岸，静静流淌下的呓语碎片，尚未写完。'} ”
                              </p>
                            </div>
                          </div>

                          {/* Card Interactive Footer Triggers */}
                          {diff === 0 && (
                            <div className="flex items-center justify-between pt-3 border-t border-white/[0.03] space-x-2">
                              {/* Resume dialogue */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onContinueDreamDialogue(dream);
                                }}
                                className="flex-1 py-2 rounded-lg bg-purple-950/15 border border-purple-500/20 hover:bg-purple-950/30 text-[10.5px] font-serif hover:text-purple-200 transition-colors cursor-pointer text-center flex items-center justify-center space-x-1"
                              >
                                <MessageSquare className="w-3 h-3 text-purple-400" />
                                <span>续梦</span>
                              </button>

                              {/* Inspect details */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectDreamDetail(dream);
                                }}
                                className="flex-1 py-2 rounded-lg bg-purple-950/40 border border-purple-500/40 shadow-inner hover:bg-purple-900/40 hover:border-purple-400 text-[10.5px] font-serif text-purple-200 transition-all cursor-pointer text-center flex items-center justify-center space-x-1"
                              >
                                <BookOpen className="w-3 h-3 text-purple-300" />
                                <span>翻阅</span>
                              </button>
                            </div>
                          )}

                          {diff !== 0 && (
                            <div className="text-center text-[9px] text-gray-600 font-serif pt-1">
                              点按聚焦 Card {idx + 1}
                            </div>
                          )}
                        </div>
                      );
                    })}

                  </div>
                </div>

                {/* Left/Right Slider controls */}
                <div className="flex items-center space-x-6">
                  <button
                    onClick={handlePrevCard}
                    disabled={activeCardIdx === 0}
                    className="p-2.5 rounded-full border border-white/5 bg-white/[0.01] hover:bg-white/5 hover:border-white/10 disabled:opacity-20 disabled:hover:bg-transparent disabled:border-white/5 font-serif text-gray-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                    title="前一卷"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-xs text-gray-500 font-serif font-light tracking-widest">
                    梦境卷 <strong className="text-purple-300">{activeCardIdx + 1}</strong> / {savedDreams.length}
                  </span>

                  <button
                    onClick={handleNextCard}
                    disabled={activeCardIdx === savedDreams.length - 1}
                    className="p-2.5 rounded-full border border-white/5 bg-white/[0.01] hover:bg-white/5 hover:border-white/10 disabled:opacity-20 disabled:hover:bg-transparent disabled:border-white/5 font-serif text-gray-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                    title="下一卷"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ==================== VIEW 2: DIM VISUAL NEBULA SHARDS (GENTLE EXPLORER) ==================== */}
        {activeView === 'NEBULA' && (
          <div className="w-full h-[58vh] md:h-[62vh] rounded-2xl border border-white/[0.03] bg-[#030107]/60 overflow-hidden relative flex flex-col justify-between">
            
            {/* SUBTLE INNER SEBULA PARTICLES (Dragging Space Canvas coordinates) */}
            <div 
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              className={`absolute inset-0 z-0 ${isCurrentlyDragging ? 'cursor-grabbing' : 'cursor-grab'} overflow-hidden`}
            >
              {/* Parallax Stars background */}
              <div 
                className="absolute inset-0 pointer-events-none transition-transform duration-300 ease-out"
                style={{
                  transform: `translate(${pan.x * 0.18}px, ${pan.y * 0.18}px)`
                }}
              >
                {nebulaStars.map(star => (
                  <div
                    key={star.id}
                    className="absolute rounded-full"
                    style={{
                      left: `calc(50% + ${star.x}px)`,
                      top: `calc(50% + ${star.y}px)`,
                      width: `${star.size}px`,
                      height: `${star.size}px`,
                      backgroundColor: star.hue,
                      opacity: star.opacity
                    }}
                  />
                ))}
              </div>

              {/* Glowing very organic dark cloud backdrops */}
              <div 
                className="absolute inset-0 pointer-events-none transition-transform duration-500 ease-out flex items-center justify-center"
                style={{
                  transform: `translate(${pan.x * 0.3}px, ${pan.y * 0.3}px)`
                }}
              >
                <div className="absolute w-[350px] h-[350px] rounded-full bg-gradient-to-tr from-purple-950/10 to-transparent blur-[80px] -translate-x-[150px] -translate-y-[80px] opacity-40" />
                <div className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-indigo-950/10 to-transparent blur-[90px] translate-x-[200px] translate-y-[150px] opacity-40" />
              </div>

              {/* Absolute coordinates viewport containing floating photo fragments */}
              <div 
                className="absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-out"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px)`
                }}
              >
                {/* Center marker */}
                <div className="absolute w-12 h-12 rounded-full border border-dashed border-white/[0.015] flex items-center justify-center pointer-events-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500/10" />
                </div>

                {/* Render active drift pieces (Draggable cards of user uploads) */}
                {filteredFragments.map((frag) => {
                  const isHighlighted = searchQuery === '' || frag.matches === true;
                  const isFavorited = favoritedFragmentIds.includes(frag.id);
                  const isNotMatch = searchQuery !== '' && !frag.matches;
                  const opacityVal = isNotMatch ? 0.08 : 0.85;
                  const scaleVal = isNotMatch ? 0.85 : 1.0;
                  
                  return (
                    <div
                      key={frag.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrentlyDragging) return;
                        if (soundEnabled) playAmbientTone(392, 'sine', 0.4, 0.04);
                        setSelectedFragment(frag);
                      }}
                      className="absolute transition-all duration-500 ease-out cursor-pointer select-none"
                      style={{
                        transform: `translate(${frag.x}px, ${frag.y}px) scale(${scaleVal})`,
                        opacity: opacityVal,
                        zIndex: isHighlighted ? 10 : 2
                      }}
                    >
                      {/* Photo Polaroid visual board style */}
                      <div className={`p-2.5 rounded-xl border bg-[#090614]/90 backdrop-blur-md flex flex-col justify-between space-y-2 select-none w-[115px] sm:w-[130px] shadow-2xl transition-all duration-300 hover:scale-105 ${
                        isHighlighted && searchQuery !== ''
                          ? 'border-purple-400/85 shadow-[0_0_20px_rgba(168,85,247,0.35)] scale-105 bg-purple-950/10' 
                          : 'border-white/[0.04] hover:border-purple-500/25'
                      }`}>
                        
                        {/* Picture slot with dark blur filter */}
                        <div className="w-full aspect-[4/3] rounded-lg overflow-hidden relative bg-[#130d2a]">
                          {/* Favorite indicator on corner */}
                          {isFavorited && (
                            <div className="absolute top-1 right-1 bg-purple-900/85 p-1 rounded-full border border-purple-400/40 z-10">
                              <Bookmark className="w-2 h-2 text-purple-300 fill-purple-300" />
                            </div>
                          )}

                          <img 
                            src={frag.imageUrl} 
                            alt={frag.keyword} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover filter brightness-[0.7] contrast-[1.05] hover:brightness-[0.9] transition-all"
                            loading="lazy"
                          />
                          
                          {/* Keyword Badge overlay */}
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/5 text-[7px] font-mono tracking-widest text-[#d5c2ff] uppercase">
                            #{frag.keyword}
                          </div>
                        </div>

                        {/* Text labels */}
                        <div className="text-left space-y-0.5 pt-0.5">
                          <h5 className="text-[9px] font-serif text-gray-200 truncate pr-1">
                            {frag.title}
                          </h5>
                          <span className="text-[7.5px] font-mono text-gray-500 block">
                            {frag.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>

            {/* FLOATING ACTION ONDISK BAR (Search & Hints over Nebula view) */}
            <div className="p-4 border-b border-white/[0.03] bg-[#04020a]/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 z-20 pointer-events-auto">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] sm:text-xs font-serif text-gray-400">
                  星云视觉碎片 • <strong className="text-purple-300 font-normal">{filteredFragments.filter(f => f.matches || searchQuery === '').length}</strong> 枚
                </span>
              </div>

              {/* SEARCH INPUT FIELD (No backend required, highlight matching fragments) */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="搜索：海、门、飞船、紫色、小时候..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#120a21]/50 border border-white/5 focus:border-purple-500/30 text-[11px] font-serif pl-8.5 pr-8 py-2 rounded-xl text-gray-200 placeholder-gray-600 outline-none transition-all focus:shadow-[0_0_15px_rgba(138,99,255,0.04)]"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      if (soundEnabled) playAmbientTone(250, 'sine', 0.15);
                    }}
                    className="absolute right-2.5 top-2.5 p-0.5 rounded hover:bg-white/5 text-gray-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* BOT INFORMATION BAR */}
            <div className="p-3 bg-black/45 backdrop-blur-sm flex items-center justify-between text-[8.5px] text-gray-500 pointer-events-none z-10 px-4">
              <span className="flex items-center space-x-1">
                <Move className="w-3 h-3 text-[#fca364] animate-pulse" />
                <span>触控拖动探索视觉星图 • 搜索高亮碎片</span>
              </span>
              <span className="hidden sm:inline font-mono">
                Spotlight: {searchQuery ? `"${searchQuery}" matches` : "All fragments active"}
              </span>
            </div>

          </div>
        )}

        {/* ==================== VIEW 3: DREAM CALENDAR GRID CHRONOLOGY ==================== */}
        {activeView === 'CALENDAR' && (
          <div className="w-full max-w-2xl py-2 flex flex-col md:flex-row gap-6 items-start justify-center">
            
            {/* Calendar Core Sheet */}
            <div className="w-full md:w-[320px] bg-[#070512]/60 p-5 rounded-2xl border border-white/[0.03] space-y-4">
              {/* Year Month Picker Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                <button
                  onClick={() => {
                    // Muted limit loop, June 2026 is centerpiece
                    if (soundEnabled) playAmbientTone(147, 'sine', 0.2);
                  }}
                  className="p-1 rounded hover:bg-white/5 text-gray-600 transition-colors cursor-pointer"
                  title="上个月"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <h5 className="text-xs font-serif text-purple-200 font-medium tracking-widest uppercase">
                  {currentYear}年 {currentMonth + 1}月 (June)
                </h5>

                <button
                  onClick={() => {
                    if (soundEnabled) playAmbientTone(147, 'sine', 0.2);
                  }}
                  className="p-1 rounded hover:bg-white/5 text-gray-600 transition-colors cursor-pointer"
                  title="下个月"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Weekday indicators */}
              <div className="grid grid-cols-7 text-center text-[9px] font-mono text-gray-500 tracking-wider">
                <span>日</span>
                <span>一</span>
                <span>二</span>
                <span>三</span>
                <span>四</span>
                <span>五</span>
                <span>六</span>
              </div>

              {/* Grid cell matrix days */}
              <div className="grid grid-cols-7 text-center gap-y-1.5 gap-x-1">
                {calendarDaysList.map((item, idx) => {
                  const isCurrent = item.isCurrentMonth;
                  const day = item.day;
                  const hasDream = isCurrent && dayHasDreamMap[day];
                  const hasFragment = isCurrent && dayHasFragmentMap[day];
                  const isSelected = isCurrent && selectedDayNum === day;
                  
                  return (
                    <button
                      key={idx}
                      disabled={!isCurrent}
                      onClick={() => handleCalendarDayClick(day)}
                      style={{ height: '36px' }}
                      className={`relative flex flex-col items-center justify-between rounded-lg p-1 text-[11px] border transition-all ${
                        !isCurrent 
                          ? 'opacity-10 text-gray-700 border-transparent cursor-not-allowed'
                          : isSelected
                            ? 'bg-purple-900/40 border-purple-400/50 text-white font-semibold'
                            : hasDream
                              ? 'border-purple-500/15 text-purple-200 hover:border-purple-500/35 cursor-pointer bg-purple-950/5'
                              : 'border-transparent text-gray-500 hover:text-white hover:bg-white/[0.02] cursor-pointer'
                      }`}
                    >
                      {/* Day Number */}
                      <span className="leading-none text-[10.5px]">{day}</span>

                      {/* Micro Indicators (Dot for text, tiny spark star for visual fragment) */}
                      <div className="w-full flex items-center justify-center space-x-0.5 h-2">
                        {hasDream && (
                          <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-purple-300' : 'bg-purple-500 animate-pulse'}`} />
                        )}
                        {hasFragment && (
                          <span className="text-[7.5px] text-[#fcaa72] leading-none">★</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Records Side detail drawer */}
            <div className="flex-1 w-full bg-[#080516]/50 p-5 rounded-2xl border border-white/[0.03] space-y-4 text-left min-h-[220px] md:min-h-[300px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.03]">
                  <span className="text-[9px] font-mono uppercase text-[#ca9bdf] tracking-widest">
                    {currentYear}/{String(currentMonth + 1).padStart(2, '0')}/{String(selectedDayNum).padStart(2, '0')} 日志
                  </span>
                  <span className="text-[8.5px] text-gray-500 font-serif">
                    本日梦境：<strong>{activeDayDreams.length}</strong> 场
                  </span>
                </div>

                {/* Day content elements listing */}
                {activeDayDreams.length === 0 ? (
                  <div className="py-12 text-center text-gray-600 font-serif space-y-1.5">
                    <HelpCircle className="w-6 h-6 mx-auto opacity-30 text-gray-500" />
                    <p className="text-[11px] leading-relaxed">那晚是静寂无风的一页，没有留下任何入账梦呓。</p>
                  </div>
                ) : (
                  <div className="space-y-4 pt-2">
                    {activeDayDreams.map((dream) => {
                      const persona = PERSONAS.find(p => p.id === dream.personaId) || PERSONAS[0];
                      const matchedFragment = visualFragmentsList.find(f => f.dreamId === dream.id);
                      
                      return (
                        <div 
                          key={dream.id}
                          className="bg-black/30 p-3.5 rounded-xl border border-white/[0.03] space-y-3 shadow-inner hover:border-purple-500/10 transition-colors"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <h6 className="font-serif text-[11.5px] text-purple-100 font-medium leading-normal">
                              {dream.title}
                            </h6>
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-950/20 text-purple-300 font-serif border border-purple-500/10 whitespace-nowrap">
                              {persona.name.split(' ')[0]}
                            </span>
                          </div>

                          <p className="text-[10px] leading-relaxed text-gray-400 font-serif line-clamp-3">
                            {dream.summary || '散入空气里的模糊碎语样本。'}
                          </p>

                          {/* Matching Mini Image slot if day features fragment */}
                          {matchedFragment && (
                            <div className="flex items-center space-x-2.5 bg-purple-950/5 p-1.5 rounded-lg border border-purple-500/5">
                              <img 
                                src={matchedFragment.imageUrl} 
                                alt={matchedFragment.keyword} 
                                referrerPolicy="no-referrer"
                                className="w-10 h-7 object-cover rounded filter brightness-75"
                              />
                              <div className="text-[8.5px] font-serif text-gray-500">
                                <span className="text-purple-300">#本日视觉留影</span>：海风与落木
                              </div>
                            </div>
                          )}

                          {/* Quick details toggle */}
                          <div className="flex justify-end space-x-2 pt-1 border-t border-white/[0.02]">
                            <button
                              onClick={() => onSelectDreamDetail(dream)}
                              className="px-2.5 py-1 rounded bg-purple-950/20 hover:bg-purple-900/30 text-[9px] font-serif text-purple-300 hover:text-purple-100 transition-colors cursor-pointer"
                            >
                              翻阅梦忆
                            </button>
                            <button
                              onClick={() => onContinueDreamDialogue(dream)}
                              className="px-2.5 py-1 rounded hover:bg-white/5 text-[9px] font-serif text-gray-400 hover:text-white transition-colors cursor-pointer"
                            >
                              再度续命聊聊
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="text-[8.5px] font-mono text-gray-600 border-t border-white/[0.02] pt-2">
                Click dots to recall past sleep cycles.
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ==================== INTERACTIVE GENTLE FLOATING MODAL DETAIL POPUP FOR NEBULA SHARD ==================== */}
      <AnimatePresence>
        {selectedFragment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              className="w-full max-w-md p-5 rounded-2xl border border-purple-500/25 bg-[#090614] text-left space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.95)] relative overflow-hidden"
            >
              {/* Top border light */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-purple-500/30 via-indigo-500/60 to-purple-500/30" />
              
              {/* Close button */}
              <button
                onClick={() => {
                  if (soundEnabled) playAmbientTone(250, 'sine', 0.2);
                  setSelectedFragment(null);
                }}
                className="absolute top-4.5 right-4 p-1.5 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/5 text-gray-500 hover:text-white transition-all cursor-pointer z-10"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Shard Meta Header */}
              <div className="flex items-center space-x-2 pt-1 text-[9px] font-mono tracking-widest text-[#ca9eff] uppercase">
                <span>{selectedFragment.date}</span>
                <span>•</span>
                <span>视觉指征: {selectedFragment.keyword}</span>
              </div>

              {/* Big Blurred Artistic Visual Image */}
              <div className="w-full aspect-[16/10] rounded-xl overflow-hidden relative shadow-inner bg-[#120d2a] border border-white/[0.04]">
                <img
                  src={selectedFragment.imageUrl}
                  alt={selectedFragment.keyword}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.05]"
                />
                
                {/* Floating Keyword Badge overlay */}
                <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm border border-purple-500/10 text-[9px] font-mono tracking-widest text-purple-200 uppercase">
                  #{selectedFragment.keyword}
                </div>
              </div>

              {/* Related Dream metadata */}
              <div>
                <span className="text-[7.5px] font-mono uppercase text-gray-500 tracking-wider block mb-0.5">关联梦册 / Related Log</span>
                <h4 className="font-serif text-[13.5px] font-medium text-white tracking-wide">
                  {selectedFragment.title}
                </h4>
              </div>

              {/* Dialogue Transcript Split Box */}
              <div className="grid grid-cols-1 gap-2.5">
                {/* User spoke */}
                <div className="bg-[#120c24]/30 p-3 rounded-xl border border-white/[0.02]/30 space-y-1 text-left">
                  <span className="text-[7.5px] font-mono uppercase text-gray-500 tracking-wider block">用户当时留白 / User record</span>
                  <p className="font-serif text-[10.5px] leading-relaxed text-gray-400">
                    “ {selectedFragment.userExcerpt} ”
                  </p>
                </div>

                {/* AI response snippet */}
                <div className="bg-purple-950/[0.08] p-3 rounded-xl border border-purple-500/5 space-y-1 text-left">
                  <span className="text-[7.5px] font-mono uppercase text-purple-400 tracking-wider block">伴梦回思 / AI Companion response</span>
                  <p className="font-serif text-[10.5px] leading-relaxed text-purple-200 italic">
                    “ {selectedFragment.aiExcerp} ”
                  </p>
                </div>
              </div>

              {/* Shard Operations */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.03]">
                {/* Save favorite toggle */}
                <button
                  onClick={() => toggleFavorite(selectedFragment.id)}
                  className="p-2 text-gray-500 hover:text-purple-300 hover:bg-purple-950/20 rounded-xl transition-all cursor-pointer flex items-center space-x-1 text-[10px] font-serif"
                >
                  <Bookmark className={`w-3.5 h-3.5 ${favoritedFragmentIds.includes(selectedFragment.id) ? 'fill-purple-400 text-purple-400' : 'text-gray-600'}`} />
                  <span>{favoritedFragmentIds.includes(selectedFragment.id) ? '已收藏' : '收藏碎片'}</span>
                </button>

                {/* Resume dialogue context related */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      // Attempt to restore dialogue session matching corresponding saved dream block
                      const matchingDreamRecord = savedDreams.find(d => d.id === selectedFragment.dreamId) || savedDreams[0];
                      if (matchingDreamRecord) {
                        setSelectedFragment(null);
                        onContinueDreamDialogue(matchingDreamRecord);
                      } else {
                        // fallback to home start
                        setSelectedFragment(null);
                        onStartNewDream();
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-purple-950/40 border border-purple-500/35 text-purple-200 text-[10.5px] font-serif tracking-widest hover:bg-purple-900/40 hover:border-purple-400 transition-all cursor-pointer"
                  >
                    回到这段对话 (Resume) &rarr;
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER MINI INDEX STATUS BANNER */}
      <div className="px-5 py-3 border-t border-white/[0.02] bg-[#04010a]/50 flex items-center justify-between text-[8px] font-mono text-gray-600 select-none z-10 relative">
        <div className="flex items-center space-x-1">
          <span className="w-1 h-1 rounded-full bg-purple-400" />
          <span>Polyester dream chronology matrix is online</span>
        </div>
        <div className="hidden sm:block">
          <span>Three views coordinate synchronizer active • Click to transition</span>
        </div>
      </div>
    </div>
  );
}
