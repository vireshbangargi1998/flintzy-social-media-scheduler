import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertCircle, ArrowUpRight, CalendarDays, Check, ChevronDown, Clock3, ImagePlus, LayoutDashboard, LoaderCircle, Plus, RefreshCw, Search, Send, Settings2, Sparkles, X } from 'lucide-react'
import mockPosts from './data/posts.json'
import './App.css'

type Platform = 'Facebook' | 'Instagram' | 'X' | 'TikTok' | 'LinkedIn' | 'Threads' | 'Pinterest'
type PostStatus = 'scheduled' | 'published' | 'failed'
type Post = { id: string; content: string; platforms: Platform[]; mediaUrl?: string; scheduledAt: string; status: PostStatus; errorMessage?: string }
type StatusFilter = 'all' | PostStatus
const PLATFORM_LIMITS: Record<Platform, number> = { X: 280, Instagram: 2200, TikTok: 2200, Facebook: 5000, LinkedIn: 3000, Threads: 500, Pinterest: 500 }
const PLATFORMS: Platform[] = ['Instagram', 'Facebook', 'X', 'TikTok', 'LinkedIn', 'Threads', 'Pinterest']
const STATUSES: StatusFilter[] = ['all', 'scheduled', 'published', 'failed']

function loadMockPosts(): Promise<Post[]> {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (new URLSearchParams(window.location.search).get('simulateError') === '1') {
        reject(new Error('Mock post service unavailable'))
        return
      }
      resolve(mockPosts as Post[])
    }, 350)
  })
}

function readFilters() {
  const params = new URLSearchParams(location.search)
  const platform = params.get('platform') || 'all'
  const status = params.get('status') || 'all'
  return { platform: PLATFORMS.includes(platform as Platform) ? platform : 'all', status: STATUSES.includes(status as StatusFilter) ? status as StatusFilter : 'all', search: params.get('q') || '' }
}
function localInputDate(date: Date) { return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }
function startOfLocalDay(date: Date) { return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) }
function dayLabel(value: string) {
  const date = new Date(value)
  const difference = Math.round((startOfLocalDay(date) - startOfLocalDay(new Date())) / 86400000)
  if (difference === 0) return 'Today'
  if (difference === 1) return 'Tomorrow'
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}
function PlatformMark({ platform, compact = false }: { platform: Platform; compact?: boolean }) {
  const className = `platform-mark platform-${platform.toLowerCase()}${compact ? ' compact' : ''}`
  const mark = platform === 'Instagram' ? '◎' : platform === 'Facebook' ? 'f' : platform === 'TikTok' ? '♪' : platform === 'LinkedIn' ? 'in' : platform === 'Pinterest' ? 'P' : platform === 'Threads' ? '@' : '𝕏'
  return <span className={className} title={platform}>{mark}</span>
}

function App() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [filters, setFilters] = useState(readFilters)
  const [composerOpen, setComposerOpen] = useState(false)
  const [retrying, setRetrying] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [content, setContent] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['Instagram'])
  const [mediaUrl, setMediaUrl] = useState('')
  const [scheduledAt, setScheduledAt] = useState(() => { const date = new Date(Date.now() + 30 * 60000); date.setSeconds(0, 0); return localInputDate(date) })
  const [formError, setFormError] = useState('')

  useEffect(() => {
    let active = true
    loadMockPosts()
      .then((loadedPosts) => { if (active) { setPosts(loadedPosts); setLoadState('ready') } })
      .catch(() => { if (active) setLoadState('error') })
    return () => { active = false }
  }, [])
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.platform !== 'all') params.set('platform', filters.platform)
    if (filters.status !== 'all') params.set('status', filters.status)
    if (filters.search.trim()) params.set('q', filters.search.trim())
    if (new URLSearchParams(location.search).get('simulateError') === '1') params.set('simulateError', '1')
    const query = params.toString()
    history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}`)
  }, [filters])
  useEffect(() => {
    const sync = () => setFilters(readFilters())
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  const visiblePosts = useMemo(() => posts
    .filter((post) => filters.platform === 'all' || post.platforms.includes(filters.platform as Platform))
    .filter((post) => filters.status === 'all' || post.status === filters.status)
    .filter((post) => post.content.toLowerCase().includes(filters.search.toLowerCase().trim()))
    .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt)), [posts, filters])
  const groups = useMemo(() => {
    const result = new Map<string, Post[]>()
    visiblePosts.forEach((post) => { const key = new Date(post.scheduledAt).toDateString(); result.set(key, [...(result.get(key) || []), post]) })
    return [...result.entries()]
  }, [visiblePosts])
  const counts = { scheduled: posts.filter((post) => post.status === 'scheduled').length, published: posts.filter((post) => post.status === 'published').length, failed: posts.filter((post) => post.status === 'failed').length }
  const overLimit = selectedPlatforms.filter((platform) => content.length > PLATFORM_LIMITS[platform])
  const canSchedule = Boolean(content.trim() && selectedPlatforms.length && !overLimit.length && scheduledAt && Date.parse(scheduledAt) > Date.now())
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  function updateFilter(key: keyof ReturnType<typeof readFilters>, value: string) { setFilters((current) => ({ ...current, [key]: value })) }
  function togglePlatform(platform: Platform) { setSelectedPlatforms((current) => current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform]) }
  function showNotice(message: string) { setNotice(message); window.setTimeout(() => setNotice(''), 3500) }

  async function retryLoadingPosts() {
    const params = new URLSearchParams(location.search)
    params.delete('simulateError')
    const query = params.toString()
    history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}`)
    setLoadState('loading')
    try {
      setPosts(await loadMockPosts())
      setLoadState('ready')
    } catch {
      setLoadState('error')
    }
  }

  async function retryPost(post: Post) {
    if (retrying.includes(post.id)) return
    setRetrying((current) => [...current, post.id])
    setPosts((current) => current.map((item) => item.id === post.id ? { ...item, status: 'scheduled', errorMessage: undefined } : item))
    await new Promise((resolve) => window.setTimeout(resolve, 1000))
    const failed = Math.random() < 0.2
    setPosts((current) => current.map((item) => item.id === post.id ? failed ? { ...post, errorMessage: 'Retry failed. Please check the account connection and try again.' } : { ...item, status: 'scheduled', errorMessage: undefined } : item))
    setRetrying((current) => current.filter((id) => id !== post.id))
    showNotice(failed ? 'Retry failed. Your post was restored to failed.' : 'Post added back to your queue.')
  }

  function schedulePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const date = new Date(scheduledAt)
    if (!content.trim()) return setFormError('Add some text before scheduling.')
    if (!selectedPlatforms.length) return setFormError('Choose at least one channel.')
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return setFormError('Choose a time in the future.')
    const exceeded = selectedPlatforms.find((platform) => content.length > PLATFORM_LIMITS[platform])
    if (exceeded) return setFormError(`Your post is over ${exceeded}'s ${PLATFORM_LIMITS[exceeded].toLocaleString()} character limit.`)
    const post: Post = { id: `p-${Date.now()}`, content: content.trim(), platforms: selectedPlatforms, ...(mediaUrl.trim() ? { mediaUrl: mediaUrl.trim() } : {}), scheduledAt: date.toISOString(), status: 'scheduled' }
    setPosts((current) => [...current, post]); setComposerOpen(false); setContent(''); setMediaUrl(''); setFormError(''); showNotice('Your post has been scheduled.')
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#queue" aria-label="Postroom home"><span className="brand-mark"><Send size={17} fill="currentColor" /></span><span>postroom<span className="brand-dot">.</span></span></a>
      <div className="workspace-switcher"><div className="workspace-avatar">S</div><div className="workspace-label"><span>Workspace</span><strong>Studio North</strong></div><ChevronDown size={15} /></div>
      <nav className="primary-nav" aria-label="Main navigation"><span className="nav-caption">PUBLISH</span>
        <button className="nav-link" onClick={() => updateFilter('status', 'all')}><LayoutDashboard size={17} /> Overview</button>
        <button className="nav-link active" onClick={() => updateFilter('status', 'all')}><CalendarDays size={17} /> Queue <span className="nav-count">{counts.scheduled}</span></button>
        <button className="nav-link" onClick={() => updateFilter('status', 'published')}><Check size={17} /> Published</button>
        <button className="nav-link" onClick={() => updateFilter('status', 'failed')}><AlertCircle size={17} /> Failed <span className="nav-count alert-count">{counts.failed}</span></button>
        <span className="nav-caption channel-caption">YOUR CHANNELS <button aria-label="Manage channels"><Plus size={14} /></button></span>
        {(['Instagram', 'TikTok', 'Facebook', 'X'] as Platform[]).map((platform) => <button key={platform} className={`channel-link${filters.platform === platform ? ' selected' : ''}`} onClick={() => updateFilter('platform', filters.platform === platform ? 'all' : platform)}><PlatformMark platform={platform} compact />{platform}<span className={`connection-dot connection-${platform.toLowerCase()}`} /></button>)}
      </nav>
      <div className="sidebar-bottom"><button className="nav-link"><Settings2 size={17} /> Settings</button><div className="user-card"><div className="user-avatar">AM</div><div><strong>Alex Morgan</strong><span>Admin</span></div><ChevronDown size={15} /></div></div>
    </aside>
    <main className="main-content" id="queue">
      <header className="topbar"><div className="breadcrumbs"><span>Studio North</span><span className="crumb-slash">/</span><strong>Queue</strong></div><div className="topbar-actions"><span className="today-date">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span><button className="avatar-button" title="Alex Morgan">AM</button></div></header>
      <div className="page-wrap">
        <section className="welcome-row"><div><p className="eyebrow"><span className="live-dot" /> YOUR PUBLISHING DESK</p><h1>Good morning, Alex<span className="heading-period">.</span></h1><p className="welcome-subtitle">A clear view of what's going out and what's next.</p></div><button className="primary-button" onClick={() => { setComposerOpen(true); setFormError('') }}><Plus size={17} strokeWidth={2.5} /> Compose post</button></section>
        <section className="stats-row" aria-label="Publishing overview">
          <article className="stat-block"><span className="stat-label">IN THE QUEUE</span><div className="stat-value">{loadState === 'ready' ? counts.scheduled : '--'}<span className="stat-unit">posts</span></div><div className="stat-note"><span className="stat-spark">↗</span> Ready for the week</div></article>
          <article className="stat-block"><span className="stat-label">PUBLISHED</span><div className="stat-value">{loadState === 'ready' ? counts.published : '--'}<span className="stat-unit">posts</span></div><div className="stat-note"><span className="stat-check">✓</span> Looking good</div></article>
          <article className="stat-block"><span className="stat-label">NEEDS ATTENTION</span><div className="stat-value">{loadState === 'ready' ? counts.failed : '--'}<span className="stat-unit">posts</span></div><div className="stat-note attention-note">{counts.failed ? 'A quick retry should do it' : 'All caught up'}</div></article>
          <div className="stat-illustration" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-center"><Sparkles size={20} /></div><span className="orbit-star star-one">✳</span><span className="orbit-star star-two">✦</span></div>
        </section>
        <section className="queue-section">
          <div className="section-heading"><div><div className="section-kicker">YOUR CONTENT CALENDAR</div><h2>Post queue <span className="queue-total">{visiblePosts.length}</span></h2></div><button className="calendar-link" onClick={() => updateFilter('status', 'scheduled')}><CalendarDays size={15} /> This week <ChevronDown size={14} /></button></div>
          <div className="filter-bar"><label className="search-box"><Search size={16} /><input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Search posts..." aria-label="Search post content" />{filters.search && <button aria-label="Clear search" onClick={() => updateFilter('search', '')}><X size={14} /></button>}<kbd>⌘ K</kbd></label><div className="filter-controls"><label className="select-wrap"><span className="sr-only">Filter by platform</span><select value={filters.platform} onChange={(event) => updateFilter('platform', event.target.value)}><option value="all">All channels</option>{PLATFORMS.map((platform) => <option key={platform}>{platform}</option>)}</select><ChevronDown size={14} /></label><label className="select-wrap status-select"><span className="sr-only">Filter by status</span><select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}><option value="all">All statuses</option><option value="scheduled">Scheduled</option><option value="published">Published</option><option value="failed">Failed</option></select><ChevronDown size={14} /></label></div></div>
          {loadState === 'loading' && <div className="loading-state"><LoaderCircle className="spin" size={22} /><span>Getting your queue ready...</span></div>}
          {loadState === 'error' && <div className="empty-state error-state"><AlertCircle size={23} /><h3>Couldn't load your posts</h3><p>The mock post service couldn't be reached. Try loading your queue again.</p><button className="secondary-button" onClick={() => void retryLoadingPosts()}><RefreshCw size={15} /> Try again</button></div>}
          {loadState === 'ready' && !visiblePosts.length && <div className="empty-state"><div className="empty-icon"><Search size={19} /></div><h3>No posts match those filters</h3><p>Try a different search or clear the filters to see your full queue.</p><button className="text-button" onClick={() => setFilters({ platform: 'all', status: 'all', search: '' })}>Clear filters <ArrowUpRight size={14} /></button></div>}
          {loadState === 'ready' && groups.map(([key, dayPosts]) => <div className="day-group" key={key}><div className="day-heading"><span>{dayLabel(dayPosts[0].scheduledAt)}</span><span className="day-count">{dayPosts.length} {dayPosts.length === 1 ? 'post' : 'posts'}</span><span className="day-line" /></div><div className="post-list">{dayPosts.map((post) => <article className={`post-row${post.status === 'failed' ? ' post-failed' : ''}`} key={post.id}><div className="post-time"><span className="time-dot" /><time dateTime={post.scheduledAt}>{new Date(post.scheduledAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</time></div><div className="post-main"><div className="post-platforms">{post.platforms.map((platform) => <PlatformMark key={platform} platform={platform} />)}</div><p className="post-copy">{post.content}</p>{post.errorMessage && post.status === 'failed' && <div className="post-error"><AlertCircle size={13} />{post.errorMessage}</div>}</div>{post.mediaUrl && <img className="post-thumbnail" src={post.mediaUrl} alt="Post attachment preview" loading="lazy" />}<div className="post-trailing"><span className={`status-pill status-${post.status}`}><span />{retrying.includes(post.id) ? 'Retrying' : post.status}</span>{post.status === 'failed' && <button className="retry-button" onClick={() => void retryPost(post)} disabled={retrying.includes(post.id)}>{retrying.includes(post.id) ? <LoaderCircle className="spin" size={14} /> : <RefreshCw size={13} />} Retry</button>}</div></article>)}</div></div>)}
          {loadState === 'ready' && visiblePosts.length > 0 && <div className="queue-end"><span /> That's everything for now <span /></div>}
        </section>
        <footer className="page-footer"><span>POSTROOM <span className="brand-dot">.</span></span><span>Times shown in your local timezone · {timezone}</span></footer>
      </div>
    </main>
    {notice && <div className="toast" role="status"><Check size={16} />{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={15} /></button></div>}
    {composerOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setComposerOpen(false) }}><section className="composer-modal" role="dialog" aria-modal="true" aria-labelledby="composer-title"><header className="composer-header"><div><span className="composer-eyebrow">MAKE SOMETHING GOOD</span><h2 id="composer-title">New post</h2></div><button className="icon-button" onClick={() => setComposerOpen(false)} aria-label="Close composer"><X size={18} /></button></header>
      <form onSubmit={schedulePost}><div className="composer-body"><label className="field-label" htmlFor="post-content">Post text</label><textarea id="post-content" className="post-textarea" placeholder="What's on your mind?" value={content} onChange={(event) => { setContent(event.target.value); setFormError('') }} autoFocus /><div className="editor-tools"><button type="button" className="tool-button" onClick={() => document.getElementById('media-url')?.focus()}><ImagePlus size={15} /> Add image URL</button><span>{content.length} characters</span></div><label className="url-input-wrap" htmlFor="media-url"><span className="sr-only">Optional image URL</span><input id="media-url" type="url" placeholder="https://image-url.com/photo.jpg (optional)" value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} /></label>{mediaUrl && <div className="image-preview"><img src={mediaUrl} alt="Selected post preview" onError={(event) => { event.currentTarget.style.display = 'none' }} /><span>Image preview</span></div>}
        <div className="field-section"><div className="field-label">Publish to</div><div className="platform-picker">{PLATFORMS.slice(0, 4).map((platform) => <button type="button" key={platform} onClick={() => togglePlatform(platform)} className={`platform-choice${selectedPlatforms.includes(platform) ? ' chosen' : ''}`}><PlatformMark platform={platform} compact /><span>{platform}</span>{selectedPlatforms.includes(platform) && <Check size={13} />}</button>)}</div></div>
        {!!selectedPlatforms.length && <div className="counter-list">{selectedPlatforms.map((platform) => <div key={platform} className={`counter-row${content.length > PLATFORM_LIMITS[platform] ? ' counter-over' : ''}`}><span><PlatformMark platform={platform} compact />{platform}</span><span>{content.length.toLocaleString()} <i>/</i> {PLATFORM_LIMITS[platform].toLocaleString()}</span></div>)}</div>}
        <div className="field-section schedule-field"><label className="field-label" htmlFor="scheduled-at">Schedule for</label><div className="datetime-wrap"><CalendarDays size={16} /><input id="scheduled-at" type="datetime-local" value={scheduledAt} min={localInputDate(new Date())} onChange={(event) => { setScheduledAt(event.target.value); setFormError('') }} /><Clock3 size={15} /></div><span className="timezone-note">Your local time · saved in UTC</span></div>{formError && <div className="form-error"><AlertCircle size={15} />{formError}</div>}
      </div><footer className="composer-footer"><span className="footer-time"><Clock3 size={14} />{timezone}</span><button className="primary-button schedule-button" type="submit" disabled={!canSchedule}><CalendarDays size={15} /> Schedule post</button></footer></form></section></div>}
  </div>
}
export default App
