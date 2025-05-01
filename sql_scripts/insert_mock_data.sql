-- SET timezone to 'Asia/Kolkata';
SET timezone to 'GMT';

INSERT INTO public."User"(user_id, email , name, desig, dept, phno,"dateOfJoining", "createdAt", "updatedAt") 
	VALUES 
	(123, 'email@email.com' , 'Dr.John Doe', 'Assistant Professor', 'CSE', 987654321,'2023-07-01', NOW(), NOW());

INSERT INTO public."LeaveBalance" (user_id, "dateOfJoining", casual, medical, "specialCasual", "extraOrdinary", earned, "onDutyExam", "onDutyOther", maternity, election, compensatory, "withoutPay", "createdAt", "updatedAt") 
	VALUES 
	(123, '2023-07-01', 5, 2, 1, 0, 3, 1, 1, 0, 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


INSERT INTO public."LeaveApproved"
("user_id", "appliedOn", "fromDate", "toDate", "totalDays", "leaveType", "dept", "createdAt", "updatedAt")
VALUES
-- Within last 1 month
('123', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', NOW(), 1, 'casual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '4 days',2 , 'medical', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '11 days', NOW() - INTERVAL '10 days', NOW()  - INTERVAL '8 days',2 , 'casual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '13 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days', 1,  'casual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '16 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '13 days', 2, 'specialCasual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '18 days', NOW() - INTERVAL '17 days', NOW() - INTERVAL '15 days', 2, 'casual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '21 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days', 1, 'casual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '23 days', NOW() - INTERVAL '22 days', NOW() - INTERVAL '21 days', 1, 'medical', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '27 days', NOW() - INTERVAL '26 days', NOW() - INTERVAL '25 days', 1, 'casual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 days', 1, 'casual', 'CSE', NOW(), NOW()),
-- Older than 1 month
('123', NOW() - INTERVAL '35 days', NOW() - INTERVAL '34 days', NOW() - INTERVAL '33 days',1 , 'casual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '41 days', NOW() - INTERVAL '40 days', NOW() - INTERVAL '39 days', 1, 'medical', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '46 days', NOW() - INTERVAL '45 days', NOW() - INTERVAL '43 days', 2, 'casual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '52 days', NOW() - INTERVAL '51 days', NOW() - INTERVAL '49 days', 2, 'specialCasual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '56 days', NOW() - INTERVAL '55 days', NOW() - INTERVAL '54 days', 1, 'casual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '61 days', NOW() - INTERVAL '60 days', NOW() - INTERVAL '58 days', 2, 'medical', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '66 days', NOW() - INTERVAL '65 days', NOW() - INTERVAL '63 days', 2, 'casual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '72 days', NOW() - INTERVAL '71 days', NOW() - INTERVAL '70 days', 1, 'casual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '85 days', NOW() - INTERVAL '84 days', NOW() - INTERVAL '83 days', 1, 'specialCasual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '95 days', NOW() - INTERVAL '94 days', NOW() - INTERVAL '93 days', 1, 'casual', 'CSE', NOW(), NOW());


INSERT INTO public."LeavePending"
("user_id", "appliedOn", "fromDate", "toDate", "leaveType", "dept", "createdAt", "updatedAt")
VALUES
-- Within last 1 month
('123', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days', 'casual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '7 days', 'medical', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days', NOW() - INTERVAL '10 days', 'casual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '12 days', 'casual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days', NOW() - INTERVAL '17 days', 'specialCasual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '25 days', NOW() - INTERVAL '24 days', NOW() - INTERVAL '22 days', 'casual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '28 days', NOW() - INTERVAL '27 days', NOW() - INTERVAL '26 days', 'casual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '29 days', NOW() - INTERVAL '28 days', NOW() - INTERVAL '27 days', 'medical', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '30 days', NOW() - INTERVAL '29 days', NOW() - INTERVAL '28 days', 'casual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '1 days', NOW(), NOW() + INTERVAL '1 days', 'casual', 'CSE', NOW(), NOW()),
-- Older than 1 month
('123', NOW() - INTERVAL '40 days', NOW() - INTERVAL '39 days', NOW() - INTERVAL '38 days', 'casual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '45 days', NOW() - INTERVAL '44 days', NOW() - INTERVAL '43 days', 'medical', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '50 days', NOW() - INTERVAL '49 days', NOW() - INTERVAL '47 days', 'casual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '55 days', NOW() - INTERVAL '54 days', NOW() - INTERVAL '52 days', 'specialCasual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '60 days', NOW() - INTERVAL '59 days', NOW() - INTERVAL '58 days', 'casual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '65 days', NOW() - INTERVAL '64 days', NOW() - INTERVAL '63 days', 'medical', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '70 days', NOW() - INTERVAL '69 days', NOW() - INTERVAL '68 days', 'casual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '75 days', NOW() - INTERVAL '74 days', NOW() - INTERVAL '72 days', 'casual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '80 days', NOW() - INTERVAL '79 days', NOW() - INTERVAL '78 days', 'specialCasual', 'CSE', NOW(), NOW()),
('123', NOW() - INTERVAL '90 days', NOW() - INTERVAL '89 days', NOW() - INTERVAL '88 days', 'casual', 'CSE', NOW(), NOW());

truncate table public."LeaveApproved";


select * from public."LeavePending";
select * from (select user_id, "leaveType", SUM("totalDays") as total_days from public."LeaveApproved" GROUP BY user_id, "leaveType"
) as ct 
	NATURAL JOIN
	(select user_id, name, dept from public."User") as ct2;

SELECT 
  id, user_id, "fromDate", "toDate", "appliedOn", "leaveType", dept, 'pending' AS status,
  "createdAt", "updatedAt"
FROM "LeavePending"
WHERE "fromDate" >= CURRENT_DATE - INTERVAL '1 month'
UNION ALL
SELECT 
  id, user_id, "fromDate", "toDate", "appliedOn", "leaveType", dept, 'approved' AS status,
  "createdAt", "updatedAt"
FROM "LeaveApproved"
WHERE "fromDate" >= CURRENT_DATE - INTERVAL '1 month'
ORDER BY "fromDate" DESC;

