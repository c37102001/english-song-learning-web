import { useEffect, useMemo, useRef, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore'
import {
  ArrowLeft, BookOpen, Check, ChevronLeft, ChevronRight, CircleHelp,
  Flame, Headphones, ListMusic, LogOut, Medal, Music2, Pause,
  Play, Plus, RotateCcw, Save, Search, Shuffle, Sparkles, Star, Trash2, Trophy, Volume2, X,
} from 'lucide-react'
import { auth, db, firebaseReady } from './firebase'

const MODES = [
  { id: 'listen', label: '聆聽', icon: Headphones },
  { id: 'learn', label: '學習', icon: BookOpen },
  { id: 'compete', label: '比賽', icon: Trophy },
]

const LEVEL_OPTIONS = ['初級', '中級', '高級']
const PART_OPTIONS = [
  ['noun', 'noun 名詞'],
  ['verb', 'verb 動詞'],
  ['adjective', 'adjective 形容詞'],
  ['adverb', 'adverb 副詞'],
  ['preposition', 'preposition 介系詞'],
  ['phrase', 'phrase 片語'],
]

function useHashRoute() {
  const read = () => {
    const [, first, second] = location.hash.split('/')
    if (first === 'admin') return { admin: true, courseId: null, mode: 'admin' }
    return { admin: false, courseId: first || null, mode: second || 'listen' }
  }
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onHash = () => setRoute(read())
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])
  return route
}

function App() {
  const { courses, loading, error } = useCourses()
  const route = useHashRoute()

  if (route.admin) return <AdminDashboard />
  const course = courses.find(c => c.id === route.courseId)
  if (loading) return <div className="loading"><span className="logo-mark"><Music2 /></span><p>正在準備音樂教室…</p></div>
  if (error) return <SetupState title="Firebase 尚未連線" text={error} />
  if (course) return <Course course={course} mode={route.mode} />
  return <Home courses={courses} />
}

function useCourses({ includeDrafts = false, enabled = true } = {}) {
  const [state, setState] = useState({ courses: [], loading: true, error: '' })
  useEffect(() => {
    if (!enabled) {
      setState({ courses: [], loading: false, error: '' })
      return
    }
    if (!firebaseReady) {
      setState({ courses: [], loading: false, error: '請先建立 Firebase 專案，並在 .env.local 填入 VITE_FIREBASE_* 設定。' })
      return
    }
    const source = includeDrafts ? collection(db, 'courses') : query(collection(db, 'courses'), where('status', '==', 'published'))
    const unsubscribe = onSnapshot(source, snapshot => {
      const courses = snapshot.docs.map(courseFromDoc)
        .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999) || a.title.localeCompare(b.title))
      setState({ courses, loading: false, error: '' })
    }, error => {
      setState({ courses: [], loading: false, error: `無法讀取 Firestore courses：${error.message}` })
    })
    return unsubscribe
  }, [includeDrafts, enabled])
  return state
}

function courseFromDoc(snapshot) {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    title: data.title || '',
    artist: data.artist || '',
    level: data.level || '',
    youtubeUrl: data.youtubeUrl || youtubeUrlFromId(data.youtubeId || ''),
    srtText: data.srtText || '',
    translations: normalizeTranslations(data.translations),
    status: data.status || 'draft',
    order: data.order ?? 9999,
    words: Array.isArray(data.words) ? data.words.map(normalizeWord) : [],
  }
}

function normalizeWord(word) {
  return {
    en: word.en || '',
    zh: word.zh || '',
    part: word.part || '',
    example: word.example || '',
    exampleZh: word.exampleZh || '',
    hint: Array.isArray(word.hint) ? word.hint : ['', '', ''],
  }
}

function SetupState({ title, text }) {
  return <div className="setup-state">
    <Brand />
    <div><Music2 /><h1>{title}</h1><p>{text}</p><a href="#/admin">前往課程後台</a></div>
  </div>
}

function Brand({ compact = false }) {
  return <a className="brand" href="#/" aria-label="回首頁">
    <span className="logo-mark"><Music2 size={compact ? 18 : 22} /></span>
    <span>Song<span>lish</span></span>
  </a>
}

const youtubeThumbnail = youtubeUrl => `https://img.youtube.com/vi/${extractYoutubeId(youtubeUrl)}/hqdefault.jpg`

function Home({ courses }) {
  const [search, setSearch] = useState('')
  const filtered = courses.filter(c => `${c.title} ${c.artist}`.toLowerCase().includes(search.toLowerCase()))
  const totalWords = courses.reduce((n, c) => n + (c.words?.length || 0), 0)

  return <div className="home-page">
    <header className="home-nav container">
      <Brand />
      <nav><a href="#songs">探索歌曲</a><a href="#how">學習方式</a></nav>
      <a className="pill-button small" href="#/admin"><Plus size={16} /> 課程後台</a>
    </header>

    <main>
      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15} /> 讓每一句歌詞，都變成你的英文</div>
          <h1>跟著旋律，<br />唱出<span>自然英文。</span></h1>
          <p>從你喜歡的歌曲出發，聽懂歌詞、記住單字，再用遊戲挑戰自己。學英文，也可以很有節奏。</p>
          <div className="hero-actions">
            <a href="#songs" className="pill-button"><Play size={18} fill="currentColor" /> 選一首歌開始</a>
            <a href="#how" className="text-button">看看怎麼學 <ChevronRight size={18} /></a>
          </div>
          <div className="quick-stats">
            <div><strong>{courses.length}</strong><span>首精選歌曲</span></div>
            <i />
            <div><strong>{totalWords}+</strong><span>個實用單字</span></div>
            <i />
            <div><strong>3</strong><span>種學習模式</span></div>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="sun-shape" />
          <div className="record-card">
            <div className="record"><div><Music2 /></div></div>
            <div className="playing-bars"><i /><i /><i /><i /></div>
            <small>NOW LEARNING</small>
            <strong>You Are My Sunshine</strong>
            <span>♪ “You make me happy…”</span>
          </div>
          <div className="float-chip chip-one">☀️ <b>sunshine</b></div>
          <div className="float-chip chip-two"><Volume2 size={17} /> 跟著唸一次</div>
          <span className="scribble">la la la ♪</span>
        </div>
      </section>

      <section className="song-section" id="songs">
        <div className="container">
          <div className="section-heading">
            <div><span className="section-kicker">SONG LIBRARY</span><h2>今天想唱哪一首？</h2><p>挑一首熟悉的旋律，開始你的英文練習。</p></div>
            <label className="search"><Search size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜尋歌曲或歌手" /></label>
          </div>
          <div className="song-grid">
            {filtered.map((course, i) => <SongCard key={course.id} course={course} index={i} />)}
          </div>
          {!filtered.length && <div className="empty">{courses.length ? '找不到符合的歌曲，換個關鍵字試試看。' : '目前 Firebase 還沒有已發布課程，請先到課程後台新增並發布。'}</div>}
        </div>
      </section>

      <section className="how-section container" id="how">
        <span className="section-kicker">HOW IT WORKS</span><h2>一首歌，三種學法</h2>
        <div className="how-grid">
          <div><span className="how-icon peach"><Headphones /></span><em>01</em><h3>先聽懂</h3><p>同步歌詞跟著音樂前進，點任一句就能立刻重聽。</p></div>
          <div><span className="how-icon mint"><BookOpen /></span><em>02</em><h3>再記住</h3><p>用互動字卡、語音與漸進提示，把單字放進長期記憶。</p></div>
          <div><span className="how-icon blue"><Trophy /></span><em>03</em><h3>一起挑戰</h3><p>課堂分組搶答、即時計分，讓複習變成最期待的遊戲。</p></div>
        </div>
      </section>
    </main>
    <footer><Brand compact /><span>用音樂，讓英文留在腦海裡。</span><small>© 2026 Songlish</small></footer>
  </div>
}

function SongCard({ course, index }) {
  const hasYoutube = !!extractYoutubeId(course.youtubeUrl)
  return <a className="song-card" href={`#/${course.id}/listen`}>
    <div className="cover-wrap">
      {hasYoutube ? <img src={youtubeThumbnail(course.youtubeUrl)} alt={`${course.title} YouTube 縮圖`} /> : <div className="missing-thumbnail"><Music2 /><span>尚未設定 YouTube</span></div>}
      {course.level && <span className="level">{course.level}</span>}
      <span className="card-play"><Play fill="currentColor" /></span>
      <span className="track-num">0{index + 1}</span>
    </div>
    <div className="song-meta">
      <div><h3>{course.title}</h3><p>{course.artist}</p></div>
    </div>
    <div className="card-foot"><span><BookOpen size={15} /> {course.words?.length || 0} 個單字</span><span>開始學習 <ArrowLeft className="go-arrow" size={16} /></span></div>
  </a>
}

function Course({ course, mode }) {
  const selectedMode = MODES.some(m => m.id === mode) ? mode : 'listen'
  const hasYoutube = !!extractYoutubeId(course.youtubeUrl)
  return <div className="course-page">
    <header className="course-header">
      <Brand compact />
      <div className="course-title">{hasYoutube ? <img src={youtubeThumbnail(course.youtubeUrl)} alt={`${course.title} YouTube 縮圖`} /> : <span className="mini-placeholder"><Music2 size={17} /></span>}<div><small>正在學習</small><strong>{course.title}</strong></div></div>
      <a href="#/" className="exit-link"><X size={18} /> 離開課程</a>
    </header>
    <nav className="mode-tabs">
      {MODES.map(({ id, label, icon: Icon }) => <a key={id} className={selectedMode === id ? 'active' : ''} href={`#/${course.id}/${id}`}><Icon size={18} />{label}</a>)}
    </nav>
    <main className="mode-content">
      {selectedMode === 'listen' && <ListenMode course={course} />}
      {selectedMode === 'learn' && <LearnMode course={course} />}
      {selectedMode === 'compete' && <CompeteMode course={course} />}
    </main>
  </div>
}

function parseSrt(text) {
  const toSec = t => { const [h, m, rest] = t.replace(',', '.').split(':'); return +h * 3600 + +m * 60 + +rest }
  return text.trim().split(/\n\s*\n/).map(block => {
    const lines = block.trim().split('\n'); const times = lines[1]?.split(' --> ')
    return times ? { start: toSec(times[0]), end: toSec(times[1]), text: lines.slice(2).join(' ') } : null
  }).filter(Boolean)
}

function useYouTube(youtubeId) {
  const playerRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const elementId = useMemo(() => `youtube-player-${youtubeId}`, [youtubeId])

  useEffect(() => {
    if (!youtubeId) return
    let cancelled = false
    const makePlayer = () => {
      if (cancelled || playerRef.current || !window.YT?.Player) return
      playerRef.current = new window.YT.Player(elementId, {
        videoId: youtubeId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: e => { setReady(true); setDuration(e.target.getDuration()) },
          onStateChange: e => setPlaying(e.data === window.YT.PlayerState.PLAYING),
        },
      })
    }
    if (!window.YT) {
      const script = document.createElement('script'); script.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(script)
      const old = window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady = () => { old?.(); makePlayer() }
    } else if (window.YT.Player) makePlayer()
    return () => { cancelled = true; playerRef.current?.destroy?.(); playerRef.current = null }
  }, [youtubeId, elementId])

  useEffect(() => {
    const timer = setInterval(() => {
      if (playerRef.current?.getCurrentTime) setTime(playerRef.current.getCurrentTime() || 0)
    }, 250)
    return () => clearInterval(timer)
  }, [])
  const seek = t => { playerRef.current?.seekTo?.(t, true); setTime(t) }
  const seekAndPlay = t => {
    playerRef.current?.seekTo?.(t, true)
    playerRef.current?.playVideo?.()
    setTime(t)
  }
  const toggle = () => playing ? playerRef.current?.pauseVideo?.() : playerRef.current?.playVideo?.()
  return { elementId, ready, playing, time, duration, seek, seekAndPlay, toggle }
}

const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

function ListenMode({ course }) {
  const [lyrics, setLyrics] = useState([])
  const lyricsViewportRef = useRef(null)
  const lyricRefs = useRef([])
  const youtubeId = extractYoutubeId(course.youtubeUrl)
  const { elementId, ready, playing, time, duration, seek, seekAndPlay, toggle } = useYouTube(youtubeId)
  useEffect(() => {
    const lines = course.srtText ? parseSrt(course.srtText) : []
    setLyrics(lines.map((line, index) => ({ ...line, translation: course.translations?.[index] || '' })))
  }, [course.srtText, course.translations])
  const active = lyrics.findIndex((line, i) => time >= line.start && time < (line.end || lyrics[i + 1]?.start))

  useEffect(() => {
    if (!playing || active < 0) return
    const viewport = lyricsViewportRef.current
    const line = lyricRefs.current[active]
    if (!viewport || !line) return
    viewport.scrollTo({
      top: line.offsetTop - viewport.clientHeight / 2 + line.offsetHeight / 2,
      behavior: 'smooth',
    })
  }, [active, playing])

  if (!youtubeId) return <section className="empty-mode"><Music2 /><h2>這首課程還沒有 YouTube 影片</h2><p>請到課程後台填入 YouTube 連結。</p></section>

  return <section className="listen-layout">
    <div className="player-panel">
      <div className="mode-heading"><span className="round-icon coral"><Headphones /></span><div><span>LISTEN & FOLLOW</span><h1>跟著歌詞聽</h1></div></div>
      <p className="mode-intro">注意聽每一句的發音；點歌詞可以馬上跳到那一句。</p>
      <div className="video-shell"><div id={elementId} /></div>
      <div className="custom-controls">
        <button onClick={toggle} disabled={!ready} aria-label={playing ? '暫停' : '播放'}>{playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</button>
        <span>{formatTime(time)}</span>
        <input aria-label="影片時間軸" type="range" min="0" max={duration || 100} value={Math.min(time, duration || 100)} onChange={e => seek(+e.target.value)} />
        <span>{formatTime(duration)}</span>
        <span className="youtube-badge">YouTube</span>
      </div>
      <div className="listen-tip"><CircleHelp size={18} /><div><strong>聽不清楚嗎？</strong><span>點選右側歌詞，就能從那一句重新播放。</span></div></div>
    </div>
    <div className="lyrics-panel">
      <div className="lyrics-title"><div><ListMusic size={19} /><strong>同步歌詞</strong></div><span>{active >= 0 ? `第 ${active + 1} / ${lyrics.length} 句` : `共 ${lyrics.length || 0} 句`}</span></div>
      <div className="lyrics-viewport" ref={lyricsViewportRef}>
        <div className="lyrics-list">
          {lyrics.map((line, i) => <button ref={el => { lyricRefs.current[i] = el }} key={`${line.start}-${i}`} onClick={() => seekAndPlay(line.start)} className={i === active ? 'active' : ''}>
            <span>{String(i + 1).padStart(2, '0')}</span><p>{line.text}{line.translation && <small>{line.translation}</small>}</p>{i === active && <Volume2 size={18} />}
          </button>)}
        </div>
      </div>
    </div>
  </section>
}

function useFavorites(courseId) {
  const key = `songlish:favorites:${courseId}`
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem(key) || '[]'))
  const toggle = id => setFavorites(old => {
    const next = old.includes(id) ? old.filter(x => x !== id) : [...old, id]
    localStorage.setItem(key, JSON.stringify(next)); return next
  })
  return [favorites, toggle]
}

function LearnMode({ course }) {
  const [favorites, toggleFavorite] = useFavorites(course.id)
  const [onlyStarred, setOnlyStarred] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [showHints, setShowHints] = useState(true)
  const [autoPronounce, setAutoPronounce] = useState(true)
  const [frontLanguage, setFrontLanguage] = useState('en')
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [hintStep, setHintStep] = useState(0)
  const words = useMemo(() => {
    const list = onlyStarred ? course.words.filter(w => favorites.includes(wordKey(w))) : [...course.words]
    return shuffle ? [...list].sort((a, b) => wordKey(a).localeCompare(wordKey(b), 'en', { numeric: true }) * (Math.random() > .5 ? 1 : -1)) : list
  }, [course.words, favorites, onlyStarred, shuffle])
  useEffect(() => { setIndex(0); setFlipped(false); setHintStep(0) }, [onlyStarred, shuffle])
  const word = words[index]
  const resetCard = next => { setIndex(next); setFlipped(false); setHintStep(0) }
  const next = () => resetCard((index + 1) % words.length)
  const prev = () => resetCard((index - 1 + words.length) % words.length)
  const speak = (text) => { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = .82; speechSynthesis.speak(u) }
  const reveal = () => {
    if (!showHints) return setFlipped(v => !v)
    if (!flipped && hintStep < 3) setHintStep(v => v + 1)
    else setFlipped(v => !v)
  }

  useEffect(() => {
    if (!word || !autoPronounce) return
    const englishIsVisible = (!flipped && (showHints || frontLanguage === 'en')) || (flipped && !showHints && frontLanguage === 'zh')
    if (!englishIsVisible) return
    const timer = setTimeout(() => speak(word.en), 180)
    return () => clearTimeout(timer)
  }, [word ? wordKey(word) : '', flipped, showHints, frontLanguage, autoPronounce])

  return <section className="learn-mode">
    <div className="learn-top">
      <div className="mode-heading"><span className="round-icon mint"><BookOpen /></span><div><span>LEARN WITH CARDS</span><h1>單字字卡</h1></div></div>
      <div className="study-settings">
        <label><span>顯示提示<small>使用三階段提示</small></span><input type="checkbox" checked={showHints} onChange={e => { setShowHints(e.target.checked); setFlipped(false); setHintStep(0) }} /><i /></label>
        <label><span>自動發音<small>顯示英文時朗讀</small></span><input type="checkbox" checked={autoPronounce} onChange={e => setAutoPronounce(e.target.checked)} /><i /></label>
        {!showHints && <div className="front-language-setting"><span>字卡正面</span><div className="segmented"><button className={frontLanguage === 'zh' ? 'active' : ''} onClick={() => { setFrontLanguage('zh'); setFlipped(false) }}>中文</button><button className={frontLanguage === 'en' ? 'active' : ''} onClick={() => { setFrontLanguage('en'); setFlipped(false) }}>英文</button></div></div>}
        <div className="segmented"><button className={!onlyStarred ? 'active' : ''} onClick={() => setOnlyStarred(false)}>全部 {course.words.length}</button><button className={onlyStarred ? 'active' : ''} onClick={() => setOnlyStarred(true)}><Star size={15} fill={onlyStarred ? 'currentColor' : 'none'} /> 星號 {favorites.length}</button></div>
        <button className={`icon-text-button ${shuffle ? 'active' : ''}`} onClick={() => setShuffle(v => !v)}><Shuffle size={17} /> 隨機</button>
      </div>
    </div>

    {!word ? <div className="no-cards"><Star size={36} /><h2>還沒有加星號的單字</h2><p>切回「全部」，在想加強的單字卡右上角按星號。</p><button onClick={() => setOnlyStarred(false)}>查看全部單字</button></div> : <>
      <div className="study-progress"><span>學習進度</span><div><i style={{ width: `${((index + 1) / words.length) * 100}%` }} /></div><strong>{index + 1} / {words.length}</strong></div>
      <div className="card-stage">
        <button className="nav-card prev" onClick={prev}><ChevronLeft /></button>
        <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={reveal} role="button" tabIndex="0">
          <div className="card-face card-front">
            <div className="card-label"><span>{showHints || frontLanguage === 'en' ? '英文' : '中文'}</span><button onClick={e => { e.stopPropagation(); toggleFavorite(wordKey(word)) }} aria-label="加星號"><Star fill={favorites.includes(wordKey(word)) ? 'currentColor' : 'none'} /></button></div>
            <div className="word-main">
              {showHints || frontLanguage === 'en' ? <><small>{word.part}</small><h2>{word.en}</h2><button className="speak" onClick={e => { e.stopPropagation(); speak(word.en) }}><Volume2 /> 聽發音</button></> : <><small>{word.part}</small><h2>{word.zh}</h2></>}
            </div>
            {showHints && hintStep > 0 && <div className="hint-area"><div><CircleHelp size={18} /><span>提示 {hintStep} / 3</span></div>{word.hint.slice(0, hintStep).map((h, i) => <p key={i}><b>{i + 1}</b><span>{h}</span></p>)}</div>}
            <div className="flip-hint"><RotateCcw size={16} /> {showHints && hintStep < 3 ? '點一下顯示下一個提示' : '點一下翻面看答案'}</div>
          </div>
          <div className="card-face card-back">
            <div className="card-label"><span>{showHints || frontLanguage === 'en' ? '中文答案' : '英文答案'}</span><Check /></div>
            <div className="word-main"><small>{word.part}</small><h2>{showHints || frontLanguage === 'en' ? word.zh : word.en}</h2>{!showHints && frontLanguage === 'zh' && <button className="speak" onClick={e => { e.stopPropagation(); speak(word.en) }}><Volume2 /> 聽發音</button>}<p className="example">“{word.example}”{word.exampleZh && <span>{word.exampleZh}</span>}</p></div>
            <div className="flip-hint"><RotateCcw size={16} /> 點一下回到正面</div>
          </div>
        </div>
        <button className="nav-card next" onClick={next}><ChevronRight /></button>
      </div>
      <div className="mobile-card-nav"><button onClick={prev}><ChevronLeft /> 上一張</button><button onClick={next}>下一張 <ChevronRight /></button></div>
      <div className="keyboard-hint">小提示：你也可以點字卡翻面，按左右按鈕切換單字。</div>
    </>}
  </section>
}

function CompeteMode({ course }) {
  const courseWords = course.words || []
  const [scores, setScores] = useState([0, 0])
  const [selectedGame, setSelectedGame] = useState('menu')
  const [lyricsDifficulty, setLyricsDifficulty] = useState('easy')
  const [side, setSide] = useState('en')
  const [deck, setDeck] = useState(() => shuffleWords(courseWords))
  const [cardIndex, setCardIndex] = useState(0)
  const [answer, setAnswer] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [dealing, setDealing] = useState(false)
  const [questionKey, setQuestionKey] = useState(0)
  const [celebration, setCelebration] = useState(null)
  const [questionsComplete, setQuestionsComplete] = useState(false)
  const [gameEnded, setGameEnded] = useState(false)
  const [settlementPhase, setSettlementPhase] = useState(null)
  const word = deck[cardIndex]
  const isLastCard = cardIndex === deck.length - 1

  useEffect(() => {
    if (!celebration) return
    const timer = setTimeout(() => setCelebration(null), 1800)
    return () => clearTimeout(timer)
  }, [celebration])

  useEffect(() => {
    setDeck(shuffleWords(courseWords)); setCardIndex(0); setAnswer(false)
    setQuestionsComplete(false); setSelectedGame('menu')
  }, [course.id])

  useEffect(() => {
    if (settlementPhase !== 'drum') return
    const stopSound = playDrumRoll()
    const timer = setTimeout(() => setSettlementPhase('result'), 2900)
    return () => { clearTimeout(timer); stopSound?.() }
  }, [settlementPhase])

  const nextWord = () => {
    if (isLastCard) {
      setQuestionsComplete(true)
      setAnswer(false)
      return
    }
    setCardIndex(i => i + 1); setAnswer(false); setQuestionKey(k => k + 1)
  }
  const add = team => {
    setScores(s => s.map((n, i) => i === team ? n + 1 : n))
    setCelebration({ team, id: Date.now() })
  }
  const settleGame = () => {
    setGameEnded(true)
    setSettlementPhase('drum')
  }
  const startFlashGame = (language = 'en') => {
    setSide(language)
    setDeck(shuffleWords(courseWords)); setCardIndex(0); setAnswer(false)
    setQuestionsComplete(false); setQuestionKey(k => k + 1); setSelectedGame('flash'); setDealing(true)
    setTimeout(() => setDealing(false), window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 80 : 1900)
  }
  const restartGame = () => {
    setScores([0, 0]); setDeck(shuffleWords(courseWords)); setCardIndex(0)
    setAnswer(false); setQuestionsComplete(false); setGameEnded(false)
    setSettlementPhase(null); setQuestionKey(k => k + 1); setDealing(false); setSelectedGame('menu')
  }

  if (!courseWords.length) return <section className="empty-mode"><Trophy /><h2>這首課程還沒有單字</h2><p>請先到課程後台新增單字，才能使用比賽模式。</p></section>

  return <section className="compete-mode">
    <div className="compete-heading">
      <div className="mode-heading"><span className="round-icon blue"><Trophy /></span><div><span>CLASSROOM CHALLENGE</span><h1>雙隊搶答賽</h1></div></div>
      <div className="compete-header-actions">
        <button className="reset-button" onClick={() => setConfirmReset(true)}><RotateCcw size={16} /> 重設比分</button>
        <button className="settle-button" disabled={gameEnded} onClick={settleGame}><Trophy size={17} /> 結算成績</button>
      </div>
    </div>
    <div className="scoreboard">
      <TeamScore team="A" score={scores[0]} color="coral" disabled={gameEnded} celebrating={celebration?.team === 0} onAdd={() => add(0)} />
      <div className="challenge-center">
        {gameEnded ? <CompetitionEnded onRestart={restartGame} /> : selectedGame === 'menu' ? <GameSelector onSelect={game => setSelectedGame(`intro-${game}`)} /> : selectedGame === 'intro-flash' ? <GameInstructions type="flash" onBack={() => setSelectedGame('menu')} onStart={startFlashGame} /> : selectedGame === 'intro-match' ? <GameInstructions type="match" onBack={() => setSelectedGame('menu')} onStart={() => setSelectedGame('match')} /> : selectedGame === 'intro-lyrics' ? <GameInstructions type="lyrics" onBack={() => setSelectedGame('menu')} onStart={difficulty => { setLyricsDifficulty(difficulty); setSelectedGame('lyrics') }} /> : selectedGame === 'match' ? <MatchCardsGame words={courseWords} onScore={add} onBack={() => setSelectedGame('menu')} /> : selectedGame === 'lyrics' ? <LyricsOrderGame srtText={course.srtText} difficulty={lyricsDifficulty} onScore={add} onBack={() => setSelectedGame('menu')} /> : <>
          <button className="game-back-button" onClick={() => setSelectedGame('menu')}><ArrowLeft /> 選擇其他遊戲</button>
          <div className="round-label"><span>QUESTION</span><strong>{Math.min(cardIndex + 1, deck.length)} / {deck.length}</strong></div>
          <div className="question-language-badge">題目：{side === 'en' ? '英文' : '中文'}</div>
          <div className="competition-progress"><i style={{ width: `${questionsComplete ? 100 : ((cardIndex + 1) / deck.length) * 100}%` }} /></div>
          {dealing && <DealSequence words={deck} />}
          {!questionsComplete ? <div key={questionKey} className={`challenge-card ${dealing ? 'waiting' : ''}`}>
            <div className={`challenge-card-inner ${answer ? 'flipped' : ''}`}>
              <div className="challenge-face challenge-front"><span>{side === 'en' ? 'ENGLISH' : '中文'}</span><h2>{side === 'en' ? word.en : word.zh}</h2>{side === 'en' && <button className="round-speak" onClick={() => { const u = new SpeechSynthesisUtterance(word.en); u.lang = 'en-US'; speechSynthesis.speak(u) }}><Volume2 /></button>}</div>
              <div className="challenge-face challenge-back"><span><Sparkles size={15} /> 正確答案</span><h2>{side === 'en' ? word.zh : word.en}</h2><p>{word.part} · {word.example}{word.exampleZh && <small>{word.exampleZh}</small>}</p></div>
            </div>
          </div> : <div className="questions-complete-card"><span><Check /></span><small>ALL DONE</small><h2>題目作答完畢！</h2><p>{deck.length} 張字卡已全部完成，可以選擇其他遊戲或結算成績。</p><button onClick={() => setSelectedGame('menu')}><ListMusic /> 選擇其他遊戲</button></div>}
          {!questionsComplete && <div className="challenge-actions"><button disabled={dealing} className="answer-button" onClick={() => setAnswer(v => !v)}>{answer ? <RotateCcw /> : <CircleHelp />}{answer ? '隱藏答案' : '顯示答案'}</button><button disabled={dealing} className="next-button" onClick={nextWord}>{isLastCard ? '完成作答' : '下一題'} <ChevronRight /></button></div>}
          <div className="teacher-tip"><Flame size={16} /> 老師請判定搶答結果，再點隊伍的「答對 +1」</div>
        </>}
      </div>
      <TeamScore team="B" score={scores[1]} color="blue" disabled={gameEnded} celebrating={celebration?.team === 1} onAdd={() => add(1)} />
    </div>
    {celebration && <ScoreCelebration key={celebration.id} team={celebration.team} />}
    {settlementPhase && <ResultCeremony phase={settlementPhase} scores={scores} onClose={() => { setSettlementPhase(null); setSelectedGame('menu') }} onRestart={restartGame} />}
    {confirmReset && <Modal title="確定要重設比分嗎？" text="A、B 兩隊的分數都會回到 0，這個動作無法復原。" onCancel={() => setConfirmReset(false)} onConfirm={() => { setScores([0, 0]); setCelebration(null); setConfirmReset(false); setAnswer(false) }} />}
  </section>
}

function GameSelector({ onSelect }) {
  return <div className="game-selector">
    <small>CHOOSE A GAME</small><h2>選擇比賽項目</h2>
    <div className="game-options">
      <button onClick={() => onSelect('flash')}><span className="game-option-icon flash"><Sparkles /></span><div><strong>卡片搶答</strong><small>QUICK ANSWER</small><p>隨機出題，兩隊比速度搶答。</p></div><ChevronRight /></button>
      <button onClick={() => onSelect('match')}><span className="game-option-icon match"><Shuffle /></span><div><strong>Match Cards</strong><small>MEMORY MATCH</small><p>翻牌配對，再回答中文意思。</p></div><ChevronRight /></button>
      <button onClick={() => onSelect('lyrics')}><span className="game-option-icon lyrics"><ListMusic /></span><div><strong>歌詞排序賽</strong><small>LYRIC SCRAMBLE</small><p>重組散落單字，還原正確歌詞。</p></div><ChevronRight /></button>
    </div>
    <div className="shared-score-note"><Trophy /> 所有遊戲共用左右兩隊的累計分數</div>
  </div>
}

const GAME_INSTRUCTIONS = {
  flash: {
    title: '卡片搶答', english: 'QUICK ANSWER', icon: Sparkles,
    summary: '看清楚題目、搶先回答，考驗兩隊的反應速度！',
    rules: [
      ['搶先作答', '畫面每次會顯示一張中文或英文字卡，兩隊看到後立即搶答。'],
      ['老師判定', '需要時可翻面顯示答案；回答正確後，由老師點隊伍的「答對 +1」。'],
      ['題目不重複', '每張字卡只會出現一次，完成全部題目後即可選擇其他遊戲。'],
    ],
    tip: '開始後可隨時選擇顯示英文或中文題目。',
  },
  match: {
    title: 'Match Cards', english: 'MEMORY MATCH', icon: Shuffle,
    summary: '記住卡牌位置、找出相同單字，再答出中文意思！',
    rules: [
      ['選擇先攻', '老師先選擇 A 隊或 B 隊開始，每回合可指定兩張卡牌，例如 A1 和 D3。'],
      ['翻牌配對', '兩張單字不同時會自動蓋回並換隊；單字相同則進入回答階段。'],
      ['回答中文', '答錯會直接蓋牌並換隊；答對才顯示中文答案、加 1 分，而且原隊可以繼續翻牌。'],
      ['完成遊戲', '找出全部 8 組配對後遊戲結束，累計分數會保留到下一個遊戲。'],
    ],
    tip: '請學生直接說出卡牌座標，老師再點選對應卡牌。',
  },
  lyrics: {
    title: '歌詞排序賽', english: 'LYRIC SCRAMBLE', icon: ListMusic,
    summary: '觀察散落的單字卡，搶先說出正確的完整歌詞！',
    rules: [
      ['觀察單字', '系統會依照選擇的難度，將一或兩句歌詞拆成單字卡並全部打亂。'],
      ['舉手搶答', '兩隊學生看出正確順序後舉手，由老師選擇最快舉手的隊伍。'],
      ['老師判定', '老師點選回答隊伍，再判定答對或答錯；判定後會揭曉正確歌詞。'],
      ['累積得分', '回答正確的隊伍加 1 分，每句歌詞只會出現一次。'],
    ],
    tip: '卡片只改變位置與角度，每個單字都來自同一句歌詞。',
  },
}

function GameInstructions({ type, onBack, onStart }) {
  const game = GAME_INSTRUCTIONS[type]
  const Icon = game.icon
  const [questionLanguage, setQuestionLanguage] = useState('en')
  const [lyricDifficulty, setLyricDifficulty] = useState('easy')
  return <div className={`game-instructions ${type}`}>
    <button className="game-back-button" onClick={onBack}><ArrowLeft /> 返回遊戲選單</button>
    <div className="instruction-heading"><span><Icon /></span><div><small>{game.english}</small><h2>{game.title}</h2></div></div>
    <p className="instruction-summary">{game.summary}</p>
    {type === 'flash' && <div className="instruction-language"><div><strong>選擇題目語言</strong><span>開始後將使用這個設定出題</span></div><div><button className={questionLanguage === 'en' ? 'active' : ''} onClick={() => setQuestionLanguage('en')}>英文題目</button><button className={questionLanguage === 'zh' ? 'active' : ''} onClick={() => setQuestionLanguage('zh')}>中文題目</button></div></div>}
    {type === 'lyrics' && <div className="instruction-language lyric-difficulty"><div><strong>選擇遊戲難度</strong><span>{lyricDifficulty === 'easy' ? '每題排列一句歌詞' : '每題同時排列兩句歌詞'}</span></div><div><button className={lyricDifficulty === 'easy' ? 'active' : ''} onClick={() => setLyricDifficulty('easy')}>簡單版</button><button className={lyricDifficulty === 'hard' ? 'active' : ''} onClick={() => setLyricDifficulty('hard')}>困難版</button></div></div>}
    <div className="instruction-rules">
      {game.rules.map(([title, description], index) => <div key={title}><span>{index + 1}</span><div><strong>{title}</strong><p>{description}</p></div></div>)}
    </div>
    <div className="instruction-tip"><CircleHelp /> {game.tip}</div>
    <button className="start-game-button" onClick={() => onStart(type === 'lyrics' ? lyricDifficulty : questionLanguage)}><Play fill="currentColor" /> 開始遊戲</button>
  </div>
}

function CompetitionEnded({ onRestart }) {
  return <div className="competition-ended"><span>🏁</span><small>COMPETITION ENDED</small><h2>本場比賽已結束</h2><p>成績已完成結算。準備好後，可以重新開始一場全新的比賽。</p><button onClick={onRestart}><RotateCcw /> 開始新比賽</button></div>
}

function LyricsOrderGame({ srtText, difficulty, onScore, onBack }) {
  const [rounds, setRounds] = useState([])
  const [roundIndex, setRoundIndex] = useState(0)
  const [answeringTeam, setAnsweringTeam] = useState(null)
  const [result, setResult] = useState(null)
  const [wrongNotice, setWrongNotice] = useState(false)
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    let active = true
    const usable = parseSrt(srtText || '').filter(line => {
      const count = line.text.trim().split(/\s+/).length
      return count >= 4 && count <= 14
    })
    const shuffled = shuffleWords(usable)
    if (!active) return
    if (difficulty === 'hard') {
      const paired = []
      for (let i = 0; i + 1 < shuffled.length; i += 2) paired.push({ id: `hard-${i}`, lines: [shuffled[i], shuffled[i + 1]] })
      setRounds(paired)
    } else {
      setRounds(shuffled.map((line, index) => ({ id: `easy-${index}`, lines: [line] })))
    }
    return () => { active = false }
  }, [srtText, difficulty])

  const round = rounds[roundIndex]
  const words = useMemo(() => {
    if (!round) return []
    const wordCards = round.lines.flatMap((line, lineNumber) => line.text.trim().split(/\s+/).map((text, index) => ({ id: `${roundIndex}-${lineNumber}-${index}`, text })))
    return shuffleWords(wordCards)
  }, [round, roundIndex])
  const judge = correct => {
    if (correct) {
      onScore(answeringTeam)
      setResult('correct')
      setWrongNotice(false)
    } else {
      setAnsweringTeam(null)
      setResult(null)
      setWrongNotice(true)
    }
  }
  const nextLine = () => {
    if (roundIndex >= rounds.length - 1) return setComplete(true)
    setRoundIndex(index => index + 1); setAnsweringTeam(null); setResult(null); setWrongNotice(false)
  }

  if (!round) return <div className="lyrics-order-game loading-game"><Music2 /><h2>正在準備歌詞…</h2></div>
  return <div className="lyrics-order-game">
    <button className="game-back-button" onClick={onBack}><ArrowLeft /> 選擇其他遊戲</button>
    <div className="lyrics-game-heading"><div><small>LYRIC SCRAMBLE · {difficulty === 'hard' ? '困難版' : '簡單版'}</small><strong>歌詞排序賽</strong></div><span>第 {Math.min(roundIndex + 1, rounds.length)} / {rounds.length} 題</span></div>
    <div className="lyrics-game-progress"><i style={{ width: `${complete ? 100 : ((roundIndex + 1) / rounds.length) * 100}%` }} /></div>
    {!complete ? <>
      <div key={roundIndex} className={`scattered-word-stage ${difficulty} ${result ? 'answered' : ''}`}>
        {words.map((word, index) => {
          const angle = ((index * 47 + roundIndex * 31) % 121) - 60
          const x = ((index * 29 + roundIndex * 11) % 17) - 8
          const y = ((index * 43 + roundIndex * 7) % 15) - 7
          return <span key={word.id} style={{ '--angle': `${angle}deg`, '--x': `${x}px`, '--y': `${y}px`, '--delay': `${index * .045}s` }}>{word.text}</span>
        })}
      </div>
      {!result && answeringTeam === null && <div className={`lyrics-buzzer ${wrongNotice ? 'retry' : ''}`}><p>{wrongNotice ? '答錯，繼續搶答！' : '哪一隊最快舉手？'}</p><div><button onClick={() => { setAnsweringTeam(0); setWrongNotice(false) }}>A 隊搶答</button><button onClick={() => { setAnsweringTeam(1); setWrongNotice(false) }}>B 隊搶答</button></div></div>}
      {!result && answeringTeam !== null && <div className={`lyrics-judging team-${answeringTeam}`}><span>{answeringTeam === 0 ? 'A' : 'B'} 隊回答中</span><div><button onClick={() => judge(false)}><X /> 答錯</button><button onClick={() => judge(true)}><Check /> 答對 +1</button></div></div>}
      {result && <div className={`lyric-result ${result}`}><div><span>{result === 'correct' ? <Check /> : <X />}</span><div><small>{result === 'correct' ? `${answeringTeam === 0 ? 'A' : 'B'} 隊答對！` : '回答錯誤'}</small><span className="ordered-lyrics">{round.lines.map((line, index) => <strong key={index}>{index + 1}. {line.text}</strong>)}</span></div></div><button onClick={nextLine}>{roundIndex === rounds.length - 1 ? '完成遊戲' : '下一題'} <ChevronRight /></button></div>}
    </> : <div className="lyrics-game-complete"><span>🎵</span><small>ALL LYRICS COMPLETE</small><h2>歌詞排序完成！</h2><p>{rounds.length} 題歌詞都已經挑戰完畢，可以選擇其他遊戲。</p><button onClick={onBack}><ListMusic /> 選擇其他遊戲</button></div>}
  </div>
}

function createMatchCards(words) {
  const pairWords = Array.from({ length: 8 }, (_, i) => words[i % words.length])
  const cards = pairWords.flatMap((word, pair) => [
    { uid: `${pair}-a`, word, matched: false }, { uid: `${pair}-b`, word, matched: false },
  ])
  return shuffleWords(cards)
}

function MatchCardsGame({ words, onScore, onBack }) {
  const [cards, setCards] = useState(() => createMatchCards(words))
  const [currentTeam, setCurrentTeam] = useState(null)
  const [opened, setOpened] = useState([])
  const [locked, setLocked] = useState(false)
  const [prompt, setPrompt] = useState(null)
  const [complete, setComplete] = useState(false)
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const schedule = (fn, delay) => { const timer = setTimeout(fn, delay); timers.current.push(timer) }
  const matchedCount = cards.filter(card => card.matched).length / 2

  const chooseCard = index => {
    if (currentTeam === null || locked || complete || cards[index].matched || opened.includes(index)) return
    const nextOpened = [...opened, index]
    setOpened(nextOpened)
    if (nextOpened.length < 2) return
    setLocked(true)
    const [first, second] = nextOpened.map(i => cards[i])
    if (wordKey(first.word) === wordKey(second.word)) {
      schedule(() => setPrompt({ indices: nextOpened, word: first.word, answerShown: false }), 650)
    } else {
      schedule(() => { setOpened([]); setCurrentTeam(team => team === 0 ? 1 : 0); setLocked(false) }, 1050)
    }
  }
  const answerWrong = () => {
    setOpened([]); setPrompt(null); setCurrentTeam(team => team === 0 ? 1 : 0); setLocked(false)
  }
  const answerCorrect = () => {
    const matchedIndices = prompt.indices
    const finished = cards.filter(card => card.matched).length + 2 === cards.length
    setPrompt(value => ({ ...value, answerShown: true, finished }))
    setCards(old => old.map((card, i) => matchedIndices.includes(i) ? { ...card, matched: true } : card))
    onScore(currentTeam)
  }
  const continueAfterCorrect = () => {
    const finished = prompt.finished
    setOpened([]); setPrompt(null); setLocked(false)
    if (finished) setComplete(true)
  }

  return <div className="match-game">
    <button className="game-back-button" onClick={onBack}><ArrowLeft /> 選擇其他遊戲</button>
    <div className="match-heading"><div><small>MATCH CARDS</small><strong>配對記憶賽</strong></div>{currentTeam !== null && <div className={`turn-badge team-${currentTeam}`}><span>目前回合</span><strong>{currentTeam === 0 ? 'A' : 'B'} 隊</strong></div>}</div>
    <div className="match-progress"><span>已完成 {matchedCount} / 8 對</span><div><i style={{ width: `${matchedCount / 8 * 100}%` }} /></div></div>
    <div className="match-board">
      {cards.map((card, index) => {
        const isOpen = opened.includes(index) || card.matched
        const coordinate = `${String.fromCharCode(65 + Math.floor(index / 4))}${index % 4 + 1}`
        return <button key={card.uid} aria-label={`卡牌 ${coordinate}`} disabled={currentTeam === null || card.matched} onClick={() => chooseCard(index)} className={`match-card ${isOpen ? 'open' : ''} ${card.matched ? 'matched' : ''}`}><span className="match-card-inner"><span className="match-card-cover"><span className="card-coordinate">{coordinate}</span><Music2 /><b>?</b></span><span className="match-card-face"><span className="card-coordinate">{coordinate}</span><small>EN</small><strong>{card.word.en}</strong>{card.matched && <Check />}</span></span></button>
      })}
    </div>
    {currentTeam === null && <div className="starter-overlay"><h2>哪一隊先開始？</h2><div><button onClick={() => setCurrentTeam(0)}>A 隊先攻</button><button onClick={() => setCurrentTeam(1)}>B 隊先攻</button></div></div>}
    {prompt && <div className={`match-answer-panel ${prompt.answerShown ? 'answer-revealed' : ''}`}><span className="match-success"><Sparkles /> 配對成功！</span><p>請 {currentTeam === 0 ? 'A' : 'B'} 隊回答這個單字的中文意思：</p><h2>{prompt.word.en}</h2>{!prompt.answerShown ? <><p className="judge-label">老師請判定回答是否正確</p><div className="judge-actions"><button onClick={answerWrong}><X /> 答錯，換隊</button><button onClick={answerCorrect}><Check /> 答對 +1</button></div></> : <div className="translation-reveal"><span><Check /> 回答正確！</span><div className="translation-answer"><small>中文答案</small><strong>{prompt.word.zh}</strong></div><p className={`continue-turn team-${currentTeam}`}>{currentTeam === 0 ? 'A' : 'B'} 隊可繼續翻牌</p><button className="continue-match-button" onClick={continueAfterCorrect}>繼續 <ChevronRight /></button></div>}</div>}
    {complete && <div className="match-complete"><span>🎊</span><small>ALL MATCHED</small><h2>全部配對完成！</h2><p>8 組單字都已經找到，可以回去選擇其他遊戲。</p><button onClick={onBack}><ListMusic /> 選擇其他遊戲</button></div>}
  </div>
}

function shuffleWords(words) {
  const result = [...words]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function playDrumRoll() {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return
  const context = new AudioContext()
  const master = context.createGain()
  master.gain.value = .18
  master.connect(context.destination)
  const noise = context.createBuffer(1, context.sampleRate * .08, context.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const start = context.currentTime + .05
  for (let i = 0; i < 30; i++) {
    const source = context.createBufferSource()
    const gain = context.createGain()
    const filter = context.createBiquadFilter()
    source.buffer = noise; filter.type = 'lowpass'; filter.frequency.value = 650
    const time = start + i * (.11 - i * .0018)
    gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(.6 + i / 70, time + .008); gain.gain.exponentialRampToValueAtTime(.01, time + .075)
    source.connect(filter); filter.connect(gain); gain.connect(master); source.start(time)
  }
  const finale = start + 2.65
  ;[523.25, 659.25, 783.99].forEach((frequency, i) => {
    const oscillator = context.createOscillator(); const gain = context.createGain()
    oscillator.type = i === 0 ? 'triangle' : 'sine'; oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0, finale); gain.gain.linearRampToValueAtTime(.45, finale + .025); gain.gain.exponentialRampToValueAtTime(.01, finale + 1.1)
    oscillator.connect(gain); gain.connect(master); oscillator.start(finale); oscillator.stop(finale + 1.15)
  })
  const closeTimer = setTimeout(() => context.close(), 4300)
  return () => { clearTimeout(closeTimer); setTimeout(() => context.close().catch(() => {}), 1200) }
}

function ResultCeremony({ phase, scores, onClose, onRestart }) {
  const tie = scores[0] === scores[1]
  const winner = scores[0] > scores[1] ? 'A' : 'B'
  return <div className={`result-ceremony ${phase}`} role="dialog" aria-modal="true" aria-label="比賽結果">
    {phase === 'drum' ? <div className="drum-stage">
      <div className="spotlight left" /><div className="spotlight right" />
      <div className="drum-visual"><span>🥁</span><i className="stick-one" /><i className="stick-two" /></div>
      <small>FINAL RESULT</small><h2>成績結算中</h2><div className="drum-dots"><i /><i /><i /><i /><i /></div>
    </div> : <div className="winner-stage">
      <div className="winner-rays" />
      {Array.from({ length: 36 }, (_, i) => <i className="winner-confetti" key={i} style={{ '--x': `${(i * 83) % 100}vw`, '--delay': `${(i % 8) * .08}s`, '--color': ['#ff6940','#ffd055','#45b893','#4d8bd2','#9b67d5'][i % 5] }} />)}
      <small>{tie ? 'WHAT A MATCH!' : 'CONGRATULATIONS!'}</small>
      <div className="winner-trophy">{tie ? '🤝' : '🏆'}</div>
      <h2>{tie ? '本場平手！' : `${winner} 隊獲勝！`}</h2>
      <p>{tie ? '兩隊表現一樣出色' : '恭喜獲得本場比賽的勝利'}</p>
      <div className="final-scores"><div className={winner === 'A' && !tie ? 'winner' : ''}><span>A 隊</span><strong>{scores[0]}</strong></div><em>：</em><div className={winner === 'B' && !tie ? 'winner' : ''}><strong>{scores[1]}</strong><span>B 隊</span></div></div>
      <div className="result-actions"><button onClick={onClose}>查看比賽頁</button><button onClick={onRestart}><RotateCcw /> 再比一場</button></div>
    </div>}
  </div>
}

function DealSequence({ words }) {
  return <div className="deal-sequence" aria-hidden="true">
    <div className="deal-title"><Shuffle /><span>正在洗牌</span></div>
    {words.map((word, i) => {
      const slot = i % 8
      return <div className="deal-card" style={{
        '--delay': `${slot * .09}s`, '--start-x': `${(slot - 3.5) * 95}px`,
        '--start-r': `${(slot - 3.5) * 18}deg`, '--angle': `${(slot - 3.5) * 2.2}deg`,
        zIndex: i + 1,
      }} key={`${wordKey(word)}-${i}`}><Music2 /><span>{word.en}</span></div>
    })}
  </div>
}

function ScoreCelebration({ team }) {
  const colors = ['#ff6940', '#ffd055', '#45b893', '#4d8bd2', '#9b67d5', '#ff8eb3']
  return <div className={`score-celebration team-${team}`} aria-hidden="true">
    <div className="celebration-callout"><Trophy /> {team === 0 ? 'A' : 'B'} 隊 +1！</div>
    <div className="party-popper">🎉</div>
    {Array.from({ length: 42 }, (_, i) => {
      const direction = team === 0 ? 1 : -1
      const spread = ((i * 37) % 240) + 30
      const tx = direction * (spread + (i % 5) * 22)
      const ty = -140 - ((i * 53) % 410)
      return <i key={i} style={{
        '--tx': `${tx}px`, '--ty': `${ty}px`, '--delay': `${(i % 7) * 0.025}s`,
        '--spin': `${180 + (i % 6) * 90}deg`, '--color': colors[i % colors.length],
      }} />
    })}
  </div>
}

function TeamScore({ team, score, color, celebrating, disabled, onAdd }) {
  return <div className={`team-score ${color} ${celebrating ? 'celebrating' : ''}`}>
    <div className="team-badge"><Medal /><span>TEAM</span></div><h2>{team} 隊</h2>
    <div key={score} className="score-number">{score}</div><span className="score-label">POINTS</span>
    <button disabled={disabled} onClick={onAdd}><Check /> 答對 +1</button>
  </div>
}

function Modal({ title, text, onCancel, onConfirm }) {
  useEffect(() => { const fn = e => e.key === 'Escape' && onCancel(); addEventListener('keydown', fn); return () => removeEventListener('keydown', fn) }, [onCancel])
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onCancel()}><div className="modal"><span className="modal-icon"><RotateCcw /></span><h2>{title}</h2><p>{text}</p><div><button onClick={onCancel}>取消</button><button className="danger" onClick={onConfirm}>確定重設</button></div></div></div>
}

function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const { courses, loading, error } = useCourses({ includeDrafts: true, enabled: !!user })
  const [selectedId, setSelectedId] = useState(null)
  const selectedCourse = courses.find(course => course.id === selectedId) || courses[0] || null

  useEffect(() => {
    if (!auth) { setAuthLoading(false); return }
    return onAuthStateChanged(auth, account => { setUser(account); setAuthLoading(false) })
  }, [])

  useEffect(() => {
    if (!selectedId && courses.length) setSelectedId(courses[0].id)
    if (selectedId && courses.length && !courses.some(course => course.id === selectedId)) setSelectedId(courses[0]?.id || null)
  }, [courses, selectedId])

  if (!firebaseReady) return <SetupState title="尚未設定 Firebase" text="請建立 .env.local，填入 Firebase Web App 的 VITE_FIREBASE_* 設定，然後重新啟動 dev server 或重新部署。" />
  if (authLoading) return <div className="loading"><span className="logo-mark"><Music2 /></span><p>正在確認後台登入狀態…</p></div>
  if (!user) return <AdminLogin />

  return <div className="admin-page">
    <header className="admin-header">
      <Brand compact />
      <div><small>COURSE ADMIN</small><h1>課程後台</h1></div>
      <div className="admin-header-actions"><a href="#/">返回前台</a><button onClick={() => signOut(auth)}><LogOut size={17} /> 登出</button></div>
    </header>
    {error && <div className="admin-error">{error}</div>}
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <CreateCourseForm onCreated={setSelectedId} />
        <div className="admin-course-list">
          <h2>所有課程</h2>
          {loading ? <p>讀取中…</p> : courses.length ? courses.map(course => <button key={course.id} className={selectedCourse?.id === course.id ? 'active' : ''} onClick={() => setSelectedId(course.id)}>
            <span className={`status-dot ${course.status}`} /> <div><strong>{course.title}</strong><small>{course.artist || '未填 Artist'} · {course.words.length} 字</small></div>
          </button>) : <p>目前沒有課程。先用上方表單新增第一首歌。</p>}
        </div>
      </aside>
      <section className="admin-editor-shell">
        {selectedCourse ? <CourseEditor key={selectedCourse.id} course={selectedCourse} /> : <div className="admin-empty"><Music2 /><h2>尚未選擇課程</h2><p>新增或選擇一首歌曲後，就能編輯 YouTube、SRT 與單字。</p></div>}
      </section>
    </main>
  </div>
}

function AdminLogin() {
  const adminUsername = import.meta.env.VITE_ADMIN_USERNAME || 'admin'
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || ''
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const login = async e => {
    e.preventDefault()
    setError(''); setSubmitting(true)
    try {
      if (!adminEmail) throw new Error('尚未設定 VITE_ADMIN_EMAIL。')
      if (username.trim() !== adminUsername) throw new Error('帳號或密碼錯誤。')
      await signInWithEmailAndPassword(auth, adminEmail, password)
    }
    catch (err) { setError(`登入失敗：${err.message}`) }
    finally { setSubmitting(false) }
  }
  return <div className="admin-login">
    <Brand />
    <form onSubmit={login}>
      <small>ADMIN LOGIN</small><h1>登入課程後台</h1>
      <label>帳號<input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" placeholder={adminUsername} required /></label>
      <label>密碼<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required /></label>
      {error && <p className="form-error">{error}</p>}
      <button disabled={submitting}>{submitting ? '登入中…' : '登入'}</button>
      <a href="#/">返回前台</a>
    </form>
  </div>
}

function CreateCourseForm({ onCreated }) {
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const create = async e => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    const ref = await addDoc(collection(db, 'courses'), {
      title: title.trim(),
      artist: '',
      level: '',
      status: 'draft',
      youtubeUrl: '',
      srtText: '',
      translations: [],
      words: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    setTitle(''); setSubmitting(false); onCreated(ref.id)
  }
  return <form className="create-course" onSubmit={create}>
    <h2>新增課程</h2>
    <label>Title <b>必填</b><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Twinkle Twinkle Little Star" required /></label>
    <button disabled={submitting}><Plus size={17} /> {submitting ? '新增中…' : '建立草稿'}</button>
  </form>
}

function CourseEditor({ course }) {
  const [form, setForm] = useState(course)
  const [editorMode, setEditorMode] = useState('form')
  const [jsonDraft, setJsonDraft] = useState(() => createJsonDraft(course))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [expandedWords, setExpandedWords] = useState([])

  useEffect(() => { setForm(course); setJsonDraft(createJsonDraft(course)); setEditorMode('form'); setMessage(''); setExpandedWords([]) }, [course])

  const updateField = (field, value) => setForm(current => ({ ...current, [field]: value }))
  const updateWord = (index, field, value) => setForm(current => ({
    ...current,
    words: current.words.map((word, i) => i === index ? { ...word, [field]: value } : word),
  }))
  const updateHint = (wordIndex, hintIndex, value) => setForm(current => ({
    ...current,
    words: current.words.map((word, i) => i === wordIndex ? { ...word, hint: normalizeHints(word.hint).map((hint, h) => h === hintIndex ? value : hint) } : word),
  }))
  const addWord = () => setForm(current => ({ ...current, words: [...current.words, { en: '', zh: '', part: '', example: '', exampleZh: '', hint: ['', '', ''] }] }))
  const removeWord = index => {
    setForm(current => ({ ...current, words: current.words.filter((_, i) => i !== index) }))
    setExpandedWords(current => current.filter(i => i !== index).map(i => i > index ? i - 1 : i))
  }
  const toggleWord = index => setExpandedWords(current => current.includes(index) ? current.filter(i => i !== index) : [...current, index])
  const save = async e => {
    e.preventDefault()
    const source = editorMode === 'json' ? parseJsonDraft(jsonDraft) : form
    if (source.error) return setMessage(source.error)
    const cleaned = cleanCourseForm(source)
    const validationError = validateCourseForSave(cleaned)
    if (validationError) return setMessage(validationError)
    setSaving(true); setMessage('')
    const words = cleaned.words.map(word => ({
      en: word.en,
      zh: word.zh,
      part: word.part,
      example: word.example,
      exampleZh: word.exampleZh,
      hint: normalizeHints(word.hint),
    })).filter(word => word.en || word.zh || word.part || word.example || word.exampleZh || word.hint.some(Boolean))
    await updateDoc(doc(db, 'courses', course.id), {
      title: cleaned.title,
      artist: cleaned.artist,
      level: cleaned.level,
      youtubeUrl: cleaned.youtubeUrl,
      youtubeId: '',
      status: cleaned.status,
      srtText: cleaned.srtText,
      translations: cleaned.translations,
      words,
      updatedAt: serverTimestamp(),
    })
    setForm(cleaned); setJsonDraft(createJsonDraft(cleaned))
    setSaving(false); setMessage(getTranslationWarning(cleaned) || '已儲存。')
  }
  const deleteCourse = async () => {
    await deleteDoc(doc(db, 'courses', course.id))
    setConfirmDelete(false)
  }

  return <form className="course-editor" onSubmit={save}>
    <div className="editor-toolbar">
      <div><small>{form.status === 'published' ? 'PUBLISHED' : 'DRAFT'}</small><h2>{form.title || '未命名課程'}</h2></div>
      <div><button type="button" className="danger-outline" onClick={() => setConfirmDelete(true)}><Trash2 size={17} /> 刪除</button><button disabled={saving}><Save size={17} /> {saving ? '儲存中…' : '儲存課程'}</button></div>
    </div>
    {message && <div className={`save-message ${message === '已儲存。' ? '' : message.startsWith('提醒：') ? 'warning' : 'error'}`}>{message}</div>}
    <div className="editor-mode-tabs">
      <button type="button" className={editorMode === 'form' ? 'active' : ''} onClick={() => { setEditorMode('form'); setMessage('') }}>表單編輯</button>
      <button type="button" className={editorMode === 'json' ? 'active' : ''} onClick={() => { setJsonDraft(createJsonDraft(form)); setEditorMode('json'); setMessage('') }}>JSON 編輯</button>
    </div>
    {editorMode === 'form' ? <>
      <div className="editor-grid">
        <label>Title <b>必填</b><input value={form.title} onChange={e => updateField('title', e.target.value)} required /></label>
        <label>Artist <span>選填</span><input value={form.artist} onChange={e => updateField('artist', e.target.value)} /></label>
        <label>Level <b>發布必選</b><select value={form.level} onChange={e => updateField('level', e.target.value)}><option value="">未設定</option>{LEVEL_OPTIONS.map(level => <option key={level} value={level}>{level}</option>)}</select></label>
        <label>YouTube 連結 <b>發布必填</b><input value={form.youtubeUrl} onChange={e => updateField('youtubeUrl', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." /></label>
        <label>狀態<select value={form.status} onChange={e => updateField('status', e.target.value)}><option value="draft">草稿</option><option value="published">發布</option></select></label>
      </div>
      <label className="srt-editor">SRT 同步歌詞 <b>發布必填</b><textarea value={form.srtText} onChange={e => updateField('srtText', e.target.value)} placeholder={'1\\n00:00:19,700 --> 00:00:25,000\\nTwinkle twinkle little star'} /></label>
      <label className="translation-editor">中文翻譯 <span>選填，一行對應一句歌詞</span><textarea value={normalizeTranslations(form.translations).join('\n')} onChange={e => updateField('translations', e.target.value.split('\n'))} placeholder={'一閃一閃小星星\n我多麼想知道你是什麼'} /></label>
      <section className="words-editor">
        <div className="words-editor-heading"><h3>課程單字</h3><button type="button" onClick={addWord}><Plus size={17} /> 新增單字</button></div>
        {form.words.length ? form.words.map((word, index) => {
          const expanded = expandedWords.includes(index)
          return <div className={`word-editor ${expanded ? 'expanded' : 'collapsed'}`} key={`${wordKey(word)}-${index}`}>
          <div className="word-editor-title" role="button" tabIndex="0" aria-expanded={expanded} onClick={() => toggleWord(index)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleWord(index) } }}>
            <div><strong>單字 {index + 1}</strong><span><b>{word.en || '未填英文'}</b><em>{word.zh || '未填中文'}</em></span></div>
            <div><button type="button" onClick={e => { e.stopPropagation(); removeWord(index) }}><Trash2 size={16} /> 移除</button></div>
          </div>
          {expanded && <>
            <div className="word-grid">
              <label>英文 <b>發布必填</b><input value={word.en} onChange={e => updateWord(index, 'en', e.target.value)} /></label>
              <label>中文 <b>發布必填</b><input value={word.zh} onChange={e => updateWord(index, 'zh', e.target.value)} /></label>
              <label>詞性 <b>發布必選</b><select value={word.part} onChange={e => updateWord(index, 'part', e.target.value)}><option value="">請選擇詞性</option>{PART_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>英文例句<input value={word.example} onChange={e => updateWord(index, 'example', e.target.value)} /></label>
              <label>中文例句翻譯 <b>發布必填</b><input value={word.exampleZh || ''} onChange={e => updateWord(index, 'exampleZh', e.target.value)} /></label>
            </div>
            <div className="hint-grid">{normalizeHints(word.hint).map((hint, hintIndex) => <label key={hintIndex}>提示 {hintIndex + 1} <span>選填</span><input value={hint} onChange={e => updateHint(index, hintIndex, e.target.value)} placeholder={hintIndex === 0 ? '✨' : '中文提示'} /></label>)}</div>
          </>}
        </div>
        }) : <div className="admin-empty small"><BookOpen /><h2>還沒有單字</h2><p>按「新增單字」開始建立字卡。</p></div>}
      </section>
    </> : <JsonCourseEditor value={jsonDraft} onChange={setJsonDraft} />}
    {confirmDelete && <Modal title="確定刪除這首課程？" text="這會刪除 Firestore 中的課程資料、SRT 與所有單字。此動作無法復原。" onCancel={() => setConfirmDelete(false)} onConfirm={deleteCourse} />}
  </form>
}

function JsonCourseEditor({ value, onChange }) {
  const update = (field, next) => onChange(current => ({ ...current, [field]: next }))
  return <section className="json-editor">
    <div className="json-editor-note"><CircleHelp size={18} /><span>這三份 JSON 會合併儲存到同一個 Firestore 課程文件。課程 ID 由 Firebase 管理，不需要放在 JSON 裡。</span></div>
    <label>course.json<textarea value={value.course} onChange={e => update('course', e.target.value)} spellCheck="false" /></label>
    <label>srt.json<textarea value={value.srt} onChange={e => update('srt', e.target.value)} spellCheck="false" /></label>
    <label>words.json<textarea value={value.words} onChange={e => update('words', e.target.value)} spellCheck="false" /></label>
  </section>
}

function normalizeHints(hints) {
  const list = Array.isArray(hints) ? hints : []
  return [list[0] || '', list[1] || '', list[2] || ''].map(hint => String(hint).trim())
}

function normalizeTranslations(translations) {
  return Array.isArray(translations) ? translations.map(line => String(line || '').trim()) : []
}

function wordKey(word) {
  return `${word?.en || ''}::${word?.zh || ''}::${word?.part || ''}`.toLowerCase()
}

function createJsonDraft(course) {
  const cleaned = cleanCourseForm(course)
  return {
    course: stringifyJson({
      title: cleaned.title,
      artist: cleaned.artist,
      level: cleaned.level,
      youtubeUrl: cleaned.youtubeUrl,
      status: cleaned.status,
    }),
    srt: stringifyJson({ srtText: cleaned.srtText, translations: cleaned.translations }),
    words: stringifyJson({ words: cleaned.words }),
  }
}

function parseJsonDraft(draft) {
  try {
    const course = JSON.parse(draft.course)
    const srt = JSON.parse(draft.srt)
    const words = JSON.parse(draft.words)
    if (!course || typeof course !== 'object' || Array.isArray(course)) throw new Error('course.json 必須是一個 JSON object。')
    if (!srt || typeof srt !== 'object' || Array.isArray(srt)) throw new Error('srt.json 必須是一個 JSON object。')
    if (!words || typeof words !== 'object' || Array.isArray(words)) throw new Error('words.json 必須是一個 JSON object。')
    if (!Array.isArray(words.words)) throw new Error('words.json 需要包含 words 陣列。')
    return {
      title: course.title || '',
      artist: course.artist || '',
      level: course.level || '',
      youtubeUrl: course.youtubeUrl || youtubeUrlFromId(course.youtubeId || ''),
      status: course.status || 'draft',
      srtText: srt.srtText || '',
      translations: normalizeTranslations(srt.translations),
      words: words.words,
    }
  } catch (error) {
    return { error: `JSON 格式錯誤：${error.message}` }
  }
}

function stringifyJson(value) {
  return JSON.stringify(value, null, 2)
}

function cleanCourseForm(form) {
  return {
    title: String(form.title || '').trim(),
    artist: String(form.artist || '').trim(),
    level: LEVEL_OPTIONS.includes(form.level) ? form.level : '',
    youtubeUrl: normalizeYoutubeUrl(form.youtubeUrl || form.youtubeId || ''),
    status: form.status === 'published' ? 'published' : 'draft',
    srtText: String(form.srtText || '').trim(),
    translations: normalizeTranslations(form.translations),
    words: Array.isArray(form.words) ? form.words.map(word => ({
      en: String(word.en || '').trim(),
      zh: String(word.zh || '').trim(),
      part: PART_OPTIONS.some(([value]) => value === word.part) ? word.part : '',
      example: String(word.example || '').trim(),
      exampleZh: String(word.exampleZh || '').trim(),
      hint: normalizeHints(word.hint),
    })) : [],
  }
}

function validateCourseForSave(course) {
  if (!course.title) return 'Title 是必填。'
  if (course.status !== 'published') return ''
  if (!course.level) return '要發布課程，請先選擇 Level。'
  if (!extractYoutubeId(course.youtubeUrl)) return '要發布課程，請先填入有效的 YouTube 連結。'
  if (!course.srtText) return '要發布課程，請先填入 SRT 同步歌詞。'
  const nonEmptyWords = course.words.filter(word => word.en || word.zh || word.part || word.example || word.exampleZh || word.hint.some(Boolean))
  if (!nonEmptyWords.length) return '要發布課程，至少需要新增一個課程單字。'
  const incompleteIndex = nonEmptyWords.findIndex(word => !word.en || !word.zh || !word.part || !word.exampleZh)
  if (incompleteIndex >= 0) return `要發布課程，單字 ${incompleteIndex + 1} 的英文、中文、詞性、中文例句翻譯都必須填完。`
  return ''
}

function getTranslationWarning(course) {
  const translationCount = normalizeTranslations(course.translations).filter(Boolean).length
  if (!translationCount) return ''
  const lyricCount = parseSrt(course.srtText || '').length
  if (translationCount !== lyricCount) return `提醒：目前有 ${lyricCount} 句 SRT 歌詞，但有 ${translationCount} 句中文翻譯。已儲存，但建議確認是否一行對應一句。`
  return ''
}

function extractYoutubeId(value) {
  const input = String(value || '').trim()
  if (!input) return ''
  const match = input.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/) || input.match(/^[A-Za-z0-9_-]{11}$/)
  return match ? (match[1] || match[0]) : input
}

function normalizeYoutubeUrl(value) {
  const input = String(value || '').trim()
  const id = extractYoutubeId(input)
  if (!id) return ''
  return input.startsWith('http') ? input : youtubeUrlFromId(id)
}

function youtubeUrlFromId(id) {
  return id ? `https://www.youtube.com/watch?v=${id}` : ''
}

export default App
