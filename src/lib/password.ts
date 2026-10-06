import crypto from "node:crypto";
export function hashPassword(password:string){const salt=crypto.randomBytes(16).toString("hex");const derived=crypto.scryptSync(password,salt,64).toString("hex");return `${salt}:${derived}`;}
export function verifyPassword(password:string,stored:string){const [salt,expected]=stored.split(":");if(!salt||!expected)return false;const actual=crypto.scryptSync(password,salt,64).toString("hex");return crypto.timingSafeEqual(Buffer.from(actual,"hex"),Buffer.from(expected,"hex"));}
