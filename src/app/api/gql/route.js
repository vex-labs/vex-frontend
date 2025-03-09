import { request } from "graphql-request";

export async function POST(req) {
  try {
    const url = process.env.QUERY_URL;

    if (!url) {
      return new Response("No URL defined", { status: 500 });
    }

    const { gql } = await req.json();

    if (!gql) {
      return new Response("No GQL query defined", { status: 500 });
    }

    const res = await request(url, gql);

    return new Response(JSON.stringify(res), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify(error), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
