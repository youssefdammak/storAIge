package config

import (
    "context"
    "log"
    "os"

    awscfg "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/credentials"
    "github.com/aws/aws-sdk-go-v2/service/s3"
    "github.com/joho/godotenv"
)

var (
    // S3Bucket is the configured bucket name from environment
    S3Bucket string
    // S3Client is the initialized AWS S3 client
    S3Client *s3.Client
)

func init() {
    // Load environment variables from .env (optional)
    if err := godotenv.Load(".env"); err != nil {
        log.Printf("Warning: .env not found or could not be loaded: %v", err)
    }

    S3Bucket = os.Getenv("S3_BUCKET_NAME")

    cfg, err := awscfg.LoadDefaultConfig(context.TODO(),
        awscfg.WithRegion(os.Getenv("AWS_REGION")),
        awscfg.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
            os.Getenv("AWS_ACCESS_KEY_ID"),
            os.Getenv("AWS_SECRET_ACCESS_KEY"),
            "",
        )),
    )
    if err != nil {
        log.Fatalf("Unable to load AWS config: %v", err)
    }

    S3Client = s3.NewFromConfig(cfg)
}
