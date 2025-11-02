package config

import (
	"context"
	"log"
	"os"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var (
	S3Client *s3.Client
	S3Bucket string
)

// InitS3 initializes the S3 client and loads configuration
func InitS3() {
	// Load S3 configuration from environment variables
	awsRegion := os.Getenv("AWS_REGION")
	if awsRegion == "" {
		log.Fatal("❌ AWS_REGION not set in environment")
	}

	awsAccessKeyID := os.Getenv("AWS_ACCESS_KEY_ID")
	if awsAccessKeyID == "" {
		log.Fatal("❌ AWS_ACCESS_KEY_ID not set in environment")
	}

	awsSecretAccessKey := os.Getenv("AWS_SECRET_ACCESS_KEY")
	if awsSecretAccessKey == "" {
		log.Fatal("❌ AWS_SECRET_ACCESS_KEY not set in environment")
	}

	S3Bucket = os.Getenv("AWS_S3_BUCKET")
	if S3Bucket == "" {
		log.Fatal("❌ AWS_S3_BUCKET not set in environment")
	}

	// Create AWS SDK configuration
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(awsRegion),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			awsAccessKeyID,
			awsSecretAccessKey,
			"", // Session token is optional
		)),
	)
	if err != nil {
		log.Fatal("❌ Unable to load AWS SDK config:", err)
	}

	// Create S3 client
	S3Client = s3.NewFromConfig(cfg)
	log.Println("✅ S3 client initialized successfully!")
}