package handlers

import (
	"net/http"

	"veya/backend/internal/service"
)

type ScanHandler struct {
	scannerSvc *service.ScannerService
}

func NewScanHandler(scannerSvc *service.ScannerService) *ScanHandler {
	return &ScanHandler{scannerSvc: scannerSvc}
}

func (h *ScanHandler) StartScan(w http.ResponseWriter, r *http.Request) {
	started, status := h.scannerSvc.StartScan()
	if !started {
		JSON(w, http.StatusOK, map[string]interface{}{
			"message": "Scan already in progress",
			"status":  status,
		})
		return
	}

	JSON(w, http.StatusAccepted, map[string]interface{}{
		"message": "Library scan triggered",
		"status":  status,
	})
}

func (h *ScanHandler) GetStatus(w http.ResponseWriter, r *http.Request) {
	status := h.scannerSvc.GetStatus()
	JSON(w, http.StatusOK, status)
}
