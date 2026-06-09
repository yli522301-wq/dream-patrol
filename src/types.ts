/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Persona {
  id: 'gentle' | 'poetic' | 'listener';
  name: string;
  tagline: string;
  description: string;
  avatar: string;
  role: string;
  personality: string;
  dialogStyle: string;
  glowColor: string;
  avatarIcon: string; // symbol or character
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  image?: string;
  isAudio?: boolean;
  audioDuration?: number; // seconds
  timestamp: string;
}

export interface DreamRecord {
  id: string;
  title: string;
  date: string;
  personaId: 'gentle' | 'poetic' | 'listener';
  chatHistory: ChatMessage[];
  summary: string;
}

export type AppStage =
  | 'HOME'          // Landing Page
  | 'PERSONA_SELECT' // Personality selection
  | 'CHAT_RECORD'    // Clean conversational dream recording interface
  | 'DREAM_LIST'     // Archive of previous records
  | 'DREAM_DETAIL';  // Single dream detail view
