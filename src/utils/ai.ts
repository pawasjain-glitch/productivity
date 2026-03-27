import Anthropic from '@anthropic-ai/sdk'
import type { Project, SectionType } from '../types'

let client: Anthropic | null = null

export function initAI(apiKey: string) {
  if (!apiKey) { client = null; return }
  client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
}

export async function detectProjectFromText(
  text: string,
  projects: Project[]
): Promise<{ projectId: string | null; confidence: number; section: SectionType }> {
  if (!client || projects.length === 0) {
    return { projectId: null, confidence: 0, section: 'tasks' }
  }

  const projectList = projects.map(p => `- ${p.name} (id: ${p.id}): ${p.description}`).join('\n')

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Given these projects:\n${projectList}\n\nWhich project does this text relate to? Also determine what type of item it is.\n\nText: "${text}"\n\nRespond with JSON only: {"projectId": "id or null", "confidence": 0-1, "section": "todos|tasks|followups|conversations|ideas|management|meetings|notes"}`
      }]
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') throw new Error('No text response')

    const json = textBlock.text.match(/\{[\s\S]*\}/)
    if (!json) throw new Error('No JSON')

    return JSON.parse(json[0])
  } catch {
    return { projectId: null, confidence: 0, section: 'tasks' }
  }
}

export async function parseBriefing(
  rawText: string,
  projects: Project[]
): Promise<{ projectId: string | null; text: string; type: SectionType }[]> {
  if (!client) return []

  const projectList = projects.map(p => `- ${p.name} (id: ${p.id}): ${p.description}`).join('\n')

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      thinking: { type: 'adaptive' } as any,
      messages: [{
        role: 'user',
        content: `You are a productivity assistant. Parse this daily briefing and categorize each item into the appropriate project and section.\n\nProjects:\n${projectList}\n\nSection types: todos (simple tasks), tasks (complex work items), followups (people to follow up with), conversations (ongoing discussions), ideas (brainstorming), management (items to discuss with management), meetings (scheduled meetings), notes (reference info)\n\nBriefing text:\n${rawText}\n\nReturn a JSON array of items: [{"projectId": "id or null", "text": "item text", "type": "section type"}]\n\nReturn ONLY the JSON array, no explanation.`
      }]
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') return []

    const json = textBlock.text.match(/\[[\s\S]*\]/)
    if (!json) return []

    return JSON.parse(json[0])
  } catch {
    return []
  }
}

export async function generateProjectSummary(
  projectName: string,
  items: { type: string; content: string }[]
): Promise<string> {
  if (!client) return 'Connect your Anthropic API key to generate AI summaries.'

  const itemList = items.map(i => `[${i.type}] ${i.content}`).join('\n')

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Give a concise 2-3 sentence executive summary of the current state of project "${projectName}" based on these items:\n\n${itemList}\n\nFocus on progress, blockers, and next priorities. Keep it direct and actionable.`
      }]
    })

    const textBlock = response.content.find(b => b.type === 'text')
    return textBlock?.type === 'text' ? textBlock.text : ''
  } catch {
    return 'Unable to generate summary. Check your API key.'
  }
}

export async function smartSuggestSection(text: string): Promise<SectionType> {
  if (!client) return 'tasks'

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 64,
      messages: [{
        role: 'user',
        content: `Classify this text into exactly one category: todos|tasks|followups|conversations|ideas|management|meetings|notes\n\nText: "${text}"\n\nRespond with only the category name.`
      }]
    })
    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') return 'tasks'
    const section = textBlock.text.trim().toLowerCase() as SectionType
    const valid: SectionType[] = ['todos', 'tasks', 'followups', 'conversations', 'ideas', 'management', 'meetings', 'notes']
    return valid.includes(section) ? section : 'tasks'
  } catch {
    return 'tasks'
  }
}
