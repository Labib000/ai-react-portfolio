<?php

/*
|--------------------------------------------------------------------------
| AI Lab sample businesses
|--------------------------------------------------------------------------
|
| Made-up businesses for the /ai-lab demo. The assistant answers only from
| "knowledge", so every starter question should be answerable from it,
| except the last one, which deliberately isn't (it shows the assistant
| saying "I don't know" instead of guessing).
|
| icon:    car | clinic | school | restaurant | salon | building
| related: optional case study slug for a real project in the same field.
|
*/

return [
    [
        'slug' => 'car-rental',
        'name' => 'SwiftDrive Rentals',
        'kind' => 'Car rental',
        'icon' => 'car',
        'related' => 'cardiwan',
        'knowledge' => <<<'TEXT'
SwiftDrive Rentals is a car rental company in Dubai.

Opening hours: every day, 8 am to 10 pm. Free delivery and pickup anywhere in Dubai for rentals of 3 days or more; otherwise delivery costs AED 50.

Cars and daily prices:
Economy (Nissan Sunny or similar): AED 99 per day
SUV (Toyota Fortuner or similar): AED 249 per day
Luxury (Mercedes E-Class or similar): AED 599 per day
Sports (Porsche 911 or similar): AED 1,499 per day
Weekly rentals get 15% off; monthly rentals get 30% off.

Requirements: drivers must be 21 or older (25 or older for sports cars). Residents need a UAE driving licence and Emirates ID. Tourists need their passport, visa page and home licence plus an International Driving Permit.

Deposit: no deposit for economy and SUV cars. Luxury and sports cars need a refundable AED 2,000 deposit, returned within 14 days.

Included: comprehensive insurance, 250 km per day (extra km cost AED 1 each), and 24/7 roadside assistance.

Booking: book on the website or on WhatsApp. Free cancellation up to 24 hours before pickup.
TEXT,
        'starters' => [
            'Do I need to pay a deposit for an SUV?',
            'I am a tourist. What documents do I need?',
            'How much is a Porsche for a week?',
            'Can I pay in monthly instalments to buy the car?',
        ],
    ],
    [
        'slug' => 'clinic',
        'name' => 'CareWell Family Clinic',
        'kind' => 'Clinic',
        'icon' => 'clinic',
        'related' => null,
        'knowledge' => <<<'TEXT'
CareWell Family Clinic is a multispeciality clinic in Salt Lake, Kolkata.

Timings: Monday to Saturday, 9 am to 8 pm. Sunday, 10 am to 1 pm (general physician only). Closed on national holidays.

Departments and consultation fees:
General physician: Rs 500
Paediatrics: Rs 700
Dermatology: Rs 800
Gynaecology: Rs 800
Orthopaedics: Rs 900
Follow up visits within 7 days are free.

Appointments: book online, on WhatsApp or by phone. Walk in patients are welcome, but patients with appointments are seen first. Please arrive 10 minutes early and bring earlier prescriptions and reports.

Tests: blood tests at the clinic and ECG. Most blood reports are ready the same evening and are sent on WhatsApp. X-ray and ultrasound are done at a partner diagnostic centre next door.

Payments: cash, UPI and cards. Cashless insurance is not available yet; the clinic gives bills for reimbursement claims.

The clinic does not handle emergencies. For an emergency, go to the nearest hospital.
TEXT,
        'starters' => [
            'Is the clinic open on Sunday?',
            'How much does a dermatologist consultation cost?',
            'When will I get my blood test report?',
            'Do you do MRI scans?',
        ],
    ],
    [
        'slug' => 'coaching',
        'name' => 'CodePath Academy',
        'kind' => 'Coaching institute',
        'icon' => 'school',
        'related' => 'w3-techiez',
        'knowledge' => <<<'TEXT'
CodePath Academy is a coaching institute for students preparing for software jobs. Classes run online and at the Kolkata centre.

Courses:
Full Stack Web Development (MERN): 6 months, Rs 45,000
Data Structures and Algorithms: 3 months, Rs 18,000
Python and Data Analytics: 4 months, Rs 30,000
Fees can be paid in 3 instalments at no extra cost.

Batches: weekday batches run Monday to Friday, 7 pm to 9 pm. Weekend batches run Saturday and Sunday, 10 am to 1 pm. New batches start on the 1st of every month.

Every course includes live classes, recorded sessions, weekly mock tests, a final project and daily sessions to clear doubts.

Placement support: resume reviews, mock interviews and job referrals to partner companies for students who finish the course with at least 75% attendance. The academy does not guarantee a job.

Free demo class: every Saturday at 5 pm. Register on the website.

Refunds: a full refund is given if a student leaves within the first 7 days of the course.
TEXT,
        'starters' => [
            'Can I pay the MERN course fee in instalments?',
            'When do weekend classes happen?',
            'Do you guarantee a job after the course?',
            'Do you teach Flutter app development?',
        ],
    ],
    [
        'slug' => 'restaurant',
        'name' => 'The Spice Terrace',
        'kind' => 'Restaurant',
        'icon' => 'restaurant',
        'related' => null,
        'knowledge' => <<<'TEXT'
The Spice Terrace is a rooftop restaurant serving North Indian and Mughlai food.

Hours: lunch 12 pm to 3:30 pm, dinner 7 pm to 11:30 pm, every day. The kitchen closes 30 minutes before closing time.

Popular dishes: Butter Chicken (Rs 420), Mutton Biryani (Rs 480), Paneer Tikka (Rs 340), Dal Makhani (Rs 290) and Garlic Naan (Rs 90). Vegan and gluten free options are marked on the menu.

Table booking: book online or on WhatsApp. Tables are held for 15 minutes past the booking time. Groups of more than 10 should book at least a day ahead.

Private events: the terrace can be booked for birthdays and office parties of up to 60 guests, with set menus from Rs 1,200 per person.

Delivery: available through the restaurant's own website within 6 km, with free delivery on orders above Rs 800.

Parking: free valet parking in the evening.

Payments: cash, UPI and all major cards. A service charge is not added to the bill.
TEXT,
        'starters' => [
            'Can I book the terrace for a birthday party?',
            'Do you have vegan dishes?',
            'Is delivery free?',
            'Do you have live music on weekends?',
        ],
    ],
    [
        'slug' => 'salon',
        'name' => 'Glow Studio',
        'kind' => 'Salon',
        'icon' => 'salon',
        'related' => null,
        'knowledge' => <<<'TEXT'
Glow Studio is a unisex salon and spa.

Hours: Tuesday to Sunday, 10 am to 8 pm. Closed on Mondays.

Services and prices:
Haircut: Rs 400 (men), Rs 700 (women)
Hair colour: from Rs 1,800
Keratin treatment: from Rs 4,500
Facial: from Rs 1,200
Manicure and pedicure combo: Rs 1,100
Bridal makeup: from Rs 15,000 (includes a trial session)

Appointments: book online or on WhatsApp. Walk in clients are accepted when a stylist is free. Please cancel at least 2 hours before your appointment.

Offers: 20% off all services on Tuesdays and Wednesdays. Members get 10% off every visit; membership costs Rs 999 a year.

Products: the salon uses and sells L'Oréal Professionnel and Olaplex products.

Hygiene: tools are sterilised after every client, and disposable kits are used for manicures and pedicures.
TEXT,
        'starters' => [
            'Are you open on Monday?',
            'How much is bridal makeup?',
            'Is there any discount on weekdays?',
            'Do you offer home service?',
        ],
    ],
    [
        'slug' => 'real-estate',
        'name' => 'NestKey Realty',
        'kind' => 'Real estate',
        'icon' => 'building',
        'related' => null,
        'knowledge' => <<<'TEXT'
NestKey Realty is a real estate agency in New Town, Kolkata, helping people buy and rent homes.

Current listings:
2 BHK apartment, New Town Action Area 1: 1,050 sq ft, Rs 68 lakh, ready to move in
3 BHK apartment, Rajarhat: 1,450 sq ft, Rs 95 lakh, possession in March 2027
2 BHK for rent, Salt Lake Sector V: Rs 28,000 per month, partly furnished
1 BHK for rent, New Town: Rs 16,000 per month, fully furnished

Fees: buyers pay 1% of the property price as brokerage. Tenants pay one month's rent as brokerage. Owners who list with NestKey pay nothing to list.

Site visits: free, 7 days a week, from 10 am to 6 pm. Book a visit on WhatsApp or the website.

Home loans: NestKey works with partner banks and helps buyers with loan paperwork at no extra charge. Loan approval depends on the bank.

Documents for renting: ID proof, the last 3 months' salary slips or an employment letter, and a security deposit of two months' rent.
TEXT,
        'starters' => [
            'What 2 BHK flats do you have for sale?',
            'How much brokerage does a tenant pay?',
            'Can you help me with a home loan?',
            'Do you have any properties in Howrah?',
        ],
    ],
];
