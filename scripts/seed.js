// scripts/seed.js
// Run: node scripts/seed.js
// Reads DB config from .env.local

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Parse .env.local manually (no dotenv dependency needed)
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('ERROR: .env.local not found. Copy .env.example to .env.local and fill in your DB credentials.');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
  }
  return env;
}

async function run() {
  const env = loadEnv();
  const DB_HOST = env.DB_HOST || 'localhost';
  const DB_PORT = Number(env.DB_PORT) || 3306;
  const DB_USER = env.DB_USER || 'root';
  const DB_PASSWORD = env.DB_PASSWORD || '';
  const DB_NAME = env.DB_NAME || 'student_app';

  console.log(`Connecting to MySQL at ${DB_HOST}:${DB_PORT} as ${DB_USER}...`);

  // Create database if not exists
  const conn = await mysql.createConnection({ host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await conn.end();

  const pool = await mysql.createPool({
    host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD,
    database: DB_NAME, waitForConnections: true, connectionLimit: 10,
  });

  console.log('Creating tables...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id INT PRIMARY KEY AUTO_INCREMENT,
      studentId VARCHAR(255) UNIQUE,
      name VARCHAR(255), email VARCHAR(255), roll VARCHAR(255), branch VARCHAR(255),
      phone VARCHAR(20), dob DATE, address TEXT, city VARCHAR(100), state VARCHAR(100),
      cgpa DECIMAL(4,2), enrollmentYear INT, guardianPhone VARCHAR(20),
      gender VARCHAR(50), bloodGroup VARCHAR(10), category VARCHAR(50),
      semester INT, section VARCHAR(50), specialization VARCHAR(100), batch VARCHAR(50),
      backlogs INT DEFAULT 0, attendancePercentage DECIMAL(5,2),
      tenthPercentage DECIMAL(5,2), twelfthPercentage DECIMAL(5,2),
      hostelDayScholar VARCHAR(50), skills TEXT, interests TEXT,
      linkedinUrl VARCHAR(500), githubUrl VARCHAR(500),
      lookingForTeam BOOLEAN DEFAULT false, availability VARCHAR(50), domain VARCHAR(50),
      is_deleted BOOLEAN DEFAULT false, deleted_at DATETIME DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      student_id INT NOT NULL, entity_type VARCHAR(50) NOT NULL, entity_id INT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TIMESTAMP NULL DEFAULT NULL, reviewed_by INT NULL DEFAULT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      studentId INT NULL,
      username VARCHAR(100) NOT NULL UNIQUE, email VARCHAR(255) DEFAULT NULL,
      password VARCHAR(255) NOT NULL, tempPassword VARCHAR(255) DEFAULT NULL,
      isFirstLogin BOOLEAN NOT NULL DEFAULT false,
      role ENUM('ADMIN','CLUB_HEAD','CLUB_COORDINATOR','FEST_COORDINATOR','HACKATHON_LEAD') NOT NULL,
      entityType ENUM('CLUB','HACKATHON','FEST') NULL, entityId INT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id INT PRIMARY KEY,
      applicationName VARCHAR(150) DEFAULT 'Campus ERP',
      supportEmail VARCHAR(255) DEFAULT 'support@campus.local',
      statusMessage VARCHAR(255) DEFAULT 'All systems operational',
      maintenanceMode BOOLEAN DEFAULT false, securityPolicy TEXT,
      passwordAgeDays INT DEFAULT 90,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS clubs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL, description TEXT, facultyCoordinator VARCHAR(255),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS club_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      clubId INT NOT NULL, studentId INT NOT NULL,
      role ENUM('President','Vice President','Secretary','Treasurer','Coordinator','Member') NOT NULL,
      task VARCHAR(150) DEFAULT '', joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clubId) REFERENCES clubs(id) ON DELETE CASCADE,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hackathons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL, description TEXT, venue VARCHAR(200),
      startDate DATE, endDate DATE, registrationDeadline DATE,
      maxParticipants INT DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hackathon_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hackathonId INT NOT NULL, studentId INT NOT NULL,
      role ENUM('Lead','Coordinator','Volunteer','Participant') NOT NULL,
      task VARCHAR(150) DEFAULT '',
      FOREIGN KEY (hackathonId) REFERENCES hackathons(id) ON DELETE CASCADE,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS fests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL, description TEXT, venue VARCHAR(200),
      startDate DATE, endDate DATE, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS fest_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      festId INT NOT NULL, studentId INT NOT NULL,
      role ENUM('Overall Coordinator','Technical Lead','Cultural Lead','Marketing Lead','Volunteer') NOT NULL,
      task VARCHAR(150) DEFAULT '',
      FOREIGN KEY (festId) REFERENCES fests(id) ON DELETE CASCADE,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL, token VARCHAR(500) NOT NULL UNIQUE,
      expiresAt DATETIME NOT NULL, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('Tables created.');

  // Seed settings
  await pool.query(`
    INSERT INTO settings (id, applicationName, supportEmail, statusMessage, maintenanceMode, securityPolicy, passwordAgeDays)
    VALUES (1, 'Campus ERP', 'support@campus.local', 'All systems operational', false, 'Please follow the security policy and report suspicious activity to support.', 90)
    ON DUPLICATE KEY UPDATE id = id
  `);

  // Seed sample clubs
  const [clubRows] = await pool.query('SELECT COUNT(*) AS cnt FROM clubs');
  if (!clubRows[0].cnt) {
    await pool.query('INSERT INTO clubs (name, description, facultyCoordinator) VALUES ?', [[
      ['Tech Club', 'Campus technology club for workshops, hackathons, and tech talks.', 'Prof. Anand Rao'],
      ['Design Club', 'Creative design and event planning club.', 'Dr. Shreya Menon'],
      ['AI Club', 'Artificial intelligence learning and project community.', 'Dr. Vikram Singh'],
    ]]);
    console.log('Seeded 3 sample clubs.');
  }

  // Seed sample hackathons
  const [hackRows] = await pool.query('SELECT COUNT(*) AS cnt FROM hackathons');
  if (!hackRows[0].cnt) {
    await pool.query('INSERT INTO hackathons (name, description, venue, startDate, endDate, registrationDeadline) VALUES ?', [[
      ['HackSRM', 'Annual student hackathon for innovative projects.', 'Main Auditorium', '2025-09-15', '2025-09-17', '2025-09-05'],
      ['CodeSprint', '24-hour coding sprint with prizes for winners.', 'Computer Lab 4', '2025-11-10', '2025-11-11', '2025-10-28'],
    ]]);
    console.log('Seeded 2 sample hackathons.');
  }

  // Seed sample fests
  const [festRows] = await pool.query('SELECT COUNT(*) AS cnt FROM fests');
  if (!festRows[0].cnt) {
    await pool.query('INSERT INTO fests (name, description, venue, startDate, endDate) VALUES ?', [[
      ['Spring Fest', 'Annual cultural fest with performances and competitions.', 'College Grounds', '2025-03-20', '2025-03-22'],
      ['Tech Fest', 'Technical fest showcasing student innovation and workshops.', 'Engineering Block', '2025-04-10', '2025-04-12'],
    ]]);
    console.log('Seeded 2 sample fests.');
  }

  // Create admin user
  const [admins] = await pool.query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
  if (!admins.length) {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    await pool.query(
      'INSERT INTO users (username, email, password, role, isFirstLogin) VALUES (?, ?, ?, ?, ?)',
      ['admin', 'admin@campus.local', hashedPassword, 'ADMIN', true]
    );
    console.log('Admin user created: admin / Admin@123 (change password at first login)');
  }

  // Load seed.json for students if it exists
  const seedJsonPath = path.join(__dirname, 'seed.json');
  if (fs.existsSync(seedJsonPath)) {
    const students = JSON.parse(fs.readFileSync(seedJsonPath, 'utf8'));
    for (const s of students) {
      try {
        await pool.query(
          `INSERT INTO students (studentId,name,email,roll,branch,phone,dob,address,city,state,cgpa,enrollmentYear,guardianPhone)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
           ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email)`,
          [s.studentId, s.name, s.email, s.roll, s.branch, s.phone, s.dob || null, s.address, s.city, s.state, s.cgpa || null, s.enrollmentYear || null, s.guardianPhone]
        );
      } catch (err) {
        console.error('Student insert error:', err.message);
      }
    }
    console.log(`Seeded ${students.length} students.`);
  } else {
    console.log('No seed.json found in scripts/ — skipping student data.');
  }

  console.log('\nDone! Database is ready.');
  console.log('Run the app with: npm run dev');
  console.log('Login with: admin / Admin@123');
  await pool.end();
}

run().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
