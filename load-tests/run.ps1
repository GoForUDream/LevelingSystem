param(
  [ValidateSet("seed", "cold", "warm", "mixed", "write", "spike", "scheduler", "achievements", "cleanup")]
  [string]$Action = "warm",
  [ValidateSet("smoke", "capacity", "heavy")]
  [string]$Profile = "smoke"
)

$compose = @("compose", "-f", "docker-compose.load.yml")

switch ($Action) {
  "seed" {
    $env:SEED_PROFILE = $Profile
    docker @compose up -d --build load-backend
    docker @compose run --rm seed
  }
  "cold" {
    docker @compose down -v
    & $PSCommandPath seed $Profile
    $env:TEST_SCENARIO = "stats"
    docker @compose run --rm k6
  }
  "warm" {
    $env:TEST_SCENARIO = "stats"
    docker @compose run --rm k6
  }
  "mixed" {
    $env:TEST_SCENARIO = "mixed"
    docker @compose run --rm k6
  }
  "write" {
    $env:TEST_SCENARIO = "write"
    docker @compose run --rm k6
  }
  "spike" {
    $env:TEST_SCENARIO = "spike"
    docker @compose run --rm k6
  }
  "scheduler" {
    docker @compose stop load-scheduler
    docker @compose run --rm seed python /load-tests/benchmark_scheduler.py
  }
  "achievements" {
    docker @compose run --rm seed python /load-tests/benchmark_achievements.py
  }
  "cleanup" {
    docker @compose down -v --remove-orphans
  }
}

if ($Action -notin @("cleanup", "seed")) {
  docker @compose stats --no-stream | Out-File load-tests/results/docker-stats.txt
}
