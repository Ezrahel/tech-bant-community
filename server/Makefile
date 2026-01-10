.PHONY: tidy build run test clean

tidy:
	go mod tidy

build:
	go build -o bin/server ./main.go

run:
	go run ./main.go

test:
	go test ./...

clean:
	rm -rf bin/
