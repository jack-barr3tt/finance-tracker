package api

import (
	"database/sql"
	"errors"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

var errInvalidEffectiveFrom = errors.New("effective_from must be after the current segment start date")

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
	oldStart := timeFromOpenAPIDate(oldStartsOn)
	effective := timeFromOpenAPIDate(effectiveFrom)

	if !effective.After(oldStart) {
		return errInvalidEffectiveFrom
	}

	if oldEndsOn != nil {
		oldEnd := timeFromOpenAPIDate(*oldEndsOn)
		if effective.After(oldEnd) {
			return errors.New("effective_from must be on or before the current segment end date")
		}
	}

	return nil
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
