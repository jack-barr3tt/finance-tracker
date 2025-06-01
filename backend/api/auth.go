package api

import (
	"database/sql"
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jack-barr3tt/finance-tracker/utils"
	"golang.org/x/crypto/bcrypt"
)

func (s Server) PostLogin(ctx *fiber.Ctx) error {
	body, err := utils.GetBody[LoginRequest](ctx)
	if err != nil {
		return ctx.SendStatus(fiber.StatusBadRequest)
	}

	var id string
	var passwordHash string
	err = s.DB.QueryRow(ctx.Context(), `SELECT id, password_hash FROM "user" WHERE email = $1`, body.Email).Scan(&id, &passwordHash)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ctx.SendStatus(fiber.StatusNotFound)
		}

		log.Println(err)
		return ctx.SendStatus(fiber.StatusUnauthorized)
	}

	err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(body.Password))
	if err != nil {
		return ctx.SendStatus(fiber.StatusUnauthorized)
	}

	claims := jwt.MapClaims{
		"id":  id,
		"exp": time.Now().Add(time.Hour * 24).Unix(),
	}

	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Generate encoded token and send it as response.
	t, err := token.SignedString([]byte(s.JWTSecret))
	if err != nil {
		return ctx.SendStatus(fiber.StatusInternalServerError)
	}

	return ctx.
		Status(http.StatusOK).
		JSON(LoginResponse{
			Id:    id,
			Token: t,
		})
}

func (s Server) PostSignup(ctx *fiber.Ctx) error {
	body, err := utils.GetBody[SignupRequest](ctx)
	if err != nil {
		return ctx.SendStatus(fiber.StatusBadRequest)
	}

	bytes, err := bcrypt.GenerateFromPassword([]byte(*body.Password), 14)
	if err != nil {
		log.Println(err)
		return ctx.SendStatus(fiber.StatusInternalServerError)
	}

	_, err = s.DB.Exec(ctx.Context(), `INSERT INTO "user" (email, password_hash) VALUES ($1, $2)`, body.Email, string(bytes))
	if err != nil {
		log.Println(err)
		return ctx.SendStatus(fiber.StatusInternalServerError)
	}

	return ctx.
		Status(http.StatusOK).
		JSON(SignupResponse{Message: "User created successfully"})
}
