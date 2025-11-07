package controllers

import (
    "backend/src/config"
    "backend/src/middleware"
    "context"
    "fmt"
    "net/http"
    "path/filepath"

    "github.com/aws/aws-sdk-go-v2/service/s3"
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
)

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

    // We accept an optional description but do not store it server-side in this minimal flow.
    _ = c.PostForm("description")
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

    // Build safe S3 key: userID/<uuid><ext>
    ext := filepath.Ext(fileHeader.Filename)
    key := fmt.Sprintf("%s/%s%s", userID, uuid.New().String(), ext)

    // Prepare PutObjectInput
    bucket := config.S3Bucket
    k := key
    contentType := fileHeader.Header.Get("Content-Type")

    // Upload to S3 (streamed)
    _, err = config.S3Client.PutObject(context.TODO(), &s3.PutObjectInput{
        Bucket:      &bucket,
        Key:         &k,
        Body:        file,
        ContentType: &contentType,
    })
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to upload to s3"})
        return
    }

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
