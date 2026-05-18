export async function api(url: string, options?: RequestInit) {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
    const res = await fetch(base + url, options)
    const text = await res.text()
    try {
        return JSON.parse(text)
    } catch {
        throw new Error(`Server returned an unexpected response (${res.status}): ${text.slice(0, 120)}`)
    }
}