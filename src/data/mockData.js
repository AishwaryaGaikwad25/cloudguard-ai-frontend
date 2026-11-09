/**
 * STATIC MOCK DATA
 * ----------------------------------------------------------------------------
 * The FastAPI backend is not ready yet, so this file produces data in the same
 * shape the team agreed for the endpoints:
 *
 *   GET /api/overview   -> summary counts + model info
 *   GET /api/events     -> list of processed CloudTrail events with predictions
 *   GET /api/anomalies  -> only the events the Isolation Forest flagged
 *
 * Data is generated with a seeded random generator so it is identical on every
 * load (120 events, 8 anomalies — matching the sample response in the diagram).
 */

// Small deterministic PRNG so the "random" data never changes between reloads.
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(2026)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const between = (min, max) => min + rand() * (max - min)

const USERS = [
  { name: 'alice.dev', type: 'IAMUser' },
  { name: 'bob.ops', type: 'IAMUser' },
  { name: 'carol.admin', type: 'IAMUser' },
  { name: 'ci-deploy-role', type: 'AssumedRole' },
  { name: 'data-pipeline-svc', type: 'AssumedRole' },
]

const KNOWN_IPS = ['203.0.113.24', '203.0.113.57', '198.51.100.12', '10.0.4.18', '10.0.7.91']

// Normal management events for IAM, EC2 and S3 (the services in scope).
const NORMAL_EVENTS = [
  { eventName: 'DescribeInstances', eventSource: 'ec2.amazonaws.com', service: 'EC2', weight: 6 },
  { eventName: 'RunInstances', eventSource: 'ec2.amazonaws.com', service: 'EC2', weight: 2 },
  { eventName: 'StopInstances', eventSource: 'ec2.amazonaws.com', service: 'EC2', weight: 2 },
  { eventName: 'StartInstances', eventSource: 'ec2.amazonaws.com', service: 'EC2', weight: 2 },
  { eventName: 'CreateTags', eventSource: 'ec2.amazonaws.com', service: 'EC2', weight: 2 },
  { eventName: 'DescribeSecurityGroups', eventSource: 'ec2.amazonaws.com', service: 'EC2', weight: 3 },
  { eventName: 'ListBuckets', eventSource: 's3.amazonaws.com', service: 'S3', weight: 5 },
  { eventName: 'CreateBucket', eventSource: 's3.amazonaws.com', service: 'S3', weight: 1 },
  { eventName: 'GetBucketPolicy', eventSource: 's3.amazonaws.com', service: 'S3', weight: 3 },
  { eventName: 'PutBucketTagging', eventSource: 's3.amazonaws.com', service: 'S3', weight: 2 },
  { eventName: 'GetBucketLocation', eventSource: 's3.amazonaws.com', service: 'S3', weight: 3 },
  { eventName: 'ListUsers', eventSource: 'iam.amazonaws.com', service: 'IAM', weight: 4 },
  { eventName: 'GetUser', eventSource: 'iam.amazonaws.com', service: 'IAM', weight: 3 },
  { eventName: 'ListRoles', eventSource: 'iam.amazonaws.com', service: 'IAM', weight: 3 },
  { eventName: 'ConsoleLogin', eventSource: 'signin.amazonaws.com', service: 'IAM', weight: 4 },
  { eventName: 'ListAttachedUserPolicies', eventSource: 'iam.amazonaws.com', service: 'IAM', weight: 2 },
]
const WEIGHTED = NORMAL_EVENTS.flatMap((e) => Array(e.weight).fill(e))

// Hand-crafted suspicious events the model flags.
const ANOMALY_EVENTS = [
  {
    eventTime: '2026-11-03T02:47:13Z',
    eventName: 'ConsoleLogin',
    eventSource: 'signin.amazonaws.com',
    service: 'IAM',
    user: 'root',
    userType: 'Root',
    sourceIPAddress: '185.220.101.43',
    awsRegion: 'us-east-1',
    errorCode: null,
    anomaly_score: 0.91,
    reasons: ['Root account login', 'Unseen source IP (outside known ranges)', 'Login at 02:47 – outside working hours'],
  },
  {
    eventTime: '2026-11-03T02:52:40Z',
    eventName: 'CreateAccessKey',
    eventSource: 'iam.amazonaws.com',
    service: 'IAM',
    user: 'root',
    userType: 'Root',
    sourceIPAddress: '185.220.101.43',
    awsRegion: 'us-east-1',
    errorCode: null,
    anomaly_score: 0.88,
    reasons: ['Access key created for root user', 'Same unseen IP as previous root login', 'Rare event for this account'],
  },
  {
    eventTime: '2026-11-04T23:18:05Z',
    eventName: 'AttachUserPolicy',
    eventSource: 'iam.amazonaws.com',
    service: 'IAM',
    user: 'alice.dev',
    userType: 'IAMUser',
    sourceIPAddress: '203.0.113.24',
    awsRegion: 'us-east-1',
    errorCode: null,
    anomaly_score: 0.84,
    reasons: ['AdministratorAccess policy attached', 'User has never performed IAM writes', 'Late-night activity'],
    requestParameters: { userName: 'alice.dev', policyArn: 'arn:aws:iam::aws:policy/AdministratorAccess' },
  },
  {
    eventTime: '2026-11-05T14:06:22Z',
    eventName: 'PutBucketPolicy',
    eventSource: 's3.amazonaws.com',
    service: 'S3',
    user: 'bob.ops',
    userType: 'IAMUser',
    sourceIPAddress: '203.0.113.57',
    awsRegion: 'us-east-1',
    errorCode: null,
    anomaly_score: 0.79,
    reasons: ['Bucket policy grants public read (Principal: "*")', 'Bucket tagged as confidential'],
    requestParameters: { bucketName: 'cg-customer-reports', policy: { Principal: '*', Action: 's3:GetObject' } },
  },
  {
    eventTime: '2026-11-06T03:31:57Z',
    eventName: 'AuthorizeSecurityGroupIngress',
    eventSource: 'ec2.amazonaws.com',
    service: 'EC2',
    user: 'ci-deploy-role',
    userType: 'AssumedRole',
    sourceIPAddress: '45.133.1.88',
    awsRegion: 'ap-south-1',
    errorCode: null,
    anomaly_score: 0.76,
    reasons: ['SSH (port 22) opened to 0.0.0.0/0', 'Unusual source IP for CI role', 'Activity outside deploy window'],
    requestParameters: { groupId: 'sg-0a91f3c2', ipPermissions: { fromPort: 22, toPort: 22, cidrIp: '0.0.0.0/0' } },
  },
  {
    eventTime: '2026-11-06T03:40:11Z',
    eventName: 'RunInstances',
    eventSource: 'ec2.amazonaws.com',
    service: 'EC2',
    user: 'ci-deploy-role',
    userType: 'AssumedRole',
    sourceIPAddress: '45.133.1.88',
    awsRegion: 'sa-east-1',
    errorCode: null,
    anomaly_score: 0.82,
    reasons: ['20 × p3.8xlarge GPU instances requested', 'Region never used before (sa-east-1)', 'Possible crypto-mining pattern'],
    requestParameters: { instanceType: 'p3.8xlarge', minCount: 20, maxCount: 20 },
  },
  {
    eventTime: '2026-11-07T19:12:30Z',
    eventName: 'DeleteBucket',
    eventSource: 's3.amazonaws.com',
    service: 'S3',
    user: 'data-pipeline-svc',
    userType: 'AssumedRole',
    sourceIPAddress: '10.0.7.91',
    awsRegion: 'us-east-1',
    errorCode: 'AccessDenied',
    anomaly_score: 0.67,
    reasons: ['Destructive action by a read-only service role', 'Request failed with AccessDenied'],
    requestParameters: { bucketName: 'cg-audit-logs' },
  },
  {
    eventTime: '2026-11-08T01:05:48Z',
    eventName: 'DeleteUser',
    eventSource: 'iam.amazonaws.com',
    service: 'IAM',
    user: 'carol.admin',
    userType: 'IAMUser',
    sourceIPAddress: '91.240.118.7',
    awsRegion: 'us-east-1',
    errorCode: null,
    anomaly_score: 0.72,
    reasons: ['IAM user deleted at 01:05', 'Unseen source IP for this admin', 'Burst of IAM write calls'],
    requestParameters: { userName: 'bob.ops-backup' },
  },
]

function buildNormalEvents(count) {
  const start = Date.UTC(2026, 10, 2) // 2 Nov 2026
  const events = []
  for (let i = 0; i < count; i++) {
    const tpl = pick(WEIGHTED)
    const user = pick(USERS)
    const day = Math.floor(rand() * 7)
    const hour = Math.floor(between(8, 20)) // working hours
    const ts = start + day * 86400000 + hour * 3600000 + Math.floor(rand() * 3600000)
    events.push({
      ...tpl,
      eventTime: new Date(ts).toISOString().replace(/\.\d{3}Z$/, 'Z'),
      user: user.name,
      userType: user.type,
      sourceIPAddress: pick(KNOWN_IPS),
      awsRegion: rand() < 0.75 ? 'us-east-1' : 'ap-south-1',
      errorCode: rand() < 0.04 ? 'AccessDenied' : null,
      anomaly_score: Number(between(0.08, 0.48).toFixed(2)),
    })
  }
  return events
}

const normal = buildNormalEvents(112).map(({ weight: _w, ...e }) => ({ ...e, prediction: 'Normal' }))
const anomalies = ANOMALY_EVENTS.map((e) => ({ ...e, prediction: 'Anomaly' }))

export const EVENTS = [...normal, ...anomalies]
  .sort((a, b) => b.eventTime.localeCompare(a.eventTime))
  .map((e, i) => ({
    event_id: `evt-${String(120 - i).padStart(4, '0')}`,
    ...e,
    readOnly: /^(Describe|List|Get)/.test(e.eventName),
  }))

export const ANOMALY_THRESHOLD = 0.6

export const MODEL_INFO = {
  name: 'Isolation Forest',
  library: 'scikit-learn',
  n_estimators: 100,
  contamination: 0.07,
  threshold: ANOMALY_THRESHOLD,
  trained_at: '2026-11-08T22:00:00Z',
  features: [
    'hour_of_day',
    'is_weekend',
    'is_root_user',
    'is_error',
    'is_new_source_ip',
    'is_new_region',
    'is_write_event',
    'event_name_freq',
    'user_event_count',
  ],
}

export const PIPELINE_STATUS = [
  { step: 'AWS Environment', detail: 'IAM • EC2 • S3', status: 'ok' },
  { step: 'AWS CloudTrail', detail: 'Management events recorded', status: 'ok' },
  { step: 'Python Collector (Boto3)', detail: 'Last run 08 Nov 2026, 22:00 UTC', status: 'ok' },
  { step: 'Raw Event JSON', detail: 'cloudtrail_events.json · 120 records', status: 'ok' },
  { step: 'Preprocessing & Features', detail: `${MODEL_INFO.features.length} numeric features`, status: 'ok' },
  { step: 'Isolation Forest', detail: 'Predicts Normal / Anomaly', status: 'ok' },
  { step: 'Processed Results', detail: 'Event details • Prediction • Score', status: 'ok' },
]
