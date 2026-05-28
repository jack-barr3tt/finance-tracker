package api

import (
	"testing"
	"time"

	openapi_types "github.com/oapi-codegen/runtime/types"
)

func TestTransactionDateInMarchRange(t *testing.T) {
	marchStart := openapi_types.Date{Time: time.Date(2025, 3, 1, 0, 0, 0, 0, time.UTC)}
	marchEnd := openapi_types.Date{Time: time.Date(2025, 3, 31, 0, 0, 0, 0, time.UTC)}

	marchRange, err := parseSummaryRange(&marchStart, &marchEnd)
	if err != nil {
		t.Fatalf("parseSummaryRange: %v", err)
	}

	txnDate := timeFromOpenAPIDate(openapi_types.Date{Time: time.Date(2025, 3, 1, 0, 0, 0, 0, time.UTC)})

	if txnDate.Before(*marchRange.Start) || !txnDate.Before(*marchRange.EndExclusive) {
		t.Fatalf("expected 2025-03-01 in March range [%v, %v), got %v", marchRange.Start, marchRange.EndExclusive, txnDate)
	}

	febStart := openapi_types.Date{Time: time.Date(2025, 2, 1, 0, 0, 0, 0, time.UTC)}
	febEnd := openapi_types.Date{Time: time.Date(2025, 2, 28, 0, 0, 0, 0, time.UTC)}

	febRange, err := parseSummaryRange(&febStart, &febEnd)
	if err != nil {
		t.Fatalf("parseSummaryRange february: %v", err)
	}

	if !txnDate.Before(*febRange.Start) && txnDate.Before(*febRange.EndExclusive) {
		t.Fatalf("expected 2025-03-01 outside February range [%v, %v)", febRange.Start, febRange.EndExclusive)
	}
}

func TestOpenAPIDateRoundTrip(t *testing.T) {
	original := openapi_types.Date{Time: time.Date(2025, 3, 1, 0, 0, 0, 0, time.UTC)}
	roundTripped := openAPIDateFromTime(timeFromOpenAPIDate(original))

	if roundTripped.String() != original.String() {
		t.Fatalf("expected %s, got %s", original.String(), roundTripped.String())
	}
}
