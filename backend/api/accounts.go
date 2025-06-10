package api

import (
	"log"
	"net/http"

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
	err = s.DB.QueryRow(
		c.Context(),
		"INSERT INTO account (user_id, bank_id, name, opened_at) VALUES ($1, $2, $3, $4) RETURNING id",
		userId, body.BankId, body.Name, body.OpenedAt,
	).Scan(&id)
	if err != nil {
		return DBError(c, err)
	}

	return c.
		Status(http.StatusOK).
		JSON(AccountCreateResponse{Id: id})
}

func (s *Server) PatchUserIdAccountsAccountId(c *fiber.Ctx, id string, accountId string) error {
	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != id {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	body, err := GetBody[AccountEditRequest](c)
	if err != nil {
		log.Println(err)
		return c.SendStatus(fiber.StatusBadRequest)
	}

	tag, err := s.DB.Exec(c.Context(), "UPDATE account SET name = $1, opened_at = $2, closed_at = $3 WHERE user_id = $4 AND id = $5",
		body.Name, body.OpenedAt, body.ClosedAt, id, accountId)
	if err != nil {
		return DBError(c, err)
	}

	if tag.RowsAffected() == 0 {
		return c.SendStatus(fiber.StatusNotFound)
	}

	return c.JSON(AccountEditResponse{
		Id: accountId,
	})
}

func (s Server) GetUserIdAccounts(c *fiber.Ctx, userId string) error {
	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	rows, err := s.DB.Query(
		c.Context(),
		`SELECT 
			a.id, a.name, a.opened_at, a.closed_at,
			b.id, b.name, b.short_name, b.csv_import_enabled, b.api_import_enabled
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
		err = rows.Scan(&account.Id, &account.Name, &account.OpenedAt, &account.ClosedAt,
			&account.Bank.Id, &account.Bank.Name, &account.Bank.ShortName, &account.Bank.CsvImportEnabled, &account.Bank.ApiImportEnabled)
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

	account := Account{}

	err := s.DB.QueryRow(
		c.Context(),
		`SELECT 
			a.name, a.opened_at, a.closed_at,
			b.id, b.name, b.short_name, b.csv_import_enabled, b.api_import_enabled, b.fixed_products
		FROM account a 
		LEFT JOIN bank b ON a.bank_id = b.id
		WHERE a.user_id = $1 AND a.id = $2`,
		userId, accountId,
	).Scan(&account.Name, &account.OpenedAt, &account.ClosedAt,
		&account.Bank.Id, &account.Bank.Name, &account.Bank.ShortName, &account.Bank.CsvImportEnabled, &account.Bank.ApiImportEnabled, &account.Bank.FixedProducts)
	if err != nil {
		return DBError(c, err)
	}
	account.Id = accountId

	return c.JSON(account)
}
