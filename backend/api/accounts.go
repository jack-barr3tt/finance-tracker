package api

import (
	"log"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
)

func (s Server) PostUserIdAccounts(c *fiber.Ctx, userId string) error {
	body, err := GetBody[AccountCreateRequest](c)
	if err != nil {
		log.Println(err)
		return c.SendStatus(fiber.StatusBadRequest)
	}

	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	var id string

	err = s.DB.QueryRow(c.Context(), "INSERT INTO account (user_id, name) VALUES ($1, $2) RETURNING id", userId, body.Name).Scan(&id)
	if err != nil {
		return DBError(c, err)
	}

	return c.
		Status(http.StatusOK).
		JSON(AccountCreateResponse{Id: id})
}

func (s Server) GetUserIdAccounts(c *fiber.Ctx, userId string) error {
	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	rows, err := s.DB.Query(c.Context(), "SELECT id, name, created_at FROM account WHERE user_id = $1", userId)
	if err != nil {
		return DBError(c, err)
	}

	accounts := []Account{}
	for rows.Next() {
		var id string
		var name string
		var createdAt time.Time
		err = rows.Scan(&id, &name, &createdAt)
		if err != nil {
			return DBError(c, err)
		}
		accounts = append(accounts, Account{Id: id, Name: name, CreatedAt: createdAt})
	}

	return c.
		Status(http.StatusOK).
		JSON(accounts)
}

func (s Server) DeleteUserIdAccountsAccountId(c *fiber.Ctx, userId string, accountId string) error {
	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	tag, err := s.DB.Exec(c.Context(), "DELETE FROM account WHERE user_id = $1 AND id = $2", userId, accountId)
	if err != nil {
		return DBError(c, err)
	}

	if tag.RowsAffected() == 0 {
		return c.SendStatus(fiber.StatusNotFound)
	}

	return c.Status(http.StatusOK).JSON(AccountDeleteResponse{
		Id:      accountId,
		Message: "Account deleted",
	})
}

func (s Server) GetUserIdAccountsAccountId(c *fiber.Ctx, userId string, accountId string) error {
	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	var name string
	var createdAt time.Time

	err := s.DB.QueryRow(c.Context(), "SELECT name, created_at FROM account WHERE user_id = $1 AND id = $2", userId, accountId).Scan(&name, &createdAt)
	if err != nil {
		return DBError(c, err)
	}

	return c.
		Status(http.StatusOK).
		JSON(Account{
			Id:        accountId,
			Name:      name,
			CreatedAt: createdAt,
		})
}
