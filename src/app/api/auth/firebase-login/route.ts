import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  addUser,
  findUserByEmail,
  findUserByUsername,
  type User,
} from "@/lib/dataStore";
import { createToken, getCookieOptions } from "@/lib/auth";
import { verifyFirebaseIdToken } from "@/lib/firebase/admin";

type Role = "patient" | "doctor" | "admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idToken, role, username, fullName, specialty } = body as {
      idToken?: string;
      role?: Role;
      username?: string;
      fullName?: string;
      specialty?: string;
    };

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "idToken is required" }, { status: 400 });
    }

    const decoded = await verifyFirebaseIdToken(idToken);

    const resolvedRole: Role = role && ["patient", "doctor", "admin"].includes(role) ? role : "patient";

    const email: string | undefined = decoded?.email;
    const uid: string = decoded?.uid;

    if (!uid) {
      return NextResponse.json({ error: "Invalid Firebase token (missing uid)" }, { status: 401 });
    }

    const resolvedUsername =
      username ||
      (email ? email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_") : `user_${uid.slice(0, 10)}`);

    const resolvedFullName = fullName || decoded?.name || email || resolvedUsername;

    const existing =
      findUserByUsername(resolvedUsername) ||
      (email ? findUserByEmail(email) : undefined);

    let user: User | undefined = existing;

    if (!user) {
      // Password is only needed because the app’s current backend expects a password hash in the local user store.
      // For Firebase users, we create a random password hash and rely on Firebase token exchange for login.
      const salt = await bcrypt.genSalt(12);
      const randomPassword = `firebase_${uid}_${Date.now()}`;
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      const newUser: User = {
        id: `firebase_${uid}`,
        username: resolvedUsername,
        email: email || `${resolvedUsername}@firebase.local`,
        password: hashedPassword,
        role: resolvedRole,
        fullName: resolvedFullName,
        specialty: resolvedRole === "doctor" ? specialty || "General Medicine" : undefined,
        createdAt: new Date().toISOString(),
      };

      addUser(newUser);
      user = findUserByUsername(resolvedUsername);
    }

    if (!user) {
      return NextResponse.json({ error: "User mapping failed" }, { status: 500 });
    }

    const sessionUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      specialty: user.specialty,
    };

    const token = await createToken(sessionUser);
    const cookieOpts = getCookieOptions();

    const response = NextResponse.json({
      message: "Firebase login successful",
      user: sessionUser,
    });

    response.cookies.set(cookieOpts.name, token, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: "Firebase login failed", detail: error?.message },
      { status: 401 },
    );
  }
}

