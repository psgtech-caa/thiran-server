const pool = require('../config/database');

async function seedData() {
  try {
    console.log('🌱 Seeding database with sample data...');

    const events = [
      {
        name: 'Code Marathon',
        description: '24-hour coding competition to solve real-world problems',
        event_type: 'team',
        max_team_size: 3,
        min_team_size: 2,
        registration_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        venue: 'Computer Lab 301',
        max_participants: 60,
        event_category: 'Technical',
        rules: 'Bring your own laptop. Internet will be provided.',
        prize_details: '1st Prize: ₹10,000, 2nd Prize: ₹5,000',
        contact_person: 'Dr. Rajesh Kumar',
        contact_email: 'rajesh@psgtech.ac.in'
      },
      {
        name: 'Paper Presentation',
        description: 'Present your research paper on emerging technologies',
        event_type: 'individual',
        max_team_size: null,
        min_team_size: null,
        registration_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        venue: 'Seminar Hall A',
        max_participants: 50,
        event_category: 'Technical',
        rules: 'Paper must be original work. 15 minutes presentation time.',
        prize_details: '1st Prize: ₹5,000, 2nd Prize: ₹3,000',
        contact_person: 'Prof. Anitha S',
        contact_email: 'anitha@psgtech.ac.in'
      },
      {
        name: 'Web Design Competition',
        description: 'Design and develop a responsive website',
        event_type: 'team',
        max_team_size: 2,
        min_team_size: 2,
        registration_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        venue: 'Computer Lab 201',
        max_participants: 40,
        event_category: 'Technical',
        rules: 'Use any framework. Must be responsive.',
        prize_details: '1st Prize: ₹8,000, 2nd Prize: ₹4,000',
        contact_person: 'Dr. Priya M',
        contact_email: 'priya@psgtech.ac.in'
      },
      {
        name: 'Quiz Competition',
        description: 'Test your knowledge on technology and current affairs',
        event_type: 'individual',
        max_team_size: null,
        min_team_size: null,
        registration_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        venue: 'Auditorium',
        max_participants: 100,
        event_category: 'Non-Technical',
        rules: 'No electronic devices allowed',
        prize_details: '1st Prize: ₹3,000, 2nd Prize: ₹2,000',
        contact_person: 'Prof. Suresh R',
        contact_email: 'suresh@psgtech.ac.in'
      },
      {
        name: 'Gaming Tournament - BGMI',
        description: 'Battle royale gaming competition',
        event_type: 'team',
        max_team_size: 4,
        min_team_size: 4,
        registration_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        venue: 'Gaming Arena',
        max_participants: 80,
        event_category: 'Gaming',
        rules: 'Team must use same IGN. Fair play policy strictly enforced.',
        prize_details: '1st Prize: ₹15,000, 2nd Prize: ₹8,000',
        contact_person: 'Mr. Karthik V',
        contact_email: 'karthik@psgtech.ac.in'
      },
    ];

    for (const event of events) {
      await pool.query(
        `INSERT INTO events (name, description, event_type, max_team_size, min_team_size,
         registration_deadline, event_date, venue, max_participants, event_category,
         rules, prize_details, contact_person, contact_email)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (name) DO NOTHING`,
        [
          event.name, event.description, event.event_type, event.max_team_size,
          event.min_team_size, event.registration_deadline, event.event_date,
          event.venue, event.max_participants, event.event_category, event.rules,
          event.prize_details, event.contact_person, event.contact_email
        ]
      );
    }

    console.log('✅ Database seeded successfully!');
    console.log(`📊 Inserted ${events.length} sample events`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedData();
