INSERT INTO Company (CompID, CompName, StartTime, EndTime, TimeZone, CompDesc)
VALUES ('Comp001', 'Saih Al Rawl Gas Company', '0800', '1600', 'GMT+4', 'A trusted Omani oil & gas supplier with 20+ years of experience delivering chemicals, equipment, and field services.');

INSERT INTO User (ID, CompID, Name, Type, Email, PhoneNo, PasswordHash, AdminRef)
VALUES ('EMP001', 'Comp001', 'John Doe Admin', 'Admin', 'john@test.com', '12345678', '$2b$10$uviR3CUvgJ7FldrAzUklJut5YdiGMnWG6paTj3qMBC87KUT2T/N/.', '');

INSERT INTO User (ID, CompID, Name, Type, Email, PhoneNo, PasswordHash, AdminRef)
VALUES ('EMP002', 'Comp001', 'John Doe Manager', 'SubAdmin', 'johnsub@test.com', '12345678', '$2b$10$uviR3CUvgJ7FldrAzUklJut5YdiGMnWG6paTj3qMBC87KUT2T/N/.', '');

INSERT INTO User (ID, CompID, Name, Type, Email, PhoneNo, PasswordHash, AdminRef)
VALUES ('EMP003', 'Comp001', 'John Doe Employee 1', 'User', 'johnuser1@test.com', '12345678', '$2b$10$uviR3CUvgJ7FldrAzUklJut5YdiGMnWG6paTj3qMBC87KUT2T/N/.', 'EMP002');

INSERT INTO User (ID, CompID, Name, Type, Email, PhoneNo, PasswordHash, AdminRef)
VALUES ('EMP004', 'Comp001', 'John Doe Employee 2', 'User', 'johnuse2r@test.com', '12345678', '$2b$10$uviR3CUvgJ7FldrAzUklJut5YdiGMnWG6paTj3qMBC87KUT2T/N/.', 'EMP002');

INSERT INTO Company (CompID, CompName, StartTime, EndTime, TimeZone, CompDesc)
VALUES ('Comp002', 'Sun Logistics Oman', '0800', '1600', 'GMT+4', 'A logistics operator with over 10 years of experience delivering efficient container transport and freight solutions across Oman');

INSERT INTO User (ID, CompID, Name, Type, Email, PhoneNo, PasswordHash, AdminRef)
VALUES ('EMP005', 'Comp002', 'John Doe Sun', 'Admin', 'johnsun@test.com', '12345678', '$2b$10$uviR3CUvgJ7FldrAzUklJut5YdiGMnWG6paTj3qMBC87KUT2T/N/.', '');

INSERT INTO Company (CompID, CompName, StartTime, EndTime, TimeZone, CompDesc)
VALUES ('Comp003', 'Evergreen Line', '0800', '1600', 'GMT+4', 'A global shipping carries with a fleet moving millions of containers');

INSERT INTO User (ID, CompID, Name, Type, Email, PhoneNo, PasswordHash, AdminRef)
VALUES ('EMP006', 'Comp003', 'John Doe Evergreen', 'Admin', 'johnevergreen@test.com', '12345678', '$2b$10$uviR3CUvgJ7FldrAzUklJut5YdiGMnWG6paTj3qMBC87KUT2T/N/.', '');