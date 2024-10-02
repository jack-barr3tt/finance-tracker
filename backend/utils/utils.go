package utils

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

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
