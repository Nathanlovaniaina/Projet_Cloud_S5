import { useEffect, useState } from 'react'

async function probe(url = 'https://www.google.com/favicon.ico', timeout = 2500) {
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    // Use no-cors to avoid CORS failures for this tiny probe
    await fetch(url, { method: 'GET', mode: 'no-cors', signal: controller.signal })
    clearTimeout(id)
    return true
  } catch {
    return false
  }
}

export function isNavigatorOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : false
}

export function useConnectivity() {
  const [online, setOnline] = useState<boolean>(isNavigatorOnline())

  useEffect(() => {
    let mounted = true

    async function check() {
      // quick check navigator first
      if (isNavigatorOnline()) {
        // probe an external endpoint to confirm Internet access
        const ok = await probe()
        if (mounted) setOnline(!!ok)
      } else {
        if (mounted) setOnline(false)
      }
    }

    check()
    window.addEventListener('online', check)
    window.addEventListener('offline', check)
    const interval = setInterval(check, 30000)
    return () => {
      mounted = false
      clearInterval(interval)
      window.removeEventListener('online', check)
      window.removeEventListener('offline', check)
    }
  }, [])

  useEffect(() => {
    console.log('useConnectivity status:', online)
  }, [online])

  return online
}
