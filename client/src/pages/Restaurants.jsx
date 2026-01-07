import React, { useEffect, useState } from 'react'
import RestaurantInfo from './RestaurantInfos'

export default function Restaurants() {
  const [checking, setChecking] = useState(true)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      // Redirect to login when token is missing (SPA pushState + notify)
      window.history.pushState({}, '', '/login')
      window.dispatchEvent(new PopStateEvent('popstate'))
      return
    }

    // Validate token with server to ensure it's valid (not just present)
    ;(async () => {
      try {
        const res = await fetch('/auth/validate', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.status === 200) {
          setChecking(false)
          return
        }
      } catch (e) {
        // ignore
      }
      // invalid -> redirect
      localStorage.removeItem('accessToken')
      window.history.pushState({}, '', '/login')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })()
  }, [])

  if (checking) {
    return (
      <div style={{ padding: 24 }}>
        <main className="card">
          <p>Vérification des droits…</p>
        </main>
      </div>
    )
  }

  function RestaurantsList({ showFavoritesOnly }) {
    const [restaurants, setRestaurants] = React.useState(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState(null)
    const [favoritesSet, setFavoritesSet] = React.useState(new Set())

    React.useEffect(() => {
      let mounted = true
      const token = localStorage.getItem('accessToken')
      ;(async () => {
        try {
          const res = await fetch('/api/restaurants', {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          })
          if (!res.ok) throw new Error(`Erreur ${res.status}`)
          const data = await res.json()
          if (mounted) {
            const base = Array.isArray(data) ? data : []
            // initialize without favorite flag
            setRestaurants(base.map((r) => ({ ...r, favori: false })))
            // try to fetch user favorites when token present
            if (token) {
              try {
                const favRes = await fetch('/api/user-restaurants/me', {
                  headers: { Authorization: `Bearer ${token}` }
                })
                if (favRes.ok) {
                  const favRows = await favRes.json()
                  const favIds = new Set(
                    (Array.isArray(favRows) ? favRows : []).filter((row) => Array.isArray(row.status) && row.status.includes('favori')).map((row) => row.restaurant_mongo_id)
                  )
                  setFavoritesSet(favIds)
                  setRestaurants((prev) => prev.map((r) => ({ ...r, favori: favIds.has(r.dataId) })))
                }
              } catch (e) {
                // ignore favorites fetch errors
              }
            }
            setLoading(false)
          }
        } catch (err) {
          if (mounted) {
            setError(err.message || 'Erreur lors de la récupération')
            setLoading(false)
          }
        }
      })()
        // listen for favorite changes from other components
        const onFavChange = (e) => {
          try {
            const d = e && e.detail
            if (!d || !d.restaurantId) return
            setFavoritesSet((prev) => {
              const next = new Set(prev)
              // match by restaurantId which may be dataId or _id; normalize by updating restaurants list
              const matchIndex = (restaurants || []).findIndex(r => r.dataId === d.restaurantId || r._id === d.restaurantId || r.id === d.restaurantId)
              if (d.favori) next.add(d.restaurantId)
              else next.delete(d.restaurantId)
              // update restaurants array to reflect change
              if (matchIndex >= 0) {
                setRestaurants((prevArr) => prevArr.map((r) => {
                  if (r.dataId === d.restaurantId || r._id === d.restaurantId || r.id === d.restaurantId) return { ...r, favori: !!d.favori }
                  return r
                }))
              }
              return next
            })
          } catch (e) {}
        }
        window.addEventListener('user-restaurants-changed', onFavChange)
      return () => {
        mounted = false
          window.removeEventListener('user-restaurants-changed', onFavChange)
      }
    }, [])

    if (loading) return <p>Chargement des restaurants…</p>
    if (error) return <p style={{ color: 'red' }}>{error}</p>
    if (!restaurants || restaurants.length === 0) return <p>Aucun restaurant trouvé.</p>

    function normalizeThumb(url) {
      if (!url) return null
      // protocol-relative //example.com/image -> add https:
      if (url.startsWith('//')) return `https:${url}`
      // relative path starting with / -> assume backend
      if (url.startsWith('/')) {
        // Use environment variable if available (prod), else fallback to localhost (dev)
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        return apiBase + url
      }
      return url
    }

    const placeholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="12">No image</text></svg>'

    return (
      <article>
        {restaurants.map((r) => {
          const id = r.id || r._id
          const key = id || JSON.stringify(r)
          const go = () => {
            if (id) {
              // navigate using history.pushState so URL becomes /restaurants/:id
              window.history.pushState({}, '', `/restaurants/${id}`)
              window.dispatchEvent(new PopStateEvent('popstate'))
            }
          }
          if (showFavoritesOnly && !r.favori) return null

          return (
            <div
              key={key}
              id={key}
              onClick={go}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  go()
                }
              }}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center', padding: 8 }}
            >
              <img
                src={normalizeThumb(r.thumbnail) || placeholder}
                alt={`Photo de ${r.title || 'du restaurant'}`}
                style={{ width: 32, height: 32, objectFit: 'cover', verticalAlign: 'middle', marginRight: 8 }}
                loading="lazy"
                onError={(e) => {
                  // log the failing url once for easier debugging
                  try {
                    // eslint-disable-next-line no-console
                    console.warn('Image failed to load:', r.thumbnail)
                  } catch (err) {}
                  e.currentTarget.src = placeholder
                }}
              />
              <div>
                <p style={{ margin: 0, fontWeight: 'bold' }}>{r.title || 'Sans nom'}</p>
                <p style={{ margin: 0 }}>{r.address}</p>
                <p style={{ margin: 0 }}>{'Note : ' + (r.rating ?? 'N/A')}</p>
                <p style={{ margin: 0 }}>{'Nombre d\'avis : ' + (r.reviews ?? 0)}</p>
              </div>
            </div>
          )
        })}
      </article>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <nav style={{ marginBottom: 12 }}>
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault()
            window.history.pushState({}, '', '/')
            window.dispatchEvent(new PopStateEvent('popstate'))
          }}
        >
          Accueil
        </a>{' '}
        | <strong>Restaurants</strong>
      </nav>

      <main className="card" id="mainRestaurants" style={{ padding: 16 }}>
        <h2>Liste des Restaurants</h2>

        {/* Barre de recherche fonctionnelle */}
        <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <label htmlFor="restaurantSearch" style={{ display: 'none' }}>
            Recherche
          </label>
          <input
            id="restaurantSearch"
            type="search"
            placeholder="Rechercher par nom"
            aria-label="Rechercher des restaurants"
            style={{ flex: 1, padding: '8px 10px' }}
            onChange={(e) => {
              const q = (e.target.value || '').trim().toLowerCase()
              const items = document.querySelectorAll('#mainRestaurants article [role="button"]')
              let visible = 0
              items.forEach((el) => {
                // Match only the restaurant name (first <p> inside the button)
                const titleEl = el.querySelector('p')
                const nameText = (titleEl?.textContent || '').toLowerCase()
                const match = q === '' || nameText.includes(q)
                el.style.display = match ? 'flex' : 'none'
                if (match) visible += 1
              })
            }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={showFavoritesOnly}
              onChange={(e) => setShowFavoritesOnly(e.target.checked)}
            />
            <span style={{ fontSize: 14 }}>Afficher seulement les favoris</span>
          </label>
        </div>

        <RestaurantsList showFavoritesOnly={showFavoritesOnly} />
      </main>

      <RestaurantInfo />
    </div>
  )
}

