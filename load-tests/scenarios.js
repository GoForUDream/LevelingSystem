import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const baseUrl = __ENV.BASE_URL || 'http://load-backend:8000';
const scenario = __ENV.TEST_SCENARIO || 'stats';
const tokens = new SharedArray('tokens', () => JSON.parse(open('/data/tokens.json')));

const scenarioOptions = {
  stats: {
    executor: 'constant-arrival-rate',
    rate: 100,
    timeUnit: '1s',
    duration: '5m',
    preAllocatedVUs: 200,
    maxVUs: 1000,
  },
  mixed: {
    executor: 'constant-vus',
    vus: 2000,
    duration: '5m',
  },
  write: {
    executor: 'constant-arrival-rate',
    rate: 15,
    timeUnit: '1s',
    duration: '5m',
    preAllocatedVUs: 50,
    maxVUs: 300,
  },
  spike: {
    executor: 'per-vu-iterations',
    vus: 2000,
    iterations: 1,
    maxDuration: '2m',
  },
};

export const options = {
  scenarios: { [scenario]: scenarioOptions[scenario] },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{endpoint:stats}': ['p(95)<500'],
    'http_req_duration{endpoint:mutation}': ['p(95)<750'],
  },
};

function params(endpoint) {
  const token = tokens[(__VU - 1) % tokens.length];
  return {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    tags: { endpoint },
  };
}

function statsRequest() {
  const periods = ['7d', '30d', '30d', '90d', 'all'];
  const period = periods[Math.floor(Math.random() * periods.length)];
  return http.get(`${baseUrl}/api/stats?period=${period}&timezone_offset=420`, params('stats'));
}

function readJourney() {
  const roll = Math.random();
  if (roll < 0.5) {
    return http.get(`${baseUrl}/api/tasks/page?limit=100`, params('tasks'));
  }
  if (roll < 0.7) {
    return http.get(`${baseUrl}/api/goals/page?limit=25`, params('goals'));
  }
  if (roll < 0.9) return statsRequest();
  return http.get(`${baseUrl}/api/achievements`, params('achievements'));
}

function writeJourney() {
  const response = http.post(
    `${baseUrl}/api/tasks`,
    JSON.stringify({
      title: `Load write ${__VU}-${__ITER}`,
      importance: 'LOW',
      due_date: new Date(Date.now() + 86400000).toISOString(),
    }),
    params('mutation'),
  );
  if (response.status !== 200) return response;
  const task = response.json();
  return http.post(`${baseUrl}/api/tasks/${task.id}/complete`, null, params('mutation'));
}

export default function () {
  let response;
  if (scenario === 'stats' || scenario === 'spike') response = statsRequest();
  else if (scenario === 'write') response = writeJourney();
  else {
    response = Math.random() < 0.12 ? writeJourney() : readJourney();
    sleep(15 + Math.random() * 10);
  }
  check(response, { 'request succeeded': (result) => result.status < 400 });
}
