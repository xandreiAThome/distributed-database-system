-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "dim_users" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"first_name" varchar(40) NOT NULL,
	"last_name" varchar(40) NOT NULL,
	"city" varchar(50) NOT NULL,
	"country" varchar(100) NOT NULL,
	"zipcode" varchar(20) NOT NULL,
	"gender" varchar(6) NOT NULL
);

*/