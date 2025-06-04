package api

import (
	"time"

	"github.com/gofiber/fiber/v2"
)

func (s Server) PostUserIdCategories(c *fiber.Ctx, userId string) error {
	body, err := GetBody[CategoryCreateRequest](c)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	var id string

	err = s.DB.QueryRow(c.Context(), "INSERT INTO category (user_id, name) VALUES ($1, $2) RETURNING id", userId, body.Name).Scan(&id)
	if err != nil {
		return DBError(c, err)
	}

	return c.
		Status(fiber.StatusOK).
		JSON(CategoryCreateResponse{Id: id})
}

func (s Server) GetUserIdCategories(c *fiber.Ctx, userId string) error {
	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	rows, err := s.DB.Query(
		c.Context(),
		`SELECT 
			c.id, c.name, c.created_at,
			cr.id, cr.rule_regex,
			a.id, a.name, a.opened_at, a.closed_at
		FROM category c 
		LEFT JOIN category_rule cr ON c.id = cr.category_id
		LEFT JOIN account a ON cr.account_id = a.id
		WHERE c.user_id = $1`,
		userId,
	)
	if err != nil {
		return DBError(c, err)
	}

	categories := map[string]Category{}
	for rows.Next() {
		var id string
		var name string
		var createdAt time.Time
		var ruleId, ruleRegex *string
		var accountId, accountName *string
		var accountOpenedAt, accountClosedAt *time.Time
		err = rows.Scan(&id, &name, &createdAt, &ruleId, &ruleRegex, &accountId, &accountName, &accountOpenedAt, &accountClosedAt)
		if err != nil {
			return DBError(c, err)
		}

		if _, exists := categories[id]; exists {
			category := categories[id]

			category.Rules = append(category.Rules, CategoryRule{
				Id:   *ruleId,
				Rule: *ruleRegex,
				Account: Account{
					Id:       *accountId,
					Name:     *accountName,
					OpenedAt: *accountOpenedAt,
					ClosedAt: accountClosedAt,
				},
			})

			categories[id] = category
		} else {
			category := Category{
				Id:        id,
				Name:      name,
				CreatedAt: createdAt,
				Rules:     []CategoryRule{},
			}

			if ruleId != nil && ruleRegex != nil {
				category.Rules = append(category.Rules, CategoryRule{
					Id:   *ruleId,
					Rule: *ruleRegex,
					Account: Account{
						Id:       *accountId,
						Name:     *accountName,
						OpenedAt: *accountOpenedAt,
						ClosedAt: accountClosedAt,
					},
				})
			}

			categories[id] = category
		}
	}

	result := []Category{}
	for _, category := range categories {
		result = append(result, category)
	}

	return c.JSON(result)
}

func (s Server) GetUserIdCategoriesCategoryId(c *fiber.Ctx, userId string, categoryId string) error {
	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	category := Category{}

	err := s.DB.QueryRow(
		c.Context(),
		"SELECT id, name, created_at FROM category WHERE id = $1 AND user_id = $2",
		categoryId, userId,
	).Scan(&category.Id, &category.Name, &category.CreatedAt)
	if err != nil {
		return DBError(c, err)
	}

	rules := []CategoryRule{}

	rows, err := s.DB.Query(
		c.Context(),
		`SELECT 
			cr.id, cr.rule_regex,
			a.id, a.name, a.opened_at, a.closed_at
			FROM category c 
			INNER JOIN category_rule cr ON c.id = cr.category_id 
			INNER JOIN account a ON cr.account_id = a.id
			WHERE c.id = $1`,
		categoryId,
	)
	if err != nil {
		return DBError(c, err)
	}

	for rows.Next() {
		rule := CategoryRule{}
		err = rows.Scan(&rule.Id, &rule.Rule, &rule.Account.Id, &rule.Account.Name, &rule.Account.OpenedAt, &rule.Account.ClosedAt)
		if err != nil {
			return DBError(c, err)
		}
		rules = append(rules, rule)
	}

	category.Rules = rules

	return c.JSON(category)
}

func (s *Server) PatchUserIdCategoriesCategoryId(c *fiber.Ctx, id string, categoryId string) error {
	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != id {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	body, err := GetBody[CategoryEditRequest](c)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	_, err = s.DB.Exec(c.Context(), "UPDATE category SET name = $1 WHERE id = $2", body.Name, categoryId)
	if err != nil {
		return DBError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(CategoryEditResponse{
		Id:   categoryId,
		Name: body.Name,
	})
}

func (s Server) DeleteUserIdCategoriesCategoryId(c *fiber.Ctx, userId string, categoryId string) error {
	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != userId {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	tag, err := s.DB.Exec(c.Context(), "DELETE FROM category WHERE id = $1", categoryId)
	if err != nil {
		return DBError(c, err)
	}

	if tag.RowsAffected() == 0 {
		return c.SendStatus(fiber.StatusNotFound)
	}

	return c.Status(fiber.StatusOK).JSON(CategoryDeleteResponse{
		Id:      categoryId,
		Message: "Category deleted",
	})
}

func (s *Server) PostUserIdCategoriesCategoryIdRules(c *fiber.Ctx, id string, categoryId string) error {
	body, err := GetBody[CategoryAddRuleRequest](c)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != id {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	var ruleId string

	err = s.DB.QueryRow(c.Context(), "INSERT INTO category_rule (account_id, category_id, rule_regex) VALUES ($1, $2, $3) RETURNING id", body.AccountId, categoryId, body.Rule).Scan(&ruleId)
	if err != nil {
		return DBError(c, err)
	}

	return c.
		JSON(CategoryAddRuleResponse{Id: ruleId})
}

func (s *Server) DeleteUserIdCategoriesCategoryIdRulesRuleId(c *fiber.Ctx, id string, categoryId string, ruleId string) error {
	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != id {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	_, err := s.DB.Exec(c.Context(), "DELETE FROM category_rule WHERE id = $1 AND category_id = $2", ruleId, categoryId)
	if err != nil {
		return DBError(c, err)
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (s *Server) PatchUserIdCategoriesCategoryIdRulesRuleId(c *fiber.Ctx, id string, categoryId string, ruleId string) error {
	tokUserId := GetTokenClaim[string](c, "id")

	if tokUserId != id {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	body, err := GetBody[CategoryEditRuleRequest](c)
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	_, err = s.DB.Exec(c.Context(), "UPDATE category_rule SET rule_regex = $1 WHERE id = $2 AND category_id = $3", body.Rule, ruleId, categoryId)
	if err != nil {
		return DBError(c, err)
	}

	return c.JSON(CategoryEditRuleResponse{
		Id: ruleId,
	})
}
