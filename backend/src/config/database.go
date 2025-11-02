package config

import (
	"backend/src/models"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  Warning: .env file not found, reading system env vars instead")
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("❌ DATABASE_URL not set in .env")
	}

	// Connect to PostgreSQL
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ Failed to connect to database:", err)
	}

	// ✅ Run migrations (includes new UUID field)
	if err := db.AutoMigrate(&models.User{}); err != nil {
		log.Fatalf("❌ Migration failed: %v", err)
	}

	DB = db
	fmt.Println("✅ Database connected and migrated successfully!")
}
