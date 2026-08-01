import { Chat } from '../models/Chat.js';

const AGENT_BASE = process.env.AGENT_URL
  ? process.env.AGENT_URL.replace(/\/$/, '')
  : 'http://127.0.0.1:8000';

/**
 * Calls the Python agent service /query endpoint.
 * Passes the user's question AND the selected MySQL connection details.
 */
async function callAgentService(question, connection) {
  const url = `${AGENT_BASE}/query`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, connection: connection || null }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const detailStr = Array.isArray(errorBody.detail) ? JSON.stringify(errorBody.detail) : errorBody.detail;
      throw new Error(detailStr || `Agent returned ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[ChatController] Agent call failed:', error.message);
    return {
      question,
      sql: null,
      analysis: `Could not reach the AI agent. Error: ${error.message}`,
      rows: [],
      columns: [],
      recommendations: [],
      followups: [],
      chart_config: null,
      decision: 'fallback',
    };
  }
}

/**
 * POST /api/chat
 * Body: { question: string, connection?: { host, port, user, password, database } }
 * Requires: JWT auth (req.user set by requireAuth middleware)
 */
export async function createChat(req, res) {
  const { question, connection } = req.body;
  const normalizedQuestion = typeof question === 'string' ? question.trim() : '';

  if (!normalizedQuestion) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    const agentResponse = await callAgentService(normalizedQuestion, connection);

    const newChat = await Chat.create({
      userId: req.user.id,           // ← scope to the logged-in user
      question: normalizedQuestion,
      sql: agentResponse.sql || null,
      analysis: agentResponse.analysis || null,
      columns: agentResponse.columns || [],
      rows: agentResponse.rows || [],
      row_count: agentResponse.row_count || 0,
      chart_config: agentResponse.chart_config || null,
      recommendations: agentResponse.recommendations || [],
      followups: agentResponse.followups || [],
      decision: agentResponse.decision || 'fallback'
    });
    
    const entry = {
      ...newChat.toObject(),
      id: newChat._id,
      timestamp: newChat.createdAt
    };

    return res.json(entry);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/chat/history
 * Returns only the chat history for the currently authenticated user.
 * Requires: JWT auth (req.user set by requireAuth middleware)
 */
export async function listHistory(req, res) {
  try {
    const rawChats = await Chat.find({ userId: req.user.id })  // ← filter by user
      .sort({ createdAt: -1 })
      .limit(50);

    const chats = rawChats.map(chat => ({
      ...chat.toObject(),
      id: chat._id,
      timestamp: chat.createdAt
    })).reverse(); // Reverse to return chronologically

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list chat history' });
  }
}

