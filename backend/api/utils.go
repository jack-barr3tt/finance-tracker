package api

import (
	"database/sql"
	"errors"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func DBError(c *fiber.Ctx, err error) error {
	if errors.Is(err, sql.ErrNoRows) {
		return c.Status(fiber.StatusNotFound).JSON(NotFound{Message: Ptr("Not Found")})
	}

	log.Println(err)
	return c.SendStatus(fiber.StatusInternalServerError)
}

func Ptr[T any](x T) *T {
	return &x
}

func GetBody[T any](ctx *fiber.Ctx) (*T, error) {
	var body T
	if err := ctx.BodyParser(&body); err != nil {
		return nil, err
	}
	return &body, nil
}

func GetTokenClaim[T any](ctx *fiber.Ctx, claim string) T {
	user := ctx.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	claimValue := claims[claim].(T)
	return claimValue
}
