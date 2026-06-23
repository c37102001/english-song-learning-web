# Songlish 英語歌曲學習網

用歌曲、同步歌詞、字卡與課堂競賽學習英文。這是純前端靜態網站，不需資料庫或付費服務，可直接部署到 GitHub Pages。

## 本機執行

```bash
npm install
npm run dev
```

正式建置：

```bash
npm run build
```

## 新增課程

1. 在 `public/data/courses.json` 新增一筆歌曲資料。
2. 將 SRT 放進 `public/data/`，並把歌曲資料的 `srt` 指向該檔案。
3. `youtubeId` 只填 YouTube 網址中的影片 ID。例如 `https://youtu.be/abc123` 填 `abc123`。
4. 每個單字需包含 `id`、英文 `en`、中文 `zh`、詞性 `part`、例句 `example` 與三階段 `hint`。

課程資料範例：

```json
{
  "id": "song-slug",
  "title": "Song title",
  "artist": "Artist",
  "level": "初級",
  "duration": "3:20",
  "youtubeId": "YOUTUBE_VIDEO_ID",
  "srt": "data/song-slug.srt",
  "cover": "https://example.com/cover.jpg",
  "words": [
    {
      "id": "unique-word-id",
      "en": "sunshine",
      "zh": "陽光",
      "part": "noun",
      "example": "You are my sunshine.",
      "hint": ["☀️", "天空中暖暖的光", "雨天過後最期待看見它"]
    }
  ]
}
```

## GitHub Pages 部署

推送到 GitHub 的 `main` 分支後，到 repository 的 **Settings → Pages → Source** 選擇 **GitHub Actions**。之後每次推送會自動建置與部署。

星號等個人學習狀態保存在瀏覽器 `localStorage`。因為目前沒有帳號或跨裝置同步需求，所以不需 Firebase。
