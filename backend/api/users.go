package api

import (
	"log"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func (s Server) GetUserId(ctx *fiber.Ctx, reqId int) error {
	if ctx.Locals("user") == nil {
		return ctx.SendStatus(fiber.StatusBadRequest)
	}

	user := ctx.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userId := claims["id"].(float64)

	if int(userId) != reqId {
		return ctx.SendStatus(fiber.StatusUnauthorized)
	}

	var email string
	var createdAt time.Time

	err := s.DB.QueryRow(ctx.Context(), "SELECT email, created_at FROM users WHERE id = $1", userId).Scan(&email, &createdAt)
	if err != nil {
		log.Fatal(err)
		return ctx.SendStatus(fiber.StatusInternalServerError)
	}

	return ctx.
		Status(http.StatusOK).JSON(User{
		Id:        int(userId),
		Email:     email,
		CreatedAt: createdAt,
	})
}
