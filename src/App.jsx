import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, BookOpen, Check, ChevronLeft, ChevronRight, CircleHelp,
  Clock3, Flame, Headphones, Heart, ListMusic, Medal, Music2, Pause,
  Play, RotateCcw, Search, Shuffle, Sparkles, Star, Trophy, Volume2, X,
} from 'lucide-react'

const MODES = [
  { id: 'listen', label: '聆聽', icon: Headphones },
  { id: 'learn', label: '學習', icon: BookOpen },
  { id: 'compete', label: '比賽', icon: Trophy },
]

function useHashRoute() {
  const read = () => {
    const [, courseId, mode] = location.hash.split('/')
    return { courseId: courseId || null, mode: mode || 'listen' }
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
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const route = useHashRoute()

  useEffect(() => {
    fetch('./data/courses.json').then(r => r.json()).then(setCourses).finally(() => setLoading(false))
  }, [])

  const course = courses.find(c => c.id === route.courseId)
  if (loading) return <div className="loading"><span className="logo-mark"><Music2 /></span><p>正在準備音樂教室…</p></div>
  if (course) return <Course course={course} mode={route.mode} />
  return <Home courses={courses} />
}

function Brand({ compact = false }) {
  return <a className="brand" href="#/" aria-label="回首頁">
    <span className="logo-mark"><Music2 size={compact ? 18 : 22} /></span>
    <span>Song<span>lish</span></span>
  </a>
}

function Home({ courses }) {
  const [search, setSearch] = useState('')
  const filtered = courses.filter(c => `${c.title} ${c.artist}`.toLowerCase().includes(search.toLowerCase()))
  const totalWords = courses.reduce((n, c) => n + c.words.length, 0)

  return <div className="home-page">
    <header className="home-nav container">
      <Brand />
      <nav><a href="#songs">探索歌曲</a><a href="#how">學習方式</a></nav>
      <a className="pill-button small" href="#songs"><Play size={16} fill="currentColor" /> 開始學習</a>
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
          {!filtered.length && <div className="empty">找不到符合的歌曲，換個關鍵字試試看。</div>}
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
  return <a className="song-card" href={`#/${course.id}/listen`}>
    <div className="cover-wrap">
      <img src={course.cover} alt={`${course.title} 封面`} />
      <span className="level">{course.level}</span>
      <span className="card-play"><Play fill="currentColor" /></span>
      <span className="track-num">0{index + 1}</span>
    </div>
    <div className="song-meta">
      <div><h3>{course.title}</h3><p>{course.artist}</p></div>
      <span><Clock3 size={14} /> {course.duration}</span>
    </div>
    <div className="card-foot"><span><BookOpen size={15} /> {course.words.length} 個單字</span><span>開始學習 <ArrowLeft className="go-arrow" size={16} /></span></div>
  </a>
}

function Course({ course, mode }) {
  const selectedMode = MODES.some(m => m.id === mode) ? mode : 'listen'
  return <div className="course-page">
    <header className="course-header">
      <Brand compact />
      <div className="course-title"><img src={course.cover} /><div><small>正在學習</small><strong>{course.title}</strong></div></div>
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
  const { elementId, ready, playing, time, duration, seek, seekAndPlay, toggle } = useYouTube(course.youtubeId)
  useEffect(() => { fetch(`./${course.srt}`).then(r => r.text()).then(t => setLyrics(parseSrt(t))) }, [course.srt])
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
            <span>{String(i + 1).padStart(2, '0')}</span><p>{line.text}</p>{i === active && <Volume2 size={18} />}
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
    const list = onlyStarred ? course.words.filter(w => favorites.includes(w.id)) : [...course.words]
    return shuffle ? [...list].sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }) * (Math.random() > .5 ? 1 : -1)) : list
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
  }, [word?.id, flipped, showHints, frontLanguage, autoPronounce])

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
            <div className="card-label"><span>{showHints || frontLanguage === 'en' ? '英文' : '中文'}</span><button onClick={e => { e.stopPropagation(); toggleFavorite(word.id) }} aria-label="加星號"><Star fill={favorites.includes(word.id) ? 'currentColor' : 'none'} /></button></div>
            <div className="word-main">
              {showHints || frontLanguage === 'en' ? <><small>{word.part}</small><h2>{word.en}</h2><button className="speak" onClick={e => { e.stopPropagation(); speak(word.en) }}><Volume2 /> 聽發音</button></> : <><small>{word.part}</small><h2>{word.zh}</h2></>}
            </div>
            {showHints && hintStep > 0 && <div className="hint-area"><div><CircleHelp size={18} /><span>提示 {hintStep} / 3</span></div>{word.hint.slice(0, hintStep).map((h, i) => <p key={i}><b>{i + 1}</b><span>{h}</span></p>)}</div>}
            <div className="flip-hint"><RotateCcw size={16} /> {showHints && hintStep < 3 ? '點一下顯示下一個提示' : '點一下翻面看答案'}</div>
          </div>
          <div className="card-face card-back">
            <div className="card-label"><span>{showHints || frontLanguage === 'en' ? '中文答案' : '英文答案'}</span><Check /></div>
            <div className="word-main"><small>{word.part}</small><h2>{showHints || frontLanguage === 'en' ? word.zh : word.en}</h2>{!showHints && frontLanguage === 'zh' && <button className="speak" onClick={e => { e.stopPropagation(); speak(word.en) }}><Volume2 /> 聽發音</button>}<p className="example">“{word.example}”</p></div>
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
  const [scores, setScores] = useState([0, 0])
  const [selectedGame, setSelectedGame] = useState('menu')
  const [side, setSide] = useState('en')
  const [deck, setDeck] = useState(() => shuffleWords(course.words))
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
  const startFlashGame = () => {
    setDeck(shuffleWords(course.words)); setCardIndex(0); setAnswer(false)
    setQuestionsComplete(false); setQuestionKey(k => k + 1); setSelectedGame('flash'); setDealing(true)
    setTimeout(() => setDealing(false), window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 80 : 1900)
  }
  const restartGame = () => {
    setScores([0, 0]); setDeck(shuffleWords(course.words)); setCardIndex(0)
    setAnswer(false); setQuestionsComplete(false); setGameEnded(false)
    setSettlementPhase(null); setQuestionKey(k => k + 1); setDealing(false); setSelectedGame('menu')
  }

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
        {gameEnded ? <CompetitionEnded onRestart={restartGame} /> : selectedGame === 'menu' ? <GameSelector onSelect={game => game === 'flash' ? startFlashGame() : setSelectedGame(game)} /> : selectedGame === 'match' ? <MatchCardsGame words={course.words} onScore={add} onBack={() => setSelectedGame('menu')} /> : <>
          <button className="game-back-button" onClick={() => setSelectedGame('menu')}><ArrowLeft /> 選擇其他遊戲</button>
          <div className="round-label"><span>QUESTION</span><strong>{Math.min(cardIndex + 1, deck.length)} / {deck.length}</strong></div>
          <div className="side-picker"><button disabled={dealing} className={side === 'en' ? 'active' : ''} onClick={() => { setSide('en'); setAnswer(false) }}>顯示英文</button><button disabled={dealing} className={side === 'zh' ? 'active' : ''} onClick={() => { setSide('zh'); setAnswer(false) }}>顯示中文</button></div>
          <div className="competition-progress"><i style={{ width: `${questionsComplete ? 100 : ((cardIndex + 1) / deck.length) * 100}%` }} /></div>
          {dealing && <DealSequence words={deck} />}
          {!questionsComplete ? <div key={questionKey} className={`challenge-card ${dealing ? 'waiting' : ''}`}>
            <div className={`challenge-card-inner ${answer ? 'flipped' : ''}`}>
              <div className="challenge-face challenge-front"><span>{side === 'en' ? 'ENGLISH' : '中文'}</span><h2>{side === 'en' ? word.en : word.zh}</h2>{side === 'en' && <button className="round-speak" onClick={() => { const u = new SpeechSynthesisUtterance(word.en); u.lang = 'en-US'; speechSynthesis.speak(u) }}><Volume2 /></button>}</div>
              <div className="challenge-face challenge-back"><span><Sparkles size={15} /> 正確答案</span><h2>{side === 'en' ? word.zh : word.en}</h2><p>{word.part} · {word.example}</p></div>
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
    </div>
    <div className="shared-score-note"><Trophy /> 所有遊戲共用左右兩隊的累計分數</div>
  </div>
}

function CompetitionEnded({ onRestart }) {
  return <div className="competition-ended"><span>🏁</span><small>COMPETITION ENDED</small><h2>本場比賽已結束</h2><p>成績已完成結算。準備好後，可以重新開始一場全新的比賽。</p><button onClick={onRestart}><RotateCcw /> 開始新比賽</button></div>
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
    if (first.word.id === second.word.id) {
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
        return <button key={card.uid} disabled={currentTeam === null || card.matched} onClick={() => chooseCard(index)} className={`match-card ${isOpen ? 'open' : ''} ${card.matched ? 'matched' : ''}`}><span className="match-card-inner"><span className="match-card-cover"><Music2 /><b>?</b></span><span className="match-card-face"><small>EN</small><strong>{card.word.en}</strong>{card.matched && <Check />}</span></span></button>
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
      }} key={word.id}><Music2 /><span>{word.en}</span></div>
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

export default App
