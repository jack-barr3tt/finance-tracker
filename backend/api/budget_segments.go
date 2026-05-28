package api

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

func effectiveFromOnOrBeforeSegmentStart(oldStartsOn, effectiveFrom openapi_types.Date) bool {
	return !timeFromOpenAPIDate(effectiveFrom).After(timeFromOpenAPIDate(oldStartsOn))
}

func openAPIDateFromTime(t time.Time) openapi_types.Date {
	return openapi_types.Date{Time: time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC)}
}

func timeFromOpenAPIDate(d openapi_types.Date) time.Time {
	return time.Date(d.Year(), d.Month(), d.Day(), 0, 0, 0, 0, time.UTC)
}

func endDateBefore(d openapi_types.Date) openapi_types.Date {
	return openAPIDateFromTime(timeFromOpenAPIDate(d).AddDate(0, 0, -1))
}

func validateSegmentDates(startsOn openapi_types.Date, endsOn *openapi_types.Date) error {
	if endsOn == nil {
		return nil
	}

	if !timeFromOpenAPIDate(*endsOn).Before(timeFromOpenAPIDate(startsOn)) &&
		!timeFromOpenAPIDate(*endsOn).Equal(timeFromOpenAPIDate(startsOn)) {
		return nil
	}

	return errors.New("ends_on must be on or after starts_on")
}

func validateEffectiveSplit(
	oldStartsOn openapi_types.Date,
	oldEndsOn *openapi_types.Date,
	effectiveFrom openapi_types.Date,
) error {
	if effectiveFromOnOrBeforeSegmentStart(oldStartsOn, effectiveFrom) {
		return nil
	}

	if oldEndsOn != nil {
		oldEnd := timeFromOpenAPIDate(*oldEndsOn)
		effective := timeFromOpenAPIDate(effectiveFrom)
		if effective.After(oldEnd) {
			return errors.New("effective_from must be on or before the current segment end date")
		}
	}

	return nil
}

func adjustPriorCategoryBudgetForBackdate(
	ctx context.Context,
	tx pgx.Tx,
	categoryId, excludeId, userId string,
	oldStartsOn, effectiveFrom openapi_types.Date,
) error {
	effective := timeFromOpenAPIDate(effectiveFrom)
	oldStart := timeFromOpenAPIDate(oldStartsOn)
	if !effective.Before(oldStart) {
		return nil
	}

	var priorId string
	var priorStartsOn time.Time
	err := tx.QueryRow(ctx, `
		SELECT cb.id, cb.starts_on
		FROM category_budget cb
		INNER JOIN category c ON cb.category_id = c.id
		WHERE cb.category_id = $1 AND c.user_id = $2 AND cb.deleted_at IS NULL AND cb.id != $3
		AND cb.starts_on < $4
		AND (cb.ends_on IS NULL OR cb.ends_on >= $5)
		ORDER BY cb.starts_on DESC
		LIMIT 1
	`, categoryId, userId, excludeId, oldStart, effective).Scan(&priorId, &priorStartsOn)
	if err == pgx.ErrNoRows {
		return nil
	}
	if err != nil {
		return err
	}

	priorStart := timeFromOpenAPIDate(openAPIDateFromTime(priorStartsOn))
	if !effective.After(priorStart) {
		_, err = tx.Exec(ctx, `
			UPDATE category_budget cb
			SET deleted_at = NOW()
			FROM category c
			WHERE cb.id = $1 AND cb.category_id = c.id AND c.user_id = $2
		`, priorId, userId)
		return err
	}

	_, err = tx.Exec(ctx, `
		UPDATE category_budget cb
		SET ends_on = $1
		FROM category c
		WHERE cb.id = $2 AND cb.category_id = c.id AND c.user_id = $3
	`, timeFromOpenAPIDate(endDateBefore(effectiveFrom)), priorId, userId)
	return err
}

func scanNullableDate(nullTime sql.NullTime) *openapi_types.Date {
	if !nullTime.Valid {
		return nil
	}

	date := openAPIDateFromTime(nullTime.Time)
	return &date
}

func nullableDateParam(date *openapi_types.Date) any {
	if date == nil {
		return nil
	}

	return timeFromOpenAPIDate(*date)
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
