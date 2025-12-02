import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Mock validation - accept any email/password for now
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Return mock user and token
        return NextResponse.json({
            user: {
                id: "user_1",
                email: email,
                name: "Test User",
            },
            token: "mock_jwt_token",
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Login failed" },
            { status: 500 }
        );
    }
}
