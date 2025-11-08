package controllers

import (
	"backend/src/config"
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/gin-gonic/gin"
)

type FileEntry struct {
	Name         string `json:"name"`
	Path         string `json:"path"`
	Type         string `json:"type"` // "file" or "folder"
	Size         int64  `json:"size,omitempty"`
	LastModified string `json:"lastModified,omitempty"`
}

// ListUserFiles lists all files and folders in the user's S3 "folder"
func ListUserFiles(c *gin.Context) {
	u, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthenticated"})
		return
	}

	userID := extractUserID(u)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
		return
	}

	ctx := context.Background()
	bucket := config.S3Bucket
	prefix := userID + "/"

	resp, err := config.S3Client.ListObjectsV2(ctx, &s3.ListObjectsV2Input{
		Bucket: &bucket,
		Prefix: &prefix,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list user files"})
		return
	}

	var entries []FileEntry
	folders := make(map[string]bool)

	for _, obj := range resp.Contents {
		key := *obj.Key
		if key == prefix {
			continue
		}

		// Compute relative path inside user folder
		relativePath := strings.TrimPrefix(key, prefix)
		parts := strings.Split(relativePath, "/")

		// Add all parent folders if not already added
		for i := 0; i < len(parts)-1; i++ {
			folderPath := prefix + strings.Join(parts[:i+1], "/") + "/"
			folderName := parts[i]
			if !folders[folderPath] {
				folders[folderPath] = true
				entries = append(entries, FileEntry{
					Name: folderName,
					Path: folderPath,
					Type: "folder",
				})
			}
		}

		// Add the file itself
		fileName := parts[len(parts)-1]
		if fileName != "" {
			lastModified := ""
			if obj.LastModified != nil {
				lastModified = obj.LastModified.Format("2006-01-02 15:04:05")
			}
			entries = append(entries, FileEntry{
				Name:         fileName,
				Path:         key,
				Type:         "file",
				Size:         *obj.Size,
				LastModified: lastModified,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"userFolder": userID,
		"entries":    entries,
	})
}
