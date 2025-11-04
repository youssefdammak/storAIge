package models

import (
	gonanoid "github.com/matoous/go-nanoid/v2"
	"gorm.io/gorm"
	"time"
)

type User struct {
	ID        string    `gorm:"type:char(10);primaryKey" json:"id"`
	Name      string    `json:"name"`
	Email     string    `gorm:"unique" json:"email"`
	Password  string    `json:"-"`
	CreatedAt time.Time `json:"createdAt"`
}

// BeforeCreate: generate a 10-character Nano ID
func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	if u.ID == "" {
		id, err := gonanoid.New(10) // length = 10
		if err != nil {
			return err
		}
		u.ID = id
	}
	return nil
}
