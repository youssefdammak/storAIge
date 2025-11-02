package main

import (
    "context"
    "fmt"
    "log"
    "os"

    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/s3"
		"github.com/aws/aws-sdk-go-v2/credentials"
    "github.com/joho/godotenv"
)

func main() {
		// Load environment variables from .env file
    err := godotenv.Load("../.env") // Specify the path to the .env file
    if err != nil {
        log.Println("⚠️  Warning: .env file not found, reading system env vars instead")
    }

    // Create AWS config
    awsConfig, err := config.LoadDefaultConfig(context.TODO(),
        config.WithRegion(os.Getenv("AWS_REGION")),
        config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
            os.Getenv("AWS_ACCESS_KEY_ID"),
            os.Getenv("AWS_SECRET_ACCESS_KEY"),
            "",
        )),
    )
    if err != nil {
        log.Fatal("❌ Failed to load AWS configuration:", err)
    }

    // Create S3 client
    s3Client := s3.NewFromConfig(awsConfig)

    // List objects in the S3 bucket
    bucket := os.Getenv("AWS_S3_BUCKET")
    resp, err := s3Client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
        Bucket: &bucket,
    })
    if err != nil {
        log.Fatal("❌ Failed to list objects:", err)
    }

    fmt.Println("✅ Successfully connected to S3. Objects in bucket:")
    for _, obj := range resp.Contents {
        fmt.Printf("- %s (Size: %d bytes)\n", *obj.Key, obj.Size)
    }
}