package api

import (
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
)

func (s Server) GetUserId(c *fiber.Ctx, reqId string) error {
	if c.Locals("user") == nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	userId := GetTokenClaim[string](c, "id")

	if userId != reqId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	var email string
	var createdAt time.Time

	err := s.DB.QueryRow(c.Context(), `SELECT email, created_at FROM "user" WHERE id = $1`, userId).Scan(&email, &createdAt)
	if err != nil {
		return DBError(c, err)
	}

	return c.
		Status(http.StatusOK).JSON(User{
		Id:        userId,
		Email:     email,
		CreatedAt: createdAt,
	})
}
