package main

import (
    "bytes"
    "context"
    "log"
    "os"

    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/s3"
)

func main() {
    // Load AWS configuration
    cfg, err := config.LoadDefaultConfig(context.TODO())
    if err != nil {
        log.Fatal("❌ Unable to load AWS SDK config:", err)
    }

    // Create S3 client
    s3Client := s3.NewFromConfig(cfg)

    // Define the bucket and object key
    bucket := os.Getenv("AWS_S3_BUCKET")
    if bucket == "" {
        log.Fatal("❌ AWS_S3_BUCKET environment variable is not set; unable to determine target bucket")
    }
    objectKey := "test-file.txt"

    // Create the content to upload
    content := []byte("This is a test file for S3 bucket. Suleiman Latrsh. senior software engineer.Intern Developer.")
    _, err = s3Client.PutObject(context.TODO(), &s3.PutObjectInput{
        Bucket: aws.String(bucket),
        Key:    aws.String(objectKey),
        Body:   bytes.NewReader(content),
    })
    if err != nil {
        log.Fatal("❌ Failed to upload object:", err)
    }

    log.Println("✅ Successfully uploaded", objectKey, "to", bucket)
}
