package api

import (
	"database/sql"
	"time"

	"github.com/gofiber/fiber/v2"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

func (s Server) PostUserIdBudgetTransactions(c *fiber.Ctx, userId string) error {
	body, err := GetBody[BudgetTransactionCreateRequest](c)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	if err := validateSegmentDates(body.StartsOn, body.EndsOn); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	var id string

	err = s.DB.QueryRow(
		c.Context(),
		`INSERT INTO budget_transaction (category_id, amount, description, repeat_until, repeat_every, starts_on, ends_on)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id`,
		body.CategoryId,
		body.Amount,
		body.Description,
		body.RepeatUntil,
		body.RepeatEvery,
		timeFromOpenAPIDate(body.StartsOn),
		nullableDateParam(body.EndsOn),
	).Scan(&id)
	if err != nil {
		return DBError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(BudgetTransactionCreateResponse{
		Id: id,
	})
}

func (s Server) GetUserIdBudgetTransactions(c *fiber.Ctx, userId string) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	rows, err := s.DB.Query(
		c.Context(),
		`SELECT 
			bt.id, bt.amount, bt.description, bt.repeat_until, bt.repeat_every, bt.starts_on, bt.ends_on, bt.created_at, bt.deleted_at,
			c.id, c.name, c.created_at
		FROM budget_transaction bt
		INNER JOIN category c ON bt.category_id = c.id
		WHERE c.user_id = $1 AND bt.deleted_at IS NULL
		ORDER BY bt.starts_on DESC, bt.created_at DESC`,
		userId,
	)
	if err != nil {
		return DBError(c, err)
	}

	budgetTransactions := []BudgetTransaction{}
	for rows.Next() {
		budgetTransaction, err := scanBudgetTransactionRow(rows)
		if err != nil {
			return DBError(c, err)
		}
		budgetTransactions = append(budgetTransactions, budgetTransaction)
	}

	return c.Status(fiber.StatusOK).JSON(budgetTransactions)
}

func (s *Server) GetUserIdBudgetTransactionsBudgetTransactionId(c *fiber.Ctx, id string, budgetTransactionId string) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != id {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	row := s.DB.QueryRow(c.Context(), `
		SELECT 
			bt.id, bt.amount, bt.description, bt.repeat_until, bt.repeat_every, bt.starts_on, bt.ends_on, bt.created_at, bt.deleted_at,
			c.id, c.name, c.created_at
		FROM budget_transaction bt
		INNER JOIN category c ON bt.category_id = c.id
		WHERE bt.id = $1 AND c.user_id = $2
	`, budgetTransactionId, id)

	budgetTransaction, err := scanBudgetTransactionRow(row)
	if err != nil {
		return DBError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(budgetTransaction)
}

func (s *Server) PatchUserIdBudgetTransactionsBudgetTransactionId(c *fiber.Ctx, id string, budgetTransactionId string) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != id {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	body, err := GetBody[BudgetTransactionEditRequest](c)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	if err := validateSegmentDates(body.EffectiveFrom, body.EndsOn); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	row := s.DB.QueryRow(c.Context(), `
		SELECT bt.category_id, bt.description, bt.starts_on, bt.ends_on
		FROM budget_transaction bt
		INNER JOIN category c ON bt.category_id = c.id
		WHERE bt.id = $1 AND c.user_id = $2 AND bt.deleted_at IS NULL
	`, budgetTransactionId, id)

	var oldCategoryId *string
	var oldDescription *string
	var oldStartsOn time.Time
	var oldEndsOn sql.NullTime
	if err := row.Scan(&oldCategoryId, &oldDescription, &oldStartsOn, &oldEndsOn); err != nil {
		return DBError(c, err)
	}

	oldStartsOnDate := openAPIDateFromTime(oldStartsOn)
	var oldEndsOnDate *openapi_types.Date
	if oldEndsOn.Valid {
		oldEndsOnDate = scanNullableDate(oldEndsOn)
	}

	if err := validateEffectiveSplit(oldStartsOnDate, oldEndsOnDate, body.EffectiveFrom); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	categoryId := oldCategoryId
	if body.CategoryId != nil {
		categoryId = body.CategoryId
	}
	description := oldDescription
	if body.Description != nil {
		description = body.Description
	}

	if effectiveFromOnOrBeforeSegmentStart(oldStartsOnDate, body.EffectiveFrom) {
		tag, err := s.DB.Exec(c.Context(), `
			UPDATE budget_transaction bt
			SET category_id = $1, amount = $2, description = $3, repeat_until = $4, repeat_every = $5,
				starts_on = $6, ends_on = $7
			FROM category c
			WHERE bt.id = $8 AND bt.category_id = c.id AND c.user_id = $9 AND bt.deleted_at IS NULL
		`,
			categoryId,
			body.Amount,
			description,
			body.RepeatUntil,
			body.RepeatEvery,
			timeFromOpenAPIDate(body.EffectiveFrom),
			nullableDateParam(body.EndsOn),
			budgetTransactionId,
			id,
		)
		if err != nil {
			return DBError(c, err)
		}
		if tag.RowsAffected() == 0 {
			return c.SendStatus(fiber.StatusNotFound)
		}

		return c.JSON(BudgetTransactionEditResponse{
			Id: budgetTransactionId,
		})
	}

	tx, err := s.DB.Begin(c.Context())
	if err != nil {
		return DBError(c, err)
	}
	defer tx.Rollback(c.Context())

	oldEndsOnValue := endDateBefore(body.EffectiveFrom)
	tag, err := tx.Exec(c.Context(), `
		UPDATE budget_transaction bt
		SET ends_on = $1
		FROM category c
		WHERE bt.id = $2 AND bt.category_id = c.id AND c.user_id = $3 AND bt.deleted_at IS NULL
	`, timeFromOpenAPIDate(oldEndsOnValue), budgetTransactionId, id)
	if err != nil {
		return DBError(c, err)
	}
	if tag.RowsAffected() == 0 {
		return c.SendStatus(fiber.StatusNotFound)
	}

	var newId string
	err = tx.QueryRow(
		c.Context(),
		`INSERT INTO budget_transaction (category_id, amount, description, repeat_until, repeat_every, starts_on, ends_on)
		SELECT $1, $2, $3, $4, $5, $6, $7
		FROM category c
		WHERE c.id = $1 AND c.user_id = $8
		RETURNING id`,
		categoryId,
		body.Amount,
		description,
		body.RepeatUntil,
		body.RepeatEvery,
		timeFromOpenAPIDate(body.EffectiveFrom),
		nullableDateParam(body.EndsOn),
		id,
	).Scan(&newId)
	if err != nil {
		return DBError(c, err)
	}

	if err := tx.Commit(c.Context()); err != nil {
		return DBError(c, err)
	}

	return c.JSON(BudgetTransactionEditResponse{
		Id: newId,
	})
}

func (s Server) DeleteUserIdBudgetTransactionsBudgetTransactionId(c *fiber.Ctx, userId, budgetTransactionId string) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	tag, err := s.DB.Exec(c.Context(), `
		UPDATE budget_transaction bt
		SET deleted_at = NOW()
		FROM category c
		WHERE bt.id = $1 AND bt.category_id = c.id AND c.user_id = $2
	`, budgetTransactionId, userId)
	if err != nil {
		return DBError(c, err)
	}

	if tag.RowsAffected() == 0 {
		return c.SendStatus(fiber.StatusNotFound)
	}

	return c.Status(fiber.StatusOK).JSON(BudgetTransactionDeleteResponse{
		Id:      budgetTransactionId,
		Message: "Budget transaction deleted",
	})
}

type budgetTransactionScanner interface {
	Scan(dest ...any) error
}

func scanBudgetTransactionRow(scanner budgetTransactionScanner) (BudgetTransaction, error) {
	budgetTransaction := BudgetTransaction{}
	var c_id string
	var c_name string
	var c_created_at time.Time
	var startsOn time.Time
	var endsOn sql.NullTime

	err := scanner.Scan(
		&budgetTransaction.Id,
		&budgetTransaction.Amount,
		&budgetTransaction.Description,
		&budgetTransaction.RepeatUntil,
		&budgetTransaction.RepeatEvery,
		&startsOn,
		&endsOn,
		&budgetTransaction.CreatedAt,
		&budgetTransaction.DeletedAt,
		&c_id,
		&c_name,
		&c_created_at,
	)
	if err != nil {
		return budgetTransaction, err
	}

	budgetTransaction.StartsOn = openAPIDateFromTime(startsOn)
	budgetTransaction.EndsOn = scanNullableDate(endsOn)
	budgetTransaction.Category = &Category{
		Id:        c_id,
		Name:      c_name,
		CreatedAt: c_created_at,
		Rules:     []CategoryRule{},
	}

	return budgetTransaction, nil
}
