export async function api(url: string, options?: RequestInit) {
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + url, options)
    console.log('api call', process.env.NEXT_PUBLIC_API_URL + url)
    return res.json()
}