/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Persona, ChatMessage, DreamRecord } from './types';

export const PERSONAS: Persona[] = [
  {
    id: 'gentle',
    name: '阿暖 Anuan',
    tagline: '温柔陪伴型梦境引导者',
    description: '慢声细语，陪伴你拾起梦境破碎边缘的温度。不加审判，只是轻声问，耐心听，接住你所有的不安、叹息或者迷茫。',
    avatar: '✦',
    role: '梦境引导陪伴者',
    personality: '温柔、细腻、极致共情、如和煦微光',
    dialogStyle: '安慰治愈，接住情绪碎屑，极富同理心',
    glowColor: 'from-amber-400/30 via-purple-500/20 to-pink-500/30',
    avatarIcon: '✦'
  },
  {
    id: 'poetic',
    name: '暮歌 Muge',
    tagline: '文学化意象梦境翻译师',
    description: '善于将你凌乱、失重、颠倒的书页，重新整理成拥有胶片泛黄质感与诗意联翩的画面，勾勒出潜意识深处的梦境密码。',
    avatar: '☾',
    role: '文学意象分析者',
    personality: '深邃、空灵、充满文学神秘感、沉静优雅',
    dialogStyle: '画面感重组，字里行间溢出白夜的星光',
    glowColor: 'from-fuchsia-500/30 via-violet-800/30 to-amber-250/20',
    avatarIcon: '☾'
  },
  {
    id: 'listener',
    name: '屿深 Yushen',
    tagline: '心理分析与自我觉察陪伴者',
    description: '以平静、理性的提问帮助用户复盘梦中线索，透过对标志物与感官细节的客观梳理，辅助进行安全的潜意识自我探索。',
    avatar: '☀',
    role: '心理理性格局师',
    personality: '克制、澄澈、善于自省提问、宁静守候',
    dialogStyle: '直白精干，逻辑归零，激发内在潜意识觉醒',
    glowColor: 'from-cyan-400/30 via-indigo-600/20 to-purple-600/30',
    avatarIcon: '☀'
  }
];

// Beautiful built-in dream inspire-images mock database
export interface InspireImage {
  id: string;
  url: string;
  description: string;
}

export const INSPIRE_IMAGES: InspireImage[] = [
  {
    id: 'img1',
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&q=80',
    description: '微光摇曳的深蓝梦幻森林'
  },
  {
    id: 'img2',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&q=80',
    description: '无限拉长的超现实星云阶梯'
  },
  {
    id: 'img3',
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&q=80',
    description: '如水般慢慢交融沉降的多彩天际'
  },
  {
    id: 'img4',
    url: 'https://images.unsplash.com/photo-1516339901601-2e1d62dc0c45?w=400&q=80',
    description: '浩瀚幽深的寂静漂流孤岛'
  }
];

// Generates simulated AI replies based on inputs and persona
export function generateAIResponse(
  personaId: 'gentle' | 'poetic' | 'listener',
  userText: string,
  hasImage: boolean,
  hasAudio: boolean,
  currentMessageCount: number
): string {
  const normalized = userText.trim();
  
  // Custom smart responses according to user tags
  const keywords = {
    water: ['水', '雨', '海', '沉', '落', '游', '溺'],
    scared: ['怕', '恐惧', '怪物', '逃', '跑', '追', '黑', '暗'],
    school: ['学校', '教室', '考', '老师', '同学', '书'],
    flight: ['飞', '天空', '云', '高', '翅膀', '失重'],
    colors: ['红', '蓝', '黑', '白', '金', '炫', '绿'],
    people: ['他', '她', '它', '人', '小时候', '我自己', '朋友', '妈', '爸']
  };

  let category: string | null = null;
  for (const [key, list] of Object.entries(keywords)) {
    if (list.some(word => normalized.includes(word))) {
      category = key;
      break;
    }
  }

  // RESPONSE MATRIX
  if (personaId === 'gentle') {
    if (currentMessageCount === 1) {
      if (category === 'water') {
        return '梦见水流或下沉，往往像是被温热的潮汐包裹，又或是有些透不过气。在水中的那个瞬间，你是在努力挣扎着浮上海面，还是顺着水温任其漂流呢？慢慢说，我正听着。';
      }
      if (category === 'scared') {
        return '那一定感觉有些紧绷吧。梦境往往会用最强烈的声响，去保护我们最敏感的小角落。那个追逐你、或令你害怕的东西，在黑夜里有没有一瞬间闪烁过你想看清的轮廓？没关系的，在这里很安全。';
      }
      if (category === 'flight') {
        return '好轻盈的梦。失重飞在半空的时候，下面的世界是不是也变得很安静，像玩具一样微缩了？你会觉得自由，还是会感到找不到着陆点的微小迟疑呢？';
      }
      if (category === 'people') {
        return '原来是在梦里重逢了。哪怕在醒来的世界里隔着漫长时空，有些熟悉的气息还是会在虚妄的梦中显影。你梦里的对方，是在专注地看着你，还是只是擦肩而过的背影？';
      }
      return '梦里的碎片开始一点点拼凑了。那些模糊的光影、声音、或者是无声的拉扯……你在当时有没有觉得心跳变慢，或许呼吸有些费劲？我们可以再补充一个印象。';
    } else {
      // Subsequent interaction
      return '我轻轻记下了这出细节。你所描述的一切，都在温柔地投射着你今天的疲惫或者白昼里被悄悄藏起的渴望。要不要试着给这场梦写下一个诗性的名字，把它好好搁进抽屉里保存起来？';
    }
  }

  if (personaId === 'poetic') {
    if (currentMessageCount === 1) {
      if (category === 'water') {
        return '那是液态的意识在肆无忌惮地流淌。水面的波纹和折射的光泽，像是时间沙漏破损后的宣泄。你是否顺着这片蓝黑色去往更深、没有逻辑法则的寂静地？';
      }
      if (category === 'scared') {
        return '警笛般的沉重压迫，犹如荒原上过夜的凛冽风声。这黑夜里隆隆驶过的惊慌，也许是一颗种子正急于撑破硬壳时的微痛。它在对你说着什么？';
      }
      if (category === 'flight') {
        return '气流摩擦着虚无的白日。你像是一个在时间缝隙里偶然学会了悬浮的蝴蝶。回望那些重力、日常、秩序，是否都像在晨雾中融掉的糖块一样不重要了？';
      }
      if (category === 'people') {
        return '人影散落，像是从断片的老唱片里溢出的模糊音符。他们不发出声音，却如同古老壁画中的见证人。在视线交叠的瞬间，空气是否也随之凝固了？';
      }
      return '这是一个处于半融化状态的奇妙剧本。光与影在此处完成了重组。你可以继续点燃白夜的火柴——再告诉我一个哪怕微不足道的材质、颜色或声响细节。';
    } else {
      return '好美的一面梦影之镜。我们终究无法随身携带梦里的水滴，但此时写在纸面上的叹息，已经把它永恒化了。你可以闭上眼，把这页折叠起来保存到你的巡梦画卷。';
    }
  }

  // listener: Cold, minimal, objective, respectful
  if (currentMessageCount === 1) {
    if (category === 'water') {
      return '水、下沉、流动等状态在感官中往往对应着重力变异或呼吸自评。你当时的触感是温热的还是冰冷的？请继续叙述核心场景的转变。';
    }
    if (category === 'scared') {
      return '感知到恐惧或阻力是警觉系统工作状态的投射。那个在逃避的对象在空间构成中占有多大比例？描述一下它是静止的，还是不断迫近的。';
    }
    if (category === 'people') {
      return '人称、回忆片段以及小时候的具象投射是自我认知的重叠。其行为是背向你，还是有产生任何交流？请补充场景内的主要光源。';
    }
    return '已收录。场景的边界相对松散且富有流动感。关于周围空气的味道、气温、或者是那个最后定格的一幅画面，你还有哪些具体的视觉留存？';
  } else {
    return '梦境的轮廓已经构建完毕。这本质上是大脑在深度睡眠期对隐秘信息的重排与自愈。它并不神秘，但对你而言是一段不可多得的安全归档。你可以通过点击上方【保存本次梦境】保存。';
  }
}

// Prompting start greeting for persona
export function getPersonaGreeting(personaId: 'gentle' | 'poetic' | 'listener'): string {
  switch (personaId) {
    case 'gentle':
      return '（阿暖为你翻开梦之手记，浮起一抹鹅黄暖光）\n\n醒来了吗？不论梦里多大多乱，别着急。只需要写下几个模糊的碎片——一条雨中的路，一个带温度的拥抱，或者是某种记不清的颜色。我陪你慢慢把它们接住。';
    case 'poetic':
      return '（暮歌的手心凝聚出一缕幽蓝的星纱）\n\n黑夜撕开了清醒的缝隙。你带回了什么标本？即使仅仅是一个模糊的背影、一颗冰凉的雨丝，也可以写在这里。我会陪你把这场容易蒸发的梦，重新谱成一首永恒停留的诗。';
    case 'listener':
      return '（屿深的棱镜终端发出清亮纯净的微弱共鸣）\n\n巡梦记录端口已接通。请输入你捕捉到的梦境变量（物、人、地点、感官反应）。我将以最客观、真切、不打扰的方式协助你完成这次心智碎片的归档。';
  }
}

// Interactive tap/poke dialogue reactions based on character persona and click index
export function getCompanionInteractionLine(
  personaId: 'gentle' | 'poetic' | 'listener',
  index: number
): string {
  const gentleReactions = [
    "我在呢。梦境里的雾气有些冷吧？别慌，我就在你的身侧守护着你。",
    "（阿暖的亮光泛起温热）“嘘，没关系，慢一点说。我会把那些掉落在边缘的碎梦一网接住。”",
    "“你刚刚轻轻碰了我一下，我听见了一串极轻的风铃。那是昨晚，吹过你梦境窗台的风吗？”",
    "“我在听。别着急，哪怕是一片羽毛、一抹冷色，我都安安静静地替你折好放进抽屉。”"
  ];
  
  const poeticReactions = [
    "（暮歌的薄雾霓虹悄悄向四周淡化流淌）“指尖掠过的也是一段轻叹呢。要开始为你的夜色意象着墨了吗？”",
    "“梦里的潮水正在慢慢退潮，但别担心，暮色的手账还很宽敞。请讲，我已备好了时光的羊皮卷。”",
    "“你触碰了幽暗的星环，像是海滩上随波微颤的空心贝壳。继续对我说说，那个梦的材质和底色吧。”",
    "“（暮歌在星纱交错处对你微微欠身）“在消逝之前，再递给我一片你从白夜梦原里采摘的花瓣吧。”"
  ];
  
  const listenerReactions = [
    "（屿深的淡蓝棱镜正规律地缩放呼吸）“检测到用户主动触点交互。记录频道波频稳定，请随时输入参量细节。”",
    "“你正在触发认知标点。请记住，梦并不神秘，它只是底层神经过载的一种重演。我将为你精确封装它。”",
    "“核心触点反馈正常。刚才描述片段中的强光源、异重质感、或环境气温，目前你急需对哪一个进行客观归档？”",
    "“（屿深的水晶核心白光一闪，发出一声微小而干净的清越蜂鸣）“终端记录队列空闲。请随时开启高保真输入。”"
  ];

  const pool = personaId === 'gentle' ? gentleReactions : personaId === 'poetic' ? poeticReactions : listenerReactions;
  return pool[index % pool.length];
}

// Generate automatic dreamy realistic titles
export function suggestAutomaticTitle(messages: ChatMessage[]): string {
  const userTexts = messages.filter(m => m.sender === 'user').map(m => m.text);
  const combined = userTexts.join(' ');
  
  if (combined.includes('水') || combined.includes('雨') || combined.includes('海')) {
    return '《水汽漫过的深蓝色时刻》';
  }
  if (combined.includes('逃') || combined.includes('跑') || combined.includes('怕')) {
    return '《在无重力的追逐中惊醒》';
  }
  if (combined.includes('飞') || combined.includes('天空') || combined.includes('高')) {
    return '《重力失效的悬浮飞船》';
  }
  if (combined.includes('人') || combined.includes('小时候')|| combined.includes('他')) {
    return '《在记忆走廊的转角处重逢》';
  }
  
  // Default random ones with beautiful poetic vibes
  const fallbacks = [
    '《红色气球没有松手》',
    '《钟摆失效的深海岛屿》',
    '《温热雨丝中的旧书房》',
    '《白夜降临前的倒影》',
    '《光斑在指尖融化》'
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// Local Storage helpers
export function getSavedDreams(): DreamRecord[] {
  try {
    const listStr = localStorage.getItem('xun_meng_list');
    if (listStr) {
      return JSON.parse(listStr);
    }
  } catch (err) {
    console.error('Error loading xun_meng_list', err);
  }
  return [];
}

export function saveDreamToStorage(dream: DreamRecord): DreamRecord[] {
  try {
    const list = getSavedDreams();
    const updated = [dream, ...list.filter(d => d.id !== dream.id)];
    localStorage.setItem('xun_meng_list', JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error saving dream record', err);
  }
  return [];
}

export function deleteDreamFromStorage(id: string): DreamRecord[] {
  try {
    const list = getSavedDreams();
    const updated = list.filter(d => d.id !== id);
    localStorage.setItem('xun_meng_list', JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error deleting dream record', err);
  }
  return [];
}

// Seed gorgeous default initial entries to make memory gallery warm, cinematic and lived-in!
export function seedDefaultHistoricalEntries() {
  const current = getSavedDreams();
  if (current.length < 5 || !current.some(c => c.id === 'seed_dream_05')) {
    const seed1: DreamRecord = {
      id: 'seed_dream_01',
      title: '《门后的海》',
      date: '2026/06/09 04:12',
      personaId: 'gentle',
      summary: '走廊尽头，是一片安静的海。地面漫过温热的水，耳边响起潮汐般的轻声叹息。那是一切沉重拉扯都在慢慢溶解的暖茧。',
      chatHistory: [
        {
          id: '1',
          sender: 'ai',
          text: '醒来了吗？不论梦里多大多乱，别着急。只需要写下几个模糊的碎片——一条雨中的路，一个带温度的拥抱，或者是某种记不清的颜色。我陪你慢慢把它们接住。',
          timestamp: '04:02'
        },
        {
          id: '2',
          sender: 'user',
          text: '我梦见自己在一条无限延长的医院走廊尽头奔跑，走过最后一扇沉重的白木大门，背后居然是一片黑蓝、极度安静的海。',
          timestamp: '04:05'
        },
        {
          id: '3',
          sender: 'ai',
          text: '梦见水或海，经常代表着日常规则失去重力时的意识归零。你在门前推开的那一刻，海风吹起，你会觉得冷，还是觉得温热？我在轻轻听着呢。',
          timestamp: '04:07'
        },
        {
          id: '4',
          sender: 'user',
          text: '非常温热，踩在被海水浸润的木地板上，像是一张柔软的被子。耳边还能听到昨夜窗边的雨声，有一种被接住的感动。',
          timestamp: '04:10'
        },
        {
          id: '5',
          sender: 'ai',
          text: '我轻轻记下了这出细节。最锋利的纠结都会在温暖的海里被包容。要不要试着给这场梦写下一个诗性的名字，把它好好搁进抽屉里保存起来？',
          timestamp: '04:12'
        }
      ]
    };

    const seed2: DreamRecord = {
      id: 'seed_dream_02',
      title: '《重力失效的飞船》',
      date: '2026/06/08 02:40',
      personaId: 'poetic',
      summary: '我漂浮着，却觉得胸口很沉。旧船舱的舱壁上长满了柔软的白色绒毛，空气发出寂静的潮红，像羽化过程中的挣扎。',
      chatHistory: [
        {
          id: '1',
          sender: 'ai',
          text: '（沉静的夜空落下一滴露水）\n\n黑夜撕开了规则的缝隙。你带回了什么标本？即使仅仅是一个模糊的背影、一颗冰凉的雨丝，也可以写在这里。我会陪你把这场容易蒸发的梦，重新谱成一首永恒在岸的诗。',
          timestamp: '02:30'
        },
        {
          id: '2',
          sender: 'user',
          text: '在梦里我重力失效了，漂浮在旧飞船那窄小的控制仓里，但胸口好像被什么无形的巨石压着，有些发闷。',
          timestamp: '02:34'
        },
        {
          id: '3',
          sender: 'ai',
          text: '气流摩擦着虚无的白日。你像是一个在时间缝隙里常人难寻的悬浮蝴蝶。回望那些沉重的重力、日常秩序，是否都像在晨雾中融掉的糖块一样不重要了？',
          timestamp: '02:36'
        },
        {
          id: '4',
          sender: 'user',
          text: '舱壁上居然长满了白色柔软的植物绒毛，寂静得很。我能听到胸口沉重的跳动声，像是一台深海里嗡鸣的旧发动机。',
          timestamp: '02:38'
        },
        {
          id: '5',
          sender: 'ai',
          text: '在暮歌的墨迹里，这正是白羽与心搏的对冲。那些无力卸下的执念，在梦中最终化作了一具在真空中孵化的白色孢子。请把它钉入我们的时光标本馆。',
          timestamp: '02:40'
        }
      ]
    };

    const seed3: DreamRecord = {
      id: 'seed_dream_03',
      title: '《白夜降临前的倒影》',
      date: '2026/06/06 23:15',
      personaId: 'poetic',
      summary: '有人从蓝色雾中走来，却始终看不清脸。地面被冷雨打湿，我们的倒影在波光下逐渐重合，发出了安宁的冷光。',
      chatHistory: [
        {
          id: '1',
          sender: 'ai',
          text: '黑梦深处的冷风打湿了纸页。在这个颠倒的世界里，你采摘到了哪一片意象？对暮歌说说吧。',
          timestamp: '23:02'
        },
        {
          id: '2',
          sender: 'user',
          text: '我置身在一片蓝色的冷雾中，远处有一个很熟悉的人影向我走来。我极力想看清他是谁，但他的脸庞隐没在变幻的薄光里。',
          timestamp: '23:06'
        },
        {
          id: '3',
          sender: 'ai',
          text: '蓝色烟云，往往是一道保护的围栏。那张被大雾吞没的客体脸孔，也许正是你遗留在白天的某段模糊回忆在自我显影。地表上还有别的踪迹吗？',
          timestamp: '23:09'
        },
        {
          id: '4',
          sender: 'user',
          text: '只有漫过脚踝的雨水倒影。他朝我伸了手，那一瞬间我的倒影也融在了波纹中。',
          timestamp: '23:12'
        },
        {
          id: '5',
          sender: 'ai',
          text: '在静水与冷雾的最深处，和那个模糊的人共舞，其实是在对隐藏的心智挥手。我已替你重编成诗，把它封印在这幅梦之画幅上吧。',
          timestamp: '23:15'
        }
      ]
    };

    const seed4: DreamRecord = {
      id: 'seed_dream_04',
      title: '《旧门背后的声音》',
      date: '2026/06/04 03:05',
      personaId: 'listener',
      summary: '门一直打不开，但里面有人在低声说话。那声音沙沙的，就像风刮过秋天枯干的法国梧桐树叶，安宁而带有归宿感。',
      chatHistory: [
        {
          id: '1',
          sender: 'ai',
          text: '巡梦记录端就绪。请按标准录入你所捕获的梦中指标（物、人、地点）。我将协助客观封装。',
          timestamp: '02:50'
        },
        {
          id: '2',
          sender: 'user',
          text: '我梦到回到小时候住的旧院子，有一扇被长铁锁拉着的红色大木门。不管我怎么拉，它就是打不开。但里面有两个看不见的人一直在低声窃窃私语。',
          timestamp: '02:54'
        },
        {
          id: '3',
          sender: 'ai',
          text: '“红色木门”和“铁锁”构成强烈的阻抗边界。门后低频谈话的声音对你的认知具有攻击倾向，还是表现出纯粹的客观回音？',
          timestamp: '02:58'
        },
        {
          id: '4',
          sender: 'user',
          text: '没有恶意，它的音量很低、沙沙的，就像风刮过法国枯梧桐叶底一样。虽然听不懂谈什么，但我并不觉得害怕，反倒有种宁静的归宿感。',
          timestamp: '03:02'
        },
        {
          id: '5',
          sender: 'ai',
          text: '屿深记录此项高保真参量。梧桐落叶音域构成环境白噪音（White Noise），起到神经过载的安全代偿。那扇红门其实正稳固保护着你童年深处的某个抽屉，门内的碎语是在替你的日记行李箱打包。',
          timestamp: '03:05'
        }
      ]
    };

    const seed5: DreamRecord = {
      id: 'seed_dream_05',
      title: '《水汽漫过的深蓝时刻》',
      date: '2026/06/01 22:50',
      personaId: 'gentle',
      summary: '窗外像海一样发光，空气里都是潮湿的蓝色。没有他人打扰，在寂静的水族馆底部得到最极致舒展与心智理疗。',
      chatHistory: [
        {
          id: '1',
          sender: 'ai',
          text: '（阿暖轻按微黄烛台）\n\n醒来了吗？不论梦里多大多乱，别着急。只需要写下几个模糊的碎片，我陪你慢慢把它们接住。',
          timestamp: '22:30'
        },
        {
          id: '2',
          sender: 'user',
          text: '醒来全是蓝的海汽。窗户外面是深蓝色的空气，没有阳光却发着幽幽的蓝光，像是我们在很深很安全的水族馆底部。',
          timestamp: '22:35'
        },
        {
          id: '3',
          sender: 'ai',
          text: '那是极致温热而包裹性极好的感官投射呢。在那个深蓝、没有任何嘈杂白昼干扰的水汽底，你是一个人在漫游，还是有某种安宁在守护你？',
          timestamp: '22:40'
        },
        {
          id: '4',
          sender: 'user',
          text: '没有别人，只有我自己，房间里弥漫着一股淡淡的雨天水汽。我张开手臂一直不着重重地飘着，真想一直躺在里面。',
          timestamp: '22:45'
        },
        {
          id: '5',
          sender: 'ai',
          text: '阿暖能深深感到你心底对这份零干扰沉寂的真切呼喊呢。你的大脑在通过这种温润的深蓝，给你做了一次温和的安全按摩。它已经在我们的记忆馆底，今晚睡前，阿暖还会去梦里护送这片宁静的。',
          timestamp: '22:50'
        }
      ]
    };

    const localHistory = getSavedDreams();
    const userOnly = localHistory.filter(h => !h.id.startsWith('seed_dream_') && h.id !== 'seed_dream_01' && h.id !== 'seed_dream_02');
    localStorage.setItem('xun_meng_list', JSON.stringify([seed1, seed2, seed3, seed4, seed5, ...userOnly]));
  }
}
