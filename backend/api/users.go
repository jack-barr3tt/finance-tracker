package api

import (
	"database/sql"
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jack-barr3tt/finance-tracker/utils"
)

func (s Server) GetUserId(ctx *fiber.Ctx, reqId string) error {
	if ctx.Locals("user") == nil {
		return ctx.SendStatus(fiber.StatusBadRequest)
	}

	userId := utils.GetTokenClaim[string](ctx, "id")

	if userId != reqId {
		return ctx.SendStatus(fiber.StatusUnauthorized)
	}

	var email string
	var createdAt time.Time

	err := s.DB.QueryRow(ctx.Context(), `SELECT email, created_at FROM "user" WHERE id = $1`, userId).Scan(&email, &createdAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ctx.SendStatus(fiber.StatusNotFound)
		}

		log.Println(err)
		return ctx.SendStatus(fiber.StatusInternalServerError)
	}

	return ctx.
		Status(http.StatusOK).JSON(User{
		Id:        userId,
		Email:     email,
		CreatedAt: createdAt,
	})
}
