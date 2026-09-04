module github.com/grafana/grafana/pkg/build

go 1.26.1

// Override docker/docker to avoid:
// go: github.com/drone-runners/drone-runner-docker@v1.8.2 requires
// github.com/docker/docker@v0.0.0-00010101000000-000000000000: invalid version: unknown revision 000000000000
replace github.com/docker/docker => github.com/moby/moby v28.0.1+incompatible

require (
	github.com/google/uuid v1.6.0 // indirect; @grafana/grafana-backend-group
	github.com/urfave/cli/v2 v2.27.7 // @grafana/grafana-backend-group
	go.opentelemetry.io/otel v1.41.0 // indirect; @grafana/grafana-backend-group
	go.opentelemetry.io/otel/trace v1.41.0 // indirect; @grafana/grafana-backend-group
	golang.org/x/sync v0.20.0 // @grafana/alerting-backend
)

require (
	github.com/cpuguy83/go-md2man/v2 v2.0.7 // indirect
	github.com/davecgh/go-spew v1.1.2-0.20180830191138-d8f796af33cc // indirect
	github.com/go-logr/logr v1.4.3 // indirect; @grafana/grafana-app-platform-squad
	github.com/go-logr/stdr v1.2.2 // indirect
	github.com/pmezard/go-difflib v1.0.1-0.20181226105442-5d4384ee4fb2 // indirect
	github.com/russross/blackfriday/v2 v2.1.0 // indirect
	github.com/xrash/smetrics v0.0.0-20240521201337-686a1a2994c1 // indirect
	go.opentelemetry.io/otel/metric v1.41.0 // indirect
	golang.org/x/sys v0.42.0 // indirect
)

require (
	dagger.io/dagger v0.21.9
	github.com/Masterminds/semver v1.5.0
	github.com/quasilyte/go-ruleguard/dsl v0.3.22
	github.com/urfave/cli/v3 v3.7.0
)

require (
	github.com/99designs/gqlgen v0.17.89 // indirect
	github.com/Khan/genqlient v0.8.1 // indirect
	github.com/adrg/xdg v0.5.3 // indirect
	github.com/cespare/xxhash/v2 v2.3.0 // indirect
	github.com/dagger/querybuilder v0.0.0-20260402040506-574a5e81cb59 // indirect
	github.com/mitchellh/go-homedir v1.1.0 // indirect
	github.com/sergi/go-diff v1.3.2-0.20230802210424-5b0b94c5c0d3 // indirect
	github.com/sosodev/duration v1.4.0 // indirect
	github.com/vektah/gqlparser/v2 v2.5.32 // indirect
	go.opentelemetry.io/auto/sdk v1.2.1 // indirect
)

// Use fork of crewjam/saml with fixes for some issues until changes get merged into upstream
replace github.com/crewjam/saml => github.com/grafana/saml v0.4.15-0.20240523142256-cc370b98af7c

// Use our fork of the upstream alertmanagers.
// This is required in order to get notification delivery errors from the receivers API.
replace github.com/prometheus/alertmanager => github.com/grafana/prometheus-alertmanager v0.25.1-0.20240625192351-66ec17e3aa45

exclude github.com/mattn/go-sqlite3 v2.0.3+incompatible
