package api

import (
	"database/sql"
	"time"

	"github.com/gofiber/fiber/v2"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

func (s Server) PostUserIdCategoryBudgets(c *fiber.Ctx, userId string) error {
	body, err := GetBody[CategoryBudgetCreateRequest](c)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	if body.Amount <= 0 {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	if err := validateSegmentDates(body.StartsOn, body.EndsOn); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	var id string

	err = s.DB.QueryRow(
		c.Context(),
		`INSERT INTO category_budget (category_id, amount, repeat_until, repeat_every, starts_on, ends_on)
		SELECT $1, $2, $3, $4, $5, $6
		FROM category
		WHERE id = $1 AND user_id = $7
		RETURNING id`,
		body.CategoryId,
		body.Amount,
		body.RepeatUntil,
		body.RepeatEvery,
		timeFromOpenAPIDate(body.StartsOn),
		nullableDateParam(body.EndsOn),
		userId,
	).Scan(&id)
	if err != nil {
		if isUniqueViolation(err) {
			return c.Status(fiber.StatusConflict).JSON(Conflict{
				Message: "A category budget already exists for this category in the selected date range",
			})
		}
		return DBError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(CategoryBudgetCreateResponse{
		Id: id,
	})
}

func (s Server) GetUserIdCategoryBudgets(c *fiber.Ctx, userId string) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	rows, err := s.DB.Query(
		c.Context(),
		`SELECT
			cb.id, cb.amount, cb.repeat_until, cb.repeat_every, cb.starts_on, cb.ends_on, cb.created_at, cb.deleted_at,
			c.id, c.name, c.created_at
		FROM category_budget cb
		INNER JOIN category c ON cb.category_id = c.id
		WHERE c.user_id = $1 AND cb.deleted_at IS NULL
		ORDER BY cb.starts_on DESC, cb.created_at DESC`,
		userId,
	)
	if err != nil {
		return DBError(c, err)
	}

	categoryBudgets := []CategoryBudget{}
	for rows.Next() {
		categoryBudget, err := scanCategoryBudgetRow(rows)
		if err != nil {
			return DBError(c, err)
		}
		categoryBudgets = append(categoryBudgets, categoryBudget)
	}

	return c.Status(fiber.StatusOK).JSON(categoryBudgets)
}

func (s *Server) GetUserIdCategoryBudgetsCategoryBudgetId(c *fiber.Ctx, id string, categoryBudgetId string) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != id {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	row := s.DB.QueryRow(c.Context(), `
		SELECT
			cb.id, cb.amount, cb.repeat_until, cb.repeat_every, cb.starts_on, cb.ends_on, cb.created_at, cb.deleted_at,
			c.id, c.name, c.created_at
		FROM category_budget cb
		INNER JOIN category c ON cb.category_id = c.id
		WHERE cb.id = $1 AND c.user_id = $2 AND cb.deleted_at IS NULL
	`, categoryBudgetId, id)

	categoryBudget, err := scanCategoryBudgetRow(row)
	if err != nil {
		return DBError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(categoryBudget)
}

func (s *Server) PatchUserIdCategoryBudgetsCategoryBudgetId(c *fiber.Ctx, id string, categoryBudgetId string) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != id {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	body, err := GetBody[CategoryBudgetEditRequest](c)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	if body.Amount <= 0 {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	if err := validateSegmentDates(body.EffectiveFrom, body.EndsOn); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	row := s.DB.QueryRow(c.Context(), `
		SELECT cb.category_id, cb.starts_on, cb.ends_on
		FROM category_budget cb
		INNER JOIN category c ON cb.category_id = c.id
		WHERE cb.id = $1 AND c.user_id = $2 AND cb.deleted_at IS NULL
	`, categoryBudgetId, id)

	var oldCategoryId string
	var oldStartsOn time.Time
	var oldEndsOn sql.NullTime
	if err := row.Scan(&oldCategoryId, &oldStartsOn, &oldEndsOn); err != nil {
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
		var categoryExists bool
		err = s.DB.QueryRow(
			c.Context(),
			`SELECT EXISTS(SELECT 1 FROM category WHERE id = $1 AND user_id = $2)`,
			*body.CategoryId,
			id,
		).Scan(&categoryExists)
		if err != nil {
			return DBError(c, err)
		}
		if !categoryExists {
			return c.SendStatus(fiber.StatusNotFound)
		}
		categoryId = *body.CategoryId
	}

	tx, err := s.DB.Begin(c.Context())
	if err != nil {
		return DBError(c, err)
	}
	defer tx.Rollback(c.Context())

	oldEndsOnValue := endDateBefore(body.EffectiveFrom)
	tag, err := tx.Exec(c.Context(), `
		UPDATE category_budget cb
		SET ends_on = $1
		FROM category c
		WHERE cb.id = $2 AND cb.category_id = c.id AND c.user_id = $3 AND cb.deleted_at IS NULL
	`, timeFromOpenAPIDate(oldEndsOnValue), categoryBudgetId, id)
	if err != nil {
		return DBError(c, err)
	}
	if tag.RowsAffected() == 0 {
		return c.SendStatus(fiber.StatusNotFound)
	}

	var newId string
	err = tx.QueryRow(
		c.Context(),
		`INSERT INTO category_budget (category_id, amount, repeat_until, repeat_every, starts_on, ends_on)
		SELECT $1, $2, $3, $4, $5, $6
		FROM category
		WHERE id = $1 AND user_id = $7
		RETURNING id`,
		categoryId,
		body.Amount,
		body.RepeatUntil,
		body.RepeatEvery,
		timeFromOpenAPIDate(body.EffectiveFrom),
		nullableDateParam(body.EndsOn),
		id,
	).Scan(&newId)
	if err != nil {
		if isUniqueViolation(err) {
			return c.Status(fiber.StatusConflict).JSON(Conflict{
				Message: "A category budget already exists for this category in the selected date range",
			})
		}
		return DBError(c, err)
	}

	if err := tx.Commit(c.Context()); err != nil {
		return DBError(c, err)
	}

	return c.JSON(CategoryBudgetEditResponse{
		Id: newId,
	})
}

func (s Server) DeleteUserIdCategoryBudgetsCategoryBudgetId(c *fiber.Ctx, userId, categoryBudgetId string) error {
	tokenUserId := GetTokenClaim[string](c, "id")

	if tokenUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	tag, err := s.DB.Exec(c.Context(), `
		UPDATE category_budget cb
		SET deleted_at = NOW()
		FROM category c
		WHERE cb.id = $1 AND cb.category_id = c.id AND c.user_id = $2 AND cb.deleted_at IS NULL
	`, categoryBudgetId, userId)
	if err != nil {
		return DBError(c, err)
	}

	if tag.RowsAffected() == 0 {
		return c.SendStatus(fiber.StatusNotFound)
	}

	return c.Status(fiber.StatusOK).JSON(CategoryBudgetDeleteResponse{
		Id:      categoryBudgetId,
		Message: "Category budget deleted",
	})
}

type categoryBudgetScanner interface {
	Scan(dest ...any) error
}

func scanCategoryBudgetRow(scanner categoryBudgetScanner) (CategoryBudget, error) {
	categoryBudget := CategoryBudget{}
	var c_id string
	var c_name string
	var c_created_at time.Time
	var startsOn time.Time
	var endsOn sql.NullTime

	err := scanner.Scan(
		&categoryBudget.Id,
		&categoryBudget.Amount,
		&categoryBudget.RepeatUntil,
		&categoryBudget.RepeatEvery,
		&startsOn,
		&endsOn,
		&categoryBudget.CreatedAt,
		&categoryBudget.DeletedAt,
		&c_id,
		&c_name,
		&c_created_at,
	)
	if err != nil {
		return categoryBudget, err
	}

	categoryBudget.StartsOn = openAPIDateFromTime(startsOn)
	categoryBudget.EndsOn = scanNullableDate(endsOn)
	categoryBudget.Category = Category{
		Id:        c_id,
		Name:      c_name,
		CreatedAt: c_created_at,
		Rules:     []CategoryRule{},
	}

	return categoryBudget, nil
}
