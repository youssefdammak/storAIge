package controllers

import (
	"backend/src/config"
	"backend/src/middleware"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"sort"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/smithy-go"
	"github.com/gin-gonic/gin"
)

type FileEntry struct {
	Name string `json:"name"`
	Path string `json:"path"`
	Type string `json:"type"` // "file" or "folder"
	Size int64  `json:"size,omitempty"`
}

type AnalyzeRequest struct {
	Filename string      `json:"filename"`
	Content  string      `json:"content"`
	Files    []FileEntry `json:"files"`
}

type AnalyzeResponse struct {
	Folder string `json:"folder"`
}

// UploadFile handles file uploads: expects multipart form with 'file' and 'description'.
func UploadFile(c *gin.Context) {
	// Get authenticated user from context (set by middleware)
	u, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthenticated"})
		return
	}

	fmt.Printf("user: %#v\n", u)
	// Extract user ID from possible claim shapes
	userID := extractUserID(u)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
		return
	}

	// We accept an optional description.
	desc := c.PostForm("description")
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}

	// Open file as io.Reader (streaming)
	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not open uploaded file"})
		return
	}
	defer file.Close()

	ctx := c.Request.Context()

	// Build safe S3 key: userID/<filename>(n).ext if duplicates exist
	key, err := buildUniqueObjectKey(ctx, config.S3Bucket, userID, fileHeader.Filename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to calculate storage path"})
		return
	}

	// Prepare PutObjectInput
	bucket := config.S3Bucket
	k := key
	contentType := fileHeader.Header.Get("Content-Type")

	// Upload to S3 (streamed)
	_, err = config.S3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      &bucket,
		Key:         &k,
		Body:        file,
		ContentType: &contentType,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to upload to s3"})
		return
	}

	// Call the user file structure
	str, err := GetUserFiles(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve user files"})
		return
	}

	// ================= AI Agent Integration =================

	// Call AI agent
	aiFolder, err := CallAIAgent(fileHeader.Filename, desc, str)
	if err != nil {
		fmt.Println("AI agent error:", err)
		aiFolder = "Uncategorized"
	}

	fmt.Println("AI selected folder:", aiFolder)

	// Minimal response: return the S3 key only. No DB persistence.
	c.JSON(http.StatusCreated, gin.H{"key": key})
}

// extractUserID attempts to cope with several possible claim shapes placed into context by middleware.
func extractUserID(u interface{}) string {
	// We expect the auth middleware to set a *middleware.Claims
	switch v := u.(type) {
	case *middleware.Claims:
		return fmt.Sprint(v.ID)
	case map[string]interface{}:
		if idVal, ok := v["id"]; ok {
			return fmt.Sprint(idVal)
		}
		// key missing — return empty string
		return ""
	case string:
		return v
	default:
		return fmt.Sprint(v)
	}
}

func buildUniqueObjectKey(ctx context.Context, bucket, userID, originalName string) (string, error) {
	ext := filepath.Ext(originalName)
	base := strings.TrimSuffix(originalName, ext)
	if base == "" {
		base = "file"
	}

	attempt := 0
	for {
		suffix := ""
		if attempt > 0 {
			suffix = fmt.Sprintf(" (%d)", attempt)
		}

		key := fmt.Sprintf("%s/%s%s%s", userID, base, suffix, ext)
		exists, err := objectExists(ctx, bucket, key)
		if err != nil {
			return "", err
		}
		if !exists {
			return key, nil
		}
		attempt++
	}
}

func objectExists(ctx context.Context, bucket, key string) (bool, error) {
	b := bucket
	k := key
	_, err := config.S3Client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: &b,
		Key:    &k,
	})
	if err != nil {
		var apiErr smithy.APIError
		if errors.As(err, &apiErr) {
			code := apiErr.ErrorCode()
			if code == "NotFound" || code == "404" || code == "NoSuchKey" {
				return false, nil
			}
		}
		return false, err
	}
	return true, nil
}

// GetUserFiles returns all files and folders in a user's S3 folder
func GetUserFiles(userID string) ([]FileEntry, error) {
	ctx := context.Background()
	bucket := config.S3Bucket
	prefix := userID + "/"

	resp, err := config.S3Client.ListObjectsV2(ctx, &s3.ListObjectsV2Input{
		Bucket: &bucket,
		Prefix: &prefix,
	})
	if err != nil {
		return nil, err
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

		// Add parent folders
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

		// Add file entry
		fileName := parts[len(parts)-1]
		if fileName != "" {
			entries = append(entries, FileEntry{
				Name: fileName,
				Path: key,
				Type: "file",
				Size: *obj.Size,
			})
		}
	}

	// Sort: folders first, then files (alphabetically within each group)
	sort.Slice(entries, func(i, j int) bool {
		if entries[i].Type == entries[j].Type {
			return entries[i].Name < entries[j].Name
		}
		return entries[i].Type == "folder"
	})

	// Optional: make folder structure look cleaner (like a tree)
	for i := range entries {
		if entries[i].Type == "folder" {
			entries[i].Path = strings.TrimSuffix(entries[i].Path, "/")
		}
	}

	return entries, nil
}

func CallAIAgent(filename, desc string, files []FileEntry) (string, error) {
	// Prepare request body
	reqBody := AnalyzeRequest{
		Filename: filename,
		Content:  desc,
		Files:    files,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %v", err)
	}

	// Send POST request
	resp, err := http.Post("http://localhost:8000/analyze", "application/json", bytes.NewBuffer(body))
	if err != nil {
		return "", fmt.Errorf("failed to call AI agent: %v", err)
	}
	defer resp.Body.Close()

	// Read response
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %v", err)
	}

	// Parse JSON response
	var result AnalyzeResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("invalid JSON from AI agent: %v", err)
	}

	return result.Folder, nil
}
