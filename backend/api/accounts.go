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

func (s Server) PostUserIdAccounts(ctx *fiber.Ctx, userId int) error {
	body, err := utils.GetBody[AccountCreateRequest](ctx)
	if err != nil {
		log.Println(err)
		return ctx.SendStatus(fiber.StatusBadRequest)
	}

	tokUserId := utils.GetTokenClaim[float64](ctx, "id")

	if int(tokUserId) != userId {
		return ctx.SendStatus(fiber.StatusUnauthorized)
	}

	var id int

	err = s.DB.QueryRow(ctx.Context(), "INSERT INTO accounts (user_id, name) VALUES ($1, $2) RETURNING id", userId, body.Name).Scan(&id)
	if err != nil {
		log.Println(err)
		return ctx.SendStatus(fiber.StatusInternalServerError)
	}

	return ctx.
		Status(http.StatusOK).
		JSON(AccountCreateResponse{Id: id})
}

func (s Server) GetUserIdAccounts(ctx *fiber.Ctx, userId int) error {
	tokUserId := utils.GetTokenClaim[float64](ctx, "id")

	if int(tokUserId) != userId {
		return ctx.SendStatus(fiber.StatusUnauthorized)
	}

	rows, err := s.DB.Query(ctx.Context(), "SELECT id, name, created_at FROM accounts WHERE user_id = $1", userId)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ctx.SendStatus(fiber.StatusNotFound)
		}

		log.Println(err)
		return ctx.SendStatus(fiber.StatusInternalServerError)
	}

	accounts := []Account{}
	for rows.Next() {
		var id int
		var name string
		var createdAt time.Time
		err = rows.Scan(&id, &name, &createdAt)
		if err != nil {
			log.Println(err)
			return ctx.SendStatus(fiber.StatusInternalServerError)
		}
		accounts = append(accounts, Account{Id: id, Name: name, CreatedAt: createdAt})
	}

	return ctx.
		Status(http.StatusOK).
		JSON(accounts)
}

func (s Server) DeleteUserIdAccountsAccountId(ctx *fiber.Ctx, userId int, accountId int) error {
	tokUserId := utils.GetTokenClaim[float64](ctx, "id")

	if int(tokUserId) != userId {
		return ctx.SendStatus(fiber.StatusUnauthorized)
	}

	tag, err := s.DB.Exec(ctx.Context(), "DELETE FROM accounts WHERE user_id = $1 AND id = $2", userId, accountId)
	if err != nil {
		log.Println(err)
		return ctx.SendStatus(fiber.StatusInternalServerError)
	}

	if tag.RowsAffected() == 0 {
		return ctx.SendStatus(fiber.StatusNotFound)
	}

	return ctx.Status(http.StatusOK).JSON(AccountDeleteResponse{
		Id:      accountId,
		Message: "Account deleted",
	})
}

func (s Server) GetUserIdAccountsAccountId(ctx *fiber.Ctx, userId int, accountId int) error {
	tokUserId := utils.GetTokenClaim[float64](ctx, "id")

	if int(tokUserId) != userId {
		return ctx.SendStatus(fiber.StatusUnauthorized)
	}

	var name string
	var createdAt time.Time

	err := s.DB.QueryRow(ctx.Context(), "SELECT name, created_at FROM accounts WHERE user_id = $1 AND id = $2", userId, accountId).Scan(&name, &createdAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ctx.SendStatus(fiber.StatusNotFound)
		}

		log.Println(err)
		return ctx.SendStatus(fiber.StatusInternalServerError)
	}

	return ctx.
		Status(http.StatusOK).
		JSON(Account{
			Id:        accountId,
			Name:      name,
			CreatedAt: createdAt,
		})
}
