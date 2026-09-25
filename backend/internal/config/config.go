package config

import (
	"os"
	"path/filepath"
)

type Config struct {
	Port      string
	DBPath    string
	MusicDir  string
	CoversDir string
	LogLevel  string
	Env       string
}

func Load() *Config {
	port := getEnv("PORT", "8080")
	dbPath := getEnv("DB_PATH", "/data/veya.db")
	musicDir := getEnv("MUSIC_DIR", "/music")
	coversDir := getEnv("COVERS_DIR", "/data/covers")
	logLevel := getEnv("LOG_LEVEL", "info")
	env := getEnv("ENV", "development")

	// Fallback paths for local dev if default /data or /music dirs don't exist
	if env == "development" {
		if dbPath == "/data/veya.db" {
			execDir, _ := os.Getwd()
			dbPath = filepath.Join(execDir, "data", "veya.db")
		}
		if coversDir == "/data/covers" {
			execDir, _ := os.Getwd()
			coversDir = filepath.Join(execDir, "data", "covers")
		}
		if musicDir == "/music" {
			execDir, _ := os.Getwd()
			musicDir = filepath.Join(execDir, "music")
		}
	}

	return &Config{
		Port:      port,
		DBPath:    dbPath,
		MusicDir:  musicDir,
		CoversDir: coversDir,
		LogLevel:  logLevel,
		Env:       env,
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists && value != "" {
		return value
	}
	return fallback
}
