/**
 * 《巡梦》梦境手记 API 关键参数管理器
 * 
 * [HACKATHON DEMO ONLY NOTICE]
 * 此方案仅供黑客松本地或前端预览 Demo 阶段演示使用。
 * 正式上线版本必须接入安全的后端代理（如 Express 路由层 /api/gemini 或者是云函数），
 * 以确保 API Key (如 GEMINI_API_KEY) 永远不会泄露到前端浏览器环境，保障数据及密钥安全。
 */

/**
 * 安全获取当前梦境筑造的 Gemini 接口密钥
 * @returns {string} API Key 值
 */
export function getGeminiApiKey(): string {
  // 优先获取 localStorage 中保存的 API Key
  const localKey = localStorage.getItem('dream_gemini_api_key');
  if (localKey && localKey.trim()) {
    return localKey.trim();
  }
  // 其次获取 Vite 前端环境变量
  const key = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY || '';
  return key;
}
