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

	tx, err := s.DB.Begin(c.Context())
	if err != nil {
		return DBError(c, err)
	}

	var shortName string
	var fixed bool
	err = tx.QueryRow(c.Context(), "SELECT short_name, fixed_products FROM bank WHERE id = $1", body.BankId).Scan(&shortName, &fixed)
	if err != nil {
		return DBError(c, err)
	}

	accountsToCreate := []string{}

	if fixed {
		switch shortName {
		case "t212":
			accountsToCreate = append(accountsToCreate, "Uninvested Cash", "Portfolio")
		}

	} else {
		accountsToCreate = append(accountsToCreate, body.Name)
	}

	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	createdIds := []string{}

	for _, name := range accountsToCreate {
		var id string
		err = tx.QueryRow(c.Context(), "INSERT INTO account (user_id, bank_id, name) VALUES ($1, $2, $3) RETURNING id", userId, body.BankId, name).Scan(&id)
		if err != nil {
			return DBError(c, err)
		}
		createdIds = append(createdIds, id)
	}

	err = tx.Commit(c.Context())
	if err != nil {
		return DBError(c, err)
	}

	return c.
		Status(http.StatusOK).
		JSON(AccountCreateResponse{Ids: createdIds})
}

func (s Server) GetUserIdAccounts(c *fiber.Ctx, userId string) error {
	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	rows, err := s.DB.Query(
		c.Context(),
		`SELECT a.id, a.name, a.created_at, b.id, b.name, b.csv_import_enabled, b.api_import_enabled
		FROM account a
		LEFT JOIN bank b ON a.bank_id = b.id
		WHERE a.user_id = $1`,
		userId,
	)
	if err != nil {
		return DBError(c, err)
	}

	accounts := []Account{}
	for rows.Next() {
		account := Account{}
		err = rows.Scan(&account.Id, &account.Name, &account.CreatedAt, &account.Bank.Id, &account.Bank.Name, &account.Bank.CsvImportEnabled, &account.Bank.ApiImportEnabled)
		if err != nil {
			return DBError(c, err)
		}
		accounts = append(accounts, account)
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
