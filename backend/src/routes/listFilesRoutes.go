package routes

import (
	"backend/src/controllers"
	"backend/src/middleware"

	"github.com/gin-gonic/gin"
)

func ListFilesRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		listFiles := api.Group("/listFiles")
		listFiles.Use(middleware.Protect())
		{
			listFiles.POST("/", controllers.ListUserFiles)
		}
	}
}
