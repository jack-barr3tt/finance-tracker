package api

import (
	"database/sql"
	"errors"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jack-barr3tt/finance-tracker/utils"
)

func (s Server) PostUserIdCategories(ctx *fiber.Ctx, userId string) error {
	body, err := utils.GetBody[CategoryCreateRequest](ctx)
	if err != nil {
		return ctx.SendStatus(fiber.StatusBadRequest)
	}

	tokUserId := utils.GetTokenClaim[string](ctx, "id")

	if tokUserId != userId {
		return ctx.SendStatus(fiber.StatusUnauthorized)
	}

	var id string

	err = s.DB.QueryRow(ctx.Context(), "INSERT INTO category (user_id, name) VALUES ($1, $2) RETURNING id", userId, body.Name).Scan(&id)
	if err != nil {
		log.Println(err)
		return ctx.SendStatus(fiber.StatusInternalServerError)
	}

	return ctx.
		Status(fiber.StatusOK).
		JSON(CategoryCreateResponse{Id: id})
}

func (s Server) GetUserIdCategories(ctx *fiber.Ctx, userId string) error {
	tokUserId := utils.GetTokenClaim[string](ctx, "id")

	if tokUserId != userId {
		return ctx.SendStatus(fiber.StatusUnauthorized)
	}

	rows, err := s.DB.Query(ctx.Context(), "SELECT id, name FROM category WHERE user_id = $1", userId)
	if err != nil {
		log.Println(err)
		return ctx.SendStatus(fiber.StatusInternalServerError)
	}

	categories := []Category{}
	for rows.Next() {
		var id string
		var name string
		err = rows.Scan(&id, &name)
		if err != nil {
			return ctx.SendStatus(fiber.StatusInternalServerError)
		}

		categories = append(categories, Category{Id: id, Name: name})
	}

	return ctx.
		Status(fiber.StatusOK).
		JSON(categories)
}

func (s Server) GetUserIdCategoriesCategoryId(ctx *fiber.Ctx, userId string, categoryId string) error {
	tokUserId := utils.GetTokenClaim[string](ctx, "id")

	if tokUserId != userId {
		return ctx.SendStatus(fiber.StatusUnauthorized)
	}

	var name string
	var createdAt time.Time

	err := s.DB.QueryRow(ctx.Context(), "SELECT name, created_at FROM category WHERE user_id = $1 AND id = $2", userId, categoryId).Scan(&name, &createdAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ctx.SendStatus(fiber.StatusNotFound)
		}

		log.Println(err)
		return ctx.SendStatus(fiber.StatusInternalServerError)
	}

	return ctx.
		Status(fiber.StatusOK).
		JSON(Category{
			Id:        categoryId,
			Name:      name,
			CreatedAt: createdAt,
		})
}

func (s Server) DeleteUserIdCategoriesCategoryId(ctx *fiber.Ctx, userId string, categoryId string) error {
	tokUserId := utils.GetTokenClaim[string](ctx, "id")

	if tokUserId != userId {
		return ctx.SendStatus(fiber.StatusUnauthorized)
	}

	tag, err := s.DB.Exec(ctx.Context(), "DELETE FROM category WHERE user_id = $1 AND id = $2", userId, categoryId)
	if err != nil {
		log.Println(err)
		return ctx.SendStatus(fiber.StatusInternalServerError)
	}

	if tag.RowsAffected() == 0 {
		return ctx.SendStatus(fiber.StatusNotFound)
	}

	return ctx.Status(fiber.StatusOK).JSON(CategoryDeleteResponse{
		Id:      categoryId,
		Message: "Category deleted",
	})
}
