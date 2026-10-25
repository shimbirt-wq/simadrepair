-- Staff skill tags and volunteer access expiry (ticket #10 / GitHub #16).
ALTER TABLE "users" ADD COLUMN "skills" TEXT[] DEFAULT ARRAY[]::TEXT[], ADD COLUMN "access_expires_on" DATE;
