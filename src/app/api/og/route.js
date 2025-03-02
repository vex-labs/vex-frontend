import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Get the title from the search params or use a default
    const title = searchParams.get("title") || "betVEX";

    // Load the background image
    const backgroundImageData = await fetch(
      new URL("/icons/Vex_Background.png", request.url)
    ).then((res) => res.arrayBuffer());

    // Load the logo
    const logoData = await fetch(
      new URL("/icons/NewPrimaryLogo.svg", request.url)
    ).then((res) => res.arrayBuffer());

    const backgroundImage = `data:image/png;base64,${Buffer.from(
      backgroundImageData
    ).toString("base64")}`;
    const logo = `data:image/svg+xml;base64,${Buffer.from(logoData).toString(
      "base64"
    )}`;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Background image */}
          <img
            src={backgroundImage}
            alt="Background"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {/* Semi-transparent overlay for better text readability */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              zIndex: 1,
            }}
          />

          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 40,
              zIndex: 2,
              width: "300px", // Adjust size as needed for your logo
              height: "120px",
            }}
          >
            <img
              src={logo}
              alt="betVEX Logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </div>

          {/* Title */}
          <div
            style={{
              display: "flex",
              fontSize: 50,
              fontWeight: "bold",
              color: "white",
              textAlign: "center",
              padding: "0 50px",
              maxWidth: "80%",
              zIndex: 2,
            }}
          >
            {title}
          </div>

          {/* Tagline */}
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#E5E7EB",
              marginTop: 20,
              textAlign: "center",
              zIndex: 2,
            }}
          >
            Community Powered Esports Betting
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error(e);
    return new Response(`Failed to generate OG image: ${e.message}`, {
      status: 500,
    });
  }
}
