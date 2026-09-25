package service

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
)

type CoverService struct {
	coversDir string
}

func NewCoverService(coversDir string) *CoverService {
	_ = os.MkdirAll(coversDir, 0755)
	return &CoverService{coversDir: coversDir}
}

func (s *CoverService) SaveCover(imgData []byte, ext string) (string, error) {
	if len(imgData) == 0 {
		return "", nil
	}

	hash := md5.Sum(imgData)
	hashStr := hex.EncodeToString(hash[:])
	if ext == "" {
		ext = "jpg"
	}

	filename := fmt.Sprintf("%s.%s", hashStr, ext)
	filePath := filepath.Join(s.coversDir, filename)

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		err := os.WriteFile(filePath, imgData, 0644)
		if err != nil {
			return "", fmt.Errorf("failed to save cover artwork: %w", err)
		}
	}

	return hashStr, nil
}

func (s *CoverService) GetCoverPath(hashStr string) (string, error) {
	if hashStr == "" {
		return "", fmt.Errorf("empty cover hash")
	}

	matches, err := filepath.Glob(filepath.Join(s.coversDir, hashStr+".*"))
	if err != nil || len(matches) == 0 {
		return "", fmt.Errorf("cover not found")
	}
	return matches[0], nil
}
