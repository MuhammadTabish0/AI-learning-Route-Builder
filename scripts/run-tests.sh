#!/bin/bash

# Automated Testing Script
# This script provides convenient commands for running tests following MIT 6.102 principles

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}AI Learning Route Builder - Test Suite${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to run tests
run_tests() {
    echo -e "${YELLOW}Running all tests...${NC}"
    npm test
}

# Function to run tests with coverage
run_coverage() {
    echo -e "${YELLOW}Running tests with coverage report...${NC}"
    npm run test:coverage
    echo ""
    echo -e "${GREEN}Coverage report generated in ./coverage directory${NC}"
    echo -e "${YELLOW}Open ./coverage/lcov-report/index.html to view detailed report${NC}"
}

# Function to run tests in watch mode
run_watch() {
    echo -e "${YELLOW}Running tests in watch mode...${NC}"
    echo -e "${YELLOW}Tests will re-run automatically when files change${NC}"
    npm run test:watch
}

# Function to run specific test file
run_specific() {
    echo -e "${YELLOW}Running specific test: $1${NC}"
    npm test -- "$1"
}

# Main menu
case "$1" in
    "")
        run_tests
        ;;
    "coverage")
        run_coverage
        ;;
    "watch")
        run_watch
        ;;
    "specific")
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Please specify a test file${NC}"
            echo "Usage: ./scripts/run-tests.sh specific <test-file>"
            exit 1
        fi
        run_specific "$2"
        ;;
    "help")
        echo "Usage: ./scripts/run-tests.sh [command]"
        echo ""
        echo "Commands:"
        echo "  (none)      - Run all tests"
        echo "  coverage    - Run tests with coverage report"
        echo "  watch       - Run tests in watch mode"
        echo "  specific    - Run specific test file"
        echo "  help        - Show this help message"
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo "Run './scripts/run-tests.sh help' for usage information"
        exit 1
        ;;
esac


