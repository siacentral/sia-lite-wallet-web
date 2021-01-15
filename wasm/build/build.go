package build

import (
	"time"
)

var (
	gitRevision string
	buildTime   string

	timeFormats = []string{
		"2006-01-02 15:04:05 -0700",
		time.UnixDate,
		time.ANSIC,
		time.RFC3339,
		time.RFC1123,
		time.RFC1123Z,
	}

	formattedTime = func() time.Time {
		if len(buildTime) == 0 {
			return time.Now()
		}

		for _, layout := range timeFormats {
			time, err := time.Parse(layout, buildTime)
			if err == nil {
				return time
			}
		}

		return time.Time{}
	}()
)

// Revision returns the current revision
func Revision() string {
	if len(gitRevision) == 0 {
		return "devel"
	}

	return gitRevision
}

// Time returns the build time
func Time() time.Time {
	return formattedTime
}
