package services

import (
	"backend/src/config"
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3Service struct {
	client *s3.Client
	bucket string
}

// NewS3Service creates a new instance of S3Service
func NewS3Service() *S3Service {
	return &S3Service{
		client: config.S3Client,
		bucket: config.S3Bucket,
	}
}

// UploadFile uploads a file to S3
func (s *S3Service) UploadFile(fileData []byte, fileName string, contentType string) (string, error) {
	input := &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(fileName),
		Body:        bytes.NewReader(fileData),
		ContentType: aws.String(contentType),
	}

	_, err := s.client.PutObject(context.TODO(), input)
	if err != nil {
		return "", fmt.Errorf("failed to upload file: %w", err)
	}

	// Return the URL of the uploaded file
	return fmt.Sprintf("https://%s.s3.amazonaws.com/%s", s.bucket, fileName), nil
}

// DownloadFile downloads a file from S3
func (s *S3Service) DownloadFile(fileName string) ([]byte, error) {
	input := &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(fileName),
	}

	result, err := s.client.GetObject(context.TODO(), input)
	if err != nil {
		return nil, fmt.Errorf("failed to download file: %w", err)
	}
	defer result.Body.Close()

	return io.ReadAll(result.Body)
}

// DeleteFile deletes a file from S3
func (s *S3Service) DeleteFile(fileName string) error {
	input := &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(fileName),
	}

	_, err := s.client.DeleteObject(context.TODO(), input)
	if err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	return nil
}

// ListFiles lists all files in the S3 bucket
func (s *S3Service) ListFiles(prefix string) ([]string, error) {
	input := &s3.ListObjectsV2Input{
		Bucket: aws.String(s.bucket),
		Prefix: aws.String(prefix),
	}

	var files []string
	paginator := s3.NewListObjectsV2Paginator(s.client, input)
	for paginator.HasMorePages() {
		output, err := paginator.NextPage(context.TODO())
		if err != nil {
			return nil, fmt.Errorf("failed to list files: %w", err)
		}

		for _, obj := range output.Contents {
			files = append(files, *obj.Key)
		}
	}

	return files, nil
}

// GetSignedURL generates a pre-signed URL for temporary access to a file
func (s *S3Service) GetSignedURL(fileName string, expiry time.Duration) (string, error) {
	presignClient := s3.NewPresignClient(s.client)

	input := &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(fileName),
	}

	presignResult, err := presignClient.PresignGetObject(context.TODO(), input, 
		s3.WithPresignExpires(expiry))
	if err != nil {
		return "", fmt.Errorf("failed to generate pre-signed URL: %w", err)
	}

	return presignResult.URL, nil
}

// FileExists checks if a file exists in the S3 bucket
func (s *S3Service) FileExists(fileName string) (bool, error) {
	_, err := s.client.HeadObject(context.TODO(), &s3.HeadObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(fileName),
	})

	if err != nil {
		// Check if the error is because the file doesn't exist
		var notFound *s3.NotFound
		if ok := errors.As(err, &notFound); ok {
			return false, nil
		}
		return false, fmt.Errorf("failed to check file existence: %w", err)
	}

	return true, nil
}