const GITHUB_TOKEN = process.env.GITHUB_TOKEN!
const GITHUB_REPO = process.env.GITHUB_REPO! // format: "owner/repo"
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main'

const headers = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
}

interface GitHubFile {
  content: string
  sha: string
  encoding: string
}

async function getFile(path: string): Promise<GitHubFile> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`,
    { headers, cache: 'no-store' }
  )
  if (!res.ok) throw new Error(`GitHub getFile failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function putFile(path: string, content: string, sha: string, message: string) {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message,
        content: Buffer.from(content).toString('base64'),
        sha,
        branch: GITHUB_BRANCH,
      }),
    }
  )
  if (!res.ok) throw new Error(`GitHub putFile failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function createFile(path: string, contentBase64: string, message: string) {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message,
        content: contentBase64,
        branch: GITHUB_BRANCH,
      }),
    }
  )
  if (!res.ok) throw new Error(`GitHub createFile failed: ${res.status} ${await res.text()}`)
  return res.json()
}

// ---------- DATA.JS OPERATIONS ----------

export async function getDataJs(): Promise<{ content: string; sha: string }> {
  const file = await getFile('lib/data.js')
  const content = Buffer.from(file.content, 'base64').toString('utf-8')
  return { content, sha: file.sha }
}

export async function getEvents(): Promise<Array<Record<string, unknown>>> {
  const { content } = await getDataJs()
  // Extract the EXIT_EVENTS array from the JS file
  const match = content.match(/export\s+const\s+EXIT_EVENTS\s*=\s*(\[[\s\S]*\])/)
  if (!match) throw new Error('Could not parse EXIT_EVENTS from data.js')

  // Convert JS object notation to JSON-parseable format
  let jsonStr = match[1]
  // Remove single-line comments
  jsonStr = jsonStr.replace(/\/\/.*$/gm, '')
  // Convert single quotes to double quotes (basic)
  jsonStr = jsonStr.replace(/'/g, '"')
  // Add quotes to unquoted keys
  jsonStr = jsonStr.replace(/(\s)(\w+)(\s*:)/g, '$1"$2"$3')
  // Remove trailing commas
  jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1')

  return JSON.parse(jsonStr)
}

function getNextId(events: Array<Record<string, unknown>>): number {
  const maxId = Math.max(...events.map(e => Number(e.id) || 0))
  return maxId + 1
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function formatEventEntry(event: Record<string, unknown>): string {
  const lines: string[] = []
  lines.push('  {')

  const order = ['id', 'name', 'date', 'day', 'month', 'weekday', 'location', 'city', 'tags', 'moods', 'artists', 'seal', 'campaign', 'img', 'link', 'sortDate', 'parentEventId', 'isWhatsApp', 'description']

  for (const key of order) {
    if (!(key in event) || event[key] === undefined) continue
    const val = event[key]

    if (Array.isArray(val)) {
      const items = val.map(v => `'${v}'`).join(', ')
      lines.push(`    ${key}: [${items}],`)
    } else if (typeof val === 'string') {
      // Escape single quotes in value
      const escaped = (val as string).replace(/'/g, "\\'")
      lines.push(`    ${key}: '${escaped}',`)
    } else if (typeof val === 'boolean') {
      lines.push(`    ${key}: ${val},`)
    } else {
      lines.push(`    ${key}: ${val},`)
    }
  }

  lines.push('  },')
  return lines.join('\n')
}

export async function addEvent(eventData: Record<string, unknown>, flyerBase64?: string, flyerExtension?: string): Promise<{ success: boolean; commitUrl?: string; error?: string }> {
  try {
    const { content, sha } = await getDataJs()
    const events = await getEvents()
    const newId = getNextId(events)

    const slug = slugify(eventData.name as string)
    const ext = flyerExtension || 'webp'
    const imgPath = `/imagens/eventos/${slug}.${ext}`

    // Upload flyer if provided
    if (flyerBase64) {
      await createFile(
        `public${imgPath}`,
        flyerBase64,
        `feat: add flyer ${slug}.${ext}`
      )
    }

    const fullEvent = {
      ...eventData,
      id: newId,
      img: imgPath,
    }

    // Find the closing bracket of the array and insert before it
    const lastBracket = content.lastIndexOf(']')
    if (lastBracket === -1) throw new Error('Could not find array end in data.js')

    const newEntry = formatEventEntry(fullEvent)
    const newContent = content.slice(0, lastBracket) + newEntry + '\n' + content.slice(lastBracket)

    const result = await putFile(
      'lib/data.js',
      newContent,
      sha,
      `feat: add event "${eventData.name}" (id: ${newId})`
    )

    return { success: true, commitUrl: result.commit?.html_url }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateEvent(eventId: number, changes: Record<string, unknown>): Promise<{ success: boolean; commitUrl?: string; error?: string }> {
  try {
    const { content, sha } = await getDataJs()

    // Find the event block by id
    // Look for the pattern: id: <eventId>,
    const idPattern = new RegExp(`(\\{[^}]*?id:\\s*${eventId}\\s*,[^}]*?\\})`, 's')

    // Simpler approach: find "id: XX," and then modify fields within that event block
    // We need to find the event block boundaries
    const idMarker = `id: ${eventId},`
    const idIndex = content.indexOf(idMarker)
    if (idIndex === -1) throw new Error(`Event with id ${eventId} not found`)

    // Find the opening { before this id
    let blockStart = content.lastIndexOf('{', idIndex)
    // Find the closing }, after
    let depth = 1
    let blockEnd = blockStart + 1
    while (depth > 0 && blockEnd < content.length) {
      if (content[blockEnd] === '{') depth++
      if (content[blockEnd] === '}') depth--
      blockEnd++
    }
    // Include trailing comma if present
    if (content[blockEnd] === ',') blockEnd++

    const oldBlock = content.slice(blockStart, blockEnd)
    let newBlock = oldBlock

    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined) continue

      let newValue: string
      if (Array.isArray(value)) {
        newValue = `[${value.map(v => `'${v}'`).join(', ')}]`
      } else if (typeof value === 'string') {
        newValue = `'${value.replace(/'/g, "\\'")}'`
      } else if (typeof value === 'boolean' || typeof value === 'number') {
        newValue = String(value)
      } else {
        continue
      }

      // Try to replace existing field
      const fieldPattern = new RegExp(`(${key}:\\s*)(?:'[^']*'|"[^"]*"|\\[[^\\]]*\\]|\\d+|true|false)`, 's')
      if (fieldPattern.test(newBlock)) {
        newBlock = newBlock.replace(fieldPattern, `$1${newValue}`)
      } else {
        // Add new field before closing }
        const closingBrace = newBlock.lastIndexOf('}')
        newBlock = newBlock.slice(0, closingBrace) + `    ${key}: ${newValue},\n  ` + newBlock.slice(closingBrace)
      }
    }

    const newContent = content.slice(0, blockStart) + newBlock + content.slice(blockEnd)

    const changedFields = Object.keys(changes).join(', ')
    const result = await putFile(
      'lib/data.js',
      newContent,
      sha,
      `update: event #${eventId} — ${changedFields}`
    )

    return { success: true, commitUrl: result.commit?.html_url }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
