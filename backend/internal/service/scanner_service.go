package service

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/dhowden/tag"
	"veya/backend/internal/models"
	"veya/backend/internal/repository"
)

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
			if meta.FileSize == size && meta.ModifiedAt == mtime {
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

	if song.Duration <= 0 {
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
