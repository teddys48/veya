package service

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"

	"github.com/dhowden/tag"
	"veya/backend/internal/models"
	"veya/backend/internal/repository"
)

var reYear = regexp.MustCompile(`(19\d\d|20\d\d)`)

func parseAudioDuration(filePath string) float64 {
	cmd := exec.Command("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprintwrappers=1:nokey=1", filePath)
	out, err := cmd.Output()
	if err == nil {
		str := strings.TrimSpace(string(out))
		if d, err := strconv.ParseFloat(str, 64); err == nil && d > 0 {
			return d
		}
	}
	return 0
}

func extractYearFromRaw(raw map[string]interface{}) int {
	if raw == nil {
		return 0
	}
	for k, val := range raw {
		upperK := strings.ToUpper(k)
		if upperK == "TYER" || upperK == "TDRC" || upperK == "TDRB" || upperK == "YEAR" || upperK == "DATE" || upperK == "©DAY" || strings.Contains(upperK, "DAY") || strings.Contains(upperK, "DATE") {
			var strVal string
			switch v := val.(type) {
			case string:
				strVal = v
			case []byte:
				strVal = string(v)
			}
			if match := reYear.FindString(strVal); match != "" {
				var y int
				if _, err := fmt.Sscanf(match, "%d", &y); err == nil && y >= 1900 && y <= 2100 {
					return y
				}
			}
		}
	}
	return 0
}

type ffprobeStreamFormatTags struct {
	Format struct {
		Tags map[string]string `json:"tags"`
	} `json:"format"`
	Streams []struct {
		Tags map[string]string `json:"tags"`
	} `json:"streams"`
}

func extractYearWithFFprobe(filePath string) int {
	cmd := exec.Command("ffprobe", "-v", "error", "-show_entries", "format_tags:stream_tags", "-of", "json", filePath)
	out, err := cmd.Output()
	if err != nil {
		return 0
	}
	var data ffprobeStreamFormatTags
	if err := json.Unmarshal(out, &data); err != nil {
		return 0
	}

	checkTags := func(tags map[string]string) int {
		for k, v := range tags {
			upperK := strings.ToUpper(k)
			if upperK == "DATE" || upperK == "YEAR" || upperK == "CREATION_TIME" || upperK == "TYER" || upperK == "TDRC" || upperK == "TDRB" || strings.Contains(upperK, "DAY") || strings.Contains(upperK, "DATE") {
				if match := reYear.FindString(v); match != "" {
					var y int
					if _, err := fmt.Sscanf(match, "%d", &y); err == nil && y >= 1900 && y <= 2100 {
						return y
					}
				}
			}
		}
		return 0
	}

	if y := checkTags(data.Format.Tags); y > 0 {
		return y
	}
	for _, stream := range data.Streams {
		if y := checkTags(stream.Tags); y > 0 {
			return y
		}
	}
	return 0
}

var supportedExtensions = map[string]bool{
	".mp3":  true,
	".flac": true,
	".m4a":  true,
	".aac":  true,
	".ogg":  true,
	".opus": true,
	".wav":  true,
}

type ScannerService struct {
	musicDir   string
	songRepo   *repository.SongRepository
	albumRepo  *repository.AlbumRepository
	artistRepo *repository.ArtistRepository
	genreRepo  *repository.GenreRepository
	coverSvc   *CoverService

	mu     sync.Mutex
	status models.ScanStatus
}

func NewScannerService(
	musicDir string,
	songRepo *repository.SongRepository,
	albumRepo *repository.AlbumRepository,
	artistRepo *repository.ArtistRepository,
	genreRepo *repository.GenreRepository,
	coverSvc *CoverService,
) *ScannerService {
	return &ScannerService{
		musicDir:   musicDir,
		songRepo:   songRepo,
		albumRepo:  albumRepo,
		artistRepo: artistRepo,
		genreRepo:  genreRepo,
		coverSvc:   coverSvc,
		status: models.ScanStatus{
			Message: "Idle",
		},
	}
}

func (s *ScannerService) GetStatus() models.ScanStatus {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.status
}

func (s *ScannerService) StartScan() (bool, models.ScanStatus) {
	s.mu.Lock()
	if s.status.IsScanning {
		st := s.status
		s.mu.Unlock()
		return false, st
	}

	s.status = models.ScanStatus{
		IsScanning: true,
		Message:    "Scan started",
	}
	st := s.status
	s.mu.Unlock()

	go s.runScan()

	return true, st
}

func (s *ScannerService) runScan() {
	defer func() {
		s.mu.Lock()
		s.status.IsScanning = false
		s.status.Message = fmt.Sprintf("Scan completed: %d added, %d updated, %d deleted, %d errors",
			s.status.Added, s.status.Updated, s.status.Deleted, s.status.Errors)
		s.mu.Unlock()
	}()

	existingMeta, err := s.songRepo.GetAllFileMetadata()
	if err != nil {
		s.mu.Lock()
		s.status.Message = "Failed to load database file metadata: " + err.Error()
		s.mu.Unlock()
		return
	}

	var discoveredFiles []string
	_ = filepath.Walk(s.musicDir, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return nil
		}
		ext := strings.ToLower(filepath.Ext(path))
		if supportedExtensions[ext] {
			discoveredFiles = append(discoveredFiles, path)
		}
		return nil
	})

	s.mu.Lock()
	s.status.Total = len(discoveredFiles)
	s.status.Message = fmt.Sprintf("Found %d audio files", len(discoveredFiles))
	s.mu.Unlock()

	seenPaths := make(map[string]bool)

	for i, path := range discoveredFiles {
		seenPaths[path] = true

		fi, err := os.Stat(path)
		if err != nil {
			s.mu.Lock()
			s.status.Errors++
			s.mu.Unlock()
			continue
		}

		mtime := fi.ModTime().Unix()
		size := fi.Size()

		if meta, exists := existingMeta[path]; exists {
			if meta.FileSize == size && meta.ModifiedAt == mtime && meta.Year >= 1900 && meta.Year <= 2100 && meta.Duration > 0 {
				s.mu.Lock()
				s.status.Scanned++
				s.status.Progress = int((float64(i+1) / float64(len(discoveredFiles))) * 100)
				s.status.CurrentFile = filepath.Base(path)
				s.mu.Unlock()
				continue
			}
		}

		err = s.processAudioFile(path, size, mtime, metaExists(existingMeta, path))
		s.mu.Lock()
		s.status.Scanned++
		s.status.Progress = int((float64(i+1) / float64(len(discoveredFiles))) * 100)
		s.status.CurrentFile = filepath.Base(path)
		if err != nil {
			s.status.Errors++
		}
		s.mu.Unlock()
	}

	for path := range existingMeta {
		if !seenPaths[path] {
			if err := s.songRepo.DeleteByFilePath(path); err == nil {
				s.mu.Lock()
				s.status.Deleted++
				s.mu.Unlock()
			}
		}
	}
}

func metaExists(m map[string]repository.FileMeta, path string) bool {
	_, ok := m[path]
	return ok
}

func (s *ScannerService) processAudioFile(filePath string, size, mtime int64, isUpdate bool) error {
	f, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer f.Close()

	var song models.Song
	song.FilePath = filePath
	song.FileSize = size
	song.ModifiedAt = mtime
	song.Format = strings.TrimPrefix(filepath.Ext(filePath), ".")

	m, err := tag.ReadFrom(f)
	if err == nil {
		song.Title = strings.TrimSpace(m.Title())
		song.Artist = strings.TrimSpace(m.Artist())
		song.AlbumArtist = strings.TrimSpace(m.AlbumArtist())
		song.Album = strings.TrimSpace(m.Album())
		song.Genre = strings.TrimSpace(m.Genre())
		song.Year = m.Year()

		// Fallback ID3 string year extraction if m.Year() returned invalid year (< 1900 or > 2100)
		if song.Year < 1900 || song.Year > 2100 {
			song.Year = extractYearFromRaw(m.Raw())
		}

		trackNo, _ := m.Track()
		discNo, _ := m.Disc()
		song.TrackNumber = trackNo
		song.DiscNumber = discNo

		if pic := m.Picture(); pic != nil && len(pic.Data) > 0 {
			ext := "jpg"
			if strings.Contains(pic.MIMEType, "png") {
				ext = "png"
			}
			hash, err := s.coverSvc.SaveCover(pic.Data, ext)
			if err == nil {
				song.CoverHash = hash
			}
		}
	}

	// Secondary fallback using ffprobe stream/format tags if year is still invalid
	if song.Year < 1900 || song.Year > 2100 {
		song.Year = extractYearWithFFprobe(filePath)
	}

	// Final sanitize: if still invalid, force 0
	if song.Year < 1900 || song.Year > 2100 {
		song.Year = 0
	}

	if song.Title == "" {
		base := filepath.Base(filePath)
		song.Title = strings.TrimSuffix(base, filepath.Ext(base))
	}
	if song.Artist == "" {
		song.Artist = "Unknown Artist"
	}
	if song.AlbumArtist == "" {
		song.AlbumArtist = song.Artist
	}
	if song.Album == "" {
		song.Album = "Unknown Album"
	}

	// Extract accurate audio duration using ffprobe
	exactDuration := parseAudioDuration(filePath)
	if exactDuration > 0 {
		song.Duration = exactDuration
	} else if song.Duration <= 0 {
		song.Duration = float64(size) / (128.0 * 1024.0 / 8.0)
		if song.Duration < 5 {
			song.Duration = 180.0
		}
	}

	artistID, _ := s.artistRepo.GetOrCreate(song.Artist)
	albumID, _ := s.albumRepo.GetOrCreate(song.Album, song.AlbumArtist, song.Year, song.CoverHash)
	genreID, _ := s.genreRepo.GetOrCreate(song.Genre)

	song.ArtistID = artistID
	song.AlbumID = albumID

	_, err = s.songRepo.Upsert(&song, artistID, albumID, genreID)
	if err == nil {
		s.mu.Lock()
		if isUpdate {
			s.status.Updated++
		} else {
			s.status.Added++
		}
		s.mu.Unlock()
	}
	return err
}
