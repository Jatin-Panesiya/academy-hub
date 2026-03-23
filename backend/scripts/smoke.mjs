const BASE_URL = process.env.SMOKE_BASE_URL || 'http://localhost:8080';
const ADMIN_CREATION_KEY = process.env.ADMIN_CREATION_KEY || 'change_me_admin_setup_key';

function randomEmail(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}@mail.com`;
}

async function call(name, path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, options);
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
    return { ok: res.ok, status: res.status, body: json, name };
  } catch (err) {
    return { ok: false, status: 0, body: String(err), name };
  }
}

function printResult(result) {
  const icon = result.ok ? 'PASS' : 'FAIL';
  const msg =
    typeof result.body === 'object'
      ? result.body?.error?.message || result.body?.message || JSON.stringify(result.body)
      : String(result.body);
  console.log(`${icon} | ${result.name} | status=${result.status} | ${msg}`);
}

async function main() {
  const results = [];

  results.push(await call('health', '/api/health'));

  const adminEmail = randomEmail('admin');
  const adminCreate = await call('create-admin', '/api/auth/create-admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': ADMIN_CREATION_KEY,
    },
    body: JSON.stringify({
      name: 'Admin Smoke',
      email: adminEmail,
      password: '123456',
    }),
  });
  results.push(adminCreate);
  const adminToken = adminCreate.body?.token;

  const authHeader = adminToken ? { Authorization: `Bearer ${adminToken}` } : {};

  const courseCreate = await call('create-course', '/api/courses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify({
      courseName: 'Smoke Course',
      duration: 30,
      fees: 1000,
    }),
  });
  results.push(courseCreate);
  const courseId = courseCreate.body?.course?._id || courseCreate.body?._id;

  const batchCreate = await call('create-batch', '/api/batches', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify({
      batchName: 'Smoke Batch',
      courseId,
      schedule: 'Mon-Fri 10-11',
      startDate: new Date(),
    }),
  });
  results.push(batchCreate);
  const batchId = batchCreate.body?.batch?._id || batchCreate.body?._id;

  const studentEmail = randomEmail('student');
  const studentCreate = await call('create-student', '/api/students', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify({
      name: 'Smoke Student',
      email: studentEmail,
      phone: '9999999999',
      courseId,
      batchId,
      feesTotal: 2000,
      feesPaid: 0,
      joinDate: new Date(),
    }),
  });
  results.push(studentCreate);
  const studentId = studentCreate.body?.student?._id || studentCreate.body?._id;

  results.push(await call('list-students', '/api/students?page=1&limit=10', { headers: authHeader }));
  results.push(await call('assign-students-to-batch', `/api/batches/${batchId}/students`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify({ studentIds: [studentId] }),
  }));

  results.push(await call('mark-attendance', '/api/attendance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify({
      studentId,
      batchId,
      date: new Date(),
      status: 'present',
    }),
  }));

  results.push(await call('attendance-by-batch', `/api/attendance/batch/${batchId}`, { headers: authHeader }));

  results.push(await call('add-payment', '/api/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify({
      studentId,
      amount: 500,
      date: new Date(),
      paymentMethod: 'cash',
    }),
  }));

  results.push(await call('payment-history', `/api/payments/student/${studentId}`, { headers: authHeader }));

  const assignmentCreate = await call('create-assignment', '/api/assignments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify({
      title: 'Smoke Assignment',
      description: 'Complete task',
      batchId,
      deadline: new Date(Date.now() + 86400000),
    }),
  });
  results.push(assignmentCreate);
  const assignmentId = assignmentCreate.body?.assignment?._id || assignmentCreate.body?._id;

  results.push(await call('assignments-by-batch-admin', `/api/assignments/batch/${batchId}`, { headers: authHeader }));

  const webRegister = await call('web-register-student', '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Web Student',
      email: randomEmail('webstudent'),
      password: '123456',
    }),
  });
  results.push(webRegister);
  const studentToken = webRegister.body?.token;
  const studentAuthHeader = studentToken ? { Authorization: `Bearer ${studentToken}` } : {};

  results.push(await call('assignments-by-batch-student', `/api/assignments/batch/${batchId}`, { headers: studentAuthHeader }));
  results.push(await call('submission-by-student', '/api/submissions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...studentAuthHeader,
    },
    body: JSON.stringify({
      assignmentId,
      fileUrl: 'https://example.com/submission.pdf',
    }),
  }));

  console.log('\n---- Smoke Test Report ----');
  results.forEach(printResult);
  const failed = results.filter((r) => !r.ok);
  console.log(`\nTotal: ${results.length}, Passed: ${results.length - failed.length}, Failed: ${failed.length}`);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main();

