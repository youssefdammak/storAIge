package routes

import (
    "backend/src/controllers"
    "backend/src/middleware"

    "github.com/gin-gonic/gin"
)

func UploadRoutes(r *gin.Engine) {
    api := r.Group("/api")
    {
        uploads := api.Group("/uploads")
        uploads.Use(middleware.Protect())
        {
            uploads.POST("/", controllers.UploadFile)
        }
    }
}
