import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, agencyName, email, password } = body;

    // Basic validation
    if (!name || !agencyName || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user (PgBouncer transaction mode doesn't support interactive transactions)
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "OWNER",
      },
    });

    // Generate a unique slug for the agency
    const baseSlug = slugify(agencyName);
    let slug = baseSlug;
    let attempt = 0;
    while (await db.agency.findUnique({ where: { slug } })) {
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    // Create agency + link user as OWNER
    await db.agency.create({
      data: {
        name: agencyName,
        slug,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Account created successfully.", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("[SIGNUP_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
