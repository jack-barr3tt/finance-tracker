package utils

import (
	"encoding/base64"
	"fmt"
	"regexp"
	"strings"
)

func DecodeCursor(cursor string) (*string, *string, error) {
	decoded, err := base64.StdEncoding.DecodeString(cursor)
	if err != nil {
		return nil, nil, err
	}

	parts := strings.Split(string(decoded), "_")
	if len(parts) != 2 {
		return nil, nil, fmt.Errorf("invalid cursor: %s", cursor)
	}

	return &parts[0], &parts[1], nil
}

func NumberPlaceholders(query string) string {
	count := 1
	re := regexp.MustCompile(`\$([^0-9])`)
	return re.ReplaceAllStringFunc(query, func(match string) string {
		numbered := fmt.Sprintf("$%d%s", count, match[1:])
		count++
		return numbered
	})
}
