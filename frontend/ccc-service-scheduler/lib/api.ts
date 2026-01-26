export async function api(url: string, options?: RequestInit) {
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + url, options)
    return res.json()
}