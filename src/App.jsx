import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import './App.css'

const BATCH_SIZE = 60
const TOTAL_POKEMON = 1025

const TYPE_COLORS = {
  normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
  grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
  ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
  rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705746',
  steel: '#B7B7CE', fairy: '#D685AD',
}

function getOpaqueTypeTint(type, blendAmount) {
  const color = TYPE_COLORS[type] || '#777777'
  const red = Math.round(parseInt(color.slice(1, 3), 16) * blendAmount + 255 * (1 - blendAmount))
  const green = Math.round(parseInt(color.slice(3, 5), 16) * blendAmount + 255 * (1 - blendAmount))
  const blue = Math.round(parseInt(color.slice(5, 7), 16) * blendAmount + 255 * (1 - blendAmount))
  return `rgb(${red}, ${green}, ${blue})`
}

function getModalTint(type) {
  return getOpaqueTypeTint(type, 0.18)
}

function getDetailImageTint(type) {
  return getOpaqueTypeTint(type, 0.4)
}

function getTypeBorderColor(type) {
  const color = TYPE_COLORS[type] || '#777777'
  const red = Math.round(parseInt(color.slice(1, 3), 16) * 0.7)
  const green = Math.round(parseInt(color.slice(3, 5), 16) * 0.7)
  const blue = Math.round(parseInt(color.slice(5, 7), 16) * 0.7)
  return `rgb(${red}, ${green}, ${blue})`
}

function getTypeBackground(types, blendAmount) {
  const typeNames = types?.map((type) => type.type.name) || []
  const colors = typeNames.slice(0, 2).map((type) => getOpaqueTypeTint(type, blendAmount))

  if (colors.length > 1) {
    return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
  }

  return colors[0] || getOpaqueTypeTint(undefined, blendAmount)
}

function formatName(str) {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function padId(id) {
  return `#${String(id).padStart(3, '0')}`
}

function TypeBadge({ type }) {
  const color = TYPE_COLORS[type] || '#777'
  return (
    <span className="type-badge" style={{ backgroundColor: color }}>
      {formatName(type)}
    </span>
  )
}

function PokemonCard({ pokemon, onClick }) {
  const image = pokemon.sprites?.other?.showdown?.front_default
  const firstAbility = pokemon.abilities?.[0]?.ability?.name
  const primaryType = pokemon.types?.[0]?.type?.name

  return (
    <div
      className="pokemon-card"
      style={{
        borderColor: getTypeBorderColor(primaryType),
        background: getTypeBackground(pokemon.types, 0.14),
      }}
      onClick={() => onClick(pokemon.id)}
    >
      <div className="card-header">
        <h3>{formatName(pokemon.name)}</h3>
        <span className="card-id">{padId(pokemon.id)}</span>
      </div>

      <div className="card-image-box" style={{ background: getTypeBackground(pokemon.types, 0.4) }}>
        {image ? (
          <img src={image} alt={pokemon.name} />
        ) : (
          <span className="no-image">No image</span>
        )}
      </div>

      <div className="card-footer">
        <div className="type-row">
          {pokemon.types.map((t) => (
            <TypeBadge key={t.type.name} type={t.type.name} />
          ))}
        </div>
        <p className="card-detail">
          Ability: {firstAbility ? formatName(firstAbility) : 'Unknown'}
        </p>
        <p className="card-detail">
          Base XP: {pokemon.base_experience ?? 'N/A'}
        </p>
      </div>
    </div>
  )
}

function StatBar({ label, value }) {
  const maxStat = 255 // highest possible base stat in the games
  const percent = Math.min((value / maxStat) * 100, 100)
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <div className="stat-track">
        <div className="stat-fill" style={{ width: `${percent}%` }} />
      </div>
      <span className="stat-value">{value}</span>
    </div>
  )
}

function DetailView({ pokemon, onClose }) {
  const image = pokemon.sprites?.other?.["official-artwork"]?.front_default
  const primaryType = pokemon.types?.[0]?.type?.name
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="detail-view"
        style={{ backgroundColor: getModalTint(primaryType) }}
        role="dialog"
        aria-modal="true"
        aria-label={`${formatName(pokemon.name)} details`}
      >
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close details">
          X
        </button>

        <div className="detail-body">
          <div className="detail-image-box" style={{ backgroundColor: getDetailImageTint(primaryType) }}>
            {image ? <img src={image} alt={pokemon.name} /> : <span className="no-image">No image</span>}
          </div>

          <div className="detail-info">
            <div className="detail-header">
              <h2>{formatName(pokemon.name)}</h2>
              <span className="detail-id">{padId(pokemon.id)}</span>
            </div>

            <div className="type-row">
              {pokemon.types.map((t) => (
                <TypeBadge key={t.type.name} type={t.type.name} />
              ))}
            </div>

            <div className="measurements">
              <span><strong>Height:</strong> {(pokemon.height / 10).toFixed(1)} m</span>
              <span><strong>Weight:</strong> {(pokemon.weight / 10).toFixed(1)} kg</span>
              <span><strong>Base XP:</strong> {pokemon.base_experience ?? 'N/A'}</span>
            </div>

            <div className="abilities">
              <strong>Abilities:</strong>
              <ul>
                {pokemon.abilities.map((a) => (
                  <li key={a.ability.name}>
                    {formatName(a.ability.name)}
                    {a.is_hidden && <span className="hidden-tag"></span>}
                  </li>
                ))}
              </ul>
            </div>

            <div className="stats-section">
              <div className="stats-container">
                <strong>Base Stats</strong>
                {pokemon.stats.map((s) => (
                  <StatBar key={s.stat.name} label={formatName(s.stat.name)} value={s.base_stat} />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [pokemonList, setPokemonList] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingGrid, setLoadingGrid] = useState(true)
  const [gridError, setGridError] = useState('')
  const pageCache = useRef(new Map())
  const totalPages = Math.ceil(TOTAL_POKEMON / BATCH_SIZE)

  const [searchInput, setSearchInput] = useState('')
  const [searchedPokemon, setSearchedPokemon] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')

  useEffect(() => {
    let cancelled = false
    const cachedPage = pageCache.current.get(currentPage)
    const startId = (currentPage - 1) * BATCH_SIZE + 1
    const endId = Math.min(currentPage * BATCH_SIZE, TOTAL_POKEMON)

    window.scrollTo({ top: 0, behavior: 'smooth' })

    if (cachedPage) {
      Promise.resolve().then(() => {
        if (cancelled) return
        setPokemonList(cachedPage)
        setLoadingGrid(false)
      })
      return () => {
        cancelled = true
      }
    }

    const ids = Array.from({ length: endId - startId + 1 }, (_, index) => startId + index)
    Promise.all(
      ids.map((id) =>
        axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`).then((res) => res.data)
      )
    )
      .then((results) => {
        if (cancelled) return
        pageCache.current.set(currentPage, results)
        setPokemonList(results)
      })
      .catch((err) => {
        if (cancelled) return
        console.error(`Failed to load Pokemon page ${currentPage}:`, err)
        setPokemonList([])
        setGridError(`Could not load page ${currentPage}. Please try again.`)
      })
      .finally(() => {
        if (!cancelled) setLoadingGrid(false)
      })

    return () => {
      cancelled = true
    }
  }, [currentPage])

  function handlePageChange(page) {
    setGridError('')
    setLoadingGrid(true)
    setCurrentPage(page)
  }

  const windowStart = Math.min(
    Math.max(currentPage - 2, 1),
    Math.max(totalPages - 4, 1)
  )
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => windowStart + index
  )

  function handleSearchInputChange(e) {
    const value = e.target.value
    setSearchInput(value)
    if (!value.trim()) {
      setSearchedPokemon(null)
      setSearchError('')
    }
  }

  async function handleSearch(e) {
    e.preventDefault()
    const query = searchInput.trim().toLowerCase()
    if (!query) return

    setSearchLoading(true)
    setSearchError('')
    try {
      const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${query}`)
      setSearchedPokemon(res.data)
    } catch {
      setSearchedPokemon(null)
      setSearchError(`No Pokemon found for "${searchInput}"`)
    } finally {
      setSearchLoading(false)
    }
  }

  function handleDetailClose() {
    setSearchedPokemon(null)
    setSearchInput('')
  }

  function handleCardClick(idOrName) {
    setSearchInput(String(idOrName))
    setSearchLoading(true)
    setSearchError('')
    axios
      .get(`https://pokeapi.co/api/v2/pokemon/${idOrName}`)
      .then((res) => setSearchedPokemon(res.data))
      .catch(() => {
        setSearchedPokemon(null)
        setSearchError('Could not load that Pokemon')
      })
      .finally(() => setSearchLoading(false))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app">
      <h1 className="title">Pokedex</h1>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search Pokemon Name or ID"
          value={searchInput}
          onChange={handleSearchInputChange}
        />
        <button type="submit">Search</button>
      </form>

      {searchLoading && <p className="status-text">Searching...</p>}
      {searchError && <p className="status-text error">{searchError}</p>}
      {searchedPokemon && !searchLoading && (
        <DetailView
          pokemon={searchedPokemon}
          onClose={handleDetailClose}
        />
      )}

      {loadingGrid && <p className="status-text">Loading page {currentPage}...</p>}
      {gridError && <p className="status-text error">{gridError}</p>}

      <div className="pokemon-grid">
        {!loadingGrid &&
          pokemonList.map((p) => (
            <PokemonCard key={p.id} pokemon={p} onClick={handleCardClick} />
          ))}
      </div>

      <div className="pagination-container" aria-label="Pagination">
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || loadingGrid}
          aria-label="Previous page"
        >
          ←
        </button>
        {pageNumbers.map((page) => (
          <button
            type="button"
            key={page}
            className={page === currentPage ? 'current-page' : ''}
            onClick={() => handlePageChange(page)}
            disabled={page === currentPage || loadingGrid}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loadingGrid}
          aria-label="Next page"
        >
          →
        </button>
      </div>
    </div>
  )
}

export default App