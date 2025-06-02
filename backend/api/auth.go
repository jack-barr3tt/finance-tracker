package api

import (
	"log"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func (s Server) PostLogin(c *fiber.Ctx) error {
	body, err := GetBody[LoginRequest](c)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	var id string
	var passwordHash string
	err = s.DB.QueryRow(c.Context(), `SELECT id, password_hash FROM "user" WHERE email = $1`, body.Email).Scan(&id, &passwordHash)
	if err != nil {
		return DBError(c, err)
	}

	err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(body.Password))
	if err != nil {
		return c.SendStatus(fiber.StatusUnauthorized)
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
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.
		Status(http.StatusOK).
		JSON(LoginResponse{
			Id:    id,
			Token: t,
		})
}

func (s Server) PostSignup(c *fiber.Ctx) error {
	body, err := GetBody[SignupRequest](c)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	bytes, err := bcrypt.GenerateFromPassword([]byte(*body.Password), 14)
	if err != nil {
		log.Println(err)
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	_, err = s.DB.Exec(c.Context(), `INSERT INTO "user" (email, password_hash) VALUES ($1, $2)`, body.Email, string(bytes))
	if err != nil {
		return DBError(c, err)
	}

	return c.
		Status(http.StatusOK).
		JSON(SignupResponse{Message: "User created successfully"})
}
