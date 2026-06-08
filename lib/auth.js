import CredentialsProvider from "next-auth/providers/credentials";
import crypto from "crypto";

const loginAttempts = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  if (entry.lockedUntil > now) return true;
  if (entry.count >= 10) {
    loginAttempts.set(ip, { count: 0, lockedUntil: now + 15 * 60 * 1000 });
    return true;
  }
  return false;
}

function recordFailedAttempt(ip) {
  const entry = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  loginAttempts.set(ip, { count: entry.count + 1, lockedUntil: entry.lockedUntil });
}

function clearAttempts(ip) {
  loginAttempts.delete(ip);
}

function safeCompare(a, b) {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const ip =
          req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
          req?.headers?.["x-real-ip"] ||
          "unknown";

        if (isRateLimited(ip)) {
          throw new Error("Demasiados intentos. Espera 15 minutos.");
        }

        const email    = (credentials?.email    || "").trim().toLowerCase();
        const password = (credentials?.password || "").trim();

        if (!email || !password) {
          recordFailedAttempt(ip);
          return null;
        }

        const rawUsers = process.env.AUTH_USERS || "";
        const allowedUsers = rawUsers
          .split(",")
          .map(u => u.trim())
          .filter(Boolean)
          .map(entry => {
            const colonIdx = entry.indexOf(":");
            if (colonIdx === -1) return null;
            return {
              email: entry.slice(0, colonIdx).trim().toLowerCase(),
              password: entry.slice(colonIdx + 1).trim(),
            };
          })
          .filter(Boolean);

        if (allowedUsers.length === 0) {
          const adminEmail    = (process.env.ADMIN_EMAIL || "yoshualeisorek17@gmail.com").toLowerCase();
          const adminPassword = process.env.ADMIN_PASSWORD || "";
          if (!adminPassword) {
            console.error("ADMIN_PASSWORD not set -- login disabled for security.");
            recordFailedAttempt(ip);
            return null;
          }
          allowedUsers.push({ email: adminEmail, password: adminPassword });
        }

        const matched = allowedUsers.find(u => {
          const emailMatch    = safeCompare(email.padEnd(256), u.email.padEnd(256));
          const passwordMatch = safeCompare(password.padEnd(256), u.password.padEnd(256));
          return emailMatch && passwordMatch;
        });

        if (!matched) {
          recordFailedAttempt(ip);
          return null;
        }

        clearAttempts(ip);
        return {
          id: matched.email,
          email: matched.email,
          name: matched.email.split("@")[0],
        };
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
    signUp: "/sign-up",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id    = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id    = token.id;
      session.user.email = token.email;
      return session;
    },
  },
};
