package api

import (
	"testing"
	"time"

	openapi_types "github.com/oapi-codegen/runtime/types"
)

func testDate(year int, month time.Month, day int) openapi_types.Date {
	return openapi_types.Date{Time: time.Date(year, month, day, 0, 0, 0, 0, time.UTC)}
}

func TestEffectiveFromOnOrBeforeSegmentStart(t *testing.T) {
	start := testDate(2025, time.November, 1)

	if !effectiveFromOnOrBeforeSegmentStart(start, testDate(2025, time.September, 1)) {
		t.Fatal("expected effective_from before starts_on to be allowed")
	}

	if !effectiveFromOnOrBeforeSegmentStart(start, start) {
		t.Fatal("expected effective_from equal to starts_on to be allowed")
	}

	if effectiveFromOnOrBeforeSegmentStart(start, testDate(2025, time.December, 1)) {
		t.Fatal("expected effective_from after starts_on to require a split")
	}
}

func TestValidateEffectiveSplit(t *testing.T) {
	start := testDate(2025, time.November, 1)
	end := testDate(2026, time.March, 31)

	if err := validateEffectiveSplit(start, &end, testDate(2025, time.September, 1)); err != nil {
		t.Fatalf("expected backdating within single segment to pass, got %v", err)
	}

	if err := validateEffectiveSplit(start, &end, testDate(2025, time.December, 1)); err != nil {
		t.Fatalf("expected forward split within segment to pass, got %v", err)
	}

	if err := validateEffectiveSplit(start, &end, testDate(2026, time.April, 1)); err == nil {
		t.Fatal("expected effective_from after segment end to fail")
	}
}
